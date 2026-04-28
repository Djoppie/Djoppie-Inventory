using DjoppieInventory.Core.DTOs;
using DjoppieInventory.Core.Entities;
using DjoppieInventory.Core.Entities.Enums;
using DjoppieInventory.Core.Interfaces;
using DjoppieInventory.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Graph.Models;

namespace DjoppieInventory.Infrastructure.Services;

/// <summary>
/// Service implementation for synchronizing organization structure from Microsoft Entra ID.
/// Syncs MG-SECTOR-* groups as sectors and MG-* groups as services.
/// </summary>
public class OrganizationSyncService : IOrganizationSyncService
{
    private readonly ApplicationDbContext _context;
    private readonly IGraphUserService _graphUserService;
    private readonly ILogger<OrganizationSyncService> _logger;

    public OrganizationSyncService(
        ApplicationDbContext context,
        IGraphUserService graphUserService,
        ILogger<OrganizationSyncService> logger)
    {
        _context = context ?? throw new ArgumentNullException(nameof(context));
        _graphUserService = graphUserService ?? throw new ArgumentNullException(nameof(graphUserService));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    /// <inheritdoc/>
    public async Task<OrganizationSyncResultDto> SyncOrganizationAsync(CancellationToken cancellationToken = default)
    {
        var result = new OrganizationSyncResultDto
        {
            StartedAt = DateTime.UtcNow
        };

        try
        {
            _logger.LogInformation("Starting full organization sync from Entra ID");

            // Sync sectors first (they need to exist before services can be linked)
            await SyncSectorsInternalAsync(result, cancellationToken);

            // Then sync services
            await SyncServicesInternalAsync(result, cancellationToken);

            // Link services to sectors based on Entra group membership
            await LinkServicesToSectorsAsync(result, cancellationToken);

            // Link any AssetRequests that now have a matching Employee
            var linkedRequests = await LinkPendingAssetRequestsAsync(cancellationToken);
            if (linkedRequests > 0)
            {
                _logger.LogInformation("Auto-linked {Count} pending AssetRequests after sync", linkedRequests);
            }

            result.Success = result.Errors.Count == 0;
            result.CompletedAt = DateTime.UtcNow;

            _logger.LogInformation(
                "Organization sync completed: {SectorsCreated} sectors created, {SectorsUpdated} updated, " +
                "{ServicesCreated} services created, {ServicesUpdated} updated, {TotalMembers} total members",
                result.SectorsCreated, result.SectorsUpdated,
                result.ServicesCreated, result.ServicesUpdated,
                result.TotalMemberCount);

            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during organization sync");
            result.Errors.Add($"Sync failed: {ex.Message}");
            result.Success = false;
            result.CompletedAt = DateTime.UtcNow;
            return result;
        }
    }

    /// <inheritdoc/>
    public async Task<OrganizationSyncResultDto> SyncSectorsAsync(CancellationToken cancellationToken = default)
    {
        var result = new OrganizationSyncResultDto
        {
            StartedAt = DateTime.UtcNow
        };

        try
        {
            _logger.LogInformation("Starting sector sync from Entra ID");
            await SyncSectorsInternalAsync(result, cancellationToken);
            result.Success = result.Errors.Count == 0;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during sector sync");
            result.Errors.Add($"Sector sync failed: {ex.Message}");
            result.Success = false;
        }

        result.CompletedAt = DateTime.UtcNow;
        return result;
    }

    /// <inheritdoc/>
    public async Task<OrganizationSyncResultDto> SyncServicesAsync(CancellationToken cancellationToken = default)
    {
        var result = new OrganizationSyncResultDto
        {
            StartedAt = DateTime.UtcNow
        };

        try
        {
            _logger.LogInformation("Starting service sync from Entra ID");
            await SyncServicesInternalAsync(result, cancellationToken);
            result.Success = result.Errors.Count == 0;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during service sync");
            result.Errors.Add($"Service sync failed: {ex.Message}");
            result.Success = false;
        }

        result.CompletedAt = DateTime.UtcNow;
        return result;
    }

    /// <inheritdoc/>
    public async Task<OrganizationSyncStatusDto> GetSyncStatusAsync(CancellationToken cancellationToken = default)
    {
        var sectors = await _context.Sectors
            .AsNoTracking()
            .OrderBy(s => s.SortOrder)
            .ThenBy(s => s.Name)
            .ToListAsync(cancellationToken);

        var services = await _context.Services
            .AsNoTracking()
            .OrderBy(s => s.SortOrder)
            .ThenBy(s => s.Name)
            .ToListAsync(cancellationToken);

        return new OrganizationSyncStatusDto
        {
            LastSectorSyncAt = sectors
                .Where(s => s.EntraLastSyncAt.HasValue)
                .Max(s => s.EntraLastSyncAt),
            LastServiceSyncAt = services
                .Where(s => s.EntraLastSyncAt.HasValue)
                .Max(s => s.EntraLastSyncAt),
            TotalSectors = sectors.Count,
            SyncedSectors = sectors.Count(s => s.EntraSyncStatus == EntraSyncStatus.Success),
            FailedSectors = sectors.Count(s => s.EntraSyncStatus == EntraSyncStatus.Failed),
            TotalServices = services.Count,
            SyncedServices = services.Count(s => s.EntraSyncStatus == EntraSyncStatus.Success),
            FailedServices = services.Count(s => s.EntraSyncStatus == EntraSyncStatus.Failed),
            Sectors = sectors.Select(s => new EntitySyncStatusDto
            {
                Id = s.Id,
                Code = s.Code,
                Name = s.Name,
                EntraGroupId = s.EntraGroupId,
                EntraSyncEnabled = s.EntraSyncEnabled,
                SyncStatus = s.EntraSyncStatus,
                LastSyncAt = s.EntraLastSyncAt,
                SyncError = s.EntraSyncError
            }).ToList(),
            Services = services.Select(s => new EntitySyncStatusDto
            {
                Id = s.Id,
                Code = s.Code,
                Name = s.Name,
                EntraGroupId = s.EntraGroupId,
                EntraSyncEnabled = s.EntraSyncEnabled,
                SyncStatus = s.EntraSyncStatus,
                LastSyncAt = s.EntraLastSyncAt,
                SyncError = s.EntraSyncError,
                MemberCount = s.MemberCount
            }).ToList()
        };
    }

    /// <inheritdoc/>
    public async Task<OrganizationHierarchyDto> GetHierarchyAsync(bool includeInactive = false, CancellationToken cancellationToken = default)
    {
        var sectorsQuery = _context.Sectors
            .Include(s => s.Services)
                .ThenInclude(svc => svc.Building)
            .AsNoTracking();

        if (!includeInactive)
        {
            sectorsQuery = sectorsQuery.Where(s => s.IsActive);
        }

        var sectors = await sectorsQuery
            .OrderBy(s => s.SortOrder)
            .ThenBy(s => s.Name)
            .ToListAsync(cancellationToken);

        var servicesQuery = _context.Services
            .Include(s => s.Building)
            .AsNoTracking();

        if (!includeInactive)
        {
            servicesQuery = servicesQuery.Where(s => s.IsActive);
        }

        var unassignedServices = await servicesQuery
            .Where(s => s.SectorId == null)
            .OrderBy(s => s.SortOrder)
            .ThenBy(s => s.Name)
            .ToListAsync(cancellationToken);

        var hierarchy = new OrganizationHierarchyDto
        {
            Sectors = sectors.Select(s => new SectorHierarchyDto
            {
                Id = s.Id,
                Code = s.Code,
                Name = s.Name,
                IsActive = s.IsActive,
                EntraGroupId = s.EntraGroupId,
                ManagerDisplayName = s.ManagerDisplayName,
                ManagerEmail = s.ManagerEmail,
                Services = s.Services
                    .Where(svc => includeInactive || svc.IsActive)
                    .OrderBy(svc => svc.SortOrder)
                    .ThenBy(svc => svc.Name)
                    .Select(svc => MapServiceToHierarchyDto(svc, s.Name))
                    .ToList()
            }).ToList(),
            UnassignedServices = unassignedServices
                .Select(s => MapServiceToHierarchyDto(s, null))
                .ToList()
        };

        hierarchy.TotalSectors = hierarchy.Sectors.Count;
        hierarchy.TotalServices = hierarchy.Sectors.Sum(s => s.Services.Count) + hierarchy.UnassignedServices.Count;
        hierarchy.TotalMemberCount = hierarchy.Sectors.Sum(s => s.TotalMemberCount) +
                                      hierarchy.UnassignedServices.Sum(s => s.MemberCount);

        return hierarchy;
    }

    /// <inheritdoc/>
    public async Task<int> RefreshServiceMemberCountAsync(int serviceId, CancellationToken cancellationToken = default)
    {
        var service = await _context.Services.FindAsync(new object[] { serviceId }, cancellationToken);

        if (service == null)
        {
            throw new InvalidOperationException($"Service with ID {serviceId} not found");
        }

        if (string.IsNullOrEmpty(service.EntraGroupId))
        {
            _logger.LogWarning("Service {ServiceId} has no Entra group linked", serviceId);
            return service.MemberCount;
        }

        try
        {
            var members = await _graphUserService.GetGroupMembersAsync(service.EntraGroupId);
            service.MemberCount = members.Count();
            service.EntraLastSyncAt = DateTime.UtcNow;
            service.EntraSyncStatus = EntraSyncStatus.Success;
            service.EntraSyncError = null;
            service.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("Refreshed member count for service {ServiceName}: {MemberCount}",
                service.Name, service.MemberCount);

            return service.MemberCount;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to refresh member count for service {ServiceId}", serviceId);

            service.EntraSyncStatus = EntraSyncStatus.Failed;
            service.EntraSyncError = ex.Message;
            service.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync(cancellationToken);

            throw;
        }
    }

    /// <inheritdoc/>
    public async Task LinkServiceToEntraGroupAsync(int serviceId, string entraGroupId, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(entraGroupId))
        {
            throw new ArgumentException("Entra group ID cannot be null or empty", nameof(entraGroupId));
        }

        var service = await _context.Services.FindAsync(new object[] { serviceId }, cancellationToken);

        if (service == null)
        {
            throw new InvalidOperationException($"Service with ID {serviceId} not found");
        }

        service.EntraGroupId = entraGroupId;
        service.EntraSyncEnabled = true;
        service.EntraSyncStatus = EntraSyncStatus.None;
        service.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Linked service {ServiceName} to Entra group {GroupId}", service.Name, entraGroupId);
    }

    /// <inheritdoc/>
    public async Task LinkSectorToEntraGroupAsync(int sectorId, string entraGroupId, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(entraGroupId))
        {
            throw new ArgumentException("Entra group ID cannot be null or empty", nameof(entraGroupId));
        }

        var sector = await _context.Sectors.FindAsync(new object[] { sectorId }, cancellationToken);

        if (sector == null)
        {
            throw new InvalidOperationException($"Sector with ID {sectorId} not found");
        }

        sector.EntraGroupId = entraGroupId;
        sector.EntraSyncEnabled = true;
        sector.EntraSyncStatus = EntraSyncStatus.None;
        sector.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Linked sector {SectorName} to Entra group {GroupId}", sector.Name, entraGroupId);
    }

    /// <inheritdoc/>
    public async Task<EmployeeSyncResultDto> SyncEmployeesAsync(CancellationToken cancellationToken = default)
    {
        var result = new EmployeeSyncResultDto(0, 0, 0, 0, 0, new List<string>());
        var totalProcessed = 0;
        var created = 0;
        var updated = 0;
        var skipped = 0;
        var failed = 0;
        var errors = new List<string>();

        try
        {
            _logger.LogInformation("Starting employee sync from Entra ID service groups");

            // Get all services with Entra group links
            var services = await _context.Services
                .Where(s => !string.IsNullOrEmpty(s.EntraGroupId) && s.IsActive)
                .ToListAsync(cancellationToken);

            _logger.LogInformation("Found {ServiceCount} services with Entra group links", services.Count);

            // Track processed Entra IDs to avoid duplicates across services
            var processedEntraIds = new HashSet<string>();

            foreach (var service in services)
            {
                try
                {
                    var members = await _graphUserService.GetGroupMembersAsync(service.EntraGroupId!, 500);

                    foreach (var user in members)
                    {
                        if (string.IsNullOrEmpty(user.Id))
                        {
                            skipped++;
                            continue;
                        }

                        // Skip if already processed in another service group
                        if (processedEntraIds.Contains(user.Id))
                        {
                            continue;
                        }
                        processedEntraIds.Add(user.Id);

                        totalProcessed++;

                        try
                        {
                            // Check if employee exists
                            var existingEmployee = await _context.Employees
                                .FirstOrDefaultAsync(e => e.EntraId == user.Id, cancellationToken);

                            if (existingEmployee != null)
                            {
                                // Update existing employee
                                existingEmployee.UserPrincipalName = user.UserPrincipalName ?? existingEmployee.UserPrincipalName;
                                existingEmployee.DisplayName = user.DisplayName ?? existingEmployee.DisplayName;
                                existingEmployee.Email = user.Mail ?? existingEmployee.Email;
                                existingEmployee.Department = user.Department ?? existingEmployee.Department;
                                existingEmployee.JobTitle = user.JobTitle ?? existingEmployee.JobTitle;
                                existingEmployee.OfficeLocation = user.OfficeLocation ?? existingEmployee.OfficeLocation;
                                existingEmployee.MobilePhone = user.MobilePhone ?? existingEmployee.MobilePhone;
                                existingEmployee.CompanyName = user.CompanyName ?? existingEmployee.CompanyName;
                                existingEmployee.ServiceId = service.Id;
                                existingEmployee.IsActive = true;
                                existingEmployee.EntraLastSyncAt = DateTime.UtcNow;
                                existingEmployee.EntraSyncStatus = EntraSyncStatus.Success;
                                existingEmployee.EntraSyncError = null;
                                existingEmployee.UpdatedAt = DateTime.UtcNow;

                                updated++;
                            }
                            else
                            {
                                // Create new employee
                                var employee = new Employee
                                {
                                    EntraId = user.Id,
                                    UserPrincipalName = user.UserPrincipalName ?? string.Empty,
                                    DisplayName = user.DisplayName ?? "Unknown",
                                    Email = user.Mail,
                                    Department = user.Department,
                                    JobTitle = user.JobTitle,
                                    OfficeLocation = user.OfficeLocation,
                                    MobilePhone = user.MobilePhone,
                                    CompanyName = user.CompanyName,
                                    ServiceId = service.Id,
                                    IsActive = true,
                                    SortOrder = 0,
                                    EntraLastSyncAt = DateTime.UtcNow,
                                    EntraSyncStatus = EntraSyncStatus.Success,
                                    CreatedAt = DateTime.UtcNow
                                };

                                _context.Employees.Add(employee);
                                created++;
                            }
                        }
                        catch (Exception ex)
                        {
                            _logger.LogWarning(ex, "Failed to sync employee {DisplayName} ({EntraId})",
                                user.DisplayName, user.Id);
                            failed++;
                            errors.Add($"Failed to sync {user.DisplayName}: {ex.Message}");
                        }
                    }

                    // Update service sync status
                    service.EntraLastSyncAt = DateTime.UtcNow;
                    service.EntraSyncStatus = EntraSyncStatus.Success;
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to get members for service {ServiceName} (group: {GroupId})",
                        service.Name, service.EntraGroupId);
                    errors.Add($"Failed to sync service '{service.Name}': {ex.Message}");
                }
            }

            await _context.SaveChangesAsync(cancellationToken);

            _logger.LogInformation(
                "Employee sync completed: {TotalProcessed} processed, {Created} created, {Updated} updated, {Skipped} skipped, {Failed} failed",
                totalProcessed, created, updated, skipped, failed);

            return new EmployeeSyncResultDto(totalProcessed, created, updated, skipped, failed, errors);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during employee sync");
            errors.Add($"Sync failed: {ex.Message}");
            return new EmployeeSyncResultDto(totalProcessed, created, updated, skipped, failed + 1, errors);
        }
    }

    #region Private Methods

    private async Task SyncSectorsInternalAsync(OrganizationSyncResultDto result, CancellationToken cancellationToken)
    {
        var entraGroups = await _graphUserService.GetSectorGroupsAsync();
        var existingSectors = await _context.Sectors.ToListAsync(cancellationToken);

        foreach (var group in entraGroups)
        {
            try
            {
                var code = ExtractCodeFromGroupName(group.DisplayName ?? string.Empty, "MG-SECTOR-");
                var existingSector = existingSectors.FirstOrDefault(s =>
                    s.EntraGroupId == group.Id ||
                    s.Code.Equals(code, StringComparison.OrdinalIgnoreCase));

                if (existingSector != null)
                {
                    // Update existing sector
                    existingSector.EntraGroupId = group.Id;
                    existingSector.EntraMailNickname = group.MailNickname;
                    existingSector.EntraSyncEnabled = true;
                    existingSector.EntraSyncStatus = EntraSyncStatus.Success;
                    existingSector.EntraLastSyncAt = DateTime.UtcNow;
                    existingSector.EntraSyncError = null;
                    existingSector.UpdatedAt = DateTime.UtcNow;

                    // Update name if it looks auto-generated
                    if (string.IsNullOrEmpty(existingSector.Name) || existingSector.Name == existingSector.Code)
                    {
                        existingSector.Name = FormatDisplayName(code);
                    }

                    result.SectorsUpdated++;
                }
                else
                {
                    // Create new sector
                    var sector = new Sector
                    {
                        Code = code,
                        Name = FormatDisplayName(code),
                        EntraGroupId = group.Id,
                        EntraMailNickname = group.MailNickname,
                        EntraSyncEnabled = true,
                        EntraSyncStatus = EntraSyncStatus.Success,
                        EntraLastSyncAt = DateTime.UtcNow,
                        IsActive = true,
                        SortOrder = result.SectorsCreated,
                        CreatedAt = DateTime.UtcNow
                    };

                    _context.Sectors.Add(sector);
                    result.SectorsCreated++;
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to sync sector group {GroupName}", group.DisplayName);
                result.Warnings.Add($"Failed to sync sector '{group.DisplayName}': {ex.Message}");
            }
        }

        await _context.SaveChangesAsync(cancellationToken);
    }

    private async Task SyncServicesInternalAsync(OrganizationSyncResultDto result, CancellationToken cancellationToken)
    {
        var entraGroups = await _graphUserService.GetServiceGroupsAsync();
        var existingServices = await _context.Services.ToListAsync(cancellationToken);

        foreach (var group in entraGroups)
        {
            try
            {
                var code = ExtractCodeFromGroupName(group.DisplayName ?? string.Empty, "MG-");
                var existingService = existingServices.FirstOrDefault(s =>
                    s.EntraGroupId == group.Id ||
                    s.Code.Equals(code, StringComparison.OrdinalIgnoreCase));

                // Get member count
                var members = await _graphUserService.GetGroupMembersAsync(group.Id ?? string.Empty);
                var memberCount = members.Count();
                result.TotalMemberCount += memberCount;

                if (existingService != null)
                {
                    // Update existing service
                    existingService.EntraGroupId = group.Id;
                    existingService.EntraMailNickname = group.MailNickname;
                    existingService.EntraSyncEnabled = true;
                    existingService.EntraSyncStatus = EntraSyncStatus.Success;
                    existingService.EntraLastSyncAt = DateTime.UtcNow;
                    existingService.EntraSyncError = null;
                    existingService.MemberCount = memberCount;
                    existingService.UpdatedAt = DateTime.UtcNow;

                    // Update name if it looks auto-generated
                    if (string.IsNullOrEmpty(existingService.Name) || existingService.Name == existingService.Code)
                    {
                        existingService.Name = FormatDisplayName(code);
                    }

                    result.ServicesUpdated++;
                }
                else
                {
                    // Create new service
                    var service = new Service
                    {
                        Code = code,
                        Name = FormatDisplayName(code),
                        EntraGroupId = group.Id,
                        EntraMailNickname = group.MailNickname,
                        EntraSyncEnabled = true,
                        EntraSyncStatus = EntraSyncStatus.Success,
                        EntraLastSyncAt = DateTime.UtcNow,
                        MemberCount = memberCount,
                        IsActive = true,
                        SortOrder = result.ServicesCreated,
                        CreatedAt = DateTime.UtcNow
                    };

                    _context.Services.Add(service);
                    result.ServicesCreated++;
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to sync service group {GroupName}", group.DisplayName);
                result.Warnings.Add($"Failed to sync service '{group.DisplayName}': {ex.Message}");
            }
        }

        await _context.SaveChangesAsync(cancellationToken);
    }

    private async Task LinkServicesToSectorsAsync(OrganizationSyncResultDto result, CancellationToken cancellationToken)
    {
        var sectors = await _context.Sectors
            .Where(s => !string.IsNullOrEmpty(s.EntraGroupId))
            .ToListAsync(cancellationToken);

        var services = await _context.Services.ToListAsync(cancellationToken);

        foreach (var sector in sectors)
        {
            try
            {
                // Get service groups that are members of this sector
                var sectorServiceGroups = await _graphUserService.GetSectorServiceGroupsAsync(sector.EntraGroupId!);

                foreach (var serviceGroup in sectorServiceGroups)
                {
                    var service = services.FirstOrDefault(s => s.EntraGroupId == serviceGroup.Id);
                    if (service != null && service.SectorId != sector.Id)
                    {
                        service.SectorId = sector.Id;
                        service.UpdatedAt = DateTime.UtcNow;
                        result.ServicesLinkedToSectors++;
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to link services to sector {SectorName}", sector.Name);
                result.Warnings.Add($"Failed to link services to sector '{sector.Name}': {ex.Message}");
            }
        }

        await _context.SaveChangesAsync(cancellationToken);
    }

    private static string ExtractCodeFromGroupName(string groupName, string prefix)
    {
        if (groupName.StartsWith(prefix, StringComparison.OrdinalIgnoreCase))
        {
            return groupName.Substring(prefix.Length);
        }
        return groupName;
    }

    private static string FormatDisplayName(string code)
    {
        // Convert "some-service-name" to "Some Service Name"
        return string.Join(" ", code
            .Replace("-", " ")
            .Replace("_", " ")
            .Split(' ', StringSplitOptions.RemoveEmptyEntries)
            .Select(word => char.ToUpper(word[0]) + word.Substring(1).ToLower()));
    }

    private static ServiceHierarchyDto MapServiceToHierarchyDto(Service service, string? sectorName)
    {
        return new ServiceHierarchyDto
        {
            Id = service.Id,
            Code = service.Code,
            Name = service.Name,
            IsActive = service.IsActive,
            SectorId = service.SectorId,
            SectorName = sectorName,
            EntraGroupId = service.EntraGroupId,
            MemberCount = service.MemberCount,
            BuildingId = service.BuildingId,
            BuildingName = service.Building?.Name,
            ManagerDisplayName = service.ManagerDisplayName,
            ManagerEmail = service.ManagerEmail,
            LastSyncAt = service.EntraLastSyncAt
        };
    }

    #endregion

    public async Task<int> LinkPendingAssetRequestsAsync(CancellationToken cancellationToken = default)
    {
        var pending = await _context.AssetRequests
            .Where(r => r.EmployeeId == null && r.Status != AssetRequestStatus.Cancelled)
            .ToListAsync(cancellationToken);

        if (pending.Count == 0) return 0;

        var employees = await _context.Employees
            .Where(e => e.IsActive)
            .ToListAsync(cancellationToken);

        int linked = 0;

        foreach (var request in pending)
        {
            var key = (request.RequestedFor ?? string.Empty).Trim();
            if (string.IsNullOrEmpty(key)) continue;

            Employee? match = null;

            if (key.Contains('@'))
            {
                var matches = employees.Where(e =>
                    string.Equals(e.UserPrincipalName, key, StringComparison.OrdinalIgnoreCase) ||
                    string.Equals(e.Email, key, StringComparison.OrdinalIgnoreCase)).ToList();
                if (matches.Count == 1) match = matches[0];
            }
            else
            {
                var matches = employees.Where(e =>
                    string.Equals(e.DisplayName?.Trim(), key, StringComparison.OrdinalIgnoreCase)).ToList();
                if (matches.Count == 1) match = matches[0];
            }

            if (match != null)
            {
                request.EmployeeId = match.Id;
                request.ModifiedAt = DateTime.UtcNow;
                request.ModifiedBy = "system:auto-link";
                linked++;
                _logger.LogInformation(
                    "Auto-linked AssetRequest {RequestId} to Employee {EmployeeId} ({DisplayName})",
                    request.Id, match.Id, match.DisplayName);
            }
        }

        if (linked > 0)
        {
            await _context.SaveChangesAsync(cancellationToken);
        }

        return linked;
    }
}

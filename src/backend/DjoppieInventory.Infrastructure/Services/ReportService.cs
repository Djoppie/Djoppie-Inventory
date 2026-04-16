using DjoppieInventory.Core.DTOs;
using DjoppieInventory.Core.Entities;
using DjoppieInventory.Core.Entities.Enums;
using DjoppieInventory.Core.Interfaces;
using DjoppieInventory.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System.Text;

namespace DjoppieInventory.Infrastructure.Services;

/// <summary>
/// Service for generating reports and analytics.
/// Implements complex LINQ queries and report generation logic.
/// </summary>
public class ReportService : IReportService
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<ReportService> _logger;

    public ReportService(
        ApplicationDbContext context,
        ILogger<ReportService> logger)
    {
        _context = context;
        _logger = logger;
    }

    // ===== HARDWARE REPORTS =====

    public async Task<HardwareReportResult> GetHardwareInventoryReportAsync(
        AssetStatus? status = null,
        int? assetTypeId = null,
        int? categoryId = null,
        string? searchTerm = null,
        CancellationToken cancellationToken = default)
    {
        var query = _context.Assets
            .Include(a => a.AssetType)
            .Include(a => a.Service)
            .Include(a => a.Building)
            .Include(a => a.Employee)
                .ThenInclude(e => e!.CurrentWorkplace)
            .Include(a => a.PhysicalWorkplace)
                .ThenInclude(pw => pw!.Building)
            .Include(a => a.PhysicalWorkplace)
                .ThenInclude(pw => pw!.Service)
                    .ThenInclude(s => s!.Sector)
            .AsNoTracking();

        // Apply filters
        if (status.HasValue)
            query = query.Where(a => a.Status == status.Value);

        if (assetTypeId.HasValue)
            query = query.Where(a => a.AssetTypeId == assetTypeId.Value);

        // Note: Asset doesn't have CategoryId, only Category string
        // categoryId filter not applicable in this codebase

        if (!string.IsNullOrEmpty(searchTerm))
        {
            var searchLower = searchTerm.ToLower();
            query = query.Where(a =>
                a.AssetCode.ToLower().Contains(searchLower) ||
                (a.AssetName != null && a.AssetName.ToLower().Contains(searchLower)) ||
                (a.SerialNumber != null && a.SerialNumber.ToLower().Contains(searchLower)) ||
                (a.Owner != null && a.Owner.ToLower().Contains(searchLower)));
        }

        var assets = await query.OrderBy(a => a.AssetCode).ToListAsync(cancellationToken);

        // Calculate statistics
        var totalAssets = assets.Count;
        var assetsByStatus = assets.GroupBy(a => a.Status).ToDictionary(g => g.Key, g => g.Count());
        var assetsByType = assets
            .Where(a => a.AssetType != null)
            .GroupBy(a => a.AssetType!.Name)
            .ToDictionary(g => g.Key, g => g.Count());

        // Map to DTOs
        var assetDtos = assets.Select(a => new AssetDto
        {
            Id = a.Id,
            AssetCode = a.AssetCode,
            AssetName = a.AssetName ?? "",
            Alias = a.Alias,
            Category = a.Category,
            Owner = a.Owner,
            Status = a.Status.ToString(),
            Brand = a.Brand,
            Model = a.Model,
            SerialNumber = a.SerialNumber,
            PurchaseDate = a.PurchaseDate,
            WarrantyExpiry = a.WarrantyExpiry,
            InstallationDate = a.InstallationDate,
            AssetTypeId = a.AssetTypeId,
            AssetType = a.AssetType != null ? new AssetTypeInfo { Id = a.AssetType.Id, Name = a.AssetType.Name } : null,
            ServiceId = a.ServiceId,
            Service = a.Service != null ? new ServiceInfo { Id = a.Service.Id, Name = a.Service.Name } : null,
            BuildingId = a.BuildingId,
            Building = a.Building != null ? new BuildingInfo { Id = a.Building.Id, Name = a.Building.Name } : null,
            PhysicalWorkplaceId = a.PhysicalWorkplaceId,
            PhysicalWorkplace = a.PhysicalWorkplace != null ? new PhysicalWorkplaceInfo
            {
                Id = a.PhysicalWorkplace.Id,
                Code = a.PhysicalWorkplace.Code,
                Name = a.PhysicalWorkplace.Name,
                ServiceName = a.PhysicalWorkplace.Service?.Name,
                BuildingName = a.PhysicalWorkplace.Building?.Name,
                SectorName = a.PhysicalWorkplace.Service?.Sector?.Name,
                CurrentOccupantName = a.PhysicalWorkplace.CurrentOccupantName,
                Floor = a.PhysicalWorkplace.Floor
            } : null,
            EmployeeId = a.EmployeeId,
            Employee = a.Employee != null ? new EmployeeInfoDto(
                a.Employee.Id,
                a.Employee.EntraId,
                a.Employee.DisplayName,
                a.Employee.Email,
                a.Employee.JobTitle,
                a.Employee.ServiceId,
                a.Employee.Service?.Name,
                a.Employee.CurrentWorkplace?.Id,
                a.Employee.CurrentWorkplace?.Code
            ) : null,
            CreatedAt = a.CreatedAt,
            UpdatedAt = a.UpdatedAt
        }).ToList();

        _logger.LogInformation("Generated hardware inventory report with {Count} assets", totalAssets);

        return new HardwareReportResult(totalAssets, assetsByStatus, assetsByType, assetDtos);
    }

    public async Task<byte[]> ExportHardwareInventoryCsvAsync(
        AssetStatus? status = null,
        int? assetTypeId = null,
        int? categoryId = null,
        CancellationToken cancellationToken = default)
    {
        var report = await GetHardwareInventoryReportAsync(status, assetTypeId, categoryId, null, cancellationToken);

        var csv = new StringBuilder();
        csv.AppendLine("Asset Code,Name,Type,Category,Status,Brand,Model,Serial Number,Owner,Service,Building,Workplace,Workplace Service,Workplace Building,Purchase Date,Warranty Expiry");

        foreach (var asset in report.Assets)
        {
            csv.AppendLine($"\"{asset.AssetCode}\",\"{asset.AssetName}\",\"{asset.AssetType?.Name}\",\"{asset.Category}\",\"{asset.Status}\",\"{asset.Brand}\",\"{asset.Model}\",\"{asset.SerialNumber}\",\"{asset.Owner}\",\"{asset.Service?.Name}\",\"{asset.Building?.Name}\",\"{asset.PhysicalWorkplace?.Name}\",\"{asset.PhysicalWorkplace?.ServiceName}\",\"{asset.PhysicalWorkplace?.BuildingName}\",\"{asset.PurchaseDate:yyyy-MM-dd}\",\"{asset.WarrantyExpiry:yyyy-MM-dd}\"");
        }

        return Encoding.UTF8.GetBytes(csv.ToString());
    }

    // ===== WORKPLACE REPORTS =====

    public async Task<WorkplaceOccupancyReport> GetWorkplaceOccupancyReportAsync(
        int? buildingId = null,
        int? serviceId = null,
        CancellationToken cancellationToken = default)
    {
        var query = _context.PhysicalWorkplaces
            .Include(pw => pw.Building)
            .Include(pw => pw.Service)
            .Include(pw => pw.FixedAssets)
            .AsNoTracking();

        if (buildingId.HasValue)
            query = query.Where(pw => pw.BuildingId == buildingId.Value);

        if (serviceId.HasValue)
            query = query.Where(pw => pw.ServiceId == serviceId.Value);

        var workplaces = await query.ToListAsync(cancellationToken);

        var totalWorkplaces = workplaces.Count;
        var occupiedWorkplaces = workplaces.Count(w => !string.IsNullOrEmpty(w.CurrentOccupantEmail));
        var availableWorkplaces = workplaces.Count(w => string.IsNullOrEmpty(w.CurrentOccupantEmail) && w.IsActive);
        var occupancyRate = totalWorkplaces > 0 ? (double)occupiedWorkplaces / totalWorkplaces * 100 : 0;

        var workplaceDtos = workplaces.Select(w => new WorkplaceOccupancyDto(
            w.Id,
            w.Code,
            w.Building?.Name,
            w.Service?.Name,
            w.CurrentOccupantName,
            w.CurrentOccupantEmail,
            w.IsActive,
            w.FixedAssets?.Count ?? 0
        )).ToList();

        return new WorkplaceOccupancyReport(
            totalWorkplaces,
            occupiedWorkplaces,
            availableWorkplaces,
            Math.Round(occupancyRate, 2),
            workplaceDtos
        );
    }

    public async Task<WorkplaceEquipmentReport> GetWorkplaceEquipmentReportAsync(
        CancellationToken cancellationToken = default)
    {
        var workplaces = await _context.PhysicalWorkplaces.ToListAsync(cancellationToken);

        var totalWorkplaces = workplaces.Count;
        var workplacesWithDocking = workplaces.Count(w => w.DockingStationAssetId.HasValue);
        var workplacesWithMonitors = workplaces.Count(w => w.Monitor1AssetId.HasValue || w.Monitor2AssetId.HasValue || w.Monitor3AssetId.HasValue);

        var equipmentCounts = new Dictionary<string, int>
        {
            ["DockingStations"] = workplacesWithDocking,
            ["Monitors"] = workplacesWithMonitors,
            ["Keyboards"] = workplaces.Count(w => w.KeyboardAssetId.HasValue),
            ["Mice"] = workplaces.Count(w => w.MouseAssetId.HasValue)
        };

        return new WorkplaceEquipmentReport(
            totalWorkplaces,
            workplacesWithDocking,
            workplacesWithMonitors,
            equipmentCounts
        );
    }

    public async Task<byte[]> ExportWorkplacesCsvAsync(
        int? buildingId = null,
        int? serviceId = null,
        CancellationToken cancellationToken = default)
    {
        var report = await GetWorkplaceOccupancyReportAsync(buildingId, serviceId, cancellationToken);

        var csv = new StringBuilder();
        csv.AppendLine("Workplace Code,Building,Service,Occupant Name,Occupant Email,Is Active,Fixed Assets Count");

        foreach (var workplace in report.Workplaces)
        {
            csv.AppendLine($"\"{workplace.Code}\",\"{workplace.BuildingName}\",\"{workplace.ServiceName}\",\"{workplace.OccupantName}\",\"{workplace.OccupantEmail}\",\"{workplace.IsActive}\",\"{workplace.FixedAssetCount}\"");
        }

        return Encoding.UTF8.GetBytes(csv.ToString());
    }

    // ===== SWAP/MOVEMENT REPORTS =====

    public async Task<AssetSwapHistoryReport> GetAssetSwapHistoryAsync(
        DateTime? fromDate = null,
        DateTime? toDate = null,
        int? assetId = null,
        CancellationToken cancellationToken = default)
    {
        var query = _context.AssetEvents
            .Include(e => e.Asset)
            .Where(e => e.EventType == AssetEventType.LaptopSwapped || e.EventType == AssetEventType.OwnerChanged)
            .AsNoTracking();

        if (fromDate.HasValue)
            query = query.Where(e => e.EventDate >= fromDate.Value);

        if (toDate.HasValue)
            query = query.Where(e => e.EventDate <= toDate.Value);

        if (assetId.HasValue)
            query = query.Where(e => e.AssetId == assetId.Value);

        var events = await query.OrderByDescending(e => e.EventDate).ToListAsync(cancellationToken);

        var swapDtos = events.Select(e => new AssetSwapDto(
            e.Id,
            e.EventDate,
            e.AssetId,
            e.Asset?.AssetCode ?? "",
            e.OldValue, // Previous owner stored in OldValue
            e.NewValue, // New owner
            e.Notes
        )).ToList();

        return new AssetSwapHistoryReport(swapDtos.Count, swapDtos);
    }

    public async Task<IEnumerable<AssetEventDto>> GetAssetEventsAsync(
        int? assetId = null,
        string? eventType = null,
        DateTime? fromDate = null,
        DateTime? toDate = null,
        CancellationToken cancellationToken = default)
    {
        var query = _context.AssetEvents
            .Include(e => e.Asset)
            .AsNoTracking();

        if (assetId.HasValue)
            query = query.Where(e => e.AssetId == assetId.Value);

        if (!string.IsNullOrEmpty(eventType))
        {
            // Try to parse event type string to enum
            if (Enum.TryParse<AssetEventType>(eventType, true, out var eventTypeEnum))
            {
                query = query.Where(e => e.EventType == eventTypeEnum);
            }
        }

        if (fromDate.HasValue)
            query = query.Where(e => e.EventDate >= fromDate.Value);

        if (toDate.HasValue)
            query = query.Where(e => e.EventDate <= toDate.Value);

        var events = await query.OrderByDescending(e => e.EventDate).ToListAsync(cancellationToken);

        return events.Select(e => new AssetEventDto(
            e.Id,
            e.AssetId,
            e.EventType.ToString(),
            e.Description,
            e.Notes,
            e.OldValue,
            e.NewValue,
            e.PerformedBy,
            e.PerformedByEmail,
            e.EventDate
        ));
    }

    // ===== ROLLOUT REPORTS =====

    public async Task<RolloutSessionSummaryReport> GetRolloutSessionSummaryAsync(
        int sessionId,
        CancellationToken cancellationToken = default)
    {
        var session = await _context.RolloutSessions
            .Include(s => s.Days)
                .ThenInclude(d => d.Workplaces)
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.Id == sessionId, cancellationToken);

        if (session == null)
            throw new InvalidOperationException($"Rollout session with ID {sessionId} not found");

        var allWorkplaces = session.Days?.SelectMany(d => d.Workplaces ?? Enumerable.Empty<RolloutWorkplace>()).ToList() ?? new List<RolloutWorkplace>();
        var totalWorkplaces = allWorkplaces.Count;
        var completedWorkplaces = allWorkplaces.Count(w => w.Status == RolloutWorkplaceStatus.Completed);
        var pendingWorkplaces = allWorkplaces.Count(w => w.Status != RolloutWorkplaceStatus.Completed);
        var completionRate = totalWorkplaces > 0 ? (double)completedWorkplaces / totalWorkplaces * 100 : 0;

        var daySummaries = session.Days?.Select(d => new RolloutDaySummary(
            d.Id,
            d.Date,
            d.Workplaces?.Count ?? 0,
            d.Workplaces?.Count(w => w.Status == RolloutWorkplaceStatus.Completed) ?? 0,
            0 // Assets deployed - would need additional calculation
        )).ToList() ?? new List<RolloutDaySummary>();

        return new RolloutSessionSummaryReport(
            session.Id,
            session.SessionName,
            session.Days?.Count ?? 0,
            totalWorkplaces,
            completedWorkplaces,
            pendingWorkplaces,
            Math.Round(completionRate, 2),
            daySummaries
        );
    }

    public async Task<RolloutDayDetailReport> GetRolloutDayDetailAsync(
        int dayId,
        CancellationToken cancellationToken = default)
    {
        var day = await _context.RolloutDays
            .Include(d => d.Workplaces)
                .ThenInclude(w => w.PhysicalWorkplace)
            .AsNoTracking()
            .FirstOrDefaultAsync(d => d.Id == dayId, cancellationToken);

        if (day == null)
            throw new InvalidOperationException($"Rollout day with ID {dayId} not found");

        // Get session name by querying separately
        var session = await _context.RolloutSessions
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.Id == day.RolloutSessionId, cancellationToken);

        var totalWorkplaces = day.Workplaces?.Count ?? 0;
        var completedWorkplaces = day.Workplaces?.Count(w => w.Status == RolloutWorkplaceStatus.Completed) ?? 0;

        var workplaceDetails = day.Workplaces?.Select(w => new RolloutWorkplaceDetail(
            w.PhysicalWorkplaceId ?? 0,
            w.PhysicalWorkplace?.Code ?? w.Location ?? "",
            w.PhysicalWorkplace?.CurrentOccupantName ?? w.UserName,
            w.Status.ToString(),
            0, // Assets scheduled - would need calculation from AssetPlansJson or WorkplaceAssetAssignments
            0  // Assets installed - would need calculation from completion data
        )).ToList() ?? new List<RolloutWorkplaceDetail>();

        return new RolloutDayDetailReport(
            day.Id,
            day.Date,
            session?.SessionName ?? "",
            totalWorkplaces,
            completedWorkplaces,
            workplaceDetails
        );
    }

    public async Task<IEnumerable<Asset>> GetUnscheduledRolloutAssetsAsync(
        int sessionId,
        CancellationToken cancellationToken = default)
    {
        // Get all assets with status "Nieuw" that are not yet assigned to any workplace in this session
        var session = await _context.RolloutSessions
            .Include(s => s.Days)
                .ThenInclude(d => d.Workplaces)
            .FirstOrDefaultAsync(s => s.Id == sessionId, cancellationToken);

        if (session == null)
            throw new InvalidOperationException($"Rollout session with ID {sessionId} not found");

        // Get all assets scheduled in this session (would need to parse AssetPlansJson or check WorkplaceAssetAssignments)
        // For now, return all "Nieuw" assets
        return await _context.Assets
            .Where(a => a.Status == AssetStatus.Nieuw)
            .Include(a => a.AssetType)
            .AsNoTracking()
            .ToListAsync(cancellationToken);
    }

    public async Task<SerialNumberTrackingReport> GetSerialNumberTrackingReportAsync(
        int sessionId,
        CancellationToken cancellationToken = default)
    {
        var session = await _context.RolloutSessions
            .Include(s => s.Days)
                .ThenInclude(d => d.Workplaces)
                    .ThenInclude(w => w.PhysicalWorkplace)
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.Id == sessionId, cancellationToken);

        if (session == null)
            throw new InvalidOperationException($"Rollout session with ID {sessionId} not found");

        var assignments = new List<SerialNumberAssignment>();
        var totalAssignments = 0;
        var assignmentsWithSerials = 0;

        // TODO: This would need to parse AssetPlansJson and WorkplaceAssetAssignments to get actual data
        // For now, return empty structure

        var assignmentsMissingSerials = totalAssignments - assignmentsWithSerials;
        var completionRate = totalAssignments > 0 ? (double)assignmentsWithSerials / totalAssignments * 100 : 0;

        return new SerialNumberTrackingReport(
            sessionId,
            totalAssignments,
            assignmentsWithSerials,
            assignmentsMissingSerials,
            Math.Round(completionRate, 2),
            assignments
        );
    }
}

using DjoppieInventory.Core.DTOs.PhysicalWorkplace;
using DjoppieInventory.Core.Entities;
using DjoppieInventory.Core.Entities.Enums;
using DjoppieInventory.Core.Interfaces;
using DjoppieInventory.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace DjoppieInventory.Infrastructure.Services;

/// <summary>
/// Service for managing physical workplace locations.
/// Implements business logic for workplace CRUD operations and occupant management.
/// </summary>
public class PhysicalWorkplaceService : IPhysicalWorkplaceService
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<PhysicalWorkplaceService> _logger;

    public PhysicalWorkplaceService(
        ApplicationDbContext context,
        ILogger<PhysicalWorkplaceService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<IEnumerable<PhysicalWorkplaceDto>> GetAllAsync(
        int? buildingId = null,
        int? serviceId = null,
        bool? isActive = null,
        bool? hasOccupant = null,
        CancellationToken cancellationToken = default)
    {
        var query = _context.PhysicalWorkplaces
            .Include(pw => pw.Building)
            .Include(pw => pw.Service)
            .Include(pw => pw.FixedAssets)
            .Include(pw => pw.DockingStationAsset)
            .Include(pw => pw.Monitor1Asset)
            .Include(pw => pw.Monitor2Asset)
            .Include(pw => pw.Monitor3Asset)
            .Include(pw => pw.KeyboardAsset)
            .Include(pw => pw.MouseAsset)
            .AsQueryable();

        if (buildingId.HasValue)
            query = query.Where(pw => pw.BuildingId == buildingId.Value);

        if (serviceId.HasValue)
            query = query.Where(pw => pw.ServiceId == serviceId.Value);

        if (isActive.HasValue)
            query = query.Where(pw => pw.IsActive == isActive.Value);

        if (hasOccupant.HasValue)
        {
            if (hasOccupant.Value)
                query = query.Where(pw => !string.IsNullOrEmpty(pw.CurrentOccupantEmail));
            else
                query = query.Where(pw => string.IsNullOrEmpty(pw.CurrentOccupantEmail));
        }

        var workplaces = await query.ToListAsync(cancellationToken);

        // Get occupant device information for all occupied workplaces
        var occupantEmails = workplaces
            .Where(pw => !string.IsNullOrEmpty(pw.CurrentOccupantEmail))
            .Select(pw => pw.CurrentOccupantEmail!.ToLower())
            .Distinct()
            .ToList();

        var occupantDevices = new Dictionary<string, Asset>();
        if (occupantEmails.Any())
        {
            occupantDevices = await _context.Assets
                .Where(a => occupantEmails.Contains(a.Owner!.ToLower()) && a.Status == AssetStatus.InGebruik)
                .ToDictionaryAsync(
                    a => a.Owner!.ToLower(),
                    a => a,
                    cancellationToken);
        }

        return workplaces.Select(pw =>
        {
            // Get occupant's device if applicable
            Asset? occupantDevice = null;
            if (!string.IsNullOrEmpty(pw.CurrentOccupantEmail))
            {
                occupantDevices.TryGetValue(pw.CurrentOccupantEmail.ToLower(), out occupantDevice);
            }

            return new PhysicalWorkplaceDto(
                pw.Id,
                pw.Code,
                pw.Name,
                pw.Description,
                pw.BuildingId,
                pw.Building?.Name,
                pw.Building?.Code,
                pw.ServiceId,
                pw.Service?.Name,
                pw.Floor,
                pw.Room,
                pw.Type,
                pw.MonitorCount,
                pw.HasDockingStation,
                pw.DockingStationAssetId,
                pw.DockingStationAsset?.AssetCode,
                pw.DockingStationAsset?.SerialNumber,
                pw.Monitor1AssetId,
                pw.Monitor1Asset?.AssetCode,
                pw.Monitor1Asset?.SerialNumber,
                pw.Monitor2AssetId,
                pw.Monitor2Asset?.AssetCode,
                pw.Monitor2Asset?.SerialNumber,
                pw.Monitor3AssetId,
                pw.Monitor3Asset?.AssetCode,
                pw.Monitor3Asset?.SerialNumber,
                pw.KeyboardAssetId,
                pw.KeyboardAsset?.AssetCode,
                pw.KeyboardAsset?.SerialNumber,
                pw.MouseAssetId,
                pw.MouseAsset?.AssetCode,
                pw.MouseAsset?.SerialNumber,
                pw.CurrentOccupantEntraId,
                pw.CurrentOccupantName,
                pw.CurrentOccupantEmail,
                pw.OccupiedSince,
                occupantDevice?.SerialNumber,
                occupantDevice?.Brand,
                occupantDevice?.Model,
                occupantDevice?.AssetCode,
                pw.IsActive,
                pw.FixedAssets?.Count ?? 0,
                pw.CreatedAt,
                pw.UpdatedAt
            );
        });
    }

    public async Task<PhysicalWorkplace?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        return await _context.PhysicalWorkplaces
            .Include(pw => pw.Building)
            .Include(pw => pw.Service)
            .Include(pw => pw.FixedAssets)
            .Include(pw => pw.DockingStationAsset)
            .Include(pw => pw.Monitor1Asset)
            .Include(pw => pw.Monitor2Asset)
            .Include(pw => pw.Monitor3Asset)
            .Include(pw => pw.KeyboardAsset)
            .Include(pw => pw.MouseAsset)
            .FirstOrDefaultAsync(pw => pw.Id == id, cancellationToken);
    }

    public async Task<PhysicalWorkplaceDto?> GetDtoByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        var workplace = await GetByIdAsync(id, cancellationToken);
        if (workplace == null)
            return null;

        // Get occupant's device if applicable
        Asset? occupantDevice = null;
        if (!string.IsNullOrEmpty(workplace.CurrentOccupantEmail))
        {
            occupantDevice = await _context.Assets
                .FirstOrDefaultAsync(
                    a => a.Owner!.ToLower() == workplace.CurrentOccupantEmail.ToLower() &&
                         a.Status == AssetStatus.InGebruik,
                    cancellationToken);
        }

        return new PhysicalWorkplaceDto(
            workplace.Id,
            workplace.Code,
            workplace.Name,
            workplace.Description,
            workplace.BuildingId,
            workplace.Building?.Name,
            workplace.Building?.Code,
            workplace.ServiceId,
            workplace.Service?.Name,
            workplace.Floor,
            workplace.Room,
            workplace.Type,
            workplace.MonitorCount,
            workplace.HasDockingStation,
            workplace.DockingStationAssetId,
            workplace.DockingStationAsset?.AssetCode,
            workplace.DockingStationAsset?.SerialNumber,
            workplace.Monitor1AssetId,
            workplace.Monitor1Asset?.AssetCode,
            workplace.Monitor1Asset?.SerialNumber,
            workplace.Monitor2AssetId,
            workplace.Monitor2Asset?.AssetCode,
            workplace.Monitor2Asset?.SerialNumber,
            workplace.Monitor3AssetId,
            workplace.Monitor3Asset?.AssetCode,
            workplace.Monitor3Asset?.SerialNumber,
            workplace.KeyboardAssetId,
            workplace.KeyboardAsset?.AssetCode,
            workplace.KeyboardAsset?.SerialNumber,
            workplace.MouseAssetId,
            workplace.MouseAsset?.AssetCode,
            workplace.MouseAsset?.SerialNumber,
            workplace.CurrentOccupantEntraId,
            workplace.CurrentOccupantName,
            workplace.CurrentOccupantEmail,
            workplace.OccupiedSince,
            occupantDevice?.SerialNumber,
            occupantDevice?.Brand,
            occupantDevice?.Model,
            occupantDevice?.AssetCode,
            workplace.IsActive,
            workplace.FixedAssets?.Count ?? 0,
            workplace.CreatedAt,
            workplace.UpdatedAt
        );
    }

    public async Task<PhysicalWorkplace> CreateAsync(
        CreatePhysicalWorkplaceDto dto,
        CancellationToken cancellationToken = default)
    {
        // Validate building exists
        var building = await _context.Buildings.FindAsync(new object[] { dto.BuildingId }, cancellationToken);
        if (building == null)
            throw new InvalidOperationException($"Building with ID {dto.BuildingId} not found");

        // Validate service if provided
        if (dto.ServiceId.HasValue)
        {
            var service = await _context.Services.FindAsync(new object[] { dto.ServiceId.Value }, cancellationToken);
            if (service == null)
                throw new InvalidOperationException($"Service with ID {dto.ServiceId.Value} not found");
        }

        // Check for duplicate code
        var codeExists = await CodeExistsAsync(dto.Code, null, cancellationToken);
        if (codeExists)
            throw new InvalidOperationException($"Workplace code '{dto.Code}' already exists");

        var workplace = new PhysicalWorkplace
        {
            Code = dto.Code.ToUpperInvariant(),
            Name = dto.Name,
            Description = dto.Description,
            BuildingId = dto.BuildingId,
            ServiceId = dto.ServiceId,
            Floor = dto.Floor,
            Room = dto.Room,
            Type = dto.Type,
            MonitorCount = dto.MonitorCount,
            HasDockingStation = dto.HasDockingStation,
            IsActive = true
        };

        _context.PhysicalWorkplaces.Add(workplace);
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Created workplace {Code} with ID {Id}", workplace.Code, workplace.Id);

        // Reload with includes
        return (await GetByIdAsync(workplace.Id, cancellationToken))!;
    }

    public async Task<PhysicalWorkplace> UpdateAsync(
        int id,
        UpdatePhysicalWorkplaceDto dto,
        CancellationToken cancellationToken = default)
    {
        var workplace = await GetByIdAsync(id, cancellationToken);
        if (workplace == null)
            throw new InvalidOperationException($"Workplace with ID {id} not found");

        // Validate building if changed
        if (dto.BuildingId.HasValue && dto.BuildingId != workplace.BuildingId)
        {
            var building = await _context.Buildings.FindAsync(new object[] { dto.BuildingId.Value }, cancellationToken);
            if (building == null)
                throw new InvalidOperationException($"Building with ID {dto.BuildingId.Value} not found");
            workplace.BuildingId = dto.BuildingId.Value;
        }

        // Validate service if changed
        if (dto.ServiceId.HasValue && dto.ServiceId != workplace.ServiceId)
        {
            var service = await _context.Services.FindAsync(new object[] { dto.ServiceId.Value }, cancellationToken);
            if (service == null)
                throw new InvalidOperationException($"Service with ID {dto.ServiceId.Value} not found");
            workplace.ServiceId = dto.ServiceId;
        }

        // Update fields
        if (dto.Name != null)
            workplace.Name = dto.Name;
        if (dto.Description != null)
            workplace.Description = dto.Description;
        if (dto.Floor != null)
            workplace.Floor = dto.Floor;
        if (dto.Room != null)
            workplace.Room = dto.Room;
        if (dto.Type.HasValue)
            workplace.Type = dto.Type.Value;
        if (dto.MonitorCount.HasValue)
            workplace.MonitorCount = dto.MonitorCount.Value;
        if (dto.HasDockingStation.HasValue)
            workplace.HasDockingStation = dto.HasDockingStation.Value;
        if (dto.IsActive.HasValue)
            workplace.IsActive = dto.IsActive.Value;

        workplace.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Updated workplace {Code} (ID: {Id})", workplace.Code, workplace.Id);

        return workplace;
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken cancellationToken = default)
    {
        var workplace = await _context.PhysicalWorkplaces.FindAsync(new object[] { id }, cancellationToken);
        if (workplace == null)
            return false;

        // Soft delete
        workplace.IsActive = false;
        workplace.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Soft deleted workplace {Code} (ID: {Id})", workplace.Code, workplace.Id);

        return true;
    }

    public async Task<PhysicalWorkplace> UpdateOccupantAsync(
        int id,
        UpdateOccupantDto dto,
        CancellationToken cancellationToken = default)
    {
        var workplace = await GetByIdAsync(id, cancellationToken);
        if (workplace == null)
            throw new InvalidOperationException($"Workplace with ID {id} not found");

        workplace.CurrentOccupantEntraId = dto.OccupantEntraId;
        workplace.CurrentOccupantName = dto.OccupantName;
        workplace.CurrentOccupantEmail = dto.OccupantEmail?.ToLowerInvariant();

        if (!string.IsNullOrEmpty(dto.OccupantEmail))
            workplace.OccupiedSince = DateTime.UtcNow;
        else
            workplace.OccupiedSince = null;

        workplace.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Updated occupant for workplace {Code}: {Occupant}",
            workplace.Code,
            dto.OccupantName ?? "None");

        return workplace;
    }

    public async Task<IEnumerable<Asset>> GetWorkplaceAssetsAsync(
        int workplaceId,
        CancellationToken cancellationToken = default)
    {
        var workplace = await _context.PhysicalWorkplaces
            .Include(pw => pw.FixedAssets)
            .FirstOrDefaultAsync(pw => pw.Id == workplaceId, cancellationToken);

        if (workplace == null)
            throw new InvalidOperationException($"Workplace with ID {workplaceId} not found");

        return workplace.FixedAssets ?? Enumerable.Empty<Asset>();
    }

    public async Task AssignAssetAsync(
        int workplaceId,
        int assetId,
        CancellationToken cancellationToken = default)
    {
        var workplace = await _context.PhysicalWorkplaces
            .Include(pw => pw.FixedAssets)
            .FirstOrDefaultAsync(pw => pw.Id == workplaceId, cancellationToken);

        if (workplace == null)
            throw new InvalidOperationException($"Workplace with ID {workplaceId} not found");

        var asset = await _context.Assets.FindAsync(new object[] { assetId }, cancellationToken);
        if (asset == null)
            throw new InvalidOperationException($"Asset with ID {assetId} not found");

        // Check if already assigned
        if (workplace.FixedAssets?.Any(a => a.Id == assetId) == true)
            throw new InvalidOperationException($"Asset {asset.AssetCode} is already assigned to workplace {workplace.Code}");

        workplace.FixedAssets ??= new List<Asset>();
        workplace.FixedAssets.Add(asset);

        workplace.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Assigned asset {AssetCode} to workplace {WorkplaceCode}",
            asset.AssetCode,
            workplace.Code);
    }

    public async Task RemoveAssetAsync(
        int workplaceId,
        int assetId,
        CancellationToken cancellationToken = default)
    {
        var workplace = await _context.PhysicalWorkplaces
            .Include(pw => pw.FixedAssets)
            .FirstOrDefaultAsync(pw => pw.Id == workplaceId, cancellationToken);

        if (workplace == null)
            throw new InvalidOperationException($"Workplace with ID {workplaceId} not found");

        var asset = workplace.FixedAssets?.FirstOrDefault(a => a.Id == assetId);
        if (asset == null)
            throw new InvalidOperationException($"Asset with ID {assetId} is not assigned to this workplace");

        workplace.FixedAssets!.Remove(asset);

        workplace.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Removed asset {AssetCode} from workplace {WorkplaceCode}",
            asset.AssetCode,
            workplace.Code);
    }

    public async Task<bool> CodeExistsAsync(
        string code,
        int? excludeId = null,
        CancellationToken cancellationToken = default)
    {
        var query = _context.PhysicalWorkplaces
            .Where(pw => pw.Code.ToUpper() == code.ToUpper());

        if (excludeId.HasValue)
            query = query.Where(pw => pw.Id != excludeId.Value);

        return await query.AnyAsync(cancellationToken);
    }

    public async Task<WorkplaceStatisticsDto> GetStatisticsAsync(CancellationToken cancellationToken = default)
    {
        var workplaces = await _context.PhysicalWorkplaces.ToListAsync(cancellationToken);

        var total = workplaces.Count;
        var active = workplaces.Count(w => w.IsActive);
        var occupied = workplaces.Count(w => !string.IsNullOrEmpty(w.CurrentOccupantEmail));
        var vacant = workplaces.Count(w => string.IsNullOrEmpty(w.CurrentOccupantEmail) && w.IsActive);
        var occupancyRate = active > 0 ? (decimal)occupied / active * 100 : 0;

        // Equipment statistics
        var totalDocking = workplaces.Count;
        var filledDocking = workplaces.Count(w => w.DockingStationAssetId.HasValue);
        var totalMonitors = workplaces.Count * 3; // Up to 3 monitors per workplace
        var filledMonitors = workplaces.Count(w => w.Monitor1AssetId.HasValue) +
                             workplaces.Count(w => w.Monitor2AssetId.HasValue) +
                             workplaces.Count(w => w.Monitor3AssetId.HasValue);
        var totalKeyboards = workplaces.Count;
        var filledKeyboards = workplaces.Count(w => w.KeyboardAssetId.HasValue);
        var totalMice = workplaces.Count;
        var filledMice = workplaces.Count(w => w.MouseAssetId.HasValue);

        var overallRate = (totalDocking + totalMonitors + totalKeyboards + totalMice) > 0
            ? (decimal)(filledDocking + filledMonitors + filledKeyboards + filledMice) /
              (totalDocking + totalMonitors + totalKeyboards + totalMice) * 100
            : 0;

        var equipment = new EquipmentStatisticsDto(
            totalDocking,
            filledDocking,
            totalMonitors,
            filledMonitors,
            totalKeyboards,
            filledKeyboards,
            totalMice,
            filledMice,
            Math.Round(overallRate, 2)
        );

        return new WorkplaceStatisticsDto(
            total,
            active,
            occupied,
            vacant,
            Math.Round(occupancyRate, 2),
            equipment
        );
    }

    public async Task<BulkCreateResult> BulkCreateAsync(
        BulkCreateWorkplacesDto dto,
        CancellationToken cancellationToken = default)
    {
        var errors = new List<string>();
        var created = new List<PhysicalWorkplace>();

        // Validate building
        var building = await _context.Buildings.FindAsync(new object[] { dto.BuildingId }, cancellationToken);
        if (building == null)
        {
            errors.Add($"Building with ID {dto.BuildingId} not found");
            return new BulkCreateResult(0, dto.Count, errors, created);
        }

        // Get existing codes to avoid duplicates
        var existingCodes = (await _context.PhysicalWorkplaces
            .Select(pw => pw.Code.ToUpper())
            .ToListAsync(cancellationToken))
            .ToHashSet();

        for (int i = 0; i < dto.Count; i++)
        {
            var code = $"{dto.CodePrefix}{dto.StartNumber + i:D3}";
            var name = dto.NameTemplate.Replace("{number}", (dto.StartNumber + i).ToString());

            if (existingCodes.Contains(code.ToUpperInvariant()))
            {
                errors.Add($"Code {code} already exists");
                continue;
            }

            var workplace = new PhysicalWorkplace
            {
                Code = code.ToUpperInvariant(),
                Name = name,
                Description = null,
                BuildingId = dto.BuildingId,
                ServiceId = dto.ServiceId,
                Floor = dto.Floor,
                Room = dto.Room,
                Type = dto.Type,
                MonitorCount = dto.MonitorCount,
                HasDockingStation = dto.HasDockingStation,
                IsActive = true
            };

            _context.PhysicalWorkplaces.Add(workplace);
            await _context.SaveChangesAsync(cancellationToken);
            created.Add(workplace);
            existingCodes.Add(code.ToUpperInvariant());
        }

        _logger.LogInformation("Bulk created {Count} workplaces with prefix {Prefix}",
            created.Count,
            dto.CodePrefix);

        return new BulkCreateResult(created.Count, errors.Count, errors, created);
    }
}

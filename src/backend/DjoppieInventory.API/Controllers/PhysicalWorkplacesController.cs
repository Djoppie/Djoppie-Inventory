using DjoppieInventory.Core.DTOs.PhysicalWorkplace;
using DjoppieInventory.Core.Entities;
using DjoppieInventory.Core.Entities.Enums;
using DjoppieInventory.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DjoppieInventory.API.Controllers;

/// <summary>
/// Controller for managing physical workplace locations.
/// Physical workplaces represent permanent desk/workstation locations
/// where fixed equipment (monitors, docking stations) is installed.
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PhysicalWorkplacesController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<PhysicalWorkplacesController> _logger;

    public PhysicalWorkplacesController(
        ApplicationDbContext context,
        ILogger<PhysicalWorkplacesController> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Gets all physical workplaces with optional filtering
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<PhysicalWorkplaceDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<PhysicalWorkplaceDto>>> GetAll(
        [FromQuery] int? buildingId = null,
        [FromQuery] int? serviceId = null,
        [FromQuery] bool? isActive = null,
        [FromQuery] bool? hasOccupant = null,
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
            .AsNoTracking();

        if (buildingId.HasValue)
            query = query.Where(pw => pw.BuildingId == buildingId.Value);

        if (serviceId.HasValue)
            query = query.Where(pw => pw.ServiceId == serviceId.Value);

        if (isActive.HasValue)
            query = query.Where(pw => pw.IsActive == isActive.Value);

        if (hasOccupant.HasValue)
        {
            if (hasOccupant.Value)
                query = query.Where(pw => pw.CurrentOccupantEntraId != null);
            else
                query = query.Where(pw => pw.CurrentOccupantEntraId == null);
        }

        var workplaces = await query
            .OrderBy(pw => pw.Building.Name)
            .ThenBy(pw => pw.Service != null ? pw.Service.Name : "")
            .ThenBy(pw => pw.Name)
            .ToListAsync(cancellationToken);

        var dtos = workplaces.Select(MapToDto);
        return Ok(dtos);
    }

    /// <summary>
    /// Gets physical workplaces for dropdown selection (simplified)
    /// </summary>
    [HttpGet("summary")]
    [ProducesResponseType(typeof(IEnumerable<PhysicalWorkplaceSummaryDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<PhysicalWorkplaceSummaryDto>>> GetSummary(
        [FromQuery] int? buildingId = null,
        [FromQuery] int? serviceId = null,
        [FromQuery] bool activeOnly = true,
        CancellationToken cancellationToken = default)
    {
        var query = _context.PhysicalWorkplaces
            .Include(pw => pw.Building)
            .Include(pw => pw.Service)
            .AsNoTracking();

        if (buildingId.HasValue)
            query = query.Where(pw => pw.BuildingId == buildingId.Value);

        if (serviceId.HasValue)
            query = query.Where(pw => pw.ServiceId == serviceId.Value);

        if (activeOnly)
            query = query.Where(pw => pw.IsActive);

        var workplaces = await query
            .OrderBy(pw => pw.Building.Name)
            .ThenBy(pw => pw.Name)
            .Select(pw => new PhysicalWorkplaceSummaryDto(
                pw.Id,
                pw.Code,
                pw.Name,
                pw.Building.Name,
                pw.ServiceId,
                pw.Service != null ? pw.Service.Name : null,
                pw.CurrentOccupantName,
                pw.IsActive
            ))
            .ToListAsync(cancellationToken);

        return Ok(workplaces);
    }

    /// <summary>
    /// Gets a specific physical workplace by ID
    /// </summary>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(PhysicalWorkplaceDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<PhysicalWorkplaceDto>> GetById(
        int id,
        CancellationToken cancellationToken = default)
    {
        var workplace = await _context.PhysicalWorkplaces
            .Include(pw => pw.Building)
            .Include(pw => pw.Service)
            .Include(pw => pw.FixedAssets)
            .Include(pw => pw.DockingStationAsset)
            .Include(pw => pw.Monitor1Asset)
            .Include(pw => pw.Monitor2Asset)
            .Include(pw => pw.Monitor3Asset)
            .Include(pw => pw.KeyboardAsset)
            .Include(pw => pw.MouseAsset)
            .AsNoTracking()
            .FirstOrDefaultAsync(pw => pw.Id == id, cancellationToken);

        if (workplace == null)
            return NotFound($"Physical workplace with ID {id} not found");

        return Ok(MapToDto(workplace));
    }

    /// <summary>
    /// Creates a new physical workplace
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(PhysicalWorkplaceDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<PhysicalWorkplaceDto>> Create(
        [FromBody] CreatePhysicalWorkplaceDto dto,
        CancellationToken cancellationToken = default)
    {
        // Validate building exists
        var building = await _context.Buildings.FindAsync(new object[] { dto.BuildingId }, cancellationToken);
        if (building == null)
            return BadRequest($"Building with ID {dto.BuildingId} not found");

        // Validate service exists if provided
        if (dto.ServiceId.HasValue)
        {
            var service = await _context.Services.FindAsync(new object[] { dto.ServiceId.Value }, cancellationToken);
            if (service == null)
                return BadRequest($"Service with ID {dto.ServiceId} not found");
        }

        // Check for duplicate code within building
        var existingCode = await _context.PhysicalWorkplaces
            .AnyAsync(pw => pw.BuildingId == dto.BuildingId && pw.Code == dto.Code, cancellationToken);
        if (existingCode)
            return BadRequest($"A workplace with code '{dto.Code}' already exists in this building");

        var workplace = new PhysicalWorkplace
        {
            Code = dto.Code,
            Name = dto.Name,
            Description = dto.Description,
            BuildingId = dto.BuildingId,
            ServiceId = dto.ServiceId,
            Floor = dto.Floor,
            Room = dto.Room,
            Type = dto.Type,
            MonitorCount = dto.MonitorCount,
            HasDockingStation = dto.HasDockingStation,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.PhysicalWorkplaces.Add(workplace);
        await _context.SaveChangesAsync(cancellationToken);

        // Reload with includes
        workplace = await _context.PhysicalWorkplaces
            .Include(pw => pw.Building)
            .Include(pw => pw.Service)
            .Include(pw => pw.FixedAssets)
            .Include(pw => pw.DockingStationAsset)
            .Include(pw => pw.Monitor1Asset)
            .Include(pw => pw.Monitor2Asset)
            .Include(pw => pw.Monitor3Asset)
            .Include(pw => pw.KeyboardAsset)
            .Include(pw => pw.MouseAsset)
            .FirstAsync(pw => pw.Id == workplace.Id, cancellationToken);

        _logger.LogInformation("Created physical workplace {Code} ({Name}) in building {Building}",
            workplace.Code, workplace.Name, building.Name);

        return CreatedAtAction(nameof(GetById), new { id = workplace.Id }, MapToDto(workplace));
    }

    /// <summary>
    /// Updates an existing physical workplace
    /// </summary>
    [HttpPut("{id}")]
    [ProducesResponseType(typeof(PhysicalWorkplaceDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<PhysicalWorkplaceDto>> Update(
        int id,
        [FromBody] UpdatePhysicalWorkplaceDto dto,
        CancellationToken cancellationToken = default)
    {
        var workplace = await _context.PhysicalWorkplaces
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

        if (workplace == null)
            return NotFound($"Physical workplace with ID {id} not found");

        // Validate building if changed
        if (dto.BuildingId.HasValue && dto.BuildingId.Value != workplace.BuildingId)
        {
            var building = await _context.Buildings.FindAsync(new object[] { dto.BuildingId.Value }, cancellationToken);
            if (building == null)
                return BadRequest($"Building with ID {dto.BuildingId} not found");
            workplace.BuildingId = dto.BuildingId.Value;
        }

        // Validate service if changed
        if (dto.ServiceId.HasValue)
        {
            var service = await _context.Services.FindAsync(new object[] { dto.ServiceId.Value }, cancellationToken);
            if (service == null)
                return BadRequest($"Service with ID {dto.ServiceId} not found");
            workplace.ServiceId = dto.ServiceId.Value;
        }

        // Check for duplicate code if changed
        if (dto.Code != null && dto.Code != workplace.Code)
        {
            var targetBuildingId = dto.BuildingId ?? workplace.BuildingId;
            var existingCode = await _context.PhysicalWorkplaces
                .AnyAsync(pw => pw.BuildingId == targetBuildingId && pw.Code == dto.Code && pw.Id != id, cancellationToken);
            if (existingCode)
                return BadRequest($"A workplace with code '{dto.Code}' already exists in this building");
            workplace.Code = dto.Code;
        }

        // Update other fields
        if (dto.Name != null) workplace.Name = dto.Name;
        if (dto.Description != null) workplace.Description = dto.Description;
        if (dto.Floor != null) workplace.Floor = dto.Floor;
        if (dto.Room != null) workplace.Room = dto.Room;
        if (dto.Type.HasValue) workplace.Type = dto.Type.Value;
        if (dto.MonitorCount.HasValue) workplace.MonitorCount = dto.MonitorCount.Value;
        if (dto.HasDockingStation.HasValue) workplace.HasDockingStation = dto.HasDockingStation.Value;
        if (dto.IsActive.HasValue) workplace.IsActive = dto.IsActive.Value;

        workplace.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Updated physical workplace {Id} ({Code})", workplace.Id, workplace.Code);

        return Ok(MapToDto(workplace));
    }

    /// <summary>
    /// Updates the current occupant of a physical workplace
    /// </summary>
    [HttpPut("{id}/occupant")]
    [ProducesResponseType(typeof(PhysicalWorkplaceDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<PhysicalWorkplaceDto>> UpdateOccupant(
        int id,
        [FromBody] UpdateOccupantDto dto,
        CancellationToken cancellationToken = default)
    {
        var workplace = await _context.PhysicalWorkplaces
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

        if (workplace == null)
            return NotFound($"Physical workplace with ID {id} not found");

        var previousOccupant = workplace.CurrentOccupantName;

        workplace.CurrentOccupantEntraId = dto.OccupantEntraId;
        workplace.CurrentOccupantName = dto.OccupantName;
        workplace.CurrentOccupantEmail = dto.OccupantEmail;
        workplace.OccupiedSince = dto.OccupantEntraId != null ? DateTime.UtcNow : null;
        workplace.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        if (dto.OccupantName != null)
            _logger.LogInformation("Workplace {Code} occupant changed from '{Previous}' to '{New}'",
                workplace.Code, previousOccupant ?? "none", dto.OccupantName);
        else
            _logger.LogInformation("Workplace {Code} occupant '{Previous}' removed",
                workplace.Code, previousOccupant ?? "none");

        return Ok(MapToDto(workplace));
    }

    /// <summary>
    /// Updates the equipment slots of a physical workplace.
    /// Equipment slots allow direct linking of specific assets (docking, monitors, keyboard, mouse)
    /// to their designated slots rather than generic FixedAssets.
    /// </summary>
    [HttpPut("{id}/equipment")]
    [ProducesResponseType(typeof(PhysicalWorkplaceDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<PhysicalWorkplaceDto>> UpdateEquipmentSlots(
        int id,
        [FromBody] UpdateEquipmentSlotsDto dto,
        CancellationToken cancellationToken = default)
    {
        var workplace = await _context.PhysicalWorkplaces
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

        if (workplace == null)
            return NotFound($"Physical workplace with ID {id} not found");

        // Update equipment slots
        workplace.DockingStationAssetId = dto.DockingStationAssetId;
        workplace.Monitor1AssetId = dto.Monitor1AssetId;
        workplace.Monitor2AssetId = dto.Monitor2AssetId;
        workplace.Monitor3AssetId = dto.Monitor3AssetId;
        workplace.KeyboardAssetId = dto.KeyboardAssetId;
        workplace.MouseAssetId = dto.MouseAssetId;
        workplace.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        // Reload to get updated navigation properties
        workplace = await _context.PhysicalWorkplaces
            .Include(pw => pw.Building)
            .Include(pw => pw.Service)
            .Include(pw => pw.FixedAssets)
            .Include(pw => pw.DockingStationAsset)
            .Include(pw => pw.Monitor1Asset)
            .Include(pw => pw.Monitor2Asset)
            .Include(pw => pw.Monitor3Asset)
            .Include(pw => pw.KeyboardAsset)
            .Include(pw => pw.MouseAsset)
            .FirstAsync(pw => pw.Id == id, cancellationToken);

        _logger.LogInformation("Updated equipment slots for workplace {Code}", workplace.Code);

        return Ok(MapToDto(workplace));
    }

    /// <summary>
    /// Deletes a physical workplace (soft delete by setting IsActive = false)
    /// </summary>
    [HttpDelete("{id}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Delete(
        int id,
        [FromQuery] bool hardDelete = false,
        CancellationToken cancellationToken = default)
    {
        var workplace = await _context.PhysicalWorkplaces
            .Include(pw => pw.FixedAssets)
            .FirstOrDefaultAsync(pw => pw.Id == id, cancellationToken);

        if (workplace == null)
            return NotFound($"Physical workplace with ID {id} not found");

        if (hardDelete)
        {
            // Check for fixed assets
            if (workplace.FixedAssets.Any())
                return BadRequest($"Cannot delete workplace with {workplace.FixedAssets.Count} fixed assets. Remove assets first or use soft delete.");

            _context.PhysicalWorkplaces.Remove(workplace);
            _logger.LogInformation("Hard deleted physical workplace {Id} ({Code})", id, workplace.Code);
        }
        else
        {
            workplace.IsActive = false;
            workplace.UpdatedAt = DateTime.UtcNow;
            _logger.LogInformation("Soft deleted physical workplace {Id} ({Code})", id, workplace.Code);
        }

        await _context.SaveChangesAsync(cancellationToken);

        return NoContent();
    }

    /// <summary>
    /// Gets the fixed assets assigned to a physical workplace
    /// </summary>
    [HttpGet("{id}/assets")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult> GetFixedAssets(
        int id,
        CancellationToken cancellationToken = default)
    {
        var workplace = await _context.PhysicalWorkplaces
            .AsNoTracking()
            .FirstOrDefaultAsync(pw => pw.Id == id, cancellationToken);

        if (workplace == null)
            return NotFound($"Physical workplace with ID {id} not found");

        var assets = await _context.Assets
            .Where(a => a.PhysicalWorkplaceId == id)
            .Include(a => a.AssetType)
            .AsNoTracking()
            .OrderBy(a => a.AssetType != null ? a.AssetType.SortOrder : 999)
            .Select(a => new
            {
                a.Id,
                a.AssetCode,
                a.AssetName,
                AssetType = a.AssetType != null ? a.AssetType.Name : a.Category,
                a.Brand,
                a.Model,
                a.SerialNumber,
                a.Status
            })
            .ToListAsync(cancellationToken);

        return Ok(assets);
    }

    /// <summary>
    /// Assigns an asset to a physical workplace as a fixed asset.
    /// Fixed assets (monitors, docking stations, etc.) stay at the workplace
    /// regardless of who occupies it.
    /// </summary>
    [HttpPost("{id}/assets/{assetId}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult> AssignAsset(
        int id,
        int assetId,
        CancellationToken cancellationToken = default)
    {
        var workplace = await _context.PhysicalWorkplaces
            .Include(pw => pw.Building)
            .FirstOrDefaultAsync(pw => pw.Id == id, cancellationToken);

        if (workplace == null)
            return NotFound($"Physical workplace with ID {id} not found");

        if (!workplace.IsActive)
            return BadRequest("Cannot assign assets to an inactive workplace");

        var asset = await _context.Assets
            .Include(a => a.AssetType)
            .Include(a => a.PhysicalWorkplace)
            .FirstOrDefaultAsync(a => a.Id == assetId, cancellationToken);

        if (asset == null)
            return NotFound($"Asset with ID {assetId} not found");

        // Check if asset is already assigned to another workplace
        if (asset.PhysicalWorkplaceId.HasValue && asset.PhysicalWorkplaceId != id)
        {
            return BadRequest($"Asset '{asset.AssetCode}' is already assigned to workplace '{asset.PhysicalWorkplace?.Code ?? "unknown"}'");
        }

        // Check if already assigned to this workplace
        if (asset.PhysicalWorkplaceId == id)
        {
            return Ok(new { message = "Asset is already assigned to this workplace" });
        }

        // Assign the asset to the workplace
        asset.PhysicalWorkplaceId = id;
        asset.BuildingId = workplace.BuildingId; // Sync building with workplace
        asset.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "Assigned asset {AssetCode} ({AssetType}) to workplace {WorkplaceCode} in {Building}",
            asset.AssetCode,
            asset.AssetType?.Name ?? asset.Category,
            workplace.Code,
            workplace.Building?.Name ?? "unknown");

        return Ok(new
        {
            message = $"Asset '{asset.AssetCode}' assigned to workplace '{workplace.Code}'",
            assetId = asset.Id,
            assetCode = asset.AssetCode,
            workplaceId = workplace.Id,
            workplaceCode = workplace.Code
        });
    }

    /// <summary>
    /// Unassigns an asset from a physical workplace.
    /// The asset will no longer be associated with any workplace.
    /// </summary>
    [HttpDelete("{id}/assets/{assetId}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UnassignAsset(
        int id,
        int assetId,
        CancellationToken cancellationToken = default)
    {
        var workplace = await _context.PhysicalWorkplaces
            .AsNoTracking()
            .FirstOrDefaultAsync(pw => pw.Id == id, cancellationToken);

        if (workplace == null)
            return NotFound($"Physical workplace with ID {id} not found");

        var asset = await _context.Assets
            .FirstOrDefaultAsync(a => a.Id == assetId, cancellationToken);

        if (asset == null)
            return NotFound($"Asset with ID {assetId} not found");

        // Check if asset is assigned to this workplace
        if (asset.PhysicalWorkplaceId != id)
        {
            return BadRequest($"Asset '{asset.AssetCode}' is not assigned to workplace '{workplace.Code}'");
        }

        // Unassign the asset
        asset.PhysicalWorkplaceId = null;
        asset.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "Unassigned asset {AssetCode} from workplace {WorkplaceCode}",
            asset.AssetCode,
            workplace.Code);

        return NoContent();
    }

    // ============================================================
    // Statistics Endpoints for Dashboard Widgets
    // ============================================================

    /// <summary>
    /// Gets overall workplace statistics including occupancy and equipment rates.
    /// Used for the main dashboard workplace overview widget.
    /// </summary>
    [HttpGet("statistics")]
    [ProducesResponseType(typeof(WorkplaceStatisticsDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<WorkplaceStatisticsDto>> GetStatistics(
        CancellationToken cancellationToken = default)
    {
        var workplaces = await _context.PhysicalWorkplaces
            .Where(pw => pw.IsActive)
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        var totalWorkplaces = workplaces.Count;
        var activeWorkplaces = workplaces.Count(pw => pw.IsActive);
        var occupiedWorkplaces = workplaces.Count(pw => pw.CurrentOccupantEntraId != null);
        var vacantWorkplaces = activeWorkplaces - occupiedWorkplaces;
        var occupancyRate = activeWorkplaces > 0
            ? Math.Round((decimal)occupiedWorkplaces / activeWorkplaces * 100, 1)
            : 0;

        // Equipment statistics
        var totalDocking = workplaces.Count(pw => pw.HasDockingStation);
        var filledDocking = workplaces.Count(pw => pw.DockingStationAssetId.HasValue);

        var totalMonitors = workplaces.Sum(pw => pw.MonitorCount);
        var filledMonitors = workplaces.Count(pw => pw.Monitor1AssetId.HasValue)
            + workplaces.Count(pw => pw.Monitor2AssetId.HasValue)
            + workplaces.Count(pw => pw.Monitor3AssetId.HasValue);

        var totalKeyboards = activeWorkplaces; // Every workplace needs a keyboard
        var filledKeyboards = workplaces.Count(pw => pw.KeyboardAssetId.HasValue);

        var totalMice = activeWorkplaces; // Every workplace needs a mouse
        var filledMice = workplaces.Count(pw => pw.MouseAssetId.HasValue);

        var totalSlots = totalDocking + totalMonitors + totalKeyboards + totalMice;
        var filledSlots = filledDocking + filledMonitors + filledKeyboards + filledMice;
        var overallEquipmentRate = totalSlots > 0
            ? Math.Round((decimal)filledSlots / totalSlots * 100, 1)
            : 0;

        var equipment = new EquipmentStatisticsDto(
            totalDocking, filledDocking,
            totalMonitors, filledMonitors,
            totalKeyboards, filledKeyboards,
            totalMice, filledMice,
            overallEquipmentRate
        );

        return Ok(new WorkplaceStatisticsDto(
            totalWorkplaces,
            activeWorkplaces,
            occupiedWorkplaces,
            vacantWorkplaces,
            occupancyRate,
            equipment
        ));
    }

    /// <summary>
    /// Gets occupancy statistics grouped by building.
    /// Used for the building occupancy distribution widget.
    /// </summary>
    [HttpGet("statistics/by-building")]
    [ProducesResponseType(typeof(IEnumerable<BuildingOccupancyDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<BuildingOccupancyDto>>> GetStatisticsByBuilding(
        CancellationToken cancellationToken = default)
    {
        var stats = await _context.PhysicalWorkplaces
            .Where(pw => pw.IsActive)
            .GroupBy(pw => new { pw.BuildingId, pw.Building.Name, pw.Building.Code })
            .Select(g => new BuildingOccupancyDto(
                g.Key.BuildingId,
                g.Key.Name,
                g.Key.Code,
                g.Count(),
                g.Count(pw => pw.CurrentOccupantEntraId != null),
                g.Count(pw => pw.CurrentOccupantEntraId == null),
                g.Count() > 0
                    ? Math.Round((decimal)g.Count(pw => pw.CurrentOccupantEntraId != null) / g.Count() * 100, 1)
                    : 0
            ))
            .OrderByDescending(b => b.TotalWorkplaces)
            .ToListAsync(cancellationToken);

        return Ok(stats);
    }

    /// <summary>
    /// Gets occupancy statistics grouped by service/department.
    /// Used for the service occupancy distribution widget.
    /// </summary>
    [HttpGet("statistics/by-service")]
    [ProducesResponseType(typeof(IEnumerable<ServiceOccupancyDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<ServiceOccupancyDto>>> GetStatisticsByService(
        CancellationToken cancellationToken = default)
    {
        var stats = await _context.PhysicalWorkplaces
            .Where(pw => pw.IsActive)
            .GroupBy(pw => new { pw.ServiceId, ServiceName = pw.Service != null ? pw.Service.Name : null, ServiceCode = pw.Service != null ? pw.Service.Code : null })
            .Select(g => new ServiceOccupancyDto(
                g.Key.ServiceId,
                g.Key.ServiceName ?? "Geen dienst",
                g.Key.ServiceCode,
                g.Count(),
                g.Count(pw => pw.CurrentOccupantEntraId != null),
                g.Count(pw => pw.CurrentOccupantEntraId == null),
                g.Count() > 0
                    ? Math.Round((decimal)g.Count(pw => pw.CurrentOccupantEntraId != null) / g.Count() * 100, 1)
                    : 0
            ))
            .OrderByDescending(s => s.TotalWorkplaces)
            .ToListAsync(cancellationToken);

        return Ok(stats);
    }

    /// <summary>
    /// Gets equipment status breakdown by type.
    /// Used for the equipment distribution widget.
    /// </summary>
    [HttpGet("statistics/equipment")]
    [ProducesResponseType(typeof(IEnumerable<EquipmentTypeStatusDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<EquipmentTypeStatusDto>>> GetEquipmentStatistics(
        CancellationToken cancellationToken = default)
    {
        var workplaces = await _context.PhysicalWorkplaces
            .Where(pw => pw.IsActive)
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        var activeCount = workplaces.Count;

        var equipmentStats = new List<EquipmentTypeStatusDto>
        {
            CreateEquipmentStat("docking", "Docking Stations",
                workplaces.Count(pw => pw.HasDockingStation),
                workplaces.Count(pw => pw.DockingStationAssetId.HasValue)),
            CreateEquipmentStat("monitor", "Monitors",
                workplaces.Sum(pw => pw.MonitorCount),
                workplaces.Count(pw => pw.Monitor1AssetId.HasValue)
                    + workplaces.Count(pw => pw.Monitor2AssetId.HasValue)
                    + workplaces.Count(pw => pw.Monitor3AssetId.HasValue)),
            CreateEquipmentStat("keyboard", "Keyboards",
                activeCount,
                workplaces.Count(pw => pw.KeyboardAssetId.HasValue)),
            CreateEquipmentStat("mouse", "Mice",
                activeCount,
                workplaces.Count(pw => pw.MouseAssetId.HasValue))
        };

        return Ok(equipmentStats);
    }

    /// <summary>
    /// Gets recent workplace changes (occupancy changes, equipment assignments).
    /// Used for the activity feed widget on the dashboard.
    /// </summary>
    [HttpGet("recent-changes")]
    [ProducesResponseType(typeof(IEnumerable<WorkplaceChangeDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<WorkplaceChangeDto>>> GetRecentChanges(
        [FromQuery] int limit = 10,
        [FromQuery] int? buildingId = null,
        CancellationToken cancellationToken = default)
    {
        // Get recently updated workplaces (those with occupants are likely recent changes)
        var query = _context.PhysicalWorkplaces
            .Where(pw => pw.IsActive)
            .AsNoTracking();

        if (buildingId.HasValue)
            query = query.Where(pw => pw.BuildingId == buildingId.Value);

        // Get workplaces with recent activity (occupied or recently updated)
        var recentWorkplaces = await query
            .Where(pw => pw.OccupiedSince.HasValue || pw.UpdatedAt > DateTime.UtcNow.AddDays(-30))
            .OrderByDescending(pw => pw.UpdatedAt)
            .Take(limit * 2) // Get more to filter
            .Select(pw => new
            {
                pw.Id,
                pw.Code,
                pw.Name,
                pw.CurrentOccupantName,
                pw.OccupiedSince,
                pw.UpdatedAt,
                HasEquipment = pw.DockingStationAssetId.HasValue
                    || pw.Monitor1AssetId.HasValue
                    || pw.KeyboardAssetId.HasValue
            })
            .ToListAsync(cancellationToken);

        var changes = new List<WorkplaceChangeDto>();

        foreach (var wp in recentWorkplaces)
        {
            if (wp.OccupiedSince.HasValue && wp.CurrentOccupantName != null)
            {
                changes.Add(new WorkplaceChangeDto(
                    wp.Id,
                    wp.Code,
                    wp.Name,
                    "occupancy",
                    $"Bezet door {wp.CurrentOccupantName}",
                    wp.CurrentOccupantName,
                    null,
                    wp.OccupiedSince.Value
                ));
            }
            else if (wp.HasEquipment)
            {
                changes.Add(new WorkplaceChangeDto(
                    wp.Id,
                    wp.Code,
                    wp.Name,
                    "equipment",
                    "Apparatuur toegewezen",
                    null,
                    null,
                    wp.UpdatedAt
                ));
            }
        }

        return Ok(changes.OrderByDescending(c => c.ChangedAt).Take(limit));
    }

    private static EquipmentTypeStatusDto CreateEquipmentStat(string type, string displayName, int total, int filled)
    {
        var fillRate = total > 0 ? Math.Round((decimal)filled / total * 100, 1) : 0;
        return new EquipmentTypeStatusDto(type, displayName, total, filled, total - filled, fillRate);
    }

    // ============================================================
    // Bulk Operations
    // ============================================================

    /// <summary>
    /// Downloads a CSV template for bulk workplace import.
    /// Includes valid building and service codes as reference.
    /// </summary>
    [HttpGet("template")]
    [ProducesResponseType(typeof(FileContentResult), StatusCodes.Status200OK)]
    public async Task<IActionResult> DownloadTemplate(CancellationToken cancellationToken = default)
    {
        var buildings = await _context.Buildings
            .Where(b => b.IsActive)
            .OrderBy(b => b.SortOrder)
            .Select(b => new { b.Code, b.Name })
            .ToListAsync(cancellationToken);

        var services = await _context.Services
            .Where(s => s.IsActive)
            .OrderBy(s => s.SortOrder)
            .Select(s => new { s.Code, s.Name })
            .ToListAsync(cancellationToken);

        var csv = new System.Text.StringBuilder();

        // Header comments with valid codes
        csv.AppendLine("# Physical Workplace Import Template");
        csv.AppendLine("# ");
        csv.AppendLine("# Valid Building Codes:");
        foreach (var b in buildings)
            csv.AppendLine($"#   {b.Code} = {b.Name}");
        csv.AppendLine("# ");
        csv.AppendLine("# Valid Service Codes (optional):");
        foreach (var s in services)
            csv.AppendLine($"#   {s.Code} = {s.Name}");
        csv.AppendLine("# ");
        csv.AppendLine("# Workplace Types: Desktop=0, Laptop=1, HotDesk=2, MeetingRoom=3");
        csv.AppendLine("# ");
        csv.AppendLine("# Required fields: Code, Name, BuildingCode");
        csv.AppendLine("# ");

        // CSV Header
        csv.AppendLine("Code,Name,Description,BuildingCode,ServiceCode,Floor,Room,Type,MonitorCount,HasDockingStation");

        // Example rows
        csv.AppendLine("GH-BZ-L04,Loket 4 Burgerzaken,Vierde loket Burgerzaken,GHUIS,BURG,Gelijkvloers,Lokettenhal,Laptop,2,true");
        csv.AppendLine("PG-IT-03,Werkplek IT 3,Developer werkplek,POORT,IT,1e verdieping,Lokaal IT,Desktop,3,false");
        csv.AppendLine("PL-FLEX-02,Flexplek 2,Gedeelde werkplek,PLAK,,Gelijkvloers,Open kantoor,HotDesk,1,true");

        var bytes = System.Text.Encoding.UTF8.GetBytes(csv.ToString());
        var fileName = $"workplace-import-template_{DateTime.UtcNow:yyyyMMdd}.csv";

        _logger.LogInformation("Workplace CSV template downloaded");
        return File(bytes, "text/csv", fileName);
    }

    /// <summary>
    /// Exports all workplaces to CSV format (compatible with import template).
    /// </summary>
    [HttpGet("export")]
    [ProducesResponseType(typeof(FileContentResult), StatusCodes.Status200OK)]
    public async Task<IActionResult> ExportCsv(
        [FromQuery] int? buildingId = null,
        [FromQuery] int? serviceId = null,
        [FromQuery] bool? isActive = null,
        CancellationToken cancellationToken = default)
    {
        var query = _context.PhysicalWorkplaces
            .Include(pw => pw.Building)
            .Include(pw => pw.Service)
            .AsNoTracking();

        if (buildingId.HasValue)
            query = query.Where(pw => pw.BuildingId == buildingId.Value);

        if (serviceId.HasValue)
            query = query.Where(pw => pw.ServiceId == serviceId.Value);

        if (isActive.HasValue)
            query = query.Where(pw => pw.IsActive == isActive.Value);

        var workplaces = await query
            .OrderBy(pw => pw.Building.Name)
            .ThenBy(pw => pw.Service != null ? pw.Service.Name : "")
            .ThenBy(pw => pw.Code)
            .ToListAsync(cancellationToken);

        var csv = new System.Text.StringBuilder();

        // CSV Header
        csv.AppendLine("Code,Name,Description,BuildingCode,ServiceCode,Floor,Room,Type,MonitorCount,HasDockingStation");

        // Data rows
        foreach (var wp in workplaces)
        {
            var description = EscapeCsvField(wp.Description ?? "");
            var name = EscapeCsvField(wp.Name);
            var floor = EscapeCsvField(wp.Floor ?? "");
            var room = EscapeCsvField(wp.Room ?? "");

            csv.AppendLine($"{wp.Code},{name},{description},{wp.Building?.Code ?? ""},{wp.Service?.Code ?? ""},{floor},{room},{(int)wp.Type},{wp.MonitorCount},{wp.HasDockingStation.ToString().ToLowerInvariant()}");
        }

        var bytes = System.Text.Encoding.UTF8.GetBytes(csv.ToString());
        var fileName = $"workplaces-export_{DateTime.UtcNow:yyyyMMdd_HHmmss}.csv";

        _logger.LogInformation("Exported {Count} workplaces to CSV", workplaces.Count);
        return File(bytes, "text/csv", fileName);
    }

    /// <summary>
    /// Escapes a field for CSV output (handles commas and quotes).
    /// </summary>
    private static string EscapeCsvField(string field)
    {
        if (string.IsNullOrEmpty(field))
            return "";

        // If field contains comma, newline, or quote, wrap in quotes and escape internal quotes
        if (field.Contains(',') || field.Contains('"') || field.Contains('\n') || field.Contains('\r'))
        {
            return $"\"{field.Replace("\"", "\"\"")}\"";
        }
        return field;
    }

    /// <summary>
    /// Imports workplaces from a CSV file.
    /// </summary>
    [HttpPost("import")]
    [Consumes("multipart/form-data")]
    [ProducesResponseType(typeof(WorkplaceCsvImportResultDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<WorkplaceCsvImportResultDto>> ImportCsv(
        IFormFile file,
        CancellationToken cancellationToken = default)
    {
        if (file == null || file.Length == 0)
            return BadRequest("No file uploaded. Please provide a CSV file.");

        if (file.Length > 5 * 1024 * 1024)
            return BadRequest("File size exceeds maximum allowed size of 5 MB.");

        var fileExtension = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (fileExtension != ".csv")
            return BadRequest("Invalid file type. Only CSV files (.csv) are allowed.");

        // Load lookup data
        var buildings = await _context.Buildings
            .Where(b => b.IsActive)
            .ToDictionaryAsync(b => b.Code.ToUpperInvariant(), b => b.Id, cancellationToken);

        var services = await _context.Services
            .Where(s => s.IsActive)
            .ToDictionaryAsync(s => s.Code.ToUpperInvariant(), s => s.Id, cancellationToken);

        var existingCodes = (await _context.PhysicalWorkplaces
            .Select(pw => pw.Code.ToUpperInvariant())
            .ToListAsync(cancellationToken)).ToHashSet();

        var results = new List<WorkplaceCsvImportRowResult>();
        var workplacesToCreate = new List<(int rowNum, PhysicalWorkplace workplace)>();

        using var reader = new StreamReader(file.OpenReadStream());
        var rowNumber = 0;

        while (!reader.EndOfStream)
        {
            var line = await reader.ReadLineAsync(cancellationToken);
            rowNumber++;

            // Skip empty lines and comments
            if (string.IsNullOrWhiteSpace(line) || line.TrimStart().StartsWith('#'))
                continue;

            // Skip header row
            if (rowNumber == 1 || line.StartsWith("Code,", StringComparison.OrdinalIgnoreCase))
            {
                // Check if this is the actual header row
                if (line.Contains("BuildingCode", StringComparison.OrdinalIgnoreCase))
                    continue;
            }

            var columns = ParseCsvLine(line);
            if (columns.Length < 4)
            {
                results.Add(new WorkplaceCsvImportRowResult(rowNumber, null, null, false,
                    "Invalid row format. Expected at least 4 columns: Code, Name, Description, BuildingCode", null));
                continue;
            }

            var code = columns[0].Trim();
            var name = columns[1].Trim();
            var description = columns.Length > 2 ? columns[2].Trim() : null;
            var buildingCode = columns.Length > 3 ? columns[3].Trim().ToUpperInvariant() : null;
            var serviceCode = columns.Length > 4 ? columns[4].Trim().ToUpperInvariant() : null;
            var floor = columns.Length > 5 ? columns[5].Trim() : null;
            var room = columns.Length > 6 ? columns[6].Trim() : null;
            var typeStr = columns.Length > 7 ? columns[7].Trim() : "Laptop";
            var monitorCountStr = columns.Length > 8 ? columns[8].Trim() : "2";
            var hasDockingStr = columns.Length > 9 ? columns[9].Trim() : "true";

            // Validate required fields
            if (string.IsNullOrWhiteSpace(code))
            {
                results.Add(new WorkplaceCsvImportRowResult(rowNumber, code, name, false, "Code is required", null));
                continue;
            }

            if (string.IsNullOrWhiteSpace(name))
            {
                results.Add(new WorkplaceCsvImportRowResult(rowNumber, code, name, false, "Name is required", null));
                continue;
            }

            if (string.IsNullOrWhiteSpace(buildingCode))
            {
                results.Add(new WorkplaceCsvImportRowResult(rowNumber, code, name, false, "BuildingCode is required", null));
                continue;
            }

            // Check for duplicate code
            if (existingCodes.Contains(code.ToUpperInvariant()))
            {
                results.Add(new WorkplaceCsvImportRowResult(rowNumber, code, name, false,
                    $"Workplace with code '{code}' already exists", null));
                continue;
            }

            // Validate building
            if (!buildings.TryGetValue(buildingCode, out var buildingId))
            {
                results.Add(new WorkplaceCsvImportRowResult(rowNumber, code, name, false,
                    $"Invalid BuildingCode '{buildingCode}'", null));
                continue;
            }

            // Validate service (if provided)
            int? serviceId = null;
            if (!string.IsNullOrWhiteSpace(serviceCode))
            {
                if (!services.TryGetValue(serviceCode, out var sId))
                {
                    results.Add(new WorkplaceCsvImportRowResult(rowNumber, code, name, false,
                        $"Invalid ServiceCode '{serviceCode}'", null));
                    continue;
                }
                serviceId = sId;
            }

            // Parse type
            var workplaceType = WorkplaceType.Laptop;
            if (!string.IsNullOrWhiteSpace(typeStr))
            {
                if (int.TryParse(typeStr, out var typeInt) && Enum.IsDefined(typeof(WorkplaceType), typeInt))
                    workplaceType = (WorkplaceType)typeInt;
                else if (Enum.TryParse<WorkplaceType>(typeStr, true, out var typeEnum))
                    workplaceType = typeEnum;
            }

            // Parse monitor count
            var monitorCount = 2;
            if (!string.IsNullOrWhiteSpace(monitorCountStr))
                int.TryParse(monitorCountStr, out monitorCount);

            // Parse has docking station
            var hasDocking = true;
            if (!string.IsNullOrWhiteSpace(hasDockingStr))
                bool.TryParse(hasDockingStr, out hasDocking);

            var workplace = new PhysicalWorkplace
            {
                Code = code,
                Name = name,
                Description = string.IsNullOrWhiteSpace(description) ? null : description,
                BuildingId = buildingId,
                ServiceId = serviceId,
                Floor = string.IsNullOrWhiteSpace(floor) ? null : floor,
                Room = string.IsNullOrWhiteSpace(room) ? null : room,
                Type = workplaceType,
                MonitorCount = monitorCount,
                HasDockingStation = hasDocking,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            workplacesToCreate.Add((rowNumber, workplace));
            existingCodes.Add(code.ToUpperInvariant()); // Prevent duplicates within same import
        }

        // Save all valid workplaces
        foreach (var (rowNum, workplace) in workplacesToCreate)
        {
            try
            {
                _context.PhysicalWorkplaces.Add(workplace);
                await _context.SaveChangesAsync(cancellationToken);
                results.Add(new WorkplaceCsvImportRowResult(rowNum, workplace.Code, workplace.Name, true, null, workplace.Id));
            }
            catch (Exception ex)
            {
                results.Add(new WorkplaceCsvImportRowResult(rowNum, workplace.Code, workplace.Name, false,
                    $"Database error: {ex.Message}", null));
            }
        }

        var successCount = results.Count(r => r.Success);
        var errorCount = results.Count(r => !r.Success);

        _logger.LogInformation("Workplace CSV import completed. Success: {Success}, Errors: {Errors}",
            successCount, errorCount);

        return Ok(new WorkplaceCsvImportResultDto(
            results.Count,
            successCount,
            errorCount,
            errorCount == 0,
            results
        ));
    }

    /// <summary>
    /// Bulk creates multiple workplaces for a service/building using a template.
    /// Creates workplaces with sequential codes like "GH-BZ-L01", "GH-BZ-L02", etc.
    /// </summary>
    [HttpPost("bulk")]
    [ProducesResponseType(typeof(BulkCreateWorkplacesResultDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<BulkCreateWorkplacesResultDto>> BulkCreate(
        [FromBody] BulkCreateWorkplacesDto dto,
        CancellationToken cancellationToken = default)
    {
        // Validate building exists
        var building = await _context.Buildings.FindAsync(new object[] { dto.BuildingId }, cancellationToken);
        if (building == null)
            return BadRequest($"Building with ID {dto.BuildingId} not found");

        // Validate service exists if provided
        Service? service = null;
        if (dto.ServiceId.HasValue)
        {
            service = await _context.Services.FindAsync(new object[] { dto.ServiceId.Value }, cancellationToken);
            if (service == null)
                return BadRequest($"Service with ID {dto.ServiceId} not found");
        }

        if (dto.Count < 1 || dto.Count > 100)
            return BadRequest("Count must be between 1 and 100");

        if (string.IsNullOrWhiteSpace(dto.CodePrefix))
            return BadRequest("CodePrefix is required");

        if (string.IsNullOrWhiteSpace(dto.NameTemplate))
            return BadRequest("NameTemplate is required (use {n} for number placeholder)");

        var existingCodes = (await _context.PhysicalWorkplaces
            .Where(pw => pw.BuildingId == dto.BuildingId)
            .Select(pw => pw.Code.ToUpperInvariant())
            .ToListAsync(cancellationToken)).ToHashSet();

        var results = new List<BulkCreateWorkplaceItemResult>();

        for (int i = 0; i < dto.Count; i++)
        {
            var number = dto.StartNumber + i;
            var code = $"{dto.CodePrefix}{number:D2}";
            var name = dto.NameTemplate.Replace("{n}", number.ToString());

            if (existingCodes.Contains(code.ToUpperInvariant()))
            {
                results.Add(new BulkCreateWorkplaceItemResult(null, code, name, false,
                    $"Workplace with code '{code}' already exists"));
                continue;
            }

            var workplace = new PhysicalWorkplace
            {
                Code = code,
                Name = name,
                BuildingId = dto.BuildingId,
                ServiceId = dto.ServiceId,
                Floor = dto.Floor,
                Room = dto.Room,
                Type = dto.Type,
                MonitorCount = dto.MonitorCount,
                HasDockingStation = dto.HasDockingStation,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            try
            {
                _context.PhysicalWorkplaces.Add(workplace);
                await _context.SaveChangesAsync(cancellationToken);
                results.Add(new BulkCreateWorkplaceItemResult(workplace.Id, code, name, true, null));
                existingCodes.Add(code.ToUpperInvariant());
            }
            catch (Exception ex)
            {
                results.Add(new BulkCreateWorkplaceItemResult(null, code, name, false, ex.Message));
            }
        }

        var successCount = results.Count(r => r.Success);
        var errorCount = results.Count(r => !r.Success);

        _logger.LogInformation("Bulk workplace creation completed. Building: {Building}, Success: {Success}, Errors: {Errors}",
            building.Name, successCount, errorCount);

        return Ok(new BulkCreateWorkplacesResultDto(dto.Count, successCount, errorCount, results));
    }

    /// <summary>
    /// Parses a CSV line handling quoted fields with commas
    /// </summary>
    private static string[] ParseCsvLine(string line)
    {
        var result = new List<string>();
        var current = new System.Text.StringBuilder();
        var inQuotes = false;

        for (int i = 0; i < line.Length; i++)
        {
            var c = line[i];

            if (c == '"')
            {
                inQuotes = !inQuotes;
            }
            else if (c == ',' && !inQuotes)
            {
                result.Add(current.ToString());
                current.Clear();
            }
            else
            {
                current.Append(c);
            }
        }

        result.Add(current.ToString());
        return result.ToArray();
    }

    private static PhysicalWorkplaceDto MapToDto(PhysicalWorkplace pw)
    {
        // Count equipment slots that have assets assigned
        var equipmentSlotCount = 0;
        if (pw.DockingStationAssetId.HasValue) equipmentSlotCount++;
        if (pw.Monitor1AssetId.HasValue) equipmentSlotCount++;
        if (pw.Monitor2AssetId.HasValue) equipmentSlotCount++;
        if (pw.Monitor3AssetId.HasValue) equipmentSlotCount++;
        if (pw.KeyboardAssetId.HasValue) equipmentSlotCount++;
        if (pw.MouseAssetId.HasValue) equipmentSlotCount++;

        // Total asset count = equipment slots + other fixed assets
        var totalAssetCount = equipmentSlotCount + (pw.FixedAssets?.Count ?? 0);

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
            // Equipment slots
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
            // Occupant info
            pw.CurrentOccupantEntraId,
            pw.CurrentOccupantName,
            pw.CurrentOccupantEmail,
            pw.OccupiedSince,
            pw.IsActive,
            totalAssetCount,
            pw.CreatedAt,
            pw.UpdatedAt
        );
    }
}

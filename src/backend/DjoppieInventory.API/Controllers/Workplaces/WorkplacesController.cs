using DjoppieInventory.Core.DTOs.PhysicalWorkplace;
using DjoppieInventory.Core.Entities;
using DjoppieInventory.Infrastructure.Data;
using DjoppieInventory.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DjoppieInventory.API.Controllers.Workplaces;

/// <summary>
/// Controller for core physical workplace CRUD operations.
/// Physical workplaces represent permanent desk/workstation locations
/// where fixed equipment (monitors, docking stations) is installed.
/// </summary>
[ApiController]
[Route("api/workplaces")]
[Authorize]
public class WorkplacesController : ControllerBase
{
    private readonly IPhysicalWorkplaceService _workplaceService;
    private readonly ApplicationDbContext _context;
    private readonly ILogger<WorkplacesController> _logger;

    public WorkplacesController(
        IPhysicalWorkplaceService workplaceService,
        ApplicationDbContext context,
        ILogger<WorkplacesController> logger)
    {
        _workplaceService = workplaceService;
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
        var workplaces = await _workplaceService.GetAllAsync(
            buildingId, serviceId, isActive, hasOccupant, cancellationToken);
        return Ok(workplaces);
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
            .Include(pw => pw.DockingStationAsset)
            .Include(pw => pw.Monitor1Asset)
            .Include(pw => pw.Monitor2Asset)
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
                pw.BuildingId,
                pw.Building.Name,
                pw.ServiceId,
                pw.Service != null ? pw.Service.Name : null,
                pw.Floor,
                pw.CurrentOccupantName,
                pw.CurrentOccupantEmail,
                // Lookup employee ID by EntraId
                pw.CurrentOccupantEntraId != null
                    ? _context.Employees
                        .Where(e => e.EntraId == pw.CurrentOccupantEntraId)
                        .Select(e => (int?)e.Id)
                        .FirstOrDefault()
                    : null,
                pw.IsActive,
                // Equipment summary - count filled slots
                (pw.DockingStationAssetId.HasValue ? 1 : 0) +
                (pw.Monitor1AssetId.HasValue ? 1 : 0) +
                (pw.Monitor2AssetId.HasValue ? 1 : 0) +
                (pw.Monitor3AssetId.HasValue ? 1 : 0) +
                (pw.KeyboardAssetId.HasValue ? 1 : 0) +
                (pw.MouseAssetId.HasValue ? 1 : 0),
                pw.HasDockingStation,
                pw.MonitorCount,
                pw.DockingStationAsset != null ? pw.DockingStationAsset.AssetCode : null,
                pw.Monitor1Asset != null ? pw.Monitor1Asset.AssetCode : null,
                pw.Monitor2Asset != null ? pw.Monitor2Asset.AssetCode : null
            ))
            .ToListAsync(cancellationToken);

        return Ok(workplaces);
    }

    /// <summary>
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
        var workplace = await _workplaceService.GetDtoByIdAsync(id, cancellationToken);

        if (workplace == null)
            return NotFound($"Physical workplace with ID {id} not found");

        return Ok(workplace);
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

        // Collect old and new asset IDs to update PhysicalWorkplaceId
        var oldAssetIds = new List<int?>
        {
            workplace.DockingStationAssetId,
            workplace.Monitor1AssetId,
            workplace.Monitor2AssetId,
            workplace.Monitor3AssetId,
            workplace.KeyboardAssetId,
            workplace.MouseAssetId
        }.Where(id => id.HasValue).Select(id => id!.Value).ToHashSet();

        var newAssetIds = new List<int?>
        {
            dto.DockingStationAssetId,
            dto.Monitor1AssetId,
            dto.Monitor2AssetId,
            dto.Monitor3AssetId,
            dto.KeyboardAssetId,
            dto.MouseAssetId
        }.Where(id => id.HasValue).Select(id => id!.Value).ToHashSet();

        // Assets removed from workplace - clear PhysicalWorkplaceId
        var removedAssetIds = oldAssetIds.Except(newAssetIds).ToList();
        if (removedAssetIds.Any())
        {
            var removedAssets = await _context.Assets
                .Where(a => removedAssetIds.Contains(a.Id))
                .ToListAsync(cancellationToken);
            foreach (var asset in removedAssets)
            {
                asset.PhysicalWorkplaceId = null;
                asset.BuildingId = null;
            }
        }

        // Assets added to workplace - set PhysicalWorkplaceId and BuildingId
        var addedAssetIds = newAssetIds.Except(oldAssetIds).ToList();
        if (addedAssetIds.Any())
        {
            var addedAssets = await _context.Assets
                .Where(a => addedAssetIds.Contains(a.Id))
                .ToListAsync(cancellationToken);
            foreach (var asset in addedAssets)
            {
                asset.PhysicalWorkplaceId = workplace.Id;
                asset.BuildingId = workplace.BuildingId;
            }
        }

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
        try
        {
            var success = await _workplaceService.DeleteAsync(id, cancellationToken);

            if (!success)
                return NotFound($"Physical workplace with ID {id} not found");

            _logger.LogInformation("Soft deleted physical workplace {Id}", id);
            return NoContent();
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ex.Message);
        }
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

    internal static PhysicalWorkplaceDto MapToDto(PhysicalWorkplace pw)
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
            // Occupant's device info
            pw.OccupantDeviceSerial,
            pw.OccupantDeviceBrand,
            pw.OccupantDeviceModel,
            pw.OccupantDeviceAssetCode,
            pw.IsActive,
            totalAssetCount,
            pw.CreatedAt,
            pw.UpdatedAt
        );
    }

    /// <summary>
    /// Maps a PhysicalWorkplace to DTO with dynamic active laptop lookup.
    /// Only shows the occupant's laptop if it has status InGebruik.
    /// </summary>
    internal static PhysicalWorkplaceDto MapToDtoWithActiveLaptop(
        PhysicalWorkplace pw,
        Dictionary<string, Asset> laptopByOwnerEmail,
        Dictionary<string, Asset> laptopByEntraId)
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

        // Look up the occupant's active laptop (only if status = InGebruik)
        // Try by EntraId first (most reliable), then by email, then by name
        Asset? activeLaptop = null;
        if (!string.IsNullOrEmpty(pw.CurrentOccupantEntraId) &&
            laptopByEntraId.TryGetValue(pw.CurrentOccupantEntraId, out var laptopByEntra))
        {
            activeLaptop = laptopByEntra;
        }
        else if (!string.IsNullOrEmpty(pw.CurrentOccupantEmail) &&
            laptopByOwnerEmail.TryGetValue(pw.CurrentOccupantEmail.ToLower(), out var laptopByEmail))
        {
            activeLaptop = laptopByEmail;
        }
        else if (!string.IsNullOrEmpty(pw.CurrentOccupantName) &&
            laptopByOwnerEmail.TryGetValue(pw.CurrentOccupantName.ToLower(), out var laptopByName))
        {
            activeLaptop = laptopByName;
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
            // Occupant's device info - use active laptop if available, otherwise null
            activeLaptop?.SerialNumber,
            activeLaptop?.Brand,
            activeLaptop?.Model,
            activeLaptop?.AssetCode,
            pw.IsActive,
            totalAssetCount,
            pw.CreatedAt,
            pw.UpdatedAt
        );
    }
}

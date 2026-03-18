using DjoppieInventory.Core.Entities.Enums;

namespace DjoppieInventory.Core.DTOs.PhysicalWorkplace;

/// <summary>
/// DTO for updating an existing physical workplace
/// </summary>
public record UpdatePhysicalWorkplaceDto(
    string? Code,
    string? Name,
    string? Description,
    int? BuildingId,
    int? ServiceId,
    string? Floor,
    string? Room,
    WorkplaceType? Type,
    int? MonitorCount,
    bool? HasDockingStation,
    bool? IsActive
);

/// <summary>
/// DTO for updating the current occupant of a physical workplace
/// </summary>
public record UpdateOccupantDto(
    string? OccupantEntraId,
    string? OccupantName,
    string? OccupantEmail
);

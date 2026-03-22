using DjoppieInventory.Core.Entities.Enums;

namespace DjoppieInventory.Core.DTOs.PhysicalWorkplace;

/// <summary>
/// DTO for creating a new physical workplace
/// </summary>
public record CreatePhysicalWorkplaceDto(
    string Code,
    string Name,
    string? Description,
    int BuildingId,
    int? ServiceId,
    string? Floor,
    string? Room,
    WorkplaceType Type = WorkplaceType.Laptop,
    int MonitorCount = 2,
    bool HasDockingStation = true
);

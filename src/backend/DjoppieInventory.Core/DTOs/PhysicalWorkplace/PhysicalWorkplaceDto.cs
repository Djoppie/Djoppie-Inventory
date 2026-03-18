using DjoppieInventory.Core.Entities.Enums;

namespace DjoppieInventory.Core.DTOs.PhysicalWorkplace;

/// <summary>
/// DTO for returning physical workplace data
/// </summary>
public record PhysicalWorkplaceDto(
    int Id,
    string Code,
    string Name,
    string? Description,
    int BuildingId,
    string? BuildingName,
    string? BuildingCode,
    int? ServiceId,
    string? ServiceName,
    string? Floor,
    string? Room,
    WorkplaceType Type,
    int MonitorCount,
    bool HasDockingStation,
    string? CurrentOccupantEntraId,
    string? CurrentOccupantName,
    string? CurrentOccupantEmail,
    DateTime? OccupiedSince,
    bool IsActive,
    int FixedAssetCount,
    DateTime CreatedAt,
    DateTime UpdatedAt
);

/// <summary>
/// Simplified DTO for dropdowns and lists
/// </summary>
public record PhysicalWorkplaceSummaryDto(
    int Id,
    string Code,
    string Name,
    string? BuildingName,
    string? ServiceName,
    string? CurrentOccupantName,
    bool IsActive
);

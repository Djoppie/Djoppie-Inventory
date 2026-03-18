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
    // Equipment slots
    int? DockingStationAssetId,
    string? DockingStationAssetCode,
    string? DockingStationSerialNumber,
    int? Monitor1AssetId,
    string? Monitor1AssetCode,
    string? Monitor1SerialNumber,
    int? Monitor2AssetId,
    string? Monitor2AssetCode,
    string? Monitor2SerialNumber,
    int? Monitor3AssetId,
    string? Monitor3AssetCode,
    string? Monitor3SerialNumber,
    int? KeyboardAssetId,
    string? KeyboardAssetCode,
    string? KeyboardSerialNumber,
    int? MouseAssetId,
    string? MouseAssetCode,
    string? MouseSerialNumber,
    // Occupant info
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

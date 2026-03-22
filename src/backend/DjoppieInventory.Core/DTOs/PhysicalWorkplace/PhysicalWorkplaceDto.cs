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
    // Occupant's device info
    string? OccupantDeviceSerial,
    string? OccupantDeviceBrand,
    string? OccupantDeviceModel,
    string? OccupantDeviceAssetCode,
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
    int? ServiceId,
    string? ServiceName,
    string? CurrentOccupantName,
    bool IsActive
);

// ============================================================
// Statistics DTOs for Dashboard Widgets
// ============================================================

/// <summary>
/// Overall workplace statistics for dashboard overview widget
/// </summary>
public record WorkplaceStatisticsDto(
    int TotalWorkplaces,
    int ActiveWorkplaces,
    int OccupiedWorkplaces,
    int VacantWorkplaces,
    decimal OccupancyRate,
    EquipmentStatisticsDto Equipment
);

/// <summary>
/// Equipment slot statistics across all workplaces
/// </summary>
public record EquipmentStatisticsDto(
    int TotalDockingSlots,
    int FilledDockingSlots,
    int TotalMonitorSlots,
    int FilledMonitorSlots,
    int TotalKeyboardSlots,
    int FilledKeyboardSlots,
    int TotalMouseSlots,
    int FilledMouseSlots,
    decimal OverallEquipmentRate
);

/// <summary>
/// Occupancy statistics grouped by building
/// </summary>
public record BuildingOccupancyDto(
    int BuildingId,
    string BuildingName,
    string? BuildingCode,
    int TotalWorkplaces,
    int OccupiedWorkplaces,
    int VacantWorkplaces,
    decimal OccupancyRate
);

/// <summary>
/// Occupancy statistics grouped by service
/// </summary>
public record ServiceOccupancyDto(
    int? ServiceId,
    string? ServiceName,
    string? ServiceCode,
    int TotalWorkplaces,
    int OccupiedWorkplaces,
    int VacantWorkplaces,
    decimal OccupancyRate
);

/// <summary>
/// Recent workplace change event for activity feed
/// </summary>
public record WorkplaceChangeDto(
    int WorkplaceId,
    string WorkplaceCode,
    string WorkplaceName,
    string ChangeType,
    string Description,
    string? UserName,
    string? AssetCode,
    DateTime ChangedAt
);

/// <summary>
/// Equipment status by type for equipment distribution widget
/// </summary>
public record EquipmentTypeStatusDto(
    string EquipmentType,
    string DisplayName,
    int TotalSlots,
    int FilledSlots,
    int EmptySlots,
    decimal FillRate
);

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

// ============================================================
// Workplace Gap Analysis DTOs
// ============================================================

/// <summary>
/// Summary statistics for workplace gap analysis
/// </summary>
public record WorkplaceGapAnalysisDto(
    /// <summary>Total laptops with status InGebruik that have an owner</summary>
    int TotalLaptopsInUse,
    /// <summary>Laptop owners who have a matching PhysicalWorkplace</summary>
    int OwnersWithWorkplace,
    /// <summary>Laptop owners who don't have a PhysicalWorkplace</summary>
    int OwnersWithoutWorkplace,
    /// <summary>Percentage of owners without workplace</summary>
    decimal GapPercentage,
    /// <summary>List of owners without workplaces, grouped by service</summary>
    IEnumerable<WorkplaceGapByServiceDto> GapsByService,
    /// <summary>Detailed list of orphan owners (limited)</summary>
    IEnumerable<OrphanLaptopOwnerDto> OrphanOwners,
    /// <summary>Debug info for troubleshooting</summary>
    WorkplaceGapDebugDto? Debug = null
);

/// <summary>
/// Debug information for troubleshooting gap analysis
/// </summary>
public record WorkplaceGapDebugDto(
    /// <summary>Total active workplaces</summary>
    int TotalActiveWorkplaces,
    /// <summary>Workplaces with CurrentOccupantEmail set</summary>
    int WorkplacesWithOccupant,
    /// <summary>Workplaces without CurrentOccupantEmail</summary>
    int WorkplacesWithoutOccupant,
    /// <summary>Sample laptop owner emails (first 3)</summary>
    IEnumerable<string> SampleLaptopOwners,
    /// <summary>Sample occupant emails (first 3)</summary>
    IEnumerable<string> SampleOccupantEmails
);

/// <summary>
/// Workplace gap statistics grouped by service/department
/// </summary>
public record WorkplaceGapByServiceDto(
    int? ServiceId,
    string? ServiceName,
    string? ServiceCode,
    int OwnersWithoutWorkplace,
    int TotalLaptopOwners
);

/// <summary>
/// Details about a laptop owner who doesn't have a PhysicalWorkplace
/// </summary>
public record OrphanLaptopOwnerDto(
    string OwnerEmail,
    string? OwnerName,
    string? JobTitle,
    string? OfficeLocation,
    int? ServiceId,
    string? ServiceName,
    int LaptopAssetId,
    string LaptopAssetCode,
    string? LaptopBrand,
    string? LaptopModel,
    string? LaptopSerialNumber
);

/// <summary>
/// Request DTO for auto-creating missing workplaces
/// </summary>
public record AutoCreateMissingWorkplacesDto(
    /// <summary>Default building ID for new workplaces (required)</summary>
    int DefaultBuildingId,
    /// <summary>Optional: only create for specific service IDs</summary>
    int[]? ServiceIds = null,
    /// <summary>Optional: limit number to create (default: 100)</summary>
    int MaxToCreate = 100,
    /// <summary>Workplace type for new workplaces (default: Laptop)</summary>
    WorkplaceType WorkplaceType = WorkplaceType.Laptop,
    /// <summary>Number of monitors for new workplaces (default: 2)</summary>
    int MonitorCount = 2,
    /// <summary>Whether new workplaces have docking stations (default: true)</summary>
    bool HasDockingStation = true
);

/// <summary>
/// Result of auto-creating missing workplaces
/// </summary>
public record AutoCreateWorkplacesResultDto(
    int TotalProcessed,
    int SuccessCount,
    int ErrorCount,
    IEnumerable<AutoCreateWorkplaceItemResult> Results
);

/// <summary>
/// Result for a single auto-created workplace
/// </summary>
public record AutoCreateWorkplaceItemResult(
    int? WorkplaceId,
    string WorkplaceCode,
    string WorkplaceName,
    string OwnerEmail,
    string? OwnerName,
    bool Success,
    string? ErrorMessage
);

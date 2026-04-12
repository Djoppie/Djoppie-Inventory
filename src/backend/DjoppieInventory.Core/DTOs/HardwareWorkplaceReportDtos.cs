namespace DjoppieInventory.Core.DTOs;

public class HardwareReportItemDto
{
    public int Id { get; set; }
    public string AssetCode { get; set; } = "";
    public string Name { get; set; } = "";
    public string AssetTypeName { get; set; } = "";
    public string? CategoryName { get; set; }
    public string? Brand { get; set; }
    public string? Model { get; set; }
    public string? SerialNumber { get; set; }
    public string Status { get; set; } = "";
    public string? OwnerName { get; set; }
    public string? OwnerEmail { get; set; }
    public string? ServiceName { get; set; }
    public string? BuildingName { get; set; }
    public string? Location { get; set; }
    public string? IntuneDeviceId { get; set; }
    public string? IntuneComplianceState { get; set; }
    public DateTime? IntuneLastSync { get; set; }
    public DateTime? PurchaseDate { get; set; }
    public DateTime? InstallationDate { get; set; }
    public DateTime? WarrantyExpiration { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class HardwareReportSummaryDto
{
    public int TotalAssets { get; set; }
    public Dictionary<string, int> ByStatus { get; set; } = new();
    public Dictionary<string, int> ByAssetType { get; set; } = new();
    public Dictionary<string, int> ByService { get; set; } = new();
}

public class WorkplaceReportItemDto
{
    public int Id { get; set; }
    public string Code { get; set; } = "";
    public string Name { get; set; } = "";
    public string? BuildingName { get; set; }
    public string? Floor { get; set; }
    public string? Room { get; set; }
    public string? OccupantName { get; set; }
    public string? OccupantEmail { get; set; }
    public string? ServiceName { get; set; }
    public bool IsOccupied { get; set; }
    public int EquipmentCount { get; set; }
    public List<WorkplaceEquipmentItemDto> Equipment { get; set; } = new();
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class WorkplaceEquipmentItemDto
{
    public int AssetId { get; set; }
    public string AssetCode { get; set; } = "";
    public string? AssetName { get; set; }
    public string EquipmentType { get; set; } = "";
    public string? Brand { get; set; }
    public string? Model { get; set; }
}

public class WorkplaceReportSummaryDto
{
    public int TotalWorkplaces { get; set; }
    public int OccupiedWorkplaces { get; set; }
    public int AvailableWorkplaces { get; set; }
    public int OccupancyRate { get; set; }
    public Dictionary<string, BuildingOccupancyData> ByBuilding { get; set; } = new();
}

public class BuildingOccupancyData
{
    public int Total { get; set; }
    public int Occupied { get; set; }
}

/// <summary>
/// DTO for asset change history items - each record represents one asset status or owner change
/// </summary>
public class AssetChangeHistoryItemDto
{
    public int Id { get; set; }
    public DateTime EventDate { get; set; }
    public int AssetId { get; set; }
    public string AssetCode { get; set; } = "";
    public string? AssetName { get; set; }
    public string? AssetTypeName { get; set; }
    public string? SerialNumber { get; set; }
    public string EventType { get; set; } = "";
    public string EventTypeDisplay { get; set; } = "";
    public string Description { get; set; } = "";
    public string? OldValue { get; set; }
    public string? NewValue { get; set; }
    public string? CurrentOwner { get; set; }
    public string? CurrentOwnerDisplayName { get; set; }
    public string? CurrentStatus { get; set; }
    public string? ServiceName { get; set; }
    public string? BuildingName { get; set; }
    public string? Location { get; set; }
    public string? WorkplaceCode { get; set; }
    public string? WorkplaceBuilding { get; set; }
    public string? WorkplaceService { get; set; }
    public string? WorkplaceRoom { get; set; }
    public string? PerformedBy { get; set; }
    public string? PerformedByEmail { get; set; }
    public string? Notes { get; set; }
}

/// <summary>
/// DTO for asset change history summary with asset-focused metrics
/// </summary>
public class AssetChangeHistorySummaryDto
{
    public int TotalChanges { get; set; }
    public int StatusChanges { get; set; }
    public int OwnerChanges { get; set; }
    public int LocationChanges { get; set; }
    public int UniqueAssetsChanged { get; set; }
    public int ActiveAssets { get; set; }
    public Dictionary<string, int> ByEventType { get; set; } = new();
    public Dictionary<string, int> ByService { get; set; } = new();
    public List<MonthlyCount> ByMonth { get; set; } = new();
}

public class MonthlyCount
{
    public string Month { get; set; } = "";
    public int Count { get; set; }
}

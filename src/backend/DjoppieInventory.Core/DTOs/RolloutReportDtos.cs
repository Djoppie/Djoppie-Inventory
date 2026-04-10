namespace DjoppieInventory.Core.DTOs;

/// <summary>
/// Complete rollout session report with overview, checklist, and unscheduled assets
/// </summary>
public record RolloutSessionReportDto
{
    public int SessionId { get; init; }
    public string SessionName { get; init; } = string.Empty;
    public DateTime StartDate { get; init; }
    public DateTime EndDate { get; init; }
    public string Status { get; init; } = string.Empty;
    public RolloutSessionOverviewDto Overview { get; init; } = new();
    public List<RolloutDayChecklistDto> DayChecklists { get; init; } = new();
    public List<UnscheduledAssetDto> UnscheduledAssets { get; init; } = new();
}

/// <summary>
/// Session overview with KPIs and breakdowns
/// </summary>
public record RolloutSessionOverviewDto
{
    // Workplace statistics
    public int TotalWorkplaces { get; init; }
    public int CompletedWorkplaces { get; init; }
    public int PendingWorkplaces { get; init; }
    public int InProgressWorkplaces { get; init; }
    public decimal CompletionPercentage { get; init; }

    // Asset statistics
    public int TotalNewAssets { get; init; }
    public int InstalledAssets { get; init; }
    public int OldAssetsDecommissioned { get; init; }
    public int QrCodesApplied { get; init; }
    public int MissingQrCodes { get; init; }

    // Breakdowns
    public List<RolloutSectorBreakdownDto> SectorBreakdown { get; init; } = new();
    public List<RolloutBuildingBreakdownDto> BuildingBreakdown { get; init; } = new();
    public List<RolloutProgressTimelineDto> Timeline { get; init; } = new();
}

/// <summary>
/// Sector breakdown with services
/// </summary>
public record RolloutSectorBreakdownDto
{
    public int SectorId { get; init; }
    public string SectorName { get; init; } = string.Empty;
    public int TotalWorkplaces { get; init; }
    public int CompletedWorkplaces { get; init; }
    public decimal CompletionPercentage { get; init; }
    public List<RolloutServiceBreakdownDto> Services { get; init; } = new();
}

/// <summary>
/// Service breakdown
/// </summary>
public record RolloutServiceBreakdownDto
{
    public int ServiceId { get; init; }
    public string ServiceName { get; init; } = string.Empty;
    public int TotalWorkplaces { get; init; }
    public int CompletedWorkplaces { get; init; }
    public decimal CompletionPercentage { get; init; }
}

/// <summary>
/// Building breakdown
/// </summary>
public record RolloutBuildingBreakdownDto
{
    public int BuildingId { get; init; }
    public string BuildingName { get; init; } = string.Empty;
    public int TotalWorkplaces { get; init; }
    public int CompletedWorkplaces { get; init; }
    public decimal CompletionPercentage { get; init; }
}

/// <summary>
/// Progress timeline point
/// </summary>
public record RolloutProgressTimelineDto
{
    public DateTime Date { get; init; }
    public int PlannedWorkplaces { get; init; }
    public int CompletedWorkplaces { get; init; }
    public int CumulativeCompleted { get; init; }
}

/// <summary>
/// Day checklist with workplaces
/// </summary>
public record RolloutDayChecklistDto
{
    public int DayId { get; init; }
    public DateTime Date { get; init; }
    public string? Notes { get; init; }
    public int TotalWorkplaces { get; init; }
    public int CompletedWorkplaces { get; init; }
    public List<RolloutWorkplaceChecklistDto> Workplaces { get; init; } = new();
}

/// <summary>
/// Workplace checklist item
/// </summary>
public record RolloutWorkplaceChecklistDto
{
    public int WorkplaceId { get; init; }
    public string WorkplaceName { get; init; } = string.Empty;
    public string? Location { get; init; }
    public string? UserId { get; init; }
    public string? UserDisplayName { get; init; }
    public string? UserJobTitle { get; init; }
    public string ServiceName { get; init; } = string.Empty;
    public string BuildingName { get; init; } = string.Empty;
    public string Status { get; init; } = string.Empty;
    public DateTime? CompletedAt { get; init; }
    public string? Notes { get; init; }
    public bool HasMissingSerialNumbers { get; init; }
    public List<RolloutEquipmentRowDto> EquipmentRows { get; init; } = new();
}

/// <summary>
/// Equipment row for SWAP checklist (grouped by type: Desktop/Laptop, Docking)
/// </summary>
public record RolloutEquipmentRowDto
{
    /// <summary>
    /// Assignment ID for updating serial numbers
    /// </summary>
    public int AssignmentId { get; init; }

    public string EquipmentType { get; init; } = string.Empty; // "Desktop/Laptop", "Docking"
    public string Category { get; init; } = string.Empty; // UserAssigned, WorkplaceFixed

    // New asset info
    public int? NewAssetId { get; init; }
    public string? NewAssetCode { get; init; }
    public string? NewSerialNumber { get; init; }
    public bool? QrCodeApplied { get; init; }
    public bool IsSharedDevice { get; init; }

    // Old asset info (for swaps)
    public int? OldAssetId { get; init; }
    public string? OldAssetCode { get; init; }
    public string? OldSerialNumber { get; init; }

    // Status indicators
    public string Status { get; init; } = string.Empty;
    public bool IsMissingSerialNumber { get; init; }
}

/// <summary>
/// Old asset not yet scheduled in any rollout
/// </summary>
public record UnscheduledAssetDto
{
    public int AssetId { get; init; }
    public string AssetCode { get; init; } = string.Empty;
    public string? SerialNumber { get; init; }
    public string AssetTypeName { get; init; } = string.Empty;
    public string? PrimaryUserName { get; init; }
    public string? PrimaryUserId { get; init; }
    public string? ServiceName { get; init; }
    public DateTime? InstallationDate { get; init; }
    public int AgeInDays { get; init; }
    public string Priority { get; init; } = string.Empty; // High, Medium, Low
}

/// <summary>
/// Future swap/planning item
/// </summary>
public record FutureSwapDto
{
    public int WorkplaceId { get; init; }
    public int DayId { get; init; }
    public DateTime PlannedDate { get; init; }
    public string WorkplaceName { get; init; } = string.Empty;
    public string? UserId { get; init; }
    public string? UserDisplayName { get; init; }
    public string ServiceName { get; init; } = string.Empty;
    public string BuildingName { get; init; } = string.Empty;
    public string SwapType { get; init; } = string.Empty; // Onboarding, Offboarding, Swap
    public int NewAssetCount { get; init; }
    public int OldAssetCount { get; init; }
}

/// <summary>
/// Filter options for rollout reports
/// </summary>
public record RolloutReportFilterOptionsDto
{
    public List<FilterOptionDto> Services { get; init; } = new();
    public List<FilterOptionDto> Buildings { get; init; } = new();
    public List<FilterOptionDto> Statuses { get; init; } = new();
    public DateTime MinDate { get; init; }
    public DateTime MaxDate { get; init; }
}

/// <summary>
/// Filter option item
/// </summary>
public record FilterOptionDto
{
    public int Id { get; init; }
    public string Name { get; init; } = string.Empty;
    public int Count { get; init; }
}

/// <summary>
/// Excel export request
/// </summary>
public record RolloutExcelExportRequest
{
    public List<int>? ServiceIds { get; init; }
    public List<int>? BuildingIds { get; init; }
    public bool IncludeOverview { get; init; } = true;
    public bool IncludeSwapChecklist { get; init; } = true;
    public bool IncludeUnscheduledAssets { get; init; } = true;
    public bool IncludeSectorBreakdown { get; init; } = true;
}

// ===== SERIAL NUMBER MANAGEMENT =====

/// <summary>
/// Asset with missing or editable serial number in a rollout session
/// </summary>
public record RolloutAssetSerialDto
{
    public int AssetId { get; init; }
    public string AssetCode { get; init; } = string.Empty;
    public string? AssetName { get; init; }
    public string EquipmentType { get; init; } = string.Empty;
    public string? CurrentSerialNumber { get; init; }
    public string? Brand { get; init; }
    public string? Model { get; init; }
    public string WorkplaceName { get; init; } = string.Empty;
    public string? UserDisplayName { get; init; }
    public string ServiceName { get; init; } = string.Empty;
    public string BuildingName { get; init; } = string.Empty;
    public DateTime? Date { get; init; }
    public string Status { get; init; } = string.Empty; // Nieuw, InGebruik
    public bool IsMissingSerial { get; init; }
}

/// <summary>
/// Single serial number update request
/// </summary>
public record SerialNumberUpdateDto
{
    public int AssetId { get; init; }
    public string SerialNumber { get; init; } = string.Empty;
}

/// <summary>
/// Bulk serial number update request
/// </summary>
public record BulkSerialNumberUpdateRequest
{
    public List<SerialNumberUpdateDto> Updates { get; init; } = new();
}

/// <summary>
/// Result of bulk serial number update
/// </summary>
public record BulkSerialNumberUpdateResult
{
    public int SuccessCount { get; init; }
    public int FailedCount { get; init; }
    public List<string> Errors { get; init; } = new();
}

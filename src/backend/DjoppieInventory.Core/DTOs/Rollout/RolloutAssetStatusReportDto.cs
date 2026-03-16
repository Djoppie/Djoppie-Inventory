namespace DjoppieInventory.Core.DTOs.Rollout;

/// <summary>
/// DTO for comprehensive asset status change report for a rollout session.
/// Shows all assets that were deployed (Nieuw->InGebruik) or decommissioned (->UitDienst).
/// </summary>
public class RolloutAssetStatusReportDto
{
    public int SessionId { get; set; }
    public string SessionName { get; set; } = string.Empty;
    public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;

    // Summary statistics
    public int TotalAssetsDeployed { get; set; }        // Nieuw -> InGebruik
    public int TotalAssetsDecommissioned { get; set; }  // -> UitDienst
    public int TotalWorkplacesCompleted { get; set; }

    // Detailed records
    public List<RolloutAssetChangeDto> AssetChanges { get; set; } = new();

    // Group by day for overview
    public List<RolloutDayAssetSummaryDto> DaySummaries { get; set; } = new();
}

/// <summary>
/// Individual asset status change record
/// </summary>
public class RolloutAssetChangeDto
{
    public int AssetId { get; set; }
    public string AssetCode { get; set; } = string.Empty;
    public string? AssetName { get; set; }
    public string EquipmentType { get; set; } = string.Empty;
    public string? SerialNumber { get; set; }
    public string? Brand { get; set; }
    public string? Model { get; set; }

    // Status change
    public string OldStatus { get; set; } = string.Empty;
    public string NewStatus { get; set; } = string.Empty;
    /// <summary>
    /// Type of change: "InGebruik" for deployed assets, "UitDienst" for decommissioned
    /// </summary>
    public string ChangeType { get; set; } = string.Empty;

    // Workplace info
    public int WorkplaceId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string? UserEmail { get; set; }
    public string? Location { get; set; }
    public string? ServiceName { get; set; }

    // Day info
    public int DayId { get; set; }
    public int DayNumber { get; set; }
    public DateTime Date { get; set; }

    // Who performed it and when
    public string CompletedBy { get; set; } = string.Empty;
    public string? CompletedByEmail { get; set; }
    public DateTime CompletedAt { get; set; }
}

/// <summary>
/// Per-day asset summary for overview section
/// </summary>
public class RolloutDayAssetSummaryDto
{
    public int DayId { get; set; }
    public int DayNumber { get; set; }
    public DateTime Date { get; set; }
    public string? DayName { get; set; }

    public int AssetsDeployed { get; set; }
    public int AssetsDecommissioned { get; set; }
    public int WorkplacesCompleted { get; set; }

    // Per-workplace breakdown
    public List<RolloutWorkplaceAssetSummaryDto> WorkplaceSummaries { get; set; } = new();
}

/// <summary>
/// Per-workplace asset summary
/// </summary>
public class RolloutWorkplaceAssetSummaryDto
{
    public int WorkplaceId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string? Location { get; set; }

    public int AssetsDeployed { get; set; }
    public int AssetsDecommissioned { get; set; }

    public string CompletedBy { get; set; } = string.Empty;
    public DateTime? CompletedAt { get; set; }
}

namespace DjoppieInventory.Core.DTOs;

/// <summary>
/// Aggregated KPIs across all report domains for the Overview tab landing.
/// </summary>
public record OverviewKpiDto
{
    public OverviewAssetsKpi Assets { get; init; } = new();
    public OverviewRolloutsKpi Rollouts { get; init; } = new();
    public OverviewWorkplacesKpi Workplaces { get; init; } = new();
    public OverviewLeasingKpi Leasing { get; init; } = new();
    public OverviewIntuneKpi Intune { get; init; } = new();
    public OverviewActivityKpi Activity { get; init; } = new();
    public List<AttentionItemDto> Attention { get; init; } = new();
    public List<ActivityTrendPointDto> Trend { get; init; } = new();
}

public record OverviewAssetsKpi
{
    public int Total { get; init; }
    public int InUse { get; init; }
    public int Defect { get; init; }
    public decimal InUsePercentage { get; init; }
}

public record OverviewRolloutsKpi
{
    public int ActiveSessions { get; init; }
    public decimal AverageCompletionPercentage { get; init; }
    public int WorkplacesThisWeek { get; init; }
}

public record OverviewWorkplacesKpi
{
    public int Total { get; init; }
    public int Occupied { get; init; }
    public decimal OccupancyPercentage { get; init; }
}

public record OverviewLeasingKpi
{
    public int ActiveContracts { get; init; }
    public int ExpiringWithin60Days { get; init; }
}

public record OverviewIntuneKpi
{
    public int Enrolled { get; init; }
    public int Stale { get; init; } // last sync > 30 days
}

public record OverviewActivityKpi
{
    public int EventsLast7Days { get; init; }
}

public record AttentionItemDto
{
    public string Severity { get; init; } = "info"; // "error" | "warning" | "info"
    public string Category { get; init; } = string.Empty; // "action" | "upcoming"
    public string Message { get; init; } = string.Empty;
    public int Count { get; init; }
    public string DeepLinkUrl { get; init; } = string.Empty;
}

public record ActivityTrendPointDto
{
    public DateTime Date { get; init; }
    public int Onboarding { get; init; }
    public int Offboarding { get; init; }
    public int Swap { get; init; }
    public int Other { get; init; }
}

namespace DjoppieInventory.Core.DTOs;

/// <summary>
/// Per-asset row in the leasing report. Each row is one asset linked to a lease contract,
/// with the contract's PlannedLeaseEnd as the basis for the return-deadline thresholds.
/// </summary>
public record LeaseReportRowDto
{
    public required int AssetId { get; init; }
    public required string AssetCode { get; init; }
    public string? SerialNumber { get; init; }
    public string? Description { get; init; }
    public string? Brand { get; init; }
    public string? Model { get; init; }
    public string? AssetTypeName { get; init; }
    public string? Owner { get; init; }
    public string AssetStatus { get; init; } = string.Empty;

    public required int LeaseContractId { get; init; }
    public required string LeaseScheduleNumber { get; init; }
    public required string VendorName { get; init; }
    public string? Customer { get; init; }
    public string? ContractStatus { get; init; }
    public required DateTime PlannedLeaseEnd { get; init; }
    public required string LeaseStatus { get; init; }

    /// <summary>Days remaining until PlannedLeaseEnd (negative if overdue).</summary>
    public required int DaysRemaining { get; init; }

    /// <summary>
    /// Computed urgency bucket.
    /// "Active" (>= 90 days), "Yellow" (90–45), "Orange" (45–21), "Red" (&lt; 21 or expired),
    /// "Returned" / "Cancelled" / "None" if asset is no longer billed under this lease.
    /// </summary>
    public required string UrgencyBucket { get; init; }
}

/// <summary>
/// KPI summary for the leasing dashboard.
/// </summary>
public record LeaseReportSummaryDto
{
    public int TotalContracts { get; init; }
    public int ActiveAssets { get; init; }
    public int ReturnedAssets { get; init; }

    /// <summary>Active assets entering the 3-month warning window.</summary>
    public int YellowAssets { get; init; }

    /// <summary>Active assets entering the 1.5-month warning window.</summary>
    public int OrangeAssets { get; init; }

    /// <summary>Active assets within 3 weeks of end (or already overdue).</summary>
    public int RedAssets { get; init; }

    public int OverdueAssets { get; init; }

    public Dictionary<string, int> AssetsByVendor { get; init; } = new();
}

/// <summary>
/// Result of a CSV lease-import operation.
/// </summary>
public record LeaseImportResultDto
{
    public int ContractsCreated { get; init; }
    public int ContractsUpdated { get; init; }
    public int AssetsLinked { get; init; }
    public int AssetsUpdated { get; init; }
    public List<LeaseImportUnmatchedDto> UnmatchedSerials { get; init; } = new();
    public List<string> Errors { get; init; } = new();
}

public record LeaseImportUnmatchedDto
{
    public required string SerialNumber { get; init; }
    public string? Description { get; init; }
    public string? LeaseScheduleNumber { get; init; }
    public string? Reason { get; init; }
}

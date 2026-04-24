namespace DjoppieInventory.Core.DTOs;

/// <summary>
/// Summary counts powering the data-quality dashboard widget.
/// </summary>
public record DataQualitySummaryDto
{
    /// <summary>Total in-use assets in the system (the denominator for the warnings below).</summary>
    public int InUseAssetsTotal { get; init; }

    /// <summary>In-use assets with no PhysicalWorkplaceId. These show up as "no location" in reports.</summary>
    public int InUseAssetsWithoutWorkplace { get; init; }

    /// <summary>In-use assets with no EmployeeId FK (owner may or may not be filled as string).</summary>
    public int InUseAssetsWithoutEmployee { get; init; }

    /// <summary>Candidates for the Employee backfill: EmployeeId is null but Owner string is set.</summary>
    public int EmployeeBackfillCandidates { get; init; }

    /// <summary>Candidates for the Workplace backfill: PhysicalWorkplaceId is null but we can link via occupant.</summary>
    public int WorkplaceBackfillCandidates { get; init; }
}

/// <summary>
/// Result of running either backfill endpoint. In dry-run mode no changes are persisted.
/// </summary>
public record BackfillResultDto
{
    public bool DryRun { get; init; }

    /// <summary>Candidate assets scanned.</summary>
    public int Scanned { get; init; }

    /// <summary>Assets that were (or would be) updated.</summary>
    public int Matched { get; init; }

    /// <summary>Assets with no matching employee/workplace.</summary>
    public int Unmatched { get; init; }

    /// <summary>First ~25 matches, for user preview before committing.</summary>
    public List<BackfillSampleDto> Samples { get; init; } = new();
}

public record BackfillSampleDto
{
    public int AssetId { get; init; }
    public string AssetCode { get; init; } = string.Empty;
    public string? CurrentOwner { get; init; }
    public int? MatchedEmployeeId { get; init; }
    public string? MatchedEmployeeName { get; init; }
    public int? MatchedWorkplaceId { get; init; }
    public string? MatchedWorkplaceCode { get; init; }
}

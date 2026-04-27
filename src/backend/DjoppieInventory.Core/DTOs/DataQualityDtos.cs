namespace DjoppieInventory.Core.DTOs;

/// <summary>
/// Summary counts powering the data-quality dashboard widget. When the request
/// includes <c>categoryIds</c>, all counts are scoped to those asset categories.
/// </summary>
public record DataQualitySummaryDto
{
    /// <summary>Total in-use assets in the (optionally filtered) scope.</summary>
    public int InUseAssetsTotal { get; init; }

    /// <summary>In-use assets with no PhysicalWorkplaceId. These show up as "no location" in reports.</summary>
    public int InUseAssetsWithoutWorkplace { get; init; }

    /// <summary>In-use assets with no EmployeeId FK (owner may or may not be filled as string).</summary>
    public int InUseAssetsWithoutEmployee { get; init; }

    /// <summary>Candidates for the Employee backfill: EmployeeId is null but Owner string is set.</summary>
    public int EmployeeBackfillCandidates { get; init; }

    /// <summary>Candidates for the Workplace backfill: PhysicalWorkplaceId is null but we can link via occupant.</summary>
    public int WorkplaceBackfillCandidates { get; init; }

    /// <summary>Per-brand breakdown of in-use assets within the filtered scope, ordered by total descending.</summary>
    public List<BrandDataQualityDto> Brands { get; init; } = new();
}

/// <summary>
/// Per-brand counts within the in-use scope used for the dashboard breakdown chips.
/// </summary>
public record BrandDataQualityDto
{
    /// <summary>Brand name as stored on the asset; empty/null brands are bucketed as "(onbekend)".</summary>
    public string Brand { get; init; } = string.Empty;
    public int InUseTotal { get; init; }
    public int WithoutWorkplace { get; init; }
    public int WithoutEmployee { get; init; }
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

/// <summary>
/// Result of a name-normalization run (e.g. setting AssetName to a derived
/// value for a class of assets). Mirrors <see cref="BackfillResultDto"/> but
/// captures old/new name pairs in the samples.
/// </summary>
public record NameNormalizationResultDto
{
    public bool DryRun { get; init; }
    /// <summary>Total assets scanned within the rule's scope.</summary>
    public int Scanned { get; init; }
    /// <summary>Assets that were (or would be) renamed.</summary>
    public int Matched { get; init; }
    /// <summary>Assets already at the target name (no change needed).</summary>
    public int AlreadyCorrect { get; init; }
    /// <summary>Assets skipped because the inputs needed to derive the new name were missing (e.g. empty serial).</summary>
    public int Skipped { get; init; }
    /// <summary>First ~25 rename samples for user preview.</summary>
    public List<NameNormalizationSampleDto> Samples { get; init; } = new();
}

public record NameNormalizationSampleDto
{
    public int AssetId { get; init; }
    public string AssetCode { get; init; } = string.Empty;
    public string CurrentName { get; init; } = string.Empty;
    public string NewName { get; init; } = string.Empty;
    public string? SerialNumber { get; init; }
}

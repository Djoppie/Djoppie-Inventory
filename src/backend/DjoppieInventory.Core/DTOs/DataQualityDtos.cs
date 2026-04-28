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

    /// <summary>
    /// Workplace-fixed assets (anything other than laptops/desktops/PCs by AssetType.Code)
    /// that are wrongly linked to an Employee instead of a PhysicalWorkplace.
    /// Of these, the ones with a resolvable target workplace can be auto-fixed.
    /// </summary>
    public int MisalignedWorkplaceAssets { get; init; }

    /// <summary>Subset of <see cref="MisalignedWorkplaceAssets"/> that the auto-fix can resolve.</summary>
    public int MisalignedWorkplaceAssetsFixable { get; init; }

    /// <summary>
    /// User-assigned assets (laptops/desktops/PCs by AssetType.Code) that are
    /// wrongly anchored to a PhysicalWorkplace. Reported only — not auto-fixed.
    /// </summary>
    public int UserAssetsOnWorkplace { get; init; }

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

/// <summary>
/// Result of scanning / fixing assets that are misaligned: workplace-fixed
/// assets (not laptops / desktops / PCs) that are wrongly attached to an
/// Employee rather than a PhysicalWorkplace. The fix moves them to the
/// employee's current workplace and clears <c>Asset.EmployeeId</c>.
/// </summary>
public record MisalignedAssetResultDto
{
    public bool DryRun { get; init; }
    /// <summary>Total candidate assets matched by the scan.</summary>
    public int Scanned { get; init; }
    /// <summary>Assets that were (or would be) moved to a workplace.</summary>
    public int Moved { get; init; }
    /// <summary>Assets skipped because the linked employee has no current workplace.</summary>
    public int Skipped { get; init; }
    /// <summary>Per-row breakdown for the dry-run preview / commit log.</summary>
    public List<MisalignedAssetRowDto> Rows { get; init; } = new();
}

public record MisalignedAssetRowDto
{
    public int AssetId { get; init; }
    public string AssetCode { get; init; } = string.Empty;
    public string AssetName { get; init; } = string.Empty;
    public string? AssetTypeCode { get; init; }
    public string? AssetTypeName { get; init; }
    public int? EmployeeId { get; init; }
    public string? EmployeeName { get; init; }
    public int? TargetWorkplaceId { get; init; }
    public string? TargetWorkplaceCode { get; init; }
    public int? TargetBuildingId { get; init; }
    /// <summary>"move" = will be moved to TargetWorkplace, "skip" = no resolvable workplace.</summary>
    public string Action { get; init; } = "move";
}

/// <summary>
/// Read-only report: user-assigned assets (laptops / desktops / PCs) that
/// are wrongly anchored to a <c>PhysicalWorkplaceId</c>. No auto-fix because
/// the correct EmployeeId is ambiguous (could belong to current or previous occupant).
/// </summary>
public record UserAssetOnWorkplaceResultDto
{
    public int Total { get; init; }
    public List<UserAssetOnWorkplaceRowDto> Rows { get; init; } = new();
}

public record UserAssetOnWorkplaceRowDto
{
    public int AssetId { get; init; }
    public string AssetCode { get; init; } = string.Empty;
    public string AssetName { get; init; } = string.Empty;
    public string? AssetTypeCode { get; init; }
    public string? AssetTypeName { get; init; }
    public int? EmployeeId { get; init; }
    public string? EmployeeName { get; init; }
    public int PhysicalWorkplaceId { get; init; }
    public string PhysicalWorkplaceCode { get; init; } = string.Empty;
    public string? CurrentOccupantName { get; init; }
}

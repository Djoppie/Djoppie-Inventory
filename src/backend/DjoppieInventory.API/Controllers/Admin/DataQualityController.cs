using System.Security.Claims;
using DjoppieInventory.Core.DTOs;
using DjoppieInventory.Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DjoppieInventory.API.Controllers.Admin;

/// <summary>
/// Data-quality summary (dashboard widget) and one-shot backfill tools for
/// legacy Asset rows missing EmployeeId / PhysicalWorkplaceId. Kept under
/// /api/admin because these endpoints mutate production data.
/// </summary>
[ApiController]
[Route("api/admin/data-quality")]
[Authorize]
public class DataQualityController : ControllerBase
{
    private readonly DataQualityService _service;

    public DataQualityController(DataQualityService service)
    {
        _service = service;
    }

    /// <summary>
    /// Counts used by the dashboard "data quality" widget: how many in-use
    /// assets are missing a workplace, missing an owner, and how many can be
    /// fixed by the backfill endpoints. Pass repeated <c>categoryIds</c> and/or
    /// <c>assetTypeIds</c> query values (e.g. <c>?categoryIds=1&amp;assetTypeIds=4&amp;assetTypeIds=7</c>)
    /// to scope the counts and brand breakdown. Both filters AND-combine.
    /// </summary>
    [HttpGet("summary")]
    [ProducesResponseType(typeof(DataQualitySummaryDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<DataQualitySummaryDto>> GetSummary(
        [FromQuery(Name = "categoryIds")] int[]? categoryIds,
        [FromQuery(Name = "assetTypeIds")] int[]? assetTypeIds,
        CancellationToken ct)
        => Ok(await _service.GetSummaryAsync(categoryIds, assetTypeIds, ct));

    /// <summary>
    /// Match Asset.Owner strings to existing Employees and populate
    /// Asset.EmployeeId. Pass ?dryRun=true (default) to preview before
    /// committing; pass ?dryRun=false to actually save.
    /// </summary>
    [HttpPost("backfill/asset-employees")]
    [ProducesResponseType(typeof(BackfillResultDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<BackfillResultDto>> BackfillAssetEmployees(
        [FromQuery] bool dryRun = true,
        CancellationToken ct = default)
        => Ok(await _service.BackfillAssetEmployeeLinksAsync(dryRun, ct));

    /// <summary>
    /// For assets with EmployeeId but no PhysicalWorkplaceId, find the
    /// workplace whose current occupant matches the employee and wire it up.
    /// </summary>
    [HttpPost("backfill/asset-workplaces")]
    [ProducesResponseType(typeof(BackfillResultDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<BackfillResultDto>> BackfillAssetWorkplaces(
        [FromQuery] bool dryRun = true,
        CancellationToken ct = default)
        => Ok(await _service.BackfillAssetWorkplaceLinksAsync(dryRun, ct));

    /// <summary>
    /// Set <c>Asset.AssetName</c> to <c>DOCK-{SerialNumber}</c> for every
    /// docking-station asset (AssetType.Code = "DOCK") that has a serial
    /// number. Pass <c>?dryRun=true</c> (default) to preview before committing.
    /// </summary>
    [HttpPost("normalize-docking-names")]
    [ProducesResponseType(typeof(NameNormalizationResultDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<NameNormalizationResultDto>> NormalizeDockingNames(
        [FromQuery] bool dryRun = true,
        CancellationToken ct = default)
        => Ok(await _service.NormalizeDockingNamesAsync(dryRun, ct));

    /// <summary>
    /// Dry-run scan of workplace-fixed assets (NOT lap/desk/pc by AssetType.Code)
    /// that are wrongly attached to an Employee instead of a PhysicalWorkplace.
    /// Returns per-row preview with the proposed target workplace.
    /// </summary>
    [HttpGet("misaligned-workplace-assets")]
    [ProducesResponseType(typeof(MisalignedAssetResultDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<MisalignedAssetResultDto>> ScanMisalignedWorkplaceAssets(
        CancellationToken ct = default)
        => Ok(await _service.ScanMisalignedWorkplaceAssetsAsync(dryRun: true, performedBy: null, performedByEmail: null, ct));

    /// <summary>
    /// Apply the workplace-misalignment fix: for every fixable candidate, set
    /// <c>Asset.PhysicalWorkplaceId</c> to the linked employee's current
    /// workplace, clear <c>Asset.EmployeeId</c>, and write an
    /// <c>AssetEvent.OwnerChanged</c> audit row.
    /// </summary>
    [HttpPost("fix-misaligned-workplace-assets")]
    [ProducesResponseType(typeof(MisalignedAssetResultDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<MisalignedAssetResultDto>> FixMisalignedWorkplaceAssets(
        CancellationToken ct = default)
    {
        var performedBy = User.FindFirst(ClaimTypes.Name)?.Value
            ?? User.FindFirst("name")?.Value
            ?? User.FindFirst(ClaimTypes.GivenName)?.Value;
        var performedByEmail = User.FindFirst(ClaimTypes.Email)?.Value
            ?? User.FindFirst("preferred_username")?.Value
            ?? User.FindFirst(ClaimTypes.Upn)?.Value;

        return Ok(await _service.ScanMisalignedWorkplaceAssetsAsync(
            dryRun: false,
            performedBy: performedBy,
            performedByEmail: performedByEmail,
            ct));
    }

    /// <summary>
    /// Read-only report: user-assigned assets (laptops / desktops / PCs) that
    /// are wrongly anchored to a PhysicalWorkplace. No auto-fix is provided —
    /// users review and correct manually.
    /// </summary>
    [HttpGet("user-assets-on-workplace")]
    [ProducesResponseType(typeof(UserAssetOnWorkplaceResultDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<UserAssetOnWorkplaceResultDto>> ScanUserAssetsOnWorkplace(
        CancellationToken ct = default)
        => Ok(await _service.ScanUserAssetsOnWorkplaceAsync(ct));
}

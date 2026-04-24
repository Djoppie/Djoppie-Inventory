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
    /// fixed by the backfill endpoints.
    /// </summary>
    [HttpGet("summary")]
    [ProducesResponseType(typeof(DataQualitySummaryDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<DataQualitySummaryDto>> GetSummary(CancellationToken ct)
        => Ok(await _service.GetSummaryAsync(ct));

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
}

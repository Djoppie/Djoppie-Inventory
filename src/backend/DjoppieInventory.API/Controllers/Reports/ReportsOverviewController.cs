using DjoppieInventory.Core.DTOs;
using DjoppieInventory.Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DjoppieInventory.API.Controllers.Reports;

[ApiController]
[Route("api/reports")]
[Authorize]
public class ReportsOverviewController : ControllerBase
{
    private readonly ReportsOverviewService _overviewService;

    public ReportsOverviewController(ReportsOverviewService overviewService)
    {
        _overviewService = overviewService;
    }

    /// <summary>
    /// Returns aggregated KPIs across all report domains for the Overview dashboard.
    /// Optionally narrows the asset-typeable KPIs (assets / intune / activity /
    /// trend / attention) to the given asset types. Pass repeated
    /// <c>assetTypeIds</c> query values (e.g. <c>?assetTypeIds=4&amp;assetTypeIds=7</c>).
    /// Workplace, rollout and leasing KPIs always reflect the global state and
    /// ignore this filter.
    /// </summary>
    [HttpGet("overview")]
    [ProducesResponseType(typeof(OverviewKpiDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<OverviewKpiDto>> GetOverview(
        [FromQuery(Name = "assetTypeIds")] int[]? assetTypeIds,
        CancellationToken ct)
    {
        var result = await _overviewService.GetOverviewAsync(assetTypeIds, ct);
        return Ok(result);
    }
}

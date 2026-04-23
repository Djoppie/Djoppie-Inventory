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
    /// </summary>
    [HttpGet("overview")]
    [ProducesResponseType(typeof(OverviewKpiDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<OverviewKpiDto>> GetOverview(CancellationToken ct)
    {
        var result = await _overviewService.GetOverviewAsync(ct);
        return Ok(result);
    }
}

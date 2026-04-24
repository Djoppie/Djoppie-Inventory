using DjoppieInventory.Core.DTOs;
using DjoppieInventory.Core.Entities;
using DjoppieInventory.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DjoppieInventory.API.Controllers.Reports;

[ApiController]
[Route("api/reports/intune")]
[Authorize]
public class IntuneReportsController : ControllerBase
{
    private readonly ApplicationDbContext _db;

    public IntuneReportsController(ApplicationDbContext db)
    {
        _db = db;
    }

    [HttpGet("summary")]
    [ProducesResponseType(typeof(IntuneSummaryDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<IntuneSummaryDto>> GetSummary(CancellationToken ct)
    {
        // Load relevant asset fields (project to anonymous to avoid loading full entity)
        var assets = await _db.Assets.AsNoTracking()
            .Select(a => new
            {
                a.IntuneLastCheckIn,
                a.Status
            })
            .ToListAsync(ct);

        var staleThreshold = DateTime.UtcNow.AddDays(-30);
        var enrolled = assets.Count(a => a.IntuneLastCheckIn != null);
        var stale = assets.Count(a => a.IntuneLastCheckIn != null && a.IntuneLastCheckIn < staleThreshold);
        var unenrolled = assets.Count(a => a.IntuneLastCheckIn == null && a.Status != AssetStatus.UitDienst);

        // IntuneComplianceState property does not exist on Asset entity yet
        // Return zeros for compliance-related metrics
        return Ok(new IntuneSummaryDto
        {
            TotalEnrolled = enrolled,
            Compliant = 0,
            NonCompliant = 0,
            Stale = stale,
            Unenrolled = unenrolled,
            ErrorState = 0,
            ByCompliance = new Dictionary<string, int>(),
            RetrievedAt = DateTime.UtcNow
        });
    }
}

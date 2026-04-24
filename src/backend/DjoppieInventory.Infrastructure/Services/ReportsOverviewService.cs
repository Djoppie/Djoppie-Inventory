using DjoppieInventory.Core.DTOs;
using DjoppieInventory.Core.Entities;
using DjoppieInventory.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace DjoppieInventory.Infrastructure.Services;

public class ReportsOverviewService
{
    private readonly ApplicationDbContext _db;
    private readonly ILogger<ReportsOverviewService> _logger;

    public ReportsOverviewService(ApplicationDbContext db, ILogger<ReportsOverviewService> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task<OverviewKpiDto> GetOverviewAsync(CancellationToken ct = default)
    {
        // DbContext is not thread-safe. Firing these with Task.WhenAll on a single
        // shared DbContext throws InvalidOperationException ("A second operation was
        // started on this context instance") against real SQL Server. The EF InMemory
        // provider used in tests is more tolerant, which is why this shape passed CI
        // but failed in production. Run sequentially — total latency stays sub-second.
        var assets     = await ComputeAssetsKpiAsync(ct);
        var rollouts   = await ComputeRolloutsKpiAsync(ct);
        var workplaces = await ComputeWorkplacesKpiAsync(ct);
        var leasing    = await ComputeLeasingKpiAsync(ct);
        var intune     = await ComputeIntuneKpiAsync(ct);
        var activity   = await ComputeActivityKpiAsync(ct);
        var attention  = await ComputeAttentionAsync(ct);
        var trend      = await ComputeTrendAsync(ct);

        return new OverviewKpiDto
        {
            Assets     = assets,
            Rollouts   = rollouts,
            Workplaces = workplaces,
            Leasing    = leasing,
            Intune     = intune,
            Activity   = activity,
            Attention  = attention,
            Trend      = trend
        };
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Assets KPI
    // ──────────────────────────────────────────────────────────────────────────

    private async Task<OverviewAssetsKpi> ComputeAssetsKpiAsync(CancellationToken ct)
    {
        var counts = await _db.Assets.AsNoTracking()
            .GroupBy(a => a.Status)
            .Select(g => new { Status = g.Key, Count = g.Count() })
            .ToListAsync(ct);

        var total  = counts.Sum(c => c.Count);
        var inUse  = counts.FirstOrDefault(c => c.Status == AssetStatus.InGebruik)?.Count ?? 0;
        var defect = counts.FirstOrDefault(c => c.Status == AssetStatus.Defect)?.Count ?? 0;

        return new OverviewAssetsKpi
        {
            Total             = total,
            InUse             = inUse,
            Defect            = defect,
            InUsePercentage   = total == 0 ? 0m : Math.Round(100m * inUse / total, 1)
        };
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Workplaces KPI
    // ──────────────────────────────────────────────────────────────────────────

    private async Task<OverviewWorkplacesKpi> ComputeWorkplacesKpiAsync(CancellationToken ct)
    {
        // A workplace is occupied when CurrentOccupantEntraId is set (non-null, non-empty)
        var total    = await _db.PhysicalWorkplaces.AsNoTracking().CountAsync(ct);
        var occupied = await _db.PhysicalWorkplaces.AsNoTracking()
            .CountAsync(pw => pw.CurrentOccupantEntraId != null && pw.CurrentOccupantEntraId != "", ct);

        return new OverviewWorkplacesKpi
        {
            Total                = total,
            Occupied             = occupied,
            OccupancyPercentage  = total == 0 ? 0m : Math.Round(100m * occupied / total, 1)
        };
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Rollouts KPI
    // ──────────────────────────────────────────────────────────────────────────

    private async Task<OverviewRolloutsKpi> ComputeRolloutsKpiAsync(CancellationToken ct)
    {
        var today   = DateTime.UtcNow.Date;
        var weekEnd = today.AddDays(7);

        // Active sessions: Status == InProgress
        var activeSessions = await _db.RolloutSessions.AsNoTracking()
            .Where(s => s.Status == RolloutSessionStatus.InProgress)
            .Select(s => new
            {
                TotalWorkplaces     = s.Days.SelectMany(d => d.Workplaces).Count(),
                CompletedWorkplaces = s.Days.SelectMany(d => d.Workplaces)
                                           .Count(w => w.Status == RolloutWorkplaceStatus.Completed)
            })
            .ToListAsync(ct);

        var activeCount = activeSessions.Count;

        // Average completion % across active sessions
        decimal avgCompletion = 0m;
        if (activeCount > 0)
        {
            var completionValues = activeSessions.Select(s =>
                s.TotalWorkplaces == 0 ? 0m : 100m * s.CompletedWorkplaces / s.TotalWorkplaces);
            avgCompletion = Math.Round(completionValues.Average(), 1);
        }

        // Workplaces scheduled this week (Day.Date in [today, today+7))
        var workplacesThisWeek = await _db.RolloutWorkplaces.AsNoTracking()
            .CountAsync(w => w.RolloutDay.Date >= today && w.RolloutDay.Date < weekEnd, ct);

        return new OverviewRolloutsKpi
        {
            ActiveSessions               = activeCount,
            AverageCompletionPercentage  = avgCompletion,
            WorkplacesThisWeek           = workplacesThisWeek
        };
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Leasing KPI
    // ──────────────────────────────────────────────────────────────────────────

    private Task<OverviewLeasingKpi> ComputeLeasingKpiAsync(CancellationToken ct)
    {
        // TODO: implement when Lease entity is added
        return Task.FromResult(new OverviewLeasingKpi());
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Intune KPI
    // ──────────────────────────────────────────────────────────────────────────

    private async Task<OverviewIntuneKpi> ComputeIntuneKpiAsync(CancellationToken ct)
    {
        // Asset is considered enrolled in Intune when IntuneLastCheckIn is set.
        // Asset is stale when IntuneLastCheckIn is older than 30 days.
        var staleThreshold = DateTime.UtcNow.AddDays(-30);

        var enrolled = await _db.Assets.AsNoTracking()
            .CountAsync(a => a.IntuneLastCheckIn != null, ct);

        var stale = await _db.Assets.AsNoTracking()
            .CountAsync(a => a.IntuneLastCheckIn != null && a.IntuneLastCheckIn < staleThreshold, ct);

        return new OverviewIntuneKpi
        {
            Enrolled = enrolled,
            Stale    = stale
        };
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Activity KPI
    // ──────────────────────────────────────────────────────────────────────────

    private async Task<OverviewActivityKpi> ComputeActivityKpiAsync(CancellationToken ct)
    {
        var since = DateTime.UtcNow.AddDays(-7);
        var count = await _db.AssetEvents.AsNoTracking()
            .CountAsync(e => e.EventDate >= since, ct);

        return new OverviewActivityKpi { EventsLast7Days = count };
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Attention list
    // ──────────────────────────────────────────────────────────────────────────

    private async Task<List<AttentionItemDto>> ComputeAttentionAsync(CancellationToken ct)
    {
        var items = new List<AttentionItemDto>();

        var defectCount = await _db.Assets.AsNoTracking()
            .CountAsync(a => a.Status == AssetStatus.Defect, ct);

        if (defectCount > 0)
        {
            items.Add(new AttentionItemDto
            {
                Severity    = "error",
                Category    = "action",
                Message     = $"{defectCount} defecte assets",
                Count       = defectCount,
                DeepLinkUrl = "/reports?tab=assets&view=nu&status=Defect"
            });
        }

        var staleThreshold = DateTime.UtcNow.AddDays(-30);
        var staleCount = await _db.Assets.AsNoTracking()
            .CountAsync(a => a.IntuneLastCheckIn != null && a.IntuneLastCheckIn < staleThreshold, ct);

        if (staleCount > 0)
        {
            items.Add(new AttentionItemDto
            {
                Severity    = "warning",
                Category    = "action",
                Message     = $"{staleCount} devices niet gesynchroniseerd >30d",
                Count       = staleCount,
                DeepLinkUrl = "/reports?tab=intune"
            });
        }

        return items;
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Trend (last 30 days, per-day event counts by type)
    // ──────────────────────────────────────────────────────────────────────────

    private async Task<List<ActivityTrendPointDto>> ComputeTrendAsync(CancellationToken ct)
    {
        var since = DateTime.UtcNow.Date.AddDays(-29); // last 30 days inclusive

        var events = await _db.AssetEvents.AsNoTracking()
            .Where(e => e.EventDate >= since)
            .Select(e => new { e.EventDate, e.EventType })
            .ToListAsync(ct);

        var byDay = events
            .GroupBy(e => e.EventDate.Date)
            .Select(g => new ActivityTrendPointDto
            {
                Date        = g.Key,
                Onboarding  = g.Count(e => e.EventType == AssetEventType.DeviceOnboarded),
                Offboarding = g.Count(e => e.EventType == AssetEventType.DeviceOffboarded),
                Swap        = g.Count(e => e.EventType == AssetEventType.LaptopSwapped),
                Other       = g.Count(e =>
                    e.EventType != AssetEventType.DeviceOnboarded &&
                    e.EventType != AssetEventType.DeviceOffboarded &&
                    e.EventType != AssetEventType.LaptopSwapped)
            })
            .OrderBy(p => p.Date)
            .ToList();

        return byDay;
    }
}

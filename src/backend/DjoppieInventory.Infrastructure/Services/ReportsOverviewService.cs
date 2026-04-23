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
        var assets = await ComputeAssetsKpiAsync(ct);
        return new OverviewKpiDto { Assets = assets };
    }

    private async Task<OverviewAssetsKpi> ComputeAssetsKpiAsync(CancellationToken ct)
    {
        var counts = await _db.Assets.AsNoTracking()
            .GroupBy(a => a.Status)
            .Select(g => new { Status = g.Key, Count = g.Count() })
            .ToListAsync(ct);

        var total = counts.Sum(c => c.Count);
        var inUse = counts.FirstOrDefault(c => c.Status == AssetStatus.InGebruik)?.Count ?? 0;
        var defect = counts.FirstOrDefault(c => c.Status == AssetStatus.Defect)?.Count ?? 0;

        return new OverviewAssetsKpi
        {
            Total = total,
            InUse = inUse,
            Defect = defect,
            InUsePercentage = total == 0 ? 0m : Math.Round(100m * inUse / total, 1)
        };
    }
}

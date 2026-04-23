using DjoppieInventory.Core.DTOs;
using DjoppieInventory.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace DjoppieInventory.Infrastructure.Services;

/// <summary>
/// Service for generating employee-centric reports, including asset counts
/// and event timelines per employee.
/// </summary>
public class EmployeeReportsService
{
    private readonly ApplicationDbContext _db;

    public EmployeeReportsService(ApplicationDbContext db)
    {
        _db = db;
    }

    /// <summary>
    /// Returns all active employees with their asset counts and last event date.
    /// </summary>
    public async Task<List<EmployeeReportItemDto>> GetEmployeesAsync(CancellationToken ct = default)
    {
        // Load active employees with their service
        var employees = await _db.Employees.AsNoTracking()
            .Include(e => e.Service)
            .Where(e => e.IsActive)
            .ToListAsync(ct);

        // Load asset id → employeeId mapping
        var assetsByEmployee = await _db.Assets.AsNoTracking()
            .Where(a => a.EmployeeId != null)
            .Select(a => new { a.Id, a.EmployeeId })
            .ToListAsync(ct);

        // Build a lookup: employeeId → list of assetIds
        var assetIdsByEmployee = assetsByEmployee
            .GroupBy(a => a.EmployeeId!.Value)
            .ToDictionary(g => g.Key, g => g.Select(a => a.Id).ToHashSet());

        // All relevant asset IDs
        var allAssetIds = assetsByEmployee.Select(a => a.Id).ToHashSet();

        // Load last event dates per asset
        Dictionary<int, DateTime> lastEventByAsset = new();
        if (allAssetIds.Count > 0)
        {
            lastEventByAsset = await _db.AssetEvents.AsNoTracking()
                .Where(ev => allAssetIds.Contains(ev.AssetId))
                .GroupBy(ev => ev.AssetId)
                .Select(g => new { AssetId = g.Key, LastDate = g.Max(ev => ev.EventDate) })
                .ToDictionaryAsync(x => x.AssetId, x => x.LastDate, ct);
        }

        return employees.Select(e =>
        {
            assetIdsByEmployee.TryGetValue(e.Id, out var assetIds);
            assetIds ??= new HashSet<int>();

            DateTime? lastEventDate = assetIds.Count > 0
                ? assetIds
                    .Where(lastEventByAsset.ContainsKey)
                    .Select(id => (DateTime?)lastEventByAsset[id])
                    .OrderByDescending(d => d)
                    .FirstOrDefault()
                : null;

            return new EmployeeReportItemDto
            {
                EmployeeId = e.Id,
                DisplayName = e.DisplayName,
                JobTitle = e.JobTitle,
                ServiceName = e.Service?.Name,
                ServiceId = e.ServiceId,
                AssetCount = assetIds.Count,
                IntuneCompliant = 0,
                IntuneNonCompliant = 0,
                LastEventDate = lastEventDate
            };
        }).ToList();
    }

    /// <summary>
    /// Returns the asset event timeline for all assets assigned to the given employee,
    /// ordered most-recent first.
    /// </summary>
    public async Task<List<EmployeeTimelineItemDto>> GetEmployeeTimelineAsync(
        int employeeId,
        int take = 50,
        CancellationToken ct = default)
    {
        // Get asset IDs for this employee
        var assetIds = await _db.Assets.AsNoTracking()
            .Where(a => a.EmployeeId == employeeId)
            .Select(a => a.Id)
            .ToListAsync(ct);

        if (assetIds.Count == 0)
            return new List<EmployeeTimelineItemDto>();

        return await _db.AssetEvents.AsNoTracking()
            .Include(ev => ev.Asset)
            .Where(ev => assetIds.Contains(ev.AssetId))
            .OrderByDescending(ev => ev.EventDate)
            .Take(take)
            .Select(ev => new EmployeeTimelineItemDto
            {
                EventId = ev.Id,
                EventDate = ev.EventDate,
                EventType = ev.EventType.ToString(),
                EventTypeDisplay = ev.EventType.ToString(),
                Description = ev.Description ?? string.Empty,
                AssetId = ev.AssetId,
                AssetCode = ev.Asset != null ? ev.Asset.AssetCode : string.Empty,
                OldValue = ev.OldValue,
                NewValue = ev.NewValue
            })
            .ToListAsync(ct);
    }
}

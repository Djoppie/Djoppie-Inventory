using DjoppieInventory.Core.DTOs;
using DjoppieInventory.Core.Entities;
using DjoppieInventory.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace DjoppieInventory.Infrastructure.Services;

/// <summary>
/// One-shot data-repair tooling for legacy Asset rows whose EmployeeId and/or
/// PhysicalWorkplaceId were never populated (the FK fields are present in the
/// schema but the deployment/rollout write-paths historically did not set them).
///
/// Each backfill method supports a dry-run preview before committing changes.
/// </summary>
public class DataQualityService
{
    private readonly ApplicationDbContext _db;
    private readonly ILogger<DataQualityService> _logger;
    private const int SampleLimit = 25;

    public DataQualityService(ApplicationDbContext db, ILogger<DataQualityService> logger)
    {
        _db = db;
        _logger = logger;
    }

    /// <summary>
    /// Counts the data-quality metrics powering the dashboard widget.
    /// </summary>
    public async Task<DataQualitySummaryDto> GetSummaryAsync(CancellationToken ct = default)
    {
        var inUse = _db.Assets.AsNoTracking().Where(a => a.Status == AssetStatus.InGebruik);

        var total = await inUse.CountAsync(ct);
        var noWorkplace = await inUse.CountAsync(a => a.PhysicalWorkplaceId == null, ct);
        var noEmployee = await inUse.CountAsync(a => a.EmployeeId == null, ct);

        // Employee backfill candidates: EmployeeId null, but Owner string is set.
        var empCandidates = await inUse.CountAsync(a =>
            a.EmployeeId == null && a.Owner != null && a.Owner != "", ct);

        // Workplace backfill candidates: PhysicalWorkplaceId null, but we have
        // an EmployeeId whose workplace is known via occupant link. We only
        // count the upper bound here; the actual match is done in the backfill.
        var empIdsOfCandidates = await inUse
            .Where(a => a.PhysicalWorkplaceId == null && a.EmployeeId != null)
            .Select(a => a.EmployeeId!.Value)
            .Distinct()
            .ToListAsync(ct);

        var occupantEntraIds = empIdsOfCandidates.Count == 0
            ? new List<string>()
            : await _db.Employees.AsNoTracking()
                .Where(e => empIdsOfCandidates.Contains(e.Id) && e.EntraId != null && e.EntraId != "")
                .Select(e => e.EntraId)
                .ToListAsync(ct);

        var wpCandidates = occupantEntraIds.Count == 0 ? 0 : await _db.PhysicalWorkplaces.AsNoTracking()
            .CountAsync(w => w.CurrentOccupantEntraId != null
                          && occupantEntraIds.Contains(w.CurrentOccupantEntraId), ct);

        return new DataQualitySummaryDto
        {
            InUseAssetsTotal = total,
            InUseAssetsWithoutWorkplace = noWorkplace,
            InUseAssetsWithoutEmployee = noEmployee,
            EmployeeBackfillCandidates = empCandidates,
            WorkplaceBackfillCandidates = wpCandidates,
        };
    }

    /// <summary>
    /// Match <c>Asset.Owner</c> strings to <c>Employee.UserPrincipalName</c> /
    /// <c>Employee.DisplayName</c> (case-insensitive) and populate
    /// <c>Asset.EmployeeId</c>. Assets with no match stay unchanged.
    /// </summary>
    public async Task<BackfillResultDto> BackfillAssetEmployeeLinksAsync(bool dryRun, CancellationToken ct = default)
    {
        var employees = await _db.Employees.AsNoTracking()
            .Where(e => e.IsActive)
            .Select(e => new { e.Id, e.UserPrincipalName, e.DisplayName })
            .ToListAsync(ct);

        var empIdByUpn = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
        var empIdByName = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
        var empNameById = new Dictionary<int, string>();
        foreach (var e in employees)
        {
            empNameById[e.Id] = e.DisplayName;
            if (!string.IsNullOrWhiteSpace(e.UserPrincipalName)) empIdByUpn.TryAdd(e.UserPrincipalName, e.Id);
            if (!string.IsNullOrWhiteSpace(e.DisplayName)) empIdByName.TryAdd(e.DisplayName, e.Id);
        }

        // Candidates: EmployeeId null, Owner string present.
        var candidates = await _db.Assets
            .Where(a => a.EmployeeId == null && a.Owner != null && a.Owner != "")
            .ToListAsync(ct);

        int matched = 0;
        int unmatched = 0;
        var samples = new List<BackfillSampleDto>();

        foreach (var asset in candidates)
        {
            int? empId = null;
            var owner = asset.Owner!.Trim();
            if (empIdByUpn.TryGetValue(owner, out var upnMatch)) empId = upnMatch;
            else if (empIdByName.TryGetValue(owner, out var nameMatch)) empId = nameMatch;

            if (empId.HasValue)
            {
                matched++;
                if (samples.Count < SampleLimit)
                {
                    samples.Add(new BackfillSampleDto
                    {
                        AssetId = asset.Id,
                        AssetCode = asset.AssetCode,
                        CurrentOwner = asset.Owner,
                        MatchedEmployeeId = empId,
                        MatchedEmployeeName = empNameById.GetValueOrDefault(empId.Value),
                    });
                }
                if (!dryRun) asset.EmployeeId = empId;
            }
            else
            {
                unmatched++;
            }
        }

        if (!dryRun && matched > 0)
        {
            await _db.SaveChangesAsync(ct);
            _logger.LogInformation("Backfilled EmployeeId on {Count} assets", matched);
        }

        return new BackfillResultDto
        {
            DryRun = dryRun,
            Scanned = candidates.Count,
            Matched = matched,
            Unmatched = unmatched,
            Samples = samples,
        };
    }

    /// <summary>
    /// For assets that have an EmployeeId but no PhysicalWorkplaceId, find
    /// a workplace whose <c>CurrentOccupantEntraId</c> matches that employee
    /// and wire it up.
    /// </summary>
    public async Task<BackfillResultDto> BackfillAssetWorkplaceLinksAsync(bool dryRun, CancellationToken ct = default)
    {
        // Pre-compute workplace lookup keyed by occupant EntraId.
        var workplaces = await _db.PhysicalWorkplaces.AsNoTracking()
            .Where(w => w.CurrentOccupantEntraId != null && w.CurrentOccupantEntraId != "")
            .Select(w => new { w.Id, w.Code, w.CurrentOccupantEntraId })
            .ToListAsync(ct);
        var wpByEntraId = new Dictionary<string, (int Id, string Code)>(StringComparer.Ordinal);
        foreach (var w in workplaces.OrderBy(w => w.Id))
            wpByEntraId.TryAdd(w.CurrentOccupantEntraId!, (w.Id, w.Code));

        // Employee.Id → EntraId for candidates.
        var empEntraIdById = await _db.Employees.AsNoTracking()
            .Where(e => e.EntraId != null && e.EntraId != "")
            .ToDictionaryAsync(e => e.Id, e => e.EntraId, ct);

        var candidates = await _db.Assets
            .Where(a => a.PhysicalWorkplaceId == null && a.EmployeeId != null)
            .ToListAsync(ct);

        int matched = 0;
        int unmatched = 0;
        var samples = new List<BackfillSampleDto>();

        foreach (var asset in candidates)
        {
            if (!empEntraIdById.TryGetValue(asset.EmployeeId!.Value, out var entraId)
                || !wpByEntraId.TryGetValue(entraId, out var wp))
            {
                unmatched++;
                continue;
            }

            matched++;
            if (samples.Count < SampleLimit)
            {
                samples.Add(new BackfillSampleDto
                {
                    AssetId = asset.Id,
                    AssetCode = asset.AssetCode,
                    MatchedEmployeeId = asset.EmployeeId,
                    MatchedWorkplaceId = wp.Id,
                    MatchedWorkplaceCode = wp.Code,
                });
            }
            if (!dryRun) asset.PhysicalWorkplaceId = wp.Id;
        }

        if (!dryRun && matched > 0)
        {
            await _db.SaveChangesAsync(ct);
            _logger.LogInformation("Backfilled PhysicalWorkplaceId on {Count} assets", matched);
        }

        return new BackfillResultDto
        {
            DryRun = dryRun,
            Scanned = candidates.Count,
            Matched = matched,
            Unmatched = unmatched,
            Samples = samples,
        };
    }
}

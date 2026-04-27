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
    /// Counts the data-quality metrics powering the dashboard widget. The
    /// scope can be narrowed by <paramref name="categoryIds"/> (matching
    /// <c>AssetType.CategoryId</c>) and/or <paramref name="assetTypeIds"/>
    /// (matching <c>Asset.AssetTypeId</c>). Both filters AND-combine when set.
    /// </summary>
    public async Task<DataQualitySummaryDto> GetSummaryAsync(
        int[]? categoryIds = null,
        int[]? assetTypeIds = null,
        CancellationToken ct = default)
    {
        var inUse = _db.Assets.AsNoTracking().Where(a => a.Status == AssetStatus.InGebruik);

        if (categoryIds is { Length: > 0 })
        {
            inUse = inUse.Where(a =>
                a.AssetType != null
                && a.AssetType.CategoryId != null
                && categoryIds.Contains(a.AssetType.CategoryId.Value));
        }

        if (assetTypeIds is { Length: > 0 })
        {
            inUse = inUse.Where(a =>
                a.AssetTypeId != null && assetTypeIds.Contains(a.AssetTypeId.Value));
        }

        var total = await inUse.CountAsync(ct);
        var noWorkplace = await inUse.CountAsync(a => a.PhysicalWorkplaceId == null, ct);
        var noEmployee = await inUse.CountAsync(a => a.EmployeeId == null, ct);

        // Employee backfill candidates: EmployeeId null, but Owner string is set.
        var empCandidates = await inUse.CountAsync(a =>
            a.EmployeeId == null && a.Owner != null && a.Owner != "", ct);

        // Workplace backfill candidates: PhysicalWorkplaceId null AND we have a
        // route to a workplace. Two routes are supported:
        //   (A) slot-route: asset.Id appears in PhysicalWorkplace.{Docking,
        //       Monitor1..3,Keyboard,Mouse}AssetId — no EmployeeId required.
        //   (B) occupant-route: asset.EmployeeId resolves to an Employee whose
        //       EntraId matches PhysicalWorkplace.CurrentOccupantEntraId.
        // We project minimal candidate data and resolve in-memory so the count
        // matches what the actual backfill will achieve (no double-counting).
        var slotAssetIds = await GetSlotAssetIdsAsync(ct);
        var wpByEntraId = await BuildWorkplaceByEntraIdLookupAsync(ct);
        var empEntraIdById = await BuildEmployeeEntraIdLookupAsync(ct);

        var noWpCandidates = await inUse
            .Where(a => a.PhysicalWorkplaceId == null)
            .Select(a => new { a.Id, a.EmployeeId })
            .ToListAsync(ct);

        var wpCandidates = noWpCandidates.Count(c =>
            slotAssetIds.Contains(c.Id)
            || (c.EmployeeId != null
                && empEntraIdById.TryGetValue(c.EmployeeId.Value, out var entra)
                && wpByEntraId.ContainsKey(entra)));

        // Brand breakdown: project minimal columns then aggregate in-memory so we
        // can normalize null/empty/whitespace brand names into a single bucket
        // without tripping over provider-specific SQL.
        var brandRaw = await inUse
            .Select(a => new
            {
                a.Brand,
                NoWorkplace = a.PhysicalWorkplaceId == null,
                NoEmployee = a.EmployeeId == null,
            })
            .ToListAsync(ct);

        const string unknownBrand = "(onbekend)";
        var brands = brandRaw
            .GroupBy(x => string.IsNullOrWhiteSpace(x.Brand) ? unknownBrand : x.Brand!.Trim())
            .Select(g => new BrandDataQualityDto
            {
                Brand = g.Key,
                InUseTotal = g.Count(),
                WithoutWorkplace = g.Count(x => x.NoWorkplace),
                WithoutEmployee = g.Count(x => x.NoEmployee),
            })
            .OrderByDescending(b => b.InUseTotal)
            .ThenBy(b => b.Brand)
            .ToList();

        return new DataQualitySummaryDto
        {
            InUseAssetsTotal = total,
            InUseAssetsWithoutWorkplace = noWorkplace,
            InUseAssetsWithoutEmployee = noEmployee,
            EmployeeBackfillCandidates = empCandidates,
            WorkplaceBackfillCandidates = wpCandidates,
            Brands = brands,
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
    /// Populate <c>Asset.PhysicalWorkplaceId</c> (and <c>BuildingId</c>) for
    /// assets where it is currently null. Two routes are tried in order:
    ///   1. Slot-route: asset.Id appears in <c>PhysicalWorkplace.{Docking,
    ///      Monitor1..3,Keyboard,Mouse}AssetId</c> — no Employee link required.
    ///   2. Occupant-route: <c>Asset.EmployeeId</c> resolves to an Employee
    ///      whose EntraId matches <c>PhysicalWorkplace.CurrentOccupantEntraId</c>.
    /// </summary>
    public async Task<BackfillResultDto> BackfillAssetWorkplaceLinksAsync(bool dryRun, CancellationToken ct = default)
    {
        var slotMap = await GetSlotWorkplaceMapAsync(ct);
        var wpByEntraId = await BuildWorkplaceByEntraIdLookupAsync(ct);
        var empEntraIdById = await BuildEmployeeEntraIdLookupAsync(ct);

        var candidates = await _db.Assets
            .Where(a => a.PhysicalWorkplaceId == null)
            .ToListAsync(ct);

        int matched = 0;
        int unmatched = 0;
        var samples = new List<BackfillSampleDto>();

        foreach (var asset in candidates)
        {
            (int Id, string Code, int? BuildingId)? wp = null;

            // Route 1: slot-based (no employee link required)
            if (slotMap.TryGetValue(asset.Id, out var slotWp))
            {
                wp = slotWp;
            }
            // Route 2: occupant-based (via Asset.EmployeeId → Employee.EntraId)
            else if (asset.EmployeeId != null
                     && empEntraIdById.TryGetValue(asset.EmployeeId.Value, out var entraId)
                     && wpByEntraId.TryGetValue(entraId, out var occWp))
            {
                wp = occWp;
            }

            if (!wp.HasValue)
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
                    MatchedWorkplaceId = wp.Value.Id,
                    MatchedWorkplaceCode = wp.Value.Code,
                });
            }
            if (!dryRun)
            {
                asset.PhysicalWorkplaceId = wp.Value.Id;
                if (wp.Value.BuildingId.HasValue) asset.BuildingId = wp.Value.BuildingId;
            }
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

    // ---------------------------------------------------------------- Helpers

    /// <summary>
    /// Returns the set of asset IDs currently referenced by any equipment slot
    /// on a PhysicalWorkplace. Used to short-circuit workplace-resolution
    /// without needing an Asset.EmployeeId.
    /// </summary>
    private async Task<HashSet<int>> GetSlotAssetIdsAsync(CancellationToken ct)
    {
        var slotRows = await _db.PhysicalWorkplaces.AsNoTracking()
            .Select(w => new
            {
                w.DockingStationAssetId,
                w.Monitor1AssetId,
                w.Monitor2AssetId,
                w.Monitor3AssetId,
                w.KeyboardAssetId,
                w.MouseAssetId,
            })
            .ToListAsync(ct);

        var ids = new HashSet<int>();
        foreach (var w in slotRows)
        {
            if (w.DockingStationAssetId.HasValue) ids.Add(w.DockingStationAssetId.Value);
            if (w.Monitor1AssetId.HasValue) ids.Add(w.Monitor1AssetId.Value);
            if (w.Monitor2AssetId.HasValue) ids.Add(w.Monitor2AssetId.Value);
            if (w.Monitor3AssetId.HasValue) ids.Add(w.Monitor3AssetId.Value);
            if (w.KeyboardAssetId.HasValue) ids.Add(w.KeyboardAssetId.Value);
            if (w.MouseAssetId.HasValue) ids.Add(w.MouseAssetId.Value);
        }
        return ids;
    }

    /// <summary>
    /// Build a lookup from asset.Id to the workplace that hosts it via an
    /// equipment slot. The first workplace wins if (improbably) the same asset
    /// appears in multiple slots — preferring lower workplace IDs for stability.
    /// </summary>
    private async Task<Dictionary<int, (int Id, string Code, int? BuildingId)>> GetSlotWorkplaceMapAsync(CancellationToken ct)
    {
        var slotRows = await _db.PhysicalWorkplaces.AsNoTracking()
            .OrderBy(w => w.Id)
            .Select(w => new
            {
                w.Id,
                w.Code,
                w.BuildingId,
                w.DockingStationAssetId,
                w.Monitor1AssetId,
                w.Monitor2AssetId,
                w.Monitor3AssetId,
                w.KeyboardAssetId,
                w.MouseAssetId,
            })
            .ToListAsync(ct);

        var map = new Dictionary<int, (int Id, string Code, int? BuildingId)>();
        foreach (var w in slotRows)
        {
            void Add(int? assetId)
            {
                if (assetId.HasValue) map.TryAdd(assetId.Value, (w.Id, w.Code, w.BuildingId));
            }
            Add(w.DockingStationAssetId);
            Add(w.Monitor1AssetId);
            Add(w.Monitor2AssetId);
            Add(w.Monitor3AssetId);
            Add(w.KeyboardAssetId);
            Add(w.MouseAssetId);
        }
        return map;
    }

    /// <summary>
    /// Map of EntraId -> workplace (id/code/buildingId) via
    /// <c>PhysicalWorkplace.CurrentOccupantEntraId</c>.
    /// </summary>
    private async Task<Dictionary<string, (int Id, string Code, int? BuildingId)>> BuildWorkplaceByEntraIdLookupAsync(CancellationToken ct)
    {
        var rows = await _db.PhysicalWorkplaces.AsNoTracking()
            .Where(w => w.CurrentOccupantEntraId != null && w.CurrentOccupantEntraId != "")
            .OrderBy(w => w.Id)
            .Select(w => new { w.Id, w.Code, w.BuildingId, w.CurrentOccupantEntraId })
            .ToListAsync(ct);
        var map = new Dictionary<string, (int Id, string Code, int? BuildingId)>(StringComparer.Ordinal);
        foreach (var w in rows)
        {
            map.TryAdd(w.CurrentOccupantEntraId!, (w.Id, w.Code, w.BuildingId));
        }
        return map;
    }

    /// <summary>
    /// Map of Employee.Id -> Employee.EntraId for employees with a non-empty EntraId.
    /// </summary>
    private async Task<Dictionary<int, string>> BuildEmployeeEntraIdLookupAsync(CancellationToken ct)
    {
        return await _db.Employees.AsNoTracking()
            .Where(e => e.EntraId != null && e.EntraId != "")
            .ToDictionaryAsync(e => e.Id, e => e.EntraId!, ct);
    }
}

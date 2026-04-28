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

        // Misaligned counts: workplace-fixed assets (NOT lap/desk/pc) that are
        // attached to an Employee instead of a Workplace. We need the AssetType
        // code to filter, so project the (id, EmployeeId, AssetType.Code) tuple
        // and resolve in-memory; same scope as the rest of GetSummary (in-use,
        // category/type filters apply).
        var misalignedRaw = await inUse
            .Where(a => a.EmployeeId != null)
            .Select(a => new { a.Id, a.EmployeeId, TypeCode = a.AssetType != null ? a.AssetType.Code : null })
            .ToListAsync(ct);
        var misaligned = misalignedRaw.Where(r => IsWorkplaceFixedTypeCode(r.TypeCode)).ToList();
        var misalignedFixable = misaligned.Count(r =>
            r.EmployeeId != null
            && empEntraIdById.TryGetValue(r.EmployeeId.Value, out var entraId)
            && wpByEntraId.ContainsKey(entraId));

        var userAssetsOnWorkplace = await inUse
            .Where(a => a.PhysicalWorkplaceId != null && a.AssetType != null && a.AssetType.Code != null)
            .Select(a => new { a.AssetType!.Code })
            .ToListAsync(ct);
        var userAssetsOnWorkplaceCount = userAssetsOnWorkplace.Count(x => IsUserAssignedTypeCode(x.Code));

        return new DataQualitySummaryDto
        {
            InUseAssetsTotal = total,
            InUseAssetsWithoutWorkplace = noWorkplace,
            InUseAssetsWithoutEmployee = noEmployee,
            EmployeeBackfillCandidates = empCandidates,
            WorkplaceBackfillCandidates = wpCandidates,
            MisalignedWorkplaceAssets = misaligned.Count,
            MisalignedWorkplaceAssetsFixable = misalignedFixable,
            UserAssetsOnWorkplace = userAssetsOnWorkplaceCount,
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

    /// <summary>
    /// Set <c>Asset.AssetName</c> to <c>DOCK-{SerialNumber}</c> for every
    /// docking-station asset that has a serial number. Skips dockings with no
    /// serial; counts those already at the target name as
    /// <see cref="NameNormalizationResultDto.AlreadyCorrect"/>.
    /// </summary>
    public async Task<NameNormalizationResultDto> NormalizeDockingNamesAsync(
        bool dryRun,
        CancellationToken ct = default)
    {
        var dockTypeIds = await _db.AssetTypes.AsNoTracking()
            .Where(t => t.Code != null && t.Code.ToLower() == "dock")
            .Select(t => t.Id)
            .ToListAsync(ct);

        if (dockTypeIds.Count == 0)
        {
            return new NameNormalizationResultDto { DryRun = dryRun };
        }

        var dockings = await _db.Assets
            .Where(a => a.AssetTypeId != null && dockTypeIds.Contains(a.AssetTypeId.Value))
            .ToListAsync(ct);

        int matched = 0;
        int alreadyCorrect = 0;
        int skipped = 0;
        var samples = new List<NameNormalizationSampleDto>();

        foreach (var asset in dockings)
        {
            var serial = asset.SerialNumber?.Trim() ?? string.Empty;
            if (string.IsNullOrEmpty(serial))
            {
                skipped++;
                continue;
            }

            var newName = $"DOCK-{serial}";
            if (string.Equals(asset.AssetName, newName, StringComparison.Ordinal))
            {
                alreadyCorrect++;
                continue;
            }

            matched++;
            if (samples.Count < SampleLimit)
            {
                samples.Add(new NameNormalizationSampleDto
                {
                    AssetId = asset.Id,
                    AssetCode = asset.AssetCode,
                    CurrentName = asset.AssetName,
                    NewName = newName,
                    SerialNumber = serial,
                });
            }

            if (!dryRun)
            {
                asset.AssetName = newName;
                asset.UpdatedAt = DateTime.UtcNow;
            }
        }

        if (!dryRun && matched > 0)
        {
            await _db.SaveChangesAsync(ct);
            _logger.LogInformation("Normalized {Count} docking station asset names to DOCK-{{serial}}", matched);
        }

        return new NameNormalizationResultDto
        {
            DryRun = dryRun,
            Scanned = dockings.Count,
            Matched = matched,
            AlreadyCorrect = alreadyCorrect,
            Skipped = skipped,
            Samples = samples,
        };
    }

    /// <summary>
    /// Scan (and optionally fix) workplace-fixed assets that are attached to
    /// an <c>Employee</c> instead of a <c>PhysicalWorkplace</c>. The fix moves
    /// the asset to the employee's current workplace and clears
    /// <c>EmployeeId</c>; assets whose employee has no current workplace are
    /// listed but skipped. Each commit writes an <c>AssetEvent.OwnerChanged</c>
    /// audit row attributed to <paramref name="performedBy"/> /
    /// <paramref name="performedByEmail"/>.
    /// </summary>
    public async Task<MisalignedAssetResultDto> ScanMisalignedWorkplaceAssetsAsync(
        bool dryRun,
        string? performedBy,
        string? performedByEmail,
        CancellationToken ct = default)
    {
        var wpByEntraId = await BuildWorkplaceByEntraIdLookupAsync(ct);
        var empEntraIdById = await BuildEmployeeEntraIdLookupAsync(ct);

        // Candidates: any asset (regardless of status) that has an EmployeeId
        // AND whose AssetType is workplace-fixed (NOT lap/desk/pc).
        var candidates = await _db.Assets
            .Include(a => a.AssetType)
            .Include(a => a.Employee)
            .Where(a => a.EmployeeId != null && a.AssetType != null)
            .ToListAsync(ct);

        candidates = candidates.Where(a => IsWorkplaceFixedTypeCode(a.AssetType!.Code)).ToList();

        var rows = new List<MisalignedAssetRowDto>(candidates.Count);
        int moved = 0;
        int skipped = 0;
        var now = DateTime.UtcNow;

        foreach (var asset in candidates)
        {
            (int Id, string Code, int? BuildingId)? target = null;
            if (asset.EmployeeId is int empId
                && empEntraIdById.TryGetValue(empId, out var entraId)
                && wpByEntraId.TryGetValue(entraId, out var wp))
            {
                target = wp;
            }

            var row = new MisalignedAssetRowDto
            {
                AssetId = asset.Id,
                AssetCode = asset.AssetCode,
                AssetName = asset.AssetName,
                AssetTypeCode = asset.AssetType?.Code,
                AssetTypeName = asset.AssetType?.Name,
                EmployeeId = asset.EmployeeId,
                EmployeeName = asset.Employee?.DisplayName,
                TargetWorkplaceId = target?.Id,
                TargetWorkplaceCode = target?.Code,
                TargetBuildingId = target?.BuildingId,
                Action = target.HasValue ? "move" : "skip",
            };
            rows.Add(row);

            if (target.HasValue)
            {
                moved++;
                if (!dryRun)
                {
                    var oldEmployeeName = asset.Employee?.DisplayName ?? asset.Owner ?? $"Employee #{asset.EmployeeId}";
                    asset.EmployeeId = null;
                    asset.PhysicalWorkplaceId = target.Value.Id;
                    if (target.Value.BuildingId.HasValue)
                    {
                        asset.BuildingId = target.Value.BuildingId;
                    }
                    asset.UpdatedAt = now;

                    _db.AssetEvents.Add(new AssetEvent
                    {
                        AssetId = asset.Id,
                        EventType = AssetEventType.OwnerChanged,
                        Description = $"Workplace-fixed asset moved from medewerker '{oldEmployeeName}' naar werkplek '{target.Value.Code}' via data-quality fix",
                        OldValue = oldEmployeeName,
                        NewValue = target.Value.Code,
                        PerformedBy = performedBy,
                        PerformedByEmail = performedByEmail,
                        EventDate = now,
                        CreatedAt = now,
                    });
                }
            }
            else
            {
                skipped++;
            }
        }

        if (!dryRun && moved > 0)
        {
            await _db.SaveChangesAsync(ct);
            _logger.LogInformation(
                "Misalignment fix: moved {Moved} workplace-fixed assets from employee→workplace (skipped {Skipped})",
                moved, skipped);
        }

        return new MisalignedAssetResultDto
        {
            DryRun = dryRun,
            Scanned = candidates.Count,
            Moved = moved,
            Skipped = skipped,
            Rows = rows,
        };
    }

    /// <summary>
    /// Read-only report listing user-assigned assets (laptops / desktops /
    /// PCs) that are wrongly anchored to a <c>PhysicalWorkplaceId</c>.
    /// Returned rows are not auto-fixed because the correct
    /// <c>EmployeeId</c> is not derivable safely.
    /// </summary>
    public async Task<UserAssetOnWorkplaceResultDto> ScanUserAssetsOnWorkplaceAsync(CancellationToken ct = default)
    {
        var rawCandidates = await _db.Assets
            .Include(a => a.AssetType)
            .Include(a => a.Employee)
            .Include(a => a.PhysicalWorkplace)
            .Where(a => a.PhysicalWorkplaceId != null && a.AssetType != null && a.AssetType.Code != null)
            .ToListAsync(ct);

        var filtered = rawCandidates.Where(a => IsUserAssignedTypeCode(a.AssetType!.Code)).ToList();

        var rows = filtered.Select(a => new UserAssetOnWorkplaceRowDto
        {
            AssetId = a.Id,
            AssetCode = a.AssetCode,
            AssetName = a.AssetName,
            AssetTypeCode = a.AssetType?.Code,
            AssetTypeName = a.AssetType?.Name,
            EmployeeId = a.EmployeeId,
            EmployeeName = a.Employee?.DisplayName,
            PhysicalWorkplaceId = a.PhysicalWorkplaceId!.Value,
            PhysicalWorkplaceCode = a.PhysicalWorkplace?.Code ?? string.Empty,
            CurrentOccupantName = a.PhysicalWorkplace?.CurrentOccupantName,
        }).ToList();

        return new UserAssetOnWorkplaceResultDto
        {
            Total = rows.Count,
            Rows = rows,
        };
    }

    // ---------------------------------------------------------------- Helpers

    /// <summary>
    /// True when the given AssetType code identifies a user-assigned device
    /// (laptop / desktop / PC) — by case-insensitive substring on
    /// <c>"lap"</c>, <c>"desk"</c>, or <c>"pc"</c>. A null/empty code is treated
    /// as workplace-fixed (conservative default).
    /// </summary>
    private static bool IsUserAssignedTypeCode(string? code)
    {
        if (string.IsNullOrWhiteSpace(code)) return false;
        var c = code.ToLowerInvariant();
        return c.Contains("lap") || c.Contains("desk") || c.Contains("pc");
    }

    private static bool IsWorkplaceFixedTypeCode(string? code) => !IsUserAssignedTypeCode(code);

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

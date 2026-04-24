using DjoppieInventory.Core.DTOs;
using DjoppieInventory.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace DjoppieInventory.Infrastructure.Services;

/// <summary>
/// Service for generating employee-centric reports, including asset counts
/// and event timelines per employee.
///
/// Asset → Employee matching uses three strategies in priority order because
/// legacy data may have populated only some of these links:
///   1. <see cref="Core.Entities.Asset.EmployeeId"/> foreign key (preferred, future-proof).
///   2. <see cref="Core.Entities.Asset.Owner"/> free-text string matched against
///      <see cref="Core.Entities.Employee.UserPrincipalName"/> or <c>DisplayName</c>
///      (case-insensitive) — catches assets created before the FK existed.
///   3. <see cref="Core.Entities.Asset.PhysicalWorkplaceId"/> resolved to the
///      workplace's current occupant via <c>CurrentOccupantEntraId</c>.
/// </summary>
public class EmployeeReportsService
{
    private readonly ApplicationDbContext _db;

    public EmployeeReportsService(ApplicationDbContext db)
    {
        _db = db;
    }

    /// <summary>
    /// Returns all active employees with their asset counts, primary laptop/desktop,
    /// and last event date.
    /// </summary>
    public async Task<List<EmployeeReportItemDto>> GetEmployeesAsync(CancellationToken ct = default)
    {
        // 1. Load active employees with their service.
        var employees = await _db.Employees.AsNoTracking()
            .Include(e => e.Service)
            .Where(e => e.IsActive)
            .ToListAsync(ct);

        // 2. Build case-insensitive lookup maps for Owner-string matching.
        // Duplicate keys are rare (same UPN/DisplayName across two active employees);
        // first-wins keeps behaviour deterministic without throwing.
        var empIdByUpn = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
        var empIdByName = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
        var empIdByEntraId = new Dictionary<string, int>(StringComparer.Ordinal);
        foreach (var e in employees)
        {
            if (!string.IsNullOrWhiteSpace(e.UserPrincipalName))
                empIdByUpn.TryAdd(e.UserPrincipalName, e.Id);
            if (!string.IsNullOrWhiteSpace(e.DisplayName))
                empIdByName.TryAdd(e.DisplayName, e.Id);
            if (!string.IsNullOrWhiteSpace(e.EntraId))
                empIdByEntraId.TryAdd(e.EntraId, e.Id);
        }

        // 3. Load physical workplaces and their current occupant, so we can resolve
        //    an Asset with only a PhysicalWorkplaceId to an employee AND expose the
        //    employee's primary workplace code in the report.
        var workplaceOccupants = await _db.PhysicalWorkplaces.AsNoTracking()
            .Where(w => w.CurrentOccupantEntraId != null)
            .Select(w => new { w.Id, w.Code, w.CurrentOccupantEntraId })
            .ToListAsync(ct);

        var empIdByWorkplaceId = new Dictionary<int, int>();
        // Primary workplace per employee: first occupant-match wins (ordered by workplace
        // Id ascending so duplicates are deterministic). An employee occupying multiple
        // workplaces is rare in practice.
        var workplaceByEmployeeId = new Dictionary<int, (int Id, string Code)>();
        foreach (var wp in workplaceOccupants.OrderBy(w => w.Id))
        {
            if (wp.CurrentOccupantEntraId != null
                && empIdByEntraId.TryGetValue(wp.CurrentOccupantEntraId, out var empId))
            {
                empIdByWorkplaceId[wp.Id] = empId;
                workplaceByEmployeeId.TryAdd(empId, (wp.Id, wp.Code));
            }
        }

        // 4. Load every asset that could possibly link to an employee.
        var assets = await _db.Assets.AsNoTracking()
            .Where(a => a.EmployeeId != null || a.Owner != null || a.PhysicalWorkplaceId != null)
            .Select(a => new AssetRow
            {
                Id = a.Id,
                AssetCode = a.AssetCode,
                SerialNumber = a.SerialNumber,
                EmployeeId = a.EmployeeId,
                Owner = a.Owner,
                PhysicalWorkplaceId = a.PhysicalWorkplaceId,
                AssetTypeName = a.AssetType != null ? a.AssetType.Name : null
            })
            .ToListAsync(ct);

        // 5. Resolve each asset to an employeeId using the three strategies.
        var assetToEmployee = new Dictionary<int, int>();
        foreach (var a in assets)
        {
            int? empId = null;

            if (a.EmployeeId.HasValue)
            {
                empId = a.EmployeeId.Value;
            }
            else if (!string.IsNullOrWhiteSpace(a.Owner))
            {
                if (empIdByUpn.TryGetValue(a.Owner, out var upnMatch))
                    empId = upnMatch;
                else if (empIdByName.TryGetValue(a.Owner, out var nameMatch))
                    empId = nameMatch;
            }

            if (!empId.HasValue
                && a.PhysicalWorkplaceId.HasValue
                && empIdByWorkplaceId.TryGetValue(a.PhysicalWorkplaceId.Value, out var wpMatch))
            {
                empId = wpMatch;
            }

            if (empId.HasValue)
                assetToEmployee[a.Id] = empId.Value;
        }

        // 6. Group asset ids by employeeId and keep per-asset details for lookup.
        var assetIdsByEmployee = assetToEmployee
            .GroupBy(kvp => kvp.Value)
            .ToDictionary(g => g.Key, g => g.Select(kvp => kvp.Key).ToHashSet());
        var assetRowById = assets.ToDictionary(a => a.Id, a => a);

        // 7. Load last event dates for all linked assets in one round-trip.
        var linkedAssetIds = assetToEmployee.Keys.ToHashSet();
        Dictionary<int, DateTime> lastEventByAsset = new();
        if (linkedAssetIds.Count > 0)
        {
            lastEventByAsset = await _db.AssetEvents.AsNoTracking()
                .Where(ev => linkedAssetIds.Contains(ev.AssetId))
                .GroupBy(ev => ev.AssetId)
                .Select(g => new { AssetId = g.Key, LastDate = g.Max(ev => ev.EventDate) })
                .ToDictionaryAsync(x => x.AssetId, x => x.LastDate, ct);
        }

        // 8. Project per-employee aggregates.
        return employees.Select(e =>
        {
            assetIdsByEmployee.TryGetValue(e.Id, out var assetIds);
            assetIds ??= new HashSet<int>();

            var primary = FindPrimaryDevices(assetIds, assetRowById);
            workplaceByEmployeeId.TryGetValue(e.Id, out var primaryWorkplace);

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
                WorkplaceId = primaryWorkplace.Id == 0 ? null : primaryWorkplace.Id,
                WorkplaceCode = primaryWorkplace.Code,
                AssetCount = assetIds.Count,
                PrimaryLaptopCode = primary.LaptopCode,
                PrimaryLaptopSerial = primary.LaptopSerial,
                PrimaryDesktopCode = primary.DesktopCode,
                PrimaryDesktopSerial = primary.DesktopSerial,
                IntuneCompliant = 0,
                IntuneNonCompliant = 0,
                LastEventDate = lastEventDate
            };
        }).ToList();
    }

    /// <summary>
    /// Returns the asset event timeline for all assets linked to the given employee,
    /// ordered most-recent first. Uses the same multi-strategy matching as GetEmployeesAsync.
    /// </summary>
    public async Task<List<EmployeeTimelineItemDto>> GetEmployeeTimelineAsync(
        int employeeId,
        int take = 50,
        CancellationToken ct = default)
    {
        var employee = await _db.Employees.AsNoTracking()
            .FirstOrDefaultAsync(e => e.Id == employeeId, ct);
        if (employee == null) return new List<EmployeeTimelineItemDto>();

        // Workplace IDs where this employee is the current occupant — enables
        // location-based asset matching.
        var myWorkplaceIds = string.IsNullOrWhiteSpace(employee.EntraId)
            ? new List<int>()
            : await _db.PhysicalWorkplaces.AsNoTracking()
                .Where(w => w.CurrentOccupantEntraId == employee.EntraId)
                .Select(w => w.Id)
                .ToListAsync(ct);

        // Translate the three matching strategies into a single query.
        var upn = employee.UserPrincipalName;
        var displayName = employee.DisplayName;

        var assetIds = await _db.Assets.AsNoTracking()
            .Where(a =>
                a.EmployeeId == employeeId
                || (a.Owner != null && (a.Owner == upn || a.Owner == displayName))
                || (a.PhysicalWorkplaceId != null && myWorkplaceIds.Contains(a.PhysicalWorkplaceId.Value)))
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

    /// <summary>
    /// Scan the employee's asset set and pick out the primary laptop/desktop by
    /// asset-type name. First asset of each type wins (ordered by assetId ascending,
    /// which favours the oldest/original assignment).
    /// </summary>
    private static PrimaryDevices FindPrimaryDevices(
        HashSet<int> assetIds,
        Dictionary<int, AssetRow> assetRowById)
    {
        string? laptopCode = null;
        string? laptopSerial = null;
        string? desktopCode = null;
        string? desktopSerial = null;
        foreach (var assetId in assetIds.OrderBy(id => id))
        {
            if (!assetRowById.TryGetValue(assetId, out var row)) continue;
            var typeName = row.AssetTypeName;
            if (string.IsNullOrWhiteSpace(typeName)) continue;

            if (laptopCode == null && typeName.Contains("laptop", StringComparison.OrdinalIgnoreCase))
            {
                laptopCode = row.AssetCode;
                laptopSerial = row.SerialNumber;
            }
            else if (desktopCode == null && typeName.Contains("desktop", StringComparison.OrdinalIgnoreCase))
            {
                desktopCode = row.AssetCode;
                desktopSerial = row.SerialNumber;
            }

            if (laptopCode != null && desktopCode != null) break;
        }
        return new PrimaryDevices(laptopCode, laptopSerial, desktopCode, desktopSerial);
    }

    private readonly record struct PrimaryDevices(
        string? LaptopCode,
        string? LaptopSerial,
        string? DesktopCode,
        string? DesktopSerial);

    private sealed class AssetRow
    {
        public int Id { get; init; }
        public string AssetCode { get; init; } = string.Empty;
        public string? SerialNumber { get; init; }
        public int? EmployeeId { get; init; }
        public string? Owner { get; init; }
        public int? PhysicalWorkplaceId { get; init; }
        public string? AssetTypeName { get; init; }
    }
}

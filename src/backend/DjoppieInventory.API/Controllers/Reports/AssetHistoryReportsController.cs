using DjoppieInventory.Core.DTOs;
using DjoppieInventory.Core.Entities;
using DjoppieInventory.Core.Entities.Enums;
using DjoppieInventory.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text;

namespace DjoppieInventory.API.Controllers.Reports;

/// <summary>
/// API controller for asset change history reports.
/// Canonical location: /api/reports/assets/change-history
/// </summary>
[ApiController]
[Route("api/reports/assets/change-history")]
[Authorize]
public class AssetHistoryReportsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<AssetHistoryReportsController> _logger;

    public AssetHistoryReportsController(
        ApplicationDbContext context,
        ILogger<AssetHistoryReportsController> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Gets asset change history (status and owner changes).
    /// Every time an asset changes status or owner, a record is included.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<AssetChangeHistoryItemDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<AssetChangeHistoryItemDto>>> GetChangeHistory(
        [FromQuery] string? dateFrom = null,
        [FromQuery] string? dateTo = null,
        [FromQuery] int? serviceId = null,
        [FromQuery] string? eventType = null,
        [FromQuery] string? search = null,
        CancellationToken cancellationToken = default)
    {
        var query = _context.AssetEvents
            .Include(e => e.Asset)
                .ThenInclude(a => a!.AssetType)
            .Include(e => e.Asset)
                .ThenInclude(a => a!.Service)
            .Include(e => e.Asset)
                .ThenInclude(a => a!.Building)
            .Include(e => e.Asset)
                .ThenInclude(a => a!.Employee)
            .Include(e => e.Asset)
                .ThenInclude(a => a!.PhysicalWorkplace)
                    .ThenInclude(pw => pw!.Building)
            .Include(e => e.Asset)
                .ThenInclude(a => a!.PhysicalWorkplace)
                    .ThenInclude(pw => pw!.Service)
            .AsNoTracking();

        // Filter to status and owner change events
        query = query.Where(e =>
            e.EventType == AssetEventType.StatusChanged ||
            e.EventType == AssetEventType.OwnerChanged ||
            e.EventType == AssetEventType.LocationChanged ||
            e.EventType == AssetEventType.LaptopSwapped ||
            e.EventType == AssetEventType.DeviceOnboarded ||
            e.EventType == AssetEventType.DeviceOffboarded);

        // Apply date filters
        if (!string.IsNullOrEmpty(dateFrom) && DateTime.TryParse(dateFrom, out var fromDate))
        {
            query = query.Where(e => e.EventDate >= fromDate);
        }

        if (!string.IsNullOrEmpty(dateTo) && DateTime.TryParse(dateTo, out var toDate))
        {
            query = query.Where(e => e.EventDate <= toDate.AddDays(1));
        }

        if (serviceId.HasValue)
        {
            query = query.Where(e => e.Asset != null && e.Asset.ServiceId == serviceId.Value);
        }

        // Filter by event type if specified
        if (!string.IsNullOrEmpty(eventType) && Enum.TryParse<AssetEventType>(eventType, true, out var eventTypeEnum))
        {
            query = query.Where(e => e.EventType == eventTypeEnum);
        }

        if (!string.IsNullOrEmpty(search))
        {
            var searchLower = search.ToLower();
            query = query.Where(e =>
                (e.Asset != null && e.Asset.AssetCode.ToLower().Contains(searchLower)) ||
                (e.Asset != null && e.Asset.AssetName != null && e.Asset.AssetName.ToLower().Contains(searchLower)) ||
                (e.Asset != null && e.Asset.SerialNumber != null && e.Asset.SerialNumber.ToLower().Contains(searchLower)) ||
                (e.Asset != null && e.Asset.Owner != null && e.Asset.Owner.ToLower().Contains(searchLower)));
        }

        var events = await query
            .OrderByDescending(e => e.EventDate)
            .Take(1000)
            .Select(e => new AssetChangeHistoryItemDto
            {
                Id = e.Id,
                EventDate = e.EventDate,
                AssetId = e.AssetId,
                AssetCode = e.Asset != null ? e.Asset.AssetCode : "",
                AssetName = e.Asset != null ? e.Asset.AssetName : null,
                AssetTypeName = e.Asset != null && e.Asset.AssetType != null ? e.Asset.AssetType.Name : null,
                SerialNumber = e.Asset != null ? e.Asset.SerialNumber : null,
                EventType = e.EventType.ToString(),
                EventTypeDisplay = GetEventTypeDisplay(e.EventType),
                Description = e.Description,
                OldValue = e.OldValue,
                NewValue = e.NewValue,
                CurrentOwner = e.Asset != null ? e.Asset.Owner : null,
                CurrentOwnerDisplayName = e.Asset != null && e.Asset.Employee != null
                    ? e.Asset.Employee.DisplayName
                    : e.Asset != null ? e.Asset.Owner : null,
                CurrentStatus = e.Asset != null ? e.Asset.Status.ToString() : null,
                ServiceName = e.Asset != null && e.Asset.Service != null ? e.Asset.Service.Name : null,
                BuildingName = e.Asset != null && e.Asset.Building != null ? e.Asset.Building.Name : null,
                Location = e.Asset != null ? e.Asset.OfficeLocation : null,
                WorkplaceCode = e.Asset != null && e.Asset.PhysicalWorkplace != null ? e.Asset.PhysicalWorkplace.Code : null,
                WorkplaceBuilding = e.Asset != null && e.Asset.PhysicalWorkplace != null && e.Asset.PhysicalWorkplace.Building != null
                    ? e.Asset.PhysicalWorkplace.Building.Name : null,
                WorkplaceService = e.Asset != null && e.Asset.PhysicalWorkplace != null && e.Asset.PhysicalWorkplace.Service != null
                    ? e.Asset.PhysicalWorkplace.Service.Name : null,
                WorkplaceRoom = e.Asset != null && e.Asset.PhysicalWorkplace != null ? e.Asset.PhysicalWorkplace.Room : null,
                PerformedBy = e.PerformedBy,
                PerformedByEmail = e.PerformedByEmail,
                Notes = e.Notes
            })
            .ToListAsync(cancellationToken);

        _logger.LogInformation("AssetHistoryReportsController: change history report generated with {Count} events", events.Count);
        return Ok(events);
    }

    /// <summary>
    /// Gets asset change history summary with asset-focused metrics.
    /// </summary>
    [HttpGet("summary")]
    [ProducesResponseType(typeof(AssetChangeHistorySummaryDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<AssetChangeHistorySummaryDto>> GetSummary(
        [FromQuery] string? dateFrom = null,
        [FromQuery] string? dateTo = null,
        CancellationToken cancellationToken = default)
    {
        var query = _context.AssetEvents
            .Include(e => e.Asset)
            .ThenInclude(a => a!.Service)
            .AsNoTracking();

        // Filter to status and owner change events
        query = query.Where(e =>
            e.EventType == AssetEventType.StatusChanged ||
            e.EventType == AssetEventType.OwnerChanged ||
            e.EventType == AssetEventType.LocationChanged ||
            e.EventType == AssetEventType.LaptopSwapped ||
            e.EventType == AssetEventType.DeviceOnboarded ||
            e.EventType == AssetEventType.DeviceOffboarded);

        // Apply date filters
        if (!string.IsNullOrEmpty(dateFrom) && DateTime.TryParse(dateFrom, out var fromDate))
        {
            query = query.Where(e => e.EventDate >= fromDate);
        }

        if (!string.IsNullOrEmpty(dateTo) && DateTime.TryParse(dateTo, out var toDate))
        {
            query = query.Where(e => e.EventDate <= toDate.AddDays(1));
        }

        var events = await query.ToListAsync(cancellationToken);

        // Get count of unique assets that had changes
        var uniqueAssetsWithChanges = events.Select(e => e.AssetId).Distinct().Count();

        // Get count of active assets (InGebruik status)
        var activeAssetsCount = await _context.Assets
            .Where(a => a.Status == AssetStatus.InGebruik)
            .CountAsync(cancellationToken);

        var summary = new AssetChangeHistorySummaryDto
        {
            TotalChanges = events.Count,
            StatusChanges = events.Count(e => e.EventType == AssetEventType.StatusChanged),
            OwnerChanges = events.Count(e => e.EventType == AssetEventType.OwnerChanged),
            LocationChanges = events.Count(e => e.EventType == AssetEventType.LocationChanged),
            UniqueAssetsChanged = uniqueAssetsWithChanges,
            ActiveAssets = activeAssetsCount,
            ByEventType = events
                .GroupBy(e => e.EventType)
                .ToDictionary(
                    g => GetEventTypeDisplay(g.Key),
                    g => g.Count()
                ),
            ByService = events
                .Where(e => e.Asset?.Service != null)
                .GroupBy(e => e.Asset!.Service!.Name)
                .ToDictionary(g => g.Key, g => g.Count()),
            ByMonth = events
                .GroupBy(e => e.EventDate.ToString("yyyy-MM"))
                .OrderBy(g => g.Key)
                .Select(g => new MonthlyCount { Month = g.Key, Count = g.Count() })
                .ToList()
        };

        return Ok(summary);
    }

    /// <summary>
    /// Exports asset change history as CSV.
    /// </summary>
    [HttpGet("export")]
    [ProducesResponseType(typeof(FileContentResult), StatusCodes.Status200OK)]
    public async Task<IActionResult> Export(
        [FromQuery] string? dateFrom = null,
        [FromQuery] string? dateTo = null,
        [FromQuery] int? serviceId = null,
        CancellationToken cancellationToken = default)
    {
        var query = _context.AssetEvents
            .Include(e => e.Asset)
                .ThenInclude(a => a!.AssetType)
            .Include(e => e.Asset)
                .ThenInclude(a => a!.Service)
            .Include(e => e.Asset)
                .ThenInclude(a => a!.Building)
            .AsNoTracking();

        query = query.Where(e =>
            e.EventType == AssetEventType.StatusChanged ||
            e.EventType == AssetEventType.OwnerChanged ||
            e.EventType == AssetEventType.LocationChanged ||
            e.EventType == AssetEventType.LaptopSwapped ||
            e.EventType == AssetEventType.DeviceOnboarded ||
            e.EventType == AssetEventType.DeviceOffboarded);

        if (!string.IsNullOrEmpty(dateFrom) && DateTime.TryParse(dateFrom, out var fromDate))
        {
            query = query.Where(e => e.EventDate >= fromDate);
        }

        if (!string.IsNullOrEmpty(dateTo) && DateTime.TryParse(dateTo, out var toDate))
        {
            query = query.Where(e => e.EventDate <= toDate.AddDays(1));
        }

        if (serviceId.HasValue)
        {
            query = query.Where(e => e.Asset != null && e.Asset.ServiceId == serviceId.Value);
        }

        var events = await query
            .OrderByDescending(e => e.EventDate)
            .ToListAsync(cancellationToken);

        var sb = new StringBuilder();
        sb.AppendLine("Datum,Asset Code,Asset Naam,Type,Gebeurtenis,Oude Waarde,Nieuwe Waarde,Huidige Eigenaar,Status,Dienst,Gebouw,Locatie,Serienummer,Uitgevoerd Door,Notities");

        foreach (var e in events)
        {
            sb.AppendLine(string.Join(",",
                e.EventDate.ToString("yyyy-MM-dd HH:mm"),
                EscapeCsv(e.Asset?.AssetCode ?? ""),
                EscapeCsv(e.Asset?.AssetName ?? ""),
                EscapeCsv(e.Asset?.AssetType?.Name ?? ""),
                EscapeCsv(GetEventTypeDisplay(e.EventType)),
                EscapeCsv(e.OldValue ?? ""),
                EscapeCsv(e.NewValue ?? ""),
                EscapeCsv(e.Asset?.Owner ?? ""),
                EscapeCsv(e.Asset?.Status.ToString() ?? ""),
                EscapeCsv(e.Asset?.Service?.Name ?? ""),
                EscapeCsv(e.Asset?.Building?.Name ?? ""),
                EscapeCsv(e.Asset?.OfficeLocation ?? ""),
                EscapeCsv(e.Asset?.SerialNumber ?? ""),
                EscapeCsv(e.PerformedBy ?? ""),
                EscapeCsv(e.Notes ?? "")
            ));
        }

        var bytes = Encoding.UTF8.GetBytes(sb.ToString());
        var fileName = $"asset-geschiedenis-{DateTime.UtcNow:yyyyMMdd}.csv";

        _logger.LogInformation("AssetHistoryReportsController: exported asset change history with {Count} events", events.Count);
        return File(bytes, "text/csv", fileName);
    }

    /// <summary>
    /// Returns paged timeline events for a single asset (for expandable-row UI in Assets tab).
    /// </summary>
    [HttpGet("/api/reports/assets/{assetId:int}/timeline")]
    [ProducesResponseType(typeof(List<AssetChangeHistoryItemDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<AssetChangeHistoryItemDto>>> GetAssetTimeline(
        int assetId,
        [FromQuery] int take = 50,
        [FromQuery] int skip = 0,
        CancellationToken ct = default)
    {
        var events = await _context.AssetEvents
            .AsNoTracking()
            .Where(e => e.AssetId == assetId)
            .OrderByDescending(e => e.EventDate)
            .Skip(skip).Take(Math.Min(take, 200))
            .Select(e => new AssetChangeHistoryItemDto
            {
                Id = e.Id,
                EventDate = e.EventDate,
                AssetId = e.AssetId,
                AssetCode = e.Asset != null ? e.Asset.AssetCode : string.Empty,
                AssetName = e.Asset != null ? e.Asset.AssetName : null,
                EventType = e.EventType.ToString(),
                EventTypeDisplay = GetEventTypeDisplay(e.EventType),
                Description = e.Description ?? string.Empty,
                OldValue = e.OldValue,
                NewValue = e.NewValue,
                PerformedBy = e.PerformedBy,
                PerformedByEmail = e.PerformedByEmail,
                Notes = e.Notes
            })
            .ToListAsync(ct);

        return Ok(events);
    }

    // ========================================
    // Private Helper Methods
    // ========================================

    /// <summary>
    /// Helper method to get display-friendly event type names
    /// </summary>
    private static string GetEventTypeDisplay(AssetEventType eventType)
    {
        return eventType switch
        {
            AssetEventType.StatusChanged => "Status Wijziging",
            AssetEventType.OwnerChanged => "Eigenaar Wijziging",
            AssetEventType.LocationChanged => "Locatie Wijziging",
            AssetEventType.LaptopSwapped => "Laptop Swap",
            AssetEventType.DeviceOnboarded => "Onboarding",
            AssetEventType.DeviceOffboarded => "Offboarding",
            AssetEventType.LeaseStarted => "Lease Gestart",
            AssetEventType.LeaseEnded => "Lease Beëindigd",
            AssetEventType.Maintenance => "Onderhoud",
            AssetEventType.Created => "Aangemaakt",
            _ => eventType.ToString()
        };
    }

    private static string EscapeCsv(string field)
    {
        if (string.IsNullOrEmpty(field))
            return "";

        if (field.Contains(',') || field.Contains('"') || field.Contains('\n') || field.Contains('\r'))
        {
            return $"\"{field.Replace("\"", "\"\"")}\"";
        }

        return field;
    }
}

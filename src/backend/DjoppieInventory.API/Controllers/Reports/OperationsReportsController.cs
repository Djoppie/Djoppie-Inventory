using DjoppieInventory.Core.DTOs;
using DjoppieInventory.Core.Entities;
using DjoppieInventory.Core.Entities.Enums;
using DjoppieInventory.Core.Interfaces;
using DjoppieInventory.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text;

namespace DjoppieInventory.API.Controllers.Reports;

/// <summary>
/// API controller for operations reports: swap history and rollout reports.
/// </summary>
[ApiController]
[Route("api/reports")]
[Authorize]
public class OperationsReportsController : ControllerBase
{
    private readonly IReportService _reportService;
    private readonly ApplicationDbContext _context;
    private readonly ILogger<OperationsReportsController> _logger;

    public OperationsReportsController(
        IReportService reportService,
        ApplicationDbContext context,
        ILogger<OperationsReportsController> logger)
    {
        _reportService = reportService;
        _context = context;
        _logger = logger;
    }

    // ========================================
    // Swap History Report
    // ========================================

    /// <summary>
    /// Test endpoint to verify JSON serialization
    /// </summary>
    [HttpGet("swaps/test")]
    [AllowAnonymous]
    public ActionResult<object> TestJsonSerialization()
    {
        var testItem = new AssetChangeHistoryItemDto
        {
            Id = 1,
            EventDate = DateTime.Parse("2024-04-07T10:30:00"),
            AssetId = 100,
            AssetCode = "TEST-001",
            EventType = "StatusChanged",
            EventTypeDisplay = "Status Wijziging",
            Description = "Test event"
        };
        return Ok(testItem);
    }

    /// <summary>
    /// Gets asset change history (status and owner changes).
    /// Every time an asset changes status or owner, a record is included.
    /// </summary>
    /// <remarks>Deprecated: Use /api/reports/assets/change-history instead.</remarks>
    [Obsolete("Use /api/reports/assets/change-history")]
    [HttpGet("swaps")]
    [ProducesResponseType(typeof(IEnumerable<AssetChangeHistoryItemDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<AssetChangeHistoryItemDto>>> GetSwapHistory(
        [FromQuery] string? dateFrom = null,
        [FromQuery] string? dateTo = null,
        [FromQuery] int? serviceId = null,
        [FromQuery] string? eventType = null,
        [FromQuery] string? search = null,
        CancellationToken cancellationToken = default)
    {
        _logger.LogWarning("Deprecated endpoint /api/reports/swaps{Sub} called; use /api/reports/assets/change-history", "");

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

        _logger.LogInformation("Asset change history report generated with {Count} events", events.Count);
        return Ok(events);
    }

    /// <summary>
    /// Gets asset change history summary with asset-focused metrics.
    /// </summary>
    /// <remarks>Deprecated: Use /api/reports/assets/change-history/summary instead.</remarks>
    [Obsolete("Use /api/reports/assets/change-history/summary")]
    [HttpGet("swaps/summary")]
    [ProducesResponseType(typeof(AssetChangeHistorySummaryDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<AssetChangeHistorySummaryDto>> GetSwapHistorySummary(
        [FromQuery] string? dateFrom = null,
        [FromQuery] string? dateTo = null,
        CancellationToken cancellationToken = default)
    {
        _logger.LogWarning("Deprecated endpoint /api/reports/swaps{Sub} called; use /api/reports/assets/change-history", "/summary");

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
    /// <remarks>Deprecated: Use /api/reports/assets/change-history/export instead.</remarks>
    [Obsolete("Use /api/reports/assets/change-history/export")]
    [HttpGet("swaps/export")]
    [ProducesResponseType(typeof(FileContentResult), StatusCodes.Status200OK)]
    public async Task<IActionResult> ExportSwapHistory(
        [FromQuery] string? dateFrom = null,
        [FromQuery] string? dateTo = null,
        [FromQuery] int? serviceId = null,
        CancellationToken cancellationToken = default)
    {
        _logger.LogWarning("Deprecated endpoint /api/reports/swaps{Sub} called; use /api/reports/assets/change-history", "/export");

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

        _logger.LogInformation("Exported asset change history with {Count} events", events.Count);
        return File(bytes, "text/csv", fileName);
    }

    // ========================================
    // Rollout Session Reports
    // ========================================

    /// <summary>
    /// Gets rollout session overview with KPIs and breakdowns.
    /// </summary>
    [HttpGet("rollout/sessions/{sessionId}/overview")]
    [ProducesResponseType(typeof(RolloutSessionOverviewDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<RolloutSessionOverviewDto>> GetRolloutSessionOverview(
        int sessionId,
        [FromQuery] List<int>? serviceIds = null,
        [FromQuery] List<int>? buildingIds = null,
        CancellationToken cancellationToken = default)
    {
        var session = await _context.RolloutSessions
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.Id == sessionId, cancellationToken);

        if (session == null)
            return NotFound($"Session {sessionId} not found");

        // Get all workplaces for this session with filters
        var workplacesQuery = _context.RolloutWorkplaces
            .Include(w => w.RolloutDay)
            .Include(w => w.Service).ThenInclude(s => s!.Sector)
            .Include(w => w.Building)
            .Include(w => w.AssetAssignments).ThenInclude(a => a.NewAsset)
            .Include(w => w.AssetAssignments).ThenInclude(a => a.OldAsset)
            .Where(w => w.RolloutDay.RolloutSessionId == sessionId)
            .AsNoTracking();

        if (serviceIds != null && serviceIds.Count > 0)
            workplacesQuery = workplacesQuery.Where(w => w.ServiceId.HasValue && serviceIds.Contains(w.ServiceId.Value));

        if (buildingIds != null && buildingIds.Count > 0)
            workplacesQuery = workplacesQuery.Where(w => w.BuildingId.HasValue && buildingIds.Contains(w.BuildingId.Value));

        var workplaces = await workplacesQuery.ToListAsync(cancellationToken);

        // Calculate statistics
        var totalWorkplaces = workplaces.Count;
        var completedWorkplaces = workplaces.Count(w => w.Status == RolloutWorkplaceStatus.Completed);
        var pendingWorkplaces = workplaces.Count(w => w.Status == RolloutWorkplaceStatus.Pending || w.Status == RolloutWorkplaceStatus.Ready);
        var inProgressWorkplaces = workplaces.Count(w => w.Status == RolloutWorkplaceStatus.InProgress);

        var allAssignments = workplaces.SelectMany(w => w.AssetAssignments).ToList();
        var totalNewAssets = allAssignments.Count(a => a.NewAssetId.HasValue);
        var installedAssets = allAssignments.Count(a => a.Status == AssetAssignmentStatus.Installed);
        var oldAssetsDecommissioned = allAssignments.Count(a => a.OldAssetId.HasValue && a.Status == AssetAssignmentStatus.Installed);
        var qrCodesApplied = allAssignments.Count(a => a.QrCodeApplied == true);
        var missingQrCodes = allAssignments.Count(a => a.QRCodeRequired && a.QrCodeApplied != true);

        // Sector breakdown
        var sectorBreakdown = workplaces
            .Where(w => w.Service?.Sector != null)
            .GroupBy(w => w.Service!.Sector!)
            .Select(g => new RolloutSectorBreakdownDto
            {
                SectorId = g.Key.Id,
                SectorName = g.Key.Name,
                TotalWorkplaces = g.Count(),
                CompletedWorkplaces = g.Count(w => w.Status == RolloutWorkplaceStatus.Completed),
                CompletionPercentage = g.Count() > 0 ? Math.Round((decimal)g.Count(w => w.Status == RolloutWorkplaceStatus.Completed) / g.Count() * 100, 1) : 0,
                Services = g.GroupBy(w => w.Service!)
                    .Select(sg => new RolloutServiceBreakdownDto
                    {
                        ServiceId = sg.Key.Id,
                        ServiceName = sg.Key.Name,
                        TotalWorkplaces = sg.Count(),
                        CompletedWorkplaces = sg.Count(w => w.Status == RolloutWorkplaceStatus.Completed),
                        CompletionPercentage = sg.Count() > 0 ? Math.Round((decimal)sg.Count(w => w.Status == RolloutWorkplaceStatus.Completed) / sg.Count() * 100, 1) : 0
                    }).ToList()
            }).ToList();

        // Building breakdown
        var buildingBreakdown = workplaces
            .Where(w => w.Building != null)
            .GroupBy(w => w.Building!)
            .Select(g => new RolloutBuildingBreakdownDto
            {
                BuildingId = g.Key.Id,
                BuildingName = g.Key.Name,
                TotalWorkplaces = g.Count(),
                CompletedWorkplaces = g.Count(w => w.Status == RolloutWorkplaceStatus.Completed),
                CompletionPercentage = g.Count() > 0 ? Math.Round((decimal)g.Count(w => w.Status == RolloutWorkplaceStatus.Completed) / g.Count() * 100, 1) : 0
            }).ToList();

        // Timeline
        var timeline = workplaces
            .GroupBy(w => w.RolloutDay.Date.Date)
            .OrderBy(g => g.Key)
            .Select(g => new RolloutProgressTimelineDto
            {
                Date = g.Key,
                PlannedWorkplaces = g.Count(),
                CompletedWorkplaces = g.Count(w => w.Status == RolloutWorkplaceStatus.Completed)
            }).ToList();

        // Calculate cumulative
        var cumulative = 0;
        for (var i = 0; i < timeline.Count; i++)
        {
            cumulative += timeline[i].CompletedWorkplaces;
            timeline[i] = timeline[i] with { CumulativeCompleted = cumulative };
        }

        var overview = new RolloutSessionOverviewDto
        {
            TotalWorkplaces = totalWorkplaces,
            CompletedWorkplaces = completedWorkplaces,
            PendingWorkplaces = pendingWorkplaces,
            InProgressWorkplaces = inProgressWorkplaces,
            CompletionPercentage = totalWorkplaces > 0 ? Math.Round((decimal)completedWorkplaces / totalWorkplaces * 100, 1) : 0,
            TotalNewAssets = totalNewAssets,
            InstalledAssets = installedAssets,
            OldAssetsDecommissioned = oldAssetsDecommissioned,
            QrCodesApplied = qrCodesApplied,
            MissingQrCodes = missingQrCodes,
            SectorBreakdown = sectorBreakdown,
            BuildingBreakdown = buildingBreakdown,
            Timeline = timeline
        };

        _logger.LogInformation("Generated rollout overview for session {SessionId}: {Completed}/{Total} workplaces",
            sessionId, completedWorkplaces, totalWorkplaces);

        return Ok(overview);
    }

    /// <summary>
    /// Gets SWAP checklist for a rollout session.
    /// </summary>
    [HttpGet("rollout/sessions/{sessionId}/checklist")]
    [ProducesResponseType(typeof(List<RolloutDayChecklistDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<List<RolloutDayChecklistDto>>> GetRolloutChecklist(
        int sessionId,
        [FromQuery] List<int>? serviceIds = null,
        [FromQuery] List<int>? buildingIds = null,
        [FromQuery] string? status = null,
        CancellationToken cancellationToken = default)
    {
        var session = await _context.RolloutSessions
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.Id == sessionId, cancellationToken);

        if (session == null)
            return NotFound($"Session {sessionId} not found");

        var daysQuery = _context.RolloutDays
            .Include(d => d.Workplaces).ThenInclude(w => w.Service)
            .Include(d => d.Workplaces).ThenInclude(w => w.Building)
            .Include(d => d.Workplaces).ThenInclude(w => w.PhysicalWorkplace)
            .Include(d => d.Workplaces).ThenInclude(w => w.AssetAssignments).ThenInclude(a => a.AssetType)
            .Include(d => d.Workplaces).ThenInclude(w => w.AssetAssignments).ThenInclude(a => a.NewAsset)
            .Include(d => d.Workplaces).ThenInclude(w => w.AssetAssignments).ThenInclude(a => a.OldAsset)
            .Where(d => d.RolloutSessionId == sessionId)
            .OrderBy(d => d.Date)
            .AsNoTracking();

        var days = await daysQuery.ToListAsync(cancellationToken);

        var checklist = new List<RolloutDayChecklistDto>();

        foreach (var day in days)
        {
            var filteredWorkplaces = day.Workplaces.AsEnumerable();

            if (serviceIds != null && serviceIds.Count > 0)
                filteredWorkplaces = filteredWorkplaces.Where(w => w.ServiceId.HasValue && serviceIds.Contains(w.ServiceId.Value));

            if (buildingIds != null && buildingIds.Count > 0)
                filteredWorkplaces = filteredWorkplaces.Where(w => w.BuildingId.HasValue && buildingIds.Contains(w.BuildingId.Value));

            if (!string.IsNullOrEmpty(status) && Enum.TryParse<RolloutWorkplaceStatus>(status, true, out var statusEnum))
                filteredWorkplaces = filteredWorkplaces.Where(w => w.Status == statusEnum);

            var workplaceList = filteredWorkplaces.ToList();
            if (workplaceList.Count == 0) continue;

            var dayChecklist = new RolloutDayChecklistDto
            {
                DayId = day.Id,
                Date = day.Date,
                Notes = day.Notes,
                TotalWorkplaces = workplaceList.Count,
                CompletedWorkplaces = workplaceList.Count(w => w.Status == RolloutWorkplaceStatus.Completed),
                Workplaces = workplaceList
                    .OrderBy(w => w.Service?.Name)
                    .ThenBy(w => w.PhysicalWorkplace?.Name)
                    .Select(w => MapToWorkplaceChecklist(w))
                    .ToList()
            };

            checklist.Add(dayChecklist);
        }

        _logger.LogInformation("Generated rollout checklist for session {SessionId}: {Days} days",
            sessionId, checklist.Count);

        return Ok(checklist);
    }

    /// <summary>
    /// Gets old assets not yet scheduled in any rollout.
    /// </summary>
    [HttpGet("rollout/sessions/{sessionId}/unscheduled")]
    [ProducesResponseType(typeof(List<UnscheduledAssetDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<UnscheduledAssetDto>>> GetUnscheduledAssets(
        int sessionId,
        [FromQuery] int limit = 50,
        CancellationToken cancellationToken = default)
    {
        // Get asset type codes for laptops and desktops
        var deviceTypeCodes = new[] { "LAP", "DESK", "LAPTOP", "DESKTOP" };

        // Find assets that are InGebruik but not scheduled as old assets in any active session
        var scheduledOldAssetIds = await _context.WorkplaceAssetAssignments
            .Where(a => a.OldAssetId.HasValue)
            .Where(a => a.RolloutWorkplace.RolloutDay.RolloutSession.Status != RolloutSessionStatus.Completed)
            .Select(a => a.OldAssetId!.Value)
            .ToListAsync(cancellationToken);

        var unscheduledAssets = await _context.Assets
            .Include(a => a.AssetType)
            .Include(a => a.Service)
            .Where(a => a.Status == AssetStatus.InGebruik)
            .Where(a => a.AssetType != null && deviceTypeCodes.Contains(a.AssetType.Code.ToUpper()))
            .Where(a => !scheduledOldAssetIds.Contains(a.Id))
            .OrderBy(a => a.InstallationDate)
            .Take(limit)
            .AsNoTracking()
            .Select(a => new UnscheduledAssetDto
            {
                AssetId = a.Id,
                AssetCode = a.AssetCode,
                SerialNumber = a.SerialNumber,
                AssetTypeName = a.AssetType != null ? a.AssetType.Name : "",
                PrimaryUserName = a.Owner,
                PrimaryUserId = null, // Asset doesn't store EntraId
                ServiceName = a.Service != null ? a.Service.Name : null,
                InstallationDate = a.InstallationDate,
                AgeInDays = a.InstallationDate.HasValue
                    ? (int)(DateTime.Today - a.InstallationDate.Value).TotalDays
                    : 0,
                Priority = a.InstallationDate.HasValue
                    ? (DateTime.Today - a.InstallationDate.Value).TotalDays > 1460 ? "High"
                    : (DateTime.Today - a.InstallationDate.Value).TotalDays > 730 ? "Medium"
                    : "Low"
                    : "Unknown"
            })
            .ToListAsync(cancellationToken);

        _logger.LogInformation("Found {Count} unscheduled assets for rollout", unscheduledAssets.Count);

        return Ok(unscheduledAssets);
    }

    /// <summary>
    /// Gets filter options for rollout reports.
    /// </summary>
    [HttpGet("rollout/sessions/{sessionId}/filter-options")]
    [ProducesResponseType(typeof(RolloutReportFilterOptionsDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<RolloutReportFilterOptionsDto>> GetRolloutFilterOptions(
        int sessionId,
        CancellationToken cancellationToken = default)
    {
        var session = await _context.RolloutSessions
            .Include(s => s.Days)
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.Id == sessionId, cancellationToken);

        if (session == null)
            return NotFound($"Session {sessionId} not found");

        var workplaces = await _context.RolloutWorkplaces
            .Include(w => w.Service)
            .Include(w => w.Building)
            .Where(w => w.RolloutDay.RolloutSessionId == sessionId)
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        var services = workplaces
            .Where(w => w.ServiceId.HasValue)
            .GroupBy(w => w.ServiceId!.Value)
            .Select(g => new FilterOptionDto
            {
                Id = g.Key,
                Name = g.First().Service!.Name,
                Count = g.Count()
            })
            .OrderBy(f => f.Name)
            .ToList();

        var buildings = workplaces
            .Where(w => w.BuildingId.HasValue)
            .GroupBy(w => w.BuildingId!.Value)
            .Select(g => new FilterOptionDto
            {
                Id = g.Key,
                Name = g.First().Building!.Name,
                Count = g.Count()
            })
            .OrderBy(f => f.Name)
            .ToList();

        var statuses = Enum.GetValues<RolloutWorkplaceStatus>()
            .Select(s => new FilterOptionDto
            {
                Id = (int)s,
                Name = s.ToString(),
                Count = workplaces.Count(w => w.Status == s)
            })
            .Where(f => f.Count > 0)
            .ToList();

        var options = new RolloutReportFilterOptionsDto
        {
            Services = services,
            Buildings = buildings,
            Statuses = statuses,
            MinDate = session.Days.Any() ? session.Days.Min(d => d.Date) : session.PlannedStartDate,
            MaxDate = session.Days.Any() ? session.Days.Max(d => d.Date) : session.PlannedEndDate ?? session.PlannedStartDate.AddMonths(1)
        };

        return Ok(options);
    }

    /// <summary>
    /// Exports rollout session to Excel.
    /// </summary>
    [HttpGet("rollout/sessions/{sessionId}/export")]
    [ProducesResponseType(typeof(FileContentResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ExportRolloutToExcel(
        int sessionId,
        [FromQuery] List<int>? serviceIds = null,
        [FromQuery] List<int>? buildingIds = null,
        CancellationToken cancellationToken = default)
    {
        var session = await _context.RolloutSessions
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.Id == sessionId, cancellationToken);

        if (session == null)
            return NotFound($"Session {sessionId} not found");

        // Get overview data
        var overviewResult = await GetRolloutSessionOverview(sessionId, serviceIds, buildingIds, cancellationToken);
        var overview = (overviewResult.Result as OkObjectResult)?.Value as RolloutSessionOverviewDto;

        // Get checklist data
        var checklistResult = await GetRolloutChecklist(sessionId, serviceIds, buildingIds, null, cancellationToken);
        var checklist = (checklistResult.Result as OkObjectResult)?.Value as List<RolloutDayChecklistDto>;

        // Get unscheduled assets
        var unscheduledResult = await GetUnscheduledAssets(sessionId, 100, cancellationToken);
        var unscheduled = (unscheduledResult.Result as OkObjectResult)?.Value as List<UnscheduledAssetDto>;

        using var workbook = new ClosedXML.Excel.XLWorkbook();

        // Sheet 1: Overview
        var overviewSheet = workbook.Worksheets.Add("Overzicht");
        CreateOverviewSheet(overviewSheet, session, overview);

        // Sheet 2: SWAP Checklist
        var checklistSheet = workbook.Worksheets.Add("SWAP Checklist");
        CreateChecklistSheet(checklistSheet, checklist);

        // Sheet 3: Unscheduled Assets
        var unscheduledSheet = workbook.Worksheets.Add("Niet Gepland");
        CreateUnscheduledSheet(unscheduledSheet, unscheduled);

        // Sheet 4: Sector Breakdown
        var sectorSheet = workbook.Worksheets.Add("Per Sector");
        CreateSectorSheet(sectorSheet, overview?.SectorBreakdown);

        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        var content = stream.ToArray();

        var fileName = $"rollout-rapport-{session.SessionName.Replace(" ", "-")}-{DateTime.UtcNow:yyyyMMdd}.xlsx";

        _logger.LogInformation("Exported rollout report for session {SessionId} to Excel", sessionId);

        return File(content, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", fileName);
    }

    /// <summary>
    /// Gets all assets linked to a rollout session for serial number management.
    /// Returns all new assets (both assigned via assignments and directly linked).
    /// </summary>
    [HttpGet("rollout/sessions/{sessionId}/serial-numbers")]
    [ProducesResponseType(typeof(List<RolloutAssetSerialDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<List<RolloutAssetSerialDto>>> GetRolloutAssetSerials(
        int sessionId,
        [FromQuery] bool onlyMissing = false,
        CancellationToken cancellationToken = default)
    {
        var session = await _context.RolloutSessions
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.Id == sessionId, cancellationToken);

        if (session == null)
            return NotFound($"Session {sessionId} not found");

        // Get all assignments with new assets for this session
        var assignmentsWithAssets = await _context.WorkplaceAssetAssignments
            .Include(a => a.NewAsset).ThenInclude(asset => asset!.AssetType)
            .Include(a => a.RolloutWorkplace).ThenInclude(w => w.Service)
            .Include(a => a.RolloutWorkplace).ThenInclude(w => w.Building)
            .Include(a => a.RolloutWorkplace).ThenInclude(w => w.RolloutDay)
            .Include(a => a.RolloutWorkplace).ThenInclude(w => w.PhysicalWorkplace)
            .Include(a => a.AssetType)
            .Where(a => a.RolloutWorkplace.RolloutDay.RolloutSessionId == sessionId)
            .Where(a => a.NewAssetId.HasValue)
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        var results = assignmentsWithAssets
            .Where(a => a.NewAsset != null)
            .Select(a => new RolloutAssetSerialDto
            {
                AssetId = a.NewAsset!.Id,
                AssetCode = a.NewAsset.AssetCode,
                AssetName = a.NewAsset.AssetName,
                EquipmentType = a.AssetType?.Name ?? a.NewAsset.AssetType?.Name ?? "Unknown",
                CurrentSerialNumber = a.NewAsset.SerialNumber ?? a.SerialNumberCaptured,
                Brand = a.NewAsset.Brand,
                Model = a.NewAsset.Model,
                WorkplaceName = a.RolloutWorkplace.PhysicalWorkplace?.Name ?? a.RolloutWorkplace.UserName ?? $"Workplace {a.RolloutWorkplace.Id}",
                UserDisplayName = a.RolloutWorkplace.UserName,
                ServiceName = a.RolloutWorkplace.Service?.Name ?? "",
                BuildingName = a.RolloutWorkplace.Building?.Name ?? "",
                Date = a.RolloutWorkplace.RolloutDay?.Date,
                Status = a.NewAsset.Status.ToString(),
                IsMissingSerial = string.IsNullOrEmpty(a.NewAsset.SerialNumber) && string.IsNullOrEmpty(a.SerialNumberCaptured)
            })
            .DistinctBy(a => a.AssetId) // Remove duplicates if same asset in multiple assignments
            .OrderBy(a => a.ServiceName)
            .ThenBy(a => a.Date)
            .ThenBy(a => a.WorkplaceName)
            .ToList();

        if (onlyMissing)
        {
            results = results.Where(a => a.IsMissingSerial).ToList();
        }

        _logger.LogInformation("Found {Count} assets for serial number management in session {SessionId} (missing only: {OnlyMissing})",
            results.Count, sessionId, onlyMissing);

        return Ok(results);
    }

    /// <summary>
    /// Bulk update serial numbers for assets.
    /// </summary>
    [HttpPatch("rollout/sessions/{sessionId}/serial-numbers/bulk")]
    [ProducesResponseType(typeof(BulkSerialNumberUpdateResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<BulkSerialNumberUpdateResult>> BulkUpdateSerialNumbers(
        int sessionId,
        [FromBody] BulkSerialNumberUpdateRequest request,
        CancellationToken cancellationToken = default)
    {
        if (request.Updates == null || request.Updates.Count == 0)
        {
            return BadRequest(new { message = "No updates provided" });
        }

        var successCount = 0;
        var errors = new List<string>();

        foreach (var update in request.Updates)
        {
            if (string.IsNullOrWhiteSpace(update.SerialNumber))
            {
                errors.Add($"Asset {update.AssetId}: Serienummer mag niet leeg zijn");
                continue;
            }

            var asset = await _context.Assets.FindAsync(new object[] { update.AssetId }, cancellationToken);
            if (asset == null)
            {
                errors.Add($"Asset {update.AssetId}: Niet gevonden");
                continue;
            }

            asset.SerialNumber = update.SerialNumber.Trim();
            asset.UpdatedAt = DateTime.UtcNow;

            // Also update any assignments that reference this asset
            var assignments = await _context.WorkplaceAssetAssignments
                .Where(a => a.NewAssetId == update.AssetId)
                .ToListAsync(cancellationToken);

            foreach (var assignment in assignments)
            {
                assignment.SerialNumberCaptured = update.SerialNumber.Trim();
                assignment.UpdatedAt = DateTime.UtcNow;
            }

            successCount++;
        }

        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Bulk updated {SuccessCount} serial numbers for session {SessionId}. Errors: {ErrorCount}",
            successCount, sessionId, errors.Count);

        return Ok(new BulkSerialNumberUpdateResult
        {
            SuccessCount = successCount,
            FailedCount = errors.Count,
            Errors = errors
        });
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

    private RolloutWorkplaceChecklistDto MapToWorkplaceChecklist(RolloutWorkplace w)
    {
        var equipmentRows = new List<RolloutEquipmentRowDto>();

        // Group assignments by type (LAP/DESK = Desktop/Laptop, DOCK = Docking)
        var laptopAssignments = w.AssetAssignments
            .Where(a => a.AssetType?.Code?.ToUpper() is "LAP" or "LAPTOP" or "DESK" or "DESKTOP")
            .ToList();

        var dockingAssignments = w.AssetAssignments
            .Where(a => a.AssetType?.Code?.ToUpper() is "DOCK" or "DOCKING")
            .ToList();

        foreach (var a in laptopAssignments)
        {
            equipmentRows.Add(new RolloutEquipmentRowDto
            {
                AssignmentId = a.Id,
                EquipmentType = "Desktop/Laptop",
                Category = a.AssignmentCategory.ToString(),
                NewAssetId = a.NewAssetId,
                NewAssetCode = a.NewAsset?.AssetCode,
                NewSerialNumber = a.NewAsset?.SerialNumber ?? a.SerialNumberCaptured,
                QrCodeApplied = a.QrCodeApplied,
                IsSharedDevice = false, // TODO: Add IsSharedDevice property to Asset entity if needed
                OldAssetId = a.OldAssetId,
                OldAssetCode = a.OldAsset?.AssetCode,
                OldSerialNumber = a.OldAsset?.SerialNumber,
                Status = a.Status.ToString(),
                IsMissingSerialNumber = string.IsNullOrEmpty(a.NewAsset?.SerialNumber) && string.IsNullOrEmpty(a.SerialNumberCaptured)
            });
        }

        foreach (var a in dockingAssignments)
        {
            equipmentRows.Add(new RolloutEquipmentRowDto
            {
                AssignmentId = a.Id,
                EquipmentType = "Docking",
                Category = a.AssignmentCategory.ToString(),
                NewAssetId = a.NewAssetId,
                NewAssetCode = a.NewAsset?.AssetCode,
                NewSerialNumber = a.NewAsset?.SerialNumber ?? a.SerialNumberCaptured,
                QrCodeApplied = a.QrCodeApplied,
                IsSharedDevice = false,
                OldAssetId = a.OldAssetId,
                OldAssetCode = a.OldAsset?.AssetCode,
                OldSerialNumber = a.OldAsset?.SerialNumber,
                Status = a.Status.ToString(),
                IsMissingSerialNumber = string.IsNullOrEmpty(a.NewAsset?.SerialNumber) && string.IsNullOrEmpty(a.SerialNumberCaptured)
            });
        }

        var hasMissing = equipmentRows.Any(e => e.IsMissingSerialNumber);

        return new RolloutWorkplaceChecklistDto
        {
            WorkplaceId = w.Id,
            WorkplaceName = w.PhysicalWorkplace?.Name ?? w.UserName ?? $"Workplace {w.Id}",
            Location = w.PhysicalWorkplace != null
                ? string.Join(", ", new[] { w.PhysicalWorkplace.Floor, w.PhysicalWorkplace.Room }.Where(s => !string.IsNullOrEmpty(s)))
                : w.Location,
            UserId = w.UserEntraId,
            UserDisplayName = w.UserName,
            UserJobTitle = null, // Will be enriched by Graph API on frontend
            ServiceName = w.Service?.Name ?? "",
            BuildingName = w.Building?.Name ?? "",
            Status = w.Status.ToString(),
            CompletedAt = w.CompletedAt,
            Notes = w.Notes,
            HasMissingSerialNumbers = hasMissing,
            EquipmentRows = equipmentRows
        };
    }

    private void CreateOverviewSheet(ClosedXML.Excel.IXLWorksheet sheet, RolloutSession session, RolloutSessionOverviewDto? overview)
    {
        var row = 1;

        // Title
        sheet.Cell(row, 1).Value = $"Rollout Rapport: {session.SessionName}";
        sheet.Cell(row, 1).Style.Font.Bold = true;
        sheet.Cell(row, 1).Style.Font.FontSize = 16;
        sheet.Range(row, 1, row, 4).Merge();
        row += 2;

        // Session info
        sheet.Cell(row, 1).Value = "Periode:";
        sheet.Cell(row, 2).Value = $"{session.PlannedStartDate:dd-MM-yyyy} - {session.PlannedEndDate ?? session.PlannedStartDate.AddMonths(1):dd-MM-yyyy}";
        row++;
        sheet.Cell(row, 1).Value = "Status:";
        sheet.Cell(row, 2).Value = session.Status.ToString();
        row += 2;

        if (overview == null) return;

        // KPIs
        sheet.Cell(row, 1).Value = "Statistieken";
        sheet.Cell(row, 1).Style.Font.Bold = true;
        row++;

        var kpis = new[]
        {
            ("Totaal Werkplekken", overview.TotalWorkplaces),
            ("Voltooid", overview.CompletedWorkplaces),
            ("In Uitvoering", overview.InProgressWorkplaces),
            ("Gepland", overview.PendingWorkplaces),
            ("Voortgang %", (int)overview.CompletionPercentage),
            ("Nieuwe Assets", overview.TotalNewAssets),
            ("Geïnstalleerd", overview.InstalledAssets),
            ("QR Codes Toegepast", overview.QrCodesApplied),
            ("Ontbrekende QR", overview.MissingQrCodes)
        };

        foreach (var (label, value) in kpis)
        {
            sheet.Cell(row, 1).Value = label;
            sheet.Cell(row, 2).Value = value;
            row++;
        }

        sheet.Columns().AdjustToContents();
    }

    private void CreateChecklistSheet(ClosedXML.Excel.IXLWorksheet sheet, List<RolloutDayChecklistDto>? checklist)
    {
        var row = 1;

        // Headers
        var headers = new[] { "Datum", "Dienst", "Gebouw", "Werkplek", "Medewerker", "Laptop SN", "QR", "Docking SN", "QR", "Status", "Notities" };
        for (var col = 1; col <= headers.Length; col++)
        {
            sheet.Cell(row, col).Value = headers[col - 1];
            sheet.Cell(row, col).Style.Font.Bold = true;
            sheet.Cell(row, col).Style.Fill.BackgroundColor = ClosedXML.Excel.XLColor.FromHtml("#0078D4");
            sheet.Cell(row, col).Style.Font.FontColor = ClosedXML.Excel.XLColor.White;
        }
        row++;

        if (checklist == null) return;

        foreach (var day in checklist)
        {
            foreach (var wp in day.Workplaces)
            {
                var laptop = wp.EquipmentRows.FirstOrDefault(e => e.EquipmentType == "Desktop/Laptop");
                var docking = wp.EquipmentRows.FirstOrDefault(e => e.EquipmentType == "Docking");

                sheet.Cell(row, 1).Value = day.Date.ToString("dd-MM-yyyy");
                sheet.Cell(row, 2).Value = wp.ServiceName;
                sheet.Cell(row, 3).Value = wp.BuildingName;
                sheet.Cell(row, 4).Value = wp.WorkplaceName;
                sheet.Cell(row, 5).Value = wp.UserDisplayName ?? "";
                sheet.Cell(row, 6).Value = laptop?.NewSerialNumber ?? "";
                sheet.Cell(row, 7).Value = laptop?.QrCodeApplied == true ? "✓" : "";
                sheet.Cell(row, 8).Value = docking?.NewSerialNumber ?? "";
                sheet.Cell(row, 9).Value = docking?.QrCodeApplied == true ? "✓" : "";
                sheet.Cell(row, 10).Value = wp.Status;
                sheet.Cell(row, 11).Value = wp.Notes ?? "";

                // Yellow highlight for missing serial numbers
                if (laptop?.IsMissingSerialNumber == true)
                {
                    sheet.Cell(row, 6).Style.Fill.BackgroundColor = ClosedXML.Excel.XLColor.Yellow;
                }
                if (docking?.IsMissingSerialNumber == true)
                {
                    sheet.Cell(row, 8).Style.Fill.BackgroundColor = ClosedXML.Excel.XLColor.Yellow;
                }

                // Green for completed
                if (wp.Status == "Completed")
                {
                    sheet.Cell(row, 10).Style.Fill.BackgroundColor = ClosedXML.Excel.XLColor.LightGreen;
                }

                row++;
            }
        }

        sheet.Columns().AdjustToContents();
        sheet.SheetView.FreezeRows(1);
    }

    private void CreateUnscheduledSheet(ClosedXML.Excel.IXLWorksheet sheet, List<UnscheduledAssetDto>? unscheduled)
    {
        var row = 1;

        // Headers
        var headers = new[] { "Asset Code", "Serienummer", "Type", "Eigenaar", "Dienst", "Installatie Datum", "Leeftijd (dagen)", "Prioriteit" };
        for (var col = 1; col <= headers.Length; col++)
        {
            sheet.Cell(row, col).Value = headers[col - 1];
            sheet.Cell(row, col).Style.Font.Bold = true;
            sheet.Cell(row, col).Style.Fill.BackgroundColor = ClosedXML.Excel.XLColor.FromHtml("#0078D4");
            sheet.Cell(row, col).Style.Font.FontColor = ClosedXML.Excel.XLColor.White;
        }
        row++;

        if (unscheduled == null) return;

        foreach (var asset in unscheduled)
        {
            sheet.Cell(row, 1).Value = asset.AssetCode;
            sheet.Cell(row, 2).Value = asset.SerialNumber ?? "";
            sheet.Cell(row, 3).Value = asset.AssetTypeName;
            sheet.Cell(row, 4).Value = asset.PrimaryUserName ?? "";
            sheet.Cell(row, 5).Value = asset.ServiceName ?? "";
            sheet.Cell(row, 6).Value = asset.InstallationDate?.ToString("dd-MM-yyyy") ?? "";
            sheet.Cell(row, 7).Value = asset.AgeInDays;
            sheet.Cell(row, 8).Value = asset.Priority;

            // Color coding for priority
            var priorityColor = asset.Priority switch
            {
                "High" => ClosedXML.Excel.XLColor.LightCoral,
                "Medium" => ClosedXML.Excel.XLColor.LightYellow,
                _ => ClosedXML.Excel.XLColor.NoColor
            };
            if (priorityColor != ClosedXML.Excel.XLColor.NoColor)
            {
                sheet.Cell(row, 8).Style.Fill.BackgroundColor = priorityColor;
            }

            row++;
        }

        sheet.Columns().AdjustToContents();
        sheet.SheetView.FreezeRows(1);
    }

    private void CreateSectorSheet(ClosedXML.Excel.IXLWorksheet sheet, List<RolloutSectorBreakdownDto>? breakdown)
    {
        var row = 1;

        // Headers
        var headers = new[] { "Sector", "Dienst", "Totaal", "Voltooid", "Voortgang %" };
        for (var col = 1; col <= headers.Length; col++)
        {
            sheet.Cell(row, col).Value = headers[col - 1];
            sheet.Cell(row, col).Style.Font.Bold = true;
            sheet.Cell(row, col).Style.Fill.BackgroundColor = ClosedXML.Excel.XLColor.FromHtml("#0078D4");
            sheet.Cell(row, col).Style.Font.FontColor = ClosedXML.Excel.XLColor.White;
        }
        row++;

        if (breakdown == null) return;

        foreach (var sector in breakdown)
        {
            // Sector row (bold)
            sheet.Cell(row, 1).Value = sector.SectorName;
            sheet.Cell(row, 3).Value = sector.TotalWorkplaces;
            sheet.Cell(row, 4).Value = sector.CompletedWorkplaces;
            sheet.Cell(row, 5).Value = sector.CompletionPercentage;
            sheet.Range(row, 1, row, 5).Style.Font.Bold = true;
            sheet.Range(row, 1, row, 5).Style.Fill.BackgroundColor = ClosedXML.Excel.XLColor.LightGray;
            row++;

            // Service rows
            foreach (var service in sector.Services)
            {
                sheet.Cell(row, 2).Value = service.ServiceName;
                sheet.Cell(row, 3).Value = service.TotalWorkplaces;
                sheet.Cell(row, 4).Value = service.CompletedWorkplaces;
                sheet.Cell(row, 5).Value = service.CompletionPercentage;
                row++;
            }
        }

        sheet.Columns().AdjustToContents();
        sheet.SheetView.FreezeRows(1);
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

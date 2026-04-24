using DjoppieInventory.Core.DTOs;
using DjoppieInventory.Core.Entities;
using DjoppieInventory.Core.Entities.Enums;
using DjoppieInventory.Core.Interfaces;
using DjoppieInventory.Infrastructure.Data;
using DjoppieInventory.Infrastructure.Services;
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
    private readonly RolloutMovementClassifierService _classifier;

    public OperationsReportsController(
        IReportService reportService,
        ApplicationDbContext context,
        ILogger<OperationsReportsController> logger,
        RolloutMovementClassifierService classifier)
    {
        _reportService = reportService;
        _context = context;
        _logger = logger;
        _classifier = classifier;
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
        [FromQuery] string? groupBy = "day",
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

        var normalizedGroupBy = (groupBy ?? "day").ToLowerInvariant();

        using var workbook = new ClosedXML.Excel.XLWorkbook();

        // Sheet 1: Overview
        var overviewSheet = workbook.Worksheets.Add("Overzicht");
        CreateOverviewSheet(overviewSheet, session, overview);

        // Sheet 2: Checklist — either flat or grouped depending on groupBy
        if (normalizedGroupBy == "service")
        {
            CreateChecklistSheetsGroupedByService(workbook, checklist);
        }
        else if (normalizedGroupBy == "building")
        {
            CreateChecklistSheetsGroupedByBuilding(workbook, checklist);
        }
        else
        {
            // Default: single flat "SWAP Checklist" sheet grouped by day
            var checklistSheet = workbook.Worksheets.Add("SWAP Checklist");
            CreateChecklistSheet(checklistSheet, checklist);
        }

        // Sheet: Unscheduled Assets
        var unscheduledSheet = workbook.Worksheets.Add("Niet Gepland");
        CreateUnscheduledSheet(unscheduledSheet, unscheduled);

        // Sheet: Sector Breakdown
        var sectorSheet = workbook.Worksheets.Add("Per Sector");
        CreateSectorSheet(sectorSheet, overview?.SectorBreakdown);

        // Sheet: Type Breakdown (always added)
        var typeBreakdownSheet = workbook.Worksheets.Add("Type Breakdown");
        CreateTypeBreakdownSheet(typeBreakdownSheet, checklist);

        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        var content = stream.ToArray();

        var fileName = $"rollout-rapport-{session.SessionName.Replace(" ", "-")}-{DateTime.UtcNow:yyyyMMdd}.xlsx";

        _logger.LogInformation("Exported rollout report for session {SessionId} to Excel (groupBy={GroupBy})", sessionId, normalizedGroupBy);

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
        var movementType = _classifier.Classify(w.AssetAssignments);

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
            MovementType = movementType,
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

    /// <summary>
    /// Creates one checklist sheet per service (groupBy=service).
    /// </summary>
    private void CreateChecklistSheetsGroupedByService(
        ClosedXML.Excel.XLWorkbook workbook,
        List<RolloutDayChecklistDto>? checklist)
    {
        if (checklist == null) return;

        var allWorkplaces = checklist
            .SelectMany(d => d.Workplaces.Select(w => (Day: d, Workplace: w)))
            .ToList();

        var groups = allWorkplaces
            .GroupBy(x => x.Workplace.ServiceName)
            .OrderBy(g => g.Key)
            .ToList();

        foreach (var group in groups)
        {
            var sheetName = SanitizeSheetName(group.Key.Length > 0 ? group.Key : "Geen Dienst");
            var sheet = workbook.Worksheets.Add(sheetName);
            var row = 1;

            var headers = new[] { "Datum", "Dienst", "Gebouw", "Werkplek", "Medewerker", "Laptop SN", "QR", "Docking SN", "QR", "Status", "Notities" };
            for (var col = 1; col <= headers.Length; col++)
            {
                sheet.Cell(row, col).Value = headers[col - 1];
                sheet.Cell(row, col).Style.Font.Bold = true;
                sheet.Cell(row, col).Style.Fill.BackgroundColor = ClosedXML.Excel.XLColor.FromHtml("#0078D4");
                sheet.Cell(row, col).Style.Font.FontColor = ClosedXML.Excel.XLColor.White;
            }
            row++;

            foreach (var (day, wp) in group.OrderBy(x => x.Day.Date).ThenBy(x => x.Workplace.WorkplaceName))
            {
                row = WriteWorkplaceChecklistRow(sheet, row, day.Date, wp);
            }

            sheet.Columns().AdjustToContents();
            sheet.SheetView.FreezeRows(1);
        }
    }

    /// <summary>
    /// Creates one checklist sheet per building (groupBy=building).
    /// </summary>
    private void CreateChecklistSheetsGroupedByBuilding(
        ClosedXML.Excel.XLWorkbook workbook,
        List<RolloutDayChecklistDto>? checklist)
    {
        if (checklist == null) return;

        var allWorkplaces = checklist
            .SelectMany(d => d.Workplaces.Select(w => (Day: d, Workplace: w)))
            .ToList();

        var groups = allWorkplaces
            .GroupBy(x => x.Workplace.BuildingName)
            .OrderBy(g => g.Key)
            .ToList();

        foreach (var group in groups)
        {
            var sheetName = SanitizeSheetName(group.Key.Length > 0 ? group.Key : "Geen Gebouw");
            var sheet = workbook.Worksheets.Add(sheetName);
            var row = 1;

            var headers = new[] { "Datum", "Dienst", "Gebouw", "Werkplek", "Medewerker", "Laptop SN", "QR", "Docking SN", "QR", "Status", "Notities" };
            for (var col = 1; col <= headers.Length; col++)
            {
                sheet.Cell(row, col).Value = headers[col - 1];
                sheet.Cell(row, col).Style.Font.Bold = true;
                sheet.Cell(row, col).Style.Fill.BackgroundColor = ClosedXML.Excel.XLColor.FromHtml("#0078D4");
                sheet.Cell(row, col).Style.Font.FontColor = ClosedXML.Excel.XLColor.White;
            }
            row++;

            foreach (var (day, wp) in group.OrderBy(x => x.Day.Date).ThenBy(x => x.Workplace.ServiceName).ThenBy(x => x.Workplace.WorkplaceName))
            {
                row = WriteWorkplaceChecklistRow(sheet, row, day.Date, wp);
            }

            sheet.Columns().AdjustToContents();
            sheet.SheetView.FreezeRows(1);
        }
    }

    /// <summary>
    /// Writes a single workplace row into a checklist sheet. Returns the next row index.
    /// </summary>
    private static int WriteWorkplaceChecklistRow(
        ClosedXML.Excel.IXLWorksheet sheet,
        int row,
        DateTime date,
        RolloutWorkplaceChecklistDto wp)
    {
        var laptop = wp.EquipmentRows.FirstOrDefault(e => e.EquipmentType == "Desktop/Laptop");
        var docking = wp.EquipmentRows.FirstOrDefault(e => e.EquipmentType == "Docking");

        sheet.Cell(row, 1).Value = date.ToString("dd-MM-yyyy");
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

        if (laptop?.IsMissingSerialNumber == true)
            sheet.Cell(row, 6).Style.Fill.BackgroundColor = ClosedXML.Excel.XLColor.Yellow;
        if (docking?.IsMissingSerialNumber == true)
            sheet.Cell(row, 8).Style.Fill.BackgroundColor = ClosedXML.Excel.XLColor.Yellow;
        if (wp.Status == "Completed")
            sheet.Cell(row, 10).Style.Fill.BackgroundColor = ClosedXML.Excel.XLColor.LightGreen;

        return row + 1;
    }

    /// <summary>
    /// Creates the "Type Breakdown" sheet: counts per day broken down by movement type.
    /// </summary>
    private static void CreateTypeBreakdownSheet(
        ClosedXML.Excel.IXLWorksheet sheet,
        List<RolloutDayChecklistDto>? checklist)
    {
        var row = 1;

        var headers = new[] { "Datum", "Onboarding", "Offboarding", "Swap", "Overig", "Totaal" };
        for (var col = 1; col <= headers.Length; col++)
        {
            sheet.Cell(row, col).Value = headers[col - 1];
            sheet.Cell(row, col).Style.Font.Bold = true;
            sheet.Cell(row, col).Style.Fill.BackgroundColor = ClosedXML.Excel.XLColor.FromHtml("#0078D4");
            sheet.Cell(row, col).Style.Font.FontColor = ClosedXML.Excel.XLColor.White;
        }
        row++;

        if (checklist == null)
        {
            sheet.Columns().AdjustToContents();
            return;
        }

        // Aggregate by day
        var byDay = checklist
            .OrderBy(d => d.Date)
            .Select(d => new
            {
                d.Date,
                Onboarding = d.Workplaces.Count(w => w.MovementType == RolloutMovementType.Onboarding),
                Offboarding = d.Workplaces.Count(w => w.MovementType == RolloutMovementType.Offboarding),
                Swap = d.Workplaces.Count(w => w.MovementType == RolloutMovementType.Swap),
                Other = d.Workplaces.Count(w => w.MovementType == RolloutMovementType.Other),
                Total = d.Workplaces.Count
            })
            .ToList();

        foreach (var day in byDay)
        {
            sheet.Cell(row, 1).Value = day.Date.ToString("dd-MM-yyyy");
            sheet.Cell(row, 2).Value = day.Onboarding;
            sheet.Cell(row, 3).Value = day.Offboarding;
            sheet.Cell(row, 4).Value = day.Swap;
            sheet.Cell(row, 5).Value = day.Other;
            sheet.Cell(row, 6).Value = day.Total;
            row++;
        }

        // Totals row
        if (byDay.Count > 0)
        {
            sheet.Cell(row, 1).Value = "TOTAAL";
            sheet.Cell(row, 1).Style.Font.Bold = true;
            sheet.Cell(row, 2).Value = byDay.Sum(d => d.Onboarding);
            sheet.Cell(row, 3).Value = byDay.Sum(d => d.Offboarding);
            sheet.Cell(row, 4).Value = byDay.Sum(d => d.Swap);
            sheet.Cell(row, 5).Value = byDay.Sum(d => d.Other);
            sheet.Cell(row, 6).Value = byDay.Sum(d => d.Total);
            for (var col = 1; col <= 6; col++)
            {
                sheet.Cell(row, col).Style.Font.Bold = true;
                sheet.Cell(row, col).Style.Fill.BackgroundColor = ClosedXML.Excel.XLColor.LightGray;
            }
        }

        sheet.Columns().AdjustToContents();
        sheet.SheetView.FreezeRows(1);
    }

    /// <summary>
    /// Sanitizes a string to be a valid Excel sheet name (max 31 chars, no special chars).
    /// </summary>
    private static string SanitizeSheetName(string name)
    {
        // Excel sheet name invalid chars: \ / * ? [ ] :
        var invalidChars = new[] { '\\', '/', '*', '?', '[', ']', ':' };
        var sanitized = string.Concat(name.Select(c => invalidChars.Contains(c) ? '_' : c));
        return sanitized.Length > 31 ? sanitized[..31] : sanitized;
    }
}

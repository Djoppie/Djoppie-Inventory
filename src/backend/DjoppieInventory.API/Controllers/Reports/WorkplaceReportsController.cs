using DjoppieInventory.Core.DTOs;
using DjoppieInventory.Core.Interfaces;
using DjoppieInventory.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text;

namespace DjoppieInventory.API.Controllers.Reports;

/// <summary>
/// API controller for workplace statistics reports.
/// </summary>
[ApiController]
[Route("api/reports")]
[Authorize]
public class WorkplaceReportsController : ControllerBase
{
    private readonly IReportService _reportService;
    private readonly ApplicationDbContext _context;
    private readonly ILogger<WorkplaceReportsController> _logger;

    public WorkplaceReportsController(
        IReportService reportService,
        ApplicationDbContext context,
        ILogger<WorkplaceReportsController> logger)
    {
        _reportService = reportService;
        _context = context;
        _logger = logger;
    }

    // ========================================
    // Workplace Report
    // ========================================

    /// <summary>
    /// Gets workplace report.
    /// </summary>
    [HttpGet("workplaces")]
    [ProducesResponseType(typeof(IEnumerable<WorkplaceReportItemDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<WorkplaceReportItemDto>>> GetWorkplaceReport(
        CancellationToken cancellationToken = default)
    {
        var workplaces = await _context.PhysicalWorkplaces
            .Include(pw => pw.Building)
            .Include(pw => pw.Service)
            .Where(pw => pw.IsActive)
            .AsNoTracking()
            .OrderBy(pw => pw.Building.Name)
            .ThenBy(pw => pw.Code)
            .Select(pw => new WorkplaceReportItemDto
            {
                Id = pw.Id,
                Code = pw.Code,
                Name = pw.Name,
                BuildingName = pw.Building != null ? pw.Building.Name : null,
                Floor = pw.Floor,
                Room = pw.Room,
                OccupantName = pw.CurrentOccupantName,
                OccupantEmail = pw.CurrentOccupantEmail,
                ServiceName = pw.Service != null ? pw.Service.Name : null,
                IsOccupied = pw.CurrentOccupantName != null || pw.CurrentOccupantEmail != null,
                EquipmentCount = (pw.DockingStationAssetId.HasValue ? 1 : 0) +
                    (pw.Monitor1AssetId.HasValue ? 1 : 0) +
                    (pw.Monitor2AssetId.HasValue ? 1 : 0) +
                    (pw.Monitor3AssetId.HasValue ? 1 : 0) +
                    (pw.KeyboardAssetId.HasValue ? 1 : 0) +
                    (pw.MouseAssetId.HasValue ? 1 : 0),
                CreatedAt = pw.CreatedAt,
                UpdatedAt = pw.UpdatedAt
            })
            .ToListAsync(cancellationToken);

        _logger.LogInformation("Workplace report generated with {Count} workplaces", workplaces.Count);
        return Ok(workplaces);
    }

    /// <summary>
    /// Gets workplace report summary (occupancy stats).
    /// </summary>
    [HttpGet("workplaces/summary")]
    [ProducesResponseType(typeof(WorkplaceReportSummaryDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<WorkplaceReportSummaryDto>> GetWorkplaceReportSummary(
        CancellationToken cancellationToken = default)
    {
        var workplaces = await _context.PhysicalWorkplaces
            .Include(pw => pw.Building)
            .Where(pw => pw.IsActive)
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        var totalWorkplaces = workplaces.Count;
        var occupiedWorkplaces = workplaces.Count(pw =>
            pw.CurrentOccupantName != null || pw.CurrentOccupantEmail != null);
        var availableWorkplaces = totalWorkplaces - occupiedWorkplaces;

        var summary = new WorkplaceReportSummaryDto
        {
            TotalWorkplaces = totalWorkplaces,
            OccupiedWorkplaces = occupiedWorkplaces,
            AvailableWorkplaces = availableWorkplaces,
            OccupancyRate = totalWorkplaces > 0
                ? (int)Math.Round((double)occupiedWorkplaces / totalWorkplaces * 100)
                : 0,
            ByBuilding = workplaces
                .Where(pw => pw.Building != null)
                .GroupBy(pw => pw.Building!.Name)
                .ToDictionary(
                    g => g.Key,
                    g => new BuildingOccupancyData
                    {
                        Total = g.Count(),
                        Occupied = g.Count(pw => pw.CurrentOccupantName != null || pw.CurrentOccupantEmail != null)
                    })
        };

        return Ok(summary);
    }

    /// <summary>
    /// Exports workplace report as CSV.
    /// </summary>
    [HttpGet("workplaces/export")]
    [ProducesResponseType(typeof(FileContentResult), StatusCodes.Status200OK)]
    public async Task<IActionResult> ExportWorkplaceReport(
        CancellationToken cancellationToken = default)
    {
        var workplaces = await _context.PhysicalWorkplaces
            .Include(pw => pw.Building)
            .Include(pw => pw.Service)
            .Where(pw => pw.IsActive)
            .AsNoTracking()
            .OrderBy(pw => pw.Building.Name)
            .ThenBy(pw => pw.Code)
            .ToListAsync(cancellationToken);

        var sb = new StringBuilder();
        sb.AppendLine("Code,Name,Building,Floor,Room,Occupant,Email,Service,HasDocking,MonitorCount");

        foreach (var pw in workplaces)
        {
            sb.AppendLine(string.Join(",",
                EscapeCsv(pw.Code),
                EscapeCsv(pw.Name),
                EscapeCsv(pw.Building?.Name ?? ""),
                EscapeCsv(pw.Floor ?? ""),
                EscapeCsv(pw.Room ?? ""),
                EscapeCsv(pw.CurrentOccupantName ?? ""),
                EscapeCsv(pw.CurrentOccupantEmail ?? ""),
                EscapeCsv(pw.Service?.Name ?? ""),
                pw.HasDockingStation,
                pw.MonitorCount
            ));
        }

        var bytes = Encoding.UTF8.GetBytes(sb.ToString());
        var fileName = $"werkplekken-{DateTime.UtcNow:yyyyMMdd}.csv";

        _logger.LogInformation("Exported workplace report with {Count} workplaces", workplaces.Count);
        return File(bytes, "text/csv", fileName);
    }

    // ========================================
    // Helper Methods
    // ========================================

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

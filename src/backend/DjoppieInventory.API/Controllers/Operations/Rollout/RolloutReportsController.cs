using DjoppieInventory.Core.DTOs;
using DjoppieInventory.Core.DTOs.Rollout;
using DjoppieInventory.Core.Entities;
using DjoppieInventory.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Text;

namespace DjoppieInventory.API.Controllers.Operations.Rollout;

/// <summary>
/// API controller for rollout statistics, reporting, and exports.
/// Provides session progress, movement reports, and CSV exports.
/// </summary>
[ApiController]
[Route("api/operations/rollouts/reports")]
[Authorize]
public class RolloutReportsController : ControllerBase
{
    private readonly IRolloutRepository _rolloutRepository;
    private readonly IAssetMovementService _movementService;
    private readonly ILogger<RolloutReportsController> _logger;

    public RolloutReportsController(
        IRolloutRepository rolloutRepository,
        IAssetMovementService movementService,
        ILogger<RolloutReportsController> logger)
    {
        _rolloutRepository = rolloutRepository;
        _movementService = movementService;
        _logger = logger;
    }

    /// <summary>
    /// Gets progress report for a specific session.
    /// </summary>
    /// <param name="sessionId">Session ID</param>
    /// <param name="cancellationToken">Cancellation token</param>
    [HttpGet("sessions/{sessionId}/progress")]
    [ProducesResponseType(typeof(RolloutProgressDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<RolloutProgressDto>> GetSessionProgress(
        int sessionId,
        CancellationToken cancellationToken = default)
    {
        var session = await _rolloutRepository.GetSessionByIdAsync(sessionId, true, true, cancellationToken);
        if (session == null)
        {
            return NotFound(new { message = $"Rollout session with ID {sessionId} not found" });
        }

        var progress = CalculateProgress(session);
        return Ok(progress);
    }

    /// <summary>
    /// Gets asset movement summary for a session.
    /// </summary>
    /// <param name="sessionId">Session ID</param>
    /// <param name="cancellationToken">Cancellation token</param>
    [HttpGet("sessions/{sessionId}/movements/summary")]
    [ProducesResponseType(typeof(MovementSummaryDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<MovementSummaryDto>> GetMovementSummary(
        int sessionId,
        CancellationToken cancellationToken = default)
    {
        var summary = await _movementService.GetMovementSummaryAsync(sessionId, cancellationToken);
        return Ok(summary);
    }

    /// <summary>
    /// Gets all asset movements for a session.
    /// </summary>
    /// <param name="sessionId">Session ID</param>
    /// <param name="cancellationToken">Cancellation token</param>
    [HttpGet("sessions/{sessionId}/movements")]
    [ProducesResponseType(typeof(IEnumerable<AssetMovementDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<AssetMovementDto>>> GetSessionMovements(
        int sessionId,
        CancellationToken cancellationToken = default)
    {
        var movements = await _movementService.GetMovementsBySessionAsync(sessionId, cancellationToken);
        return Ok(movements);
    }

    /// <summary>
    /// Gets asset status report for a session (deployment, decommission counts by asset type).
    /// </summary>
    /// <param name="sessionId">Session ID</param>
    /// <param name="cancellationToken">Cancellation token</param>
    [HttpGet("sessions/{sessionId}/asset-status")]
    [ProducesResponseType(typeof(RolloutAssetStatusReportDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<RolloutAssetStatusReportDto>> GetAssetStatusReport(
        int sessionId,
        CancellationToken cancellationToken = default)
    {
        var session = await _rolloutRepository.GetSessionByIdAsync(sessionId, true, true, cancellationToken);
        if (session == null)
        {
            return NotFound(new { message = $"Rollout session with ID {sessionId} not found" });
        }

        var movementSummary = await _movementService.GetMovementSummaryAsync(sessionId, cancellationToken);

        var report = new RolloutAssetStatusReportDto
        {
            SessionId = sessionId,
            SessionName = session.SessionName,
            TotalDeployments = movementSummary.Deployments,
            TotalDecommissions = movementSummary.Decommissions,
            TotalTransfers = movementSummary.Transfers,
            TotalAssetsDeployed = movementSummary.Deployments,
            TotalAssetsDecommissioned = movementSummary.Decommissions,
            ByAssetType = movementSummary.ByAssetType.Select(x => new AssetTypeStatusSummaryDto
            {
                AssetTypeName = x.AssetTypeName,
                Deployed = x.Deployments,
                Decommissioned = x.Decommissions,
                Total = x.Count
            }).ToList(),
            ByService = movementSummary.ByService.Select(x => new ServiceStatusSummaryDto
            {
                ServiceId = x.ServiceId,
                ServiceName = x.ServiceName,
                Deployed = x.Deployments,
                Decommissioned = x.Decommissions,
                Total = x.Count
            }).ToList()
        };

        return Ok(report);
    }

    /// <summary>
    /// Exports session movements to CSV.
    /// </summary>
    /// <param name="sessionId">Session ID</param>
    /// <param name="cancellationToken">Cancellation token</param>
    [HttpGet("sessions/{sessionId}/export/csv")]
    [ProducesResponseType(typeof(FileContentResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ExportMovementsToCsv(
        int sessionId,
        CancellationToken cancellationToken = default)
    {
        var session = await _rolloutRepository.GetSessionByIdAsync(sessionId, cancellationToken: cancellationToken);
        if (session == null)
        {
            return NotFound(new { message = $"Rollout session with ID {sessionId} not found" });
        }

        var csvContent = await _movementService.ExportToCsvAsync(sessionId, cancellationToken);
        var bytes = Encoding.UTF8.GetBytes(csvContent);
        var fileName = $"rollout-movements-{session.SessionName.Replace(" ", "-")}-{DateTime.UtcNow:yyyyMMdd}.csv";

        _logger.LogInformation("Exported movements for session {SessionId} to CSV", sessionId);

        return File(bytes, "text/csv", fileName);
    }

    /// <summary>
    /// Exports session workplaces to CSV.
    /// </summary>
    /// <param name="sessionId">Session ID</param>
    /// <param name="cancellationToken">Cancellation token</param>
    [HttpGet("sessions/{sessionId}/export/workplaces-csv")]
    [ProducesResponseType(typeof(FileContentResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ExportWorkplacesToCsv(
        int sessionId,
        CancellationToken cancellationToken = default)
    {
        var session = await _rolloutRepository.GetSessionByIdAsync(sessionId, true, true, cancellationToken);
        if (session == null)
        {
            return NotFound(new { message = $"Rollout session with ID {sessionId} not found" });
        }

        var sb = new StringBuilder();

        // Header
        sb.AppendLine("DayNumber,DayDate,UserName,UserEmail,Location,Service,Status,TotalItems,CompletedItems,CompletedAt,CompletedBy,Notes");

        foreach (var day in session.Days.OrderBy(d => d.DayNumber))
        {
            foreach (var workplace in day.Workplaces.OrderBy(w => w.UserName))
            {
                sb.AppendLine(string.Join(",",
                    day.DayNumber,
                    day.Date.ToString("yyyy-MM-dd"),
                    EscapeCsvField(workplace.UserName),
                    EscapeCsvField(workplace.UserEmail ?? ""),
                    EscapeCsvField(workplace.Location ?? ""),
                    EscapeCsvField(workplace.Service?.Name ?? ""),
                    workplace.Status.ToString(),
                    workplace.TotalItems,
                    workplace.CompletedItems,
                    workplace.CompletedAt?.ToString("yyyy-MM-dd HH:mm:ss") ?? "",
                    EscapeCsvField(workplace.CompletedBy ?? ""),
                    EscapeCsvField(workplace.Notes ?? "")
                ));
            }
        }

        var bytes = Encoding.UTF8.GetBytes(sb.ToString());
        var fileName = $"rollout-workplaces-{session.SessionName.Replace(" ", "-")}-{DateTime.UtcNow:yyyyMMdd}.csv";

        _logger.LogInformation("Exported workplaces for session {SessionId} to CSV", sessionId);

        return File(bytes, "text/csv", fileName);
    }

    /// <summary>
    /// Gets day-by-day progress breakdown for a session.
    /// </summary>
    /// <param name="sessionId">Session ID</param>
    /// <param name="cancellationToken">Cancellation token</param>
    [HttpGet("sessions/{sessionId}/daily-progress")]
    [ProducesResponseType(typeof(IEnumerable<DayProgressDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<IEnumerable<DayProgressDto>>> GetDailyProgress(
        int sessionId,
        CancellationToken cancellationToken = default)
    {
        var session = await _rolloutRepository.GetSessionByIdAsync(sessionId, true, true, cancellationToken);
        if (session == null)
        {
            return NotFound(new { message = $"Rollout session with ID {sessionId} not found" });
        }

        var dailyProgress = session.Days
            .OrderBy(d => d.DayNumber)
            .Select(d => new DayProgressDto
            {
                DayId = d.Id,
                DayNumber = d.DayNumber,
                Date = d.Date,
                Name = d.Name,
                Status = d.Status.ToString(),
                TotalWorkplaces = d.Workplaces?.Count ?? 0,
                CompletedWorkplaces = d.Workplaces?.Count(w => w.Status == RolloutWorkplaceStatus.Completed) ?? 0,
                SkippedWorkplaces = d.Workplaces?.Count(w => w.Status == RolloutWorkplaceStatus.Skipped) ?? 0,
                FailedWorkplaces = d.Workplaces?.Count(w => w.Status == RolloutWorkplaceStatus.Failed) ?? 0,
                InProgressWorkplaces = d.Workplaces?.Count(w => w.Status == RolloutWorkplaceStatus.InProgress) ?? 0,
                PendingWorkplaces = d.Workplaces?.Count(w => w.Status == RolloutWorkplaceStatus.Pending || w.Status == RolloutWorkplaceStatus.Ready) ?? 0,
                ProgressPercent = d.Workplaces?.Count > 0
                    ? (int)Math.Round(d.Workplaces.Count(w => w.Status == RolloutWorkplaceStatus.Completed || w.Status == RolloutWorkplaceStatus.Skipped) * 100.0 / d.Workplaces.Count)
                    : 0
            })
            .ToList();

        return Ok(dailyProgress);
    }

    /// <summary>
    /// Gets movements within a date range across all sessions.
    /// </summary>
    /// <param name="startDate">Start date</param>
    /// <param name="endDate">End date</param>
    /// <param name="movementType">Optional filter by movement type</param>
    /// <param name="cancellationToken">Cancellation token</param>
    [HttpGet("movements/by-date")]
    [ProducesResponseType(typeof(IEnumerable<AssetMovementDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<AssetMovementDto>>> GetMovementsByDateRange(
        [FromQuery] DateTime startDate,
        [FromQuery] DateTime endDate,
        [FromQuery] string? movementType = null,
        CancellationToken cancellationToken = default)
    {
        Core.Entities.Enums.MovementType? typeFilter = null;
        if (!string.IsNullOrEmpty(movementType) && Enum.TryParse<Core.Entities.Enums.MovementType>(movementType, true, out var parsed))
        {
            typeFilter = parsed;
        }

        var movements = await _movementService.GetMovementsByDateRangeAsync(startDate, endDate, typeFilter, cancellationToken);
        return Ok(movements);
    }

    #region Private Methods

    private static RolloutProgressDto CalculateProgress(RolloutSession session)
    {
        var totalWorkplaces = session.Days?.Sum(d => d.Workplaces?.Count ?? 0) ?? 0;
        var completedWorkplaces = session.Days?.Sum(d => d.Workplaces?.Count(w => w.Status == RolloutWorkplaceStatus.Completed) ?? 0) ?? 0;
        var skippedWorkplaces = session.Days?.Sum(d => d.Workplaces?.Count(w => w.Status == RolloutWorkplaceStatus.Skipped) ?? 0) ?? 0;
        var failedWorkplaces = session.Days?.Sum(d => d.Workplaces?.Count(w => w.Status == RolloutWorkplaceStatus.Failed) ?? 0) ?? 0;
        var inProgressWorkplaces = session.Days?.Sum(d => d.Workplaces?.Count(w => w.Status == RolloutWorkplaceStatus.InProgress) ?? 0) ?? 0;
        var pendingWorkplaces = totalWorkplaces - completedWorkplaces - skippedWorkplaces - failedWorkplaces - inProgressWorkplaces;

        var totalItems = session.Days?.Sum(d => d.Workplaces?.Sum(w => w.TotalItems) ?? 0) ?? 0;
        var completedItems = session.Days?.Sum(d => d.Workplaces?.Sum(w => w.CompletedItems) ?? 0) ?? 0;

        return new RolloutProgressDto
        {
            SessionId = session.Id,
            SessionName = session.SessionName,
            Status = session.Status.ToString(),
            TotalDays = session.Days?.Count ?? 0,
            CompletedDays = session.Days?.Count(d => d.Status == RolloutDayStatus.Completed) ?? 0,
            TotalWorkplaces = totalWorkplaces,
            CompletedWorkplaces = completedWorkplaces,
            SkippedWorkplaces = skippedWorkplaces,
            FailedWorkplaces = failedWorkplaces,
            InProgressWorkplaces = inProgressWorkplaces,
            PendingWorkplaces = pendingWorkplaces,
            TotalItems = totalItems,
            CompletedItems = completedItems,
            WorkplaceProgressPercent = totalWorkplaces > 0
                ? (int)Math.Round((completedWorkplaces + skippedWorkplaces) * 100.0 / totalWorkplaces)
                : 0,
            ItemProgressPercent = totalItems > 0
                ? (int)Math.Round(completedItems * 100.0 / totalItems)
                : 0,
            PlannedStartDate = session.PlannedStartDate,
            PlannedEndDate = session.PlannedEndDate,
            StartedAt = session.StartedAt,
            CompletedAt = session.CompletedAt
        };
    }

    private static string EscapeCsvField(string field)
    {
        if (string.IsNullOrEmpty(field))
            return "";

        if (field.Contains(',') || field.Contains('"') || field.Contains('\n') || field.Contains('\r'))
        {
            return $"\"{field.Replace("\"", "\"\"")}\"";
        }

        return field;
    }

    #endregion
}


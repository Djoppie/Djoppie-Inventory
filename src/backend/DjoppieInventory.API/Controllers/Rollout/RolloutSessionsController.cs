using DjoppieInventory.Core.DTOs.Rollout;
using DjoppieInventory.Core.Entities;
using DjoppieInventory.Core.Interfaces;
using DjoppieInventory.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using System.Text;
using Microsoft.EntityFrameworkCore;

namespace DjoppieInventory.API.Controllers.Rollout;

/// <summary>
/// API controller for managing rollout sessions.
/// Handles CRUD operations for rollout sessions.
/// </summary>
[ApiController]
[Route("api/rollout/sessions")]
[Authorize]
public class RolloutSessionsController : ControllerBase
{
    private readonly IRolloutRepository _rolloutRepository;
    private readonly IAssetMovementService _movementService;
    private readonly ApplicationDbContext _context;
    private readonly ILogger<RolloutSessionsController> _logger;

    public RolloutSessionsController(
        IRolloutRepository rolloutRepository,
        IAssetMovementService movementService,
        ApplicationDbContext context,
        ILogger<RolloutSessionsController> logger)
    {
        _rolloutRepository = rolloutRepository;
        _movementService = movementService;
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Gets all rollout sessions with optional status filtering.
    /// </summary>
    /// <param name="status">Optional status filter (Planning, Ready, InProgress, Completed, Cancelled)</param>
    /// <param name="cancellationToken">Cancellation token</param>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<RolloutSessionDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<RolloutSessionDto>>> GetAll(
        [FromQuery] string? status = null,
        CancellationToken cancellationToken = default)
    {
        RolloutSessionStatus? statusFilter = null;
        if (!string.IsNullOrWhiteSpace(status) && Enum.TryParse<RolloutSessionStatus>(status, true, out var parsedStatus))
        {
            statusFilter = parsedStatus;
        }

        var sessions = await _rolloutRepository.GetAllSessionsAsync(statusFilter, cancellationToken);
        var sessionDtos = sessions.Select(MapToDto).ToList();

        return Ok(sessionDtos);
    }

    /// <summary>
    /// Gets a specific rollout session by ID.
    /// </summary>
    /// <param name="id">Session ID</param>
    /// <param name="includeDays">Include days in response</param>
    /// <param name="includeWorkplaces">Include workplaces in response (requires includeDays=true)</param>
    /// <param name="cancellationToken">Cancellation token</param>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(RolloutSessionDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<RolloutSessionDto>> GetById(
        int id,
        [FromQuery] bool includeDays = false,
        [FromQuery] bool includeWorkplaces = false,
        CancellationToken cancellationToken = default)
    {
        var session = await _rolloutRepository.GetSessionByIdAsync(id, includeDays, includeWorkplaces, cancellationToken);
        if (session == null)
        {
            return NotFound(new { message = $"Rollout session with ID {id} not found" });
        }

        var sessionDto = MapToDto(session);

        // Map days if included
        if (includeDays && session.Days != null)
        {
            sessionDto.Days = session.Days.Select(MapToDayDto).ToList();
        }

        return Ok(sessionDto);
    }

    /// <summary>
    /// Creates a new rollout session.
    /// </summary>
    /// <param name="dto">Session creation data</param>
    /// <param name="cancellationToken">Cancellation token</param>
    [HttpPost]
    [ProducesResponseType(typeof(RolloutSessionDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<RolloutSessionDto>> Create(
        [FromBody] CreateRolloutSessionDto dto,
        CancellationToken cancellationToken = default)
    {
        var session = new RolloutSession
        {
            SessionName = dto.SessionName,
            Description = dto.Description,
            PlannedStartDate = dto.PlannedStartDate,
            PlannedEndDate = dto.PlannedEndDate,
            Status = RolloutSessionStatus.Planning,
            CreatedBy = User.FindFirstValue(ClaimTypes.Name) ?? "Unknown",
            CreatedByEmail = User.FindFirstValue(ClaimTypes.Email) ?? "unknown@example.com"
        };

        var createdSession = await _rolloutRepository.CreateSessionAsync(session, cancellationToken);
        var sessionDto = MapToDto(createdSession);

        _logger.LogInformation("Created rollout session {SessionId}: {SessionName}", createdSession.Id, createdSession.SessionName);

        return CreatedAtAction(nameof(GetById), new { id = createdSession.Id }, sessionDto);
    }

    /// <summary>
    /// Updates an existing rollout session.
    /// </summary>
    /// <param name="id">Session ID</param>
    /// <param name="dto">Updated session data</param>
    /// <param name="cancellationToken">Cancellation token</param>
    [HttpPut("{id}")]
    [ProducesResponseType(typeof(RolloutSessionDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<RolloutSessionDto>> Update(
        int id,
        [FromBody] UpdateRolloutSessionDto dto,
        CancellationToken cancellationToken = default)
    {
        var session = await _rolloutRepository.GetSessionByIdAsync(id, cancellationToken: cancellationToken);
        if (session == null)
        {
            return NotFound(new { message = $"Rollout session with ID {id} not found" });
        }

        // Parse status
        if (!Enum.TryParse<RolloutSessionStatus>(dto.Status, true, out var status))
        {
            return BadRequest(new { message = $"Invalid status value: {dto.Status}" });
        }

        session.SessionName = dto.SessionName;
        session.Description = dto.Description;
        session.Status = status;
        session.PlannedStartDate = dto.PlannedStartDate;
        session.PlannedEndDate = dto.PlannedEndDate;
        session.UpdatedAt = DateTime.UtcNow;

        // Update started/completed timestamps based on status
        if (status == RolloutSessionStatus.InProgress && session.StartedAt == null)
        {
            session.StartedAt = DateTime.UtcNow;
        }
        if (status == RolloutSessionStatus.Completed && session.CompletedAt == null)
        {
            session.CompletedAt = DateTime.UtcNow;
        }

        var updatedSession = await _rolloutRepository.UpdateSessionAsync(session, cancellationToken);
        var sessionDto = MapToDto(updatedSession);

        _logger.LogInformation("Updated rollout session {SessionId}", id);

        return Ok(sessionDto);
    }

    /// <summary>
    /// Starts a rollout session (changes status from Planning/Ready to InProgress).
    /// </summary>
    /// <param name="id">Session ID</param>
    /// <param name="cancellationToken">Cancellation token</param>
    [HttpPost("{id}/start")]
    [ProducesResponseType(typeof(RolloutSessionDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<RolloutSessionDto>> Start(
        int id,
        CancellationToken cancellationToken = default)
    {
        var session = await _rolloutRepository.GetSessionByIdAsync(id, cancellationToken: cancellationToken);
        if (session == null)
        {
            return NotFound(new { message = $"Rollout session with ID {id} not found" });
        }

        if (session.Status != RolloutSessionStatus.Planning && session.Status != RolloutSessionStatus.Ready)
        {
            return BadRequest(new { message = $"Cannot start session with status '{session.Status}'. Session must be in Planning or Ready status." });
        }

        session.Status = RolloutSessionStatus.InProgress;
        session.StartedAt = DateTime.UtcNow;
        session.UpdatedAt = DateTime.UtcNow;

        var updatedSession = await _rolloutRepository.UpdateSessionAsync(session, cancellationToken);

        _logger.LogInformation("Started rollout session {SessionId}", id);

        return Ok(MapToDto(updatedSession));
    }

    /// <summary>
    /// Completes a rollout session.
    /// </summary>
    /// <param name="id">Session ID</param>
    /// <param name="cancellationToken">Cancellation token</param>
    [HttpPost("{id}/complete")]
    [ProducesResponseType(typeof(RolloutSessionDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<RolloutSessionDto>> Complete(
        int id,
        CancellationToken cancellationToken = default)
    {
        var session = await _rolloutRepository.GetSessionByIdAsync(id, cancellationToken: cancellationToken);
        if (session == null)
        {
            return NotFound(new { message = $"Rollout session with ID {id} not found" });
        }

        if (session.Status != RolloutSessionStatus.InProgress)
        {
            return BadRequest(new { message = $"Cannot complete session with status '{session.Status}'. Session must be in InProgress status." });
        }

        session.Status = RolloutSessionStatus.Completed;
        session.CompletedAt = DateTime.UtcNow;
        session.UpdatedAt = DateTime.UtcNow;

        var updatedSession = await _rolloutRepository.UpdateSessionAsync(session, cancellationToken);

        _logger.LogInformation("Completed rollout session {SessionId}", id);

        return Ok(MapToDto(updatedSession));
    }

    /// <summary>
    /// Cancels a rollout session.
    /// </summary>
    /// <param name="id">Session ID</param>
    /// <param name="cancellationToken">Cancellation token</param>
    [HttpPost("{id}/cancel")]
    [ProducesResponseType(typeof(RolloutSessionDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<RolloutSessionDto>> Cancel(
        int id,
        CancellationToken cancellationToken = default)
    {
        var session = await _rolloutRepository.GetSessionByIdAsync(id, cancellationToken: cancellationToken);
        if (session == null)
        {
            return NotFound(new { message = $"Rollout session with ID {id} not found" });
        }

        if (session.Status == RolloutSessionStatus.Completed)
        {
            return BadRequest(new { message = "Cannot cancel a completed session." });
        }

        session.Status = RolloutSessionStatus.Cancelled;
        session.UpdatedAt = DateTime.UtcNow;

        var updatedSession = await _rolloutRepository.UpdateSessionAsync(session, cancellationToken);

        _logger.LogInformation("Cancelled rollout session {SessionId}", id);

        return Ok(MapToDto(updatedSession));
    }

    /// <summary>
    /// Deletes a rollout session (cascade deletes days and workplaces).
    /// Only Planning, Ready, or Cancelled sessions can be deleted.
    /// </summary>
    /// <param name="id">Session ID</param>
    /// <param name="cancellationToken">Cancellation token</param>
    [HttpDelete("{id}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Delete(
        int id,
        CancellationToken cancellationToken = default)
    {
        var session = await _rolloutRepository.GetSessionByIdAsync(id, cancellationToken: cancellationToken);
        if (session == null)
        {
            return NotFound(new { message = $"Rollout session with ID {id} not found" });
        }

        // Prevent deletion of sessions that are in progress or completed
        if (session.Status == RolloutSessionStatus.InProgress || session.Status == RolloutSessionStatus.Completed)
        {
            return BadRequest(new { message = $"Cannot delete session with status '{session.Status}'. Only Planning, Ready, or Cancelled sessions can be deleted." });
        }

        await _rolloutRepository.DeleteSessionAsync(id, cancellationToken);

        _logger.LogInformation("Deleted rollout session {SessionId}", id);

        return NoContent();
    }

    /// <summary>
    /// Gets all days for a specific session.
    /// </summary>
    /// <param name="id">Session ID</param>
    /// <param name="includeWorkplaces">Include workplaces in response</param>
    /// <param name="cancellationToken">Cancellation token</param>
    [HttpGet("{id}/days")]
    [ProducesResponseType(typeof(IEnumerable<RolloutDayDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<IEnumerable<RolloutDayDto>>> GetDays(
        int id,
        [FromQuery] bool includeWorkplaces = false,
        CancellationToken cancellationToken = default)
    {
        // Verify session exists
        var session = await _rolloutRepository.GetSessionByIdAsync(id, cancellationToken: cancellationToken);
        if (session == null)
        {
            return NotFound(new { message = $"Rollout session with ID {id} not found" });
        }

        // Get days for this session
        var days = await _rolloutRepository.GetDaysBySessionIdAsync(id, includeWorkplaces, cancellationToken);
        var dayDtos = days.Select(MapToDayDto).ToList();

        return Ok(dayDtos);
    }

    /// <summary>
    /// Creates a new day for a session.
    /// </summary>
    /// <param name="id">Session ID</param>
    /// <param name="dto">Day creation data</param>
    /// <param name="cancellationToken">Cancellation token</param>
    [HttpPost("{id}/days")]
    [ProducesResponseType(typeof(RolloutDayDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<RolloutDayDto>> CreateDay(
        int id,
        [FromBody] CreateRolloutDayDto dto,
        CancellationToken cancellationToken = default)
    {
        // Verify session exists
        var session = await _rolloutRepository.GetSessionByIdAsync(id, cancellationToken: cancellationToken);
        if (session == null)
        {
            return NotFound(new { message = $"Rollout session with ID {id} not found" });
        }

        // Get the next day number
        var existingDays = await _rolloutRepository.GetDaysBySessionIdAsync(id, false, cancellationToken);
        var maxDayNumber = existingDays.Any() ? existingDays.Max(d => d.DayNumber) : 0;

        var day = new RolloutDay
        {
            RolloutSessionId = id,
            Date = dto.Date,
            Name = dto.Name,
            DayNumber = maxDayNumber + 1,
            ScheduledServiceIds = dto.ScheduledServiceIds.Count > 0
                ? string.Join(",", dto.ScheduledServiceIds)
                : null,
            Status = RolloutDayStatus.Planning,
            Notes = dto.Notes
        };

        var createdDay = await _rolloutRepository.CreateDayAsync(day, cancellationToken);

        _logger.LogInformation("Created rollout day {DayId} for session {SessionId}", createdDay.Id, id);

        return CreatedAtAction(nameof(GetDays), new { id = id }, MapToDayDto(createdDay));
    }

    /// <summary>
    /// Gets asset status change report for a rollout session.
    /// Shows all assets that were deployed (Nieuw->InGebruik) or decommissioned (->UitDienst).
    /// </summary>
    /// <param name="id">Session ID</param>
    /// <param name="cancellationToken">Cancellation token</param>
    [HttpGet("{id}/asset-report")]
    [ProducesResponseType(typeof(RolloutAssetStatusReportDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<RolloutAssetStatusReportDto>> GetAssetReport(
        int id,
        CancellationToken cancellationToken = default)
    {
        var session = await _rolloutRepository.GetSessionByIdAsync(id, true, true, cancellationToken);
        if (session == null)
        {
            return NotFound(new { message = $"Rollout session with ID {id} not found" });
        }

        var assetChanges = await GetAssetChangesForSession(id, cancellationToken);

        var report = new RolloutAssetStatusReportDto
        {
            SessionId = id,
            SessionName = session.SessionName,
            GeneratedAt = DateTime.UtcNow,
            TotalDeployments = assetChanges.Count(c => c.ChangeType == "InGebruik"),
            TotalDecommissions = assetChanges.Count(c => c.ChangeType == "UitDienst"),
            TotalAssetsDeployed = assetChanges.Count(c => c.ChangeType == "InGebruik"),
            TotalAssetsDecommissioned = assetChanges.Count(c => c.ChangeType == "UitDienst"),
            TotalWorkplacesCompleted = session.Days?
                .Sum(d => d.Workplaces?.Count(w => w.Status == RolloutWorkplaceStatus.Completed) ?? 0) ?? 0,
            AssetChanges = assetChanges
        };

        return Ok(report);
    }

    /// <summary>
    /// Exports asset status change report as CSV file.
    /// Focuses on asset information (no technician data).
    /// </summary>
    /// <param name="id">Session ID</param>
    /// <param name="cancellationToken">Cancellation token</param>
    [HttpGet("{id}/asset-report/export")]
    [ProducesResponseType(typeof(FileContentResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ExportAssetReport(
        int id,
        CancellationToken cancellationToken = default)
    {
        var session = await _rolloutRepository.GetSessionByIdAsync(id, cancellationToken: cancellationToken);
        if (session == null)
        {
            return NotFound(new { message = $"Rollout session with ID {id} not found" });
        }

        var assetChanges = await GetAssetChangesForSession(id, cancellationToken);

        var sb = new StringBuilder();

        // Header - Asset-focused columns (no technician info)
        sb.AppendLine("Datum,Type,Werkplaats,Gebruiker,GebruikerEmail,AssetCode,Serienummer,Merk,Model,OudeStatus,NieuweStatus,Dienst");

        foreach (var change in assetChanges.OrderBy(c => c.CompletedAt))
        {
            sb.AppendLine(string.Join(",",
                change.CompletedAt.ToString("yyyy-MM-dd HH:mm"),
                EscapeCsvField(change.ChangeType == "InGebruik" ? "Onboarding" : "Offboarding"),
                EscapeCsvField(change.Location ?? ""),
                EscapeCsvField(change.UserName),
                EscapeCsvField(change.UserEmail ?? ""),
                EscapeCsvField(change.AssetCode),
                EscapeCsvField(change.SerialNumber ?? ""),
                EscapeCsvField(change.Brand ?? ""),
                EscapeCsvField(change.Model ?? ""),
                EscapeCsvField(change.OldStatus),
                EscapeCsvField(change.NewStatus),
                EscapeCsvField(change.ServiceName ?? "")
            ));
        }

        var bytes = Encoding.UTF8.GetBytes(sb.ToString());
        var fileName = $"rollout-asset-wijzigingen-{session.SessionName.Replace(" ", "-")}-{DateTime.UtcNow:yyyyMMdd}.csv";

        _logger.LogInformation("Exported asset changes for session {SessionId} to CSV", id);

        return File(bytes, "text/csv", fileName);
    }

    /// <summary>
    /// Helper method to load asset changes with full entity includes for proper data mapping.
    /// </summary>
    private async Task<List<RolloutAssetChangeDto>> GetAssetChangesForSession(
        int sessionId,
        CancellationToken cancellationToken)
    {
        var movements = await _context.RolloutAssetMovements
            .Include(m => m.Asset)
                .ThenInclude(a => a!.AssetType)
            .Include(m => m.RolloutWorkplace)
                .ThenInclude(w => w!.RolloutDay)
            .Include(m => m.NewService)
            .Where(m => m.RolloutSessionId == sessionId)
            .OrderByDescending(m => m.PerformedAt)
            .ToListAsync(cancellationToken);

        return movements.Select(m => new RolloutAssetChangeDto
        {
            AssetId = m.AssetId,
            AssetCode = m.Asset?.AssetCode ?? "",
            AssetName = m.Asset?.AssetName,
            EquipmentType = m.Asset?.AssetType?.Name ?? "Unknown",
            SerialNumber = m.SerialNumber,
            Brand = m.Asset?.Brand,
            Model = m.Asset?.Model,
            OldStatus = m.PreviousStatus?.ToString() ?? "",
            NewStatus = m.NewStatus.ToString(),
            ChangeType = m.MovementType == Core.Entities.Enums.MovementType.Deployed ? "InGebruik" : "UitDienst",
            WorkplaceId = m.RolloutWorkplaceId ?? 0,
            UserName = m.RolloutWorkplace?.UserName ?? "",
            UserEmail = m.RolloutWorkplace?.UserEmail,
            Location = m.NewLocation,
            ServiceName = m.NewService?.Name,
            DayId = m.RolloutWorkplace?.RolloutDayId ?? 0,
            DayNumber = m.RolloutWorkplace?.RolloutDay?.DayNumber ?? 0,
            Date = m.RolloutWorkplace?.RolloutDay?.Date ?? m.PerformedAt,
            CompletedBy = m.PerformedBy,
            CompletedByEmail = m.PerformedByEmail,
            CompletedAt = m.PerformedAt
        }).ToList();
    }

    #region Private Mapping Methods

    private static RolloutSessionDto MapToDto(RolloutSession session)
    {
        return new RolloutSessionDto
        {
            Id = session.Id,
            SessionName = session.SessionName,
            Description = session.Description,
            Status = session.Status.ToString(),
            PlannedStartDate = session.PlannedStartDate,
            PlannedEndDate = session.PlannedEndDate,
            StartedAt = session.StartedAt,
            CompletedAt = session.CompletedAt,
            CreatedBy = session.CreatedBy,
            CreatedByEmail = session.CreatedByEmail,
            CreatedAt = session.CreatedAt,
            UpdatedAt = session.UpdatedAt,
            TotalDays = session.Days?.Count ?? 0,
            TotalWorkplaces = session.Days?.Sum(d => d.Workplaces?.Count ?? 0) ?? 0,
            CompletedWorkplaces = session.Days?.Sum(d => d.Workplaces?.Count(w => w.Status == RolloutWorkplaceStatus.Completed) ?? 0) ?? 0
        };
    }

    private static RolloutDayDto MapToDayDto(RolloutDay day)
    {
        return new RolloutDayDto
        {
            Id = day.Id,
            RolloutSessionId = day.RolloutSessionId,
            Date = day.Date,
            Name = day.Name,
            DayNumber = day.DayNumber,
            ScheduledServiceIds = ParseScheduledServiceIds(day.ScheduledServiceIds),
            TotalWorkplaces = day.TotalWorkplaces,
            CompletedWorkplaces = day.CompletedWorkplaces,
            Status = day.Status.ToString(),
            Notes = day.Notes,
            CreatedAt = day.CreatedAt,
            UpdatedAt = day.UpdatedAt,
            Workplaces = day.Workplaces?.Select(MapToWorkplaceDto).ToList()
        };
    }

    private static List<int> ParseScheduledServiceIds(string? scheduledServiceIds)
    {
        if (string.IsNullOrWhiteSpace(scheduledServiceIds))
        {
            return new List<int>();
        }

        return scheduledServiceIds.Split(',', StringSplitOptions.RemoveEmptyEntries)
            .Select(s => int.TryParse(s.Trim(), out var id) ? id : 0)
            .Where(id => id > 0)
            .ToList();
    }

    private static RolloutWorkplaceDto MapToWorkplaceDto(RolloutWorkplace workplace)
    {
        return new RolloutWorkplaceDto
        {
            Id = workplace.Id,
            RolloutDayId = workplace.RolloutDayId,
            UserName = workplace.UserName,
            UserEmail = workplace.UserEmail,
            UserEntraId = workplace.UserEntraId,
            Location = workplace.Location,
            ServiceId = workplace.ServiceId,
            ServiceName = workplace.Service?.Name,
            BuildingId = workplace.BuildingId,
            BuildingName = workplace.Building?.Name,
            ScheduledDate = workplace.ScheduledDate,
            IsLaptopSetup = workplace.IsLaptopSetup,
            Status = workplace.Status.ToString(),
            TotalItems = workplace.TotalItems,
            CompletedItems = workplace.CompletedItems,
            CompletedAt = workplace.CompletedAt,
            CompletedBy = workplace.CompletedBy,
            CompletedByEmail = workplace.CompletedByEmail,
            Notes = workplace.Notes,
            MovedToWorkplaceId = workplace.MovedToWorkplaceId,
            MovedFromWorkplaceId = workplace.MovedFromWorkplaceId,
            CreatedAt = workplace.CreatedAt,
            UpdatedAt = workplace.UpdatedAt
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

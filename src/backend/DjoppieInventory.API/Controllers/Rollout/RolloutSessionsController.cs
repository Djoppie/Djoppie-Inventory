using DjoppieInventory.Core.DTOs.Rollout;
using DjoppieInventory.Core.Entities;
using DjoppieInventory.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

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
    private readonly ILogger<RolloutSessionsController> _logger;

    public RolloutSessionsController(
        IRolloutRepository rolloutRepository,
        ILogger<RolloutSessionsController> logger)
    {
        _rolloutRepository = rolloutRepository;
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

    #endregion
}

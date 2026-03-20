using DjoppieInventory.Core.DTOs.Rollout;
using DjoppieInventory.Core.Entities;
using DjoppieInventory.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DjoppieInventory.API.Controllers.Rollout;

/// <summary>
/// API controller for managing rollout days.
/// Handles CRUD operations for rollout days within sessions.
/// </summary>
[ApiController]
[Route("api/rollout/days")]
[Authorize]
public class RolloutDaysController : ControllerBase
{
    private readonly IRolloutRepository _rolloutRepository;
    private readonly IServiceRepository _serviceRepository;
    private readonly ILogger<RolloutDaysController> _logger;

    public RolloutDaysController(
        IRolloutRepository rolloutRepository,
        IServiceRepository serviceRepository,
        ILogger<RolloutDaysController> logger)
    {
        _rolloutRepository = rolloutRepository;
        _serviceRepository = serviceRepository;
        _logger = logger;
    }

    /// <summary>
    /// Gets all days scheduled for today across all active sessions.
    /// </summary>
    /// <param name="includeWorkplaces">Include workplaces in response</param>
    /// <param name="cancellationToken">Cancellation token</param>
    [HttpGet("today")]
    [ProducesResponseType(typeof(IEnumerable<RolloutDayWithSessionDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<RolloutDayWithSessionDto>>> GetToday(
        [FromQuery] bool includeWorkplaces = false,
        CancellationToken cancellationToken = default)
    {
        var today = DateOnly.FromDateTime(DateTime.Today);
        var days = await _rolloutRepository.GetDaysByDateAsync(today, includeWorkplaces, cancellationToken);
        var dayDtos = days.Select(MapToDtoWithSession).ToList();

        return Ok(dayDtos);
    }

    /// <summary>
    /// Gets all days for a specific session.
    /// </summary>
    /// <param name="sessionId">Session ID</param>
    /// <param name="includeWorkplaces">Include workplaces in response</param>
    /// <param name="cancellationToken">Cancellation token</param>
    [HttpGet("by-session/{sessionId}")]
    [ProducesResponseType(typeof(IEnumerable<RolloutDayDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<RolloutDayDto>>> GetBySessionId(
        int sessionId,
        [FromQuery] bool includeWorkplaces = false,
        CancellationToken cancellationToken = default)
    {
        var days = await _rolloutRepository.GetDaysBySessionIdAsync(sessionId, includeWorkplaces, cancellationToken);
        var dayDtos = days.Select(MapToDto).ToList();

        return Ok(dayDtos);
    }

    /// <summary>
    /// Gets a specific day by ID.
    /// </summary>
    /// <param name="id">Day ID</param>
    /// <param name="includeWorkplaces">Include workplaces in response</param>
    /// <param name="cancellationToken">Cancellation token</param>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(RolloutDayDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<RolloutDayDto>> GetById(
        int id,
        [FromQuery] bool includeWorkplaces = false,
        CancellationToken cancellationToken = default)
    {
        var day = await _rolloutRepository.GetDayByIdAsync(id, includeWorkplaces, cancellationToken);
        if (day == null)
        {
            return NotFound(new { message = $"Rollout day with ID {id} not found" });
        }

        return Ok(MapToDto(day));
    }

    /// <summary>
    /// Creates a new day for a session.
    /// </summary>
    /// <param name="sessionId">Session ID</param>
    /// <param name="dto">Day creation data</param>
    /// <param name="cancellationToken">Cancellation token</param>
    [HttpPost("for-session/{sessionId}")]
    [ProducesResponseType(typeof(RolloutDayDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<RolloutDayDto>> Create(
        int sessionId,
        [FromBody] CreateRolloutDayDto dto,
        CancellationToken cancellationToken = default)
    {
        // Verify session exists
        var session = await _rolloutRepository.GetSessionByIdAsync(sessionId, cancellationToken: cancellationToken);
        if (session == null)
        {
            return NotFound(new { message = $"Rollout session with ID {sessionId} not found" });
        }

        // Get the next day number
        var existingDays = await _rolloutRepository.GetDaysBySessionIdAsync(sessionId, false, cancellationToken);
        var maxDayNumber = existingDays.Any() ? existingDays.Max(d => d.DayNumber) : 0;

        var day = new RolloutDay
        {
            RolloutSessionId = sessionId,
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

        _logger.LogInformation("Created rollout day {DayId} for session {SessionId}", createdDay.Id, sessionId);

        return CreatedAtAction(nameof(GetById), new { id = createdDay.Id }, MapToDto(createdDay));
    }

    /// <summary>
    /// Updates an existing day.
    /// </summary>
    /// <param name="id">Day ID</param>
    /// <param name="dto">Updated day data</param>
    /// <param name="cancellationToken">Cancellation token</param>
    [HttpPut("{id}")]
    [ProducesResponseType(typeof(RolloutDayDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<RolloutDayDto>> Update(
        int id,
        [FromBody] UpdateRolloutDayDto dto,
        CancellationToken cancellationToken = default)
    {
        var day = await _rolloutRepository.GetDayByIdAsync(id, false, cancellationToken);
        if (day == null)
        {
            return NotFound(new { message = $"Rollout day with ID {id} not found" });
        }

        day.Date = dto.Date;
        day.Name = dto.Name;
        day.ScheduledServiceIds = dto.ScheduledServiceIds.Count > 0
            ? string.Join(",", dto.ScheduledServiceIds)
            : null;
        day.Notes = dto.Notes;
        day.UpdatedAt = DateTime.UtcNow;

        var updatedDay = await _rolloutRepository.UpdateDayAsync(day, cancellationToken);

        _logger.LogInformation("Updated rollout day {DayId}", id);

        return Ok(MapToDto(updatedDay));
    }

    /// <summary>
    /// Updates the status of a day.
    /// </summary>
    /// <param name="id">Day ID</param>
    /// <param name="dto">Status update data</param>
    /// <param name="cancellationToken">Cancellation token</param>
    [HttpPut("{id}/status")]
    [ProducesResponseType(typeof(RolloutDayDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<RolloutDayDto>> UpdateStatus(
        int id,
        [FromBody] UpdateDayStatusDto dto,
        CancellationToken cancellationToken = default)
    {
        var day = await _rolloutRepository.GetDayByIdAsync(id, false, cancellationToken);
        if (day == null)
        {
            return NotFound(new { message = $"Rollout day with ID {id} not found" });
        }

        if (!Enum.TryParse<RolloutDayStatus>(dto.Status, true, out var status))
        {
            return BadRequest(new { message = $"Invalid status value: {dto.Status}" });
        }

        day.Status = status;
        day.UpdatedAt = DateTime.UtcNow;

        var updatedDay = await _rolloutRepository.UpdateDayAsync(day, cancellationToken);

        _logger.LogInformation("Updated rollout day {DayId} status to {Status}", id, status);

        return Ok(MapToDto(updatedDay));
    }

    /// <summary>
    /// Marks a day as ready for execution.
    /// </summary>
    /// <param name="id">Day ID</param>
    /// <param name="cancellationToken">Cancellation token</param>
    [HttpPost("{id}/ready")]
    [ProducesResponseType(typeof(RolloutDayDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<RolloutDayDto>> MarkReady(
        int id,
        CancellationToken cancellationToken = default)
    {
        var day = await _rolloutRepository.GetDayByIdAsync(id, true, cancellationToken);
        if (day == null)
        {
            return NotFound(new { message = $"Rollout day with ID {id} not found" });
        }

        if (day.Status != RolloutDayStatus.Planning)
        {
            return BadRequest(new { message = $"Cannot mark day as ready. Current status: {day.Status}" });
        }

        // Update all workplaces to Ready status as well
        if (day.Workplaces != null)
        {
            foreach (var workplace in day.Workplaces.Where(w => w.Status == RolloutWorkplaceStatus.Pending))
            {
                workplace.Status = RolloutWorkplaceStatus.Ready;
                workplace.UpdatedAt = DateTime.UtcNow;
            }
        }

        day.Status = RolloutDayStatus.Ready;
        day.UpdatedAt = DateTime.UtcNow;

        var updatedDay = await _rolloutRepository.UpdateDayAsync(day, cancellationToken);

        _logger.LogInformation("Marked rollout day {DayId} as ready", id);

        return Ok(MapToDto(updatedDay));
    }

    /// <summary>
    /// Marks a day as completed.
    /// </summary>
    /// <param name="id">Day ID</param>
    /// <param name="cancellationToken">Cancellation token</param>
    [HttpPost("{id}/complete")]
    [ProducesResponseType(typeof(RolloutDayDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<RolloutDayDto>> Complete(
        int id,
        CancellationToken cancellationToken = default)
    {
        var day = await _rolloutRepository.GetDayByIdAsync(id, true, cancellationToken);
        if (day == null)
        {
            return NotFound(new { message = $"Rollout day with ID {id} not found" });
        }

        day.Status = RolloutDayStatus.Completed;
        day.CompletedWorkplaces = day.Workplaces?.Count(w => w.Status == RolloutWorkplaceStatus.Completed) ?? 0;
        day.UpdatedAt = DateTime.UtcNow;

        var updatedDay = await _rolloutRepository.UpdateDayAsync(day, cancellationToken);

        _logger.LogInformation("Completed rollout day {DayId}", id);

        return Ok(MapToDto(updatedDay));
    }

    /// <summary>
    /// Deletes a day and all its workplaces.
    /// </summary>
    /// <param name="id">Day ID</param>
    /// <param name="cancellationToken">Cancellation token</param>
    [HttpDelete("{id}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Delete(
        int id,
        CancellationToken cancellationToken = default)
    {
        var day = await _rolloutRepository.GetDayByIdAsync(id, false, cancellationToken);
        if (day == null)
        {
            return NotFound(new { message = $"Rollout day with ID {id} not found" });
        }

        // Prevent deletion if day is completed
        if (day.Status == RolloutDayStatus.Completed)
        {
            return BadRequest(new { message = "Cannot delete a completed day." });
        }

        await _rolloutRepository.DeleteDayAsync(id, cancellationToken);

        _logger.LogInformation("Deleted rollout day {DayId}", id);

        return NoContent();
    }

    /// <summary>
    /// Gets services scheduled for a specific day.
    /// </summary>
    /// <param name="id">Day ID</param>
    /// <param name="cancellationToken">Cancellation token</param>
    [HttpGet("{id}/services")]
    [ProducesResponseType(typeof(IEnumerable<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<IEnumerable<object>>> GetScheduledServices(
        int id,
        CancellationToken cancellationToken = default)
    {
        var day = await _rolloutRepository.GetDayByIdAsync(id, false, cancellationToken);
        if (day == null)
        {
            return NotFound(new { message = $"Rollout day with ID {id} not found" });
        }

        if (string.IsNullOrEmpty(day.ScheduledServiceIds))
        {
            return Ok(Array.Empty<object>());
        }

        var serviceIds = day.ScheduledServiceIds
            .Split(',', StringSplitOptions.RemoveEmptyEntries)
            .Select(s => int.TryParse(s.Trim(), out var id) ? id : (int?)null)
            .Where(id => id.HasValue)
            .Select(id => id!.Value)
            .ToList();

        var services = new List<object>();
        foreach (var serviceId in serviceIds)
        {
            var service = await _serviceRepository.GetByIdAsync(serviceId, cancellationToken);
            if (service != null)
            {
                services.Add(new
                {
                    service.Id,
                    service.Code,
                    service.Name,
                    service.SectorId,
                    SectorName = service.Sector?.Name
                });
            }
        }

        return Ok(services);
    }

    #region Private Mapping Methods

    private static RolloutDayDto MapToDto(RolloutDay day)
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

    private static RolloutDayWithSessionDto MapToDtoWithSession(RolloutDay day)
    {
        return new RolloutDayWithSessionDto
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
            Workplaces = day.Workplaces?.Select(MapToWorkplaceDto).ToList(),
            SessionName = day.RolloutSession?.SessionName ?? string.Empty,
            SessionStatus = day.RolloutSession?.Status.ToString() ?? string.Empty
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

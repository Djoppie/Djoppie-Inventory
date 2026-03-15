using DjoppieInventory.Core.DTOs;
using DjoppieInventory.Core.DTOs.Rollout;
using DjoppieInventory.Core.Entities;
using DjoppieInventory.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using System.Text.Json;

namespace DjoppieInventory.API.Controllers;

/// <summary>
/// API controller for managing rollout sessions, days, and workplaces.
/// Provides comprehensive rollout workflow management including planning, execution, and reporting.
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class RolloutsController : ControllerBase
{
    private readonly IRolloutRepository _rolloutRepository;
    private readonly IAssetRepository _assetRepository;
    private readonly IAssetTemplateRepository _assetTemplateRepository;
    private readonly IGraphUserService _graphUserService;
    private readonly IServiceRepository _serviceRepository;
    private readonly IRolloutWorkplaceService _workplaceService;
    private readonly ILogger<RolloutsController> _logger;

    public RolloutsController(
        IRolloutRepository rolloutRepository,
        IAssetRepository assetRepository,
        IAssetTemplateRepository assetTemplateRepository,
        IGraphUserService graphUserService,
        IServiceRepository serviceRepository,
        IRolloutWorkplaceService workplaceService,
        ILogger<RolloutsController> logger)
    {
        _rolloutRepository = rolloutRepository;
        _assetRepository = assetRepository;
        _assetTemplateRepository = assetTemplateRepository;
        _graphUserService = graphUserService;
        _serviceRepository = serviceRepository;
        _workplaceService = workplaceService;
        _logger = logger;
    }

    // ===== SESSION ENDPOINTS =====

    /// <summary>
    /// Gets all rollout sessions with optional status filtering
    /// </summary>
    /// <param name="status">Optional status filter (Planning, Ready, InProgress, Completed, Cancelled)</param>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<RolloutSessionDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<RolloutSessionDto>>> GetAllSessions([FromQuery] string? status = null)
    {
        RolloutSessionStatus? statusFilter = null;
        if (!string.IsNullOrWhiteSpace(status) && Enum.TryParse<RolloutSessionStatus>(status, true, out var parsedStatus))
        {
            statusFilter = parsedStatus;
        }

        var sessions = await _rolloutRepository.GetAllSessionsAsync(statusFilter);
        var sessionDtos = sessions.Select(MapToSessionDto).ToList();

        return Ok(sessionDtos);
    }

    /// <summary>
    /// Gets a specific rollout session by ID
    /// </summary>
    /// <param name="id">Session ID</param>
    /// <param name="includeDays">Include days in response</param>
    /// <param name="includeWorkplaces">Include workplaces in response (requires includeDays=true)</param>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(RolloutSessionDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<RolloutSessionDto>> GetSessionById(int id, [FromQuery] bool includeDays = false, [FromQuery] bool includeWorkplaces = false)
    {
        var session = await _rolloutRepository.GetSessionByIdAsync(id, includeDays, includeWorkplaces);
        if (session == null)
        {
            return NotFound(new { message = $"Rollout session with ID {id} not found" });
        }

        var sessionDto = MapToSessionDto(session);

        // Map days if included
        if (includeDays && session.Days != null)
        {
            sessionDto.Days = session.Days.Select(MapToDayDto).ToList();
        }

        return Ok(sessionDto);
    }

    /// <summary>
    /// Creates a new rollout session
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(RolloutSessionDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<RolloutSessionDto>> CreateSession([FromBody] CreateRolloutSessionDto dto)
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

        var createdSession = await _rolloutRepository.CreateSessionAsync(session);
        var sessionDto = MapToSessionDto(createdSession);

        return CreatedAtAction(nameof(GetSessionById), new { id = createdSession.Id }, sessionDto);
    }

    /// <summary>
    /// Updates an existing rollout session
    /// </summary>
    [HttpPut("{id}")]
    [ProducesResponseType(typeof(RolloutSessionDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<RolloutSessionDto>> UpdateSession(int id, [FromBody] UpdateRolloutSessionDto dto)
    {
        var session = await _rolloutRepository.GetSessionByIdAsync(id);
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

        // Update started/completed timestamps based on status
        if (status == RolloutSessionStatus.InProgress && session.StartedAt == null)
        {
            session.StartedAt = DateTime.UtcNow;
        }
        if (status == RolloutSessionStatus.Completed && session.CompletedAt == null)
        {
            session.CompletedAt = DateTime.UtcNow;
        }

        var updatedSession = await _rolloutRepository.UpdateSessionAsync(session);
        var sessionDto = MapToSessionDto(updatedSession);

        return Ok(sessionDto);
    }

    /// <summary>
    /// Deletes a rollout session (cascade deletes days and workplaces)
    /// </summary>
    [HttpDelete("{id}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteSession(int id)
    {
        var session = await _rolloutRepository.GetSessionByIdAsync(id);
        if (session == null)
        {
            return NotFound(new { message = $"Rollout session with ID {id} not found" });
        }

        // Prevent deletion of sessions that are in progress or completed
        if (session.Status == RolloutSessionStatus.InProgress || session.Status == RolloutSessionStatus.Completed)
        {
            return BadRequest(new { message = $"Cannot delete session with status '{session.Status}'. Only Planning, Ready, or Cancelled sessions can be deleted." });
        }

        await _rolloutRepository.DeleteSessionAsync(id);
        return NoContent();
    }

    // ===== DAY ENDPOINTS =====

    /// <summary>
    /// Gets all days for a specific session
    /// </summary>
    [HttpGet("{sessionId}/days")]
    [ProducesResponseType(typeof(IEnumerable<RolloutDayDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<RolloutDayDto>>> GetDaysBySessionId(int sessionId, [FromQuery] bool includeWorkplaces = false)
    {
        var days = await _rolloutRepository.GetDaysBySessionIdAsync(sessionId, includeWorkplaces);
        var dayDtos = days.Select(MapToDayDto).ToList();

        return Ok(dayDtos);
    }

    /// <summary>
    /// Gets a specific day by ID
    /// </summary>
    [HttpGet("days/{dayId}")]
    [ProducesResponseType(typeof(RolloutDayDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<RolloutDayDto>> GetDayById(int dayId, [FromQuery] bool includeWorkplaces = false)
    {
        var day = await _rolloutRepository.GetDayByIdAsync(dayId, includeWorkplaces);
        if (day == null)
        {
            return NotFound(new { message = $"Rollout day with ID {dayId} not found" });
        }

        var dayDto = MapToDayDto(day);
        return Ok(dayDto);
    }

    /// <summary>
    /// Creates a new rollout day for a session
    /// </summary>
    [HttpPost("{sessionId}/days")]
    [ProducesResponseType(typeof(RolloutDayDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<RolloutDayDto>> CreateDay(int sessionId, [FromBody] CreateRolloutDayDto dto)
    {
        // Verify session exists
        var session = await _rolloutRepository.GetSessionByIdAsync(sessionId);
        if (session == null)
        {
            return NotFound(new { message = $"Rollout session with ID {sessionId} not found" });
        }

        var day = new RolloutDay
        {
            RolloutSessionId = dto.RolloutSessionId,
            Date = dto.Date,
            Name = dto.Name,
            DayNumber = dto.DayNumber,
            ScheduledServiceIds = string.Join(",", dto.ScheduledServiceIds),
            Notes = dto.Notes
        };

        var createdDay = await _rolloutRepository.CreateDayAsync(day);
        var dayDto = MapToDayDto(createdDay);

        return CreatedAtAction(nameof(GetDayById), new { dayId = createdDay.Id }, dayDto);
    }

    /// <summary>
    /// Updates an existing rollout day
    /// </summary>
    [HttpPut("days/{dayId}")]
    [ProducesResponseType(typeof(RolloutDayDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<RolloutDayDto>> UpdateDay(int dayId, [FromBody] UpdateRolloutDayDto dto)
    {
        var day = await _rolloutRepository.GetDayByIdAsync(dayId);
        if (day == null)
        {
            return NotFound(new { message = $"Rollout day with ID {dayId} not found" });
        }

        day.Date = dto.Date;
        day.Name = dto.Name;
        day.DayNumber = dto.DayNumber;
        day.ScheduledServiceIds = string.Join(",", dto.ScheduledServiceIds);
        day.Notes = dto.Notes;

        var updatedDay = await _rolloutRepository.UpdateDayAsync(day);
        var dayDto = MapToDayDto(updatedDay);

        return Ok(dayDto);
    }

    /// <summary>
    /// Updates the status of a rollout day (Planning → Ready → Completed)
    /// </summary>
    [HttpPatch("days/{dayId}/status")]
    [ProducesResponseType(typeof(RolloutDayDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<RolloutDayDto>> UpdateDayStatus(int dayId, [FromBody] UpdateDayStatusDto dto)
    {
        var day = await _rolloutRepository.GetDayByIdAsync(dayId);
        if (day == null)
        {
            return NotFound(new { message = $"Rollout day with ID {dayId} not found" });
        }

        if (!Enum.TryParse<RolloutDayStatus>(dto.Status, true, out var newStatus))
        {
            return BadRequest(new { message = $"Invalid status '{dto.Status}'. Valid values: Planning, Ready, Completed" });
        }

        day.Status = newStatus;
        day.UpdatedAt = DateTime.UtcNow;

        var updatedDay = await _rolloutRepository.UpdateDayAsync(day);
        var dayDto = MapToDayDto(updatedDay);

        _logger.LogInformation("Day {DayId} status changed to {Status}", dayId, newStatus);
        return Ok(dayDto);
    }

    /// <summary>
    /// Deletes a rollout day (cascade deletes workplaces)
    /// </summary>
    [HttpDelete("days/{dayId}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteDay(int dayId)
    {
        var result = await _rolloutRepository.DeleteDayAsync(dayId);
        if (!result)
        {
            return NotFound(new { message = $"Rollout day with ID {dayId} not found" });
        }

        return NoContent();
    }

    // ===== WORKPLACE ENDPOINTS =====

    /// <summary>
    /// Gets all workplaces for a specific day
    /// </summary>
    [HttpGet("days/{dayId}/workplaces")]
    [ProducesResponseType(typeof(IEnumerable<RolloutWorkplaceDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<RolloutWorkplaceDto>>> GetWorkplacesByDayId(int dayId, [FromQuery] string? status = null)
    {
        IEnumerable<RolloutWorkplace> workplaces;

        if (!string.IsNullOrWhiteSpace(status) && Enum.TryParse<RolloutWorkplaceStatus>(status, true, out var workplaceStatus))
        {
            workplaces = await _rolloutRepository.GetWorkplacesByStatusAsync(dayId, workplaceStatus);
        }
        else
        {
            workplaces = await _rolloutRepository.GetWorkplacesByDayIdAsync(dayId);
        }

        var workplaceDtos = workplaces.Select(w => MapToWorkplaceDto(w)).ToList();
        return Ok(workplaceDtos);
    }

    /// <summary>
    /// Gets a specific workplace by ID
    /// </summary>
    [HttpGet("workplaces/{workplaceId}")]
    [ProducesResponseType(typeof(RolloutWorkplaceDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<RolloutWorkplaceDto>> GetWorkplaceById(int workplaceId)
    {
        var workplace = await _rolloutRepository.GetWorkplaceByIdAsync(workplaceId);
        if (workplace == null)
        {
            return NotFound(new { message = $"Workplace with ID {workplaceId} not found" });
        }

        var workplaceDto = MapToWorkplaceDto(workplace);
        return Ok(workplaceDto);
    }

    /// <summary>
    /// Creates a new workplace for a day
    /// </summary>
    [HttpPost("days/{dayId}/workplaces")]
    [ProducesResponseType(typeof(RolloutWorkplaceDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<RolloutWorkplaceDto>> CreateWorkplace(int dayId, [FromBody] CreateRolloutWorkplaceDto dto)
    {
        // Verify day exists
        var day = await _rolloutRepository.GetDayByIdAsync(dayId);
        if (day == null)
        {
            return NotFound(new { message = $"Rollout day with ID {dayId} not found" });
        }

        var workplace = new RolloutWorkplace
        {
            RolloutDayId = dto.RolloutDayId,
            UserName = dto.UserName,
            UserEmail = dto.UserEmail,
            Location = dto.Location,
            ScheduledDate = dto.ScheduledDate,
            ServiceId = dto.ServiceId,
            IsLaptopSetup = dto.IsLaptopSetup,
            AssetPlansJson = JsonSerializer.Serialize(dto.AssetPlans),
            TotalItems = dto.AssetPlans.Count,
            Notes = dto.Notes
        };

        var createdWorkplace = await _rolloutRepository.CreateWorkplaceAsync(workplace);
        var workplaceDto = MapToWorkplaceDto(createdWorkplace);

        return CreatedAtAction(nameof(GetWorkplaceById), new { workplaceId = createdWorkplace.Id }, workplaceDto);
    }

    /// <summary>
    /// Updates an existing workplace
    /// </summary>
    [HttpPut("workplaces/{workplaceId}")]
    [ProducesResponseType(typeof(RolloutWorkplaceDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<RolloutWorkplaceDto>> UpdateWorkplace(int workplaceId, [FromBody] UpdateRolloutWorkplaceDto dto)
    {
        var workplace = await _rolloutRepository.GetWorkplaceByIdAsync(workplaceId);
        if (workplace == null)
        {
            return NotFound(new { message = $"Workplace with ID {workplaceId} not found" });
        }

        // Parse status
        if (!Enum.TryParse<RolloutWorkplaceStatus>(dto.Status, true, out var status))
        {
            return BadRequest(new { message = $"Invalid status value: {dto.Status}" });
        }

        workplace.UserName = dto.UserName;
        workplace.UserEmail = dto.UserEmail;
        workplace.Location = dto.Location;
        workplace.ScheduledDate = dto.ScheduledDate;
        workplace.ServiceId = dto.ServiceId;
        workplace.IsLaptopSetup = dto.IsLaptopSetup;
        workplace.AssetPlansJson = JsonSerializer.Serialize(dto.AssetPlans);
        workplace.Status = status;
        workplace.TotalItems = dto.AssetPlans.Count;
        workplace.CompletedItems = dto.AssetPlans.Count(p => p.Status == "installed");
        workplace.Notes = dto.Notes;

        var updatedWorkplace = await _rolloutRepository.UpdateWorkplaceAsync(workplace);
        var workplaceDto = MapToWorkplaceDto(updatedWorkplace);

        return Ok(workplaceDto);
    }

    /// <summary>
    /// Sets the status of a workplace (e.g., mark as Ready for execution)
    /// </summary>
    [HttpPost("workplaces/{workplaceId}/status")]
    [ProducesResponseType(typeof(RolloutWorkplaceDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<RolloutWorkplaceDto>> SetWorkplaceStatus(int workplaceId, [FromBody] UpdateDayStatusDto dto)
    {
        var workplace = await _rolloutRepository.GetWorkplaceByIdAsync(workplaceId);
        if (workplace == null)
        {
            return NotFound(new { message = $"Workplace with ID {workplaceId} not found" });
        }

        if (!Enum.TryParse<RolloutWorkplaceStatus>(dto.Status, true, out var newStatus))
        {
            return BadRequest(new { message = $"Invalid status value: {dto.Status}" });
        }

        workplace.Status = newStatus;
        workplace.UpdatedAt = DateTime.UtcNow;
        var updatedWorkplace = await _rolloutRepository.UpdateWorkplaceAsync(workplace);
        var workplaceDto = MapToWorkplaceDto(updatedWorkplace);

        return Ok(workplaceDto);
    }

    /// <summary>
    /// Moves a workplace to a different date by updating its scheduledDate.
    /// The workplace stays in its original planning (day) but will be executed on the new date.
    /// On the original day, it shows as a "ghost" entry (has scheduledDate different from day date).
    /// </summary>
    [HttpPost("workplaces/{workplaceId}/move")]
    [ProducesResponseType(typeof(RolloutWorkplaceDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<RolloutWorkplaceDto>> MoveWorkplace(int workplaceId, [FromBody] MoveWorkplaceDto dto)
    {
        var result = await _workplaceService.MoveWorkplaceAsync(workplaceId, dto.TargetDate);

        return result.Match(
            workplace => Ok(MapToWorkplaceDto(workplace)),
            error => error.StatusCode switch
            {
                404 => NotFound(new { message = error.ErrorMessage }),
                400 => BadRequest(new { message = error.ErrorMessage }),
                _ => StatusCode(error.StatusCode, new { message = error.ErrorMessage })
            });
    }

    /// <summary>
    /// Starts a workplace execution (sets status to InProgress)
    /// </summary>
    [HttpPost("workplaces/{workplaceId}/start")]
    [ProducesResponseType(typeof(RolloutWorkplaceDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<RolloutWorkplaceDto>> StartWorkplace(int workplaceId)
    {
        var result = await _workplaceService.StartWorkplaceAsync(workplaceId);

        return result.Match(
            workplace => Ok(MapToWorkplaceDto(workplace)),
            error => error.StatusCode switch
            {
                404 => NotFound(new { message = error.ErrorMessage }),
                400 => BadRequest(new { message = error.ErrorMessage }),
                _ => StatusCode(error.StatusCode, new { message = error.ErrorMessage })
            });
    }

    /// <summary>
    /// Marks a single asset plan item as installed or skipped
    /// </summary>
    [HttpPost("workplaces/{workplaceId}/items/{itemIndex}/status")]
    [ProducesResponseType(typeof(RolloutWorkplaceDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<RolloutWorkplaceDto>> UpdateItemStatus(int workplaceId, int itemIndex, [FromBody] UpdateItemStatusDto dto)
    {
        var result = await _workplaceService.UpdateItemStatusAsync(workplaceId, itemIndex, dto.Status);

        return result.Match(
            workplace => Ok(MapToWorkplaceDto(workplace)),
            error => error.StatusCode switch
            {
                404 => NotFound(new { message = error.ErrorMessage }),
                400 => BadRequest(new { message = error.ErrorMessage }),
                _ => StatusCode(error.StatusCode, new { message = error.ErrorMessage })
            });
    }

    /// <summary>
    /// Updates item details during execution (serial number, brand/model, asset linking)
    /// Searches for existing asset by serial, or creates a new one, then links it to the plan
    /// </summary>
    [HttpPost("workplaces/{workplaceId}/items/{itemIndex}/details")]
    [ProducesResponseType(typeof(RolloutWorkplaceDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<RolloutWorkplaceDto>> UpdateItemDetails(int workplaceId, int itemIndex, [FromBody] UpdateItemDetailsDto dto)
    {
        var result = await _workplaceService.UpdateItemDetailsAsync(workplaceId, itemIndex, dto);

        return result.Match(
            workplace => Ok(MapToWorkplaceDto(workplace)),
            error => error.StatusCode switch
            {
                404 => NotFound(new { message = error.ErrorMessage }),
                400 => BadRequest(new { message = error.ErrorMessage }),
                _ => StatusCode(error.StatusCode, new { message = error.ErrorMessage })
            });
    }

    /// <summary>
    /// Marks a workplace as completed, transitions all linked assets
    /// New assets: Nieuw -> InGebruik, sets Owner and InstallationDate
    /// Old assets: -> UitDienst
    /// </summary>
    [HttpPost("workplaces/{workplaceId}/complete")]
    [ProducesResponseType(typeof(RolloutWorkplaceDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<RolloutWorkplaceDto>> CompleteWorkplace(int workplaceId, [FromBody] CompleteWorkplaceDto dto)
    {
        var completedBy = User.FindFirstValue(ClaimTypes.Name) ?? "Unknown";
        var completedByEmail = User.FindFirstValue(ClaimTypes.Email) ?? "unknown@example.com";

        var result = await _workplaceService.CompleteWorkplaceAsync(
            workplaceId,
            dto.Notes,
            completedBy,
            completedByEmail);

        return result.Match(
            workplace => Ok(MapToWorkplaceDto(workplace)),
            error => error.StatusCode switch
            {
                404 => NotFound(new { message = error.ErrorMessage }),
                _ => StatusCode(error.StatusCode, new { message = error.ErrorMessage })
            });
    }

    /// <summary>
    /// Reopens a completed workplace for further editing
    /// Resets status to InProgress and optionally reverses asset transitions
    /// </summary>
    [HttpPost("workplaces/{workplaceId}/reopen")]
    [ProducesResponseType(typeof(RolloutWorkplaceDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<RolloutWorkplaceDto>> ReopenWorkplace(int workplaceId, [FromQuery] bool reverseAssets = false)
    {
        var result = await _workplaceService.ReopenWorkplaceAsync(workplaceId, reverseAssets);

        return result.Match(
            workplace => Ok(MapToWorkplaceDto(workplace)),
            error => error.StatusCode switch
            {
                404 => NotFound(new { message = error.ErrorMessage }),
                400 => BadRequest(new { message = error.ErrorMessage }),
                _ => StatusCode(error.StatusCode, new { message = error.ErrorMessage })
            });
    }

    /// <summary>
    /// Deletes a workplace
    /// </summary>
    [HttpDelete("workplaces/{workplaceId}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteWorkplace(int workplaceId)
    {
        var result = await _rolloutRepository.DeleteWorkplaceAsync(workplaceId);
        if (!result)
        {
            return NotFound(new { message = $"Workplace with ID {workplaceId} not found" });
        }

        return NoContent();
    }

    /// <summary>
    /// Bulk creates workplaces for a day with standard asset plans
    /// </summary>
    [HttpPost("days/{dayId}/workplaces/bulk")]
    [ProducesResponseType(typeof(BulkCreateWorkplacesResultDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<BulkCreateWorkplacesResultDto>> BulkCreateWorkplaces(int dayId, [FromBody] BulkCreateWorkplacesDto dto)
    {
        // Verify day exists
        var day = await _rolloutRepository.GetDayByIdAsync(dayId);
        if (day == null)
        {
            return NotFound(new { message = $"Rollout day with ID {dayId} not found" });
        }

        // Validate count
        if (dto.Count < 1 || dto.Count > 50)
        {
            return BadRequest(new { message = "Count must be between 1 and 50" });
        }

        // Load templates if any are specified
        var templates = await LoadTemplatesForConfigAsync(dto.AssetPlanConfig);

        // Generate standard asset plans using the config and templates
        var standardPlans = GenerateStandardAssetPlans(dto.AssetPlanConfig, templates);
        var workplaces = new List<RolloutWorkplace>();

        for (int i = 1; i <= dto.Count; i++)
        {
            workplaces.Add(new RolloutWorkplace
            {
                RolloutDayId = dayId,
                UserName = $"Werkplek {i}",
                ServiceId = dto.ServiceId,
                IsLaptopSetup = dto.IsLaptopSetup,
                AssetPlansJson = JsonSerializer.Serialize(standardPlans),
                Status = RolloutWorkplaceStatus.Pending,
                TotalItems = standardPlans.Count,
                CompletedItems = 0
            });
        }

        var createdWorkplaces = await _rolloutRepository.CreateWorkplacesAsync(workplaces);
        var workplaceDtos = createdWorkplaces.Select(w => MapToWorkplaceDto(w)).ToList();

        var result = new BulkCreateWorkplacesResultDto
        {
            Created = workplaceDtos.Count,
            Workplaces = workplaceDtos
        };

        return CreatedAtAction(nameof(GetDayById), new { dayId }, result);
    }

    /// <summary>
    /// Gets users from Azure AD by department for bulk workplace creation preview
    /// </summary>
    /// <param name="department">Department name from Azure AD</param>
    [HttpGet("graph/users")]
    [ProducesResponseType(typeof(IEnumerable<GraphUserDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<GraphUserDto>>> GetGraphUsersByDepartment([FromQuery] string department)
    {
        if (string.IsNullOrWhiteSpace(department))
        {
            return BadRequest(new { message = "Department is required" });
        }

        try
        {
            var users = await _graphUserService.GetUsersByDepartmentAsync(department);
            var userDtos = users.Select(u => new GraphUserDto
            {
                Id = u.Id ?? string.Empty,
                DisplayName = u.DisplayName ?? "Unknown",
                UserPrincipalName = u.UserPrincipalName,
                Mail = u.Mail,
                Department = u.Department,
                OfficeLocation = u.OfficeLocation,
                JobTitle = u.JobTitle
            }).ToList();

            return Ok(userDtos);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching users from Graph API for department {Department}", department);
            return StatusCode(500, new { message = $"Error fetching users: {ex.Message}" });
        }
    }

    /// <summary>
    /// Gets all unique departments from Azure AD
    /// </summary>
    [HttpGet("graph/departments")]
    [ProducesResponseType(typeof(IEnumerable<string>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<string>>> GetGraphDepartments()
    {
        try
        {
            var departments = await _graphUserService.GetAllDepartmentsAsync();
            return Ok(departments);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching departments from Graph API");
            return StatusCode(500, new { message = $"Error fetching departments: {ex.Message}" });
        }
    }

    /// <summary>
    /// Gets all service distribution groups (MG-*) from Azure AD
    /// </summary>
    [HttpGet("graph/service-groups")]
    [ProducesResponseType(typeof(IEnumerable<GraphGroupDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<GraphGroupDto>>> GetServiceGroups()
    {
        try
        {
            var groups = await _graphUserService.GetServiceGroupsAsync();
            var groupDtos = groups.Select(g => new GraphGroupDto
            {
                Id = g.Id ?? string.Empty,
                DisplayName = g.DisplayName ?? "Unknown",
                // Extract service name from "MG-<service>" format
                ServiceName = g.DisplayName?.StartsWith("MG-") == true
                    ? g.DisplayName.Substring(3)
                    : g.DisplayName ?? "Unknown",
                Description = g.Description,
                Mail = g.Mail
            }).ToList();

            return Ok(groupDtos);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching service groups from Graph API");
            return StatusCode(500, new { message = $"Error fetching service groups: {ex.Message}" });
        }
    }

    /// <summary>
    /// Gets all sector distribution groups (MG-SECTOR-*) from Azure AD
    /// </summary>
    [HttpGet("graph/sector-groups")]
    [ProducesResponseType(typeof(IEnumerable<GraphGroupDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<GraphGroupDto>>> GetSectorGroups()
    {
        try
        {
            var groups = await _graphUserService.GetSectorGroupsAsync();
            var groupDtos = groups.Select(g => new GraphGroupDto
            {
                Id = g.Id ?? string.Empty,
                DisplayName = g.DisplayName ?? "Unknown",
                // Extract sector name from "MG-SECTOR-<sector>" format
                ServiceName = g.DisplayName?.StartsWith("MG-SECTOR-") == true
                    ? g.DisplayName.Substring(10)
                    : g.DisplayName ?? "Unknown",
                Description = g.Description,
                Mail = g.Mail
            }).ToList();

            return Ok(groupDtos);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching sector groups from Graph API");
            return StatusCode(500, new { message = $"Error fetching sector groups: {ex.Message}" });
        }
    }

    /// <summary>
    /// Gets service groups (MG-*) that are nested within a sector group (MG-SECTOR-*)
    /// </summary>
    /// <param name="sectorId">Sector group Azure AD ID</param>
    [HttpGet("graph/sectors/{sectorId}/services")]
    [ProducesResponseType(typeof(IEnumerable<GraphGroupDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<GraphGroupDto>>> GetSectorServices(string sectorId)
    {
        if (string.IsNullOrWhiteSpace(sectorId))
        {
            return BadRequest(new { message = "Sector ID is required" });
        }

        try
        {
            var groups = await _graphUserService.GetSectorServiceGroupsAsync(sectorId);
            var groupDtos = groups.Select(g => new GraphGroupDto
            {
                Id = g.Id ?? string.Empty,
                DisplayName = g.DisplayName ?? "Unknown",
                // Extract service name from "MG-<service>" format
                ServiceName = g.DisplayName?.StartsWith("MG-") == true
                    ? g.DisplayName.Substring(3)
                    : g.DisplayName ?? "Unknown",
                Description = g.Description,
                Mail = g.Mail
            }).ToList();

            return Ok(groupDtos);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching services for sector {SectorId} from Graph API", sectorId);
            return StatusCode(500, new { message = $"Error fetching sector services: {ex.Message}" });
        }
    }

    /// <summary>
    /// Gets members of a specific group from Azure AD
    /// </summary>
    /// <param name="groupId">Azure AD group ID</param>
    [HttpGet("graph/groups/{groupId}/members")]
    [ProducesResponseType(typeof(IEnumerable<GraphUserDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<GraphUserDto>>> GetGroupMembers(string groupId)
    {
        if (string.IsNullOrWhiteSpace(groupId))
        {
            return BadRequest(new { message = "Group ID is required" });
        }

        try
        {
            var users = await _graphUserService.GetGroupMembersAsync(groupId);
            var userDtos = users.Select(u => new GraphUserDto
            {
                Id = u.Id ?? string.Empty,
                DisplayName = u.DisplayName ?? "Unknown",
                UserPrincipalName = u.UserPrincipalName,
                Mail = u.Mail,
                Department = u.Department,
                OfficeLocation = u.OfficeLocation,
                JobTitle = u.JobTitle
            }).ToList();

            return Ok(userDtos);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching group members from Graph API for group {GroupId}", groupId);
            return StatusCode(500, new { message = $"Error fetching group members: {ex.Message}" });
        }
    }

    /// <summary>
    /// Diagnostic endpoint to compare database services with Azure AD groups
    /// </summary>
    [HttpGet("graph/service-mapping")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult> GetServiceMapping()
    {
        try
        {
            // Get all active services from database
            var dbServices = await _serviceRepository.GetAllAsync();

            // Get all service groups from Azure AD (MG-* groups)
            var adGroups = await _graphUserService.GetServiceGroupsAsync();

            // Create mapping result
            var result = new
            {
                DatabaseServices = dbServices.Select(s => new { s.Id, s.Code, s.Name }).OrderBy(s => s.Name).ToList(),
                AzureAdGroups = adGroups.Select(g => new
                {
                    g.Id,
                    g.DisplayName,
                    ServiceName = g.DisplayName?.StartsWith("MG-") == true ? g.DisplayName.Substring(3) : g.DisplayName
                }).OrderBy(g => g.ServiceName).ToList(),
                Matches = (from db in dbServices
                           let normalizedDbName = db.Name?.ToUpperInvariant().Replace("MG-", "")
                           let matchingAd = adGroups.FirstOrDefault(g =>
                               g.DisplayName?.ToUpperInvariant() == $"MG-{normalizedDbName}" ||
                               g.DisplayName?.ToUpperInvariant().Replace("MG-", "") == normalizedDbName)
                           select new
                           {
                               DatabaseService = db.Name,
                               AzureAdGroup = matchingAd?.DisplayName,
                               IsMatched = matchingAd != null
                           }).OrderBy(m => m.DatabaseService).ToList(),
                UnmatchedDatabaseServices = (from db in dbServices
                                             let normalizedDbName = db.Name?.ToUpperInvariant().Replace("MG-", "")
                                             where !adGroups.Any(g =>
                                                 g.DisplayName?.ToUpperInvariant() == $"MG-{normalizedDbName}" ||
                                                 g.DisplayName?.ToUpperInvariant().Replace("MG-", "") == normalizedDbName)
                                             select db.Name).ToList(),
                UnmatchedAzureAdGroups = (from ad in adGroups
                                          let adServiceName = ad.DisplayName?.ToUpperInvariant().Replace("MG-", "")
                                          where !dbServices.Any(db =>
                                              db.Name?.ToUpperInvariant() == adServiceName ||
                                              db.Name?.ToUpperInvariant().Replace("MG-", "") == adServiceName)
                                          select ad.DisplayName).ToList()
            };

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error comparing services with Azure AD groups");
            return StatusCode(500, new { message = $"Error comparing services: {ex.Message}" });
        }
    }

    /// <summary>
    /// Creates workplaces from Azure AD users in a group or department
    /// </summary>
    [HttpPost("days/{dayId}/workplaces/from-graph")]
    [ProducesResponseType(typeof(BulkCreateFromGraphResultDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<BulkCreateFromGraphResultDto>> BulkCreateWorkplacesFromGraph(int dayId, [FromBody] BulkCreateFromGraphDto dto)
    {
        // Verify day exists
        var day = await _rolloutRepository.GetDayByIdAsync(dayId);
        if (day == null)
        {
            return NotFound(new { message = $"Rollout day with ID {dayId} not found" });
        }

        // Validate that either GroupId or Department is provided
        if (string.IsNullOrWhiteSpace(dto.GroupId) && string.IsNullOrWhiteSpace(dto.Department))
        {
            return BadRequest(new { message = "Either GroupId or Department is required" });
        }

        try
        {
            // Fetch users from Graph API (prefer GroupId over Department)
            IEnumerable<Microsoft.Graph.Models.User> allUsers;
            if (!string.IsNullOrWhiteSpace(dto.GroupId))
            {
                allUsers = await _graphUserService.GetGroupMembersAsync(dto.GroupId);
            }
            else
            {
                allUsers = await _graphUserService.GetUsersByDepartmentAsync(dto.Department!);
            }
            var userList = allUsers.ToList();

            // Filter to selected users if specified
            if (dto.SelectedUserIds?.Any() == true)
            {
                userList = userList.Where(u => dto.SelectedUserIds.Contains(u.Id)).ToList();
            }

            if (!userList.Any())
            {
                return BadRequest(new { message = "No users found to create workplaces for" });
            }

            // Get existing workplaces for this day to check for duplicates
            var existingWorkplaces = await _rolloutRepository.GetWorkplacesByDayIdAsync(dayId);
            var existingEmails = existingWorkplaces
                .Where(w => !string.IsNullOrWhiteSpace(w.UserEmail))
                .Select(w => w.UserEmail!.ToLowerInvariant())
                .ToHashSet();

            // Load templates if any are specified
            var templates = await LoadTemplatesForConfigAsync(dto.AssetPlanConfig);

            // Generate standard asset plans
            var standardPlans = GenerateStandardAssetPlans(dto.AssetPlanConfig, templates);
            var workplacesToCreate = new List<RolloutWorkplace>();
            var skippedUsers = new List<string>();

            foreach (var user in userList)
            {
                var email = user.UserPrincipalName ?? user.Mail;
                if (!string.IsNullOrWhiteSpace(email) && existingEmails.Contains(email.ToLowerInvariant()))
                {
                    skippedUsers.Add(user.DisplayName ?? email);
                    continue;
                }

                workplacesToCreate.Add(new RolloutWorkplace
                {
                    RolloutDayId = dayId,
                    UserName = user.DisplayName ?? "Unknown",
                    UserEmail = user.UserPrincipalName ?? user.Mail,
                    ServiceId = dto.ServiceId,
                    Location = user.OfficeLocation,
                    IsLaptopSetup = dto.AssetPlanConfig.IncludeLaptop,
                    AssetPlansJson = JsonSerializer.Serialize(standardPlans),
                    Status = RolloutWorkplaceStatus.Pending,
                    TotalItems = standardPlans.Count,
                    CompletedItems = 0
                });
            }

            if (!workplacesToCreate.Any())
            {
                return BadRequest(new { message = "All users already have workplaces assigned", skippedUsers });
            }

            var createdWorkplaces = await _rolloutRepository.CreateWorkplacesAsync(workplacesToCreate);
            var workplaceDtos = createdWorkplaces.Select(w => MapToWorkplaceDto(w)).ToList();

            var result = new BulkCreateFromGraphResultDto
            {
                Created = workplaceDtos.Count,
                Skipped = skippedUsers.Count,
                Workplaces = workplaceDtos,
                SkippedUsers = skippedUsers
            };

            _logger.LogInformation("Created {Created} workplaces from Graph API department {Department}, skipped {Skipped}",
                result.Created, dto.Department, result.Skipped);

            return CreatedAtAction(nameof(GetDayById), new { dayId }, result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating workplaces from Graph API for department {Department}", dto.Department);
            return StatusCode(500, new { message = $"Error creating workplaces: {ex.Message}" });
        }
    }

    /// <summary>
    /// Gets new assets for a day (for QR code printing)
    /// </summary>
    [HttpGet("days/{dayId}/new-assets")]
    [ProducesResponseType(typeof(List<AssetDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<List<AssetDto>>> GetNewAssetsForDay(int dayId)
    {
        // Verify day exists
        var day = await _rolloutRepository.GetDayByIdAsync(dayId);
        if (day == null)
        {
            return NotFound(new { message = $"Rollout day with ID {dayId} not found" });
        }

        // Get all workplaces for this day
        var workplaces = await _rolloutRepository.GetWorkplacesByDayIdAsync(dayId);
        var assetIds = new HashSet<int>();

        // Extract asset IDs from asset plans that require QR codes
        foreach (var workplace in workplaces)
        {
            var assetPlans = string.IsNullOrWhiteSpace(workplace.AssetPlansJson)
                ? new List<AssetPlanDto>()
                : JsonSerializer.Deserialize<List<AssetPlanDto>>(workplace.AssetPlansJson) ?? new List<AssetPlanDto>();

            foreach (var plan in assetPlans.Where(p => p.ExistingAssetId.HasValue))
            {
                assetIds.Add(plan.ExistingAssetId.Value);
            }
        }

        if (!assetIds.Any())
        {
            return Ok(new List<AssetDto>());
        }

        // Fetch all assets in a single batch query
        var assets = (await _assetRepository.GetByIdsAsync(assetIds)).ToList();

        // Map to DTOs
        var assetDtos = assets.Select(a => new AssetDto
        {
            Id = a.Id,
            AssetCode = a.AssetCode,
            AssetName = a.AssetName,
            AssetTypeId = a.AssetTypeId,
            AssetType = a.AssetType != null ? new AssetTypeInfo { Id = a.AssetType.Id, Name = a.AssetType.Name } : null,
            ServiceId = a.ServiceId,
            Service = a.Service != null ? new ServiceInfo { Id = a.Service.Id, Name = a.Service.Name } : null,
            SerialNumber = a.SerialNumber,
            Brand = a.Brand,
            Model = a.Model,
            Status = a.Status.ToString(),
            IsDummy = a.IsDummy,
            CreatedAt = a.CreatedAt,
            UpdatedAt = a.UpdatedAt
        }).ToList();

        return Ok(assetDtos);
    }

    // ===== STATISTICS & REPORTING ENDPOINTS =====

    /// <summary>
    /// Gets comprehensive statistics for a rollout session
    /// </summary>
    [HttpGet("{sessionId}/progress")]
    [ProducesResponseType(typeof(RolloutProgressDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<RolloutProgressDto>> GetSessionProgress(int sessionId)
    {
        var session = await _rolloutRepository.GetSessionByIdAsync(sessionId, includeDays: true);
        if (session == null)
        {
            return NotFound(new { message = $"Rollout session with ID {sessionId} not found" });
        }

        var stats = await _rolloutRepository.GetSessionStatsAsync(sessionId);
        var days = await _rolloutRepository.GetDaysBySessionIdAsync(sessionId);

        var progressDto = new RolloutProgressDto
        {
            SessionId = session.Id,
            SessionName = session.SessionName,
            Status = session.Status.ToString(),
            TotalDays = stats.TotalDays,
            TotalWorkplaces = stats.TotalWorkplaces,
            CompletedWorkplaces = stats.CompletedWorkplaces,
            PendingWorkplaces = stats.PendingWorkplaces,
            InProgressWorkplaces = stats.InProgressWorkplaces,
            SkippedWorkplaces = stats.SkippedWorkplaces,
            FailedWorkplaces = stats.FailedWorkplaces,
            CompletionPercentage = stats.CompletionPercentage,
            DayProgress = days.Select(d => new DayProgressDto
            {
                DayId = d.Id,
                Date = d.Date,
                Name = d.Name,
                TotalWorkplaces = d.TotalWorkplaces,
                CompletedWorkplaces = d.CompletedWorkplaces,
                CompletionPercentage = d.TotalWorkplaces > 0 ? Math.Round((decimal)d.CompletedWorkplaces / d.TotalWorkplaces * 100, 2) : 0
            }).ToList()
        };

        return Ok(progressDto);
    }

    // ===== HELPER MAPPING METHODS =====

    /// <summary>
    /// Loads templates specified in the asset plan config
    /// </summary>
    /// <param name="config">Asset plan configuration with optional template IDs</param>
    /// <returns>Dictionary of templates keyed by their ID</returns>
    private async Task<Dictionary<int, AssetTemplate>> LoadTemplatesForConfigAsync(StandardAssetPlanConfig config)
    {
        var templateIds = new List<int?>
        {
            config.LaptopTemplateId,
            config.DesktopTemplateId,
            config.DockingTemplateId,
            config.MonitorTemplateId,
            config.KeyboardTemplateId,
            config.MouseTemplateId
        };

        var validIds = templateIds.Where(id => id.HasValue).Select(id => id!.Value).Distinct().ToList();

        if (!validIds.Any())
        {
            return new Dictionary<int, AssetTemplate>();
        }

        var templates = new Dictionary<int, AssetTemplate>();
        foreach (var id in validIds)
        {
            var template = await _assetTemplateRepository.GetByIdAsync(id);
            if (template != null)
            {
                templates[id] = template;
            }
        }

        return templates;
    }

    /// <summary>
    /// Generates standard asset plans based on configuration
    /// </summary>
    /// <param name="config">Asset plan configuration with optional template IDs</param>
    /// <param name="templates">Pre-loaded templates dictionary (key: templateId, value: template)</param>
    private static List<AssetPlanDto> GenerateStandardAssetPlans(
        StandardAssetPlanConfig config,
        Dictionary<int, AssetTemplate>? templates = null)
    {
        var plans = new List<AssetPlanDto>();
        templates ??= new Dictionary<int, AssetTemplate>();

        // Helper to get template data
        AssetTemplate? GetTemplate(int? templateId) =>
            templateId.HasValue && templates.TryGetValue(templateId.Value, out var t) ? t : null;

        // Laptop
        if (config.IncludeLaptop)
        {
            var template = GetTemplate(config.LaptopTemplateId);
            plans.Add(new AssetPlanDto
            {
                EquipmentType = "laptop",
                CreateNew = false,
                RequiresSerialNumber = true,
                RequiresQRCode = false, // Existing asset (swap)
                Status = "pending",
                Brand = template?.Brand,
                Model = template?.Model,
                Metadata = new Dictionary<string, string>()
            });
        }

        // Desktop
        if (config.IncludeDesktop)
        {
            var template = GetTemplate(config.DesktopTemplateId);
            plans.Add(new AssetPlanDto
            {
                EquipmentType = "desktop",
                CreateNew = false,
                RequiresSerialNumber = true,
                RequiresQRCode = false, // Existing asset (swap)
                Status = "pending",
                Brand = template?.Brand,
                Model = template?.Model,
                Metadata = new Dictionary<string, string>()
            });
        }

        // Docking Station - CreateNew=false until serial number is entered
        if (config.IncludeDocking)
        {
            var template = GetTemplate(config.DockingTemplateId);
            plans.Add(new AssetPlanDto
            {
                EquipmentType = "docking",
                CreateNew = false,
                RequiresSerialNumber = true,
                RequiresQRCode = true,
                Status = "pending",
                Brand = template?.Brand,
                Model = template?.Model,
                Metadata = new Dictionary<string, string>()
            });
        }

        // Monitors - CreateNew=true so assets are created automatically
        var monitorTemplate = GetTemplate(config.MonitorTemplateId);
        for (int i = 0; i < config.MonitorCount; i++)
        {
            var position = i switch
            {
                0 when config.MonitorCount == 1 => "center",
                0 when config.MonitorCount >= 2 => "left",
                1 when config.MonitorCount == 2 => "right",
                1 when config.MonitorCount == 3 => "center",
                2 => "right",
                _ => "center"
            };

            plans.Add(new AssetPlanDto
            {
                EquipmentType = "monitor",
                CreateNew = true,
                RequiresSerialNumber = false,
                RequiresQRCode = true,
                Status = "pending",
                Brand = monitorTemplate?.Brand,
                Model = monitorTemplate?.Model,
                Metadata = new Dictionary<string, string>
                {
                    { "position", position },
                    { "hasCamera", "false" }
                }
            });
        }

        // Keyboard - CreateNew=true so assets are created automatically
        if (config.IncludeKeyboard)
        {
            var template = GetTemplate(config.KeyboardTemplateId);
            plans.Add(new AssetPlanDto
            {
                EquipmentType = "keyboard",
                CreateNew = true,
                RequiresSerialNumber = false,
                RequiresQRCode = true,
                Status = "pending",
                Brand = template?.Brand,
                Model = template?.Model,
                Metadata = new Dictionary<string, string>()
            });
        }

        // Mouse - CreateNew=true so assets are created automatically
        if (config.IncludeMouse)
        {
            var template = GetTemplate(config.MouseTemplateId);
            plans.Add(new AssetPlanDto
            {
                EquipmentType = "mouse",
                CreateNew = true,
                RequiresSerialNumber = false,
                RequiresQRCode = true,
                Status = "pending",
                Brand = template?.Brand,
                Model = template?.Model,
                Metadata = new Dictionary<string, string>()
            });
        }

        return plans;
    }

    private RolloutSessionDto MapToSessionDto(RolloutSession session)
    {
        var days = session.Days ?? new List<RolloutDay>();
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
            TotalDays = days.Count,
            TotalWorkplaces = days.Sum(d => d.TotalWorkplaces),
            CompletedWorkplaces = days.Sum(d => d.CompletedWorkplaces),
            CompletionPercentage = days.Sum(d => d.TotalWorkplaces) > 0
                ? Math.Round((decimal)days.Sum(d => d.CompletedWorkplaces) / days.Sum(d => d.TotalWorkplaces) * 100, 1)
                : 0
        };
    }

    private RolloutDayDto MapToDayDto(RolloutDay day)
    {
        var scheduledServiceIds = string.IsNullOrWhiteSpace(day.ScheduledServiceIds)
            ? new List<int>()
            : day.ScheduledServiceIds.Split(',', StringSplitOptions.RemoveEmptyEntries)
                .Where(s => int.TryParse(s, out _))
                .Select(int.Parse)
                .ToList();

        var dto = new RolloutDayDto
        {
            Id = day.Id,
            RolloutSessionId = day.RolloutSessionId,
            Date = day.Date,
            Name = day.Name,
            DayNumber = day.DayNumber,
            ScheduledServiceIds = scheduledServiceIds,
            Status = day.Status.ToString(),
            TotalWorkplaces = day.TotalWorkplaces,
            CompletedWorkplaces = day.CompletedWorkplaces,
            Notes = day.Notes,
            CreatedAt = day.CreatedAt,
            UpdatedAt = day.UpdatedAt
        };

        // Map workplaces if included
        if (day.Workplaces != null && day.Workplaces.Any())
        {
            dto.Workplaces = day.Workplaces.Select(w => MapToWorkplaceDto(w)).ToList();
        }

        return dto;
    }

    private RolloutWorkplaceDto MapToWorkplaceDto(RolloutWorkplace workplace, DateTime? movedToDate = null, DateTime? movedFromDate = null)
    {
        var assetPlans = string.IsNullOrWhiteSpace(workplace.AssetPlansJson)
            ? new List<AssetPlanDto>()
            : JsonSerializer.Deserialize<List<AssetPlanDto>>(workplace.AssetPlansJson) ?? new List<AssetPlanDto>();

        return new RolloutWorkplaceDto
        {
            Id = workplace.Id,
            RolloutDayId = workplace.RolloutDayId,
            UserName = workplace.UserName,
            UserEmail = workplace.UserEmail,
            Location = workplace.Location,
            ScheduledDate = workplace.ScheduledDate,
            ServiceId = workplace.ServiceId,
            ServiceName = workplace.Service?.Name,
            IsLaptopSetup = workplace.IsLaptopSetup,
            AssetPlans = assetPlans,
            Status = workplace.Status.ToString(),
            TotalItems = workplace.TotalItems,
            CompletedItems = workplace.CompletedItems,
            CompletedAt = workplace.CompletedAt,
            CompletedBy = workplace.CompletedBy,
            CompletedByEmail = workplace.CompletedByEmail,
            Notes = workplace.Notes,
            MovedToWorkplaceId = workplace.MovedToWorkplaceId,
            MovedFromWorkplaceId = workplace.MovedFromWorkplaceId,
            MovedToDate = movedToDate,
            MovedFromDate = movedFromDate,
            CreatedAt = workplace.CreatedAt,
            UpdatedAt = workplace.UpdatedAt
        };
    }
}

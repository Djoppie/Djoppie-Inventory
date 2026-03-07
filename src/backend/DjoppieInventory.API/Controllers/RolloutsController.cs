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
    private readonly ILogger<RolloutsController> _logger;

    public RolloutsController(IRolloutRepository rolloutRepository, IAssetRepository assetRepository, ILogger<RolloutsController> logger)
    {
        _rolloutRepository = rolloutRepository;
        _assetRepository = assetRepository;
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
        var result = await _rolloutRepository.DeleteSessionAsync(id);
        if (!result)
        {
            return NotFound(new { message = $"Rollout session with ID {id} not found" });
        }

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

        var workplaceDtos = workplaces.Select(MapToWorkplaceDto).ToList();
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
    /// Marks a workplace as completed
    /// </summary>
    [HttpPost("workplaces/{workplaceId}/complete")]
    [ProducesResponseType(typeof(RolloutWorkplaceDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<RolloutWorkplaceDto>> CompleteWorkplace(int workplaceId, [FromBody] CompleteWorkplaceDto dto)
    {
        var workplace = await _rolloutRepository.GetWorkplaceByIdAsync(workplaceId);
        if (workplace == null)
        {
            return NotFound(new { message = $"Workplace with ID {workplaceId} not found" });
        }

        workplace.Status = RolloutWorkplaceStatus.Completed;
        workplace.CompletedAt = DateTime.UtcNow;
        workplace.CompletedBy = User.FindFirstValue(ClaimTypes.Name) ?? "Unknown";
        workplace.CompletedByEmail = User.FindFirstValue(ClaimTypes.Email) ?? "unknown@example.com";
        if (!string.IsNullOrWhiteSpace(dto.Notes))
        {
            workplace.Notes = dto.Notes;
        }

        var updatedWorkplace = await _rolloutRepository.UpdateWorkplaceAsync(workplace);
        var workplaceDto = MapToWorkplaceDto(updatedWorkplace);

        return Ok(workplaceDto);
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

        // Generate standard asset plans using the config
        var standardPlans = GenerateStandardAssetPlans(dto.AssetPlanConfig);
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
        var workplaceDtos = createdWorkplaces.Select(MapToWorkplaceDto).ToList();

        var result = new BulkCreateWorkplacesResultDto
        {
            Created = workplaceDtos.Count,
            Workplaces = workplaceDtos
        };

        return CreatedAtAction(nameof(GetDayById), new { dayId }, result);
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

            foreach (var plan in assetPlans.Where(p => p.RequiresQRCode && p.ExistingAssetId.HasValue))
            {
                assetIds.Add(plan.ExistingAssetId.Value);
            }
        }

        if (!assetIds.Any())
        {
            return Ok(new List<AssetDto>());
        }

        // Fetch assets (using filter by IDs)
        var assets = new List<Asset>();
        foreach (var assetId in assetIds)
        {
            var asset = await _assetRepository.GetByIdAsync(assetId);
            if (asset != null)
            {
                assets.Add(asset);
            }
        }

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
    /// Generates standard asset plans based on configuration
    /// </summary>
    private static List<AssetPlanDto> GenerateStandardAssetPlans(StandardAssetPlanConfig config)
    {
        var plans = new List<AssetPlanDto>();

        // Laptop
        if (config.IncludeLaptop)
        {
            plans.Add(new AssetPlanDto
            {
                EquipmentType = "laptop",
                CreateNew = false,
                RequiresSerialNumber = true,
                RequiresQRCode = false, // Existing asset (swap)
                Status = "pending",
                Metadata = new Dictionary<string, string>()
            });
        }

        // Desktop
        if (config.IncludeDesktop)
        {
            plans.Add(new AssetPlanDto
            {
                EquipmentType = "desktop",
                CreateNew = false,
                RequiresSerialNumber = true,
                RequiresQRCode = false, // Existing asset (swap)
                Status = "pending",
                Metadata = new Dictionary<string, string>()
            });
        }

        // Docking Station
        if (config.IncludeDocking)
        {
            plans.Add(new AssetPlanDto
            {
                EquipmentType = "docking",
                CreateNew = false,
                RequiresSerialNumber = true,
                RequiresQRCode = true, // New asset
                Status = "pending",
                Metadata = new Dictionary<string, string>()
            });
        }

        // Monitors
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
                CreateNew = false,
                RequiresSerialNumber = false,
                RequiresQRCode = true, // New asset
                Status = "pending",
                Metadata = new Dictionary<string, string>
                {
                    { "position", position },
                    { "hasCamera", "false" }
                }
            });
        }

        // Keyboard
        if (config.IncludeKeyboard)
        {
            plans.Add(new AssetPlanDto
            {
                EquipmentType = "keyboard",
                CreateNew = false,
                RequiresSerialNumber = false,
                RequiresQRCode = true,
                Status = "pending",
                Metadata = new Dictionary<string, string>()
            });
        }

        // Mouse
        if (config.IncludeMouse)
        {
            plans.Add(new AssetPlanDto
            {
                EquipmentType = "mouse",
                CreateNew = false,
                RequiresSerialNumber = false,
                RequiresQRCode = true,
                Status = "pending",
                Metadata = new Dictionary<string, string>()
            });
        }

        return plans;
    }

    private RolloutSessionDto MapToSessionDto(RolloutSession session)
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
            UpdatedAt = session.UpdatedAt
        };
    }

    private RolloutDayDto MapToDayDto(RolloutDay day)
    {
        var scheduledServiceIds = string.IsNullOrWhiteSpace(day.ScheduledServiceIds)
            ? new List<int>()
            : day.ScheduledServiceIds.Split(',', StringSplitOptions.RemoveEmptyEntries)
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
            TotalWorkplaces = day.TotalWorkplaces,
            CompletedWorkplaces = day.CompletedWorkplaces,
            Notes = day.Notes,
            CreatedAt = day.CreatedAt,
            UpdatedAt = day.UpdatedAt
        };

        // Map workplaces if included
        if (day.Workplaces != null && day.Workplaces.Any())
        {
            dto.Workplaces = day.Workplaces.Select(MapToWorkplaceDto).ToList();
        }

        return dto;
    }

    private RolloutWorkplaceDto MapToWorkplaceDto(RolloutWorkplace workplace)
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
            CreatedAt = workplace.CreatedAt,
            UpdatedAt = workplace.UpdatedAt
        };
    }
}

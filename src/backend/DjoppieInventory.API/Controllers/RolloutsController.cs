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
    private readonly IAssetCodeGenerator _assetCodeGenerator;
    private readonly ILogger<RolloutsController> _logger;

    public RolloutsController(IRolloutRepository rolloutRepository, IAssetRepository assetRepository, IAssetCodeGenerator assetCodeGenerator, ILogger<RolloutsController> logger)
    {
        _rolloutRepository = rolloutRepository;
        _assetRepository = assetRepository;
        _assetCodeGenerator = assetCodeGenerator;
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
    /// Starts a workplace execution (sets status to InProgress)
    /// </summary>
    [HttpPost("workplaces/{workplaceId}/start")]
    [ProducesResponseType(typeof(RolloutWorkplaceDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<RolloutWorkplaceDto>> StartWorkplace(int workplaceId)
    {
        var workplace = await _rolloutRepository.GetWorkplaceByIdAsync(workplaceId);
        if (workplace == null)
        {
            return NotFound(new { message = $"Workplace with ID {workplaceId} not found" });
        }

        if (workplace.Status != RolloutWorkplaceStatus.Pending)
        {
            return BadRequest(new { message = $"Workplace is already {workplace.Status}" });
        }

        workplace.Status = RolloutWorkplaceStatus.InProgress;
        var updatedWorkplace = await _rolloutRepository.UpdateWorkplaceAsync(workplace);
        var workplaceDto = MapToWorkplaceDto(updatedWorkplace);

        return Ok(workplaceDto);
    }

    /// <summary>
    /// Marks a single asset plan item as installed or skipped
    /// </summary>
    [HttpPost("workplaces/{workplaceId}/items/{itemIndex}/status")]
    [ProducesResponseType(typeof(RolloutWorkplaceDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<RolloutWorkplaceDto>> UpdateItemStatus(int workplaceId, int itemIndex, [FromBody] UpdateItemStatusDto dto)
    {
        var workplace = await _rolloutRepository.GetWorkplaceByIdAsync(workplaceId);
        if (workplace == null)
        {
            return NotFound(new { message = $"Workplace with ID {workplaceId} not found" });
        }

        var assetPlans = string.IsNullOrWhiteSpace(workplace.AssetPlansJson)
            ? new List<AssetPlanDto>()
            : JsonSerializer.Deserialize<List<AssetPlanDto>>(workplace.AssetPlansJson) ?? new List<AssetPlanDto>();

        if (itemIndex < 0 || itemIndex >= assetPlans.Count)
        {
            return BadRequest(new { message = $"Item index {itemIndex} is out of range (0-{assetPlans.Count - 1})" });
        }

        assetPlans[itemIndex].Status = dto.Status;
        workplace.AssetPlansJson = JsonSerializer.Serialize(assetPlans);
        workplace.CompletedItems = assetPlans.Count(p => p.Status == "installed");

        // Auto-set to InProgress if still Pending
        if (workplace.Status == RolloutWorkplaceStatus.Pending)
        {
            workplace.Status = RolloutWorkplaceStatus.InProgress;
        }

        var updatedWorkplace = await _rolloutRepository.UpdateWorkplaceAsync(workplace);
        var workplaceDto = MapToWorkplaceDto(updatedWorkplace);

        return Ok(workplaceDto);
    }

    /// <summary>
    /// Updates item details during execution (serial number, brand/model, asset linking)
    /// Searches for existing asset by serial, or creates a new one, then links it to the plan
    /// </summary>
    [HttpPost("workplaces/{workplaceId}/items/{itemIndex}/details")]
    [ProducesResponseType(typeof(RolloutWorkplaceDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<RolloutWorkplaceDto>> UpdateItemDetails(int workplaceId, int itemIndex, [FromBody] UpdateItemDetailsDto dto)
    {
        var workplace = await _rolloutRepository.GetWorkplaceByIdAsync(workplaceId);
        if (workplace == null)
        {
            return NotFound(new { message = $"Workplace with ID {workplaceId} not found" });
        }

        var assetPlans = string.IsNullOrWhiteSpace(workplace.AssetPlansJson)
            ? new List<AssetPlanDto>()
            : JsonSerializer.Deserialize<List<AssetPlanDto>>(workplace.AssetPlansJson) ?? new List<AssetPlanDto>();

        if (itemIndex < 0 || itemIndex >= assetPlans.Count)
        {
            return BadRequest(new { message = $"Item index {itemIndex} is out of range (0-{assetPlans.Count - 1})" });
        }

        var plan = assetPlans[itemIndex];

        // Update brand/model if provided
        if (!string.IsNullOrWhiteSpace(dto.Brand))
            plan.Brand = dto.Brand;
        if (!string.IsNullOrWhiteSpace(dto.Model))
            plan.Model = dto.Model;

        // Update user name if provided
        if (!string.IsNullOrWhiteSpace(dto.UserName))
            workplace.UserName = dto.UserName;

        // Handle old asset serial number (asset being replaced)
        if (!string.IsNullOrWhiteSpace(dto.OldSerialNumber))
        {
            var oldAsset = await _assetRepository.GetBySerialNumberAsync(dto.OldSerialNumber);
            if (oldAsset != null)
            {
                plan.OldAssetId = oldAsset.Id;
                plan.OldAssetCode = oldAsset.AssetCode;
                plan.OldAssetName = oldAsset.AssetName;
                plan.Metadata ??= new Dictionary<string, string>();
                plan.Metadata["oldSerial"] = dto.OldSerialNumber;
            }
        }

        // Handle new asset serial number (search or create)
        if (!string.IsNullOrWhiteSpace(dto.SerialNumber))
        {
            plan.Metadata ??= new Dictionary<string, string>();
            plan.Metadata["serialNumber"] = dto.SerialNumber;

            // First check if another asset already has this serial number
            var existingAsset = await _assetRepository.GetBySerialNumberAsync(dto.SerialNumber);
            if (existingAsset != null)
            {
                // Link to existing asset
                plan.ExistingAssetId = existingAsset.Id;
                plan.ExistingAssetCode = existingAsset.AssetCode;
                plan.ExistingAssetName = existingAsset.AssetName;
                plan.CreateNew = false;
                _logger.LogInformation("Linked existing asset {AssetCode} (serial: {Serial}) to workplace {WorkplaceId} item {ItemIndex}",
                    existingAsset.AssetCode, dto.SerialNumber, workplaceId, itemIndex);
            }
            else if (plan.ExistingAssetId.HasValue)
            {
                // No other asset has this serial — update serial on the already-linked asset
                var linkedAsset = await _assetRepository.GetByIdAsync(plan.ExistingAssetId.Value);
                if (linkedAsset != null && string.IsNullOrEmpty(linkedAsset.SerialNumber))
                {
                    linkedAsset.SerialNumber = dto.SerialNumber;
                    linkedAsset.UpdatedAt = DateTime.UtcNow;
                    await _assetRepository.UpdateAsync(linkedAsset);
                    _logger.LogInformation("Updated serial number on existing asset {AssetCode} to {Serial}",
                        linkedAsset.AssetCode, dto.SerialNumber);
                }
            }
            else
            {
                // Create new asset
                var assetTypeCode = plan.EquipmentType.ToLower() switch
                {
                    "laptop" => "LAP",
                    "desktop" => "DESK",
                    "docking" => "DOCK",
                    "monitor" => "MON",
                    "keyboard" => "KEYB",
                    "mouse" => "MOUSE",
                    _ => (string?)null
                };

                if (assetTypeCode != null)
                {
                    var assetType = await _rolloutRepository.GetAssetTypeByCodeAsync(assetTypeCode);
                    if (assetType != null)
                    {
                        // Build AssetName: DOCK-serial / MON-serial, or type_brand_model for others
                        string assetName;
                        var typeUpper = plan.EquipmentType.ToUpper();
                        if ((typeUpper == "DOCKING" || typeUpper == "MONITOR") && !string.IsNullOrEmpty(dto.SerialNumber))
                        {
                            var namePrefix = typeUpper == "DOCKING" ? "DOCK" : "MON";
                            assetName = $"{namePrefix}-{dto.SerialNumber}";
                        }
                        else
                        {
                            var assetNameParts = new List<string> { plan.EquipmentType.ToLower() };
                            if (!string.IsNullOrEmpty(plan.Brand)) assetNameParts.Add(plan.Brand.ToLower().Replace(" ", "_"));
                            if (!string.IsNullOrEmpty(plan.Model)) assetNameParts.Add(plan.Model.ToLower().Replace(" ", "_"));
                            assetName = string.Join("_", assetNameParts);
                        }

                        // Use centralized AssetCodeGeneratorService (4-char brand code, proper numbering)
                        var generatedCode = await _assetCodeGenerator.GenerateCodeAsync(
                            assetType.Id, plan.Brand, DateTime.UtcNow.Year, false);

                        var newAsset = new Asset
                        {
                            AssetTypeId = assetType.Id,
                            Category = assetType.Name,
                            AssetCode = generatedCode,
                            AssetName = assetName,
                            Brand = plan.Brand,
                            Model = plan.Model,
                            SerialNumber = dto.SerialNumber,
                            Status = AssetStatus.Nieuw,
                            ServiceId = workplace.ServiceId,
                            IsDummy = false,
                            CreatedAt = DateTime.UtcNow,
                            UpdatedAt = DateTime.UtcNow
                        };

                        var createdAsset = await _assetRepository.CreateAsync(newAsset);
                        plan.ExistingAssetId = createdAsset.Id;
                        plan.ExistingAssetCode = createdAsset.AssetCode;
                        plan.ExistingAssetName = createdAsset.AssetName;
                        plan.CreateNew = false;

                        _logger.LogInformation("Created new asset {AssetCode} (serial: {Serial}) for workplace {WorkplaceId} item {ItemIndex}",
                            createdAsset.AssetCode, dto.SerialNumber, workplaceId, itemIndex);
                    }
                }
            }
        }

        // Mark as installed if requested
        if (dto.MarkAsInstalled)
        {
            plan.Status = "installed";
            workplace.CompletedItems = assetPlans.Count(p => p.Status == "installed");
        }

        // Auto-set to InProgress if still Pending
        if (workplace.Status == RolloutWorkplaceStatus.Pending)
        {
            workplace.Status = RolloutWorkplaceStatus.InProgress;
        }

        workplace.AssetPlansJson = JsonSerializer.Serialize(assetPlans);
        var updatedWorkplace = await _rolloutRepository.UpdateWorkplaceAsync(workplace);
        var workplaceDto = MapToWorkplaceDto(updatedWorkplace);

        return Ok(workplaceDto);
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
        var workplace = await _rolloutRepository.GetWorkplaceByIdAsync(workplaceId);
        if (workplace == null)
        {
            return NotFound(new { message = $"Workplace with ID {workplaceId} not found" });
        }

        // Parse asset plans
        var assetPlans = string.IsNullOrWhiteSpace(workplace.AssetPlansJson)
            ? new List<AssetPlanDto>()
            : JsonSerializer.Deserialize<List<AssetPlanDto>>(workplace.AssetPlansJson) ?? new List<AssetPlanDto>();

        // Capture user info before entering transaction (HttpContext not available in lambda)
        var completedBy = User.FindFirstValue(ClaimTypes.Name) ?? "Unknown";
        var completedByEmail = User.FindFirstValue(ClaimTypes.Email) ?? "unknown@example.com";

        try
        {
            // Use ExecuteInTransactionAsync to properly handle Azure SQL's retry execution strategy
            await _rolloutRepository.ExecuteInTransactionAsync(async () =>
            {
                // Transition linked assets
                foreach (var plan in assetPlans)
                {
                    // New/existing asset → InGebruik
                    if (plan.ExistingAssetId.HasValue)
                    {
                        var asset = await _assetRepository.GetByIdAsync(plan.ExistingAssetId.Value);
                        if (asset != null)
                        {
                            asset.Status = AssetStatus.InGebruik;
                            asset.InstallationDate = DateTime.UtcNow;
                            asset.Owner = workplace.UserName;
                            asset.ServiceId = workplace.ServiceId;
                            asset.InstallationLocation = workplace.Location;
                            asset.UpdatedAt = DateTime.UtcNow;
                            await _assetRepository.UpdateAsync(asset);
                            _logger.LogInformation("Asset {AssetCode} transitioned to InGebruik for {User}", asset.AssetCode, workplace.UserName);
                        }
                    }

                    // Old asset → UitDienst
                    if (plan.OldAssetId.HasValue)
                    {
                        var oldAsset = await _assetRepository.GetByIdAsync(plan.OldAssetId.Value);
                        if (oldAsset != null)
                        {
                            oldAsset.Status = AssetStatus.UitDienst;
                            oldAsset.UpdatedAt = DateTime.UtcNow;
                            await _assetRepository.UpdateAsync(oldAsset);
                            _logger.LogInformation("Old asset {AssetCode} decommissioned (UitDienst)", oldAsset.AssetCode);
                        }
                    }

                    // Mark pending items as installed (preserve skipped status)
                    if (plan.Status != "skipped")
                    {
                        plan.Status = "installed";
                    }
                }

                // Update workplace
                workplace.AssetPlansJson = JsonSerializer.Serialize(assetPlans);
                workplace.Status = RolloutWorkplaceStatus.Completed;
                workplace.CompletedItems = assetPlans.Count(p => p.Status == "installed");
                workplace.CompletedAt = DateTime.UtcNow;
                workplace.CompletedBy = completedBy;
                workplace.CompletedByEmail = completedByEmail;
                workplace.UpdatedAt = DateTime.UtcNow;
                if (!string.IsNullOrWhiteSpace(dto.Notes))
                {
                    workplace.Notes = dto.Notes;
                }

                // Save all changes directly without triggering ProcessAssetPlansAsync
                await _rolloutRepository.SaveChangesAsync();

                // Update day totals to reflect the completed workplace
                await _rolloutRepository.UpdateDayTotalsAsync(workplace.RolloutDayId);
            });

            var workplaceDto = MapToWorkplaceDto(workplace);
            return Ok(workplaceDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to complete workplace {WorkplaceId}, transaction rolled back. Exception: {ExceptionType}, Message: {Message}, Inner: {InnerMessage}",
                workplaceId, ex.GetType().Name, ex.Message, ex.InnerException?.Message ?? "None");

            // Include detailed error info in development/staging environments
            var errorDetails = $"{ex.GetType().Name}: {ex.Message}";
            if (ex.InnerException != null)
            {
                errorDetails += $" -> {ex.InnerException.GetType().Name}: {ex.InnerException.Message}";
            }

            return StatusCode(500, new {
                message = "Er is een fout opgetreden bij het voltooien van de werkplek. Alle wijzigingen zijn teruggedraaid.",
                details = errorDetails
            });
        }
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

        // Docking Station - CreateNew=false until serial number is entered
        if (config.IncludeDocking)
        {
            plans.Add(new AssetPlanDto
            {
                EquipmentType = "docking",
                CreateNew = false,
                RequiresSerialNumber = true,
                RequiresQRCode = true,
                Status = "pending",
                Metadata = new Dictionary<string, string>()
            });
        }

        // Monitors - CreateNew=true so assets are created automatically
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
            plans.Add(new AssetPlanDto
            {
                EquipmentType = "keyboard",
                CreateNew = true,
                RequiresSerialNumber = false,
                RequiresQRCode = true,
                Status = "pending",
                Metadata = new Dictionary<string, string>()
            });
        }

        // Mouse - CreateNew=true so assets are created automatically
        if (config.IncludeMouse)
        {
            plans.Add(new AssetPlanDto
            {
                EquipmentType = "mouse",
                CreateNew = true,
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

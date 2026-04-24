using System.Text.Json;
using DjoppieInventory.Core.DTOs;
using DjoppieInventory.Core.DTOs.Rollout;
using DjoppieInventory.Core.Entities;
using DjoppieInventory.Core.Entities.Enums;
using DjoppieInventory.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DjoppieInventory.API.Controllers.Operations.Rollout;

/// <summary>
/// API controller for managing rollout days.
/// Handles CRUD operations for rollout days within sessions.
/// </summary>
[ApiController]
[Route("api/operations/rollouts/days")]
[Authorize]
public class RolloutDaysController : ControllerBase
{
    private readonly IRolloutRepository _rolloutRepository;
    private readonly IServiceRepository _serviceRepository;
    private readonly IWorkplaceAssetAssignmentService _assignmentService;
    private readonly IGraphUserService _graphUserService;
    private readonly IAssetRepository _assetRepository;
    private readonly ILogger<RolloutDaysController> _logger;

    public RolloutDaysController(
        IRolloutRepository rolloutRepository,
        IServiceRepository serviceRepository,
        IWorkplaceAssetAssignmentService assignmentService,
        IGraphUserService graphUserService,
        IAssetRepository assetRepository,
        ILogger<RolloutDaysController> logger)
    {
        _rolloutRepository = rolloutRepository;
        _serviceRepository = serviceRepository;
        _assignmentService = assignmentService;
        _graphUserService = graphUserService;
        _assetRepository = assetRepository;
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
    [HttpPatch("{id}/status")]
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

    /// <summary>
    /// Gets all workplaces for a specific day.
    /// </summary>
    /// <param name="id">Day ID</param>
    /// <param name="includeAssignments">Include asset assignments for each workplace</param>
    /// <param name="cancellationToken">Cancellation token</param>
    [HttpGet("{id}/workplaces")]
    [ProducesResponseType(typeof(IEnumerable<RolloutWorkplaceDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<IEnumerable<RolloutWorkplaceDto>>> GetWorkplaces(
        int id,
        [FromQuery] bool includeAssignments = true,
        CancellationToken cancellationToken = default)
    {
        // Verify day exists
        var day = await _rolloutRepository.GetDayByIdAsync(id, false, cancellationToken);
        if (day == null)
        {
            return NotFound(new { message = $"Rollout day with ID {id} not found" });
        }

        var workplaces = await _rolloutRepository.GetWorkplacesByDayIdAsync(id, cancellationToken);
        var dtos = new List<RolloutWorkplaceDto>();

        // Include asset assignments for each workplace if requested
        foreach (var workplace in workplaces)
        {
            var dto = MapToWorkplaceDto(workplace);

            if (includeAssignments)
            {
                var assignments = await _assignmentService.GetByWorkplaceIdAsync(workplace.Id, cancellationToken);
                dto.AssetAssignments = assignments.ToList();

                // Parse AssetPlans from legacy JSON (use _jsonOptions for case-insensitive parsing)
                if (!string.IsNullOrEmpty(workplace.AssetPlansJson) && workplace.AssetPlansJson != "[]")
                {
                    try
                    {
                        var legacyPlans = System.Text.Json.JsonSerializer.Deserialize<List<AssetPlanDto>>(workplace.AssetPlansJson, _jsonOptions);
                        if (legacyPlans != null && legacyPlans.Count > 0)
                        {
                            dto.AssetPlans = legacyPlans;
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "Failed to parse AssetPlansJson for workplace {WorkplaceId}", workplace.Id);
                    }
                }

                // Recompute TotalItems / CompletedItems from the authoritative source every
                // time the workplace is read. The stored columns on RolloutWorkplace drift
                // because RolloutWorkplaceService overwrites CompletedItems from the JSON
                // plan while WorkplaceAssetAssignmentService increments both counters on
                // the relational table — mixing those two paths produced "7 / 6 items" on
                // the execution page. Relational assignments are the truth when present;
                // otherwise fall back to the legacy JSON plans.
                if (dto.AssetAssignments.Count > 0)
                {
                    dto.TotalItems = dto.AssetAssignments.Count;
                    dto.CompletedItems = dto.AssetAssignments.Count(a => a.Status == AssetAssignmentStatus.Installed);
                }
                else if (dto.AssetPlans.Count > 0)
                {
                    dto.TotalItems = dto.AssetPlans.Count;
                    dto.CompletedItems = dto.AssetPlans.Count(p => string.Equals(p.Status, "installed", StringComparison.OrdinalIgnoreCase));
                }
            }

            dtos.Add(dto);
        }

        return Ok(dtos);
    }

    /// <summary>
    /// Gets all assets assigned to workplaces for a specific day.
    /// Used for QR code printing and verification before rollout execution.
    /// Returns all assets that are assigned to workplaces in this day (from both
    /// relational WorkplaceAssetAssignment and legacy AssetPlansJson).
    /// </summary>
    /// <param name="id">Day ID</param>
    /// <param name="cancellationToken">Cancellation token</param>
    [HttpGet("{id}/new-assets")]
    [ProducesResponseType(typeof(IEnumerable<AssetDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<IEnumerable<AssetDto>>> GetNewAssets(
        int id,
        CancellationToken cancellationToken = default)
    {
        // Verify day exists
        var day = await _rolloutRepository.GetDayByIdAsync(id, false, cancellationToken);
        if (day == null)
        {
            return NotFound(new { message = $"Rollout day with ID {id} not found" });
        }

        // Get all workplaces for this day
        var workplaces = await _rolloutRepository.GetWorkplacesByDayIdAsync(id, cancellationToken);

        // Collect all asset IDs from both relational assignments and legacy JSON
        var assetIds = new HashSet<int>();
        foreach (var workplace in workplaces)
        {
            // Check relational assignments first
            var assignments = await _assignmentService.GetByWorkplaceIdAsync(workplace.Id, cancellationToken);
            foreach (var assignment in assignments.Where(a => a.NewAssetId.HasValue))
            {
                assetIds.Add(assignment.NewAssetId!.Value);
            }

            // Also check legacy AssetPlansJson field
            if (!string.IsNullOrEmpty(workplace.AssetPlansJson) && workplace.AssetPlansJson != "[]")
            {
                try
                {
                    var legacyPlans = JsonSerializer.Deserialize<List<AssetPlanDto>>(workplace.AssetPlansJson, _jsonOptions);
                    if (legacyPlans != null)
                    {
                        foreach (var plan in legacyPlans.Where(p => p.ExistingAssetId.HasValue))
                        {
                            assetIds.Add(plan.ExistingAssetId!.Value);
                        }
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to parse AssetPlansJson for workplace {WorkplaceId} when getting new assets", workplace.Id);
                }
            }
        }

        if (assetIds.Count == 0)
        {
            return Ok(Array.Empty<AssetDto>());
        }

        // Get the actual assets
        var assets = await _assetRepository.GetByIdsAsync(assetIds, cancellationToken);

        // Return all assigned assets (no status filter - user can print labels for any assigned asset)
        var assignedAssets = assets
            .Select(MapToAssetDto)
            .ToList();

        return Ok(assignedAssets);
    }

    /// <summary>
    /// Creates a new workplace for a day.
    /// </summary>
    /// <param name="id">Day ID</param>
    /// <param name="dto">Workplace creation data</param>
    /// <param name="cancellationToken">Cancellation token</param>
    [HttpPost("{id}/workplaces")]
    [ProducesResponseType(typeof(RolloutWorkplaceDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<RolloutWorkplaceDto>> CreateWorkplace(
        int id,
        [FromBody] CreateRolloutWorkplaceDto dto,
        CancellationToken cancellationToken = default)
    {
        // Verify day exists
        var day = await _rolloutRepository.GetDayByIdAsync(id, false, cancellationToken);
        if (day == null)
        {
            return NotFound(new { message = $"Rollout day with ID {id} not found" });
        }

        var workplace = new RolloutWorkplace
        {
            RolloutDayId = id,
            UserName = dto.UserName,
            UserEmail = dto.UserEmail,
            UserEntraId = dto.UserEntraId,
            Location = dto.Location,
            ScheduledDate = dto.ScheduledDate,
            ServiceId = dto.ServiceId,
            PhysicalWorkplaceId = dto.PhysicalWorkplaceId,
            IsLaptopSetup = dto.IsLaptopSetup,
            Status = RolloutWorkplaceStatus.Pending,
            Notes = dto.Notes,
            AssetPlansJson = JsonSerializer.Serialize(dto.AssetPlans, _jsonOptions),
            TotalItems = dto.AssetPlans.Count,
        };

        var createdWorkplace = await _rolloutRepository.CreateWorkplaceAsync(workplace, cancellationToken);

        // Bridge: also create relational assignments from asset plans
        if (dto.AssetPlans.Count > 0)
        {
            await SyncAssignmentsFromPlansAsync(createdWorkplace.Id, dto.AssetPlans, cancellationToken);
        }

        _logger.LogInformation("Created rollout workplace {WorkplaceId} for day {DayId}", createdWorkplace.Id, id);

        return CreatedAtAction(nameof(GetWorkplaces), new { id = id }, MapToWorkplaceDto(createdWorkplace));
    }

    /// <summary>
    /// Bulk creates workplaces from Azure AD group members.
    /// </summary>
    /// <param name="id">Day ID</param>
    /// <param name="dto">Bulk creation data including group ID and asset configuration</param>
    /// <param name="cancellationToken">Cancellation token</param>
    [HttpPost("{id}/workplaces/from-graph")]
    [ProducesResponseType(typeof(BulkCreateFromGraphResultDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<BulkCreateFromGraphResultDto>> BulkCreateFromGraph(
        int id,
        [FromBody] BulkCreateFromGraphDto dto,
        CancellationToken cancellationToken = default)
    {
        // Verify day exists
        var day = await _rolloutRepository.GetDayByIdAsync(id, true, cancellationToken);
        if (day == null)
        {
            return NotFound(new { message = $"Rollout day with ID {id} not found" });
        }

        if (string.IsNullOrWhiteSpace(dto.GroupId))
        {
            return BadRequest(new { message = "GroupId is required" });
        }

        _logger.LogInformation(
            "Bulk creating workplaces for day {DayId} from Graph group {GroupId}",
            id, dto.GroupId);

        // Fetch users from the group
        var users = await _graphUserService.GetGroupMembersAsync(dto.GroupId, top: 200);
        var usersList = users.ToList();

        if (usersList.Count == 0)
        {
            return Ok(new BulkCreateFromGraphResultDto
            {
                Created = 0,
                Skipped = 0,
                Workplaces = new List<RolloutWorkplaceDto>(),
                SkippedUsers = new List<string>()
            });
        }

        // Filter by selected user IDs if provided
        if (dto.SelectedUserIds != null && dto.SelectedUserIds.Count > 0)
        {
            usersList = usersList.Where(u => dto.SelectedUserIds.Contains(u.Id ?? string.Empty)).ToList();
        }

        var createdWorkplaces = new List<RolloutWorkplaceDto>();
        var skippedUsers = new List<string>();
        var existingWorkplaces = day.Workplaces ?? new List<RolloutWorkplace>();

        foreach (var user in usersList)
        {
            // Skip if workplace already exists for this user's email
            if (!string.IsNullOrEmpty(user.Mail) &&
                existingWorkplaces.Any(w => w.UserEmail?.Equals(user.Mail, StringComparison.OrdinalIgnoreCase) == true))
            {
                skippedUsers.Add(user.DisplayName ?? user.Mail ?? "Unknown");
                continue;
            }

            // Create workplace
            var workplace = new RolloutWorkplace
            {
                RolloutDayId = id,
                UserName = user.DisplayName ?? "Unknown",
                UserEmail = user.Mail,
                UserEntraId = user.Id,
                Location = user.OfficeLocation,
                ScheduledDate = day.Date,
                ServiceId = dto.ServiceId,
                IsLaptopSetup = dto.AssetPlanConfig.IncludeLaptop,
                Status = RolloutWorkplaceStatus.Pending
            };

            var createdWorkplace = await _rolloutRepository.CreateWorkplaceAsync(workplace, cancellationToken);

            // Create asset assignments based on asset plan config
            await CreateAssetAssignmentsFromConfigAsync(
                createdWorkplace.Id,
                dto.AssetPlanConfig,
                cancellationToken);

            createdWorkplaces.Add(MapToWorkplaceDto(createdWorkplace));

            _logger.LogInformation(
                "Created workplace {WorkplaceId} for user {UserName} ({UserEmail})",
                createdWorkplace.Id, user.DisplayName, user.Mail);
        }

        // Update day totals
        day.TotalWorkplaces += createdWorkplaces.Count;
        day.UpdatedAt = DateTime.UtcNow;
        await _rolloutRepository.UpdateDayAsync(day, cancellationToken);

        _logger.LogInformation(
            "Bulk created {Created} workplaces, skipped {Skipped} users for day {DayId}",
            createdWorkplaces.Count, skippedUsers.Count, id);

        return Ok(new BulkCreateFromGraphResultDto
        {
            Created = createdWorkplaces.Count,
            Skipped = skippedUsers.Count,
            Workplaces = createdWorkplaces,
            SkippedUsers = skippedUsers
        });
    }

    /// <summary>
    /// Creates asset assignments for a workplace based on standard asset plan configuration.
    /// Skips assignment creation to avoid complexity - assignments will be created during execution.
    /// </summary>
    private Task CreateAssetAssignmentsFromConfigAsync(
        int workplaceId,
        StandardAssetPlanConfig config,
        CancellationToken cancellationToken)
    {
        // NOTE: Asset assignments are skipped during bulk import to keep the implementation simple.
        // Assignments will be created manually or automatically during rollout execution.
        // This allows the bulk import to focus on creating workplaces for users.

        return Task.CompletedTask;
    }

    /// <summary>
    /// Syncs relational assignments from asset plans (bridge from JSON to relational model).
    /// NOTE: This is a placeholder - full sync happens when workplace is updated via RolloutWorkplacesController.
    /// The AssetPlansJson remains the source of truth.
    /// </summary>
    private Task SyncAssignmentsFromPlansAsync(int workplaceId, List<AssetPlanDto> plans, CancellationToken ct)
    {
        // Relational assignments will be synced when the workplace is updated via the main update endpoint.
        // For now, AssetPlansJson is the authoritative source.
        _logger.LogInformation("Workplace {WorkplaceId} created with {Count} asset plans", workplaceId, plans.Count);
        return Task.CompletedTask;
    }

    #region Private Mapping Methods

    private static RolloutDayDto MapToDto(RolloutDay day)
    {
        var (totalWorkplaces, completedWorkplaces) = ResolveWorkplaceCounts(day);

        return new RolloutDayDto
        {
            Id = day.Id,
            RolloutSessionId = day.RolloutSessionId,
            Date = day.Date,
            Name = day.Name,
            DayNumber = day.DayNumber,
            ScheduledServiceIds = ParseScheduledServiceIds(day.ScheduledServiceIds),
            TotalWorkplaces = totalWorkplaces,
            CompletedWorkplaces = completedWorkplaces,
            Status = day.Status.ToString(),
            Notes = day.Notes,
            CreatedAt = day.CreatedAt,
            UpdatedAt = day.UpdatedAt,
            Workplaces = day.Workplaces?.Select(MapToWorkplaceDto).ToList()
        };
    }

    private static RolloutDayWithSessionDto MapToDtoWithSession(RolloutDay day)
    {
        var (totalWorkplaces, completedWorkplaces) = ResolveWorkplaceCounts(day);

        return new RolloutDayWithSessionDto
        {
            Id = day.Id,
            RolloutSessionId = day.RolloutSessionId,
            Date = day.Date,
            Name = day.Name,
            DayNumber = day.DayNumber,
            ScheduledServiceIds = ParseScheduledServiceIds(day.ScheduledServiceIds),
            TotalWorkplaces = totalWorkplaces,
            CompletedWorkplaces = completedWorkplaces,
            Status = day.Status.ToString(),
            Notes = day.Notes,
            CreatedAt = day.CreatedAt,
            UpdatedAt = day.UpdatedAt,
            Workplaces = day.Workplaces?.Select(MapToWorkplaceDto).ToList(),
            SessionName = day.RolloutSession?.SessionName ?? string.Empty,
            SessionStatus = day.RolloutSession?.Status.ToString() ?? string.Empty
        };
    }

    // Prefer the actual Workplaces collection when it is loaded — the stored
    // RolloutDay.TotalWorkplaces / CompletedWorkplaces columns drift because
    // they are maintained by ++/-- increments in RolloutWorkplacesController
    // that are easy to skip in edge paths (reschedule, cancel mid-flow),
    // producing impossible ratios like 7/5 on the planner. When the
    // collection is not loaded, fall back to the stored counters.
    private static (int Total, int Completed) ResolveWorkplaceCounts(RolloutDay day)
    {
        if (day.Workplaces is { Count: > 0 } workplaces)
        {
            var total = workplaces.Count;
            var completed = workplaces.Count(w => w.Status == RolloutWorkplaceStatus.Completed);
            return (total, completed);
        }

        return (day.TotalWorkplaces, day.CompletedWorkplaces);
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

    // Shared JSON options for AssetPlansJson parsing (must match RolloutWorkplacesController)
    private static readonly JsonSerializerOptions _jsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    private static RolloutWorkplaceDto MapToWorkplaceDto(RolloutWorkplace workplace)
    {
        // Parse AssetPlans from JSON
        var assetPlans = new List<AssetPlanDto>();
        if (!string.IsNullOrEmpty(workplace.AssetPlansJson) && workplace.AssetPlansJson != "[]")
        {
            try
            {
                var parsed = JsonSerializer.Deserialize<List<AssetPlanDto>>(workplace.AssetPlansJson, _jsonOptions);
                if (parsed != null && parsed.Count > 0)
                {
                    assetPlans = parsed;
                }
            }
            catch
            {
                // Ignore parse errors — return empty list
            }
        }

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
            PhysicalWorkplaceId = workplace.PhysicalWorkplaceId,
            PhysicalWorkplaceCode = workplace.PhysicalWorkplace?.Code,
            PhysicalWorkplaceName = workplace.PhysicalWorkplace?.Name,
            ScheduledDate = workplace.ScheduledDate,
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
            CreatedAt = workplace.CreatedAt,
            UpdatedAt = workplace.UpdatedAt
        };
    }

    private static AssetDto MapToAssetDto(Asset asset)
    {
        return new AssetDto
        {
            Id = asset.Id,
            AssetCode = asset.AssetCode,
            AssetName = asset.AssetName,
            Alias = asset.Alias,
            Category = asset.Category ?? string.Empty,
            IsDummy = asset.IsDummy,
            AssetTypeId = asset.AssetTypeId,
            AssetType = asset.AssetType != null ? new AssetTypeInfo
            {
                Id = asset.AssetType.Id,
                Code = asset.AssetType.Code,
                Name = asset.AssetType.Name
            } : null,
            ServiceId = asset.ServiceId,
            Service = asset.Service != null ? new ServiceInfo
            {
                Id = asset.Service.Id,
                Code = asset.Service.Code,
                Name = asset.Service.Name
            } : null,
            InstallationLocation = asset.InstallationLocation,
            PhysicalWorkplaceId = asset.PhysicalWorkplaceId,
            BuildingId = asset.BuildingId,
            Building = asset.Building != null ? new BuildingInfo
            {
                Id = asset.Building.Id,
                Code = asset.Building.Code,
                Name = asset.Building.Name
            } : null,
            LegacyBuilding = asset.LegacyBuilding,
            LegacyDepartment = asset.LegacyDepartment,
            EmployeeId = asset.EmployeeId,
            Owner = asset.Owner,
            JobTitle = asset.JobTitle,
            OfficeLocation = asset.OfficeLocation,
            Status = asset.Status.ToString(),
            Brand = asset.Brand,
            Model = asset.Model,
            SerialNumber = asset.SerialNumber,
            PurchaseDate = asset.PurchaseDate,
            WarrantyExpiry = asset.WarrantyExpiry,
            InstallationDate = asset.InstallationDate,
            IntuneEnrollmentDate = asset.IntuneEnrollmentDate,
            IntuneLastCheckIn = asset.IntuneLastCheckIn,
            IntuneCertificateExpiry = asset.IntuneCertificateExpiry,
            IntuneSyncedAt = asset.IntuneSyncedAt,
            CreatedAt = asset.CreatedAt,
            UpdatedAt = asset.UpdatedAt
        };
    }

    #endregion
}

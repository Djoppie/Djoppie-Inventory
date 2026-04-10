using DjoppieInventory.Core.DTOs;
using DjoppieInventory.Core.DTOs.Rollout;
using DjoppieInventory.Core.Entities;
using DjoppieInventory.Core.Entities.Enums;
using DjoppieInventory.Core.Interfaces;
using DjoppieInventory.Infrastructure.Data;
using DjoppieInventory.Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.Text.Json;

namespace DjoppieInventory.API.Controllers.Rollout;

/// <summary>
/// API controller for managing rollout workplaces and their asset assignments.
/// Handles workplace CRUD, execution workflow, and asset assignment operations.
/// </summary>
[ApiController]
[Route("api/rollout/workplaces")]
[Authorize]
public class RolloutWorkplacesController : ControllerBase
{
    private readonly IRolloutRepository _rolloutRepository;
    private readonly IWorkplaceAssetAssignmentService _assignmentService;
    private readonly IAssetMovementService _movementService;
    private readonly IRolloutWorkplaceService _workplaceService;
    private readonly AssetPlanSyncService _syncService;
    private readonly ApplicationDbContext _context;
    private readonly ILogger<RolloutWorkplacesController> _logger;

    public RolloutWorkplacesController(
        IRolloutRepository rolloutRepository,
        IWorkplaceAssetAssignmentService assignmentService,
        IAssetMovementService movementService,
        IRolloutWorkplaceService workplaceService,
        AssetPlanSyncService syncService,
        ApplicationDbContext context,
        ILogger<RolloutWorkplacesController> logger)
    {
        _rolloutRepository = rolloutRepository;
        _assignmentService = assignmentService;
        _movementService = movementService;
        _workplaceService = workplaceService;
        _syncService = syncService;
        _context = context;
        _logger = logger;
    }

    // ===== WORKPLACE CRUD =====

    /// <summary>
    /// Gets all workplaces for a specific day.
    /// </summary>
    /// <param name="dayId">Day ID</param>
    /// <param name="cancellationToken">Cancellation token</param>
    [HttpGet("by-day/{dayId}")]
    [ProducesResponseType(typeof(IEnumerable<RolloutWorkplaceDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<RolloutWorkplaceDto>>> GetByDayId(
        int dayId,
        CancellationToken cancellationToken = default)
    {
        var workplaces = await _rolloutRepository.GetWorkplacesByDayIdAsync(dayId, cancellationToken);
        var dtos = workplaces.Select(MapToDto).ToList();

        return Ok(dtos);
    }

    /// <summary>
    /// Gets a specific workplace by ID.
    /// </summary>
    /// <param name="id">Workplace ID</param>
    /// <param name="includeAssignments">Include asset assignments</param>
    /// <param name="cancellationToken">Cancellation token</param>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(RolloutWorkplaceDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<RolloutWorkplaceDto>> GetById(
        int id,
        [FromQuery] bool includeAssignments = true,
        CancellationToken cancellationToken = default)
    {
        var workplace = await _rolloutRepository.GetWorkplaceByIdAsync(id, cancellationToken);
        if (workplace == null)
        {
            return NotFound(new { message = $"Workplace with ID {id} not found" });
        }

        var dto = MapToDto(workplace);

        // Include asset assignments if requested
        if (includeAssignments)
        {
            var assignments = await _assignmentService.GetByWorkplaceIdAsync(id, cancellationToken);
            dto.AssetAssignments = assignments.ToList();

            // Convert to AssetPlans for frontend compatibility
            dto.AssetPlans = await _syncService.ConvertToAssetPlansAsync(id, cancellationToken);

            // Fallback to legacy JSON if no relational assignments exist
            if (dto.AssetPlans.Count == 0 && !string.IsNullOrEmpty(workplace.AssetPlansJson) && workplace.AssetPlansJson != "[]")
            {
                try
                {
                    var legacyPlans = System.Text.Json.JsonSerializer.Deserialize<List<AssetPlanDto>>(workplace.AssetPlansJson);
                    if (legacyPlans != null && legacyPlans.Count > 0)
                    {
                        dto.AssetPlans = legacyPlans;
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to parse AssetPlansJson for workplace {WorkplaceId}", id);
                }
            }
        }

        return Ok(dto);
    }

    /// <summary>
    /// Creates a new workplace for a day.
    /// </summary>
    /// <param name="dayId">Day ID</param>
    /// <param name="dto">Workplace creation data</param>
    /// <param name="cancellationToken">Cancellation token</param>
    [HttpPost("for-day/{dayId}")]
    [ProducesResponseType(typeof(RolloutWorkplaceDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<RolloutWorkplaceDto>> Create(
        int dayId,
        [FromBody] CreateRolloutWorkplaceDto dto,
        CancellationToken cancellationToken = default)
    {
        // Verify day exists
        var day = await _rolloutRepository.GetDayByIdAsync(dayId, false, cancellationToken);
        if (day == null)
        {
            return NotFound(new { message = $"Rollout day with ID {dayId} not found" });
        }

        var workplace = new RolloutWorkplace
        {
            RolloutDayId = dayId,
            UserName = dto.UserName,
            UserEmail = dto.UserEmail,
            UserEntraId = dto.UserEntraId,
            Location = dto.Location,
            ScheduledDate = dto.ScheduledDate,
            ServiceId = dto.ServiceId,
            PhysicalWorkplaceId = dto.PhysicalWorkplaceId,
            IsLaptopSetup = dto.IsLaptopSetup,
            Status = RolloutWorkplaceStatus.Pending,
            Notes = dto.Notes
        };

        var createdWorkplace = await _rolloutRepository.CreateWorkplaceAsync(workplace, cancellationToken);

        // If a physical workplace is assigned, update its occupant
        if (dto.PhysicalWorkplaceId.HasValue)
        {
            var physicalWorkplace = await _context.PhysicalWorkplaces
                .FirstOrDefaultAsync(pw => pw.Id == dto.PhysicalWorkplaceId.Value, cancellationToken);

            if (physicalWorkplace != null)
            {
                // Set the user as the occupant of this physical workplace
                physicalWorkplace.CurrentOccupantEntraId = dto.UserEntraId;
                physicalWorkplace.CurrentOccupantName = dto.UserName;
                physicalWorkplace.CurrentOccupantEmail = dto.UserEmail;
                physicalWorkplace.OccupiedSince = DateTime.UtcNow;
                physicalWorkplace.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync(cancellationToken);

                _logger.LogInformation(
                    "Assigned user {UserName} as occupant of physical workplace {WorkplaceCode}",
                    physicalWorkplace.CurrentOccupantName,
                    physicalWorkplace.Code);
            }
        }

        // Update day totals
        day.TotalWorkplaces++;
        day.UpdatedAt = DateTime.UtcNow;
        await _rolloutRepository.UpdateDayAsync(day, cancellationToken);

        _logger.LogInformation("Created workplace {WorkplaceId} for day {DayId}: {UserName}",
            createdWorkplace.Id, dayId, createdWorkplace.UserName);

        return CreatedAtAction(nameof(GetById), new { id = createdWorkplace.Id }, MapToDto(createdWorkplace));
    }

    /// <summary>
    /// Updates an existing workplace.
    /// </summary>
    /// <param name="id">Workplace ID</param>
    /// <param name="dto">Updated workplace data</param>
    /// <param name="cancellationToken">Cancellation token</param>
    [HttpPut("{id}")]
    [ProducesResponseType(typeof(RolloutWorkplaceDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<RolloutWorkplaceDto>> Update(
        int id,
        [FromBody] UpdateRolloutWorkplaceDto dto,
        CancellationToken cancellationToken = default)
    {
        var workplace = await _rolloutRepository.GetWorkplaceByIdAsync(id, cancellationToken);
        if (workplace == null)
        {
            return NotFound(new { message = $"Workplace with ID {id} not found" });
        }

        var previousPhysicalWorkplaceId = workplace.PhysicalWorkplaceId;

        workplace.UserName = dto.UserName ?? workplace.UserName;
        workplace.UserEmail = dto.UserEmail;
        workplace.UserEntraId = dto.UserEntraId ?? workplace.UserEntraId;
        workplace.Location = dto.Location;
        workplace.ScheduledDate = dto.ScheduledDate;
        workplace.ServiceId = dto.ServiceId;
        workplace.PhysicalWorkplaceId = dto.PhysicalWorkplaceId;
        workplace.IsLaptopSetup = dto.IsLaptopSetup;
        workplace.Notes = dto.Notes;
        workplace.Status = Enum.Parse<RolloutWorkplaceStatus>(dto.Status);

        // Update AssetPlansJson from DTO
        workplace.AssetPlansJson = JsonSerializer.Serialize(dto.AssetPlans);

        workplace.UpdatedAt = DateTime.UtcNow;

        var updatedWorkplace = await _rolloutRepository.UpdateWorkplaceAsync(workplace, cancellationToken);

        // If a physical workplace is assigned, update its occupant
        if (dto.PhysicalWorkplaceId.HasValue)
        {
            var physicalWorkplace = await _context.PhysicalWorkplaces
                .FirstOrDefaultAsync(pw => pw.Id == dto.PhysicalWorkplaceId.Value, cancellationToken);

            if (physicalWorkplace != null)
            {
                // Set the user as the occupant of this physical workplace
                physicalWorkplace.CurrentOccupantEntraId = dto.UserEntraId ?? workplace.UserEntraId;
                physicalWorkplace.CurrentOccupantName = dto.UserName ?? workplace.UserName;
                physicalWorkplace.CurrentOccupantEmail = dto.UserEmail ?? workplace.UserEmail;
                physicalWorkplace.OccupiedSince = DateTime.UtcNow;
                physicalWorkplace.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync(cancellationToken);

                _logger.LogInformation(
                    "Assigned user {UserName} as occupant of physical workplace {WorkplaceCode}",
                    physicalWorkplace.CurrentOccupantName,
                    physicalWorkplace.Code);
            }
        }

        // If the physical workplace was changed, clear the occupant from the previous one
        if (previousPhysicalWorkplaceId.HasValue && previousPhysicalWorkplaceId != dto.PhysicalWorkplaceId)
        {
            var previousPhysicalWorkplace = await _context.PhysicalWorkplaces
                .FirstOrDefaultAsync(pw => pw.Id == previousPhysicalWorkplaceId.Value, cancellationToken);

            if (previousPhysicalWorkplace != null)
            {
                previousPhysicalWorkplace.CurrentOccupantEntraId = null;
                previousPhysicalWorkplace.CurrentOccupantName = null;
                previousPhysicalWorkplace.CurrentOccupantEmail = null;
                previousPhysicalWorkplace.OccupiedSince = null;
                previousPhysicalWorkplace.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync(cancellationToken);

                _logger.LogInformation(
                    "Cleared occupant from physical workplace {WorkplaceCode}",
                    previousPhysicalWorkplace.Code);
            }
        }

        _logger.LogInformation("Updated workplace {WorkplaceId}", id);

        return Ok(MapToDto(updatedWorkplace));
    }

    /// <summary>
    /// Deletes a workplace and its asset assignments.
    /// </summary>
    /// <param name="id">Workplace ID</param>
    /// <param name="cancellationToken">Cancellation token</param>
    [HttpDelete("{id}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Delete(
        int id,
        CancellationToken cancellationToken = default)
    {
        var workplace = await _rolloutRepository.GetWorkplaceByIdAsync(id, cancellationToken);
        if (workplace == null)
        {
            return NotFound(new { message = $"Workplace with ID {id} not found" });
        }

        // Prevent deletion if workplace is completed
        if (workplace.Status == RolloutWorkplaceStatus.Completed)
        {
            return BadRequest(new { message = "Cannot delete a completed workplace." });
        }

        // Delete assignments first
        await _assignmentService.DeleteByWorkplaceIdAsync(id, cancellationToken);

        // Update day totals
        var day = await _rolloutRepository.GetDayByIdAsync(workplace.RolloutDayId, false, cancellationToken);
        if (day != null)
        {
            day.TotalWorkplaces--;
            if (workplace.Status == RolloutWorkplaceStatus.Completed)
            {
                day.CompletedWorkplaces--;
            }
            day.UpdatedAt = DateTime.UtcNow;
            await _rolloutRepository.UpdateDayAsync(day, cancellationToken);
        }

        await _rolloutRepository.DeleteWorkplaceAsync(id, cancellationToken);

        _logger.LogInformation("Deleted workplace {WorkplaceId}", id);

        return NoContent();
    }

    // ===== EXECUTION WORKFLOW =====

    /// <summary>
    /// Starts the execution of a workplace (changes status to InProgress).
    /// </summary>
    /// <param name="id">Workplace ID</param>
    /// <param name="cancellationToken">Cancellation token</param>
    [HttpPost("{id}/start")]
    [ProducesResponseType(typeof(RolloutWorkplaceDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<RolloutWorkplaceDto>> Start(
        int id,
        CancellationToken cancellationToken = default)
    {
        var workplace = await _rolloutRepository.GetWorkplaceByIdAsync(id, cancellationToken);
        if (workplace == null)
        {
            return NotFound(new { message = $"Workplace with ID {id} not found" });
        }

        if (workplace.Status != RolloutWorkplaceStatus.Pending &&
            workplace.Status != RolloutWorkplaceStatus.Ready)
        {
            return BadRequest(new { message = $"Cannot start workplace with status '{workplace.Status}'." });
        }

        workplace.Status = RolloutWorkplaceStatus.InProgress;
        workplace.UpdatedAt = DateTime.UtcNow;

        var updatedWorkplace = await _rolloutRepository.UpdateWorkplaceAsync(workplace, cancellationToken);

        _logger.LogInformation("Started workplace execution {WorkplaceId}", id);

        return Ok(MapToDto(updatedWorkplace));
    }

    /// <summary>
    /// Completes a workplace and processes all asset assignments.
    /// </summary>
    /// <param name="id">Workplace ID</param>
    /// <param name="dto">Completion data</param>
    /// <param name="cancellationToken">Cancellation token</param>
    [HttpPost("{id}/complete")]
    [ProducesResponseType(typeof(RolloutWorkplaceDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<RolloutWorkplaceDto>> Complete(
        int id,
        [FromBody] CompleteWorkplaceDto dto,
        CancellationToken cancellationToken = default)
    {
        var workplace = await _rolloutRepository.GetWorkplaceByIdAsync(id, cancellationToken);
        if (workplace == null)
        {
            return NotFound(new { message = $"Workplace with ID {id} not found" });
        }

        if (workplace.Status != RolloutWorkplaceStatus.InProgress)
        {
            return BadRequest(new { message = $"Cannot complete workplace with status '{workplace.Status}'. Workplace must be in InProgress status." });
        }

        var performedBy = User.FindFirstValue(ClaimTypes.Name) ?? "Unknown";
        var performedByEmail = User.FindFirstValue(ClaimTypes.Email) ?? "unknown@example.com";

        // Complete all pending assignments
        var completedCount = await _assignmentService.CompleteWorkplaceAssignmentsAsync(
            id, performedBy, performedByEmail, cancellationToken);

        // Update workplace status
        workplace.Status = RolloutWorkplaceStatus.Completed;
        workplace.CompletedAt = DateTime.UtcNow;
        workplace.CompletedBy = performedBy;
        workplace.CompletedByEmail = performedByEmail;
        workplace.Notes = string.IsNullOrEmpty(workplace.Notes)
            ? dto.Notes
            : $"{workplace.Notes}\n{dto.Notes}";
        workplace.UpdatedAt = DateTime.UtcNow;

        var updatedWorkplace = await _rolloutRepository.UpdateWorkplaceAsync(workplace, cancellationToken);

        // Update day completed count and check if day is fully completed
        var day = await _rolloutRepository.GetDayByIdAsync(workplace.RolloutDayId, true, cancellationToken);
        if (day != null)
        {
            day.CompletedWorkplaces++;
            day.UpdatedAt = DateTime.UtcNow;

            // Auto-complete day if all workplaces are done (Completed or Skipped)
            var allWorkplacesDone = day.Workplaces != null && day.Workplaces.All(w =>
                w.Status == RolloutWorkplaceStatus.Completed ||
                w.Status == RolloutWorkplaceStatus.Skipped);

            if (allWorkplacesDone && day.Status != RolloutDayStatus.Completed)
            {
                day.Status = RolloutDayStatus.Completed;
                _logger.LogInformation("Auto-completed rollout day {DayId} - all workplaces are done", day.Id);
            }

            await _rolloutRepository.UpdateDayAsync(day, cancellationToken);
        }

        _logger.LogInformation("Completed workplace {WorkplaceId} with {CompletedCount} assignments by {PerformedBy}",
            id, completedCount, performedBy);

        return Ok(MapToDto(updatedWorkplace));
    }

    /// <summary>
    /// Skips a workplace.
    /// </summary>
    /// <param name="id">Workplace ID</param>
    /// <param name="dto">Skip reason data</param>
    /// <param name="cancellationToken">Cancellation token</param>
    [HttpPost("{id}/skip")]
    [ProducesResponseType(typeof(RolloutWorkplaceDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<RolloutWorkplaceDto>> Skip(
        int id,
        [FromBody] SkipWorkplaceDto dto,
        CancellationToken cancellationToken = default)
    {
        var workplace = await _rolloutRepository.GetWorkplaceByIdAsync(id, cancellationToken);
        if (workplace == null)
        {
            return NotFound(new { message = $"Workplace with ID {id} not found" });
        }

        var performedBy = User.FindFirstValue(ClaimTypes.Name) ?? "Unknown";

        workplace.Status = RolloutWorkplaceStatus.Skipped;
        workplace.Notes = string.IsNullOrEmpty(workplace.Notes)
            ? $"Skipped by {performedBy}: {dto.Reason}"
            : $"{workplace.Notes}\nSkipped by {performedBy}: {dto.Reason}";
        workplace.UpdatedAt = DateTime.UtcNow;

        var updatedWorkplace = await _rolloutRepository.UpdateWorkplaceAsync(workplace, cancellationToken);

        // Check if day is fully completed after skipping this workplace
        var day = await _rolloutRepository.GetDayByIdAsync(workplace.RolloutDayId, true, cancellationToken);
        if (day != null)
        {
            // Auto-complete day if all workplaces are done (Completed or Skipped)
            var allWorkplacesDone = day.Workplaces != null && day.Workplaces.All(w =>
                w.Status == RolloutWorkplaceStatus.Completed ||
                w.Status == RolloutWorkplaceStatus.Skipped);

            if (allWorkplacesDone && day.Status != RolloutDayStatus.Completed)
            {
                day.Status = RolloutDayStatus.Completed;
                day.UpdatedAt = DateTime.UtcNow;
                await _rolloutRepository.UpdateDayAsync(day, cancellationToken);
                _logger.LogInformation("Auto-completed rollout day {DayId} - all workplaces are done", day.Id);
            }
        }

        _logger.LogInformation("Skipped workplace {WorkplaceId}: {Reason}", id, dto.Reason);

        return Ok(MapToDto(updatedWorkplace));
    }

    /// <summary>
    /// Marks a workplace as failed.
    /// </summary>
    /// <param name="id">Workplace ID</param>
    /// <param name="dto">Failure reason data</param>
    /// <param name="cancellationToken">Cancellation token</param>
    [HttpPost("{id}/fail")]
    [ProducesResponseType(typeof(RolloutWorkplaceDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<RolloutWorkplaceDto>> Fail(
        int id,
        [FromBody] FailWorkplaceDto dto,
        CancellationToken cancellationToken = default)
    {
        var workplace = await _rolloutRepository.GetWorkplaceByIdAsync(id, cancellationToken);
        if (workplace == null)
        {
            return NotFound(new { message = $"Workplace with ID {id} not found" });
        }

        var performedBy = User.FindFirstValue(ClaimTypes.Name) ?? "Unknown";

        workplace.Status = RolloutWorkplaceStatus.Failed;
        workplace.Notes = string.IsNullOrEmpty(workplace.Notes)
            ? $"Failed by {performedBy}: {dto.Reason}"
            : $"{workplace.Notes}\nFailed by {performedBy}: {dto.Reason}";
        workplace.UpdatedAt = DateTime.UtcNow;

        var updatedWorkplace = await _rolloutRepository.UpdateWorkplaceAsync(workplace, cancellationToken);

        _logger.LogInformation("Failed workplace {WorkplaceId}: {Reason}", id, dto.Reason);

        return Ok(MapToDto(updatedWorkplace));
    }

    /// <summary>
    /// Moves a workplace to a different day.
    /// </summary>
    /// <param name="id">Workplace ID to move</param>
    /// <param name="dto">Move destination data</param>
    /// <param name="cancellationToken">Cancellation token</param>
    [HttpPost("{id}/move")]
    [ProducesResponseType(typeof(MoveWorkplaceResultDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<MoveWorkplaceResultDto>> Move(
        int id,
        [FromBody] MoveWorkplaceDto dto,
        CancellationToken cancellationToken = default)
    {
        var result = await _workplaceService.MoveWorkplaceAsync(id, dto.TargetDate);
        if (!result.Success || result.Workplace == null)
        {
            return BadRequest(new { message = result.ErrorMessage ?? "Failed to move workplace" });
        }

        _logger.LogInformation("Moved workplace {WorkplaceId} to date {TargetDate}", id, dto.TargetDate);

        var moveResult = new MoveWorkplaceResultDto
        {
            Workplace = MapToDto(result.Workplace)
        };
        return Ok(moveResult);
    }

    // ===== ASSET ASSIGNMENTS =====

    /// <summary>
    /// Gets all asset assignments for a workplace.
    /// </summary>
    /// <param name="id">Workplace ID</param>
    /// <param name="cancellationToken">Cancellation token</param>
    [HttpGet("{id}/assignments")]
    [ProducesResponseType(typeof(IEnumerable<WorkplaceAssetAssignmentDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<WorkplaceAssetAssignmentDto>>> GetAssignments(
        int id,
        CancellationToken cancellationToken = default)
    {
        var assignments = await _assignmentService.GetByWorkplaceIdAsync(id, cancellationToken);
        return Ok(assignments);
    }

    /// <summary>
    /// Creates a new asset assignment for a workplace.
    /// </summary>
    /// <param name="id">Workplace ID</param>
    /// <param name="request">Assignment creation data</param>
    /// <param name="cancellationToken">Cancellation token</param>
    [HttpPost("{id}/assignments")]
    [ProducesResponseType(typeof(WorkplaceAssetAssignmentDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<WorkplaceAssetAssignmentDto>> CreateAssignment(
        int id,
        [FromBody] CreateWorkplaceAssetAssignmentRequest request,
        CancellationToken cancellationToken = default)
    {
        request.RolloutWorkplaceId = id;

        var assignment = await _assignmentService.CreateAsync(request, cancellationToken);

        return CreatedAtAction(nameof(GetAssignments), new { id }, assignment);
    }

    /// <summary>
    /// Bulk creates asset assignments for a workplace.
    /// </summary>
    /// <param name="id">Workplace ID</param>
    /// <param name="requests">List of assignment creation data</param>
    /// <param name="cancellationToken">Cancellation token</param>
    [HttpPost("{id}/assignments/bulk")]
    [ProducesResponseType(typeof(IEnumerable<WorkplaceAssetAssignmentDto>), StatusCodes.Status201Created)]
    public async Task<ActionResult<IEnumerable<WorkplaceAssetAssignmentDto>>> BulkCreateAssignments(
        int id,
        [FromBody] IEnumerable<CreateWorkplaceAssetAssignmentRequest> requests,
        CancellationToken cancellationToken = default)
    {
        var assignments = await _assignmentService.BulkCreateAsync(id, requests, cancellationToken);
        return CreatedAtAction(nameof(GetAssignments), new { id }, assignments);
    }

    /// <summary>
    /// Gets assignment summary for a workplace.
    /// </summary>
    /// <param name="id">Workplace ID</param>
    /// <param name="cancellationToken">Cancellation token</param>
    [HttpGet("{id}/assignments/summary")]
    [ProducesResponseType(typeof(WorkplaceAssignmentSummaryDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<WorkplaceAssignmentSummaryDto>> GetAssignmentSummary(
        int id,
        CancellationToken cancellationToken = default)
    {
        var summary = await _assignmentService.GetSummaryAsync(id, cancellationToken);
        return Ok(summary);
    }

    /// <summary>
    /// Gets asset movements for a workplace.
    /// </summary>
    /// <param name="id">Workplace ID</param>
    /// <param name="cancellationToken">Cancellation token</param>
    [HttpGet("{id}/movements")]
    [ProducesResponseType(typeof(IEnumerable<AssetMovementDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<AssetMovementDto>>> GetMovements(
        int id,
        CancellationToken cancellationToken = default)
    {
        var movements = await _movementService.GetMovementsByWorkplaceAsync(id, cancellationToken);
        return Ok(movements);
    }

    /// <summary>
    /// Updates the serial number for an assignment.
    /// Used to fill in missing serial numbers after rollout completion.
    /// </summary>
    /// <param name="assignmentId">Assignment ID</param>
    /// <param name="dto">Serial number update data</param>
    /// <param name="cancellationToken">Cancellation token</param>
    [HttpPatch("assignments/{assignmentId}/serial")]
    [ProducesResponseType(typeof(WorkplaceAssetAssignmentDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<WorkplaceAssetAssignmentDto>> UpdateAssignmentSerial(
        int assignmentId,
        [FromBody] UpdateSerialNumberDto dto,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(dto.SerialNumber))
        {
            return BadRequest(new { message = "Serial number is required" });
        }

        var assignment = await _context.WorkplaceAssetAssignments
            .Include(a => a.NewAsset)
            .Include(a => a.AssetType)
            .FirstOrDefaultAsync(a => a.Id == assignmentId, cancellationToken);

        if (assignment == null)
        {
            return NotFound(new { message = $"Assignment with ID {assignmentId} not found" });
        }

        var performedBy = User.FindFirstValue(ClaimTypes.Name) ?? "Unknown";

        // Update the SerialNumberCaptured on the assignment
        assignment.SerialNumberCaptured = dto.SerialNumber;
        assignment.UpdatedAt = DateTime.UtcNow;

        // If there's a linked asset, also update its serial number
        if (assignment.NewAsset != null)
        {
            assignment.NewAsset.SerialNumber = dto.SerialNumber;
            assignment.NewAsset.UpdatedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Updated serial number for assignment {AssignmentId} to {SerialNumber} by {PerformedBy}",
            assignmentId, dto.SerialNumber, performedBy);

        // Return updated assignment
        var updatedAssignment = await _assignmentService.GetByIdAsync(assignmentId, cancellationToken);
        return Ok(updatedAssignment);
    }

    /// <summary>
    /// Updates assignment details by item index (for backward compatibility with legacy frontend code).
    /// This endpoint translates item index to assignment position and updates the assignment.
    /// </summary>
    /// <param name="workplaceId">Workplace ID</param>
    /// <param name="itemIndex">Zero-based index of the item/assignment</param>
    /// <param name="dto">Update details</param>
    /// <param name="cancellationToken">Cancellation token</param>
    [HttpPost("{workplaceId}/items/{itemIndex}/details")]
    [ProducesResponseType(typeof(RolloutWorkplaceDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<RolloutWorkplaceDto>> UpdateItemDetails(
        int workplaceId,
        int itemIndex,
        [FromBody] UpdateItemDetailsDto dto,
        CancellationToken cancellationToken = default)
    {
        // Get workplace
        var workplace = await _context.RolloutWorkplaces
            .Include(w => w.Service)
            .Include(w => w.Building)
            .Include(w => w.PhysicalWorkplace)
            .FirstOrDefaultAsync(w => w.Id == workplaceId, cancellationToken);

        if (workplace == null)
        {
            return NotFound(new { message = $"Workplace with ID {workplaceId} not found" });
        }

        // Get assignments ordered by position
        var assignments = await _context.WorkplaceAssetAssignments
            .Include(a => a.AssetType)
            .Include(a => a.NewAsset)
            .Include(a => a.OldAsset)
            .Where(a => a.RolloutWorkplaceId == workplaceId)
            .OrderBy(a => a.Position)
            .ToListAsync(cancellationToken);

        // Check if index is valid
        if (itemIndex < 0 || itemIndex >= assignments.Count)
        {
            return BadRequest(new { message = $"Invalid item index {itemIndex}. Workplace has {assignments.Count} assignments." });
        }

        var assignment = assignments[itemIndex];
        var performedBy = User.FindFirstValue(ClaimTypes.Name) ?? "Unknown";
        var performedByEmail = User.FindFirstValue(ClaimTypes.Email);

        // Update assignment details
        if (!string.IsNullOrWhiteSpace(dto.SerialNumber))
        {
            assignment.SerialNumberCaptured = dto.SerialNumber;
            assignment.SerialNumberRequired = true;

            // Update linked asset if it exists
            if (assignment.NewAsset != null)
            {
                assignment.NewAsset.SerialNumber = dto.SerialNumber;
                assignment.NewAsset.UpdatedAt = DateTime.UtcNow;
            }
        }

        // Handle installation status
        if (dto.MarkAsInstalled == true)
        {
            assignment.Status = AssetAssignmentStatus.Installed;
            assignment.InstalledAt = DateTime.UtcNow;
            assignment.InstalledBy = performedBy;
            assignment.InstalledByEmail = performedByEmail;
        }

        assignment.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Updated item {ItemIndex} details for workplace {WorkplaceId} by {PerformedBy}",
            itemIndex, workplaceId, performedBy);

        // Return updated workplace
        var updatedWorkplace = await _context.RolloutWorkplaces
            .Include(w => w.Service)
            .Include(w => w.Building)
            .Include(w => w.PhysicalWorkplace)
            .FirstOrDefaultAsync(w => w.Id == workplaceId, cancellationToken);

        return Ok(MapToDto(updatedWorkplace!));
    }

    #region Private Mapping Methods

    private static RolloutWorkplaceDto MapToDto(RolloutWorkplace workplace)
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
            PhysicalWorkplaceId = workplace.PhysicalWorkplaceId,
            PhysicalWorkplaceCode = workplace.PhysicalWorkplace?.Code,
            PhysicalWorkplaceName = workplace.PhysicalWorkplace?.Name,
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

    // ===== MIGRATION ENDPOINTS =====

    /// <summary>
    /// Migrates all AssetPlansJson data to WorkplaceAssetAssignment relational model.
    /// This is a one-time operation for existing data migration.
    /// </summary>
    [HttpPost("migrate-to-relational")]
    [ProducesResponseType(typeof(MigrationResult), StatusCodes.Status200OK)]
    public async Task<ActionResult<MigrationResult>> MigrateToRelational(CancellationToken cancellationToken)
    {
        _logger.LogInformation("Starting migration of AssetPlansJson to relational model");

        var result = await _syncService.MigrateAllAsync(cancellationToken);

        if (result.HasErrors)
        {
            _logger.LogWarning(
                "Migration completed with errors: {Migrated}/{Total} workplaces, {Failed} failed",
                result.MigratedWorkplaces, result.TotalWorkplaces, result.FailedWorkplaces);
        }
        else
        {
            _logger.LogInformation(
                "Migration completed successfully: {Migrated}/{Total} workplaces, {Assignments} assignments",
                result.MigratedWorkplaces, result.TotalWorkplaces, result.TotalAssignments);
        }

        return Ok(result);
    }

    /// <summary>
    /// Syncs a single workplace's AssetPlansJson to WorkplaceAssetAssignment.
    /// </summary>
    [HttpPost("{id}/sync-to-relational")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult> SyncWorkplaceToRelational(int id, CancellationToken cancellationToken)
    {
        var workplace = await _rolloutRepository.GetWorkplaceByIdAsync(id);
        if (workplace == null)
        {
            return NotFound($"Workplace with ID {id} not found");
        }

        await _syncService.SyncWorkplaceAsync(workplace, cancellationToken);

        _logger.LogInformation("Synced workplace {WorkplaceId} to relational model", id);

        return Ok(new { message = $"Workplace {id} synced successfully" });
    }

    /// <summary>
    /// Syncs all workplaces in a session from AssetPlansJson to WorkplaceAssetAssignment.
    /// </summary>
    [HttpPost("sync-session/{sessionId}")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    public async Task<ActionResult> SyncSessionToRelational(int sessionId, CancellationToken cancellationToken)
    {
        var syncedCount = await _syncService.SyncSessionAsync(sessionId, cancellationToken);

        _logger.LogInformation("Synced {Count} workplaces for session {SessionId}", syncedCount, sessionId);

        return Ok(new { message = $"Synced {syncedCount} workplaces for session {sessionId}" });
    }
}

/// <summary>
/// DTO for skipping a workplace
/// </summary>
public class SkipWorkplaceDto
{
    public string Reason { get; set; } = string.Empty;
}

/// <summary>
/// DTO for marking a workplace as failed
/// </summary>
public class FailWorkplaceDto
{
    public string Reason { get; set; } = string.Empty;
}

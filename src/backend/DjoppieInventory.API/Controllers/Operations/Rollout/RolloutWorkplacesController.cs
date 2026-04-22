using DjoppieInventory.Core.DTOs;
using DjoppieInventory.Core.DTOs.Rollout;
using DjoppieInventory.Core.Entities;
using DjoppieInventory.Core.Entities.Enums;
using DjoppieInventory.Core.Interfaces;
using DjoppieInventory.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.Text.Json;

namespace DjoppieInventory.API.Controllers.Operations.Rollout;

/// <summary>
/// API controller for managing rollout workplaces and their asset assignments.
/// Handles workplace CRUD, execution workflow, and asset assignment operations.
/// </summary>
[ApiController]
[Route("api/operations/rollouts/workplaces")]
[Authorize]
public class RolloutWorkplacesController : ControllerBase
{
    private readonly IRolloutRepository _rolloutRepository;
    private readonly IWorkplaceAssetAssignmentService _assignmentService;
    private readonly IAssetMovementService _movementService;
    private readonly IRolloutWorkplaceService _workplaceService;
    private readonly ApplicationDbContext _context;
    private readonly ILogger<RolloutWorkplacesController> _logger;

    public RolloutWorkplacesController(
        IRolloutRepository rolloutRepository,
        IWorkplaceAssetAssignmentService assignmentService,
        IAssetMovementService movementService,
        IRolloutWorkplaceService workplaceService,
        ApplicationDbContext context,
        ILogger<RolloutWorkplacesController> logger)
    {
        _rolloutRepository = rolloutRepository;
        _assignmentService = assignmentService;
        _movementService = movementService;
        _workplaceService = workplaceService;
        _context = context;
        _logger = logger;
    }

    // Shared JSON options for AssetPlansJson (camelCase to match frontend, case-insensitive for legacy data)
    private static readonly JsonSerializerOptions _jsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

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
            Notes = dto.Notes,
            AssetPlansJson = JsonSerializer.Serialize(dto.AssetPlans, _jsonOptions),
            TotalItems = dto.AssetPlans.Count,
        };

        var createdWorkplace = await _rolloutRepository.CreateWorkplaceAsync(workplace, cancellationToken);

        // Bridge: also create relational assignments from asset plans
        if (dto.AssetPlans.Count > 0)
        {
            await SyncAssignmentsFromPlans(createdWorkplace.Id, dto.AssetPlans, cancellationToken);
        }

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

        // Update AssetPlansJson from DTO and recalculate TotalItems
        workplace.AssetPlansJson = JsonSerializer.Serialize(dto.AssetPlans, _jsonOptions);
        workplace.TotalItems = dto.AssetPlans.Count;

        workplace.UpdatedAt = DateTime.UtcNow;

        var updatedWorkplace = await _rolloutRepository.UpdateWorkplaceAsync(workplace, cancellationToken);

        // Bridge: re-sync relational assignments from updated asset plans
        if (dto.AssetPlans.Count > 0)
        {
            await SyncAssignmentsFromPlans(updatedWorkplace.Id, dto.AssetPlans, cancellationToken);
        }
        else
        {
            // If no plans, clear assignments
            await _assignmentService.DeleteByWorkplaceIdAsync(updatedWorkplace.Id, cancellationToken);
        }

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

    // ===== STATUS MANAGEMENT =====

    /// <summary>
    /// Updates the status of a workplace (e.g. Pending → Ready, Ready → Pending).
    /// </summary>
    /// <param name="id">Workplace ID</param>
    /// <param name="dto">Status update data</param>
    /// <param name="cancellationToken">Cancellation token</param>
    [HttpPost("{id}/status")]
    [ProducesResponseType(typeof(RolloutWorkplaceDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<RolloutWorkplaceDto>> UpdateStatus(
        int id,
        [FromBody] UpdateWorkplaceStatusDto dto,
        CancellationToken cancellationToken = default)
    {
        var workplace = await _rolloutRepository.GetWorkplaceByIdAsync(id, cancellationToken);
        if (workplace == null)
        {
            return NotFound(new { message = $"Workplace with ID {id} not found" });
        }

        if (!Enum.TryParse<RolloutWorkplaceStatus>(dto.Status, out var newStatus))
        {
            return BadRequest(new { message = $"Invalid status: '{dto.Status}'" });
        }

        workplace.Status = newStatus;
        workplace.UpdatedAt = DateTime.UtcNow;

        var updatedWorkplace = await _rolloutRepository.UpdateWorkplaceAsync(workplace, cancellationToken);

        _logger.LogInformation("Updated workplace {WorkplaceId} status to {Status}", id, newStatus);

        return Ok(MapToDto(updatedWorkplace));
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

        // Complete all pending assignments (relational model)
        var completedCount = await _assignmentService.CompleteWorkplaceAssignmentsAsync(
            id, performedBy, performedByEmail, cancellationToken);

        // Also mark all JSON asset plans as installed (keep JSON in sync)
        if (!string.IsNullOrEmpty(workplace.AssetPlansJson) && workplace.AssetPlansJson != "[]")
        {
            try
            {
                var assetPlans = JsonSerializer.Deserialize<List<AssetPlanDto>>(workplace.AssetPlansJson, _jsonOptions);
                if (assetPlans != null)
                {
                    foreach (var plan in assetPlans)
                    {
                        if (plan.Status == "pending")
                            plan.Status = "installed";
                    }
                    workplace.AssetPlansJson = JsonSerializer.Serialize(assetPlans, _jsonOptions);
                    workplace.CompletedItems = assetPlans.Count(p => p.Status == "installed" || p.Status == "skipped");
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to update AssetPlansJson during completion for workplace {WorkplaceId}", id);
            }
        }

        // Sync JSON from assignments for accurate state (assignments are source of truth after completion)
        await SyncJsonFromAssignments(workplace, cancellationToken);

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
    /// Reopens a completed workplace for further editing.
    /// Optionally reverses asset status changes made during completion.
    /// </summary>
    /// <param name="id">Workplace ID</param>
    /// <param name="reverseAssets">If true, reverses asset status changes</param>
    /// <param name="cancellationToken">Cancellation token</param>
    [HttpPost("{id}/reopen")]
    [ProducesResponseType(typeof(RolloutWorkplaceDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<RolloutWorkplaceDto>> Reopen(
        int id,
        [FromQuery] bool reverseAssets = false,
        CancellationToken cancellationToken = default)
    {
        var workplace = await _rolloutRepository.GetWorkplaceByIdAsync(id, cancellationToken);
        if (workplace == null)
        {
            return NotFound(new { message = $"Workplace with ID {id} not found" });
        }

        if (workplace.Status != RolloutWorkplaceStatus.Completed)
        {
            return BadRequest(new { message = $"Cannot reopen workplace with status '{workplace.Status}'. Must be Completed." });
        }

        var performedBy = User.FindFirstValue(ClaimTypes.Name) ?? "Unknown";

        if (reverseAssets)
        {
            // Reverse relational assignments
            var assignments = await _context.WorkplaceAssetAssignments
                .Include(a => a.NewAsset)
                .Include(a => a.OldAsset)
                .Where(a => a.RolloutWorkplaceId == id)
                .ToListAsync(cancellationToken);

            foreach (var assignment in assignments)
            {
                if (assignment.Status == AssetAssignmentStatus.Installed)
                {
                    assignment.Status = AssetAssignmentStatus.Pending;
                    assignment.InstalledAt = null;
                    assignment.InstalledBy = null;
                    assignment.InstalledByEmail = null;
                    assignment.UpdatedAt = DateTime.UtcNow;

                    // Reverse new asset: InGebruik → Nieuw
                    if (assignment.NewAsset != null && assignment.NewAsset.Status == AssetStatus.InGebruik)
                    {
                        assignment.NewAsset.Status = AssetStatus.Nieuw;
                        assignment.NewAsset.Owner = null;
                        assignment.NewAsset.InstallationDate = null;
                        assignment.NewAsset.UpdatedAt = DateTime.UtcNow;
                    }

                    // Reverse old asset: UitDienst → InGebruik
                    if (assignment.OldAsset != null && assignment.OldAsset.Status == AssetStatus.UitDienst)
                    {
                        assignment.OldAsset.Status = AssetStatus.InGebruik;
                        assignment.OldAsset.UpdatedAt = DateTime.UtcNow;
                    }
                }
            }

            // Also reverse JSON plans
            if (!string.IsNullOrEmpty(workplace.AssetPlansJson) && workplace.AssetPlansJson != "[]")
            {
                try
                {
                    var assetPlans = JsonSerializer.Deserialize<List<AssetPlanDto>>(workplace.AssetPlansJson, _jsonOptions);
                    if (assetPlans != null)
                    {
                        foreach (var plan in assetPlans)
                        {
                            if (plan.Status == "installed")
                                plan.Status = "pending";
                        }
                        workplace.AssetPlansJson = JsonSerializer.Serialize(assetPlans, _jsonOptions);
                        workplace.CompletedItems = 0;
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to parse AssetPlansJson during reopen for workplace {WorkplaceId}", id);
                }
            }
        }

        // Reset workplace status
        workplace.Status = RolloutWorkplaceStatus.InProgress;
        workplace.CompletedAt = null;
        workplace.CompletedBy = null;
        workplace.CompletedByEmail = null;
        workplace.Notes = string.IsNullOrEmpty(workplace.Notes)
            ? $"Reopened by {performedBy}"
            : $"{workplace.Notes}\nReopened by {performedBy}";
        workplace.UpdatedAt = DateTime.UtcNow;

        await _rolloutRepository.UpdateWorkplaceAsync(workplace, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);

        // Update day completed count
        var day = await _rolloutRepository.GetDayByIdAsync(workplace.RolloutDayId, false, cancellationToken);
        if (day != null)
        {
            if (day.CompletedWorkplaces > 0)
                day.CompletedWorkplaces--;

            if (day.Status == RolloutDayStatus.Completed)
                day.Status = RolloutDayStatus.Ready;

            day.UpdatedAt = DateTime.UtcNow;
            await _rolloutRepository.UpdateDayAsync(day, cancellationToken);
        }

        _logger.LogInformation("Reopened workplace {WorkplaceId} by {PerformedBy} (reverseAssets={ReverseAssets})",
            id, performedBy, reverseAssets);

        var updatedWorkplace = await _rolloutRepository.GetWorkplaceByIdAsync(id, cancellationToken);
        return Ok(MapToDto(updatedWorkplace!));
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

        // Get assignments ordered by position (relational model)
        var assignments = await _context.WorkplaceAssetAssignments
            .Include(a => a.AssetType)
            .Include(a => a.NewAsset)
            .Include(a => a.OldAsset)
            .Where(a => a.RolloutWorkplaceId == workplaceId)
            .OrderBy(a => a.Position)
            .ToListAsync(cancellationToken);

        var performedBy = User.FindFirstValue(ClaimTypes.Name) ?? "Unknown";
        var performedByEmail = User.FindFirstValue(ClaimTypes.Email);

        // Parse JSON plans to check if this is an old device entry (not in assignments)
        var assetPlans = new List<AssetPlanDto>();
        if (!string.IsNullOrEmpty(workplace.AssetPlansJson) && workplace.AssetPlansJson != "[]")
        {
            try
            {
                assetPlans = JsonSerializer.Deserialize<List<AssetPlanDto>>(workplace.AssetPlansJson, _jsonOptions) ?? new();
            }
            catch { /* continue */ }
        }

        // Validate serial number length to prevent database truncation errors
        if (!string.IsNullOrEmpty(dto.SerialNumber) && dto.SerialNumber.Length > 100)
        {
            return BadRequest(new { message = "Serial number exceeds maximum length of 100 characters." });
        }
        if (!string.IsNullOrEmpty(dto.OldSerialNumber) && dto.OldSerialNumber.Length > 100)
        {
            return BadRequest(new { message = "Old serial number exceeds maximum length of 100 characters." });
        }

        // Check if the requested item is an old device entry (handled in JSON only)
        bool isOldDeviceEntry = itemIndex >= 0 && itemIndex < assetPlans.Count &&
            assetPlans[itemIndex].Metadata != null &&
            assetPlans[itemIndex].Metadata.TryGetValue("isOldDevice", out var isOld) && isOld == "true";

        if (isOldDeviceEntry)
        {
            // Handle old device entry - these are stored in JSON only, not in assignments
            var plan = assetPlans[itemIndex];

            if (!string.IsNullOrWhiteSpace(dto.OldSerialNumber))
            {
                plan.Metadata ??= new Dictionary<string, string>();
                plan.Metadata["oldSerial"] = dto.OldSerialNumber;

                // Try to find and link the old asset by serial number
                var oldAsset = await _context.Assets
                    .FirstOrDefaultAsync(a => a.SerialNumber == dto.OldSerialNumber, cancellationToken);
                if (oldAsset != null)
                {
                    plan.OldAssetId = oldAsset.Id;
                    plan.OldAssetCode = oldAsset.AssetCode;
                    plan.OldAssetName = oldAsset.AssetName;
                }
            }

            if (dto.MarkAsInstalled == true)
            {
                plan.Status = "installed";

                // Update the old asset status if linked
                if (plan.OldAssetId.HasValue)
                {
                    var oldAsset = await _context.Assets.FindAsync(new object[] { plan.OldAssetId.Value }, cancellationToken);
                    if (oldAsset != null)
                    {
                        var returnStatus = plan.Metadata.TryGetValue("returnStatus", out var status) ? status : "UitDienst";
                        oldAsset.Status = returnStatus switch
                        {
                            "Defect" => AssetStatus.Defect,
                            "Stock" => AssetStatus.Stock,
                            _ => AssetStatus.UitDienst
                        };
                        oldAsset.UpdatedAt = DateTime.UtcNow;
                    }
                }
            }

            workplace.AssetPlansJson = JsonSerializer.Serialize(assetPlans, _jsonOptions);
            workplace.CompletedItems = assetPlans.Count(p => p.Status == "installed" || p.Status == "skipped");
        }
        else if (assignments.Count > 0)
        {
            // itemIndex is the array index within the non-old-device plans the frontend sees,
            // which matches assignments ordered by Position. Do NOT look up by Position value:
            // legacy data may have non-contiguous Position numbers (when old-device plans were
            // present during assignment creation), and that lookup would silently return the
            // wrong assignment.
            if (itemIndex < 0 || itemIndex >= assignments.Count)
            {
                return BadRequest(new { message = $"Invalid item index {itemIndex}. Workplace has {assignments.Count} assignments." });
            }
            var assignment = assignments[itemIndex];

            _logger.LogDebug(
                "Updating assignment {AssignmentId} for workplace {WorkplaceId}. " +
                "Position: {Position}, AssetTypeId: {AssetTypeId}, NewAssetId: {NewAssetId}",
                assignment.Id, workplaceId, assignment.Position, assignment.AssetTypeId, assignment.NewAssetId);

            if (!string.IsNullOrWhiteSpace(dto.SerialNumber))
            {
                // Check if serial number is already used by another asset
                var existingAssetWithSerial = await _context.Assets
                    .FirstOrDefaultAsync(a => a.SerialNumber == dto.SerialNumber, cancellationToken);

                if (existingAssetWithSerial != null)
                {
                    // If the serial number belongs to a different asset, return error
                    if (assignment.NewAssetId == null || existingAssetWithSerial.Id != assignment.NewAssetId)
                    {
                        _logger.LogWarning(
                            "Serial number {SerialNumber} already exists on asset {AssetId} ({AssetCode}). " +
                            "Cannot assign to workplace {WorkplaceId} assignment {AssignmentId}.",
                            dto.SerialNumber, existingAssetWithSerial.Id, existingAssetWithSerial.AssetCode,
                            workplaceId, assignment.Id);

                        return BadRequest(new
                        {
                            message = $"Het serienummer '{dto.SerialNumber}' is al in gebruik door asset {existingAssetWithSerial.AssetCode} ({existingAssetWithSerial.AssetName}). " +
                                     "Gebruik een ander serienummer of selecteer het bestaande asset."
                        });
                    }
                }

                assignment.SerialNumberCaptured = dto.SerialNumber;
                assignment.SerialNumberRequired = true;

                if (assignment.NewAsset != null)
                {
                    assignment.NewAsset.SerialNumber = dto.SerialNumber;
                    assignment.NewAsset.UpdatedAt = DateTime.UtcNow;
                }
            }

            if (dto.MarkAsInstalled == true)
            {
                assignment.Status = AssetAssignmentStatus.Installed;
                assignment.InstalledAt = DateTime.UtcNow;
                assignment.InstalledBy = performedBy;
                assignment.InstalledByEmail = performedByEmail;
            }

            assignment.UpdatedAt = DateTime.UtcNow;

            // Keep JSON in sync with relational model
            await SyncJsonFromAssignments(workplace, cancellationToken);
        }
        else
        {
            // Fallback to legacy AssetPlansJson (assetPlans already parsed above)
            if (assetPlans.Count == 0)
            {
                return BadRequest(new { message = "No asset plans found for this workplace." });
            }

            if (itemIndex < 0 || itemIndex >= assetPlans.Count)
            {
                return BadRequest(new { message = $"Invalid item index {itemIndex}. Workplace has {assetPlans.Count} asset plans." });
            }

            var plan = assetPlans[itemIndex];

            if (!string.IsNullOrWhiteSpace(dto.SerialNumber))
            {
                // Check if serial number is already used by another asset
                var existingAssetWithSerial = await _context.Assets
                    .FirstOrDefaultAsync(a => a.SerialNumber == dto.SerialNumber, cancellationToken);

                if (existingAssetWithSerial != null)
                {
                    // If the serial number belongs to a different asset than the one linked, return error
                    if (!plan.ExistingAssetId.HasValue || existingAssetWithSerial.Id != plan.ExistingAssetId.Value)
                    {
                        _logger.LogWarning(
                            "Serial number {SerialNumber} already exists on asset {AssetId} ({AssetCode}). " +
                            "Cannot assign to workplace {WorkplaceId} item index {ItemIndex}.",
                            dto.SerialNumber, existingAssetWithSerial.Id, existingAssetWithSerial.AssetCode,
                            workplaceId, itemIndex);

                        return BadRequest(new
                        {
                            message = $"Het serienummer '{dto.SerialNumber}' is al in gebruik door asset {existingAssetWithSerial.AssetCode} ({existingAssetWithSerial.AssetName}). " +
                                     "Gebruik een ander serienummer of selecteer het bestaande asset."
                        });
                    }
                }

                plan.Metadata ??= new Dictionary<string, string>();
                plan.Metadata["serialNumber"] = dto.SerialNumber;

                // Update linked asset if exists
                if (plan.ExistingAssetId.HasValue)
                {
                    var asset = await _context.Assets.FindAsync(new object[] { plan.ExistingAssetId.Value }, cancellationToken);
                    if (asset != null)
                    {
                        asset.SerialNumber = dto.SerialNumber;
                        asset.UpdatedAt = DateTime.UtcNow;
                    }
                }
            }

            if (dto.MarkAsInstalled == true)
            {
                plan.Status = "installed";
            }

            workplace.AssetPlansJson = JsonSerializer.Serialize(assetPlans, _jsonOptions);
            workplace.CompletedItems = assetPlans.Count(p => p.Status == "installed");
        }

        workplace.UpdatedAt = DateTime.UtcNow;

        try
        {
            await _context.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException ex)
        {
            _logger.LogError(ex,
                "Database error updating item {ItemIndex} for workplace {WorkplaceId}. " +
                "Inner exception: {InnerMessage}. " +
                "Assignments count: {AssignmentsCount}. " +
                "AssetPlans count: {PlansCount}.",
                itemIndex, workplaceId,
                ex.InnerException?.Message ?? ex.Message,
                assignments.Count,
                assetPlans.Count);
            throw;
        }

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

    /// <summary>
    /// Updates the status of a single asset plan item (e.g. skip or mark installed).
    /// </summary>
    [HttpPost("{workplaceId}/items/{itemIndex}/status")]
    [ProducesResponseType(typeof(RolloutWorkplaceDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<RolloutWorkplaceDto>> UpdateItemStatus(
        int workplaceId,
        int itemIndex,
        [FromBody] UpdateWorkplaceStatusDto dto,
        CancellationToken cancellationToken = default)
    {
        var workplace = await _context.RolloutWorkplaces
            .Include(w => w.Service)
            .Include(w => w.Building)
            .Include(w => w.PhysicalWorkplace)
            .FirstOrDefaultAsync(w => w.Id == workplaceId, cancellationToken);

        if (workplace == null)
        {
            return NotFound(new { message = $"Workplace with ID {workplaceId} not found" });
        }

        // Try relational model first
        var assignments = await _context.WorkplaceAssetAssignments
            .Where(a => a.RolloutWorkplaceId == workplaceId)
            .OrderBy(a => a.Position)
            .ToListAsync(cancellationToken);

        if (assignments.Count > 0)
        {
            if (itemIndex < 0 || itemIndex >= assignments.Count)
            {
                return BadRequest(new { message = $"Invalid item index {itemIndex}. Workplace has {assignments.Count} assignments." });
            }

            var assignment = assignments[itemIndex];
            if (Enum.TryParse<AssetAssignmentStatus>(dto.Status, true, out var assignmentStatus))
            {
                assignment.Status = assignmentStatus;
            }
            assignment.UpdatedAt = DateTime.UtcNow;

            // Keep JSON in sync with relational model
            await SyncJsonFromAssignments(workplace, cancellationToken);
        }
        else
        {
            // Fallback to legacy AssetPlansJson
            var assetPlans = new List<AssetPlanDto>();
            if (!string.IsNullOrEmpty(workplace.AssetPlansJson) && workplace.AssetPlansJson != "[]")
            {
                try
                {
                    assetPlans = JsonSerializer.Deserialize<List<AssetPlanDto>>(workplace.AssetPlansJson, _jsonOptions) ?? new();
                }
                catch
                {
                    return BadRequest(new { message = "Failed to parse asset plans." });
                }
            }

            if (itemIndex < 0 || itemIndex >= assetPlans.Count)
            {
                return BadRequest(new { message = $"Invalid item index {itemIndex}. Workplace has {assetPlans.Count} asset plans." });
            }

            assetPlans[itemIndex].Status = dto.Status.ToLowerInvariant();
            workplace.AssetPlansJson = JsonSerializer.Serialize(assetPlans, _jsonOptions);
            workplace.CompletedItems = assetPlans.Count(p => p.Status == "installed" || p.Status == "skipped");
        }

        workplace.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Updated item {ItemIndex} status to {Status} for workplace {WorkplaceId}",
            itemIndex, dto.Status, workplaceId);

        var updatedWorkplace = await _context.RolloutWorkplaces
            .Include(w => w.Service)
            .Include(w => w.Building)
            .Include(w => w.PhysicalWorkplace)
            .FirstOrDefaultAsync(w => w.Id == workplaceId, cancellationToken);

        return Ok(MapToDto(updatedWorkplace!));
    }

    #region Private Mapping Methods

    /// <summary>
    /// Equipment type string → AssetType ID mapping (seeded in ApplicationDbContext)
    /// </summary>
    private static readonly Dictionary<string, int> _equipmentTypeToAssetTypeId = new(StringComparer.OrdinalIgnoreCase)
    {
        ["laptop"] = 1,   // LAP
        ["desktop"] = 2,  // DESK
        ["monitor"] = 3,  // MON
        ["docking"] = 8,  // DOCK
        ["keyboard"] = 9, // KEYB
        ["mouse"] = 10,   // MOUSE
    };

    private static readonly HashSet<string> _userAssignedEquipment = new(StringComparer.OrdinalIgnoreCase) { "laptop" };

    /// <summary>
    /// Maps AssetPlanDto array to CreateWorkplaceAssetAssignmentRequest array.
    /// This bridges the legacy JSON model to the relational model.
    /// </summary>
    private List<CreateWorkplaceAssetAssignmentRequest> MapAssetPlansToAssignments(
        int workplaceId, List<AssetPlanDto> plans)
    {
        var requests = new List<CreateWorkplaceAssetAssignmentRequest>();
        // Position must be a contiguous counter across non-skipped plans so it matches the
        // array index the frontend sends back (old-device plans aren't in assignments and
        // must not leave gaps in Position numbering).
        var position = 0;
        for (int i = 0; i < plans.Count; i++)
        {
            var plan = plans[i];

            // Skip old device plans (they're tracked as OldAssetId on the main assignment)
            if (plan.Metadata.TryGetValue("isOldDevice", out var isOld) && isOld == "true")
                continue;

            if (!_equipmentTypeToAssetTypeId.TryGetValue(plan.EquipmentType, out var assetTypeId))
            {
                _logger.LogWarning("Unknown equipment type '{EquipmentType}' in asset plan, skipping", plan.EquipmentType);
                continue;
            }

            var isUserAssigned = _userAssignedEquipment.Contains(plan.EquipmentType);

            // Determine source type
            AssetSourceType sourceType;
            if (plan.ExistingAssetId.HasValue)
                sourceType = AssetSourceType.ExistingInventory;
            else if (plan.CreateNew && !string.IsNullOrEmpty(plan.Brand))
                sourceType = AssetSourceType.NewFromTemplate;
            else
                sourceType = AssetSourceType.CreateOnSite;

            position++;
            var request = new CreateWorkplaceAssetAssignmentRequest
            {
                RolloutWorkplaceId = workplaceId,
                AssetTypeId = assetTypeId,
                AssignmentCategory = isUserAssigned ? AssignmentCategory.UserAssigned : AssignmentCategory.WorkplaceFixed,
                SourceType = sourceType,
                NewAssetId = plan.ExistingAssetId,
                OldAssetId = plan.OldAssetId,
                Position = position,
                SerialNumberRequired = plan.RequiresSerialNumber,
                QRCodeRequired = plan.RequiresQRCode,
                MetadataJson = plan.Metadata.Count > 0
                    ? JsonSerializer.Serialize(plan.Metadata, _jsonOptions)
                    : null,
            };

            requests.Add(request);
        }
        return requests;
    }

    /// <summary>
    /// Creates relational assignments from AssetPlansJson.
    /// Called during Create and Update to bridge the models.
    /// </summary>
    private async Task SyncAssignmentsFromPlans(int workplaceId, List<AssetPlanDto> plans, CancellationToken ct)
    {
        try
        {
            // Delete existing assignments first
            await _assignmentService.DeleteByWorkplaceIdAsync(workplaceId, ct);

            // Create new assignments
            var requests = MapAssetPlansToAssignments(workplaceId, plans);
            if (requests.Count > 0)
            {
                await _assignmentService.BulkCreateAsync(workplaceId, requests, ct);
                _logger.LogInformation("Synced {Count} assignments for workplace {WorkplaceId}", requests.Count, workplaceId);
            }
        }
        catch (Exception ex)
        {
            // Log but don't fail — JSON remains source of truth for now
            _logger.LogWarning(ex, "Failed to sync assignments for workplace {WorkplaceId}", workplaceId);
        }
    }

    /// <summary>
    /// Syncs AssetPlansJson from relational assignments (reverse direction).
    /// Called after execution operations that modify assignments.
    /// </summary>
    private async Task SyncJsonFromAssignments(RolloutWorkplace workplace, CancellationToken ct)
    {
        var assignments = await _context.WorkplaceAssetAssignments
            .Include(a => a.AssetType)
            .Include(a => a.NewAsset)
            .Include(a => a.OldAsset)
            .Include(a => a.AssetTemplate)
            .Where(a => a.RolloutWorkplaceId == workplace.Id)
            .OrderBy(a => a.Position)
            .ToListAsync(ct);

        if (assignments.Count == 0) return;

        // Also get old device plans from existing JSON (they're not in assignments)
        var existingPlans = new List<AssetPlanDto>();
        if (!string.IsNullOrEmpty(workplace.AssetPlansJson) && workplace.AssetPlansJson != "[]")
        {
            try
            {
                existingPlans = JsonSerializer.Deserialize<List<AssetPlanDto>>(workplace.AssetPlansJson, _jsonOptions) ?? new();
            }
            catch { /* ignore parse errors */ }
        }
        var oldDevicePlans = existingPlans.Where(p =>
            p.Metadata != null && p.Metadata.TryGetValue("isOldDevice", out var isOld) && isOld == "true").ToList();

        var plans = new List<AssetPlanDto>();

        foreach (var a in assignments)
        {
            var equipmentType = a.AssetType?.Code?.ToLowerInvariant() switch
            {
                "lap" => "laptop",
                "desk" => "desktop",
                "mon" => "monitor",
                "dock" => "docking",
                "keyb" => "keyboard",
                "mouse" => "mouse",
                _ => a.AssetType?.Name?.ToLowerInvariant() ?? "unknown"
            };

            var metadata = new Dictionary<string, string>();
            if (!string.IsNullOrEmpty(a.MetadataJson))
            {
                try
                {
                    metadata = JsonSerializer.Deserialize<Dictionary<string, string>>(a.MetadataJson, _jsonOptions) ?? new();
                }
                catch { /* ignore */ }
            }
            if (!string.IsNullOrEmpty(a.SerialNumberCaptured))
                metadata["serialNumber"] = a.SerialNumberCaptured;

            plans.Add(new AssetPlanDto
            {
                EquipmentType = equipmentType,
                ExistingAssetId = a.NewAssetId,
                ExistingAssetCode = a.NewAsset?.AssetCode,
                ExistingAssetName = a.NewAsset?.AssetName,
                OldAssetId = a.OldAssetId,
                OldAssetCode = a.OldAsset?.AssetCode,
                OldAssetName = a.OldAsset?.AssetName,
                CreateNew = a.SourceType != AssetSourceType.ExistingInventory,
                Brand = a.AssetTemplate?.Brand ?? a.NewAsset?.Brand,
                Model = a.AssetTemplate?.Model ?? a.NewAsset?.Model,
                Metadata = metadata,
                Status = a.Status switch
                {
                    AssetAssignmentStatus.Installed => "installed",
                    AssetAssignmentStatus.Skipped => "skipped",
                    AssetAssignmentStatus.Failed => "failed",
                    _ => "pending"
                },
                RequiresSerialNumber = a.SerialNumberRequired,
                RequiresQRCode = a.QRCodeRequired,
            });
        }

        // Add old device plans back
        plans.AddRange(oldDevicePlans);

        workplace.AssetPlansJson = JsonSerializer.Serialize(plans, _jsonOptions);
        workplace.CompletedItems = plans.Count(p => p.Status == "installed" || p.Status == "skipped");
    }

    private RolloutWorkplaceDto MapToDto(RolloutWorkplace workplace)
    {
        // Parse AssetPlans from legacy JSON
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
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to parse AssetPlansJson for workplace {WorkplaceId}", workplace.Id);
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

    #endregion
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

using DjoppieInventory.Core.DTOs.Rollout;
using DjoppieInventory.Core.Entities;
using DjoppieInventory.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace DjoppieInventory.API.Controllers;

/// <summary>
/// API controller for managing rollout sessions, items, and asset swaps.
/// Provides comprehensive rollout workflow management for IT asset deployments.
/// </summary>
[Authorize]
[ApiController]
[Route("api/[controller]")]
public class RolloutsController : ControllerBase
{
    private readonly IRolloutRepository _rolloutRepository;
    private readonly IAssetRepository _assetRepository;
    private readonly IAssetEventRepository _assetEventRepository;

    public RolloutsController(
        IRolloutRepository rolloutRepository,
        IAssetRepository assetRepository,
        IAssetEventRepository assetEventRepository)
    {
        _rolloutRepository = rolloutRepository;
        _assetRepository = assetRepository;
        _assetEventRepository = assetEventRepository;
    }

    // ===== Session CRUD Operations =====

    /// <summary>
    /// Retrieves all rollout sessions, optionally filtered by status.
    /// </summary>
    /// <param name="status">Optional status filter (0=Planning, 1=Ready, 2=InProgress, 3=Completed, 4=Cancelled)</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>List of rollout session summaries</returns>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<RolloutSessionSummaryDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<RolloutSessionSummaryDto>>> GetSessions(
        [FromQuery] int? status = null,
        CancellationToken cancellationToken = default)
    {
        RolloutSessionStatus? statusFilter = status.HasValue
            ? (RolloutSessionStatus)status.Value
            : null;

        var sessions = await _rolloutRepository.GetAllSessionsAsync(statusFilter, cancellationToken);
        var summaries = sessions.Select(MapToSummaryDto).ToList();

        return Ok(summaries);
    }

    /// <summary>
    /// Retrieves a specific rollout session by ID with all items and swaps.
    /// </summary>
    /// <param name="id">The rollout session ID</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Complete rollout session details</returns>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(RolloutSessionDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<RolloutSessionDto>> GetSession(int id, CancellationToken cancellationToken = default)
    {
        var session = await _rolloutRepository.GetSessionWithItemsAsync(id, cancellationToken);
        if (session == null)
            return NotFound($"Rollout session with ID {id} not found");

        var dto = await MapToSessionDtoAsync(session, cancellationToken);
        return Ok(dto);
    }

    /// <summary>
    /// Creates a new rollout session.
    /// </summary>
    /// <param name="dto">The session creation data</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Created rollout session</returns>
    [HttpPost]
    [ProducesResponseType(typeof(RolloutSessionDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<RolloutSessionDto>> CreateSession(
        CreateRolloutSessionDto dto,
        CancellationToken cancellationToken = default)
    {
        // Get user information from claims
        var userName = User.FindFirst(ClaimTypes.Name)?.Value ?? "System";
        var userEmail = User.FindFirst(ClaimTypes.Email)?.Value ?? User.FindFirst("preferred_username")?.Value ?? string.Empty;

        // Parse status or default to Planning
        var status = RolloutSessionStatus.Planning;
        if (!string.IsNullOrEmpty(dto.Status) && Enum.TryParse<RolloutSessionStatus>(dto.Status, true, out var parsedStatus))
        {
            status = parsedStatus;
        }

        var session = new RolloutSession
        {
            SessionName = dto.SessionName,
            Description = dto.Description,
            PlannedDate = dto.PlannedDate,
            Status = status,
            CreatedBy = userName,
            CreatedByEmail = userEmail,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var createdSession = await _rolloutRepository.CreateSessionAsync(session, cancellationToken);
        var resultDto = await MapToSessionDtoAsync(createdSession, cancellationToken);

        return CreatedAtAction(nameof(GetSession), new { id = createdSession.Id }, resultDto);
    }

    /// <summary>
    /// Updates an existing rollout session.
    /// </summary>
    /// <param name="id">The session ID to update</param>
    /// <param name="dto">The updated session data</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Updated rollout session</returns>
    [HttpPut("{id}")]
    [ProducesResponseType(typeof(RolloutSessionDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<RolloutSessionDto>> UpdateSession(
        int id,
        UpdateRolloutSessionDto dto,
        CancellationToken cancellationToken = default)
    {
        var session = await _rolloutRepository.GetSessionByIdAsync(id, cancellationToken);
        if (session == null)
            return NotFound($"Rollout session with ID {id} not found");

        // Parse and validate status
        if (!Enum.TryParse<RolloutSessionStatus>(dto.Status, true, out var status))
            return BadRequest($"Invalid status value: {dto.Status}");

        // Update session properties
        session.SessionName = dto.SessionName;
        session.Description = dto.Description;
        session.PlannedDate = dto.PlannedDate;
        session.Status = status;
        session.UpdatedAt = DateTime.UtcNow;

        // Update timestamps based on status transitions
        if (status == RolloutSessionStatus.InProgress && session.StartedAt == null)
        {
            session.StartedAt = DateTime.UtcNow;
        }
        else if (status == RolloutSessionStatus.Completed && session.CompletedAt == null)
        {
            session.CompletedAt = DateTime.UtcNow;
        }

        var updatedSession = await _rolloutRepository.UpdateSessionAsync(session, cancellationToken);
        var resultDto = await MapToSessionDtoAsync(updatedSession, cancellationToken);

        return Ok(resultDto);
    }

    /// <summary>
    /// Deletes a rollout session and all its items.
    /// </summary>
    /// <param name="id">The session ID to delete</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>No content on success</returns>
    [HttpDelete("{id}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteSession(int id, CancellationToken cancellationToken = default)
    {
        var session = await _rolloutRepository.GetSessionByIdAsync(id, cancellationToken);
        if (session == null)
            return NotFound($"Rollout session with ID {id} not found");

        await _rolloutRepository.DeleteSessionAsync(id, cancellationToken);
        return NoContent();
    }

    /// <summary>
    /// Updates the status of a rollout session.
    /// </summary>
    /// <param name="id">The session ID</param>
    /// <param name="dto">The new status</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Updated rollout session</returns>
    [HttpPut("{id}/status")]
    [ProducesResponseType(typeof(RolloutSessionDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<RolloutSessionDto>> UpdateSessionStatus(
        int id,
        [FromBody] UpdateStatusDto dto,
        CancellationToken cancellationToken = default)
    {
        var session = await _rolloutRepository.GetSessionByIdAsync(id, cancellationToken);
        if (session == null)
            return NotFound($"Rollout session with ID {id} not found");

        // Parse and validate status
        if (!Enum.TryParse<RolloutSessionStatus>(dto.Status, true, out var status))
            return BadRequest($"Invalid status value: {dto.Status}");

        var oldStatus = session.Status;
        session.Status = status;
        session.UpdatedAt = DateTime.UtcNow;

        // Update timestamps based on status transitions
        if (status == RolloutSessionStatus.InProgress && oldStatus != RolloutSessionStatus.InProgress)
        {
            session.StartedAt = DateTime.UtcNow;
        }
        else if (status == RolloutSessionStatus.Completed && oldStatus != RolloutSessionStatus.Completed)
        {
            session.CompletedAt = DateTime.UtcNow;
        }

        var updatedSession = await _rolloutRepository.UpdateSessionAsync(session, cancellationToken);
        var resultDto = await MapToSessionDtoAsync(updatedSession, cancellationToken);

        return Ok(resultDto);
    }

    // ===== Item Management Operations =====

    /// <summary>
    /// Adds a new item to a rollout session.
    /// </summary>
    /// <param name="sessionId">The session ID</param>
    /// <param name="dto">The item creation data</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Created rollout item</returns>
    [HttpPost("{sessionId}/items")]
    [ProducesResponseType(typeof(RolloutItemDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<RolloutItemDto>> AddItem(
        int sessionId,
        CreateRolloutItemDto dto,
        CancellationToken cancellationToken = default)
    {
        // Validate session exists
        var session = await _rolloutRepository.GetSessionByIdAsync(sessionId, cancellationToken);
        if (session == null)
            return NotFound($"Rollout session with ID {sessionId} not found");

        // Validate asset exists
        var asset = await _assetRepository.GetByIdAsync(dto.AssetId, cancellationToken);
        if (asset == null)
            return NotFound($"Asset with ID {dto.AssetId} not found");

        // Check if asset is already in an active rollout
        var isInActiveRollout = await _rolloutRepository.IsAssetInActiveRolloutAsync(dto.AssetId, cancellationToken);
        if (isInActiveRollout)
            return BadRequest($"Asset {asset.AssetCode} is already assigned to an active rollout session");

        var item = new RolloutItem
        {
            RolloutSessionId = sessionId,
            AssetId = dto.AssetId,
            TargetUser = dto.TargetUser,
            TargetUserEmail = dto.TargetUserEmail,
            TargetLocation = dto.TargetLocation,
            TargetServiceId = dto.TargetServiceId,
            MonitorPosition = dto.MonitorPosition,
            MonitorDisplayNumber = dto.MonitorDisplayNumber,
            Notes = dto.Notes,
            Status = RolloutItemStatus.Pending,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var createdItem = await _rolloutRepository.AddItemAsync(item, cancellationToken);
        var itemDto = MapToItemDto(createdItem);

        return CreatedAtAction(nameof(GetSession), new { id = sessionId }, itemDto);
    }

    /// <summary>
    /// Adds multiple items to a rollout session in bulk.
    /// </summary>
    /// <param name="sessionId">The session ID</param>
    /// <param name="items">Collection of items to add</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Created rollout items</returns>
    [HttpPost("{sessionId}/items/bulk")]
    [ProducesResponseType(typeof(IEnumerable<RolloutItemDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<IEnumerable<RolloutItemDto>>> AddItemsBulk(
        int sessionId,
        List<CreateRolloutItemDto> items,
        CancellationToken cancellationToken = default)
    {
        // Validate session exists
        var session = await _rolloutRepository.GetSessionByIdAsync(sessionId, cancellationToken);
        if (session == null)
            return NotFound($"Rollout session with ID {sessionId} not found");

        if (items == null || !items.Any())
            return BadRequest("At least one item must be provided");

        // Validate all assets exist
        var assetIds = items.Select(i => i.AssetId).Distinct().ToList();
        var validationErrors = new List<string>();

        foreach (var assetId in assetIds)
        {
            var asset = await _assetRepository.GetByIdAsync(assetId, cancellationToken);
            if (asset == null)
            {
                validationErrors.Add($"Asset with ID {assetId} not found");
                continue;
            }

            // Check if asset is already in an active rollout
            var isInActiveRollout = await _rolloutRepository.IsAssetInActiveRolloutAsync(assetId, cancellationToken);
            if (isInActiveRollout)
            {
                validationErrors.Add($"Asset {asset.AssetCode} is already assigned to an active rollout session");
            }
        }

        if (validationErrors.Any())
            return BadRequest(new { errors = validationErrors });

        var rolloutItems = items.Select(dto => new RolloutItem
        {
            RolloutSessionId = sessionId,
            AssetId = dto.AssetId,
            TargetUser = dto.TargetUser,
            TargetUserEmail = dto.TargetUserEmail,
            TargetLocation = dto.TargetLocation,
            TargetServiceId = dto.TargetServiceId,
            MonitorPosition = dto.MonitorPosition,
            MonitorDisplayNumber = dto.MonitorDisplayNumber,
            Notes = dto.Notes,
            Status = RolloutItemStatus.Pending,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        }).ToList();

        var createdItems = await _rolloutRepository.AddItemsBulkAsync(rolloutItems, cancellationToken);
        var itemDtos = createdItems.Select(MapToItemDto).ToList();

        return CreatedAtAction(nameof(GetSession), new { id = sessionId }, itemDtos);
    }

    /// <summary>
    /// Updates an existing rollout item.
    /// </summary>
    /// <param name="sessionId">The session ID</param>
    /// <param name="itemId">The item ID to update</param>
    /// <param name="dto">The updated item data</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Updated rollout item</returns>
    [HttpPut("{sessionId}/items/{itemId}")]
    [ProducesResponseType(typeof(RolloutItemDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<RolloutItemDto>> UpdateItem(
        int sessionId,
        int itemId,
        UpdateRolloutItemDto dto,
        CancellationToken cancellationToken = default)
    {
        var item = await _rolloutRepository.GetItemByIdAsync(itemId, cancellationToken);
        if (item == null)
            return NotFound($"Rollout item with ID {itemId} not found");

        if (item.RolloutSessionId != sessionId)
            return BadRequest($"Item {itemId} does not belong to session {sessionId}");

        // Parse and validate status
        if (!Enum.TryParse<RolloutItemStatus>(dto.Status, true, out var status))
            return BadRequest($"Invalid status value: {dto.Status}");

        // Update item properties
        item.TargetUser = dto.TargetUser;
        item.TargetUserEmail = dto.TargetUserEmail;
        item.TargetLocation = dto.TargetLocation;
        item.TargetServiceId = dto.TargetServiceId;
        item.MonitorPosition = dto.MonitorPosition;
        item.MonitorDisplayNumber = dto.MonitorDisplayNumber;
        item.Status = status;
        item.Notes = dto.Notes;
        item.UpdatedAt = DateTime.UtcNow;

        var updatedItem = await _rolloutRepository.UpdateItemAsync(item, cancellationToken);
        var itemDto = MapToItemDto(updatedItem);

        return Ok(itemDto);
    }

    /// <summary>
    /// Deletes a rollout item from a session.
    /// </summary>
    /// <param name="sessionId">The session ID</param>
    /// <param name="itemId">The item ID to delete</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>No content on success</returns>
    [HttpDelete("{sessionId}/items/{itemId}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteItem(
        int sessionId,
        int itemId,
        CancellationToken cancellationToken = default)
    {
        var item = await _rolloutRepository.GetItemByIdAsync(itemId, cancellationToken);
        if (item == null)
            return NotFound($"Rollout item with ID {itemId} not found");

        if (item.RolloutSessionId != sessionId)
            return BadRequest($"Item {itemId} does not belong to session {sessionId}");

        await _rolloutRepository.DeleteItemAsync(itemId, cancellationToken);
        return NoContent();
    }

    /// <summary>
    /// Marks a rollout item as completed.
    /// </summary>
    /// <param name="sessionId">The session ID</param>
    /// <param name="itemId">The item ID to complete</param>
    /// <param name="dto">Optional completion data</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Updated rollout item</returns>
    [HttpPut("{sessionId}/items/{itemId}/complete")]
    [ProducesResponseType(typeof(RolloutItemDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<RolloutItemDto>> CompleteItem(
        int sessionId,
        int itemId,
        [FromBody] CompleteItemDto? dto,
        CancellationToken cancellationToken = default)
    {
        var item = await _rolloutRepository.GetItemByIdAsync(itemId, cancellationToken);
        if (item == null)
            return NotFound($"Rollout item with ID {itemId} not found");

        if (item.RolloutSessionId != sessionId)
            return BadRequest($"Item {itemId} does not belong to session {sessionId}");

        // Get user information from claims
        var userName = User.FindFirst(ClaimTypes.Name)?.Value ?? "System";
        var userEmail = User.FindFirst(ClaimTypes.Email)?.Value ?? User.FindFirst("preferred_username")?.Value ?? string.Empty;

        // Update item to completed status
        item.Status = RolloutItemStatus.Completed;
        item.CompletedAt = dto?.CompletedAt ?? DateTime.UtcNow;
        item.CompletedBy = userName;
        item.CompletedByEmail = userEmail;

        if (!string.IsNullOrEmpty(dto?.Notes))
        {
            item.Notes = string.IsNullOrEmpty(item.Notes)
                ? dto.Notes
                : $"{item.Notes}\n\n[Completion Note] {dto.Notes}";
        }

        item.UpdatedAt = DateTime.UtcNow;

        var updatedItem = await _rolloutRepository.UpdateItemAsync(item, cancellationToken);
        var itemDto = MapToItemDto(updatedItem);

        return Ok(itemDto);
    }

    /// <summary>
    /// Updates the monitor position information for a rollout item.
    /// </summary>
    /// <param name="sessionId">The session ID</param>
    /// <param name="itemId">The item ID</param>
    /// <param name="dto">Monitor position data</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Updated rollout item</returns>
    [HttpPut("{sessionId}/items/{itemId}/monitor-position")]
    [ProducesResponseType(typeof(RolloutItemDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<RolloutItemDto>> UpdateMonitorPosition(
        int sessionId,
        int itemId,
        MonitorPositionDto dto,
        CancellationToken cancellationToken = default)
    {
        var item = await _rolloutRepository.GetItemByIdAsync(itemId, cancellationToken);
        if (item == null)
            return NotFound($"Rollout item with ID {itemId} not found");

        if (item.RolloutSessionId != sessionId)
            return BadRequest($"Item {itemId} does not belong to session {sessionId}");

        // Update monitor position fields
        item.MonitorPosition = dto.MonitorPosition;
        item.MonitorDisplayNumber = dto.MonitorDisplayNumber;

        if (!string.IsNullOrEmpty(dto.Notes))
        {
            item.Notes = string.IsNullOrEmpty(item.Notes)
                ? dto.Notes
                : $"{item.Notes}\n\n[Monitor Config] {dto.Notes}";
        }

        item.UpdatedAt = DateTime.UtcNow;

        var updatedItem = await _rolloutRepository.UpdateItemAsync(item, cancellationToken);
        var itemDto = MapToItemDto(updatedItem);

        return Ok(itemDto);
    }

    // ===== Swap Operations =====

    /// <summary>
    /// Creates a new asset swap record.
    /// </summary>
    /// <param name="sessionId">The session ID</param>
    /// <param name="dto">The swap creation data</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Created asset swap</returns>
    [HttpPost("{sessionId}/swaps")]
    [ProducesResponseType(typeof(AssetSwapDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<AssetSwapDto>> CreateSwap(
        int sessionId,
        CreateAssetSwapDto dto,
        CancellationToken cancellationToken = default)
    {
        // Validate session exists
        var session = await _rolloutRepository.GetSessionByIdAsync(sessionId, cancellationToken);
        if (session == null)
            return NotFound($"Rollout session with ID {sessionId} not found");

        // Validate new asset exists
        var newAsset = await _assetRepository.GetByIdAsync(dto.NewAssetId, cancellationToken);
        if (newAsset == null)
            return NotFound($"New asset with ID {dto.NewAssetId} not found");

        // Validate old asset exists if provided
        if (dto.OldAssetId.HasValue)
        {
            var oldAsset = await _assetRepository.GetByIdAsync(dto.OldAssetId.Value, cancellationToken);
            if (oldAsset == null)
                return NotFound($"Old asset with ID {dto.OldAssetId.Value} not found");
        }

        // Parse old asset new status if provided
        AssetStatus? oldAssetNewStatus = null;
        if (!string.IsNullOrEmpty(dto.OldAssetNewStatus))
        {
            if (!Enum.TryParse<AssetStatus>(dto.OldAssetNewStatus, true, out var parsedStatus))
                return BadRequest($"Invalid asset status value: {dto.OldAssetNewStatus}");
            oldAssetNewStatus = parsedStatus;
        }

        var swap = new AssetSwap
        {
            RolloutSessionId = sessionId,
            OldAssetId = dto.OldAssetId,
            NewAssetId = dto.NewAssetId,
            TargetUser = dto.TargetUser,
            TargetLocation = dto.TargetLocation,
            OldAssetNewStatus = oldAssetNewStatus,
            Notes = dto.Notes,
            IsCompleted = false,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var createdSwap = await _rolloutRepository.CreateSwapAsync(swap, cancellationToken);
        var swapDto = MapToSwapDto(createdSwap);

        return CreatedAtAction(nameof(GetSession), new { id = sessionId }, swapDto);
    }

    /// <summary>
    /// Executes an asset swap, updating asset statuses and creating audit events.
    /// </summary>
    /// <param name="sessionId">The session ID</param>
    /// <param name="swapId">The swap ID to execute</param>
    /// <param name="dto">Execution data</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Updated asset swap</returns>
    [HttpPost("{sessionId}/swaps/{swapId}/execute")]
    [ProducesResponseType(typeof(AssetSwapDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<AssetSwapDto>> ExecuteSwap(
        int sessionId,
        int swapId,
        ExecuteSwapDto dto,
        CancellationToken cancellationToken = default)
    {
        var swap = await _rolloutRepository.GetSwapByIdAsync(swapId, cancellationToken);
        if (swap == null)
            return NotFound($"Asset swap with ID {swapId} not found");

        if (swap.RolloutSessionId != sessionId)
            return BadRequest($"Swap {swapId} does not belong to session {sessionId}");

        if (swap.IsCompleted)
            return BadRequest($"Swap {swapId} has already been executed");

        // Get user information from claims
        var userName = User.FindFirst(ClaimTypes.Name)?.Value ?? "System";
        var userEmail = User.FindFirst(ClaimTypes.Email)?.Value ?? User.FindFirst("preferred_username")?.Value ?? string.Empty;

        // Parse old asset new status if provided
        AssetStatus? oldAssetNewStatus = null;
        if (!string.IsNullOrEmpty(dto.OldAssetNewStatus))
        {
            if (!Enum.TryParse<AssetStatus>(dto.OldAssetNewStatus, true, out var parsedStatus))
                return BadRequest($"Invalid asset status value: {dto.OldAssetNewStatus}");
            oldAssetNewStatus = parsedStatus;
        }

        // Update old asset status if applicable
        if (swap.OldAssetId.HasValue && oldAssetNewStatus.HasValue)
        {
            var oldAsset = await _assetRepository.GetByIdAsync(swap.OldAssetId.Value, cancellationToken);
            if (oldAsset != null)
            {
                var oldStatus = oldAsset.Status;
                oldAsset.Status = oldAssetNewStatus.Value;
                oldAsset.UpdatedAt = DateTime.UtcNow;

                await _assetRepository.UpdateAsync(oldAsset, cancellationToken);

                // Create asset event for status change
                var assetEvent = new AssetEvent
                {
                    AssetId = oldAsset.Id,
                    EventType = AssetEventType.StatusChanged,
                    Description = $"Status changed from {oldStatus} to {oldAssetNewStatus.Value} during asset swap in rollout session '{swap.RolloutSession?.SessionName ?? sessionId.ToString()}'",
                    OldValue = oldStatus.ToString(),
                    NewValue = oldAssetNewStatus.Value.ToString(),
                    Notes = dto.Notes,
                    PerformedBy = userName,
                    PerformedByEmail = userEmail,
                    EventDate = dto.SwapDate ?? DateTime.UtcNow,
                    CreatedAt = DateTime.UtcNow
                };

                await _assetEventRepository.CreateAsync(assetEvent, cancellationToken);
            }
        }

        // Update new asset to InGebruik status
        var newAsset = await _assetRepository.GetByIdAsync(swap.NewAssetId, cancellationToken);
        if (newAsset != null)
        {
            var oldStatus = newAsset.Status;
            newAsset.Status = AssetStatus.InGebruik;
            newAsset.UpdatedAt = DateTime.UtcNow;

            await _assetRepository.UpdateAsync(newAsset, cancellationToken);

            // Create asset event for the new asset deployment
            var assetEvent = new AssetEvent
            {
                AssetId = newAsset.Id,
                EventType = AssetEventType.StatusChanged,
                Description = $"Asset deployed to user during rollout session '{swap.RolloutSession?.SessionName ?? sessionId.ToString()}'",
                OldValue = oldStatus.ToString(),
                NewValue = AssetStatus.InGebruik.ToString(),
                Notes = $"Deployed to: {swap.TargetUser ?? "N/A"}. Location: {swap.TargetLocation ?? "N/A"}. {dto.Notes}",
                PerformedBy = userName,
                PerformedByEmail = userEmail,
                EventDate = dto.SwapDate ?? DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow
            };

            await _assetEventRepository.CreateAsync(assetEvent, cancellationToken);
        }

        // Mark swap as completed
        swap.IsCompleted = true;
        swap.SwapDate = dto.SwapDate ?? DateTime.UtcNow;
        swap.SwappedBy = userName;
        swap.SwappedByEmail = userEmail;
        swap.OldAssetNewStatus = oldAssetNewStatus;

        if (!string.IsNullOrEmpty(dto.Notes))
        {
            swap.Notes = string.IsNullOrEmpty(swap.Notes)
                ? dto.Notes
                : $"{swap.Notes}\n\n[Execution Note] {dto.Notes}";
        }

        swap.UpdatedAt = DateTime.UtcNow;

        var updatedSwap = await _rolloutRepository.UpdateSwapAsync(swap, cancellationToken);
        var swapDto = MapToSwapDto(updatedSwap);

        return Ok(swapDto);
    }

    // ===== Progress Tracking =====

    /// <summary>
    /// Gets progress statistics for a rollout session.
    /// </summary>
    /// <param name="sessionId">The session ID</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Progress statistics</returns>
    [HttpGet("{sessionId}/progress")]
    [ProducesResponseType(typeof(RolloutProgressDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<RolloutProgressDto>> GetProgress(
        int sessionId,
        CancellationToken cancellationToken = default)
    {
        var session = await _rolloutRepository.GetSessionByIdAsync(sessionId, cancellationToken);
        if (session == null)
            return NotFound($"Rollout session with ID {sessionId} not found");

        var progress = await _rolloutRepository.GetProgressAsync(sessionId, cancellationToken);
        return Ok(progress);
    }

    // ===== Private Mapping Methods =====

    private static RolloutSessionSummaryDto MapToSummaryDto(RolloutSession session)
    {
        var totalItems = session.Items?.Count ?? 0;
        var completedItems = session.Items?.Count(i => i.Status == RolloutItemStatus.Completed) ?? 0;
        var pendingItems = session.Items?.Count(i => i.Status == RolloutItemStatus.Pending) ?? 0;
        var inProgressItems = session.Items?.Count(i => i.Status == RolloutItemStatus.InProgress) ?? 0;
        var failedItems = session.Items?.Count(i => i.Status == RolloutItemStatus.Failed) ?? 0;
        var skippedItems = session.Items?.Count(i => i.Status == RolloutItemStatus.Skipped) ?? 0;

        var completionPercentage = totalItems > 0
            ? Math.Round((decimal)(completedItems + skippedItems) / totalItems * 100, 2)
            : 0;

        return new RolloutSessionSummaryDto
        {
            Id = session.Id,
            SessionName = session.SessionName,
            Description = session.Description,
            Status = session.Status.ToString(),
            PlannedDate = session.PlannedDate,
            StartedAt = session.StartedAt,
            CompletedAt = session.CompletedAt,
            CreatedBy = session.CreatedBy,
            TotalItems = totalItems,
            CompletedItems = completedItems,
            PendingItems = pendingItems,
            InProgressItems = inProgressItems,
            FailedItems = failedItems,
            SkippedItems = skippedItems,
            CompletionPercentage = completionPercentage,
            CreatedAt = session.CreatedAt,
            UpdatedAt = session.UpdatedAt
        };
    }

    private async Task<RolloutSessionDto> MapToSessionDtoAsync(RolloutSession session, CancellationToken cancellationToken)
    {
        var dto = new RolloutSessionDto
        {
            Id = session.Id,
            SessionName = session.SessionName,
            Description = session.Description,
            Status = session.Status.ToString(),
            PlannedDate = session.PlannedDate,
            StartedAt = session.StartedAt,
            CompletedAt = session.CompletedAt,
            CreatedBy = session.CreatedBy,
            CreatedByEmail = session.CreatedByEmail,
            CreatedAt = session.CreatedAt,
            UpdatedAt = session.UpdatedAt,
            Items = session.Items?.Select(MapToItemDto).ToList() ?? new List<RolloutItemDto>(),
            AssetSwaps = session.AssetSwaps?.Select(MapToSwapDto).ToList() ?? new List<AssetSwapDto>()
        };

        // Get progress
        dto.Progress = await _rolloutRepository.GetProgressAsync(session.Id, cancellationToken);

        return dto;
    }

    private static RolloutItemDto MapToItemDto(RolloutItem item)
    {
        return new RolloutItemDto
        {
            Id = item.Id,
            RolloutSessionId = item.RolloutSessionId,
            AssetId = item.AssetId,
            Asset = item.Asset != null ? new AssetInfo
            {
                Id = item.Asset.Id,
                AssetCode = item.Asset.AssetCode,
                AssetName = item.Asset.AssetName,
                Alias = item.Asset.Alias,
                Category = item.Asset.Category,
                Brand = item.Asset.Brand,
                Model = item.Asset.Model,
                SerialNumber = item.Asset.SerialNumber,
                Status = item.Asset.Status.ToString()
            } : null,
            TargetUser = item.TargetUser,
            TargetUserEmail = item.TargetUserEmail,
            TargetLocation = item.TargetLocation,
            TargetServiceId = item.TargetServiceId,
            TargetService = item.TargetService != null ? new ServiceInfo
            {
                Id = item.TargetService.Id,
                Code = item.TargetService.Code,
                Name = item.TargetService.Name
            } : null,
            MonitorPosition = item.MonitorPosition,
            MonitorDisplayNumber = item.MonitorDisplayNumber,
            Status = item.Status.ToString(),
            CompletedAt = item.CompletedAt,
            CompletedBy = item.CompletedBy,
            CompletedByEmail = item.CompletedByEmail,
            Notes = item.Notes,
            CreatedAt = item.CreatedAt,
            UpdatedAt = item.UpdatedAt
        };
    }

    private static AssetSwapDto MapToSwapDto(AssetSwap swap)
    {
        return new AssetSwapDto
        {
            Id = swap.Id,
            RolloutSessionId = swap.RolloutSessionId,
            OldAssetId = swap.OldAssetId,
            OldAsset = swap.OldAsset != null ? new AssetInfo
            {
                Id = swap.OldAsset.Id,
                AssetCode = swap.OldAsset.AssetCode,
                AssetName = swap.OldAsset.AssetName,
                Alias = swap.OldAsset.Alias,
                Category = swap.OldAsset.Category,
                Brand = swap.OldAsset.Brand,
                Model = swap.OldAsset.Model,
                SerialNumber = swap.OldAsset.SerialNumber,
                Status = swap.OldAsset.Status.ToString()
            } : null,
            NewAssetId = swap.NewAssetId,
            NewAsset = swap.NewAsset != null ? new AssetInfo
            {
                Id = swap.NewAsset.Id,
                AssetCode = swap.NewAsset.AssetCode,
                AssetName = swap.NewAsset.AssetName,
                Alias = swap.NewAsset.Alias,
                Category = swap.NewAsset.Category,
                Brand = swap.NewAsset.Brand,
                Model = swap.NewAsset.Model,
                SerialNumber = swap.NewAsset.SerialNumber,
                Status = swap.NewAsset.Status.ToString()
            } : null,
            TargetUser = swap.TargetUser,
            TargetLocation = swap.TargetLocation,
            SwapDate = swap.SwapDate,
            SwappedBy = swap.SwappedBy,
            SwappedByEmail = swap.SwappedByEmail,
            OldAssetNewStatus = swap.OldAssetNewStatus?.ToString(),
            Notes = swap.Notes,
            IsCompleted = swap.IsCompleted,
            CreatedAt = swap.CreatedAt,
            UpdatedAt = swap.UpdatedAt
        };
    }
}

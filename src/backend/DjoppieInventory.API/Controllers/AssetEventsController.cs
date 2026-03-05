using System.Security.Claims;
using DjoppieInventory.Core.DTOs;
using DjoppieInventory.Core.Entities;
using DjoppieInventory.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DjoppieInventory.API.Controllers;

/// <summary>
/// API controller for managing asset events (audit trail and notes).
/// </summary>
[Authorize]
[ApiController]
[Route("api/[controller]")]
public class AssetEventsController : ControllerBase
{
    private readonly IAssetEventRepository _assetEventRepository;

    public AssetEventsController(IAssetEventRepository assetEventRepository)
    {
        _assetEventRepository = assetEventRepository;
    }

    /// <summary>
    /// Retrieves all events for a specific asset, ordered by date descending.
    /// </summary>
    /// <param name="assetId">The asset ID</param>
    /// <param name="cancellationToken">Cancellation token</param>
    [HttpGet("by-asset/{assetId}")]
    [ProducesResponseType(typeof(IEnumerable<AssetEventDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<AssetEventDto>>> GetByAssetId(
        int assetId,
        CancellationToken cancellationToken = default)
    {
        var events = await _assetEventRepository.GetByAssetIdAsync(assetId, cancellationToken);
        var dtos = events.Select(e => new AssetEventDto(
            e.Id,
            e.AssetId,
            e.EventType.ToString(),
            e.Description,
            e.Notes,
            e.OldValue,
            e.NewValue,
            e.PerformedBy,
            e.PerformedByEmail,
            e.EventDate
        ));

        return Ok(dtos);
    }

    /// <summary>
    /// Retrieves a specific event by ID.
    /// </summary>
    /// <param name="id">The event ID</param>
    /// <param name="cancellationToken">Cancellation token</param>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(AssetEventDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<AssetEventDto>> GetById(int id, CancellationToken cancellationToken = default)
    {
        var assetEvent = await _assetEventRepository.GetByIdAsync(id, cancellationToken);
        if (assetEvent == null)
            return NotFound($"Asset event with ID {id} not found");

        var dto = new AssetEventDto(
            assetEvent.Id,
            assetEvent.AssetId,
            assetEvent.EventType.ToString(),
            assetEvent.Description,
            assetEvent.Notes,
            assetEvent.OldValue,
            assetEvent.NewValue,
            assetEvent.PerformedBy,
            assetEvent.PerformedByEmail,
            assetEvent.EventDate
        );

        return Ok(dto);
    }

    /// <summary>
    /// Creates a new asset event (note or audit entry).
    /// </summary>
    /// <param name="dto">The event creation data</param>
    /// <param name="cancellationToken">Cancellation token</param>
    [HttpPost]
    [ProducesResponseType(typeof(AssetEventDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<AssetEventDto>> Create(
        CreateAssetEventDto dto,
        CancellationToken cancellationToken = default)
    {
        // Parse event type
        if (!Enum.TryParse<AssetEventType>(dto.EventType, true, out var eventType))
            return BadRequest($"Invalid event type: {dto.EventType}");

        // Get current user information from claims
        var userName = User.FindFirstValue(ClaimTypes.Name)
                      ?? User.FindFirstValue("name")
                      ?? User.FindFirstValue("preferred_username");

        var userEmail = User.FindFirstValue(ClaimTypes.Email)
                       ?? User.FindFirstValue("email")
                       ?? User.FindFirstValue("preferred_username");

        var assetEvent = new AssetEvent
        {
            AssetId = dto.AssetId,
            EventType = eventType,
            Description = dto.Description,
            Notes = dto.Notes,
            OldValue = dto.OldValue,
            NewValue = dto.NewValue,
            PerformedBy = userName,
            PerformedByEmail = userEmail,
            EventDate = DateTime.UtcNow
        };

        var created = await _assetEventRepository.CreateAsync(assetEvent, cancellationToken);

        var resultDto = new AssetEventDto(
            created.Id,
            created.AssetId,
            created.EventType.ToString(),
            created.Description,
            created.Notes,
            created.OldValue,
            created.NewValue,
            created.PerformedBy,
            created.PerformedByEmail,
            created.EventDate
        );

        return CreatedAtAction(nameof(GetById), new { id = created.Id }, resultDto);
    }

    /// <summary>
    /// Retrieves recent events across all assets (activity feed).
    /// </summary>
    /// <param name="count">Number of events to retrieve (default: 50, max: 200)</param>
    /// <param name="cancellationToken">Cancellation token</param>
    [HttpGet("recent")]
    [ProducesResponseType(typeof(IEnumerable<AssetEventDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<AssetEventDto>>> GetRecent(
        [FromQuery] int count = 50,
        CancellationToken cancellationToken = default)
    {
        if (count < 1 || count > 200)
            return BadRequest("Count must be between 1 and 200");

        var events = await _assetEventRepository.GetRecentEventsAsync(count, cancellationToken);
        var dtos = events.Select(e => new AssetEventDto(
            e.Id,
            e.AssetId,
            e.EventType.ToString(),
            e.Description,
            e.Notes,
            e.OldValue,
            e.NewValue,
            e.PerformedBy,
            e.PerformedByEmail,
            e.EventDate
        ));

        return Ok(dtos);
    }
}

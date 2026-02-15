using DjoppieInventory.Core.Entities;
using DjoppieInventory.Core.Interfaces;
using Microsoft.Extensions.Logging;

namespace DjoppieInventory.Infrastructure.Services;

/// <summary>
/// Service for managing asset events and audit trail.
/// Automatically creates events when asset changes occur.
/// </summary>
public class AssetEventService : IAssetEventService
{
    private readonly IAssetEventRepository _assetEventRepository;
    private readonly ILogger<AssetEventService> _logger;

    public AssetEventService(
        IAssetEventRepository assetEventRepository,
        ILogger<AssetEventService> logger)
    {
        _assetEventRepository = assetEventRepository;
        _logger = logger;
    }

    public async Task<AssetEvent> CreateEventAsync(
        int assetId,
        AssetEventType eventType,
        string description,
        string? oldValue,
        string? newValue,
        string performedBy,
        string? performedByEmail,
        string? notes = null,
        CancellationToken cancellationToken = default)
    {
        var assetEvent = new AssetEvent
        {
            AssetId = assetId,
            EventType = eventType,
            Description = description,
            OldValue = oldValue,
            NewValue = newValue,
            PerformedBy = performedBy,
            PerformedByEmail = performedByEmail,
            Notes = notes,
            EventDate = DateTime.UtcNow
        };

        var createdEvent = await _assetEventRepository.CreateAsync(assetEvent, cancellationToken);

        _logger.LogInformation(
            "Created {EventType} event for asset {AssetId} by {PerformedBy}",
            eventType, assetId, performedBy);

        return createdEvent;
    }

    public async Task<AssetEvent> CreateCreatedEventAsync(
        int assetId,
        string performedBy,
        string? performedByEmail,
        string? notes = null,
        CancellationToken cancellationToken = default)
    {
        var description = $"Asset created by {performedBy}";

        return await CreateEventAsync(
            assetId,
            AssetEventType.Created,
            description,
            oldValue: null,
            newValue: "Created",
            performedBy,
            performedByEmail,
            notes,
            cancellationToken);
    }

    public async Task<AssetEvent> CreateStatusChangedEventAsync(
        int assetId,
        AssetStatus oldStatus,
        AssetStatus newStatus,
        string performedBy,
        string? performedByEmail,
        string? notes = null,
        CancellationToken cancellationToken = default)
    {
        var description = $"Status changed from {oldStatus} to {newStatus}";

        return await CreateEventAsync(
            assetId,
            AssetEventType.StatusChanged,
            description,
            oldValue: oldStatus.ToString(),
            newValue: newStatus.ToString(),
            performedBy,
            performedByEmail,
            notes,
            cancellationToken);
    }

    public async Task<AssetEvent> CreateOwnerChangedEventAsync(
        int assetId,
        string? oldOwner,
        string? newOwner,
        string performedBy,
        string? performedByEmail,
        string? notes = null,
        CancellationToken cancellationToken = default)
    {
        var oldOwnerDisplay = string.IsNullOrWhiteSpace(oldOwner) ? "(unassigned)" : oldOwner;
        var newOwnerDisplay = string.IsNullOrWhiteSpace(newOwner) ? "(unassigned)" : newOwner;
        var description = $"Owner changed from {oldOwnerDisplay} to {newOwnerDisplay}";

        return await CreateEventAsync(
            assetId,
            AssetEventType.OwnerChanged,
            description,
            oldValue: oldOwner,
            newValue: newOwner,
            performedBy,
            performedByEmail,
            notes,
            cancellationToken);
    }

    public async Task<AssetEvent> CreateLocationChangedEventAsync(
        int assetId,
        string? oldLocation,
        string? newLocation,
        string performedBy,
        string? performedByEmail,
        string? notes = null,
        CancellationToken cancellationToken = default)
    {
        var oldLocationDisplay = string.IsNullOrWhiteSpace(oldLocation) ? "(not set)" : oldLocation;
        var newLocationDisplay = string.IsNullOrWhiteSpace(newLocation) ? "(not set)" : newLocation;
        var description = $"Location changed from {oldLocationDisplay} to {newLocationDisplay}";

        return await CreateEventAsync(
            assetId,
            AssetEventType.LocationChanged,
            description,
            oldValue: oldLocation,
            newValue: newLocation,
            performedBy,
            performedByEmail,
            notes,
            cancellationToken);
    }
}

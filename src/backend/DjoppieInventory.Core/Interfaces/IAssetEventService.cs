using DjoppieInventory.Core.Entities;

namespace DjoppieInventory.Core.Interfaces;

/// <summary>
/// Service interface for managing asset events and audit trail.
/// Provides methods for creating events automatically when asset changes occur.
/// </summary>
public interface IAssetEventService
{
    /// <summary>
    /// Creates a new asset event with full control over all properties.
    /// </summary>
    /// <param name="assetId">The ID of the asset this event belongs to</param>
    /// <param name="eventType">The type of event that occurred</param>
    /// <param name="description">Brief description of what happened</param>
    /// <param name="oldValue">Previous value before the change (optional)</param>
    /// <param name="newValue">New value after the change (optional)</param>
    /// <param name="performedBy">Display name of the user who performed the action</param>
    /// <param name="performedByEmail">Email address of the user who performed the action</param>
    /// <param name="notes">Additional notes or details (optional)</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>The created asset event</returns>
    Task<AssetEvent> CreateEventAsync(
        int assetId,
        AssetEventType eventType,
        string description,
        string? oldValue,
        string? newValue,
        string performedBy,
        string? performedByEmail,
        string? notes = null,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Creates a "Created" event for a newly created asset.
    /// </summary>
    /// <param name="assetId">The ID of the newly created asset</param>
    /// <param name="performedBy">Display name of the user who created the asset</param>
    /// <param name="performedByEmail">Email address of the user who created the asset</param>
    /// <param name="notes">Additional notes (optional)</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>The created asset event</returns>
    Task<AssetEvent> CreateCreatedEventAsync(
        int assetId,
        string performedBy,
        string? performedByEmail,
        string? notes = null,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Creates a "StatusChanged" event when an asset's status changes.
    /// </summary>
    /// <param name="assetId">The ID of the asset</param>
    /// <param name="oldStatus">Previous status</param>
    /// <param name="newStatus">New status</param>
    /// <param name="performedBy">Display name of the user who changed the status</param>
    /// <param name="performedByEmail">Email address of the user who changed the status</param>
    /// <param name="notes">Additional notes (optional)</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>The created asset event</returns>
    Task<AssetEvent> CreateStatusChangedEventAsync(
        int assetId,
        AssetStatus oldStatus,
        AssetStatus newStatus,
        string performedBy,
        string? performedByEmail,
        string? notes = null,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Creates an "OwnerChanged" event when an asset's owner changes.
    /// </summary>
    /// <param name="assetId">The ID of the asset</param>
    /// <param name="oldOwner">Previous owner name (null if none)</param>
    /// <param name="newOwner">New owner name (null if unassigned)</param>
    /// <param name="performedBy">Display name of the user who changed the owner</param>
    /// <param name="performedByEmail">Email address of the user who changed the owner</param>
    /// <param name="notes">Additional notes (optional)</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>The created asset event</returns>
    Task<AssetEvent> CreateOwnerChangedEventAsync(
        int assetId,
        string? oldOwner,
        string? newOwner,
        string performedBy,
        string? performedByEmail,
        string? notes = null,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Creates a "LocationChanged" event when an asset's building or location changes.
    /// </summary>
    /// <param name="assetId">The ID of the asset</param>
    /// <param name="oldLocation">Previous location description</param>
    /// <param name="newLocation">New location description</param>
    /// <param name="performedBy">Display name of the user who changed the location</param>
    /// <param name="performedByEmail">Email address of the user who changed the location</param>
    /// <param name="notes">Additional notes (optional)</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>The created asset event</returns>
    Task<AssetEvent> CreateLocationChangedEventAsync(
        int assetId,
        string? oldLocation,
        string? newLocation,
        string performedBy,
        string? performedByEmail,
        string? notes = null,
        CancellationToken cancellationToken = default);
}

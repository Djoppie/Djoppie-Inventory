using DjoppieInventory.Core.Entities;

namespace DjoppieInventory.Core.Interfaces;

/// <summary>
/// Repository interface for AssetEvent data access operations
/// </summary>
public interface IAssetEventRepository
{
    /// <summary>
    /// Gets all events for a specific asset, ordered by EventDate descending (newest first)
    /// </summary>
    Task<IEnumerable<AssetEvent>> GetByAssetIdAsync(int assetId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets a single event by its ID
    /// </summary>
    Task<AssetEvent?> GetByIdAsync(int id, CancellationToken cancellationToken = default);

    /// <summary>
    /// Creates a new asset event
    /// </summary>
    Task<AssetEvent> CreateAsync(AssetEvent assetEvent, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets recent events across all assets, ordered by EventDate descending.
    /// Useful for activity feeds or audit logs.
    /// </summary>
    Task<IEnumerable<AssetEvent>> GetRecentEventsAsync(int count = 50, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets events of a specific type, optionally filtered by date.
    /// Ordered by EventDate descending.
    /// </summary>
    Task<IEnumerable<AssetEvent>> GetEventsByTypeAsync(AssetEventType eventType, DateTime? since = null, CancellationToken cancellationToken = default);
}

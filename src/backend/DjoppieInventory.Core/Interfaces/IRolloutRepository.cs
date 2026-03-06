using DjoppieInventory.Core.DTOs.Rollout;
using DjoppieInventory.Core.Entities;

namespace DjoppieInventory.Core.Interfaces;

/// <summary>
/// Repository interface for Rollout data access operations.
/// Manages rollout sessions, items, asset swaps, and progress tracking.
/// </summary>
public interface IRolloutRepository
{
    // ===== Session Operations =====

    /// <summary>
    /// Gets all rollout sessions, optionally filtered by status.
    /// Sessions are ordered by planned date (descending).
    /// </summary>
    /// <param name="status">Optional status filter (e.g., Planning, InProgress)</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Collection of rollout sessions</returns>
    Task<IEnumerable<RolloutSession>> GetAllSessionsAsync(
        RolloutSessionStatus? status = null,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets a single rollout session by ID without related entities.
    /// </summary>
    /// <param name="id">Session ID</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Rollout session if found, null otherwise</returns>
    Task<RolloutSession?> GetSessionByIdAsync(int id, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets a rollout session by ID with all related items eagerly loaded.
    /// Includes Asset, Service navigation properties for each item.
    /// </summary>
    /// <param name="id">Session ID</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Rollout session with items if found, null otherwise</returns>
    Task<RolloutSession?> GetSessionWithItemsAsync(int id, CancellationToken cancellationToken = default);

    /// <summary>
    /// Creates a new rollout session.
    /// </summary>
    /// <param name="session">The session to create</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Created session</returns>
    Task<RolloutSession> CreateSessionAsync(RolloutSession session, CancellationToken cancellationToken = default);

    /// <summary>
    /// Updates an existing rollout session.
    /// </summary>
    /// <param name="session">The session to update</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Updated session</returns>
    Task<RolloutSession> UpdateSessionAsync(RolloutSession session, CancellationToken cancellationToken = default);

    /// <summary>
    /// Deletes a rollout session and all associated items (cascade delete).
    /// </summary>
    /// <param name="id">Session ID</param>
    /// <param name="cancellationToken">Cancellation token</param>
    Task DeleteSessionAsync(int id, CancellationToken cancellationToken = default);

    // ===== Item Operations =====

    /// <summary>
    /// Gets a single rollout item by ID with Asset and Service navigation properties loaded.
    /// </summary>
    /// <param name="id">Item ID</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Rollout item if found, null otherwise</returns>
    Task<RolloutItem?> GetItemByIdAsync(int id, CancellationToken cancellationToken = default);

    /// <summary>
    /// Adds a single rollout item to a session.
    /// </summary>
    /// <param name="item">The item to add</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Created item with navigation properties loaded</returns>
    Task<RolloutItem> AddItemAsync(RolloutItem item, CancellationToken cancellationToken = default);

    /// <summary>
    /// Adds multiple rollout items in a single database operation.
    /// More efficient than calling AddItemAsync multiple times.
    /// </summary>
    /// <param name="items">Collection of items to add</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Created items with navigation properties loaded</returns>
    Task<IEnumerable<RolloutItem>> AddItemsBulkAsync(
        IEnumerable<RolloutItem> items,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Updates an existing rollout item.
    /// </summary>
    /// <param name="item">The item to update</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Updated item</returns>
    Task<RolloutItem> UpdateItemAsync(RolloutItem item, CancellationToken cancellationToken = default);

    /// <summary>
    /// Deletes a rollout item from a session.
    /// </summary>
    /// <param name="id">Item ID</param>
    /// <param name="cancellationToken">Cancellation token</param>
    Task DeleteItemAsync(int id, CancellationToken cancellationToken = default);

    /// <summary>
    /// Checks if an asset is currently assigned to any active rollout session.
    /// Active sessions are those with status Planning, Ready, or InProgress.
    /// </summary>
    /// <param name="assetId">Asset ID to check</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>True if asset is in an active rollout, false otherwise</returns>
    Task<bool> IsAssetInActiveRolloutAsync(int assetId, CancellationToken cancellationToken = default);

    // ===== Swap Operations =====

    /// <summary>
    /// Gets a single asset swap by ID with navigation properties loaded.
    /// </summary>
    /// <param name="id">Swap ID</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Asset swap if found, null otherwise</returns>
    Task<AssetSwap?> GetSwapByIdAsync(int id, CancellationToken cancellationToken = default);

    /// <summary>
    /// Creates a new asset swap record.
    /// </summary>
    /// <param name="swap">The swap to create</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Created swap with navigation properties loaded</returns>
    Task<AssetSwap> CreateSwapAsync(AssetSwap swap, CancellationToken cancellationToken = default);

    /// <summary>
    /// Updates an existing asset swap record.
    /// </summary>
    /// <param name="swap">The swap to update</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Updated swap</returns>
    Task<AssetSwap> UpdateSwapAsync(AssetSwap swap, CancellationToken cancellationToken = default);

    // ===== Progress Tracking =====

    /// <summary>
    /// Calculates and returns progress statistics for a rollout session.
    /// Includes item counts by status, completion percentage, swap counts, and time estimates.
    /// </summary>
    /// <param name="sessionId">Session ID</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Progress statistics DTO</returns>
    Task<RolloutProgressDto> GetProgressAsync(int sessionId, CancellationToken cancellationToken = default);
}

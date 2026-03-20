using DjoppieInventory.Core.Entities;
using Microsoft.EntityFrameworkCore.Storage;

namespace DjoppieInventory.Core.Interfaces;

/// <summary>
/// Repository interface for managing rollout sessions, days, and workplaces.
/// Provides CRUD operations and queries for the rollout workflow.
/// </summary>
public interface IRolloutRepository
{
    // ===== RolloutSession Operations =====

    /// <summary>
    /// Gets all rollout sessions with optional status filtering
    /// </summary>
    Task<IEnumerable<RolloutSession>> GetAllSessionsAsync(RolloutSessionStatus? status = null, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets a rollout session by ID, optionally including related days and workplaces
    /// </summary>
    Task<RolloutSession?> GetSessionByIdAsync(int id, bool includeDays = false, bool includeWorkplaces = false, CancellationToken cancellationToken = default);

    /// <summary>
    /// Creates a new rollout session
    /// </summary>
    Task<RolloutSession> CreateSessionAsync(RolloutSession session, CancellationToken cancellationToken = default);

    /// <summary>
    /// Updates an existing rollout session
    /// </summary>
    Task<RolloutSession> UpdateSessionAsync(RolloutSession session, CancellationToken cancellationToken = default);

    /// <summary>
    /// Deletes a rollout session (cascade deletes days and workplaces)
    /// </summary>
    Task<bool> DeleteSessionAsync(int id, CancellationToken cancellationToken = default);

    // ===== RolloutDay Operations =====

    /// <summary>
    /// Gets all days for a specific session
    /// </summary>
    Task<IEnumerable<RolloutDay>> GetDaysBySessionIdAsync(int sessionId, bool includeWorkplaces = false, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets all days for a specific date across all active sessions
    /// </summary>
    Task<IEnumerable<RolloutDay>> GetDaysByDateAsync(DateOnly date, bool includeWorkplaces = false, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets a specific day by ID
    /// </summary>
    Task<RolloutDay?> GetDayByIdAsync(int id, bool includeWorkplaces = false, CancellationToken cancellationToken = default);

    /// <summary>
    /// Creates a new rollout day
    /// </summary>
    Task<RolloutDay> CreateDayAsync(RolloutDay day, CancellationToken cancellationToken = default);

    /// <summary>
    /// Updates an existing rollout day
    /// </summary>
    Task<RolloutDay> UpdateDayAsync(RolloutDay day, CancellationToken cancellationToken = default);

    /// <summary>
    /// Deletes a rollout day (cascade deletes workplaces)
    /// </summary>
    Task<bool> DeleteDayAsync(int id, CancellationToken cancellationToken = default);

    // ===== RolloutWorkplace Operations =====

    /// <summary>
    /// Gets all workplaces for a specific day
    /// </summary>
    Task<IEnumerable<RolloutWorkplace>> GetWorkplacesByDayIdAsync(int dayId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets workplaces by status for a specific day
    /// </summary>
    Task<IEnumerable<RolloutWorkplace>> GetWorkplacesByStatusAsync(int dayId, RolloutWorkplaceStatus status, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets a specific workplace by ID
    /// </summary>
    Task<RolloutWorkplace?> GetWorkplaceByIdAsync(int id, CancellationToken cancellationToken = default);

    /// <summary>
    /// Creates a new workplace
    /// </summary>
    Task<RolloutWorkplace> CreateWorkplaceAsync(RolloutWorkplace workplace, CancellationToken cancellationToken = default);

    /// <summary>
    /// Updates an existing workplace
    /// </summary>
    Task<RolloutWorkplace> UpdateWorkplaceAsync(RolloutWorkplace workplace, CancellationToken cancellationToken = default);

    /// <summary>
    /// Deletes a workplace
    /// </summary>
    Task<bool> DeleteWorkplaceAsync(int id, CancellationToken cancellationToken = default);

    // ===== Batch Operations =====

    /// <summary>
    /// Creates multiple workplaces at once (for bulk import)
    /// </summary>
    Task<IEnumerable<RolloutWorkplace>> CreateWorkplacesAsync(IEnumerable<RolloutWorkplace> workplaces);

    // ===== Asset Type Lookup =====

    /// <summary>
    /// Gets an asset type by its code (LAP, DESK, DOCK, MON, KEYB, MOUSE)
    /// </summary>
    Task<AssetType?> GetAssetTypeByCodeAsync(string code);

    // ===== Statistics & Reporting =====

    /// <summary>
    /// Gets statistics for a session (total/completed workplaces, etc.)
    /// </summary>
    Task<RolloutSessionStats> GetSessionStatsAsync(int sessionId);

    // ===== Transaction Support =====

    /// <summary>
    /// Begins a database transaction for atomic operations.
    /// </summary>
    Task<IDbContextTransaction> BeginTransactionAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Saves all pending changes to the database without triggering ProcessAssetPlans.
    /// Used within transactions where explicit control is needed.
    /// </summary>
    Task SaveChangesAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Updates the TotalWorkplaces and CompletedWorkplaces counts for a day.
    /// Used after completing workplaces to update day statistics.
    /// </summary>
    Task UpdateDayTotalsAsync(int dayId);

    /// <summary>
    /// Executes the given action within a database transaction, wrapped in the configured
    /// execution strategy (required for Azure SQL with retry logic).
    /// </summary>
    Task ExecuteInTransactionAsync(Func<Task> action, CancellationToken cancellationToken = default);
}

/// <summary>
/// Statistics for a rollout session
/// </summary>
public class RolloutSessionStats
{
    public int TotalDays { get; set; }
    public int TotalWorkplaces { get; set; }
    public int CompletedWorkplaces { get; set; }
    public int PendingWorkplaces { get; set; }
    public int InProgressWorkplaces { get; set; }
    public int SkippedWorkplaces { get; set; }
    public int FailedWorkplaces { get; set; }
    public decimal CompletionPercentage { get; set; }
}

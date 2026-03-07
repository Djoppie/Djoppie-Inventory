namespace DjoppieInventory.Core.Entities;

/// <summary>
/// Represents the current status of a rollout session
/// </summary>
public enum RolloutSessionStatus
{
    /// <summary>
    /// Planning - Session is being prepared, items can be added/removed
    /// </summary>
    Planning = 0,

    /// <summary>
    /// Ready - Session is finalized and ready to start rollout
    /// </summary>
    Ready = 1,

    /// <summary>
    /// InProgress - Rollout is currently being executed
    /// </summary>
    InProgress = 2,

    /// <summary>
    /// Completed - All workplaces in the session have been processed
    /// </summary>
    Completed = 3,

    /// <summary>
    /// Cancelled - Session was cancelled before completion
    /// </summary>
    Cancelled = 4
}

/// <summary>
/// Represents a rollout session for deploying assets to users over multiple days.
/// A rollout session groups together days and workplaces that need to be configured
/// in a coordinated effort (e.g., "Q1 2026 Laptop Refresh").
/// </summary>
public class RolloutSession
{
    /// <summary>
    /// Unique identifier for the rollout session
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// Name of the rollout session (e.g., "Q1 2026 Laptop Refresh", "Dienst IT - Werkplek Upgrade")
    /// </summary>
    public string SessionName { get; set; } = string.Empty;

    /// <summary>
    /// Optional detailed description of the rollout purpose and scope
    /// </summary>
    public string? Description { get; set; }

    /// <summary>
    /// Current status of the rollout session
    /// </summary>
    public RolloutSessionStatus Status { get; set; } = RolloutSessionStatus.Planning;

    /// <summary>
    /// Planned start date for the rollout
    /// </summary>
    public DateTime PlannedStartDate { get; set; }

    /// <summary>
    /// Planned end date for the rollout (optional)
    /// </summary>
    public DateTime? PlannedEndDate { get; set; }

    /// <summary>
    /// Actual timestamp when the rollout was started (null if not yet started)
    /// </summary>
    public DateTime? StartedAt { get; set; }

    /// <summary>
    /// Actual timestamp when the rollout was completed (null if not yet completed)
    /// </summary>
    public DateTime? CompletedAt { get; set; }

    /// <summary>
    /// Display name of the user who created the session
    /// </summary>
    public string CreatedBy { get; set; } = string.Empty;

    /// <summary>
    /// Email address of the user who created the session
    /// </summary>
    public string CreatedByEmail { get; set; } = string.Empty;

    /// <summary>
    /// Timestamp when the session was created
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Timestamp when the session was last updated
    /// </summary>
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // ===== Navigation Properties =====

    /// <summary>
    /// Collection of days planned for this rollout session
    /// </summary>
    public ICollection<RolloutDay> Days { get; set; } = new List<RolloutDay>();
}

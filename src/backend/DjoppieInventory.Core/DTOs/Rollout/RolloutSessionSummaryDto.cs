namespace DjoppieInventory.Core.DTOs.Rollout;

/// <summary>
/// Lightweight Data Transfer Object for RolloutSession suitable for list views.
/// Contains summary information without nested collections for better performance.
/// </summary>
public class RolloutSessionSummaryDto
{
    /// <summary>
    /// Unique identifier for the rollout session
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// Name of the rollout session
    /// </summary>
    public string SessionName { get; set; } = string.Empty;

    /// <summary>
    /// Optional detailed description of the rollout
    /// </summary>
    public string? Description { get; set; }

    /// <summary>
    /// Current status of the rollout session
    /// </summary>
    public string Status { get; set; } = string.Empty;

    /// <summary>
    /// Planned date for the rollout
    /// </summary>
    public DateTime PlannedDate { get; set; }

    /// <summary>
    /// Actual start timestamp
    /// </summary>
    public DateTime? StartedAt { get; set; }

    /// <summary>
    /// Actual completion timestamp
    /// </summary>
    public DateTime? CompletedAt { get; set; }

    /// <summary>
    /// Name of the user who created the session
    /// </summary>
    public string CreatedBy { get; set; } = string.Empty;

    /// <summary>
    /// Total number of items in this session
    /// </summary>
    public int TotalItems { get; set; }

    /// <summary>
    /// Number of completed items
    /// </summary>
    public int CompletedItems { get; set; }

    /// <summary>
    /// Number of pending items
    /// </summary>
    public int PendingItems { get; set; }

    /// <summary>
    /// Number of in-progress items
    /// </summary>
    public int InProgressItems { get; set; }

    /// <summary>
    /// Number of failed items
    /// </summary>
    public int FailedItems { get; set; }

    /// <summary>
    /// Number of skipped items
    /// </summary>
    public int SkippedItems { get; set; }

    /// <summary>
    /// Completion percentage (0-100)
    /// </summary>
    public decimal CompletionPercentage { get; set; }

    /// <summary>
    /// Timestamp when the session was created
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// Timestamp when the session was last updated
    /// </summary>
    public DateTime UpdatedAt { get; set; }
}

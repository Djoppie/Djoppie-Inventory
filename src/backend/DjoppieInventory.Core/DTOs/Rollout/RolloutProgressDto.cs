namespace DjoppieInventory.Core.DTOs.Rollout;

/// <summary>
/// Data Transfer Object containing progress statistics for a rollout session
/// </summary>
public class RolloutProgressDto
{
    /// <summary>
    /// Total number of items in the rollout session
    /// </summary>
    public int TotalItems { get; set; }

    /// <summary>
    /// Number of items with status Pending
    /// </summary>
    public int PendingItems { get; set; }

    /// <summary>
    /// Number of items with status InProgress
    /// </summary>
    public int InProgressItems { get; set; }

    /// <summary>
    /// Number of items with status Completed
    /// </summary>
    public int CompletedItems { get; set; }

    /// <summary>
    /// Number of items with status Failed
    /// </summary>
    public int FailedItems { get; set; }

    /// <summary>
    /// Number of items with status Skipped
    /// </summary>
    public int SkippedItems { get; set; }

    /// <summary>
    /// Completion percentage (0-100), calculated as (Completed + Skipped) / Total * 100
    /// </summary>
    public decimal CompletionPercentage { get; set; }

    /// <summary>
    /// Number of asset swaps in the rollout session
    /// </summary>
    public int TotalSwaps { get; set; }

    /// <summary>
    /// Number of completed swaps
    /// </summary>
    public int CompletedSwaps { get; set; }

    /// <summary>
    /// Number of pending swaps
    /// </summary>
    public int PendingSwaps { get; set; }

    /// <summary>
    /// Estimated time remaining based on average completion time (null if cannot be calculated)
    /// </summary>
    public TimeSpan? EstimatedTimeRemaining { get; set; }

    /// <summary>
    /// Average time taken per completed item (null if no items completed yet)
    /// </summary>
    public TimeSpan? AverageCompletionTime { get; set; }
}

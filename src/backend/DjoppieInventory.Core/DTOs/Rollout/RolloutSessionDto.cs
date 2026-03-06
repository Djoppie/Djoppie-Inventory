namespace DjoppieInventory.Core.DTOs.Rollout;

/// <summary>
/// Data Transfer Object for a complete RolloutSession including all items and swaps
/// </summary>
public class RolloutSessionDto
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
    /// Email of the user who created the session
    /// </summary>
    public string CreatedByEmail { get; set; } = string.Empty;

    /// <summary>
    /// Timestamp when the session was created
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// Timestamp when the session was last updated
    /// </summary>
    public DateTime UpdatedAt { get; set; }

    /// <summary>
    /// Collection of rollout items in this session
    /// </summary>
    public List<RolloutItemDto> Items { get; set; } = new();

    /// <summary>
    /// Collection of asset swaps in this session
    /// </summary>
    public List<AssetSwapDto> AssetSwaps { get; set; } = new();

    /// <summary>
    /// Progress statistics for this session
    /// </summary>
    public RolloutProgressDto? Progress { get; set; }
}

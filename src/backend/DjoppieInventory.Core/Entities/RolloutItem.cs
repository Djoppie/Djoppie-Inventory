namespace DjoppieInventory.Core.Entities;

/// <summary>
/// Represents the status of an individual rollout item
/// </summary>
public enum RolloutItemStatus
{
    /// <summary>
    /// Pending - Item is waiting to be processed
    /// </summary>
    Pending = 0,

    /// <summary>
    /// InProgress - Item deployment is currently in progress
    /// </summary>
    InProgress = 1,

    /// <summary>
    /// Completed - Item has been successfully deployed
    /// </summary>
    Completed = 2,

    /// <summary>
    /// Failed - Item deployment failed
    /// </summary>
    Failed = 3,

    /// <summary>
    /// Skipped - Item was intentionally skipped
    /// </summary>
    Skipped = 4
}

/// <summary>
/// Represents an individual asset within a rollout session.
/// Each rollout item tracks the deployment of one asset to a specific user or location,
/// including special handling for multi-monitor setups.
/// </summary>
public class RolloutItem
{
    /// <summary>
    /// Unique identifier for the rollout item
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// Foreign key to the parent rollout session
    /// </summary>
    public int RolloutSessionId { get; set; }

    /// <summary>
    /// Foreign key to the asset being deployed
    /// </summary>
    public int AssetId { get; set; }

    /// <summary>
    /// Display name of the target user who will receive this asset (optional)
    /// </summary>
    public string? TargetUser { get; set; }

    /// <summary>
    /// Email address of the target user (optional)
    /// </summary>
    public string? TargetUserEmail { get; set; }

    /// <summary>
    /// Target location where the asset will be deployed (optional)
    /// </summary>
    public string? TargetLocation { get; set; }

    /// <summary>
    /// Foreign key to the target service/department (optional)
    /// </summary>
    public int? TargetServiceId { get; set; }

    /// <summary>
    /// Monitor position for multi-monitor setups (e.g., "Left", "Right", "Center", "Primary", "Secondary")
    /// Only relevant for display/monitor assets (optional)
    /// </summary>
    public string? MonitorPosition { get; set; }

    /// <summary>
    /// Logical display number in Windows display settings (e.g., 1, 2, 3)
    /// Only relevant for display/monitor assets (optional)
    /// </summary>
    public int? MonitorDisplayNumber { get; set; }

    /// <summary>
    /// Current status of this rollout item
    /// </summary>
    public RolloutItemStatus Status { get; set; } = RolloutItemStatus.Pending;

    /// <summary>
    /// Timestamp when this item was marked as completed (null if not completed)
    /// </summary>
    public DateTime? CompletedAt { get; set; }

    /// <summary>
    /// Display name of the user who completed this item deployment (optional)
    /// </summary>
    public string? CompletedBy { get; set; }

    /// <summary>
    /// Email address of the user who completed this item deployment (optional)
    /// </summary>
    public string? CompletedByEmail { get; set; }

    /// <summary>
    /// Optional notes about the deployment (issues encountered, special instructions, etc.)
    /// </summary>
    public string? Notes { get; set; }

    /// <summary>
    /// Timestamp when the rollout item was created
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Timestamp when the rollout item was last updated
    /// </summary>
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // ===== Navigation Properties =====

    /// <summary>
    /// The parent rollout session this item belongs to
    /// </summary>
    public RolloutSession RolloutSession { get; set; } = null!;

    /// <summary>
    /// The asset being deployed in this rollout item
    /// </summary>
    public Asset Asset { get; set; } = null!;

    /// <summary>
    /// The target service/department for this deployment (optional)
    /// </summary>
    public Service? TargetService { get; set; }
}

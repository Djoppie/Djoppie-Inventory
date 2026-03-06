namespace DjoppieInventory.Core.Entities;

/// <summary>
/// Represents an asset swap operation during a rollout.
/// Tracks the replacement of an old asset with a new one, including status updates
/// for both assets and audit information about when and by whom the swap was performed.
/// </summary>
public class AssetSwap
{
    /// <summary>
    /// Unique identifier for the asset swap
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// Foreign key to the parent rollout session
    /// </summary>
    public int RolloutSessionId { get; set; }

    /// <summary>
    /// Foreign key to the old asset being replaced (null if this is a new deployment without a swap)
    /// </summary>
    public int? OldAssetId { get; set; }

    /// <summary>
    /// Foreign key to the new asset being deployed
    /// </summary>
    public int NewAssetId { get; set; }

    /// <summary>
    /// Display name of the user for whom the swap is being performed (optional)
    /// </summary>
    public string? TargetUser { get; set; }

    /// <summary>
    /// Location where the swap is taking place (optional)
    /// </summary>
    public string? TargetLocation { get; set; }

    /// <summary>
    /// Timestamp when the swap was performed (null if not yet executed)
    /// </summary>
    public DateTime? SwapDate { get; set; }

    /// <summary>
    /// Display name of the user who performed the swap (optional)
    /// </summary>
    public string? SwappedBy { get; set; }

    /// <summary>
    /// Email address of the user who performed the swap (optional)
    /// </summary>
    public string? SwappedByEmail { get; set; }

    /// <summary>
    /// The new status to assign to the old asset after the swap (e.g., Stock, Herstelling, Defect)
    /// Null if no status change is needed or if there is no old asset
    /// </summary>
    public AssetStatus? OldAssetNewStatus { get; set; }

    /// <summary>
    /// Optional notes about the swap (reason for replacement, condition of old asset, etc.)
    /// </summary>
    public string? Notes { get; set; }

    /// <summary>
    /// Indicates whether the swap has been completed
    /// </summary>
    public bool IsCompleted { get; set; } = false;

    /// <summary>
    /// Timestamp when the swap record was created
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Timestamp when the swap record was last updated
    /// </summary>
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // ===== Navigation Properties =====

    /// <summary>
    /// The parent rollout session this swap belongs to
    /// </summary>
    public RolloutSession RolloutSession { get; set; } = null!;

    /// <summary>
    /// The old asset being replaced (null if this is a new deployment)
    /// </summary>
    public Asset? OldAsset { get; set; }

    /// <summary>
    /// The new asset being deployed
    /// </summary>
    public Asset NewAsset { get; set; } = null!;
}

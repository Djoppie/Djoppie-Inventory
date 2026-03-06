namespace DjoppieInventory.Core.DTOs.Rollout;

/// <summary>
/// Data Transfer Object for an asset swap with full asset details
/// </summary>
public class AssetSwapDto
{
    /// <summary>
    /// Unique identifier for the asset swap
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// ID of the parent rollout session
    /// </summary>
    public int RolloutSessionId { get; set; }

    /// <summary>
    /// ID of the old asset being replaced
    /// </summary>
    public int? OldAssetId { get; set; }

    /// <summary>
    /// Embedded information about the old asset
    /// </summary>
    public AssetInfo? OldAsset { get; set; }

    /// <summary>
    /// ID of the new asset being deployed
    /// </summary>
    public int NewAssetId { get; set; }

    /// <summary>
    /// Embedded information about the new asset
    /// </summary>
    public AssetInfo? NewAsset { get; set; }

    /// <summary>
    /// Display name of the user for whom the swap is being performed
    /// </summary>
    public string? TargetUser { get; set; }

    /// <summary>
    /// Location where the swap is taking place
    /// </summary>
    public string? TargetLocation { get; set; }

    /// <summary>
    /// Timestamp when the swap was performed
    /// </summary>
    public DateTime? SwapDate { get; set; }

    /// <summary>
    /// Name of the user who performed the swap
    /// </summary>
    public string? SwappedBy { get; set; }

    /// <summary>
    /// Email of the user who performed the swap
    /// </summary>
    public string? SwappedByEmail { get; set; }

    /// <summary>
    /// The new status to assign to the old asset after the swap
    /// </summary>
    public string? OldAssetNewStatus { get; set; }

    /// <summary>
    /// Optional notes about the swap
    /// </summary>
    public string? Notes { get; set; }

    /// <summary>
    /// Indicates whether the swap has been completed
    /// </summary>
    public bool IsCompleted { get; set; }

    /// <summary>
    /// Timestamp when the swap record was created
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// Timestamp when the swap record was last updated
    /// </summary>
    public DateTime UpdatedAt { get; set; }
}

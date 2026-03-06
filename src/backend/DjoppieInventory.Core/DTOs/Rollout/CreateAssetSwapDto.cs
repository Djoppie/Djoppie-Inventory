using System.ComponentModel.DataAnnotations;

namespace DjoppieInventory.Core.DTOs.Rollout;

/// <summary>
/// Data Transfer Object for registering a new asset swap
/// </summary>
public class CreateAssetSwapDto
{
    /// <summary>
    /// ID of the old asset being replaced (null for new deployments without swap)
    /// </summary>
    public int? OldAssetId { get; set; }

    /// <summary>
    /// ID of the new asset being deployed (required)
    /// </summary>
    [Required]
    public int NewAssetId { get; set; }

    /// <summary>
    /// Display name of the user for whom the swap is being performed
    /// </summary>
    [StringLength(200)]
    public string? TargetUser { get; set; }

    /// <summary>
    /// Location where the swap is taking place
    /// </summary>
    [StringLength(200)]
    public string? TargetLocation { get; set; }

    /// <summary>
    /// The new status to assign to the old asset after the swap (e.g., Stock, Herstelling, Defect)
    /// Only applicable if OldAssetId is provided
    /// </summary>
    public string? OldAssetNewStatus { get; set; }

    /// <summary>
    /// Optional notes about the swap (reason for replacement, condition, etc.)
    /// </summary>
    [StringLength(1000)]
    public string? Notes { get; set; }
}

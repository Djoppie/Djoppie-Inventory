using System.ComponentModel.DataAnnotations;

namespace DjoppieInventory.Core.DTOs.Rollout;

/// <summary>
/// Data Transfer Object for adding a new item to a rollout session
/// </summary>
public class CreateRolloutItemDto
{
    /// <summary>
    /// ID of the asset to be deployed (required)
    /// </summary>
    [Required]
    public int AssetId { get; set; }

    /// <summary>
    /// Display name of the target user
    /// </summary>
    [StringLength(200)]
    public string? TargetUser { get; set; }

    /// <summary>
    /// Email address of the target user
    /// </summary>
    [StringLength(200)]
    [EmailAddress]
    public string? TargetUserEmail { get; set; }

    /// <summary>
    /// Target location where the asset will be deployed
    /// </summary>
    [StringLength(200)]
    public string? TargetLocation { get; set; }

    /// <summary>
    /// ID of the target service/department
    /// </summary>
    public int? TargetServiceId { get; set; }

    /// <summary>
    /// Monitor position for display assets (e.g., "Left", "Right", "Center", "Primary", "Secondary")
    /// </summary>
    [StringLength(50)]
    public string? MonitorPosition { get; set; }

    /// <summary>
    /// Windows display number for multi-monitor setups (e.g., 1, 2, 3)
    /// </summary>
    [Range(1, 10)]
    public int? MonitorDisplayNumber { get; set; }

    /// <summary>
    /// Optional notes about the deployment
    /// </summary>
    [StringLength(1000)]
    public string? Notes { get; set; }
}

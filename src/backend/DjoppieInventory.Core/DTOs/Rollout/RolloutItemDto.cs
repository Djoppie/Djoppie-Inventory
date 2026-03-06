namespace DjoppieInventory.Core.DTOs.Rollout;

/// <summary>
/// Data Transfer Object for a complete RolloutItem with asset details
/// </summary>
public class RolloutItemDto
{
    /// <summary>
    /// Unique identifier for the rollout item
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// ID of the parent rollout session
    /// </summary>
    public int RolloutSessionId { get; set; }

    /// <summary>
    /// ID of the asset being deployed
    /// </summary>
    public int AssetId { get; set; }

    /// <summary>
    /// Embedded asset information for display
    /// </summary>
    public AssetInfo? Asset { get; set; }

    /// <summary>
    /// Display name of the target user
    /// </summary>
    public string? TargetUser { get; set; }

    /// <summary>
    /// Email address of the target user
    /// </summary>
    public string? TargetUserEmail { get; set; }

    /// <summary>
    /// Target location for deployment
    /// </summary>
    public string? TargetLocation { get; set; }

    /// <summary>
    /// ID of the target service/department
    /// </summary>
    public int? TargetServiceId { get; set; }

    /// <summary>
    /// Embedded service information
    /// </summary>
    public ServiceInfo? TargetService { get; set; }

    /// <summary>
    /// Monitor position (Left, Right, Center, Primary, Secondary) for display assets
    /// </summary>
    public string? MonitorPosition { get; set; }

    /// <summary>
    /// Windows display number for multi-monitor setups
    /// </summary>
    public int? MonitorDisplayNumber { get; set; }

    /// <summary>
    /// Current status of this rollout item
    /// </summary>
    public string Status { get; set; } = string.Empty;

    /// <summary>
    /// Timestamp when this item was completed
    /// </summary>
    public DateTime? CompletedAt { get; set; }

    /// <summary>
    /// Name of the user who completed this item
    /// </summary>
    public string? CompletedBy { get; set; }

    /// <summary>
    /// Email of the user who completed this item
    /// </summary>
    public string? CompletedByEmail { get; set; }

    /// <summary>
    /// Optional notes about the deployment
    /// </summary>
    public string? Notes { get; set; }

    /// <summary>
    /// Timestamp when the item was created
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// Timestamp when the item was last updated
    /// </summary>
    public DateTime UpdatedAt { get; set; }
}

/// <summary>
/// Lightweight asset information for embedding in rollout items
/// </summary>
public class AssetInfo
{
    public int Id { get; set; }
    public string AssetCode { get; set; } = string.Empty;
    public string AssetName { get; set; } = string.Empty;
    public string? Alias { get; set; }
    public string Category { get; set; } = string.Empty;
    public string? Brand { get; set; }
    public string? Model { get; set; }
    public string? SerialNumber { get; set; }
    public string Status { get; set; } = string.Empty;
}

/// <summary>
/// Lightweight service information for embedding in rollout items
/// </summary>
public class ServiceInfo
{
    public int Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
}

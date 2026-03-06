using System.ComponentModel.DataAnnotations;

namespace DjoppieInventory.Core.DTOs.Rollout;

/// <summary>
/// Data Transfer Object for updating monitor position information on a rollout item.
/// Used specifically for managing multi-monitor setups during rollout deployments.
/// </summary>
public class MonitorPositionDto
{
    /// <summary>
    /// Monitor position descriptor (e.g., "Left", "Right", "Center", "Primary", "Secondary")
    /// </summary>
    [StringLength(50)]
    public string? MonitorPosition { get; set; }

    /// <summary>
    /// Windows display number (e.g., 1, 2, 3) as shown in Windows display settings
    /// </summary>
    [Range(1, 10)]
    public int? MonitorDisplayNumber { get; set; }

    /// <summary>
    /// Optional notes about the monitor configuration
    /// </summary>
    [StringLength(500)]
    public string? Notes { get; set; }
}

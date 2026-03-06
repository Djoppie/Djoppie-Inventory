using System.ComponentModel.DataAnnotations;

namespace DjoppieInventory.Core.DTOs.Rollout;

/// <summary>
/// Data Transfer Object for updating an existing rollout session
/// </summary>
public class UpdateRolloutSessionDto
{
    /// <summary>
    /// Updated name of the rollout session
    /// </summary>
    [Required]
    [StringLength(200, MinimumLength = 3)]
    public string SessionName { get; set; } = string.Empty;

    /// <summary>
    /// Updated description
    /// </summary>
    [StringLength(2000)]
    public string? Description { get; set; }

    /// <summary>
    /// Updated planned date
    /// </summary>
    [Required]
    public DateTime PlannedDate { get; set; }

    /// <summary>
    /// Updated status (Planning, Ready, InProgress, Completed, Cancelled)
    /// </summary>
    [Required]
    public string Status { get; set; } = string.Empty;
}

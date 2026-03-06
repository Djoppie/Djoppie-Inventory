using System.ComponentModel.DataAnnotations;

namespace DjoppieInventory.Core.DTOs.Rollout;

/// <summary>
/// Data Transfer Object for creating a new rollout session
/// </summary>
public class CreateRolloutSessionDto
{
    /// <summary>
    /// Name of the rollout session (required)
    /// </summary>
    [Required]
    [StringLength(200, MinimumLength = 3)]
    public string SessionName { get; set; } = string.Empty;

    /// <summary>
    /// Optional detailed description of the rollout purpose and scope
    /// </summary>
    [StringLength(2000)]
    public string? Description { get; set; }

    /// <summary>
    /// Planned date for the rollout to begin (required)
    /// </summary>
    [Required]
    public DateTime PlannedDate { get; set; }

    /// <summary>
    /// Initial status (defaults to Planning if not specified)
    /// Valid values: Planning, Ready
    /// </summary>
    public string? Status { get; set; }
}

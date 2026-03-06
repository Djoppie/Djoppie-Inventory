using System.ComponentModel.DataAnnotations;

namespace DjoppieInventory.Core.DTOs.Rollout;

/// <summary>
/// Data Transfer Object for updating the status of a rollout session
/// </summary>
public class UpdateStatusDto
{
    /// <summary>
    /// The new status to apply to the session
    /// Valid values: Planning, Ready, InProgress, Completed, Cancelled
    /// </summary>
    [Required]
    public string Status { get; set; } = string.Empty;
}

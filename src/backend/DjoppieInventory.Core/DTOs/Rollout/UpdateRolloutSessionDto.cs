using System.ComponentModel.DataAnnotations;

namespace DjoppieInventory.Core.DTOs.Rollout;

/// <summary>
/// DTO for updating an existing rollout session
/// </summary>
public class UpdateRolloutSessionDto
{
    [Required(ErrorMessage = "Session name is required")]
    [StringLength(200, ErrorMessage = "Session name cannot exceed 200 characters")]
    public string SessionName { get; set; } = string.Empty;

    [StringLength(2000, ErrorMessage = "Description cannot exceed 2000 characters")]
    public string? Description { get; set; }

    [Required(ErrorMessage = "Status is required")]
    public string Status { get; set; } = string.Empty;

    [Required(ErrorMessage = "Planned start date is required")]
    public DateTime PlannedStartDate { get; set; }

    public DateTime? PlannedEndDate { get; set; }
}

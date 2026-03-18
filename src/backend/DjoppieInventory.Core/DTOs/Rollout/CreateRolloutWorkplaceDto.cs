using System.ComponentModel.DataAnnotations;

namespace DjoppieInventory.Core.DTOs.Rollout;

/// <summary>
/// DTO for creating a new rollout workplace
/// </summary>
public class CreateRolloutWorkplaceDto
{
    [Required(ErrorMessage = "Rollout day ID is required")]
    public int RolloutDayId { get; set; }

    [Required(ErrorMessage = "User name is required")]
    [StringLength(200, ErrorMessage = "User name cannot exceed 200 characters")]
    public string UserName { get; set; } = string.Empty;

    [EmailAddress(ErrorMessage = "Invalid email address")]
    [StringLength(200, ErrorMessage = "Email cannot exceed 200 characters")]
    public string? UserEmail { get; set; }

    [StringLength(200, ErrorMessage = "Location cannot exceed 200 characters")]
    public string? Location { get; set; }

    /// <summary>
    /// Custom scheduled date for this workplace. When null, uses the date from RolloutDay.
    /// </summary>
    public DateTime? ScheduledDate { get; set; }

    public int? ServiceId { get; set; }

    /// <summary>
    /// Foreign key to the physical workplace being set up (optional)
    /// </summary>
    public int? PhysicalWorkplaceId { get; set; }

    public bool IsLaptopSetup { get; set; } = true;

    /// <summary>
    /// List of assets to be installed at this workplace
    /// </summary>
    [Required(ErrorMessage = "At least one asset plan is required")]
    [MinLength(1, ErrorMessage = "At least one asset plan is required")]
    public List<AssetPlanDto> AssetPlans { get; set; } = new();

    [StringLength(2000, ErrorMessage = "Notes cannot exceed 2000 characters")]
    public string? Notes { get; set; }
}

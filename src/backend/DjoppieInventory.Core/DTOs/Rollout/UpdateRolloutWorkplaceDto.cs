using System.ComponentModel.DataAnnotations;

namespace DjoppieInventory.Core.DTOs.Rollout;

/// <summary>
/// DTO for updating an existing rollout workplace
/// </summary>
public class UpdateRolloutWorkplaceDto
{
    [Required(ErrorMessage = "User name is required")]
    [StringLength(200, ErrorMessage = "User name cannot exceed 200 characters")]
    public string UserName { get; set; } = string.Empty;

    [EmailAddress(ErrorMessage = "Invalid email address")]
    [StringLength(200, ErrorMessage = "Email cannot exceed 200 characters")]
    public string? UserEmail { get; set; }

    /// <summary>
    /// Entra ID (Azure AD Object ID) of the user
    /// </summary>
    [StringLength(100, ErrorMessage = "User Entra ID cannot exceed 100 characters")]
    public string? UserEntraId { get; set; }

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

    public bool IsLaptopSetup { get; set; }

    /// <summary>
    /// List of assets to be installed at this workplace (can be empty during planning)
    /// </summary>
    public List<AssetPlanDto> AssetPlans { get; set; } = new();

    [Required(ErrorMessage = "Status is required")]
    public string Status { get; set; } = string.Empty;

    [StringLength(2000, ErrorMessage = "Notes cannot exceed 2000 characters")]
    public string? Notes { get; set; }
}

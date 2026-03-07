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

    [StringLength(200, ErrorMessage = "Location cannot exceed 200 characters")]
    public string? Location { get; set; }

    public int? ServiceId { get; set; }

    public bool IsLaptopSetup { get; set; }

    /// <summary>
    /// List of assets to be installed at this workplace
    /// </summary>
    [Required(ErrorMessage = "At least one asset plan is required")]
    [MinLength(1, ErrorMessage = "At least one asset plan is required")]
    public List<AssetPlanDto> AssetPlans { get; set; } = new();

    [Required(ErrorMessage = "Status is required")]
    public string Status { get; set; } = string.Empty;

    [StringLength(2000, ErrorMessage = "Notes cannot exceed 2000 characters")]
    public string? Notes { get; set; }
}

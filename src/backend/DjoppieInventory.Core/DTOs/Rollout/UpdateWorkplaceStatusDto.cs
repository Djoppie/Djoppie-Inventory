using System.ComponentModel.DataAnnotations;

namespace DjoppieInventory.Core.DTOs.Rollout;

/// <summary>
/// DTO for updating a workplace's status
/// </summary>
public class UpdateWorkplaceStatusDto
{
    [Required(ErrorMessage = "Status is required")]
    public string Status { get; set; } = string.Empty;
}

using System.ComponentModel.DataAnnotations;

namespace DjoppieInventory.Core.DTOs.Rollout;

/// <summary>
/// DTO for updating the status of a rollout day
/// </summary>
public class UpdateDayStatusDto
{
    [Required(ErrorMessage = "Status is required")]
    public string Status { get; set; } = string.Empty;
}

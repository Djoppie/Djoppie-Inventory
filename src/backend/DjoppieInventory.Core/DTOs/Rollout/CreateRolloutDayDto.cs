using System.ComponentModel.DataAnnotations;

namespace DjoppieInventory.Core.DTOs.Rollout;

/// <summary>
/// DTO for creating a new rollout day
/// </summary>
public class CreateRolloutDayDto
{
    [Required(ErrorMessage = "Rollout session ID is required")]
    public int RolloutSessionId { get; set; }

    [Required(ErrorMessage = "Date is required")]
    public DateTime Date { get; set; }

    [StringLength(200, ErrorMessage = "Name cannot exceed 200 characters")]
    public string? Name { get; set; }

    [Required(ErrorMessage = "Day number is required")]
    [Range(1, 365, ErrorMessage = "Day number must be between 1 and 365")]
    public int DayNumber { get; set; }

    /// <summary>
    /// List of Service IDs scheduled for this day
    /// </summary>
    public List<int> ScheduledServiceIds { get; set; } = new();

    [StringLength(2000, ErrorMessage = "Notes cannot exceed 2000 characters")]
    public string? Notes { get; set; }
}

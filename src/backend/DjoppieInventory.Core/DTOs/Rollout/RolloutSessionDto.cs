namespace DjoppieInventory.Core.DTOs.Rollout;

/// <summary>
/// DTO for rollout session information (response)
/// </summary>
public class RolloutSessionDto
{
    public int Id { get; set; }
    public string SessionName { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime PlannedStartDate { get; set; }
    public DateTime? PlannedEndDate { get; set; }
    public DateTime? StartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public string CreatedBy { get; set; } = string.Empty;
    public string CreatedByEmail { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    // Progress tracking
    public int TotalDays { get; set; }
    public int TotalWorkplaces { get; set; }
    public int CompletedWorkplaces { get; set; }
    public decimal CompletionPercentage { get; set; }

    // Optional: Include days in response
    public List<RolloutDayDto>? Days { get; set; }
}

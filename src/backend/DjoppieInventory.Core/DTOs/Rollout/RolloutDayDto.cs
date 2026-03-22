namespace DjoppieInventory.Core.DTOs.Rollout;

/// <summary>
/// DTO for rollout day information (response)
/// </summary>
public class RolloutDayDto
{
    public int Id { get; set; }
    public int RolloutSessionId { get; set; }
    public DateTime Date { get; set; }
    public string? Name { get; set; }
    public int DayNumber { get; set; }
    public List<int> ScheduledServiceIds { get; set; } = new();
    public string Status { get; set; } = "Planning";
    public int TotalWorkplaces { get; set; }
    public int CompletedWorkplaces { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    // Optional: Include workplaces in response
    public List<RolloutWorkplaceDto>? Workplaces { get; set; }
}

/// <summary>
/// DTO for rollout day with session information (for today's planning widget)
/// </summary>
public class RolloutDayWithSessionDto : RolloutDayDto
{
    public string SessionName { get; set; } = string.Empty;
    public string SessionStatus { get; set; } = string.Empty;
}

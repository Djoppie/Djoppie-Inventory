namespace DjoppieInventory.Core.DTOs.Rollout;

/// <summary>
/// DTO for rollout progress and statistics
/// </summary>
public class RolloutProgressDto
{
    public int SessionId { get; set; }
    public string SessionName { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;

    // Overall statistics
    public int TotalDays { get; set; }
    public int TotalWorkplaces { get; set; }
    public int CompletedWorkplaces { get; set; }
    public int PendingWorkplaces { get; set; }
    public int InProgressWorkplaces { get; set; }
    public int SkippedWorkplaces { get; set; }
    public int FailedWorkplaces { get; set; }
    public decimal CompletionPercentage { get; set; }

    // Day-by-day breakdown
    public List<DayProgressDto> DayProgress { get; set; } = new();
}

/// <summary>
/// Progress for a specific day
/// </summary>
public class DayProgressDto
{
    public int DayId { get; set; }
    public DateTime Date { get; set; }
    public string? Name { get; set; }
    public int TotalWorkplaces { get; set; }
    public int CompletedWorkplaces { get; set; }
    public decimal CompletionPercentage { get; set; }
}

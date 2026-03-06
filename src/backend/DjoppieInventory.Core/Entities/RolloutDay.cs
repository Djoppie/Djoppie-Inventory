namespace DjoppieInventory.Core.Entities;

/// <summary>
/// Represents a specific day within a rollout session with scheduled departments and workplaces.
/// Each day can have multiple services (departments) scheduled and multiple workplaces to configure.
/// </summary>
public class RolloutDay
{
    /// <summary>
    /// Unique identifier for the rollout day
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// Foreign key to the parent rollout session
    /// </summary>
    public int RolloutSessionId { get; set; }

    /// <summary>
    /// The specific date for this rollout day
    /// </summary>
    public DateTime Date { get; set; }

    /// <summary>
    /// Optional display name for this day (e.g., "IT Dienst + Financien", "Week 1 - Dag 3")
    /// </summary>
    public string? Name { get; set; }

    /// <summary>
    /// Sequential day number within the session (1, 2, 3, etc.)
    /// Useful for display and sorting
    /// </summary>
    public int DayNumber { get; set; }

    /// <summary>
    /// Comma-separated list of Service IDs scheduled for this day
    /// Example: "1,3,7" for IT Dienst, Dienst Organisatiebeheersing, Dienst Aankopen
    /// This allows flexible scheduling without a junction table
    /// </summary>
    public string? ScheduledServiceIds { get; set; }

    /// <summary>
    /// Total number of workplaces planned for this day
    /// </summary>
    public int TotalWorkplaces { get; set; }

    /// <summary>
    /// Number of workplaces that have been completed
    /// </summary>
    public int CompletedWorkplaces { get; set; }

    /// <summary>
    /// Optional notes for this day (e.g., "Start at 8:00 AM", "IT team on-site")
    /// </summary>
    public string? Notes { get; set; }

    /// <summary>
    /// Timestamp when this day entry was created
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Timestamp when this day entry was last updated
    /// </summary>
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // ===== Navigation Properties =====

    /// <summary>
    /// The parent rollout session this day belongs to
    /// </summary>
    public RolloutSession RolloutSession { get; set; } = null!;

    /// <summary>
    /// Collection of workplaces scheduled for this day
    /// </summary>
    public ICollection<RolloutWorkplace> Workplaces { get; set; } = new List<RolloutWorkplace>();
}

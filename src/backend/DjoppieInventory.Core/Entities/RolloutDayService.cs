namespace DjoppieInventory.Core.Entities;

/// <summary>
/// Junction table linking rollout days to services (departments).
/// Replaces the comma-separated ScheduledServiceIds string with a proper relational model.
/// Enables proper querying, sorting, and relationship management.
/// </summary>
public class RolloutDayService
{
    /// <summary>
    /// Unique identifier for the junction record
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// Foreign key to the rollout day
    /// </summary>
    public int RolloutDayId { get; set; }

    /// <summary>
    /// Foreign key to the service/department
    /// </summary>
    public int ServiceId { get; set; }

    /// <summary>
    /// Display order for sorting services within a day (lower numbers appear first).
    /// Allows customizing the execution order of services.
    /// </summary>
    public int SortOrder { get; set; } = 0;

    /// <summary>
    /// Timestamp when the record was created
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // ===== Navigation Properties =====

    /// <summary>
    /// The rollout day this service is scheduled for
    /// </summary>
    public RolloutDay RolloutDay { get; set; } = null!;

    /// <summary>
    /// The service/department scheduled on this day
    /// </summary>
    public Service Service { get; set; } = null!;
}

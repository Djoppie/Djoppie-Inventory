namespace DjoppieInventory.Core.DTOs.Rollout;

/// <summary>
/// DTO for moving a workplace to a different date
/// </summary>
public class MoveWorkplaceDto
{
    /// <summary>
    /// Target date to move the workplace to
    /// </summary>
    public DateTime TargetDate { get; set; }
}

/// <summary>
/// Result DTO for move workplace operation
/// </summary>
public class MoveWorkplaceResultDto
{
    /// <summary>
    /// The new workplace on the target day
    /// </summary>
    public RolloutWorkplaceDto Workplace { get; set; } = null!;

    /// <summary>
    /// The original workplace that remains as a ghost entry on the source day
    /// </summary>
    public RolloutWorkplaceDto GhostWorkplace { get; set; } = null!;

    /// <summary>
    /// ID of the source day (where workplace was moved from)
    /// </summary>
    public int SourceDayId { get; set; }

    /// <summary>
    /// ID of the target day (where workplace was moved to)
    /// </summary>
    public int TargetDayId { get; set; }

    /// <summary>
    /// The target date
    /// </summary>
    public DateTime TargetDate { get; set; }

    /// <summary>
    /// Whether a new day was created for the target date
    /// </summary>
    public bool DayCreated { get; set; }

    /// <summary>
    /// Name of the target day
    /// </summary>
    public string TargetDayName { get; set; } = string.Empty;
}

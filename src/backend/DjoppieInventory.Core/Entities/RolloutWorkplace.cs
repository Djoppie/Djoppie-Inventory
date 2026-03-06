namespace DjoppieInventory.Core.Entities;

/// <summary>
/// Represents the status of a workplace rollout
/// </summary>
public enum RolloutWorkplaceStatus
{
    /// <summary>
    /// Pending - Workplace is waiting to be configured
    /// </summary>
    Pending = 0,

    /// <summary>
    /// InProgress - Workplace configuration is currently in progress
    /// </summary>
    InProgress = 1,

    /// <summary>
    /// Completed - Workplace has been fully configured
    /// </summary>
    Completed = 2,

    /// <summary>
    /// Skipped - Workplace was intentionally skipped (user absent, etc.)
    /// </summary>
    Skipped = 3,

    /// <summary>
    /// Failed - Workplace configuration encountered issues
    /// </summary>
    Failed = 4
}

/// <summary>
/// Represents a complete workplace setup for one user.
/// A workplace includes all equipment that needs to be installed/configured
/// (e.g., laptop, docking station, monitors, keyboard, mouse).
/// </summary>
public class RolloutWorkplace
{
    /// <summary>
    /// Unique identifier for the workplace
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// Foreign key to the rollout day this workplace is scheduled for
    /// </summary>
    public int RolloutDayId { get; set; }

    /// <summary>
    /// Display name of the user for this workplace (e.g., "Jan Janssen")
    /// </summary>
    public string UserName { get; set; } = string.Empty;

    /// <summary>
    /// Email address of the user (optional)
    /// </summary>
    public string? UserEmail { get; set; }

    /// <summary>
    /// Physical location/office of this workplace (e.g., "Bureau 201", "1e verdieping links")
    /// </summary>
    public string? Location { get; set; }

    /// <summary>
    /// Foreign key to the Service (department) this user belongs to
    /// </summary>
    public int? ServiceId { get; set; }

    /// <summary>
    /// Indicates if this is a laptop setup (true) or desktop setup (false)
    /// Affects which peripherals are included (wireless vs wired keyboard, etc.)
    /// </summary>
    public bool IsLaptopSetup { get; set; } = true;

    /// <summary>
    /// JSON string containing the asset plan for this workplace.
    /// Example: [
    ///   {"equipmentType":"laptop","existingAssetId":101,"oldAssetId":50},
    ///   {"equipmentType":"docking","createNew":true,"brand":"Dell","model":"WD19TBS"},
    ///   {"equipmentType":"monitor","existingAssetId":201,"metadata":{"position":"left","hasCamera":true}},
    ///   {"equipmentType":"keyboard","createNew":true},
    ///   {"equipmentType":"mouse","createNew":true}
    /// ]
    /// This flexible JSON structure allows us to plan asset deployment without rigid schema.
    /// </summary>
    public string AssetPlansJson { get; set; } = "[]";

    /// <summary>
    /// Current status of this workplace rollout
    /// </summary>
    public RolloutWorkplaceStatus Status { get; set; } = RolloutWorkplaceStatus.Pending;

    /// <summary>
    /// Total number of asset items planned for this workplace
    /// Calculated from AssetPlansJson array length
    /// </summary>
    public int TotalItems { get; set; }

    /// <summary>
    /// Number of asset items that have been completed/installed
    /// </summary>
    public int CompletedItems { get; set; }

    /// <summary>
    /// Timestamp when this workplace was marked as completed (null if not completed)
    /// </summary>
    public DateTime? CompletedAt { get; set; }

    /// <summary>
    /// Display name of the technician who completed this workplace (optional)
    /// </summary>
    public string? CompletedBy { get; set; }

    /// <summary>
    /// Email address of the technician who completed this workplace (optional)
    /// </summary>
    public string? CompletedByEmail { get; set; }

    /// <summary>
    /// Optional notes about this workplace (issues, special requirements, etc.)
    /// </summary>
    public string? Notes { get; set; }

    /// <summary>
    /// Timestamp when the workplace was created
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Timestamp when the workplace was last updated
    /// </summary>
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // ===== Navigation Properties =====

    /// <summary>
    /// The rollout day this workplace is scheduled for
    /// </summary>
    public RolloutDay RolloutDay { get; set; } = null!;

    /// <summary>
    /// The service (department) this user belongs to (optional)
    /// </summary>
    public Service? Service { get; set; }
}

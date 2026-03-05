namespace DjoppieInventory.Core.Entities;

/// <summary>
/// Represents the type of event that occurred for an asset
/// </summary>
public enum AssetEventType
{
    /// <summary>
    /// Asset was created in the system
    /// </summary>
    Created = 0,

    /// <summary>
    /// Asset status was changed (e.g., Stock to InGebruik)
    /// </summary>
    StatusChanged = 1,

    /// <summary>
    /// Asset owner/user was changed
    /// </summary>
    OwnerChanged = 2,

    /// <summary>
    /// Asset location/building was changed
    /// </summary>
    LocationChanged = 3,

    /// <summary>
    /// Lease contract started for this asset
    /// </summary>
    LeaseStarted = 4,

    /// <summary>
    /// Lease contract ended for this asset
    /// </summary>
    LeaseEnded = 5,

    /// <summary>
    /// Maintenance or repair performed
    /// </summary>
    Maintenance = 6,

    /// <summary>
    /// General note or comment added
    /// </summary>
    Note = 7,

    /// <summary>
    /// Other type of event
    /// </summary>
    Other = 99
}

/// <summary>
/// Represents a historical event or change that occurred for an asset.
/// Provides an audit trail and notes functionality for asset lifecycle tracking.
/// </summary>
public class AssetEvent
{
    /// <summary>
    /// Unique identifier for the event
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// Foreign key to the asset this event belongs to
    /// </summary>
    public int AssetId { get; set; }

    /// <summary>
    /// Type of event that occurred
    /// </summary>
    public AssetEventType EventType { get; set; }

    /// <summary>
    /// Brief description of what happened.
    /// Examples: "Status changed from Stock to InGebruik", "Owner assigned to John Doe"
    /// </summary>
    public string Description { get; set; } = string.Empty;

    /// <summary>
    /// Optional additional notes or details about the event
    /// </summary>
    public string? Notes { get; set; }

    /// <summary>
    /// Previous value before the change (optional).
    /// Can be a simple string or JSON for complex objects.
    /// Example: "Stock" for status changes, "John Doe" for owner changes
    /// </summary>
    public string? OldValue { get; set; }

    /// <summary>
    /// New value after the change (optional).
    /// Can be a simple string or JSON for complex objects.
    /// Example: "InGebruik" for status changes, "Jane Smith" for owner changes
    /// </summary>
    public string? NewValue { get; set; }

    /// <summary>
    /// Display name of the user who performed the action (from Entra ID)
    /// </summary>
    public string? PerformedBy { get; set; }

    /// <summary>
    /// Email address of the user who performed the action (from Entra ID)
    /// </summary>
    public string? PerformedByEmail { get; set; }

    /// <summary>
    /// When the event actually occurred (may differ from CreatedAt for backdated entries)
    /// </summary>
    public DateTime EventDate { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// When this event record was created in the system
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// The asset this event belongs to
    /// </summary>
    public Asset Asset { get; set; } = null!;
}

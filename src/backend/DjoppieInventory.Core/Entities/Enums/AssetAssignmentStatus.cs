namespace DjoppieInventory.Core.Entities.Enums;

/// <summary>
/// Defines the execution status of an asset assignment within a rollout workplace.
/// Tracks the progress of each individual asset during rollout execution.
/// </summary>
public enum AssetAssignmentStatus
{
    /// <summary>
    /// Assignment is planned but not yet executed.
    /// Asset is ready to be installed during rollout execution.
    /// </summary>
    Pending = 0,

    /// <summary>
    /// Asset has been successfully installed at the workplace.
    /// All required actions (serial capture, QR scan, etc.) are complete.
    /// </summary>
    Installed = 1,

    /// <summary>
    /// Assignment was intentionally skipped.
    /// Example: User requested to keep existing equipment, item not available.
    /// </summary>
    Skipped = 2,

    /// <summary>
    /// Assignment failed during execution.
    /// Example: Hardware defect discovered, serial mismatch, installation error.
    /// </summary>
    Failed = 3
}

using DjoppieInventory.Core.Entities.Enums;

namespace DjoppieInventory.Core.Entities;

/// <summary>
/// Records asset movements during rollout execution for audit trail and reporting.
/// Each record represents a single asset lifecycle event (deployment, decommission, transfer).
/// Immutable once created - provides complete history of what happened during rollouts.
/// </summary>
public class RolloutAssetMovement
{
    /// <summary>
    /// Unique identifier for the movement record
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// Foreign key to the rollout session where this movement occurred
    /// </summary>
    public int RolloutSessionId { get; set; }

    /// <summary>
    /// Foreign key to the workplace where this movement occurred (optional).
    /// May be null for session-level movements not tied to a specific workplace.
    /// </summary>
    public int? RolloutWorkplaceId { get; set; }

    /// <summary>
    /// Foreign key to the workplace asset assignment that triggered this movement (optional).
    /// Links the movement to the specific assignment record.
    /// </summary>
    public int? WorkplaceAssetAssignmentId { get; set; }

    /// <summary>
    /// Foreign key to the asset that was moved.
    /// Required - every movement must reference a specific asset.
    /// </summary>
    public int AssetId { get; set; }

    /// <summary>
    /// Type of movement performed (Deployed, Decommissioned, Transferred)
    /// </summary>
    public MovementType MovementType { get; set; }

    /// <summary>
    /// The asset status before this movement (nullable for new deployments)
    /// </summary>
    public AssetStatus? PreviousStatus { get; set; }

    /// <summary>
    /// The asset status after this movement
    /// </summary>
    public AssetStatus NewStatus { get; set; }

    /// <summary>
    /// Previous owner/user of the asset (nullable)
    /// </summary>
    public string? PreviousOwner { get; set; }

    /// <summary>
    /// New owner/user of the asset (nullable for decommissions)
    /// </summary>
    public string? NewOwner { get; set; }

    /// <summary>
    /// Previous service/department ID (nullable)
    /// </summary>
    public int? PreviousServiceId { get; set; }

    /// <summary>
    /// New service/department ID (nullable)
    /// </summary>
    public int? NewServiceId { get; set; }

    /// <summary>
    /// Previous physical location (nullable)
    /// </summary>
    public string? PreviousLocation { get; set; }

    /// <summary>
    /// New physical location (nullable)
    /// </summary>
    public string? NewLocation { get; set; }

    /// <summary>
    /// Serial number of the asset at time of movement (cached for historical accuracy)
    /// </summary>
    public string? SerialNumber { get; set; }

    /// <summary>
    /// Display name of the technician who performed this movement
    /// </summary>
    public string PerformedBy { get; set; } = string.Empty;

    /// <summary>
    /// Email address of the technician who performed this movement
    /// </summary>
    public string PerformedByEmail { get; set; } = string.Empty;

    /// <summary>
    /// Timestamp when the movement was performed
    /// </summary>
    public DateTime PerformedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Optional notes about this movement
    /// </summary>
    public string? Notes { get; set; }

    /// <summary>
    /// Timestamp when the record was created
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // ===== Navigation Properties =====

    /// <summary>
    /// The rollout session where this movement occurred
    /// </summary>
    public RolloutSession RolloutSession { get; set; } = null!;

    /// <summary>
    /// The workplace where this movement occurred (optional)
    /// </summary>
    public RolloutWorkplace? RolloutWorkplace { get; set; }

    /// <summary>
    /// The workplace asset assignment that triggered this movement (optional)
    /// </summary>
    public WorkplaceAssetAssignment? WorkplaceAssetAssignment { get; set; }

    /// <summary>
    /// The asset that was moved
    /// </summary>
    public Asset Asset { get; set; } = null!;

    /// <summary>
    /// The previous service/department (optional)
    /// </summary>
    public Service? PreviousService { get; set; }

    /// <summary>
    /// The new service/department (optional)
    /// </summary>
    public Service? NewService { get; set; }
}

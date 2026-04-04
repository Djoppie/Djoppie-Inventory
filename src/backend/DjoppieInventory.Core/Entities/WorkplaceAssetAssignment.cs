using DjoppieInventory.Core.Entities.Enums;

namespace DjoppieInventory.Core.Entities;

/// <summary>
/// Represents an individual asset assignment within a rollout workplace.
/// Replaces the JSON-based AssetPlansJson with a proper relational model.
/// Each record represents one equipment slot (e.g., laptop, monitor, docking station).
/// </summary>
public class WorkplaceAssetAssignment
{
    /// <summary>
    /// Unique identifier for the assignment
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// Foreign key to the rollout workplace this assignment belongs to
    /// </summary>
    public int RolloutWorkplaceId { get; set; }

    /// <summary>
    /// Foreign key to the asset type (e.g., Laptop, Monitor, Docking Station).
    /// Required - defines what type of equipment this slot is for.
    /// </summary>
    public int AssetTypeId { get; set; }

    /// <summary>
    /// Category of the assignment (UserAssigned or WorkplaceFixed).
    /// Determines if the asset follows the user or stays at the location.
    /// </summary>
    public AssignmentCategory AssignmentCategory { get; set; } = AssignmentCategory.UserAssigned;

    /// <summary>
    /// Source type indicating how the asset will be provisioned.
    /// ExistingInventory, NewFromTemplate, or CreateOnSite.
    /// </summary>
    public AssetSourceType SourceType { get; set; } = AssetSourceType.ExistingInventory;

    /// <summary>
    /// Foreign key to the new asset being deployed (optional).
    /// Set when SourceType is ExistingInventory and asset is pre-selected,
    /// or after asset creation for NewFromTemplate/CreateOnSite.
    /// </summary>
    public int? NewAssetId { get; set; }

    /// <summary>
    /// Foreign key to the old asset being replaced/decommissioned (optional).
    /// Used to track the outgoing device when swapping equipment.
    /// </summary>
    public int? OldAssetId { get; set; }

    /// <summary>
    /// Foreign key to the asset template (optional).
    /// Used when SourceType is NewFromTemplate.
    /// </summary>
    public int? AssetTemplateId { get; set; }

    /// <summary>
    /// Position or slot number for ordering (e.g., 1 for primary monitor, 2 for secondary).
    /// Used for UI display order and multi-item grouping.
    /// </summary>
    public int Position { get; set; } = 1;

    /// <summary>
    /// Indicates if serial number capture is required during execution.
    /// Typically true for laptops, docking stations; false for mice, keyboards.
    /// </summary>
    public bool SerialNumberRequired { get; set; } = true;

    /// <summary>
    /// Indicates if QR code scanning is required during execution.
    /// True for assets that have QR labels.
    /// </summary>
    public bool QRCodeRequired { get; set; } = false;

    /// <summary>
    /// Indicates whether a QR code sticker has been applied to the asset during rollout.
    /// Null = not yet checked, True = applied, False = not applied/skipped
    /// </summary>
    public bool? QrCodeApplied { get; set; }

    /// <summary>
    /// The serial number captured during rollout execution (optional).
    /// Populated when the technician scans or enters the serial.
    /// </summary>
    public string? SerialNumberCaptured { get; set; }

    /// <summary>
    /// Current execution status of this assignment.
    /// Pending, Installed, Skipped, or Failed.
    /// </summary>
    public AssetAssignmentStatus Status { get; set; } = AssetAssignmentStatus.Pending;

    /// <summary>
    /// Timestamp when this assignment was installed/completed (null if not completed)
    /// </summary>
    public DateTime? InstalledAt { get; set; }

    /// <summary>
    /// Display name of the technician who installed this assignment (optional)
    /// </summary>
    public string? InstalledBy { get; set; }

    /// <summary>
    /// Email address of the technician who installed this assignment (optional)
    /// </summary>
    public string? InstalledByEmail { get; set; }

    /// <summary>
    /// Optional notes about this specific assignment (issues, special handling, etc.)
    /// </summary>
    public string? Notes { get; set; }

    /// <summary>
    /// JSON string for additional metadata (optional).
    /// Example: {"position":"left","hasCamera":true,"monitorResolution":"2560x1440"}
    /// </summary>
    public string? MetadataJson { get; set; }

    /// <summary>
    /// Timestamp when the assignment was created
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Timestamp when the assignment was last updated
    /// </summary>
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // ===== Navigation Properties =====

    /// <summary>
    /// The rollout workplace this assignment belongs to
    /// </summary>
    public RolloutWorkplace RolloutWorkplace { get; set; } = null!;

    /// <summary>
    /// The asset type for this assignment slot
    /// </summary>
    public AssetType AssetType { get; set; } = null!;

    /// <summary>
    /// The new asset being deployed (optional)
    /// </summary>
    public Asset? NewAsset { get; set; }

    /// <summary>
    /// The old asset being replaced/decommissioned (optional)
    /// </summary>
    public Asset? OldAsset { get; set; }

    /// <summary>
    /// The asset template used for creation (optional)
    /// </summary>
    public AssetTemplate? AssetTemplate { get; set; }
}

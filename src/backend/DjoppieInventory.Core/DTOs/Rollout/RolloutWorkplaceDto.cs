using DjoppieInventory.Core.DTOs;

namespace DjoppieInventory.Core.DTOs.Rollout;

/// <summary>
/// DTO for rollout workplace information (response)
/// </summary>
public class RolloutWorkplaceDto
{
    public int Id { get; set; }
    public int RolloutDayId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string? UserEmail { get; set; }
    /// <summary>
    /// Microsoft Entra ID (GUID) of the user
    /// </summary>
    public string? UserEntraId { get; set; }
    public string? Location { get; set; }
    /// <summary>
    /// Custom scheduled date for this workplace. When null, uses the date from RolloutDay.
    /// </summary>
    public DateTime? ScheduledDate { get; set; }
    public int? ServiceId { get; set; }
    public string? ServiceName { get; set; }
    /// <summary>
    /// Building/location ID for this workplace
    /// </summary>
    public int? BuildingId { get; set; }
    /// <summary>
    /// Building name for this workplace
    /// </summary>
    public string? BuildingName { get; set; }
    public bool IsLaptopSetup { get; set; }
    /// <summary>
    /// Legacy JSON-based asset plans (for backwards compatibility)
    /// </summary>
    public List<AssetPlanDto> AssetPlans { get; set; } = new();
    /// <summary>
    /// New relational asset assignments (replaces AssetPlans)
    /// </summary>
    public List<WorkplaceAssetAssignmentDto>? AssetAssignments { get; set; }
    public string Status { get; set; } = string.Empty;
    public int TotalItems { get; set; }
    public int CompletedItems { get; set; }
    public DateTime? CompletedAt { get; set; }
    public string? CompletedBy { get; set; }
    public string? CompletedByEmail { get; set; }
    public string? Notes { get; set; }
    /// <summary>
    /// If this workplace was moved to another day, this points to the new workplace ID.
    /// When set, this workplace should be displayed as a "ghost" entry.
    /// </summary>
    public int? MovedToWorkplaceId { get; set; }
    /// <summary>
    /// If this workplace was moved from another day, this points to the original workplace ID.
    /// When set, this workplace should show an indicator that it was moved.
    /// </summary>
    public int? MovedFromWorkplaceId { get; set; }
    /// <summary>
    /// The date this workplace was moved to (for display in ghost entry)
    /// </summary>
    public DateTime? MovedToDate { get; set; }
    /// <summary>
    /// The date this workplace was moved from (for display in moved indicator)
    /// </summary>
    public DateTime? MovedFromDate { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

/// <summary>
/// Represents a single asset in the workplace plan
/// </summary>
public class AssetPlanDto
{
    /// <summary>
    /// Equipment type (laptop, docking, monitor, keyboard, mouse)
    /// </summary>
    public string EquipmentType { get; set; } = string.Empty;

    /// <summary>
    /// ID of existing asset to install (for new Dell laptops, existing monitors, etc.)
    /// </summary>
    public int? ExistingAssetId { get; set; }

    /// <summary>
    /// Asset code of existing asset (for display purposes)
    /// </summary>
    public string? ExistingAssetCode { get; set; }

    /// <summary>
    /// Asset name of existing asset (for display purposes)
    /// </summary>
    public string? ExistingAssetName { get; set; }

    /// <summary>
    /// ID of old asset to be replaced/decommissioned (for laptop/desktop swaps)
    /// </summary>
    public int? OldAssetId { get; set; }

    /// <summary>
    /// Asset code of old asset (for display purposes)
    /// </summary>
    public string? OldAssetCode { get; set; }

    /// <summary>
    /// Asset name of old asset (for display purposes)
    /// </summary>
    public string? OldAssetName { get; set; }

    /// <summary>
    /// If true, create a new asset during rollout execution
    /// </summary>
    public bool CreateNew { get; set; }

    /// <summary>
    /// Brand for new asset (if CreateNew = true)
    /// </summary>
    public string? Brand { get; set; }

    /// <summary>
    /// Model for new asset (if CreateNew = true)
    /// </summary>
    public string? Model { get; set; }

    /// <summary>
    /// Additional metadata (monitor position, has camera, etc.)
    /// </summary>
    public Dictionary<string, string> Metadata { get; set; } = new();

    /// <summary>
    /// Installation status (pending, installed, skipped)
    /// </summary>
    public string Status { get; set; } = "pending";

    /// <summary>
    /// Whether this item requires serial number entry
    /// </summary>
    public bool RequiresSerialNumber { get; set; }

    /// <summary>
    /// Whether this item requires QR code label
    /// </summary>
    public bool RequiresQRCode { get; set; }
}

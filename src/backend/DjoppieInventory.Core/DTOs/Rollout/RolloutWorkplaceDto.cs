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
    public string? Location { get; set; }
    /// <summary>
    /// Custom scheduled date for this workplace. When null, uses the date from RolloutDay.
    /// </summary>
    public DateTime? ScheduledDate { get; set; }
    public int? ServiceId { get; set; }
    public string? ServiceName { get; set; }
    public bool IsLaptopSetup { get; set; }
    public List<AssetPlanDto> AssetPlans { get; set; } = new();
    public string Status { get; set; } = string.Empty;
    public int TotalItems { get; set; }
    public int CompletedItems { get; set; }
    public DateTime? CompletedAt { get; set; }
    public string? CompletedBy { get; set; }
    public string? CompletedByEmail { get; set; }
    public string? Notes { get; set; }
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

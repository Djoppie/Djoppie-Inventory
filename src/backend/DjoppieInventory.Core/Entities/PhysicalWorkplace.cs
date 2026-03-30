using DjoppieInventory.Core.Entities.Enums;

namespace DjoppieInventory.Core.Entities;

/// <summary>
/// Represents a permanent physical workplace location where assets can be installed.
/// A physical workplace is a specific desk, workstation, or area within a building
/// where equipment is set up (e.g., "Loket 1, Burgerzaken, Gemeentehuis, Gelijkvloers").
///
/// Fixed assets like monitors, docking stations, and desktop PCs are assigned to
/// the physical workplace. Users can occupy the workplace and bring their own
/// laptop (which is assigned to the user, not the workplace).
/// </summary>
public class PhysicalWorkplace
{
    /// <summary>
    /// Unique identifier for the physical workplace
    /// </summary>
    public int Id { get; set; }

    // ===== Location Identity =====

    /// <summary>
    /// Short code for the workplace (unique within building).
    /// Examples: "BZ-L01" (Burgerzaken Loket 1), "IT-W01" (IT Werkplek 1)
    /// </summary>
    public string Code { get; set; } = string.Empty;

    /// <summary>
    /// Display name of the workplace.
    /// Examples: "Loket 1", "Werkplek Jan", "Vergaderzaal A"
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Optional description of the workplace.
    /// Examples: "Eerste loket voor burgerzaken", "Werkplek naast het raam"
    /// </summary>
    public string? Description { get; set; }

    // ===== Location Hierarchy =====

    /// <summary>
    /// Foreign key to the building where this workplace is located.
    /// Required - every workplace must be in a building.
    /// </summary>
    public int BuildingId { get; set; }

    /// <summary>
    /// Foreign key to the service/department this workplace belongs to (optional).
    /// Example: Burgerzaken, IT Dienst, Financiën
    /// </summary>
    public int? ServiceId { get; set; }

    /// <summary>
    /// Floor or level within the building (optional).
    /// Examples: "Gelijkvloers", "1e verdieping", "Kelder"
    /// </summary>
    public string? Floor { get; set; }

    /// <summary>
    /// Room or area within the building (optional).
    /// Examples: "Lokaal 201", "Open kantoor A", "Onthaal"
    /// </summary>
    public string? Room { get; set; }

    // ===== Workplace Configuration =====

    /// <summary>
    /// Type of workplace setup.
    /// Determines expected equipment configuration.
    /// </summary>
    public WorkplaceType Type { get; set; } = WorkplaceType.Laptop;

    /// <summary>
    /// Number of monitors at this workplace (default: 2)
    /// </summary>
    public int MonitorCount { get; set; } = 2;

    /// <summary>
    /// Indicates if this is a laptop-based workplace (has docking station).
    /// True = user brings laptop, False = fixed desktop PC.
    /// </summary>
    public bool HasDockingStation { get; set; } = true;

    // ===== Dedicated Equipment Slots =====

    /// <summary>
    /// FK to docking station asset assigned to this workplace.
    /// </summary>
    public int? DockingStationAssetId { get; set; }

    /// <summary>
    /// FK to primary monitor (slot 1).
    /// </summary>
    public int? Monitor1AssetId { get; set; }

    /// <summary>
    /// FK to secondary monitor (slot 2).
    /// </summary>
    public int? Monitor2AssetId { get; set; }

    /// <summary>
    /// FK to tertiary monitor (slot 3, optional for triple-monitor setups).
    /// </summary>
    public int? Monitor3AssetId { get; set; }

    /// <summary>
    /// FK to keyboard asset assigned to this workplace.
    /// </summary>
    public int? KeyboardAssetId { get; set; }

    /// <summary>
    /// FK to mouse asset assigned to this workplace.
    /// </summary>
    public int? MouseAssetId { get; set; }

    // ===== Current Occupant (Real-time Tracking) =====

    /// <summary>
    /// Microsoft Entra ID (GUID) of the current occupant (optional).
    /// Null if workplace is unoccupied or is a hot desk.
    /// </summary>
    public string? CurrentOccupantEntraId { get; set; }

    /// <summary>
    /// Display name of the current occupant (cached from Entra).
    /// Examples: "Jan Janssen", "Marie Dubois"
    /// </summary>
    public string? CurrentOccupantName { get; set; }

    /// <summary>
    /// Email address of the current occupant (cached from Entra).
    /// </summary>
    public string? CurrentOccupantEmail { get; set; }

    /// <summary>
    /// Timestamp when the current occupant started using this workplace.
    /// Used for tracking how long someone has been at a workplace.
    /// </summary>
    public DateTime? OccupiedSince { get; set; }

    // ===== Occupant's Device (Laptop/Desktop they use) =====

    /// <summary>
    /// Serial number of the occupant's primary device (laptop/desktop).
    /// Cached from Assets table or Intune when occupant is assigned.
    /// </summary>
    public string? OccupantDeviceSerial { get; set; }

    /// <summary>
    /// Brand of the occupant's primary device.
    /// </summary>
    public string? OccupantDeviceBrand { get; set; }

    /// <summary>
    /// Model of the occupant's primary device.
    /// </summary>
    public string? OccupantDeviceModel { get; set; }

    /// <summary>
    /// Asset code of the occupant's device (if tracked in our inventory).
    /// </summary>
    public string? OccupantDeviceAssetCode { get; set; }

    // ===== Status =====

    /// <summary>
    /// Indicates if this workplace is active and available for use.
    /// Inactive workplaces are soft-deleted but preserved for historical data.
    /// </summary>
    public bool IsActive { get; set; } = true;

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
    /// The building where this workplace is located
    /// </summary>
    public Building Building { get; set; } = null!;

    /// <summary>
    /// The service/department this workplace belongs to (optional)
    /// </summary>
    public Service? Service { get; set; }

    // ===== Equipment Slot Navigation Properties =====

    /// <summary>
    /// The docking station asset assigned to this workplace.
    /// </summary>
    public Asset? DockingStationAsset { get; set; }

    /// <summary>
    /// The primary monitor (slot 1) assigned to this workplace.
    /// </summary>
    public Asset? Monitor1Asset { get; set; }

    /// <summary>
    /// The secondary monitor (slot 2) assigned to this workplace.
    /// </summary>
    public Asset? Monitor2Asset { get; set; }

    /// <summary>
    /// The tertiary monitor (slot 3) assigned to this workplace.
    /// </summary>
    public Asset? Monitor3Asset { get; set; }

    /// <summary>
    /// The keyboard asset assigned to this workplace.
    /// </summary>
    public Asset? KeyboardAsset { get; set; }

    /// <summary>
    /// The mouse asset assigned to this workplace.
    /// </summary>
    public Asset? MouseAsset { get; set; }

    /// <summary>
    /// Fixed assets assigned to this workplace (monitors, docking stations, etc.).
    /// These assets stay at the workplace regardless of who occupies it.
    /// </summary>
    public ICollection<Asset> FixedAssets { get; set; } = new List<Asset>();

    /// <summary>
    /// Rollout workplaces that reference this physical location.
    /// Used to track deployment history at this location.
    /// </summary>
    public ICollection<RolloutWorkplace> RolloutWorkplaces { get; set; } = new List<RolloutWorkplace>();
}

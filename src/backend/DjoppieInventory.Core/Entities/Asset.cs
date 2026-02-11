namespace DjoppieInventory.Core.Entities;

/// <summary>
/// Represents an IT asset in the inventory system.
/// Assets can be hardware devices, peripherals, or other IT equipment.
/// </summary>
public class Asset
{
    /// <summary>
    /// Unique identifier for the asset
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// Auto-generated asset code following pattern PREFIX-####
    /// (0001-8999 for normal assets, 9000+ for dummy/test assets)
    /// </summary>
    public string AssetCode { get; set; } = string.Empty;

    /// <summary>
    /// Official device name, typically auto-fetched from Intune
    /// </summary>
    public string AssetName { get; set; } = string.Empty;

    /// <summary>
    /// Optional user-friendly name or alias for the asset
    /// </summary>
    public string? Alias { get; set; }

    /// <summary>
    /// Asset category (e.g., Computing, Peripherals, Networking, Displays)
    /// </summary>
    public string Category { get; set; } = string.Empty;

    /// <summary>
    /// Indicates if this is a dummy/test asset (uses asset codes 9000+)
    /// </summary>
    public bool IsDummy { get; set; } = false;

    /// <summary>
    /// Physical location or building where the asset is installed (optional)
    /// </summary>
    public string? Building { get; set; }

    /// <summary>
    /// Primary user assigned to this asset (optional)
    /// </summary>
    public string? Owner { get; set; }

    /// <summary>
    /// Department of the assigned user (optional)
    /// </summary>
    public string? Department { get; set; }

    /// <summary>
    /// Job title of the assigned user (optional)
    /// </summary>
    public string? JobTitle { get; set; }

    /// <summary>
    /// Office location of the assigned user (optional)
    /// </summary>
    public string? OfficeLocation { get; set; }

    /// <summary>
    /// Current status of the asset (default: Stock)
    /// </summary>
    public AssetStatus Status { get; set; } = AssetStatus.Stock;

    /// <summary>
    /// Manufacturer or brand of the asset (optional)
    /// </summary>
    public string? Brand { get; set; }

    /// <summary>
    /// Model number or name of the asset (optional)
    /// </summary>
    public string? Model { get; set; }

    /// <summary>
    /// Serial number - required and must be unique across all assets
    /// </summary>
    public string SerialNumber { get; set; } = string.Empty;

    /// <summary>
    /// Date when the asset was purchased (optional)
    /// </summary>
    public DateTime? PurchaseDate { get; set; }

    /// <summary>
    /// Warranty expiration date (optional)
    /// </summary>
    public DateTime? WarrantyExpiry { get; set; }

    /// <summary>
    /// Date when the asset was installed or deployed (optional)
    /// </summary>
    public DateTime? InstallationDate { get; set; }

    /// <summary>
    /// Timestamp when the asset was created in the system
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Timestamp when the asset was last updated
    /// </summary>
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

/// <summary>
/// Represents the operational status of an asset
/// </summary>
public enum AssetStatus
{
    /// <summary>
    /// In gebruik (in use) - Asset is actively being used
    /// </summary>
    InGebruik = 0,

    /// <summary>
    /// Stock (in stock) - Asset is available but not currently assigned
    /// </summary>
    Stock = 1,

    /// <summary>
    /// Herstelling (repair) - Asset is under repair or maintenance
    /// </summary>
    Herstelling = 2,

    /// <summary>
    /// Defect (broken/defective) - Asset is broken and cannot be repaired
    /// </summary>
    Defect = 3,

    /// <summary>
    /// Uit dienst (decommissioned) - Asset has been retired from service
    /// </summary>
    UitDienst = 4
}

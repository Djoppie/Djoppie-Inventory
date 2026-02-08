namespace DjoppieInventory.Core.Entities;

public class Asset
{
    // Primary Key
    public int Id { get; set; }

    // Identification (Required)
    public string AssetCode { get; set; } = string.Empty; // Auto-generated: PREFIX-0001 to PREFIX-8999 (normal), PREFIX-9000+ (dummy)
    public string AssetName { get; set; } = string.Empty; // Official device name (DeviceName)
    public string? Alias { get; set; } // Optional readable name for the asset
    public string Category { get; set; } = string.Empty; // Computing, Peripherals, Networking, Displays
    public bool IsDummy { get; set; } = false; // Dummy/test assets use codes 9000+
    public string? Building { get; set; } // Installation location (optional)

    // Assignment (Optional)
    public string? Owner { get; set; } // Primary user (optional)
    public string? Department { get; set; }
    public string? JobTitle { get; set; }
    public string? OfficeLocation { get; set; }
    public AssetStatus Status { get; set; } = AssetStatus.Stock; // Default to Stock

    // Technical Details
    public string? Brand { get; set; }
    public string? Model { get; set; }
    public string SerialNumber { get; set; } = string.Empty; // Required - unique identifier for the device

    // Lifecycle (Optional)
    public DateTime? PurchaseDate { get; set; }
    public DateTime? WarrantyExpiry { get; set; }
    public DateTime? InstallationDate { get; set; }

    // Audit Fields
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

public enum AssetStatus
{
    InGebruik = 0,      // In gebruik (in use)
    Stock = 1,          // Stock (in stock)
    Herstelling = 2,    // Herstelling (repair)
    Defect = 3,         // Defect (broken/defective)
    UitDienst = 4       // Uit dienst (decommissioned)
}

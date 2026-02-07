namespace DjoppieInventory.Core.Entities;

public class Asset
{
    // Primary Key
    public int Id { get; set; }

    // Identification (Required)
    public string AssetCode { get; set; } = string.Empty; // Auto-generated: PREFIX-0001 to PREFIX-8999 (normal), PREFIX-9000+ (dummy)
    public string AssetName { get; set; } = string.Empty; // Alias for the asset
    public string Category { get; set; } = string.Empty; // Computing, Peripherals, Networking, Displays
    public bool IsDummy { get; set; } = false; // Dummy/test assets use codes 9000+
    public string Building { get; set; } = string.Empty; // Installation location

    // Assignment (Required)
    public string Owner { get; set; } = string.Empty; // Primary user
    public string Department { get; set; } = string.Empty;
    public string? JobTitle { get; set; }
    public string? OfficeLocation { get; set; }
    public AssetStatus Status { get; set; } = AssetStatus.InGebruik;

    // Technical Details (Optional)
    public string? Brand { get; set; }
    public string? Model { get; set; }
    public string? SerialNumber { get; set; }

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

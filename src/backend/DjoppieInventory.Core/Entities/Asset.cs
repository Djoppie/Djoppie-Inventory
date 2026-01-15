namespace DjoppieInventory.Core.Entities;

public class Asset
{
    // Primary Key
    public int Id { get; set; }

    // Identification (Required)
    public string AssetCode { get; set; } = string.Empty; // Unique, e.g., "AST-2401"
    public string AssetName { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty; // Computing, Peripherals, Networking, Displays

    // Assignment (Required)
    public string Owner { get; set; } = string.Empty;
    public string Building { get; set; } = string.Empty;
    public string SpaceOrFloor { get; set; } = string.Empty;
    public AssetStatus Status { get; set; } = AssetStatus.Active;

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
    Active = 0,
    Maintenance = 1
}

namespace DjoppieInventory.Core.Entities;

public class AssetTemplate
{
    public int Id { get; set; }
    public string TemplateName { get; set; } = string.Empty;
    public string AssetName { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string Brand { get; set; } = string.Empty;
    public string Model { get; set; } = string.Empty;
    public string Owner { get; set; } = string.Empty;
    public string Building { get; set; } = string.Empty;
    public string Department { get; set; } = string.Empty;
    public string? OfficeLocation { get; set; }

    // Lifecycle (Optional)
    public DateTime? PurchaseDate { get; set; }
    public DateTime? WarrantyExpiry { get; set; }
    public DateTime? InstallationDate { get; set; }

    public bool IsActive { get; set; } = true;
}

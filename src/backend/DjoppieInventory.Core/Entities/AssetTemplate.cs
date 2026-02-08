namespace DjoppieInventory.Core.Entities;

public class AssetTemplate
{
    public int Id { get; set; }
    public string TemplateName { get; set; } = string.Empty;
    public string? AssetName { get; set; }  // Optional - alias/description for the asset
    public string Category { get; set; } = string.Empty;
    public string? Brand { get; set; }
    public string? Model { get; set; }
    public string? Owner { get; set; }  // Optional - default primary user
    public string? Building { get; set; }  // Optional - default location
    public string? Department { get; set; }  // Optional - default department
    public string? OfficeLocation { get; set; }

    // Lifecycle (Optional)
    public DateTime? PurchaseDate { get; set; }
    public DateTime? WarrantyExpiry { get; set; }
    public DateTime? InstallationDate { get; set; }

    public bool IsActive { get; set; } = true;
}

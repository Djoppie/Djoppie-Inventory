namespace DjoppieInventory.Core.DTOs;

public class AssetTemplateDto
{
    public int Id { get; set; }
    public string TemplateName { get; set; } = string.Empty;
    public string AssetName { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string Brand { get; set; } = string.Empty;
    public string Model { get; set; } = string.Empty;
    public string Owner { get; set; } = string.Empty;
    public string Building { get; set; } = string.Empty;
    public string SpaceOrFloor { get; set; } = string.Empty;
    public DateTime? PurchaseDate { get; set; }
    public DateTime? WarrantyExpiry { get; set; }
    public DateTime? InstallationDate { get; set; }
}

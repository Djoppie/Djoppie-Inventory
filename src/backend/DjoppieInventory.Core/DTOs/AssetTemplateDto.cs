namespace DjoppieInventory.Core.DTOs;

public class AssetTemplateDto
{
    public int Id { get; set; }
    public string TemplateName { get; set; } = string.Empty;
    public string? AssetName { get; set; }
    public string Category { get; set; } = string.Empty;
    public string? Brand { get; set; }
    public string? Model { get; set; }
    public string? Owner { get; set; }
    public string? Building { get; set; }
    public string? Department { get; set; }
    public DateTime? PurchaseDate { get; set; }
    public DateTime? WarrantyExpiry { get; set; }
    public DateTime? InstallationDate { get; set; }
}

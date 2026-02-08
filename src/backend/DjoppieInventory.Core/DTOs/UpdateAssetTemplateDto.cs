using System.ComponentModel.DataAnnotations;

namespace DjoppieInventory.Core.DTOs;

public class UpdateAssetTemplateDto
{
    [Required]
    [StringLength(100)]
    public string TemplateName { get; set; } = string.Empty;

    [StringLength(200)]
    public string? AssetName { get; set; }  // Optional - alias/description

    [Required]
    public string Category { get; set; } = string.Empty;

    public string? Brand { get; set; }
    public string? Model { get; set; }
    public string? Owner { get; set; }  // Optional - default primary user
    public string? Building { get; set; }  // Optional - default location
    public string? Department { get; set; }  // Optional - default department
    public DateTime? PurchaseDate { get; set; }
    public DateTime? WarrantyExpiry { get; set; }
    public DateTime? InstallationDate { get; set; }
}

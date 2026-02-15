using System.ComponentModel.DataAnnotations;

namespace DjoppieInventory.Core.DTOs;

public class UpdateAssetTemplateDto
{
    [Required]
    [StringLength(100)]
    public string TemplateName { get; set; } = string.Empty;

    [StringLength(200)]
    public string? AssetName { get; set; }  // Optional - alias/description

    public string? Category { get; set; }  // Optional - derived from AssetType

    public int? AssetTypeId { get; set; }  // Optional - determines TYPE in asset code
    public int? ServiceId { get; set; }  // Optional - default service/department
    public string? InstallationLocation { get; set; }  // Optional - specific location
    public string? Status { get; set; }  // Optional - default status

    public string? Brand { get; set; }
    public string? Model { get; set; }
    public string? Owner { get; set; }  // Optional - default primary user
    public DateTime? PurchaseDate { get; set; }
    public DateTime? WarrantyExpiry { get; set; }
    public DateTime? InstallationDate { get; set; }
}

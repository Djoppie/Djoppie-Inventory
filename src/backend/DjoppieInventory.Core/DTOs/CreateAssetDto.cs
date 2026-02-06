using System.ComponentModel.DataAnnotations;

namespace DjoppieInventory.Core.DTOs;

public class CreateAssetDto
{
    [Required]
    [StringLength(50)]
    public string AssetCode { get; set; } = string.Empty;

    [Required]
    [StringLength(200)]
    public string AssetName { get; set; } = string.Empty;

    [Required]
    public string Category { get; set; } = string.Empty;

    [Required]
    public string Owner { get; set; } = string.Empty;

    [Required]
    public string Building { get; set; } = string.Empty;

    [Required]
    public string Department { get; set; } = string.Empty;

    public string? OfficeLocation { get; set; }

    public string Status { get; set; } = "Active";

    public string? Brand { get; set; }
    public string? Model { get; set; }
    public string? SerialNumber { get; set; }
    public DateTime? PurchaseDate { get; set; }
    public DateTime? WarrantyExpiry { get; set; }
    public DateTime? InstallationDate { get; set; }
}

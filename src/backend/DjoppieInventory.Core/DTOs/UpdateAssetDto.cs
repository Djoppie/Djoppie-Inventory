using System.ComponentModel.DataAnnotations;

namespace DjoppieInventory.Core.DTOs;

public class UpdateAssetDto
{
    /// <summary>
    /// Official device name (DeviceName)
    /// </summary>
    public string AssetName { get; set; } = string.Empty;

    /// <summary>
    /// Optional readable name for the asset
    /// </summary>
    [StringLength(200)]
    public string? Alias { get; set; }

    [Required]
    public string Category { get; set; } = string.Empty;

    /// <summary>
    /// Primary user (optional)
    /// </summary>
    public string? Owner { get; set; }

    /// <summary>
    /// Installation location (optional)
    /// </summary>
    public string? Building { get; set; }

    public string? Department { get; set; }

    public string? JobTitle { get; set; }

    public string? OfficeLocation { get; set; }

    public string Status { get; set; } = "Stock";

    public string? Brand { get; set; }
    public string? Model { get; set; }
    public string? SerialNumber { get; set; }
    public DateTime? PurchaseDate { get; set; }
    public DateTime? WarrantyExpiry { get; set; }
    public DateTime? InstallationDate { get; set; }
}

using System.ComponentModel.DataAnnotations;

namespace DjoppieInventory.Core.DTOs;

/// <summary>
/// DTO for creating a new asset. AssetCode is auto-generated based on prefix.
/// </summary>
public class CreateAssetDto
{
    /// <summary>
    /// Prefix for auto-generating asset code (e.g., "LAP", "MON", "PRINT")
    /// </summary>
    [Required]
    [StringLength(20)]
    public string AssetCodePrefix { get; set; } = string.Empty;

    /// <summary>
    /// Alias/name for the asset
    /// </summary>
    [Required]
    [StringLength(200)]
    public string AssetName { get; set; } = string.Empty;

    [Required]
    public string Category { get; set; } = string.Empty;

    /// <summary>
    /// If true, asset code will be in the 9000+ range for dummy/test assets
    /// </summary>
    public bool IsDummy { get; set; } = false;

    /// <summary>
    /// Installation location
    /// </summary>
    [Required]
    public string Building { get; set; } = string.Empty;

    /// <summary>
    /// Primary user
    /// </summary>
    [Required]
    public string Owner { get; set; } = string.Empty;

    [Required]
    public string Department { get; set; } = string.Empty;

    public string? JobTitle { get; set; }

    public string? OfficeLocation { get; set; }

    public string Status { get; set; } = "InGebruik";

    public string? Brand { get; set; }
    public string? Model { get; set; }
    public string? SerialNumber { get; set; }
    public DateTime? PurchaseDate { get; set; }
    public DateTime? WarrantyExpiry { get; set; }
    public DateTime? InstallationDate { get; set; }
}

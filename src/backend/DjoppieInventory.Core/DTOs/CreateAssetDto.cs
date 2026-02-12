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
    /// Serial number of the device - REQUIRED and must be unique
    /// </summary>
    [Required]
    [StringLength(100)]
    public string SerialNumber { get; set; } = string.Empty;

    /// <summary>
    /// Device name from Intune (auto-fetched based on SerialNumber)
    /// </summary>
    [StringLength(200)]
    public string AssetName { get; set; } = string.Empty;

    /// <summary>
    /// Optional readable name for the asset (user-defined alias)
    /// </summary>
    [StringLength(200)]
    public string? Alias { get; set; }

    [Required]
    public string Category { get; set; } = string.Empty;

    /// <summary>
    /// If true, asset code will be in the 9000+ range for dummy/test assets
    /// </summary>
    public bool IsDummy { get; set; } = false;

    /// <summary>
    /// Installation location (optional)
    /// </summary>
    public string? Building { get; set; }

    /// <summary>
    /// Primary user (optional - can be assigned later)
    /// </summary>
    public string? Owner { get; set; }

    public string? Department { get; set; }

    public string? JobTitle { get; set; }

    public string? OfficeLocation { get; set; }

    public string Status { get; set; } = "Stock";

    public string? Brand { get; set; }
    public string? Model { get; set; }
    public DateTime? PurchaseDate { get; set; }
    public DateTime? WarrantyExpiry { get; set; }
    public DateTime? InstallationDate { get; set; }
}

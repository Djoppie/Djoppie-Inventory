using System.ComponentModel.DataAnnotations;

namespace DjoppieInventory.Core.DTOs;

/// <summary>
/// DTO for updating an existing asset's properties
/// </summary>
public class UpdateAssetDto
{
    /// <summary>
    /// Official device name (DeviceName), typically auto-fetched from Intune
    /// </summary>
    [StringLength(200)]
    public string? AssetName { get; set; }

    /// <summary>
    /// Optional user-friendly name or alias for the asset
    /// </summary>
    [StringLength(200)]
    public string? Alias { get; set; }

    /// <summary>
    /// Category (optional - auto-derived from AssetType if not provided)
    /// </summary>
    [StringLength(100)]
    public string? Category { get; set; }

    /// <summary>
    /// Asset type ID (optional - typically set at creation, but can be corrected)
    /// </summary>
    public int? AssetTypeId { get; set; }

    /// <summary>
    /// Service/department ID for location (optional)
    /// </summary>
    public int? ServiceId { get; set; }

    /// <summary>
    /// Specific installation location details (e.g., room number, floor)
    /// </summary>
    [StringLength(200)]
    public string? InstallationLocation { get; set; }

    /// <summary>
    /// Primary user assigned to this asset (optional)
    /// </summary>
    [StringLength(200)]
    public string? Owner { get; set; }

    /// <summary>
    /// Job title of the assigned user (optional)
    /// </summary>
    [StringLength(100)]
    public string? JobTitle { get; set; }

    /// <summary>
    /// Office location of the assigned user (optional)
    /// </summary>
    [StringLength(100)]
    public string? OfficeLocation { get; set; }

    /// <summary>
    /// Current status of the asset
    /// </summary>
    [Required]
    public string Status { get; set; } = "Stock";

    /// <summary>
    /// Manufacturer or brand (optional)
    /// </summary>
    [StringLength(100)]
    public string? Brand { get; set; }

    /// <summary>
    /// Model number or name (optional)
    /// </summary>
    [StringLength(200)]
    public string? Model { get; set; }

    /// <summary>
    /// Serial number - required and must be unique
    /// NOTE: While updatable, changing serial numbers should be rare and carefully validated
    /// </summary>
    [Required]
    [StringLength(100)]
    public string SerialNumber { get; set; } = string.Empty;

    /// <summary>
    /// Date when the asset was purchased (optional)
    /// </summary>
    public DateTime? PurchaseDate { get; set; }

    /// <summary>
    /// Warranty expiration date (optional)
    /// </summary>
    public DateTime? WarrantyExpiry { get; set; }

    /// <summary>
    /// Date when the asset was installed or deployed (optional)
    /// </summary>
    public DateTime? InstallationDate { get; set; }
}

using System.ComponentModel.DataAnnotations;

namespace DjoppieInventory.Core.DTOs;

/// <summary>
/// DTO for creating a new asset. AssetCode is auto-generated from AssetType + Year + Brand.
/// Format: [DUM-]TYPE-YY-MERK-NUMMER (e.g., LAP-26-DELL-00001)
/// </summary>
public class CreateAssetDto
{
    /// <summary>
    /// Asset type ID - required for auto-generating asset code (determines TYPE component).
    /// </summary>
    [Required]
    public int AssetTypeId { get; set; }

    /// <summary>
    /// Serial number of the device - REQUIRED and must be unique
    /// </summary>
    [Required]
    [StringLength(100)]
    public string SerialNumber { get; set; } = string.Empty;

    /// <summary>
    /// Device name from Intune (auto-fetched based on SerialNumber, optional)
    /// </summary>
    [StringLength(200)]
    public string? AssetName { get; set; }

    /// <summary>
    /// Optional readable name for the asset (user-defined alias)
    /// </summary>
    [StringLength(200)]
    public string? Alias { get; set; }

    /// <summary>
    /// Category (optional - auto-derived from AssetType if not provided)
    /// </summary>
    public string? Category { get; set; }

    /// <summary>
    /// If true, asset code will be in the 9000+ range for dummy/test assets
    /// </summary>
    public bool IsDummy { get; set; } = false;

    /// <summary>
    /// Service/department ID for location (optional)
    /// </summary>
    public int? ServiceId { get; set; }

    /// <summary>
    /// Specific installation location details (e.g., room number, floor)
    /// </summary>
    public string? InstallationLocation { get; set; }

    /// <summary>
    /// Primary user (optional - can be assigned later)
    /// </summary>
    public string? Owner { get; set; }

    public string? JobTitle { get; set; }

    public string? OfficeLocation { get; set; }

    public string Status { get; set; } = "Stock";

    public string? Brand { get; set; }
    public string? Model { get; set; }
    public DateTime? PurchaseDate { get; set; }
    public DateTime? WarrantyExpiry { get; set; }
    public DateTime? InstallationDate { get; set; }
}

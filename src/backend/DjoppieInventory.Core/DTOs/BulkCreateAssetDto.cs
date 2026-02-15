using System.ComponentModel.DataAnnotations;

namespace DjoppieInventory.Core.DTOs;

/// <summary>
/// DTO for bulk asset creation operations.
/// Asset codes are auto-generated from AssetType + Year + Brand.
/// Format: [DUM-]TYPE-YY-MERK-NUMMER (e.g., LAP-26-DELL-00001)
/// </summary>
public class BulkCreateAssetDto
{
    /// <summary>
    /// Asset type ID - required for auto-generating asset codes (determines TYPE component).
    /// </summary>
    [Required]
    public int AssetTypeId { get; set; }

    /// <summary>
    /// The number of assets to create in bulk.
    /// Must be between 1 and 100 to prevent excessive resource usage.
    /// </summary>
    [Required]
    [Range(1, 100)]
    public int Quantity { get; set; } = 1;

    /// <summary>
    /// If true, asset codes will be in the 9000+ range for dummy/test assets.
    /// </summary>
    public bool IsDummy { get; set; } = false;

    /// <summary>
    /// Optional: Template ID to use for auto-filling asset details.
    /// If provided, will copy brand, model, category from the template.
    /// </summary>
    public int? TemplateId { get; set; }

    /// <summary>
    /// The official device name (DeviceName) for the assets (optional).
    /// </summary>
    [StringLength(200)]
    public string? AssetName { get; set; }

    /// <summary>
    /// Optional: Readable name/alias for the assets.
    /// </summary>
    [StringLength(200)]
    public string? Alias { get; set; }

    /// <summary>
    /// Category for all assets in the bulk creation (optional - derived from AssetType).
    /// </summary>
    public string? Category { get; set; }

    /// <summary>
    /// Service/department ID for all assets (optional).
    /// </summary>
    public int? ServiceId { get; set; }

    /// <summary>
    /// Specific installation location details (e.g., room number, floor) for all assets (optional).
    /// </summary>
    public string? InstallationLocation { get; set; }

    /// <summary>
    /// Primary user for all assets (optional - can be assigned later).
    /// </summary>
    public string? Owner { get; set; }

    /// <summary>
    /// Status for all assets. Defaults to "Stock".
    /// </summary>
    public string Status { get; set; } = "Stock";

    /// <summary>
    /// Optional: Brand for all assets in the bulk creation.
    /// </summary>
    public string? Brand { get; set; }

    /// <summary>
    /// Optional: Model for all assets in the bulk creation.
    /// </summary>
    public string? Model { get; set; }

    /// <summary>
    /// Serial number prefix for generating unique serial numbers - REQUIRED.
    /// Will be combined with the asset number to create unique serial numbers.
    /// Example: "SN" will generate SN-0001, SN-0002, etc.
    /// </summary>
    [Required]
    [StringLength(50)]
    public string SerialNumberPrefix { get; set; } = string.Empty;

    /// <summary>
    /// Optional: Purchase date for all assets in the bulk creation.
    /// </summary>
    public DateTime? PurchaseDate { get; set; }

    /// <summary>
    /// Optional: Warranty expiry date for all assets in the bulk creation.
    /// </summary>
    public DateTime? WarrantyExpiry { get; set; }

    /// <summary>
    /// Optional: Installation date for all assets in the bulk creation.
    /// </summary>
    public DateTime? InstallationDate { get; set; }
}

/// <summary>
/// Response DTO for bulk asset creation operations.
/// Provides summary of the operation including successful and failed creations.
/// </summary>
public class BulkCreateAssetResultDto
{
    /// <summary>
    /// The total number of assets requested to be created.
    /// </summary>
    public int TotalRequested { get; set; }

    /// <summary>
    /// The number of assets successfully created.
    /// </summary>
    public int SuccessfullyCreated { get; set; }

    /// <summary>
    /// The number of assets that failed to be created.
    /// </summary>
    public int Failed { get; set; }

    /// <summary>
    /// List of successfully created assets.
    /// </summary>
    public List<AssetDto> CreatedAssets { get; set; } = new();

    /// <summary>
    /// List of error messages for failed asset creations.
    /// </summary>
    public List<string> Errors { get; set; } = new();

    /// <summary>
    /// Indicates if the operation was completely successful.
    /// </summary>
    public bool IsFullySuccessful => Failed == 0 && SuccessfullyCreated == TotalRequested;
}

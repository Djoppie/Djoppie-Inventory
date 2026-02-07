using System.ComponentModel.DataAnnotations;

namespace DjoppieInventory.Core.DTOs;

/// <summary>
/// DTO for bulk asset creation operations.
/// Allows creating multiple assets with auto-generated sequential codes.
/// </summary>
public class BulkCreateAssetDto
{
    /// <summary>
    /// The prefix to use for generating asset codes.
    /// Example: "LAP" will generate LAP-0001, LAP-0002, etc. (normal)
    /// or LAP-9000, LAP-9001, etc. (dummy)
    /// </summary>
    [Required]
    [StringLength(20)]
    public string AssetCodePrefix { get; set; } = string.Empty;

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
    /// The base name for the assets (alias).
    /// </summary>
    [Required]
    [StringLength(200)]
    public string AssetName { get; set; } = string.Empty;

    /// <summary>
    /// Category for all assets in the bulk creation.
    /// </summary>
    [Required]
    public string Category { get; set; } = string.Empty;

    /// <summary>
    /// Installation location for all assets.
    /// </summary>
    [Required]
    public string Building { get; set; } = string.Empty;

    /// <summary>
    /// Primary user for all assets in the bulk creation.
    /// </summary>
    [Required]
    public string Owner { get; set; } = string.Empty;

    /// <summary>
    /// Department for all assets in the bulk creation.
    /// </summary>
    [Required]
    public string Department { get; set; } = string.Empty;

    /// <summary>
    /// Optional: Office location for all assets in the bulk creation.
    /// </summary>
    public string? OfficeLocation { get; set; }

    /// <summary>
    /// Status for all assets. Defaults to "InGebruik".
    /// </summary>
    public string Status { get; set; } = "InGebruik";

    /// <summary>
    /// Optional: Brand for all assets in the bulk creation.
    /// </summary>
    public string? Brand { get; set; }

    /// <summary>
    /// Optional: Model for all assets in the bulk creation.
    /// </summary>
    public string? Model { get; set; }

    /// <summary>
    /// Optional: Serial number prefix for generating unique serial numbers.
    /// If provided, will be combined with the asset number to create unique serial numbers.
    /// Example: "SN" will generate SN-0001, SN-0002, etc.
    /// </summary>
    [StringLength(50)]
    public string? SerialNumberPrefix { get; set; }

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

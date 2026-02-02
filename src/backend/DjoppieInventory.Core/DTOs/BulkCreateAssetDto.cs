using System.ComponentModel.DataAnnotations;

namespace DjoppieInventory.Core.DTOs;

/// <summary>
/// DTO for bulk asset creation operations.
/// Allows creating multiple assets based on a template with a shared prefix and common properties.
/// </summary>
public class BulkCreateAssetDto
{
    /// <summary>
    /// The prefix to use for generating asset codes.
    /// Example: "AST" will generate AST-0001, AST-0002, etc.
    /// </summary>
    [Required]
    [StringLength(20)]
    public string AssetCodePrefix { get; set; } = string.Empty;

    /// <summary>
    /// The starting number for asset code generation.
    /// Default is 1. Will be zero-padded to 4 digits.
    /// </summary>
    [Range(1, 9999)]
    public int StartingNumber { get; set; } = 1;

    /// <summary>
    /// The number of assets to create in bulk.
    /// Must be between 1 and 100 to prevent excessive resource usage.
    /// </summary>
    [Required]
    [Range(1, 100)]
    public int Quantity { get; set; }

    /// <summary>
    /// Optional: Template ID to use for auto-filling asset details.
    /// If provided, will copy brand, model, category from the template.
    /// </summary>
    public int? TemplateId { get; set; }

    /// <summary>
    /// The base name for the assets. Will be appended with a number.
    /// Example: "Dell Latitude" becomes "Dell Latitude 1", "Dell Latitude 2", etc.
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
    /// Owner for all assets in the bulk creation.
    /// </summary>
    [Required]
    public string Owner { get; set; } = string.Empty;

    /// <summary>
    /// Building location for all assets in the bulk creation.
    /// </summary>
    [Required]
    public string Building { get; set; } = string.Empty;

    /// <summary>
    /// Space or floor location for all assets in the bulk creation.
    /// </summary>
    [Required]
    public string SpaceOrFloor { get; set; } = string.Empty;

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
    public bool IsFullySuccessful => Failed == 0;
}

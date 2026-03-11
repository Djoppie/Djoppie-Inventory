using System.ComponentModel.DataAnnotations;

namespace DjoppieInventory.Core.DTOs;

/// <summary>
/// DTO for bulk updating multiple assets with selected fields
/// </summary>
public class BulkUpdateAssetsDto
{
    /// <summary>
    /// List of asset IDs to update
    /// </summary>
    [Required]
    [MinLength(1, ErrorMessage = "At least one asset ID is required")]
    public List<int> AssetIds { get; set; } = new();

    /// <summary>
    /// Service/department ID - only applied if UpdateServiceId is true
    /// </summary>
    public int? ServiceId { get; set; }
    public bool UpdateServiceId { get; set; }

    /// <summary>
    /// Purchase date - only applied if UpdatePurchaseDate is true
    /// </summary>
    public DateTime? PurchaseDate { get; set; }
    public bool UpdatePurchaseDate { get; set; }

    /// <summary>
    /// Installation date - only applied if UpdateInstallationDate is true
    /// </summary>
    public DateTime? InstallationDate { get; set; }
    public bool UpdateInstallationDate { get; set; }

    /// <summary>
    /// Warranty expiry date - only applied if UpdateWarrantyExpiry is true
    /// </summary>
    public DateTime? WarrantyExpiry { get; set; }
    public bool UpdateWarrantyExpiry { get; set; }

    /// <summary>
    /// Brand - only applied if UpdateBrand is true
    /// </summary>
    [StringLength(100)]
    public string? Brand { get; set; }
    public bool UpdateBrand { get; set; }

    /// <summary>
    /// Model - only applied if UpdateModel is true
    /// </summary>
    [StringLength(200)]
    public string? Model { get; set; }
    public bool UpdateModel { get; set; }

    /// <summary>
    /// Status - only applied if UpdateStatus is true
    /// </summary>
    [StringLength(50)]
    public string? Status { get; set; }
    public bool UpdateStatus { get; set; }

    /// <summary>
    /// Installation location - only applied if UpdateInstallationLocation is true
    /// </summary>
    [StringLength(200)]
    public string? InstallationLocation { get; set; }
    public bool UpdateInstallationLocation { get; set; }
}

/// <summary>
/// Result of a bulk update operation
/// </summary>
public class BulkUpdateAssetsResultDto
{
    /// <summary>
    /// Number of assets successfully updated
    /// </summary>
    public int UpdatedCount { get; set; }

    /// <summary>
    /// Total number of assets requested for update
    /// </summary>
    public int TotalRequested { get; set; }

    /// <summary>
    /// List of asset IDs that were successfully updated
    /// </summary>
    public List<int> UpdatedIds { get; set; } = new();

    /// <summary>
    /// List of asset IDs that failed to update
    /// </summary>
    public List<int> FailedIds { get; set; } = new();

    /// <summary>
    /// Error messages for failed updates (if any)
    /// </summary>
    public List<string> Errors { get; set; } = new();
}

/// <summary>
/// DTO for bulk deleting multiple assets
/// </summary>
public class BulkDeleteAssetsDto
{
    /// <summary>
    /// List of asset IDs to delete
    /// </summary>
    [Required]
    [MinLength(1, ErrorMessage = "At least one asset ID is required")]
    public List<int> AssetIds { get; set; } = new();
}

/// <summary>
/// Result of a bulk delete operation
/// </summary>
public class BulkDeleteAssetsResultDto
{
    /// <summary>
    /// Number of assets successfully deleted
    /// </summary>
    public int DeletedCount { get; set; }

    /// <summary>
    /// Total number of assets requested for deletion
    /// </summary>
    public int TotalRequested { get; set; }

    /// <summary>
    /// List of asset IDs that were successfully deleted
    /// </summary>
    public List<int> DeletedIds { get; set; } = new();

    /// <summary>
    /// List of asset IDs that failed to delete (e.g., not found)
    /// </summary>
    public List<int> FailedIds { get; set; } = new();

    /// <summary>
    /// Error messages for failed deletions (if any)
    /// </summary>
    public List<string> Errors { get; set; } = new();
}

using System.ComponentModel.DataAnnotations;

namespace DjoppieInventory.Core.DTOs;

/// <summary>
/// DTO for bulk updating intrinsic properties of multiple assets.
///
/// <para>
/// Status, owner, employee assignment, building / workplace assignment,
/// service and installation-date / -location are intentionally absent.
/// Those flow through dedicated endpoints on
/// <see cref="DjoppieInventory.Core.Interfaces.IAssetAssignmentService"/>;
/// frontend bulk-assign affordances should call them in a loop.
/// </para>
/// </summary>
public class BulkUpdateAssetsDto
{
    [Required]
    [MinLength(1, ErrorMessage = "At least one asset ID is required")]
    public List<int> AssetIds { get; set; } = new();

    public DateTime? PurchaseDate { get; set; }
    public bool UpdatePurchaseDate { get; set; }

    public DateTime? WarrantyExpiry { get; set; }
    public bool UpdateWarrantyExpiry { get; set; }

    [StringLength(100)]
    public string? Brand { get; set; }
    public bool UpdateBrand { get; set; }

    [StringLength(200)]
    public string? Model { get; set; }
    public bool UpdateModel { get; set; }
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

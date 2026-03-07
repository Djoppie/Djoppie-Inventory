using System.ComponentModel.DataAnnotations;

namespace DjoppieInventory.Core.DTOs.Rollout;

/// <summary>
/// DTO for marking a workplace as completed
/// </summary>
public class CompleteWorkplaceDto
{
    [StringLength(2000, ErrorMessage = "Notes cannot exceed 2000 characters")]
    public string? Notes { get; set; }
}

/// <summary>
/// DTO for updating a single asset plan item status
/// </summary>
public class UpdateItemStatusDto
{
    /// <summary>
    /// New status: "installed" or "skipped"
    /// </summary>
    [Required]
    public string Status { get; set; } = "installed";
}

/// <summary>
/// DTO for updating item details during execution (serial number, template, asset linking)
/// </summary>
public class UpdateItemDetailsDto
{
    /// <summary>
    /// Serial number to search for or create asset with
    /// </summary>
    [StringLength(100)]
    public string? SerialNumber { get; set; }

    /// <summary>
    /// Serial number of old asset being replaced
    /// </summary>
    [StringLength(100)]
    public string? OldSerialNumber { get; set; }

    /// <summary>
    /// Brand for the asset (from template or manual entry)
    /// </summary>
    [StringLength(100)]
    public string? Brand { get; set; }

    /// <summary>
    /// Model for the asset (from template or manual entry)
    /// </summary>
    [StringLength(100)]
    public string? Model { get; set; }

    /// <summary>
    /// User name to assign to the workplace
    /// </summary>
    [StringLength(200)]
    public string? UserName { get; set; }

    /// <summary>
    /// Whether to mark the item as installed after updating details
    /// </summary>
    public bool MarkAsInstalled { get; set; } = true;
}

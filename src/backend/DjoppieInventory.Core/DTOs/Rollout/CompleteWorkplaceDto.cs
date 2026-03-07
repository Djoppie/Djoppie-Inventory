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

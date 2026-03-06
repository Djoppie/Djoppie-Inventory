using System.ComponentModel.DataAnnotations;

namespace DjoppieInventory.Core.DTOs.Rollout;

/// <summary>
/// Data Transfer Object for executing an asset swap operation.
/// This DTO is used when marking a swap as completed and applying the status changes.
/// </summary>
public class ExecuteSwapDto
{
    /// <summary>
    /// The new status to assign to the old asset (required if OldAssetId exists)
    /// Valid values: Stock, Herstelling, Defect, UitDienst
    /// </summary>
    public string? OldAssetNewStatus { get; set; }

    /// <summary>
    /// Optional notes about the swap execution (issues encountered, observations, etc.)
    /// </summary>
    [StringLength(1000)]
    public string? Notes { get; set; }

    /// <summary>
    /// Timestamp when the swap was actually performed (defaults to current time if not specified)
    /// </summary>
    public DateTime? SwapDate { get; set; }
}

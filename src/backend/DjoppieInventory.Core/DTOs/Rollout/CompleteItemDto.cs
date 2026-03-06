using System.ComponentModel.DataAnnotations;

namespace DjoppieInventory.Core.DTOs.Rollout;

/// <summary>
/// Data Transfer Object for marking a rollout item as completed
/// </summary>
public class CompleteItemDto
{
    /// <summary>
    /// Optional notes about the completion (issues encountered, special notes, etc.)
    /// </summary>
    [StringLength(1000)]
    public string? Notes { get; set; }

    /// <summary>
    /// Timestamp when the item was actually completed (defaults to current time if not specified)
    /// </summary>
    public DateTime? CompletedAt { get; set; }
}

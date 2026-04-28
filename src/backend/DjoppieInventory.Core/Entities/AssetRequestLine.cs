namespace DjoppieInventory.Core.Entities;

/// <summary>
/// Represents a single asset assignment within an AssetRequest (on/offboarding).
/// Multiple lines can exist per request: one per asset type (laptop, monitor, etc.).
/// </summary>
public class AssetRequestLine
{
    public int Id { get; set; }

    public int AssetRequestId { get; set; }
    public AssetRequest AssetRequest { get; set; } = null!;

    public int AssetTypeId { get; set; }
    public AssetType AssetType { get; set; } = null!;

    public AssetLineSourceType SourceType { get; set; } = AssetLineSourceType.ToBeAssigned;

    public int? AssetId { get; set; }
    public Asset? Asset { get; set; }

    public int? AssetTemplateId { get; set; }
    public AssetTemplate? AssetTemplate { get; set; }

    public AssetRequestLineStatus Status { get; set; } = AssetRequestLineStatus.Pending;

    /// <summary>
    /// Offboarding-only: what to do with the asset on completion.
    /// Ignored for onboarding (which always sets the asset to InGebruik).
    /// </summary>
    public AssetReturnAction? ReturnAction { get; set; }

    public string? Notes { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

public enum AssetLineSourceType
{
    ToBeAssigned = 0,
    ExistingInventory = 1,
    NewFromTemplate = 2
}

public enum AssetRequestLineStatus
{
    Pending = 0,
    Reserved = 1,
    Completed = 2,
    Skipped = 3
}

public enum AssetReturnAction
{
    ReturnToStock = 0,
    Decommission = 1,
    Reassign = 2
}

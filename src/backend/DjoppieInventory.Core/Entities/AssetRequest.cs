namespace DjoppieInventory.Core.Entities;

/// <summary>
/// Represents an asset request for on/offboarding planning
/// </summary>
public class AssetRequest
{
    public int Id { get; set; }

    /// <summary>
    /// Requested date for the on/offboarding
    /// </summary>
    public DateTime RequestedDate { get; set; }

    /// <summary>
    /// Type of request: Onboarding or Offboarding
    /// </summary>
    public AssetRequestType RequestType { get; set; }

    /// <summary>
    /// Employee name for the request
    /// </summary>
    public string EmployeeName { get; set; } = string.Empty;

    /// <summary>
    /// Requested asset type (laptop, desktop, monitor, etc.)
    /// </summary>
    public string AssetType { get; set; } = string.Empty;

    /// <summary>
    /// Optional notes for the request
    /// </summary>
    public string? Notes { get; set; }

    /// <summary>
    /// Current status of the request
    /// </summary>
    public AssetRequestStatus Status { get; set; } = AssetRequestStatus.Pending;

    /// <summary>
    /// ID of the asset assigned to fulfill this request (if completed)
    /// </summary>
    public int? AssignedAssetId { get; set; }

    /// <summary>
    /// Navigation property to the assigned asset
    /// </summary>
    public Asset? AssignedAsset { get; set; }

    /// <summary>
    /// User who created the request
    /// </summary>
    public string CreatedBy { get; set; } = string.Empty;

    /// <summary>
    /// When the request was created
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// User who last modified the request
    /// </summary>
    public string? ModifiedBy { get; set; }

    /// <summary>
    /// When the request was last modified
    /// </summary>
    public DateTime? ModifiedAt { get; set; }

    /// <summary>
    /// When the request was completed
    /// </summary>
    public DateTime? CompletedAt { get; set; }
}

/// <summary>
/// Type of asset request
/// </summary>
public enum AssetRequestType
{
    Onboarding = 0,
    Offboarding = 1
}

/// <summary>
/// Status of asset request
/// </summary>
public enum AssetRequestStatus
{
    Pending = 0,
    Approved = 1,
    InProgress = 2,
    Completed = 3,
    Cancelled = 4,
    Rejected = 5
}

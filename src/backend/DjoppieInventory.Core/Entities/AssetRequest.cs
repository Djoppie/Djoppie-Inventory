namespace DjoppieInventory.Core.Entities;

/// <summary>
/// Represents an asset request for on/offboarding planning
/// </summary>
public class AssetRequest
{
    public int Id { get; set; }

    public AssetRequestType RequestType { get; set; }
    public AssetRequestStatus Status { get; set; } = AssetRequestStatus.Pending;

    /// <summary>
    /// Free-text identifier for the employee (name/email).
    /// Always populated at intake; may be present even before the Entra account exists.
    /// </summary>
    public string RequestedFor { get; set; } = string.Empty;

    /// <summary>
    /// FK to the Employee record once it exists. Populated either manually or
    /// via OrganizationSyncService.LinkPendingAssetRequestsAsync().
    /// </summary>
    public int? EmployeeId { get; set; }
    public Employee? Employee { get; set; }

    public DateTime RequestedDate { get; set; }

    /// <summary>
    /// Optional: where the employee will be seated (onboarding) or was seated (offboarding).
    /// Informational only; no occupancy mutation happens on completion.
    /// </summary>
    public int? PhysicalWorkplaceId { get; set; }
    public PhysicalWorkplace? PhysicalWorkplace { get; set; }

    public string? Notes { get; set; }

    public string CreatedBy { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public string? ModifiedBy { get; set; }
    public DateTime? ModifiedAt { get; set; }
    public DateTime? CompletedAt { get; set; }

    public ICollection<AssetRequestLine> Lines { get; set; } = new List<AssetRequestLine>();
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

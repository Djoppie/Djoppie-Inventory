namespace DjoppieInventory.Core.Entities;

/// <summary>
/// Represents the current status of a lease contract
/// </summary>
public enum LeaseStatus
{
    /// <summary>
    /// Lease is currently active
    /// </summary>
    Active = 0,

    /// <summary>
    /// Lease is expiring soon (within 90 days of end date)
    /// </summary>
    Expiring = 1,

    /// <summary>
    /// Lease has expired (past end date)
    /// </summary>
    Expired = 2,

    /// <summary>
    /// Lease was terminated early
    /// </summary>
    Terminated = 3,

    /// <summary>
    /// Lease was renewed with a new contract
    /// </summary>
    Renewed = 4
}

/// <summary>
/// Represents a lease/lifecycle contract for an asset.
/// Tracks leasing arrangements, warranties, or lifecycle management for assets.
/// </summary>
public class LeaseContract
{
    /// <summary>
    /// Unique identifier for the lease contract
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// Foreign key to the asset this lease applies to
    /// </summary>
    public int AssetId { get; set; }

    /// <summary>
    /// External contract number or reference from the vendor/leasing company (optional)
    /// </summary>
    public string? ContractNumber { get; set; }

    /// <summary>
    /// Name of the leasing company or vendor (optional)
    /// </summary>
    public string? Vendor { get; set; }

    /// <summary>
    /// When the lease contract starts
    /// </summary>
    public DateTime StartDate { get; set; }

    /// <summary>
    /// When the lease contract ends
    /// </summary>
    public DateTime EndDate { get; set; }

    /// <summary>
    /// Monthly lease rate or payment (optional)
    /// </summary>
    public decimal? MonthlyRate { get; set; }

    /// <summary>
    /// Total value of the contract over its lifetime (optional)
    /// </summary>
    public decimal? TotalValue { get; set; }

    /// <summary>
    /// Current status of the lease contract
    /// </summary>
    public LeaseStatus Status { get; set; } = LeaseStatus.Active;

    /// <summary>
    /// Optional notes about the lease contract
    /// </summary>
    public string? Notes { get; set; }

    /// <summary>
    /// Timestamp when the lease contract was created in the system
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Timestamp when the lease contract was last updated
    /// </summary>
    public DateTime? UpdatedAt { get; set; }

    /// <summary>
    /// The asset this lease contract applies to
    /// </summary>
    public Asset Asset { get; set; } = null!;
}

namespace DjoppieInventory.Core.Entities;

/// <summary>
/// Represents a leasing contract (a "Lease schedule" in supplier terminology).
/// Groups one or more <see cref="Asset"/>s under a shared planned lease end date.
/// Typically a 4-year contract with a vendor (e.g. Inetum) for a batch of laptops.
/// </summary>
public class LeaseContract
{
    public int Id { get; set; }

    /// <summary>
    /// Supplier-provided lease schedule identifier (e.g. "6025209").
    /// Treated as the natural key for CSV upserts.
    /// </summary>
    public string LeaseScheduleNumber { get; set; } = string.Empty;

    /// <summary>
    /// Vendor name (e.g. "Inetum Belgium NV").
    /// </summary>
    public string VendorName { get; set; } = string.Empty;

    /// <summary>
    /// Customer/billing entity from the supplier CSV (e.g. "PAYU: Diepenbeek").
    /// </summary>
    public string? Customer { get; set; }

    /// <summary>
    /// Contract status at the contract level (e.g. "In lease").
    /// Per-asset lease status lives on <see cref="Asset.LeaseStatus"/>.
    /// </summary>
    public string? ContractStatus { get; set; }

    /// <summary>
    /// Planned lease end date — source of truth for return-deadline thresholds.
    /// All assets under this contract share this date.
    /// </summary>
    public DateTime PlannedLeaseEnd { get; set; }

    /// <summary>
    /// Optional free-text notes.
    /// </summary>
    public string? Notes { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    /// <summary>
    /// Assets linked to this contract.
    /// </summary>
    public ICollection<Asset> Assets { get; set; } = new List<Asset>();
}

/// <summary>
/// Per-asset status within a lease contract.
/// Reflects the supplier "Contract status" column on a per-row basis.
/// </summary>
public enum LeaseStatus
{
    /// <summary>Asset is not (or no longer) part of any lease contract.</summary>
    None = 0,

    /// <summary>Asset is actively leased and counts toward billing.</summary>
    InLease = 1,

    /// <summary>Asset has been returned to the supplier — no longer billed.</summary>
    Returned = 2,

    /// <summary>Lease was cancelled.</summary>
    Cancelled = 3,
}

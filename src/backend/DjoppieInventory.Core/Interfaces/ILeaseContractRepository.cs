using DjoppieInventory.Core.Entities;

namespace DjoppieInventory.Core.Interfaces;

/// <summary>
/// Repository interface for LeaseContract data access operations
/// </summary>
public interface ILeaseContractRepository
{
    /// <summary>
    /// Gets all lease contracts for a specific asset
    /// </summary>
    Task<IEnumerable<LeaseContract>> GetByAssetIdAsync(int assetId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets a single lease contract by its ID
    /// </summary>
    Task<LeaseContract?> GetByIdAsync(int id, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets the currently active lease contract for an asset (if any).
    /// Returns null if no active lease exists.
    /// </summary>
    Task<LeaseContract?> GetActiveLeaseForAssetAsync(int assetId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets all leases that are expiring within the specified number of days.
    /// Default is 90 days. Returns leases with Status = Active or Expiring.
    /// </summary>
    Task<IEnumerable<LeaseContract>> GetExpiringLeasesAsync(int daysAhead = 90, CancellationToken cancellationToken = default);

    /// <summary>
    /// Creates a new lease contract
    /// </summary>
    Task<LeaseContract> CreateAsync(LeaseContract leaseContract, CancellationToken cancellationToken = default);

    /// <summary>
    /// Updates an existing lease contract
    /// </summary>
    Task<LeaseContract> UpdateAsync(LeaseContract leaseContract, CancellationToken cancellationToken = default);

    /// <summary>
    /// Deletes a lease contract.
    /// Returns true if successful, false if not found.
    /// </summary>
    Task<bool> DeleteAsync(int id, CancellationToken cancellationToken = default);
}

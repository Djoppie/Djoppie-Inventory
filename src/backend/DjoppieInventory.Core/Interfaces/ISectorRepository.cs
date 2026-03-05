using DjoppieInventory.Core.Entities;

namespace DjoppieInventory.Core.Interfaces;

/// <summary>
/// Repository interface for Sector data access operations
/// </summary>
public interface ISectorRepository
{
    /// <summary>
    /// Gets all sectors, optionally including inactive ones.
    /// Results are ordered by SortOrder.
    /// </summary>
    Task<IEnumerable<Sector>> GetAllAsync(bool includeInactive = false, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets a single sector by its ID
    /// </summary>
    Task<Sector?> GetByIdAsync(int id, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets a single sector by its code (e.g., "ORG", "RUI", "ZOR")
    /// </summary>
    Task<Sector?> GetByCodeAsync(string code, CancellationToken cancellationToken = default);

    /// <summary>
    /// Creates a new sector
    /// </summary>
    Task<Sector> CreateAsync(Sector sector, CancellationToken cancellationToken = default);

    /// <summary>
    /// Updates an existing sector
    /// </summary>
    Task<Sector> UpdateAsync(Sector sector, CancellationToken cancellationToken = default);

    /// <summary>
    /// Soft deletes a sector by setting IsActive to false.
    /// Returns true if successful, false if not found.
    /// </summary>
    Task<bool> DeleteAsync(int id, CancellationToken cancellationToken = default);

    /// <summary>
    /// Checks if a sector code already exists.
    /// Can exclude a specific ID for update operations.
    /// </summary>
    Task<bool> CodeExistsAsync(string code, int? excludeId = null, CancellationToken cancellationToken = default);
}

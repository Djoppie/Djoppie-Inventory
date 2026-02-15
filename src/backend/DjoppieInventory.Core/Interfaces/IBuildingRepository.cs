using DjoppieInventory.Core.Entities;

namespace DjoppieInventory.Core.Interfaces;

/// <summary>
/// Repository interface for Building data access operations
/// </summary>
public interface IBuildingRepository
{
    /// <summary>
    /// Gets all buildings, optionally including inactive ones.
    /// Results are ordered by SortOrder.
    /// </summary>
    Task<IEnumerable<Building>> GetAllAsync(bool includeInactive = false, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets a single building by its ID
    /// </summary>
    Task<Building?> GetByIdAsync(int id, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets a single building by its code (e.g., "DBK", "WZC")
    /// </summary>
    Task<Building?> GetByCodeAsync(string code, CancellationToken cancellationToken = default);

    /// <summary>
    /// Creates a new building
    /// </summary>
    Task<Building> CreateAsync(Building building, CancellationToken cancellationToken = default);

    /// <summary>
    /// Updates an existing building
    /// </summary>
    Task<Building> UpdateAsync(Building building, CancellationToken cancellationToken = default);

    /// <summary>
    /// Soft deletes a building by setting IsActive to false.
    /// Returns true if successful, false if not found.
    /// </summary>
    Task<bool> DeleteAsync(int id, CancellationToken cancellationToken = default);

    /// <summary>
    /// Checks if a building code already exists.
    /// Can exclude a specific ID for update operations.
    /// </summary>
    Task<bool> CodeExistsAsync(string code, int? excludeId = null, CancellationToken cancellationToken = default);
}

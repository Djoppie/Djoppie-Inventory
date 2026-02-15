using DjoppieInventory.Core.Entities;

namespace DjoppieInventory.Core.Interfaces;

/// <summary>
/// Repository interface for Service data access operations
/// </summary>
public interface IServiceRepository
{
    /// <summary>
    /// Gets all services, optionally including inactive ones and filtering by sector.
    /// Results are ordered by SortOrder.
    /// </summary>
    Task<IEnumerable<Service>> GetAllAsync(bool includeInactive = false, int? sectorId = null, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets a single service by its ID
    /// </summary>
    Task<Service?> GetByIdAsync(int id, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets a single service by its code (e.g., "IT", "FIN", "BZ")
    /// </summary>
    Task<Service?> GetByCodeAsync(string code, CancellationToken cancellationToken = default);

    /// <summary>
    /// Creates a new service
    /// </summary>
    Task<Service> CreateAsync(Service service, CancellationToken cancellationToken = default);

    /// <summary>
    /// Updates an existing service
    /// </summary>
    Task<Service> UpdateAsync(Service service, CancellationToken cancellationToken = default);

    /// <summary>
    /// Soft deletes a service by setting IsActive to false.
    /// Returns true if successful, false if not found.
    /// </summary>
    Task<bool> DeleteAsync(int id, CancellationToken cancellationToken = default);

    /// <summary>
    /// Checks if a service code already exists.
    /// Can exclude a specific ID for update operations.
    /// </summary>
    Task<bool> CodeExistsAsync(string code, int? excludeId = null, CancellationToken cancellationToken = default);
}

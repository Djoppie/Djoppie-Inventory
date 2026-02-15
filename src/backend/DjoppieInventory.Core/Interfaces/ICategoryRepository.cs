using DjoppieInventory.Core.Entities;

namespace DjoppieInventory.Core.Interfaces;

/// <summary>
/// Repository interface for Category data access operations
/// </summary>
public interface ICategoryRepository
{
    /// <summary>
    /// Gets all categories, optionally including inactive ones.
    /// Results are ordered by SortOrder.
    /// </summary>
    Task<IEnumerable<Category>> GetAllAsync(bool includeInactive = false, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets a single category by its ID, including its asset types
    /// </summary>
    Task<Category?> GetByIdAsync(int id, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets a single category by its code (e.g., "COMP", "WORK", "NET")
    /// </summary>
    Task<Category?> GetByCodeAsync(string code, CancellationToken cancellationToken = default);

    /// <summary>
    /// Creates a new category
    /// </summary>
    Task<Category> CreateAsync(Category category, CancellationToken cancellationToken = default);

    /// <summary>
    /// Updates an existing category
    /// </summary>
    Task<Category> UpdateAsync(Category category, CancellationToken cancellationToken = default);

    /// <summary>
    /// Soft deletes a category by setting IsActive to false.
    /// Returns true if successful, false if not found.
    /// </summary>
    Task<bool> DeleteAsync(int id, CancellationToken cancellationToken = default);

    /// <summary>
    /// Checks if a category code already exists.
    /// Can exclude a specific ID for update operations.
    /// </summary>
    Task<bool> CodeExistsAsync(string code, int? excludeId = null, CancellationToken cancellationToken = default);
}

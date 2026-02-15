using DjoppieInventory.Core.Entities;

namespace DjoppieInventory.Core.Interfaces;

/// <summary>
/// Repository interface for AssetType data access operations
/// </summary>
public interface IAssetTypeRepository
{
    /// <summary>
    /// Gets all asset types, optionally including inactive ones.
    /// Results are ordered by SortOrder.
    /// </summary>
    Task<IEnumerable<AssetType>> GetAllAsync(bool includeInactive = false, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets a single asset type by its ID
    /// </summary>
    Task<AssetType?> GetByIdAsync(int id, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets a single asset type by its code (e.g., "LAP", "DESK")
    /// </summary>
    Task<AssetType?> GetByCodeAsync(string code, CancellationToken cancellationToken = default);

    /// <summary>
    /// Creates a new asset type
    /// </summary>
    Task<AssetType> CreateAsync(AssetType assetType, CancellationToken cancellationToken = default);

    /// <summary>
    /// Updates an existing asset type
    /// </summary>
    Task<AssetType> UpdateAsync(AssetType assetType, CancellationToken cancellationToken = default);

    /// <summary>
    /// Soft deletes an asset type by setting IsActive to false.
    /// Returns true if successful, false if not found.
    /// </summary>
    Task<bool> DeleteAsync(int id, CancellationToken cancellationToken = default);

    /// <summary>
    /// Checks if an asset type code already exists.
    /// Can exclude a specific ID for update operations.
    /// </summary>
    Task<bool> CodeExistsAsync(string code, int? excludeId = null, CancellationToken cancellationToken = default);
}

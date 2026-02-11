using DjoppieInventory.Core.Entities;

namespace DjoppieInventory.Core.Interfaces;

/// <summary>
/// Repository interface for Asset data access operations
/// </summary>
public interface IAssetRepository
{
    Task<IEnumerable<Asset>> GetAllAsync(string? statusFilter = null, CancellationToken cancellationToken = default);
    Task<Asset?> GetByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<Asset?> GetByAssetCodeAsync(string assetCode, CancellationToken cancellationToken = default);
    Task<Asset> CreateAsync(Asset asset, CancellationToken cancellationToken = default);
    Task<Asset> UpdateAsync(Asset asset, CancellationToken cancellationToken = default);
    Task<bool> DeleteAsync(int id, CancellationToken cancellationToken = default);
    Task<bool> AssetCodeExistsAsync(string assetCode, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets the next available asset number for a given prefix.
    /// For normal assets: 1-8999
    /// For dummy assets: 9000+
    /// </summary>
    Task<int> GetNextAssetNumberAsync(string prefix, bool isDummy = false, CancellationToken cancellationToken = default);

    /// <summary>
    /// Checks if a serial number already exists in the system.
    /// </summary>
    Task<bool> SerialNumberExistsAsync(string serialNumber, int? excludeAssetId = null, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets an asset by its serial number
    /// </summary>
    Task<Asset?> GetBySerialNumberAsync(string serialNumber, CancellationToken cancellationToken = default);
}

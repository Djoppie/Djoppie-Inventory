using DjoppieInventory.Core.Entities;

namespace DjoppieInventory.Core.Interfaces;

public interface IAssetRepository
{
    Task<IEnumerable<Asset>> GetAllAsync(string? statusFilter = null);
    Task<Asset?> GetByIdAsync(int id);
    Task<Asset?> GetByAssetCodeAsync(string assetCode);
    Task<Asset> CreateAsync(Asset asset);
    Task<Asset> UpdateAsync(Asset asset);
    Task<bool> DeleteAsync(int id);
    Task<bool> AssetCodeExistsAsync(string assetCode);

    /// <summary>
    /// Gets the next available asset number for a given prefix.
    /// For normal assets: 1-8999
    /// For dummy assets: 9000+
    /// </summary>
    Task<int> GetNextAssetNumberAsync(string prefix, bool isDummy = false);

    /// <summary>
    /// Checks if a serial number already exists in the system.
    /// </summary>
    Task<bool> SerialNumberExistsAsync(string serialNumber, int? excludeAssetId = null);

    /// <summary>
    /// Gets an asset by its serial number
    /// </summary>
    Task<Asset?> GetBySerialNumberAsync(string serialNumber);
}

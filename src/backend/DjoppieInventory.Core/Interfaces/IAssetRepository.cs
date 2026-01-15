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
}

using DjoppieInventory.Core.Entities;

namespace DjoppieInventory.Core.Interfaces;

public interface IAssetTemplateRepository
{
    Task<IEnumerable<AssetTemplate>> GetAllAsync();
    Task<AssetTemplate?> GetByIdAsync(int id);
    Task<AssetTemplate> CreateAsync(AssetTemplate template);
    Task<AssetTemplate> UpdateAsync(AssetTemplate template);
    Task DeleteAsync(int id);
}

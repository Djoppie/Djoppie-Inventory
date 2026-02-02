using DjoppieInventory.Core.Entities;

namespace DjoppieInventory.Core.Interfaces;

public interface IAssetTemplateRepository
{
    Task<IEnumerable<AssetTemplate>> GetAllAsync();
    Task<AssetTemplate?> GetByIdAsync(int id);
}

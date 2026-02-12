using DjoppieInventory.Core.Entities;

namespace DjoppieInventory.Core.Interfaces;

/// <summary>
/// Repository interface for AssetTemplate data access operations
/// </summary>
public interface IAssetTemplateRepository
{
    Task<IEnumerable<AssetTemplate>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<AssetTemplate?> GetByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<AssetTemplate> CreateAsync(AssetTemplate template, CancellationToken cancellationToken = default);
    Task<AssetTemplate> UpdateAsync(AssetTemplate template, CancellationToken cancellationToken = default);
    Task DeleteAsync(int id, CancellationToken cancellationToken = default);
}

using DjoppieInventory.Core.Entities;

namespace DjoppieInventory.Core.Interfaces;

public interface IAssetRequestRepository
{
    Task<IEnumerable<AssetRequest>> GetAllAsync();
    Task<AssetRequest?> GetByIdAsync(int id);
    Task<IEnumerable<AssetRequest>> GetByDateRangeAsync(DateTime startDate, DateTime endDate);
    Task<IEnumerable<AssetRequest>> GetByStatusAsync(AssetRequestStatus status);
    Task<AssetRequest> CreateAsync(AssetRequest request);
    Task<AssetRequest> UpdateAsync(AssetRequest request);
    Task DeleteAsync(int id);
    Task<int> GetPendingCountAsync();
    Task<int> GetCountByTypeAsync(AssetRequestType type);
}

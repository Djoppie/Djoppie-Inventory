using DjoppieInventory.Core.Entities;

namespace DjoppieInventory.Core.Interfaces;

public class AssetRequestFilter
{
    public AssetRequestType? Type { get; set; }
    public List<AssetRequestStatus>? Statuses { get; set; }
    public DateTime? DateFrom { get; set; }
    public DateTime? DateTo { get; set; }
    public int? EmployeeId { get; set; }
    public string? SearchQuery { get; set; }
}

public class AssetRequestStatistics
{
    public int ActiveRequests { get; set; }
    public int MonthlyRequests { get; set; }
    public int InProgressRequests { get; set; }
}

public interface IAssetRequestRepository
{
    Task<IEnumerable<AssetRequest>> QueryAsync(AssetRequestFilter filter, CancellationToken cancellationToken = default);
    Task<AssetRequest?> GetByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<AssetRequest> CreateAsync(AssetRequest request, CancellationToken cancellationToken = default);
    Task<AssetRequest> UpdateAsync(AssetRequest request, CancellationToken cancellationToken = default);
    Task DeleteAsync(int id, CancellationToken cancellationToken = default);

    Task<AssetRequestLine> AddLineAsync(AssetRequestLine line, CancellationToken cancellationToken = default);
    Task<AssetRequestLine> UpdateLineAsync(AssetRequestLine line, CancellationToken cancellationToken = default);
    Task DeleteLineAsync(int lineId, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<AssetRequest>> GetUnlinkedAsync(CancellationToken cancellationToken = default);

    Task<AssetRequestStatistics> GetStatisticsAsync(CancellationToken cancellationToken = default);
}

using DjoppieInventory.Core.Entities;
using Microsoft.EntityFrameworkCore.Storage;

namespace DjoppieInventory.Core.Interfaces;

/// <summary>
/// Repository interface for Asset data access operations
/// </summary>
public interface IAssetRepository
{
    Task<IEnumerable<Asset>> GetAllAsync(string? statusFilter = null, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets a paginated list of assets with optional status filter.
    /// </summary>
    Task<(IEnumerable<Asset> Items, int TotalCount)> GetPagedAsync(
        string? statusFilter = null,
        int pageNumber = 1,
        int pageSize = 50,
        CancellationToken cancellationToken = default);
    Task<Asset?> GetByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<Asset?> GetByAssetCodeAsync(string assetCode, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets multiple assets by their IDs in a single query.
    /// </summary>
    Task<IEnumerable<Asset>> GetByIdsAsync(IEnumerable<int> ids, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets all assets assigned to a specific employee.
    /// </summary>
    Task<IEnumerable<Asset>> GetByEmployeeIdAsync(int employeeId, CancellationToken cancellationToken = default);

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

    /// <summary>
    /// Creates multiple assets in a single database operation.
    /// More efficient than calling CreateAsync multiple times.
    /// </summary>
    Task<IEnumerable<Asset>> BulkCreateAsync(IEnumerable<Asset> assets, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets all existing asset codes for a given prefix.
    /// Used for efficient bulk operations to avoid N+1 queries.
    /// </summary>
    Task<HashSet<string>> GetExistingAssetCodesAsync(string prefix, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets all serial numbers that start with a given prefix.
    /// Used for bulk operations to find the next available serial number.
    /// </summary>
    Task<IEnumerable<string>> GetSerialNumbersByPrefixAsync(string prefix, CancellationToken cancellationToken = default);

    /// <summary>
    /// Begins a database transaction for atomic operations.
    /// </summary>
    Task<IDbContextTransaction> BeginTransactionAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets all assets owned by a specific user (by email address).
    /// </summary>
    /// <param name="ownerEmail">The owner's email address</param>
    /// <param name="assetTypeCode">Optional asset type code filter</param>
    /// <param name="status">Optional status filter</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>List of assets owned by the user</returns>
    Task<IEnumerable<Asset>> GetByOwnerAsync(
        string ownerEmail,
        string? assetTypeCode = null,
        string? status = null,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets available laptops for assignment (status: Stock or Nieuw).
    /// </summary>
    /// <param name="search">Optional search term to filter by brand/model/serial</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>List of available laptop assets</returns>
    Task<IEnumerable<Asset>> GetAvailableLaptopsAsync(
        string? search = null,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Updates only the Intune-related fields on an asset.
    /// Uses direct SQL update to avoid EF tracking conflicts.
    /// </summary>
    /// <param name="assetId">The asset ID to update</param>
    /// <param name="enrollmentDate">Intune enrollment date</param>
    /// <param name="lastCheckIn">Last Intune check-in date</param>
    /// <param name="certificateExpiry">Management certificate expiry date</param>
    /// <param name="syncedAt">Timestamp of this sync</param>
    /// <param name="cancellationToken">Cancellation token</param>
    Task UpdateIntuneFieldsAsync(
        int assetId,
        DateTime? enrollmentDate,
        DateTime? lastCheckIn,
        DateTime? certificateExpiry,
        DateTime syncedAt,
        CancellationToken cancellationToken = default);
}

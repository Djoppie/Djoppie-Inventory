using DjoppieInventory.Core.DTOs;

namespace DjoppieInventory.Core.Interfaces;

/// <summary>
/// Service interface for asset business logic operations
/// </summary>
public interface IAssetService
{
    /// <summary>
    /// Gets all assets, optionally filtered by status
    /// </summary>
    Task<IEnumerable<AssetDto>> GetAssetsAsync(string? status = null);

    /// <summary>
    /// Gets a paginated list of assets with optional status filter.
    /// </summary>
    Task<PagedResultDto<AssetDto>> GetAssetsPagedAsync(
        string? status = null,
        int pageNumber = 1,
        int pageSize = 50,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets a single asset by its ID
    /// </summary>
    Task<AssetDto?> GetAssetByIdAsync(int id);

    /// <summary>
    /// Gets an asset by its unique asset code
    /// </summary>
    Task<AssetDto?> GetAssetByCodeAsync(string assetCode);

    /// <summary>
    /// Creates a new asset
    /// </summary>
    /// <param name="createAssetDto">Asset creation data</param>
    /// <param name="performedBy">Display name of the user creating the asset (for event tracking)</param>
    /// <param name="performedByEmail">Email address of the user creating the asset (for event tracking)</param>
    Task<AssetDto> CreateAssetAsync(CreateAssetDto createAssetDto, string? performedBy = null, string? performedByEmail = null);

    /// <summary>
    /// Updates an existing asset
    /// </summary>
    /// <param name="id">The asset ID</param>
    /// <param name="updateAssetDto">Updated asset data</param>
    /// <param name="performedBy">Display name of the user updating the asset (for event tracking)</param>
    /// <param name="performedByEmail">Email address of the user updating the asset (for event tracking)</param>
    Task<AssetDto> UpdateAssetAsync(int id, UpdateAssetDto updateAssetDto, string? performedBy = null, string? performedByEmail = null);

    /// <summary>
    /// Deletes an asset by ID
    /// </summary>
    Task<bool> DeleteAssetAsync(int id);

    /// <summary>
    /// Creates multiple assets in a single operation
    /// </summary>
    Task<BulkCreateAssetResultDto> BulkCreateAssetsAsync(BulkCreateAssetDto bulkCreateDto);

    /// <summary>
    /// Checks if a serial number already exists in the system.
    /// </summary>
    /// <param name="serialNumber">The serial number to check</param>
    /// <param name="excludeAssetId">Optional asset ID to exclude (for updates)</param>
    /// <returns>True if the serial number exists, false otherwise</returns>
    Task<bool> SerialNumberExistsAsync(string serialNumber, int? excludeAssetId = null);

    /// <summary>
    /// Gets an asset by its serial number
    /// </summary>
    Task<AssetDto?> GetAssetBySerialNumberAsync(string serialNumber);
}

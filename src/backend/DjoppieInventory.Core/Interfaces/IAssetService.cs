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
    Task<AssetDto> CreateAssetAsync(CreateAssetDto createAssetDto);

    /// <summary>
    /// Updates an existing asset
    /// </summary>
    Task<AssetDto> UpdateAssetAsync(int id, UpdateAssetDto updateAssetDto);

    /// <summary>
    /// Deletes an asset by ID
    /// </summary>
    Task<bool> DeleteAssetAsync(int id);

    /// <summary>
    /// Creates multiple assets in a single operation
    /// </summary>
    Task<BulkCreateAssetResultDto> BulkCreateAssetsAsync(BulkCreateAssetDto bulkCreateDto);

    /// <summary>
    /// Gets the next available asset number for a given prefix.
    /// For normal assets: 1-8999
    /// For dummy assets: 9000+
    /// </summary>
    Task<int> GetNextAssetNumberAsync(string prefix, bool isDummy = false);
}

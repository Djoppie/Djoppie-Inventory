using DjoppieInventory.Core.DTOs;

namespace DjoppieInventory.Core.Interfaces;

/// <summary>
/// Service interface for synchronizing Intune data to Asset entities.
/// Separates sync orchestration from Intune API operations.
/// </summary>
public interface IIntuneSyncService
{
    /// <summary>
    /// Syncs Intune data (enrollment date, last check-in, certificate expiry) to Asset entities.
    /// Uses batch fetching for efficiency - fetches all Intune devices once, then matches locally.
    /// </summary>
    /// <param name="assetIds">Optional: specific asset IDs to sync. If null, syncs all laptops/desktops with serial numbers.</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Result containing sync statistics</returns>
    Task<IntuneSyncResultDto> SyncIntuneDataToAssetsAsync(
        IEnumerable<int>? assetIds = null,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Syncs Intune data for a single asset by its ID.
    /// </summary>
    /// <param name="assetId">The asset ID to sync</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Result for the single asset sync</returns>
    Task<IntuneSyncItemResult> SyncSingleAssetAsync(
        int assetId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Imports Intune devices as new assets in the inventory.
    /// </summary>
    /// <param name="request">Import request with device IDs and asset type</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Import result with statistics and details</returns>
    Task<ImportIntuneDevicesResultDto> ImportIntuneDevicesAsync(
        ImportIntuneDevicesDto request,
        CancellationToken cancellationToken = default);
}

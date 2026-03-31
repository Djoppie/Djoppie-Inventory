using DjoppieInventory.Core.DTOs;
using DjoppieInventory.Core.Entities;
using DjoppieInventory.Core.Interfaces;
using Microsoft.Extensions.Logging;
using Microsoft.Graph.Models;

namespace DjoppieInventory.Infrastructure.Services;

/// <summary>
/// Service for synchronizing Intune data to Asset entities.
/// Uses batch fetching for efficiency - fetches all Intune devices once, then matches locally by serial number.
/// </summary>
public class IntuneSyncService : IIntuneSyncService
{
    private readonly IIntuneService _intuneService;
    private readonly IAssetRepository _assetRepository;
    private readonly IAssetEventService _assetEventService;
    private readonly ILogger<IntuneSyncService> _logger;

    public IntuneSyncService(
        IIntuneService intuneService,
        IAssetRepository assetRepository,
        IAssetEventService assetEventService,
        ILogger<IntuneSyncService> logger)
    {
        _intuneService = intuneService ?? throw new ArgumentNullException(nameof(intuneService));
        _assetRepository = assetRepository ?? throw new ArgumentNullException(nameof(assetRepository));
        _assetEventService = assetEventService ?? throw new ArgumentNullException(nameof(assetEventService));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    /// <inheritdoc/>
    public async Task<IntuneSyncResultDto> SyncIntuneDataToAssetsAsync(
        IEnumerable<int>? assetIds = null,
        CancellationToken cancellationToken = default)
    {
        var result = new IntuneSyncResultDto
        {
            StartedAt = DateTime.UtcNow
        };

        try
        {
            _logger.LogInformation("Starting Intune data sync for assets");

            // Step 1: Get assets to sync
            var assetsToSync = await GetAssetsToSyncAsync(assetIds, cancellationToken);
            var assetsList = assetsToSync.ToList();
            result.TotalProcessed = assetsList.Count;

            if (assetsList.Count == 0)
            {
                _logger.LogInformation("No assets to sync");
                result.CompletedAt = DateTime.UtcNow;
                return result;
            }

            _logger.LogInformation("Found {Count} assets to sync with Intune", assetsList.Count);

            // Step 2: Batch fetch all Intune devices (ONE API call instead of N)
            var intuneDevices = await FetchAllIntuneDevicesAsync();

            // Step 3: Build lookup dictionary by serial number (case-insensitive)
            var deviceLookup = BuildDeviceLookup(intuneDevices);
            _logger.LogInformation("Fetched {Count} Intune devices for matching", deviceLookup.Count);

            // Step 4: Process each asset using local lookup (no additional API calls)
            foreach (var asset in assetsList)
            {
                var itemResult = await ProcessAssetSyncAsync(asset, deviceLookup, cancellationToken);
                result.Items.Add(itemResult);

                switch (itemResult.Status)
                {
                    case "Success":
                        result.SuccessCount++;
                        break;
                    case "NotFound":
                        result.NotFoundCount++;
                        break;
                    case "Error":
                        result.ErrorCount++;
                        result.Errors.Add($"Asset {asset.AssetCode}: {itemResult.ErrorMessage}");
                        break;
                    case "Skipped":
                        result.SkippedCount++;
                        break;
                }
            }

            result.CompletedAt = DateTime.UtcNow;

            _logger.LogInformation(
                "Intune sync completed. Total: {Total}, Success: {Success}, NotFound: {NotFound}, Errors: {Errors}, Skipped: {Skipped}, Duration: {Duration}ms",
                result.TotalProcessed, result.SuccessCount, result.NotFoundCount, result.ErrorCount, result.SkippedCount,
                result.Duration.TotalMilliseconds);

            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Fatal error during Intune data sync");
            result.CompletedAt = DateTime.UtcNow;
            result.Errors.Add($"Fatal error: {ex.Message}");
            return result;
        }
    }

    /// <inheritdoc/>
    public async Task<IntuneSyncItemResult> SyncSingleAssetAsync(
        int assetId,
        CancellationToken cancellationToken = default)
    {
        var asset = await _assetRepository.GetByIdAsync(assetId, cancellationToken);

        if (asset == null)
        {
            return new IntuneSyncItemResult
            {
                AssetId = assetId,
                AssetCode = "Unknown",
                Status = "Error",
                ErrorMessage = "Asset not found"
            };
        }

        // For single asset, we use direct lookup (acceptable for single items)
        var itemResult = new IntuneSyncItemResult
        {
            AssetId = asset.Id,
            AssetCode = asset.AssetCode,
            SerialNumber = asset.SerialNumber
        };

        if (string.IsNullOrWhiteSpace(asset.SerialNumber))
        {
            itemResult.Status = "Skipped";
            itemResult.ErrorMessage = "No serial number";
            return itemResult;
        }

        if (asset.Category != "Laptop" && asset.Category != "Desktop")
        {
            itemResult.Status = "Skipped";
            itemResult.ErrorMessage = $"Not a laptop or desktop (category: {asset.Category})";
            return itemResult;
        }

        try
        {
            var device = await _intuneService.GetDeviceBySerialNumberAsync(asset.SerialNumber);

            if (device == null)
            {
                itemResult.Status = "NotFound";
                itemResult.ErrorMessage = "Device not found in Intune";
                return itemResult;
            }

            await UpdateAssetWithIntuneDataAsync(asset, device, cancellationToken);

            itemResult.Status = "Success";
            itemResult.IntuneEnrollmentDate = asset.IntuneEnrollmentDate;
            itemResult.IntuneLastCheckIn = asset.IntuneLastCheckIn;
            itemResult.IntuneCertificateExpiry = asset.IntuneCertificateExpiry;

            return itemResult;
        }
        catch (Exception ex)
        {
            itemResult.Status = "Error";
            itemResult.ErrorMessage = ex.Message;
            _logger.LogWarning(ex, "Error syncing Intune data for asset {AssetCode}", asset.AssetCode);
            return itemResult;
        }
    }

    /// <inheritdoc/>
    public async Task<ImportIntuneDevicesResultDto> ImportIntuneDevicesAsync(
        ImportIntuneDevicesDto request,
        CancellationToken cancellationToken = default)
    {
        var result = new ImportIntuneDevicesResultDto
        {
            TotalRequested = request.DeviceIds.Count
        };

        if (request.DeviceIds.Count == 0)
        {
            _logger.LogInformation("No devices to import");
            return result;
        }

        _logger.LogInformation("Starting import of {Count} Intune devices", request.DeviceIds.Count);

        // Fetch all Intune devices once
        var allDevices = await FetchAllIntuneDevicesAsync();
        var deviceLookup = allDevices.ToDictionary(d => d.Id ?? "", d => d);

        // Get existing serial numbers to avoid duplicates
        var existingSerialNumbers = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        var allAssets = await _assetRepository.GetAllAsync(cancellationToken: cancellationToken);
        foreach (var asset in allAssets.Where(a => !string.IsNullOrWhiteSpace(a.SerialNumber)))
        {
            existingSerialNumbers.Add(asset.SerialNumber!);
        }

        // Get asset prefix for generating asset codes
        var assetPrefix = "LAP"; // Default for laptops
        var existingAssetCodes = await _assetRepository.GetExistingAssetCodesAsync(assetPrefix, cancellationToken);
        var nextAssetNumber = await _assetRepository.GetNextAssetNumberAsync(assetPrefix, false, cancellationToken);

        var assetsToCreate = new List<Asset>();

        foreach (var deviceId in request.DeviceIds)
        {
            // Check if device exists in Intune
            if (!deviceLookup.TryGetValue(deviceId, out var device))
            {
                result.FailedDevices.Add(new FailedDeviceInfo
                {
                    DeviceId = deviceId,
                    DeviceName = "Unknown",
                    Error = "Device not found in Intune"
                });
                result.Failed++;
                continue;
            }

            var deviceName = device.DeviceName ?? "Unknown";
            var serialNumber = device.SerialNumber?.Trim() ?? "";

            // Skip devices without serial numbers - they can't be uniquely identified
            if (string.IsNullOrWhiteSpace(serialNumber))
            {
                result.SkippedDevices.Add(new SkippedDeviceInfo
                {
                    DeviceId = deviceId,
                    DeviceName = deviceName,
                    SerialNumber = "",
                    Reason = "Device has no serial number"
                });
                result.Skipped++;
                continue;
            }

            // Check if serial number already exists in inventory or in current batch
            if (existingSerialNumbers.Contains(serialNumber))
            {
                result.SkippedDevices.Add(new SkippedDeviceInfo
                {
                    DeviceId = deviceId,
                    DeviceName = deviceName,
                    SerialNumber = serialNumber,
                    Reason = "Serial number already exists in inventory"
                });
                result.Skipped++;
                continue;
            }

            // Generate asset code
            var assetCode = $"{assetPrefix}{nextAssetNumber:D4}";
            while (existingAssetCodes.Contains(assetCode))
            {
                nextAssetNumber++;
                assetCode = $"{assetPrefix}{nextAssetNumber:D4}";
            }
            existingAssetCodes.Add(assetCode);
            nextAssetNumber++;

            // Create the asset
            var newAsset = new Asset
            {
                AssetCode = assetCode,
                AssetName = deviceName,
                SerialNumber = serialNumber,
                Brand = device.Manufacturer ?? "",
                Model = device.Model ?? "",
                Category = "Laptop",
                Status = Enum.TryParse<AssetStatus>(request.Status, true, out var status) ? status : AssetStatus.Stock,
                AssetTypeId = request.AssetTypeId,
                IntuneEnrollmentDate = device.EnrolledDateTime?.DateTime,
                IntuneLastCheckIn = device.LastSyncDateTime?.DateTime,
                IntuneCertificateExpiry = device.ManagementCertificateExpirationDate?.DateTime,
                IntuneSyncedAt = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            assetsToCreate.Add(newAsset);

            // Track for result
            result.ImportedDevices.Add(new ImportedDeviceInfo
            {
                DeviceId = deviceId,
                DeviceName = deviceName,
                SerialNumber = serialNumber,
                AssetCode = assetCode,
                AssetId = 0 // Will be set after creation
            });

            // Add to existing serials to prevent duplicates within batch
            if (!string.IsNullOrWhiteSpace(serialNumber))
            {
                existingSerialNumbers.Add(serialNumber);
            }
        }

        // Bulk create assets
        if (assetsToCreate.Count > 0)
        {
            try
            {
                var createdAssets = await _assetRepository.BulkCreateAsync(assetsToCreate, cancellationToken);
                var createdList = createdAssets.ToList();

                // Update asset IDs in result
                for (int i = 0; i < result.ImportedDevices.Count && i < createdList.Count; i++)
                {
                    result.ImportedDevices[i].AssetId = createdList[i].Id;
                }

                result.Imported = createdList.Count;
                _logger.LogInformation("Successfully imported {Count} devices as assets", createdList.Count);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to create assets during import");
                // Move all pending imports to failed
                foreach (var imported in result.ImportedDevices.ToList())
                {
                    result.FailedDevices.Add(new FailedDeviceInfo
                    {
                        DeviceId = imported.DeviceId,
                        DeviceName = imported.DeviceName,
                        Error = $"Database error: {ex.Message}"
                    });
                }
                result.ImportedDevices.Clear();
                result.Failed += assetsToCreate.Count;
            }
        }

        _logger.LogInformation(
            "Intune import completed. Requested: {Total}, Imported: {Imported}, Skipped: {Skipped}, Failed: {Failed}",
            result.TotalRequested, result.Imported, result.Skipped, result.Failed);

        return result;
    }

    #region Private Methods

    private async Task<IEnumerable<Asset>> GetAssetsToSyncAsync(
        IEnumerable<int>? assetIds,
        CancellationToken cancellationToken)
    {
        if (assetIds != null && assetIds.Any())
        {
            return await _assetRepository.GetByIdsAsync(assetIds, cancellationToken);
        }

        // Get all assets with serial numbers that are laptops or desktops
        var allAssets = await _assetRepository.GetAllAsync(cancellationToken: cancellationToken);
        return allAssets.Where(a =>
            !string.IsNullOrWhiteSpace(a.SerialNumber) &&
            (a.Category == "Laptop" || a.Category == "Desktop"));
    }

    private async Task<IEnumerable<ManagedDevice>> FetchAllIntuneDevicesAsync()
    {
        try
        {
            return await _intuneService.GetManagedDevicesAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to fetch Intune devices for batch sync");
            throw new InvalidOperationException("Failed to fetch Intune devices", ex);
        }
    }

    private static Dictionary<string, ManagedDevice> BuildDeviceLookup(IEnumerable<ManagedDevice> devices)
    {
        var lookup = new Dictionary<string, ManagedDevice>(StringComparer.OrdinalIgnoreCase);

        foreach (var device in devices)
        {
            if (!string.IsNullOrWhiteSpace(device.SerialNumber) && !lookup.ContainsKey(device.SerialNumber))
            {
                lookup[device.SerialNumber] = device;
            }
        }

        return lookup;
    }

    private async Task<IntuneSyncItemResult> ProcessAssetSyncAsync(
        Asset asset,
        Dictionary<string, ManagedDevice> deviceLookup,
        CancellationToken cancellationToken)
    {
        var itemResult = new IntuneSyncItemResult
        {
            AssetId = asset.Id,
            AssetCode = asset.AssetCode,
            SerialNumber = asset.SerialNumber
        };

        // Validate asset
        if (string.IsNullOrWhiteSpace(asset.SerialNumber))
        {
            itemResult.Status = "Skipped";
            itemResult.ErrorMessage = "No serial number";
            return itemResult;
        }

        if (asset.Category != "Laptop" && asset.Category != "Desktop")
        {
            itemResult.Status = "Skipped";
            itemResult.ErrorMessage = $"Not a laptop or desktop (category: {asset.Category})";
            return itemResult;
        }

        // Lookup device in local dictionary (no API call)
        if (!deviceLookup.TryGetValue(asset.SerialNumber, out var device))
        {
            itemResult.Status = "NotFound";
            itemResult.ErrorMessage = "Device not found in Intune";
            _logger.LogDebug("Asset {AssetCode} with serial {Serial} not found in Intune",
                asset.AssetCode, asset.SerialNumber);
            return itemResult;
        }

        try
        {
            await UpdateAssetWithIntuneDataAsync(asset, device, cancellationToken);

            itemResult.Status = "Success";
            itemResult.IntuneEnrollmentDate = asset.IntuneEnrollmentDate;
            itemResult.IntuneLastCheckIn = asset.IntuneLastCheckIn;
            itemResult.IntuneCertificateExpiry = asset.IntuneCertificateExpiry;

            _logger.LogDebug("Synced Intune data for asset {AssetCode}: Enrollment={Enrollment}, LastCheckIn={LastCheckIn}",
                asset.AssetCode, asset.IntuneEnrollmentDate, asset.IntuneLastCheckIn);
        }
        catch (Exception ex)
        {
            itemResult.Status = "Error";
            itemResult.ErrorMessage = ex.Message;
            _logger.LogWarning(ex, "Error syncing Intune data for asset {AssetCode}", asset.AssetCode);
        }

        return itemResult;
    }

    private async Task UpdateAssetWithIntuneDataAsync(
        Asset asset,
        ManagedDevice device,
        CancellationToken cancellationToken)
    {
        // Check if this is a significant change (new enrollment = likely new user)
        var hadPreviousEnrollment = asset.IntuneEnrollmentDate.HasValue;
        var newEnrollmentDate = device.EnrolledDateTime?.DateTime;
        var enrollmentChanged = hadPreviousEnrollment &&
                                newEnrollmentDate.HasValue &&
                                asset.IntuneEnrollmentDate != newEnrollmentDate;

        // If enrollment date changed significantly, create a snapshot (device was re-enrolled)
        if (enrollmentChanged)
        {
            _logger.LogInformation(
                "Enrollment date changed for asset {AssetCode}: {OldDate} -> {NewDate}. Creating snapshot.",
                asset.AssetCode, asset.IntuneEnrollmentDate, newEnrollmentDate);

            await _assetEventService.CreateIntuneSnapshotEventAsync(
                asset,
                $"Before Intune re-enrollment (enrollment date changed from {asset.IntuneEnrollmentDate:yyyy-MM-dd} to {newEnrollmentDate:yyyy-MM-dd})",
                "System (Intune Sync)",
                null,
                cancellationToken);
        }

        // Extract Intune data from device
        var enrollmentDate = device.EnrolledDateTime?.DateTime;
        var lastCheckIn = device.LastSyncDateTime?.DateTime;
        var certificateExpiry = device.ManagementCertificateExpirationDate?.DateTime;
        var syncedAt = DateTime.UtcNow;

        // Update only Intune fields using direct SQL (avoids EF tracking conflicts)
        await _assetRepository.UpdateIntuneFieldsAsync(
            asset.Id,
            enrollmentDate,
            lastCheckIn,
            certificateExpiry,
            syncedAt,
            cancellationToken);

        // Update in-memory values for the result DTO
        asset.IntuneEnrollmentDate = enrollmentDate;
        asset.IntuneLastCheckIn = lastCheckIn;
        asset.IntuneCertificateExpiry = certificateExpiry;
        asset.IntuneSyncedAt = syncedAt;
    }

    #endregion
}

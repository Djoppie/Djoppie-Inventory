using AutoMapper;
using DjoppieInventory.Core.DTOs;
using DjoppieInventory.Core.Entities;
using DjoppieInventory.Core.Interfaces;
using Microsoft.Extensions.Logging;

namespace DjoppieInventory.Infrastructure.Services;

/// <summary>
/// Service for asset business logic operations
/// </summary>
public class AssetService : IAssetService
{
    private readonly IAssetRepository _assetRepository;
    private readonly IAssetEventService _assetEventService;
    private readonly IAssetCodeGenerator _codeGenerator;
    private readonly IAssetTypeRepository _assetTypeRepository;
    private readonly IMapper _mapper;
    private readonly ILogger<AssetService> _logger;

    public AssetService(
        IAssetRepository assetRepository,
        IAssetEventService assetEventService,
        IAssetCodeGenerator codeGenerator,
        IAssetTypeRepository assetTypeRepository,
        IMapper mapper,
        ILogger<AssetService> logger)
    {
        _assetRepository = assetRepository;
        _assetEventService = assetEventService;
        _codeGenerator = codeGenerator;
        _assetTypeRepository = assetTypeRepository;
        _mapper = mapper;
        _logger = logger;
    }

    public async Task<IEnumerable<AssetDto>> GetAssetsAsync(string? status = null)
    {
        var assets = await _assetRepository.GetAllAsync(status);
        return _mapper.Map<IEnumerable<AssetDto>>(assets);
    }

    public async Task<PagedResultDto<AssetDto>> GetAssetsPagedAsync(
        string? status = null,
        int pageNumber = 1,
        int pageSize = 50,
        CancellationToken cancellationToken = default)
    {
        var (assets, totalCount) = await _assetRepository.GetPagedAsync(status, pageNumber, pageSize, cancellationToken);

        return new PagedResultDto<AssetDto>
        {
            Items = _mapper.Map<IEnumerable<AssetDto>>(assets),
            TotalCount = totalCount,
            PageNumber = pageNumber,
            PageSize = pageSize
        };
    }

    public async Task<AssetDto?> GetAssetByIdAsync(int id)
    {
        var asset = await _assetRepository.GetByIdAsync(id);
        return asset == null ? null : _mapper.Map<AssetDto>(asset);
    }

    public async Task<AssetDto?> GetAssetByCodeAsync(string assetCode)
    {
        if (string.IsNullOrWhiteSpace(assetCode))
            throw new ArgumentException("Asset code cannot be empty", nameof(assetCode));

        var asset = await _assetRepository.GetByAssetCodeAsync(assetCode);
        return asset == null ? null : _mapper.Map<AssetDto>(asset);
    }

    public async Task<AssetDto> CreateAssetAsync(CreateAssetDto createAssetDto, string? performedBy = null, string? performedByEmail = null)
    {
        if (createAssetDto == null)
            throw new ArgumentNullException(nameof(createAssetDto));

        if (createAssetDto.AssetTypeId <= 0)
            throw new ArgumentException("Asset type is required", nameof(createAssetDto));

        // Auto-generate asset code: [DUM-]TYPE-YY-MERK-NUMMER
        // Year is calculated from purchase date (Nov/Dec uses next year)
        var assetCode = await _codeGenerator.GenerateCodeAsync(
            createAssetDto.AssetTypeId,
            createAssetDto.Brand,
            createAssetDto.PurchaseDate,
            createAssetDto.IsDummy);

        var asset = _mapper.Map<Asset>(createAssetDto);
        asset.AssetCode = assetCode;
        asset.IsDummy = createAssetDto.IsDummy;
        asset.AssetName ??= string.Empty;

        // Auto-derive category from AssetType name when not provided
        if (string.IsNullOrWhiteSpace(asset.Category))
        {
            var assetType = await _assetTypeRepository.GetByIdAsync(createAssetDto.AssetTypeId);
            asset.Category = assetType?.Name ?? string.Empty;
        }

        // Auto-generate alias if not provided: <AssetType>-<Owner>-<Brand>-<Model>
        if (string.IsNullOrWhiteSpace(asset.Alias))
        {
            asset.Alias = await GenerateAliasAsync(asset.AssetTypeId, asset.Owner, asset.Brand, asset.Model);
        }

        var createdAsset = await _assetRepository.CreateAsync(asset);

        _logger.LogInformation("Created asset {AssetCode} (IsDummy: {IsDummy}) with ID {AssetId}",
            createdAsset.AssetCode, createdAsset.IsDummy, createdAsset.Id);

        // Create "Created" event
        if (!string.IsNullOrWhiteSpace(performedBy))
        {
            await _assetEventService.CreateCreatedEventAsync(
                createdAsset.Id,
                performedBy,
                performedByEmail,
                notes: null,
                cancellationToken: default);
        }

        return _mapper.Map<AssetDto>(createdAsset);
    }

    public async Task<AssetDto> UpdateAssetAsync(int id, UpdateAssetDto updateAssetDto, string? performedBy = null, string? performedByEmail = null)
    {
        if (updateAssetDto == null)
            throw new ArgumentNullException(nameof(updateAssetDto));

        var existingAsset = await _assetRepository.GetByIdAsync(id);
        if (existingAsset == null)
        {
            throw new KeyNotFoundException($"Asset with ID {id} not found");
        }

        // Capture old values for event tracking
        var oldStatus = existingAsset.Status;
        var oldOwner = existingAsset.Owner;
        var oldBuilding = existingAsset.LegacyBuilding;

        _mapper.Map(updateAssetDto, existingAsset);

        // Explicitly handle nullable fields to allow clearing them (AutoMapper ignores null by default)
        // This ensures that when the frontend sends null, we actually set the field to null
        existingAsset.Owner = updateAssetDto.Owner;
        existingAsset.JobTitle = updateAssetDto.JobTitle;
        existingAsset.OfficeLocation = updateAssetDto.OfficeLocation;
        existingAsset.Brand = updateAssetDto.Brand;
        existingAsset.Model = updateAssetDto.Model;
        existingAsset.Alias = updateAssetDto.Alias;
        existingAsset.InstallationLocation = updateAssetDto.InstallationLocation;
        existingAsset.ServiceId = updateAssetDto.ServiceId;
        existingAsset.BuildingId = updateAssetDto.BuildingId;
        existingAsset.PhysicalWorkplaceId = updateAssetDto.PhysicalWorkplaceId;
        existingAsset.PurchaseDate = updateAssetDto.PurchaseDate;
        existingAsset.WarrantyExpiry = updateAssetDto.WarrantyExpiry;
        existingAsset.InstallationDate = updateAssetDto.InstallationDate;

        // Auto-generate alias if not provided: <AssetType>-<Owner>-<Brand>-<Model>
        if (string.IsNullOrWhiteSpace(existingAsset.Alias))
        {
            existingAsset.Alias = await GenerateAliasAsync(existingAsset.AssetTypeId, existingAsset.Owner, existingAsset.Brand, existingAsset.Model);
        }

        var updatedAsset = await _assetRepository.UpdateAsync(existingAsset);

        _logger.LogInformation("Updated asset {AssetCode} (ID: {AssetId})",
            updatedAsset.AssetCode, updatedAsset.Id);

        // Create events for significant changes (only if user information is provided)
        if (!string.IsNullOrWhiteSpace(performedBy))
        {
            // Status changed
            if (oldStatus != updatedAsset.Status)
            {
                await _assetEventService.CreateStatusChangedEventAsync(
                    updatedAsset.Id,
                    oldStatus,
                    updatedAsset.Status,
                    performedBy,
                    performedByEmail,
                    notes: null,
                    cancellationToken: default);
            }

            // Owner changed
            if (oldOwner != updatedAsset.Owner)
            {
                await _assetEventService.CreateOwnerChangedEventAsync(
                    updatedAsset.Id,
                    oldOwner,
                    updatedAsset.Owner,
                    performedBy,
                    performedByEmail,
                    notes: null,
                    cancellationToken: default);
            }

            // Building/Location changed
            if (oldBuilding != updatedAsset.LegacyBuilding)
            {
                await _assetEventService.CreateLocationChangedEventAsync(
                    updatedAsset.Id,
                    oldBuilding,
                    updatedAsset.LegacyBuilding,
                    performedBy,
                    performedByEmail,
                    notes: null,
                    cancellationToken: default);
            }
        }

        return _mapper.Map<AssetDto>(updatedAsset);
    }

    public async Task<bool> DeleteAssetAsync(int id)
    {
        var deleted = await _assetRepository.DeleteAsync(id);

        if (deleted)
        {
            _logger.LogInformation("Deleted asset with ID {AssetId}", id);
        }
        else
        {
            _logger.LogWarning("Attempted to delete non-existent asset with ID {AssetId}", id);
        }

        return deleted;
    }

    public async Task<BulkDeleteAssetsResultDto> BulkDeleteAssetsAsync(IEnumerable<int> assetIds)
    {
        var idList = assetIds.ToList();
        var result = new BulkDeleteAssetsResultDto
        {
            TotalRequested = idList.Count
        };

        foreach (var id in idList)
        {
            try
            {
                var deleted = await _assetRepository.DeleteAsync(id);
                if (deleted)
                {
                    result.DeletedIds.Add(id);
                    _logger.LogInformation("Bulk delete: Deleted asset with ID {AssetId}", id);
                }
                else
                {
                    result.FailedIds.Add(id);
                    result.Errors.Add($"Asset with ID {id} not found");
                    _logger.LogWarning("Bulk delete: Asset with ID {AssetId} not found", id);
                }
            }
            catch (Exception ex)
            {
                result.FailedIds.Add(id);
                result.Errors.Add($"Failed to delete asset {id}: {ex.Message}");
                _logger.LogError(ex, "Bulk delete: Error deleting asset with ID {AssetId}", id);
            }
        }

        result.DeletedCount = result.DeletedIds.Count;
        _logger.LogInformation("Bulk delete completed: {DeletedCount}/{TotalRequested} assets deleted",
            result.DeletedCount, result.TotalRequested);

        return result;
    }

    public async Task<BulkCreateAssetResultDto> BulkCreateAssetsAsync(BulkCreateAssetDto bulkCreateDto)
    {
        if (bulkCreateDto == null)
            throw new ArgumentNullException(nameof(bulkCreateDto));

        if (bulkCreateDto.AssetTypeId <= 0)
            throw new ArgumentException("Asset type is required", nameof(bulkCreateDto));

        // SerialNumberPrefix is optional - if not provided, assets will have no serial numbers

        if (bulkCreateDto.Quantity < 1 || bulkCreateDto.Quantity > 100)
            throw new ArgumentException("Quantity must be between 1 and 100", nameof(bulkCreateDto));

        var result = new BulkCreateAssetResultDto
        {
            TotalRequested = bulkCreateDto.Quantity
        };

        // Note: We don't use explicit transactions here because Azure SQL's EnableRetryOnFailure
        // execution strategy doesn't support user-initiated transactions. The BulkCreateAsync
        // uses AddRangeAsync + SaveChangesAsync which is atomic at the database level.

        // Generate all asset codes using the code generator
        // Year is calculated from purchase date (Nov/Dec uses next year)
        var codes = (await _codeGenerator.GenerateBulkCodesAsync(
            bulkCreateDto.AssetTypeId,
            bulkCreateDto.Brand,
            bulkCreateDto.PurchaseDate,
            bulkCreateDto.IsDummy,
            bulkCreateDto.Quantity)).ToList();

        // Parse status once
        var assetStatus = Enum.TryParse<AssetStatus>(bulkCreateDto.Status, true, out var status)
            ? status
            : AssetStatus.Stock;

        // Auto-derive category from AssetType name when not provided
        var category = bulkCreateDto.Category;
        if (string.IsNullOrWhiteSpace(category))
        {
            var assetType = await _assetTypeRepository.GetByIdAsync(bulkCreateDto.AssetTypeId);
            category = assetType?.Name ?? string.Empty;
        }

        // Find the next available serial number by checking existing ones with this prefix
        // Only do this if SerialNumberPrefix is provided
        var startSerialNumber = 1;
        var hasSerialPrefix = !string.IsNullOrWhiteSpace(bulkCreateDto.SerialNumberPrefix);
        if (hasSerialPrefix)
        {
            var serialPrefix = bulkCreateDto.SerialNumberPrefix + "-";
            var existingSerialNumbers = await _assetRepository.GetSerialNumbersByPrefixAsync(serialPrefix);
            var maxSerialNumber = 0;
            foreach (var sn in existingSerialNumbers)
            {
                // Extract the number part after the prefix (e.g., "SN-0001" -> 1)
                var numberPart = sn.Substring(serialPrefix.Length);
                if (int.TryParse(numberPart, out var number) && number > maxSerialNumber)
                {
                    maxSerialNumber = number;
                }
            }
            startSerialNumber = maxSerialNumber + 1;
        }

        // Prepare all assets in memory
        var assetsToCreate = new List<Asset>();
        for (int i = 0; i < codes.Count; i++)
        {
            // Only generate serial number if prefix is provided
            string? serialNumber = hasSerialPrefix
                ? $"{bulkCreateDto.SerialNumberPrefix}-{(startSerialNumber + i):D4}"
                : null;

            var asset = new Asset
            {
                AssetCode = codes[i],
                AssetTypeId = bulkCreateDto.AssetTypeId,
                AssetName = bulkCreateDto.AssetName ?? string.Empty,
                Alias = bulkCreateDto.Alias,
                Category = category,
                IsDummy = bulkCreateDto.IsDummy,
                Owner = bulkCreateDto.Owner,
                ServiceId = bulkCreateDto.ServiceId,
                InstallationLocation = bulkCreateDto.InstallationLocation,
                Status = assetStatus,
                Brand = bulkCreateDto.Brand,
                Model = bulkCreateDto.Model,
                SerialNumber = serialNumber,
                PurchaseDate = bulkCreateDto.PurchaseDate,
                WarrantyExpiry = bulkCreateDto.WarrantyExpiry,
                InstallationDate = bulkCreateDto.InstallationDate
            };
            assetsToCreate.Add(asset);
        }

        // Bulk insert all assets (atomic operation via SaveChangesAsync)
        if (assetsToCreate.Count > 0)
        {
            var createdAssets = await _assetRepository.BulkCreateAsync(assetsToCreate);
            result.CreatedAssets = _mapper.Map<List<AssetDto>>(createdAssets);
            result.SuccessfullyCreated = assetsToCreate.Count;
        }

        _logger.LogInformation(
            "Bulk asset creation completed: {SuccessCount} successful out of {TotalCount} requested (IsDummy: {IsDummy})",
            result.SuccessfullyCreated, result.TotalRequested, bulkCreateDto.IsDummy);

        return result;
    }

    public async Task<bool> SerialNumberExistsAsync(string serialNumber, int? excludeAssetId = null)
    {
        if (string.IsNullOrWhiteSpace(serialNumber))
            return false;

        return await _assetRepository.SerialNumberExistsAsync(serialNumber, excludeAssetId);
    }

    public async Task<AssetDto?> GetAssetBySerialNumberAsync(string serialNumber)
    {
        if (string.IsNullOrWhiteSpace(serialNumber))
            return null;

        var asset = await _assetRepository.GetBySerialNumberAsync(serialNumber);
        return asset == null ? null : _mapper.Map<AssetDto>(asset);
    }

    public async Task<BulkUpdateAssetsResultDto> BulkUpdateAssetsAsync(BulkUpdateAssetsDto bulkUpdateDto, string? performedBy = null, string? performedByEmail = null)
    {
        if (bulkUpdateDto == null)
            throw new ArgumentNullException(nameof(bulkUpdateDto));

        if (bulkUpdateDto.AssetIds == null || bulkUpdateDto.AssetIds.Count == 0)
            throw new ArgumentException("At least one asset ID is required", nameof(bulkUpdateDto));

        var result = new BulkUpdateAssetsResultDto
        {
            TotalRequested = bulkUpdateDto.AssetIds.Count
        };

        // Parse status if updating
        AssetStatus? newStatus = null;
        if (bulkUpdateDto.UpdateStatus && !string.IsNullOrWhiteSpace(bulkUpdateDto.Status))
        {
            if (Enum.TryParse<AssetStatus>(bulkUpdateDto.Status, true, out var status))
            {
                newStatus = status;
            }
            else
            {
                result.Errors.Add($"Invalid status value: {bulkUpdateDto.Status}");
                return result;
            }
        }

        foreach (var assetId in bulkUpdateDto.AssetIds)
        {
            try
            {
                var asset = await _assetRepository.GetByIdAsync(assetId);
                if (asset == null)
                {
                    result.FailedIds.Add(assetId);
                    result.Errors.Add($"Asset with ID {assetId} not found");
                    continue;
                }

                // Track old values for event logging
                var oldStatus = asset.Status;

                // Apply updates only for fields marked for update
                if (bulkUpdateDto.UpdateServiceId)
                {
                    asset.ServiceId = bulkUpdateDto.ServiceId;
                }

                if (bulkUpdateDto.UpdatePurchaseDate)
                {
                    asset.PurchaseDate = bulkUpdateDto.PurchaseDate;
                }

                if (bulkUpdateDto.UpdateInstallationDate)
                {
                    asset.InstallationDate = bulkUpdateDto.InstallationDate;
                }

                if (bulkUpdateDto.UpdateWarrantyExpiry)
                {
                    asset.WarrantyExpiry = bulkUpdateDto.WarrantyExpiry;
                }

                if (bulkUpdateDto.UpdateBrand)
                {
                    asset.Brand = bulkUpdateDto.Brand;
                }

                if (bulkUpdateDto.UpdateModel)
                {
                    asset.Model = bulkUpdateDto.Model;
                }

                if (bulkUpdateDto.UpdateStatus && newStatus.HasValue)
                {
                    asset.Status = newStatus.Value;
                }

                if (bulkUpdateDto.UpdateInstallationLocation)
                {
                    asset.InstallationLocation = bulkUpdateDto.InstallationLocation;
                }

                await _assetRepository.UpdateAsync(asset);
                result.UpdatedIds.Add(assetId);
                result.UpdatedCount++;

                // Create status change event if status was changed
                if (!string.IsNullOrWhiteSpace(performedBy) && bulkUpdateDto.UpdateStatus && oldStatus != asset.Status)
                {
                    await _assetEventService.CreateStatusChangedEventAsync(
                        asset.Id,
                        oldStatus,
                        asset.Status,
                        performedBy,
                        performedByEmail,
                        notes: "Bulk update",
                        cancellationToken: default);
                }
            }
            catch (Exception ex)
            {
                result.FailedIds.Add(assetId);
                result.Errors.Add($"Error updating asset {assetId}: {ex.Message}");
                _logger.LogError(ex, "Error during bulk update of asset {AssetId}", assetId);
            }
        }

        _logger.LogInformation(
            "Bulk asset update completed: {SuccessCount} successful out of {TotalCount} requested",
            result.UpdatedCount, result.TotalRequested);

        return result;
    }

    public async Task<IEnumerable<AssetDto>> GetAssetsByOwnerAsync(
        string ownerEmail,
        string? assetTypeCode = null,
        string? status = "InGebruik",
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(ownerEmail))
            return Enumerable.Empty<AssetDto>();

        var assets = await _assetRepository.GetByOwnerAsync(ownerEmail, assetTypeCode, status, cancellationToken);
        return _mapper.Map<IEnumerable<AssetDto>>(assets);
    }

    public async Task<IEnumerable<AssetDto>> GetAvailableLaptopsAsync(
        string? search = null,
        CancellationToken cancellationToken = default)
    {
        var assets = await _assetRepository.GetAvailableLaptopsAsync(search, cancellationToken);
        return _mapper.Map<IEnumerable<AssetDto>>(assets);
    }

    /// <summary>
    /// Generates an alias from asset components: AssetTypeName - Brand - Model.
    /// Empty components are skipped.
    /// </summary>
    private async Task<string?> GenerateAliasAsync(int? assetTypeId, string? owner, string? brand, string? model)
    {
        string? assetTypeName = null;
        if (assetTypeId.HasValue && assetTypeId.Value > 0)
        {
            var assetType = await _assetTypeRepository.GetByIdAsync(assetTypeId.Value);
            assetTypeName = assetType?.Name;
        }

        // Generate alias as: AssetTypeName - Brand - Model (Owner is excluded)
        var parts = new[] { assetTypeName, brand, model }
            .Where(p => !string.IsNullOrWhiteSpace(p))
            .ToArray();

        return parts.Length > 0 ? string.Join(" - ", parts) : null;
    }
}

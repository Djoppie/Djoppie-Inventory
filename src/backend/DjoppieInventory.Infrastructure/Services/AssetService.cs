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
    private readonly IMapper _mapper;
    private readonly ILogger<AssetService> _logger;

    public AssetService(
        IAssetRepository assetRepository,
        IAssetEventService assetEventService,
        IMapper mapper,
        ILogger<AssetService> logger)
    {
        _assetRepository = assetRepository;
        _assetEventService = assetEventService;
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

        if (string.IsNullOrWhiteSpace(createAssetDto.AssetCodePrefix))
            throw new ArgumentException("Asset code prefix is required", nameof(createAssetDto));

        // Auto-generate asset code
        var assetCode = await GenerateAssetCodeAsync(createAssetDto.AssetCodePrefix, createAssetDto.IsDummy);

        var asset = _mapper.Map<Asset>(createAssetDto);
        asset.AssetCode = assetCode;
        asset.IsDummy = createAssetDto.IsDummy;

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

    private async Task<string> GenerateAssetCodeAsync(string prefix, bool isDummy)
    {
        const int maxAttempts = 100;
        var attempt = 0;

        while (attempt < maxAttempts)
        {
            var nextNumber = await _assetRepository.GetNextAssetNumberAsync(prefix, isDummy);
            var assetCode = $"{prefix}-{nextNumber:D4}";

            // Verify code doesn't exist (race condition protection)
            if (!await _assetRepository.AssetCodeExistsAsync(assetCode))
            {
                return assetCode;
            }

            attempt++;
        }

        throw new InvalidOperationException($"Unable to generate unique asset code for prefix '{prefix}' after {maxAttempts} attempts");
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

    public async Task<BulkCreateAssetResultDto> BulkCreateAssetsAsync(BulkCreateAssetDto bulkCreateDto)
    {
        if (bulkCreateDto == null)
            throw new ArgumentNullException(nameof(bulkCreateDto));

        if (string.IsNullOrWhiteSpace(bulkCreateDto.AssetCodePrefix))
            throw new ArgumentException("Asset code prefix is required", nameof(bulkCreateDto));

        if (string.IsNullOrWhiteSpace(bulkCreateDto.SerialNumberPrefix))
            throw new ArgumentException("Serial number prefix is required", nameof(bulkCreateDto));

        if (bulkCreateDto.Quantity < 1 || bulkCreateDto.Quantity > 100)
            throw new ArgumentException("Quantity must be between 1 and 100", nameof(bulkCreateDto));

        var result = new BulkCreateAssetResultDto
        {
            TotalRequested = bulkCreateDto.Quantity
        };

        // Use transaction for atomic operation - all succeed or all fail
        await using var transaction = await _assetRepository.BeginTransactionAsync();

        try
        {
            // Get all existing asset codes for this prefix in a single query (avoid N+1)
            var existingCodes = await _assetRepository.GetExistingAssetCodesAsync(bulkCreateDto.AssetCodePrefix);

            // Get starting number based on whether it's a dummy asset
            var startingNumber = await _assetRepository.GetNextAssetNumberAsync(bulkCreateDto.AssetCodePrefix, bulkCreateDto.IsDummy);
            var currentNumber = startingNumber;
            var maxNumber = bulkCreateDto.IsDummy ? 9999 : 8999;

            // Parse status once
            var assetStatus = Enum.TryParse<AssetStatus>(bulkCreateDto.Status, true, out var status)
                ? status
                : AssetStatus.Stock;

            // Prepare all assets in memory first
            var assetsToCreate = new List<Asset>();

            while (assetsToCreate.Count < bulkCreateDto.Quantity && currentNumber <= maxNumber)
            {
                var assetCode = $"{bulkCreateDto.AssetCodePrefix}-{currentNumber:D4}";

                // Check against in-memory set (no database call)
                if (existingCodes.Contains(assetCode))
                {
                    currentNumber++;
                    continue;
                }

                // Create asset with the next available number
                var asset = new Asset
                {
                    AssetCode = assetCode,
                    AssetName = bulkCreateDto.AssetName,
                    Alias = bulkCreateDto.Alias,
                    Category = bulkCreateDto.Category,
                    IsDummy = bulkCreateDto.IsDummy,
                    Owner = bulkCreateDto.Owner,
                    LegacyBuilding = bulkCreateDto.Building,
                    LegacyDepartment = bulkCreateDto.Department,
                    OfficeLocation = bulkCreateDto.OfficeLocation,
                    Status = assetStatus,
                    Brand = bulkCreateDto.Brand,
                    Model = bulkCreateDto.Model,
                    SerialNumber = $"{bulkCreateDto.SerialNumberPrefix}-{currentNumber:D4}",
                    PurchaseDate = bulkCreateDto.PurchaseDate,
                    WarrantyExpiry = bulkCreateDto.WarrantyExpiry,
                    InstallationDate = bulkCreateDto.InstallationDate
                };

                assetsToCreate.Add(asset);
                existingCodes.Add(assetCode); // Track newly added codes
                currentNumber++;
            }

            // Bulk insert all assets in a single database operation
            if (assetsToCreate.Count > 0)
            {
                var createdAssets = await _assetRepository.BulkCreateAsync(assetsToCreate);
                result.CreatedAssets = _mapper.Map<List<AssetDto>>(createdAssets);
                result.SuccessfullyCreated = assetsToCreate.Count;
            }

            // Commit transaction
            await transaction.CommitAsync();

            _logger.LogInformation(
                "Bulk asset creation completed: {SuccessCount} successful out of {TotalCount} requested (IsDummy: {IsDummy})",
                result.SuccessfullyCreated, result.TotalRequested, bulkCreateDto.IsDummy);
        }
        catch (Exception ex)
        {
            // Rollback transaction on any error
            await transaction.RollbackAsync();

            result.Failed = bulkCreateDto.Quantity;
            result.Errors.Add($"Bulk operation failed: {ex.Message}");
            _logger.LogError(ex, "Bulk asset creation failed, transaction rolled back");

            throw; // Re-throw to let the controller handle the error response
        }

        return result;
    }

    public async Task<int> GetNextAssetNumberAsync(string prefix, bool isDummy = false)
    {
        if (string.IsNullOrWhiteSpace(prefix))
            throw new ArgumentException("Prefix is required", nameof(prefix));

        return await _assetRepository.GetNextAssetNumberAsync(prefix, isDummy);
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
}

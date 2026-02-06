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
    private readonly IMapper _mapper;
    private readonly ILogger<AssetService> _logger;

    public AssetService(
        IAssetRepository assetRepository,
        IMapper mapper,
        ILogger<AssetService> logger)
    {
        _assetRepository = assetRepository;
        _mapper = mapper;
        _logger = logger;
    }

    public async Task<IEnumerable<AssetDto>> GetAssetsAsync(string? status = null)
    {
        var assets = await _assetRepository.GetAllAsync(status);
        return _mapper.Map<IEnumerable<AssetDto>>(assets);
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

    public async Task<AssetDto> CreateAssetAsync(CreateAssetDto createAssetDto)
    {
        if (createAssetDto == null)
            throw new ArgumentNullException(nameof(createAssetDto));

        if (string.IsNullOrWhiteSpace(createAssetDto.AssetCode))
            throw new ArgumentException("Asset code is required", nameof(createAssetDto));

        // Check if asset code already exists
        if (await _assetRepository.AssetCodeExistsAsync(createAssetDto.AssetCode))
        {
            throw new InvalidOperationException($"Asset with code '{createAssetDto.AssetCode}' already exists");
        }

        var asset = _mapper.Map<Asset>(createAssetDto);
        var createdAsset = await _assetRepository.CreateAsync(asset);

        _logger.LogInformation("Created asset {AssetCode} with ID {AssetId}",
            createdAsset.AssetCode, createdAsset.Id);

        return _mapper.Map<AssetDto>(createdAsset);
    }

    public async Task<AssetDto> UpdateAssetAsync(int id, UpdateAssetDto updateAssetDto)
    {
        if (updateAssetDto == null)
            throw new ArgumentNullException(nameof(updateAssetDto));

        var existingAsset = await _assetRepository.GetByIdAsync(id);
        if (existingAsset == null)
        {
            throw new KeyNotFoundException($"Asset with ID {id} not found");
        }

        _mapper.Map(updateAssetDto, existingAsset);
        var updatedAsset = await _assetRepository.UpdateAsync(existingAsset);

        _logger.LogInformation("Updated asset {AssetCode} (ID: {AssetId})",
            updatedAsset.AssetCode, updatedAsset.Id);

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

        if (bulkCreateDto.Quantity < 1 || bulkCreateDto.Quantity > 100)
            throw new ArgumentException("Quantity must be between 1 and 100", nameof(bulkCreateDto));

        var result = new BulkCreateAssetResultDto
        {
            TotalRequested = bulkCreateDto.Quantity
        };

        var currentNumber = bulkCreateDto.StartingNumber;
        var created = 0;
        var maxAttempts = bulkCreateDto.Quantity * 10; // Safety limit to avoid infinite loops
        var attempts = 0;

        while (created < bulkCreateDto.Quantity && attempts < maxAttempts && currentNumber <= 9999)
        {
            attempts++;
            try
            {
                var assetCode = $"{bulkCreateDto.AssetCodePrefix}-{currentNumber:D4}";

                // Skip existing codes and try next number
                if (await _assetRepository.AssetCodeExistsAsync(assetCode))
                {
                    currentNumber++;
                    continue;
                }

                // Create asset with the next available number
                var asset = new Asset
                {
                    AssetCode = assetCode,
                    AssetName = bulkCreateDto.AssetName,
                    Category = bulkCreateDto.Category,
                    Owner = bulkCreateDto.Owner,
                    Building = bulkCreateDto.Building,
                    Department = bulkCreateDto.Department,
                    OfficeLocation = bulkCreateDto.OfficeLocation,
                    Status = Enum.TryParse<AssetStatus>(bulkCreateDto.Status, true, out var status)
                        ? status
                        : AssetStatus.InGebruik,
                    Brand = bulkCreateDto.Brand,
                    Model = bulkCreateDto.Model,
                    SerialNumber = !string.IsNullOrWhiteSpace(bulkCreateDto.SerialNumberPrefix)
                        ? $"{bulkCreateDto.SerialNumberPrefix}-{currentNumber:D4}"
                        : null,
                    PurchaseDate = bulkCreateDto.PurchaseDate,
                    WarrantyExpiry = bulkCreateDto.WarrantyExpiry,
                    InstallationDate = bulkCreateDto.InstallationDate
                };

                var createdAsset = await _assetRepository.CreateAsync(asset);
                var assetDto = _mapper.Map<AssetDto>(createdAsset);

                result.CreatedAssets.Add(assetDto);
                result.SuccessfullyCreated++;
                created++;
                currentNumber++;
            }
            catch (Exception ex)
            {
                result.Failed++;
                result.Errors.Add($"Failed to create asset with number {currentNumber}: {ex.Message}");
                _logger.LogError(ex, "Error creating asset with number {Number} in bulk operation", currentNumber);
                currentNumber++;
            }
        }

        _logger.LogInformation(
            "Bulk asset creation completed: {SuccessCount} successful, {FailCount} failed out of {TotalCount}",
            result.SuccessfullyCreated, result.Failed, result.TotalRequested);

        return result;
    }

    public async Task<int> GetNextAssetNumberAsync(string prefix)
    {
        if (string.IsNullOrWhiteSpace(prefix))
            throw new ArgumentException("Prefix is required", nameof(prefix));

        return await _assetRepository.GetNextAssetNumberAsync(prefix);
    }
}

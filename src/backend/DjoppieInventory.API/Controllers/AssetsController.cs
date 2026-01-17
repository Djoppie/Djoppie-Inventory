using AutoMapper;
using DjoppieInventory.Core.DTOs;
using DjoppieInventory.Core.Entities;
using DjoppieInventory.Core.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DjoppieInventory.API.Controllers;

/// <summary>
/// API controller for managing asset inventory operations.
/// Handles CRUD operations for assets including creation, retrieval, updating, and deletion.
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class AssetsController : ControllerBase
{
    private readonly IAssetRepository _assetRepository;
    private readonly IMapper _mapper;
    private readonly ILogger<AssetsController> _logger;

    /// <summary>
    /// Initializes a new instance of the AssetsController.
    /// </summary>
    /// <param name="assetRepository">Repository for asset data access operations</param>
    /// <param name="mapper">AutoMapper instance for entity-DTO conversions</param>
    /// <param name="logger">Logger for tracking errors and application events</param>
    public AssetsController(
        IAssetRepository assetRepository,
        IMapper mapper,
        ILogger<AssetsController> logger)
    {
        _assetRepository = assetRepository;
        _mapper = mapper;
        _logger = logger;
    }

    /// <summary>
    /// Retrieves all assets, optionally filtered by status.
    /// </summary>
    /// <param name="status">Optional filter for asset status (e.g., "Active", "Inactive")</param>
    /// <returns>A list of assets as DTOs</returns>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<AssetDto>>> GetAssets([FromQuery] string? status = null)
    {
        try
        {
            var assets = await _assetRepository.GetAllAsync(status);
            var assetDtos = _mapper.Map<IEnumerable<AssetDto>>(assets);
            return Ok(assetDtos);
        }
        catch (DbUpdateException dbEx)
        {
            _logger.LogError(dbEx, "Database error while retrieving assets with status filter: {Status}", status);
            return StatusCode(500, "A database error occurred while retrieving assets");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error retrieving assets with status filter: {Status}", status);
            return StatusCode(500, "An unexpected error occurred while retrieving assets");
        }
    }

    /// <summary>
    /// Retrieves a specific asset by its unique identifier.
    /// </summary>
    /// <param name="id">The unique identifier of the asset</param>
    /// <returns>The asset DTO if found, or NotFound if the asset doesn't exist</returns>
    [HttpGet("{id}")]
    public async Task<ActionResult<AssetDto>> GetAsset(int id)
    {
        try
        {
            var asset = await _assetRepository.GetByIdAsync(id);
            if (asset == null)
                return NotFound($"Asset with ID {id} not found");

            var assetDto = _mapper.Map<AssetDto>(asset);
            return Ok(assetDto);
        }
        catch (DbUpdateException dbEx)
        {
            _logger.LogError(dbEx, "Database error while retrieving asset {AssetId}", id);
            return StatusCode(500, "A database error occurred while retrieving the asset");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error retrieving asset {AssetId}", id);
            return StatusCode(500, "An unexpected error occurred while retrieving the asset");
        }
    }

    /// <summary>
    /// Retrieves an asset by its unique asset code (typically scanned from QR code).
    /// </summary>
    /// <param name="code">The unique asset code (e.g., scanned from QR code)</param>
    /// <returns>The asset DTO if found, or NotFound if the asset code doesn't exist</returns>
    [HttpGet("by-code/{code}")]
    public async Task<ActionResult<AssetDto>> GetAssetByCode(string code)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(code))
                return BadRequest("Asset code cannot be empty");

            var asset = await _assetRepository.GetByAssetCodeAsync(code);
            if (asset == null)
                return NotFound($"Asset with code '{code}' not found");

            var assetDto = _mapper.Map<AssetDto>(asset);
            return Ok(assetDto);
        }
        catch (DbUpdateException dbEx)
        {
            _logger.LogError(dbEx, "Database error while retrieving asset by code {AssetCode}", code);
            return StatusCode(500, "A database error occurred while retrieving the asset");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error retrieving asset by code {AssetCode}", code);
            return StatusCode(500, "An unexpected error occurred while retrieving the asset");
        }
    }

    /// <summary>
    /// Creates a new asset in the inventory system.
    /// </summary>
    /// <param name="createAssetDto">The asset data to create</param>
    /// <returns>The created asset DTO with generated ID and timestamps, or Conflict if asset code already exists</returns>
    [HttpPost]
    public async Task<ActionResult<AssetDto>> CreateAsset(CreateAssetDto createAssetDto)
    {
        try
        {
            if (createAssetDto == null)
                return BadRequest("Asset data cannot be null");

            if (string.IsNullOrWhiteSpace(createAssetDto.AssetCode))
                return BadRequest("Asset code is required");

            // Check if asset code already exists
            if (await _assetRepository.AssetCodeExistsAsync(createAssetDto.AssetCode))
            {
                return Conflict($"Asset with code '{createAssetDto.AssetCode}' already exists");
            }

            var asset = _mapper.Map<Asset>(createAssetDto);
            var createdAsset = await _assetRepository.CreateAsync(asset);
            var assetDto = _mapper.Map<AssetDto>(createdAsset);

            return CreatedAtAction(nameof(GetAsset), new { id = createdAsset.Id }, assetDto);
        }
        catch (DbUpdateException dbEx)
        {
            _logger.LogError(dbEx, "Database error while creating asset with code {AssetCode}", createAssetDto?.AssetCode);
            return StatusCode(500, "A database error occurred while creating the asset");
        }
        catch (AutoMapperMappingException mapEx)
        {
            _logger.LogError(mapEx, "Mapping error while creating asset");
            return StatusCode(500, "An error occurred while processing the asset data");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error creating asset with code {AssetCode}", createAssetDto?.AssetCode);
            return StatusCode(500, "An unexpected error occurred while creating the asset");
        }
    }

    /// <summary>
    /// Updates an existing asset's information.
    /// </summary>
    /// <param name="id">The unique identifier of the asset to update</param>
    /// <param name="updateAssetDto">The updated asset data</param>
    /// <returns>The updated asset DTO, or NotFound if the asset doesn't exist</returns>
    [HttpPut("{id}")]
    public async Task<ActionResult<AssetDto>> UpdateAsset(int id, UpdateAssetDto updateAssetDto)
    {
        try
        {
            if (updateAssetDto == null)
                return BadRequest("Asset data cannot be null");

            var existingAsset = await _assetRepository.GetByIdAsync(id);
            if (existingAsset == null)
                return NotFound($"Asset with ID {id} not found");

            _mapper.Map(updateAssetDto, existingAsset);
            var updatedAsset = await _assetRepository.UpdateAsync(existingAsset);
            var assetDto = _mapper.Map<AssetDto>(updatedAsset);

            return Ok(assetDto);
        }
        catch (DbUpdateConcurrencyException concurrencyEx)
        {
            _logger.LogError(concurrencyEx, "Concurrency error while updating asset {AssetId}", id);
            return StatusCode(409, "The asset was modified by another user. Please refresh and try again.");
        }
        catch (DbUpdateException dbEx)
        {
            _logger.LogError(dbEx, "Database error while updating asset {AssetId}", id);
            return StatusCode(500, "A database error occurred while updating the asset");
        }
        catch (AutoMapperMappingException mapEx)
        {
            _logger.LogError(mapEx, "Mapping error while updating asset {AssetId}", id);
            return StatusCode(500, "An error occurred while processing the asset data");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error updating asset {AssetId}", id);
            return StatusCode(500, "An unexpected error occurred while updating the asset");
        }
    }

    /// <summary>
    /// Deletes an asset from the inventory system.
    /// </summary>
    /// <param name="id">The unique identifier of the asset to delete</param>
    /// <returns>NoContent if successful, or NotFound if the asset doesn't exist</returns>
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteAsset(int id)
    {
        try
        {
            var deleted = await _assetRepository.DeleteAsync(id);
            if (!deleted)
                return NotFound($"Asset with ID {id} not found");

            return NoContent();
        }
        catch (DbUpdateException dbEx)
        {
            _logger.LogError(dbEx, "Database error while deleting asset {AssetId}", id);
            return StatusCode(500, "A database error occurred while deleting the asset");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error deleting asset {AssetId}", id);
            return StatusCode(500, "An unexpected error occurred while deleting the asset");
        }
    }
}

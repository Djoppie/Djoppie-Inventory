using AutoMapper;
using DjoppieInventory.Core.DTOs;
using DjoppieInventory.Core.Entities;
using DjoppieInventory.Core.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace DjoppieInventory.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AssetsController : ControllerBase
{
    private readonly IAssetRepository _assetRepository;
    private readonly IMapper _mapper;
    private readonly ILogger<AssetsController> _logger;

    public AssetsController(
        IAssetRepository assetRepository,
        IMapper mapper,
        ILogger<AssetsController> logger)
    {
        _assetRepository = assetRepository;
        _mapper = mapper;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<AssetDto>>> GetAssets([FromQuery] string? status = null)
    {
        try
        {
            var assets = await _assetRepository.GetAllAsync(status);
            var assetDtos = _mapper.Map<IEnumerable<AssetDto>>(assets);
            return Ok(assetDtos);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving assets");
            return StatusCode(500, "An error occurred while retrieving assets");
        }
    }

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
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving asset {AssetId}", id);
            return StatusCode(500, "An error occurred while retrieving the asset");
        }
    }

    [HttpGet("by-code/{code}")]
    public async Task<ActionResult<AssetDto>> GetAssetByCode(string code)
    {
        try
        {
            var asset = await _assetRepository.GetByAssetCodeAsync(code);
            if (asset == null)
                return NotFound($"Asset with code '{code}' not found");

            var assetDto = _mapper.Map<AssetDto>(asset);
            return Ok(assetDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving asset by code {AssetCode}", code);
            return StatusCode(500, "An error occurred while retrieving the asset");
        }
    }

    [HttpPost]
    public async Task<ActionResult<AssetDto>> CreateAsset(CreateAssetDto createAssetDto)
    {
        try
        {
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
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating asset");
            return StatusCode(500, "An error occurred while creating the asset");
        }
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<AssetDto>> UpdateAsset(int id, UpdateAssetDto updateAssetDto)
    {
        try
        {
            var existingAsset = await _assetRepository.GetByIdAsync(id);
            if (existingAsset == null)
                return NotFound($"Asset with ID {id} not found");

            _mapper.Map(updateAssetDto, existingAsset);
            var updatedAsset = await _assetRepository.UpdateAsync(existingAsset);
            var assetDto = _mapper.Map<AssetDto>(updatedAsset);

            return Ok(assetDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating asset {AssetId}", id);
            return StatusCode(500, "An error occurred while updating the asset");
        }
    }

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
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting asset {AssetId}", id);
            return StatusCode(500, "An error occurred while deleting the asset");
        }
    }
}

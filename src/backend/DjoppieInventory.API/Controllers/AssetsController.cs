using DjoppieInventory.Core.DTOs;
using DjoppieInventory.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DjoppieInventory.API.Controllers;

/// <summary>
/// API controller for managing asset inventory operations.
/// </summary>
[Authorize]
[ApiController]
[Route("api/[controller]")]
public class AssetsController : ControllerBase
{
    private readonly IAssetService _assetService;

    public AssetsController(IAssetService assetService)
    {
        _assetService = assetService;
    }

    /// <summary>
    /// Retrieves all assets, optionally filtered by status.
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<AssetDto>>> GetAssets([FromQuery] string? status = null)
    {
        var assets = await _assetService.GetAssetsAsync(status);
        return Ok(assets);
    }

    /// <summary>
    /// Retrieves a specific asset by its unique identifier.
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<AssetDto>> GetAsset(int id)
    {
        var asset = await _assetService.GetAssetByIdAsync(id);
        if (asset == null)
            return NotFound($"Asset with ID {id} not found");

        return Ok(asset);
    }

    /// <summary>
    /// Retrieves an asset by its unique asset code (typically scanned from QR code).
    /// </summary>
    [HttpGet("by-code/{code}")]
    public async Task<ActionResult<AssetDto>> GetAssetByCode(string code)
    {
        var asset = await _assetService.GetAssetByCodeAsync(code);
        if (asset == null)
            return NotFound($"Asset with code '{code}' not found");

        return Ok(asset);
    }

    /// <summary>
    /// Creates a new asset in the inventory system.
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<AssetDto>> CreateAsset(CreateAssetDto createAssetDto)
    {
        var assetDto = await _assetService.CreateAssetAsync(createAssetDto);
        return CreatedAtAction(nameof(GetAsset), new { id = assetDto.Id }, assetDto);
    }

    /// <summary>
    /// Updates an existing asset's information.
    /// </summary>
    [HttpPut("{id}")]
    public async Task<ActionResult<AssetDto>> UpdateAsset(int id, UpdateAssetDto updateAssetDto)
    {
        var assetDto = await _assetService.UpdateAssetAsync(id, updateAssetDto);
        return Ok(assetDto);
    }

    /// <summary>
    /// Deletes an asset from the inventory system.
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteAsset(int id)
    {
        var deleted = await _assetService.DeleteAssetAsync(id);
        if (!deleted)
            return NotFound($"Asset with ID {id} not found");

        return NoContent();
    }

    /// <summary>
    /// Creates multiple assets in bulk with sequential asset codes.
    /// </summary>
    [HttpPost("bulk")]
    public async Task<ActionResult<BulkCreateAssetResultDto>> BulkCreateAssets(BulkCreateAssetDto bulkCreateDto)
    {
        var result = await _assetService.BulkCreateAssetsAsync(bulkCreateDto);
        return Ok(result);
    }

    /// <summary>
    /// Gets the next available asset number for a given prefix.
    /// For normal assets: 1-8999
    /// For dummy assets: 9000+
    /// </summary>
    [HttpGet("next-number")]
    public async Task<ActionResult<int>> GetNextAssetNumber([FromQuery] string prefix, [FromQuery] bool isDummy = false)
    {
        if (string.IsNullOrWhiteSpace(prefix))
            return BadRequest("Prefix is required");

        var nextNumber = await _assetService.GetNextAssetNumberAsync(prefix, isDummy);
        return Ok(nextNumber);
    }

    /// <summary>
    /// Checks if an asset code already exists.
    /// </summary>
    [HttpGet("code-exists")]
    public async Task<ActionResult<bool>> AssetCodeExists([FromQuery] string code)
    {
        if (string.IsNullOrWhiteSpace(code))
            return BadRequest("Code is required");

        var exists = await _assetService.GetAssetByCodeAsync(code) != null;
        return Ok(exists);
    }
}

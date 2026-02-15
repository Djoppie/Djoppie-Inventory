using DjoppieInventory.API.Helpers;
using DjoppieInventory.Core.DTOs;
using DjoppieInventory.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using System.Security.Claims;

namespace DjoppieInventory.API.Controllers;

/// <summary>
/// API controller for managing asset inventory operations.
/// </summary>
[Authorize]
[ApiController]
[Route("api/[controller]")]
[EnableRateLimiting("fixed")]
public class AssetsController : ControllerBase
{
    private readonly IAssetService _assetService;

    private const int MaxPageSize = 200;
    private const int DefaultPageSize = 50;

    public AssetsController(IAssetService assetService)
    {
        _assetService = assetService;
    }

    /// <summary>
    /// Retrieves a paginated list of assets, optionally filtered by status.
    /// </summary>
    /// <param name="status">Optional status filter (InGebruik, Stock, Herstelling, Defect, UitDienst)</param>
    /// <param name="pageNumber">Page number (1-based, default: 1)</param>
    /// <param name="pageSize">Items per page (default: 50, max: 200)</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Paginated list of assets</returns>
    [HttpGet]
    [ProducesResponseType(typeof(PagedResultDto<AssetDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<PagedResultDto<AssetDto>>> GetAssets(
        [FromQuery] string? status = null,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = DefaultPageSize,
        CancellationToken cancellationToken = default)
    {
        // Validate pagination parameters
        if (pageNumber < 1)
            return BadRequest("Page number must be at least 1");

        if (pageSize < 1)
            return BadRequest("Page size must be at least 1");

        if (pageSize > MaxPageSize)
            return BadRequest($"Page size cannot exceed {MaxPageSize}");

        var result = await _assetService.GetAssetsPagedAsync(status, pageNumber, pageSize, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Retrieves all assets without pagination (use sparingly, prefer paginated endpoint).
    /// </summary>
    /// <param name="status">Optional status filter</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>List of all matching assets</returns>
    [HttpGet("all")]
    [ProducesResponseType(typeof(IEnumerable<AssetDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<AssetDto>>> GetAllAssets(
        [FromQuery] string? status = null,
        CancellationToken cancellationToken = default)
    {
        var assets = await _assetService.GetAssetsAsync(status);
        return Ok(assets);
    }

    /// <summary>
    /// Retrieves a specific asset by its unique identifier.
    /// </summary>
    /// <param name="id">The asset ID</param>
    /// <param name="cancellationToken">Cancellation token</param>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(AssetDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<AssetDto>> GetAsset(int id, CancellationToken cancellationToken = default)
    {
        var asset = await _assetService.GetAssetByIdAsync(id);
        if (asset == null)
            return NotFound($"Asset with ID {id} not found");

        return Ok(asset);
    }

    /// <summary>
    /// Retrieves an asset by its unique asset code (typically scanned from QR code).
    /// </summary>
    /// <param name="code">The asset code (e.g., LAP-0001)</param>
    /// <param name="cancellationToken">Cancellation token</param>
    [HttpGet("by-code/{code}")]
    [ProducesResponseType(typeof(AssetDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<AssetDto>> GetAssetByCode(string code, CancellationToken cancellationToken = default)
    {
        if (!InputValidator.ValidateAssetCode(code, out var errorMessage))
            return BadRequest(errorMessage);

        var asset = await _assetService.GetAssetByCodeAsync(code);
        if (asset == null)
            return NotFound($"Asset with code '{code}' not found");

        return Ok(asset);
    }

    /// <summary>
    /// Creates a new asset in the inventory system.
    /// </summary>
    /// <param name="createAssetDto">The asset creation data</param>
    /// <param name="cancellationToken">Cancellation token</param>
    [HttpPost]
    [ProducesResponseType(typeof(AssetDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<AssetDto>> CreateAsset(
        CreateAssetDto createAssetDto,
        CancellationToken cancellationToken = default)
    {
        // Get user information from claims for event tracking
        var userName = User.FindFirst(ClaimTypes.Name)?.Value ?? "System";
        var userEmail = User.FindFirst(ClaimTypes.Email)?.Value ?? User.FindFirst("preferred_username")?.Value;

        var assetDto = await _assetService.CreateAssetAsync(createAssetDto, userName, userEmail);
        return CreatedAtAction(nameof(GetAsset), new { id = assetDto.Id }, assetDto);
    }

    /// <summary>
    /// Updates an existing asset's information.
    /// </summary>
    /// <param name="id">The asset ID to update</param>
    /// <param name="updateAssetDto">The updated asset data</param>
    /// <param name="cancellationToken">Cancellation token</param>
    [HttpPut("{id}")]
    [ProducesResponseType(typeof(AssetDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<AssetDto>> UpdateAsset(
        int id,
        UpdateAssetDto updateAssetDto,
        CancellationToken cancellationToken = default)
    {
        // Get user information from claims for event tracking
        var userName = User.FindFirst(ClaimTypes.Name)?.Value ?? "System";
        var userEmail = User.FindFirst(ClaimTypes.Email)?.Value ?? User.FindFirst("preferred_username")?.Value;

        var assetDto = await _assetService.UpdateAssetAsync(id, updateAssetDto, userName, userEmail);
        return Ok(assetDto);
    }

    /// <summary>
    /// Deletes an asset from the inventory system.
    /// </summary>
    /// <param name="id">The asset ID to delete</param>
    /// <param name="cancellationToken">Cancellation token</param>
    [HttpDelete("{id}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteAsset(int id, CancellationToken cancellationToken = default)
    {
        var deleted = await _assetService.DeleteAssetAsync(id);
        if (!deleted)
            return NotFound($"Asset with ID {id} not found");

        return NoContent();
    }

    /// <summary>
    /// Creates multiple assets in bulk with sequential asset codes.
    /// </summary>
    /// <param name="bulkCreateDto">The bulk creation parameters</param>
    /// <param name="cancellationToken">Cancellation token</param>
    [HttpPost("bulk")]
    [EnableRateLimiting("bulk")]
    [ProducesResponseType(typeof(BulkCreateAssetResultDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<BulkCreateAssetResultDto>> BulkCreateAssets(
        BulkCreateAssetDto bulkCreateDto,
        CancellationToken cancellationToken = default)
    {
        var result = await _assetService.BulkCreateAssetsAsync(bulkCreateDto);
        return Ok(result);
    }

    /// <summary>
    /// Checks if an asset code already exists.
    /// </summary>
    /// <param name="code">The asset code to check</param>
    /// <param name="cancellationToken">Cancellation token</param>
    [HttpGet("code-exists")]
    [ProducesResponseType(typeof(bool), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<bool>> AssetCodeExists(
        [FromQuery] string code,
        CancellationToken cancellationToken = default)
    {
        if (!InputValidator.ValidateAssetCode(code, out var errorMessage))
            return BadRequest(errorMessage);

        var exists = await _assetService.GetAssetByCodeAsync(code) != null;
        return Ok(exists);
    }

    /// <summary>
    /// Checks if a serial number already exists in the system.
    /// </summary>
    /// <param name="serialNumber">The serial number to check</param>
    /// <param name="excludeAssetId">Optional asset ID to exclude from the check (for updates)</param>
    /// <param name="cancellationToken">Cancellation token</param>
    [HttpGet("serial-exists")]
    [ProducesResponseType(typeof(bool), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<bool>> SerialNumberExists(
        [FromQuery] string serialNumber,
        [FromQuery] int? excludeAssetId = null,
        CancellationToken cancellationToken = default)
    {
        if (!InputValidator.ValidateSerialNumber(serialNumber, out var errorMessage))
            return BadRequest(errorMessage);

        var exists = await _assetService.SerialNumberExistsAsync(serialNumber, excludeAssetId);
        return Ok(exists);
    }

    /// <summary>
    /// Retrieves an asset by its serial number.
    /// </summary>
    /// <param name="serialNumber">The serial number to search for</param>
    /// <param name="cancellationToken">Cancellation token</param>
    [HttpGet("by-serial/{serialNumber}")]
    [ProducesResponseType(typeof(AssetDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<AssetDto>> GetAssetBySerialNumber(
        string serialNumber,
        CancellationToken cancellationToken = default)
    {
        if (!InputValidator.ValidateSerialNumber(serialNumber, out var errorMessage))
            return BadRequest(errorMessage);

        var asset = await _assetService.GetAssetBySerialNumberAsync(serialNumber);
        if (asset == null)
            return NotFound($"Asset with serial number '{serialNumber}' not found");

        return Ok(asset);
    }
}

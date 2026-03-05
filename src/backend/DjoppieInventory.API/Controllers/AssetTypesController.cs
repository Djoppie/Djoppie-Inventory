using DjoppieInventory.Core.DTOs;
using DjoppieInventory.Core.Entities;
using DjoppieInventory.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DjoppieInventory.API.Controllers;

/// <summary>
/// API controller for managing asset types.
/// </summary>
[Authorize]
[ApiController]
[Route("api/admin/[controller]")]
public class AssetTypesController : ControllerBase
{
    private readonly IAssetTypeRepository _assetTypeRepository;

    public AssetTypesController(IAssetTypeRepository assetTypeRepository)
    {
        _assetTypeRepository = assetTypeRepository;
    }

    /// <summary>
    /// Retrieves all asset types, optionally including inactive ones.
    /// </summary>
    /// <param name="includeInactive">Include inactive asset types in the results</param>
    /// <param name="cancellationToken">Cancellation token</param>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<AssetTypeDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<AssetTypeDto>>> GetAll(
        [FromQuery] bool includeInactive = false,
        CancellationToken cancellationToken = default)
    {
        var assetTypes = await _assetTypeRepository.GetAllAsync(includeInactive, cancellationToken);
        var dtos = assetTypes.Select(at => new AssetTypeDto(
            at.Id,
            at.Code,
            at.Name,
            at.Description,
            at.IsActive,
            at.SortOrder,
            at.CategoryId
        ));

        return Ok(dtos);
    }

    /// <summary>
    /// Retrieves a specific asset type by ID.
    /// </summary>
    /// <param name="id">The asset type ID</param>
    /// <param name="cancellationToken">Cancellation token</param>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(AssetTypeDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<AssetTypeDto>> GetById(int id, CancellationToken cancellationToken = default)
    {
        var assetType = await _assetTypeRepository.GetByIdAsync(id, cancellationToken);
        if (assetType == null)
            return NotFound($"Asset type with ID {id} not found");

        var dto = new AssetTypeDto(
            assetType.Id,
            assetType.Code,
            assetType.Name,
            assetType.Description,
            assetType.IsActive,
            assetType.SortOrder,
            assetType.CategoryId
        );

        return Ok(dto);
    }

    /// <summary>
    /// Creates a new asset type. Requires admin role.
    /// </summary>
    /// <param name="dto">The asset type creation data</param>
    /// <param name="cancellationToken">Cancellation token</param>
    [HttpPost]
    [Authorize] // TODO: Restore Policy = "RequireAdminRole" for production
    [ProducesResponseType(typeof(AssetTypeDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<AssetTypeDto>> Create(
        CreateAssetTypeDto dto,
        CancellationToken cancellationToken = default)
    {
        // Validate code uniqueness
        if (await _assetTypeRepository.CodeExistsAsync(dto.Code, null, cancellationToken))
            return Conflict($"Asset type code '{dto.Code}' already exists");

        var assetType = new AssetType
        {
            Code = dto.Code.ToUpper(),
            Name = dto.Name,
            Description = dto.Description,
            SortOrder = dto.SortOrder,
            CategoryId = dto.CategoryId,
            IsActive = true
        };

        var created = await _assetTypeRepository.CreateAsync(assetType, cancellationToken);

        var resultDto = new AssetTypeDto(
            created.Id,
            created.Code,
            created.Name,
            created.Description,
            created.IsActive,
            created.SortOrder,
            created.CategoryId
        );

        return CreatedAtAction(nameof(GetById), new { id = created.Id }, resultDto);
    }

    /// <summary>
    /// Updates an existing asset type. Requires admin role.
    /// </summary>
    /// <param name="id">The asset type ID to update</param>
    /// <param name="dto">The updated asset type data</param>
    /// <param name="cancellationToken">Cancellation token</param>
    [HttpPut("{id}")]
    [Authorize] // TODO: Restore Policy = "RequireAdminRole" for production
    [ProducesResponseType(typeof(AssetTypeDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<AssetTypeDto>> Update(
        int id,
        UpdateAssetTypeDto dto,
        CancellationToken cancellationToken = default)
    {
        var assetType = await _assetTypeRepository.GetByIdAsync(id, cancellationToken);
        if (assetType == null)
            return NotFound($"Asset type with ID {id} not found");

        assetType.Name = dto.Name;
        assetType.Description = dto.Description;
        assetType.IsActive = dto.IsActive;
        assetType.SortOrder = dto.SortOrder;
        assetType.CategoryId = dto.CategoryId;

        var updated = await _assetTypeRepository.UpdateAsync(assetType, cancellationToken);

        var resultDto = new AssetTypeDto(
            updated.Id,
            updated.Code,
            updated.Name,
            updated.Description,
            updated.IsActive,
            updated.SortOrder,
            updated.CategoryId
        );

        return Ok(resultDto);
    }

    /// <summary>
    /// Soft deletes an asset type by setting IsActive to false. Requires admin role.
    /// </summary>
    /// <param name="id">The asset type ID to delete</param>
    /// <param name="cancellationToken">Cancellation token</param>
    [HttpDelete("{id}")]
    [Authorize] // TODO: Restore Policy = "RequireAdminRole" for production
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken = default)
    {
        var deleted = await _assetTypeRepository.DeleteAsync(id, cancellationToken);
        if (!deleted)
            return NotFound($"Asset type with ID {id} not found");

        return NoContent();
    }
}

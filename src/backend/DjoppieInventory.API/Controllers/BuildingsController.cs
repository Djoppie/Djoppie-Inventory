using DjoppieInventory.Core.DTOs;
using DjoppieInventory.Core.Entities;
using DjoppieInventory.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DjoppieInventory.API.Controllers;

/// <summary>
/// API controller for managing buildings.
/// </summary>
[Authorize]
[ApiController]
[Route("api/admin/[controller]")]
public class BuildingsController : ControllerBase
{
    private readonly IBuildingRepository _buildingRepository;

    public BuildingsController(IBuildingRepository buildingRepository)
    {
        _buildingRepository = buildingRepository;
    }

    /// <summary>
    /// Retrieves all buildings, optionally including inactive ones.
    /// </summary>
    /// <param name="includeInactive">Include inactive buildings in the results</param>
    /// <param name="cancellationToken">Cancellation token</param>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<BuildingDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<BuildingDto>>> GetAll(
        [FromQuery] bool includeInactive = false,
        CancellationToken cancellationToken = default)
    {
        var buildings = await _buildingRepository.GetAllAsync(includeInactive, cancellationToken);
        var dtos = buildings.Select(b => new BuildingDto(
            b.Id,
            b.Code,
            b.Name,
            b.Address,
            b.IsActive,
            b.SortOrder
        ));

        return Ok(dtos);
    }

    /// <summary>
    /// Retrieves a specific building by ID.
    /// </summary>
    /// <param name="id">The building ID</param>
    /// <param name="cancellationToken">Cancellation token</param>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(BuildingDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<BuildingDto>> GetById(int id, CancellationToken cancellationToken = default)
    {
        var building = await _buildingRepository.GetByIdAsync(id, cancellationToken);
        if (building == null)
            return NotFound($"Building with ID {id} not found");

        var dto = new BuildingDto(
            building.Id,
            building.Code,
            building.Name,
            building.Address,
            building.IsActive,
            building.SortOrder
        );

        return Ok(dto);
    }

    /// <summary>
    /// Creates a new building. Requires admin role.
    /// </summary>
    /// <param name="dto">The building creation data</param>
    /// <param name="cancellationToken">Cancellation token</param>
    [HttpPost]
    [Authorize] // TODO: Restore Policy = "RequireAdminRole" for production
    [ProducesResponseType(typeof(BuildingDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<BuildingDto>> Create(
        CreateBuildingDto dto,
        CancellationToken cancellationToken = default)
    {
        // Validate code uniqueness
        if (await _buildingRepository.CodeExistsAsync(dto.Code, null, cancellationToken))
            return Conflict($"Building code '{dto.Code}' already exists");

        var building = new Building
        {
            Code = dto.Code.ToUpper(),
            Name = dto.Name,
            Address = dto.Address,
            SortOrder = dto.SortOrder,
            IsActive = true
        };

        var created = await _buildingRepository.CreateAsync(building, cancellationToken);

        var resultDto = new BuildingDto(
            created.Id,
            created.Code,
            created.Name,
            created.Address,
            created.IsActive,
            created.SortOrder
        );

        return CreatedAtAction(nameof(GetById), new { id = created.Id }, resultDto);
    }

    /// <summary>
    /// Updates an existing building. Requires admin role.
    /// </summary>
    /// <param name="id">The building ID to update</param>
    /// <param name="dto">The updated building data</param>
    /// <param name="cancellationToken">Cancellation token</param>
    [HttpPut("{id}")]
    [Authorize] // TODO: Restore Policy = "RequireAdminRole" for production
    [ProducesResponseType(typeof(BuildingDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<BuildingDto>> Update(
        int id,
        UpdateBuildingDto dto,
        CancellationToken cancellationToken = default)
    {
        var building = await _buildingRepository.GetByIdAsync(id, cancellationToken);
        if (building == null)
            return NotFound($"Building with ID {id} not found");

        building.Name = dto.Name;
        building.Address = dto.Address;
        building.IsActive = dto.IsActive;
        building.SortOrder = dto.SortOrder;

        var updated = await _buildingRepository.UpdateAsync(building, cancellationToken);

        var resultDto = new BuildingDto(
            updated.Id,
            updated.Code,
            updated.Name,
            updated.Address,
            updated.IsActive,
            updated.SortOrder
        );

        return Ok(resultDto);
    }

    /// <summary>
    /// Soft deletes a building by setting IsActive to false. Requires admin role.
    /// </summary>
    /// <param name="id">The building ID to delete</param>
    /// <param name="cancellationToken">Cancellation token</param>
    [HttpDelete("{id}")]
    [Authorize] // TODO: Restore Policy = "RequireAdminRole" for production
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken = default)
    {
        var deleted = await _buildingRepository.DeleteAsync(id, cancellationToken);
        if (!deleted)
            return NotFound($"Building with ID {id} not found");

        return NoContent();
    }
}

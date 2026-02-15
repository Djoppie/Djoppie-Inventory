using DjoppieInventory.Core.DTOs;
using DjoppieInventory.Core.Entities;
using DjoppieInventory.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DjoppieInventory.API.Controllers;

/// <summary>
/// API controller for managing sectors.
/// </summary>
[Authorize]
[ApiController]
[Route("api/admin/[controller]")]
public class SectorsController : ControllerBase
{
    private readonly ISectorRepository _sectorRepository;

    public SectorsController(ISectorRepository sectorRepository)
    {
        _sectorRepository = sectorRepository;
    }

    /// <summary>
    /// Retrieves all sectors, optionally including inactive ones.
    /// </summary>
    /// <param name="includeInactive">Include inactive sectors in the results</param>
    /// <param name="cancellationToken">Cancellation token</param>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<SectorDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<SectorDto>>> GetAll(
        [FromQuery] bool includeInactive = false,
        CancellationToken cancellationToken = default)
    {
        var sectors = await _sectorRepository.GetAllAsync(includeInactive, cancellationToken);
        var dtos = sectors.Select(s => new SectorDto(
            s.Id,
            s.Code,
            s.Name,
            s.IsActive,
            s.SortOrder,
            null // Services collection not loaded
        ));

        return Ok(dtos);
    }

    /// <summary>
    /// Retrieves a specific sector by ID.
    /// </summary>
    /// <param name="id">The sector ID</param>
    /// <param name="cancellationToken">Cancellation token</param>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(SectorDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<SectorDto>> GetById(int id, CancellationToken cancellationToken = default)
    {
        var sector = await _sectorRepository.GetByIdAsync(id, cancellationToken);
        if (sector == null)
            return NotFound($"Sector with ID {id} not found");

        var dto = new SectorDto(
            sector.Id,
            sector.Code,
            sector.Name,
            sector.IsActive,
            sector.SortOrder,
            null // Services collection not loaded
        );

        return Ok(dto);
    }

    /// <summary>
    /// Creates a new sector. Requires admin role.
    /// </summary>
    /// <param name="dto">The sector creation data</param>
    /// <param name="cancellationToken">Cancellation token</param>
    [HttpPost]
    [Authorize] // TODO: Restore Policy = "RequireAdminRole" for production
    [ProducesResponseType(typeof(SectorDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<SectorDto>> Create(
        CreateSectorDto dto,
        CancellationToken cancellationToken = default)
    {
        // Validate code uniqueness
        if (await _sectorRepository.CodeExistsAsync(dto.Code, null, cancellationToken))
            return Conflict($"Sector code '{dto.Code}' already exists");

        var sector = new Sector
        {
            Code = dto.Code.ToUpper(),
            Name = dto.Name,
            SortOrder = dto.SortOrder,
            IsActive = true
        };

        var created = await _sectorRepository.CreateAsync(sector, cancellationToken);

        var resultDto = new SectorDto(
            created.Id,
            created.Code,
            created.Name,
            created.IsActive,
            created.SortOrder,
            null
        );

        return CreatedAtAction(nameof(GetById), new { id = created.Id }, resultDto);
    }

    /// <summary>
    /// Updates an existing sector. Requires admin role.
    /// </summary>
    /// <param name="id">The sector ID to update</param>
    /// <param name="dto">The updated sector data</param>
    /// <param name="cancellationToken">Cancellation token</param>
    [HttpPut("{id}")]
    [Authorize] // TODO: Restore Policy = "RequireAdminRole" for production
    [ProducesResponseType(typeof(SectorDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<SectorDto>> Update(
        int id,
        UpdateSectorDto dto,
        CancellationToken cancellationToken = default)
    {
        var sector = await _sectorRepository.GetByIdAsync(id, cancellationToken);
        if (sector == null)
            return NotFound($"Sector with ID {id} not found");

        sector.Name = dto.Name;
        sector.IsActive = dto.IsActive;
        sector.SortOrder = dto.SortOrder;

        var updated = await _sectorRepository.UpdateAsync(sector, cancellationToken);

        var resultDto = new SectorDto(
            updated.Id,
            updated.Code,
            updated.Name,
            updated.IsActive,
            updated.SortOrder,
            null
        );

        return Ok(resultDto);
    }

    /// <summary>
    /// Soft deletes a sector by setting IsActive to false. Requires admin role.
    /// </summary>
    /// <param name="id">The sector ID to delete</param>
    /// <param name="cancellationToken">Cancellation token</param>
    [HttpDelete("{id}")]
    [Authorize] // TODO: Restore Policy = "RequireAdminRole" for production
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken = default)
    {
        var deleted = await _sectorRepository.DeleteAsync(id, cancellationToken);
        if (!deleted)
            return NotFound($"Sector with ID {id} not found");

        return NoContent();
    }
}

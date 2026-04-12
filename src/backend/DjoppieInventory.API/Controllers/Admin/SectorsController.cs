using DjoppieInventory.Core.DTOs;
using DjoppieInventory.Core.Entities;
using DjoppieInventory.Core.Interfaces;
using DjoppieInventory.Core.Utilities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DjoppieInventory.API.Controllers.Admin;

/// <summary>
/// API controller for managing sectors.
/// </summary>
[Authorize]
[ApiController]
[Route("api/admin/[controller]")]
public class SectorsController : ControllerBase
{
    private readonly ISectorRepository _sectorRepository;
    private readonly IGraphUserService _graphUserService;
    private readonly ILogger<SectorsController> _logger;

    public SectorsController(
        ISectorRepository sectorRepository,
        IGraphUserService graphUserService,
        ILogger<SectorsController> logger)
    {
        _sectorRepository = sectorRepository;
        _graphUserService = graphUserService;
        _logger = logger;
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
    [Authorize(Policy = "RequireAdminRole")]
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
    [Authorize(Policy = "RequireAdminRole")]
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
    [Authorize(Policy = "RequireAdminRole")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken = default)
    {
        var deleted = await _sectorRepository.DeleteAsync(id, cancellationToken);
        if (!deleted)
            return NotFound($"Sector with ID {id} not found");

        return NoContent();
    }

    /// <summary>
    /// Syncs sectors from Microsoft Entra mail groups (MG-SECTOR-*).
    /// Creates new sectors for groups not yet in the database.
    /// </summary>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Sync result with counts of created and updated sectors</returns>
    [HttpPost("sync-from-entra")]
    [Authorize(Policy = "RequireAdminRole")]
    [ProducesResponseType(typeof(SyncResultDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<SyncResultDto>> SyncFromEntra(CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogInformation("Starting sector sync from Entra mail groups");

            var groups = await _graphUserService.GetSectorGroupsAsync();
            var existingSectors = await _sectorRepository.GetAllAsync(true, cancellationToken);

            // Store only IDs and essential data to avoid EF Core tracking conflicts
            // Normalize codes to remove diacritics for consistent matching
            var existingCodes = existingSectors.ToDictionary(
                s => TextUtilities.RemoveDiacritics(s.Code).ToUpperInvariant(),
                s => new { s.Id, s.Name, s.IsActive, s.SortOrder });

            int created = 0;
            int updated = 0;
            int skipped = 0;

            foreach (var group in groups)
            {
                if (string.IsNullOrEmpty(group.DisplayName)) continue;

                // Extract sector code from group name (MG-SECTOR-XXX -> XXX)
                // Normalize to remove diacritics (e.g., "financiën" -> "FINANCIEN")
                var groupName = group.DisplayName;
                var rawCode = groupName.StartsWith("MG-SECTOR-", StringComparison.OrdinalIgnoreCase)
                    ? groupName.Substring("MG-SECTOR-".Length)
                    : groupName;
                var code = TextUtilities.RemoveDiacritics(rawCode).ToUpperInvariant();

                // Use display name or mail nickname as the sector name
                var name = group.DisplayName;

                if (existingCodes.TryGetValue(code, out var existingSectorInfo))
                {
                    // Sector exists - skip (don't overwrite custom names like we do for services)
                    // The sync is primarily to create new sectors from Entra
                    skipped++;
                }
                else
                {
                    // Create new sector
                    var newSector = new Sector
                    {
                        Code = code,
                        Name = name,
                        SortOrder = 0,
                        IsActive = true
                    };
                    await _sectorRepository.CreateAsync(newSector, cancellationToken);
                    created++;
                }
            }

            _logger.LogInformation("Sector sync completed: {Created} created, {Updated} updated, {Skipped} skipped",
                created, updated, skipped);

            return Ok(new SyncResultDto(created, updated, skipped, groups.Count()));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to sync sectors from Entra");
            return StatusCode(500, new { error = "Failed to sync sectors from Entra", details = ex.Message });
        }
    }

}

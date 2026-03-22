using DjoppieInventory.Core.DTOs;
using DjoppieInventory.Core.Entities;
using DjoppieInventory.Core.Interfaces;
using DjoppieInventory.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DjoppieInventory.API.Controllers;

/// <summary>
/// API controller for managing services/departments.
/// </summary>
[Authorize]
[ApiController]
[Route("api/admin/[controller]")]
public class ServicesController : ControllerBase
{
    private readonly IServiceRepository _serviceRepository;
    private readonly ISectorRepository _sectorRepository;
    private readonly IGraphUserService _graphUserService;
    private readonly ApplicationDbContext _context;
    private readonly ILogger<ServicesController> _logger;

    public ServicesController(
        IServiceRepository serviceRepository,
        ISectorRepository sectorRepository,
        IGraphUserService graphUserService,
        ApplicationDbContext context,
        ILogger<ServicesController> logger)
    {
        _serviceRepository = serviceRepository;
        _sectorRepository = sectorRepository;
        _graphUserService = graphUserService;
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Retrieves all services, optionally including inactive ones and filtering by sector.
    /// </summary>
    /// <param name="includeInactive">Include inactive services in the results</param>
    /// <param name="sectorId">Optional filter by sector ID</param>
    /// <param name="cancellationToken">Cancellation token</param>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<ServiceDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<ServiceDto>>> GetAll(
        [FromQuery] bool includeInactive = false,
        [FromQuery] int? sectorId = null,
        CancellationToken cancellationToken = default)
    {
        var services = await _serviceRepository.GetAllAsync(includeInactive, sectorId, cancellationToken);
        var dtos = services.Select(s => new ServiceDto(
            s.Id,
            s.Code,
            s.Name,
            s.SectorId,
            s.Sector != null ? new SectorInfoDto(s.Sector.Id, s.Sector.Code, s.Sector.Name) : null,
            s.IsActive,
            s.SortOrder
        ));

        return Ok(dtos);
    }

    /// <summary>
    /// Retrieves a specific service by ID.
    /// </summary>
    /// <param name="id">The service ID</param>
    /// <param name="cancellationToken">Cancellation token</param>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(ServiceDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ServiceDto>> GetById(int id, CancellationToken cancellationToken = default)
    {
        var service = await _serviceRepository.GetByIdAsync(id, cancellationToken);
        if (service == null)
            return NotFound($"Service with ID {id} not found");

        var dto = new ServiceDto(
            service.Id,
            service.Code,
            service.Name,
            service.SectorId,
            service.Sector != null ? new SectorInfoDto(service.Sector.Id, service.Sector.Code, service.Sector.Name) : null,
            service.IsActive,
            service.SortOrder
        );

        return Ok(dto);
    }

    /// <summary>
    /// Creates a new service. Requires admin role.
    /// </summary>
    /// <param name="dto">The service creation data</param>
    /// <param name="cancellationToken">Cancellation token</param>
    [HttpPost]
    [Authorize] // TODO: Restore Policy = "RequireAdminRole" for production
    [ProducesResponseType(typeof(ServiceDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<ServiceDto>> Create(
        CreateServiceDto dto,
        CancellationToken cancellationToken = default)
    {
        // Validate code uniqueness
        if (await _serviceRepository.CodeExistsAsync(dto.Code, null, cancellationToken))
            return Conflict($"Service code '{dto.Code}' already exists");

        var service = new Service
        {
            Code = dto.Code.ToUpper(),
            Name = dto.Name,
            SectorId = dto.SectorId,
            SortOrder = dto.SortOrder,
            IsActive = true
        };

        var created = await _serviceRepository.CreateAsync(service, cancellationToken);

        var resultDto = new ServiceDto(
            created.Id,
            created.Code,
            created.Name,
            created.SectorId,
            created.Sector != null ? new SectorInfoDto(created.Sector.Id, created.Sector.Code, created.Sector.Name) : null,
            created.IsActive,
            created.SortOrder
        );

        return CreatedAtAction(nameof(GetById), new { id = created.Id }, resultDto);
    }

    /// <summary>
    /// Updates an existing service. Requires admin role.
    /// </summary>
    /// <param name="id">The service ID to update</param>
    /// <param name="dto">The updated service data</param>
    /// <param name="cancellationToken">Cancellation token</param>
    [HttpPut("{id}")]
    [Authorize] // TODO: Restore Policy = "RequireAdminRole" for production
    [ProducesResponseType(typeof(ServiceDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ServiceDto>> Update(
        int id,
        UpdateServiceDto dto,
        CancellationToken cancellationToken = default)
    {
        var service = await _serviceRepository.GetByIdAsync(id, cancellationToken);
        if (service == null)
            return NotFound($"Service with ID {id} not found");

        service.Name = dto.Name;
        service.SectorId = dto.SectorId;
        service.IsActive = dto.IsActive;
        service.SortOrder = dto.SortOrder;

        var updated = await _serviceRepository.UpdateAsync(service, cancellationToken);

        var resultDto = new ServiceDto(
            updated.Id,
            updated.Code,
            updated.Name,
            updated.SectorId,
            updated.Sector != null ? new SectorInfoDto(updated.Sector.Id, updated.Sector.Code, updated.Sector.Name) : null,
            updated.IsActive,
            updated.SortOrder
        );

        return Ok(resultDto);
    }

    /// <summary>
    /// Soft deletes a service by setting IsActive to false. Requires admin role.
    /// </summary>
    /// <param name="id">The service ID to delete</param>
    /// <param name="cancellationToken">Cancellation token</param>
    [HttpDelete("{id}")]
    [Authorize] // TODO: Restore Policy = "RequireAdminRole" for production
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken = default)
    {
        var deleted = await _serviceRepository.DeleteAsync(id, cancellationToken);
        if (!deleted)
            return NotFound($"Service with ID {id} not found");

        return NoContent();
    }

    /// <summary>
    /// Syncs services from Microsoft Entra mail groups (MG-* excluding MG-SECTOR-*).
    /// Creates new services for groups not yet in the database.
    /// Services are linked to sectors based on group membership.
    /// Non-nested services (not in any sector) are also synced without a sector.
    /// </summary>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Sync result with counts of created and updated services</returns>
    [HttpPost("sync-from-entra")]
    [Authorize] // TODO: Restore Policy = "RequireAdminRole" for production
    [ProducesResponseType(typeof(SyncResultDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<SyncResultDto>> SyncFromEntra(CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogInformation("Starting service sync from Entra mail groups");

            var existingServices = await _serviceRepository.GetAllAsync(true, null, cancellationToken);
            var existingCodes = existingServices.ToDictionary(s => s.Code.ToUpperInvariant(), s => s);

            // Get all sectors for linking services
            var sectors = await _sectorRepository.GetAllAsync(true, cancellationToken);
            var sectorsByCode = sectors.ToDictionary(s => s.Code.ToUpperInvariant(), s => s);

            // Get sector groups to find nested service groups
            var sectorGroups = await _graphUserService.GetSectorGroupsAsync();

            int created = 0;
            int updated = 0;
            int skipped = 0;
            int totalFromSource = 0;

            // Track which service codes we've processed (to avoid duplicates)
            var processedCodes = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

            // PHASE 1: Sync services that are nested (members of) sector groups
            foreach (var sectorGroup in sectorGroups)
            {
                if (string.IsNullOrEmpty(sectorGroup.Id) || string.IsNullOrEmpty(sectorGroup.DisplayName)) continue;

                var sectorCode = sectorGroup.DisplayName.StartsWith("MG-SECTOR-", StringComparison.OrdinalIgnoreCase)
                    ? sectorGroup.DisplayName.Substring("MG-SECTOR-".Length).ToUpperInvariant()
                    : sectorGroup.DisplayName.ToUpperInvariant();

                if (!sectorsByCode.TryGetValue(sectorCode, out var sector))
                {
                    _logger.LogWarning("Sector {SectorCode} not found in database, skipping its services", sectorCode);
                    continue;
                }

                // Get service groups that are members of this sector
                var nestedServiceGroups = await _graphUserService.GetSectorServiceGroupsAsync(sectorGroup.Id);

                foreach (var serviceGroup in nestedServiceGroups)
                {
                    if (string.IsNullOrEmpty(serviceGroup.DisplayName) || string.IsNullOrEmpty(serviceGroup.Id)) continue;

                    totalFromSource++;

                    // Extract service code and name from group name (MG-XXX -> XXX)
                    var groupName = serviceGroup.DisplayName;
                    var code = groupName.StartsWith("MG-", StringComparison.OrdinalIgnoreCase)
                        ? groupName.Substring("MG-".Length).ToUpperInvariant()
                        : groupName.ToUpperInvariant();

                    // Use clean name without MG- prefix
                    var name = groupName.StartsWith("MG-", StringComparison.OrdinalIgnoreCase)
                        ? groupName.Substring("MG-".Length)
                        : groupName;

                    processedCodes.Add(code);

                    if (existingCodes.TryGetValue(code, out var existingService))
                    {
                        // Service exists - update if needed
                        if (existingService.IsActive && (existingService.Name != name || existingService.SectorId != sector.Id))
                        {
                            await _context.Services
                                .Where(s => s.Id == existingService.Id)
                                .ExecuteUpdateAsync(setters => setters
                                    .SetProperty(s => s.Name, name)
                                    .SetProperty(s => s.SectorId, sector.Id)
                                    .SetProperty(s => s.UpdatedAt, DateTime.UtcNow),
                                    cancellationToken);
                            updated++;
                        }
                        else
                        {
                            skipped++;
                        }
                    }
                    else
                    {
                        // Create new service with sector
                        var newService = new Service
                        {
                            Code = code,
                            Name = name,
                            SectorId = sector.Id,
                            SortOrder = 0,
                            IsActive = true
                        };
                        await _serviceRepository.CreateAsync(newService, cancellationToken);
                        existingCodes[code] = newService; // Add to tracking
                        created++;
                    }
                }
            }

            // PHASE 2: Sync non-nested MG-* groups (without sector)
            _logger.LogInformation("Syncing non-nested service groups");
            var allServiceGroups = await _graphUserService.GetServiceGroupsAsync();

            foreach (var serviceGroup in allServiceGroups)
            {
                if (string.IsNullOrEmpty(serviceGroup.DisplayName) || string.IsNullOrEmpty(serviceGroup.Id)) continue;

                var groupName = serviceGroup.DisplayName;
                var code = groupName.StartsWith("MG-", StringComparison.OrdinalIgnoreCase)
                    ? groupName.Substring("MG-".Length).ToUpperInvariant()
                    : groupName.ToUpperInvariant();

                // Skip if already processed in phase 1
                if (processedCodes.Contains(code)) continue;

                totalFromSource++;

                var name = groupName.StartsWith("MG-", StringComparison.OrdinalIgnoreCase)
                    ? groupName.Substring("MG-".Length)
                    : groupName;

                if (existingCodes.TryGetValue(code, out var existingService))
                {
                    // Service exists - update name if needed (keep existing sector)
                    if (existingService.IsActive && existingService.Name != name)
                    {
                        await _context.Services
                            .Where(s => s.Id == existingService.Id)
                            .ExecuteUpdateAsync(setters => setters
                                .SetProperty(s => s.Name, name)
                                .SetProperty(s => s.UpdatedAt, DateTime.UtcNow),
                                cancellationToken);
                        updated++;
                    }
                    else
                    {
                        skipped++;
                    }
                }
                else
                {
                    // Create new service without sector
                    var newService = new Service
                    {
                        Code = code,
                        Name = name,
                        SectorId = null, // No sector for non-nested services
                        SortOrder = 0,
                        IsActive = true
                    };
                    await _serviceRepository.CreateAsync(newService, cancellationToken);
                    created++;
                }
            }

            _logger.LogInformation("Service sync completed: {Created} created, {Updated} updated, {Skipped} skipped",
                created, updated, skipped);

            return Ok(new SyncResultDto(created, updated, skipped, totalFromSource));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to sync services from Entra");
            return StatusCode(500, new { error = "Failed to sync services from Entra", details = ex.Message });
        }
    }
}

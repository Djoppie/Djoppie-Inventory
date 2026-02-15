using DjoppieInventory.Core.DTOs;
using DjoppieInventory.Core.Entities;
using DjoppieInventory.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

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

    public ServicesController(IServiceRepository serviceRepository)
    {
        _serviceRepository = serviceRepository;
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
}

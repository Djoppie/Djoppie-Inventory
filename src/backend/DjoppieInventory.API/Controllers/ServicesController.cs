using System.Globalization;
using System.Text;
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
    [Authorize(Policy = "RequireAdminRole")]
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
    [Authorize(Policy = "RequireAdminRole")]
    [ProducesResponseType(typeof(ServiceDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<ServiceDto>> Update(
        int id,
        UpdateServiceDto dto,
        CancellationToken cancellationToken = default)
    {
        var service = await _serviceRepository.GetByIdAsync(id, cancellationToken);
        if (service == null)
            return NotFound($"Service with ID {id} not found");

        // If code is being changed, validate uniqueness
        if (!string.IsNullOrWhiteSpace(dto.Code) && !dto.Code.Equals(service.Code, StringComparison.OrdinalIgnoreCase))
        {
            var newCode = dto.Code.Trim().ToUpperInvariant();
            if (await _serviceRepository.CodeExistsAsync(newCode, id, cancellationToken))
                return Conflict($"Service code '{newCode}' already exists");
            service.Code = newCode;
        }

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
    [Authorize(Policy = "RequireAdminRole")]
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
    [Authorize(Policy = "RequireAdminRole")]
    [ProducesResponseType(typeof(SyncResultDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<SyncResultDto>> SyncFromEntra(CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogInformation("Starting service sync from Entra mail groups");

            var existingServices = await _serviceRepository.GetAllAsync(true, null, cancellationToken);
            var existingCodes = existingServices.ToDictionary(s => RemoveDiacritics(s.Code).ToUpperInvariant(), s => s);

            // Get all sectors for linking services
            var sectors = await _sectorRepository.GetAllAsync(true, cancellationToken);
            var sectorsByCode = sectors.ToDictionary(s => RemoveDiacritics(s.Code).ToUpperInvariant(), s => s);

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

                var rawSectorCode = sectorGroup.DisplayName.StartsWith("MG-SECTOR-", StringComparison.OrdinalIgnoreCase)
                    ? sectorGroup.DisplayName.Substring("MG-SECTOR-".Length)
                    : sectorGroup.DisplayName;
                var sectorCode = RemoveDiacritics(rawSectorCode).ToUpperInvariant();

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
                    var rawCode = groupName.StartsWith("MG-", StringComparison.OrdinalIgnoreCase)
                        ? groupName.Substring("MG-".Length)
                        : groupName;
                    var code = RemoveDiacritics(rawCode).ToUpperInvariant();

                    // Use clean name without MG- prefix
                    var name = groupName.StartsWith("MG-", StringComparison.OrdinalIgnoreCase)
                        ? groupName.Substring("MG-".Length)
                        : groupName;

                    processedCodes.Add(code);

                    if (existingCodes.TryGetValue(code, out var existingService))
                    {
                        // Service exists - only update EntraGroupId and SectorId, preserve custom Name
                        var needsUpdate = existingService.EntraGroupId != serviceGroup.Id || existingService.SectorId != sector.Id;
                        if (existingService.IsActive && needsUpdate)
                        {
                            await _context.Services
                                .Where(s => s.Id == existingService.Id)
                                .ExecuteUpdateAsync(setters => setters
                                    .SetProperty(s => s.EntraGroupId, serviceGroup.Id)
                                    .SetProperty(s => s.EntraMailNickname, serviceGroup.MailNickname)
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
                        // Create new service with sector and Entra link
                        var newService = new Service
                        {
                            Code = code,
                            Name = name,
                            SectorId = sector.Id,
                            SortOrder = 0,
                            IsActive = true,
                            EntraGroupId = serviceGroup.Id,
                            EntraMailNickname = serviceGroup.MailNickname
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
                var rawCode = groupName.StartsWith("MG-", StringComparison.OrdinalIgnoreCase)
                    ? groupName.Substring("MG-".Length)
                    : groupName;
                var code = RemoveDiacritics(rawCode).ToUpperInvariant();

                // Skip if already processed in phase 1
                if (processedCodes.Contains(code)) continue;

                totalFromSource++;

                var name = groupName.StartsWith("MG-", StringComparison.OrdinalIgnoreCase)
                    ? groupName.Substring("MG-".Length)
                    : groupName;

                if (existingCodes.TryGetValue(code, out var existingService))
                {
                    // Service exists - only update EntraGroupId if missing, preserve custom Name and Sector
                    if (existingService.IsActive && existingService.EntraGroupId != serviceGroup.Id)
                    {
                        await _context.Services
                            .Where(s => s.Id == existingService.Id)
                            .ExecuteUpdateAsync(setters => setters
                                .SetProperty(s => s.EntraGroupId, serviceGroup.Id)
                                .SetProperty(s => s.EntraMailNickname, serviceGroup.MailNickname)
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
                    // Create new service without sector but with Entra link
                    var newService = new Service
                    {
                        Code = code,
                        Name = name,
                        SectorId = null, // No sector for non-nested services
                        SortOrder = 0,
                        IsActive = true,
                        EntraGroupId = serviceGroup.Id,
                        EntraMailNickname = serviceGroup.MailNickname
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

    // ============================================================
    // CSV Import/Export Endpoints
    // ============================================================

    /// <summary>
    /// Downloads a CSV template for bulk service import.
    /// </summary>
    [HttpGet("template")]
    [ProducesResponseType(typeof(FileContentResult), StatusCodes.Status200OK)]
    public IActionResult DownloadTemplate()
    {
        var template = "Code,Name,SectorCode,SortOrder\nDIENST-001,Voorbeeld Dienst,SECTOR-A,0";
        var bytes = Encoding.UTF8.GetBytes(template);
        return File(bytes, "text/csv", $"services-template_{DateTime.Now:yyyy-MM-dd}.csv");
    }

    /// <summary>
    /// Exports all services to a CSV file.
    /// </summary>
    [HttpGet("export")]
    [ProducesResponseType(typeof(FileContentResult), StatusCodes.Status200OK)]
    public async Task<IActionResult> ExportCsv(CancellationToken cancellationToken = default)
    {
        var services = await _serviceRepository.GetAllAsync(true, null, cancellationToken);

        var sb = new StringBuilder();
        sb.AppendLine("Code,Name,SectorCode,SortOrder,IsActive");

        foreach (var service in services)
        {
            var sectorCode = service.Sector?.Code ?? "";
            sb.AppendLine($"\"{service.Code}\",\"{service.Name}\",\"{sectorCode}\",{service.SortOrder},{service.IsActive}");
        }

        var bytes = Encoding.UTF8.GetBytes(sb.ToString());
        return File(bytes, "text/csv", $"services-export_{DateTime.Now:yyyy-MM-dd}.csv");
    }

    /// <summary>
    /// Imports services from a CSV file.
    /// </summary>
    [HttpPost("import")]
    [Authorize]
    [ProducesResponseType(typeof(ServiceImportResultDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ServiceImportResultDto>> ImportCsv(
        IFormFile file,
        CancellationToken cancellationToken = default)
    {
        if (file == null || file.Length == 0)
            return BadRequest("No file uploaded");

        var results = new List<ServiceImportRowResult>();

        // Build lookup dictionaries - only store IDs, not tracked entities
        // Normalize codes to remove diacritics for consistent matching
        var sectors = await _sectorRepository.GetAllAsync(true, cancellationToken);
        var sectorIdsByCode = sectors.ToDictionary(s => RemoveDiacritics(s.Code).ToUpperInvariant(), s => s.Id);
        var existingServices = await _serviceRepository.GetAllAsync(true, null, cancellationToken);
        var existingServicesByCode = existingServices.ToDictionary(s => RemoveDiacritics(s.Code).ToUpperInvariant(), s => s.Id);

        using var reader = new StreamReader(file.OpenReadStream());
        var headerLine = await reader.ReadLineAsync(cancellationToken);
        if (string.IsNullOrEmpty(headerLine))
            return BadRequest("CSV file is empty");

        // Detect delimiter from header line (supports comma, semicolon, tab)
        var delimiter = DetectDelimiter(headerLine);

        int rowNumber = 1;
        int created = 0;
        int updated = 0;
        int errors = 0;

        while (!reader.EndOfStream)
        {
            rowNumber++;
            var line = await reader.ReadLineAsync(cancellationToken);
            if (string.IsNullOrWhiteSpace(line)) continue;

            try
            {
                var values = ParseCsvLine(line, delimiter);
                if (values.Length < 2)
                {
                    results.Add(new ServiceImportRowResult(rowNumber, null, null, false, "Onvoldoende kolommen"));
                    errors++;
                    continue;
                }

                var code = RemoveDiacritics(values[0].Trim()).ToUpperInvariant();
                var name = values[1].Trim();
                var sectorCode = values.Length > 2 ? RemoveDiacritics(values[2].Trim()).ToUpperInvariant() : "";
                var sortOrder = values.Length > 3 && int.TryParse(values[3].Trim(), out var so) ? so : 0;

                if (string.IsNullOrEmpty(code) || string.IsNullOrEmpty(name))
                {
                    results.Add(new ServiceImportRowResult(rowNumber, code, name, false, "Code en Naam zijn verplicht"));
                    errors++;
                    continue;
                }

                int? sectorId = null;
                if (!string.IsNullOrEmpty(sectorCode) && sectorIdsByCode.TryGetValue(sectorCode, out var foundSectorId))
                {
                    sectorId = foundSectorId;
                }

                if (existingServicesByCode.TryGetValue(code, out var existingId))
                {
                    // Update existing - fetch fresh to avoid tracking issues
                    var existing = await _serviceRepository.GetByIdAsync(existingId, cancellationToken);
                    if (existing != null)
                    {
                        existing.Name = name;
                        existing.SectorId = sectorId;
                        existing.SortOrder = sortOrder;
                        existing.Sector = null; // Clear navigation property to avoid tracking issues
                        await _serviceRepository.UpdateAsync(existing, cancellationToken);
                        results.Add(new ServiceImportRowResult(rowNumber, code, name, true, null, existing.Id, true));
                        updated++;
                    }
                }
                else
                {
                    // Create new
                    var newService = new Service
                    {
                        Code = code,
                        Name = name,
                        SectorId = sectorId,
                        SortOrder = sortOrder,
                        IsActive = true
                    };
                    var createdService = await _serviceRepository.CreateAsync(newService, cancellationToken);
                    existingServicesByCode[code] = createdService.Id;
                    results.Add(new ServiceImportRowResult(rowNumber, code, name, true, null, createdService.Id, false));
                    created++;
                }
            }
            catch (Exception ex)
            {
                results.Add(new ServiceImportRowResult(rowNumber, null, null, false, ex.Message));
                errors++;
            }
        }

        return Ok(new ServiceImportResultDto(rowNumber - 1, created, updated, errors, errors == 0, results));
    }

    /// <summary>
    /// Deletes ALL services. Use with caution!
    /// </summary>
    [HttpDelete("all")]
    [Authorize]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> DeleteAll(
        [FromQuery] bool confirm = false,
        CancellationToken cancellationToken = default)
    {
        if (!confirm)
            return BadRequest("You must pass ?confirm=true to delete all services");

        var allServices = await _context.Services.ToListAsync(cancellationToken);
        var count = allServices.Count;

        _context.Services.RemoveRange(allServices);
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogWarning("Deleted ALL {Count} services", count);

        return Ok(new { message = $"Deleted {count} services", count });
    }

    private static string[] ParseCsvLine(string line, char delimiter = ',')
    {
        var result = new List<string>();
        var inQuotes = false;
        var current = new StringBuilder();

        foreach (var c in line)
        {
            if (c == '"')
            {
                inQuotes = !inQuotes;
            }
            else if (c == delimiter && !inQuotes)
            {
                result.Add(current.ToString());
                current.Clear();
            }
            else
            {
                current.Append(c);
            }
        }
        result.Add(current.ToString());

        return result.ToArray();
    }

    private static char DetectDelimiter(string headerLine)
    {
        // Count occurrences of common delimiters
        var commaCount = headerLine.Count(c => c == ',');
        var semicolonCount = headerLine.Count(c => c == ';');
        var tabCount = headerLine.Count(c => c == '\t');

        // Return the most common one (prefer semicolon for European locales)
        if (semicolonCount >= commaCount && semicolonCount >= tabCount)
            return ';';
        if (tabCount > commaCount)
            return '\t';
        return ',';
    }

    /// <summary>
    /// Removes diacritics/accents from a string (e.g., "financiën" → "financien")
    /// </summary>
    private static string RemoveDiacritics(string text)
    {
        if (string.IsNullOrEmpty(text))
            return text;

        var normalizedString = text.Normalize(NormalizationForm.FormD);
        var stringBuilder = new StringBuilder(normalizedString.Length);

        foreach (var c in normalizedString)
        {
            var unicodeCategory = CharUnicodeInfo.GetUnicodeCategory(c);
            if (unicodeCategory != UnicodeCategory.NonSpacingMark)
            {
                stringBuilder.Append(c);
            }
        }

        return stringBuilder.ToString().Normalize(NormalizationForm.FormC);
    }
}

public record ServiceImportResultDto(
    int TotalRows,
    int CreatedCount,
    int UpdatedCount,
    int ErrorCount,
    bool IsFullySuccessful,
    List<ServiceImportRowResult> Results
);

public record ServiceImportRowResult(
    int RowNumber,
    string? Code,
    string? Name,
    bool Success,
    string? Error,
    int? ServiceId = null,
    bool WasUpdated = false
);

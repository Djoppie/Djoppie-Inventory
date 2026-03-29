using DjoppieInventory.Core.DTOs;
using DjoppieInventory.Core.Entities;
using DjoppieInventory.Core.Entities.Enums;
using DjoppieInventory.Core.Interfaces;
using DjoppieInventory.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DjoppieInventory.API.Controllers;

/// <summary>
/// API controller for managing employees
/// </summary>
[Authorize]
[ApiController]
[Route("api/admin/[controller]")]
public class EmployeesController : ControllerBase
{
    private readonly IEmployeeRepository _employeeRepository;
    private readonly IAssetRepository _assetRepository;
    private readonly IOrganizationSyncService _organizationSyncService;
    private readonly ApplicationDbContext _context;
    private readonly ILogger<EmployeesController> _logger;

    public EmployeesController(
        IEmployeeRepository employeeRepository,
        IAssetRepository assetRepository,
        IOrganizationSyncService organizationSyncService,
        ApplicationDbContext context,
        ILogger<EmployeesController> logger)
    {
        _employeeRepository = employeeRepository ?? throw new ArgumentNullException(nameof(employeeRepository));
        _assetRepository = assetRepository ?? throw new ArgumentNullException(nameof(assetRepository));
        _organizationSyncService = organizationSyncService ?? throw new ArgumentNullException(nameof(organizationSyncService));
        _context = context ?? throw new ArgumentNullException(nameof(context));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    /// <summary>
    /// Gets all employees with optional filtering
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<EmployeeDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<EmployeeDto>>> GetAll(
        [FromQuery] bool includeInactive = false,
        [FromQuery] int? serviceId = null,
        CancellationToken cancellationToken = default)
    {
        var employees = await _employeeRepository.GetAllAsync(includeInactive, serviceId, cancellationToken);
        var assetCounts = await _employeeRepository.GetAllAssetCountsAsync(cancellationToken);

        var dtos = employees.Select(e => MapToDto(e, assetCounts.GetValueOrDefault(e.Id, 0)));
        return Ok(dtos);
    }

    /// <summary>
    /// Gets a single employee by ID
    /// </summary>
    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(EmployeeDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<EmployeeDto>> GetById(int id, CancellationToken cancellationToken = default)
    {
        var employee = await _employeeRepository.GetByIdAsync(id, cancellationToken);
        if (employee == null)
            return NotFound($"Employee with ID {id} not found");

        var assetCount = await _employeeRepository.GetAssetCountAsync(id, cancellationToken);
        return Ok(MapToDto(employee, assetCount));
    }

    /// <summary>
    /// Gets a single employee by Entra ID (Azure AD object ID)
    /// </summary>
    [HttpGet("entra/{entraId}")]
    [ProducesResponseType(typeof(EmployeeDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<EmployeeDto>> GetByEntraId(string entraId, CancellationToken cancellationToken = default)
    {
        var employee = await _employeeRepository.GetByEntraIdAsync(entraId, cancellationToken);
        if (employee == null)
            return NotFound($"Employee with Entra ID {entraId} not found");

        var assetCount = await _employeeRepository.GetAssetCountAsync(employee.Id, cancellationToken);
        return Ok(MapToDto(employee, assetCount));
    }

    /// <summary>
    /// Searches employees by display name
    /// </summary>
    [HttpGet("search")]
    [ProducesResponseType(typeof(IEnumerable<EmployeeDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<EmployeeDto>>> Search(
        [FromQuery] string q,
        [FromQuery] int maxResults = 20,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(q))
            return Ok(Enumerable.Empty<EmployeeDto>());

        var employees = await _employeeRepository.SearchByNameAsync(q, maxResults, cancellationToken);
        var assetCounts = await _employeeRepository.GetAllAssetCountsAsync(cancellationToken);

        var dtos = employees.Select(e => MapToDto(e, assetCounts.GetValueOrDefault(e.Id, 0)));
        return Ok(dtos);
    }

    /// <summary>
    /// Creates a new employee
    /// </summary>
    [HttpPost]
    [Authorize(Policy = "RequireAdminRole")]
    [ProducesResponseType(typeof(EmployeeDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<EmployeeDto>> Create(
        CreateEmployeeDto dto,
        CancellationToken cancellationToken = default)
    {
        // Validate required fields
        if (string.IsNullOrWhiteSpace(dto.EntraId))
            return BadRequest("EntraId is required");
        if (string.IsNullOrWhiteSpace(dto.UserPrincipalName))
            return BadRequest("UserPrincipalName is required");
        if (string.IsNullOrWhiteSpace(dto.DisplayName))
            return BadRequest("DisplayName is required");

        // Check for duplicate EntraId
        if (await _employeeRepository.EntraIdExistsAsync(dto.EntraId, null, cancellationToken))
            return Conflict($"Employee with Entra ID '{dto.EntraId}' already exists");

        var employee = new Employee
        {
            EntraId = dto.EntraId,
            UserPrincipalName = dto.UserPrincipalName,
            DisplayName = dto.DisplayName,
            Email = dto.Email,
            Department = dto.Department,
            JobTitle = dto.JobTitle,
            OfficeLocation = dto.OfficeLocation,
            MobilePhone = dto.MobilePhone,
            CompanyName = dto.CompanyName,
            ServiceId = dto.ServiceId,
            IsActive = true,
            EntraSyncStatus = EntraSyncStatus.None
        };

        var created = await _employeeRepository.CreateAsync(employee, cancellationToken);
        _logger.LogInformation("Created employee {DisplayName} with ID {Id}", created.DisplayName, created.Id);

        return CreatedAtAction(nameof(GetById), new { id = created.Id }, MapToDto(created, 0));
    }

    /// <summary>
    /// Updates an existing employee
    /// </summary>
    [HttpPut("{id:int}")]
    [Authorize(Policy = "RequireAdminRole")]
    [ProducesResponseType(typeof(EmployeeDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<EmployeeDto>> Update(
        int id,
        UpdateEmployeeDto dto,
        CancellationToken cancellationToken = default)
    {
        var employee = await _employeeRepository.GetByIdAsync(id, cancellationToken);
        if (employee == null)
            return NotFound($"Employee with ID {id} not found");

        // Clear navigation property to avoid EF tracking conflicts
        employee.Service = null;

        // Update mutable fields
        employee.DisplayName = dto.DisplayName;
        employee.Email = dto.Email;
        employee.Department = dto.Department;
        employee.JobTitle = dto.JobTitle;
        employee.OfficeLocation = dto.OfficeLocation;
        employee.MobilePhone = dto.MobilePhone;
        employee.CompanyName = dto.CompanyName;
        employee.ServiceId = dto.ServiceId;
        employee.IsActive = dto.IsActive;
        employee.SortOrder = dto.SortOrder;

        var updated = await _employeeRepository.UpdateAsync(employee, cancellationToken);
        var assetCount = await _employeeRepository.GetAssetCountAsync(id, cancellationToken);

        _logger.LogInformation("Updated employee {DisplayName} with ID {Id}", updated.DisplayName, updated.Id);

        return Ok(MapToDto(updated, assetCount));
    }

    /// <summary>
    /// Soft deletes an employee (sets IsActive to false)
    /// </summary>
    [HttpDelete("{id:int}")]
    [Authorize(Policy = "RequireAdminRole")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken = default)
    {
        var deleted = await _employeeRepository.DeleteAsync(id, cancellationToken);
        if (!deleted)
            return NotFound($"Employee with ID {id} not found");

        _logger.LogInformation("Soft-deleted employee with ID {Id}", id);
        return NoContent();
    }

    /// <summary>
    /// Syncs employees from Entra ID mail groups (MG-*).
    /// Iterates through all services with EntraGroupId and imports group members as employees.
    /// </summary>
    [HttpPost("sync")]
    [Authorize(Policy = "RequireAdminRole")]
    [ProducesResponseType(typeof(EmployeeSyncResultDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<EmployeeSyncResultDto>> SyncFromEntra(CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Employee sync from Entra requested");

        var result = await _organizationSyncService.SyncEmployeesAsync(cancellationToken);

        _logger.LogInformation(
            "Employee sync completed: {Created} created, {Updated} updated, {Failed} failed",
            result.Created, result.Updated, result.Failed);

        return Ok(result);
    }

    /// <summary>
    /// Gets all assets assigned to an employee
    /// </summary>
    [HttpGet("{id:int}/assets")]
    [ProducesResponseType(typeof(IEnumerable<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<IEnumerable<object>>> GetEmployeeAssets(
        int id,
        CancellationToken cancellationToken = default)
    {
        var employee = await _employeeRepository.GetByIdAsync(id, cancellationToken);
        if (employee == null)
            return NotFound($"Employee with ID {id} not found");

        // Get assets assigned to this employee
        var assets = await _assetRepository.GetByEmployeeIdAsync(id, cancellationToken);

        // Return simplified asset info
        var assetDtos = assets.Select(a => new
        {
            a.Id,
            a.AssetCode,
            a.AssetName,
            a.Category,
            AssetType = a.AssetType != null ? new { a.AssetType.Id, a.AssetType.Code, a.AssetType.Name } : null,
            a.SerialNumber,
            a.Brand,
            a.Model,
            Status = a.Status.ToString(),
            a.InstallationDate
        });

        return Ok(assetDtos);
    }

    /// <summary>
    /// Preview laptop-employee linking (dry run).
    /// Shows which laptops will be linked to which employees based on Owner name matching.
    /// </summary>
    [HttpGet("link-laptops/preview")]
    [Authorize(Policy = "RequireAdminRole")]
    [ProducesResponseType(typeof(LaptopLinkPreviewDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<LaptopLinkPreviewDto>> PreviewLaptopLinking(
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Laptop-employee linking preview requested");

        // Get all laptops (filter by asset type or category containing laptop keywords)
        var laptopKeywords = new[] { "laptop", "notebook", "not", "lap" };
        var laptops = await _context.Assets
            .Include(a => a.AssetType)
            .Include(a => a.Employee)
            .Where(a =>
                (a.AssetType != null && (
                    laptopKeywords.Any(kw => a.AssetType.Code.ToLower().Contains(kw)) ||
                    laptopKeywords.Any(kw => a.AssetType.Name.ToLower().Contains(kw))
                )) ||
                (a.Category != null && laptopKeywords.Any(kw => a.Category.ToLower().Contains(kw))))
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        // Get all employees for matching
        var employees = await _context.Employees
            .Where(e => e.IsActive)
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        // Create lookup by display name (case-insensitive)
        var employeeByName = employees
            .GroupBy(e => e.DisplayName.ToLower().Trim())
            .ToDictionary(g => g.Key, g => g.First());

        // Also create lookup by email for fallback
        var employeeByEmail = employees
            .Where(e => !string.IsNullOrEmpty(e.Email))
            .GroupBy(e => e.Email!.ToLower().Trim())
            .ToDictionary(g => g.Key, g => g.First());

        var items = new List<LaptopLinkItemDto>();

        foreach (var laptop in laptops)
        {
            Employee? matchedEmployee = null;
            string? matchReason = null;

            // Check if already linked
            if (laptop.EmployeeId.HasValue)
            {
                items.Add(new LaptopLinkItemDto(
                    laptop.Id,
                    laptop.AssetCode,
                    laptop.AssetName,
                    laptop.SerialNumber,
                    laptop.Owner,
                    laptop.Status.ToString(),
                    laptop.Employee?.Id,
                    laptop.Employee?.DisplayName,
                    laptop.Employee?.Email,
                    IsAlreadyLinked: true,
                    CanLink: false,
                    MatchReason: "Already linked to employee"
                ));
                continue;
            }

            // Try to match by Owner field
            if (!string.IsNullOrEmpty(laptop.Owner))
            {
                var ownerLower = laptop.Owner.ToLower().Trim();

                // Try exact name match first
                if (employeeByName.TryGetValue(ownerLower, out var empByName))
                {
                    matchedEmployee = empByName;
                    matchReason = "Matched by Owner name";
                }
                // Try email match
                else if (employeeByEmail.TryGetValue(ownerLower, out var empByEmail))
                {
                    matchedEmployee = empByEmail;
                    matchReason = "Matched by Owner email";
                }
            }

            items.Add(new LaptopLinkItemDto(
                laptop.Id,
                laptop.AssetCode,
                laptop.AssetName,
                laptop.SerialNumber,
                laptop.Owner,
                laptop.Status.ToString(),
                matchedEmployee?.Id,
                matchedEmployee?.DisplayName,
                matchedEmployee?.Email,
                IsAlreadyLinked: false,
                CanLink: matchedEmployee != null,
                MatchReason: matchReason ?? "No matching employee found"
            ));
        }

        var alreadyLinked = items.Count(i => i.IsAlreadyLinked);
        var willBeLinked = items.Count(i => !i.IsAlreadyLinked && i.CanLink);
        var unmatched = items.Count(i => !i.IsAlreadyLinked && !i.CanLink);

        _logger.LogInformation(
            "Laptop linking preview: {Total} laptops, {AlreadyLinked} already linked, {WillBeLinked} will be linked, {Unmatched} unmatched",
            items.Count, alreadyLinked, willBeLinked, unmatched);

        return Ok(new LaptopLinkPreviewDto(
            items.Count,
            alreadyLinked,
            willBeLinked,
            unmatched,
            items
        ));
    }

    /// <summary>
    /// Execute laptop-employee linking.
    /// Links laptops to employees based on Owner name matching.
    /// </summary>
    [HttpPost("link-laptops")]
    [Authorize(Policy = "RequireAdminRole")]
    [ProducesResponseType(typeof(LaptopLinkResultDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<LaptopLinkResultDto>> ExecuteLaptopLinking(
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Laptop-employee linking execution requested");

        // Get all laptops that are NOT already linked
        var laptopKeywords = new[] { "laptop", "notebook", "not", "lap" };
        var laptops = await _context.Assets
            .Include(a => a.AssetType)
            .Where(a => a.EmployeeId == null) // Only unlinked laptops
            .Where(a =>
                (a.AssetType != null && (
                    laptopKeywords.Any(kw => a.AssetType.Code.ToLower().Contains(kw)) ||
                    laptopKeywords.Any(kw => a.AssetType.Name.ToLower().Contains(kw))
                )) ||
                (a.Category != null && laptopKeywords.Any(kw => a.Category.ToLower().Contains(kw))))
            .ToListAsync(cancellationToken);

        // Get all employees for matching
        var employees = await _context.Employees
            .Where(e => e.IsActive)
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        // Create lookup by display name (case-insensitive)
        var employeeByName = employees
            .GroupBy(e => e.DisplayName.ToLower().Trim())
            .ToDictionary(g => g.Key, g => g.First());

        // Also create lookup by email for fallback
        var employeeByEmail = employees
            .Where(e => !string.IsNullOrEmpty(e.Email))
            .GroupBy(e => e.Email!.ToLower().Trim())
            .ToDictionary(g => g.Key, g => g.First());

        var linkedItems = new List<LaptopLinkItemDto>();
        var unmatchedItems = new List<LaptopLinkItemDto>();
        var errorMessages = new List<string>();
        var successfullyLinked = 0;
        var errors = 0;

        foreach (var laptop in laptops)
        {
            Employee? matchedEmployee = null;
            string? matchReason = null;

            // Try to match by Owner field
            if (!string.IsNullOrEmpty(laptop.Owner))
            {
                var ownerLower = laptop.Owner.ToLower().Trim();

                // Try exact name match first
                if (employeeByName.TryGetValue(ownerLower, out var empByName))
                {
                    matchedEmployee = empByName;
                    matchReason = "Matched by Owner name";
                }
                // Try email match
                else if (employeeByEmail.TryGetValue(ownerLower, out var empByEmail))
                {
                    matchedEmployee = empByEmail;
                    matchReason = "Matched by Owner email";
                }
            }

            if (matchedEmployee != null)
            {
                try
                {
                    laptop.EmployeeId = matchedEmployee.Id;
                    laptop.UpdatedAt = DateTime.UtcNow;

                    linkedItems.Add(new LaptopLinkItemDto(
                        laptop.Id,
                        laptop.AssetCode,
                        laptop.AssetName,
                        laptop.SerialNumber,
                        laptop.Owner,
                        laptop.Status.ToString(),
                        matchedEmployee.Id,
                        matchedEmployee.DisplayName,
                        matchedEmployee.Email,
                        IsAlreadyLinked: false,
                        CanLink: true,
                        MatchReason: matchReason
                    ));
                    successfullyLinked++;
                }
                catch (Exception ex)
                {
                    errorMessages.Add($"Error linking asset {laptop.AssetCode}: {ex.Message}");
                    errors++;
                }
            }
            else
            {
                unmatchedItems.Add(new LaptopLinkItemDto(
                    laptop.Id,
                    laptop.AssetCode,
                    laptop.AssetName,
                    laptop.SerialNumber,
                    laptop.Owner,
                    laptop.Status.ToString(),
                    null,
                    null,
                    null,
                    IsAlreadyLinked: false,
                    CanLink: false,
                    MatchReason: "No matching employee found"
                ));
            }
        }

        // Save all changes
        if (successfullyLinked > 0)
        {
            await _context.SaveChangesAsync(cancellationToken);
        }

        _logger.LogInformation(
            "Laptop linking completed: {Linked} linked, {Unmatched} unmatched, {Errors} errors",
            successfullyLinked, unmatchedItems.Count, errors);

        return Ok(new LaptopLinkResultDto(
            laptops.Count,
            successfullyLinked,
            0, // Already linked ones were excluded from this query
            unmatchedItems.Count,
            errors,
            errorMessages,
            linkedItems,
            unmatchedItems
        ));
    }

    private static EmployeeDto MapToDto(Employee employee, int assetCount)
    {
        return new EmployeeDto(
            employee.Id,
            employee.EntraId,
            employee.UserPrincipalName,
            employee.DisplayName,
            employee.Email,
            employee.Department,
            employee.JobTitle,
            employee.OfficeLocation,
            employee.MobilePhone,
            employee.CompanyName,
            employee.ServiceId,
            employee.Service != null
                ? new ServiceInfoDto(employee.Service.Id, employee.Service.Code, employee.Service.Name)
                : null,
            employee.IsActive,
            employee.SortOrder,
            assetCount,
            employee.EntraLastSyncAt,
            employee.EntraSyncStatus,
            employee.CreatedAt,
            employee.UpdatedAt
        );
    }
}

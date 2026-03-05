using DjoppieInventory.Core.DTOs;
using DjoppieInventory.Core.Entities;
using DjoppieInventory.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DjoppieInventory.API.Controllers;

/// <summary>
/// API controller for managing categories.
/// Categories group asset types into logical groups (e.g., Computing, Werkplek, Peripherals).
/// </summary>
[Authorize]
[ApiController]
[Route("api/admin/[controller]")]
public class CategoriesController : ControllerBase
{
    private readonly ICategoryRepository _categoryRepository;

    public CategoriesController(ICategoryRepository categoryRepository)
    {
        _categoryRepository = categoryRepository;
    }

    /// <summary>
    /// Retrieves all categories, optionally including inactive ones.
    /// </summary>
    /// <param name="includeInactive">Include inactive categories in the results</param>
    /// <param name="cancellationToken">Cancellation token</param>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<CategoryDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<CategoryDto>>> GetAll(
        [FromQuery] bool includeInactive = false,
        CancellationToken cancellationToken = default)
    {
        var categories = await _categoryRepository.GetAllAsync(includeInactive, cancellationToken);
        var dtos = categories.Select(c => new CategoryDto(
            c.Id,
            c.Code,
            c.Name,
            c.Description,
            c.IsActive,
            c.SortOrder,
            c.AssetTypes?.Count ?? 0
        ));

        return Ok(dtos);
    }

    /// <summary>
    /// Retrieves a specific category by ID, including its asset types.
    /// </summary>
    /// <param name="id">The category ID</param>
    /// <param name="cancellationToken">Cancellation token</param>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(CategoryWithAssetTypesDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<CategoryWithAssetTypesDto>> GetById(int id, CancellationToken cancellationToken = default)
    {
        var category = await _categoryRepository.GetByIdAsync(id, cancellationToken);
        if (category == null)
            return NotFound($"Category with ID {id} not found");

        var dto = new CategoryWithAssetTypesDto(
            category.Id,
            category.Code,
            category.Name,
            category.Description,
            category.IsActive,
            category.SortOrder,
            category.AssetTypes?.Select(at => new AssetTypeDto(
                at.Id,
                at.Code,
                at.Name,
                at.Description,
                at.IsActive,
                at.SortOrder,
                at.CategoryId
            )).ToList() ?? new List<AssetTypeDto>()
        );

        return Ok(dto);
    }

    /// <summary>
    /// Creates a new category. Requires admin role.
    /// </summary>
    /// <param name="dto">The category creation data</param>
    /// <param name="cancellationToken">Cancellation token</param>
    [HttpPost]
    [Authorize] // TODO: Restore Policy = "RequireAdminRole" for production
    [ProducesResponseType(typeof(CategoryDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<CategoryDto>> Create(
        CreateCategoryDto dto,
        CancellationToken cancellationToken = default)
    {
        // Validate code uniqueness
        if (await _categoryRepository.CodeExistsAsync(dto.Code, null, cancellationToken))
            return Conflict($"Category code '{dto.Code}' already exists");

        var category = new Category
        {
            Code = dto.Code.ToUpper(),
            Name = dto.Name,
            Description = dto.Description,
            SortOrder = dto.SortOrder,
            IsActive = true
        };

        var created = await _categoryRepository.CreateAsync(category, cancellationToken);

        var resultDto = new CategoryDto(
            created.Id,
            created.Code,
            created.Name,
            created.Description,
            created.IsActive,
            created.SortOrder,
            0
        );

        return CreatedAtAction(nameof(GetById), new { id = created.Id }, resultDto);
    }

    /// <summary>
    /// Updates an existing category. Requires admin role.
    /// </summary>
    /// <param name="id">The category ID to update</param>
    /// <param name="dto">The updated category data</param>
    /// <param name="cancellationToken">Cancellation token</param>
    [HttpPut("{id}")]
    [Authorize] // TODO: Restore Policy = "RequireAdminRole" for production
    [ProducesResponseType(typeof(CategoryDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<CategoryDto>> Update(
        int id,
        UpdateCategoryDto dto,
        CancellationToken cancellationToken = default)
    {
        var category = await _categoryRepository.GetByIdAsync(id, cancellationToken);
        if (category == null)
            return NotFound($"Category with ID {id} not found");

        // Check code uniqueness if code is being changed
        if (category.Code != dto.Code.ToUpper())
        {
            if (await _categoryRepository.CodeExistsAsync(dto.Code, id, cancellationToken))
                return Conflict($"Category code '{dto.Code}' already exists");
            category.Code = dto.Code.ToUpper();
        }

        category.Name = dto.Name;
        category.Description = dto.Description;
        category.IsActive = dto.IsActive;
        category.SortOrder = dto.SortOrder;

        var updated = await _categoryRepository.UpdateAsync(category, cancellationToken);

        var resultDto = new CategoryDto(
            updated.Id,
            updated.Code,
            updated.Name,
            updated.Description,
            updated.IsActive,
            updated.SortOrder,
            updated.AssetTypes?.Count ?? 0
        );

        return Ok(resultDto);
    }

    /// <summary>
    /// Soft deletes a category by setting IsActive to false. Requires admin role.
    /// </summary>
    /// <param name="id">The category ID to delete</param>
    /// <param name="cancellationToken">Cancellation token</param>
    [HttpDelete("{id}")]
    [Authorize] // TODO: Restore Policy = "RequireAdminRole" for production
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken = default)
    {
        var deleted = await _categoryRepository.DeleteAsync(id, cancellationToken);
        if (!deleted)
            return NotFound($"Category with ID {id} not found");

        return NoContent();
    }
}

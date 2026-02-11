using AutoMapper;
using DjoppieInventory.Core.DTOs;
using DjoppieInventory.Core.Entities;
using DjoppieInventory.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DjoppieInventory.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class AssetTemplatesController : ControllerBase
{
    private readonly IAssetTemplateRepository _templateRepository;
    private readonly IMapper _mapper;
    private readonly ILogger<AssetTemplatesController> _logger;

    public AssetTemplatesController(
        IAssetTemplateRepository templateRepository,
        IMapper mapper,
        ILogger<AssetTemplatesController> logger)
    {
        _templateRepository = templateRepository;
        _mapper = mapper;
        _logger = logger;
    }

    /// <summary>
    /// Retrieves all active asset templates
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<AssetTemplateDto>>> GetTemplates()
    {
        _logger.LogInformation("Retrieving all asset templates");
        var templates = await _templateRepository.GetAllAsync();
        var templateDtos = _mapper.Map<IEnumerable<AssetTemplateDto>>(templates);
        return Ok(templateDtos);
    }

    /// <summary>
    /// Retrieves a specific asset template by ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<AssetTemplateDto>> GetTemplate(int id)
    {
        _logger.LogInformation("Retrieving template {TemplateId}", id);
        var template = await _templateRepository.GetByIdAsync(id);
        if (template == null)
        {
            _logger.LogWarning("Template with ID {TemplateId} not found", id);
            return NotFound($"Template with ID {id} not found");
        }

        var templateDto = _mapper.Map<AssetTemplateDto>(template);
        return Ok(templateDto);
    }

    /// <summary>
    /// Creates a new asset template
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<AssetTemplateDto>> CreateTemplate(CreateAssetTemplateDto createDto)
    {
        _logger.LogInformation("Creating new asset template: {TemplateName}", createDto.TemplateName);
        var template = _mapper.Map<AssetTemplate>(createDto);
        var created = await _templateRepository.CreateAsync(template);
        var templateDto = _mapper.Map<AssetTemplateDto>(created);
        _logger.LogInformation("Created template {TemplateId}: {TemplateName}", templateDto.Id, templateDto.TemplateName);
        return CreatedAtAction(nameof(GetTemplate), new { id = templateDto.Id }, templateDto);
    }

    /// <summary>
    /// Updates an existing asset template
    /// </summary>
    [HttpPut("{id}")]
    public async Task<ActionResult<AssetTemplateDto>> UpdateTemplate(int id, UpdateAssetTemplateDto updateDto)
    {
        _logger.LogInformation("Updating template {TemplateId}", id);
        var existing = await _templateRepository.GetByIdAsync(id);
        if (existing == null)
        {
            _logger.LogWarning("Template with ID {TemplateId} not found for update", id);
            return NotFound($"Template with ID {id} not found");
        }

        _mapper.Map(updateDto, existing);
        var updated = await _templateRepository.UpdateAsync(existing);
        var templateDto = _mapper.Map<AssetTemplateDto>(updated);
        _logger.LogInformation("Updated template {TemplateId}", id);
        return Ok(templateDto);
    }

    /// <summary>
    /// Soft deletes an asset template (sets IsActive to false)
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteTemplate(int id)
    {
        _logger.LogInformation("Deleting template {TemplateId}", id);
        var existing = await _templateRepository.GetByIdAsync(id);
        if (existing == null)
        {
            _logger.LogWarning("Template with ID {TemplateId} not found for deletion", id);
            return NotFound($"Template with ID {id} not found");
        }

        await _templateRepository.DeleteAsync(id);
        _logger.LogInformation("Deleted template {TemplateId}", id);
        return NoContent();
    }
}

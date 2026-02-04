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

    [HttpGet]
    public async Task<ActionResult<IEnumerable<AssetTemplateDto>>> GetTemplates()
    {
        try
        {
            var templates = await _templateRepository.GetAllAsync();
            var templateDtos = _mapper.Map<IEnumerable<AssetTemplateDto>>(templates);
            return Ok(templateDtos);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving asset templates");
            return StatusCode(500, "An error occurred while retrieving templates");
        }
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<AssetTemplateDto>> GetTemplate(int id)
    {
        try
        {
            var template = await _templateRepository.GetByIdAsync(id);
            if (template == null)
                return NotFound($"Template with ID {id} not found");

            var templateDto = _mapper.Map<AssetTemplateDto>(template);
            return Ok(templateDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving template {TemplateId}", id);
            return StatusCode(500, "An error occurred while retrieving the template");
        }
    }

    [HttpPost]
    public async Task<ActionResult<AssetTemplateDto>> CreateTemplate(CreateAssetTemplateDto createDto)
    {
        try
        {
            var template = _mapper.Map<AssetTemplate>(createDto);
            var created = await _templateRepository.CreateAsync(template);
            var templateDto = _mapper.Map<AssetTemplateDto>(created);
            return CreatedAtAction(nameof(GetTemplate), new { id = templateDto.Id }, templateDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating asset template");
            return StatusCode(500, "An error occurred while creating the template");
        }
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<AssetTemplateDto>> UpdateTemplate(int id, UpdateAssetTemplateDto updateDto)
    {
        try
        {
            var existing = await _templateRepository.GetByIdAsync(id);
            if (existing == null)
                return NotFound($"Template with ID {id} not found");

            _mapper.Map(updateDto, existing);
            var updated = await _templateRepository.UpdateAsync(existing);
            var templateDto = _mapper.Map<AssetTemplateDto>(updated);
            return Ok(templateDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating template {TemplateId}", id);
            return StatusCode(500, "An error occurred while updating the template");
        }
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteTemplate(int id)
    {
        try
        {
            var existing = await _templateRepository.GetByIdAsync(id);
            if (existing == null)
                return NotFound($"Template with ID {id} not found");

            await _templateRepository.DeleteAsync(id);
            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting template {TemplateId}", id);
            return StatusCode(500, "An error occurred while deleting the template");
        }
    }
}

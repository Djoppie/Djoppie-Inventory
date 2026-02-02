using AutoMapper;
using DjoppieInventory.Core.DTOs;
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
}

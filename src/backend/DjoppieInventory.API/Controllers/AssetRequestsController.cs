using DjoppieInventory.Core.DTOs;
using DjoppieInventory.Core.Entities;
using DjoppieInventory.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace DjoppieInventory.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class AssetRequestsController : ControllerBase
{
    private readonly IAssetRequestRepository _repository;
    private readonly ILogger<AssetRequestsController> _logger;

    public AssetRequestsController(
        IAssetRequestRepository repository,
        ILogger<AssetRequestsController> logger)
    {
        _repository = repository;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<AssetRequestDto>>> GetAll()
    {
        try
        {
            var requests = await _repository.GetAllAsync();
            var dtos = requests.Select(MapToDto);
            return Ok(dtos);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving asset requests");
            return StatusCode(500, "Error retrieving asset requests");
        }
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<AssetRequestDto>> GetById(int id)
    {
        try
        {
            var request = await _repository.GetByIdAsync(id);
            if (request == null)
                return NotFound();

            return Ok(MapToDto(request));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving asset request {Id}", id);
            return StatusCode(500, "Error retrieving asset request");
        }
    }

    [HttpGet("date-range")]
    public async Task<ActionResult<IEnumerable<AssetRequestDto>>> GetByDateRange(
        [FromQuery] DateTime startDate,
        [FromQuery] DateTime endDate)
    {
        try
        {
            var requests = await _repository.GetByDateRangeAsync(startDate, endDate);
            var dtos = requests.Select(MapToDto);
            return Ok(dtos);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving asset requests for date range");
            return StatusCode(500, "Error retrieving asset requests");
        }
    }

    [HttpPost]
    public async Task<ActionResult<AssetRequestDto>> Create([FromBody] CreateAssetRequestDto dto)
    {
        try
        {
            var request = new AssetRequest
            {
                RequestedDate = dto.RequestedDate,
                RequestType = ParseRequestType(dto.RequestType),
                EmployeeName = dto.EmployeeName,
                AssetType = dto.AssetType,
                Notes = dto.Notes,
                Status = AssetRequestStatus.Pending,
                CreatedBy = User.FindFirst(ClaimTypes.Name)?.Value ?? "Unknown",
                CreatedAt = DateTime.UtcNow
            };

            var created = await _repository.CreateAsync(request);
            _logger.LogInformation("Asset request created: {Id}", created.Id);

            return CreatedAtAction(nameof(GetById), new { id = created.Id }, MapToDto(created));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating asset request");
            return StatusCode(500, "Error creating asset request");
        }
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<AssetRequestDto>> Update(int id, [FromBody] UpdateAssetRequestDto dto)
    {
        try
        {
            var request = await _repository.GetByIdAsync(id);
            if (request == null)
                return NotFound();

            // Update fields if provided
            if (dto.RequestedDate.HasValue)
                request.RequestedDate = dto.RequestedDate.Value;

            if (!string.IsNullOrEmpty(dto.RequestType))
                request.RequestType = ParseRequestType(dto.RequestType);

            if (!string.IsNullOrEmpty(dto.EmployeeName))
                request.EmployeeName = dto.EmployeeName;

            if (!string.IsNullOrEmpty(dto.AssetType))
                request.AssetType = dto.AssetType;

            if (dto.Notes != null)
                request.Notes = dto.Notes;

            if (!string.IsNullOrEmpty(dto.Status))
                request.Status = ParseStatus(dto.Status);

            if (dto.AssignedAssetId.HasValue)
                request.AssignedAssetId = dto.AssignedAssetId.Value;

            request.ModifiedBy = User.FindFirst(ClaimTypes.Name)?.Value ?? "Unknown";
            request.ModifiedAt = DateTime.UtcNow;

            if (request.Status == AssetRequestStatus.Completed)
                request.CompletedAt = DateTime.UtcNow;

            var updated = await _repository.UpdateAsync(request);
            return Ok(MapToDto(updated));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating asset request {Id}", id);
            return StatusCode(500, "Error updating asset request");
        }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        try
        {
            var request = await _repository.GetByIdAsync(id);
            if (request == null)
                return NotFound();

            await _repository.DeleteAsync(id);
            _logger.LogInformation("Asset request deleted: {Id}", id);

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting asset request {Id}", id);
            return StatusCode(500, "Error deleting asset request");
        }
    }

    private static AssetRequestDto MapToDto(AssetRequest request)
    {
        return new AssetRequestDto
        {
            Id = request.Id,
            RequestedDate = request.RequestedDate,
            RequestType = request.RequestType.ToString().ToLower(),
            EmployeeName = request.EmployeeName,
            AssetType = request.AssetType,
            Notes = request.Notes,
            Status = request.Status.ToString(),
            AssignedAssetId = request.AssignedAssetId,
            AssignedAssetCode = request.AssignedAsset?.AssetCode,
            CreatedBy = request.CreatedBy,
            CreatedAt = request.CreatedAt,
            ModifiedBy = request.ModifiedBy,
            ModifiedAt = request.ModifiedAt,
            CompletedAt = request.CompletedAt
        };
    }

    private static AssetRequestType ParseRequestType(string type)
    {
        return type.ToLower() switch
        {
            "onboarding" => AssetRequestType.Onboarding,
            "offboarding" => AssetRequestType.Offboarding,
            _ => AssetRequestType.Onboarding
        };
    }

    private static AssetRequestStatus ParseStatus(string status)
    {
        return status switch
        {
            "Pending" => AssetRequestStatus.Pending,
            "Approved" => AssetRequestStatus.Approved,
            "InProgress" => AssetRequestStatus.InProgress,
            "Completed" => AssetRequestStatus.Completed,
            "Cancelled" => AssetRequestStatus.Cancelled,
            "Rejected" => AssetRequestStatus.Rejected,
            _ => AssetRequestStatus.Pending
        };
    }
}

using DjoppieInventory.Core.DTOs;
using DjoppieInventory.Core.Entities;
using DjoppieInventory.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace DjoppieInventory.API.Controllers.Operations;

[Authorize]
[ApiController]
[Route("api/operations/requests")]
public class RequestsController : ControllerBase
{
    private readonly IAssetRequestRepository _repository;
    private readonly IAssetRequestCompletionService _completion;
    private readonly ILogger<RequestsController> _logger;

    public RequestsController(
        IAssetRequestRepository repository,
        IAssetRequestCompletionService completion,
        ILogger<RequestsController> logger)
    {
        _repository = repository;
        _completion = completion;
        _logger = logger;
    }

    private string CurrentUser => User.FindFirst(ClaimTypes.Name)?.Value ?? "Unknown";
    private string? CurrentUserEmail => User.FindFirst(ClaimTypes.Email)?.Value
                                        ?? User.FindFirst("preferred_username")?.Value;

    // ===== Request CRUD =====

    [HttpGet]
    public async Task<ActionResult<IEnumerable<AssetRequestSummaryDto>>> Query(
        [FromQuery] string? type,
        [FromQuery] string[]? status,
        [FromQuery] DateTime? dateFrom,
        [FromQuery] DateTime? dateTo,
        [FromQuery] int? employeeId,
        [FromQuery] string? q)
    {
        try
        {
            var filter = new AssetRequestFilter
            {
                Type = ParseType(type),
                Statuses = status?.Select(ParseStatus).ToList(),
                DateFrom = dateFrom,
                DateTo = dateTo,
                EmployeeId = employeeId,
                SearchQuery = q
            };

            var requests = await _repository.QueryAsync(filter);
            return Ok(requests.Select(MapToSummary));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<AssetRequestDetailDto>> GetById(int id)
    {
        var request = await _repository.GetByIdAsync(id);
        return request == null ? NotFound() : Ok(MapToDetail(request));
    }

    [HttpPost]
    public async Task<ActionResult<AssetRequestDetailDto>> Create([FromBody] CreateAssetRequestDto dto)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(dto.RequestedFor))
                return BadRequest("RequestedFor is required.");
            var requestType = ParseType(dto.RequestType);
            if (requestType == null)
                return BadRequest("RequestType is required and must be 'onboarding' or 'offboarding'.");

            var request = new AssetRequest
            {
                RequestType = requestType.Value,
                RequestedFor = dto.RequestedFor.Trim(),
                EmployeeId = dto.EmployeeId,
                RequestedDate = dto.RequestedDate,
                PhysicalWorkplaceId = dto.PhysicalWorkplaceId,
                Notes = dto.Notes,
                Status = AssetRequestStatus.Pending,
                CreatedBy = CurrentUser,
                CreatedAt = DateTime.UtcNow
            };

            foreach (var lineDto in dto.Lines)
            {
                request.Lines.Add(new AssetRequestLine
                {
                    AssetTypeId = lineDto.AssetTypeId,
                    SourceType = ParseSourceType(lineDto.SourceType),
                    AssetId = lineDto.AssetId,
                    AssetTemplateId = lineDto.AssetTemplateId,
                    ReturnAction = ParseReturnAction(lineDto.ReturnAction),
                    Notes = lineDto.Notes,
                    Status = AssetRequestLineStatus.Pending,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                });
            }

            var created = await _repository.CreateAsync(request);
            var refreshed = await _repository.GetByIdAsync(created.Id);
            return CreatedAtAction(nameof(GetById), new { id = created.Id }, MapToDetail(refreshed!));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<AssetRequestDetailDto>> Update(int id, [FromBody] UpdateAssetRequestDto dto)
    {
        var request = await _repository.GetByIdAsync(id);
        if (request == null) return NotFound();
        if (request.Status == AssetRequestStatus.Completed || request.Status == AssetRequestStatus.Cancelled)
            return Conflict("Cannot edit a completed or cancelled request.");

        if (dto.RequestedFor != null) request.RequestedFor = dto.RequestedFor.Trim();
        if (dto.EmployeeId.HasValue) request.EmployeeId = dto.EmployeeId.Value;
        if (dto.RequestedDate.HasValue) request.RequestedDate = dto.RequestedDate.Value;
        if (dto.PhysicalWorkplaceId.HasValue) request.PhysicalWorkplaceId = dto.PhysicalWorkplaceId.Value;
        if (dto.Notes != null) request.Notes = dto.Notes;

        request.ModifiedBy = CurrentUser;
        request.ModifiedAt = DateTime.UtcNow;

        await _repository.UpdateAsync(request);
        var refreshed = await _repository.GetByIdAsync(id);
        return Ok(MapToDetail(refreshed!));
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var request = await _repository.GetByIdAsync(id);
        if (request == null) return NotFound();
        if (request.Status != AssetRequestStatus.Pending)
            return Conflict("Only Pending requests can be deleted.");

        await _repository.DeleteAsync(id);
        return NoContent();
    }

    // ===== Line CRUD =====

    [HttpPost("{id:int}/lines")]
    public async Task<ActionResult<AssetRequestLineDto>> AddLine(int id, [FromBody] CreateAssetRequestLineDto dto)
    {
        try
        {
            var request = await _repository.GetByIdAsync(id);
            if (request == null) return NotFound();
            if (request.Status == AssetRequestStatus.Completed || request.Status == AssetRequestStatus.Cancelled)
                return Conflict("Cannot add lines to a completed or cancelled request.");

            var line = new AssetRequestLine
            {
                AssetRequestId = id,
                AssetTypeId = dto.AssetTypeId,
                SourceType = ParseSourceType(dto.SourceType),
                AssetId = dto.AssetId,
                AssetTemplateId = dto.AssetTemplateId,
                ReturnAction = ParseReturnAction(dto.ReturnAction),
                Notes = dto.Notes,
                Status = AssetRequestLineStatus.Pending,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            await _repository.AddLineAsync(line);
            var refreshed = await _repository.GetByIdAsync(id);
            var inserted = refreshed!.Lines.First(l => l.Id == line.Id);
            return Ok(MapLine(inserted));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpPut("{id:int}/lines/{lineId:int}")]
    public async Task<ActionResult<AssetRequestLineDto>> UpdateLine(int id, int lineId, [FromBody] UpdateAssetRequestLineDto dto)
    {
        try
        {
            var request = await _repository.GetByIdAsync(id);
            if (request == null) return NotFound();
            var line = request.Lines.FirstOrDefault(l => l.Id == lineId);
            if (line == null) return NotFound();
            if (request.Status == AssetRequestStatus.Completed || request.Status == AssetRequestStatus.Cancelled)
                return Conflict("Cannot edit lines on a completed or cancelled request.");

            if (dto.AssetTypeId.HasValue) line.AssetTypeId = dto.AssetTypeId.Value;
            if (dto.SourceType != null) line.SourceType = ParseSourceType(dto.SourceType);
            if (dto.AssetId.HasValue) line.AssetId = dto.AssetId.Value;
            if (dto.AssetTemplateId.HasValue) line.AssetTemplateId = dto.AssetTemplateId.Value;
            if (dto.Status != null) line.Status = ParseLineStatus(dto.Status);
            if (dto.ReturnAction != null) line.ReturnAction = ParseReturnAction(dto.ReturnAction);
            if (dto.Notes != null) line.Notes = dto.Notes;

            await _repository.UpdateLineAsync(line);
            var refreshed = await _repository.GetByIdAsync(id);
            var updated = refreshed!.Lines.First(l => l.Id == lineId);
            return Ok(MapLine(updated));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpDelete("{id:int}/lines/{lineId:int}")]
    public async Task<IActionResult> DeleteLine(int id, int lineId)
    {
        var request = await _repository.GetByIdAsync(id);
        if (request == null) return NotFound();
        if (request.Status == AssetRequestStatus.Completed)
            return Conflict("Cannot remove lines from a completed request.");
        var line = request.Lines.FirstOrDefault(l => l.Id == lineId);
        if (line == null) return NotFound();

        await _repository.DeleteLineAsync(lineId);
        return NoContent();
    }

    // ===== Transition / link =====

    [HttpPost("{id:int}/transition")]
    public async Task<ActionResult<AssetRequestDetailDto>> Transition(int id, [FromBody] AssetRequestTransitionDto dto)
    {
        try
        {
            var target = ParseStatus(dto.Target);
            await _completion.TransitionAsync(id, target, CurrentUser, CurrentUserEmail);
            var refreshed = await _repository.GetByIdAsync(id);
            return Ok(MapToDetail(refreshed!));
        }
        catch (Exception ex) when (ex is InvalidOperationException || ex is ArgumentException)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpPost("{id:int}/link-employee")]
    public async Task<ActionResult<AssetRequestDetailDto>> LinkEmployee(int id, [FromBody] LinkEmployeeDto dto)
    {
        var request = await _repository.GetByIdAsync(id);
        if (request == null) return NotFound();

        request.EmployeeId = dto.EmployeeId;
        request.ModifiedBy = CurrentUser;
        request.ModifiedAt = DateTime.UtcNow;
        await _repository.UpdateAsync(request);

        var refreshed = await _repository.GetByIdAsync(id);
        return Ok(MapToDetail(refreshed!));
    }

    // ===== Statistics =====

    [HttpGet("statistics")]
    public async Task<ActionResult<AssetRequestStatisticsDto>> GetStatistics()
    {
        var s = await _repository.GetStatisticsAsync();
        return Ok(new AssetRequestStatisticsDto
        {
            ActiveRequests = s.ActiveRequests,
            MonthlyRequests = s.MonthlyRequests,
            InProgressRequests = s.InProgressRequests
        });
    }

    // ===== Mappers / parsers =====

    private static AssetRequestSummaryDto MapToSummary(AssetRequest r) => new()
    {
        Id = r.Id,
        RequestType = r.RequestType.ToString().ToLower(),
        Status = r.Status.ToString(),
        RequestedFor = r.RequestedFor,
        EmployeeId = r.EmployeeId,
        EmployeeDisplayName = r.Employee?.DisplayName,
        RequestedDate = r.RequestedDate,
        PhysicalWorkplaceId = r.PhysicalWorkplaceId,
        PhysicalWorkplaceName = r.PhysicalWorkplace?.Name,
        LineCount = r.Lines.Count,
        CompletedLineCount = r.Lines.Count(l => l.Status == AssetRequestLineStatus.Completed),
        CreatedAt = r.CreatedAt,
        CompletedAt = r.CompletedAt
    };

    private static AssetRequestDetailDto MapToDetail(AssetRequest r)
    {
        var dto = new AssetRequestDetailDto
        {
            Id = r.Id,
            RequestType = r.RequestType.ToString().ToLower(),
            Status = r.Status.ToString(),
            RequestedFor = r.RequestedFor,
            EmployeeId = r.EmployeeId,
            EmployeeDisplayName = r.Employee?.DisplayName,
            RequestedDate = r.RequestedDate,
            PhysicalWorkplaceId = r.PhysicalWorkplaceId,
            PhysicalWorkplaceName = r.PhysicalWorkplace?.Name,
            LineCount = r.Lines.Count,
            CompletedLineCount = r.Lines.Count(l => l.Status == AssetRequestLineStatus.Completed),
            CreatedAt = r.CreatedAt,
            CompletedAt = r.CompletedAt,
            Notes = r.Notes,
            CreatedBy = r.CreatedBy,
            ModifiedBy = r.ModifiedBy,
            ModifiedAt = r.ModifiedAt,
            Lines = r.Lines.OrderBy(l => l.Id).Select(MapLine).ToList()
        };
        return dto;
    }

    private static AssetRequestLineDto MapLine(AssetRequestLine l) => new()
    {
        Id = l.Id,
        AssetTypeId = l.AssetTypeId,
        AssetTypeName = l.AssetType?.Name ?? string.Empty,
        SourceType = l.SourceType.ToString(),
        AssetId = l.AssetId,
        AssetCode = l.Asset?.AssetCode,
        AssetName = l.Asset?.AssetName,
        AssetTemplateId = l.AssetTemplateId,
        AssetTemplateName = l.AssetTemplate?.TemplateName,
        Status = l.Status.ToString(),
        ReturnAction = l.ReturnAction?.ToString(),
        Notes = l.Notes,
        CreatedAt = l.CreatedAt,
        UpdatedAt = l.UpdatedAt
    };

    private static AssetRequestType? ParseType(string? value) => value?.ToLower() switch
    {
        null or "" => null,
        "onboarding" => AssetRequestType.Onboarding,
        "offboarding" => AssetRequestType.Offboarding,
        _ => throw new ArgumentException($"Unknown request type '{value}'")
    };

    private static AssetRequestStatus ParseStatus(string value)
    {
        if (Enum.TryParse<AssetRequestStatus>(value, ignoreCase: true, out var result))
            return result;
        throw new ArgumentException($"Unknown status '{value}'");
    }

    private static AssetLineSourceType ParseSourceType(string value)
    {
        if (Enum.TryParse<AssetLineSourceType>(value, ignoreCase: true, out var result))
            return result;
        return AssetLineSourceType.ToBeAssigned;
    }

    private static AssetRequestLineStatus ParseLineStatus(string value)
    {
        if (Enum.TryParse<AssetRequestLineStatus>(value, ignoreCase: true, out var result))
            return result;
        throw new ArgumentException($"Unknown line status '{value}'");
    }

    private static AssetReturnAction? ParseReturnAction(string? value)
    {
        if (string.IsNullOrEmpty(value)) return null;
        if (Enum.TryParse<AssetReturnAction>(value, ignoreCase: true, out var result))
            return result;
        throw new ArgumentException($"Unknown return action '{value}'");
    }
}

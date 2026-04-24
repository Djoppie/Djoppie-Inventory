using DjoppieInventory.Core.DTOs;
using DjoppieInventory.Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DjoppieInventory.API.Controllers.Reports;

[ApiController]
[Route("api/reports/employees")]
[Authorize]
public class EmployeeReportsController : ControllerBase
{
    private readonly EmployeeReportsService _service;

    public EmployeeReportsController(EmployeeReportsService service)
    {
        _service = service;
    }

    [HttpGet]
    [ProducesResponseType(typeof(List<EmployeeReportItemDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<EmployeeReportItemDto>>> GetEmployees(CancellationToken ct)
    {
        return Ok(await _service.GetEmployeesAsync(ct));
    }

    [HttpGet("{id:int}/timeline")]
    [ProducesResponseType(typeof(List<EmployeeTimelineItemDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<EmployeeTimelineItemDto>>> GetTimeline(
        int id,
        [FromQuery] int take = 50,
        CancellationToken ct = default)
    {
        return Ok(await _service.GetEmployeeTimelineAsync(id, take, ct));
    }
}

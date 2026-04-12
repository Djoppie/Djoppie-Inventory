using DjoppieInventory.Core.DTOs.LaptopSwap;
using DjoppieInventory.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using System.Security.Claims;

namespace DjoppieInventory.API.Controllers.Operations;

/// <summary>
/// API controller for device deployment operations (onboarding and laptop swaps).
/// </summary>
[Authorize]
[ApiController]
[Route("api/operations/deployments")]
[EnableRateLimiting("fixed")]
public class DeploymentController : ControllerBase
{
    private readonly IDeploymentService _deploymentService;
    private readonly ILogger<DeploymentController> _logger;

    public DeploymentController(
        IDeploymentService deploymentService,
        ILogger<DeploymentController> logger)
    {
        _deploymentService = deploymentService;
        _logger = logger;
    }

    /// <summary>
    /// Executes a device deployment (onboarding or laptop swap).
    /// </summary>
    /// <param name="request">Deployment request containing asset and user details</param>
    /// <param name="forceOccupantUpdate">If true, bypasses occupant conflict check</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Deployment result with summary of changes</returns>
    [HttpPost("execute")]
    [ProducesResponseType(typeof(DeploymentResultDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(OccupantConflictResponse), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<DeploymentResultDto>> ExecuteDeployment(
        [FromBody] ExecuteDeploymentDto request,
        [FromQuery] bool forceOccupantUpdate = false,
        CancellationToken cancellationToken = default)
    {
        // Get current user info
        var performedBy = User.FindFirst(ClaimTypes.Name)?.Value ?? "System";
        var performedByEmail = User.FindFirst(ClaimTypes.Email)?.Value ??
                               User.FindFirst("preferred_username")?.Value ?? "";

        // Validate request
        if (request.Mode != DeploymentMode.Offboarding && !request.NewLaptopAssetId.HasValue)
        {
            return BadRequest(new ValidationProblemDetails(new Dictionary<string, string[]>
            {
                { "newLaptopAssetId", new[] { "New laptop ID is required for onboarding and swap modes" } }
            }));
        }

        if ((request.Mode == DeploymentMode.Swap || request.Mode == DeploymentMode.Offboarding) && !request.OldLaptopAssetId.HasValue)
        {
            return BadRequest(new ValidationProblemDetails(new Dictionary<string, string[]>
            {
                { "oldLaptopAssetId", new[] { "Old laptop ID is required for swap and offboarding modes" } }
            }));
        }

        // Check for occupant conflict if physical workplace is provided and not forcing
        // Skip for offboarding mode since we're clearing the occupant, not adding one
        if (request.PhysicalWorkplaceId.HasValue && !forceOccupantUpdate && request.Mode != DeploymentMode.Offboarding)
        {
            var conflict = await _deploymentService.CheckOccupantConflictAsync(
                request.PhysicalWorkplaceId.Value,
                request.NewOwnerEntraId,
                request.NewOwnerName,
                request.NewOwnerEmail,
                cancellationToken);

            if (conflict != null)
            {
                _logger.LogInformation(
                    "Occupant conflict detected for workplace {WorkplaceId}: Current={CurrentOccupant}, Requested={RequestedOccupant}",
                    request.PhysicalWorkplaceId, conflict.CurrentOccupantEmail, conflict.RequestedOccupantEmail);

                return Conflict(new OccupantConflictResponse
                {
                    Type = "conflict",
                    Message = "Physical workplace is currently occupied by a different user",
                    CurrentOccupant = new OccupantInfo
                    {
                        Name = conflict.CurrentOccupantName,
                        Email = conflict.CurrentOccupantEmail,
                        OccupiedSince = conflict.OccupiedSince
                    },
                    RequestedOccupant = new OccupantInfo
                    {
                        Name = conflict.RequestedOccupantName,
                        Email = conflict.RequestedOccupantEmail
                    }
                });
            }
        }

        try
        {
            var result = await _deploymentService.ExecuteDeploymentAsync(
                request,
                performedBy,
                performedByEmail,
                cancellationToken);

            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, "Validation error during deployment");
            return BadRequest(new ValidationProblemDetails(new Dictionary<string, string[]>
            {
                { "general", new[] { ex.Message } }
            }));
        }
    }

    /// <summary>
    /// Checks if a physical workplace has an occupant conflict.
    /// </summary>
    /// <param name="physicalWorkplaceId">Physical workplace ID</param>
    /// <param name="ownerEntraId">Requested owner Entra ID</param>
    /// <param name="ownerName">Requested owner name</param>
    /// <param name="ownerEmail">Requested owner email</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Conflict info if exists, null otherwise</returns>
    [HttpGet("check-occupant-conflict")]
    [ProducesResponseType(typeof(OccupantConflictDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<ActionResult<OccupantConflictDto?>> CheckOccupantConflict(
        [FromQuery] int physicalWorkplaceId,
        [FromQuery] string ownerEntraId,
        [FromQuery] string ownerName,
        [FromQuery] string ownerEmail,
        CancellationToken cancellationToken = default)
    {
        var conflict = await _deploymentService.CheckOccupantConflictAsync(
            physicalWorkplaceId,
            ownerEntraId,
            ownerName,
            ownerEmail,
            cancellationToken);

        if (conflict == null)
        {
            return NoContent();
        }

        return Ok(conflict);
    }

    /// <summary>
    /// Gets deployment history with filters and pagination.
    /// </summary>
    /// <param name="fromDate">Optional start date filter</param>
    /// <param name="toDate">Optional end date filter</param>
    /// <param name="ownerEmail">Optional owner email filter</param>
    /// <param name="mode">Optional deployment mode filter (Onboarding or Swap)</param>
    /// <param name="pageNumber">Page number (1-based, default: 1)</param>
    /// <param name="pageSize">Page size (default: 50, max: 200)</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Paged deployment history</returns>
    [HttpGet("history")]
    [ProducesResponseType(typeof(DeploymentHistoryResultDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<DeploymentHistoryResultDto>> GetDeploymentHistory(
        [FromQuery] DateTime? fromDate = null,
        [FromQuery] DateTime? toDate = null,
        [FromQuery] string? ownerEmail = null,
        [FromQuery] DeploymentMode? mode = null,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 50,
        CancellationToken cancellationToken = default)
    {
        var result = await _deploymentService.GetDeploymentHistoryAsync(
            fromDate,
            toDate,
            ownerEmail,
            mode,
            pageNumber,
            pageSize,
            cancellationToken);

        return Ok(result);
    }
}

/// <summary>
/// Response structure for occupant conflict errors
/// </summary>
public class OccupantConflictResponse
{
    public string Type { get; set; } = "conflict";
    public string Message { get; set; } = string.Empty;
    public OccupantInfo CurrentOccupant { get; set; } = new();
    public OccupantInfo RequestedOccupant { get; set; } = new();
}

/// <summary>
/// Occupant information for conflict response
/// </summary>
public class OccupantInfo
{
    public string? Name { get; set; }
    public string? Email { get; set; }
    public DateTime? OccupiedSince { get; set; }
}

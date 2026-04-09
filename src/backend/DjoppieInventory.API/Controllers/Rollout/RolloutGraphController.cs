using DjoppieInventory.Core.DTOs;
using DjoppieInventory.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DjoppieInventory.API.Controllers.Rollout;

/// <summary>
/// API controller for Microsoft Graph operations in rollout workflow.
/// Provides endpoints to retrieve service groups, sector groups, and group members from Azure AD.
/// </summary>
[Authorize]
[ApiController]
[Route("api/rollout/graph")]
public class RolloutGraphController : ControllerBase
{
    private readonly IGraphUserService _graphUserService;
    private readonly ILogger<RolloutGraphController> _logger;

    public RolloutGraphController(
        IGraphUserService graphUserService,
        ILogger<RolloutGraphController> logger)
    {
        _graphUserService = graphUserService ?? throw new ArgumentNullException(nameof(graphUserService));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    /// <summary>
    /// Gets all service distribution groups (MG-* but not MG-SECTOR-*) from Azure AD.
    /// </summary>
    /// <param name="top">Maximum number of groups to return (default: 100)</param>
    /// <returns>A list of service groups</returns>
    /// <response code="200">Returns the list of service groups</response>
    /// <response code="401">Unauthorized - authentication required</response>
    /// <response code="500">Internal server error</response>
    [HttpGet("service-groups")]
    [ProducesResponseType(typeof(IEnumerable<GraphGroupDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<IEnumerable<GraphGroupDto>>> GetServiceGroups(
        [FromQuery] int top = 100)
    {
        try
        {
            _logger.LogInformation("API request to retrieve service groups (MG-*)");
            var groups = await _graphUserService.GetServiceGroupsAsync(top);

            var groupDtos = groups.Select(g => new GraphGroupDto
            {
                Id = g.Id ?? string.Empty,
                DisplayName = g.DisplayName ?? string.Empty,
                ServiceName = g.DisplayName?.StartsWith("MG-") == true
                    ? g.DisplayName.Substring(3)
                    : g.DisplayName ?? string.Empty,
                Description = g.Description,
                Mail = g.Mail
            });

            return Ok(groupDtos);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogError(ex, "Failed to retrieve service groups");
            return StatusCode(500, new { error = "Failed to retrieve service groups", details = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error retrieving service groups");
            return StatusCode(500, new { error = "An unexpected error occurred while retrieving service groups" });
        }
    }

    /// <summary>
    /// Gets all sector distribution groups (MG-SECTOR-*) from Azure AD.
    /// </summary>
    /// <param name="top">Maximum number of groups to return (default: 50)</param>
    /// <returns>A list of sector groups</returns>
    /// <response code="200">Returns the list of sector groups</response>
    /// <response code="401">Unauthorized - authentication required</response>
    /// <response code="500">Internal server error</response>
    [HttpGet("sector-groups")]
    [ProducesResponseType(typeof(IEnumerable<GraphGroupDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<IEnumerable<GraphGroupDto>>> GetSectorGroups(
        [FromQuery] int top = 50)
    {
        try
        {
            _logger.LogInformation("API request to retrieve sector groups (MG-SECTOR-*)");
            var groups = await _graphUserService.GetSectorGroupsAsync(top);

            var groupDtos = groups.Select(g => new GraphGroupDto
            {
                Id = g.Id ?? string.Empty,
                DisplayName = g.DisplayName ?? string.Empty,
                ServiceName = g.DisplayName?.StartsWith("MG-SECTOR-") == true
                    ? g.DisplayName.Substring(10)
                    : g.DisplayName ?? string.Empty,
                Description = g.Description,
                Mail = g.Mail
            });

            return Ok(groupDtos);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogError(ex, "Failed to retrieve sector groups");
            return StatusCode(500, new { error = "Failed to retrieve sector groups", details = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error retrieving sector groups");
            return StatusCode(500, new { error = "An unexpected error occurred while retrieving sector groups" });
        }
    }

    /// <summary>
    /// Gets all service groups (MG-* but not MG-SECTOR-*) that are members of a sector group.
    /// </summary>
    /// <param name="sectorId">The sector group's Azure AD object identifier</param>
    /// <param name="top">Maximum number of groups to return (default: 100)</param>
    /// <returns>A list of service groups nested within the sector</returns>
    /// <response code="200">Returns the list of service groups in the sector</response>
    /// <response code="400">Bad request - invalid sector ID</response>
    /// <response code="401">Unauthorized - authentication required</response>
    /// <response code="500">Internal server error</response>
    [HttpGet("sectors/{sectorId}/services")]
    [ProducesResponseType(typeof(IEnumerable<GraphGroupDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<IEnumerable<GraphGroupDto>>> GetSectorServices(
        string sectorId,
        [FromQuery] int top = 100)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(sectorId))
            {
                return BadRequest(new { error = "Sector ID cannot be empty" });
            }

            _logger.LogInformation("API request to retrieve services for sector {SectorId}", sectorId);
            var groups = await _graphUserService.GetSectorServiceGroupsAsync(sectorId, top);

            var groupDtos = groups.Select(g => new GraphGroupDto
            {
                Id = g.Id ?? string.Empty,
                DisplayName = g.DisplayName ?? string.Empty,
                ServiceName = g.DisplayName?.StartsWith("MG-") == true
                    ? g.DisplayName.Substring(3)
                    : g.DisplayName ?? string.Empty,
                Description = g.Description,
                Mail = g.Mail
            });

            return Ok(groupDtos);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogError(ex, "Failed to retrieve services for sector {SectorId}", sectorId);
            return StatusCode(500, new { error = "Failed to retrieve sector services", details = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error retrieving services for sector {SectorId}", sectorId);
            return StatusCode(500, new { error = "An unexpected error occurred while retrieving sector services" });
        }
    }

    /// <summary>
    /// Gets all members (users) of a specific group.
    /// </summary>
    /// <param name="groupId">The group's Azure AD object identifier</param>
    /// <param name="top">Maximum number of members to return (default: 200)</param>
    /// <returns>A list of users who are members of the group</returns>
    /// <response code="200">Returns the list of group members</response>
    /// <response code="400">Bad request - invalid group ID</response>
    /// <response code="401">Unauthorized - authentication required</response>
    /// <response code="500">Internal server error</response>
    [HttpGet("groups/{groupId}/members")]
    [ProducesResponseType(typeof(IEnumerable<GraphUserDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<IEnumerable<GraphUserDto>>> GetGroupMembers(
        string groupId,
        [FromQuery] int top = 200)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(groupId))
            {
                return BadRequest(new { error = "Group ID cannot be empty" });
            }

            _logger.LogInformation("API request to retrieve members for group {GroupId}", groupId);
            var users = await _graphUserService.GetGroupMembersAsync(groupId, top);

            var userDtos = users.Select(u => new GraphUserDto
            {
                Id = u.Id ?? string.Empty,
                DisplayName = u.DisplayName ?? string.Empty,
                UserPrincipalName = u.UserPrincipalName ?? string.Empty,
                Mail = u.Mail,
                JobTitle = u.JobTitle,
                Department = u.Department,
                OfficeLocation = u.OfficeLocation,
                MobilePhone = u.MobilePhone,
                BusinessPhones = u.BusinessPhones?.ToList()
            });

            return Ok(userDtos);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogError(ex, "Failed to retrieve members for group {GroupId}", groupId);
            return StatusCode(500, new { error = "Failed to retrieve group members", details = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error retrieving members for group {GroupId}", groupId);
            return StatusCode(500, new { error = "An unexpected error occurred while retrieving group members" });
        }
    }
}

/// <summary>
/// DTO for Azure AD group information
/// </summary>
public class GraphGroupDto
{
    public string Id { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string ServiceName { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Mail { get; set; }
}

/// <summary>
/// DTO for Azure AD user information in rollout context
/// </summary>
public class GraphUserDto
{
    public string Id { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string UserPrincipalName { get; set; } = string.Empty;
    public string? Mail { get; set; }
    public string? JobTitle { get; set; }
    public string? Department { get; set; }
    public string? OfficeLocation { get; set; }
    public string? MobilePhone { get; set; }
    public List<string>? BusinessPhones { get; set; }
}

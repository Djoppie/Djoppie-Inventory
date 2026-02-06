using DjoppieInventory.Core.DTOs;
using DjoppieInventory.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DjoppieInventory.API.Controllers;

/// <summary>
/// API controller for Microsoft Graph operations.
/// Provides endpoints to search and retrieve user information from Azure AD.
/// </summary>
[Authorize]
[ApiController]
[Route("api/[controller]")]
public class GraphController : ControllerBase
{
    private readonly IGraphUserService _graphUserService;
    private readonly ILogger<GraphController> _logger;

    public GraphController(IGraphUserService graphUserService, ILogger<GraphController> logger)
    {
        _graphUserService = graphUserService ?? throw new ArgumentNullException(nameof(graphUserService));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    /// <summary>
    /// Searches for users in Azure AD by display name or email address.
    /// </summary>
    /// <param name="query">The search query (name or email)</param>
    /// <param name="top">Maximum number of results to return (default: 10, max: 50)</param>
    /// <returns>A list of users matching the search criteria</returns>
    /// <response code="200">Returns the list of matching users</response>
    /// <response code="400">Bad request - invalid query parameter</response>
    /// <response code="401">Unauthorized - authentication required</response>
    /// <response code="500">Internal server error</response>
    [HttpGet("users/search")]
    [ProducesResponseType(typeof(IEnumerable<UserDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<IEnumerable<UserDto>>> SearchUsers(
        [FromQuery] string query,
        [FromQuery] int top = 10)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(query))
            {
                return BadRequest(new { error = "Search query cannot be empty" });
            }

            if (query.Length < 2)
            {
                return BadRequest(new { error = "Search query must be at least 2 characters" });
            }

            if (top < 1 || top > 50)
            {
                return BadRequest(new { error = "Top parameter must be between 1 and 50" });
            }

            _logger.LogInformation("API request to search users with query: {Query}", query);
            var users = await _graphUserService.SearchUsersAsync(query, top);

            // Map to DTOs
            var userDtos = users.Select(u => new UserDto
            {
                Id = u.Id ?? string.Empty,
                DisplayName = u.DisplayName ?? string.Empty,
                UserPrincipalName = u.UserPrincipalName ?? string.Empty,
                Mail = u.Mail,
                Department = u.Department,
                OfficeLocation = u.OfficeLocation,
                JobTitle = u.JobTitle,
                MobilePhone = u.MobilePhone,
                BusinessPhones = u.BusinessPhones?.ToList(),
                CompanyName = u.CompanyName
            });

            return Ok(userDtos);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogError(ex, "Failed to search users with query {Query}", query);
            return StatusCode(500, new { error = "Failed to search users", details = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error searching users with query {Query}", query);
            return StatusCode(500, new { error = "An unexpected error occurred while searching users" });
        }
    }

    /// <summary>
    /// Retrieves a specific user by their Azure AD object ID.
    /// </summary>
    /// <param name="userId">The user's Azure AD object identifier</param>
    /// <returns>The user details</returns>
    /// <response code="200">Returns the user</response>
    /// <response code="404">User not found</response>
    /// <response code="401">Unauthorized - authentication required</response>
    /// <response code="500">Internal server error</response>
    [HttpGet("users/{userId}")]
    [ProducesResponseType(typeof(UserDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<UserDto>> GetUserById(string userId)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(userId))
            {
                return BadRequest(new { error = "User ID cannot be empty" });
            }

            _logger.LogInformation("API request to retrieve user with ID: {UserId}", userId);
            var user = await _graphUserService.GetUserByIdAsync(userId);

            if (user == null)
            {
                return NotFound(new { error = $"User with ID '{userId}' not found" });
            }

            var userDto = new UserDto
            {
                Id = user.Id ?? string.Empty,
                DisplayName = user.DisplayName ?? string.Empty,
                UserPrincipalName = user.UserPrincipalName ?? string.Empty,
                Mail = user.Mail,
                Department = user.Department,
                OfficeLocation = user.OfficeLocation,
                JobTitle = user.JobTitle,
                MobilePhone = user.MobilePhone,
                BusinessPhones = user.BusinessPhones?.ToList(),
                CompanyName = user.CompanyName
            };

            return Ok(userDto);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogError(ex, "Failed to retrieve user {UserId}", userId);
            return StatusCode(500, new { error = "Failed to retrieve user", details = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error retrieving user {UserId}", userId);
            return StatusCode(500, new { error = "An unexpected error occurred while retrieving the user" });
        }
    }

    /// <summary>
    /// Retrieves a specific user by their User Principal Name (UPN/email).
    /// </summary>
    /// <param name="upn">The user's UPN (email address)</param>
    /// <returns>The user details</returns>
    /// <response code="200">Returns the user</response>
    /// <response code="404">User not found</response>
    /// <response code="401">Unauthorized - authentication required</response>
    /// <response code="500">Internal server error</response>
    [HttpGet("users/upn/{upn}")]
    [ProducesResponseType(typeof(UserDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<UserDto>> GetUserByUpn(string upn)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(upn))
            {
                return BadRequest(new { error = "User Principal Name cannot be empty" });
            }

            _logger.LogInformation("API request to retrieve user with UPN: {Upn}", upn);
            var user = await _graphUserService.GetUserByUpnAsync(upn);

            if (user == null)
            {
                return NotFound(new { error = $"User with UPN '{upn}' not found" });
            }

            var userDto = new UserDto
            {
                Id = user.Id ?? string.Empty,
                DisplayName = user.DisplayName ?? string.Empty,
                UserPrincipalName = user.UserPrincipalName ?? string.Empty,
                Mail = user.Mail,
                Department = user.Department,
                OfficeLocation = user.OfficeLocation,
                JobTitle = user.JobTitle,
                MobilePhone = user.MobilePhone,
                BusinessPhones = user.BusinessPhones?.ToList(),
                CompanyName = user.CompanyName
            };

            return Ok(userDto);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogError(ex, "Failed to retrieve user {Upn}", upn);
            return StatusCode(500, new { error = "Failed to retrieve user", details = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error retrieving user {Upn}", upn);
            return StatusCode(500, new { error = "An unexpected error occurred while retrieving the user" });
        }
    }

    /// <summary>
    /// Retrieves the manager of a specific user.
    /// </summary>
    /// <param name="userId">The user's Azure AD object identifier</param>
    /// <returns>The manager's user details</returns>
    /// <response code="200">Returns the manager</response>
    /// <response code="404">Manager not found or user has no manager</response>
    /// <response code="401">Unauthorized - authentication required</response>
    /// <response code="500">Internal server error</response>
    [HttpGet("users/{userId}/manager")]
    [ProducesResponseType(typeof(UserDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<UserDto>> GetUserManager(string userId)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(userId))
            {
                return BadRequest(new { error = "User ID cannot be empty" });
            }

            _logger.LogInformation("API request to retrieve manager for user: {UserId}", userId);
            var manager = await _graphUserService.GetUserManagerAsync(userId);

            if (manager == null)
            {
                return NotFound(new { error = $"No manager found for user with ID '{userId}'" });
            }

            var managerDto = new UserDto
            {
                Id = manager.Id ?? string.Empty,
                DisplayName = manager.DisplayName ?? string.Empty,
                UserPrincipalName = manager.UserPrincipalName ?? string.Empty,
                Mail = manager.Mail,
                Department = manager.Department,
                OfficeLocation = manager.OfficeLocation,
                JobTitle = manager.JobTitle,
                MobilePhone = manager.MobilePhone,
                BusinessPhones = manager.BusinessPhones?.ToList(),
                CompanyName = manager.CompanyName
            };

            return Ok(managerDto);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogError(ex, "Failed to retrieve manager for user {UserId}", userId);
            return StatusCode(500, new { error = "Failed to retrieve user manager", details = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error retrieving manager for user {UserId}", userId);
            return StatusCode(500, new { error = "An unexpected error occurred while retrieving the manager" });
        }
    }
}

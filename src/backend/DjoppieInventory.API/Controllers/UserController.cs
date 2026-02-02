using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace DjoppieInventory.API.Controllers;

/// <summary>
/// API controller for user authentication and profile information.
/// Provides endpoints to test authentication and retrieve current user details.
/// </summary>
[Authorize]
[ApiController]
[Route("api/[controller]")]
public class UserController : ControllerBase
{
    private readonly ILogger<UserController> _logger;

    public UserController(ILogger<UserController> logger)
    {
        _logger = logger;
    }

    /// <summary>
    /// Tests if the user is authenticated and returns basic authentication status.
    /// </summary>
    /// <returns>Authentication status information</returns>
    [HttpGet("test-auth")]
    public IActionResult TestAuthentication()
    {
        _logger.LogInformation("Authentication test endpoint called by user: {UserId}", User.FindFirstValue(ClaimTypes.NameIdentifier));

        return Ok(new
        {
            message = "You are authenticated!",
            timestamp = DateTime.UtcNow,
            authenticated = User.Identity?.IsAuthenticated ?? false
        });
    }

    /// <summary>
    /// Retrieves the current user's profile information from the authentication token.
    /// </summary>
    /// <returns>User profile information including name, email, and roles</returns>
    [HttpGet("me")]
    public IActionResult GetCurrentUser()
    {
        try
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)
                        ?? User.FindFirstValue("oid")
                        ?? User.FindFirstValue("sub");

            var userName = User.FindFirstValue(ClaimTypes.Name)
                          ?? User.FindFirstValue("name")
                          ?? User.FindFirstValue("preferred_username");

            var email = User.FindFirstValue(ClaimTypes.Email)
                       ?? User.FindFirstValue("email")
                       ?? User.FindFirstValue("preferred_username");

            var roles = User.FindAll(ClaimTypes.Role)
                .Select(c => c.Value)
                .ToList();

            // Get all claims for debugging purposes (only in development)
            var allClaims = User.Claims.Select(c => new { c.Type, c.Value }).ToList();

            _logger.LogInformation("User profile retrieved for: {UserId}", userId);

            return Ok(new
            {
                userId,
                userName,
                email,
                roles,
                claims = allClaims, // Useful for debugging token claims
                isAuthenticated = User.Identity?.IsAuthenticated ?? false,
                authenticationType = User.Identity?.AuthenticationType
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving current user profile");
            return StatusCode(500, "An error occurred while retrieving user profile");
        }
    }

    /// <summary>
    /// Returns all claims for the current authenticated user (development only).
    /// Useful for debugging and understanding what information is available in the token.
    /// </summary>
    /// <returns>List of all claims in the user's authentication token</returns>
    [HttpGet("claims")]
    public IActionResult GetUserClaims()
    {
        try
        {
            var claims = User.Claims.Select(c => new
            {
                type = c.Type,
                value = c.Value,
                issuer = c.Issuer
            }).ToList();

            _logger.LogInformation("User claims retrieved for: {UserId}", User.FindFirstValue(ClaimTypes.NameIdentifier));

            return Ok(new
            {
                totalClaims = claims.Count,
                claims
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving user claims");
            return StatusCode(500, "An error occurred while retrieving user claims");
        }
    }

    /// <summary>
    /// Endpoint that requires admin role (for testing role-based authorization).
    /// </summary>
    /// <returns>Success message if user has admin role</returns>
    [HttpGet("admin-only")]
    [Authorize(Policy = "RequireAdminRole")]
    public IActionResult AdminOnly()
    {
        _logger.LogInformation("Admin endpoint accessed by user: {UserId}", User.FindFirstValue(ClaimTypes.NameIdentifier));

        return Ok(new
        {
            message = "You have admin access!",
            timestamp = DateTime.UtcNow
        });
    }

    /// <summary>
    /// Public endpoint that does not require authentication (for testing).
    /// </summary>
    /// <returns>Public health check information</returns>
    [AllowAnonymous]
    [HttpGet("public")]
    public IActionResult PublicEndpoint()
    {
        return Ok(new
        {
            message = "This is a public endpoint",
            timestamp = DateTime.UtcNow,
            apiVersion = "1.0",
            authenticated = User.Identity?.IsAuthenticated ?? false
        });
    }
}

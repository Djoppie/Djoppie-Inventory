using DjoppieInventory.Core.DTOs;
using DjoppieInventory.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DjoppieInventory.API.Controllers.Reports;

/// <summary>
/// API controller for monitoring Entra ID app registration credentials
/// (client secrets and certificates) and their expiry state.
/// </summary>
[Authorize(Policy = "RequireAdminRole")]
[ApiController]
[Route("api/clientsecrets")]
public class ClientSecretsController : ControllerBase
{
    private readonly IClientSecretsService _clientSecretsService;
    private readonly ILogger<ClientSecretsController> _logger;

    public ClientSecretsController(
        IClientSecretsService clientSecretsService,
        ILogger<ClientSecretsController> logger)
    {
        _clientSecretsService = clientSecretsService ?? throw new ArgumentNullException(nameof(clientSecretsService));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    /// <summary>
    /// Retrieves every credential (secret + certificate) on every app registration
    /// in the tenant, with expiry metadata for monitoring.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<AppCredentialDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<IEnumerable<AppCredentialDto>>> GetAllCredentials(CancellationToken cancellationToken)
    {
        try
        {
            _logger.LogInformation("API request to retrieve all app registration credentials");
            var credentials = await _clientSecretsService.GetAllCredentialsAsync(cancellationToken);
            return Ok(credentials);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogError(ex, "Failed to retrieve app registration credentials");
            return StatusCode(500, new
            {
                error = "Failed to retrieve app registration credentials",
                details = ex.Message,
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error retrieving app registration credentials");
            return StatusCode(500, new
            {
                error = "An unexpected error occurred while retrieving credentials",
            });
        }
    }
}

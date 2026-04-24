using DjoppieInventory.Core.DTOs;

namespace DjoppieInventory.Core.Interfaces;

/// <summary>
/// Service for monitoring Entra ID app registration credentials (client secrets and
/// certificates), including expiration tracking.
/// </summary>
public interface IClientSecretsService
{
    /// <summary>
    /// Retrieves all credentials (secrets + certificates) across every app registration
    /// in the tenant, flattened into one collection with expiry metadata.
    /// </summary>
    Task<IEnumerable<AppCredentialDto>> GetAllCredentialsAsync(CancellationToken cancellationToken = default);
}

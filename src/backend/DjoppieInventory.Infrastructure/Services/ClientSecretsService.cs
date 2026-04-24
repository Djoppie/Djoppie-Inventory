using DjoppieInventory.Core.DTOs;
using DjoppieInventory.Core.Interfaces;
using Microsoft.Extensions.Logging;
using Microsoft.Graph;
using Microsoft.Graph.Models;

namespace DjoppieInventory.Infrastructure.Services;

/// <summary>
/// Reads app registrations from Microsoft Graph and flattens their
/// passwordCredentials + keyCredentials into monitoring-friendly DTOs.
/// </summary>
public class ClientSecretsService : IClientSecretsService
{
    private const int ExpiringSoonDays = 30;

    private readonly GraphServiceClient _graphClient;
    private readonly ILogger<ClientSecretsService> _logger;

    public ClientSecretsService(GraphServiceClient graphClient, ILogger<ClientSecretsService> logger)
    {
        _graphClient = graphClient ?? throw new ArgumentNullException(nameof(graphClient));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    /// <inheritdoc/>
    public async Task<IEnumerable<AppCredentialDto>> GetAllCredentialsAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogInformation("Retrieving all Entra ID app registrations for credential monitoring");

            var result = new List<AppCredentialDto>();
            var now = DateTime.UtcNow;

            var response = await _graphClient.Applications.GetAsync(rc =>
            {
                rc.QueryParameters.Select = new[]
                {
                    "id", "appId", "displayName", "passwordCredentials", "keyCredentials"
                };
                rc.QueryParameters.Top = 999;
            }, cancellationToken);

            while (response?.Value != null)
            {
                foreach (var app in response.Value)
                {
                    if (app.PasswordCredentials != null)
                    {
                        foreach (var secret in app.PasswordCredentials)
                        {
                            result.Add(MapCredential(app, secret, now));
                        }
                    }

                    if (app.KeyCredentials != null)
                    {
                        foreach (var cert in app.KeyCredentials)
                        {
                            result.Add(MapCredential(app, cert, now));
                        }
                    }
                }

                if (string.IsNullOrEmpty(response.OdataNextLink))
                {
                    break;
                }

                response = await _graphClient.Applications
                    .WithUrl(response.OdataNextLink)
                    .GetAsync(cancellationToken: cancellationToken);
            }

            _logger.LogInformation("Retrieved {Count} app credentials across tenant", result.Count);
            return result;
        }
        catch (ServiceException ex)
        {
            _logger.LogError(
                ex,
                "Microsoft Graph API error while retrieving app registrations. Status: {StatusCode}",
                ex.ResponseStatusCode);
            throw new InvalidOperationException(
                $"Failed to retrieve app registrations from Microsoft Graph: {ex.Message}", ex);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error while retrieving app credentials");
            throw;
        }
    }

    private static AppCredentialDto MapCredential(Application app, PasswordCredential secret, DateTime now)
    {
        var end = secret.EndDateTime?.UtcDateTime;
        return new AppCredentialDto
        {
            AppId = app.AppId ?? string.Empty,
            ObjectId = app.Id ?? string.Empty,
            DisplayName = app.DisplayName ?? string.Empty,
            CredentialType = "Secret",
            KeyId = secret.KeyId?.ToString(),
            CredentialDisplayName = secret.DisplayName,
            StartDateTime = secret.StartDateTime?.UtcDateTime,
            EndDateTime = end,
            DaysUntilExpiry = end.HasValue ? (int)Math.Floor((end.Value - now).TotalDays) : null,
            Status = DetermineStatus(end, now),
        };
    }

    private static AppCredentialDto MapCredential(Application app, KeyCredential cert, DateTime now)
    {
        var end = cert.EndDateTime?.UtcDateTime;
        return new AppCredentialDto
        {
            AppId = app.AppId ?? string.Empty,
            ObjectId = app.Id ?? string.Empty,
            DisplayName = app.DisplayName ?? string.Empty,
            CredentialType = "Certificate",
            KeyId = cert.KeyId?.ToString(),
            CredentialDisplayName = cert.DisplayName,
            StartDateTime = cert.StartDateTime?.UtcDateTime,
            EndDateTime = end,
            DaysUntilExpiry = end.HasValue ? (int)Math.Floor((end.Value - now).TotalDays) : null,
            Status = DetermineStatus(end, now),
        };
    }

    private static string DetermineStatus(DateTime? endDateTime, DateTime now)
    {
        if (!endDateTime.HasValue)
        {
            return "Valid";
        }

        if (endDateTime.Value < now)
        {
            return "Expired";
        }

        if (endDateTime.Value <= now.AddDays(ExpiringSoonDays))
        {
            return "Expiring";
        }

        return "Valid";
    }
}

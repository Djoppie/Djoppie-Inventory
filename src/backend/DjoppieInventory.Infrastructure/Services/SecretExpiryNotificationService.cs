using System.Text;
using DjoppieInventory.Core.Configuration;
using DjoppieInventory.Core.DTOs;
using DjoppieInventory.Core.Interfaces;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Microsoft.Graph;
using Microsoft.Graph.Models;
using Microsoft.Graph.Users.Item.SendMail;

namespace DjoppieInventory.Infrastructure.Services;

/// <summary>
/// Background service that periodically scans Entra ID app registrations and sends
/// an email alert listing credentials (client secrets + certificates) that will
/// expire within the configured warning window.
/// </summary>
public class SecretExpiryNotificationService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly GraphServiceClient _graphClient;
    private readonly IOptionsMonitor<SecretExpiryNotificationOptions> _optionsMonitor;
    private readonly ILogger<SecretExpiryNotificationService> _logger;

    public SecretExpiryNotificationService(
        IServiceScopeFactory scopeFactory,
        GraphServiceClient graphClient,
        IOptionsMonitor<SecretExpiryNotificationOptions> optionsMonitor,
        ILogger<SecretExpiryNotificationService> logger)
    {
        _scopeFactory = scopeFactory ?? throw new ArgumentNullException(nameof(scopeFactory));
        _graphClient = graphClient ?? throw new ArgumentNullException(nameof(graphClient));
        _optionsMonitor = optionsMonitor ?? throw new ArgumentNullException(nameof(optionsMonitor));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var options = _optionsMonitor.CurrentValue;

        if (!options.Enabled)
        {
            _logger.LogInformation("SecretExpiryNotificationService is disabled. Skipping background scheduler.");
            return;
        }

        _logger.LogInformation(
            "SecretExpiryNotificationService started. WarningDays={WarningDays}, CheckInterval={CheckInterval}, Recipients={Recipients}",
            options.WarningDays,
            options.CheckInterval,
            string.Join(", ", options.Recipients));

        try
        {
            await Task.Delay(options.InitialDelay, stoppingToken);
        }
        catch (TaskCanceledException)
        {
            return;
        }

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await RunCheckAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unhandled error while running secret expiry notification check");
            }

            try
            {
                await Task.Delay(_optionsMonitor.CurrentValue.CheckInterval, stoppingToken);
            }
            catch (TaskCanceledException)
            {
                break;
            }
        }

        _logger.LogInformation("SecretExpiryNotificationService stopping.");
    }

    private async Task RunCheckAsync(CancellationToken cancellationToken)
    {
        var options = _optionsMonitor.CurrentValue;

        if (!ValidateConfiguration(options))
        {
            return;
        }

        using var scope = _scopeFactory.CreateScope();
        var clientSecretsService = scope.ServiceProvider.GetRequiredService<IClientSecretsService>();

        var credentials = (await clientSecretsService.GetAllCredentialsAsync(cancellationToken)).ToList();

        var now = DateTime.UtcNow;
        var windowEnd = now.AddDays(options.WarningDays);

        var expiringSoon = credentials
            .Where(c => c.EndDateTime.HasValue && c.EndDateTime.Value >= now && c.EndDateTime.Value <= windowEnd)
            .OrderBy(c => c.EndDateTime)
            .ToList();

        var alreadyExpired = credentials
            .Where(c => c.EndDateTime.HasValue && c.EndDateTime.Value < now)
            .OrderBy(c => c.EndDateTime)
            .ToList();

        if (expiringSoon.Count == 0 && alreadyExpired.Count == 0)
        {
            _logger.LogInformation(
                "No expiring or expired credentials within {WarningDays} days. Nothing to notify.",
                options.WarningDays);
            return;
        }

        _logger.LogInformation(
            "Found {ExpiringCount} expiring and {ExpiredCount} expired credentials. Sending notification email.",
            expiringSoon.Count,
            alreadyExpired.Count);

        await SendNotificationEmailAsync(options, expiringSoon, alreadyExpired, cancellationToken);
    }

    private bool ValidateConfiguration(SecretExpiryNotificationOptions options)
    {
        if (string.IsNullOrWhiteSpace(options.SenderUpn))
        {
            _logger.LogWarning(
                "SecretExpiryNotifications.SenderUpn is not configured. Skipping check.");
            return false;
        }

        if (options.Recipients.Count == 0)
        {
            _logger.LogWarning(
                "SecretExpiryNotifications.Recipients list is empty. Skipping check.");
            return false;
        }

        if (options.WarningDays <= 0)
        {
            _logger.LogWarning(
                "SecretExpiryNotifications.WarningDays must be > 0. Skipping check.");
            return false;
        }

        return true;
    }

    private async Task SendNotificationEmailAsync(
        SecretExpiryNotificationOptions options,
        IReadOnlyList<AppCredentialDto> expiringSoon,
        IReadOnlyList<AppCredentialDto> alreadyExpired,
        CancellationToken cancellationToken)
    {
        var subject = BuildSubject(expiringSoon.Count, alreadyExpired.Count, options.WarningDays);
        var body = BuildHtmlBody(expiringSoon, alreadyExpired, options.WarningDays);

        var message = new Message
        {
            Subject = subject,
            Body = new ItemBody
            {
                ContentType = BodyType.Html,
                Content = body,
            },
            ToRecipients = options.Recipients
                .Select(r => new Recipient { EmailAddress = new EmailAddress { Address = r } })
                .ToList(),
        };

        var requestBody = new SendMailPostRequestBody
        {
            Message = message,
            SaveToSentItems = false,
        };

        try
        {
            await _graphClient
                .Users[options.SenderUpn]
                .SendMail
                .PostAsync(requestBody, cancellationToken: cancellationToken);

            _logger.LogInformation(
                "Secret expiry notification email sent from {Sender} to {RecipientCount} recipient(s).",
                options.SenderUpn,
                options.Recipients.Count);
        }
        catch (ServiceException ex)
        {
            _logger.LogError(
                ex,
                "Microsoft Graph API error while sending secret expiry email. Status: {StatusCode}",
                ex.ResponseStatusCode);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error sending secret expiry notification email");
        }
    }

    private static string BuildSubject(int expiringCount, int expiredCount, int warningDays)
    {
        if (expiredCount > 0 && expiringCount > 0)
        {
            return $"[Djoppie Inventory] {expiredCount} verlopen en {expiringCount} bijna verlopen app secrets";
        }

        if (expiredCount > 0)
        {
            return $"[Djoppie Inventory] {expiredCount} verlopen app registration secret(s)";
        }

        return $"[Djoppie Inventory] {expiringCount} app secret(s) verlopen binnen {warningDays} dagen";
    }

    private static string BuildHtmlBody(
        IReadOnlyList<AppCredentialDto> expiringSoon,
        IReadOnlyList<AppCredentialDto> alreadyExpired,
        int warningDays)
    {
        var sb = new StringBuilder();
        sb.AppendLine("<html><body style=\"font-family:Segoe UI,Arial,sans-serif;font-size:14px;color:#222;\">");
        sb.AppendLine("<h2 style=\"color:#F57C00;margin-bottom:4px;\">Entra ID Secret Expiry Monitor</h2>");
        sb.AppendLine($"<p>Automatische melding van Djoppie Inventory — app registrations in de tenant waarvan secrets of certificaten vervallen binnen <strong>{warningDays} dagen</strong>.</p>");

        if (alreadyExpired.Count > 0)
        {
            sb.AppendLine("<h3 style=\"color:#C62828;\">Reeds verlopen</h3>");
            AppendTable(sb, alreadyExpired);
        }

        if (expiringSoon.Count > 0)
        {
            sb.AppendLine($"<h3 style=\"color:#EF6C00;\">Verloopt binnen {warningDays} dagen</h3>");
            AppendTable(sb, expiringSoon);
        }

        sb.AppendLine("<p style=\"margin-top:24px;color:#666;font-size:12px;\">");
        sb.AppendLine("Bekijk alle credentials in de applicatie via <em>Rapportage → Monitoring → Client Secrets</em>.");
        sb.AppendLine("</p>");
        sb.AppendLine("</body></html>");
        return sb.ToString();
    }

    private static void AppendTable(StringBuilder sb, IReadOnlyList<AppCredentialDto> rows)
    {
        sb.AppendLine("<table cellpadding=\"6\" cellspacing=\"0\" style=\"border-collapse:collapse;border:1px solid #ddd;\">");
        sb.AppendLine("<thead style=\"background:#f5f5f5;\">");
        sb.AppendLine("<tr>");
        sb.AppendLine("<th style=\"text-align:left;border:1px solid #ddd;\">Applicatie</th>");
        sb.AppendLine("<th style=\"text-align:left;border:1px solid #ddd;\">Client ID</th>");
        sb.AppendLine("<th style=\"text-align:left;border:1px solid #ddd;\">Type</th>");
        sb.AppendLine("<th style=\"text-align:left;border:1px solid #ddd;\">Naam</th>");
        sb.AppendLine("<th style=\"text-align:left;border:1px solid #ddd;\">Vervaldatum</th>");
        sb.AppendLine("<th style=\"text-align:right;border:1px solid #ddd;\">Dagen</th>");
        sb.AppendLine("</tr></thead><tbody>");

        foreach (var row in rows)
        {
            sb.Append("<tr>");
            sb.Append($"<td style=\"border:1px solid #ddd;\">{System.Net.WebUtility.HtmlEncode(row.DisplayName)}</td>");
            sb.Append($"<td style=\"border:1px solid #ddd;font-family:Consolas,monospace;font-size:12px;\">{System.Net.WebUtility.HtmlEncode(row.AppId)}</td>");
            sb.Append($"<td style=\"border:1px solid #ddd;\">{row.CredentialType}</td>");
            sb.Append($"<td style=\"border:1px solid #ddd;\">{System.Net.WebUtility.HtmlEncode(row.CredentialDisplayName ?? "-")}</td>");
            sb.Append($"<td style=\"border:1px solid #ddd;\">{row.EndDateTime:yyyy-MM-dd}</td>");
            sb.Append($"<td style=\"border:1px solid #ddd;text-align:right;\">{row.DaysUntilExpiry?.ToString() ?? "-"}</td>");
            sb.AppendLine("</tr>");
        }

        sb.AppendLine("</tbody></table>");
    }
}

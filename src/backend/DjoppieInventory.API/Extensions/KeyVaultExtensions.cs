using Azure.Identity;
using Azure.Security.KeyVault.Secrets;

namespace DjoppieInventory.API.Extensions;

/// <summary>
/// Extension methods for Azure Key Vault configuration
/// </summary>
public static class KeyVaultExtensions
{
    /// <summary>
    /// Adds Azure Key Vault as a configuration source for production environments
    /// </summary>
    /// <remarks>
    /// This method configures the application to retrieve secrets from Azure Key Vault using Managed Identity.
    /// In production, secrets are loaded from Key Vault and override any local configuration values.
    /// In development, this method does nothing (secrets are read from appsettings.Development.json).
    ///
    /// Key Vault integration provides:
    /// - Centralized secret management
    /// - Automatic secret rotation support
    /// - Audit logging of secret access
    /// - Integration with Azure Managed Identity (no credentials in code)
    ///
    /// Secret naming convention:
    /// - Azure Key Vault uses hyphens in secret names (e.g., "AzureAd--ClientSecret")
    /// - ASP.NET Core configuration uses colons (e.g., "AzureAd:ClientSecret")
    /// - The provider automatically replaces "--" with ":" when loading secrets
    ///
    /// Example secrets in Key Vault:
    /// - ConnectionStrings--DefaultConnection
    /// - AzureAd--ClientSecret
    /// - ApplicationInsights--ConnectionString
    /// </remarks>
    public static IConfigurationBuilder AddAzureKeyVaultConfiguration(
        this IConfigurationBuilder config,
        IWebHostEnvironment environment)
    {
        // Only add Key Vault in production environments
        if (!environment.IsProduction())
        {
            return config;
        }

        // Build temporary configuration to get Key Vault name
        var tempConfig = config.Build();
        var keyVaultName = tempConfig["KeyVault:VaultName"];

        if (string.IsNullOrEmpty(keyVaultName))
        {
            throw new InvalidOperationException(
                "KeyVault:VaultName is not configured in appsettings. " +
                "Set this value in appsettings.Production.json or as an environment variable.");
        }

        var keyVaultUri = new Uri($"https://{keyVaultName}.vault.azure.net/");

        // Use DefaultAzureCredential for authentication
        // This supports multiple authentication methods in order:
        // 1. Environment variables (for local development with service principal)
        // 2. Managed Identity (for Azure App Service, Container Apps, etc.)
        // 3. Visual Studio/VS Code credentials
        // 4. Azure CLI credentials
        var credential = new DefaultAzureCredential();

        // Add Key Vault as configuration source
        config.AddAzureKeyVault(keyVaultUri, credential);

        return config;
    }

    /// <summary>
    /// Validates that required secrets are present in configuration
    /// </summary>
    /// <remarks>
    /// This method should be called during application startup to ensure all required secrets
    /// are available. If secrets are missing, the application will fail fast with a clear error message.
    /// </remarks>
    public static IServiceCollection ValidateRequiredSecrets(
        this IServiceCollection services,
        IConfiguration configuration,
        IWebHostEnvironment environment)
    {
        // Only validate in production (development uses appsettings.Development.json)
        if (!environment.IsProduction())
        {
            return services;
        }

        var requiredSecrets = new Dictionary<string, string>
        {
            { "ConnectionStrings:DefaultConnection", "Database connection string" },
            { "AzureAd:ClientSecret", "Entra ID client secret for Microsoft Graph API access" },
            { "ApplicationInsights:ConnectionString", "Application Insights connection string" }
        };

        var missingSecrets = new List<string>();

        foreach (var (key, description) in requiredSecrets)
        {
            var value = configuration[key];
            if (string.IsNullOrWhiteSpace(value))
            {
                missingSecrets.Add($"  - {key} ({description})");
            }
        }

        if (missingSecrets.Any())
        {
            var errorMessage = "CRITICAL: Required secrets are missing from configuration:\n" +
                             string.Join("\n", missingSecrets) +
                             "\n\nEnsure these secrets are configured in Azure Key Vault with the following names:\n" +
                             "  - ConnectionStrings--DefaultConnection\n" +
                             "  - AzureAd--ClientSecret\n" +
                             "  - ApplicationInsights--ConnectionString\n\n" +
                             "Note: Key Vault uses '--' instead of ':' in secret names.";

            throw new InvalidOperationException(errorMessage);
        }

        return services;
    }
}

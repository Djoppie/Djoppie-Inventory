using Azure.Extensions.AspNetCore.Configuration.Secrets;
using Azure.Identity;
using Azure.Security.KeyVault.Secrets;

namespace DjoppieInventory.API.Extensions;

/// <summary>
/// Extension methods for configuring Azure Key Vault integration
/// </summary>
public static class KeyVaultExtensions
{
    /// <summary>
    /// Adds Azure Key Vault configuration provider to the application.
    /// Supports both local development (DefaultAzureCredential) and Azure deployment (Managed Identity).
    /// </summary>
    /// <param name="builder">The WebApplicationBuilder instance</param>
    /// <returns>The WebApplicationBuilder for method chaining</returns>
    public static WebApplicationBuilder AddAzureKeyVault(this WebApplicationBuilder builder)
    {
        var keyVaultName = builder.Configuration["KeyVault:VaultName"];

        // Only configure Key Vault if VaultName is provided
        if (string.IsNullOrWhiteSpace(keyVaultName))
        {
            builder.Logging.AddConsole();
            var logger = builder.Services.BuildServiceProvider().GetRequiredService<ILogger<Program>>();
            logger.LogWarning("KeyVault:VaultName is not configured. Skipping Key Vault integration. Secrets must be provided via appsettings or environment variables.");
            return builder;
        }

        var keyVaultUri = new Uri($"https://{keyVaultName}.vault.azure.net/");

        try
        {
            // DefaultAzureCredential provides a seamless authentication experience:
            // 1. Local Development: Uses Azure CLI, Visual Studio, VS Code, or Environment credentials
            // 2. Azure Deployment: Uses Managed Identity automatically
            var credential = new DefaultAzureCredential(new DefaultAzureCredentialOptions
            {
                // Configure retry settings for resilience
                Retry =
                {
                    MaxRetries = 3,
                    NetworkTimeout = TimeSpan.FromSeconds(30)
                }
            });

            // Add Key Vault configuration provider
            builder.Configuration.AddAzureKeyVault(
                keyVaultUri,
                credential,
                new AzureKeyVaultConfigurationOptions
                {
                    // Reload secrets periodically (every 12 hours by default)
                    ReloadInterval = TimeSpan.FromHours(12)
                });

            builder.Logging.AddConsole();
            var logger = builder.Services.BuildServiceProvider().GetRequiredService<ILogger<Program>>();
            logger.LogInformation("Azure Key Vault configured successfully: {KeyVaultUri}", keyVaultUri);
        }
        catch (Exception ex)
        {
            builder.Logging.AddConsole();
            var logger = builder.Services.BuildServiceProvider().GetRequiredService<ILogger<Program>>();
            logger.LogError(ex, "Failed to configure Azure Key Vault: {KeyVaultUri}. Falling back to local configuration.", keyVaultUri);

            // Don't throw - allow app to start with local config if Key Vault is unavailable
            // This is useful for local development scenarios where Key Vault access might not be configured yet
        }

        return builder;
    }

    /// <summary>
    /// Configures a SecretClient for direct Key Vault secret access in services.
    /// This is useful for scenarios where you need to retrieve secrets programmatically at runtime.
    /// </summary>
    /// <param name="services">The service collection</param>
    /// <param name="configuration">The application configuration</param>
    /// <returns>The service collection for method chaining</returns>
    public static IServiceCollection AddKeyVaultSecretClient(this IServiceCollection services, IConfiguration configuration)
    {
        var keyVaultName = configuration["KeyVault:VaultName"];

        if (string.IsNullOrWhiteSpace(keyVaultName))
        {
            // Register a null client that will throw if used - prevents silent failures
            services.AddSingleton<SecretClient>(_ =>
                throw new InvalidOperationException("Key Vault is not configured. Set KeyVault:VaultName in configuration."));
            return services;
        }

        var keyVaultUri = new Uri($"https://{keyVaultName}.vault.azure.net/");
        var credential = new DefaultAzureCredential(new DefaultAzureCredentialOptions
        {
            Retry =
            {
                MaxRetries = 3,
                NetworkTimeout = TimeSpan.FromSeconds(30)
            }
        });

        services.AddSingleton(new SecretClient(keyVaultUri, credential));

        return services;
    }

    /// <summary>
    /// Validates that required secrets are available from Key Vault or configuration.
    /// This should be called after Key Vault is configured to ensure all required secrets are present.
    /// </summary>
    /// <param name="configuration">The application configuration</param>
    /// <param name="requiredSecrets">Array of required configuration keys</param>
    /// <exception cref="InvalidOperationException">Thrown when required secrets are missing</exception>
    public static void ValidateRequiredSecrets(this IConfiguration configuration, params string[] requiredSecrets)
    {
        var missingSecrets = new List<string>();

        foreach (var secret in requiredSecrets)
        {
            var value = configuration[secret];
            if (string.IsNullOrWhiteSpace(value))
            {
                missingSecrets.Add(secret);
            }
        }

        if (missingSecrets.Any())
        {
            throw new InvalidOperationException(
                $"Missing required configuration values: {string.Join(", ", missingSecrets)}. " +
                "Ensure these secrets are configured in Key Vault or appsettings.");
        }
    }
}

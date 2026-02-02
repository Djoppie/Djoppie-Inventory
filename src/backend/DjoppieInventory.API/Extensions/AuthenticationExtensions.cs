using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Identity.Web;

namespace DjoppieInventory.API.Extensions;

/// <summary>
/// Extension methods for authentication and authorization configuration
/// </summary>
public static class AuthenticationExtensions
{
    /// <summary>
    /// Configures Microsoft Entra ID authentication and authorization
    /// </summary>
    public static IServiceCollection AddEntraIdAuthentication(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        // Configure Authentication with Microsoft Entra ID
        services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddMicrosoftIdentityWebApi(configuration.GetSection("AzureAd"))
            .EnableTokenAcquisitionToCallDownstreamApi()
            .AddMicrosoftGraph(configuration.GetSection("MicrosoftGraph"))
            .AddInMemoryTokenCaches();

        // Configure Authorization
        services.AddAuthorization(options =>
        {
            // Default policy requires authenticated user
            options.FallbackPolicy = options.DefaultPolicy;

            // Custom policy for admin operations
            options.AddPolicy("RequireAdminRole", policy =>
                policy.RequireRole("Admin", "Global Administrator"));
        });

        return services;
    }

    /// <summary>
    /// Configures CORS policy based on environment
    /// </summary>
    public static IServiceCollection AddCorsConfiguration(
        this IServiceCollection services,
        IConfiguration configuration,
        IWebHostEnvironment environment)
    {
        services.AddCors(options =>
        {
            options.AddPolicy("AllowFrontend", policy =>
            {
                if (environment.IsProduction())
                {
                    // Production: Azure Static Web Apps + allow localhost for testing
                    var allowedOrigins = configuration.GetSection("Frontend:AllowedOrigins").Get<string[]>()
                        ?? new[] { "https://lemon-glacier-041730903.1.azurestaticapps.net" };

                    policy.WithOrigins(allowedOrigins)
                          .AllowAnyMethod()
                          .AllowAnyHeader()
                          .AllowCredentials();
                }
                else
                {
                    // Development: Local React dev server (Vite default ports)
                    policy.WithOrigins(
                              "http://localhost:5173",
                              "https://localhost:5173",
                              "http://localhost:5174",
                              "https://localhost:5174")
                          .AllowAnyMethod()
                          .AllowAnyHeader()
                          .AllowCredentials();
                }
            });
        });

        return services;
    }
}

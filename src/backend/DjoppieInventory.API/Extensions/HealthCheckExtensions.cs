using DjoppieInventory.Infrastructure.Data;
using HealthChecks.UI.Client;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace DjoppieInventory.API.Extensions;

/// <summary>
/// Extension methods for configuring health checks.
/// </summary>
public static class HealthCheckExtensions
{
    /// <summary>
    /// Adds health check services to the service collection.
    /// </summary>
    public static IServiceCollection AddHealthCheckServices(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddHealthChecks()
            // Database health check
            .AddDbContextCheck<ApplicationDbContext>(
                name: "database",
                failureStatus: HealthStatus.Unhealthy,
                tags: new[] { "db", "sql", "ready" })
            // Custom check for Graph API configuration
            .AddCheck("graph-api-config", () =>
            {
                var clientId = configuration["AzureAd:ClientId"];
                var tenantId = configuration["AzureAd:TenantId"];

                if (string.IsNullOrEmpty(clientId) || string.IsNullOrEmpty(tenantId))
                {
                    return HealthCheckResult.Degraded("Graph API configuration incomplete");
                }

                return HealthCheckResult.Healthy("Graph API configured");
            }, tags: new[] { "config", "ready" })
            // Memory check
            .AddCheck("memory", () =>
            {
                var allocated = GC.GetTotalMemory(forceFullCollection: false);
                var threshold = 1024L * 1024L * 1024L; // 1 GB

                if (allocated >= threshold)
                {
                    return HealthCheckResult.Unhealthy($"Memory usage too high: {allocated / (1024 * 1024)} MB");
                }

                if (allocated >= threshold * 0.8)
                {
                    return HealthCheckResult.Degraded($"Memory usage elevated: {allocated / (1024 * 1024)} MB");
                }

                return HealthCheckResult.Healthy($"Memory usage normal: {allocated / (1024 * 1024)} MB");
            }, tags: new[] { "memory" });

        return services;
    }

    /// <summary>
    /// Maps health check endpoints to the application.
    /// </summary>
    public static WebApplication MapHealthCheckEndpoints(this WebApplication app)
    {
        // Detailed health check endpoint (for monitoring systems)
        app.MapHealthChecks("/health", new HealthCheckOptions
        {
            ResponseWriter = UIResponseWriter.WriteHealthCheckUIResponse,
            AllowCachingResponses = false
        });

        // Ready check - only passes when all "ready" tagged checks pass
        // Used by Kubernetes/Azure to know when the app can receive traffic
        app.MapHealthChecks("/health/ready", new HealthCheckOptions
        {
            Predicate = check => check.Tags.Contains("ready"),
            ResponseWriter = UIResponseWriter.WriteHealthCheckUIResponse,
            AllowCachingResponses = false
        });

        // Live check - basic check to see if the app is running
        // No health checks are run, just returns 200 if the app is alive
        app.MapHealthChecks("/health/live", new HealthCheckOptions
        {
            Predicate = _ => false, // No checks, just return healthy if app is running
            ResponseWriter = async (context, report) =>
            {
                context.Response.ContentType = "application/json";
                await context.Response.WriteAsJsonAsync(new
                {
                    status = "Healthy",
                    timestamp = DateTime.UtcNow
                });
            },
            AllowCachingResponses = false
        });

        return app;
    }
}

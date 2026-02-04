using DjoppieInventory.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace DjoppieInventory.API.Extensions;

/// <summary>
/// Extension methods for database configuration
/// </summary>
public static class DatabaseExtensions
{
    /// <summary>
    /// Configures the database context based on environment
    /// </summary>
    public static IServiceCollection AddDatabaseConfiguration(
        this IServiceCollection services,
        IConfiguration configuration,
        IWebHostEnvironment environment)
    {
        if (environment.IsProduction())
        {
            // Production: Use SQL Server with retry logic
            services.AddDbContext<ApplicationDbContext>(options =>
                options.UseSqlServer(
                    configuration.GetConnectionString("DefaultConnection"),
                    sqlServerOptionsAction: sqlOptions =>
                    {
                        sqlOptions.EnableRetryOnFailure(
                            maxRetryCount: 5,
                            maxRetryDelay: TimeSpan.FromSeconds(30),
                            errorNumbersToAdd: null);
                    }));
        }
        else
        {
            // Development: Use SQLite
            services.AddDbContext<ApplicationDbContext>(options =>
                options.UseSqlite(
                    configuration.GetConnectionString("DefaultConnection") ??
                    "Data Source=djoppie.db"));
        }

        return services;
    }

    /// <summary>
    /// Ensures database is created and optionally applies migrations
    /// </summary>
    public static WebApplication EnsureDatabaseReady(this WebApplication app)
    {
        using var scope = app.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();

        if (app.Environment.IsProduction())
        {
            var autoMigrate = app.Configuration.GetValue<bool>("Database:AutoMigrate", false);
            if (autoMigrate)
            {
                try
                {
                    // Use EnsureCreated to generate schema matching the current provider (SQL Server)
                    // Note: existing SQLite-based migrations are not compatible with SQL Server
                    logger.LogInformation("Ensuring database schema exists...");
                    db.Database.EnsureCreated();
                    logger.LogInformation("Database schema ready.");
                }
                catch (Exception ex)
                {
                    logger.LogError(ex, "An error occurred while initializing the database.");
                    logger.LogWarning("Application will start without database initialization. Please run migrations manually.");
                }
            }
        }
        else
        {
            // Ensure database is created in development
            db.Database.EnsureCreated();
        }

        return app;
    }
}

using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;

namespace DjoppieInventory.Infrastructure.Data;

/// <summary>
/// Design-time factory for EF Core migrations.
/// Uses SQL Server when a connection string is provided via environment variable,
/// otherwise falls back to SQLite for local development.
/// </summary>
public class DesignTimeDbContextFactory : IDesignTimeDbContextFactory<ApplicationDbContext>
{
    public ApplicationDbContext CreateDbContext(string[] args)
    {
        var optionsBuilder = new DbContextOptionsBuilder<ApplicationDbContext>();

        // Check for SQL Server connection string from environment or command line
        var connectionString = Environment.GetEnvironmentVariable("AZURE_SQL_CONNECTION");

        if (!string.IsNullOrEmpty(connectionString))
        {
            // Use SQL Server for Azure migrations
            optionsBuilder.UseSqlServer(connectionString, options =>
            {
                options.EnableRetryOnFailure(
                    maxRetryCount: 5,
                    maxRetryDelay: TimeSpan.FromSeconds(30),
                    errorNumbersToAdd: null);
            });
        }
        else
        {
            // Default to SQLite for local development
            optionsBuilder.UseSqlite("Data Source=djoppie.db");
        }

        return new ApplicationDbContext(optionsBuilder.Options);
    }
}

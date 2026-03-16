using DjoppieInventory.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace DjoppieInventory.Tests.Helpers;

/// <summary>
/// Factory for creating in-memory database contexts for testing.
/// Ensures each test gets an isolated database instance.
/// </summary>
public static class TestDbContextFactory
{
    /// <summary>
    /// Creates a new ApplicationDbContext with an in-memory database.
    /// Each context gets a unique database name to ensure test isolation.
    /// </summary>
    public static ApplicationDbContext CreateInMemoryContext(string? databaseName = null)
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName ?? Guid.NewGuid().ToString())
            .EnableSensitiveDataLogging()
            .Options;

        var context = new ApplicationDbContext(options);

        // Ensure the database is created
        context.Database.EnsureCreated();

        return context;
    }

    /// <summary>
    /// Creates a context and seeds it with common test data.
    /// </summary>
    public static ApplicationDbContext CreateSeededContext(string? databaseName = null)
    {
        var context = CreateInMemoryContext(databaseName);
        SeedTestData(context);
        return context;
    }

    /// <summary>
    /// Seeds common test data into the provided context.
    /// </summary>
    private static void SeedTestData(ApplicationDbContext context)
    {
        // Add seed data here if needed
        context.SaveChanges();
    }
}

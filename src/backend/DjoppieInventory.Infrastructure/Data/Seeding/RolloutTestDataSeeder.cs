using DjoppieInventory.Core.Entities;
using DjoppieInventory.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace DjoppieInventory.Infrastructure.Data.Seeding;

/// <summary>
/// Seeds test data for rollout sessions, days, and workplaces
/// </summary>
public static class RolloutTestDataSeeder
{
    public static async Task SeedAsync(ApplicationDbContext context, ILogger logger)
    {
        // Check if we already have rollout sessions
        if (await context.RolloutSessions.AnyAsync())
        {
            logger.LogInformation("Rollout sessions already exist. Skipping seeding.");
            return;
        }

        logger.LogInformation("Seeding rollout test data...");

        // Create test session
        var session = new RolloutSession
        {
            SessionName = "Dell uitrol Q1 2026",
            Description = "Uitrol van nieuwe Dell laptops voor Q1 2026",
            Status = RolloutSessionStatus.Planning,
            PlannedStartDate = new DateTime(2026, 1, 6),
            PlannedEndDate = new DateTime(2026, 1, 31),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            CreatedBy = "system"
        };

        context.RolloutSessions.Add(session);
        await context.SaveChangesAsync();

        logger.LogInformation($"Created test session: {session.SessionName} (ID: {session.Id})");

        // Create test day
        var day = new RolloutDay
        {
            RolloutSessionId = session.Id,
            DayNumber = 1,
            Date = new DateTime(2026, 1, 6),
            Notes = "Eerste dag van de uitrol",
            Status = RolloutDayStatus.Planning,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        context.RolloutDays.Add(day);
        await context.SaveChangesAsync();

        logger.LogInformation($"Created test day: Day {day.DayNumber} (ID: {day.Id})");

        logger.LogInformation("Rollout test data seeding completed.");
    }
}

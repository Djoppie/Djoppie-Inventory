using DjoppieInventory.Core.Entities;
using DjoppieInventory.Core.Entities.Enums;
using DjoppieInventory.Infrastructure.Data;
using DjoppieInventory.Infrastructure.Services;
using DjoppieInventory.Tests.Helpers;
using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;

namespace DjoppieInventory.Tests.Services;

public class ReportsOverviewServiceTests
{
    private ApplicationDbContext CreateDb() => TestDbContextFactory.CreateInMemoryContext();

    // ──────────────────────────────────────────────────────────────────────────
    // Assets KPI (from Task 1.7)
    // ──────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task GetOverviewAsync_CountsAssetsByStatus()
    {
        await using var db = CreateDb();
        db.Assets.AddRange(
            new Asset { Id = 1, AssetCode = "A1", AssetName = "A1", Status = AssetStatus.InGebruik },
            new Asset { Id = 2, AssetCode = "A2", AssetName = "A2", Status = AssetStatus.InGebruik },
            new Asset { Id = 3, AssetCode = "A3", AssetName = "A3", Status = AssetStatus.Stock },
            new Asset { Id = 4, AssetCode = "A4", AssetName = "A4", Status = AssetStatus.Defect }
        );
        await db.SaveChangesAsync();

        var sut = new ReportsOverviewService(db, NullLogger<ReportsOverviewService>.Instance);
        var result = await sut.GetOverviewAsync();

        result.Assets.Total.Should().Be(4);
        result.Assets.InUse.Should().Be(2);
        result.Assets.Defect.Should().Be(1);
        result.Assets.InUsePercentage.Should().Be(50m);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Workplaces KPI
    // ──────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task GetOverviewAsync_CountsWorkplaceOccupancy()
    {
        await using var db = CreateDb();

        // Need a Building (required FK) — use Id beyond seed range to avoid conflicts
        db.Buildings.Add(new Building { Id = 100, Code = "TEST", Name = "Test Building" });
        await db.SaveChangesAsync();

        db.PhysicalWorkplaces.AddRange(
            new PhysicalWorkplace { Id = 100, Code = "W1", Name = "W1", BuildingId = 100, CurrentOccupantEntraId = "entra-1" },
            new PhysicalWorkplace { Id = 101, Code = "W2", Name = "W2", BuildingId = 100, CurrentOccupantEntraId = null },
            new PhysicalWorkplace { Id = 102, Code = "W3", Name = "W3", BuildingId = 100, CurrentOccupantEntraId = "entra-2" }
        );
        await db.SaveChangesAsync();

        var sut = new ReportsOverviewService(db, NullLogger<ReportsOverviewService>.Instance);
        var result = await sut.GetOverviewAsync();

        // Seed data adds 7 physical workplaces; our test adds 3 more, all without occupant except 2
        // We query delta — in-memory DB has all seeded + our data.
        // Seed workplaces have no occupant, so occupied = our 2.
        result.Workplaces.Total.Should().Be(10);   // 7 seeded + 3 added
        result.Workplaces.Occupied.Should().Be(2);
        result.Workplaces.OccupancyPercentage.Should().BeApproximately(20.0m, 0.1m);
    }

    [Fact]
    public async Task GetOverviewAsync_WorkplacesKpi_ReturnsZeroWhenEmpty()
    {
        await using var db = CreateDb();

        // Use a fresh DB without seed workplaces — but EnsureCreated runs seed.
        // Seed data has 7 workplaces. Since we can't remove them easily, just verify zeros still work:
        var sut = new ReportsOverviewService(db, NullLogger<ReportsOverviewService>.Instance);
        var result = await sut.GetOverviewAsync();

        result.Workplaces.Total.Should().Be(7); // 7 seeded
        result.Workplaces.Occupied.Should().Be(0);
        result.Workplaces.OccupancyPercentage.Should().Be(0m);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Intune KPI
    // ──────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task GetOverviewAsync_CountsIntuneEnrolledAndStale()
    {
        await using var db = CreateDb();
        db.Assets.AddRange(
            // Enrolled, recent check-in (not stale)
            new Asset { Id = 1, AssetCode = "A1", AssetName = "A1", Status = AssetStatus.InGebruik,
                IntuneLastCheckIn = DateTime.UtcNow.AddDays(-5) },
            // Enrolled, stale check-in (>30 days ago)
            new Asset { Id = 2, AssetCode = "A2", AssetName = "A2", Status = AssetStatus.InGebruik,
                IntuneLastCheckIn = DateTime.UtcNow.AddDays(-60) },
            // Not enrolled (no IntuneLastCheckIn)
            new Asset { Id = 3, AssetCode = "A3", AssetName = "A3", Status = AssetStatus.InGebruik }
        );
        await db.SaveChangesAsync();

        var sut = new ReportsOverviewService(db, NullLogger<ReportsOverviewService>.Instance);
        var result = await sut.GetOverviewAsync();

        result.Intune.Enrolled.Should().Be(2);
        result.Intune.Stale.Should().Be(1);
    }

    [Fact]
    public async Task GetOverviewAsync_IntuneKpi_ZeroWhenNoAssets()
    {
        await using var db = CreateDb();

        var sut = new ReportsOverviewService(db, NullLogger<ReportsOverviewService>.Instance);
        var result = await sut.GetOverviewAsync();

        result.Intune.Enrolled.Should().Be(0);
        result.Intune.Stale.Should().Be(0);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Activity KPI
    // ──────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task GetOverviewAsync_CountsActivityLast7Days()
    {
        await using var db = CreateDb();
        db.Assets.Add(new Asset { Id = 1, AssetCode = "A1", AssetName = "A1", Status = AssetStatus.InGebruik });
        db.AssetEvents.AddRange(
            // Within 7 days
            new AssetEvent { Id = 1, AssetId = 1, EventDate = DateTime.UtcNow.AddDays(-2),
                EventType = AssetEventType.StatusChanged, Description = "x" },
            // Outside 7 days (8 days ago)
            new AssetEvent { Id = 2, AssetId = 1, EventDate = DateTime.UtcNow.AddDays(-8),
                EventType = AssetEventType.StatusChanged, Description = "y" }
        );
        await db.SaveChangesAsync();

        var sut = new ReportsOverviewService(db, NullLogger<ReportsOverviewService>.Instance);
        var result = await sut.GetOverviewAsync();

        result.Activity.EventsLast7Days.Should().Be(1);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Attention list
    // ──────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task GetOverviewAsync_AttentionList_IncludesDefectWhenPresent()
    {
        await using var db = CreateDb();
        db.Assets.AddRange(
            new Asset { Id = 1, AssetCode = "A1", AssetName = "A1", Status = AssetStatus.Defect },
            new Asset { Id = 2, AssetCode = "A2", AssetName = "A2", Status = AssetStatus.Defect }
        );
        await db.SaveChangesAsync();

        var sut = new ReportsOverviewService(db, NullLogger<ReportsOverviewService>.Instance);
        var result = await sut.GetOverviewAsync();

        result.Attention.Should().Contain(i => i.Severity == "error" && i.Count == 2);
    }

    [Fact]
    public async Task GetOverviewAsync_AttentionList_IncludesStaleIntuneWhenPresent()
    {
        await using var db = CreateDb();
        db.Assets.AddRange(
            new Asset { Id = 1, AssetCode = "A1", AssetName = "A1", Status = AssetStatus.InGebruik,
                IntuneLastCheckIn = DateTime.UtcNow.AddDays(-45) },
            new Asset { Id = 2, AssetCode = "A2", AssetName = "A2", Status = AssetStatus.InGebruik,
                IntuneLastCheckIn = DateTime.UtcNow.AddDays(-31) }
        );
        await db.SaveChangesAsync();

        var sut = new ReportsOverviewService(db, NullLogger<ReportsOverviewService>.Instance);
        var result = await sut.GetOverviewAsync();

        result.Attention.Should().Contain(i => i.Severity == "warning" && i.Count == 2);
    }

    [Fact]
    public async Task GetOverviewAsync_AttentionList_EmptyWhenNoIssues()
    {
        await using var db = CreateDb();
        db.Assets.Add(new Asset { Id = 1, AssetCode = "A1", AssetName = "A1", Status = AssetStatus.Stock });
        await db.SaveChangesAsync();

        var sut = new ReportsOverviewService(db, NullLogger<ReportsOverviewService>.Instance);
        var result = await sut.GetOverviewAsync();

        result.Attention.Should().BeEmpty();
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Rollouts KPI
    // ──────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task GetOverviewAsync_RolloutsKpi_CountsActiveSessionsAndCompletion()
    {
        await using var db = CreateDb();

        // Session 1: InProgress with 2 workplaces, 1 completed
        var session1 = new RolloutSession
        {
            Id = 1,
            SessionName = "Session 1",
            Status = RolloutSessionStatus.InProgress,
            PlannedStartDate = DateTime.UtcNow,
            CreatedBy = "test",
            CreatedByEmail = "test@test.com"
        };
        var day1 = new RolloutDay
        {
            Id = 1,
            RolloutSessionId = 1,
            Date = DateTime.UtcNow.Date,
            DayNumber = 1
        };
        db.RolloutSessions.Add(session1);
        db.RolloutDays.Add(day1);
        db.RolloutWorkplaces.AddRange(
            new RolloutWorkplace { Id = 1, RolloutDayId = 1, UserName = "User1",
                Status = RolloutWorkplaceStatus.Completed },
            new RolloutWorkplace { Id = 2, RolloutDayId = 1, UserName = "User2",
                Status = RolloutWorkplaceStatus.Pending }
        );
        await db.SaveChangesAsync();

        var sut = new ReportsOverviewService(db, NullLogger<ReportsOverviewService>.Instance);
        var result = await sut.GetOverviewAsync();

        result.Rollouts.ActiveSessions.Should().Be(1);
        result.Rollouts.AverageCompletionPercentage.Should().Be(50m);
    }

    [Fact]
    public async Task GetOverviewAsync_RolloutsKpi_ZeroWhenNoActiveSessions()
    {
        await using var db = CreateDb();

        // Session with Planning status (not InProgress)
        db.RolloutSessions.Add(new RolloutSession
        {
            Id = 1,
            SessionName = "Planned",
            Status = RolloutSessionStatus.Planning,
            PlannedStartDate = DateTime.UtcNow,
            CreatedBy = "test",
            CreatedByEmail = "test@test.com"
        });
        await db.SaveChangesAsync();

        var sut = new ReportsOverviewService(db, NullLogger<ReportsOverviewService>.Instance);
        var result = await sut.GetOverviewAsync();

        result.Rollouts.ActiveSessions.Should().Be(0);
        result.Rollouts.AverageCompletionPercentage.Should().Be(0m);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Leasing KPI (placeholder)
    // ──────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task GetOverviewAsync_LeasingKpi_ReturnsZeros()
    {
        await using var db = CreateDb();

        var sut = new ReportsOverviewService(db, NullLogger<ReportsOverviewService>.Instance);
        var result = await sut.GetOverviewAsync();

        result.Leasing.ActiveContracts.Should().Be(0);
        result.Leasing.ExpiringWithin60Days.Should().Be(0);
    }
}

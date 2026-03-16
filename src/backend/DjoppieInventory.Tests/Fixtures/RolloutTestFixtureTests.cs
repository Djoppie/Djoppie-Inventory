using DjoppieInventory.Tests.Helpers;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;

namespace DjoppieInventory.Tests.Fixtures;

/// <summary>
/// Tests for RolloutTestFixture to ensure fixture helpers work correctly.
/// These tests validate the test data creation helpers themselves.
/// </summary>
public class RolloutTestFixtureTests : IDisposable
{
    public void Dispose()
    {
        // Cleanup if needed
    }

    [Fact]
    public async Task CreateFullSessionAsync_CreatesSessionWithDaysAndWorkplaces()
    {
        // Arrange
        await using var context = TestDbContextFactory.CreateInMemoryContext();

        // Act
        var session = await RolloutTestFixture.CreateFullSessionAsync(
            context,
            dayCount: 3,
            workplacesPerDay: 2);

        // Assert
        session.Should().NotBeNull();
        session.SessionName.Should().Be("Test Rollout Session");

        var days = await context.RolloutDays
            .Where(d => d.RolloutSessionId == session.Id)
            .ToListAsync();

        days.Should().HaveCount(3);

        var workplaces = await context.RolloutWorkplaces
            .Where(w => days.Select(d => d.Id).Contains(w.RolloutDayId))
            .ToListAsync();

        workplaces.Should().HaveCount(6); // 3 days * 2 workplaces
    }

    [Fact]
    public async Task CreateAssetTypesAsync_CreatesStandardAssetTypes()
    {
        // Arrange
        await using var context = TestDbContextFactory.CreateInMemoryContext();

        // Act
        var assetTypes = await RolloutTestFixture.CreateAssetTypesAsync(context);

        // Assert
        assetTypes.Should().HaveCount(4);
        assetTypes.Should().Contain(t => t.Code == "LAP");
        assetTypes.Should().Contain(t => t.Code == "MON");
        assetTypes.Should().Contain(t => t.Code == "KEY");
        assetTypes.Should().Contain(t => t.Code == "MOU");
    }

    [Fact]
    public async Task CreateAssetsAsync_CreatesAssetsWithCorrectStatus()
    {
        // Arrange
        await using var context = TestDbContextFactory.CreateInMemoryContext();
        var assetTypes = await RolloutTestFixture.CreateAssetTypesAsync(context);
        var laptopType = assetTypes.First(t => t.Code == "LAP");

        // Act
        var assets = await RolloutTestFixture.CreateAssetsAsync(
            context,
            laptopType.Id,
            count: 10);

        // Assert
        assets.Should().HaveCount(10);
        assets.Should().OnlyContain(a => a.Status == Core.Entities.Enums.AssetStatus.Nieuw);
        assets.Should().OnlyContain(a => a.AssetTypeId == laptopType.Id);
    }

    [Fact]
    public async Task CreateCompleteScenarioAsync_CreatesFullTestEnvironment()
    {
        // Arrange
        await using var context = TestDbContextFactory.CreateInMemoryContext();

        // Act
        var scenario = await RolloutTestFixture.CreateCompleteScenarioAsync(context);

        // Assert
        scenario.Should().NotBeNull();
        scenario.Session.Should().NotBeNull();
        scenario.Days.Should().HaveCount(2);
        scenario.Workplaces.Should().NotBeEmpty();
        scenario.AssetTypes.Should().HaveCount(4);
        scenario.Templates.Should().HaveCount(2);
        scenario.Assets.Should().HaveCount(10);
        scenario.Services.Should().HaveCount(3);
        scenario.Assignments.Should().HaveCount(3);
    }
}

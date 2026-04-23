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
}

using DjoppieInventory.Core.Entities;
using DjoppieInventory.Infrastructure.Data;
using DjoppieInventory.Infrastructure.Services;
using DjoppieInventory.Tests.Helpers;
using FluentAssertions;

namespace DjoppieInventory.Tests.Services;

public class EmployeeReportsServiceTests
{
    private static ApplicationDbContext CreateDb() => TestDbContextFactory.CreateInMemoryContext();

    [Fact]
    public async Task GetEmployeesAsync_ReturnsEmployeesWithAssetCount()
    {
        await using var db = CreateDb();
        db.Employees.Add(new Employee
        {
            Id = 1,
            DisplayName = "Jan de Vries",
            UserPrincipalName = "jan@example.com",
            EntraId = "entra-jan",
            IsActive = true
        });
        db.Assets.AddRange(
            new Asset { Id = 10, AssetCode = "A1", AssetName = "Asset 1", Status = AssetStatus.InGebruik, EmployeeId = 1 },
            new Asset { Id = 11, AssetCode = "A2", AssetName = "Asset 2", Status = AssetStatus.InGebruik, EmployeeId = 1 }
        );
        await db.SaveChangesAsync();

        var sut = new EmployeeReportsService(db);
        var result = await sut.GetEmployeesAsync();

        result.Should().HaveCount(1);
        result[0].EmployeeId.Should().Be(1);
        result[0].DisplayName.Should().Be("Jan de Vries");
        result[0].AssetCount.Should().Be(2);
    }

    [Fact]
    public async Task GetEmployeesAsync_ExcludesInactiveEmployees()
    {
        await using var db = CreateDb();
        db.Employees.AddRange(
            new Employee { Id = 1, DisplayName = "Active User", UserPrincipalName = "active@example.com", EntraId = "entra-1", IsActive = true },
            new Employee { Id = 2, DisplayName = "Inactive User", UserPrincipalName = "inactive@example.com", EntraId = "entra-2", IsActive = false }
        );
        await db.SaveChangesAsync();

        var sut = new EmployeeReportsService(db);
        var result = await sut.GetEmployeesAsync();

        result.Should().HaveCount(1);
        result[0].DisplayName.Should().Be("Active User");
    }

    [Fact]
    public async Task GetEmployeesAsync_ReturnsServiceName_WhenEmployeeHasService()
    {
        await using var db = CreateDb();
        db.Services.Add(new Service { Id = 50, Name = "Dienst ICT", Code = "ICT", SortOrder = 1 });
        db.Employees.Add(new Employee
        {
            Id = 1,
            DisplayName = "Jane Smith",
            UserPrincipalName = "jane@example.com",
            EntraId = "entra-jane",
            IsActive = true,
            ServiceId = 50
        });
        await db.SaveChangesAsync();

        var sut = new EmployeeReportsService(db);
        var result = await sut.GetEmployeesAsync();

        result.Should().HaveCount(1);
        result[0].ServiceName.Should().Be("Dienst ICT");
        result[0].ServiceId.Should().Be(50);
    }

    [Fact]
    public async Task GetEmployeesAsync_ReturnsZeroAssetCount_WhenNoAssetsAssigned()
    {
        await using var db = CreateDb();
        db.Employees.Add(new Employee
        {
            Id = 1,
            DisplayName = "No Assets",
            UserPrincipalName = "noassets@example.com",
            EntraId = "entra-noassets",
            IsActive = true
        });
        await db.SaveChangesAsync();

        var sut = new EmployeeReportsService(db);
        var result = await sut.GetEmployeesAsync();

        result.Should().HaveCount(1);
        result[0].AssetCount.Should().Be(0);
    }

    [Fact]
    public async Task GetEmployeeTimelineAsync_ReturnsEventsForEmployeeAssets()
    {
        await using var db = CreateDb();
        db.Employees.Add(new Employee
        {
            Id = 1,
            DisplayName = "Test User",
            UserPrincipalName = "test@example.com",
            EntraId = "entra-test",
            IsActive = true
        });
        db.Assets.Add(new Asset { Id = 10, AssetCode = "A1", AssetName = "Asset 1", Status = AssetStatus.InGebruik, EmployeeId = 1 });
        db.AssetEvents.AddRange(
            new AssetEvent { Id = 1, AssetId = 10, EventDate = DateTime.UtcNow.AddDays(-1), EventType = AssetEventType.StatusChanged, Description = "Status changed" },
            new AssetEvent { Id = 2, AssetId = 10, EventDate = DateTime.UtcNow.AddDays(-2), EventType = AssetEventType.OwnerChanged, Description = "Owner changed" }
        );
        await db.SaveChangesAsync();

        var sut = new EmployeeReportsService(db);
        var result = await sut.GetEmployeeTimelineAsync(1);

        result.Should().HaveCount(2);
        result[0].EventId.Should().Be(1); // Most recent first
        result[0].AssetCode.Should().Be("A1");
    }

    [Fact]
    public async Task GetEmployeeTimelineAsync_ReturnsEmpty_ForEmployeeWithNoAssets()
    {
        await using var db = CreateDb();
        db.Employees.Add(new Employee
        {
            Id = 1,
            DisplayName = "No Assets",
            UserPrincipalName = "noassets@example.com",
            EntraId = "entra-noassets",
            IsActive = true
        });
        await db.SaveChangesAsync();

        var sut = new EmployeeReportsService(db);
        var result = await sut.GetEmployeeTimelineAsync(1);

        result.Should().BeEmpty();
    }
}

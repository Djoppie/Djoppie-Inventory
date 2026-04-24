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

    // ──────────────────────────────────────────────────────────────────────────
    // Multi-strategy asset matching: Owner string, workplace occupant,
    // primary-device extraction, and last-event aggregation.
    // ──────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task GetEmployeesAsync_MatchesAssetsByOwnerString_WhenEmployeeIdIsNull()
    {
        await using var db = CreateDb();
        db.Employees.Add(new Employee
        {
            Id = 1,
            DisplayName = "Piet Peters",
            UserPrincipalName = "piet@example.com",
            EntraId = "entra-piet",
            IsActive = true
        });
        db.Assets.AddRange(
            new Asset { Id = 10, AssetCode = "A1", AssetName = "UPN match",         Status = AssetStatus.InGebruik, Owner = "piet@example.com" },
            new Asset { Id = 11, AssetCode = "A2", AssetName = "DisplayName match", Status = AssetStatus.InGebruik, Owner = "Piet Peters" }
        );
        await db.SaveChangesAsync();

        var result = await new EmployeeReportsService(db).GetEmployeesAsync();

        result.Should().HaveCount(1);
        result[0].AssetCount.Should().Be(2);
    }

    [Fact]
    public async Task GetEmployeesAsync_MatchesAssetsByOwnerString_CaseInsensitive()
    {
        await using var db = CreateDb();
        db.Employees.Add(new Employee
        {
            Id = 1,
            DisplayName = "Anna Peeters",
            UserPrincipalName = "anna@example.com",
            EntraId = "entra-anna",
            IsActive = true
        });
        db.Assets.Add(new Asset { Id = 10, AssetCode = "A1", AssetName = "x", Status = AssetStatus.InGebruik, Owner = "ANNA@EXAMPLE.COM" });
        await db.SaveChangesAsync();

        var result = await new EmployeeReportsService(db).GetEmployeesAsync();

        result[0].AssetCount.Should().Be(1);
    }

    [Fact]
    public async Task GetEmployeesAsync_MatchesAssetsByWorkplaceOccupant_WhenOtherFieldsMissing()
    {
        await using var db = CreateDb();
        db.Employees.Add(new Employee
        {
            Id = 1,
            DisplayName = "Workplace User",
            UserPrincipalName = "wp@example.com",
            EntraId = "entra-wp",
            IsActive = true
        });
        db.PhysicalWorkplaces.Add(new PhysicalWorkplace
        {
            Id = 100,
            Code = "WP-001",
            Name = "Workplace 1",
            BuildingId = 1,
            CurrentOccupantEntraId = "entra-wp"
        });
        // Asset has neither EmployeeId nor Owner — only the workplace link.
        db.Assets.Add(new Asset { Id = 10, AssetCode = "A1", AssetName = "x", Status = AssetStatus.InGebruik, PhysicalWorkplaceId = 100 });
        await db.SaveChangesAsync();

        var result = await new EmployeeReportsService(db).GetEmployeesAsync();

        result[0].AssetCount.Should().Be(1);
    }

    [Fact]
    public async Task GetEmployeesAsync_PrefersDirectFk_OverOwnerString()
    {
        await using var db = CreateDb();
        db.Employees.AddRange(
            new Employee { Id = 1, DisplayName = "FK User",    UserPrincipalName = "fk@example.com",    EntraId = "e1", IsActive = true },
            new Employee { Id = 2, DisplayName = "Other User", UserPrincipalName = "other@example.com", EntraId = "e2", IsActive = true }
        );
        // Asset has EmployeeId=1 AND Owner pointing to employee 2. FK wins.
        db.Assets.Add(new Asset
        {
            Id = 10, AssetCode = "A1", AssetName = "x", Status = AssetStatus.InGebruik,
            EmployeeId = 1,
            Owner = "other@example.com"
        });
        await db.SaveChangesAsync();

        var result = await new EmployeeReportsService(db).GetEmployeesAsync();

        result.Single(r => r.EmployeeId == 1).AssetCount.Should().Be(1);
        result.Single(r => r.EmployeeId == 2).AssetCount.Should().Be(0);
    }

    [Fact]
    public async Task GetEmployeesAsync_ExtractsPrimaryLaptopAndDesktop_FromAssetTypeName()
    {
        await using var db = CreateDb();
        db.Employees.Add(new Employee { Id = 1, DisplayName = "Gear User", UserPrincipalName = "gear@example.com", EntraId = "entra-gear", IsActive = true });
        // Use high Ids to avoid colliding with TestDbContextFactory seed data.
        db.AssetTypes.AddRange(
            new AssetType { Id = 9001, Code = "T-LAP", Name = "Laptop",  IsActive = true },
            new AssetType { Id = 9002, Code = "T-DSK", Name = "Desktop", IsActive = true },
            new AssetType { Id = 9003, Code = "T-MON", Name = "Monitor", IsActive = true }
        );
        db.Assets.AddRange(
            new Asset { Id = 10, AssetCode = "LAP-26-DELL-00012", AssetName = "Laptop 1", Status = AssetStatus.InGebruik, EmployeeId = 1, AssetTypeId = 9001 },
            new Asset { Id = 11, AssetCode = "DSK-26-HP-00003",   AssetName = "Desktop 1", Status = AssetStatus.InGebruik, EmployeeId = 1, AssetTypeId = 9002 },
            new Asset { Id = 12, AssetCode = "MON-26-LG-00001",   AssetName = "Monitor 1", Status = AssetStatus.InGebruik, EmployeeId = 1, AssetTypeId = 9003 }
        );
        await db.SaveChangesAsync();

        var result = await new EmployeeReportsService(db).GetEmployeesAsync();

        result.Should().HaveCount(1);
        result[0].AssetCount.Should().Be(3);
        result[0].PrimaryLaptopCode.Should().Be("LAP-26-DELL-00012");
        result[0].PrimaryDesktopCode.Should().Be("DSK-26-HP-00003");
    }

    [Fact]
    public async Task GetEmployeesAsync_PopulatesLastEventDate_FromLatestEventAcrossAssets()
    {
        await using var db = CreateDb();
        db.Employees.Add(new Employee { Id = 1, DisplayName = "Event User", UserPrincipalName = "ev@example.com", EntraId = "entra-ev", IsActive = true });
        db.Assets.AddRange(
            new Asset { Id = 10, AssetCode = "A1", AssetName = "x", Status = AssetStatus.InGebruik, EmployeeId = 1 },
            new Asset { Id = 11, AssetCode = "A2", AssetName = "y", Status = AssetStatus.InGebruik, EmployeeId = 1 }
        );
        var expectedLatest = new DateTime(2026, 4, 20, 10, 0, 0, DateTimeKind.Utc);
        db.AssetEvents.AddRange(
            new AssetEvent { Id = 1, AssetId = 10, EventDate = new DateTime(2026, 4, 15, 8, 0, 0, DateTimeKind.Utc), EventType = AssetEventType.StatusChanged, Description = "x" },
            new AssetEvent { Id = 2, AssetId = 11, EventDate = expectedLatest,                                        EventType = AssetEventType.OwnerChanged,  Description = "y" },
            new AssetEvent { Id = 3, AssetId = 11, EventDate = new DateTime(2026, 3, 1, 0, 0, 0, DateTimeKind.Utc),   EventType = AssetEventType.StatusChanged, Description = "z" }
        );
        await db.SaveChangesAsync();

        var result = await new EmployeeReportsService(db).GetEmployeesAsync();

        result[0].LastEventDate.Should().Be(expectedLatest);
    }

    [Fact]
    public async Task GetEmployeeTimelineAsync_FindsAssets_ViaOwnerString()
    {
        await using var db = CreateDb();
        db.Employees.Add(new Employee { Id = 1, DisplayName = "Legacy", UserPrincipalName = "legacy@example.com", EntraId = "entra-legacy", IsActive = true });
        db.Assets.Add(new Asset { Id = 10, AssetCode = "A1", AssetName = "x", Status = AssetStatus.InGebruik, Owner = "legacy@example.com" });
        db.AssetEvents.Add(new AssetEvent { Id = 1, AssetId = 10, EventDate = DateTime.UtcNow, EventType = AssetEventType.StatusChanged, Description = "changed" });
        await db.SaveChangesAsync();

        var result = await new EmployeeReportsService(db).GetEmployeeTimelineAsync(1);

        result.Should().HaveCount(1);
        result[0].AssetCode.Should().Be("A1");
    }
}

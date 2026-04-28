using DjoppieInventory.Core.Entities;
using DjoppieInventory.Core.Interfaces;
using DjoppieInventory.Infrastructure.Data;
using DjoppieInventory.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;

namespace DjoppieInventory.Tests.Services;

public class AssetRequestCompletionServiceTests
{
    private static ApplicationDbContext NewContext()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .ConfigureWarnings(w => w.Ignore(InMemoryEventId.TransactionIgnoredWarning))
            .Options;
        return new ApplicationDbContext(options);
    }

    private static AssetType SeedAssetType(ApplicationDbContext ctx, string code = "LAP")
    {
        var category = new Category { Code = "TST", Name = "Test", IsActive = true, CreatedAt = DateTime.UtcNow };
        ctx.Categories.Add(category);
        ctx.SaveChanges();

        var assetType = new AssetType
        {
            Code = code, Name = "Laptop", CategoryId = category.Id,
            IsActive = true, CreatedAt = DateTime.UtcNow
        };
        ctx.AssetTypes.Add(assetType);
        ctx.SaveChanges();
        return assetType;
    }

    private static Asset SeedAsset(ApplicationDbContext ctx, AssetType type, AssetStatus status)
    {
        var asset = new Asset
        {
            AssetCode = $"LAP-26-TST-{Random.Shared.Next(10000, 99999)}",
            AssetName = "Test Laptop",
            Category = "Computing",
            AssetTypeId = type.Id,
            Status = status,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        ctx.Assets.Add(asset);
        ctx.SaveChanges();
        return asset;
    }

    private static Employee SeedEmployee(ApplicationDbContext ctx)
    {
        var emp = new Employee
        {
            EntraId = Guid.NewGuid().ToString(),
            UserPrincipalName = "jan.janssen@example.com",
            DisplayName = "Jan Janssen",
            Email = "jan.janssen@example.com",
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };
        ctx.Employees.Add(emp);
        ctx.SaveChanges();
        return emp;
    }

    [Fact]
    public async Task Transition_To_Completed_OnboardsAsset()
    {
        await using var ctx = NewContext();
        var type = SeedAssetType(ctx);
        var asset = SeedAsset(ctx, type, AssetStatus.Nieuw);
        var employee = SeedEmployee(ctx);

        var request = new AssetRequest
        {
            RequestType = AssetRequestType.Onboarding,
            Status = AssetRequestStatus.InProgress,
            RequestedFor = employee.UserPrincipalName,
            EmployeeId = employee.Id,
            RequestedDate = DateTime.UtcNow.Date,
            CreatedBy = "tester",
            CreatedAt = DateTime.UtcNow,
            Lines = new List<AssetRequestLine>
            {
                new()
                {
                    AssetTypeId = type.Id,
                    SourceType = AssetLineSourceType.ExistingInventory,
                    AssetId = asset.Id,
                    Status = AssetRequestLineStatus.Reserved,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                }
            }
        };
        ctx.AssetRequests.Add(request);
        await ctx.SaveChangesAsync();

        var service = new AssetRequestCompletionService(ctx, NullLogger<AssetRequestCompletionService>.Instance);

        var result = await service.TransitionAsync(request.Id, AssetRequestStatus.Completed, "tester", "tester@x");

        var reloaded = await ctx.Assets.Include(a => a.Events).FirstAsync(a => a.Id == asset.Id);
        Assert.Equal(AssetStatus.InGebruik, reloaded.Status);
        Assert.Equal(employee.Id, reloaded.EmployeeId);
        Assert.Equal(employee.DisplayName, reloaded.Owner);
        Assert.NotNull(reloaded.InstallationDate);
        Assert.Single(reloaded.Events);
        Assert.Equal(AssetEventType.DeviceOnboarded, reloaded.Events.Single().EventType);

        var reloadedRequest = await ctx.AssetRequests.Include(r => r.Lines).FirstAsync(r => r.Id == request.Id);
        Assert.Equal(AssetRequestStatus.Completed, reloadedRequest.Status);
        Assert.NotNull(reloadedRequest.CompletedAt);
        Assert.All(reloadedRequest.Lines, l => Assert.Equal(AssetRequestLineStatus.Completed, l.Status));
        Assert.Single(result.AffectedAssetIds);
    }
}

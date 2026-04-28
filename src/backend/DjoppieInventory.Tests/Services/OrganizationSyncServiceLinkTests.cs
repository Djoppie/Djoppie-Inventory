using DjoppieInventory.Core.Entities;
using DjoppieInventory.Core.Interfaces;
using DjoppieInventory.Infrastructure.Data;
using DjoppieInventory.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using Xunit;

namespace DjoppieInventory.Tests.Services;

public class OrganizationSyncServiceLinkTests
{
    private static ApplicationDbContext NewContext()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .ConfigureWarnings(w => w.Ignore(InMemoryEventId.TransactionIgnoredWarning))
            .Options;
        return new ApplicationDbContext(options);
    }

    private static Employee Emp(string upn, string displayName, string? email = null) => new()
    {
        EntraId = Guid.NewGuid().ToString(),
        UserPrincipalName = upn,
        DisplayName = displayName,
        Email = email ?? upn,
        IsActive = true,
        CreatedAt = DateTime.UtcNow
    };

    private static AssetRequest Req(string requestedFor) => new()
    {
        RequestType = AssetRequestType.Onboarding,
        Status = AssetRequestStatus.Pending,
        RequestedFor = requestedFor,
        RequestedDate = DateTime.UtcNow,
        CreatedBy = "tester",
        CreatedAt = DateTime.UtcNow
    };

    private static OrganizationSyncService NewService(ApplicationDbContext ctx)
    {
        var graph = new Mock<IGraphUserService>(MockBehavior.Strict);
        return new OrganizationSyncService(ctx, graph.Object, NullLogger<OrganizationSyncService>.Instance);
    }

    [Fact]
    public async Task LinkPending_MatchesByUpn()
    {
        await using var ctx = NewContext();
        ctx.Employees.Add(Emp("jan.janssen@example.com", "Jan Janssen"));
        ctx.AssetRequests.Add(Req("jan.janssen@example.com"));
        await ctx.SaveChangesAsync();

        var service = NewService(ctx);
        var linked = await service.LinkPendingAssetRequestsAsync();

        Assert.Equal(1, linked);
        var req = await ctx.AssetRequests.SingleAsync();
        Assert.NotNull(req.EmployeeId);
    }

    [Fact]
    public async Task LinkPending_MatchesByDisplayName_CaseInsensitive()
    {
        await using var ctx = NewContext();
        ctx.Employees.Add(Emp("a@x.com", "Marie Dubois"));
        ctx.AssetRequests.Add(Req("marie dubois"));
        await ctx.SaveChangesAsync();

        var service = NewService(ctx);
        var linked = await service.LinkPendingAssetRequestsAsync();

        Assert.Equal(1, linked);
    }

    [Fact]
    public async Task LinkPending_DoesNotLink_WhenAmbiguous()
    {
        await using var ctx = NewContext();
        ctx.Employees.AddRange(
            Emp("jan@x.com", "Jan Janssen"),
            Emp("jan2@x.com", "Jan Janssen"));
        ctx.AssetRequests.Add(Req("Jan Janssen"));
        await ctx.SaveChangesAsync();

        var service = NewService(ctx);
        var linked = await service.LinkPendingAssetRequestsAsync();

        Assert.Equal(0, linked);
        var req = await ctx.AssetRequests.SingleAsync();
        Assert.Null(req.EmployeeId);
    }

    [Fact]
    public async Task LinkPending_SkipsCancelledRequests()
    {
        await using var ctx = NewContext();
        ctx.Employees.Add(Emp("a@x.com", "A B"));
        var req = Req("A B");
        req.Status = AssetRequestStatus.Cancelled;
        ctx.AssetRequests.Add(req);
        await ctx.SaveChangesAsync();

        var service = NewService(ctx);
        var linked = await service.LinkPendingAssetRequestsAsync();

        Assert.Equal(0, linked);
    }
}

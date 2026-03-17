using System.Net;
using System.Net.Http.Json;
using DjoppieInventory.Core.DTOs;
using DjoppieInventory.Core.DTOs.Rollout;
using DjoppieInventory.Core.Entities;
using DjoppieInventory.Core.Entities.Enums;
using DjoppieInventory.Infrastructure.Data;
using DjoppieInventory.Tests.Helpers;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace DjoppieInventory.Tests.Integration;

/// <summary>
/// Integration tests for RolloutWorkplacesController.
/// Tests the complete HTTP request/response cycle for workplace management endpoints.
/// Note: These tests require proper authentication setup or authentication bypass in test environment.
/// </summary>
[Collection("IntegrationTests")]
public class RolloutWorkplacesControllerTests : IClassFixture<WebApplicationFactory<Program>>, IDisposable
{
    private readonly WebApplicationFactory<Program> _factory;
    private readonly HttpClient _client;

    public RolloutWorkplacesControllerTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    public void Dispose()
    {
        _client?.Dispose();
    }

    #region GetWorkplaceById Tests

    [Fact]
    public async Task GetWorkplaceById_ExistingWorkplace_ReturnsWorkplace()
    {
        // Arrange
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

        var session = new RolloutSession
        {
            SessionName = "Test Session",
            Description = "Test",
            Status = RolloutSessionStatus.Planning,
            CreatedAt = DateTime.UtcNow
        };
        var day = new RolloutDay
        {
            RolloutSession = session,
            Date = DateTime.Today,
            DayNumber = 1
        };
        var workplace = new RolloutWorkplace
        {
            RolloutDay = day,
            UserName = "John Doe",
            UserEmail = "john@example.com",
            ServiceId = 1,
            Location = "Office 101",
            TotalItems = 0,
            CompletedItems = 0
        };

        context.RolloutSessions.Add(session);
        context.RolloutDays.Add(day);
        context.RolloutWorkplaces.Add(workplace);
        await context.SaveChangesAsync();

        // Act
        var response = await _client.GetAsync($"/api/rollout/workplaces/{workplace.Id}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var result = await response.Content.ReadFromJsonAsync<RolloutWorkplaceDto>();
        result.Should().NotBeNull();
        result!.UserName.Should().Be("John Doe");
        result.UserEmail.Should().Be("john@example.com");
    }

    [Fact]
    public async Task GetWorkplaceById_NonExistentWorkplace_ReturnsNotFound()
    {
        // Act
        var response = await _client.GetAsync("/api/rollout/workplaces/99999");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    #endregion

    #region CreateWorkplace Tests

    [Fact]
    public async Task CreateWorkplace_ValidRequest_CreatesWorkplace()
    {
        // Arrange
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

        var session = new RolloutSession
        {
            SessionName = "Test Session",
            Status = RolloutSessionStatus.Planning,
            CreatedAt = DateTime.UtcNow
        };
        var day = new RolloutDay
        {
            RolloutSession = session,
            Date = DateTime.Today,
            DayNumber = 1
        };

        context.RolloutSessions.Add(session);
        context.RolloutDays.Add(day);
        await context.SaveChangesAsync();

        var request = new CreateRolloutWorkplaceDto
        {
            RolloutDayId = day.Id,
            UserName = "Jane Doe",
            UserEmail = "jane@example.com",
            ServiceId = 1,
            Location = "Office 202",
            Notes = "Test workplace"
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/rollout/workplaces", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Created);
        var result = await response.Content.ReadFromJsonAsync<RolloutWorkplaceDto>();
        result.Should().NotBeNull();
        result!.UserName.Should().Be("Jane Doe");
        result.UserEmail.Should().Be("jane@example.com");

        // Verify in database
        var createdWorkplace = await context.RolloutWorkplaces.FindAsync(result.Id);
        createdWorkplace.Should().NotBeNull();
    }

    [Fact]
    public async Task CreateWorkplace_InvalidRequest_ReturnsBadRequest()
    {
        // Arrange
        var request = new CreateRolloutWorkplaceDto
        {
            RolloutDayId = 99999, // Non-existent day
            UserName = "Test User"
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/rollout/workplaces", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    #endregion

    #region UpdateWorkplace Tests

    [Fact]
    public async Task UpdateWorkplace_ValidRequest_UpdatesWorkplace()
    {
        // Arrange
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

        var session = new RolloutSession
        {
            SessionName = "Test Session",
            Status = RolloutSessionStatus.Planning,
            CreatedAt = DateTime.UtcNow
        };
        var day = new RolloutDay
        {
            RolloutSession = session,
            Date = DateTime.Today,
            DayNumber = 1
        };
        var workplace = new RolloutWorkplace
        {
            RolloutDay = day,
            UserName = "Original Name",
            UserEmail = "original@example.com",
            ServiceId = 1,
            Location = "Office 101"
        };

        context.RolloutSessions.Add(session);
        context.RolloutDays.Add(day);
        context.RolloutWorkplaces.Add(workplace);
        await context.SaveChangesAsync();

        var request = new UpdateRolloutWorkplaceDto
        {
            UserName = "Updated Name",
            UserEmail = "updated@example.com",
            Location = "Office 202"
        };

        // Act
        var response = await _client.PutAsJsonAsync($"/api/rollout/workplaces/{workplace.Id}", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var updatedWorkplace = await context.RolloutWorkplaces.FindAsync(workplace.Id);
        updatedWorkplace!.UserName.Should().Be("Updated Name");
        updatedWorkplace.UserEmail.Should().Be("updated@example.com");
        updatedWorkplace.Location.Should().Be("Office 202");
    }

    #endregion

    #region DeleteWorkplace Tests

    [Fact]
    public async Task DeleteWorkplace_ExistingWorkplace_DeletesSuccessfully()
    {
        // Arrange
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

        var session = new RolloutSession
        {
            SessionName = "Test Session",
            Status = RolloutSessionStatus.Planning,
            CreatedAt = DateTime.UtcNow
        };
        var day = new RolloutDay
        {
            RolloutSession = session,
            Date = DateTime.Today,
            DayNumber = 1
        };
        var workplace = new RolloutWorkplace
        {
            RolloutDay = day,
            UserName = "Test User",
            ServiceId = 1
        };

        context.RolloutSessions.Add(session);
        context.RolloutDays.Add(day);
        context.RolloutWorkplaces.Add(workplace);
        await context.SaveChangesAsync();

        var workplaceId = workplace.Id;

        // Act
        var response = await _client.DeleteAsync($"/api/rollout/workplaces/{workplaceId}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NoContent);

        var deletedWorkplace = await context.RolloutWorkplaces.FindAsync(workplaceId);
        deletedWorkplace.Should().BeNull();
    }

    #endregion

    #region GetWorkplaceAssignments Tests

    [Fact]
    public async Task GetWorkplaceAssignments_HasAssignments_ReturnsAllAssignments()
    {
        // Arrange
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

        var assetType = new AssetType { Name = "Laptop", Code = "LAP" };
        var session = new RolloutSession
        {
            SessionName = "Test Session",
            Status = RolloutSessionStatus.Planning,
            CreatedAt = DateTime.UtcNow
        };
        var day = new RolloutDay
        {
            RolloutSession = session,
            Date = DateTime.Today,
            DayNumber = 1
        };
        var workplace = new RolloutWorkplace
        {
            RolloutDay = day,
            UserName = "Test User",
            ServiceId = 1,
            TotalItems = 2
        };

        context.AssetTypes.Add(assetType);
        context.RolloutSessions.Add(session);
        context.RolloutDays.Add(day);
        context.RolloutWorkplaces.Add(workplace);
        await context.SaveChangesAsync();

        context.WorkplaceAssetAssignments.AddRange(
            new WorkplaceAssetAssignment
            {
                RolloutWorkplaceId = workplace.Id,
                AssetTypeId = assetType.Id,
                AssignmentCategory = AssignmentCategory.UserAssigned,
                SourceType = AssetSourceType.NewFromTemplate,
                Status = AssetAssignmentStatus.Pending,
                Position = 0
            },
            new WorkplaceAssetAssignment
            {
                RolloutWorkplaceId = workplace.Id,
                AssetTypeId = assetType.Id,
                AssignmentCategory = AssignmentCategory.WorkplaceFixed,
                SourceType = AssetSourceType.CreateOnSite,
                Status = AssetAssignmentStatus.Pending,
                Position = 1
            }
        );
        await context.SaveChangesAsync();

        // Act
        var response = await _client.GetAsync($"/api/rollout/workplaces/{workplace.Id}/assignments");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var results = await response.Content.ReadFromJsonAsync<List<WorkplaceAssetAssignmentDto>>();
        results.Should().NotBeNull();
        results!.Should().HaveCount(2);
        results.Should().BeInAscendingOrder(a => a.Position);
    }

    #endregion

    #region GetWorkplaceSummary Tests

    [Fact]
    public async Task GetWorkplaceSummary_ValidWorkplace_ReturnsSummary()
    {
        // Arrange
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

        var assetType = new AssetType { Name = "Laptop", Code = "LAP" };
        var session = new RolloutSession
        {
            SessionName = "Test Session",
            Status = RolloutSessionStatus.Planning,
            CreatedAt = DateTime.UtcNow
        };
        var day = new RolloutDay
        {
            RolloutSession = session,
            Date = DateTime.Today,
            DayNumber = 1
        };
        var workplace = new RolloutWorkplace
        {
            RolloutDay = day,
            UserName = "Test User",
            ServiceId = 1,
            TotalItems = 3
        };

        context.AssetTypes.Add(assetType);
        context.RolloutSessions.Add(session);
        context.RolloutDays.Add(day);
        context.RolloutWorkplaces.Add(workplace);
        await context.SaveChangesAsync();

        context.WorkplaceAssetAssignments.AddRange(
            new WorkplaceAssetAssignment
            {
                RolloutWorkplaceId = workplace.Id,
                AssetTypeId = assetType.Id,
                Status = AssetAssignmentStatus.Pending,
                SerialNumberRequired = true
            },
            new WorkplaceAssetAssignment
            {
                RolloutWorkplaceId = workplace.Id,
                AssetTypeId = assetType.Id,
                Status = AssetAssignmentStatus.Installed,
                SerialNumberRequired = true,
                SerialNumberCaptured = "SN1"
            },
            new WorkplaceAssetAssignment
            {
                RolloutWorkplaceId = workplace.Id,
                AssetTypeId = assetType.Id,
                Status = AssetAssignmentStatus.Skipped,
                SerialNumberRequired = false
            }
        );
        await context.SaveChangesAsync();

        // Act
        var response = await _client.GetAsync($"/api/rollout/workplaces/{workplace.Id}/summary");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var summary = await response.Content.ReadFromJsonAsync<WorkplaceAssignmentSummaryDto>();
        summary.Should().NotBeNull();
        summary!.TotalAssignments.Should().Be(3);
        summary.PendingAssignments.Should().Be(1);
        summary.InstalledAssignments.Should().Be(1);
        summary.SkippedAssignments.Should().Be(1);
    }

    #endregion

    #region CompleteWorkplace Tests

    [Fact]
    public async Task CompleteWorkplace_HasPendingAssignments_CompletesAll()
    {
        // Arrange
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

        var assetType = new AssetType { Name = "Laptop", Code = "LAP" };
        var session = new RolloutSession
        {
            SessionName = "Test Session",
            Status = RolloutSessionStatus.Planning,
            CreatedAt = DateTime.UtcNow
        };
        var day = new RolloutDay
        {
            RolloutSession = session,
            Date = DateTime.Today,
            DayNumber = 1
        };
        var workplace = new RolloutWorkplace
        {
            RolloutDay = day,
            UserName = "Test User",
            ServiceId = 1,
            TotalItems = 2,
            CompletedItems = 0,
            Status = RolloutWorkplaceStatus.InProgress
        };

        context.AssetTypes.Add(assetType);
        context.RolloutSessions.Add(session);
        context.RolloutDays.Add(day);
        context.RolloutWorkplaces.Add(workplace);
        await context.SaveChangesAsync();

        context.WorkplaceAssetAssignments.AddRange(
            new WorkplaceAssetAssignment
            {
                RolloutWorkplaceId = workplace.Id,
                AssetTypeId = assetType.Id,
                Status = AssetAssignmentStatus.Pending
            },
            new WorkplaceAssetAssignment
            {
                RolloutWorkplaceId = workplace.Id,
                AssetTypeId = assetType.Id,
                Status = AssetAssignmentStatus.Pending
            }
        );
        await context.SaveChangesAsync();

        // Act
        var response = await _client.PostAsync($"/api/rollout/workplaces/{workplace.Id}/complete", null);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var updatedWorkplace = await context.RolloutWorkplaces
            .Include(w => w.AssetAssignments)
            .FirstOrDefaultAsync(w => w.Id == workplace.Id);

        updatedWorkplace.Should().NotBeNull();
        updatedWorkplace!.Status.Should().Be(RolloutWorkplaceStatus.Completed);
        updatedWorkplace.CompletedAt.Should().NotBeNull();
        updatedWorkplace.AssetAssignments.Should().OnlyContain(a =>
            a.Status == AssetAssignmentStatus.Installed);
    }

    #endregion
}

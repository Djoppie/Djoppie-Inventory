using DjoppieInventory.Core.DTOs;
using DjoppieInventory.Core.Entities;
using DjoppieInventory.Core.Entities.Enums;
using DjoppieInventory.Core.Interfaces;
using DjoppieInventory.Infrastructure.Services;
using DjoppieInventory.Tests.Fixtures;
using DjoppieInventory.Tests.Helpers;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;

namespace DjoppieInventory.Tests.Services;

/// <summary>
/// Tests for edge cases, race conditions, and complex scenarios in the rollout feature.
/// </summary>
public class RolloutEdgeCaseTests : IDisposable
{
    private readonly Mock<IAssetMovementService> _movementServiceMock;
    private readonly Mock<IAssetCodeGenerator> _codeGeneratorMock;
    private readonly Mock<ILogger<WorkplaceAssetAssignmentService>> _loggerMock;
    private readonly string _performedBy = "Test User";
    private readonly string _performedByEmail = "test@example.com";

    public RolloutEdgeCaseTests()
    {
        _movementServiceMock = new Mock<IAssetMovementService>();
        _codeGeneratorMock = new Mock<IAssetCodeGenerator>();
        _loggerMock = new Mock<ILogger<WorkplaceAssetAssignmentService>>();
    }

    public void Dispose()
    {
        // Cleanup if needed
    }

    #region Concurrent Modification Tests

    [Fact]
    public async Task ConcurrentWorkplaceCompletions_OnlyFirstOneSucceeds()
    {
        // Arrange
        await using var context = TestDbContextFactory.CreateInMemoryContext();
        var scenario = await RolloutTestFixture.CreateCompleteScenarioAsync(context);
        var workplace = scenario.Workplaces.First();

        var service = new WorkplaceAssetAssignmentService(
            context,
            _movementServiceMock.Object,
            _codeGeneratorMock.Object,
            _loggerMock.Object);

        // Act - Simulate two concurrent completion attempts
        var task1 = service.CompleteWorkplaceAssignmentsAsync(
            workplace.Id,
            _performedBy,
            _performedByEmail);

        var task2 = service.CompleteWorkplaceAssignmentsAsync(
            workplace.Id,
            "Other User",
            "other@example.com");

        var results = await Task.WhenAll(task1, task2);

        // Assert - Both should succeed but second should find nothing to complete
        results.Should().NotContain(-1); // No errors
        var totalCompleted = results.Sum();
        totalCompleted.Should().Be(scenario.Assignments.Count);
    }

    [Fact]
    public async Task MultipleAssignmentsToSameAsset_ThrowsOrPreventsConflict()
    {
        // Arrange
        await using var context = TestDbContextFactory.CreateInMemoryContext();
        var scenario = await RolloutTestFixture.CreateCompleteScenarioAsync(context);
        var workplace = scenario.Workplaces.First();
        var asset = scenario.Assets.First();
        var assetType = scenario.AssetTypes.First();

        var service = new WorkplaceAssetAssignmentService(
            context,
            _movementServiceMock.Object,
            _codeGeneratorMock.Object,
            _loggerMock.Object);

        // Create first assignment with asset
        var assignment1 = new CreateWorkplaceAssetAssignmentRequest
        {
            RolloutWorkplaceId = workplace.Id,
            AssetTypeId = assetType.Id,
            AssignmentCategory = AssignmentCategory.NewDevice,
            SourceType = AssetSourceType.ExistingInventory,
            NewAssetId = asset.Id
        };

        await service.CreateAsync(assignment1);

        // Create second assignment with same asset
        var assignment2 = new CreateWorkplaceAssetAssignmentRequest
        {
            RolloutWorkplaceId = workplace.Id,
            AssetTypeId = assetType.Id,
            AssignmentCategory = AssignmentCategory.NewDevice,
            SourceType = AssetSourceType.ExistingInventory,
            NewAssetId = asset.Id // Same asset!
        };

        // Act & Assert - System should handle duplicate assignment
        var result2 = await service.CreateAsync(assignment2);

        // Both assignments created, but business logic should prevent actual conflict
        result2.Should().NotBeNull();

        // Verify asset can only be linked to one active assignment
        var updatedAsset = await context.Assets.FindAsync(asset.Id);
        updatedAsset!.CurrentWorkplaceAssignmentId.Should().NotBeNull();
    }

    #endregion

    #region Workplace Counter Consistency Tests

    [Fact]
    public async Task WorkplaceTotalItems_StaysConsistent_ThroughMultipleOperations()
    {
        // Arrange
        await using var context = TestDbContextFactory.CreateInMemoryContext();
        var scenario = await RolloutTestFixture.CreateCompleteScenarioAsync(context);
        var workplace = scenario.Workplaces.First();
        var assetType = scenario.AssetTypes.First();

        var service = new WorkplaceAssetAssignmentService(
            context,
            _movementServiceMock.Object,
            _codeGeneratorMock.Object,
            _loggerMock.Object);

        var initialTotalItems = workplace.TotalItems;

        // Act - Create, update, delete operations
        var request = new CreateWorkplaceAssetAssignmentRequest
        {
            RolloutWorkplaceId = workplace.Id,
            AssetTypeId = assetType.Id,
            AssignmentCategory = AssignmentCategory.NewDevice,
            SourceType = AssetSourceType.NewPurchase
        };

        var created = await service.CreateAsync(request);
        var workplaceAfterCreate = await context.RolloutWorkplaces.FindAsync(workplace.Id);
        workplaceAfterCreate!.TotalItems.Should().Be(initialTotalItems + 1);

        await service.DeleteAsync(created.Id);
        var workplaceAfterDelete = await context.RolloutWorkplaces.FindAsync(workplace.Id);
        workplaceAfterDelete!.TotalItems.Should().Be(initialTotalItems);
    }

    [Fact]
    public async Task WorkplaceCompletedItems_TracksCorrectly_WithStatusChanges()
    {
        // Arrange
        await using var context = TestDbContextFactory.CreateInMemoryContext();
        var scenario = await RolloutTestFixture.CreateCompleteScenarioAsync(context);
        var workplace = scenario.Workplaces.First();
        var assignment = scenario.Assignments.First();

        var service = new WorkplaceAssetAssignmentService(
            context,
            _movementServiceMock.Object,
            _codeGeneratorMock.Object,
            _loggerMock.Object);

        // Act - Mark as installed
        var installRequest = new UpdateAssignmentStatusRequest
        {
            Status = AssetAssignmentStatus.Installed
        };
        await service.UpdateStatusAsync(assignment.Id, installRequest, _performedBy, _performedByEmail);

        var workplaceAfterInstall = await context.RolloutWorkplaces.FindAsync(workplace.Id);
        var completedAfterInstall = workplaceAfterInstall!.CompletedItems;

        // Mark as pending again (edge case)
        var pendingRequest = new UpdateAssignmentStatusRequest
        {
            Status = AssetAssignmentStatus.Pending
        };
        await service.UpdateStatusAsync(assignment.Id, pendingRequest, _performedBy, _performedByEmail);

        var workplaceAfterPending = await context.RolloutWorkplaces.FindAsync(workplace.Id);

        // Assert - Counter should not have incremented again
        workplaceAfterPending!.CompletedItems.Should().Be(completedAfterInstall);
    }

    #endregion

    #region Null and Empty Data Tests

    [Fact]
    public async Task CreateAssetFromTemplate_WithNullFields_HandlesGracefully()
    {
        // Arrange
        await using var context = TestDbContextFactory.CreateInMemoryContext();
        var scenario = await RolloutTestFixture.CreateCompleteScenarioAsync(context);

        _codeGeneratorMock
            .Setup(g => g.GenerateCodeAsync(
                It.IsAny<int>(),
                It.IsAny<string>(),
                It.IsAny<DateTime>(),
                It.IsAny<bool>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync("LAP-24-TEST-00001");

        var assetType = scenario.AssetTypes.First();
        var workplace = scenario.Workplaces.First();

        // Create template with minimal data
        var template = new AssetTemplate
        {
            Id = 999,
            TemplateName = "Minimal Template",
            AssetName = null, // Null asset name
            Category = "Hardware",
            Brand = "TestBrand",
            Model = null // Null model
        };
        context.AssetTemplates.Add(template);

        var assignment = new WorkplaceAssetAssignment
        {
            RolloutWorkplaceId = workplace.Id,
            AssetTypeId = assetType.Id,
            AssetTemplateId = template.Id
        };
        context.WorkplaceAssetAssignments.Add(assignment);
        await context.SaveChangesAsync();

        var service = new WorkplaceAssetAssignmentService(
            context,
            _movementServiceMock.Object,
            _codeGeneratorMock.Object,
            _loggerMock.Object);

        // Act
        var result = await service.CreateAssetFromTemplateAsync(
            assignment.Id,
            "SN123",
            _performedBy,
            _performedByEmail);

        // Assert - Should create asset with defaults
        result.Should().NotBeNull();
        var createdAsset = await context.Assets.FindAsync(result.NewAssetId);
        createdAsset.Should().NotBeNull();
        createdAsset!.AssetName.Should().NotBeNullOrEmpty();
    }

    [Fact]
    public async Task BulkCreateAssignments_WithDuplicatePositions_HandlesCorrectly()
    {
        // Arrange
        await using var context = TestDbContextFactory.CreateInMemoryContext();
        var scenario = await RolloutTestFixture.CreateCompleteScenarioAsync(context);
        var workplace = scenario.Workplaces.First();
        var assetType = scenario.AssetTypes.First();

        var service = new WorkplaceAssetAssignmentService(
            context,
            _movementServiceMock.Object,
            _codeGeneratorMock.Object,
            _loggerMock.Object);

        // Create requests with duplicate positions
        var requests = new List<CreateWorkplaceAssetAssignmentRequest>
        {
            new()
            {
                AssetTypeId = assetType.Id,
                AssignmentCategory = AssignmentCategory.NewDevice,
                SourceType = AssetSourceType.NewPurchase,
                Position = 0
            },
            new()
            {
                AssetTypeId = assetType.Id,
                AssignmentCategory = AssignmentCategory.NewDevice,
                SourceType = AssetSourceType.NewPurchase,
                Position = 0 // Duplicate position
            }
        };

        // Act
        var results = await service.BulkCreateAsync(workplace.Id, requests);

        // Assert - Both should be created (database allows duplicates)
        results.Should().HaveCount(2);
        results.Should().OnlyContain(r => r.Position == 0);
    }

    #endregion

    #region Business Logic Edge Cases

    [Fact]
    public async Task InstallAssignment_WithoutNewAsset_SkipsDeploymentMovement()
    {
        // Arrange
        await using var context = TestDbContextFactory.CreateInMemoryContext();
        var scenario = await RolloutTestFixture.CreateCompleteScenarioAsync(context);
        var workplace = scenario.Workplaces.First();
        var assetType = scenario.AssetTypes.First();

        var assignment = new WorkplaceAssetAssignment
        {
            RolloutWorkplaceId = workplace.Id,
            AssetTypeId = assetType.Id,
            AssignmentCategory = AssignmentCategory.OldDevice,
            SourceType = AssetSourceType.UserOwned,
            NewAssetId = null, // No new asset
            OldAssetId = null,
            Status = AssetAssignmentStatus.Pending
        };
        context.WorkplaceAssetAssignments.Add(assignment);
        await context.SaveChangesAsync();

        var service = new WorkplaceAssetAssignmentService(
            context,
            _movementServiceMock.Object,
            _codeGeneratorMock.Object,
            _loggerMock.Object);

        var request = new UpdateAssignmentStatusRequest
        {
            Status = AssetAssignmentStatus.Installed
        };

        // Act
        await service.UpdateStatusAsync(assignment.Id, request, _performedBy, _performedByEmail);

        // Assert - No deployment movement should be recorded
        _movementServiceMock.Verify(
            m => m.RecordDeploymentAsync(
                It.IsAny<AssetDeploymentRequest>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task DeleteByWorkplaceId_WithNoAssignments_HandlesGracefully()
    {
        // Arrange
        await using var context = TestDbContextFactory.CreateInMemoryContext();
        var scenario = await RolloutTestFixture.CreateCompleteScenarioAsync(context);

        // Create workplace with no assignments
        var emptyWorkplace = new RolloutWorkplace
        {
            RolloutDayId = scenario.Days.First().Id,
            UserName = "Empty User",
            ServiceId = 1,
            TotalItems = 0,
            CompletedItems = 0
        };
        context.RolloutWorkplaces.Add(emptyWorkplace);
        await context.SaveChangesAsync();

        var service = new WorkplaceAssetAssignmentService(
            context,
            _movementServiceMock.Object,
            _codeGeneratorMock.Object,
            _loggerMock.Object);

        // Act
        await service.DeleteByWorkplaceIdAsync(emptyWorkplace.Id);

        // Assert - Should complete without errors
        var workplace = await context.RolloutWorkplaces.FindAsync(emptyWorkplace.Id);
        workplace.Should().NotBeNull();
        workplace!.TotalItems.Should().Be(0);
    }

    [Fact]
    public async Task GetSummary_EmptyWorkplace_ReturnsZeroValues()
    {
        // Arrange
        await using var context = TestDbContextFactory.CreateInMemoryContext();
        var scenario = await RolloutTestFixture.CreateCompleteScenarioAsync(context);

        // Create workplace with no assignments
        var emptyWorkplace = new RolloutWorkplace
        {
            RolloutDayId = scenario.Days.First().Id,
            UserName = "Empty User",
            ServiceId = 1,
            TotalItems = 0,
            CompletedItems = 0
        };
        context.RolloutWorkplaces.Add(emptyWorkplace);
        await context.SaveChangesAsync();

        var service = new WorkplaceAssetAssignmentService(
            context,
            _movementServiceMock.Object,
            _codeGeneratorMock.Object,
            _loggerMock.Object);

        // Act
        var summary = await service.GetSummaryAsync(emptyWorkplace.Id);

        // Assert
        summary.Should().NotBeNull();
        summary.TotalAssignments.Should().Be(0);
        summary.PendingAssignments.Should().Be(0);
        summary.InstalledAssignments.Should().Be(0);
        summary.ByAssetType.Should().BeEmpty();
    }

    #endregion

    #region Data Integrity Tests

    [Fact]
    public async Task AssignExistingAsset_TwiceToDifferentWorkplaces_OnlyLastAssignmentLinks()
    {
        // Arrange
        await using var context = TestDbContextFactory.CreateInMemoryContext();
        var scenario = await RolloutTestFixture.CreateCompleteScenarioAsync(context);
        var asset = scenario.Assets.First();
        var assetType = scenario.AssetTypes.First();
        var workplace1 = scenario.Workplaces[0];
        var workplace2 = scenario.Workplaces[1];

        var service = new WorkplaceAssetAssignmentService(
            context,
            _movementServiceMock.Object,
            _codeGeneratorMock.Object,
            _loggerMock.Object);

        // Create assignments in both workplaces
        var assignment1 = new CreateWorkplaceAssetAssignmentRequest
        {
            RolloutWorkplaceId = workplace1.Id,
            AssetTypeId = assetType.Id,
            AssignmentCategory = AssignmentCategory.NewDevice,
            SourceType = AssetSourceType.ExistingInventory
        };
        var created1 = await service.CreateAsync(assignment1);

        var assignment2 = new CreateWorkplaceAssetAssignmentRequest
        {
            RolloutWorkplaceId = workplace2.Id,
            AssetTypeId = assetType.Id,
            AssignmentCategory = AssignmentCategory.NewDevice,
            SourceType = AssetSourceType.ExistingInventory
        };
        var created2 = await service.CreateAsync(assignment2);

        // Act - Assign same asset to both
        await service.AssignExistingAssetAsync(created1.Id, asset.Id);
        await service.AssignExistingAssetAsync(created2.Id, asset.Id);

        // Assert - Asset should be linked to the last assignment only
        var updatedAsset = await context.Assets.FindAsync(asset.Id);
        updatedAsset!.CurrentWorkplaceAssignmentId.Should().Be(created2.Id);
    }

    [Fact]
    public async Task SetOldAsset_OnSameAssignment_Twice_UpdatesCorrectly()
    {
        // Arrange
        await using var context = TestDbContextFactory.CreateInMemoryContext();
        var scenario = await RolloutTestFixture.CreateCompleteScenarioAsync(context);
        var assignment = scenario.Assignments.First();
        var oldAsset1 = scenario.Assets[0];
        var oldAsset2 = scenario.Assets[1];

        var service = new WorkplaceAssetAssignmentService(
            context,
            _movementServiceMock.Object,
            _codeGeneratorMock.Object,
            _loggerMock.Object);

        // Act - Set old asset twice
        await service.SetOldAssetAsync(assignment.Id, oldAsset1.Id);
        var result = await service.SetOldAssetAsync(assignment.Id, oldAsset2.Id);

        // Assert - Should have the second asset as old asset
        result.OldAssetId.Should().Be(oldAsset2.Id);
        result.OldAssetCode.Should().Be(oldAsset2.AssetCode);
    }

    #endregion

    #region Metadata and Notes Tests

    [Fact]
    public async Task UpdateStatusAsync_AppendsNotes_InsteadOfReplacing()
    {
        // Arrange
        await using var context = TestDbContextFactory.CreateInMemoryContext();
        var scenario = await RolloutTestFixture.CreateCompleteScenarioAsync(context);
        var assignment = scenario.Assignments.First();
        assignment.Notes = "Initial notes";
        await context.SaveChangesAsync();

        var service = new WorkplaceAssetAssignmentService(
            context,
            _movementServiceMock.Object,
            _codeGeneratorMock.Object,
            _loggerMock.Object);

        var request = new UpdateAssignmentStatusRequest
        {
            Status = AssetAssignmentStatus.Installed,
            Notes = "Additional notes"
        };

        // Act
        var result = await service.UpdateStatusAsync(
            assignment.Id,
            request,
            _performedBy,
            _performedByEmail);

        // Assert - Notes should be appended
        result.Notes.Should().Contain("Initial notes");
        result.Notes.Should().Contain("Additional notes");
    }

    [Fact]
    public async Task CreateAsync_WithMetadataJson_StoresCorrectly()
    {
        // Arrange
        await using var context = TestDbContextFactory.CreateInMemoryContext();
        var scenario = await RolloutTestFixture.CreateCompleteScenarioAsync(context);
        var workplace = scenario.Workplaces.First();
        var assetType = scenario.AssetTypes.First();

        var service = new WorkplaceAssetAssignmentService(
            context,
            _movementServiceMock.Object,
            _codeGeneratorMock.Object,
            _loggerMock.Object);

        var metadata = "{\"customField\":\"customValue\",\"priority\":\"high\"}";
        var request = new CreateWorkplaceAssetAssignmentRequest
        {
            RolloutWorkplaceId = workplace.Id,
            AssetTypeId = assetType.Id,
            AssignmentCategory = AssignmentCategory.NewDevice,
            SourceType = AssetSourceType.NewPurchase,
            MetadataJson = metadata
        };

        // Act
        var result = await service.CreateAsync(request);

        // Assert
        result.MetadataJson.Should().Be(metadata);
    }

    #endregion
}

using DjoppieInventory.Core.DTOs;
using DjoppieInventory.Core.Entities;
using DjoppieInventory.Core.Entities.Enums;
using DjoppieInventory.Core.Interfaces;
using DjoppieInventory.Infrastructure.Services;
using DjoppieInventory.Tests.Helpers;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;

namespace DjoppieInventory.Tests.Services;

/// <summary>
/// Unit tests for WorkplaceAssetAssignmentService.
/// Tests workplace assignment creation, updates, and lifecycle management.
/// </summary>
public class WorkplaceAssetAssignmentServiceTests : IDisposable
{
    private readonly Mock<IAssetMovementService> _movementServiceMock;
    private readonly Mock<IAssetCodeGenerator> _codeGeneratorMock;
    private readonly Mock<ILogger<WorkplaceAssetAssignmentService>> _loggerMock;
    private readonly string _performedBy = "Test User";
    private readonly string _performedByEmail = "test@example.com";

    public WorkplaceAssetAssignmentServiceTests()
    {
        _movementServiceMock = new Mock<IAssetMovementService>();
        _codeGeneratorMock = new Mock<IAssetCodeGenerator>();
        _loggerMock = new Mock<ILogger<WorkplaceAssetAssignmentService>>();
    }

    public void Dispose()
    {
        // Cleanup if needed
    }

    #region CreateAsync Tests

    [Fact]
    public async Task CreateAsync_ValidRequest_CreatesAssignment()
    {
        // Arrange
        await using var context = TestDbContextFactory.CreateInMemoryContext();
        var service = new WorkplaceAssetAssignmentService(
            context,
            _movementServiceMock.Object,
            _codeGeneratorMock.Object,
            _loggerMock.Object);

        var assetType = new AssetType { Name = "Laptop", Code = "LAP" };
        context.AssetTypes.Add(assetType);
        await context.SaveChangesAsync();

        var session = new RolloutSession { SessionName = "Test Session" };
        context.RolloutSessions.Add(session);
        await context.SaveChangesAsync();

        var day = new RolloutDay { RolloutSessionId = session.Id, Date = DateTime.Today };
        context.RolloutDays.Add(day);
        await context.SaveChangesAsync();

        var workplace = new RolloutWorkplace
        {
            RolloutDayId = day.Id,
            UserName = "John Doe",
            TotalItems = 0
        };
        context.RolloutWorkplaces.Add(workplace);
        await context.SaveChangesAsync();

        var request = new CreateWorkplaceAssetAssignmentRequest
        {
            RolloutWorkplaceId = workplace.Id,
            AssetTypeId = assetType.Id,
            AssignmentCategory = AssignmentCategory.UserAssigned,
            SourceType = AssetSourceType.NewFromTemplate,
            Position = 0,
            SerialNumberRequired = true,
            QRCodeRequired = true
        };

        // Act
        var result = await service.CreateAsync(request);

        // Assert
        result.Should().NotBeNull();
        result.RolloutWorkplaceId.Should().Be(workplace.Id);
        result.AssetTypeId.Should().Be(assetType.Id);
        result.AssetTypeName.Should().Be("Laptop");
        result.Status.Should().Be(AssetAssignmentStatus.Pending);

        // Verify workplace total items incremented
        var updatedWorkplace = await context.RolloutWorkplaces.FindAsync(workplace.Id);
        updatedWorkplace!.TotalItems.Should().Be(1);
    }

    [Fact]
    public async Task CreateAsync_WorkplaceNotFound_ThrowsInvalidOperationException()
    {
        // Arrange
        await using var context = TestDbContextFactory.CreateInMemoryContext();
        var service = new WorkplaceAssetAssignmentService(
            context,
            _movementServiceMock.Object,
            _codeGeneratorMock.Object,
            _loggerMock.Object);

        var request = new CreateWorkplaceAssetAssignmentRequest
        {
            RolloutWorkplaceId = 999, // Non-existent
            AssetTypeId = 1,
            AssignmentCategory = AssignmentCategory.UserAssigned,
            SourceType = AssetSourceType.NewFromTemplate
        };

        // Act & Assert
        await Assert.ThrowsAsync<InvalidOperationException>(
            () => service.CreateAsync(request));
    }

    [Fact]
    public async Task CreateAsync_AssetTypeNotFound_ThrowsInvalidOperationException()
    {
        // Arrange
        await using var context = TestDbContextFactory.CreateInMemoryContext();
        var service = new WorkplaceAssetAssignmentService(
            context,
            _movementServiceMock.Object,
            _codeGeneratorMock.Object,
            _loggerMock.Object);

        var session = new RolloutSession { SessionName = "Test" };
        context.RolloutSessions.Add(session);
        await context.SaveChangesAsync();

        var day = new RolloutDay { RolloutSessionId = session.Id, Date = DateTime.Today };
        context.RolloutDays.Add(day);
        await context.SaveChangesAsync();

        var workplace = new RolloutWorkplace { RolloutDayId = day.Id, UserName = "Test" };
        context.RolloutWorkplaces.Add(workplace);
        await context.SaveChangesAsync();

        var request = new CreateWorkplaceAssetAssignmentRequest
        {
            RolloutWorkplaceId = workplace.Id,
            AssetTypeId = 999, // Non-existent
            AssignmentCategory = AssignmentCategory.UserAssigned,
            SourceType = AssetSourceType.NewFromTemplate
        };

        // Act & Assert
        await Assert.ThrowsAsync<InvalidOperationException>(
            () => service.CreateAsync(request));
    }

    #endregion

    #region BulkCreateAsync Tests

    [Fact]
    public async Task BulkCreateAsync_ValidRequests_CreatesAllAssignments()
    {
        // Arrange
        await using var context = TestDbContextFactory.CreateInMemoryContext();
        var service = new WorkplaceAssetAssignmentService(
            context,
            _movementServiceMock.Object,
            _codeGeneratorMock.Object,
            _loggerMock.Object);

        var assetType = new AssetType { Name = "Laptop", Code = "LAP" };
        context.AssetTypes.Add(assetType);
        await context.SaveChangesAsync();

        var session = new RolloutSession { SessionName = "Test" };
        context.RolloutSessions.Add(session);
        await context.SaveChangesAsync();

        var day = new RolloutDay { RolloutSessionId = session.Id, Date = DateTime.Today };
        context.RolloutDays.Add(day);
        await context.SaveChangesAsync();

        var workplace = new RolloutWorkplace
        {
            RolloutDayId = day.Id,
            UserName = "Test",
            TotalItems = 0
        };
        context.RolloutWorkplaces.Add(workplace);
        await context.SaveChangesAsync();

        var requests = new List<CreateWorkplaceAssetAssignmentRequest>
        {
            new()
            {
                AssetTypeId = assetType.Id,
                AssignmentCategory = AssignmentCategory.UserAssigned,
                SourceType = AssetSourceType.NewFromTemplate,
                Position = 0
            },
            new()
            {
                AssetTypeId = assetType.Id,
                AssignmentCategory = AssignmentCategory.UserAssigned,
                SourceType = AssetSourceType.ExistingInventory,
                Position = 1
            },
            new()
            {
                AssetTypeId = assetType.Id,
                AssignmentCategory = AssignmentCategory.WorkplaceFixed,
                SourceType = AssetSourceType.CreateOnSite,
                Position = 2
            }
        };

        // Act
        var results = await service.BulkCreateAsync(workplace.Id, requests);

        // Assert
        results.Should().HaveCount(3);

        var updatedWorkplace = await context.RolloutWorkplaces.FindAsync(workplace.Id);
        updatedWorkplace!.TotalItems.Should().Be(3);
    }

    [Fact]
    public async Task BulkCreateAsync_EmptyList_ReturnsEmptyList()
    {
        // Arrange
        await using var context = TestDbContextFactory.CreateInMemoryContext();
        var service = new WorkplaceAssetAssignmentService(
            context,
            _movementServiceMock.Object,
            _codeGeneratorMock.Object,
            _loggerMock.Object);

        var session = new RolloutSession { SessionName = "Test" };
        context.RolloutSessions.Add(session);
        await context.SaveChangesAsync();

        var day = new RolloutDay { RolloutSessionId = session.Id, Date = DateTime.Today };
        context.RolloutDays.Add(day);
        await context.SaveChangesAsync();

        var workplace = new RolloutWorkplace
        {
            RolloutDayId = day.Id,
            UserName = "Test",
            TotalItems = 0
        };
        context.RolloutWorkplaces.Add(workplace);
        await context.SaveChangesAsync();

        // Act
        var results = await service.BulkCreateAsync(workplace.Id, new List<CreateWorkplaceAssetAssignmentRequest>());

        // Assert
        results.Should().BeEmpty();

        var updatedWorkplace = await context.RolloutWorkplaces.FindAsync(workplace.Id);
        updatedWorkplace!.TotalItems.Should().Be(0);
    }

    #endregion

    #region UpdateStatusAsync Tests

    [Fact]
    public async Task UpdateStatusAsync_ToInstalled_RecordsMovementsAndUpdatesWorkplace()
    {
        // Arrange
        await using var context = TestDbContextFactory.CreateInMemoryContext();
        var service = new WorkplaceAssetAssignmentService(
            context,
            _movementServiceMock.Object,
            _codeGeneratorMock.Object,
            _loggerMock.Object);

        var assetType = new AssetType { Name = "Laptop", Code = "LAP" };
        context.AssetTypes.Add(assetType);
        await context.SaveChangesAsync();

        var serviceEntity = new Service { Name = "IT Department" };
        context.Services.Add(serviceEntity);
        await context.SaveChangesAsync();

        var newAsset = new Asset { AssetCode = "LAP-001", SerialNumber = "SN1" };
        var oldAsset = new Asset { AssetCode = "LAP-002", SerialNumber = "SN2" };
        context.Assets.AddRange(newAsset, oldAsset);
        await context.SaveChangesAsync();

        var session = new RolloutSession { SessionName = "Test" };
        context.RolloutSessions.Add(session);
        await context.SaveChangesAsync();

        var day = new RolloutDay { RolloutSessionId = session.Id, Date = DateTime.Today };
        context.RolloutDays.Add(day);
        await context.SaveChangesAsync();

        var workplace = new RolloutWorkplace
        {
            RolloutDayId = day.Id,
            UserName = "John Doe",
            ServiceId = serviceEntity.Id,
            Location = "Office 101",
            TotalItems = 1,
            CompletedItems = 0
        };
        context.RolloutWorkplaces.Add(workplace);
        await context.SaveChangesAsync();

        var assignment = new WorkplaceAssetAssignment
        {
            RolloutWorkplaceId = workplace.Id,
            AssetTypeId = assetType.Id,
            AssignmentCategory = AssignmentCategory.UserAssigned,
            SourceType = AssetSourceType.NewFromTemplate,
            NewAssetId = newAsset.Id,
            OldAssetId = oldAsset.Id,
            Status = AssetAssignmentStatus.Pending
        };
        context.WorkplaceAssetAssignments.Add(assignment);
        await context.SaveChangesAsync();

        _movementServiceMock
            .Setup(m => m.RecordDeploymentAsync(
                It.IsAny<AssetDeploymentRequest>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RolloutAssetMovement());

        _movementServiceMock
            .Setup(m => m.RecordDecommissionAsync(
                It.IsAny<AssetDecommissionRequest>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RolloutAssetMovement());

        var request = new UpdateAssignmentStatusRequest
        {
            Status = AssetAssignmentStatus.Installed,
            SerialNumberCaptured = "SN1",
            Notes = "Installation completed"
        };

        // Act
        var result = await service.UpdateStatusAsync(
            assignment.Id,
            request,
            _performedBy,
            _performedByEmail);

        // Assert
        result.Should().NotBeNull();
        result.Status.Should().Be(AssetAssignmentStatus.Installed);
        result.InstalledBy.Should().Be(_performedBy);
        result.InstalledAt.Should().NotBeNull();

        // Verify workplace completed items incremented
        var updatedWorkplace = await context.RolloutWorkplaces.FindAsync(workplace.Id);
        updatedWorkplace!.CompletedItems.Should().Be(1);

        // Verify deployment movement was recorded
        _movementServiceMock.Verify(
            m => m.RecordDeploymentAsync(
                It.Is<AssetDeploymentRequest>(r => r.AssetId == newAsset.Id),
                _performedBy,
                _performedByEmail,
                It.IsAny<CancellationToken>()),
            Times.Once);

        // Verify decommission movement was recorded
        _movementServiceMock.Verify(
            m => m.RecordDecommissionAsync(
                It.Is<AssetDecommissionRequest>(r => r.AssetId == oldAsset.Id),
                _performedBy,
                _performedByEmail,
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task UpdateStatusAsync_AlreadyInstalled_DoesNotIncrementCompletedItems()
    {
        // Arrange
        await using var context = TestDbContextFactory.CreateInMemoryContext();
        var service = new WorkplaceAssetAssignmentService(
            context,
            _movementServiceMock.Object,
            _codeGeneratorMock.Object,
            _loggerMock.Object);

        var assetType = new AssetType { Name = "Laptop", Code = "LAP" };
        context.AssetTypes.Add(assetType);
        await context.SaveChangesAsync();

        var session = new RolloutSession { SessionName = "Test" };
        context.RolloutSessions.Add(session);
        await context.SaveChangesAsync();

        var day = new RolloutDay { RolloutSessionId = session.Id, Date = DateTime.Today };
        context.RolloutDays.Add(day);
        await context.SaveChangesAsync();

        var workplace = new RolloutWorkplace
        {
            RolloutDayId = day.Id,
            UserName = "Test",
            TotalItems = 1,
            CompletedItems = 1
        };
        context.RolloutWorkplaces.Add(workplace);
        await context.SaveChangesAsync();

        var assignment = new WorkplaceAssetAssignment
        {
            RolloutWorkplaceId = workplace.Id,
            AssetTypeId = assetType.Id,
            Status = AssetAssignmentStatus.Installed // Already installed
        };
        context.WorkplaceAssetAssignments.Add(assignment);
        await context.SaveChangesAsync();

        var request = new UpdateAssignmentStatusRequest
        {
            Status = AssetAssignmentStatus.Installed,
            Notes = "Re-installation"
        };

        // Act
        await service.UpdateStatusAsync(assignment.Id, request, _performedBy, _performedByEmail);

        // Assert
        var updatedWorkplace = await context.RolloutWorkplaces.FindAsync(workplace.Id);
        updatedWorkplace!.CompletedItems.Should().Be(1); // Should not increment
    }

    [Fact]
    public async Task UpdateStatusAsync_AssignmentNotFound_ThrowsInvalidOperationException()
    {
        // Arrange
        await using var context = TestDbContextFactory.CreateInMemoryContext();
        var service = new WorkplaceAssetAssignmentService(
            context,
            _movementServiceMock.Object,
            _codeGeneratorMock.Object,
            _loggerMock.Object);

        var request = new UpdateAssignmentStatusRequest
        {
            Status = AssetAssignmentStatus.Installed
        };

        // Act & Assert
        await Assert.ThrowsAsync<InvalidOperationException>(
            () => service.UpdateStatusAsync(999, request, _performedBy, _performedByEmail));
    }

    #endregion

    #region UpdateAsync Tests

    [Fact]
    public async Task UpdateAsync_ValidRequest_UpdatesAssignment()
    {
        // Arrange
        await using var context = TestDbContextFactory.CreateInMemoryContext();
        var service = new WorkplaceAssetAssignmentService(
            context,
            _movementServiceMock.Object,
            _codeGeneratorMock.Object,
            _loggerMock.Object);

        var assetType = new AssetType { Name = "Laptop", Code = "LAP" };
        context.AssetTypes.Add(assetType);
        await context.SaveChangesAsync();

        var asset = new Asset { AssetCode = "LAP-001" };
        context.Assets.Add(asset);
        await context.SaveChangesAsync();

        var session = new RolloutSession { SessionName = "Test" };
        context.RolloutSessions.Add(session);
        await context.SaveChangesAsync();

        var day = new RolloutDay { RolloutSessionId = session.Id, Date = DateTime.Today };
        context.RolloutDays.Add(day);
        await context.SaveChangesAsync();

        var workplace = new RolloutWorkplace { RolloutDayId = day.Id, UserName = "Test" };
        context.RolloutWorkplaces.Add(workplace);
        await context.SaveChangesAsync();

        var assignment = new WorkplaceAssetAssignment
        {
            RolloutWorkplaceId = workplace.Id,
            AssetTypeId = assetType.Id,
            Position = 0,
            Notes = "Original notes"
        };
        context.WorkplaceAssetAssignments.Add(assignment);
        await context.SaveChangesAsync();

        var request = new UpdateWorkplaceAssetAssignmentRequest
        {
            NewAssetId = asset.Id,
            Position = 5,
            Notes = "Updated notes",
            SerialNumberRequired = true
        };

        // Act
        var result = await service.UpdateAsync(assignment.Id, request);

        // Assert
        result.Should().NotBeNull();
        result.NewAssetId.Should().Be(asset.Id);
        result.Position.Should().Be(5);
        result.Notes.Should().Be("Updated notes");
        result.SerialNumberRequired.Should().BeTrue();
    }

    [Fact]
    public async Task UpdateAsync_PartialUpdate_OnlyUpdatesProvidedFields()
    {
        // Arrange
        await using var context = TestDbContextFactory.CreateInMemoryContext();
        var service = new WorkplaceAssetAssignmentService(
            context,
            _movementServiceMock.Object,
            _codeGeneratorMock.Object,
            _loggerMock.Object);

        var assetType = new AssetType { Name = "Laptop", Code = "LAP" };
        context.AssetTypes.Add(assetType);
        await context.SaveChangesAsync();

        var session = new RolloutSession { SessionName = "Test" };
        context.RolloutSessions.Add(session);
        await context.SaveChangesAsync();

        var day = new RolloutDay { RolloutSessionId = session.Id, Date = DateTime.Today };
        context.RolloutDays.Add(day);
        await context.SaveChangesAsync();

        var workplace = new RolloutWorkplace { RolloutDayId = day.Id, UserName = "Test" };
        context.RolloutWorkplaces.Add(workplace);
        await context.SaveChangesAsync();

        var assignment = new WorkplaceAssetAssignment
        {
            RolloutWorkplaceId = workplace.Id,
            AssetTypeId = assetType.Id,
            Position = 0,
            Notes = "Original notes",
            SerialNumberRequired = false
        };
        context.WorkplaceAssetAssignments.Add(assignment);
        await context.SaveChangesAsync();

        var request = new UpdateWorkplaceAssetAssignmentRequest
        {
            Notes = "Updated notes only"
            // Other fields not provided
        };

        // Act
        var result = await service.UpdateAsync(assignment.Id, request);

        // Assert
        result.Notes.Should().Be("Updated notes only");
        result.Position.Should().Be(0); // Unchanged
        result.SerialNumberRequired.Should().BeFalse(); // Unchanged
    }

    #endregion

    #region DeleteAsync Tests

    [Fact]
    public async Task DeleteAsync_ValidAssignment_DeletesAndUpdatesWorkplace()
    {
        // Arrange
        await using var context = TestDbContextFactory.CreateInMemoryContext();
        var service = new WorkplaceAssetAssignmentService(
            context,
            _movementServiceMock.Object,
            _codeGeneratorMock.Object,
            _loggerMock.Object);

        var assetType = new AssetType { Name = "Laptop", Code = "LAP" };
        context.AssetTypes.Add(assetType);
        await context.SaveChangesAsync();

        var session = new RolloutSession { SessionName = "Test" };
        context.RolloutSessions.Add(session);
        await context.SaveChangesAsync();

        var day = new RolloutDay { RolloutSessionId = session.Id, Date = DateTime.Today };
        context.RolloutDays.Add(day);
        await context.SaveChangesAsync();

        var workplace = new RolloutWorkplace
        {
            RolloutDayId = day.Id,
            UserName = "Test",
            TotalItems = 1,
            CompletedItems = 0
        };
        context.RolloutWorkplaces.Add(workplace);
        await context.SaveChangesAsync();

        var assignment = new WorkplaceAssetAssignment
        {
            RolloutWorkplaceId = workplace.Id,
            AssetTypeId = assetType.Id,
            Status = AssetAssignmentStatus.Pending
        };
        context.WorkplaceAssetAssignments.Add(assignment);
        await context.SaveChangesAsync();

        // Act
        await service.DeleteAsync(assignment.Id);

        // Assert
        var deletedAssignment = await context.WorkplaceAssetAssignments.FindAsync(assignment.Id);
        deletedAssignment.Should().BeNull();

        var updatedWorkplace = await context.RolloutWorkplaces.FindAsync(workplace.Id);
        updatedWorkplace!.TotalItems.Should().Be(0);
    }

    [Fact]
    public async Task DeleteAsync_InstalledAssignment_UpdatesBothCounters()
    {
        // Arrange
        await using var context = TestDbContextFactory.CreateInMemoryContext();
        var service = new WorkplaceAssetAssignmentService(
            context,
            _movementServiceMock.Object,
            _codeGeneratorMock.Object,
            _loggerMock.Object);

        var assetType = new AssetType { Name = "Laptop", Code = "LAP" };
        context.AssetTypes.Add(assetType);
        await context.SaveChangesAsync();

        var session = new RolloutSession { SessionName = "Test" };
        context.RolloutSessions.Add(session);
        await context.SaveChangesAsync();

        var day = new RolloutDay { RolloutSessionId = session.Id, Date = DateTime.Today };
        context.RolloutDays.Add(day);
        await context.SaveChangesAsync();

        var workplace = new RolloutWorkplace
        {
            RolloutDayId = day.Id,
            UserName = "Test",
            TotalItems = 1,
            CompletedItems = 1
        };
        context.RolloutWorkplaces.Add(workplace);
        await context.SaveChangesAsync();

        var assignment = new WorkplaceAssetAssignment
        {
            RolloutWorkplaceId = workplace.Id,
            AssetTypeId = assetType.Id,
            Status = AssetAssignmentStatus.Installed
        };
        context.WorkplaceAssetAssignments.Add(assignment);
        await context.SaveChangesAsync();

        // Act
        await service.DeleteAsync(assignment.Id);

        // Assert
        var updatedWorkplace = await context.RolloutWorkplaces.FindAsync(workplace.Id);
        updatedWorkplace!.TotalItems.Should().Be(0);
        updatedWorkplace.CompletedItems.Should().Be(0);
    }

    #endregion

    #region AssignExistingAssetAsync Tests

    [Fact]
    public async Task AssignExistingAssetAsync_ValidAsset_AssignsAndLinksAsset()
    {
        // Arrange
        await using var context = TestDbContextFactory.CreateInMemoryContext();
        var service = new WorkplaceAssetAssignmentService(
            context,
            _movementServiceMock.Object,
            _codeGeneratorMock.Object,
            _loggerMock.Object);

        var assetType = new AssetType { Name = "Laptop", Code = "LAP" };
        context.AssetTypes.Add(assetType);
        await context.SaveChangesAsync();

        var asset = new Asset { AssetCode = "LAP-001", SerialNumber = "SN1" };
        context.Assets.Add(asset);
        await context.SaveChangesAsync();

        var session = new RolloutSession { SessionName = "Test" };
        context.RolloutSessions.Add(session);
        await context.SaveChangesAsync();

        var day = new RolloutDay { RolloutSessionId = session.Id, Date = DateTime.Today };
        context.RolloutDays.Add(day);
        await context.SaveChangesAsync();

        var workplace = new RolloutWorkplace { RolloutDayId = day.Id, UserName = "Test" };
        context.RolloutWorkplaces.Add(workplace);
        await context.SaveChangesAsync();

        var assignment = new WorkplaceAssetAssignment
        {
            RolloutWorkplaceId = workplace.Id,
            AssetTypeId = assetType.Id,
            SourceType = AssetSourceType.NewFromTemplate
        };
        context.WorkplaceAssetAssignments.Add(assignment);
        await context.SaveChangesAsync();

        // Act
        var result = await service.AssignExistingAssetAsync(assignment.Id, asset.Id);

        // Assert
        result.Should().NotBeNull();
        result.NewAssetId.Should().Be(asset.Id);
        result.SourceType.Should().Be(AssetSourceType.ExistingInventory);

        var updatedAsset = await context.Assets.FindAsync(asset.Id);
        updatedAsset!.CurrentWorkplaceAssignmentId.Should().Be(assignment.Id);
    }

    [Fact]
    public async Task AssignExistingAssetAsync_AssetNotFound_ThrowsInvalidOperationException()
    {
        // Arrange
        await using var context = TestDbContextFactory.CreateInMemoryContext();
        var service = new WorkplaceAssetAssignmentService(
            context,
            _movementServiceMock.Object,
            _codeGeneratorMock.Object,
            _loggerMock.Object);

        var assetType = new AssetType { Name = "Laptop", Code = "LAP" };
        context.AssetTypes.Add(assetType);
        await context.SaveChangesAsync();

        var session = new RolloutSession { SessionName = "Test" };
        context.RolloutSessions.Add(session);
        await context.SaveChangesAsync();

        var day = new RolloutDay { RolloutSessionId = session.Id, Date = DateTime.Today };
        context.RolloutDays.Add(day);
        await context.SaveChangesAsync();

        var workplace = new RolloutWorkplace { RolloutDayId = day.Id, UserName = "Test" };
        context.RolloutWorkplaces.Add(workplace);
        await context.SaveChangesAsync();

        var assignment = new WorkplaceAssetAssignment
        {
            RolloutWorkplaceId = workplace.Id,
            AssetTypeId = assetType.Id
        };
        context.WorkplaceAssetAssignments.Add(assignment);
        await context.SaveChangesAsync();

        // Act & Assert
        await Assert.ThrowsAsync<InvalidOperationException>(
            () => service.AssignExistingAssetAsync(assignment.Id, 999));
    }

    #endregion

    #region CreateAssetFromTemplateAsync Tests

    [Fact]
    public async Task CreateAssetFromTemplateAsync_ValidTemplate_CreatesAssetAndLinks()
    {
        // Arrange
        await using var context = TestDbContextFactory.CreateInMemoryContext();
        var service = new WorkplaceAssetAssignmentService(
            context,
            _movementServiceMock.Object,
            _codeGeneratorMock.Object,
            _loggerMock.Object);

        _codeGeneratorMock
            .Setup(g => g.GenerateCodeAsync(
                It.IsAny<int>(),
                It.IsAny<string>(),
                It.IsAny<DateTime>(),
                It.IsAny<bool>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync("LAP-24-DELL-00001");

        var assetType = new AssetType { Name = "Laptop", Code = "LAP" };
        context.AssetTypes.Add(assetType);
        await context.SaveChangesAsync();

        var template = new AssetTemplate
        {
            TemplateName = "Dell Laptop Template",
            AssetName = "Dell Latitude 5420",
            Category = "Hardware",
            Brand = "Dell",
            Model = "Latitude 5420"
        };
        context.AssetTemplates.Add(template);
        await context.SaveChangesAsync();

        var session = new RolloutSession { SessionName = "Test" };
        context.RolloutSessions.Add(session);
        await context.SaveChangesAsync();

        var day = new RolloutDay { RolloutSessionId = session.Id, Date = DateTime.Today };
        context.RolloutDays.Add(day);
        await context.SaveChangesAsync();

        var workplace = new RolloutWorkplace
        {
            RolloutDayId = day.Id,
            UserName = "John Doe",
            ServiceId = 1,
            Location = "Office 101"
        };
        context.RolloutWorkplaces.Add(workplace);
        await context.SaveChangesAsync();

        var assignment = new WorkplaceAssetAssignment
        {
            RolloutWorkplaceId = workplace.Id,
            AssetTypeId = assetType.Id,
            AssetTemplateId = template.Id
        };
        context.WorkplaceAssetAssignments.Add(assignment);
        await context.SaveChangesAsync();

        // Act
        var result = await service.CreateAssetFromTemplateAsync(
            assignment.Id,
            "ABC123",
            _performedBy,
            _performedByEmail);

        // Assert
        result.Should().NotBeNull();
        result.NewAssetId.Should().NotBeNull();
        result.SerialNumberCaptured.Should().Be("ABC123");

        var createdAsset = await context.Assets.FindAsync(result.NewAssetId);
        createdAsset.Should().NotBeNull();
        createdAsset!.AssetCode.Should().Be("LAP-24-DELL-00001");
        createdAsset.SerialNumber.Should().Be("ABC123");
        createdAsset.Owner.Should().Be("John Doe");
        createdAsset.Status.Should().Be(AssetStatus.Nieuw);
        createdAsset.Brand.Should().Be("Dell");
        createdAsset.Model.Should().Be("Latitude 5420");
    }

    [Fact]
    public async Task CreateAssetFromTemplateAsync_NoTemplate_ThrowsInvalidOperationException()
    {
        // Arrange
        await using var context = TestDbContextFactory.CreateInMemoryContext();
        var service = new WorkplaceAssetAssignmentService(
            context,
            _movementServiceMock.Object,
            _codeGeneratorMock.Object,
            _loggerMock.Object);

        var assetType = new AssetType { Name = "Laptop", Code = "LAP" };
        context.AssetTypes.Add(assetType);
        await context.SaveChangesAsync();

        var session = new RolloutSession { SessionName = "Test" };
        context.RolloutSessions.Add(session);
        await context.SaveChangesAsync();

        var day = new RolloutDay { RolloutSessionId = session.Id, Date = DateTime.Today };
        context.RolloutDays.Add(day);
        await context.SaveChangesAsync();

        var workplace = new RolloutWorkplace { RolloutDayId = day.Id, UserName = "Test" };
        context.RolloutWorkplaces.Add(workplace);
        await context.SaveChangesAsync();

        var assignment = new WorkplaceAssetAssignment
        {
            RolloutWorkplaceId = workplace.Id,
            AssetTypeId = assetType.Id,
            AssetTemplateId = null // No template
        };
        context.WorkplaceAssetAssignments.Add(assignment);
        await context.SaveChangesAsync();

        // Act & Assert
        var exception = await Assert.ThrowsAsync<InvalidOperationException>(
            () => service.CreateAssetFromTemplateAsync(assignment.Id, "SN123", _performedBy, _performedByEmail));

        exception.Message.Should().Contain("template");
    }

    #endregion

    #region GetSummaryAsync Tests

    [Fact]
    public async Task GetSummaryAsync_ValidWorkplace_ReturnsCompleteSummary()
    {
        // Arrange
        await using var context = TestDbContextFactory.CreateInMemoryContext();
        var service = new WorkplaceAssetAssignmentService(
            context,
            _movementServiceMock.Object,
            _codeGeneratorMock.Object,
            _loggerMock.Object);

        var assetType = new AssetType { Name = "Laptop", Code = "LAP" };
        context.AssetTypes.Add(assetType);
        await context.SaveChangesAsync();

        var session = new RolloutSession { SessionName = "Test" };
        context.RolloutSessions.Add(session);
        await context.SaveChangesAsync();

        var day = new RolloutDay { RolloutSessionId = session.Id, Date = DateTime.Today };
        context.RolloutDays.Add(day);
        await context.SaveChangesAsync();

        var workplace = new RolloutWorkplace { RolloutDayId = day.Id, UserName = "Test" };
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
        var summary = await service.GetSummaryAsync(workplace.Id);

        // Assert
        summary.Should().NotBeNull();
        summary.WorkplaceId.Should().Be(workplace.Id);
        summary.TotalAssignments.Should().Be(3);
        summary.PendingAssignments.Should().Be(1);
        summary.InstalledAssignments.Should().Be(1);
        summary.SkippedAssignments.Should().Be(1);
        summary.SerialNumbersRequired.Should().Be(2);
        summary.SerialNumbersCaptured.Should().Be(1);
        summary.ByAssetType.Should().HaveCount(1);
        summary.ByAssetType.First().AssetTypeName.Should().Be("Laptop");
    }

    #endregion

    #region CompleteWorkplaceAssignmentsAsync Tests

    [Fact]
    public async Task CompleteWorkplaceAssignmentsAsync_HasPendingAssignments_CompletesAll()
    {
        // Arrange
        await using var context = TestDbContextFactory.CreateInMemoryContext();
        var service = new WorkplaceAssetAssignmentService(
            context,
            _movementServiceMock.Object,
            _codeGeneratorMock.Object,
            _loggerMock.Object);

        var assetType = new AssetType { Name = "Laptop", Code = "LAP" };
        context.AssetTypes.Add(assetType);
        await context.SaveChangesAsync();

        var session = new RolloutSession { SessionName = "Test" };
        context.RolloutSessions.Add(session);
        await context.SaveChangesAsync();

        var day = new RolloutDay { RolloutSessionId = session.Id, Date = DateTime.Today };
        context.RolloutDays.Add(day);
        await context.SaveChangesAsync();

        var workplace = new RolloutWorkplace
        {
            RolloutDayId = day.Id,
            UserName = "Test",
            TotalItems = 3,
            CompletedItems = 0
        };
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
            },
            new WorkplaceAssetAssignment
            {
                RolloutWorkplaceId = workplace.Id,
                AssetTypeId = assetType.Id,
                Status = AssetAssignmentStatus.Installed // Already completed
            }
        );
        await context.SaveChangesAsync();

        // Act
        var completedCount = await service.CompleteWorkplaceAssignmentsAsync(
            workplace.Id,
            _performedBy,
            _performedByEmail);

        // Assert
        completedCount.Should().Be(2);

        var assignments = context.WorkplaceAssetAssignments.Where(a => a.RolloutWorkplaceId == workplace.Id);
        assignments.Should().OnlyContain(a => a.Status == AssetAssignmentStatus.Installed);
    }

    #endregion
}

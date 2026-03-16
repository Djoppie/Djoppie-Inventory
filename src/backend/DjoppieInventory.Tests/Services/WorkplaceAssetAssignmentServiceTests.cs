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

        var assetType = new AssetType { Id = 1, Name = "Laptop", Code = "LAP" };
        var session = new RolloutSession { Id = 1, SessionName = "Test Session" };
        var day = new RolloutDay { Id = 1, RolloutSessionId = 1, DayDate = DateTime.Today };
        var workplace = new RolloutWorkplace
        {
            Id = 1,
            RolloutDayId = 1,
            UserName = "John Doe",
            ServiceId = 1,
            TotalItems = 0
        };

        context.AssetTypes.Add(assetType);
        context.RolloutSessions.Add(session);
        context.RolloutDays.Add(day);
        context.RolloutWorkplaces.Add(workplace);
        await context.SaveChangesAsync();

        var request = new CreateWorkplaceAssetAssignmentRequest
        {
            RolloutWorkplaceId = 1,
            AssetTypeId = 1,
            AssignmentCategory = AssignmentCategory.NewDevice,
            SourceType = AssetSourceType.NewPurchase,
            Position = 0,
            SerialNumberRequired = true,
            QRCodeRequired = true
        };

        // Act
        var result = await service.CreateAsync(request);

        // Assert
        result.Should().NotBeNull();
        result.RolloutWorkplaceId.Should().Be(1);
        result.AssetTypeId.Should().Be(1);
        result.AssetTypeName.Should().Be("Laptop");
        result.Status.Should().Be(AssetAssignmentStatus.Pending);

        // Verify workplace total items incremented
        var updatedWorkplace = await context.RolloutWorkplaces.FindAsync(1);
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
            AssignmentCategory = AssignmentCategory.NewDevice,
            SourceType = AssetSourceType.NewPurchase
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

        var session = new RolloutSession { Id = 1, SessionName = "Test" };
        var day = new RolloutDay { Id = 1, RolloutSessionId = 1, DayDate = DateTime.Today };
        var workplace = new RolloutWorkplace { Id = 1, RolloutDayId = 1, UserName = "Test" };

        context.RolloutSessions.Add(session);
        context.RolloutDays.Add(day);
        context.RolloutWorkplaces.Add(workplace);
        await context.SaveChangesAsync();

        var request = new CreateWorkplaceAssetAssignmentRequest
        {
            RolloutWorkplaceId = 1,
            AssetTypeId = 999, // Non-existent
            AssignmentCategory = AssignmentCategory.NewDevice,
            SourceType = AssetSourceType.NewPurchase
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

        var assetType = new AssetType { Id = 1, Name = "Laptop", Code = "LAP" };
        var session = new RolloutSession { Id = 1, SessionName = "Test" };
        var day = new RolloutDay { Id = 1, RolloutSessionId = 1, DayDate = DateTime.Today };
        var workplace = new RolloutWorkplace
        {
            Id = 1,
            RolloutDayId = 1,
            UserName = "Test",
            TotalItems = 0
        };

        context.AssetTypes.Add(assetType);
        context.RolloutSessions.Add(session);
        context.RolloutDays.Add(day);
        context.RolloutWorkplaces.Add(workplace);
        await context.SaveChangesAsync();

        var requests = new List<CreateWorkplaceAssetAssignmentRequest>
        {
            new()
            {
                AssetTypeId = 1,
                AssignmentCategory = AssignmentCategory.NewDevice,
                SourceType = AssetSourceType.NewPurchase,
                Position = 0
            },
            new()
            {
                AssetTypeId = 1,
                AssignmentCategory = AssignmentCategory.UpdateDevice,
                SourceType = AssetSourceType.ExistingInventory,
                Position = 1
            },
            new()
            {
                AssetTypeId = 1,
                AssignmentCategory = AssignmentCategory.OldDevice,
                SourceType = AssetSourceType.UserOwned,
                Position = 2
            }
        };

        // Act
        var results = await service.BulkCreateAsync(1, requests);

        // Assert
        results.Should().HaveCount(3);

        var updatedWorkplace = await context.RolloutWorkplaces.FindAsync(1);
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

        var session = new RolloutSession { Id = 1, SessionName = "Test" };
        var day = new RolloutDay { Id = 1, RolloutSessionId = 1, DayDate = DateTime.Today };
        var workplace = new RolloutWorkplace
        {
            Id = 1,
            RolloutDayId = 1,
            UserName = "Test",
            TotalItems = 0
        };

        context.RolloutSessions.Add(session);
        context.RolloutDays.Add(day);
        context.RolloutWorkplaces.Add(workplace);
        await context.SaveChangesAsync();

        // Act
        var results = await service.BulkCreateAsync(1, new List<CreateWorkplaceAssetAssignmentRequest>());

        // Assert
        results.Should().BeEmpty();

        var updatedWorkplace = await context.RolloutWorkplaces.FindAsync(1);
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

        var assetType = new AssetType { Id = 1, Name = "Laptop", Code = "LAP" };
        var serviceEntity = new Service { Id = 1, Name = "IT Department" };
        var newAsset = new Asset { Id = 1, AssetCode = "LAP-001", SerialNumber = "SN1" };
        var oldAsset = new Asset { Id = 2, AssetCode = "LAP-002", SerialNumber = "SN2" };

        var session = new RolloutSession { Id = 1, SessionName = "Test" };
        var day = new RolloutDay { Id = 1, RolloutSessionId = 1, DayDate = DateTime.Today };
        var workplace = new RolloutWorkplace
        {
            Id = 1,
            RolloutDayId = 1,
            UserName = "John Doe",
            ServiceId = 1,
            Location = "Office 101",
            TotalItems = 1,
            CompletedItems = 0
        };

        var assignment = new WorkplaceAssetAssignment
        {
            Id = 1,
            RolloutWorkplaceId = 1,
            AssetTypeId = 1,
            AssignmentCategory = AssignmentCategory.NewDevice,
            SourceType = AssetSourceType.NewPurchase,
            NewAssetId = 1,
            OldAssetId = 2,
            Status = AssetAssignmentStatus.Pending
        };

        context.AssetTypes.Add(assetType);
        context.Services.Add(serviceEntity);
        context.Assets.AddRange(newAsset, oldAsset);
        context.RolloutSessions.Add(session);
        context.RolloutDays.Add(day);
        context.RolloutWorkplaces.Add(workplace);
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
            1,
            request,
            _performedBy,
            _performedByEmail);

        // Assert
        result.Should().NotBeNull();
        result.Status.Should().Be(AssetAssignmentStatus.Installed);
        result.InstalledBy.Should().Be(_performedBy);
        result.InstalledAt.Should().NotBeNull();

        // Verify workplace completed items incremented
        var updatedWorkplace = await context.RolloutWorkplaces.FindAsync(1);
        updatedWorkplace!.CompletedItems.Should().Be(1);

        // Verify deployment movement was recorded
        _movementServiceMock.Verify(
            m => m.RecordDeploymentAsync(
                It.Is<AssetDeploymentRequest>(r => r.AssetId == 1),
                _performedBy,
                _performedByEmail,
                It.IsAny<CancellationToken>()),
            Times.Once);

        // Verify decommission movement was recorded
        _movementServiceMock.Verify(
            m => m.RecordDecommissionAsync(
                It.Is<AssetDecommissionRequest>(r => r.AssetId == 2),
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

        var assetType = new AssetType { Id = 1, Name = "Laptop", Code = "LAP" };
        var session = new RolloutSession { Id = 1, SessionName = "Test" };
        var day = new RolloutDay { Id = 1, RolloutSessionId = 1, DayDate = DateTime.Today };
        var workplace = new RolloutWorkplace
        {
            Id = 1,
            RolloutDayId = 1,
            UserName = "Test",
            TotalItems = 1,
            CompletedItems = 1
        };

        var assignment = new WorkplaceAssetAssignment
        {
            Id = 1,
            RolloutWorkplaceId = 1,
            AssetTypeId = 1,
            Status = AssetAssignmentStatus.Installed // Already installed
        };

        context.AssetTypes.Add(assetType);
        context.RolloutSessions.Add(session);
        context.RolloutDays.Add(day);
        context.RolloutWorkplaces.Add(workplace);
        context.WorkplaceAssetAssignments.Add(assignment);
        await context.SaveChangesAsync();

        var request = new UpdateAssignmentStatusRequest
        {
            Status = AssetAssignmentStatus.Installed,
            Notes = "Re-installation"
        };

        // Act
        await service.UpdateStatusAsync(1, request, _performedBy, _performedByEmail);

        // Assert
        var updatedWorkplace = await context.RolloutWorkplaces.FindAsync(1);
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

        var assetType = new AssetType { Id = 1, Name = "Laptop", Code = "LAP" };
        var asset = new Asset { Id = 1, AssetCode = "LAP-001" };
        var session = new RolloutSession { Id = 1, SessionName = "Test" };
        var day = new RolloutDay { Id = 1, RolloutSessionId = 1, DayDate = DateTime.Today };
        var workplace = new RolloutWorkplace { Id = 1, RolloutDayId = 1, UserName = "Test" };

        var assignment = new WorkplaceAssetAssignment
        {
            Id = 1,
            RolloutWorkplaceId = 1,
            AssetTypeId = 1,
            Position = 0,
            Notes = "Original notes"
        };

        context.AssetTypes.Add(assetType);
        context.Assets.Add(asset);
        context.RolloutSessions.Add(session);
        context.RolloutDays.Add(day);
        context.RolloutWorkplaces.Add(workplace);
        context.WorkplaceAssetAssignments.Add(assignment);
        await context.SaveChangesAsync();

        var request = new UpdateWorkplaceAssetAssignmentRequest
        {
            NewAssetId = 1,
            Position = 5,
            Notes = "Updated notes",
            SerialNumberRequired = true
        };

        // Act
        var result = await service.UpdateAsync(1, request);

        // Assert
        result.Should().NotBeNull();
        result.NewAssetId.Should().Be(1);
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

        var assetType = new AssetType { Id = 1, Name = "Laptop", Code = "LAP" };
        var session = new RolloutSession { Id = 1, SessionName = "Test" };
        var day = new RolloutDay { Id = 1, RolloutSessionId = 1, DayDate = DateTime.Today };
        var workplace = new RolloutWorkplace { Id = 1, RolloutDayId = 1, UserName = "Test" };

        var assignment = new WorkplaceAssetAssignment
        {
            Id = 1,
            RolloutWorkplaceId = 1,
            AssetTypeId = 1,
            Position = 0,
            Notes = "Original notes",
            SerialNumberRequired = false
        };

        context.AssetTypes.Add(assetType);
        context.RolloutSessions.Add(session);
        context.RolloutDays.Add(day);
        context.RolloutWorkplaces.Add(workplace);
        context.WorkplaceAssetAssignments.Add(assignment);
        await context.SaveChangesAsync();

        var request = new UpdateWorkplaceAssetAssignmentRequest
        {
            Notes = "Updated notes only"
            // Other fields not provided
        };

        // Act
        var result = await service.UpdateAsync(1, request);

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

        var assetType = new AssetType { Id = 1, Name = "Laptop", Code = "LAP" };
        var session = new RolloutSession { Id = 1, SessionName = "Test" };
        var day = new RolloutDay { Id = 1, RolloutSessionId = 1, DayDate = DateTime.Today };
        var workplace = new RolloutWorkplace
        {
            Id = 1,
            RolloutDayId = 1,
            UserName = "Test",
            TotalItems = 1,
            CompletedItems = 0
        };

        var assignment = new WorkplaceAssetAssignment
        {
            Id = 1,
            RolloutWorkplaceId = 1,
            AssetTypeId = 1,
            Status = AssetAssignmentStatus.Pending
        };

        context.AssetTypes.Add(assetType);
        context.RolloutSessions.Add(session);
        context.RolloutDays.Add(day);
        context.RolloutWorkplaces.Add(workplace);
        context.WorkplaceAssetAssignments.Add(assignment);
        await context.SaveChangesAsync();

        // Act
        await service.DeleteAsync(1);

        // Assert
        var deletedAssignment = await context.WorkplaceAssetAssignments.FindAsync(1);
        deletedAssignment.Should().BeNull();

        var updatedWorkplace = await context.RolloutWorkplaces.FindAsync(1);
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

        var assetType = new AssetType { Id = 1, Name = "Laptop", Code = "LAP" };
        var session = new RolloutSession { Id = 1, SessionName = "Test" };
        var day = new RolloutDay { Id = 1, RolloutSessionId = 1, DayDate = DateTime.Today };
        var workplace = new RolloutWorkplace
        {
            Id = 1,
            RolloutDayId = 1,
            UserName = "Test",
            TotalItems = 1,
            CompletedItems = 1
        };

        var assignment = new WorkplaceAssetAssignment
        {
            Id = 1,
            RolloutWorkplaceId = 1,
            AssetTypeId = 1,
            Status = AssetAssignmentStatus.Installed
        };

        context.AssetTypes.Add(assetType);
        context.RolloutSessions.Add(session);
        context.RolloutDays.Add(day);
        context.RolloutWorkplaces.Add(workplace);
        context.WorkplaceAssetAssignments.Add(assignment);
        await context.SaveChangesAsync();

        // Act
        await service.DeleteAsync(1);

        // Assert
        var updatedWorkplace = await context.RolloutWorkplaces.FindAsync(1);
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

        var assetType = new AssetType { Id = 1, Name = "Laptop", Code = "LAP" };
        var asset = new Asset { Id = 1, AssetCode = "LAP-001", SerialNumber = "SN1" };
        var session = new RolloutSession { Id = 1, SessionName = "Test" };
        var day = new RolloutDay { Id = 1, RolloutSessionId = 1, DayDate = DateTime.Today };
        var workplace = new RolloutWorkplace { Id = 1, RolloutDayId = 1, UserName = "Test" };

        var assignment = new WorkplaceAssetAssignment
        {
            Id = 1,
            RolloutWorkplaceId = 1,
            AssetTypeId = 1,
            SourceType = AssetSourceType.NewPurchase
        };

        context.AssetTypes.Add(assetType);
        context.Assets.Add(asset);
        context.RolloutSessions.Add(session);
        context.RolloutDays.Add(day);
        context.RolloutWorkplaces.Add(workplace);
        context.WorkplaceAssetAssignments.Add(assignment);
        await context.SaveChangesAsync();

        // Act
        var result = await service.AssignExistingAssetAsync(1, 1);

        // Assert
        result.Should().NotBeNull();
        result.NewAssetId.Should().Be(1);
        result.SourceType.Should().Be(AssetSourceType.ExistingInventory);

        var updatedAsset = await context.Assets.FindAsync(1);
        updatedAsset!.CurrentWorkplaceAssignmentId.Should().Be(1);
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

        var assetType = new AssetType { Id = 1, Name = "Laptop", Code = "LAP" };
        var session = new RolloutSession { Id = 1, SessionName = "Test" };
        var day = new RolloutDay { Id = 1, RolloutSessionId = 1, DayDate = DateTime.Today };
        var workplace = new RolloutWorkplace { Id = 1, RolloutDayId = 1, UserName = "Test" };
        var assignment = new WorkplaceAssetAssignment
        {
            Id = 1,
            RolloutWorkplaceId = 1,
            AssetTypeId = 1
        };

        context.AssetTypes.Add(assetType);
        context.RolloutSessions.Add(session);
        context.RolloutDays.Add(day);
        context.RolloutWorkplaces.Add(workplace);
        context.WorkplaceAssetAssignments.Add(assignment);
        await context.SaveChangesAsync();

        // Act & Assert
        await Assert.ThrowsAsync<InvalidOperationException>(
            () => service.AssignExistingAssetAsync(1, 999));
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

        var assetType = new AssetType { Id = 1, Name = "Laptop", Code = "LAP" };
        var template = new AssetTemplate
        {
            Id = 1,
            TemplateName = "Dell Laptop Template",
            AssetName = "Dell Latitude 5420",
            Category = "Hardware",
            Brand = "Dell",
            Model = "Latitude 5420"
        };

        var session = new RolloutSession { Id = 1, SessionName = "Test" };
        var day = new RolloutDay { Id = 1, RolloutSessionId = 1, DayDate = DateTime.Today };
        var workplace = new RolloutWorkplace
        {
            Id = 1,
            RolloutDayId = 1,
            UserName = "John Doe",
            ServiceId = 1,
            Location = "Office 101"
        };

        var assignment = new WorkplaceAssetAssignment
        {
            Id = 1,
            RolloutWorkplaceId = 1,
            AssetTypeId = 1,
            AssetTemplateId = 1
        };

        context.AssetTypes.Add(assetType);
        context.AssetTemplates.Add(template);
        context.RolloutSessions.Add(session);
        context.RolloutDays.Add(day);
        context.RolloutWorkplaces.Add(workplace);
        context.WorkplaceAssetAssignments.Add(assignment);
        await context.SaveChangesAsync();

        // Act
        var result = await service.CreateAssetFromTemplateAsync(
            1,
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

        var assetType = new AssetType { Id = 1, Name = "Laptop", Code = "LAP" };
        var session = new RolloutSession { Id = 1, SessionName = "Test" };
        var day = new RolloutDay { Id = 1, RolloutSessionId = 1, DayDate = DateTime.Today };
        var workplace = new RolloutWorkplace { Id = 1, RolloutDayId = 1, UserName = "Test" };
        var assignment = new WorkplaceAssetAssignment
        {
            Id = 1,
            RolloutWorkplaceId = 1,
            AssetTypeId = 1,
            AssetTemplateId = null // No template
        };

        context.AssetTypes.Add(assetType);
        context.RolloutSessions.Add(session);
        context.RolloutDays.Add(day);
        context.RolloutWorkplaces.Add(workplace);
        context.WorkplaceAssetAssignments.Add(assignment);
        await context.SaveChangesAsync();

        // Act & Assert
        var exception = await Assert.ThrowsAsync<InvalidOperationException>(
            () => service.CreateAssetFromTemplateAsync(1, "SN123", _performedBy, _performedByEmail));

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

        var assetType = new AssetType { Id = 1, Name = "Laptop", Code = "LAP" };
        var session = new RolloutSession { Id = 1, SessionName = "Test" };
        var day = new RolloutDay { Id = 1, RolloutSessionId = 1, DayDate = DateTime.Today };
        var workplace = new RolloutWorkplace { Id = 1, RolloutDayId = 1, UserName = "Test" };

        context.AssetTypes.Add(assetType);
        context.RolloutSessions.Add(session);
        context.RolloutDays.Add(day);
        context.RolloutWorkplaces.Add(workplace);
        context.WorkplaceAssetAssignments.AddRange(
            new WorkplaceAssetAssignment
            {
                RolloutWorkplaceId = 1,
                AssetTypeId = 1,
                Status = AssetAssignmentStatus.Pending,
                SerialNumberRequired = true
            },
            new WorkplaceAssetAssignment
            {
                RolloutWorkplaceId = 1,
                AssetTypeId = 1,
                Status = AssetAssignmentStatus.Installed,
                SerialNumberRequired = true,
                SerialNumberCaptured = "SN1"
            },
            new WorkplaceAssetAssignment
            {
                RolloutWorkplaceId = 1,
                AssetTypeId = 1,
                Status = AssetAssignmentStatus.Skipped,
                SerialNumberRequired = false
            }
        );
        await context.SaveChangesAsync();

        // Act
        var summary = await service.GetSummaryAsync(1);

        // Assert
        summary.Should().NotBeNull();
        summary.WorkplaceId.Should().Be(1);
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

        var assetType = new AssetType { Id = 1, Name = "Laptop", Code = "LAP" };
        var session = new RolloutSession { Id = 1, SessionName = "Test" };
        var day = new RolloutDay { Id = 1, RolloutSessionId = 1, DayDate = DateTime.Today };
        var workplace = new RolloutWorkplace
        {
            Id = 1,
            RolloutDayId = 1,
            UserName = "Test",
            TotalItems = 3,
            CompletedItems = 0
        };

        context.AssetTypes.Add(assetType);
        context.RolloutSessions.Add(session);
        context.RolloutDays.Add(day);
        context.RolloutWorkplaces.Add(workplace);
        context.WorkplaceAssetAssignments.AddRange(
            new WorkplaceAssetAssignment
            {
                RolloutWorkplaceId = 1,
                AssetTypeId = 1,
                Status = AssetAssignmentStatus.Pending
            },
            new WorkplaceAssetAssignment
            {
                RolloutWorkplaceId = 1,
                AssetTypeId = 1,
                Status = AssetAssignmentStatus.Pending
            },
            new WorkplaceAssetAssignment
            {
                RolloutWorkplaceId = 1,
                AssetTypeId = 1,
                Status = AssetAssignmentStatus.Installed // Already completed
            }
        );
        await context.SaveChangesAsync();

        // Act
        var completedCount = await service.CompleteWorkplaceAssignmentsAsync(
            1,
            _performedBy,
            _performedByEmail);

        // Assert
        completedCount.Should().Be(2);

        var assignments = context.WorkplaceAssetAssignments.Where(a => a.RolloutWorkplaceId == 1);
        assignments.Should().OnlyContain(a => a.Status == AssetAssignmentStatus.Installed);
    }

    #endregion
}

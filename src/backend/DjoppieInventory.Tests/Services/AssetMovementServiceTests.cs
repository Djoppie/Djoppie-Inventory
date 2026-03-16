using DjoppieInventory.Core.DTOs;
using DjoppieInventory.Core.Entities;
using DjoppieInventory.Core.Entities.Enums;
using DjoppieInventory.Infrastructure.Services;
using DjoppieInventory.Tests.Helpers;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;

namespace DjoppieInventory.Tests.Services;

/// <summary>
/// Unit tests for AssetMovementService.
/// Tests asset deployment, decommission, transfer, and reporting functionality.
/// </summary>
public class AssetMovementServiceTests : IDisposable
{
    private readonly Mock<ILogger<AssetMovementService>> _loggerMock;
    private readonly string _performedBy = "Test User";
    private readonly string _performedByEmail = "test@example.com";

    public AssetMovementServiceTests()
    {
        _loggerMock = new Mock<ILogger<AssetMovementService>>();
    }

    public void Dispose()
    {
        // Cleanup if needed
    }

    #region RecordDeploymentAsync Tests

    [Fact]
    public async Task RecordDeploymentAsync_ValidRequest_CreatesMovementAndUpdatesAsset()
    {
        // Arrange
        await using var context = TestDbContextFactory.CreateInMemoryContext();
        var service = new AssetMovementService(context, _loggerMock.Object);

        var assetType = new AssetType { Id = 1, Name = "Laptop", Code = "LAP" };
        var serviceEntity = new Service { Id = 1, Name = "IT Department" };
        var asset = new Asset
        {
            Id = 1,
            AssetCode = "LAP-24-DELL-00001",
            AssetName = "Dell Latitude",
            Status = AssetStatus.Nieuw,
            SerialNumber = "ABC123",
            AssetTypeId = 1,
            ServiceId = null,
            Owner = null
        };

        var session = new RolloutSession { Id = 1, SessionName = "Test Session" };
        var day = new RolloutDay { Id = 1, RolloutSessionId = 1, DayDate = DateTime.Today };
        var workplace = new RolloutWorkplace
        {
            Id = 1,
            RolloutDayId = 1,
            UserName = "John Doe",
            ServiceId = 1,
            Location = "Office 101"
        };

        context.AssetTypes.Add(assetType);
        context.Services.Add(serviceEntity);
        context.Assets.Add(asset);
        context.RolloutSessions.Add(session);
        context.RolloutDays.Add(day);
        context.RolloutWorkplaces.Add(workplace);
        await context.SaveChangesAsync();

        var request = new AssetDeploymentRequest
        {
            RolloutSessionId = 1,
            RolloutWorkplaceId = 1,
            AssetId = 1,
            NewOwner = "John Doe",
            NewServiceId = 1,
            NewLocation = "Office 101",
            Notes = "Deployed during rollout"
        };

        // Act
        var result = await service.RecordDeploymentAsync(
            request,
            _performedBy,
            _performedByEmail);

        // Assert
        result.Should().NotBeNull();
        result.MovementType.Should().Be(MovementType.Deployed);
        result.PreviousStatus.Should().Be(AssetStatus.Nieuw);
        result.NewStatus.Should().Be(AssetStatus.InGebruik);
        result.NewOwner.Should().Be("John Doe");
        result.NewServiceId.Should().Be(1);
        result.NewLocation.Should().Be("Office 101");
        result.PerformedBy.Should().Be(_performedBy);
        result.PerformedByEmail.Should().Be(_performedByEmail);

        // Verify asset was updated
        var updatedAsset = await context.Assets.FindAsync(1);
        updatedAsset.Should().NotBeNull();
        updatedAsset!.Status.Should().Be(AssetStatus.InGebruik);
        updatedAsset.Owner.Should().Be("John Doe");
        updatedAsset.ServiceId.Should().Be(1);
        updatedAsset.InstallationLocation.Should().Be("Office 101");
        updatedAsset.LastRolloutSessionId.Should().Be(1);
        updatedAsset.InstallationDate.Should().NotBeNull();
    }

    [Fact]
    public async Task RecordDeploymentAsync_AssetNotFound_ThrowsInvalidOperationException()
    {
        // Arrange
        await using var context = TestDbContextFactory.CreateInMemoryContext();
        var service = new AssetMovementService(context, _loggerMock.Object);

        var request = new AssetDeploymentRequest
        {
            RolloutSessionId = 1,
            RolloutWorkplaceId = 1,
            AssetId = 999, // Non-existent asset
            NewOwner = "John Doe",
            NewServiceId = 1,
            NewLocation = "Office 101"
        };

        // Act & Assert
        await Assert.ThrowsAsync<InvalidOperationException>(
            () => service.RecordDeploymentAsync(request, _performedBy, _performedByEmail));
    }

    [Fact]
    public async Task RecordDeploymentAsync_MultipleConcurrentDeployments_AllSucceed()
    {
        // Arrange
        await using var context = TestDbContextFactory.CreateInMemoryContext();
        var service = new AssetMovementService(context, _loggerMock.Object);

        var session = new RolloutSession { Id = 1, SessionName = "Test Session" };
        var day = new RolloutDay { Id = 1, RolloutSessionId = 1, DayDate = DateTime.Today };
        var workplace = new RolloutWorkplace
        {
            Id = 1,
            RolloutDayId = 1,
            UserName = "John Doe",
            ServiceId = 1,
            Location = "Office 101"
        };

        context.RolloutSessions.Add(session);
        context.RolloutDays.Add(day);
        context.RolloutWorkplaces.Add(workplace);

        for (int i = 1; i <= 5; i++)
        {
            context.Assets.Add(new Asset
            {
                Id = i,
                AssetCode = $"LAP-24-DELL-{i:D5}",
                AssetName = $"Dell Laptop {i}",
                Status = AssetStatus.Nieuw,
                SerialNumber = $"SN{i}",
                AssetTypeId = 1
            });
        }

        await context.SaveChangesAsync();

        var requests = Enumerable.Range(1, 5).Select(i => new AssetDeploymentRequest
        {
            RolloutSessionId = 1,
            RolloutWorkplaceId = 1,
            AssetId = i,
            NewOwner = "John Doe",
            NewServiceId = 1,
            NewLocation = "Office 101"
        });

        // Act
        var tasks = requests.Select(r =>
            service.RecordDeploymentAsync(r, _performedBy, _performedByEmail));
        var results = await Task.WhenAll(tasks);

        // Assert
        results.Should().HaveCount(5);
        results.Should().OnlyContain(r => r.MovementType == MovementType.Deployed);

        var movements = context.RolloutAssetMovements.ToList();
        movements.Should().HaveCount(5);
    }

    #endregion

    #region RecordDecommissionAsync Tests

    [Fact]
    public async Task RecordDecommissionAsync_ValidRequest_CreatesMovementAndUpdatesAsset()
    {
        // Arrange
        await using var context = TestDbContextFactory.CreateInMemoryContext();
        var service = new AssetMovementService(context, _loggerMock.Object);

        var serviceEntity = new Service { Id = 1, Name = "IT Department" };
        var asset = new Asset
        {
            Id = 1,
            AssetCode = "LAP-24-DELL-00001",
            AssetName = "Dell Latitude",
            Status = AssetStatus.InGebruik,
            SerialNumber = "ABC123",
            Owner = "John Doe",
            ServiceId = 1,
            InstallationLocation = "Office 101"
        };

        var session = new RolloutSession { Id = 1, SessionName = "Test Session" };
        var day = new RolloutDay { Id = 1, RolloutSessionId = 1, DayDate = DateTime.Today };
        var workplace = new RolloutWorkplace
        {
            Id = 1,
            RolloutDayId = 1,
            UserName = "John Doe",
            ServiceId = 1
        };

        context.Services.Add(serviceEntity);
        context.Assets.Add(asset);
        context.RolloutSessions.Add(session);
        context.RolloutDays.Add(day);
        context.RolloutWorkplaces.Add(workplace);
        await context.SaveChangesAsync();

        var request = new AssetDecommissionRequest
        {
            RolloutSessionId = 1,
            RolloutWorkplaceId = 1,
            AssetId = 1,
            TargetStatus = AssetStatus.UitDienst,
            Notes = "Device replaced"
        };

        // Act
        var result = await service.RecordDecommissionAsync(
            request,
            _performedBy,
            _performedByEmail);

        // Assert
        result.Should().NotBeNull();
        result.MovementType.Should().Be(MovementType.Decommissioned);
        result.PreviousStatus.Should().Be(AssetStatus.InGebruik);
        result.NewStatus.Should().Be(AssetStatus.UitDienst);
        result.PreviousOwner.Should().Be("John Doe");
        result.NewOwner.Should().BeNull();

        // Verify asset was updated
        var updatedAsset = await context.Assets.FindAsync(1);
        updatedAsset.Should().NotBeNull();
        updatedAsset!.Status.Should().Be(AssetStatus.UitDienst);
        updatedAsset.Owner.Should().BeNull();
        updatedAsset.ServiceId.Should().BeNull();
        updatedAsset.InstallationLocation.Should().BeNull();
        updatedAsset.CurrentWorkplaceAssignmentId.Should().BeNull();
    }

    [Fact]
    public async Task RecordDecommissionAsync_InvalidTargetStatus_ThrowsArgumentException()
    {
        // Arrange
        await using var context = TestDbContextFactory.CreateInMemoryContext();
        var service = new AssetMovementService(context, _loggerMock.Object);

        var asset = new Asset
        {
            Id = 1,
            AssetCode = "LAP-24-DELL-00001",
            Status = AssetStatus.InGebruik,
            SerialNumber = "ABC123"
        };

        context.Assets.Add(asset);
        await context.SaveChangesAsync();

        var request = new AssetDecommissionRequest
        {
            RolloutSessionId = 1,
            RolloutWorkplaceId = 1,
            AssetId = 1,
            TargetStatus = AssetStatus.Stock // Invalid target status
        };

        // Act & Assert
        var exception = await Assert.ThrowsAsync<ArgumentException>(
            () => service.RecordDecommissionAsync(request, _performedBy, _performedByEmail));

        exception.Message.Should().Contain("Target status must be UitDienst or Defect");
    }

    [Theory]
    [InlineData(AssetStatus.UitDienst)]
    [InlineData(AssetStatus.Defect)]
    public async Task RecordDecommissionAsync_ValidTargetStatuses_Succeed(AssetStatus targetStatus)
    {
        // Arrange
        await using var context = TestDbContextFactory.CreateInMemoryContext();
        var service = new AssetMovementService(context, _loggerMock.Object);

        var asset = new Asset
        {
            Id = 1,
            AssetCode = "LAP-24-DELL-00001",
            Status = AssetStatus.InGebruik,
            SerialNumber = "ABC123"
        };

        var session = new RolloutSession { Id = 1, SessionName = "Test Session" };
        var day = new RolloutDay { Id = 1, RolloutSessionId = 1, DayDate = DateTime.Today };
        var workplace = new RolloutWorkplace { Id = 1, RolloutDayId = 1, UserName = "Test" };

        context.Assets.Add(asset);
        context.RolloutSessions.Add(session);
        context.RolloutDays.Add(day);
        context.RolloutWorkplaces.Add(workplace);
        await context.SaveChangesAsync();

        var request = new AssetDecommissionRequest
        {
            RolloutSessionId = 1,
            RolloutWorkplaceId = 1,
            AssetId = 1,
            TargetStatus = targetStatus
        };

        // Act
        var result = await service.RecordDecommissionAsync(
            request,
            _performedBy,
            _performedByEmail);

        // Assert
        result.Should().NotBeNull();
        result.NewStatus.Should().Be(targetStatus);
    }

    #endregion

    #region RecordTransferAsync Tests

    [Fact]
    public async Task RecordTransferAsync_ValidRequest_CreatesMovementAndUpdatesAsset()
    {
        // Arrange
        await using var context = TestDbContextFactory.CreateInMemoryContext();
        var service = new AssetMovementService(context, _loggerMock.Object);

        var service1 = new Service { Id = 1, Name = "IT Department" };
        var service2 = new Service { Id = 2, Name = "Finance Department" };
        var asset = new Asset
        {
            Id = 1,
            AssetCode = "LAP-24-DELL-00001",
            Status = AssetStatus.InGebruik,
            SerialNumber = "ABC123",
            Owner = "John Doe",
            ServiceId = 1,
            InstallationLocation = "Office 101"
        };

        var session = new RolloutSession { Id = 1, SessionName = "Test Session" };
        var day = new RolloutDay { Id = 1, RolloutSessionId = 1, DayDate = DateTime.Today };
        var workplace = new RolloutWorkplace { Id = 1, RolloutDayId = 1, UserName = "Jane Doe" };

        context.Services.AddRange(service1, service2);
        context.Assets.Add(asset);
        context.RolloutSessions.Add(session);
        context.RolloutDays.Add(day);
        context.RolloutWorkplaces.Add(workplace);
        await context.SaveChangesAsync();

        var request = new AssetTransferRequest
        {
            RolloutSessionId = 1,
            RolloutWorkplaceId = 1,
            AssetId = 1,
            NewOwner = "Jane Doe",
            NewServiceId = 2,
            NewLocation = "Office 202",
            Notes = "Transfer to Finance"
        };

        // Act
        var result = await service.RecordTransferAsync(
            request,
            _performedBy,
            _performedByEmail);

        // Assert
        result.Should().NotBeNull();
        result.MovementType.Should().Be(MovementType.Transferred);
        result.PreviousOwner.Should().Be("John Doe");
        result.NewOwner.Should().Be("Jane Doe");
        result.PreviousServiceId.Should().Be(1);
        result.NewServiceId.Should().Be(2);
        result.PreviousLocation.Should().Be("Office 101");
        result.NewLocation.Should().Be("Office 202");

        // Verify asset was updated
        var updatedAsset = await context.Assets.FindAsync(1);
        updatedAsset.Should().NotBeNull();
        updatedAsset!.Owner.Should().Be("Jane Doe");
        updatedAsset.ServiceId.Should().Be(2);
        updatedAsset.InstallationLocation.Should().Be("Office 202");
    }

    [Fact]
    public async Task RecordTransferAsync_PartialUpdate_OnlyUpdatesProvidedFields()
    {
        // Arrange
        await using var context = TestDbContextFactory.CreateInMemoryContext();
        var service = new AssetMovementService(context, _loggerMock.Object);

        var asset = new Asset
        {
            Id = 1,
            AssetCode = "LAP-24-DELL-00001",
            Status = AssetStatus.InGebruik,
            SerialNumber = "ABC123",
            Owner = "John Doe",
            ServiceId = 1,
            InstallationLocation = "Office 101"
        };

        var session = new RolloutSession { Id = 1, SessionName = "Test Session" };
        var day = new RolloutDay { Id = 1, RolloutSessionId = 1, DayDate = DateTime.Today };
        var workplace = new RolloutWorkplace { Id = 1, RolloutDayId = 1, UserName = "Test" };

        context.Assets.Add(asset);
        context.RolloutSessions.Add(session);
        context.RolloutDays.Add(day);
        context.RolloutWorkplaces.Add(workplace);
        await context.SaveChangesAsync();

        var request = new AssetTransferRequest
        {
            RolloutSessionId = 1,
            RolloutWorkplaceId = 1,
            AssetId = 1,
            NewOwner = "Jane Doe",
            // NewServiceId and NewLocation are null - should keep existing values
        };

        // Act
        var result = await service.RecordTransferAsync(
            request,
            _performedBy,
            _performedByEmail);

        // Assert
        var updatedAsset = await context.Assets.FindAsync(1);
        updatedAsset!.Owner.Should().Be("Jane Doe");
        updatedAsset.ServiceId.Should().Be(1); // Unchanged
        updatedAsset.InstallationLocation.Should().Be("Office 101"); // Unchanged
    }

    #endregion

    #region GetMovementsBySessionAsync Tests

    [Fact]
    public async Task GetMovementsBySessionAsync_HasMovements_ReturnsAllMovements()
    {
        // Arrange
        await using var context = TestDbContextFactory.CreateInMemoryContext();
        var service = new AssetMovementService(context, _loggerMock.Object);

        var session = new RolloutSession { Id = 1, SessionName = "Test Session" };
        var asset1 = new Asset { Id = 1, AssetCode = "LAP-001", SerialNumber = "SN1" };
        var asset2 = new Asset { Id = 2, AssetCode = "LAP-002", SerialNumber = "SN2" };

        context.RolloutSessions.Add(session);
        context.Assets.AddRange(asset1, asset2);
        context.RolloutAssetMovements.AddRange(
            new RolloutAssetMovement
            {
                Id = 1,
                RolloutSessionId = 1,
                AssetId = 1,
                MovementType = MovementType.Deployed,
                PreviousStatus = AssetStatus.Nieuw,
                NewStatus = AssetStatus.InGebruik,
                PerformedBy = _performedBy,
                PerformedByEmail = _performedByEmail,
                PerformedAt = DateTime.UtcNow.AddHours(-2)
            },
            new RolloutAssetMovement
            {
                Id = 2,
                RolloutSessionId = 1,
                AssetId = 2,
                MovementType = MovementType.Deployed,
                PreviousStatus = AssetStatus.Nieuw,
                NewStatus = AssetStatus.InGebruik,
                PerformedBy = _performedBy,
                PerformedByEmail = _performedByEmail,
                PerformedAt = DateTime.UtcNow.AddHours(-1)
            }
        );
        await context.SaveChangesAsync();

        // Act
        var results = await service.GetMovementsBySessionAsync(1);

        // Assert
        results.Should().HaveCount(2);
        results.Should().BeInDescendingOrder(m => m.PerformedAt);
    }

    [Fact]
    public async Task GetMovementsBySessionAsync_NoMovements_ReturnsEmptyList()
    {
        // Arrange
        await using var context = TestDbContextFactory.CreateInMemoryContext();
        var service = new AssetMovementService(context, _loggerMock.Object);

        var session = new RolloutSession { Id = 1, SessionName = "Test Session" };
        context.RolloutSessions.Add(session);
        await context.SaveChangesAsync();

        // Act
        var results = await service.GetMovementsBySessionAsync(1);

        // Assert
        results.Should().BeEmpty();
    }

    #endregion

    #region GetMovementSummaryAsync Tests

    [Fact]
    public async Task GetMovementSummaryAsync_ValidSession_ReturnsCompleteSummary()
    {
        // Arrange
        await using var context = TestDbContextFactory.CreateInMemoryContext();
        var service = new AssetMovementService(context, _loggerMock.Object);

        var session = new RolloutSession { Id = 1, SessionName = "Test Session" };
        var assetType = new AssetType { Id = 1, Name = "Laptop", Code = "LAP" };
        var serviceEntity = new Service { Id = 1, Name = "IT Department" };

        var asset1 = new Asset
        {
            Id = 1,
            AssetCode = "LAP-001",
            SerialNumber = "SN1",
            AssetTypeId = 1
        };

        context.RolloutSessions.Add(session);
        context.AssetTypes.Add(assetType);
        context.Services.Add(serviceEntity);
        context.Assets.Add(asset1);
        context.RolloutAssetMovements.AddRange(
            new RolloutAssetMovement
            {
                Id = 1,
                RolloutSessionId = 1,
                AssetId = 1,
                MovementType = MovementType.Deployed,
                PreviousStatus = AssetStatus.Nieuw,
                NewStatus = AssetStatus.InGebruik,
                NewServiceId = 1,
                PerformedBy = "Tech1",
                PerformedByEmail = "tech1@example.com",
                PerformedAt = DateTime.UtcNow
            },
            new RolloutAssetMovement
            {
                Id = 2,
                RolloutSessionId = 1,
                AssetId = 1,
                MovementType = MovementType.Decommissioned,
                PreviousStatus = AssetStatus.InGebruik,
                NewStatus = AssetStatus.UitDienst,
                PerformedBy = "Tech2",
                PerformedByEmail = "tech2@example.com",
                PerformedAt = DateTime.UtcNow
            }
        );
        await context.SaveChangesAsync();

        // Act
        var summary = await service.GetMovementSummaryAsync(1);

        // Assert
        summary.Should().NotBeNull();
        summary.RolloutSessionId.Should().Be(1);
        summary.SessionName.Should().Be("Test Session");
        summary.TotalMovements.Should().Be(2);
        summary.Deployments.Should().Be(1);
        summary.Decommissions.Should().Be(1);
        summary.Transfers.Should().Be(0);
        summary.ByAssetType.Should().HaveCount(1);
        summary.ByService.Should().HaveCount(1);
        summary.ByTechnician.Should().HaveCount(2);
        summary.ByDate.Should().NotBeEmpty();
    }

    [Fact]
    public async Task GetMovementSummaryAsync_SessionNotFound_ThrowsInvalidOperationException()
    {
        // Arrange
        await using var context = TestDbContextFactory.CreateInMemoryContext();
        var service = new AssetMovementService(context, _loggerMock.Object);

        // Act & Assert
        await Assert.ThrowsAsync<InvalidOperationException>(
            () => service.GetMovementSummaryAsync(999));
    }

    #endregion

    #region ExportToCsvAsync Tests

    [Fact]
    public async Task ExportToCsvAsync_HasMovements_ReturnsValidCsv()
    {
        // Arrange
        await using var context = TestDbContextFactory.CreateInMemoryContext();
        var service = new AssetMovementService(context, _loggerMock.Object);

        var session = new RolloutSession { Id = 1, SessionName = "Test Session" };
        var asset = new Asset
        {
            Id = 1,
            AssetCode = "LAP-001",
            AssetName = "Test Laptop",
            SerialNumber = "SN1"
        };

        context.RolloutSessions.Add(session);
        context.Assets.Add(asset);
        context.RolloutAssetMovements.Add(new RolloutAssetMovement
        {
            Id = 1,
            RolloutSessionId = 1,
            AssetId = 1,
            MovementType = MovementType.Deployed,
            PreviousStatus = AssetStatus.Nieuw,
            NewStatus = AssetStatus.InGebruik,
            PerformedBy = _performedBy,
            PerformedByEmail = _performedByEmail,
            PerformedAt = DateTime.UtcNow,
            SerialNumber = "SN1"
        });
        await context.SaveChangesAsync();

        // Act
        var csv = await service.ExportToCsvAsync(1);

        // Assert
        csv.Should().NotBeNullOrEmpty();
        csv.Should().Contain("Id,MovementType,AssetCode");
        csv.Should().Contain("LAP-001");
        csv.Should().Contain("Test Laptop");
        csv.Should().Contain("SN1");
    }

    [Fact]
    public async Task ExportToCsvAsync_EscapesSpecialCharacters_Properly()
    {
        // Arrange
        await using var context = TestDbContextFactory.CreateInMemoryContext();
        var service = new AssetMovementService(context, _loggerMock.Object);

        var session = new RolloutSession { Id = 1, SessionName = "Test Session" };
        var asset = new Asset
        {
            Id = 1,
            AssetCode = "LAP-001",
            AssetName = "Test, Laptop with \"quotes\"",
            SerialNumber = "SN1"
        };

        context.RolloutSessions.Add(session);
        context.Assets.Add(asset);
        context.RolloutAssetMovements.Add(new RolloutAssetMovement
        {
            Id = 1,
            RolloutSessionId = 1,
            AssetId = 1,
            MovementType = MovementType.Deployed,
            PreviousStatus = AssetStatus.Nieuw,
            NewStatus = AssetStatus.InGebruik,
            PerformedBy = _performedBy,
            PerformedByEmail = _performedByEmail,
            PerformedAt = DateTime.UtcNow,
            SerialNumber = "SN1",
            Notes = "Contains, comma and \"quotes\""
        });
        await context.SaveChangesAsync();

        // Act
        var csv = await service.ExportToCsvAsync(1);

        // Assert
        csv.Should().Contain("\"Test, Laptop with \"\"quotes\"\"\"");
        csv.Should().Contain("\"Contains, comma and \"\"quotes\"\"\"");
    }

    #endregion

    #region GetMovementsByDateRangeAsync Tests

    [Fact]
    public async Task GetMovementsByDateRangeAsync_FiltersByDateRange_ReturnsMatchingMovements()
    {
        // Arrange
        await using var context = TestDbContextFactory.CreateInMemoryContext();
        var service = new AssetMovementService(context, _loggerMock.Object);

        var session = new RolloutSession { Id = 1, SessionName = "Test Session" };
        var asset = new Asset { Id = 1, AssetCode = "LAP-001", SerialNumber = "SN1" };

        var startDate = new DateTime(2024, 1, 1);
        var endDate = new DateTime(2024, 1, 31);

        context.RolloutSessions.Add(session);
        context.Assets.Add(asset);
        context.RolloutAssetMovements.AddRange(
            new RolloutAssetMovement
            {
                Id = 1,
                RolloutSessionId = 1,
                AssetId = 1,
                MovementType = MovementType.Deployed,
                PreviousStatus = AssetStatus.Nieuw,
                NewStatus = AssetStatus.InGebruik,
                PerformedBy = _performedBy,
                PerformedByEmail = _performedByEmail,
                PerformedAt = new DateTime(2024, 1, 15) // Within range
            },
            new RolloutAssetMovement
            {
                Id = 2,
                RolloutSessionId = 1,
                AssetId = 1,
                MovementType = MovementType.Deployed,
                PreviousStatus = AssetStatus.Nieuw,
                NewStatus = AssetStatus.InGebruik,
                PerformedBy = _performedBy,
                PerformedByEmail = _performedByEmail,
                PerformedAt = new DateTime(2024, 2, 15) // Outside range
            }
        );
        await context.SaveChangesAsync();

        // Act
        var results = await service.GetMovementsByDateRangeAsync(startDate, endDate);

        // Assert
        results.Should().HaveCount(1);
        results.First().Id.Should().Be(1);
    }

    [Fact]
    public async Task GetMovementsByDateRangeAsync_FiltersByMovementType_ReturnsMatchingMovements()
    {
        // Arrange
        await using var context = TestDbContextFactory.CreateInMemoryContext();
        var service = new AssetMovementService(context, _loggerMock.Object);

        var session = new RolloutSession { Id = 1, SessionName = "Test Session" };
        var asset = new Asset { Id = 1, AssetCode = "LAP-001", SerialNumber = "SN1" };

        var startDate = new DateTime(2024, 1, 1);
        var endDate = new DateTime(2024, 12, 31);

        context.RolloutSessions.Add(session);
        context.Assets.Add(asset);
        context.RolloutAssetMovements.AddRange(
            new RolloutAssetMovement
            {
                Id = 1,
                RolloutSessionId = 1,
                AssetId = 1,
                MovementType = MovementType.Deployed,
                PreviousStatus = AssetStatus.Nieuw,
                NewStatus = AssetStatus.InGebruik,
                PerformedBy = _performedBy,
                PerformedByEmail = _performedByEmail,
                PerformedAt = new DateTime(2024, 1, 15)
            },
            new RolloutAssetMovement
            {
                Id = 2,
                RolloutSessionId = 1,
                AssetId = 1,
                MovementType = MovementType.Decommissioned,
                PreviousStatus = AssetStatus.InGebruik,
                NewStatus = AssetStatus.UitDienst,
                PerformedBy = _performedBy,
                PerformedByEmail = _performedByEmail,
                PerformedAt = new DateTime(2024, 1, 20)
            }
        );
        await context.SaveChangesAsync();

        // Act
        var results = await service.GetMovementsByDateRangeAsync(
            startDate,
            endDate,
            MovementType.Deployed);

        // Assert
        results.Should().HaveCount(1);
        results.First().MovementType.Should().Be(MovementType.Deployed);
    }

    #endregion
}

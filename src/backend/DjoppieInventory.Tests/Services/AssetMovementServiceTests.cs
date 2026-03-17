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

        var assetType = new AssetType { Name = "Laptop", Code = "LAP" };
        var serviceEntity = new Service { Name = "IT Department", Code = "IT" };
        context.AssetTypes.Add(assetType);
        context.Services.Add(serviceEntity);
        await context.SaveChangesAsync();

        var asset = new Asset
        {
            AssetCode = "LAP-24-DELL-00001",
            AssetName = "Dell Latitude",
            Status = AssetStatus.Nieuw,
            SerialNumber = "ABC123",
            AssetTypeId = assetType.Id,
            ServiceId = null,
            Owner = null
        };
        context.Assets.Add(asset);

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
            ServiceId = serviceEntity.Id,
            Location = "Office 101"
        };
        context.RolloutWorkplaces.Add(workplace);
        await context.SaveChangesAsync();

        var request = new AssetDeploymentRequest
        {
            RolloutSessionId = session.Id,
            RolloutWorkplaceId = workplace.Id,
            AssetId = asset.Id,
            NewOwner = "John Doe",
            NewServiceId = serviceEntity.Id,
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
        result.NewServiceId.Should().Be(serviceEntity.Id);
        result.NewLocation.Should().Be("Office 101");
        result.PerformedBy.Should().Be(_performedBy);
        result.PerformedByEmail.Should().Be(_performedByEmail);

        // Verify asset was updated
        var updatedAsset = await context.Assets.FindAsync(asset.Id);
        updatedAsset.Should().NotBeNull();
        updatedAsset!.Status.Should().Be(AssetStatus.InGebruik);
        updatedAsset.Owner.Should().Be("John Doe");
        updatedAsset.ServiceId.Should().Be(serviceEntity.Id);
        updatedAsset.InstallationLocation.Should().Be("Office 101");
        updatedAsset.LastRolloutSessionId.Should().Be(session.Id);
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

        var assetType = new AssetType { Name = "Laptop", Code = "LAP" };
        var serviceEntity = new Service { Name = "IT Department", Code = "IT" };
        context.AssetTypes.Add(assetType);
        context.Services.Add(serviceEntity);
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
            ServiceId = serviceEntity.Id,
            Location = "Office 101"
        };
        context.RolloutWorkplaces.Add(workplace);
        await context.SaveChangesAsync();

        var assets = new List<Asset>();
        for (int i = 1; i <= 5; i++)
        {
            var asset = new Asset
            {
                AssetCode = $"LAP-24-DELL-{i:D5}",
                AssetName = $"Dell Laptop {i}",
                Status = AssetStatus.Nieuw,
                SerialNumber = $"SN{i}",
                AssetTypeId = assetType.Id
            };
            assets.Add(asset);
            context.Assets.Add(asset);
        }
        await context.SaveChangesAsync();

        var requests = assets.Select(a => new AssetDeploymentRequest
        {
            RolloutSessionId = session.Id,
            RolloutWorkplaceId = workplace.Id,
            AssetId = a.Id,
            NewOwner = "John Doe",
            NewServiceId = serviceEntity.Id,
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

        var serviceEntity = new Service { Name = "IT Department", Code = "IT" };
        context.Services.Add(serviceEntity);
        await context.SaveChangesAsync();

        var asset = new Asset
        {
            AssetCode = "LAP-24-DELL-00001",
            AssetName = "Dell Latitude",
            Status = AssetStatus.InGebruik,
            SerialNumber = "ABC123",
            Owner = "John Doe",
            ServiceId = serviceEntity.Id,
            InstallationLocation = "Office 101"
        };
        context.Assets.Add(asset);

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
            ServiceId = serviceEntity.Id
        };
        context.RolloutWorkplaces.Add(workplace);
        await context.SaveChangesAsync();

        var request = new AssetDecommissionRequest
        {
            RolloutSessionId = session.Id,
            RolloutWorkplaceId = workplace.Id,
            AssetId = asset.Id,
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
        var updatedAsset = await context.Assets.FindAsync(asset.Id);
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
            AssetId = asset.Id,
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
            AssetCode = "LAP-24-DELL-00001",
            Status = AssetStatus.InGebruik,
            SerialNumber = "ABC123"
        };
        context.Assets.Add(asset);

        var session = new RolloutSession { SessionName = "Test Session" };
        context.RolloutSessions.Add(session);
        await context.SaveChangesAsync();

        var day = new RolloutDay { RolloutSessionId = session.Id, Date = DateTime.Today };
        context.RolloutDays.Add(day);
        await context.SaveChangesAsync();

        var workplace = new RolloutWorkplace { RolloutDayId = day.Id, UserName = "Test" };
        context.RolloutWorkplaces.Add(workplace);
        await context.SaveChangesAsync();

        var request = new AssetDecommissionRequest
        {
            RolloutSessionId = session.Id,
            RolloutWorkplaceId = workplace.Id,
            AssetId = asset.Id,
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

        var service1 = new Service { Name = "IT Department", Code = "IT" };
        var service2 = new Service { Name = "Finance Department", Code = "FIN" };
        context.Services.AddRange(service1, service2);
        await context.SaveChangesAsync();

        var asset = new Asset
        {
            AssetCode = "LAP-24-DELL-00001",
            Status = AssetStatus.InGebruik,
            SerialNumber = "ABC123",
            Owner = "John Doe",
            ServiceId = service1.Id,
            InstallationLocation = "Office 101"
        };
        context.Assets.Add(asset);

        var session = new RolloutSession { SessionName = "Test Session" };
        context.RolloutSessions.Add(session);
        await context.SaveChangesAsync();

        var day = new RolloutDay { RolloutSessionId = session.Id, Date = DateTime.Today };
        context.RolloutDays.Add(day);
        await context.SaveChangesAsync();

        var workplace = new RolloutWorkplace { RolloutDayId = day.Id, UserName = "Jane Doe" };
        context.RolloutWorkplaces.Add(workplace);
        await context.SaveChangesAsync();

        var request = new AssetTransferRequest
        {
            RolloutSessionId = session.Id,
            RolloutWorkplaceId = workplace.Id,
            AssetId = asset.Id,
            NewOwner = "Jane Doe",
            NewServiceId = service2.Id,
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
        result.PreviousServiceId.Should().Be(service1.Id);
        result.NewServiceId.Should().Be(service2.Id);
        result.PreviousLocation.Should().Be("Office 101");
        result.NewLocation.Should().Be("Office 202");

        // Verify asset was updated
        var updatedAsset = await context.Assets.FindAsync(asset.Id);
        updatedAsset.Should().NotBeNull();
        updatedAsset!.Owner.Should().Be("Jane Doe");
        updatedAsset.ServiceId.Should().Be(service2.Id);
        updatedAsset.InstallationLocation.Should().Be("Office 202");
    }

    [Fact]
    public async Task RecordTransferAsync_PartialUpdate_OnlyUpdatesProvidedFields()
    {
        // Arrange
        await using var context = TestDbContextFactory.CreateInMemoryContext();
        var service = new AssetMovementService(context, _loggerMock.Object);

        var serviceEntity = new Service { Name = "IT Department", Code = "IT" };
        context.Services.Add(serviceEntity);
        await context.SaveChangesAsync();

        var asset = new Asset
        {
            AssetCode = "LAP-24-DELL-00001",
            Status = AssetStatus.InGebruik,
            SerialNumber = "ABC123",
            Owner = "John Doe",
            ServiceId = serviceEntity.Id,
            InstallationLocation = "Office 101"
        };
        context.Assets.Add(asset);

        var session = new RolloutSession { SessionName = "Test Session" };
        context.RolloutSessions.Add(session);
        await context.SaveChangesAsync();

        var day = new RolloutDay { RolloutSessionId = session.Id, Date = DateTime.Today };
        context.RolloutDays.Add(day);
        await context.SaveChangesAsync();

        var workplace = new RolloutWorkplace { RolloutDayId = day.Id, UserName = "Test" };
        context.RolloutWorkplaces.Add(workplace);
        await context.SaveChangesAsync();

        var request = new AssetTransferRequest
        {
            RolloutSessionId = session.Id,
            RolloutWorkplaceId = workplace.Id,
            AssetId = asset.Id,
            NewOwner = "Jane Doe",
            // NewServiceId and NewLocation are null - should keep existing values
        };

        // Act
        var result = await service.RecordTransferAsync(
            request,
            _performedBy,
            _performedByEmail);

        // Assert
        var updatedAsset = await context.Assets.FindAsync(asset.Id);
        updatedAsset!.Owner.Should().Be("Jane Doe");
        updatedAsset.ServiceId.Should().Be(serviceEntity.Id); // Unchanged
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

        var session = new RolloutSession { SessionName = "Test Session" };
        context.RolloutSessions.Add(session);
        await context.SaveChangesAsync();

        var asset1 = new Asset { AssetCode = "LAP-001", SerialNumber = "SN1" };
        var asset2 = new Asset { AssetCode = "LAP-002", SerialNumber = "SN2" };
        context.Assets.AddRange(asset1, asset2);
        await context.SaveChangesAsync();

        context.RolloutAssetMovements.AddRange(
            new RolloutAssetMovement
            {
                RolloutSessionId = session.Id,
                AssetId = asset1.Id,
                MovementType = MovementType.Deployed,
                PreviousStatus = AssetStatus.Nieuw,
                NewStatus = AssetStatus.InGebruik,
                PerformedBy = _performedBy,
                PerformedByEmail = _performedByEmail,
                PerformedAt = DateTime.UtcNow.AddHours(-2)
            },
            new RolloutAssetMovement
            {
                RolloutSessionId = session.Id,
                AssetId = asset2.Id,
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
        var results = await service.GetMovementsBySessionAsync(session.Id);

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

        var session = new RolloutSession { SessionName = "Test Session" };
        context.RolloutSessions.Add(session);
        await context.SaveChangesAsync();

        // Act
        var results = await service.GetMovementsBySessionAsync(session.Id);

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

        var assetType = new AssetType { Name = "Laptop", Code = "LAP" };
        var serviceEntity = new Service { Name = "IT Department", Code = "IT" };
        context.AssetTypes.Add(assetType);
        context.Services.Add(serviceEntity);
        await context.SaveChangesAsync();

        var session = new RolloutSession { SessionName = "Test Session" };
        context.RolloutSessions.Add(session);
        await context.SaveChangesAsync();

        var asset1 = new Asset
        {
            AssetCode = "LAP-001",
            SerialNumber = "SN1",
            AssetTypeId = assetType.Id
        };
        context.Assets.Add(asset1);
        await context.SaveChangesAsync();

        context.RolloutAssetMovements.AddRange(
            new RolloutAssetMovement
            {
                RolloutSessionId = session.Id,
                AssetId = asset1.Id,
                MovementType = MovementType.Deployed,
                PreviousStatus = AssetStatus.Nieuw,
                NewStatus = AssetStatus.InGebruik,
                NewServiceId = serviceEntity.Id,
                PerformedBy = "Tech1",
                PerformedByEmail = "tech1@example.com",
                PerformedAt = DateTime.UtcNow
            },
            new RolloutAssetMovement
            {
                RolloutSessionId = session.Id,
                AssetId = asset1.Id,
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
        var summary = await service.GetMovementSummaryAsync(session.Id);

        // Assert
        summary.Should().NotBeNull();
        summary.RolloutSessionId.Should().Be(session.Id);
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

        var session = new RolloutSession { SessionName = "Test Session" };
        context.RolloutSessions.Add(session);
        await context.SaveChangesAsync();

        var asset = new Asset
        {
            AssetCode = "LAP-001",
            AssetName = "Test Laptop",
            SerialNumber = "SN1"
        };
        context.Assets.Add(asset);
        await context.SaveChangesAsync();

        context.RolloutAssetMovements.Add(new RolloutAssetMovement
        {
            RolloutSessionId = session.Id,
            AssetId = asset.Id,
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
        var csv = await service.ExportToCsvAsync(session.Id);

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

        var session = new RolloutSession { SessionName = "Test Session" };
        context.RolloutSessions.Add(session);
        await context.SaveChangesAsync();

        var asset = new Asset
        {
            AssetCode = "LAP-001",
            AssetName = "Test, Laptop with \"quotes\"",
            SerialNumber = "SN1"
        };
        context.Assets.Add(asset);
        await context.SaveChangesAsync();

        context.RolloutAssetMovements.Add(new RolloutAssetMovement
        {
            RolloutSessionId = session.Id,
            AssetId = asset.Id,
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
        var csv = await service.ExportToCsvAsync(session.Id);

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

        var session = new RolloutSession { SessionName = "Test Session" };
        context.RolloutSessions.Add(session);
        await context.SaveChangesAsync();

        var asset = new Asset { AssetCode = "LAP-001", SerialNumber = "SN1" };
        context.Assets.Add(asset);
        await context.SaveChangesAsync();

        var startDate = new DateTime(2024, 1, 1);
        var endDate = new DateTime(2024, 1, 31);

        var movement1 = new RolloutAssetMovement
        {
            RolloutSessionId = session.Id,
            AssetId = asset.Id,
            MovementType = MovementType.Deployed,
            PreviousStatus = AssetStatus.Nieuw,
            NewStatus = AssetStatus.InGebruik,
            PerformedBy = _performedBy,
            PerformedByEmail = _performedByEmail,
            PerformedAt = new DateTime(2024, 1, 15) // Within range
        };
        var movement2 = new RolloutAssetMovement
        {
            RolloutSessionId = session.Id,
            AssetId = asset.Id,
            MovementType = MovementType.Deployed,
            PreviousStatus = AssetStatus.Nieuw,
            NewStatus = AssetStatus.InGebruik,
            PerformedBy = _performedBy,
            PerformedByEmail = _performedByEmail,
            PerformedAt = new DateTime(2024, 2, 15) // Outside range
        };
        context.RolloutAssetMovements.AddRange(movement1, movement2);
        await context.SaveChangesAsync();

        // Act
        var results = await service.GetMovementsByDateRangeAsync(startDate, endDate);

        // Assert
        results.Should().HaveCount(1);
        results.First().Id.Should().Be(movement1.Id);
    }

    [Fact]
    public async Task GetMovementsByDateRangeAsync_FiltersByMovementType_ReturnsMatchingMovements()
    {
        // Arrange
        await using var context = TestDbContextFactory.CreateInMemoryContext();
        var service = new AssetMovementService(context, _loggerMock.Object);

        var session = new RolloutSession { SessionName = "Test Session" };
        context.RolloutSessions.Add(session);
        await context.SaveChangesAsync();

        var asset = new Asset { AssetCode = "LAP-001", SerialNumber = "SN1" };
        context.Assets.Add(asset);
        await context.SaveChangesAsync();

        var startDate = new DateTime(2024, 1, 1);
        var endDate = new DateTime(2024, 12, 31);

        context.RolloutAssetMovements.AddRange(
            new RolloutAssetMovement
            {
                RolloutSessionId = session.Id,
                AssetId = asset.Id,
                MovementType = MovementType.Deployed,
                PreviousStatus = AssetStatus.Nieuw,
                NewStatus = AssetStatus.InGebruik,
                PerformedBy = _performedBy,
                PerformedByEmail = _performedByEmail,
                PerformedAt = new DateTime(2024, 1, 15)
            },
            new RolloutAssetMovement
            {
                RolloutSessionId = session.Id,
                AssetId = asset.Id,
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

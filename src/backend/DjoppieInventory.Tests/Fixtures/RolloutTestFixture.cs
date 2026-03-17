using DjoppieInventory.Core.Entities;
using DjoppieInventory.Core.Entities.Enums;
using DjoppieInventory.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace DjoppieInventory.Tests.Fixtures;

/// <summary>
/// Test fixture for creating common rollout test data.
/// Provides reusable test data setup for rollout-related tests.
/// </summary>
public static class RolloutTestFixture
{
    /// <summary>
    /// Creates a complete rollout session with days and workplaces.
    /// </summary>
    public static async Task<RolloutSession> CreateFullSessionAsync(
        ApplicationDbContext context,
        int dayCount = 1,
        int workplacesPerDay = 2,
        int? serviceId = null)
    {
        var session = new RolloutSession
        {
            SessionName = "Test Rollout Session",
            Description = "Test rollout for unit tests",
            PlannedStartDate = DateTime.Today,
            PlannedEndDate = DateTime.Today.AddDays(dayCount),
            Status = RolloutSessionStatus.Planning,
            CreatedBy = "Test User",
            CreatedByEmail = "test@example.com",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        context.RolloutSessions.Add(session);
        await context.SaveChangesAsync();

        for (int d = 0; d < dayCount; d++)
        {
            var day = new RolloutDay
            {
                RolloutSessionId = session.Id,
                Date = DateTime.Today.AddDays(d),
                DayNumber = d + 1,
                Status = RolloutDayStatus.Planning,
                TotalWorkplaces = workplacesPerDay,
                CompletedWorkplaces = 0,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            context.RolloutDays.Add(day);
            await context.SaveChangesAsync();

            for (int w = 0; w < workplacesPerDay; w++)
            {
                var workplace = new RolloutWorkplace
                {
                    RolloutDayId = day.Id,
                    UserName = $"User {d + 1}.{w + 1}",
                    UserEmail = $"user{d + 1}.{w + 1}@example.com",
                    ServiceId = serviceId,
                    Location = $"Office {d + 1}{w + 1}",
                    Status = RolloutWorkplaceStatus.Pending,
                    TotalItems = 0,
                    CompletedItems = 0,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                context.RolloutWorkplaces.Add(workplace);
            }

            await context.SaveChangesAsync();
        }

        return session;
    }

    /// <summary>
    /// Creates test asset types for rollout testing.
    /// </summary>
    public static async Task<List<AssetType>> CreateAssetTypesAsync(ApplicationDbContext context)
    {
        var assetTypes = new List<AssetType>
        {
            new() { Name = "Laptop", Code = "LAP", Description = "Laptop computers" },
            new() { Name = "Monitor", Code = "MON", Description = "Display monitors" },
            new() { Name = "Keyboard", Code = "KEY", Description = "Keyboards" },
            new() { Name = "Mouse", Code = "MOU", Description = "Computer mice" }
        };

        context.AssetTypes.AddRange(assetTypes);
        await context.SaveChangesAsync();

        return assetTypes;
    }

    /// <summary>
    /// Creates test asset templates for rollout testing.
    /// </summary>
    public static async Task<List<AssetTemplate>> CreateAssetTemplatesAsync(
        ApplicationDbContext context,
        int assetTypeId)
    {
        var templates = new List<AssetTemplate>
        {
            new()
            {
                TemplateName = "Dell Laptop Standard",
                AssetName = "Dell Latitude 5420",
                Category = "Hardware",
                AssetTypeId = assetTypeId,
                Brand = "Dell",
                Model = "Latitude 5420",
                IsActive = true
            },
            new()
            {
                TemplateName = "HP Laptop Standard",
                AssetName = "HP EliteBook 840",
                Category = "Hardware",
                AssetTypeId = assetTypeId,
                Brand = "HP",
                Model = "EliteBook 840",
                IsActive = true
            }
        };

        context.AssetTemplates.AddRange(templates);
        await context.SaveChangesAsync();

        return templates;
    }

    /// <summary>
    /// Creates test services (departments).
    /// </summary>
    public static async Task<List<Service>> CreateServicesAsync(ApplicationDbContext context)
    {
        var services = new List<Service>
        {
            new()
            {
                Name = "IT Department",
                Code = "IT",
                IsActive = true
            },
            new()
            {
                Name = "Finance Department",
                Code = "FIN",
                IsActive = true
            },
            new()
            {
                Name = "HR Department",
                Code = "HR",
                IsActive = true
            }
        };

        context.Services.AddRange(services);
        await context.SaveChangesAsync();

        return services;
    }

    /// <summary>
    /// Creates test assets with various statuses.
    /// </summary>
    public static async Task<List<Asset>> CreateAssetsAsync(
        ApplicationDbContext context,
        int assetTypeId,
        int count = 5,
        AssetStatus status = AssetStatus.Nieuw)
    {
        var assets = new List<Asset>();

        for (int i = 0; i < count; i++)
        {
            var asset = new Asset
            {
                AssetCode = $"TEST-{DateTime.UtcNow.Year % 100:D2}-TST-{i + 1:D5}",
                AssetName = $"Test Asset {i + 1}",
                Category = "Hardware",
                AssetTypeId = assetTypeId,
                Brand = "TestBrand",
                Model = $"Model{i + 1}",
                SerialNumber = $"SN{i + 1:D5}",
                Status = status,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            assets.Add(asset);
            context.Assets.Add(asset);
        }

        await context.SaveChangesAsync();

        return assets;
    }

    /// <summary>
    /// Creates workplace asset assignments for testing.
    /// </summary>
    public static async Task<List<WorkplaceAssetAssignment>> CreateWorkplaceAssignmentsAsync(
        ApplicationDbContext context,
        int workplaceId,
        int assetTypeId,
        int count = 3)
    {
        var assignments = new List<WorkplaceAssetAssignment>();

        for (int i = 0; i < count; i++)
        {
            var assignment = new WorkplaceAssetAssignment
            {
                RolloutWorkplaceId = workplaceId,
                AssetTypeId = assetTypeId,
                AssignmentCategory = i switch
                {
                    0 => AssignmentCategory.UserAssigned,
                    _ => AssignmentCategory.WorkplaceFixed
                },
                SourceType = i switch
                {
                    0 => AssetSourceType.NewFromTemplate,
                    1 => AssetSourceType.ExistingInventory,
                    _ => AssetSourceType.CreateOnSite
                },
                Position = i,
                Status = AssetAssignmentStatus.Pending,
                SerialNumberRequired = i < 2,
                QRCodeRequired = i < 2,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            assignments.Add(assignment);
            context.WorkplaceAssetAssignments.Add(assignment);
        }

        await context.SaveChangesAsync();

        return assignments;
    }

    /// <summary>
    /// Creates a complete test scenario with session, days, workplaces, and assignments.
    /// </summary>
    public static async Task<RolloutTestScenario> CreateCompleteScenarioAsync(
        ApplicationDbContext context)
    {
        var services = await CreateServicesAsync(context);
        var assetTypes = await CreateAssetTypesAsync(context);
        var laptopType = assetTypes.First(t => t.Code == "LAP");
        var templates = await CreateAssetTemplatesAsync(context, laptopType.Id);
        var assets = await CreateAssetsAsync(context, laptopType.Id, 10, AssetStatus.Nieuw);
        var session = await CreateFullSessionAsync(context, dayCount: 2, workplacesPerDay: 2, serviceId: services.First().Id);

        var day = await context.RolloutDays
            .FirstOrDefaultAsync(d => d.RolloutSessionId == session.Id);

        var workplace = await context.RolloutWorkplaces
            .FirstOrDefaultAsync(w => w.RolloutDayId == day!.Id);

        var assignments = await CreateWorkplaceAssignmentsAsync(
            context,
            workplace!.Id,
            laptopType.Id,
            count: 3);

        return new RolloutTestScenario
        {
            Session = session,
            Days = await context.RolloutDays
                .Where(d => d.RolloutSessionId == session.Id)
                .ToListAsync(),
            Workplaces = await context.RolloutWorkplaces
                .Where(w => day != null && w.RolloutDayId == day.Id)
                .ToListAsync(),
            AssetTypes = assetTypes,
            Templates = templates,
            Assets = assets,
            Services = services,
            Assignments = assignments
        };
    }
}

/// <summary>
/// Complete test scenario with all related entities.
/// </summary>
public class RolloutTestScenario
{
    public RolloutSession Session { get; set; } = null!;
    public List<RolloutDay> Days { get; set; } = new();
    public List<RolloutWorkplace> Workplaces { get; set; } = new();
    public List<AssetType> AssetTypes { get; set; } = new();
    public List<AssetTemplate> Templates { get; set; } = new();
    public List<Asset> Assets { get; set; } = new();
    public List<Service> Services { get; set; } = new();
    public List<WorkplaceAssetAssignment> Assignments { get; set; } = new();
}

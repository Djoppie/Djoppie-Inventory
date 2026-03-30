using DjoppieInventory.Core.DTOs.Rollout;
using DjoppieInventory.Core.Entities;
using DjoppieInventory.Core.Entities.Enums;
using DjoppieInventory.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System.Text.Json;

namespace DjoppieInventory.Infrastructure.Services;

/// <summary>
/// Service for synchronizing AssetPlansJson to WorkplaceAssetAssignment relational model.
/// Enables gradual migration from JSON-based asset plans to proper relational data.
/// </summary>
public class AssetPlanSyncService
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<AssetPlanSyncService> _logger;

    // Cache for asset type lookups
    private Dictionary<string, int>? _assetTypeCache;

    public AssetPlanSyncService(
        ApplicationDbContext context,
        ILogger<AssetPlanSyncService> logger)
    {
        _context = context ?? throw new ArgumentNullException(nameof(context));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    /// <summary>
    /// Synchronizes a single workplace's AssetPlansJson to WorkplaceAssetAssignment records.
    /// Replaces all existing assignments for the workplace.
    /// </summary>
    public async Task SyncWorkplaceAsync(int workplaceId, CancellationToken cancellationToken = default)
    {
        var workplace = await _context.RolloutWorkplaces
            .FirstOrDefaultAsync(w => w.Id == workplaceId, cancellationToken);

        if (workplace == null)
        {
            _logger.LogWarning("Workplace {WorkplaceId} not found for sync", workplaceId);
            return;
        }

        await SyncWorkplaceAsync(workplace, cancellationToken);
    }

    /// <summary>
    /// Synchronizes a workplace's AssetPlansJson to WorkplaceAssetAssignment records.
    /// </summary>
    public async Task SyncWorkplaceAsync(RolloutWorkplace workplace, CancellationToken cancellationToken = default)
    {
        await EnsureAssetTypeCacheAsync(cancellationToken);

        // Parse the JSON
        var assetPlans = ParseAssetPlans(workplace.AssetPlansJson);
        if (assetPlans.Count == 0)
        {
            _logger.LogDebug("Workplace {WorkplaceId} has no asset plans to sync", workplace.Id);
            return;
        }

        // Remove existing assignments
        var existingAssignments = await _context.WorkplaceAssetAssignments
            .Where(a => a.RolloutWorkplaceId == workplace.Id)
            .ToListAsync(cancellationToken);

        if (existingAssignments.Count > 0)
        {
            _context.WorkplaceAssetAssignments.RemoveRange(existingAssignments);
        }

        // Create new assignments from JSON
        var position = 1;
        foreach (var plan in assetPlans)
        {
            var assignment = ConvertToAssignment(workplace.Id, plan, position);
            if (assignment != null)
            {
                _context.WorkplaceAssetAssignments.Add(assignment);
                position++;
            }
        }

        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "Synced {Count} asset assignments for workplace {WorkplaceId}",
            position - 1, workplace.Id);
    }

    /// <summary>
    /// Synchronizes all workplaces in a session from JSON to relational model.
    /// </summary>
    public async Task<int> SyncSessionAsync(int sessionId, CancellationToken cancellationToken = default)
    {
        await EnsureAssetTypeCacheAsync(cancellationToken);

        var workplaces = await _context.RolloutWorkplaces
            .Include(w => w.RolloutDay)
            .Where(w => w.RolloutDay.RolloutSessionId == sessionId)
            .ToListAsync(cancellationToken);

        var syncedCount = 0;
        foreach (var workplace in workplaces)
        {
            await SyncWorkplaceAsync(workplace, cancellationToken);
            syncedCount++;
        }

        _logger.LogInformation(
            "Synced {Count} workplaces for session {SessionId}",
            syncedCount, sessionId);

        return syncedCount;
    }

    /// <summary>
    /// Synchronizes ALL workplaces in the database from JSON to relational model.
    /// Use for initial data migration.
    /// </summary>
    public async Task<MigrationResult> MigrateAllAsync(CancellationToken cancellationToken = default)
    {
        await EnsureAssetTypeCacheAsync(cancellationToken);

        var result = new MigrationResult();

        // Get all workplaces with non-empty AssetPlansJson
        var workplaces = await _context.RolloutWorkplaces
            .Where(w => w.AssetPlansJson != null && w.AssetPlansJson != "[]" && w.AssetPlansJson != "")
            .ToListAsync(cancellationToken);

        result.TotalWorkplaces = workplaces.Count;

        foreach (var workplace in workplaces)
        {
            try
            {
                var assetPlans = ParseAssetPlans(workplace.AssetPlansJson);
                if (assetPlans.Count == 0)
                {
                    result.SkippedWorkplaces++;
                    continue;
                }

                // Remove existing assignments
                var existingAssignments = await _context.WorkplaceAssetAssignments
                    .Where(a => a.RolloutWorkplaceId == workplace.Id)
                    .ToListAsync(cancellationToken);

                _context.WorkplaceAssetAssignments.RemoveRange(existingAssignments);

                // Create new assignments
                var position = 1;
                foreach (var plan in assetPlans)
                {
                    var assignment = ConvertToAssignment(workplace.Id, plan, position);
                    if (assignment != null)
                    {
                        _context.WorkplaceAssetAssignments.Add(assignment);
                        result.TotalAssignments++;
                        position++;
                    }
                }

                result.MigratedWorkplaces++;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to migrate workplace {WorkplaceId}", workplace.Id);
                result.FailedWorkplaces++;
                result.Errors.Add($"Workplace {workplace.Id}: {ex.Message}");
            }
        }

        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "Migration complete: {Migrated}/{Total} workplaces, {Assignments} assignments created, {Failed} failed",
            result.MigratedWorkplaces, result.TotalWorkplaces, result.TotalAssignments, result.FailedWorkplaces);

        return result;
    }

    /// <summary>
    /// Converts an AssetPlanDto to a WorkplaceAssetAssignment entity.
    /// </summary>
    public WorkplaceAssetAssignment? ConvertToAssignment(int workplaceId, AssetPlanDto plan, int position)
    {
        var equipmentType = plan.EquipmentType?.ToLowerInvariant() ?? "";
        var assetTypeId = GetAssetTypeId(equipmentType);

        if (assetTypeId == null)
        {
            _logger.LogWarning(
                "Unknown equipment type '{EquipmentType}' in workplace {WorkplaceId}",
                plan.EquipmentType, workplaceId);
            return null;
        }

        var assignment = new WorkplaceAssetAssignment
        {
            RolloutWorkplaceId = workplaceId,
            AssetTypeId = assetTypeId.Value,
            AssignmentCategory = GetAssignmentCategory(equipmentType),
            SourceType = DetermineSourceType(plan),
            NewAssetId = plan.ExistingAssetId,
            OldAssetId = plan.OldAssetId,
            Position = position,
            SerialNumberRequired = plan.RequiresSerialNumber || ShouldRequireSerial(equipmentType),
            QRCodeRequired = plan.RequiresQRCode,
            Status = MapStatus(plan.Status),
            MetadataJson = plan.Metadata?.Count > 0
                ? JsonSerializer.Serialize(plan.Metadata)
                : null,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        // Copy serial number from metadata if captured
        if (plan.Metadata?.TryGetValue("serialNumber", out var serialNumber) == true)
        {
            assignment.SerialNumberCaptured = serialNumber;
        }

        return assignment;
    }

    /// <summary>
    /// Creates AssetPlanDto list from WorkplaceAssetAssignment entities (reverse mapping).
    /// Used for backward compatibility during migration period.
    /// </summary>
    public async Task<List<AssetPlanDto>> ConvertToAssetPlansAsync(
        int workplaceId,
        CancellationToken cancellationToken = default)
    {
        var assignments = await _context.WorkplaceAssetAssignments
            .Include(a => a.AssetType)
            .Include(a => a.NewAsset)
            .Include(a => a.OldAsset)
            .Where(a => a.RolloutWorkplaceId == workplaceId)
            .OrderBy(a => a.Position)
            .ToListAsync(cancellationToken);

        return assignments.Select(ConvertToAssetPlan).ToList();
    }

    /// <summary>
    /// Converts a WorkplaceAssetAssignment to AssetPlanDto (reverse mapping).
    /// </summary>
    public AssetPlanDto ConvertToAssetPlan(WorkplaceAssetAssignment assignment)
    {
        var metadata = new Dictionary<string, string>();

        // Parse existing metadata
        if (!string.IsNullOrEmpty(assignment.MetadataJson))
        {
            try
            {
                var parsed = JsonSerializer.Deserialize<Dictionary<string, string>>(assignment.MetadataJson);
                if (parsed != null)
                {
                    metadata = parsed;
                }
            }
            catch
            {
                // Ignore parse errors
            }
        }

        // Add serial number to metadata if captured
        if (!string.IsNullOrEmpty(assignment.SerialNumberCaptured))
        {
            metadata["serialNumber"] = assignment.SerialNumberCaptured;
        }

        return new AssetPlanDto
        {
            EquipmentType = GetEquipmentTypeFromCode(assignment.AssetType?.Code ?? ""),
            ExistingAssetId = assignment.NewAssetId,
            ExistingAssetCode = assignment.NewAsset?.AssetCode,
            ExistingAssetName = assignment.NewAsset?.AssetName,
            OldAssetId = assignment.OldAssetId,
            OldAssetCode = assignment.OldAsset?.AssetCode,
            OldAssetName = assignment.OldAsset?.AssetName,
            CreateNew = assignment.SourceType == AssetSourceType.NewFromTemplate ||
                        assignment.SourceType == AssetSourceType.CreateOnSite,
            Brand = assignment.NewAsset?.Brand,
            Model = assignment.NewAsset?.Model,
            Metadata = metadata,
            Status = MapStatusToString(assignment.Status),
            RequiresSerialNumber = assignment.SerialNumberRequired,
            RequiresQRCode = assignment.QRCodeRequired
        };
    }

    #region Private Helper Methods

    private async Task EnsureAssetTypeCacheAsync(CancellationToken cancellationToken)
    {
        if (_assetTypeCache != null) return;

        var assetTypes = await _context.AssetTypes
            .Where(t => t.IsActive)
            .ToListAsync(cancellationToken);

        _assetTypeCache = assetTypes.ToDictionary(
            t => t.Code.ToUpperInvariant(),
            t => t.Id);
    }

    private int? GetAssetTypeId(string equipmentType)
    {
        var code = GetAssetTypeCode(equipmentType);
        if (code == null || _assetTypeCache == null) return null;

        return _assetTypeCache.TryGetValue(code, out var id) ? id : null;
    }

    private static string? GetAssetTypeCode(string equipmentType)
    {
        return equipmentType.ToLowerInvariant() switch
        {
            "laptop" => "LAP",
            "desktop" => "DESK",
            "docking" => "DOCK",
            "monitor" => "MON",
            "keyboard" => "KEYB",
            "mouse" => "MOUSE",
            _ => null
        };
    }

    private static string GetEquipmentTypeFromCode(string code)
    {
        return code.ToUpperInvariant() switch
        {
            "LAP" => "laptop",
            "DESK" => "desktop",
            "DOCK" => "docking",
            "MON" => "monitor",
            "KEYB" => "keyboard",
            "MOUSE" => "mouse",
            _ => code.ToLowerInvariant()
        };
    }

    private static AssignmentCategory GetAssignmentCategory(string equipmentType)
    {
        // Laptops and desktops are user-assigned (follow the user)
        // Everything else is workplace-fixed (stays at the physical location)
        return equipmentType.ToLowerInvariant() switch
        {
            "laptop" => AssignmentCategory.UserAssigned,
            "desktop" => AssignmentCategory.UserAssigned,
            _ => AssignmentCategory.WorkplaceFixed
        };
    }

    private static AssetSourceType DetermineSourceType(AssetPlanDto plan)
    {
        if (plan.CreateNew)
        {
            return AssetSourceType.NewFromTemplate;
        }

        return plan.ExistingAssetId.HasValue
            ? AssetSourceType.ExistingInventory
            : AssetSourceType.CreateOnSite;
    }

    private static bool ShouldRequireSerial(string equipmentType)
    {
        // Laptops, desktops, and docking stations typically require serial numbers
        return equipmentType.ToLowerInvariant() switch
        {
            "laptop" => true,
            "desktop" => true,
            "docking" => true,
            "monitor" => true,
            _ => false
        };
    }

    private static AssetAssignmentStatus MapStatus(string? status)
    {
        return status?.ToLowerInvariant() switch
        {
            "installed" => AssetAssignmentStatus.Installed,
            "skipped" => AssetAssignmentStatus.Skipped,
            "failed" => AssetAssignmentStatus.Failed,
            _ => AssetAssignmentStatus.Pending
        };
    }

    private static string MapStatusToString(AssetAssignmentStatus status)
    {
        return status switch
        {
            AssetAssignmentStatus.Installed => "installed",
            AssetAssignmentStatus.Skipped => "skipped",
            AssetAssignmentStatus.Failed => "failed",
            _ => "pending"
        };
    }

    private static List<AssetPlanDto> ParseAssetPlans(string? json)
    {
        if (string.IsNullOrWhiteSpace(json))
        {
            return new List<AssetPlanDto>();
        }

        try
        {
            return JsonSerializer.Deserialize<List<AssetPlanDto>>(json) ?? new List<AssetPlanDto>();
        }
        catch
        {
            return new List<AssetPlanDto>();
        }
    }

    #endregion
}

/// <summary>
/// Result of a bulk migration operation.
/// </summary>
public class MigrationResult
{
    public int TotalWorkplaces { get; set; }
    public int MigratedWorkplaces { get; set; }
    public int SkippedWorkplaces { get; set; }
    public int FailedWorkplaces { get; set; }
    public int TotalAssignments { get; set; }
    public List<string> Errors { get; set; } = new();

    public bool HasErrors => FailedWorkplaces > 0 || Errors.Count > 0;
}

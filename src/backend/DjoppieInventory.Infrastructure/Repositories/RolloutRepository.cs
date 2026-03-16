using System.Text.Json;
using DjoppieInventory.Core.DTOs.Rollout;
using DjoppieInventory.Core.Entities;
using DjoppieInventory.Core.Interfaces;
using DjoppieInventory.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;

namespace DjoppieInventory.Infrastructure.Repositories;

/// <summary>
/// Repository implementation for rollout workflow operations.
/// Handles CRUD for sessions, days, and workplaces with optimized queries.
/// </summary>
public class RolloutRepository : IRolloutRepository
{
    private readonly ApplicationDbContext _context;
    private readonly IAssetRepository _assetRepository;
    private readonly IAssetCodeGenerator _assetCodeGenerator;

    public RolloutRepository(ApplicationDbContext context, IAssetRepository assetRepository, IAssetCodeGenerator assetCodeGenerator)
    {
        _context = context;
        _assetRepository = assetRepository;
        _assetCodeGenerator = assetCodeGenerator;
    }

    // ===== RolloutSession Operations =====

    public async Task<IEnumerable<RolloutSession>> GetAllSessionsAsync(RolloutSessionStatus? status = null, CancellationToken cancellationToken = default)
    {
        var query = _context.RolloutSessions.AsQueryable();

        if (status.HasValue)
        {
            query = query.Where(s => s.Status == status.Value);
        }

        return await query
            .Include(s => s.Days)
                .ThenInclude(d => d.Workplaces)
            .OrderByDescending(s => s.PlannedStartDate)
            .ToListAsync(cancellationToken);
    }

    public async Task<RolloutSession?> GetSessionByIdAsync(int id, bool includeDays = false, bool includeWorkplaces = false, CancellationToken cancellationToken = default)
    {
        var query = _context.RolloutSessions.AsQueryable();

        if (includeDays)
        {
            query = query.Include(s => s.Days);

            if (includeWorkplaces)
            {
                query = query.Include(s => s.Days).ThenInclude(d => d.Workplaces);
            }
        }

        return await query.FirstOrDefaultAsync(s => s.Id == id, cancellationToken);
    }

    public async Task<RolloutSession> CreateSessionAsync(RolloutSession session, CancellationToken cancellationToken = default)
    {
        session.CreatedAt = DateTime.UtcNow;
        session.UpdatedAt = DateTime.UtcNow;

        _context.RolloutSessions.Add(session);
        await _context.SaveChangesAsync(cancellationToken);

        return session;
    }

    public async Task<RolloutSession> UpdateSessionAsync(RolloutSession session, CancellationToken cancellationToken = default)
    {
        session.UpdatedAt = DateTime.UtcNow;

        _context.RolloutSessions.Update(session);
        await _context.SaveChangesAsync(cancellationToken);

        return session;
    }

    public async Task<bool> DeleteSessionAsync(int id, CancellationToken cancellationToken = default)
    {
        var session = await _context.RolloutSessions.FindAsync(new object[] { id }, cancellationToken);
        if (session == null)
        {
            return false;
        }

        _context.RolloutSessions.Remove(session);
        await _context.SaveChangesAsync(cancellationToken);

        return true;
    }

    // ===== RolloutDay Operations =====

    public async Task<IEnumerable<RolloutDay>> GetDaysBySessionIdAsync(int sessionId, bool includeWorkplaces = false, CancellationToken cancellationToken = default)
    {
        var query = _context.RolloutDays
            .Where(d => d.RolloutSessionId == sessionId);

        if (includeWorkplaces)
        {
            query = query.Include(d => d.Workplaces);
        }

        return await query
            .OrderBy(d => d.Date)
            .ThenBy(d => d.DayNumber)
            .ToListAsync(cancellationToken);
    }

    public async Task<RolloutDay?> GetDayByIdAsync(int id, bool includeWorkplaces = false, CancellationToken cancellationToken = default)
    {
        var query = _context.RolloutDays.AsQueryable();

        if (includeWorkplaces)
        {
            query = query.Include(d => d.Workplaces).ThenInclude(w => w.Service);
        }

        return await query.FirstOrDefaultAsync(d => d.Id == id, cancellationToken);
    }

    public async Task<RolloutDay> CreateDayAsync(RolloutDay day, CancellationToken cancellationToken = default)
    {
        day.CreatedAt = DateTime.UtcNow;
        day.UpdatedAt = DateTime.UtcNow;

        _context.RolloutDays.Add(day);
        await _context.SaveChangesAsync(cancellationToken);

        return day;
    }

    public async Task<RolloutDay> UpdateDayAsync(RolloutDay day, CancellationToken cancellationToken = default)
    {
        day.UpdatedAt = DateTime.UtcNow;

        _context.RolloutDays.Update(day);
        await _context.SaveChangesAsync(cancellationToken);

        return day;
    }

    public async Task<bool> DeleteDayAsync(int id, CancellationToken cancellationToken = default)
    {
        var day = await _context.RolloutDays.FindAsync(new object[] { id }, cancellationToken);
        if (day == null)
        {
            return false;
        }

        _context.RolloutDays.Remove(day);
        await _context.SaveChangesAsync(cancellationToken);

        return true;
    }

    // ===== RolloutWorkplace Operations =====

    public async Task<IEnumerable<RolloutWorkplace>> GetWorkplacesByDayIdAsync(int dayId, CancellationToken cancellationToken = default)
    {
        return await _context.RolloutWorkplaces
            .Include(w => w.Service)
            .Where(w => w.RolloutDayId == dayId)
            .OrderBy(w => w.Status)
            .ThenBy(w => w.UserName)
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<RolloutWorkplace>> GetWorkplacesByStatusAsync(int dayId, RolloutWorkplaceStatus status, CancellationToken cancellationToken = default)
    {
        return await _context.RolloutWorkplaces
            .Include(w => w.Service)
            .Where(w => w.RolloutDayId == dayId && w.Status == status)
            .OrderBy(w => w.UserName)
            .ToListAsync(cancellationToken);
    }

    public async Task<RolloutWorkplace?> GetWorkplaceByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        return await _context.RolloutWorkplaces
            .Include(w => w.Service)
            .Include(w => w.RolloutDay)
                .ThenInclude(d => d.RolloutSession)
            .FirstOrDefaultAsync(w => w.Id == id, cancellationToken);
    }

    public async Task<RolloutWorkplace> CreateWorkplaceAsync(RolloutWorkplace workplace, CancellationToken cancellationToken = default)
    {
        workplace.CreatedAt = DateTime.UtcNow;
        workplace.UpdatedAt = DateTime.UtcNow;

        // Process asset plans and create assets if needed
        await ProcessAssetPlansAsync(workplace, cancellationToken);

        _context.RolloutWorkplaces.Add(workplace);
        await _context.SaveChangesAsync(cancellationToken);

        // Update day totals
        await UpdateDayTotalsAsync(workplace.RolloutDayId);

        return workplace;
    }

    public async Task<RolloutWorkplace> UpdateWorkplaceAsync(RolloutWorkplace workplace, CancellationToken cancellationToken = default)
    {
        workplace.UpdatedAt = DateTime.UtcNow;

        // Process asset plans and create assets if needed
        await ProcessAssetPlansAsync(workplace, cancellationToken);

        _context.RolloutWorkplaces.Update(workplace);
        await _context.SaveChangesAsync(cancellationToken);

        // Update day totals
        await UpdateDayTotalsAsync(workplace.RolloutDayId);

        return workplace;
    }

    public async Task<bool> DeleteWorkplaceAsync(int id, CancellationToken cancellationToken = default)
    {
        var workplace = await _context.RolloutWorkplaces.FindAsync(new object[] { id }, cancellationToken);
        if (workplace == null)
        {
            return false;
        }

        var dayId = workplace.RolloutDayId;

        _context.RolloutWorkplaces.Remove(workplace);
        await _context.SaveChangesAsync(cancellationToken);

        // Update day totals
        await UpdateDayTotalsAsync(dayId);

        return true;
    }

    // ===== Batch Operations =====

    public async Task<IEnumerable<RolloutWorkplace>> CreateWorkplacesAsync(IEnumerable<RolloutWorkplace> workplaces)
    {
        var workplaceList = workplaces.ToList();
        var now = DateTime.UtcNow;

        foreach (var workplace in workplaceList)
        {
            workplace.CreatedAt = now;
            workplace.UpdatedAt = now;
        }

        _context.RolloutWorkplaces.AddRange(workplaceList);
        await _context.SaveChangesAsync();

        // Update day totals for all affected days
        var affectedDayIds = workplaceList.Select(w => w.RolloutDayId).Distinct();
        foreach (var dayId in affectedDayIds)
        {
            await UpdateDayTotalsAsync(dayId);
        }

        return workplaceList;
    }

    // ===== Statistics & Reporting =====

    public async Task<RolloutSessionStats> GetSessionStatsAsync(int sessionId)
    {
        var days = await _context.RolloutDays
            .Where(d => d.RolloutSessionId == sessionId)
            .ToListAsync();

        var workplaces = await _context.RolloutWorkplaces
            .Where(w => days.Select(d => d.Id).Contains(w.RolloutDayId))
            .ToListAsync();

        var totalWorkplaces = workplaces.Count;
        var completedWorkplaces = workplaces.Count(w => w.Status == RolloutWorkplaceStatus.Completed);
        var pendingWorkplaces = workplaces.Count(w => w.Status == RolloutWorkplaceStatus.Pending);
        var inProgressWorkplaces = workplaces.Count(w => w.Status == RolloutWorkplaceStatus.InProgress);
        var skippedWorkplaces = workplaces.Count(w => w.Status == RolloutWorkplaceStatus.Skipped);
        var failedWorkplaces = workplaces.Count(w => w.Status == RolloutWorkplaceStatus.Failed);

        var completionPercentage = totalWorkplaces > 0
            ? Math.Round((decimal)completedWorkplaces / totalWorkplaces * 100, 2)
            : 0;

        return new RolloutSessionStats
        {
            TotalDays = days.Count,
            TotalWorkplaces = totalWorkplaces,
            CompletedWorkplaces = completedWorkplaces,
            PendingWorkplaces = pendingWorkplaces,
            InProgressWorkplaces = inProgressWorkplaces,
            SkippedWorkplaces = skippedWorkplaces,
            FailedWorkplaces = failedWorkplaces,
            CompletionPercentage = completionPercentage
        };
    }

    // ===== Helper Methods =====

    /// <summary>
    /// Updates the TotalWorkplaces and CompletedWorkplaces counts for a day
    /// </summary>
    public async Task UpdateDayTotalsAsync(int dayId)
    {
        var day = await _context.RolloutDays.FindAsync(dayId);
        if (day == null)
        {
            return;
        }

        var workplaces = await _context.RolloutWorkplaces
            .Where(w => w.RolloutDayId == dayId)
            .ToListAsync();

        day.TotalWorkplaces = workplaces.Count;
        day.CompletedWorkplaces = workplaces.Count(w => w.Status == RolloutWorkplaceStatus.Completed);
        day.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
    }

    /// <summary>
    /// Processes asset plans and creates assets for plans marked as createNew with serial numbers
    /// </summary>
    private async Task ProcessAssetPlansAsync(RolloutWorkplace workplace, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrEmpty(workplace.AssetPlansJson))
        {
            return;
        }

        var plans = JsonSerializer.Deserialize<List<AssetPlanDto>>(workplace.AssetPlansJson);
        if (plans == null || plans.Count == 0)
        {
            return;
        }

        var modified = false;

        foreach (var plan in plans)
        {
            // Only create assets if:
            // 1. createNew is true
            // 2. Asset hasn't been created yet (no ExistingAssetId)
            // 3. Serial number is provided OR it's a type that doesn't require serial (monitor, keyboard, mouse)
            var hasSerial = plan.Metadata != null && plan.Metadata.ContainsKey("serialNumber") && !string.IsNullOrEmpty(plan.Metadata["serialNumber"]);
            var needsSerial = plan.RequiresSerialNumber;

            if (!plan.CreateNew || plan.ExistingAssetId.HasValue)
            {
                continue;
            }

            if (needsSerial && !hasSerial)
            {
                continue; // Skip if serial required but not provided
            }

            // Check if an asset with this serial number already exists
            if (hasSerial)
            {
                var existingAsset = await _context.Assets
                    .FirstOrDefaultAsync(a => a.SerialNumber == plan.Metadata!["serialNumber"], cancellationToken);
                if (existingAsset != null)
                {
                    // Link to existing asset instead of creating a duplicate
                    plan.ExistingAssetId = existingAsset.Id;
                    plan.ExistingAssetCode = existingAsset.AssetCode;
                    plan.ExistingAssetName = existingAsset.AssetName;
                    plan.CreateNew = false;
                    modified = true;
                    continue;
                }
            }

            // Determine asset type based on equipment type
            var assetType = await GetAssetTypeByEquipmentTypeAsync(plan.EquipmentType, cancellationToken);
            if (assetType == null)
            {
                continue; // Skip if asset type not found
            }

            // Build AssetName: DOCK-serial / MON-serial, or type_brand_model for others
            var serial = hasSerial ? plan.Metadata!["serialNumber"] : null;
            var assetName = BuildAssetName(plan.EquipmentType, plan.Brand, plan.Model, serial);

            // Create the asset
            var asset = new Asset
            {
                AssetTypeId = assetType.Id,
                Category = assetType.Name,
                AssetName = assetName,
                Brand = plan.Brand,
                Model = plan.Model,
                SerialNumber = hasSerial ? plan.Metadata!["serialNumber"] : null,
                Status = AssetStatus.Nieuw, // New assets start with Nieuw status
                ServiceId = workplace.ServiceId,
                IsDummy = false,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            // Generate AssetCode using centralized service (4-char brand code, proper numbering)
            // Year is calculated from current date (Nov/Dec uses next year)
            asset.AssetCode = await _assetCodeGenerator.GenerateCodeAsync(
                assetType.Id, plan.Brand, DateTime.UtcNow, false, cancellationToken);

            // Create the asset
            var createdAsset = await _assetRepository.CreateAsync(asset);

            // Update the plan with created asset info
            plan.ExistingAssetId = createdAsset.Id;
            plan.ExistingAssetCode = createdAsset.AssetCode;
            plan.ExistingAssetName = createdAsset.AssetName;
            plan.CreateNew = false; // Mark as no longer needing creation

            modified = true;
        }

        // Re-serialize if any plans were modified
        if (modified)
        {
            workplace.AssetPlansJson = JsonSerializer.Serialize(plans);
        }
    }

    /// <summary>
    /// Gets an asset type by its code (public, used by controller)
    /// </summary>
    public async Task<AssetType?> GetAssetTypeByCodeAsync(string code)
    {
        return await _context.AssetTypes
            .Include(at => at.Category)
            .FirstOrDefaultAsync(at => at.Code == code && at.IsActive);
    }

    /// <summary>
    /// Gets the AssetType entity for a given equipment type string
    /// </summary>
    private async Task<AssetType?> GetAssetTypeByEquipmentTypeAsync(string equipmentType, CancellationToken cancellationToken = default)
    {
        // Map equipment type to asset type code
        var assetTypeCode = equipmentType.ToLower() switch
        {
            "laptop" => "LAP",
            "desktop" => "DESK",
            "docking" => "DOCK",
            "monitor" => "MON",
            "keyboard" => "KEYB",
            "mouse" => "MOUSE",
            _ => null
        };

        if (string.IsNullOrEmpty(assetTypeCode))
        {
            return null;
        }

        return await _context.AssetTypes
            .Include(at => at.Category)
            .FirstOrDefaultAsync(at => at.Code == assetTypeCode && at.IsActive, cancellationToken);
    }

    /// <summary>
    /// Builds AssetName based on equipment type.
    /// DOCK/MON with serial: "DOCK-{serial}" or "MON-{serial}"
    /// Others or without serial: "type_brand_model" (lowercase with underscores)
    /// </summary>
    private static string BuildAssetName(string equipmentType, string? brand, string? model, string? serialNumber = null)
    {
        var typeCode = equipmentType.ToUpper() switch
        {
            "DOCKING" => "DOCK",
            "MONITOR" => "MON",
            _ => null
        };

        // DOCK and MON use TYPE-serial format when serial is available
        if (typeCode != null && !string.IsNullOrEmpty(serialNumber))
        {
            return $"{typeCode}-{serialNumber}";
        }

        // Fallback: type_brand_model
        var parts = new List<string> { equipmentType.ToLower() };

        if (!string.IsNullOrEmpty(brand))
        {
            parts.Add(brand.ToLower().Replace(" ", "_"));
        }

        if (!string.IsNullOrEmpty(model))
        {
            parts.Add(model.ToLower().Replace(" ", "_"));
        }

        return string.Join("_", parts);
    }

    // ===== Transaction Support =====

    public async Task<IDbContextTransaction> BeginTransactionAsync(CancellationToken cancellationToken = default)
    {
        return await _context.Database.BeginTransactionAsync(cancellationToken);
    }

    public async Task SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        await _context.SaveChangesAsync(cancellationToken);
    }

    /// <summary>
    /// Executes the given action within a database transaction, wrapped in the configured
    /// execution strategy. This is required for Azure SQL with SqlServerRetryingExecutionStrategy.
    /// </summary>
    public async Task ExecuteInTransactionAsync(Func<Task> action, CancellationToken cancellationToken = default)
    {
        var strategy = _context.Database.CreateExecutionStrategy();

        await strategy.ExecuteAsync(async () =>
        {
            await using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);
            try
            {
                await action();
                await transaction.CommitAsync(cancellationToken);
            }
            catch
            {
                await transaction.RollbackAsync(cancellationToken);
                throw;
            }
        });
    }
}

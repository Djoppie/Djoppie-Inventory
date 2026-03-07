using System.Text.Json;
using DjoppieInventory.Core.DTOs.Rollout;
using DjoppieInventory.Core.Entities;
using DjoppieInventory.Core.Interfaces;
using DjoppieInventory.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace DjoppieInventory.Infrastructure.Repositories;

/// <summary>
/// Repository implementation for rollout workflow operations.
/// Handles CRUD for sessions, days, and workplaces with optimized queries.
/// </summary>
public class RolloutRepository : IRolloutRepository
{
    private readonly ApplicationDbContext _context;
    private readonly IAssetRepository _assetRepository;

    public RolloutRepository(ApplicationDbContext context, IAssetRepository assetRepository)
    {
        _context = context;
        _assetRepository = assetRepository;
    }

    // ===== RolloutSession Operations =====

    public async Task<IEnumerable<RolloutSession>> GetAllSessionsAsync(RolloutSessionStatus? status = null)
    {
        var query = _context.RolloutSessions.AsQueryable();

        if (status.HasValue)
        {
            query = query.Where(s => s.Status == status.Value);
        }

        return await query
            .OrderByDescending(s => s.PlannedStartDate)
            .ToListAsync();
    }

    public async Task<RolloutSession?> GetSessionByIdAsync(int id, bool includeDays = false, bool includeWorkplaces = false)
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

        return await query.FirstOrDefaultAsync(s => s.Id == id);
    }

    public async Task<RolloutSession> CreateSessionAsync(RolloutSession session)
    {
        session.CreatedAt = DateTime.UtcNow;
        session.UpdatedAt = DateTime.UtcNow;

        _context.RolloutSessions.Add(session);
        await _context.SaveChangesAsync();

        return session;
    }

    public async Task<RolloutSession> UpdateSessionAsync(RolloutSession session)
    {
        session.UpdatedAt = DateTime.UtcNow;

        _context.RolloutSessions.Update(session);
        await _context.SaveChangesAsync();

        return session;
    }

    public async Task<bool> DeleteSessionAsync(int id)
    {
        var session = await _context.RolloutSessions.FindAsync(id);
        if (session == null)
        {
            return false;
        }

        _context.RolloutSessions.Remove(session);
        await _context.SaveChangesAsync();

        return true;
    }

    // ===== RolloutDay Operations =====

    public async Task<IEnumerable<RolloutDay>> GetDaysBySessionIdAsync(int sessionId, bool includeWorkplaces = false)
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
            .ToListAsync();
    }

    public async Task<RolloutDay?> GetDayByIdAsync(int id, bool includeWorkplaces = false)
    {
        var query = _context.RolloutDays.AsQueryable();

        if (includeWorkplaces)
        {
            query = query.Include(d => d.Workplaces).ThenInclude(w => w.Service);
        }

        return await query.FirstOrDefaultAsync(d => d.Id == id);
    }

    public async Task<RolloutDay> CreateDayAsync(RolloutDay day)
    {
        day.CreatedAt = DateTime.UtcNow;
        day.UpdatedAt = DateTime.UtcNow;

        _context.RolloutDays.Add(day);
        await _context.SaveChangesAsync();

        return day;
    }

    public async Task<RolloutDay> UpdateDayAsync(RolloutDay day)
    {
        day.UpdatedAt = DateTime.UtcNow;

        _context.RolloutDays.Update(day);
        await _context.SaveChangesAsync();

        return day;
    }

    public async Task<bool> DeleteDayAsync(int id)
    {
        var day = await _context.RolloutDays.FindAsync(id);
        if (day == null)
        {
            return false;
        }

        _context.RolloutDays.Remove(day);
        await _context.SaveChangesAsync();

        return true;
    }

    // ===== RolloutWorkplace Operations =====

    public async Task<IEnumerable<RolloutWorkplace>> GetWorkplacesByDayIdAsync(int dayId)
    {
        return await _context.RolloutWorkplaces
            .Include(w => w.Service)
            .Where(w => w.RolloutDayId == dayId)
            .OrderBy(w => w.Status)
            .ThenBy(w => w.UserName)
            .ToListAsync();
    }

    public async Task<IEnumerable<RolloutWorkplace>> GetWorkplacesByStatusAsync(int dayId, RolloutWorkplaceStatus status)
    {
        return await _context.RolloutWorkplaces
            .Include(w => w.Service)
            .Where(w => w.RolloutDayId == dayId && w.Status == status)
            .OrderBy(w => w.UserName)
            .ToListAsync();
    }

    public async Task<RolloutWorkplace?> GetWorkplaceByIdAsync(int id)
    {
        return await _context.RolloutWorkplaces
            .Include(w => w.Service)
            .Include(w => w.RolloutDay)
                .ThenInclude(d => d.RolloutSession)
            .FirstOrDefaultAsync(w => w.Id == id);
    }

    public async Task<RolloutWorkplace> CreateWorkplaceAsync(RolloutWorkplace workplace)
    {
        workplace.CreatedAt = DateTime.UtcNow;
        workplace.UpdatedAt = DateTime.UtcNow;

        // Process asset plans and create assets if needed
        await ProcessAssetPlansAsync(workplace);

        _context.RolloutWorkplaces.Add(workplace);
        await _context.SaveChangesAsync();

        // Update day totals
        await UpdateDayTotalsAsync(workplace.RolloutDayId);

        return workplace;
    }

    public async Task<RolloutWorkplace> UpdateWorkplaceAsync(RolloutWorkplace workplace)
    {
        workplace.UpdatedAt = DateTime.UtcNow;

        // Process asset plans and create assets if needed
        await ProcessAssetPlansAsync(workplace);

        _context.RolloutWorkplaces.Update(workplace);
        await _context.SaveChangesAsync();

        // Update day totals
        await UpdateDayTotalsAsync(workplace.RolloutDayId);

        return workplace;
    }

    public async Task<bool> DeleteWorkplaceAsync(int id)
    {
        var workplace = await _context.RolloutWorkplaces.FindAsync(id);
        if (workplace == null)
        {
            return false;
        }

        var dayId = workplace.RolloutDayId;

        _context.RolloutWorkplaces.Remove(workplace);
        await _context.SaveChangesAsync();

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
    private async Task UpdateDayTotalsAsync(int dayId)
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
    private async Task ProcessAssetPlansAsync(RolloutWorkplace workplace)
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

            // Determine asset type based on equipment type
            var assetType = await GetAssetTypeByEquipmentTypeAsync(plan.EquipmentType);
            if (assetType == null)
            {
                continue; // Skip if asset type not found
            }

            // Build AssetName following pattern: assettype_merk_model
            var assetName = BuildAssetName(plan.EquipmentType, plan.Brand, plan.Model);

            // Create the asset
            var asset = new Asset
            {
                AssetTypeId = assetType.Id,
                Category = assetType.Category?.Name ?? "Computing",
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

            // Generate AssetCode
            var prefix = $"{assetType.Code}-{DateTime.UtcNow:yy}-{(string.IsNullOrEmpty(plan.Brand) ? "UNK" : plan.Brand.ToUpper().Substring(0, Math.Min(3, plan.Brand.Length)))}";
            var nextNumber = await _assetRepository.GetNextAssetNumberAsync(prefix, false);
            asset.AssetCode = $"{prefix}-{nextNumber:D5}";

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
    /// Gets the AssetType entity for a given equipment type string
    /// </summary>
    private async Task<AssetType?> GetAssetTypeByEquipmentTypeAsync(string equipmentType)
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
            .FirstOrDefaultAsync(at => at.Code == assetTypeCode && at.IsActive);
    }

    /// <summary>
    /// Builds AssetName following pattern: assettype_merk_model (lowercase with underscores)
    /// </summary>
    private static string BuildAssetName(string equipmentType, string? brand, string? model)
    {
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

    /// <summary>
    /// Generates standard asset plans based on configuration
    /// </summary>
    private static List<AssetPlanDto> GenerateStandardAssetPlans(StandardAssetPlanConfig config)
    {
        var plans = new List<AssetPlanDto>();

        // Laptop
        if (config.IncludeLaptop)
        {
            plans.Add(new AssetPlanDto
            {
                EquipmentType = "laptop",
                CreateNew = false,
                RequiresSerialNumber = true,
                RequiresQRCode = false, // Existing asset (swap)
                Status = "pending",
                Metadata = new Dictionary<string, string>()
            });
        }

        // Desktop
        if (config.IncludeDesktop)
        {
            plans.Add(new AssetPlanDto
            {
                EquipmentType = "desktop",
                CreateNew = false,
                RequiresSerialNumber = true,
                RequiresQRCode = false, // Existing asset (swap)
                Status = "pending",
                Metadata = new Dictionary<string, string>()
            });
        }

        // Docking Station
        if (config.IncludeDocking)
        {
            plans.Add(new AssetPlanDto
            {
                EquipmentType = "docking",
                CreateNew = false,
                RequiresSerialNumber = true,
                RequiresQRCode = true, // New asset
                Status = "pending",
                Metadata = new Dictionary<string, string>()
            });
        }

        // Monitors
        for (int i = 0; i < config.MonitorCount; i++)
        {
            var position = i switch
            {
                0 when config.MonitorCount == 1 => "center",
                0 when config.MonitorCount >= 2 => "left",
                1 when config.MonitorCount == 2 => "right",
                1 when config.MonitorCount == 3 => "center",
                2 => "right",
                _ => "center"
            };

            plans.Add(new AssetPlanDto
            {
                EquipmentType = "monitor",
                CreateNew = false,
                RequiresSerialNumber = false,
                RequiresQRCode = true, // New asset
                Status = "pending",
                Metadata = new Dictionary<string, string>
                {
                    { "position", position },
                    { "hasCamera", "false" }
                }
            });
        }

        // Keyboard
        if (config.IncludeKeyboard)
        {
            plans.Add(new AssetPlanDto
            {
                EquipmentType = "keyboard",
                CreateNew = false,
                RequiresSerialNumber = false,
                RequiresQRCode = true,
                Status = "pending",
                Metadata = new Dictionary<string, string>()
            });
        }

        // Mouse
        if (config.IncludeMouse)
        {
            plans.Add(new AssetPlanDto
            {
                EquipmentType = "mouse",
                CreateNew = false,
                RequiresSerialNumber = false,
                RequiresQRCode = true,
                Status = "pending",
                Metadata = new Dictionary<string, string>()
            });
        }

        return plans;
    }
}

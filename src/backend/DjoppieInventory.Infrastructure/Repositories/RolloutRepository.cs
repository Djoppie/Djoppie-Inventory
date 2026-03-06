using DjoppieInventory.Core.DTOs.Rollout;
using DjoppieInventory.Core.Entities;
using DjoppieInventory.Core.Interfaces;
using DjoppieInventory.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace DjoppieInventory.Infrastructure.Repositories;

/// <summary>
/// Repository implementation for Rollout data access operations.
/// Manages rollout sessions, items, asset swaps, and progress tracking with proper eager loading
/// of navigation properties and optimized queries.
/// </summary>
public class RolloutRepository : IRolloutRepository
{
    private readonly ApplicationDbContext _context;

    public RolloutRepository(ApplicationDbContext context)
    {
        _context = context ?? throw new ArgumentNullException(nameof(context));
    }

    // ===== Session Operations =====

    public async Task<IEnumerable<RolloutSession>> GetAllSessionsAsync(
        RolloutSessionStatus? status = null,
        CancellationToken cancellationToken = default)
    {
        var query = _context.RolloutSessions.AsQueryable();

        if (status.HasValue)
        {
            query = query.Where(s => s.Status == status.Value);
        }

        return await query
            .OrderByDescending(s => s.PlannedDate)
            .AsNoTracking()
            .ToListAsync(cancellationToken);
    }

    public async Task<RolloutSession?> GetSessionByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        return await _context.RolloutSessions
            .FirstOrDefaultAsync(s => s.Id == id, cancellationToken);
    }

    public async Task<RolloutSession?> GetSessionWithItemsAsync(int id, CancellationToken cancellationToken = default)
    {
        return await _context.RolloutSessions
            .Include(s => s.Items)
                .ThenInclude(i => i.Asset)
                    .ThenInclude(a => a.AssetType)
            .Include(s => s.Items)
                .ThenInclude(i => i.Asset)
                    .ThenInclude(a => a.Service)
            .Include(s => s.Items)
                .ThenInclude(i => i.TargetService)
            .Include(s => s.AssetSwaps)
                .ThenInclude(swap => swap.OldAsset)
            .Include(s => s.AssetSwaps)
                .ThenInclude(swap => swap.NewAsset)
            .FirstOrDefaultAsync(s => s.Id == id, cancellationToken);
    }

    public async Task<RolloutSession> CreateSessionAsync(
        RolloutSession session,
        CancellationToken cancellationToken = default)
    {
        session.CreatedAt = DateTime.UtcNow;
        session.UpdatedAt = DateTime.UtcNow;

        _context.RolloutSessions.Add(session);
        await _context.SaveChangesAsync(cancellationToken);

        return session;
    }

    public async Task<RolloutSession> UpdateSessionAsync(
        RolloutSession session,
        CancellationToken cancellationToken = default)
    {
        session.UpdatedAt = DateTime.UtcNow;

        _context.RolloutSessions.Update(session);
        await _context.SaveChangesAsync(cancellationToken);

        return session;
    }

    public async Task DeleteSessionAsync(int id, CancellationToken cancellationToken = default)
    {
        var session = await _context.RolloutSessions.FindAsync(new object[] { id }, cancellationToken);
        if (session == null)
        {
            throw new InvalidOperationException($"Rollout session with ID {id} not found.");
        }

        _context.RolloutSessions.Remove(session);
        await _context.SaveChangesAsync(cancellationToken);
    }

    // ===== Item Operations =====

    public async Task<RolloutItem?> GetItemByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        return await _context.RolloutItems
            .Include(i => i.Asset)
                .ThenInclude(a => a.AssetType)
            .Include(i => i.Asset)
                .ThenInclude(a => a.Service)
            .Include(i => i.TargetService)
            .Include(i => i.RolloutSession)
            .FirstOrDefaultAsync(i => i.Id == id, cancellationToken);
    }

    public async Task<RolloutItem> AddItemAsync(RolloutItem item, CancellationToken cancellationToken = default)
    {
        item.CreatedAt = DateTime.UtcNow;
        item.UpdatedAt = DateTime.UtcNow;

        _context.RolloutItems.Add(item);
        await _context.SaveChangesAsync(cancellationToken);

        // Reload with navigation properties for mapping
        return await _context.RolloutItems
            .Include(i => i.Asset)
                .ThenInclude(a => a.AssetType)
            .Include(i => i.Asset)
                .ThenInclude(a => a.Service)
            .Include(i => i.TargetService)
            .FirstAsync(i => i.Id == item.Id, cancellationToken);
    }

    public async Task<IEnumerable<RolloutItem>> AddItemsBulkAsync(
        IEnumerable<RolloutItem> items,
        CancellationToken cancellationToken = default)
    {
        var itemList = items.ToList();
        if (itemList.Count == 0)
            return itemList;

        var now = DateTime.UtcNow;
        foreach (var item in itemList)
        {
            item.CreatedAt = now;
            item.UpdatedAt = now;
        }

        await _context.RolloutItems.AddRangeAsync(itemList, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);

        // Reload with navigation properties for mapping
        var ids = itemList.Select(i => i.Id).ToList();
        return await _context.RolloutItems
            .Include(i => i.Asset)
                .ThenInclude(a => a.AssetType)
            .Include(i => i.Asset)
                .ThenInclude(a => a.Service)
            .Include(i => i.TargetService)
            .Where(i => ids.Contains(i.Id))
            .ToListAsync(cancellationToken);
    }

    public async Task<RolloutItem> UpdateItemAsync(RolloutItem item, CancellationToken cancellationToken = default)
    {
        item.UpdatedAt = DateTime.UtcNow;

        _context.RolloutItems.Update(item);
        await _context.SaveChangesAsync(cancellationToken);

        return item;
    }

    public async Task DeleteItemAsync(int id, CancellationToken cancellationToken = default)
    {
        var item = await _context.RolloutItems.FindAsync(new object[] { id }, cancellationToken);
        if (item == null)
        {
            throw new InvalidOperationException($"Rollout item with ID {id} not found.");
        }

        _context.RolloutItems.Remove(item);
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task<bool> IsAssetInActiveRolloutAsync(int assetId, CancellationToken cancellationToken = default)
    {
        // Active sessions: Planning, Ready, or InProgress
        var activeStatuses = new[]
        {
            RolloutSessionStatus.Planning,
            RolloutSessionStatus.Ready,
            RolloutSessionStatus.InProgress
        };

        return await _context.RolloutItems
            .Include(i => i.RolloutSession)
            .AnyAsync(i => i.AssetId == assetId && activeStatuses.Contains(i.RolloutSession.Status), cancellationToken);
    }

    // ===== Swap Operations =====

    public async Task<AssetSwap?> GetSwapByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        return await _context.AssetSwaps
            .Include(s => s.OldAsset)
                .ThenInclude(a => a!.AssetType)
            .Include(s => s.OldAsset)
                .ThenInclude(a => a!.Service)
            .Include(s => s.NewAsset)
                .ThenInclude(a => a.AssetType)
            .Include(s => s.NewAsset)
                .ThenInclude(a => a.Service)
            .Include(s => s.RolloutSession)
            .FirstOrDefaultAsync(s => s.Id == id, cancellationToken);
    }

    public async Task<AssetSwap> CreateSwapAsync(AssetSwap swap, CancellationToken cancellationToken = default)
    {
        swap.CreatedAt = DateTime.UtcNow;
        swap.UpdatedAt = DateTime.UtcNow;

        _context.AssetSwaps.Add(swap);
        await _context.SaveChangesAsync(cancellationToken);

        // Reload with navigation properties for mapping
        return await _context.AssetSwaps
            .Include(s => s.OldAsset)
                .ThenInclude(a => a!.AssetType)
            .Include(s => s.OldAsset)
                .ThenInclude(a => a!.Service)
            .Include(s => s.NewAsset)
                .ThenInclude(a => a.AssetType)
            .Include(s => s.NewAsset)
                .ThenInclude(a => a.Service)
            .FirstAsync(s => s.Id == swap.Id, cancellationToken);
    }

    public async Task<AssetSwap> UpdateSwapAsync(AssetSwap swap, CancellationToken cancellationToken = default)
    {
        swap.UpdatedAt = DateTime.UtcNow;

        _context.AssetSwaps.Update(swap);
        await _context.SaveChangesAsync(cancellationToken);

        return swap;
    }

    // ===== Progress Tracking =====

    public async Task<RolloutProgressDto> GetProgressAsync(int sessionId, CancellationToken cancellationToken = default)
    {
        // Get session with items to calculate progress
        var session = await _context.RolloutSessions
            .Include(s => s.Items)
            .Include(s => s.AssetSwaps)
            .FirstOrDefaultAsync(s => s.Id == sessionId, cancellationToken);

        if (session == null)
        {
            throw new InvalidOperationException($"Rollout session with ID {sessionId} not found.");
        }

        var items = session.Items.ToList();
        var swaps = session.AssetSwaps.ToList();

        // Calculate item counts by status
        var totalItems = items.Count;
        var pendingItems = items.Count(i => i.Status == RolloutItemStatus.Pending);
        var inProgressItems = items.Count(i => i.Status == RolloutItemStatus.InProgress);
        var completedItems = items.Count(i => i.Status == RolloutItemStatus.Completed);
        var failedItems = items.Count(i => i.Status == RolloutItemStatus.Failed);
        var skippedItems = items.Count(i => i.Status == RolloutItemStatus.Skipped);

        // Calculate completion percentage
        var finishedItems = completedItems + skippedItems;
        var completionPercentage = totalItems > 0
            ? Math.Round((decimal)finishedItems / totalItems * 100, 2)
            : 0m;

        // Calculate swap counts
        var totalSwaps = swaps.Count;
        var completedSwaps = swaps.Count(s => s.IsCompleted);
        var pendingSwaps = swaps.Count(s => !s.IsCompleted);

        // Calculate average completion time and estimate remaining time
        TimeSpan? averageCompletionTime = null;
        TimeSpan? estimatedTimeRemaining = null;

        if (session.StartedAt.HasValue && completedItems > 0)
        {
            var completedItemsWithTime = items
                .Where(i => i.Status == RolloutItemStatus.Completed && i.CompletedAt.HasValue)
                .ToList();

            if (completedItemsWithTime.Count > 0)
            {
                // Calculate average time per item based on session start to item completion
                var totalCompletionTime = completedItemsWithTime
                    .Sum(i => (i.CompletedAt!.Value - session.StartedAt.Value).TotalSeconds);

                averageCompletionTime = TimeSpan.FromSeconds(totalCompletionTime / completedItemsWithTime.Count);

                // Estimate remaining time based on pending + in-progress items
                var remainingItems = pendingItems + inProgressItems;
                if (remainingItems > 0)
                {
                    estimatedTimeRemaining = TimeSpan.FromSeconds(
                        averageCompletionTime.Value.TotalSeconds * remainingItems);
                }
            }
        }

        return new RolloutProgressDto
        {
            TotalItems = totalItems,
            PendingItems = pendingItems,
            InProgressItems = inProgressItems,
            CompletedItems = completedItems,
            FailedItems = failedItems,
            SkippedItems = skippedItems,
            CompletionPercentage = completionPercentage,
            TotalSwaps = totalSwaps,
            CompletedSwaps = completedSwaps,
            PendingSwaps = pendingSwaps,
            AverageCompletionTime = averageCompletionTime,
            EstimatedTimeRemaining = estimatedTimeRemaining
        };
    }
}

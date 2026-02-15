using DjoppieInventory.Core.Entities;
using DjoppieInventory.Core.Interfaces;
using DjoppieInventory.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace DjoppieInventory.Infrastructure.Repositories;

/// <summary>
/// Repository implementation for AssetEvent data access operations
/// </summary>
public class AssetEventRepository : IAssetEventRepository
{
    private readonly ApplicationDbContext _context;

    public AssetEventRepository(ApplicationDbContext context)
    {
        _context = context ?? throw new ArgumentNullException(nameof(context));
    }

    public async Task<IEnumerable<AssetEvent>> GetByAssetIdAsync(int assetId, CancellationToken cancellationToken = default)
    {
        return await _context.AssetEvents
            .Where(ae => ae.AssetId == assetId)
            .OrderByDescending(ae => ae.EventDate)
            .ThenByDescending(ae => ae.CreatedAt)
            .AsNoTracking()
            .ToListAsync(cancellationToken);
    }

    public async Task<AssetEvent?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        return await _context.AssetEvents.FindAsync(new object[] { id }, cancellationToken);
    }

    public async Task<AssetEvent> CreateAsync(AssetEvent assetEvent, CancellationToken cancellationToken = default)
    {
        assetEvent.CreatedAt = DateTime.UtcNow;

        // If EventDate is not set, use current time
        if (assetEvent.EventDate == default)
        {
            assetEvent.EventDate = DateTime.UtcNow;
        }

        _context.AssetEvents.Add(assetEvent);
        await _context.SaveChangesAsync(cancellationToken);
        return assetEvent;
    }

    public async Task<IEnumerable<AssetEvent>> GetRecentEventsAsync(int count = 50, CancellationToken cancellationToken = default)
    {
        return await _context.AssetEvents
            .Include(ae => ae.Asset)
            .OrderByDescending(ae => ae.EventDate)
            .ThenByDescending(ae => ae.CreatedAt)
            .Take(count)
            .AsNoTracking()
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<AssetEvent>> GetEventsByTypeAsync(AssetEventType eventType, DateTime? since = null, CancellationToken cancellationToken = default)
    {
        var query = _context.AssetEvents
            .Where(ae => ae.EventType == eventType);

        if (since.HasValue)
        {
            query = query.Where(ae => ae.EventDate >= since.Value);
        }

        return await query
            .Include(ae => ae.Asset)
            .OrderByDescending(ae => ae.EventDate)
            .ThenByDescending(ae => ae.CreatedAt)
            .AsNoTracking()
            .ToListAsync(cancellationToken);
    }
}

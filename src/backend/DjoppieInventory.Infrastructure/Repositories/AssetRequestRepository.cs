using DjoppieInventory.Core.Entities;
using DjoppieInventory.Core.Interfaces;
using DjoppieInventory.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace DjoppieInventory.Infrastructure.Repositories;

public class AssetRequestRepository : IAssetRequestRepository
{
    private readonly ApplicationDbContext _context;

    public AssetRequestRepository(ApplicationDbContext context)
    {
        _context = context ?? throw new ArgumentNullException(nameof(context));
    }

    private IQueryable<AssetRequest> WithIncludes(IQueryable<AssetRequest> query) =>
        query
            .Include(r => r.Employee)
            .Include(r => r.PhysicalWorkplace)
            .Include(r => r.Lines).ThenInclude(l => l.AssetType)
            .Include(r => r.Lines).ThenInclude(l => l.Asset)
            .Include(r => r.Lines).ThenInclude(l => l.AssetTemplate);

    public async Task<IEnumerable<AssetRequest>> QueryAsync(AssetRequestFilter filter, CancellationToken cancellationToken = default)
    {
        var query = _context.AssetRequests.AsQueryable();

        if (filter.Type.HasValue)
            query = query.Where(r => r.RequestType == filter.Type.Value);

        if (filter.Statuses != null && filter.Statuses.Count > 0)
            query = query.Where(r => filter.Statuses.Contains(r.Status));

        if (filter.DateFrom.HasValue)
            query = query.Where(r => r.RequestedDate >= filter.DateFrom.Value);

        if (filter.DateTo.HasValue)
            query = query.Where(r => r.RequestedDate <= filter.DateTo.Value);

        if (filter.EmployeeId.HasValue)
            query = query.Where(r => r.EmployeeId == filter.EmployeeId.Value);

        if (!string.IsNullOrWhiteSpace(filter.SearchQuery))
        {
            var q = filter.SearchQuery.Trim().ToLower();
            query = query.Where(r =>
                r.RequestedFor.ToLower().Contains(q) ||
                (r.Notes != null && r.Notes.ToLower().Contains(q)));
        }

        return await WithIncludes(query)
            .AsNoTracking()
            .OrderByDescending(r => r.RequestedDate)
            .ThenByDescending(r => r.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public Task<AssetRequest?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
        => WithIncludes(_context.AssetRequests.AsQueryable())
            .FirstOrDefaultAsync(r => r.Id == id, cancellationToken);

    public async Task<AssetRequest> CreateAsync(AssetRequest request, CancellationToken cancellationToken = default)
    {
        _context.AssetRequests.Add(request);
        await _context.SaveChangesAsync(cancellationToken);
        return request;
    }

    public async Task<AssetRequest> UpdateAsync(AssetRequest request, CancellationToken cancellationToken = default)
    {
        _context.AssetRequests.Update(request);
        await _context.SaveChangesAsync(cancellationToken);
        return request;
    }

    public async Task DeleteAsync(int id, CancellationToken cancellationToken = default)
    {
        var request = await _context.AssetRequests.FindAsync(new object[] { id }, cancellationToken);
        if (request != null)
        {
            _context.AssetRequests.Remove(request);
            await _context.SaveChangesAsync(cancellationToken);
        }
    }

    public async Task<AssetRequestLine> AddLineAsync(AssetRequestLine line, CancellationToken cancellationToken = default)
    {
        _context.AssetRequestLines.Add(line);
        await _context.SaveChangesAsync(cancellationToken);
        return line;
    }

    public async Task<AssetRequestLine> UpdateLineAsync(AssetRequestLine line, CancellationToken cancellationToken = default)
    {
        line.UpdatedAt = DateTime.UtcNow;
        _context.AssetRequestLines.Update(line);
        await _context.SaveChangesAsync(cancellationToken);
        return line;
    }

    public async Task DeleteLineAsync(int lineId, CancellationToken cancellationToken = default)
    {
        var line = await _context.AssetRequestLines.FindAsync(new object[] { lineId }, cancellationToken);
        if (line != null)
        {
            _context.AssetRequestLines.Remove(line);
            await _context.SaveChangesAsync(cancellationToken);
        }
    }

    public async Task<IReadOnlyList<AssetRequest>> GetUnlinkedAsync(CancellationToken cancellationToken = default)
    {
        return await _context.AssetRequests
            .AsNoTracking()
            .Where(r => r.EmployeeId == null && r.Status != AssetRequestStatus.Cancelled)
            .ToListAsync(cancellationToken);
    }

    public async Task<AssetRequestStatistics> GetStatisticsAsync(CancellationToken cancellationToken = default)
    {
        var monthStart = new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        var monthEnd = monthStart.AddMonths(1);

        var active = await _context.AssetRequests
            .CountAsync(r =>
                r.Status == AssetRequestStatus.Pending ||
                r.Status == AssetRequestStatus.Approved ||
                r.Status == AssetRequestStatus.InProgress,
                cancellationToken);

        var monthly = await _context.AssetRequests
            .CountAsync(r => r.CreatedAt >= monthStart && r.CreatedAt < monthEnd, cancellationToken);

        var inProgress = await _context.AssetRequests
            .CountAsync(r => r.Status == AssetRequestStatus.InProgress, cancellationToken);

        return new AssetRequestStatistics
        {
            ActiveRequests = active,
            MonthlyRequests = monthly,
            InProgressRequests = inProgress
        };
    }
}

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
        _context = context;
    }

    public async Task<IEnumerable<AssetRequest>> GetAllAsync()
    {
        return await _context.AssetRequests
            .Include(r => r.AssignedAsset)
            .OrderByDescending(r => r.RequestedDate)
            .ThenByDescending(r => r.CreatedAt)
            .ToListAsync();
    }

    public async Task<AssetRequest?> GetByIdAsync(int id)
    {
        return await _context.AssetRequests
            .Include(r => r.AssignedAsset)
            .FirstOrDefaultAsync(r => r.Id == id);
    }

    public async Task<IEnumerable<AssetRequest>> GetByDateRangeAsync(DateTime startDate, DateTime endDate)
    {
        return await _context.AssetRequests
            .Include(r => r.AssignedAsset)
            .Where(r => r.RequestedDate >= startDate && r.RequestedDate <= endDate)
            .OrderBy(r => r.RequestedDate)
            .ThenBy(r => r.CreatedAt)
            .ToListAsync();
    }

    public async Task<IEnumerable<AssetRequest>> GetByStatusAsync(AssetRequestStatus status)
    {
        return await _context.AssetRequests
            .Include(r => r.AssignedAsset)
            .Where(r => r.Status == status)
            .OrderByDescending(r => r.RequestedDate)
            .ToListAsync();
    }

    public async Task<AssetRequest> CreateAsync(AssetRequest request)
    {
        _context.AssetRequests.Add(request);
        await _context.SaveChangesAsync();
        return request;
    }

    public async Task<AssetRequest> UpdateAsync(AssetRequest request)
    {
        _context.AssetRequests.Update(request);
        await _context.SaveChangesAsync();
        return request;
    }

    public async Task DeleteAsync(int id)
    {
        var request = await _context.AssetRequests.FindAsync(id);
        if (request != null)
        {
            _context.AssetRequests.Remove(request);
            await _context.SaveChangesAsync();
        }
    }

    public async Task<int> GetPendingCountAsync()
    {
        return await _context.AssetRequests
            .Where(r => r.Status == AssetRequestStatus.Pending)
            .CountAsync();
    }

    public async Task<int> GetCountByTypeAsync(AssetRequestType type)
    {
        return await _context.AssetRequests
            .Where(r => r.RequestType == type && r.Status != AssetRequestStatus.Cancelled && r.Status != AssetRequestStatus.Rejected)
            .CountAsync();
    }
}

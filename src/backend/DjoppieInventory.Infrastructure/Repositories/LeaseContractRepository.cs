using DjoppieInventory.Core.Entities;
using DjoppieInventory.Core.Interfaces;
using DjoppieInventory.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace DjoppieInventory.Infrastructure.Repositories;

/// <summary>
/// Repository implementation for LeaseContract data access operations
/// </summary>
public class LeaseContractRepository : ILeaseContractRepository
{
    private readonly ApplicationDbContext _context;

    public LeaseContractRepository(ApplicationDbContext context)
    {
        _context = context ?? throw new ArgumentNullException(nameof(context));
    }

    public async Task<IEnumerable<LeaseContract>> GetByAssetIdAsync(int assetId, CancellationToken cancellationToken = default)
    {
        return await _context.LeaseContracts
            .Where(lc => lc.AssetId == assetId)
            .OrderByDescending(lc => lc.StartDate)
            .AsNoTracking()
            .ToListAsync(cancellationToken);
    }

    public async Task<LeaseContract?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        return await _context.LeaseContracts.FindAsync(new object[] { id }, cancellationToken);
    }

    public async Task<LeaseContract?> GetActiveLeaseForAssetAsync(int assetId, CancellationToken cancellationToken = default)
    {
        var today = DateTime.UtcNow.Date;

        return await _context.LeaseContracts
            .Where(lc => lc.AssetId == assetId)
            .Where(lc => lc.Status == LeaseStatus.Active || lc.Status == LeaseStatus.Expiring)
            .Where(lc => lc.StartDate <= today && lc.EndDate >= today)
            .OrderByDescending(lc => lc.StartDate)
            .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<IEnumerable<LeaseContract>> GetExpiringLeasesAsync(int daysAhead = 90, CancellationToken cancellationToken = default)
    {
        var today = DateTime.UtcNow.Date;
        var futureDate = today.AddDays(daysAhead);

        return await _context.LeaseContracts
            .Include(lc => lc.Asset)
            .Where(lc => lc.Status == LeaseStatus.Active || lc.Status == LeaseStatus.Expiring)
            .Where(lc => lc.EndDate >= today && lc.EndDate <= futureDate)
            .OrderBy(lc => lc.EndDate)
            .AsNoTracking()
            .ToListAsync(cancellationToken);
    }

    public async Task<LeaseContract> CreateAsync(LeaseContract leaseContract, CancellationToken cancellationToken = default)
    {
        leaseContract.CreatedAt = DateTime.UtcNow;
        leaseContract.UpdatedAt = DateTime.UtcNow;

        _context.LeaseContracts.Add(leaseContract);
        await _context.SaveChangesAsync(cancellationToken);
        return leaseContract;
    }

    public async Task<LeaseContract> UpdateAsync(LeaseContract leaseContract, CancellationToken cancellationToken = default)
    {
        leaseContract.UpdatedAt = DateTime.UtcNow;

        _context.LeaseContracts.Update(leaseContract);
        await _context.SaveChangesAsync(cancellationToken);
        return leaseContract;
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken cancellationToken = default)
    {
        var leaseContract = await _context.LeaseContracts.FindAsync(new object[] { id }, cancellationToken);
        if (leaseContract == null)
            return false;

        _context.LeaseContracts.Remove(leaseContract);
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }
}

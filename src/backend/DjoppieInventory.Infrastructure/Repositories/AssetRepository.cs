using DjoppieInventory.Core.Entities;
using DjoppieInventory.Core.Interfaces;
using DjoppieInventory.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;

namespace DjoppieInventory.Infrastructure.Repositories;

/// <summary>
/// Repository implementation for Asset data access operations
/// </summary>
public class AssetRepository : IAssetRepository
{
    private readonly ApplicationDbContext _context;

    public AssetRepository(ApplicationDbContext context)
    {
        _context = context ?? throw new ArgumentNullException(nameof(context));
    }

    public async Task<IEnumerable<Asset>> GetAllAsync(string? statusFilter = null, CancellationToken cancellationToken = default)
    {
        var query = _context.Assets
            .Include(a => a.AssetType)
            .Include(a => a.Service)
            .AsQueryable();

        if (!string.IsNullOrEmpty(statusFilter))
        {
            if (Enum.TryParse<AssetStatus>(statusFilter, true, out var status))
            {
                query = query.Where(a => a.Status == status);
            }
        }

        return await query
            .OrderByDescending(a => a.CreatedAt)
            .AsNoTracking()
            .ToListAsync(cancellationToken);
    }

    public async Task<(IEnumerable<Asset> Items, int TotalCount)> GetPagedAsync(
        string? statusFilter = null,
        int pageNumber = 1,
        int pageSize = 50,
        CancellationToken cancellationToken = default)
    {
        var query = _context.Assets
            .Include(a => a.AssetType)
            .Include(a => a.Service)
            .AsQueryable();

        if (!string.IsNullOrEmpty(statusFilter))
        {
            if (Enum.TryParse<AssetStatus>(statusFilter, true, out var status))
            {
                query = query.Where(a => a.Status == status);
            }
        }

        // Get total count before pagination
        var totalCount = await query.CountAsync(cancellationToken);

        // Apply pagination
        var items = await query
            .OrderByDescending(a => a.CreatedAt)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        return (items, totalCount);
    }

    public async Task<Asset?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        return await _context.Assets
            .Include(a => a.AssetType)
            .Include(a => a.Service)
            .FirstOrDefaultAsync(a => a.Id == id, cancellationToken);
    }

    public async Task<Asset?> GetByAssetCodeAsync(string assetCode, CancellationToken cancellationToken = default)
    {
        return await _context.Assets
            .Include(a => a.AssetType)
            .Include(a => a.Service)
            .FirstOrDefaultAsync(a => a.AssetCode == assetCode, cancellationToken);
    }

    public async Task<Asset> CreateAsync(Asset asset, CancellationToken cancellationToken = default)
    {
        asset.CreatedAt = DateTime.UtcNow;
        asset.UpdatedAt = DateTime.UtcNow;

        _context.Assets.Add(asset);
        await _context.SaveChangesAsync(cancellationToken);

        // Reload with navigation properties for mapping
        return await _context.Assets
            .Include(a => a.AssetType)
            .Include(a => a.Service)
            .FirstAsync(a => a.Id == asset.Id, cancellationToken);
    }

    public async Task<Asset> UpdateAsync(Asset asset, CancellationToken cancellationToken = default)
    {
        asset.UpdatedAt = DateTime.UtcNow;

        _context.Assets.Update(asset);
        await _context.SaveChangesAsync(cancellationToken);
        return asset;
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken cancellationToken = default)
    {
        var asset = await _context.Assets.FindAsync(new object[] { id }, cancellationToken);
        if (asset == null)
            return false;

        _context.Assets.Remove(asset);
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> AssetCodeExistsAsync(string assetCode, CancellationToken cancellationToken = default)
    {
        return await _context.Assets
            .AnyAsync(a => a.AssetCode == assetCode, cancellationToken);
    }

    public async Task<int> GetNextAssetNumberAsync(string prefix, bool isDummy = false, CancellationToken cancellationToken = default)
    {
        var prefixPattern = prefix + "-";
        var assetCodes = await _context.Assets
            .Where(a => a.AssetCode.StartsWith(prefixPattern))
            .Select(a => a.AssetCode)
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        if (isDummy)
        {
            // For dummy assets: find max number >= 9000, start at 9000 if none exist
            int maxDummyNumber = 8999;
            foreach (var code in assetCodes)
            {
                var numberPart = code.Substring(prefixPattern.Length);
                if (int.TryParse(numberPart, out var number) && number >= 9000 && number > maxDummyNumber)
                {
                    maxDummyNumber = number;
                }
            }
            return maxDummyNumber + 1;
        }
        else
        {
            // For normal assets: find max number < 9000
            int maxNumber = 0;
            foreach (var code in assetCodes)
            {
                var numberPart = code.Substring(prefixPattern.Length);
                if (int.TryParse(numberPart, out var number) && number < 9000 && number > maxNumber)
                {
                    maxNumber = number;
                }
            }
            return maxNumber + 1;
        }
    }

    public async Task<bool> SerialNumberExistsAsync(string serialNumber, int? excludeAssetId = null, CancellationToken cancellationToken = default)
    {
        var query = _context.Assets.Where(a => a.SerialNumber == serialNumber);

        if (excludeAssetId.HasValue)
        {
            query = query.Where(a => a.Id != excludeAssetId.Value);
        }

        return await query.AnyAsync(cancellationToken);
    }

    public async Task<Asset?> GetBySerialNumberAsync(string serialNumber, CancellationToken cancellationToken = default)
    {
        return await _context.Assets
            .Include(a => a.AssetType)
            .Include(a => a.Service)
            .FirstOrDefaultAsync(a => a.SerialNumber == serialNumber, cancellationToken);
    }

    public async Task<IEnumerable<Asset>> BulkCreateAsync(IEnumerable<Asset> assets, CancellationToken cancellationToken = default)
    {
        var assetList = assets.ToList();
        if (assetList.Count == 0)
            return assetList;

        var now = DateTime.UtcNow;
        foreach (var asset in assetList)
        {
            asset.CreatedAt = now;
            asset.UpdatedAt = now;
        }

        await _context.Assets.AddRangeAsync(assetList, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);

        // Reload with navigation properties for mapping
        var ids = assetList.Select(a => a.Id).ToList();
        return await _context.Assets
            .Include(a => a.AssetType)
            .Include(a => a.Service)
            .Where(a => ids.Contains(a.Id))
            .ToListAsync(cancellationToken);
    }

    public async Task<HashSet<string>> GetExistingAssetCodesAsync(string prefix, CancellationToken cancellationToken = default)
    {
        var prefixPattern = prefix + "-";
        var codes = await _context.Assets
            .Where(a => a.AssetCode.StartsWith(prefixPattern))
            .Select(a => a.AssetCode)
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        return codes.ToHashSet();
    }

    public async Task<IDbContextTransaction> BeginTransactionAsync(CancellationToken cancellationToken = default)
    {
        return await _context.Database.BeginTransactionAsync(cancellationToken);
    }
}

using DjoppieInventory.Core.Entities;
using DjoppieInventory.Core.Interfaces;
using DjoppieInventory.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace DjoppieInventory.Infrastructure.Repositories;

public class AssetRepository : IAssetRepository
{
    private readonly ApplicationDbContext _context;

    public AssetRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<Asset>> GetAllAsync(string? statusFilter = null)
    {
        var query = _context.Assets.AsQueryable();

        if (!string.IsNullOrEmpty(statusFilter))
        {
            if (Enum.TryParse<AssetStatus>(statusFilter, true, out var status))
            {
                query = query.Where(a => a.Status == status);
            }
        }

        return await query.OrderByDescending(a => a.CreatedAt).ToListAsync();
    }

    public async Task<Asset?> GetByIdAsync(int id)
    {
        return await _context.Assets.FindAsync(id);
    }

    public async Task<Asset?> GetByAssetCodeAsync(string assetCode)
    {
        return await _context.Assets.FirstOrDefaultAsync(a => a.AssetCode == assetCode);
    }

    public async Task<Asset> CreateAsync(Asset asset)
    {
        asset.CreatedAt = DateTime.UtcNow;
        asset.UpdatedAt = DateTime.UtcNow;

        _context.Assets.Add(asset);
        await _context.SaveChangesAsync();
        return asset;
    }

    public async Task<Asset> UpdateAsync(Asset asset)
    {
        asset.UpdatedAt = DateTime.UtcNow;

        _context.Assets.Update(asset);
        await _context.SaveChangesAsync();
        return asset;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var asset = await _context.Assets.FindAsync(id);
        if (asset == null)
            return false;

        _context.Assets.Remove(asset);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> AssetCodeExistsAsync(string assetCode)
    {
        return await _context.Assets.AnyAsync(a => a.AssetCode == assetCode);
    }

    public async Task<int> GetNextAssetNumberAsync(string prefix, bool isDummy = false)
    {
        var prefixPattern = prefix + "-";
        var assetCodes = await _context.Assets
            .Where(a => a.AssetCode.StartsWith(prefixPattern))
            .Select(a => a.AssetCode)
            .ToListAsync();

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

    public async Task<bool> SerialNumberExistsAsync(string serialNumber, int? excludeAssetId = null)
    {
        var query = _context.Assets.Where(a => a.SerialNumber == serialNumber);

        if (excludeAssetId.HasValue)
        {
            query = query.Where(a => a.Id != excludeAssetId.Value);
        }

        return await query.AnyAsync();
    }

    public async Task<Asset?> GetBySerialNumberAsync(string serialNumber)
    {
        return await _context.Assets.FirstOrDefaultAsync(a => a.SerialNumber == serialNumber);
    }
}

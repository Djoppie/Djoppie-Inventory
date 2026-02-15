using DjoppieInventory.Core.Entities;
using DjoppieInventory.Core.Interfaces;
using DjoppieInventory.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace DjoppieInventory.Infrastructure.Repositories;

/// <summary>
/// Repository implementation for AssetType data access operations
/// </summary>
public class AssetTypeRepository : IAssetTypeRepository
{
    private readonly ApplicationDbContext _context;

    public AssetTypeRepository(ApplicationDbContext context)
    {
        _context = context ?? throw new ArgumentNullException(nameof(context));
    }

    public async Task<IEnumerable<AssetType>> GetAllAsync(bool includeInactive = false, CancellationToken cancellationToken = default)
    {
        var query = _context.AssetTypes.AsQueryable();

        if (!includeInactive)
        {
            query = query.Where(at => at.IsActive);
        }

        return await query
            .OrderBy(at => at.SortOrder)
            .ThenBy(at => at.Name)
            .AsNoTracking()
            .ToListAsync(cancellationToken);
    }

    public async Task<AssetType?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        return await _context.AssetTypes.FindAsync(new object[] { id }, cancellationToken);
    }

    public async Task<AssetType?> GetByCodeAsync(string code, CancellationToken cancellationToken = default)
    {
        return await _context.AssetTypes
            .FirstOrDefaultAsync(at => at.Code == code, cancellationToken);
    }

    public async Task<AssetType> CreateAsync(AssetType assetType, CancellationToken cancellationToken = default)
    {
        assetType.CreatedAt = DateTime.UtcNow;
        assetType.UpdatedAt = DateTime.UtcNow;

        _context.AssetTypes.Add(assetType);
        await _context.SaveChangesAsync(cancellationToken);
        return assetType;
    }

    public async Task<AssetType> UpdateAsync(AssetType assetType, CancellationToken cancellationToken = default)
    {
        assetType.UpdatedAt = DateTime.UtcNow;

        _context.AssetTypes.Update(assetType);
        await _context.SaveChangesAsync(cancellationToken);
        return assetType;
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken cancellationToken = default)
    {
        var assetType = await _context.AssetTypes.FindAsync(new object[] { id }, cancellationToken);
        if (assetType == null)
            return false;

        // Soft delete: set IsActive to false
        assetType.IsActive = false;
        assetType.UpdatedAt = DateTime.UtcNow;

        _context.AssetTypes.Update(assetType);
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> CodeExistsAsync(string code, int? excludeId = null, CancellationToken cancellationToken = default)
    {
        var query = _context.AssetTypes.Where(at => at.Code == code);

        if (excludeId.HasValue)
        {
            query = query.Where(at => at.Id != excludeId.Value);
        }

        return await query.AnyAsync(cancellationToken);
    }
}

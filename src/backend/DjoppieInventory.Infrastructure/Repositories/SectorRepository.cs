using DjoppieInventory.Core.Entities;
using DjoppieInventory.Core.Interfaces;
using DjoppieInventory.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace DjoppieInventory.Infrastructure.Repositories;

/// <summary>
/// Repository implementation for Sector data access operations
/// </summary>
public class SectorRepository : ISectorRepository
{
    private readonly ApplicationDbContext _context;

    public SectorRepository(ApplicationDbContext context)
    {
        _context = context ?? throw new ArgumentNullException(nameof(context));
    }

    public async Task<IEnumerable<Sector>> GetAllAsync(bool includeInactive = false, CancellationToken cancellationToken = default)
    {
        var query = _context.Sectors.AsQueryable();

        if (!includeInactive)
        {
            query = query.Where(s => s.IsActive);
        }

        return await query
            .OrderBy(s => s.SortOrder)
            .ThenBy(s => s.Name)
            .AsNoTracking()
            .ToListAsync(cancellationToken);
    }

    public async Task<Sector?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        return await _context.Sectors.FindAsync(new object[] { id }, cancellationToken);
    }

    public async Task<Sector?> GetByCodeAsync(string code, CancellationToken cancellationToken = default)
    {
        return await _context.Sectors
            .FirstOrDefaultAsync(s => s.Code == code, cancellationToken);
    }

    public async Task<Sector> CreateAsync(Sector sector, CancellationToken cancellationToken = default)
    {
        sector.CreatedAt = DateTime.UtcNow;
        sector.UpdatedAt = DateTime.UtcNow;

        _context.Sectors.Add(sector);
        await _context.SaveChangesAsync(cancellationToken);
        return sector;
    }

    public async Task<Sector> UpdateAsync(Sector sector, CancellationToken cancellationToken = default)
    {
        sector.UpdatedAt = DateTime.UtcNow;

        _context.Sectors.Update(sector);
        await _context.SaveChangesAsync(cancellationToken);
        return sector;
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken cancellationToken = default)
    {
        var sector = await _context.Sectors.FindAsync(new object[] { id }, cancellationToken);
        if (sector == null)
            return false;

        // Soft delete: set IsActive to false
        sector.IsActive = false;
        sector.UpdatedAt = DateTime.UtcNow;

        _context.Sectors.Update(sector);
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> CodeExistsAsync(string code, int? excludeId = null, CancellationToken cancellationToken = default)
    {
        var query = _context.Sectors.Where(s => s.Code == code);

        if (excludeId.HasValue)
        {
            query = query.Where(s => s.Id != excludeId.Value);
        }

        return await query.AnyAsync(cancellationToken);
    }
}

using DjoppieInventory.Core.Entities;
using DjoppieInventory.Core.Interfaces;
using DjoppieInventory.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace DjoppieInventory.Infrastructure.Repositories;

/// <summary>
/// Repository implementation for Building data access operations
/// </summary>
public class BuildingRepository : IBuildingRepository
{
    private readonly ApplicationDbContext _context;

    public BuildingRepository(ApplicationDbContext context)
    {
        _context = context ?? throw new ArgumentNullException(nameof(context));
    }

    public async Task<IEnumerable<Building>> GetAllAsync(bool includeInactive = false, CancellationToken cancellationToken = default)
    {
        var query = _context.Buildings.AsQueryable();

        if (!includeInactive)
        {
            query = query.Where(b => b.IsActive);
        }

        return await query
            .OrderBy(b => b.SortOrder)
            .ThenBy(b => b.Name)
            .AsNoTracking()
            .ToListAsync(cancellationToken);
    }

    public async Task<Building?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        return await _context.Buildings.FindAsync(new object[] { id }, cancellationToken);
    }

    public async Task<Building?> GetByCodeAsync(string code, CancellationToken cancellationToken = default)
    {
        return await _context.Buildings
            .FirstOrDefaultAsync(b => b.Code == code, cancellationToken);
    }

    public async Task<Building> CreateAsync(Building building, CancellationToken cancellationToken = default)
    {
        building.CreatedAt = DateTime.UtcNow;
        building.UpdatedAt = DateTime.UtcNow;

        _context.Buildings.Add(building);
        await _context.SaveChangesAsync(cancellationToken);
        return building;
    }

    public async Task<Building> UpdateAsync(Building building, CancellationToken cancellationToken = default)
    {
        building.UpdatedAt = DateTime.UtcNow;

        _context.Buildings.Update(building);
        await _context.SaveChangesAsync(cancellationToken);
        return building;
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken cancellationToken = default)
    {
        var building = await _context.Buildings.FindAsync(new object[] { id }, cancellationToken);
        if (building == null)
            return false;

        // Soft delete: set IsActive to false
        building.IsActive = false;
        building.UpdatedAt = DateTime.UtcNow;

        _context.Buildings.Update(building);
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> CodeExistsAsync(string code, int? excludeId = null, CancellationToken cancellationToken = default)
    {
        var query = _context.Buildings.Where(b => b.Code == code);

        if (excludeId.HasValue)
        {
            query = query.Where(b => b.Id != excludeId.Value);
        }

        return await query.AnyAsync(cancellationToken);
    }
}

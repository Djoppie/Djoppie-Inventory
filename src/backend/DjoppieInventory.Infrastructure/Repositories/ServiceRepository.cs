using DjoppieInventory.Core.Entities;
using DjoppieInventory.Core.Interfaces;
using DjoppieInventory.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace DjoppieInventory.Infrastructure.Repositories;

/// <summary>
/// Repository implementation for Service data access operations
/// </summary>
public class ServiceRepository : IServiceRepository
{
    private readonly ApplicationDbContext _context;

    public ServiceRepository(ApplicationDbContext context)
    {
        _context = context ?? throw new ArgumentNullException(nameof(context));
    }

    public async Task<IEnumerable<Service>> GetAllAsync(bool includeInactive = false, int? sectorId = null, CancellationToken cancellationToken = default)
    {
        var query = _context.Services.AsQueryable();

        if (!includeInactive)
        {
            query = query.Where(s => s.IsActive);
        }

        if (sectorId.HasValue)
        {
            query = query.Where(s => s.SectorId == sectorId.Value);
        }

        return await query
            .Include(s => s.Sector)
            .OrderBy(s => s.SortOrder)
            .ThenBy(s => s.Name)
            .AsNoTracking()
            .ToListAsync(cancellationToken);
    }

    public async Task<Service?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        return await _context.Services
            .Include(s => s.Sector)
            .FirstOrDefaultAsync(s => s.Id == id, cancellationToken);
    }

    public async Task<Service?> GetByCodeAsync(string code, CancellationToken cancellationToken = default)
    {
        return await _context.Services
            .Include(s => s.Sector)
            .FirstOrDefaultAsync(s => s.Code == code, cancellationToken);
    }

    public async Task<Service> CreateAsync(Service service, CancellationToken cancellationToken = default)
    {
        service.CreatedAt = DateTime.UtcNow;
        service.UpdatedAt = DateTime.UtcNow;

        _context.Services.Add(service);
        await _context.SaveChangesAsync(cancellationToken);

        // Reload to include Sector navigation property
        await _context.Entry(service).Reference(s => s.Sector).LoadAsync(cancellationToken);

        return service;
    }

    public async Task<Service> UpdateAsync(Service service, CancellationToken cancellationToken = default)
    {
        service.UpdatedAt = DateTime.UtcNow;

        _context.Services.Update(service);
        await _context.SaveChangesAsync(cancellationToken);

        // Reload to include Sector navigation property
        await _context.Entry(service).Reference(s => s.Sector).LoadAsync(cancellationToken);

        return service;
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken cancellationToken = default)
    {
        var service = await _context.Services.FindAsync(new object[] { id }, cancellationToken);
        if (service == null)
            return false;

        // Soft delete: set IsActive to false
        service.IsActive = false;
        service.UpdatedAt = DateTime.UtcNow;

        _context.Services.Update(service);
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> CodeExistsAsync(string code, int? excludeId = null, CancellationToken cancellationToken = default)
    {
        var query = _context.Services.Where(s => s.Code == code);

        if (excludeId.HasValue)
        {
            query = query.Where(s => s.Id != excludeId.Value);
        }

        return await query.AnyAsync(cancellationToken);
    }
}

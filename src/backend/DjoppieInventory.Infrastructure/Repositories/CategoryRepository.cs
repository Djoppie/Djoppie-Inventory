using DjoppieInventory.Core.Entities;
using DjoppieInventory.Core.Interfaces;
using DjoppieInventory.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace DjoppieInventory.Infrastructure.Repositories;

/// <summary>
/// Repository implementation for Category data access operations
/// </summary>
public class CategoryRepository : ICategoryRepository
{
    private readonly ApplicationDbContext _context;

    public CategoryRepository(ApplicationDbContext context)
    {
        _context = context ?? throw new ArgumentNullException(nameof(context));
    }

    public async Task<IEnumerable<Category>> GetAllAsync(bool includeInactive = false, CancellationToken cancellationToken = default)
    {
        var query = _context.Categories
            .Include(c => c.AssetTypes.Where(at => at.IsActive))
            .AsQueryable();

        if (!includeInactive)
        {
            query = query.Where(c => c.IsActive);
        }

        return await query
            .OrderBy(c => c.SortOrder)
            .ThenBy(c => c.Name)
            .AsNoTracking()
            .ToListAsync(cancellationToken);
    }

    public async Task<Category?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        return await _context.Categories
            .Include(c => c.AssetTypes.Where(at => at.IsActive))
            .FirstOrDefaultAsync(c => c.Id == id, cancellationToken);
    }

    public async Task<Category?> GetByCodeAsync(string code, CancellationToken cancellationToken = default)
    {
        return await _context.Categories
            .Include(c => c.AssetTypes.Where(at => at.IsActive))
            .FirstOrDefaultAsync(c => c.Code == code, cancellationToken);
    }

    public async Task<Category> CreateAsync(Category category, CancellationToken cancellationToken = default)
    {
        category.CreatedAt = DateTime.UtcNow;
        category.UpdatedAt = DateTime.UtcNow;

        _context.Categories.Add(category);
        await _context.SaveChangesAsync(cancellationToken);
        return category;
    }

    public async Task<Category> UpdateAsync(Category category, CancellationToken cancellationToken = default)
    {
        category.UpdatedAt = DateTime.UtcNow;

        _context.Categories.Update(category);
        await _context.SaveChangesAsync(cancellationToken);
        return category;
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken cancellationToken = default)
    {
        var category = await _context.Categories.FindAsync(new object[] { id }, cancellationToken);
        if (category == null)
            return false;

        // Soft delete: set IsActive to false
        category.IsActive = false;
        category.UpdatedAt = DateTime.UtcNow;

        _context.Categories.Update(category);
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> CodeExistsAsync(string code, int? excludeId = null, CancellationToken cancellationToken = default)
    {
        var query = _context.Categories.Where(c => c.Code == code);

        if (excludeId.HasValue)
        {
            query = query.Where(c => c.Id != excludeId.Value);
        }

        return await query.AnyAsync(cancellationToken);
    }
}

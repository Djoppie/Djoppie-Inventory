using DjoppieInventory.Core.Entities;
using DjoppieInventory.Core.Interfaces;
using DjoppieInventory.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace DjoppieInventory.Infrastructure.Repositories;

/// <summary>
/// Repository implementation for AssetTemplate data access operations
/// </summary>
public class AssetTemplateRepository : IAssetTemplateRepository
{
    private readonly ApplicationDbContext _context;

    public AssetTemplateRepository(ApplicationDbContext context)
    {
        _context = context ?? throw new ArgumentNullException(nameof(context));
    }

    public async Task<IEnumerable<AssetTemplate>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await _context.AssetTemplates
            .Where(t => t.IsActive)
            .OrderBy(t => t.TemplateName)
            .AsNoTracking()
            .ToListAsync(cancellationToken);
    }

    public async Task<AssetTemplate?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        return await _context.AssetTemplates
            .FirstOrDefaultAsync(t => t.Id == id && t.IsActive, cancellationToken);
    }

    public async Task<AssetTemplate> CreateAsync(AssetTemplate template, CancellationToken cancellationToken = default)
    {
        template.IsActive = true;
        _context.AssetTemplates.Add(template);
        await _context.SaveChangesAsync(cancellationToken);
        return template;
    }

    public async Task<AssetTemplate> UpdateAsync(AssetTemplate template, CancellationToken cancellationToken = default)
    {
        _context.AssetTemplates.Update(template);
        await _context.SaveChangesAsync(cancellationToken);
        return template;
    }

    public async Task DeleteAsync(int id, CancellationToken cancellationToken = default)
    {
        var template = await _context.AssetTemplates.FindAsync(new object[] { id }, cancellationToken);
        if (template != null)
        {
            template.IsActive = false;
            await _context.SaveChangesAsync(cancellationToken);
        }
    }
}

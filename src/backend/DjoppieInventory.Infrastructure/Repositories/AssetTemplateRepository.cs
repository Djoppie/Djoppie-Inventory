using DjoppieInventory.Core.Entities;
using DjoppieInventory.Core.Interfaces;
using DjoppieInventory.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace DjoppieInventory.Infrastructure.Repositories;

public class AssetTemplateRepository : IAssetTemplateRepository
{
    private readonly ApplicationDbContext _context;

    public AssetTemplateRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<AssetTemplate>> GetAllAsync()
    {
        return await _context.AssetTemplates
            .Where(t => t.IsActive)
            .OrderBy(t => t.TemplateName)
            .ToListAsync();
    }

    public async Task<AssetTemplate?> GetByIdAsync(int id)
    {
        return await _context.AssetTemplates
            .FirstOrDefaultAsync(t => t.Id == id && t.IsActive);
    }

    public async Task<AssetTemplate> CreateAsync(AssetTemplate template)
    {
        template.IsActive = true;
        _context.AssetTemplates.Add(template);
        await _context.SaveChangesAsync();
        return template;
    }

    public async Task<AssetTemplate> UpdateAsync(AssetTemplate template)
    {
        _context.AssetTemplates.Update(template);
        await _context.SaveChangesAsync();
        return template;
    }

    public async Task DeleteAsync(int id)
    {
        var template = await _context.AssetTemplates.FindAsync(id);
        if (template != null)
        {
            template.IsActive = false;
            await _context.SaveChangesAsync();
        }
    }
}

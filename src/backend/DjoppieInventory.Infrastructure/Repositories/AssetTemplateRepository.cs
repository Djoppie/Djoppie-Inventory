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
        return await _context.AssetTemplates.FindAsync(id);
    }
}

using DjoppieInventory.Core.Interfaces;
using DjoppieInventory.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace DjoppieInventory.Infrastructure.Services;

/// <summary>
/// Implements <see cref="IEmployeeResolver"/> by querying the Employees table.
/// Case-insensitive exact match against UserPrincipalName, then DisplayName.
/// Intentionally not cached — the write-paths using this service mutate data
/// themselves, so per-request resolution avoids stale reads.
/// </summary>
public class EmployeeResolver : IEmployeeResolver
{
    private readonly ApplicationDbContext _db;

    public EmployeeResolver(ApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<int?> ResolveEmployeeIdAsync(string? owner, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(owner)) return null;
        var trimmed = owner.Trim();

        // Try UPN match first (unique in practice); fall back to DisplayName.
        // EF.Functions.Collate / ToLower() not used — LIKE with COLLATE would
        // be more portable but a two-step match keeps this provider-agnostic.
        var byUpn = await _db.Employees.AsNoTracking()
            .Where(e => e.IsActive && e.UserPrincipalName.ToLower() == trimmed.ToLower())
            .Select(e => (int?)e.Id)
            .FirstOrDefaultAsync(ct);
        if (byUpn.HasValue) return byUpn;

        var byName = await _db.Employees.AsNoTracking()
            .Where(e => e.IsActive && e.DisplayName.ToLower() == trimmed.ToLower())
            .Select(e => (int?)e.Id)
            .FirstOrDefaultAsync(ct);
        return byName;
    }
}

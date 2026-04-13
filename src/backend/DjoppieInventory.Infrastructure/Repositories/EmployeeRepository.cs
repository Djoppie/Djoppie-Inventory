using DjoppieInventory.Core.Entities;
using DjoppieInventory.Core.Interfaces;
using DjoppieInventory.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace DjoppieInventory.Infrastructure.Repositories;

/// <summary>
/// Repository implementation for Employee data access operations
/// </summary>
public class EmployeeRepository : IEmployeeRepository
{
    private readonly ApplicationDbContext _context;

    public EmployeeRepository(ApplicationDbContext context)
    {
        _context = context ?? throw new ArgumentNullException(nameof(context));
    }

    public async Task<IEnumerable<Employee>> GetAllAsync(bool includeInactive = false, int? serviceId = null, CancellationToken cancellationToken = default)
    {
        var query = _context.Employees.AsQueryable();

        if (!includeInactive)
        {
            query = query.Where(e => e.IsActive);
        }

        if (serviceId.HasValue)
        {
            query = query.Where(e => e.ServiceId == serviceId.Value);
        }

        return await query
            .Include(e => e.Service)
            .Include(e => e.CurrentWorkplace)
            .OrderBy(e => e.DisplayName)
            .AsNoTracking()
            .ToListAsync(cancellationToken);
    }

    public async Task<Employee?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        return await _context.Employees
            .Include(e => e.Service)
            .Include(e => e.CurrentWorkplace)
            .FirstOrDefaultAsync(e => e.Id == id, cancellationToken);
    }

    public async Task<Employee?> GetByEntraIdAsync(string entraId, CancellationToken cancellationToken = default)
    {
        return await _context.Employees
            .Include(e => e.Service)
            .Include(e => e.CurrentWorkplace)
            .FirstOrDefaultAsync(e => e.EntraId == entraId, cancellationToken);
    }

    public async Task<Employee?> GetByUpnAsync(string upn, CancellationToken cancellationToken = default)
    {
        return await _context.Employees
            .Include(e => e.Service)
            .Include(e => e.CurrentWorkplace)
            .FirstOrDefaultAsync(e => e.UserPrincipalName == upn, cancellationToken);
    }

    public async Task<IEnumerable<Employee>> SearchByNameAsync(string searchTerm, int maxResults = 20, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(searchTerm))
            return Enumerable.Empty<Employee>();

        var normalizedSearch = searchTerm.ToLower();

        return await _context.Employees
            .Include(e => e.Service)
            .Include(e => e.CurrentWorkplace)
            .Where(e => e.IsActive &&
                (e.DisplayName.ToLower().Contains(normalizedSearch) ||
                 (e.Email != null && e.Email.ToLower().Contains(normalizedSearch)) ||
                 e.UserPrincipalName.ToLower().Contains(normalizedSearch)))
            .OrderBy(e => e.DisplayName)
            .Take(maxResults)
            .AsNoTracking()
            .ToListAsync(cancellationToken);
    }

    public async Task<Employee> CreateAsync(Employee employee, CancellationToken cancellationToken = default)
    {
        employee.CreatedAt = DateTime.UtcNow;
        employee.UpdatedAt = DateTime.UtcNow;

        _context.Employees.Add(employee);
        await _context.SaveChangesAsync(cancellationToken);

        // Reload to include Service navigation property
        await _context.Entry(employee).Reference(e => e.Service).LoadAsync(cancellationToken);

        return employee;
    }

    public async Task<Employee> UpdateAsync(Employee employee, CancellationToken cancellationToken = default)
    {
        employee.UpdatedAt = DateTime.UtcNow;

        _context.Employees.Update(employee);
        await _context.SaveChangesAsync(cancellationToken);

        // Reload to include Service navigation property
        await _context.Entry(employee).Reference(e => e.Service).LoadAsync(cancellationToken);

        return employee;
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken cancellationToken = default)
    {
        var employee = await _context.Employees.FindAsync(new object[] { id }, cancellationToken);
        if (employee == null)
            return false;

        // Soft delete: set IsActive to false
        employee.IsActive = false;
        employee.UpdatedAt = DateTime.UtcNow;

        _context.Employees.Update(employee);
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> EntraIdExistsAsync(string entraId, int? excludeId = null, CancellationToken cancellationToken = default)
    {
        var query = _context.Employees.Where(e => e.EntraId == entraId);

        if (excludeId.HasValue)
        {
            query = query.Where(e => e.Id != excludeId.Value);
        }

        return await query.AnyAsync(cancellationToken);
    }

    public async Task<int> GetAssetCountAsync(int employeeId, CancellationToken cancellationToken = default)
    {
        return await _context.Assets
            .CountAsync(a => a.EmployeeId == employeeId, cancellationToken);
    }

    public async Task<Dictionary<int, int>> GetAllAssetCountsAsync(CancellationToken cancellationToken = default)
    {
        return await _context.Assets
            .Where(a => a.EmployeeId.HasValue)
            .GroupBy(a => a.EmployeeId!.Value)
            .Select(g => new { EmployeeId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.EmployeeId, x => x.Count, cancellationToken);
    }
}

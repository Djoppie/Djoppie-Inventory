using DjoppieInventory.Core.Entities;

namespace DjoppieInventory.Core.Interfaces;

/// <summary>
/// Repository interface for Employee data access operations
/// </summary>
public interface IEmployeeRepository
{
    /// <summary>
    /// Gets all employees, optionally including inactive ones and filtering by service.
    /// Results are ordered by DisplayName.
    /// </summary>
    Task<IEnumerable<Employee>> GetAllAsync(bool includeInactive = false, int? serviceId = null, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets a single employee by its ID
    /// </summary>
    Task<Employee?> GetByIdAsync(int id, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets a single employee by its Microsoft Entra ID (Azure AD object ID)
    /// </summary>
    Task<Employee?> GetByEntraIdAsync(string entraId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets a single employee by User Principal Name (email)
    /// </summary>
    Task<Employee?> GetByUpnAsync(string upn, CancellationToken cancellationToken = default);

    /// <summary>
    /// Searches employees by display name (partial match)
    /// </summary>
    Task<IEnumerable<Employee>> SearchByNameAsync(string searchTerm, int maxResults = 20, CancellationToken cancellationToken = default);

    /// <summary>
    /// Creates a new employee
    /// </summary>
    Task<Employee> CreateAsync(Employee employee, CancellationToken cancellationToken = default);

    /// <summary>
    /// Updates an existing employee
    /// </summary>
    Task<Employee> UpdateAsync(Employee employee, CancellationToken cancellationToken = default);

    /// <summary>
    /// Soft deletes an employee by setting IsActive to false.
    /// Returns true if successful, false if not found.
    /// </summary>
    Task<bool> DeleteAsync(int id, CancellationToken cancellationToken = default);

    /// <summary>
    /// Checks if an Entra ID already exists in the database.
    /// Can exclude a specific ID for update operations.
    /// </summary>
    Task<bool> EntraIdExistsAsync(string entraId, int? excludeId = null, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets the count of assets assigned to an employee
    /// </summary>
    Task<int> GetAssetCountAsync(int employeeId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets all employees with their asset counts
    /// </summary>
    Task<Dictionary<int, int>> GetAllAssetCountsAsync(CancellationToken cancellationToken = default);
}

using DjoppieInventory.Core.DTOs;
using DjoppieInventory.Core.Entities;

namespace DjoppieInventory.Core.Interfaces;

/// <summary>
/// Service interface for synchronizing organization structure (Sectors and Services) from Microsoft Entra ID.
/// Syncs MG-SECTOR-* groups as sectors and MG-* groups as services.
/// </summary>
public interface IOrganizationSyncService
{
    /// <summary>
    /// Synchronizes the organization structure from Entra ID mail-enabled groups.
    /// Syncs sectors (MG-SECTOR-*) and services (MG-*) with member counts.
    /// </summary>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Result of the sync operation including statistics</returns>
    Task<OrganizationSyncResultDto> SyncOrganizationAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Synchronizes only sectors from Entra ID.
    /// </summary>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Result of the sync operation</returns>
    Task<OrganizationSyncResultDto> SyncSectorsAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Synchronizes only services from Entra ID.
    /// </summary>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Result of the sync operation</returns>
    Task<OrganizationSyncResultDto> SyncServicesAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets the current sync status for all sectors and services.
    /// </summary>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Current sync status</returns>
    Task<OrganizationSyncStatusDto> GetSyncStatusAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets the organization hierarchy (sectors with their services).
    /// </summary>
    /// <param name="includeInactive">Include inactive sectors and services</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Organization hierarchy</returns>
    Task<OrganizationHierarchyDto> GetHierarchyAsync(bool includeInactive = false, CancellationToken cancellationToken = default);

    /// <summary>
    /// Refreshes member count for a specific service from Entra ID.
    /// </summary>
    /// <param name="serviceId">Service ID to refresh</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Updated member count</returns>
    Task<int> RefreshServiceMemberCountAsync(int serviceId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Links a service to an Entra group by group ID.
    /// </summary>
    /// <param name="serviceId">Service ID</param>
    /// <param name="entraGroupId">Entra group ID (GUID)</param>
    /// <param name="cancellationToken">Cancellation token</param>
    Task LinkServiceToEntraGroupAsync(int serviceId, string entraGroupId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Links a sector to an Entra group by group ID.
    /// </summary>
    /// <param name="sectorId">Sector ID</param>
    /// <param name="entraGroupId">Entra group ID (GUID)</param>
    /// <param name="cancellationToken">Cancellation token</param>
    Task LinkSectorToEntraGroupAsync(int sectorId, string entraGroupId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Synchronizes employees from Entra ID service groups (MG-*).
    /// For each service with an EntraGroupId, retrieves group members and creates/updates Employee records.
    /// </summary>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Result of the sync operation including statistics</returns>
    Task<EmployeeSyncResultDto> SyncEmployeesAsync(CancellationToken cancellationToken = default);
}

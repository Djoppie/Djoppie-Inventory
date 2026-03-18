using DjoppieInventory.Core.DTOs.LaptopSwap;

namespace DjoppieInventory.Core.Interfaces;

/// <summary>
/// Service for handling device deployments (onboarding and laptop swaps)
/// </summary>
public interface IDeploymentService
{
    /// <summary>
    /// Execute a device deployment (onboarding or swap)
    /// </summary>
    /// <param name="request">Deployment request details</param>
    /// <param name="performedBy">Name of the user performing the action</param>
    /// <param name="performedByEmail">Email of the user performing the action</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Deployment result with summary of changes</returns>
    Task<DeploymentResultDto> ExecuteDeploymentAsync(
        ExecuteDeploymentDto request,
        string performedBy,
        string performedByEmail,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Check if physical workplace has a different occupant than requested
    /// </summary>
    /// <param name="physicalWorkplaceId">Physical workplace ID</param>
    /// <param name="requestedOwnerEntraId">Entra ID of the requested new occupant</param>
    /// <param name="requestedOwnerName">Name of the requested new occupant</param>
    /// <param name="requestedOwnerEmail">Email of the requested new occupant</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Conflict info if different occupant exists, null if no conflict</returns>
    Task<OccupantConflictDto?> CheckOccupantConflictAsync(
        int physicalWorkplaceId,
        string requestedOwnerEntraId,
        string requestedOwnerName,
        string requestedOwnerEmail,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Get deployment history with filters and pagination
    /// </summary>
    /// <param name="fromDate">Optional start date filter</param>
    /// <param name="toDate">Optional end date filter</param>
    /// <param name="ownerEmail">Optional owner email filter</param>
    /// <param name="mode">Optional deployment mode filter</param>
    /// <param name="pageNumber">Page number (1-based)</param>
    /// <param name="pageSize">Page size (max 200)</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Paged deployment history</returns>
    Task<DeploymentHistoryResultDto> GetDeploymentHistoryAsync(
        DateTime? fromDate,
        DateTime? toDate,
        string? ownerEmail,
        DeploymentMode? mode,
        int pageNumber,
        int pageSize,
        CancellationToken cancellationToken = default);
}

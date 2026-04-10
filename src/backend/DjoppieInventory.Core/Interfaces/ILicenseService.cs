using DjoppieInventory.Core.DTOs;

namespace DjoppieInventory.Core.Interfaces;

/// <summary>
/// Service interface for Microsoft 365 license management operations.
/// Provides methods to query license information from Microsoft Graph API.
/// </summary>
public interface ILicenseService
{
    /// <summary>
    /// Gets license summary for the organization (E3, E5, F1 licenses).
    /// </summary>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>License summary with totals and utilization percentages</returns>
    Task<LicenseSummaryDto> GetLicenseSummaryAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets users with assigned licenses.
    /// </summary>
    /// <param name="skuId">Optional SKU ID to filter by specific license type</param>
    /// <param name="department">Optional department name to filter</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Collection of users with their assigned licenses</returns>
    Task<IEnumerable<LicenseUserDto>> GetLicenseUsersAsync(
        string? skuId = null,
        string? department = null,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets license statistics breakdown by department.
    /// </summary>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Statistics breakdown by department and job title</returns>
    Task<LicenseStatisticsDto> GetLicenseStatisticsAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Analyzes license usage and provides optimization recommendations.
    /// Identifies inactive users and potential downgrades (E5→E3, E3→F1).
    /// </summary>
    /// <param name="inactiveDaysThreshold">Days since last sign-in to consider user inactive (default: 90)</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Optimization analysis with recommendations and potential savings</returns>
    Task<LicenseOptimizationDto> GetLicenseOptimizationAsync(
        int inactiveDaysThreshold = 90,
        CancellationToken cancellationToken = default);
}

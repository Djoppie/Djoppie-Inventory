using DjoppieInventory.Core.DTOs;
using DjoppieInventory.Core.Entities;
using DjoppieInventory.Core.Entities.Enums;

namespace DjoppieInventory.Core.Interfaces;

/// <summary>
/// Service interface for recording and tracking asset movements during rollout execution.
/// Provides audit trail and reporting for asset lifecycle events (deployments, decommissions, transfers).
/// </summary>
public interface IAssetMovementService
{
    /// <summary>
    /// Records an asset deployment (Nieuw/Stock -> InGebruik).
    /// </summary>
    /// <param name="request">Deployment request details</param>
    /// <param name="performedBy">Display name of the technician</param>
    /// <param name="performedByEmail">Email of the technician</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>The recorded movement</returns>
    Task<RolloutAssetMovement> RecordDeploymentAsync(
        AssetDeploymentRequest request,
        string performedBy,
        string performedByEmail,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Records an asset decommission (InGebruik -> UitDienst/Defect).
    /// </summary>
    /// <param name="request">Decommission request details</param>
    /// <param name="performedBy">Display name of the technician</param>
    /// <param name="performedByEmail">Email of the technician</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>The recorded movement</returns>
    Task<RolloutAssetMovement> RecordDecommissionAsync(
        AssetDecommissionRequest request,
        string performedBy,
        string performedByEmail,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Records an asset transfer (owner/location change, status may remain InGebruik).
    /// </summary>
    /// <param name="request">Transfer request details</param>
    /// <param name="performedBy">Display name of the technician</param>
    /// <param name="performedByEmail">Email of the technician</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>The recorded movement</returns>
    Task<RolloutAssetMovement> RecordTransferAsync(
        AssetTransferRequest request,
        string performedBy,
        string performedByEmail,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets all movements for a rollout session.
    /// </summary>
    /// <param name="sessionId">Rollout session ID</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>List of movements for the session</returns>
    Task<IEnumerable<AssetMovementDto>> GetMovementsBySessionAsync(
        int sessionId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets movements for a specific workplace.
    /// </summary>
    /// <param name="workplaceId">Workplace ID</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>List of movements for the workplace</returns>
    Task<IEnumerable<AssetMovementDto>> GetMovementsByWorkplaceAsync(
        int workplaceId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets all movements for a specific asset.
    /// </summary>
    /// <param name="assetId">Asset ID</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>List of movements for the asset</returns>
    Task<IEnumerable<AssetMovementDto>> GetMovementsByAssetAsync(
        int assetId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets summary statistics for a rollout session.
    /// </summary>
    /// <param name="sessionId">Rollout session ID</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Movement summary statistics</returns>
    Task<MovementSummaryDto> GetMovementSummaryAsync(
        int sessionId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Exports movements for a session to CSV format.
    /// </summary>
    /// <param name="sessionId">Rollout session ID</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>CSV content as string</returns>
    Task<string> ExportToCsvAsync(
        int sessionId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets movements within a date range.
    /// </summary>
    /// <param name="startDate">Start date (inclusive)</param>
    /// <param name="endDate">End date (inclusive)</param>
    /// <param name="movementType">Optional filter by movement type</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>List of movements in the date range</returns>
    Task<IEnumerable<AssetMovementDto>> GetMovementsByDateRangeAsync(
        DateTime startDate,
        DateTime endDate,
        MovementType? movementType = null,
        CancellationToken cancellationToken = default);
}

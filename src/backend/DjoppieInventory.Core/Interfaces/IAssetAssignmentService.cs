using DjoppieInventory.Core.DTOs;
using DjoppieInventory.Core.Entities;

namespace DjoppieInventory.Core.Interfaces;

/// <summary>
/// Centralised mutator for asset status, ownership and location.
///
/// <para>
/// All paths that change <see cref="Asset.Status"/>, <see cref="Asset.EmployeeId"/>,
/// <see cref="Asset.Owner"/>, <see cref="Asset.PhysicalWorkplaceId"/>, or
/// <see cref="Asset.BuildingId"/> must go through this service. The service
/// guarantees that:
/// </para>
///
/// <list type="bullet">
///   <item>
///     Status transitions are validated against
///     <see cref="DjoppieInventory.Core.Domain.AssetStateMachine"/> (or
///     bypassed when an explicit admin override is requested).
///   </item>
///   <item>
///     Every mutation produces an <see cref="AssetEvent"/> audit row
///     attributing the action to the caller.
///   </item>
///   <item>
///     The owner string and <see cref="Asset.EmployeeId"/> stay coherent —
///     setting one updates the other.
///   </item>
/// </list>
///
/// <para>
/// Rollout completion (which has its own atomic transaction including
/// <see cref="RolloutAssetMovement"/>) currently mutates the asset directly
/// for performance; future work will route it through this service too.
/// </para>
/// </summary>
public interface IAssetAssignmentService
{
    /// <summary>
    /// Attach the asset to an employee (typical for user-bound assets).
    /// Implicitly transitions the asset to <see cref="AssetStatus.InGebruik"/>
    /// when it was <see cref="AssetStatus.Nieuw"/> or <see cref="AssetStatus.Stock"/>.
    /// Sets <see cref="Asset.InstallationDate"/> if not already set.
    /// </summary>
    Task<AssetDto> AssignToEmployeeAsync(
        int assetId,
        AssignAssetToEmployeeDto request,
        string performedBy,
        string? performedByEmail,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Attach the asset to a physical workplace (typical for workplace-fixed
    /// assets). Implicitly transitions to <see cref="AssetStatus.InGebruik"/>
    /// when starting from <see cref="AssetStatus.Nieuw"/> / <see cref="AssetStatus.Stock"/>.
    /// </summary>
    Task<AssetDto> AssignToWorkplaceAsync(
        int assetId,
        AssignAssetToWorkplaceDto request,
        string performedBy,
        string? performedByEmail,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Detach the asset from any employee or workplace. Status moves to
    /// <see cref="UnassignAssetDto.TargetStatus"/> (validated by the state
    /// machine).
    /// </summary>
    Task<AssetDto> UnassignAsync(
        int assetId,
        UnassignAssetDto request,
        string performedBy,
        string? performedByEmail,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Move the asset to a new status without changing ownership or
    /// location. Honours <see cref="ChangeAssetStatusDto.AdminOverride"/>
    /// only when <paramref name="callerIsAdmin"/> is true.
    /// </summary>
    Task<AssetDto> ChangeStatusAsync(
        int assetId,
        ChangeAssetStatusDto request,
        bool callerIsAdmin,
        string performedBy,
        string? performedByEmail,
        CancellationToken cancellationToken = default);
}

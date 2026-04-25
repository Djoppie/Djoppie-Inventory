using DjoppieInventory.Core.Entities;

namespace DjoppieInventory.Core.Domain;

/// <summary>
/// Canonical state-machine for <see cref="AssetStatus"/> transitions.
///
/// All asset status changes must be validated through <see cref="IsAllowed"/>
/// before being persisted. This guarantees that:
///   * <c>Nieuw → InGebruik</c> only happens via rollout completion or an
///     explicit assignment endpoint (never from a generic update).
///   * Terminal status <c>UitDienst</c> is not silently re-activated.
///   * Illegal transitions surface as 400 Bad Request, not as silently
///     corrupted data.
///
/// Privileged callers (admins) may bypass the machine via
/// <see cref="IsAllowedForAdminOverride"/> for the "noodknop" flow.
/// </summary>
public static class AssetStateMachine
{
    /// <summary>
    /// True if the regular transition from <paramref name="from"/> to
    /// <paramref name="to"/> is allowed by the canonical workflow.
    /// </summary>
    public static bool IsAllowed(AssetStatus from, AssetStatus to)
    {
        if (from == to)
        {
            return true; // No-op write is benign.
        }

        return (from, to) switch
        {
            // From Nieuw — into circulation
            (AssetStatus.Nieuw, AssetStatus.InGebruik) => true,
            (AssetStatus.Nieuw, AssetStatus.Stock) => true,

            // From InGebruik — return / fault paths
            (AssetStatus.InGebruik, AssetStatus.Stock) => true,
            (AssetStatus.InGebruik, AssetStatus.Herstelling) => true,
            (AssetStatus.InGebruik, AssetStatus.Defect) => true,
            (AssetStatus.InGebruik, AssetStatus.UitDienst) => true,

            // From Stock — re-deployment / disposal
            (AssetStatus.Stock, AssetStatus.InGebruik) => true,
            (AssetStatus.Stock, AssetStatus.Herstelling) => true,
            (AssetStatus.Stock, AssetStatus.Defect) => true,
            (AssetStatus.Stock, AssetStatus.UitDienst) => true,

            // From Herstelling — repair outcomes
            (AssetStatus.Herstelling, AssetStatus.InGebruik) => true,
            (AssetStatus.Herstelling, AssetStatus.Stock) => true,
            (AssetStatus.Herstelling, AssetStatus.Defect) => true,
            (AssetStatus.Herstelling, AssetStatus.UitDienst) => true,

            // From Defect — repair attempt or disposal
            (AssetStatus.Defect, AssetStatus.Herstelling) => true,
            (AssetStatus.Defect, AssetStatus.UitDienst) => true,

            // UitDienst is terminal — admin override only.
            _ => false,
        };
    }

    /// <summary>
    /// True if an admin override may persist this transition. Admins may move
    /// to any status (the "noodknop" — fix incorrect data), with two narrow
    /// exceptions:
    ///   * No-op writes are always allowed.
    ///   * Self-transitions are no-ops.
    /// All admin overrides MUST still be audited as <see cref="AssetEvent"/>
    /// with the override flag set.
    /// </summary>
    public static bool IsAllowedForAdminOverride(AssetStatus from, AssetStatus to)
    {
        return true;
    }

    /// <summary>
    /// Returns a non-null error message when the transition is not allowed,
    /// or <c>null</c> when it is.
    /// </summary>
    public static string? GetRejectionReason(AssetStatus from, AssetStatus to)
    {
        if (IsAllowed(from, to))
        {
            return null;
        }

        if (from == AssetStatus.UitDienst)
        {
            return "Asset is uit dienst gesteld; reactivering vereist admin-override.";
        }

        if (from == AssetStatus.Nieuw && to != AssetStatus.InGebruik && to != AssetStatus.Stock)
        {
            return $"Een nieuw asset kan alleen naar InGebruik of Stock; '{to}' is niet toegestaan.";
        }

        return $"Statusovergang van '{from}' naar '{to}' is niet toegestaan.";
    }
}

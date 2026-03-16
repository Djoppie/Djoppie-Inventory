namespace DjoppieInventory.Core.Entities.Enums;

/// <summary>
/// Defines the type of asset movement recorded during rollout execution.
/// Used for audit trail and reporting of asset lifecycle events.
/// </summary>
public enum MovementType
{
    /// <summary>
    /// Asset was deployed to a new user/workplace.
    /// Typically transitions asset status from Nieuw/Stock to InGebruik.
    /// </summary>
    Deployed = 0,

    /// <summary>
    /// Asset was decommissioned from service.
    /// Transitions asset status from InGebruik to UitDienst or Defect.
    /// </summary>
    Decommissioned = 1,

    /// <summary>
    /// Asset was transferred between users or locations.
    /// Status may remain InGebruik but owner/location changes.
    /// </summary>
    Transferred = 2
}

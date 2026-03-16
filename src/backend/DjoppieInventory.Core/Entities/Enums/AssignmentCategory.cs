namespace DjoppieInventory.Core.Entities.Enums;

/// <summary>
/// Defines the category of asset assignment in a rollout workplace.
/// Determines whether the asset is assigned to a user or fixed to a physical location.
/// </summary>
public enum AssignmentCategory
{
    /// <summary>
    /// Asset is assigned to a specific user.
    /// Example: A laptop assigned to "Jan Janssen" follows the user.
    /// </summary>
    UserAssigned = 0,

    /// <summary>
    /// Asset is fixed to the workplace location.
    /// Example: A monitor or docking station that stays at the desk.
    /// </summary>
    WorkplaceFixed = 1
}

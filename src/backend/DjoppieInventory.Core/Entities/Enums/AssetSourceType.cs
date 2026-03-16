namespace DjoppieInventory.Core.Entities.Enums;

/// <summary>
/// Defines the source of an asset in a rollout workplace assignment.
/// Determines how the asset is provisioned during rollout.
/// </summary>
public enum AssetSourceType
{
    /// <summary>
    /// Asset already exists in inventory (status: Nieuw/Stock).
    /// The asset is picked from existing stock and assigned to this workplace.
    /// </summary>
    ExistingInventory = 0,

    /// <summary>
    /// Asset will be created from a predefined template.
    /// A new asset record is generated based on template defaults during execution.
    /// </summary>
    NewFromTemplate = 1,

    /// <summary>
    /// Asset will be created on-site during execution.
    /// The technician will provide the details (serial number, etc.) during rollout.
    /// </summary>
    CreateOnSite = 2
}

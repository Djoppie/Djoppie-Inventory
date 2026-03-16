namespace DjoppieInventory.Core.Entities.Enums;

/// <summary>
/// Defines the synchronization status with Microsoft Entra ID (Azure AD).
/// Used to track sync state for Sectors and Services.
/// </summary>
public enum EntraSyncStatus
{
    /// <summary>
    /// Entity has not been synced with Entra ID.
    /// No sync has been attempted or entity is not configured for sync.
    /// </summary>
    None = 0,

    /// <summary>
    /// Last sync completed successfully.
    /// All data was synchronized without errors.
    /// </summary>
    Success = 1,

    /// <summary>
    /// Last sync failed completely.
    /// No data was synchronized due to an error.
    /// </summary>
    Failed = 2,

    /// <summary>
    /// Last sync completed with partial success.
    /// Some data was synchronized but errors occurred for some items.
    /// </summary>
    Partial = 3
}

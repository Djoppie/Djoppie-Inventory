namespace DjoppieInventory.Core.Entities.Enums;

/// <summary>
/// Defines the type of physical workplace setup.
/// Determines the expected equipment configuration for the location.
/// </summary>
public enum WorkplaceType
{
    /// <summary>
    /// Fixed desktop PC setup.
    /// Typically includes: desktop PC, monitors, keyboard, mouse.
    /// </summary>
    Desktop = 0,

    /// <summary>
    /// Laptop docking station setup.
    /// Typically includes: docking station, monitors, keyboard, mouse.
    /// User brings their laptop.
    /// </summary>
    Laptop = 1,

    /// <summary>
    /// Shared/flexible workplace (hot desk).
    /// Can be used by different users, no permanent occupant.
    /// </summary>
    HotDesk = 2,

    /// <summary>
    /// Conference or meeting room.
    /// May include presentation equipment, video conferencing, etc.
    /// </summary>
    MeetingRoom = 3
}

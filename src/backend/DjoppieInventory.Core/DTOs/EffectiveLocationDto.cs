namespace DjoppieInventory.Core.DTOs;

/// <summary>
/// The effective location of an asset, computed from whichever side of the
/// chain currently has data. Frontend renders this as a single
/// <c>AssetLocationChain</c> component, regardless of whether the asset is
/// user-bound (laptop) or workplace-fixed (monitor / docking).
/// </summary>
public enum LocationChainKind
{
    /// <summary>Asset has no employee and no workplace.</summary>
    None = 0,

    /// <summary>Location derives from an assigned employee (and their workplace, if any).</summary>
    Employee = 1,

    /// <summary>Location derives from a fixed physical workplace.</summary>
    Workplace = 2,

    /// <summary>Asset is in stock / repair / decommissioned — owner-less by intent.</summary>
    Stock = 3,
}

public class EffectiveLocationDto
{
    public LocationChainKind Kind { get; set; }

    public int? EmployeeId { get; set; }
    public string? EmployeeName { get; set; }
    public string? EmployeeJobTitle { get; set; }

    public int? PhysicalWorkplaceId { get; set; }
    public string? PhysicalWorkplaceCode { get; set; }
    public string? PhysicalWorkplaceName { get; set; }

    public int? BuildingId { get; set; }
    public string? BuildingName { get; set; }
    public string? BuildingAddress { get; set; }

    public int? ServiceId { get; set; }
    public string? ServiceName { get; set; }
    public string? SectorName { get; set; }

    /// <summary>
    /// Free-text installation detail (room number, floor) when set on the
    /// asset itself. Independent of the chain kind.
    /// </summary>
    public string? InstallationLocation { get; set; }
}

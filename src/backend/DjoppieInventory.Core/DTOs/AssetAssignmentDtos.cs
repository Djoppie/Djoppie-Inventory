using System.ComponentModel.DataAnnotations;
using DjoppieInventory.Core.Entities;

namespace DjoppieInventory.Core.DTOs;

/// <summary>
/// Assign an asset to an employee (typical for user-bound assets such as
/// laptops). Sets <c>EmployeeId</c>, denormalises <c>Owner</c> for legacy
/// clients, and transitions <c>Nieuw → InGebruik</c> when applicable.
/// </summary>
public class AssignAssetToEmployeeDto
{
    [Required]
    public int EmployeeId { get; set; }

    /// <summary>
    /// Optional installation date (defaults to <c>DateTime.UtcNow</c>).
    /// </summary>
    public DateTime? InstallationDate { get; set; }

    [StringLength(500)]
    public string? Notes { get; set; }
}

/// <summary>
/// Assign an asset to a physical workplace (typical for workplace-fixed
/// assets such as docking stations and monitors). Sets
/// <c>PhysicalWorkplaceId</c> and the parent <c>BuildingId</c>.
/// </summary>
public class AssignAssetToWorkplaceDto
{
    [Required]
    public int PhysicalWorkplaceId { get; set; }

    public DateTime? InstallationDate { get; set; }

    [StringLength(200)]
    public string? InstallationLocation { get; set; }

    [StringLength(500)]
    public string? Notes { get; set; }
}

/// <summary>
/// Clear an asset's owner / workplace assignment. Status returns to
/// <c>Stock</c> by default; the caller can request <c>Herstelling</c>,
/// <c>Defect</c>, or <c>UitDienst</c> when the unassign reflects a fault
/// or end-of-life.
/// </summary>
public class UnassignAssetDto
{
    /// <summary>
    /// Status to land on after unassign. Must be a transition allowed by
    /// <see cref="DjoppieInventory.Core.Domain.AssetStateMachine"/>.
    /// Defaults to <see cref="AssetStatus.Stock"/>.
    /// </summary>
    public AssetStatus TargetStatus { get; set; } = AssetStatus.Stock;

    [StringLength(500)]
    public string? Reason { get; set; }
}

/// <summary>
/// Move an asset to a new status. Validated against
/// <see cref="DjoppieInventory.Core.Domain.AssetStateMachine"/>.
/// Set <see cref="AdminOverride"/> to bypass the state machine — only the
/// admin policy is allowed to do that, and the audit row records it.
/// </summary>
public class ChangeAssetStatusDto
{
    [Required]
    public AssetStatus NewStatus { get; set; }

    /// <summary>
    /// When true, the request is an admin "noodknop" override. Honoured
    /// only for callers in the admin role; ignored otherwise.
    /// </summary>
    public bool AdminOverride { get; set; } = false;

    [StringLength(500)]
    public string? Reason { get; set; }
}

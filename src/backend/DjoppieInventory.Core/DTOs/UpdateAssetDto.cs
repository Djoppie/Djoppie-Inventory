using System.ComponentModel.DataAnnotations;

namespace DjoppieInventory.Core.DTOs;

/// <summary>
/// DTO for updating an asset's intrinsic properties (brand, model, serial,
/// purchase / warranty dates, alias, category).
///
/// <para>
/// Status, owner, employee assignment, building and physical-workplace
/// assignment, and installation date are intentionally absent: those flow
/// through dedicated endpoints
/// (<c>POST /assets/{id}/assign-employee</c>,
/// <c>POST /assets/{id}/assign-workplace</c>,
/// <c>POST /assets/{id}/unassign</c>,
/// <c>POST /assets/{id}/status</c>) backed by the
/// <see cref="DjoppieInventory.Core.Domain.AssetStateMachine"/> and a
/// guaranteed audit row.
/// </para>
/// </summary>
public class UpdateAssetDto
{
    [StringLength(200)]
    public string? AssetName { get; set; }

    [StringLength(200)]
    public string? Alias { get; set; }

    [StringLength(100)]
    public string? Category { get; set; }

    public int? AssetTypeId { get; set; }

    [StringLength(100)]
    public string? Brand { get; set; }

    [StringLength(200)]
    public string? Model { get; set; }

    /// <summary>
    /// Serial number — optional, must remain unique when provided.
    /// Changing serial numbers should be rare and is allowed because
    /// physical relabelling does happen (RMA replacement etc.).
    /// </summary>
    [StringLength(100)]
    public string? SerialNumber { get; set; }

    public DateTime? PurchaseDate { get; set; }

    public DateTime? WarrantyExpiry { get; set; }
}

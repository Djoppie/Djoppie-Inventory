using System.ComponentModel.DataAnnotations;

namespace DjoppieInventory.Core.DTOs;

/// <summary>
/// DTO for creating a new asset. AssetCode is auto-generated from
/// AssetType + Year + Brand. Format: <c>[DUM-]TYPE-YY-MERK-NUMMER</c>
/// (e.g., <c>LAP-26-DELL-00001</c>).
///
/// <para>
/// Owner, location and status fields are intentionally absent: every new
/// asset starts with <c>Status = Nieuw</c> and no owner / no location.
/// Use the dedicated assignment endpoints
/// (<c>/assets/{id}/assign-employee</c>, <c>/assets/{id}/assign-workplace</c>)
/// to associate the asset with a person or a physical workplace, or let
/// rollout completion drive that transition.
/// </para>
/// </summary>
public class CreateAssetDto
{
    /// <summary>
    /// Asset type ID — required. Determines the TYPE component of the
    /// generated asset code.
    /// </summary>
    [Required]
    public int AssetTypeId { get; set; }

    /// <summary>
    /// Serial number — optional, must be unique when provided.
    /// </summary>
    [StringLength(100)]
    public string? SerialNumber { get; set; }

    /// <summary>
    /// Device name from Intune (auto-fetched based on serial number) — optional.
    /// </summary>
    [StringLength(200)]
    public string? AssetName { get; set; }

    /// <summary>
    /// Optional user-defined alias.
    /// </summary>
    [StringLength(200)]
    public string? Alias { get; set; }

    /// <summary>
    /// Category (optional — auto-derived from AssetType when omitted).
    /// </summary>
    [StringLength(100)]
    public string? Category { get; set; }

    /// <summary>
    /// If true, asset code uses the 90001+ range for dummy/test assets.
    /// </summary>
    public bool IsDummy { get; set; } = false;

    [StringLength(100)]
    public string? Brand { get; set; }

    [StringLength(200)]
    public string? Model { get; set; }

    public DateTime? PurchaseDate { get; set; }

    public DateTime? WarrantyExpiry { get; set; }
}

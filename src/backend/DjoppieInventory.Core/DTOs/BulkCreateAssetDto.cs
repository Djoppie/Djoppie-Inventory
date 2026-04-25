using System.ComponentModel.DataAnnotations;

namespace DjoppieInventory.Core.DTOs;

/// <summary>
/// DTO for bulk asset creation. Asset codes are auto-generated from
/// AssetType + Year + Brand. Format: <c>[DUM-]TYPE-YY-MERK-NUMMER</c>.
///
/// <para>
/// Like <see cref="CreateAssetDto"/>, this DTO intentionally omits owner,
/// location, status and installation-date fields. All bulk-created assets
/// land on <c>Status = Nieuw</c>; assignment is a separate explicit step.
/// </para>
/// </summary>
public class BulkCreateAssetDto
{
    /// <summary>
    /// Asset type ID — required, drives the TYPE component of the codes.
    /// </summary>
    [Required]
    public int AssetTypeId { get; set; }

    /// <summary>
    /// Number of assets to create. 1 ≤ Quantity ≤ 100.
    /// </summary>
    [Required]
    [Range(1, 100)]
    public int Quantity { get; set; } = 1;

    /// <summary>
    /// If true, asset codes use the 90001+ dummy range.
    /// </summary>
    public bool IsDummy { get; set; } = false;

    /// <summary>
    /// Optional template ID — when present, brand/model/category are
    /// pre-filled from the template (owner / status / location fields on
    /// the template are deliberately ignored to honour the workflow).
    /// </summary>
    public int? TemplateId { get; set; }

    [StringLength(200)]
    public string? AssetName { get; set; }

    [StringLength(200)]
    public string? Alias { get; set; }

    [StringLength(100)]
    public string? Category { get; set; }

    [StringLength(100)]
    public string? Brand { get; set; }

    [StringLength(200)]
    public string? Model { get; set; }

    /// <summary>
    /// Optional prefix for generated serial numbers, e.g. <c>SN</c> →
    /// <c>SN-0001, SN-0002, …</c>. When omitted, assets are created
    /// without serial numbers (operator scans them in later).
    /// </summary>
    [StringLength(50)]
    public string? SerialNumberPrefix { get; set; }

    public DateTime? PurchaseDate { get; set; }

    public DateTime? WarrantyExpiry { get; set; }
}

/// <summary>
/// Result of a bulk-create operation.
/// </summary>
public class BulkCreateAssetResultDto
{
    public int TotalRequested { get; set; }
    public int SuccessfullyCreated { get; set; }
    public int Failed { get; set; }
    public List<AssetDto> CreatedAssets { get; set; } = new();
    public List<string> Errors { get; set; } = new();
    public bool IsFullySuccessful => Failed == 0 && SuccessfullyCreated == TotalRequested;
}

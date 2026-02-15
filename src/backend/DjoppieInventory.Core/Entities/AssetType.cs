namespace DjoppieInventory.Core.Entities;

/// <summary>
/// Represents an asset type/category code used in asset code generation.
/// Examples: LAP (Laptop), DESK (Desktop), MON (Monitor), TAB (Tablet), PRN (Printer)
/// </summary>
public class AssetType
{
    /// <summary>
    /// Unique identifier for the asset type
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// Short code for the asset type (2-4 characters, uppercase).
    /// Examples: "LAP", "DESK", "MON", "TAB", "PRN", "TEL", "NET"
    /// Used in asset code generation: LAP-25-DBK-00001
    /// </summary>
    public string Code { get; set; } = string.Empty;

    /// <summary>
    /// Display name for the asset type.
    /// Examples: "Laptop", "Desktop", "Monitor", "Tablet", "Printer"
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Optional detailed description of the asset type
    /// </summary>
    public string? Description { get; set; }

    /// <summary>
    /// Indicates if this asset type is active and available for selection.
    /// Inactive types are soft-deleted but preserved for historical data.
    /// </summary>
    public bool IsActive { get; set; } = true;

    /// <summary>
    /// Display order for UI sorting (lower numbers appear first)
    /// </summary>
    public int SortOrder { get; set; }

    /// <summary>
    /// Foreign key to the category this asset type belongs to (optional)
    /// </summary>
    public int? CategoryId { get; set; }

    /// <summary>
    /// The category this asset type belongs to
    /// </summary>
    public Category? Category { get; set; }

    /// <summary>
    /// Timestamp when the asset type was created
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Timestamp when the asset type was last updated
    /// </summary>
    public DateTime? UpdatedAt { get; set; }

    /// <summary>
    /// Assets that belong to this asset type
    /// </summary>
    public ICollection<Asset> Assets { get; set; } = new List<Asset>();

    /// <summary>
    /// Asset templates that use this asset type
    /// </summary>
    public ICollection<AssetTemplate> Templates { get; set; } = new List<AssetTemplate>();
}

namespace DjoppieInventory.Core.Entities;

/// <summary>
/// Represents a category that groups related asset types together.
/// Examples: Computing (Laptops, Desktops), Peripherals (Monitors, Printers), Networking (Switches, Routers)
/// </summary>
public class Category
{
    /// <summary>
    /// Unique identifier for the category
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// Short code for the category (2-10 characters, uppercase).
    /// Examples: "COMP", "PERIPH", "NET", "MOBILE"
    /// </summary>
    public string Code { get; set; } = string.Empty;

    /// <summary>
    /// Full name of the category.
    /// Examples: "Computing", "Peripherals", "Networking", "Mobile Devices"
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Optional description of the category
    /// </summary>
    public string? Description { get; set; }

    /// <summary>
    /// Indicates if this category is active and available for selection.
    /// Inactive categories are soft-deleted but preserved for historical data.
    /// </summary>
    public bool IsActive { get; set; } = true;

    /// <summary>
    /// Display order for UI sorting (lower numbers appear first)
    /// </summary>
    public int SortOrder { get; set; }

    /// <summary>
    /// Timestamp when the category was created
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Timestamp when the category was last updated
    /// </summary>
    public DateTime? UpdatedAt { get; set; }

    /// <summary>
    /// Asset types that belong to this category
    /// </summary>
    public ICollection<AssetType> AssetTypes { get; set; } = new List<AssetType>();
}

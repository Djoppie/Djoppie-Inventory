namespace DjoppieInventory.Core.Entities;

/// <summary>
/// Represents an organizational sector or division within the municipality.
/// Sectors group related services together.
/// Examples: ORG (Organisatie), RUI (Ruimte), ZOR (Zorg)
/// </summary>
public class Sector
{
    /// <summary>
    /// Unique identifier for the sector
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// Short code for the sector (2-10 characters, uppercase).
    /// Examples: "ORG", "RUI", "ZOR"
    /// </summary>
    public string Code { get; set; } = string.Empty;

    /// <summary>
    /// Full name of the sector.
    /// Examples: "Organisatie", "Ruimte", "Zorg"
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Indicates if this sector is active and available for selection.
    /// Inactive sectors are soft-deleted but preserved for historical data.
    /// </summary>
    public bool IsActive { get; set; } = true;

    /// <summary>
    /// Display order for UI sorting (lower numbers appear first)
    /// </summary>
    public int SortOrder { get; set; }

    /// <summary>
    /// Timestamp when the sector was created
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Timestamp when the sector was last updated
    /// </summary>
    public DateTime? UpdatedAt { get; set; }

    /// <summary>
    /// Services that belong to this sector
    /// </summary>
    public ICollection<Service> Services { get; set; } = new List<Service>();
}

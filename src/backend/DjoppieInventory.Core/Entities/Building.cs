namespace DjoppieInventory.Core.Entities;

/// <summary>
/// Represents a physical building or location where assets can be installed.
/// Examples: DBK (Gemeentehuis Diepenbeek), WZC (WZC De Visserij), GBS (Gemeentelijke Basisschool)
/// </summary>
public class Building
{
    /// <summary>
    /// Unique identifier for the building
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// Short code for the building (2-10 characters, uppercase).
    /// Examples: "DBK", "WZC", "GBS", "PLAG", "BIB"
    /// Used in asset code generation: LAP-25-DBK-00001
    /// </summary>
    public string Code { get; set; } = string.Empty;

    /// <summary>
    /// Full name of the building or location.
    /// Examples: "Gemeentehuis Diepenbeek", "WZC De Visserij", "Gemeentelijke Basisschool"
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Optional physical address of the building
    /// </summary>
    public string? Address { get; set; }

    /// <summary>
    /// Indicates if this building is active and available for selection.
    /// Inactive buildings are soft-deleted but preserved for historical data.
    /// </summary>
    public bool IsActive { get; set; } = true;

    /// <summary>
    /// Display order for UI sorting (lower numbers appear first)
    /// </summary>
    public int SortOrder { get; set; }

    /// <summary>
    /// Timestamp when the building was created
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Timestamp when the building was last updated
    /// </summary>
    public DateTime? UpdatedAt { get; set; }

    /// <summary>
    /// Assets installed in this building
    /// </summary>
    public ICollection<Asset> Assets { get; set; } = new List<Asset>();
}

namespace DjoppieInventory.Core.Entities;

/// <summary>
/// Represents a department or service within the municipality organization.
/// Services can optionally be grouped under a Sector.
/// Examples: IT (IT Dienst), FIN (Financiën), BZ (Burgerzaken)
/// </summary>
public class Service
{
    /// <summary>
    /// Unique identifier for the service
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// Optional foreign key to the parent sector.
    /// Null if the service is not assigned to a sector.
    /// </summary>
    public int? SectorId { get; set; }

    /// <summary>
    /// Code for the service, matching Entra MG- group names (max 50 characters).
    /// Examples: "IT", "HR", "bestuurssecretariaat", "facilitaire-ondersteuning"
    /// </summary>
    public string Code { get; set; } = string.Empty;

    /// <summary>
    /// Full name of the service or department.
    /// Examples: "IT Dienst", "Financiën", "Burgerzaken"
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Indicates if this service is active and available for selection.
    /// Inactive services are soft-deleted but preserved for historical data.
    /// </summary>
    public bool IsActive { get; set; } = true;

    /// <summary>
    /// Display order for UI sorting (lower numbers appear first)
    /// </summary>
    public int SortOrder { get; set; }

    /// <summary>
    /// Timestamp when the service was created
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Timestamp when the service was last updated
    /// </summary>
    public DateTime? UpdatedAt { get; set; }

    /// <summary>
    /// Parent sector this service belongs to (optional)
    /// </summary>
    public Sector? Sector { get; set; }

    /// <summary>
    /// Assets assigned to this service/department
    /// </summary>
    public ICollection<Asset> Assets { get; set; } = new List<Asset>();
}

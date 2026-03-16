using DjoppieInventory.Core.Entities.Enums;

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

    // ===== Microsoft Entra ID (Azure AD) Integration =====

    /// <summary>
    /// Microsoft Entra ID group ID (GUID) for this sector (optional).
    /// Used to sync members from Entra groups.
    /// </summary>
    public string? EntraGroupId { get; set; }

    /// <summary>
    /// Mail nickname of the Entra group (optional).
    /// Example: "sector-organisatie"
    /// </summary>
    public string? EntraMailNickname { get; set; }

    /// <summary>
    /// Indicates if Entra synchronization is enabled for this sector.
    /// When true, the sector will be included in Entra sync operations.
    /// </summary>
    public bool EntraSyncEnabled { get; set; } = false;

    /// <summary>
    /// Timestamp of the last successful Entra sync (null if never synced)
    /// </summary>
    public DateTime? EntraLastSyncAt { get; set; }

    /// <summary>
    /// Status of the last Entra sync operation
    /// </summary>
    public EntraSyncStatus EntraSyncStatus { get; set; } = EntraSyncStatus.None;

    /// <summary>
    /// Error message from the last failed Entra sync (optional)
    /// </summary>
    public string? EntraSyncError { get; set; }

    /// <summary>
    /// Entra ID (GUID) of the sector manager (optional)
    /// </summary>
    public string? ManagerEntraId { get; set; }

    /// <summary>
    /// Display name of the sector manager (cached from Entra, optional)
    /// </summary>
    public string? ManagerDisplayName { get; set; }

    /// <summary>
    /// Email address of the sector manager (cached from Entra, optional)
    /// </summary>
    public string? ManagerEmail { get; set; }

    // ===== Navigation Properties =====

    /// <summary>
    /// Services that belong to this sector
    /// </summary>
    public ICollection<Service> Services { get; set; } = new List<Service>();
}

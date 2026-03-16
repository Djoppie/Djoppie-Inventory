using DjoppieInventory.Core.Entities.Enums;

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

    // ===== Microsoft Entra ID (Azure AD) Integration =====

    /// <summary>
    /// Microsoft Entra ID group ID (GUID) for this service (optional).
    /// Typically maps to MG-{service-code} groups in Entra.
    /// </summary>
    public string? EntraGroupId { get; set; }

    /// <summary>
    /// Mail nickname of the Entra group (optional).
    /// Example: "MG-it", "MG-financien"
    /// </summary>
    public string? EntraMailNickname { get; set; }

    /// <summary>
    /// Indicates if Entra synchronization is enabled for this service.
    /// When true, the service will be included in Entra sync operations.
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
    /// Entra ID (GUID) of the service manager (optional)
    /// </summary>
    public string? ManagerEntraId { get; set; }

    /// <summary>
    /// Display name of the service manager (cached from Entra, optional)
    /// </summary>
    public string? ManagerDisplayName { get; set; }

    /// <summary>
    /// Email address of the service manager (cached from Entra, optional)
    /// </summary>
    public string? ManagerEmail { get; set; }

    /// <summary>
    /// Number of members in this service (cached from Entra sync)
    /// </summary>
    public int MemberCount { get; set; } = 0;

    /// <summary>
    /// Foreign key to the primary building/location for this service (optional)
    /// </summary>
    public int? BuildingId { get; set; }

    // ===== Navigation Properties =====

    /// <summary>
    /// Parent sector this service belongs to (optional)
    /// </summary>
    public Sector? Sector { get; set; }

    /// <summary>
    /// Primary building/location for this service (optional)
    /// </summary>
    public Building? Building { get; set; }

    /// <summary>
    /// Assets assigned to this service/department
    /// </summary>
    public ICollection<Asset> Assets { get; set; } = new List<Asset>();

    /// <summary>
    /// Rollout day schedules where this service is included
    /// </summary>
    public ICollection<RolloutDayService> ScheduledRolloutDays { get; set; } = new List<RolloutDayService>();
}

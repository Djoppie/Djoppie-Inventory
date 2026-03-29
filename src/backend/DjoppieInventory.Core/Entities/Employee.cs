using DjoppieInventory.Core.Entities.Enums;

namespace DjoppieInventory.Core.Entities;

/// <summary>
/// Represents an employee in the organization, synced from Microsoft Entra ID.
/// Employees can be assigned assets and belong to services.
/// </summary>
public class Employee
{
    /// <summary>
    /// Unique identifier for the employee
    /// </summary>
    public int Id { get; set; }

    // ===== Microsoft Entra ID Fields =====

    /// <summary>
    /// Microsoft Entra ID object ID (GUID). Unique identifier from Azure AD.
    /// </summary>
    public string EntraId { get; set; } = string.Empty;

    /// <summary>
    /// User Principal Name (typically the email address).
    /// Example: "jo.wijnen@diepenbeek.be"
    /// </summary>
    public string UserPrincipalName { get; set; } = string.Empty;

    /// <summary>
    /// Display name of the employee.
    /// Example: "Jo Wijnen"
    /// </summary>
    public string DisplayName { get; set; } = string.Empty;

    /// <summary>
    /// Email address (may differ from UPN)
    /// </summary>
    public string? Email { get; set; }

    /// <summary>
    /// Department from Entra ID profile
    /// </summary>
    public string? Department { get; set; }

    /// <summary>
    /// Job title from Entra ID profile
    /// </summary>
    public string? JobTitle { get; set; }

    /// <summary>
    /// Office location from Entra ID profile
    /// </summary>
    public string? OfficeLocation { get; set; }

    /// <summary>
    /// Mobile phone number from Entra ID profile
    /// </summary>
    public string? MobilePhone { get; set; }

    /// <summary>
    /// Company name from Entra ID profile
    /// </summary>
    public string? CompanyName { get; set; }

    // ===== Service Relationship =====

    /// <summary>
    /// Foreign key to the service this employee belongs to.
    /// Determined by Entra group membership (MG-* groups).
    /// </summary>
    public int? ServiceId { get; set; }

    // ===== Standard Fields =====

    /// <summary>
    /// Indicates if this employee is active.
    /// Inactive employees are soft-deleted but preserved for historical data.
    /// </summary>
    public bool IsActive { get; set; } = true;

    /// <summary>
    /// Display order for UI sorting (lower numbers appear first)
    /// </summary>
    public int SortOrder { get; set; }

    // ===== Sync Tracking =====

    /// <summary>
    /// Timestamp of the last successful Entra sync for this employee
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

    // ===== Timestamps =====

    /// <summary>
    /// Timestamp when the employee was created
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Timestamp when the employee was last updated
    /// </summary>
    public DateTime? UpdatedAt { get; set; }

    // ===== Navigation Properties =====

    /// <summary>
    /// Service/department this employee belongs to
    /// </summary>
    public Service? Service { get; set; }

    /// <summary>
    /// Assets assigned to this employee
    /// </summary>
    public ICollection<Asset> Assets { get; set; } = new List<Asset>();

    /// <summary>
    /// The physical workplace where this employee is the current occupant.
    /// Linked via PhysicalWorkplace.CurrentOccupantEntraId == Employee.EntraId.
    /// </summary>
    public PhysicalWorkplace? CurrentWorkplace { get; set; }
}

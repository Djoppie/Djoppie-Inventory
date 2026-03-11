namespace DjoppieInventory.Core.DTOs;

/// <summary>
/// Represents a Windows Autopilot device identity
/// </summary>
public class AutopilotDeviceDto
{
    /// <summary>
    /// Unique identifier for the Autopilot device
    /// </summary>
    public string Id { get; set; } = string.Empty;

    /// <summary>
    /// Device serial number
    /// </summary>
    public string? SerialNumber { get; set; }

    /// <summary>
    /// Device model
    /// </summary>
    public string? Model { get; set; }

    /// <summary>
    /// Device manufacturer
    /// </summary>
    public string? Manufacturer { get; set; }

    /// <summary>
    /// Assigned user principal name
    /// </summary>
    public string? UserPrincipalName { get; set; }

    /// <summary>
    /// Assigned user display name
    /// </summary>
    public string? DisplayName { get; set; }

    /// <summary>
    /// Intune managed device ID (if enrolled)
    /// </summary>
    public string? ManagedDeviceId { get; set; }

    /// <summary>
    /// Deployment profile name assigned to the device
    /// </summary>
    public string? DeploymentProfileAssignedDateTime { get; set; }

    /// <summary>
    /// Deployment profile assignment status
    /// </summary>
    public string? DeploymentProfileAssignmentStatus { get; set; }

    /// <summary>
    /// Azure AD device ID
    /// </summary>
    public string? AzureAdDeviceId { get; set; }

    /// <summary>
    /// Azure AD device display name
    /// </summary>
    public string? AzureAdDeviceDisplayName { get; set; }

    /// <summary>
    /// Group tag for the device
    /// </summary>
    public string? GroupTag { get; set; }

    /// <summary>
    /// Purchase order identifier
    /// </summary>
    public string? PurchaseOrderIdentifier { get; set; }

    /// <summary>
    /// Enrollment state of the device
    /// </summary>
    public string? EnrollmentState { get; set; }

    /// <summary>
    /// When the device was last contacted
    /// </summary>
    public DateTime? LastContactedDateTime { get; set; }

    /// <summary>
    /// When the Autopilot device identity was created
    /// </summary>
    public DateTime? CreatedDateTime { get; set; }
}

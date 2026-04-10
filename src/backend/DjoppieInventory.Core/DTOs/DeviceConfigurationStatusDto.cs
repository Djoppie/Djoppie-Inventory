namespace DjoppieInventory.Core.DTOs;

/// <summary>
/// Configuration profile deployment status for a managed device.
/// Shows which configuration profiles (including certificate profiles) are deployed
/// and their current status, helping identify certificate/network issues after user changes.
/// </summary>
public class DeviceConfigurationStatusDto
{
    /// <summary>
    /// Intune device ID
    /// </summary>
    public string DeviceId { get; set; } = string.Empty;

    /// <summary>
    /// Device name
    /// </summary>
    public string DeviceName { get; set; } = string.Empty;

    /// <summary>
    /// Current primary user UPN assigned in Intune
    /// </summary>
    public string? PrimaryUserUpn { get; set; }

    /// <summary>
    /// Current primary user display name
    /// </summary>
    public string? PrimaryUserDisplayName { get; set; }

    /// <summary>
    /// When the device was enrolled
    /// </summary>
    public DateTime? EnrolledDateTime { get; set; }

    /// <summary>
    /// Last sync with Intune
    /// </summary>
    public DateTime? LastSyncDateTime { get; set; }

    /// <summary>
    /// List of configuration profile statuses for this device
    /// </summary>
    public List<ConfigurationProfileStatusDto> ConfigurationProfiles { get; set; } = new();

    /// <summary>
    /// Summary counts by status
    /// </summary>
    public ConfigurationStatusSummaryDto Summary { get; set; } = new();

    /// <summary>
    /// Whether certificate-related profiles were found
    /// </summary>
    public bool HasCertificateProfiles { get; set; }

    /// <summary>
    /// Whether any certificate profile has a failed/error status (potential network issue)
    /// </summary>
    public bool HasCertificateIssues { get; set; }

    /// <summary>
    /// When this data was retrieved
    /// </summary>
    public DateTime RetrievedAt { get; set; } = DateTime.UtcNow;
}

/// <summary>
/// Status of a single configuration profile on a device
/// </summary>
public class ConfigurationProfileStatusDto
{
    /// <summary>
    /// Profile ID
    /// </summary>
    public string? ProfileId { get; set; }

    /// <summary>
    /// Profile display name (e.g., "Wi-Fi Certificate", "802.1x Network")
    /// </summary>
    public string DisplayName { get; set; } = string.Empty;

    /// <summary>
    /// Profile type (e.g., certificate, wifi, vpn, custom, etc.)
    /// </summary>
    public string? ProfileType { get; set; }

    /// <summary>
    /// Platform target (e.g., windows10, iOS, android)
    /// </summary>
    public string? PlatformType { get; set; }

    /// <summary>
    /// Deployment status: succeeded, failed, pending, error, notApplicable, conflict
    /// </summary>
    public string Status { get; set; } = "unknown";

    /// <summary>
    /// Last reported date/time for this profile on the device
    /// </summary>
    public DateTime? LastReportedDateTime { get; set; }

    /// <summary>
    /// The UPN of the user this profile was deployed FOR (critical for certificate analysis)
    /// </summary>
    public string? UserPrincipalName { get; set; }

    /// <summary>
    /// User display name this profile targets
    /// </summary>
    public string? UserDisplayName { get; set; }

    /// <summary>
    /// Whether this is a certificate-related profile (SCEP, PKCS, trusted root, Wi-Fi with cert)
    /// </summary>
    public bool IsCertificateRelated { get; set; }

    /// <summary>
    /// Error code if the profile deployment failed
    /// </summary>
    public long? ErrorCode { get; set; }

    /// <summary>
    /// Number of settings in error state
    /// </summary>
    public int? SettingsInError { get; set; }

    /// <summary>
    /// Number of settings in conflict state
    /// </summary>
    public int? SettingsInConflict { get; set; }

    /// <summary>
    /// Certificate store location: "User" or "Machine"
    /// </summary>
    public string? CertificateStorePath { get; set; }

    /// <summary>
    /// Certificate expiry date (from management cert or profile metadata)
    /// </summary>
    public DateTime? CertificateExpiryDate { get; set; }

    /// <summary>
    /// Certificate thumbprint if available
    /// </summary>
    public string? Thumbprint { get; set; }
}

/// <summary>
/// Summary of configuration profile statuses
/// </summary>
public class ConfigurationStatusSummaryDto
{
    public int Total { get; set; }
    public int Succeeded { get; set; }
    public int Failed { get; set; }
    public int Pending { get; set; }
    public int Error { get; set; }
    public int NotApplicable { get; set; }
    public int Conflict { get; set; }
}

namespace DjoppieInventory.Core.DTOs;

/// <summary>
/// Combined live status response for a device from Intune.
/// Aggregates device info, compliance, apps summary, and health in a single response
/// to reduce API calls for polling scenarios.
/// </summary>
public class DeviceLiveStatusDto
{
    /// <summary>
    /// Whether the device was found in Intune
    /// </summary>
    public bool Found { get; set; }

    /// <summary>
    /// Error message if device lookup failed (null if successful)
    /// </summary>
    public string? ErrorMessage { get; set; }

    // === Device Identity ===

    /// <summary>
    /// Intune device ID
    /// </summary>
    public string? DeviceId { get; set; }

    /// <summary>
    /// Device name
    /// </summary>
    public string DeviceName { get; set; } = string.Empty;

    /// <summary>
    /// Device serial number
    /// </summary>
    public string? SerialNumber { get; set; }

    /// <summary>
    /// Azure AD device ID
    /// </summary>
    public string? AzureAdDeviceId { get; set; }

    // === Hardware Info ===

    /// <summary>
    /// Device manufacturer (e.g., HP, Dell, Lenovo)
    /// </summary>
    public string? Manufacturer { get; set; }

    /// <summary>
    /// Device model
    /// </summary>
    public string? Model { get; set; }

    /// <summary>
    /// Operating system (e.g., Windows)
    /// </summary>
    public string? OperatingSystem { get; set; }

    /// <summary>
    /// OS version
    /// </summary>
    public string? OsVersion { get; set; }

    // === Compliance Status ===

    /// <summary>
    /// Compliance state: compliant, noncompliant, conflict, error, inGracePeriod, configManager, unknown
    /// </summary>
    public string? ComplianceState { get; set; }

    /// <summary>
    /// Whether the device is compliant with policies
    /// </summary>
    public bool IsCompliant { get; set; }

    /// <summary>
    /// Whether the device is encrypted (BitLocker on Windows)
    /// </summary>
    public bool IsEncrypted { get; set; }

    /// <summary>
    /// Whether the device is supervised/managed
    /// </summary>
    public bool IsSupervised { get; set; }

    // === Sync Information ===

    /// <summary>
    /// Last sync with Intune
    /// </summary>
    public DateTime? LastSyncDateTime { get; set; }

    /// <summary>
    /// When the device was enrolled in Intune
    /// </summary>
    public DateTime? EnrolledDateTime { get; set; }

    // === User Info ===

    /// <summary>
    /// Primary user UPN (email)
    /// </summary>
    public string? UserPrincipalName { get; set; }

    /// <summary>
    /// Primary user display name
    /// </summary>
    public string? UserDisplayName { get; set; }

    // === Storage ===

    /// <summary>
    /// Total storage in bytes
    /// </summary>
    public long? TotalStorageBytes { get; set; }

    /// <summary>
    /// Free storage in bytes
    /// </summary>
    public long? FreeStorageBytes { get; set; }

    /// <summary>
    /// Storage usage percentage (0-100)
    /// </summary>
    public double? StorageUsagePercent { get; set; }

    // === Memory ===

    /// <summary>
    /// Physical memory in bytes
    /// </summary>
    public long? PhysicalMemoryBytes { get; set; }

    // === Health Score ===

    /// <summary>
    /// Overall health score (0-100)
    /// </summary>
    public int HealthScore { get; set; }

    /// <summary>
    /// Health status: Healthy, Warning, Critical, Unknown
    /// </summary>
    public string HealthStatus { get; set; } = "Unknown";

    // === Detected Apps Summary ===

    /// <summary>
    /// Total number of detected applications
    /// </summary>
    public int TotalDetectedApps { get; set; }

    /// <summary>
    /// Top 10 apps by name (lightweight summary)
    /// </summary>
    public List<DetectedAppSummaryDto> TopApps { get; set; } = new();

    // === Recommendations ===

    /// <summary>
    /// List of ICT recommendations for this device
    /// </summary>
    public List<IctRecommendationDto> Recommendations { get; set; } = new();

    // === Metadata ===

    /// <summary>
    /// When this data was retrieved
    /// </summary>
    public DateTime RetrievedAt { get; set; } = DateTime.UtcNow;
}

/// <summary>
/// Lightweight app summary for live status display (not full detected app)
/// </summary>
public class DetectedAppSummaryDto
{
    /// <summary>
    /// Application display name
    /// </summary>
    public string DisplayName { get; set; } = string.Empty;

    /// <summary>
    /// Application version
    /// </summary>
    public string? Version { get; set; }

    /// <summary>
    /// Application publisher
    /// </summary>
    public string? Publisher { get; set; }
}

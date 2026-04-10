namespace DjoppieInventory.Core.DTOs;

/// <summary>
/// Device health status information from Intune
/// </summary>
public class DeviceHealthDto
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
    /// Device serial number
    /// </summary>
    public string? SerialNumber { get; set; }

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

    /// <summary>
    /// OS build number for detailed version info
    /// </summary>
    public string? OsBuildNumber { get; set; }

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

    /// <summary>
    /// Device enrollment type
    /// </summary>
    public string? EnrollmentType { get; set; }

    /// <summary>
    /// Total storage in bytes
    /// </summary>
    public long? TotalStorageBytes { get; set; }

    /// <summary>
    /// Free storage in bytes
    /// </summary>
    public long? FreeStorageBytes { get; set; }

    /// <summary>
    /// Storage usage percentage
    /// </summary>
    public double? StorageUsagePercent { get; set; }

    /// <summary>
    /// Physical memory in bytes
    /// </summary>
    public long? PhysicalMemoryBytes { get; set; }

    /// <summary>
    /// When the device was enrolled in Intune
    /// </summary>
    public DateTime? EnrolledDateTime { get; set; }

    /// <summary>
    /// Last sync with Intune
    /// </summary>
    public DateTime? LastSyncDateTime { get; set; }

    /// <summary>
    /// Last check-in time
    /// </summary>
    public DateTime? LastCheckInDateTime { get; set; }

    /// <summary>
    /// Azure AD device ID
    /// </summary>
    public string? AzureAdDeviceId { get; set; }

    /// <summary>
    /// Whether Azure AD is registered
    /// </summary>
    public bool IsAzureAdRegistered { get; set; }

    /// <summary>
    /// Primary user UPN
    /// </summary>
    public string? UserPrincipalName { get; set; }

    /// <summary>
    /// Primary user display name
    /// </summary>
    public string? UserDisplayName { get; set; }

    /// <summary>
    /// WiFi MAC address
    /// </summary>
    public string? WifiMacAddress { get; set; }

    /// <summary>
    /// Ethernet MAC address
    /// </summary>
    public string? EthernetMacAddress { get; set; }

    /// <summary>
    /// Overall health score (0-100)
    /// </summary>
    public int HealthScore { get; set; }

    /// <summary>
    /// Health status: Healthy, Warning, Critical
    /// </summary>
    public string HealthStatus { get; set; } = "Unknown";

    /// <summary>
    /// When this data was retrieved
    /// </summary>
    public DateTime RetrievedAt { get; set; } = DateTime.UtcNow;
}

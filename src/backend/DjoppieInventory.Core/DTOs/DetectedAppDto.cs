namespace DjoppieInventory.Core.DTOs;

/// <summary>
/// Data Transfer Object for detected/installed applications from Intune
/// </summary>
public class DetectedAppDto
{
    /// <summary>
    /// Unique identifier for the detected app
    /// </summary>
    public string Id { get; set; } = string.Empty;

    /// <summary>
    /// Display name of the application
    /// </summary>
    public string DisplayName { get; set; } = string.Empty;

    /// <summary>
    /// Version of the application
    /// </summary>
    public string? Version { get; set; }

    /// <summary>
    /// Publisher or manufacturer of the application
    /// </summary>
    public string? Publisher { get; set; }

    /// <summary>
    /// Size of the application in bytes
    /// </summary>
    public long? SizeInBytes { get; set; }

    /// <summary>
    /// Platform/operating system (e.g., Windows, iOS, Android)
    /// </summary>
    public string? Platform { get; set; }

    /// <summary>
    /// Number of devices where this app is detected
    /// </summary>
    public int DeviceCount { get; set; }
}

/// <summary>
/// Response DTO containing device detected apps with metadata
/// </summary>
public class DeviceDetectedAppsResponseDto
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
    /// Operating system of the device
    /// </summary>
    public string? OperatingSystem { get; set; }

    /// <summary>
    /// OS version
    /// </summary>
    public string? OsVersion { get; set; }

    /// <summary>
    /// List of detected applications on this device
    /// </summary>
    public List<DetectedAppDto> DetectedApps { get; set; } = new();

    /// <summary>
    /// Total number of detected apps
    /// </summary>
    public int TotalApps { get; set; }

    /// <summary>
    /// When the device last synced with Intune
    /// </summary>
    public DateTime? LastSyncDateTime { get; set; }

    /// <summary>
    /// When this data was retrieved
    /// </summary>
    public DateTime RetrievedAt { get; set; } = DateTime.UtcNow;
}

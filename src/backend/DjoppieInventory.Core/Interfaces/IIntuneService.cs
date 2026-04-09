using DjoppieInventory.Core.DTOs;
using Microsoft.Graph.Models;

namespace DjoppieInventory.Core.Interfaces;

/// <summary>
/// Service interface for Microsoft Intune device management operations.
/// Provides methods to query and retrieve device information from Intune.
/// </summary>
public interface IIntuneService
{
    /// <summary>
    /// Retrieves all managed devices from Intune.
    /// </summary>
    /// <returns>A collection of managed devices</returns>
    Task<IEnumerable<ManagedDevice>> GetManagedDevicesAsync();

    /// <summary>
    /// Retrieves a specific managed device by its Intune device ID.
    /// </summary>
    /// <param name="deviceId">The Intune device identifier</param>
    /// <returns>The managed device if found, otherwise null</returns>
    Task<ManagedDevice?> GetDeviceByIdAsync(string deviceId);

    /// <summary>
    /// Searches for a managed device by its serial number.
    /// </summary>
    /// <param name="serialNumber">The device serial number</param>
    /// <returns>The managed device if found, otherwise null</returns>
    Task<ManagedDevice?> GetDeviceBySerialNumberAsync(string serialNumber);

    /// <summary>
    /// Searches for managed devices by device name.
    /// </summary>
    /// <param name="deviceName">The device name to search for</param>
    /// <returns>A collection of matching managed devices</returns>
    Task<IEnumerable<ManagedDevice>> SearchDevicesByNameAsync(string deviceName);

    /// <summary>
    /// Retrieves managed devices assigned to a specific user by UPN.
    /// </summary>
    /// <param name="userPrincipalName">The user's UPN (email)</param>
    /// <returns>A collection of managed devices for the user</returns>
    Task<IEnumerable<ManagedDevice>> GetDevicesByUserAsync(string userPrincipalName);

    /// <summary>
    /// Retrieves managed devices filtered by operating system.
    /// </summary>
    /// <param name="operatingSystem">The operating system (e.g., "Windows", "iOS", "Android")</param>
    /// <returns>A collection of managed devices running the specified OS</returns>
    Task<IEnumerable<ManagedDevice>> GetDevicesByOperatingSystemAsync(string operatingSystem);

    /// <summary>
    /// Gets the compliance state for a specific device.
    /// </summary>
    /// <param name="deviceId">The Intune device identifier</param>
    /// <returns>True if device is compliant, false otherwise</returns>
    Task<bool> IsDeviceCompliantAsync(string deviceId);

    /// <summary>
    /// Retrieves all detected/installed applications for a specific managed device.
    /// Uses Microsoft Graph Beta API to expand detectedApps on the device.
    /// </summary>
    /// <param name="deviceId">The Intune device identifier</param>
    /// <returns>Response containing device information and list of detected applications</returns>
    /// <exception cref="ArgumentException">Thrown when deviceId is null or empty</exception>
    /// <exception cref="InvalidOperationException">Thrown when the Graph API call fails</exception>
    Task<DeviceDetectedAppsResponseDto?> GetDeviceInstalledAppsAsync(string deviceId);

    /// <summary>
    /// Retrieves all detected/installed applications for a device identified by serial number.
    /// First looks up the device by serial number, then retrieves installed apps.
    /// </summary>
    /// <param name="serialNumber">The device serial number</param>
    /// <returns>Response containing device information and list of detected applications, or null if device not found</returns>
    /// <exception cref="ArgumentException">Thrown when serialNumber is null or empty</exception>
    /// <exception cref="InvalidOperationException">Thrown when the Graph API call fails</exception>
    Task<DeviceDetectedAppsResponseDto?> GetDeviceInstalledAppsBySerialAsync(string serialNumber);

    /// <summary>
    /// Retrieves device health information and ICT recommendations for a device identified by serial number.
    /// Includes compliance status, storage, encryption, OS version, and improvement recommendations.
    /// </summary>
    /// <param name="serialNumber">The device serial number</param>
    /// <returns>Device health information with recommendations, or null if device not found</returns>
    /// <exception cref="ArgumentException">Thrown when serialNumber is null or empty</exception>
    /// <exception cref="InvalidOperationException">Thrown when the Graph API call fails</exception>
    Task<DeviceHealthDto?> GetDeviceHealthBySerialAsync(string serialNumber);

    /// <summary>
    /// Retrieves combined live status for a device including compliance, health, and app summary.
    /// Optimized for polling scenarios - returns all data in a single call.
    /// </summary>
    /// <param name="serialNumber">The device serial number</param>
    /// <returns>Combined live status data, or a result with Found=false if device not found</returns>
    /// <exception cref="ArgumentException">Thrown when serialNumber is null or empty</exception>
    Task<DeviceLiveStatusDto> GetDeviceLiveStatusAsync(string serialNumber);

    /// <summary>
    /// Retrieves the provisioning timeline for a device from Autopilot registration to user delivery.
    /// Includes timing data for each provisioning phase.
    /// </summary>
    /// <param name="serialNumber">The device serial number</param>
    /// <returns>Provisioning timeline with events, or a result with Found=false if device not found</returns>
    /// <exception cref="ArgumentException">Thrown when serialNumber is null or empty</exception>
    Task<ProvisioningTimelineDto> GetProvisioningTimelineAsync(string serialNumber);

    /// <summary>
    /// Retrieves all Windows Autopilot device identities from Intune.
    /// </summary>
    /// <returns>A collection of Autopilot device identities</returns>
    Task<IEnumerable<AutopilotDeviceDto>> GetAutopilotDevicesAsync();

    /// <summary>
    /// Retrieves configuration profile deployment statuses for a device.
    /// Shows which profiles (including certificate/Wi-Fi/VPN profiles) are deployed,
    /// their status, and which user they target — critical for diagnosing network
    /// certificate issues after primary user changes.
    /// </summary>
    /// <param name="deviceId">The Intune device identifier</param>
    /// <returns>Configuration status with profile details, or null if device not found</returns>
    Task<DeviceConfigurationStatusDto?> GetDeviceConfigurationStatusAsync(string deviceId);

    /// <summary>
    /// Retrieves configuration profile deployment statuses for a device identified by serial number.
    /// Convenience method that first looks up the device by serial, then retrieves configuration status.
    /// </summary>
    /// <param name="serialNumber">The device serial number</param>
    /// <returns>Configuration status with profile details, or null if device not found</returns>
    Task<DeviceConfigurationStatusDto?> GetDeviceConfigurationStatusBySerialAsync(string serialNumber);
}

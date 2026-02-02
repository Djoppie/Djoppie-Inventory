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
}

using DjoppieInventory.Core.Interfaces;
using DjoppieInventory.Infrastructure.Helpers;
using Microsoft.Graph;
using Microsoft.Graph.Models;
using Microsoft.Extensions.Logging;

namespace DjoppieInventory.Infrastructure.Services;

/// <summary>
/// Service implementation for Microsoft Intune device management operations.
/// Uses Microsoft Graph API to interact with Intune managed devices.
/// </summary>
public class IntuneService : IIntuneService
{
    private readonly GraphServiceClient _graphClient;
    private readonly ILogger<IntuneService> _logger;

    public IntuneService(GraphServiceClient graphClient, ILogger<IntuneService> logger)
    {
        _graphClient = graphClient ?? throw new ArgumentNullException(nameof(graphClient));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    /// <inheritdoc/>
    public async Task<IEnumerable<ManagedDevice>> GetManagedDevicesAsync()
    {
        try
        {
            _logger.LogInformation("Retrieving all managed devices from Intune");

            var devices = await _graphClient.DeviceManagement.ManagedDevices
                .GetAsync(requestConfiguration =>
                {
                    requestConfiguration.QueryParameters.Top = 999;
                    requestConfiguration.QueryParameters.Select = new[]
                    {
                        "id", "deviceName", "serialNumber", "manufacturer", "model",
                        "operatingSystem", "osVersion", "complianceState", "lastSyncDateTime",
                        "enrolledDateTime", "userPrincipalName", "managementAgent"
                    };
                });

            var deviceList = devices?.Value ?? new List<ManagedDevice>();
            _logger.LogInformation("Retrieved {Count} managed devices from Intune", deviceList.Count);

            return deviceList;
        }
        catch (ServiceException ex)
        {
            _logger.LogError(ex, "Microsoft Graph API error while retrieving managed devices. Status: {StatusCode}", ex.ResponseStatusCode);
            throw new InvalidOperationException($"Failed to retrieve managed devices from Intune: {ex.Message}", ex);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error while retrieving managed devices from Intune");
            throw;
        }
    }

    /// <inheritdoc/>
    public async Task<ManagedDevice?> GetDeviceByIdAsync(string deviceId)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(deviceId))
            {
                throw new ArgumentException("Device ID cannot be null or empty", nameof(deviceId));
            }

            _logger.LogInformation("Retrieving managed device with ID: {DeviceId}", deviceId);

            var device = await _graphClient.DeviceManagement.ManagedDevices[deviceId]
                .GetAsync(requestConfiguration =>
                {
                    requestConfiguration.QueryParameters.Select = new[]
                    {
                        "id", "deviceName", "serialNumber", "manufacturer", "model",
                        "operatingSystem", "osVersion", "complianceState", "lastSyncDateTime",
                        "enrolledDateTime", "userPrincipalName", "managementAgent",
                        "totalStorageSpaceInBytes", "freeStorageSpaceInBytes"
                    };
                });

            if (device != null)
            {
                _logger.LogInformation("Found managed device: {DeviceName} ({DeviceId})", device.DeviceName, deviceId);
            }
            else
            {
                _logger.LogWarning("Managed device not found with ID: {DeviceId}", deviceId);
            }

            return device;
        }
        catch (ServiceException ex) when (ex.ResponseStatusCode == (int)System.Net.HttpStatusCode.NotFound)
        {
            _logger.LogWarning("Managed device not found with ID: {DeviceId}", deviceId);
            return null;
        }
        catch (ServiceException ex)
        {
            _logger.LogError(ex, "Microsoft Graph API error while retrieving device {DeviceId}. Status: {StatusCode}", deviceId, ex.ResponseStatusCode);
            throw new InvalidOperationException($"Failed to retrieve device from Intune: {ex.Message}", ex);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error while retrieving device {DeviceId} from Intune", deviceId);
            throw;
        }
    }

    /// <inheritdoc/>
    public async Task<ManagedDevice?> GetDeviceBySerialNumberAsync(string serialNumber)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(serialNumber))
            {
                throw new ArgumentException("Serial number cannot be null or empty", nameof(serialNumber));
            }

            _logger.LogInformation("Searching for managed device with serial number: {SerialNumber}", serialNumber);

            // Validate input to prevent injection attacks
            if (!ODataSanitizer.IsValidFilterValue(serialNumber))
            {
                _logger.LogWarning("Invalid serial number format detected, possible injection attempt: {SerialNumber}", serialNumber);
                throw new ArgumentException("Invalid serial number format", nameof(serialNumber));
            }

            var devices = await _graphClient.DeviceManagement.ManagedDevices
                .GetAsync(requestConfiguration =>
                {
                    requestConfiguration.QueryParameters.Filter = ODataSanitizer.CreateEqualityFilter("serialNumber", serialNumber);
                    requestConfiguration.QueryParameters.Select = new[]
                    {
                        "id", "deviceName", "serialNumber", "manufacturer", "model",
                        "operatingSystem", "osVersion", "complianceState", "lastSyncDateTime",
                        "enrolledDateTime", "userPrincipalName", "managementAgent"
                    };
                });

            var device = devices?.Value?.FirstOrDefault();

            if (device != null)
            {
                _logger.LogInformation("Found managed device with serial number {SerialNumber}: {DeviceName}", serialNumber, device.DeviceName);
            }
            else
            {
                _logger.LogWarning("No managed device found with serial number: {SerialNumber}", serialNumber);
            }

            return device;
        }
        catch (ServiceException ex)
        {
            _logger.LogError(ex, "Microsoft Graph API error while searching for device with serial {SerialNumber}. Status: {StatusCode}", serialNumber, ex.ResponseStatusCode);
            throw new InvalidOperationException($"Failed to search device by serial number: {ex.Message}", ex);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error while searching for device with serial {SerialNumber}", serialNumber);
            throw;
        }
    }

    /// <inheritdoc/>
    public async Task<IEnumerable<ManagedDevice>> SearchDevicesByNameAsync(string deviceName)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(deviceName))
            {
                throw new ArgumentException("Device name cannot be null or empty", nameof(deviceName));
            }

            _logger.LogInformation("Searching for managed devices with name containing: {DeviceName}", deviceName);

            // Validate input to prevent injection attacks
            if (!ODataSanitizer.IsValidFilterValue(deviceName))
            {
                _logger.LogWarning("Invalid device name format detected, possible injection attempt: {DeviceName}", deviceName);
                throw new ArgumentException("Invalid device name format", nameof(deviceName));
            }

            var devices = await _graphClient.DeviceManagement.ManagedDevices
                .GetAsync(requestConfiguration =>
                {
                    requestConfiguration.QueryParameters.Filter = ODataSanitizer.CreateStartsWithFilter("deviceName", deviceName);
                    requestConfiguration.QueryParameters.Select = new[]
                    {
                        "id", "deviceName", "serialNumber", "manufacturer", "model",
                        "operatingSystem", "osVersion", "complianceState", "lastSyncDateTime"
                    };
                });

            var deviceList = devices?.Value ?? new List<ManagedDevice>();
            _logger.LogInformation("Found {Count} managed devices matching name: {DeviceName}", deviceList.Count, deviceName);

            return deviceList;
        }
        catch (ServiceException ex)
        {
            _logger.LogError(ex, "Microsoft Graph API error while searching devices by name {DeviceName}. Status: {StatusCode}", deviceName, ex.ResponseStatusCode);
            throw new InvalidOperationException($"Failed to search devices by name: {ex.Message}", ex);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error while searching devices by name {DeviceName}", deviceName);
            throw;
        }
    }

    /// <inheritdoc/>
    public async Task<IEnumerable<ManagedDevice>> GetDevicesByOperatingSystemAsync(string operatingSystem)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(operatingSystem))
            {
                throw new ArgumentException("Operating system cannot be null or empty", nameof(operatingSystem));
            }

            _logger.LogInformation("Retrieving managed devices with OS: {OperatingSystem}", operatingSystem);

            // Validate input to prevent injection attacks
            if (!ODataSanitizer.IsValidFilterValue(operatingSystem))
            {
                _logger.LogWarning("Invalid OS format detected, possible injection attempt: {OperatingSystem}", operatingSystem);
                throw new ArgumentException("Invalid operating system format", nameof(operatingSystem));
            }

            var devices = await _graphClient.DeviceManagement.ManagedDevices
                .GetAsync(requestConfiguration =>
                {
                    requestConfiguration.QueryParameters.Filter = ODataSanitizer.CreateEqualityFilter("operatingSystem", operatingSystem);
                    requestConfiguration.QueryParameters.Select = new[]
                    {
                        "id", "deviceName", "serialNumber", "manufacturer", "model",
                        "operatingSystem", "osVersion", "complianceState", "lastSyncDateTime"
                    };
                });

            var deviceList = devices?.Value ?? new List<ManagedDevice>();
            _logger.LogInformation("Found {Count} managed devices with OS: {OperatingSystem}", deviceList.Count, operatingSystem);

            return deviceList;
        }
        catch (ServiceException ex)
        {
            _logger.LogError(ex, "Microsoft Graph API error while retrieving devices by OS {OperatingSystem}. Status: {StatusCode}", operatingSystem, ex.ResponseStatusCode);
            throw new InvalidOperationException($"Failed to retrieve devices by operating system: {ex.Message}", ex);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error while retrieving devices by OS {OperatingSystem}", operatingSystem);
            throw;
        }
    }

    /// <inheritdoc/>
    public async Task<bool> IsDeviceCompliantAsync(string deviceId)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(deviceId))
            {
                throw new ArgumentException("Device ID cannot be null or empty", nameof(deviceId));
            }

            _logger.LogInformation("Checking compliance state for device: {DeviceId}", deviceId);

            var device = await _graphClient.DeviceManagement.ManagedDevices[deviceId]
                .GetAsync(requestConfiguration =>
                {
                    requestConfiguration.QueryParameters.Select = new[] { "id", "complianceState" };
                });

            var isCompliant = device?.ComplianceState == ComplianceState.Compliant;

            _logger.LogInformation("Device {DeviceId} compliance state: {ComplianceState}", deviceId, device?.ComplianceState);

            return isCompliant;
        }
        catch (ServiceException ex) when (ex.ResponseStatusCode == (int)System.Net.HttpStatusCode.NotFound)
        {
            _logger.LogWarning("Device not found when checking compliance: {DeviceId}", deviceId);
            return false;
        }
        catch (ServiceException ex)
        {
            _logger.LogError(ex, "Microsoft Graph API error while checking device compliance {DeviceId}. Status: {StatusCode}", deviceId, ex.ResponseStatusCode);
            throw new InvalidOperationException($"Failed to check device compliance: {ex.Message}", ex);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error while checking device compliance {DeviceId}", deviceId);
            throw;
        }
    }
}

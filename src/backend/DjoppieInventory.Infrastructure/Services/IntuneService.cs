using DjoppieInventory.Core.DTOs;
using DjoppieInventory.Core.Interfaces;
using DjoppieInventory.Infrastructure.Helpers;
using Microsoft.Graph;
using Microsoft.Graph.Models;
using Microsoft.Extensions.Logging;
using System.Text.Json;

namespace DjoppieInventory.Infrastructure.Services;

/// <summary>
/// Service implementation for Microsoft Intune device management operations.
/// Uses Microsoft Graph API to interact with Intune managed devices.
/// Focuses purely on Intune API operations - sync orchestration is handled by IntuneSyncService.
/// </summary>
public class IntuneService : IIntuneService
{
    private readonly GraphServiceClient _graphClient;
    private readonly ILogger<IntuneService> _logger;

    public IntuneService(
        GraphServiceClient graphClient,
        ILogger<IntuneService> logger)
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
                        "enrolledDateTime", "userPrincipalName", "managementAgent",
                        "managementCertificateExpirationDate"
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
    public async Task<IEnumerable<ManagedDevice>> GetDevicesByUserAsync(string userPrincipalName)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(userPrincipalName))
            {
                throw new ArgumentException("User principal name cannot be null or empty", nameof(userPrincipalName));
            }

            _logger.LogInformation("Fetching managed devices for user: {UPN}", userPrincipalName);

            if (!ODataSanitizer.IsValidFilterValue(userPrincipalName))
            {
                _logger.LogWarning("Invalid UPN format detected: {UPN}", userPrincipalName);
                throw new ArgumentException("Invalid UPN format", nameof(userPrincipalName));
            }

            var devices = await _graphClient.DeviceManagement.ManagedDevices
                .GetAsync(requestConfiguration =>
                {
                    requestConfiguration.QueryParameters.Filter = ODataSanitizer.CreateEqualityFilter("userPrincipalName", userPrincipalName);
                    requestConfiguration.QueryParameters.Select = new[]
                    {
                        "id", "deviceName", "serialNumber", "manufacturer", "model",
                        "operatingSystem", "osVersion", "complianceState", "lastSyncDateTime",
                        "enrolledDateTime", "userPrincipalName", "managementAgent"
                    };
                });

            var deviceList = devices?.Value ?? new List<ManagedDevice>();
            _logger.LogInformation("Found {Count} managed devices for user: {UPN}", deviceList.Count, userPrincipalName);

            return deviceList;
        }
        catch (ServiceException ex)
        {
            _logger.LogError(ex, "Microsoft Graph API error while fetching devices for user {UPN}. Status: {StatusCode}", userPrincipalName, ex.ResponseStatusCode);
            throw new InvalidOperationException($"Failed to get devices for user: {ex.Message}", ex);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error while fetching devices for user {UPN}", userPrincipalName);
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

    /// <inheritdoc/>
    public async Task<DeviceDetectedAppsResponseDto?> GetDeviceInstalledAppsAsync(string deviceId)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(deviceId))
            {
                throw new ArgumentException("Device ID cannot be null or empty", nameof(deviceId));
            }

            _logger.LogInformation("Retrieving installed applications for device: {DeviceId}", deviceId);

            // Use beta API to get detectedApps - the expand functionality is only available in beta
            var betaEndpoint = $"https://graph.microsoft.com/beta/deviceManagement/managedDevices/{deviceId}?$expand=detectedApps";

            // Create request info for authentication
            var requestInfo = new Microsoft.Kiota.Abstractions.RequestInformation
            {
                HttpMethod = Microsoft.Kiota.Abstractions.Method.GET,
                URI = new Uri(betaEndpoint)
            };

            // Get the native HTTP request with authentication
            var nativeRequest = await _graphClient.RequestAdapter.ConvertToNativeRequestAsync<HttpRequestMessage>(requestInfo)
                ?? throw new InvalidOperationException("Failed to create native HTTP request");

            // Use HttpClient to make the request
            using var httpClient = new HttpClient();
            var httpResponse = await httpClient.SendAsync(nativeRequest);

            if (httpResponse.StatusCode == System.Net.HttpStatusCode.NotFound)
            {
                _logger.LogWarning("Device not found with ID: {DeviceId}", deviceId);
                return null;
            }

            httpResponse.EnsureSuccessStatusCode();

            var responseContent = await httpResponse.Content.ReadAsStringAsync();
            var jsonResponse = JsonDocument.Parse(responseContent).RootElement;

            // Parse the response
            var deviceName = jsonResponse.TryGetProperty("deviceName", out var nameElement) ? nameElement.GetString() : "Unknown";
            var operatingSystem = jsonResponse.TryGetProperty("operatingSystem", out var osElement) ? osElement.GetString() : null;
            var osVersion = jsonResponse.TryGetProperty("osVersion", out var osVerElement) ? osVerElement.GetString() : null;
            var lastSyncDateTime = jsonResponse.TryGetProperty("lastSyncDateTime", out var lastSyncElement) && lastSyncElement.ValueKind != JsonValueKind.Null
                ? lastSyncElement.GetDateTime()
                : (DateTime?)null;

            var detectedApps = new List<DetectedAppDto>();

            // Parse detected apps if available
            if (jsonResponse.TryGetProperty("detectedApps", out var appsArray) && appsArray.ValueKind == JsonValueKind.Array)
            {
                foreach (var appElement in appsArray.EnumerateArray())
                {
                    var app = new DetectedAppDto
                    {
                        Id = appElement.TryGetProperty("id", out var idElem) ? idElem.GetString() ?? string.Empty : string.Empty,
                        DisplayName = appElement.TryGetProperty("displayName", out var displayNameElem) ? displayNameElem.GetString() ?? string.Empty : string.Empty,
                        Version = appElement.TryGetProperty("version", out var versionElem) ? versionElem.GetString() : null,
                        Publisher = appElement.TryGetProperty("publisher", out var publisherElem) ? publisherElem.GetString() : null,
                        SizeInBytes = appElement.TryGetProperty("sizeInByte", out var sizeElem) && sizeElem.ValueKind != JsonValueKind.Null ? sizeElem.GetInt64() : null,
                        Platform = appElement.TryGetProperty("platform", out var platformElem) ? platformElem.GetString() : operatingSystem,
                        DeviceCount = appElement.TryGetProperty("deviceCount", out var deviceCountElem) && deviceCountElem.ValueKind != JsonValueKind.Null ? deviceCountElem.GetInt32() : 1
                    };

                    detectedApps.Add(app);
                }
            }

            var response = new DeviceDetectedAppsResponseDto
            {
                DeviceId = deviceId,
                DeviceName = deviceName ?? "Unknown",
                OperatingSystem = operatingSystem,
                OsVersion = osVersion,
                DetectedApps = detectedApps,
                TotalApps = detectedApps.Count,
                LastSyncDateTime = lastSyncDateTime,
                RetrievedAt = DateTime.UtcNow
            };

            _logger.LogInformation("Retrieved {AppCount} installed applications for device {DeviceName} ({DeviceId})",
                detectedApps.Count, deviceName, deviceId);

            return response;
        }
        catch (ServiceException ex) when (ex.ResponseStatusCode == (int)System.Net.HttpStatusCode.NotFound)
        {
            _logger.LogWarning("Device not found with ID: {DeviceId}", deviceId);
            return null;
        }
        catch (ServiceException ex)
        {
            _logger.LogError(ex, "Microsoft Graph API error while retrieving installed apps for device {DeviceId}. Status: {StatusCode}", deviceId, ex.ResponseStatusCode);
            throw new InvalidOperationException($"Failed to retrieve installed applications from Intune: {ex.Message}", ex);
        }
        catch (HttpRequestException ex)
        {
            _logger.LogError(ex, "HTTP request failed while retrieving installed apps for device {DeviceId}", deviceId);
            throw new InvalidOperationException($"Failed to retrieve installed applications from Intune: {ex.Message}", ex);
        }
        catch (JsonException ex)
        {
            _logger.LogError(ex, "Error parsing JSON response for device {DeviceId} installed apps", deviceId);
            throw new InvalidOperationException($"Failed to parse installed applications response: {ex.Message}", ex);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error while retrieving installed apps for device {DeviceId}", deviceId);
            throw;
        }
    }

    /// <inheritdoc/>
    public async Task<DeviceDetectedAppsResponseDto?> GetDeviceInstalledAppsBySerialAsync(string serialNumber)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(serialNumber))
            {
                throw new ArgumentException("Serial number cannot be null or empty", nameof(serialNumber));
            }

            _logger.LogInformation("Looking up device by serial number to retrieve installed apps: {SerialNumber}", serialNumber);

            // First, find the device by serial number
            var device = await GetDeviceBySerialNumberAsync(serialNumber);

            if (device == null || string.IsNullOrWhiteSpace(device.Id))
            {
                _logger.LogWarning("No device found with serial number: {SerialNumber}", serialNumber);
                return null;
            }

            _logger.LogInformation("Found device {DeviceName} with ID {DeviceId} for serial number {SerialNumber}",
                device.DeviceName, device.Id, serialNumber);

            // Now get the installed apps using the device ID
            return await GetDeviceInstalledAppsAsync(device.Id);
        }
        catch (ArgumentException)
        {
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving installed apps for device with serial number {SerialNumber}", serialNumber);
            throw;
        }
    }

    /// <inheritdoc/>
    public async Task<DeviceHealthDto?> GetDeviceHealthBySerialAsync(string serialNumber)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(serialNumber))
            {
                throw new ArgumentException("Serial number cannot be null or empty", nameof(serialNumber));
            }

            _logger.LogInformation("Looking up device health by serial number: {SerialNumber}", serialNumber);

            // First, find the device by serial number
            var device = await GetDeviceBySerialNumberAsync(serialNumber);

            if (device == null || string.IsNullOrWhiteSpace(device.Id))
            {
                _logger.LogWarning("No device found with serial number: {SerialNumber}", serialNumber);
                return null;
            }

            _logger.LogInformation("Found device {DeviceName} for health check", device.DeviceName);

            // Calculate storage usage
            double? storageUsagePercent = null;
            if (device.TotalStorageSpaceInBytes.HasValue && device.TotalStorageSpaceInBytes > 0 && device.FreeStorageSpaceInBytes.HasValue)
            {
                var usedStorage = device.TotalStorageSpaceInBytes.Value - device.FreeStorageSpaceInBytes.Value;
                storageUsagePercent = Math.Round((double)usedStorage / device.TotalStorageSpaceInBytes.Value * 100, 1);
            }

            // Determine compliance
            var isCompliant = device.ComplianceState?.ToString()?.ToLowerInvariant() == "compliant";

            // Create health DTO
            var health = new DeviceHealthDto
            {
                DeviceId = device.Id,
                DeviceName = device.DeviceName ?? "Unknown",
                Manufacturer = device.Manufacturer,
                Model = device.Model,
                OperatingSystem = device.OperatingSystem,
                OsVersion = device.OsVersion,
                ComplianceState = device.ComplianceState?.ToString(),
                IsCompliant = isCompliant,
                IsEncrypted = device.IsEncrypted ?? false,
                IsSupervised = device.IsSupervised ?? false,
                TotalStorageBytes = device.TotalStorageSpaceInBytes,
                FreeStorageBytes = device.FreeStorageSpaceInBytes,
                StorageUsagePercent = storageUsagePercent,
                PhysicalMemoryBytes = device.PhysicalMemoryInBytes,
                EnrolledDateTime = device.EnrolledDateTime?.DateTime,
                LastSyncDateTime = device.LastSyncDateTime?.DateTime,
                AzureAdDeviceId = device.AzureADDeviceId,
                IsAzureAdRegistered = device.AzureADRegistered ?? false,
                UserPrincipalName = device.UserPrincipalName,
                UserDisplayName = device.UserDisplayName,
                WifiMacAddress = device.WiFiMacAddress,
                EthernetMacAddress = device.EthernetMacAddress,
                RetrievedAt = DateTime.UtcNow
            };

            // Calculate health score based on device status
            health.HealthScore = CalculateHealthScore(health);
            health.HealthStatus = health.HealthScore >= 80 ? "Healthy" : health.HealthScore >= 50 ? "Warning" : "Critical";

            _logger.LogInformation("Device health retrieved for {DeviceName}: Score={Score}, Status={Status}",
                health.DeviceName, health.HealthScore, health.HealthStatus);

            return health;
        }
        catch (ArgumentException)
        {
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving device health for serial number {SerialNumber}", serialNumber);
            throw;
        }
    }

    /// <summary>
    /// Calculate overall health score based on device status
    /// </summary>
    private int CalculateHealthScore(DeviceHealthDto health)
    {
        var score = 0;

        // Compliance: +30 points
        if (health.IsCompliant)
            score += 30;

        // Encryption: +30 points
        if (health.IsEncrypted)
            score += 30;

        // Storage: +20 points (if not critical)
        if (!health.StorageUsagePercent.HasValue || health.StorageUsagePercent < 90)
            score += 20;
        else if (health.StorageUsagePercent < 95)
            score += 10;

        // Recent sync: +20 points (within 7 days)
        if (health.LastSyncDateTime.HasValue)
        {
            var daysSinceSync = (DateTime.UtcNow - health.LastSyncDateTime.Value).TotalDays;
            if (daysSinceSync <= 7)
                score += 20;
            else if (daysSinceSync <= 14)
                score += 10;
        }

        return score;
    }

    /// <inheritdoc/>
    public async Task<DeviceLiveStatusDto> GetDeviceLiveStatusAsync(string serialNumber)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(serialNumber))
            {
                throw new ArgumentException("Serial number cannot be null or empty", nameof(serialNumber));
            }

            _logger.LogInformation("Retrieving live status for device with serial: {SerialNumber}", serialNumber);

            // Find device by serial number
            var device = await GetDeviceBySerialNumberAsync(serialNumber);

            if (device == null || string.IsNullOrWhiteSpace(device.Id))
            {
                _logger.LogWarning("Device not found in Intune for serial: {SerialNumber}", serialNumber);
                return new DeviceLiveStatusDto
                {
                    Found = false,
                    ErrorMessage = $"Device with serial number '{serialNumber}' not found in Intune",
                    SerialNumber = serialNumber,
                    RetrievedAt = DateTime.UtcNow
                };
            }

            // Fetch health and apps in parallel for better performance
            var healthTask = GetDeviceHealthBySerialAsync(serialNumber);
            var appsTask = GetDeviceInstalledAppsAsync(device.Id);

            await Task.WhenAll(healthTask, appsTask);

            var health = healthTask.Result;
            var apps = appsTask.Result;

            // Calculate storage percentage
            double? storageUsagePercent = null;
            if (device.TotalStorageSpaceInBytes.HasValue && device.TotalStorageSpaceInBytes > 0 && device.FreeStorageSpaceInBytes.HasValue)
            {
                var usedStorage = device.TotalStorageSpaceInBytes.Value - device.FreeStorageSpaceInBytes.Value;
                storageUsagePercent = Math.Round((double)usedStorage / device.TotalStorageSpaceInBytes.Value * 100, 1);
            }

            // Build combined response
            var liveStatus = new DeviceLiveStatusDto
            {
                Found = true,
                DeviceId = device.Id,
                DeviceName = device.DeviceName ?? "Unknown",
                SerialNumber = device.SerialNumber,
                AzureAdDeviceId = device.AzureADDeviceId,

                // Hardware
                Manufacturer = device.Manufacturer,
                Model = device.Model,
                OperatingSystem = device.OperatingSystem,
                OsVersion = device.OsVersion,

                // Compliance
                ComplianceState = device.ComplianceState?.ToString(),
                IsCompliant = device.ComplianceState == ComplianceState.Compliant,
                IsEncrypted = device.IsEncrypted ?? false,
                IsSupervised = device.IsSupervised ?? false,

                // Sync
                LastSyncDateTime = device.LastSyncDateTime?.DateTime,
                EnrolledDateTime = device.EnrolledDateTime?.DateTime,

                // User
                UserPrincipalName = device.UserPrincipalName,
                UserDisplayName = device.UserDisplayName,

                // Storage
                TotalStorageBytes = device.TotalStorageSpaceInBytes,
                FreeStorageBytes = device.FreeStorageSpaceInBytes,
                StorageUsagePercent = storageUsagePercent,

                // Memory
                PhysicalMemoryBytes = device.PhysicalMemoryInBytes,

                RetrievedAt = DateTime.UtcNow
            };

            // Add health data if available
            if (health != null)
            {
                liveStatus.HealthScore = health.HealthScore;
                liveStatus.HealthStatus = health.HealthStatus;
            }

            // Add apps summary (top 10 by name for display)
            if (apps?.DetectedApps != null)
            {
                liveStatus.TotalDetectedApps = apps.TotalApps;
                liveStatus.TopApps = apps.DetectedApps
                    .OrderBy(a => a.DisplayName)
                    .Take(10)
                    .Select(a => new DetectedAppSummaryDto
                    {
                        DisplayName = a.DisplayName,
                        Version = a.Version,
                        Publisher = a.Publisher
                    })
                    .ToList();
            }

            _logger.LogInformation("Live status retrieved for {DeviceName}: Health={HealthScore}, Apps={AppCount}",
                liveStatus.DeviceName, liveStatus.HealthScore, liveStatus.TotalDetectedApps);

            return liveStatus;
        }
        catch (ArgumentException)
        {
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving live status for device with serial {SerialNumber}", serialNumber);
            return new DeviceLiveStatusDto
            {
                Found = false,
                ErrorMessage = $"Error retrieving device status: {ex.Message}",
                SerialNumber = serialNumber,
                RetrievedAt = DateTime.UtcNow
            };
        }
    }

    /// <inheritdoc/>
    public async Task<ProvisioningTimelineDto> GetProvisioningTimelineAsync(string serialNumber)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(serialNumber))
            {
                throw new ArgumentException("Serial number cannot be null or empty", nameof(serialNumber));
            }

            _logger.LogInformation("Retrieving provisioning timeline for device with serial: {SerialNumber}", serialNumber);

            // Validate input to prevent injection attacks
            if (!ODataSanitizer.IsValidFilterValue(serialNumber))
            {
                _logger.LogWarning("Invalid serial number format detected: {SerialNumber}", serialNumber);
                throw new ArgumentException("Invalid serial number format", nameof(serialNumber));
            }

            // Find the managed device first to get enrollment data
            var device = await GetDeviceBySerialNumberAsync(serialNumber);

            // Query Windows Autopilot device identities using beta API
            var autopilotEndpoint = $"https://graph.microsoft.com/beta/deviceManagement/windowsAutopilotDeviceIdentities?$filter=serialNumber eq '{ODataSanitizer.SanitizeForFilter(serialNumber)}'";

            var requestInfo = new Microsoft.Kiota.Abstractions.RequestInformation
            {
                HttpMethod = Microsoft.Kiota.Abstractions.Method.GET,
                URI = new Uri(autopilotEndpoint)
            };

            var nativeRequest = await _graphClient.RequestAdapter.ConvertToNativeRequestAsync<HttpRequestMessage>(requestInfo)
                ?? throw new InvalidOperationException("Failed to create native HTTP request");

            using var httpClient = new HttpClient();
            var autopilotResponse = await httpClient.SendAsync(nativeRequest);

            JsonElement? autopilotDevice = null;

            if (autopilotResponse.IsSuccessStatusCode)
            {
                var autopilotContent = await autopilotResponse.Content.ReadAsStringAsync();
                var autopilotJson = JsonDocument.Parse(autopilotContent).RootElement;

                if (autopilotJson.TryGetProperty("value", out var autopilotArray) &&
                    autopilotArray.ValueKind == JsonValueKind.Array &&
                    autopilotArray.GetArrayLength() > 0)
                {
                    autopilotDevice = autopilotArray[0];
                }
            }
            else
            {
                _logger.LogWarning("Failed to query Autopilot devices. Status: {StatusCode}", autopilotResponse.StatusCode);
            }

            // If neither device nor autopilot data found, return not found
            if (device == null && !autopilotDevice.HasValue)
            {
                _logger.LogWarning("Device not found in Intune or Autopilot for serial: {SerialNumber}", serialNumber);
                return new ProvisioningTimelineDto
                {
                    Found = false,
                    ErrorMessage = $"Device with serial number '{serialNumber}' not found in Intune or Autopilot",
                    SerialNumber = serialNumber,
                    RetrievedAt = DateTime.UtcNow
                };
            }

            // Build the provisioning timeline
            var timeline = new ProvisioningTimelineDto
            {
                Found = true,
                DeviceId = device?.Id,
                SerialNumber = serialNumber,
                RetrievedAt = DateTime.UtcNow
            };

            var events = new List<ProvisioningEventDto>();

            // Event 1: Autopilot Registration
            DateTime? autopilotRegisteredAt = null;
            if (autopilotDevice.HasValue)
            {
                if (autopilotDevice.Value.TryGetProperty("deploymentProfileAssignmentDateTime", out var deploymentDateTime) &&
                    deploymentDateTime.ValueKind != JsonValueKind.Null)
                {
                    autopilotRegisteredAt = deploymentDateTime.GetDateTime();
                }
                else if (autopilotDevice.Value.TryGetProperty("lastContactedDateTime", out var lastContactDateTime) &&
                    lastContactDateTime.ValueKind != JsonValueKind.Null)
                {
                    autopilotRegisteredAt = lastContactDateTime.GetDateTime();
                }
            }

            timeline.AutopilotRegisteredAt = autopilotRegisteredAt;
            events.Add(new ProvisioningEventDto
            {
                Id = "registration",
                Phase = "Registration",
                Status = autopilotRegisteredAt.HasValue ? "Complete" : (autopilotDevice.HasValue ? "InProgress" : "Pending"),
                Title = "Autopilot Registration",
                Description = autopilotDevice.HasValue ? "Device registered in Windows Autopilot" : "Awaiting Autopilot registration",
                StartedAt = autopilotRegisteredAt,
                CompletedAt = autopilotRegisteredAt,
                DurationFormatted = autopilotRegisteredAt.HasValue ? "< 1 min" : null,
                Order = 1
            });

            // Event 2: Enrollment (OOBE)
            DateTime? enrollmentStartedAt = null;
            DateTime? enrollmentCompletedAt = null;

            if (device != null)
            {
                enrollmentCompletedAt = device.EnrolledDateTime?.DateTime;
                // Estimate enrollment started slightly before completion
                if (enrollmentCompletedAt.HasValue && autopilotRegisteredAt.HasValue)
                {
                    // If we have autopilot registration, enrollment started after that
                    enrollmentStartedAt = autopilotRegisteredAt.Value.AddMinutes(1);
                }
                else if (enrollmentCompletedAt.HasValue)
                {
                    enrollmentStartedAt = enrollmentCompletedAt.Value.AddMinutes(-5); // Estimate
                }
            }

            timeline.EnrollmentStartedAt = enrollmentStartedAt;

            var enrollmentDuration = enrollmentStartedAt.HasValue && enrollmentCompletedAt.HasValue
                ? enrollmentCompletedAt.Value - enrollmentStartedAt.Value
                : (TimeSpan?)null;

            events.Add(new ProvisioningEventDto
            {
                Id = "enrollment",
                Phase = "Enrollment",
                Status = enrollmentCompletedAt.HasValue ? "Complete" : (device != null ? "InProgress" : "Pending"),
                Title = "Device Enrollment (OOBE)",
                Description = device != null ? $"Enrolled via {device.ManagementAgent}" : "Awaiting MDM enrollment",
                StartedAt = enrollmentStartedAt,
                CompletedAt = enrollmentCompletedAt,
                Duration = enrollmentDuration,
                DurationFormatted = FormatDuration(enrollmentDuration),
                Order = 2
            });

            // Event 3: Device Setup (ESP Phase 1)
            // Estimate based on enrollment completion
            DateTime? deviceSetupStartedAt = enrollmentCompletedAt;
            DateTime? deviceSetupCompletedAt = null;

            if (device != null && enrollmentCompletedAt.HasValue)
            {
                // If device is compliant and has synced, device setup is likely complete
                var hasCompletedDeviceSetup = device.ComplianceState == ComplianceState.Compliant ||
                                               device.ComplianceState == ComplianceState.ConfigManager ||
                                               device.LastSyncDateTime?.DateTime > enrollmentCompletedAt.Value.AddMinutes(10);

                if (hasCompletedDeviceSetup && device.LastSyncDateTime.HasValue)
                {
                    // Estimate device setup took about half the time between enrollment and first meaningful sync
                    var timeSinceEnrollment = device.LastSyncDateTime.Value.DateTime - enrollmentCompletedAt.Value;
                    if (timeSinceEnrollment.TotalMinutes > 5)
                    {
                        deviceSetupCompletedAt = enrollmentCompletedAt.Value.AddMinutes(timeSinceEnrollment.TotalMinutes * 0.4);
                    }
                }
            }

            timeline.EspDeviceSetupStartedAt = deviceSetupStartedAt;
            timeline.EspDeviceSetupCompletedAt = deviceSetupCompletedAt;

            var deviceSetupDuration = deviceSetupStartedAt.HasValue && deviceSetupCompletedAt.HasValue
                ? deviceSetupCompletedAt.Value - deviceSetupStartedAt.Value
                : (TimeSpan?)null;

            events.Add(new ProvisioningEventDto
            {
                Id = "device-setup",
                Phase = "DeviceSetup",
                Status = deviceSetupCompletedAt.HasValue ? "Complete" : (deviceSetupStartedAt.HasValue ? "InProgress" : "Pending"),
                Title = "Device Setup (ESP)",
                Description = "Installing policies, certificates, and device configurations",
                StartedAt = deviceSetupStartedAt,
                CompletedAt = deviceSetupCompletedAt,
                Duration = deviceSetupDuration,
                DurationFormatted = FormatDuration(deviceSetupDuration),
                Order = 3
            });

            // Event 4: Account Setup (ESP Phase 2)
            DateTime? accountSetupStartedAt = deviceSetupCompletedAt;
            DateTime? accountSetupCompletedAt = null;

            if (device != null && deviceSetupCompletedAt.HasValue && device.LastSyncDateTime.HasValue)
            {
                // Account setup completes when user can use the device
                var hasUser = !string.IsNullOrEmpty(device.UserPrincipalName);
                if (hasUser)
                {
                    // Estimate account setup completed about 60% through the remaining time
                    var timeSinceDeviceSetup = device.LastSyncDateTime.Value.DateTime - deviceSetupCompletedAt.Value;
                    if (timeSinceDeviceSetup.TotalMinutes > 2)
                    {
                        accountSetupCompletedAt = deviceSetupCompletedAt.Value.AddMinutes(timeSinceDeviceSetup.TotalMinutes * 0.6);
                    }
                }
            }

            timeline.EspAccountSetupStartedAt = accountSetupStartedAt;
            timeline.EspAccountSetupCompletedAt = accountSetupCompletedAt;

            var accountSetupDuration = accountSetupStartedAt.HasValue && accountSetupCompletedAt.HasValue
                ? accountSetupCompletedAt.Value - accountSetupStartedAt.Value
                : (TimeSpan?)null;

            events.Add(new ProvisioningEventDto
            {
                Id = "account-setup",
                Phase = "AccountSetup",
                Status = accountSetupCompletedAt.HasValue ? "Complete" : (accountSetupStartedAt.HasValue ? "InProgress" : "Pending"),
                Title = "Account Setup (ESP)",
                Description = "Installing user applications and configuring user profile",
                StartedAt = accountSetupStartedAt,
                CompletedAt = accountSetupCompletedAt,
                Duration = accountSetupDuration,
                DurationFormatted = FormatDuration(accountSetupDuration),
                Order = 4
            });

            // Event 5: Complete / Ready for User
            DateTime? provisioningCompletedAt = null;
            var hasCompletedProvisioning = device != null &&
                                           !string.IsNullOrEmpty(device.UserPrincipalName) &&
                                           device.LastSyncDateTime.HasValue &&
                                           accountSetupCompletedAt.HasValue;

            if (hasCompletedProvisioning && device!.LastSyncDateTime.HasValue)
            {
                provisioningCompletedAt = accountSetupCompletedAt!.Value.AddMinutes(
                    (device.LastSyncDateTime.Value.DateTime - accountSetupCompletedAt.Value).TotalMinutes * 0.3);
            }

            timeline.ProvisioningCompletedAt = provisioningCompletedAt;
            timeline.UserSignInAt = provisioningCompletedAt; // Estimate user sign-in at completion

            events.Add(new ProvisioningEventDto
            {
                Id = "complete",
                Phase = "Complete",
                Status = provisioningCompletedAt.HasValue ? "Complete" : "Pending",
                Title = "Ready for User",
                Description = device?.UserDisplayName != null
                    ? $"Assigned to {device.UserDisplayName}"
                    : "Awaiting user assignment",
                StartedAt = provisioningCompletedAt,
                CompletedAt = provisioningCompletedAt,
                Order = 5
            });

            timeline.Events = events;

            // Calculate overall status and progress
            var completedCount = events.Count(e => e.Status == "Complete");
            var totalCount = events.Count;
            var hasFailure = events.Any(e => e.Status == "Failed");
            var hasInProgress = events.Any(e => e.Status == "InProgress");

            timeline.ProgressPercent = (int)Math.Round((double)completedCount / totalCount * 100);

            if (hasFailure)
                timeline.OverallStatus = "Failed";
            else if (completedCount == totalCount)
                timeline.OverallStatus = "Complete";
            else if (hasInProgress || completedCount > 0)
                timeline.OverallStatus = "InProgress";
            else
                timeline.OverallStatus = "Pending";

            // Calculate total duration
            if (autopilotRegisteredAt.HasValue && provisioningCompletedAt.HasValue)
            {
                timeline.TotalDuration = provisioningCompletedAt.Value - autopilotRegisteredAt.Value;
                timeline.TotalDurationFormatted = FormatDuration(timeline.TotalDuration);
            }
            else if (autopilotRegisteredAt.HasValue && device?.LastSyncDateTime.HasValue == true)
            {
                // Use last sync as end point if provisioning not complete
                var estimatedDuration = device.LastSyncDateTime.Value.DateTime - autopilotRegisteredAt.Value;
                if (estimatedDuration.TotalMinutes > 0)
                {
                    timeline.TotalDuration = estimatedDuration;
                    timeline.TotalDurationFormatted = FormatDuration(estimatedDuration) + " (ongoing)";
                }
            }

            // Fetch app installation states if we have a device ID
            if (device?.Id != null)
            {
                try
                {
                    var appStates = await GetDeviceAppInstallationStatesAsync(device.Id, device.UserPrincipalName);
                    timeline.AppInstallationStates = appStates;

                    // Calculate app statistics
                    timeline.TotalAppsToInstall = appStates.Count;
                    timeline.AppsInstalled = appStates.Count(a => a.Status == "Installed");
                    timeline.AppsFailed = appStates.Count(a => a.Status == "Failed");
                    timeline.AppsPending = appStates.Count(a => a.Status == "Pending" || a.Status == "Downloading" || a.Status == "Installing");

                    // Find currently installing app
                    timeline.CurrentlyInstallingApp = appStates
                        .Where(a => a.Status == "Installing" || a.Status == "Downloading")
                        .OrderByDescending(a => a.StartedAt)
                        .FirstOrDefault();

                    // Find last installed app
                    timeline.LastInstalledApp = appStates
                        .Where(a => a.Status == "Installed" && a.CompletedAt.HasValue)
                        .OrderByDescending(a => a.CompletedAt)
                        .FirstOrDefault();

                    _logger.LogInformation("App installation states retrieved: Total={Total}, Installed={Installed}, Installing={Installing}",
                        timeline.TotalAppsToInstall, timeline.AppsInstalled,
                        timeline.CurrentlyInstallingApp?.Name ?? "None");
                }
                catch (Exception appEx)
                {
                    _logger.LogWarning(appEx, "Failed to retrieve app installation states for device {DeviceId}", device.Id);
                    // Continue without app states - don't fail the whole timeline
                }
            }

            _logger.LogInformation("Provisioning timeline retrieved for serial {SerialNumber}: Status={Status}, Progress={Progress}%",
                serialNumber, timeline.OverallStatus, timeline.ProgressPercent);

            return timeline;
        }
        catch (ArgumentException)
        {
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving provisioning timeline for device with serial {SerialNumber}", serialNumber);
            return new ProvisioningTimelineDto
            {
                Found = false,
                ErrorMessage = $"Error retrieving provisioning timeline: {ex.Message}",
                SerialNumber = serialNumber,
                RetrievedAt = DateTime.UtcNow
            };
        }
    }

    /// <summary>
    /// Get app installation states for a device
    /// Uses the mobileAppIntentAndStates endpoint to get current app installation status
    /// </summary>
    private async Task<List<AppInstallationStatusDto>> GetDeviceAppInstallationStatesAsync(string deviceId, string? userPrincipalName)
    {
        var appStates = new List<AppInstallationStatusDto>();

        try
        {
            // Use beta API to get managed app states
            // First try with user-specific endpoint if we have a UPN
            string endpoint;
            if (!string.IsNullOrEmpty(userPrincipalName))
            {
                // Get user ID first
                var user = await _graphClient.Users[userPrincipalName].GetAsync();
                if (user?.Id != null)
                {
                    endpoint = $"https://graph.microsoft.com/beta/deviceManagement/managedDevices/{deviceId}/users/{user.Id}/mobileAppIntentAndStates";
                }
                else
                {
                    // Fallback to device-only endpoint
                    endpoint = $"https://graph.microsoft.com/beta/deviceManagement/managedDevices/{deviceId}/windowsProtectionState";
                }
            }
            else
            {
                // Use reports endpoint to get app installation status
                endpoint = $"https://graph.microsoft.com/beta/deviceManagement/managedDevices/{deviceId}?$expand=detectedApps";
            }

            var requestInfo = new Microsoft.Kiota.Abstractions.RequestInformation
            {
                HttpMethod = Microsoft.Kiota.Abstractions.Method.GET,
                URI = new Uri(endpoint)
            };

            var nativeRequest = await _graphClient.RequestAdapter.ConvertToNativeRequestAsync<HttpRequestMessage>(requestInfo)
                ?? throw new InvalidOperationException("Failed to create native HTTP request");

            using var httpClient = new HttpClient();
            var response = await httpClient.SendAsync(nativeRequest);

            if (response.IsSuccessStatusCode)
            {
                var content = await response.Content.ReadAsStringAsync();
                var json = JsonDocument.Parse(content).RootElement;

                // Parse mobileAppIntentAndStates response
                if (json.TryGetProperty("value", out var statesArray) && statesArray.ValueKind == JsonValueKind.Array)
                {
                    foreach (var state in statesArray.EnumerateArray())
                    {
                        if (state.TryGetProperty("mobileAppList", out var appList) && appList.ValueKind == JsonValueKind.Array)
                        {
                            int order = 0;
                            foreach (var app in appList.EnumerateArray())
                            {
                                var appState = ParseAppState(app, order++);
                                if (appState != null)
                                {
                                    appStates.Add(appState);
                                }
                            }
                        }
                    }
                }
                // Alternative: parse detectedApps from device expand
                else if (json.TryGetProperty("detectedApps", out var detectedApps) && detectedApps.ValueKind == JsonValueKind.Array)
                {
                    int order = 0;
                    foreach (var app in detectedApps.EnumerateArray())
                    {
                        var appName = app.TryGetProperty("displayName", out var name) ? name.GetString() : null;
                        var version = app.TryGetProperty("version", out var ver) ? ver.GetString() : null;
                        var appId = app.TryGetProperty("id", out var id) ? id.GetString() : Guid.NewGuid().ToString();

                        if (!string.IsNullOrEmpty(appName))
                        {
                            appStates.Add(new AppInstallationStatusDto
                            {
                                Id = appId ?? Guid.NewGuid().ToString(),
                                Name = appName,
                                Version = version,
                                Status = "Installed", // DetectedApps are already installed
                                Type = "App",
                                Order = order++
                            });
                        }
                    }
                }
            }
            else
            {
                _logger.LogDebug("Failed to get app states from {Endpoint}: {StatusCode}", endpoint, response.StatusCode);
            }

            // Also try to get ESP app tracking data if available
            await EnrichWithEspAppDataAsync(deviceId, appStates);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error retrieving app installation states for device {DeviceId}", deviceId);
        }

        return appStates;
    }

    /// <summary>
    /// Parse app state from Graph API response
    /// </summary>
    private AppInstallationStatusDto? ParseAppState(JsonElement app, int order)
    {
        try
        {
            var appId = app.TryGetProperty("applicationId", out var id) ? id.GetString() : null;
            var appName = app.TryGetProperty("displayName", out var name) ? name.GetString() : null;

            if (string.IsNullOrEmpty(appName)) return null;

            var installState = app.TryGetProperty("installState", out var state) ? state.GetString() : "unknown";
            var version = app.TryGetProperty("displayVersion", out var ver) ? ver.GetString() : null;
            var publisher = app.TryGetProperty("publisher", out var pub) ? pub.GetString() : null;

            // Map Intune install states to our status
            var status = MapIntuneInstallState(installState ?? "unknown");

            return new AppInstallationStatusDto
            {
                Id = appId ?? Guid.NewGuid().ToString(),
                Name = appName,
                Version = version,
                Publisher = publisher,
                Status = status,
                Type = DetermineAppType(app),
                Order = order,
                Intent = app.TryGetProperty("mobileAppIntent", out var intent) ? intent.GetString() ?? "Required" : "Required"
            };
        }
        catch
        {
            return null;
        }
    }

    /// <summary>
    /// Map Intune install state to our simplified status
    /// </summary>
    private static string MapIntuneInstallState(string intuneState)
    {
        return intuneState.ToLowerInvariant() switch
        {
            "installed" => "Installed",
            "notinstalled" => "Pending",
            "failed" => "Failed",
            "installing" => "Installing",
            "downloadinprogress" or "downloading" => "Downloading",
            "pendinginstall" => "Pending",
            "notapplicable" => "NotApplicable",
            "unknown" => "Pending",
            _ => "Pending"
        };
    }

    /// <summary>
    /// Determine app type from Graph API response
    /// </summary>
    private static string DetermineAppType(JsonElement app)
    {
        if (app.TryGetProperty("@odata.type", out var odataType))
        {
            var typeStr = odataType.GetString() ?? "";
            if (typeStr.Contains("win32", StringComparison.OrdinalIgnoreCase)) return "Win32";
            if (typeStr.Contains("msi", StringComparison.OrdinalIgnoreCase)) return "MSI";
            if (typeStr.Contains("store", StringComparison.OrdinalIgnoreCase)) return "Store";
            if (typeStr.Contains("office", StringComparison.OrdinalIgnoreCase)) return "Office";
            if (typeStr.Contains("web", StringComparison.OrdinalIgnoreCase)) return "WebApp";
        }
        return "App";
    }

    /// <summary>
    /// Enrich app states with ESP tracking data if available
    /// </summary>
    private async Task EnrichWithEspAppDataAsync(string deviceId, List<AppInstallationStatusDto> appStates)
    {
        try
        {
            // Try to get autopilot events which contain ESP app tracking
            var endpoint = $"https://graph.microsoft.com/beta/deviceManagement/autopilotEvents?$filter=deviceId eq '{deviceId}'&$orderby=eventDateTime desc&$top=1";

            var requestInfo = new Microsoft.Kiota.Abstractions.RequestInformation
            {
                HttpMethod = Microsoft.Kiota.Abstractions.Method.GET,
                URI = new Uri(endpoint)
            };

            var nativeRequest = await _graphClient.RequestAdapter.ConvertToNativeRequestAsync<HttpRequestMessage>(requestInfo)
                ?? throw new InvalidOperationException("Failed to create native HTTP request");

            using var httpClient = new HttpClient();
            var response = await httpClient.SendAsync(nativeRequest);

            if (response.IsSuccessStatusCode)
            {
                var content = await response.Content.ReadAsStringAsync();
                var json = JsonDocument.Parse(content).RootElement;

                if (json.TryGetProperty("value", out var eventsArray) &&
                    eventsArray.ValueKind == JsonValueKind.Array &&
                    eventsArray.GetArrayLength() > 0)
                {
                    var latestEvent = eventsArray[0];

                    // Parse device setup and account setup tracking items
                    ParseEspTrackingItems(latestEvent, "deviceSetupStatus", appStates, "Device");
                    ParseEspTrackingItems(latestEvent, "accountSetupStatus", appStates, "User");
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogDebug(ex, "Could not enrich with ESP data for device {DeviceId}", deviceId);
        }
    }

    /// <summary>
    /// Parse ESP tracking items from autopilot event
    /// </summary>
    private void ParseEspTrackingItems(JsonElement eventElement, string propertyName, List<AppInstallationStatusDto> appStates, string prefix)
    {
        try
        {
            if (!eventElement.TryGetProperty(propertyName, out var setupStatus)) return;
            if (!setupStatus.TryGetProperty("trackingItems", out var trackingItems)) return;
            if (trackingItems.ValueKind != JsonValueKind.Array) return;

            foreach (var item in trackingItems.EnumerateArray())
            {
                var itemName = item.TryGetProperty("displayName", out var name) ? name.GetString() : null;
                var itemStatus = item.TryGetProperty("status", out var status) ? status.GetString() : null;
                var itemType = item.TryGetProperty("trackingItemType", out var type) ? type.GetString() : null;

                if (string.IsNullOrEmpty(itemName)) continue;

                // Check if we already have this app in our list
                var existingApp = appStates.FirstOrDefault(a =>
                    a.Name.Equals(itemName, StringComparison.OrdinalIgnoreCase));

                if (existingApp != null)
                {
                    // Update status from ESP data (more accurate for provisioning)
                    existingApp.Status = MapEspStatus(itemStatus);
                    if (item.TryGetProperty("lastUpdatedDateTime", out var lastUpdated) &&
                        lastUpdated.ValueKind != JsonValueKind.Null)
                    {
                        var updateTime = lastUpdated.GetDateTime();
                        if (existingApp.Status == "Installed")
                            existingApp.CompletedAt = updateTime;
                        else if (existingApp.Status == "Installing" || existingApp.Status == "Downloading")
                            existingApp.StartedAt = updateTime;
                    }
                }
                else
                {
                    // Add new app from ESP tracking
                    DateTime? completedAt = null;
                    DateTime? startedAt = null;

                    if (item.TryGetProperty("lastUpdatedDateTime", out var lastUpdated) &&
                        lastUpdated.ValueKind != JsonValueKind.Null)
                    {
                        var updateTime = lastUpdated.GetDateTime();
                        var mappedStatus = MapEspStatus(itemStatus);
                        if (mappedStatus == "Installed")
                            completedAt = updateTime;
                        else
                            startedAt = updateTime;
                    }

                    appStates.Add(new AppInstallationStatusDto
                    {
                        Id = Guid.NewGuid().ToString(),
                        Name = $"[{prefix}] {itemName}",
                        Status = MapEspStatus(itemStatus),
                        Type = MapEspItemType(itemType),
                        CompletedAt = completedAt,
                        StartedAt = startedAt,
                        Order = appStates.Count
                    });
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogDebug(ex, "Error parsing ESP tracking items from {PropertyName}", propertyName);
        }
    }

    /// <summary>
    /// Map ESP status to our simplified status
    /// </summary>
    private static string MapEspStatus(string? espStatus)
    {
        return espStatus?.ToLowerInvariant() switch
        {
            "complete" or "success" or "installed" => "Installed",
            "inprogress" or "installing" => "Installing",
            "failed" or "error" => "Failed",
            "notstarted" or "pending" => "Pending",
            "skipped" or "notapplicable" => "NotApplicable",
            _ => "Pending"
        };
    }

    /// <summary>
    /// Map ESP item type to our simplified type
    /// </summary>
    private static string MapEspItemType(string? espType)
    {
        return espType?.ToLowerInvariant() switch
        {
            "app" or "application" => "App",
            "policy" or "configuration" => "Policy",
            "script" or "powershell" => "Script",
            "certificate" or "cert" => "Certificate",
            "networkprofile" or "wifi" or "vpn" => "Network",
            _ => "App"
        };
    }

    /// <summary>
    /// Format a TimeSpan as a human-readable duration string
    /// </summary>
    private static string? FormatDuration(TimeSpan? duration)
    {
        if (!duration.HasValue)
            return null;

        var ts = duration.Value;

        if (ts.TotalSeconds < 60)
            return $"{(int)ts.TotalSeconds} sec";

        if (ts.TotalMinutes < 60)
        {
            var mins = (int)ts.TotalMinutes;
            var secs = ts.Seconds;
            return secs > 0 ? $"{mins} min {secs} sec" : $"{mins} min";
        }

        var hours = (int)ts.TotalHours;
        var remainingMins = ts.Minutes;
        return remainingMins > 0 ? $"{hours} hr {remainingMins} min" : $"{hours} hr";
    }

    /// <inheritdoc/>
    public async Task<IEnumerable<AutopilotDeviceDto>> GetAutopilotDevicesAsync()
    {
        try
        {
            _logger.LogInformation("Retrieving all Autopilot devices from Intune");

            // Use Beta API for Autopilot device identities
            var requestUrl = "https://graph.microsoft.com/beta/deviceManagement/windowsAutopilotDeviceIdentities?$top=999";

            var requestInfo = new Microsoft.Kiota.Abstractions.RequestInformation
            {
                HttpMethod = Microsoft.Kiota.Abstractions.Method.GET,
                URI = new Uri(requestUrl)
            };

            var nativeRequest = await _graphClient.RequestAdapter.ConvertToNativeRequestAsync<HttpRequestMessage>(requestInfo)
                ?? throw new InvalidOperationException("Failed to create native HTTP request");

            using var httpClient = new HttpClient();
            var response = await httpClient.SendAsync(nativeRequest);
            response.EnsureSuccessStatusCode();

            var content = await response.Content.ReadAsStringAsync();
            var jsonDoc = JsonDocument.Parse(content);
            var devices = new List<AutopilotDeviceDto>();

            if (jsonDoc.RootElement.TryGetProperty("value", out var valueArray))
            {
                foreach (var device in valueArray.EnumerateArray())
                {
                    devices.Add(new AutopilotDeviceDto
                    {
                        Id = device.GetProperty("id").GetString() ?? string.Empty,
                        SerialNumber = device.TryGetProperty("serialNumber", out var sn) ? sn.GetString() : null,
                        Model = device.TryGetProperty("model", out var model) ? model.GetString() : null,
                        Manufacturer = device.TryGetProperty("manufacturer", out var mfr) ? mfr.GetString() : null,
                        UserPrincipalName = device.TryGetProperty("userPrincipalName", out var upn) ? upn.GetString() : null,
                        DisplayName = device.TryGetProperty("displayName", out var dn) ? dn.GetString() : null,
                        ManagedDeviceId = device.TryGetProperty("managedDeviceId", out var mdId) ? mdId.GetString() : null,
                        DeploymentProfileAssignedDateTime = device.TryGetProperty("deploymentProfileAssignedDateTime", out var dpDate) ? dpDate.GetString() : null,
                        DeploymentProfileAssignmentStatus = device.TryGetProperty("deploymentProfileAssignmentStatus", out var dpStatus) ? dpStatus.GetString() : null,
                        AzureAdDeviceId = device.TryGetProperty("azureAdDeviceId", out var aadId) ? aadId.GetString() : null,
                        AzureAdDeviceDisplayName = device.TryGetProperty("azureActiveDirectoryDeviceId", out var aadDisplayName) ? aadDisplayName.GetString() : null,
                        GroupTag = device.TryGetProperty("groupTag", out var gt) ? gt.GetString() : null,
                        PurchaseOrderIdentifier = device.TryGetProperty("purchaseOrderIdentifier", out var poi) ? poi.GetString() : null,
                        EnrollmentState = device.TryGetProperty("enrollmentState", out var es) ? es.GetString() : null,
                        LastContactedDateTime = device.TryGetProperty("lastContactedDateTime", out var lcd) && lcd.ValueKind != JsonValueKind.Null
                            ? lcd.GetDateTime()
                            : null
                    });
                }
            }

            _logger.LogInformation("Retrieved {Count} Autopilot devices from Intune", devices.Count);
            return devices;
        }
        catch (HttpRequestException ex)
        {
            _logger.LogError(ex, "HTTP error while retrieving Autopilot devices");
            throw new InvalidOperationException($"Failed to retrieve Autopilot devices from Intune: {ex.Message}", ex);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error while retrieving Autopilot devices from Intune");
            throw;
        }
    }
}

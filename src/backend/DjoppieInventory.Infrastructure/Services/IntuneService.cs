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
            var nativeRequest = await _graphClient.RequestAdapter.ConvertToNativeRequestAsync<HttpRequestMessage>(requestInfo);

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

            // Get installed apps for software-based recommendations
            var installedApps = await GetDeviceInstalledAppsAsync(device.Id);

            // Generate recommendations
            health.Recommendations = GenerateRecommendations(health, installedApps);

            // Calculate health score based on recommendations
            health.HealthScore = CalculateHealthScore(health.Recommendations);
            health.HealthStatus = health.HealthScore >= 80 ? "Healthy" : health.HealthScore >= 50 ? "Warning" : "Critical";

            _logger.LogInformation("Device health retrieved for {DeviceName}: Score={Score}, Status={Status}, Recommendations={RecommendationCount}",
                health.DeviceName, health.HealthScore, health.HealthStatus, health.Recommendations.Count);

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
    /// Generate ICT recommendations based on device health and installed software
    /// </summary>
    private List<IctRecommendationDto> GenerateRecommendations(DeviceHealthDto health, DeviceDetectedAppsResponseDto? apps)
    {
        var recommendations = new List<IctRecommendationDto>();

        // 1. Compliance Check
        if (!health.IsCompliant)
        {
            recommendations.Add(new IctRecommendationDto
            {
                Id = "compliance-noncompliant",
                Category = "Compliance",
                Severity = "Critical",
                Title = "Apparaat niet compliant",
                Description = $"Dit apparaat voldoet niet aan de organisatiebeleidsregels. Status: {health.ComplianceState}",
                RecommendedAction = "Controleer de Intune-portal voor specifieke compliance-problemen en los deze op.",
                ImpactScore = 30
            });
        }

        // 2. Encryption Check
        if (!health.IsEncrypted)
        {
            recommendations.Add(new IctRecommendationDto
            {
                Id = "security-encryption",
                Category = "Security",
                Severity = "Critical",
                Title = "Schijfversleuteling niet actief",
                Description = "BitLocker of andere schijfversleuteling is niet ingeschakeld op dit apparaat.",
                RecommendedAction = "Schakel BitLocker-versleuteling in via Intune-beleid of handmatig via Configuratiescherm.",
                ImpactScore = 25
            });
        }

        // 3. Storage Check
        if (health.StorageUsagePercent.HasValue)
        {
            if (health.StorageUsagePercent >= 90)
            {
                recommendations.Add(new IctRecommendationDto
                {
                    Id = "performance-storage-critical",
                    Category = "Performance",
                    Severity = "Critical",
                    Title = "Opslag bijna vol",
                    Description = $"De schijf is voor {health.StorageUsagePercent:F0}% vol. Dit kan prestatieproblemen veroorzaken.",
                    RecommendedAction = "Verwijder ongebruikte bestanden, leeg de prullenbak, en overweeg schijfopruiming uit te voeren.",
                    ImpactScore = 20
                });
            }
            else if (health.StorageUsagePercent >= 80)
            {
                recommendations.Add(new IctRecommendationDto
                {
                    Id = "performance-storage-warning",
                    Category = "Performance",
                    Severity = "Medium",
                    Title = "Opslag raakt vol",
                    Description = $"De schijf is voor {health.StorageUsagePercent:F0}% vol. Plan ruimte vrij te maken.",
                    RecommendedAction = "Overweeg oude bestanden te archiveren of naar OneDrive te verplaatsen.",
                    ImpactScore = 10
                });
            }
        }

        // 4. Last Sync Check
        if (health.LastSyncDateTime.HasValue)
        {
            var daysSinceSync = (DateTime.UtcNow - health.LastSyncDateTime.Value).TotalDays;
            if (daysSinceSync > 14)
            {
                recommendations.Add(new IctRecommendationDto
                {
                    Id = "maintenance-sync-overdue",
                    Category = "Maintenance",
                    Severity = "High",
                    Title = "Lange tijd geen sync",
                    Description = $"Dit apparaat heeft {(int)daysSinceSync} dagen niet gesynchroniseerd met Intune.",
                    RecommendedAction = "Controleer of het apparaat regelmatig met internet verbonden is en synchroniseer handmatig via Instellingen > Accounts > Toegang tot werk of school.",
                    ImpactScore = 15
                });
            }
            else if (daysSinceSync > 7)
            {
                recommendations.Add(new IctRecommendationDto
                {
                    Id = "maintenance-sync-warning",
                    Category = "Maintenance",
                    Severity = "Low",
                    Title = "Sync aanbevolen",
                    Description = $"Dit apparaat heeft {(int)daysSinceSync} dagen niet gesynchroniseerd.",
                    RecommendedAction = "Synchroniseer het apparaat met Intune om de laatste beleidsregels en updates te ontvangen.",
                    ImpactScore = 5
                });
            }
        }

        // 5. OS Version Check (Windows specific)
        if (health.OperatingSystem?.ToLowerInvariant().Contains("windows") == true && !string.IsNullOrEmpty(health.OsVersion))
        {
            // Check for Windows 10 vs 11
            if (health.OsVersion.StartsWith("10.0.1"))
            {
                // Windows 10 builds start with 10.0.1xxxx
                recommendations.Add(new IctRecommendationDto
                {
                    Id = "maintenance-os-upgrade",
                    Category = "Maintenance",
                    Severity = "Medium",
                    Title = "Windows 11 upgrade beschikbaar",
                    Description = $"Dit apparaat draait nog op Windows 10 (versie {health.OsVersion}). Windows 11 biedt betere beveiliging en prestaties.",
                    RecommendedAction = "Controleer of de hardware compatibel is met Windows 11 en plan een upgrade.",
                    ImpactScore = 10
                });
            }
        }

        // 6. Memory Check
        if (health.PhysicalMemoryBytes.HasValue)
        {
            var memoryGB = health.PhysicalMemoryBytes.Value / (1024.0 * 1024.0 * 1024.0);
            if (memoryGB < 8)
            {
                recommendations.Add(new IctRecommendationDto
                {
                    Id = "performance-memory-low",
                    Category = "Performance",
                    Severity = "Medium",
                    Title = "Beperkt werkgeheugen",
                    Description = $"Dit apparaat heeft slechts {memoryGB:F1} GB RAM. Dit kan prestatieproblemen veroorzaken bij moderne applicaties.",
                    RecommendedAction = "Overweeg een geheugenupgrade naar minimaal 8 GB of 16 GB voor betere prestaties.",
                    ImpactScore = 10
                });
            }
        }

        // 7. Software-based recommendations
        if (apps?.DetectedApps != null && apps.DetectedApps.Count > 0)
        {
            var appNames = apps.DetectedApps.Select(a => a.DisplayName?.ToLowerInvariant() ?? "").ToList();

            // Check for security software
            var hasAntivirus = appNames.Any(a =>
                a.Contains("defender") ||
                a.Contains("antivirus") ||
                a.Contains("norton") ||
                a.Contains("mcafee") ||
                a.Contains("kaspersky") ||
                a.Contains("bitdefender") ||
                a.Contains("avast") ||
                a.Contains("avg "));

            if (!hasAntivirus)
            {
                recommendations.Add(new IctRecommendationDto
                {
                    Id = "security-antivirus-missing",
                    Category = "Security",
                    Severity = "High",
                    Title = "Geen antivirussoftware gedetecteerd",
                    Description = "Er is geen antivirussoftware gedetecteerd op dit apparaat.",
                    RecommendedAction = "Controleer of Windows Defender actief is of installeer een goedgekeurde antivirusoplossing.",
                    ImpactScore = 20
                });
            }

            // Check for outdated browsers
            var hasOldIE = appNames.Any(a => a.Contains("internet explorer"));
            if (hasOldIE)
            {
                recommendations.Add(new IctRecommendationDto
                {
                    Id = "software-ie-deprecated",
                    Category = "Software",
                    Severity = "Medium",
                    Title = "Internet Explorer gedetecteerd",
                    Description = "Internet Explorer is verouderd en niet meer ondersteund. Dit vormt een beveiligingsrisico.",
                    RecommendedAction = "Gebruik Microsoft Edge of een andere moderne browser. Verwijder IE indien mogelijk.",
                    ImpactScore = 10
                });
            }

            // Check for potentially unnecessary software
            var bloatwarePatterns = new[] { "toolbar", "search bar", "coupon", "adware" };
            var potentialBloatware = apps.DetectedApps
                .Where(a => bloatwarePatterns.Any(p => (a.DisplayName?.ToLowerInvariant() ?? "").Contains(p)))
                .ToList();

            if (potentialBloatware.Count > 0)
            {
                recommendations.Add(new IctRecommendationDto
                {
                    Id = "software-bloatware",
                    Category = "Software",
                    Severity = "Low",
                    Title = "Mogelijke ongewenste software",
                    Description = $"Er zijn {potentialBloatware.Count} applicaties gedetecteerd die mogelijk ongewenst zijn: {string.Join(", ", potentialBloatware.Take(3).Select(a => a.DisplayName))}",
                    RecommendedAction = "Controleer deze applicaties en verwijder ze indien ze niet nodig zijn.",
                    ImpactScore = 5
                });
            }

            // Check total app count (too many apps can impact performance)
            if (apps.TotalApps > 150)
            {
                recommendations.Add(new IctRecommendationDto
                {
                    Id = "software-too-many",
                    Category = "Performance",
                    Severity = "Low",
                    Title = "Veel geïnstalleerde applicaties",
                    Description = $"Dit apparaat heeft {apps.TotalApps} applicaties geïnstalleerd. Dit kan de opstarttijd en prestaties beïnvloeden.",
                    RecommendedAction = "Review de geïnstalleerde applicaties en verwijder software die niet meer nodig is.",
                    ImpactScore = 5
                });
            }
        }

        // Sort by severity and impact
        var severityOrder = new Dictionary<string, int>
        {
            { "Critical", 0 },
            { "High", 1 },
            { "Medium", 2 },
            { "Low", 3 },
            { "Info", 4 }
        };

        return recommendations
            .OrderBy(r => severityOrder.GetValueOrDefault(r.Severity, 5))
            .ThenByDescending(r => r.ImpactScore)
            .ToList();
    }

    /// <summary>
    /// Calculate overall health score based on recommendations
    /// </summary>
    private int CalculateHealthScore(List<IctRecommendationDto> recommendations)
    {
        var baseScore = 100;
        var totalImpact = recommendations.Sum(r => r.ImpactScore);
        var score = Math.Max(0, baseScore - totalImpact);
        return score;
    }
}

using System.Threading.RateLimiting;
using DjoppieInventory.API.Helpers;
using DjoppieInventory.Core.DTOs;
using DjoppieInventory.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Graph.Models;

namespace DjoppieInventory.API.Controllers;

/// <summary>
/// API controller for Microsoft Intune device management operations.
/// Provides endpoints to query and manage Intune-enrolled devices.
/// </summary>
[Authorize]
[ApiController]
[Route("api/[controller]")]
[EnableRateLimiting("intune")]
public class IntuneController : ControllerBase
{
    private readonly IIntuneService _intuneService;
    private readonly IIntuneSyncService _intuneSyncService;
    private readonly ILogger<IntuneController> _logger;

    public IntuneController(
        IIntuneService intuneService,
        IIntuneSyncService intuneSyncService,
        ILogger<IntuneController> logger)
    {
        _intuneService = intuneService ?? throw new ArgumentNullException(nameof(intuneService));
        _intuneSyncService = intuneSyncService ?? throw new ArgumentNullException(nameof(intuneSyncService));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    /// <summary>
    /// Retrieves all managed devices from Intune.
    /// </summary>
    /// <returns>A list of managed devices with basic information</returns>
    /// <response code="200">Returns the list of managed devices</response>
    /// <response code="401">Unauthorized - authentication required</response>
    /// <response code="403">Forbidden - insufficient permissions</response>
    /// <response code="500">Internal server error</response>
    [HttpGet("devices")]
    [ProducesResponseType(typeof(IEnumerable<ManagedDevice>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<IEnumerable<ManagedDevice>>> GetManagedDevices()
    {
        try
        {
            _logger.LogInformation("API request to retrieve all managed devices");
            var devices = await _intuneService.GetManagedDevicesAsync();
            return Ok(devices);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogError(ex, "Failed to retrieve managed devices");
            return StatusCode(500, new { error = "Failed to retrieve managed devices", details = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error retrieving managed devices");
            return StatusCode(500, new { error = "An unexpected error occurred while retrieving devices" });
        }
    }

    /// <summary>
    /// Retrieves a specific managed device by its Intune device ID.
    /// </summary>
    /// <param name="deviceId">The Intune device identifier</param>
    /// <returns>The managed device details</returns>
    /// <response code="200">Returns the managed device</response>
    /// <response code="404">Device not found</response>
    /// <response code="401">Unauthorized - authentication required</response>
    /// <response code="500">Internal server error</response>
    [HttpGet("devices/{deviceId}")]
    [ProducesResponseType(typeof(ManagedDevice), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<ManagedDevice>> GetDeviceById(string deviceId)
    {
        try
        {
            if (!InputValidator.ValidateDeviceId(deviceId, out var errorMessage))
            {
                return BadRequest(new { error = errorMessage });
            }

            _logger.LogInformation("API request to retrieve device with ID: {DeviceId}", deviceId);
            var device = await _intuneService.GetDeviceByIdAsync(deviceId);

            if (device == null)
            {
                return NotFound(new { error = $"Device with ID '{deviceId}' not found" });
            }

            return Ok(device);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogError(ex, "Failed to retrieve device {DeviceId}", deviceId);
            return StatusCode(500, new { error = "Failed to retrieve device", details = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error retrieving device {DeviceId}", deviceId);
            return StatusCode(500, new { error = "An unexpected error occurred while retrieving the device" });
        }
    }

    /// <summary>
    /// Searches for a managed device by its serial number.
    /// </summary>
    /// <param name="serialNumber">The device serial number</param>
    /// <returns>The managed device if found</returns>
    /// <response code="200">Returns the managed device</response>
    /// <response code="404">Device not found</response>
    /// <response code="401">Unauthorized - authentication required</response>
    /// <response code="500">Internal server error</response>
    [HttpGet("devices/serial/{serialNumber}")]
    [ProducesResponseType(typeof(ManagedDevice), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<ManagedDevice>> GetDeviceBySerialNumber(string serialNumber)
    {
        try
        {
            if (!InputValidator.ValidateSerialNumber(serialNumber, out var errorMessage))
            {
                return BadRequest(new { error = errorMessage });
            }

            _logger.LogInformation("API request to search device by serial number: {SerialNumber}", serialNumber);
            var device = await _intuneService.GetDeviceBySerialNumberAsync(serialNumber);

            if (device == null)
            {
                return NotFound(new { error = $"Device with serial number '{serialNumber}' not found" });
            }

            return Ok(device);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogError(ex, "Failed to search device by serial {SerialNumber}", serialNumber);
            return StatusCode(500, new { error = "Failed to search device by serial number", details = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error searching device by serial {SerialNumber}", serialNumber);
            return StatusCode(500, new { error = "An unexpected error occurred while searching for the device" });
        }
    }

    /// <summary>
    /// Searches for managed devices by device name.
    /// </summary>
    /// <param name="name">The device name (partial match supported)</param>
    /// <returns>A list of matching managed devices</returns>
    /// <response code="200">Returns the list of matching devices</response>
    /// <response code="401">Unauthorized - authentication required</response>
    /// <response code="500">Internal server error</response>
    [HttpGet("devices/search")]
    [ProducesResponseType(typeof(IEnumerable<ManagedDevice>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<IEnumerable<ManagedDevice>>> SearchDevicesByName([FromQuery] string name)
    {
        try
        {
            if (!InputValidator.ValidateSearchTerm(name, 100, out var errorMessage))
            {
                return BadRequest(new { error = errorMessage });
            }

            _logger.LogInformation("API request to search devices by name: {DeviceName}", name);
            var devices = await _intuneService.SearchDevicesByNameAsync(name);
            return Ok(devices);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogError(ex, "Failed to search devices by name {DeviceName}", name);
            return StatusCode(500, new { error = "Failed to search devices by name", details = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error searching devices by name {DeviceName}", name);
            return StatusCode(500, new { error = "An unexpected error occurred while searching devices" });
        }
    }

    /// <summary>
    /// Retrieves managed devices assigned to a specific user by UPN.
    /// </summary>
    /// <param name="upn">The user principal name (email)</param>
    /// <returns>A list of managed devices for the user</returns>
    /// <response code="200">Returns the list of devices for the user</response>
    /// <response code="401">Unauthorized - authentication required</response>
    /// <response code="500">Internal server error</response>
    [HttpGet("devices/user/{upn}")]
    [ProducesResponseType(typeof(IEnumerable<ManagedDevice>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<IEnumerable<ManagedDevice>>> GetDevicesByUser(string upn)
    {
        try
        {
            if (!InputValidator.ValidateSearchTerm(upn, 200, out var errorMessage))
            {
                return BadRequest(new { error = errorMessage });
            }

            _logger.LogInformation("API request to get devices for user: {UPN}", upn);
            var devices = await _intuneService.GetDevicesByUserAsync(upn);
            return Ok(devices);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogError(ex, "Failed to get devices for user {UPN}", upn);
            return StatusCode(500, new { error = "Failed to get devices for user", details = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error getting devices for user {UPN}", upn);
            return StatusCode(500, new { error = "An unexpected error occurred while getting user devices" });
        }
    }

    /// <summary>
    /// Retrieves managed devices filtered by operating system.
    /// </summary>
    /// <param name="os">The operating system (e.g., "Windows", "iOS", "Android")</param>
    /// <returns>A list of managed devices running the specified OS</returns>
    /// <response code="200">Returns the list of devices with the specified OS</response>
    /// <response code="401">Unauthorized - authentication required</response>
    /// <response code="500">Internal server error</response>
    [HttpGet("devices/os/{os}")]
    [ProducesResponseType(typeof(IEnumerable<ManagedDevice>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<IEnumerable<ManagedDevice>>> GetDevicesByOperatingSystem(string os)
    {
        try
        {
            if (!InputValidator.ValidateSearchTerm(os, 50, out var errorMessage))
            {
                return BadRequest(new { error = errorMessage });
            }

            _logger.LogInformation("API request to retrieve devices by OS: {OperatingSystem}", os);
            var devices = await _intuneService.GetDevicesByOperatingSystemAsync(os);
            return Ok(devices);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogError(ex, "Failed to retrieve devices by OS {OperatingSystem}", os);
            return StatusCode(500, new { error = "Failed to retrieve devices by operating system", details = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error retrieving devices by OS {OperatingSystem}", os);
            return StatusCode(500, new { error = "An unexpected error occurred while retrieving devices" });
        }
    }

    /// <summary>
    /// Checks if a specific device is compliant with organizational policies.
    /// </summary>
    /// <param name="deviceId">The Intune device identifier</param>
    /// <returns>Compliance status information</returns>
    /// <response code="200">Returns the compliance status</response>
    /// <response code="404">Device not found</response>
    /// <response code="401">Unauthorized - authentication required</response>
    /// <response code="500">Internal server error</response>
    [HttpGet("devices/{deviceId}/compliance")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult> CheckDeviceCompliance(string deviceId)
    {
        try
        {
            if (!InputValidator.ValidateDeviceId(deviceId, out var errorMessage))
            {
                return BadRequest(new { error = errorMessage });
            }

            _logger.LogInformation("API request to check compliance for device: {DeviceId}", deviceId);
            var isCompliant = await _intuneService.IsDeviceCompliantAsync(deviceId);

            return Ok(new
            {
                deviceId,
                isCompliant,
                checkedAt = DateTime.UtcNow
            });
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogError(ex, "Failed to check compliance for device {DeviceId}", deviceId);
            return StatusCode(500, new { error = "Failed to check device compliance", details = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error checking compliance for device {DeviceId}", deviceId);
            return StatusCode(500, new { error = "An unexpected error occurred while checking device compliance" });
        }
    }

    /// <summary>
    /// Gets statistics about managed devices in the organization.
    /// </summary>
    /// <returns>Device statistics including total count, OS breakdown, and compliance summary</returns>
    /// <response code="200">Returns device statistics</response>
    /// <response code="401">Unauthorized - authentication required</response>
    /// <response code="500">Internal server error</response>
    [HttpGet("statistics")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult> GetDeviceStatistics()
    {
        try
        {
            _logger.LogInformation("API request to retrieve device statistics");
            var devices = await _intuneService.GetManagedDevicesAsync();
            var deviceList = devices.ToList();

            var statistics = new
            {
                totalDevices = deviceList.Count,
                byOperatingSystem = deviceList
                    .GroupBy(d => d.OperatingSystem)
                    .Select(g => new { operatingSystem = g.Key, count = g.Count() })
                    .OrderByDescending(x => x.count)
                    .ToList(),
                byComplianceState = deviceList
                    .GroupBy(d => d.ComplianceState?.ToString() ?? "Unknown")
                    .Select(g => new { complianceState = g.Key, count = g.Count() })
                    .ToList(),
                lastSyncedDevices = deviceList
                    .Where(d => d.LastSyncDateTime.HasValue)
                    .OrderByDescending(d => d.LastSyncDateTime)
                    .Take(10)
                    .Select(d => new
                    {
                        deviceId = d.Id,
                        deviceName = d.DeviceName,
                        lastSyncDateTime = d.LastSyncDateTime
                    })
                    .ToList(),
                generatedAt = DateTime.UtcNow
            };

            return Ok(statistics);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogError(ex, "Failed to retrieve device statistics");
            return StatusCode(500, new { error = "Failed to retrieve device statistics", details = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error retrieving device statistics");
            return StatusCode(500, new { error = "An unexpected error occurred while retrieving statistics" });
        }
    }

    /// <summary>
    /// Retrieves all installed applications/software for a specific managed device from Intune.
    /// Uses Microsoft Graph Beta API to retrieve detected apps.
    /// </summary>
    /// <param name="deviceId">The Intune device identifier (GUID)</param>
    /// <returns>Device information with list of installed applications</returns>
    /// <response code="200">Returns the device information and installed applications</response>
    /// <response code="400">Invalid device ID format</response>
    /// <response code="404">Device not found</response>
    /// <response code="401">Unauthorized - authentication required</response>
    /// <response code="500">Internal server error</response>
    /// <remarks>
    /// Sample request:
    ///
    ///     GET /api/intune/devices/{deviceId}/apps
    ///
    /// This endpoint retrieves all detected/installed applications on a managed device.
    /// The data includes application name, version, publisher, size, and platform information.
    ///
    /// Note: This endpoint uses the Microsoft Graph Beta API as the $expand=detectedApps
    /// functionality is only available in the beta version.
    /// </remarks>
    [HttpGet("devices/{deviceId}/apps")]
    [ProducesResponseType(typeof(DeviceDetectedAppsResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<DeviceDetectedAppsResponseDto>> GetDeviceInstalledApps(string deviceId)
    {
        try
        {
            if (!InputValidator.ValidateDeviceId(deviceId, out var errorMessage))
            {
                return BadRequest(new { error = errorMessage });
            }

            _logger.LogInformation("API request to retrieve installed applications for device: {DeviceId}", deviceId);
            var result = await _intuneService.GetDeviceInstalledAppsAsync(deviceId);

            if (result == null)
            {
                return NotFound(new { error = $"Device with ID '{deviceId}' not found in Intune" });
            }

            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogError(ex, "Failed to retrieve installed apps for device {DeviceId}", deviceId);
            return StatusCode(500, new { error = "Failed to retrieve installed applications", details = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error retrieving installed apps for device {DeviceId}", deviceId);
            return StatusCode(500, new { error = "An unexpected error occurred while retrieving installed applications" });
        }
    }

    /// <summary>
    /// Retrieves all installed applications/software for a device identified by serial number.
    /// First looks up the device by serial number, then retrieves the installed apps from Intune.
    /// </summary>
    /// <param name="serialNumber">The device serial number</param>
    /// <returns>Device information with list of installed applications</returns>
    /// <response code="200">Returns the device information and installed applications</response>
    /// <response code="400">Invalid serial number format</response>
    /// <response code="404">Device not found with the given serial number</response>
    /// <response code="401">Unauthorized - authentication required</response>
    /// <response code="500">Internal server error</response>
    /// <remarks>
    /// Sample request:
    ///
    ///     GET /api/intune/devices/serial/{serialNumber}/apps
    ///
    /// This endpoint first finds the Intune device by serial number, then retrieves all
    /// detected/installed applications. Useful when you only have the serial number (e.g., from asset inventory).
    /// </remarks>
    [HttpGet("devices/serial/{serialNumber}/apps")]
    [ProducesResponseType(typeof(DeviceDetectedAppsResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<DeviceDetectedAppsResponseDto>> GetDeviceInstalledAppsBySerial(string serialNumber)
    {
        try
        {
            if (!InputValidator.ValidateSerialNumber(serialNumber, out var errorMessage))
            {
                return BadRequest(new { error = errorMessage });
            }

            _logger.LogInformation("API request to retrieve installed applications for device with serial: {SerialNumber}", serialNumber);
            var result = await _intuneService.GetDeviceInstalledAppsBySerialAsync(serialNumber);

            if (result == null)
            {
                return NotFound(new { error = $"Device with serial number '{serialNumber}' not found in Intune" });
            }

            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogError(ex, "Failed to retrieve installed apps for device with serial {SerialNumber}", serialNumber);
            return StatusCode(500, new { error = "Failed to retrieve installed applications", details = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error retrieving installed apps for device with serial {SerialNumber}", serialNumber);
            return StatusCode(500, new { error = "An unexpected error occurred while retrieving installed applications" });
        }
    }

    /// <summary>
    /// Retrieves device health information and ICT recommendations for a device identified by serial number.
    /// Includes compliance status, storage, encryption, OS version, and improvement recommendations.
    /// </summary>
    /// <param name="serialNumber">The device serial number</param>
    /// <returns>Device health information with recommendations</returns>
    /// <response code="200">Returns the device health information and recommendations</response>
    /// <response code="400">Invalid serial number format</response>
    /// <response code="404">Device not found with the given serial number</response>
    /// <response code="401">Unauthorized - authentication required</response>
    /// <response code="500">Internal server error</response>
    /// <remarks>
    /// Sample request:
    ///
    ///     GET /api/intune/devices/serial/{serialNumber}/health
    ///
    /// This endpoint retrieves comprehensive device health information including:
    /// - Compliance status
    /// - Encryption status
    /// - Storage usage
    /// - Memory information
    /// - OS version
    /// - ICT recommendations for improvements
    /// </remarks>
    [HttpGet("devices/serial/{serialNumber}/health")]
    [ProducesResponseType(typeof(DeviceHealthDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<DeviceHealthDto>> GetDeviceHealthBySerial(string serialNumber)
    {
        try
        {
            if (!InputValidator.ValidateSerialNumber(serialNumber, out var errorMessage))
            {
                return BadRequest(new { error = errorMessage });
            }

            _logger.LogInformation("API request to retrieve device health for serial: {SerialNumber}", serialNumber);
            var result = await _intuneService.GetDeviceHealthBySerialAsync(serialNumber);

            if (result == null)
            {
                return NotFound(new { error = $"Device with serial number '{serialNumber}' not found in Intune" });
            }

            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogError(ex, "Failed to retrieve device health for serial {SerialNumber}", serialNumber);
            return StatusCode(500, new { error = "Failed to retrieve device health", details = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error retrieving device health for serial {SerialNumber}", serialNumber);
            return StatusCode(500, new { error = "An unexpected error occurred while retrieving device health" });
        }
    }

    /// <summary>
    /// Retrieves combined live status for a device identified by serial number.
    /// Includes compliance, health, sync info, and app summary in a single response.
    /// Optimized for polling/auto-refresh scenarios.
    /// </summary>
    /// <param name="serialNumber">The device serial number</param>
    /// <returns>Combined device live status information</returns>
    /// <response code="200">Returns the device live status (check Found property)</response>
    /// <response code="400">Invalid serial number format</response>
    /// <response code="401">Unauthorized - authentication required</response>
    /// <response code="500">Internal server error</response>
    /// <remarks>
    /// Sample request:
    ///
    ///     GET /api/intune/devices/serial/{serialNumber}/live-status
    ///
    /// This endpoint aggregates device information for live monitoring:
    /// - Device identity and hardware info
    /// - Compliance and encryption status
    /// - Last sync timestamps
    /// - Health score and recommendations
    /// - Top 10 detected applications
    ///
    /// Always returns 200 with a DeviceLiveStatusDto - check the Found property
    /// to determine if the device was found in Intune.
    /// </remarks>
    [HttpGet("devices/serial/{serialNumber}/live-status")]
    [ProducesResponseType(typeof(DeviceLiveStatusDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<DeviceLiveStatusDto>> GetDeviceLiveStatus(string serialNumber)
    {
        try
        {
            if (!InputValidator.ValidateSerialNumber(serialNumber, out var errorMessage))
            {
                return BadRequest(new { error = errorMessage });
            }

            _logger.LogInformation("API request for live status of device with serial: {SerialNumber}", serialNumber);
            var result = await _intuneService.GetDeviceLiveStatusAsync(serialNumber);

            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogError(ex, "Failed to retrieve live status for serial {SerialNumber}", serialNumber);
            return StatusCode(500, new { error = "Failed to retrieve device live status", details = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error retrieving live status for serial {SerialNumber}", serialNumber);
            return StatusCode(500, new { error = "An unexpected error occurred" });
        }
    }

    /// <summary>
    /// Retrieves the provisioning timeline for a device from Autopilot registration to user delivery.
    /// Includes timing data for each provisioning phase.
    /// </summary>
    /// <param name="serialNumber">The device serial number</param>
    /// <returns>Provisioning timeline with events and durations</returns>
    /// <response code="200">Returns the provisioning timeline (check Found property)</response>
    /// <response code="400">Invalid serial number format</response>
    /// <response code="401">Unauthorized - authentication required</response>
    /// <response code="500">Internal server error</response>
    /// <remarks>
    /// Sample request:
    ///
    ///     GET /api/intune/devices/serial/{serialNumber}/provisioning-timeline
    ///
    /// This endpoint retrieves the complete provisioning timeline including:
    /// - Autopilot registration timestamp
    /// - Device enrollment (OOBE) duration
    /// - ESP Device Setup phase duration
    /// - ESP Account Setup phase duration
    /// - Total provisioning time
    ///
    /// Always returns 200 with a ProvisioningTimelineDto - check the Found property
    /// to determine if the device was found in Intune/Autopilot.
    ///
    /// Note: Requires DeviceManagementServiceConfig.Read.All permission for Autopilot data.
    /// </remarks>
    [HttpGet("devices/serial/{serialNumber}/provisioning-timeline")]
    [ProducesResponseType(typeof(ProvisioningTimelineDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<ProvisioningTimelineDto>> GetProvisioningTimeline(string serialNumber)
    {
        try
        {
            if (!InputValidator.ValidateSerialNumber(serialNumber, out var errorMessage))
            {
                return BadRequest(new { error = errorMessage });
            }

            _logger.LogInformation("API request for provisioning timeline of device with serial: {SerialNumber}", serialNumber);
            var result = await _intuneService.GetProvisioningTimelineAsync(serialNumber);

            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogError(ex, "Failed to retrieve provisioning timeline for serial {SerialNumber}", serialNumber);
            return StatusCode(500, new { error = "Failed to retrieve provisioning timeline", details = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error retrieving provisioning timeline for serial {SerialNumber}", serialNumber);
            return StatusCode(500, new { error = "An unexpected error occurred" });
        }
    }

    /// <summary>
    /// Retrieves all Windows Autopilot device identities from Intune.
    /// </summary>
    /// <returns>A list of Autopilot device identities</returns>
    /// <response code="200">Returns the list of Autopilot devices</response>
    /// <response code="401">Unauthorized - authentication required</response>
    /// <response code="500">Internal server error</response>
    /// <remarks>
    /// Sample request:
    ///
    ///     GET /api/intune/autopilot-devices
    ///
    /// This endpoint retrieves all Windows Autopilot device identities including:
    /// - Serial number
    /// - Model and manufacturer
    /// - Assigned user
    /// - Deployment profile status
    /// - Enrollment state
    ///
    /// Useful for testing provisioning timeline with Autopilot-enrolled devices.
    /// </remarks>
    [HttpGet("autopilot-devices")]
    [ProducesResponseType(typeof(IEnumerable<AutopilotDeviceDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<IEnumerable<AutopilotDeviceDto>>> GetAutopilotDevices()
    {
        try
        {
            _logger.LogInformation("API request to retrieve all Autopilot devices");
            var devices = await _intuneService.GetAutopilotDevicesAsync();
            return Ok(devices);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogError(ex, "Failed to retrieve Autopilot devices");
            return StatusCode(500, new { error = "Failed to retrieve Autopilot devices", details = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error retrieving Autopilot devices");
            return StatusCode(500, new { error = "An unexpected error occurred while retrieving Autopilot devices" });
        }
    }

    /// <summary>
    /// Retrieves configuration profile deployment statuses for a device by Intune device ID.
    /// Shows all assigned profiles including certificate, Wi-Fi, VPN profiles and their deployment status.
    /// Critical for diagnosing network certificate issues after primary user changes.
    /// </summary>
    /// <param name="deviceId">The Intune device identifier (GUID)</param>
    /// <returns>Configuration profile statuses with certificate issue detection</returns>
    [HttpGet("devices/{deviceId}/configuration-status")]
    [ProducesResponseType(typeof(DeviceConfigurationStatusDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<DeviceConfigurationStatusDto>> GetDeviceConfigurationStatus(string deviceId)
    {
        try
        {
            if (!InputValidator.ValidateDeviceId(deviceId, out var errorMessage))
            {
                return BadRequest(new { error = errorMessage });
            }

            _logger.LogInformation("API request to retrieve configuration status for device: {DeviceId}", deviceId);
            var result = await _intuneService.GetDeviceConfigurationStatusAsync(deviceId);

            if (result == null)
            {
                return NotFound(new { error = $"Device with ID '{deviceId}' not found in Intune" });
            }

            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogError(ex, "Failed to retrieve configuration status for device {DeviceId}", deviceId);
            return StatusCode(500, new { error = "Failed to retrieve configuration status", details = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error retrieving configuration status for device {DeviceId}", deviceId);
            return StatusCode(500, new { error = "An unexpected error occurred while retrieving configuration status" });
        }
    }

    /// <summary>
    /// Retrieves configuration profile deployment statuses for a device by serial number.
    /// Shows all assigned profiles including certificate, Wi-Fi, VPN profiles and their deployment status.
    /// Critical for diagnosing network certificate issues after primary user changes.
    /// </summary>
    /// <param name="serialNumber">The device serial number</param>
    /// <returns>Configuration profile statuses with certificate issue detection</returns>
    [HttpGet("devices/serial/{serialNumber}/configuration-status")]
    [ProducesResponseType(typeof(DeviceConfigurationStatusDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<DeviceConfigurationStatusDto>> GetDeviceConfigurationStatusBySerial(string serialNumber)
    {
        try
        {
            if (!InputValidator.ValidateSerialNumber(serialNumber, out var errorMessage))
            {
                return BadRequest(new { error = errorMessage });
            }

            _logger.LogInformation("API request to retrieve configuration status for device with serial: {SerialNumber}", serialNumber);
            var result = await _intuneService.GetDeviceConfigurationStatusBySerialAsync(serialNumber);

            if (result == null)
            {
                return NotFound(new { error = $"Device with serial number '{serialNumber}' not found in Intune" });
            }

            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogError(ex, "Failed to retrieve configuration status for serial {SerialNumber}", serialNumber);
            return StatusCode(500, new { error = "Failed to retrieve configuration status", details = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error retrieving configuration status for serial {SerialNumber}", serialNumber);
            return StatusCode(500, new { error = "An unexpected error occurred while retrieving configuration status" });
        }
    }

    /// <summary>
    /// Imports selected Intune devices as new assets in the inventory.
    /// Creates Asset entities from Intune device data with automatic asset code generation.
    /// </summary>
    /// <param name="request">Import request with device IDs and asset type</param>
    /// <returns>Import result with statistics and details</returns>
    /// <response code="200">Returns the import result with statistics</response>
    /// <response code="400">Invalid request parameters</response>
    /// <response code="401">Unauthorized - authentication required</response>
    /// <response code="500">Internal server error</response>
    /// <remarks>
    /// Sample request:
    ///
    ///     POST /api/intune/import-devices
    ///     {
    ///         "deviceIds": ["guid1", "guid2", "guid3"],
    ///         "assetTypeId": 1,
    ///         "status": "Stock"
    ///     }
    ///
    /// This endpoint imports Intune devices as new assets in the inventory:
    /// - Fetches device details from Intune (name, serial, manufacturer, model)
    /// - Generates unique asset codes (LAP0001, LAP0002, etc.)
    /// - Creates Asset entities with Intune data pre-populated
    /// - Skips devices that already exist in inventory (by serial number)
    /// - Returns detailed results including imported, skipped, and failed devices
    ///
    /// Status can be: Stock, Nieuw, InGebruik, Herstelling, Defect, UitDienst
    /// </remarks>
    [HttpPost("import-devices")]
    [ProducesResponseType(typeof(ImportIntuneDevicesResultDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<ImportIntuneDevicesResultDto>> ImportIntuneDevices([FromBody] ImportIntuneDevicesDto request)
    {
        try
        {
            if (request == null)
            {
                return BadRequest(new { error = "Request body is required" });
            }

            if (request.DeviceIds == null || request.DeviceIds.Count == 0)
            {
                return BadRequest(new { error = "At least one device ID is required" });
            }

            if (request.AssetTypeId <= 0)
            {
                return BadRequest(new { error = "Valid asset type ID is required" });
            }

            _logger.LogInformation("API request to import {Count} Intune devices", request.DeviceIds.Count);

            var result = await _intuneSyncService.ImportIntuneDevicesAsync(request);

            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogError(ex, "Failed to import Intune devices");
            return StatusCode(500, new { error = "Failed to import Intune devices", details = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error importing Intune devices");
            return StatusCode(500, new { error = "An unexpected error occurred while importing devices" });
        }
    }

    /// <summary>
    /// Syncs Intune data (enrollment date, last check-in, certificate expiry) to Asset entities.
    /// Matches assets by serial number and updates their Intune fields.
    /// </summary>
    /// <param name="assetIds">Optional: specific asset IDs to sync. If not provided, syncs all laptops/desktops with serial numbers.</param>
    /// <returns>Sync result with statistics</returns>
    /// <response code="200">Returns the sync result with statistics</response>
    /// <response code="401">Unauthorized - authentication required</response>
    /// <response code="500">Internal server error</response>
    /// <remarks>
    /// Sample requests:
    ///
    ///     POST /api/intune/sync-to-assets
    ///
    ///     POST /api/intune/sync-to-assets?assetIds=1&amp;assetIds=2&amp;assetIds=3
    ///
    /// This endpoint syncs Intune data to the Asset entities in the inventory database.
    /// For each laptop/desktop with a serial number:
    /// - Looks up the device in Intune by serial number
    /// - Updates IntuneEnrollmentDate, IntuneLastCheckIn, and IntuneCertificateExpiry on the Asset
    /// - Records IntuneSyncedAt timestamp
    ///
    /// The sync can be run for all applicable assets or for specific asset IDs.
    /// </remarks>
    [HttpPost("sync-to-assets")]
    [ProducesResponseType(typeof(IntuneSyncResultDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<IntuneSyncResultDto>> SyncIntuneDataToAssets([FromQuery] int[]? assetIds = null)
    {
        try
        {
            _logger.LogInformation("API request to sync Intune data to assets. Asset IDs: {AssetIds}",
                assetIds != null ? string.Join(", ", assetIds) : "all");

            var result = await _intuneSyncService.SyncIntuneDataToAssetsAsync(assetIds);

            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogError(ex, "Failed to sync Intune data to assets");
            return StatusCode(500, new { error = "Failed to sync Intune data", details = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error syncing Intune data to assets");
            return StatusCode(500, new { error = "An unexpected error occurred while syncing Intune data" });
        }
    }

    /// <summary>
    /// Retrieves Azure AD group memberships for a device and its primary user.
    /// </summary>
    [HttpGet("devices/{deviceId}/groups")]
    [ProducesResponseType(typeof(DeviceGroupMembershipDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<DeviceGroupMembershipDto>> GetDeviceGroupMemberships(string deviceId)
    {
        try
        {
            _logger.LogInformation("API request to retrieve group memberships for device: {DeviceId}", deviceId);
            var result = await _intuneService.GetDeviceGroupMembershipsAsync(deviceId);

            if (result == null)
                return NotFound(new { error = $"Device with ID '{deviceId}' not found" });

            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to retrieve group memberships for device {DeviceId}", deviceId);
            return StatusCode(500, new { error = "Failed to retrieve group memberships", details = ex.Message });
        }
    }

    /// <summary>
    /// Retrieves aggregated events for a device (compliance, sync, cert, actions).
    /// </summary>
    [HttpGet("devices/{deviceId}/events")]
    [ProducesResponseType(typeof(DeviceEventsResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<DeviceEventsResponseDto>> GetDeviceEvents(string deviceId)
    {
        try
        {
            _logger.LogInformation("API request to retrieve events for device: {DeviceId}", deviceId);
            var result = await _intuneService.GetDeviceEventsAsync(deviceId);

            if (result == null)
                return NotFound(new { error = $"Device with ID '{deviceId}' not found" });

            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to retrieve events for device {DeviceId}", deviceId);
            return StatusCode(500, new { error = "Failed to retrieve device events", details = ex.Message });
        }
    }
}

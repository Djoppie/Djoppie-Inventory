using DjoppieInventory.API.Helpers;
using DjoppieInventory.Core.DTOs;
using DjoppieInventory.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Graph.Models;

namespace DjoppieInventory.API.Controllers.Devices;

/// <summary>
/// API controller for Intune device lookup, search, and list operations.
/// </summary>
[Authorize]
[ApiController]
[Route("api/devices/intune")]
[EnableRateLimiting("intune")]
public class IntuneDevicesController : ControllerBase
{
    private readonly IIntuneService _intuneService;
    private readonly ILogger<IntuneDevicesController> _logger;

    public IntuneDevicesController(
        IIntuneService intuneService,
        ILogger<IntuneDevicesController> logger)
    {
        _intuneService = intuneService ?? throw new ArgumentNullException(nameof(intuneService));
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
    ///     GET /api/devices/intune/devices/{deviceId}/apps
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
    ///     GET /api/devices/intune/devices/serial/{serialNumber}/apps
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
    /// Retrieves all Windows Autopilot device identities from Intune.
    /// </summary>
    /// <returns>A list of Autopilot device identities</returns>
    /// <response code="200">Returns the list of Autopilot devices</response>
    /// <response code="401">Unauthorized - authentication required</response>
    /// <response code="500">Internal server error</response>
    /// <remarks>
    /// Sample request:
    ///
    ///     GET /api/devices/intune/autopilot-devices
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

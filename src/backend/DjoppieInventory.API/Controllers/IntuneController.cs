using DjoppieInventory.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Graph.Models;

namespace DjoppieInventory.API.Controllers;

/// <summary>
/// API controller for Microsoft Intune device management operations.
/// Provides endpoints to query and manage Intune-enrolled devices.
/// </summary>
[Authorize]
[ApiController]
[Route("api/[controller]")]
public class IntuneController : ControllerBase
{
    private readonly IIntuneService _intuneService;
    private readonly ILogger<IntuneController> _logger;

    public IntuneController(IIntuneService intuneService, ILogger<IntuneController> logger)
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
            if (string.IsNullOrWhiteSpace(deviceId))
            {
                return BadRequest(new { error = "Device ID cannot be empty" });
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
            if (string.IsNullOrWhiteSpace(serialNumber))
            {
                return BadRequest(new { error = "Serial number cannot be empty" });
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
            if (string.IsNullOrWhiteSpace(name))
            {
                return BadRequest(new { error = "Search name cannot be empty" });
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
            if (string.IsNullOrWhiteSpace(os))
            {
                return BadRequest(new { error = "Operating system cannot be empty" });
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
            if (string.IsNullOrWhiteSpace(deviceId))
            {
                return BadRequest(new { error = "Device ID cannot be empty" });
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
}

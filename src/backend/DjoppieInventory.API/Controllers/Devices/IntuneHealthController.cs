using DjoppieInventory.API.Helpers;
using DjoppieInventory.Core.DTOs;
using DjoppieInventory.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace DjoppieInventory.API.Controllers.Devices;

/// <summary>
/// API controller for Intune device health, status, and provisioning operations.
/// </summary>
[Authorize]
[ApiController]
[Route("api/devices/intune")]
[EnableRateLimiting("intune")]
public class IntuneHealthController : ControllerBase
{
    private readonly IIntuneService _intuneService;
    private readonly ILogger<IntuneHealthController> _logger;

    public IntuneHealthController(
        IIntuneService intuneService,
        ILogger<IntuneHealthController> logger)
    {
        _intuneService = intuneService ?? throw new ArgumentNullException(nameof(intuneService));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
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
    ///     GET /api/devices/intune/devices/serial/{serialNumber}/health
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
    ///     GET /api/devices/intune/devices/serial/{serialNumber}/live-status
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
    ///     GET /api/devices/intune/devices/serial/{serialNumber}/provisioning-timeline
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
}

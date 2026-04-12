using DjoppieInventory.Core.DTOs;
using DjoppieInventory.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace DjoppieInventory.API.Controllers.Devices;

/// <summary>
/// API controller for Intune sync and import operations.
/// </summary>
[Authorize]
[ApiController]
[Route("api/devices/intune")]
[EnableRateLimiting("intune")]
public class IntuneSyncController : ControllerBase
{
    private readonly IIntuneService _intuneService;
    private readonly IIntuneSyncService _intuneSyncService;
    private readonly ILogger<IntuneSyncController> _logger;

    public IntuneSyncController(
        IIntuneService intuneService,
        IIntuneSyncService intuneSyncService,
        ILogger<IntuneSyncController> logger)
    {
        _intuneService = intuneService ?? throw new ArgumentNullException(nameof(intuneService));
        _intuneSyncService = intuneSyncService ?? throw new ArgumentNullException(nameof(intuneSyncService));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
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
    ///     POST /api/devices/intune/import-devices
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
    ///     POST /api/devices/intune/sync-to-assets
    ///
    ///     POST /api/devices/intune/sync-to-assets?assetIds=1&amp;assetIds=2&amp;assetIds=3
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
}

using DjoppieInventory.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DjoppieInventory.API.Controllers.Workplaces;

/// <summary>
/// Controller for managing fixed assets assigned to physical workplaces.
/// Fixed assets (monitors, docking stations, etc.) stay at the workplace
/// regardless of who occupies it.
/// </summary>
[ApiController]
[Route("api/workplaces")]
[Authorize]
public class WorkplaceAssetsController : ControllerBase
{
    private readonly IPhysicalWorkplaceService _workplaceService;
    private readonly ILogger<WorkplaceAssetsController> _logger;

    public WorkplaceAssetsController(
        IPhysicalWorkplaceService workplaceService,
        ILogger<WorkplaceAssetsController> logger)
    {
        _workplaceService = workplaceService;
        _logger = logger;
    }

    /// <summary>
    /// Gets the fixed assets assigned to a physical workplace.
    /// Includes both assets with PhysicalWorkplaceId set AND assets in equipment slots.
    /// </summary>
    [HttpGet("{id}/assets")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult> GetFixedAssets(
        int id,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var assets = await _workplaceService.GetWorkplaceAssetsAsync(id, cancellationToken);
            return Ok(assets);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ex.Message);
        }
    }

    /// <summary>
    /// Assigns an asset to a physical workplace as a fixed asset.
    /// Fixed assets (monitors, docking stations, etc.) stay at the workplace
    /// regardless of who occupies it.
    /// </summary>
    [HttpPost("{id}/assets/{assetId}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult> AssignAsset(
        int id,
        int assetId,
        CancellationToken cancellationToken = default)
    {
        try
        {
            await _workplaceService.AssignAssetAsync(id, assetId, cancellationToken);

            _logger.LogInformation("Assigned asset {AssetId} to workplace {WorkplaceId}",
                assetId, id);

            return Ok(new { message = $"Asset assigned to workplace successfully" });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ex.Message);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    /// <summary>
    /// Unassigns an asset from a physical workplace.
    /// The asset will no longer be associated with any workplace.
    /// </summary>
    [HttpDelete("{id}/assets/{assetId}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UnassignAsset(
        int id,
        int assetId,
        CancellationToken cancellationToken = default)
    {
        try
        {
            await _workplaceService.RemoveAssetAsync(id, assetId, cancellationToken);

            _logger.LogInformation("Unassigned asset {AssetId} from workplace {WorkplaceId}",
                assetId, id);

            return NoContent();
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ex.Message);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }
}

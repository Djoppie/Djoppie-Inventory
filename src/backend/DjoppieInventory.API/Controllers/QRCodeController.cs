using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QRCoder;
using System.ComponentModel.DataAnnotations;

namespace DjoppieInventory.API.Controllers;

/// <summary>
/// API controller for generating QR codes for asset identification.
/// Provides endpoints to create scannable QR codes containing asset codes.
/// </summary>
[Authorize]
[ApiController]
[Route("api/[controller]")]
public class QRCodeController : ControllerBase
{
    private readonly ILogger<QRCodeController> _logger;
    private const int QR_CODE_PIXELS_PER_MODULE = 20;
    private const int MAX_ASSET_CODE_LENGTH = 100;

    /// <summary>
    /// Initializes a new instance of the QRCodeController.
    /// </summary>
    /// <param name="logger">Logger for tracking errors and application events</param>
    public QRCodeController(ILogger<QRCodeController> logger)
    {
        _logger = logger;
    }

    /// <summary>
    /// Generates a QR code image containing the specified asset code.
    /// </summary>
    /// <param name="assetCode">The asset code to encode in the QR code (max 100 characters)</param>
    /// <returns>A PNG image file containing the QR code</returns>
    /// <response code="200">Returns the QR code image as PNG</response>
    /// <response code="400">If the asset code is invalid or too long</response>
    /// <response code="500">If an error occurs during QR code generation</response>
    [HttpGet("generate/{assetCode}")]
    public IActionResult GenerateQRCode([Required] string assetCode)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(assetCode))
            {
                _logger.LogWarning("QR code generation requested with empty asset code");
                return BadRequest("Asset code cannot be empty");
            }

            if (assetCode.Length > MAX_ASSET_CODE_LENGTH)
            {
                _logger.LogWarning("QR code generation requested with asset code exceeding max length: {Length}", assetCode.Length);
                return BadRequest($"Asset code cannot exceed {MAX_ASSET_CODE_LENGTH} characters");
            }

            using var qrGenerator = new QRCodeGenerator();
            using var qrCodeData = qrGenerator.CreateQrCode(assetCode, QRCodeGenerator.ECCLevel.Q);
            using var qrCode = new PngByteQRCode(qrCodeData);

            var qrCodeImage = qrCode.GetGraphic(QR_CODE_PIXELS_PER_MODULE);

            _logger.LogInformation("Successfully generated QR code for asset code: {AssetCode}", assetCode);
            return File(qrCodeImage, "image/png");
        }
        catch (ArgumentException argEx)
        {
            _logger.LogError(argEx, "Invalid argument while generating QR code for asset {AssetCode}", assetCode);
            return BadRequest("Invalid asset code format");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error generating QR code for asset {AssetCode}", assetCode);
            return StatusCode(500, "An unexpected error occurred while generating the QR code");
        }
    }
}

using Microsoft.AspNetCore.Mvc;
using QRCoder;

namespace DjoppieInventory.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class QRCodeController : ControllerBase
{
    private readonly ILogger<QRCodeController> _logger;

    public QRCodeController(ILogger<QRCodeController> logger)
    {
        _logger = logger;
    }

    [HttpGet("generate/{assetCode}")]
    public IActionResult GenerateQRCode(string assetCode)
    {
        try
        {
            using var qrGenerator = new QRCodeGenerator();
            using var qrCodeData = qrGenerator.CreateQrCode(assetCode, QRCodeGenerator.ECCLevel.Q);
            using var qrCode = new PngByteQRCode(qrCodeData);

            var qrCodeImage = qrCode.GetGraphic(20);
            return File(qrCodeImage, "image/png");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating QR code for asset {AssetCode}", assetCode);
            return StatusCode(500, "An error occurred while generating the QR code");
        }
    }
}

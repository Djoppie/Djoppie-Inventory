using DjoppieInventory.Core.DTOs;
using DjoppieInventory.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using System.Security.Claims;

namespace DjoppieInventory.API.Controllers;

/// <summary>
/// API controller for CSV import operations.
/// Allows bulk import of assets from CSV files with validation and detailed error reporting.
/// </summary>
[Authorize]
[ApiController]
[Route("api/[controller]")]
[EnableRateLimiting("bulk")]
public class CsvImportController : ControllerBase
{
    private readonly ICsvImportService _csvImportService;
    private readonly ILogger<CsvImportController> _logger;

    private const int MaxFileSizeBytes = 5 * 1024 * 1024; // 5 MB
    private const string AllowedContentType = "text/csv";

    public CsvImportController(
        ICsvImportService csvImportService,
        ILogger<CsvImportController> logger)
    {
        _csvImportService = csvImportService;
        _logger = logger;
    }

    /// <summary>
    /// Imports assets from a CSV file.
    /// Validates each row, creates assets with auto-generated codes, and provides detailed results.
    /// </summary>
    /// <param name="file">The CSV file to import (max 5 MB)</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Import results with success/failure details for each row</returns>
    /// <response code="200">Import completed (may contain partial failures - check result details)</response>
    /// <response code="400">Invalid file format or validation error</response>
    /// <response code="401">User not authenticated</response>
    /// <response code="429">Rate limit exceeded</response>
    [HttpPost("import")]
    [Consumes("multipart/form-data")]
    [ProducesResponseType(typeof(CsvImportResultDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status429TooManyRequests)]
    public async Task<ActionResult<CsvImportResultDto>> ImportCsv(
        IFormFile file,
        CancellationToken cancellationToken = default)
    {
        // Validate file is provided
        if (file == null || file.Length == 0)
        {
            return BadRequest("No file uploaded. Please provide a CSV file.");
        }

        // Validate file size
        if (file.Length > MaxFileSizeBytes)
        {
            return BadRequest($"File size exceeds maximum allowed size of {MaxFileSizeBytes / 1024 / 1024} MB.");
        }

        // Validate file extension and content type
        var fileExtension = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (fileExtension != ".csv")
        {
            return BadRequest("Invalid file type. Only CSV files (.csv) are allowed.");
        }

        // Get user information from claims
        var userName = User.FindFirst(ClaimTypes.Name)?.Value ?? "Unknown User";
        var userEmail = User.FindFirst(ClaimTypes.Email)?.Value ?? User.FindFirst("preferred_username")?.Value ?? "unknown@example.com";

        _logger.LogInformation(
            "CSV import started by {UserName} ({UserEmail}). File: {FileName}, Size: {FileSize} bytes",
            userName, userEmail, file.FileName, file.Length);

        try
        {
            // Import assets from CSV
            using var stream = file.OpenReadStream();
            var result = await _csvImportService.ImportAssetsAsync(stream, userName, userEmail, cancellationToken);

            if (result.IsFullySuccessful)
            {
                _logger.LogInformation(
                    "CSV import completed successfully by {UserName}. {SuccessCount} assets imported",
                    userName, result.SuccessCount);
            }
            else
            {
                _logger.LogWarning(
                    "CSV import completed with errors by {UserName}. Success: {SuccessCount}, Errors: {ErrorCount}",
                    userName, result.SuccessCount, result.ErrorCount);
            }

            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            // CSV parsing or validation errors
            _logger.LogWarning(ex, "CSV import failed due to validation error for user {UserName}", userName);
            return BadRequest(new
            {
                error = "CSV file validation failed",
                message = ex.Message,
                statusCode = 400
            });
        }
        catch (Exception ex)
        {
            // Unexpected errors
            _logger.LogError(ex, "CSV import failed with unexpected error for user {UserName}", userName);
            return StatusCode(500, new
            {
                error = "CSV import failed",
                message = "An unexpected error occurred during import. Please check the file format and try again.",
                statusCode = 500
            });
        }
    }

    /// <summary>
    /// Validates a CSV file without importing. Used for preview functionality.
    /// Returns validation results with detailed errors for each row.
    /// </summary>
    /// <param name="file">The CSV file to validate (max 5 MB)</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Validation results with errors for each row</returns>
    /// <response code="200">Validation completed - check results for errors</response>
    /// <response code="400">Invalid file format</response>
    /// <response code="401">User not authenticated</response>
    [HttpPost("validate")]
    [Consumes("multipart/form-data")]
    [ProducesResponseType(typeof(CsvImportResultDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<CsvImportResultDto>> ValidateCsv(
        IFormFile file,
        CancellationToken cancellationToken = default)
    {
        // Validate file is provided
        if (file == null || file.Length == 0)
        {
            return BadRequest("No file uploaded. Please provide a CSV file.");
        }

        // Validate file size
        if (file.Length > MaxFileSizeBytes)
        {
            return BadRequest($"File size exceeds maximum allowed size of {MaxFileSizeBytes / 1024 / 1024} MB.");
        }

        // Validate file extension
        var fileExtension = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (fileExtension != ".csv")
        {
            return BadRequest("Invalid file type. Only CSV files (.csv) are allowed.");
        }

        var userName = User.FindFirst(ClaimTypes.Name)?.Value ?? "Unknown User";
        _logger.LogInformation(
            "CSV validation started by {UserName}. File: {FileName}, Size: {FileSize} bytes",
            userName, file.FileName, file.Length);

        try
        {
            using var stream = file.OpenReadStream();
            var result = await _csvImportService.ValidateAssetsAsync(stream, cancellationToken);

            _logger.LogInformation(
                "CSV validation completed by {UserName}. Valid: {SuccessCount}, Invalid: {ErrorCount}",
                userName, result.SuccessCount, result.ErrorCount);

            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "CSV validation failed for user {UserName}", userName);
            return BadRequest(new
            {
                error = "CSV file validation failed",
                message = ex.Message,
                statusCode = 400
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "CSV validation failed with unexpected error for user {UserName}", userName);
            return StatusCode(500, new
            {
                error = "CSV validation failed",
                message = "An unexpected error occurred. Please check the file format and try again.",
                statusCode = 500
            });
        }
    }

    /// <summary>
    /// Downloads a CSV template file with example data and format documentation.
    /// Includes all valid BuildingCodes, ServiceCodes, and AssetTypeCodes in comments.
    /// </summary>
    /// <returns>CSV template file</returns>
    /// <response code="200">CSV template file</response>
    /// <response code="401">User not authenticated</response>
    [HttpGet("template")]
    [ProducesResponseType(typeof(FileContentResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> DownloadTemplate(CancellationToken cancellationToken = default)
    {
        var userName = User.FindFirst(ClaimTypes.Name)?.Value ?? "Unknown User";
        _logger.LogInformation("CSV template downloaded by {UserName}", userName);

        var templateBytes = await _csvImportService.GenerateCsvTemplateAsync(cancellationToken);
        var fileName = $"asset-import-template_{DateTime.UtcNow:yyyyMMdd}.csv";

        return File(templateBytes, "text/csv", fileName);
    }
}

using DjoppieInventory.Core.DTOs;
using DjoppieInventory.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Text;

namespace DjoppieInventory.API.Controllers.Reports;

/// <summary>
/// API controller for license (MS365) reports.
/// </summary>
[ApiController]
[Route("api/reports")]
[Authorize]
public class DeviceReportsController : ControllerBase
{
    private readonly ILicenseService _licenseService;
    private readonly ILogger<DeviceReportsController> _logger;

    public DeviceReportsController(
        ILicenseService licenseService,
        ILogger<DeviceReportsController> logger)
    {
        _licenseService = licenseService;
        _logger = logger;
    }

    // ========================================
    // License Report (MS365)
    // ========================================

    /// <summary>
    /// Gets MS365 license summary (E3, E5, F1 licenses).
    /// Retrieves real-time data from Microsoft Graph API.
    /// </summary>
    [HttpGet("licenses/summary")]
    [ProducesResponseType(typeof(LicenseSummaryDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<LicenseSummaryDto>> GetLicenseSummary(
        CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogInformation("Fetching MS365 license summary");
            var summary = await _licenseService.GetLicenseSummaryAsync(cancellationToken);

            if (!string.IsNullOrEmpty(summary.ErrorMessage))
            {
                _logger.LogWarning("License summary returned with error: {Error}", summary.ErrorMessage);
            }

            return Ok(summary);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogError(ex, "Failed to retrieve license summary from Graph API");
            return Ok(new LicenseSummaryDto
            {
                ErrorMessage = "Failed to retrieve license data. Please check Graph API permissions."
            });
        }
    }

    /// <summary>
    /// Gets users with assigned licenses.
    /// Retrieves real-time data from Microsoft Graph API.
    /// </summary>
    [HttpGet("licenses/users")]
    [ProducesResponseType(typeof(IEnumerable<LicenseUserDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<LicenseUserDto>>> GetLicenseUsers(
        [FromQuery] string? skuId = null,
        [FromQuery] string? department = null,
        [FromQuery] string? search = null,
        CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogInformation("Fetching license users. SKU: {SkuId}, Department: {Department}, Search: {Search}",
                skuId, department, search);

            var users = await _licenseService.GetLicenseUsersAsync(skuId, department, cancellationToken);
            var userList = users.ToList();

            // Apply client-side search filter if provided
            if (!string.IsNullOrEmpty(search))
            {
                var searchLower = search.ToLower();
                userList = userList
                    .Where(u =>
                        u.DisplayName.ToLower().Contains(searchLower) ||
                        u.UserPrincipalName.ToLower().Contains(searchLower) ||
                        (u.Department?.ToLower().Contains(searchLower) ?? false) ||
                        (u.JobTitle?.ToLower().Contains(searchLower) ?? false))
                    .ToList();
            }

            _logger.LogInformation("Returning {Count} license users", userList.Count);
            return Ok(userList);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogError(ex, "Failed to retrieve license users from Graph API");
            return Ok(new List<LicenseUserDto>());
        }
    }

    /// <summary>
    /// Gets license statistics breakdown by department.
    /// </summary>
    [HttpGet("licenses/statistics")]
    [ProducesResponseType(typeof(LicenseStatisticsDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<LicenseStatisticsDto>> GetLicenseStatistics(
        CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogInformation("Fetching license statistics");
            var statistics = await _licenseService.GetLicenseStatisticsAsync(cancellationToken);
            return Ok(statistics);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogError(ex, "Failed to retrieve license statistics from Graph API");
            return Ok(new LicenseStatisticsDto
            {
                ErrorMessage = "Failed to retrieve license statistics. Please check Graph API permissions."
            });
        }
    }

    /// <summary>
    /// Exports license report as CSV.
    /// </summary>
    [HttpGet("licenses/export")]
    [ProducesResponseType(typeof(FileContentResult), StatusCodes.Status200OK)]
    public async Task<IActionResult> ExportLicenseReport(
        [FromQuery] string? skuId = null,
        CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogInformation("Exporting license report. SKU filter: {SkuId}", skuId);

            var users = await _licenseService.GetLicenseUsersAsync(skuId, cancellationToken: cancellationToken);
            var userList = users.ToList();

            var sb = new StringBuilder();
            sb.AppendLine("Naam,Email,Afdeling,Functie,Licenties");

            foreach (var user in userList)
            {
                var licenses = string.Join("; ", user.AssignedLicenses.Select(l => l.DisplayName));
                sb.AppendLine(string.Join(",",
                    EscapeCsv(user.DisplayName),
                    EscapeCsv(user.UserPrincipalName),
                    EscapeCsv(user.Department ?? ""),
                    EscapeCsv(user.JobTitle ?? ""),
                    EscapeCsv(licenses)
                ));
            }

            var bytes = Encoding.UTF8.GetBytes(sb.ToString());
            var fileName = $"ms365-licenties-{DateTime.UtcNow:yyyyMMdd}.csv";

            _logger.LogInformation("Exported license report with {Count} users", userList.Count);
            return File(bytes, "text/csv", fileName);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogError(ex, "Failed to export license report");
            var errorBytes = Encoding.UTF8.GetBytes("Error: Failed to retrieve license data. Please check Graph API permissions.");
            return File(errorBytes, "text/plain", "error.txt");
        }
    }

    /// <summary>
    /// Gets license optimization analysis with recommendations for cost savings.
    /// Identifies inactive users and potential license downgrades.
    /// </summary>
    /// <param name="inactiveDaysThreshold">Days since last sign-in to consider user inactive (default: 90)</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Optimization analysis with inactive users, downgrade recommendations, and potential savings</returns>
    [HttpGet("licenses/optimization")]
    [ProducesResponseType(typeof(LicenseOptimizationDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<LicenseOptimizationDto>> GetLicenseOptimization(
        [FromQuery] int inactiveDaysThreshold = 90,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Retrieving license optimization analysis. Inactive threshold: {Days} days", inactiveDaysThreshold);

        var result = await _licenseService.GetLicenseOptimizationAsync(inactiveDaysThreshold, cancellationToken);

        if (!string.IsNullOrEmpty(result.ErrorMessage))
        {
            _logger.LogWarning("License optimization returned error: {Error}", result.ErrorMessage);
        }
        else
        {
            _logger.LogInformation(
                "License optimization: {Inactive} inactive, {Downgrades} downgrades, €{Savings}/month savings",
                result.Summary.InactiveUserCount,
                result.Summary.DowngradeCandidateCount,
                result.Summary.EstimatedMonthlySavings);
        }

        return Ok(result);
    }

    // ========================================
    // Helper Methods
    // ========================================

    private static string EscapeCsv(string field)
    {
        if (string.IsNullOrEmpty(field))
            return "";

        if (field.Contains(',') || field.Contains('"') || field.Contains('\n') || field.Contains('\r'))
        {
            return $"\"{field.Replace("\"", "\"\"")}\"";
        }

        return field;
    }
}

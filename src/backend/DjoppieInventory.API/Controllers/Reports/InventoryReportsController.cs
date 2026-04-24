using DjoppieInventory.Core.DTOs;
using DjoppieInventory.Core.Entities;
using DjoppieInventory.Core.Entities.Enums;
using DjoppieInventory.Core.Interfaces;
using DjoppieInventory.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text;

namespace DjoppieInventory.API.Controllers.Reports;

/// <summary>
/// API controller for hardware inventory reports.
/// </summary>
[ApiController]
[Route("api/reports")]
[Authorize]
public class InventoryReportsController : ControllerBase
{
    private readonly IReportService _reportService;
    private readonly ApplicationDbContext _context;
    private readonly ILogger<InventoryReportsController> _logger;

    public InventoryReportsController(
        IReportService reportService,
        ApplicationDbContext context,
        ILogger<InventoryReportsController> logger)
    {
        _reportService = reportService;
        _context = context;
        _logger = logger;
    }

    // ========================================
    // Hardware Inventory Report
    // ========================================

    /// <summary>
    /// Gets hardware inventory snapshot (asset inventory report).
    /// Primary path: GET /api/reports/assets/snapshot
    /// Legacy alias: GET /api/reports/hardware (deprecated, removed after 1 release)
    /// </summary>
    [HttpGet("hardware")]
    [HttpGet("assets/snapshot")]
    [ProducesResponseType(typeof(IEnumerable<HardwareReportItemDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<HardwareReportItemDto>>> GetHardwareReport(
        [FromQuery] string? status = null,
        [FromQuery] int? assetTypeId = null,
        [FromQuery] int? categoryId = null,
        [FromQuery] int? serviceId = null,
        [FromQuery] int? buildingId = null,
        [FromQuery] string? search = null,
        CancellationToken cancellationToken = default)
    {
        var query = _context.Assets
            .Include(a => a.AssetType)
            .Include(a => a.Service)
            .Include(a => a.Building)
            .Include(a => a.Employee)
            .AsNoTracking();

        // Apply filters
        if (!string.IsNullOrEmpty(status) && Enum.TryParse<AssetStatus>(status, true, out var statusEnum))
        {
            query = query.Where(a => a.Status == statusEnum);
        }

        if (assetTypeId.HasValue)
        {
            query = query.Where(a => a.AssetTypeId == assetTypeId.Value);
        }

        if (serviceId.HasValue)
        {
            query = query.Where(a => a.ServiceId == serviceId.Value);
        }

        if (buildingId.HasValue)
        {
            query = query.Where(a => a.BuildingId == buildingId.Value);
        }

        if (!string.IsNullOrEmpty(search))
        {
            var searchLower = search.ToLower();
            query = query.Where(a =>
                a.AssetCode.ToLower().Contains(searchLower) ||
                (a.AssetName != null && a.AssetName.ToLower().Contains(searchLower)) ||
                (a.SerialNumber != null && a.SerialNumber.ToLower().Contains(searchLower)) ||
                (a.Owner != null && a.Owner.ToLower().Contains(searchLower)));
        }

        var assets = await query
            .OrderBy(a => a.AssetCode)
            .Select(a => new HardwareReportItemDto
            {
                Id = a.Id,
                AssetCode = a.AssetCode,
                Name = a.AssetName ?? "",
                AssetTypeName = a.AssetType != null ? a.AssetType.Name : a.Category ?? "",
                CategoryName = a.Category,
                Brand = a.Brand,
                Model = a.Model,
                SerialNumber = a.SerialNumber,
                Status = a.Status.ToString(),
                OwnerName = a.Owner,
                OwnerEmail = a.Owner,
                ServiceName = a.Service != null ? a.Service.Name : null,
                BuildingName = a.Building != null ? a.Building.Name : null,
                Location = a.OfficeLocation,
                PurchaseDate = a.PurchaseDate,
                InstallationDate = a.InstallationDate,
                WarrantyExpiration = a.WarrantyExpiry,
                CreatedAt = a.CreatedAt,
                UpdatedAt = a.UpdatedAt
            })
            .ToListAsync(cancellationToken);

        _logger.LogInformation("Hardware report generated with {Count} assets", assets.Count);
        return Ok(assets);
    }

    /// <summary>
    /// Gets hardware inventory snapshot summary statistics.
    /// Primary path: GET /api/reports/assets/snapshot/summary
    /// Legacy alias: GET /api/reports/hardware/summary (deprecated, removed after 1 release)
    /// </summary>
    [HttpGet("hardware/summary")]
    [HttpGet("assets/snapshot/summary")]
    [ProducesResponseType(typeof(HardwareReportSummaryDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<HardwareReportSummaryDto>> GetHardwareReportSummary(
        CancellationToken cancellationToken = default)
    {
        var assets = await _context.Assets
            .Include(a => a.AssetType)
            .Include(a => a.Service)
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        var summary = new HardwareReportSummaryDto
        {
            TotalAssets = assets.Count,
            ByStatus = assets
                .GroupBy(a => a.Status.ToString())
                .ToDictionary(g => g.Key, g => g.Count()),
            ByAssetType = assets
                .Where(a => a.AssetType != null)
                .GroupBy(a => a.AssetType!.Name)
                .ToDictionary(g => g.Key, g => g.Count()),
            ByService = assets
                .Where(a => a.Service != null)
                .GroupBy(a => a.Service!.Name)
                .ToDictionary(g => g.Key, g => g.Count())
        };

        return Ok(summary);
    }

    /// <summary>
    /// Exports hardware inventory snapshot as CSV.
    /// Primary path: GET /api/reports/assets/snapshot/export
    /// Legacy alias: GET /api/reports/hardware/export (deprecated, removed after 1 release)
    /// </summary>
    [HttpGet("hardware/export")]
    [HttpGet("assets/snapshot/export")]
    [ProducesResponseType(typeof(FileContentResult), StatusCodes.Status200OK)]
    public async Task<IActionResult> ExportHardwareReport(
        [FromQuery] string? status = null,
        [FromQuery] int? assetTypeId = null,
        [FromQuery] int? serviceId = null,
        [FromQuery] int? buildingId = null,
        CancellationToken cancellationToken = default)
    {
        var query = _context.Assets
            .Include(a => a.AssetType)
            .Include(a => a.Service)
            .Include(a => a.Building)
            .AsNoTracking();

        // Apply filters
        if (!string.IsNullOrEmpty(status) && Enum.TryParse<AssetStatus>(status, true, out var statusEnum))
        {
            query = query.Where(a => a.Status == statusEnum);
        }

        if (assetTypeId.HasValue)
        {
            query = query.Where(a => a.AssetTypeId == assetTypeId.Value);
        }

        if (serviceId.HasValue)
        {
            query = query.Where(a => a.ServiceId == serviceId.Value);
        }

        if (buildingId.HasValue)
        {
            query = query.Where(a => a.BuildingId == buildingId.Value);
        }

        var assets = await query.OrderBy(a => a.AssetCode).ToListAsync(cancellationToken);

        var sb = new StringBuilder();
        sb.AppendLine("AssetCode,Name,Type,Status,Owner,SerialNumber,Brand,Model,Service,Building,InstallationDate");

        foreach (var a in assets)
        {
            sb.AppendLine(string.Join(",",
                EscapeCsv(a.AssetCode),
                EscapeCsv(a.AssetName ?? ""),
                EscapeCsv(a.AssetType?.Name ?? a.Category ?? ""),
                a.Status.ToString(),
                EscapeCsv(a.Owner ?? ""),
                EscapeCsv(a.SerialNumber ?? ""),
                EscapeCsv(a.Brand ?? ""),
                EscapeCsv(a.Model ?? ""),
                EscapeCsv(a.Service?.Name ?? ""),
                EscapeCsv(a.Building?.Name ?? ""),
                a.InstallationDate?.ToString("yyyy-MM-dd") ?? ""
            ));
        }

        var bytes = Encoding.UTF8.GetBytes(sb.ToString());
        var fileName = $"hardware-inventaris-{DateTime.UtcNow:yyyyMMdd}.csv";

        _logger.LogInformation("Exported hardware report with {Count} assets", assets.Count);
        return File(bytes, "text/csv", fileName);
    }

    /// <summary>
    /// Update a single asset's serial number.
    /// </summary>
    [HttpPatch("assets/{assetId}/serial")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult> UpdateAssetSerialNumber(
        int assetId,
        [FromBody] SerialNumberUpdateDto request,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request.SerialNumber))
        {
            return BadRequest(new { message = "Serienummer mag niet leeg zijn" });
        }

        var asset = await _context.Assets.FindAsync(new object[] { assetId }, cancellationToken);
        if (asset == null)
        {
            return NotFound(new { message = $"Asset {assetId} niet gevonden" });
        }

        asset.SerialNumber = request.SerialNumber.Trim();
        asset.UpdatedAt = DateTime.UtcNow;

        // Also update any assignments that reference this asset
        var assignments = await _context.WorkplaceAssetAssignments
            .Where(a => a.NewAssetId == assetId)
            .ToListAsync(cancellationToken);

        foreach (var assignment in assignments)
        {
            assignment.SerialNumberCaptured = request.SerialNumber.Trim();
            assignment.UpdatedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Updated serial number for asset {AssetId} to {SerialNumber}",
            assetId, request.SerialNumber);

        return Ok(new { message = "Serienummer bijgewerkt", serialNumber = request.SerialNumber.Trim() });
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

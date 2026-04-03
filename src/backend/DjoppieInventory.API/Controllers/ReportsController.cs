using DjoppieInventory.Core.DTOs;
using DjoppieInventory.Core.Entities;
using DjoppieInventory.Core.Entities.Enums;
using DjoppieInventory.Core.Interfaces;
using DjoppieInventory.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text;

namespace DjoppieInventory.API.Controllers;

/// <summary>
/// API controller for generating various reports.
/// Provides hardware inventory, workplace, swap history, licenses, and lease reports.
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ReportsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ILicenseService _licenseService;
    private readonly ILogger<ReportsController> _logger;

    public ReportsController(
        ApplicationDbContext context,
        ILicenseService licenseService,
        ILogger<ReportsController> logger)
    {
        _context = context;
        _licenseService = licenseService;
        _logger = logger;
    }

    // ========================================
    // Hardware Inventory Report
    // ========================================

    /// <summary>
    /// Gets hardware inventory report with optional filters.
    /// </summary>
    [HttpGet("hardware")]
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
    /// Gets hardware inventory summary statistics.
    /// </summary>
    [HttpGet("hardware/summary")]
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
    /// Exports hardware report as CSV.
    /// </summary>
    [HttpGet("hardware/export")]
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

    // ========================================
    // Workplace Report
    // ========================================

    /// <summary>
    /// Gets workplace report.
    /// </summary>
    [HttpGet("workplaces")]
    [ProducesResponseType(typeof(IEnumerable<WorkplaceReportItemDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<WorkplaceReportItemDto>>> GetWorkplaceReport(
        CancellationToken cancellationToken = default)
    {
        var workplaces = await _context.PhysicalWorkplaces
            .Include(pw => pw.Building)
            .Include(pw => pw.Service)
            .Where(pw => pw.IsActive)
            .AsNoTracking()
            .OrderBy(pw => pw.Building.Name)
            .ThenBy(pw => pw.Code)
            .Select(pw => new WorkplaceReportItemDto
            {
                Id = pw.Id,
                Code = pw.Code,
                Name = pw.Name,
                BuildingName = pw.Building != null ? pw.Building.Name : null,
                Floor = pw.Floor,
                Room = pw.Room,
                OccupantName = pw.CurrentOccupantName,
                OccupantEmail = pw.CurrentOccupantEmail,
                ServiceName = pw.Service != null ? pw.Service.Name : null,
                IsOccupied = pw.CurrentOccupantName != null || pw.CurrentOccupantEmail != null,
                EquipmentCount = (pw.DockingStationAssetId.HasValue ? 1 : 0) +
                    (pw.Monitor1AssetId.HasValue ? 1 : 0) +
                    (pw.Monitor2AssetId.HasValue ? 1 : 0) +
                    (pw.Monitor3AssetId.HasValue ? 1 : 0) +
                    (pw.KeyboardAssetId.HasValue ? 1 : 0) +
                    (pw.MouseAssetId.HasValue ? 1 : 0),
                CreatedAt = pw.CreatedAt,
                UpdatedAt = pw.UpdatedAt
            })
            .ToListAsync(cancellationToken);

        _logger.LogInformation("Workplace report generated with {Count} workplaces", workplaces.Count);
        return Ok(workplaces);
    }

    /// <summary>
    /// Gets workplace report summary (occupancy stats).
    /// </summary>
    [HttpGet("workplaces/summary")]
    [ProducesResponseType(typeof(WorkplaceReportSummaryDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<WorkplaceReportSummaryDto>> GetWorkplaceReportSummary(
        CancellationToken cancellationToken = default)
    {
        var workplaces = await _context.PhysicalWorkplaces
            .Include(pw => pw.Building)
            .Where(pw => pw.IsActive)
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        var totalWorkplaces = workplaces.Count;
        var occupiedWorkplaces = workplaces.Count(pw =>
            pw.CurrentOccupantName != null || pw.CurrentOccupantEmail != null);
        var availableWorkplaces = totalWorkplaces - occupiedWorkplaces;

        var summary = new WorkplaceReportSummaryDto
        {
            TotalWorkplaces = totalWorkplaces,
            OccupiedWorkplaces = occupiedWorkplaces,
            AvailableWorkplaces = availableWorkplaces,
            OccupancyRate = totalWorkplaces > 0
                ? (int)Math.Round((double)occupiedWorkplaces / totalWorkplaces * 100)
                : 0,
            ByBuilding = workplaces
                .Where(pw => pw.Building != null)
                .GroupBy(pw => pw.Building!.Name)
                .ToDictionary(
                    g => g.Key,
                    g => new BuildingOccupancyData
                    {
                        Total = g.Count(),
                        Occupied = g.Count(pw => pw.CurrentOccupantName != null || pw.CurrentOccupantEmail != null)
                    })
        };

        return Ok(summary);
    }

    /// <summary>
    /// Exports workplace report as CSV.
    /// </summary>
    [HttpGet("workplaces/export")]
    [ProducesResponseType(typeof(FileContentResult), StatusCodes.Status200OK)]
    public async Task<IActionResult> ExportWorkplaceReport(
        CancellationToken cancellationToken = default)
    {
        var workplaces = await _context.PhysicalWorkplaces
            .Include(pw => pw.Building)
            .Include(pw => pw.Service)
            .Where(pw => pw.IsActive)
            .AsNoTracking()
            .OrderBy(pw => pw.Building.Name)
            .ThenBy(pw => pw.Code)
            .ToListAsync(cancellationToken);

        var sb = new StringBuilder();
        sb.AppendLine("Code,Name,Building,Floor,Room,Occupant,Email,Service,HasDocking,MonitorCount");

        foreach (var pw in workplaces)
        {
            sb.AppendLine(string.Join(",",
                EscapeCsv(pw.Code),
                EscapeCsv(pw.Name),
                EscapeCsv(pw.Building?.Name ?? ""),
                EscapeCsv(pw.Floor ?? ""),
                EscapeCsv(pw.Room ?? ""),
                EscapeCsv(pw.CurrentOccupantName ?? ""),
                EscapeCsv(pw.CurrentOccupantEmail ?? ""),
                EscapeCsv(pw.Service?.Name ?? ""),
                pw.HasDockingStation,
                pw.MonitorCount
            ));
        }

        var bytes = Encoding.UTF8.GetBytes(sb.ToString());
        var fileName = $"werkplekken-{DateTime.UtcNow:yyyyMMdd}.csv";

        _logger.LogInformation("Exported workplace report with {Count} workplaces", workplaces.Count);
        return File(bytes, "text/csv", fileName);
    }

    // ========================================
    // Swap History Report
    // ========================================

    /// <summary>
    /// Gets swap history (asset events).
    /// </summary>
    [HttpGet("swaps")]
    [ProducesResponseType(typeof(IEnumerable<SwapHistoryItemDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<SwapHistoryItemDto>>> GetSwapHistory(
        [FromQuery] string? dateFrom = null,
        [FromQuery] string? dateTo = null,
        [FromQuery] int? technicianId = null,
        [FromQuery] int? serviceId = null,
        [FromQuery] string? search = null,
        CancellationToken cancellationToken = default)
    {
        var query = _context.AssetEvents
            .Include(e => e.Asset)
            .ThenInclude(a => a!.Service)
            .AsNoTracking();

        // Filter to swap-related events
        query = query.Where(e =>
            e.EventType == AssetEventType.StatusChanged ||
            e.EventType == AssetEventType.OwnerChanged ||
            e.EventType == AssetEventType.LaptopSwapped ||
            e.EventType == AssetEventType.DeviceOnboarded ||
            e.EventType == AssetEventType.DeviceOffboarded);

        // Apply date filters
        if (!string.IsNullOrEmpty(dateFrom) && DateTime.TryParse(dateFrom, out var fromDate))
        {
            query = query.Where(e => e.EventDate >= fromDate);
        }

        if (!string.IsNullOrEmpty(dateTo) && DateTime.TryParse(dateTo, out var toDate))
        {
            query = query.Where(e => e.EventDate <= toDate.AddDays(1));
        }

        if (serviceId.HasValue)
        {
            query = query.Where(e => e.Asset != null && e.Asset.ServiceId == serviceId.Value);
        }

        if (!string.IsNullOrEmpty(search))
        {
            var searchLower = search.ToLower();
            query = query.Where(e =>
                (e.Asset != null && e.Asset.AssetCode.ToLower().Contains(searchLower)) ||
                (e.Asset != null && e.Asset.Owner != null && e.Asset.Owner.ToLower().Contains(searchLower)) ||
                (e.PerformedBy != null && e.PerformedBy.ToLower().Contains(searchLower)));
        }

        var events = await query
            .OrderByDescending(e => e.EventDate)
            .Take(500)
            .Select(e => new SwapHistoryItemDto
            {
                Id = e.Id,
                SwapDate = e.EventDate.ToString("yyyy-MM-dd"),
                UserName = e.Asset != null ? e.Asset.Owner : null,
                UserEmail = e.Asset != null ? e.Asset.Owner : null,
                ServiceName = e.Asset != null && e.Asset.Service != null ? e.Asset.Service.Name : null,
                TechnicianName = e.PerformedBy,
                TechnicianEmail = e.PerformedBy,
                OldAssetCode = e.OldValue,
                OldAssetName = null,
                NewAssetCode = e.Asset != null ? e.Asset.AssetCode : null,
                NewAssetName = e.Asset != null ? e.Asset.AssetName : null,
                Location = e.Asset != null ? e.Asset.OfficeLocation : null,
                Notes = e.Notes,
                RolloutSessionId = null,
                RolloutSessionName = null
            })
            .ToListAsync(cancellationToken);

        _logger.LogInformation("Swap history report generated with {Count} events", events.Count);
        return Ok(events);
    }

    /// <summary>
    /// Gets swap history summary.
    /// </summary>
    [HttpGet("swaps/summary")]
    [ProducesResponseType(typeof(SwapHistorySummaryDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<SwapHistorySummaryDto>> GetSwapHistorySummary(
        [FromQuery] string? dateFrom = null,
        [FromQuery] string? dateTo = null,
        CancellationToken cancellationToken = default)
    {
        var query = _context.AssetEvents
            .Include(e => e.Asset)
            .ThenInclude(a => a!.Service)
            .AsNoTracking();

        // Filter to swap-related events
        query = query.Where(e =>
            e.EventType == AssetEventType.StatusChanged ||
            e.EventType == AssetEventType.OwnerChanged ||
            e.EventType == AssetEventType.LaptopSwapped ||
            e.EventType == AssetEventType.DeviceOnboarded ||
            e.EventType == AssetEventType.DeviceOffboarded);

        // Apply date filters
        if (!string.IsNullOrEmpty(dateFrom) && DateTime.TryParse(dateFrom, out var fromDate))
        {
            query = query.Where(e => e.EventDate >= fromDate);
        }

        if (!string.IsNullOrEmpty(dateTo) && DateTime.TryParse(dateTo, out var toDate))
        {
            query = query.Where(e => e.EventDate <= toDate.AddDays(1));
        }

        var events = await query.ToListAsync(cancellationToken);

        var summary = new SwapHistorySummaryDto
        {
            TotalSwaps = events.Count,
            ByTechnician = events
                .Where(e => !string.IsNullOrEmpty(e.PerformedBy))
                .GroupBy(e => e.PerformedBy!)
                .ToDictionary(g => g.Key, g => g.Count()),
            ByService = events
                .Where(e => e.Asset?.Service != null)
                .GroupBy(e => e.Asset!.Service!.Name)
                .ToDictionary(g => g.Key, g => g.Count()),
            ByMonth = events
                .GroupBy(e => e.EventDate.ToString("yyyy-MM"))
                .OrderBy(g => g.Key)
                .Select(g => new MonthlyCount { Month = g.Key, Count = g.Count() })
                .ToList()
        };

        return Ok(summary);
    }

    /// <summary>
    /// Exports swap history as CSV.
    /// </summary>
    [HttpGet("swaps/export")]
    [ProducesResponseType(typeof(FileContentResult), StatusCodes.Status200OK)]
    public async Task<IActionResult> ExportSwapHistory(
        [FromQuery] string? dateFrom = null,
        [FromQuery] string? dateTo = null,
        [FromQuery] int? serviceId = null,
        CancellationToken cancellationToken = default)
    {
        var query = _context.AssetEvents
            .Include(e => e.Asset)
            .ThenInclude(a => a!.Service)
            .AsNoTracking();

        query = query.Where(e =>
            e.EventType == AssetEventType.StatusChanged ||
            e.EventType == AssetEventType.OwnerChanged ||
            e.EventType == AssetEventType.LaptopSwapped ||
            e.EventType == AssetEventType.DeviceOnboarded ||
            e.EventType == AssetEventType.DeviceOffboarded);

        if (!string.IsNullOrEmpty(dateFrom) && DateTime.TryParse(dateFrom, out var fromDate))
        {
            query = query.Where(e => e.EventDate >= fromDate);
        }

        if (!string.IsNullOrEmpty(dateTo) && DateTime.TryParse(dateTo, out var toDate))
        {
            query = query.Where(e => e.EventDate <= toDate.AddDays(1));
        }

        if (serviceId.HasValue)
        {
            query = query.Where(e => e.Asset != null && e.Asset.ServiceId == serviceId.Value);
        }

        var events = await query
            .OrderByDescending(e => e.EventDate)
            .ToListAsync(cancellationToken);

        var sb = new StringBuilder();
        sb.AppendLine("Date,AssetCode,EventType,User,Technician,Service,Notes");

        foreach (var e in events)
        {
            sb.AppendLine(string.Join(",",
                e.EventDate.ToString("yyyy-MM-dd HH:mm"),
                EscapeCsv(e.Asset?.AssetCode ?? ""),
                EscapeCsv(e.EventType.ToString()),
                EscapeCsv(e.Asset?.Owner ?? ""),
                EscapeCsv(e.PerformedBy ?? ""),
                EscapeCsv(e.Asset?.Service?.Name ?? ""),
                EscapeCsv(e.Notes ?? "")
            ));
        }

        var bytes = Encoding.UTF8.GetBytes(sb.ToString());
        var fileName = $"swap-geschiedenis-{DateTime.UtcNow:yyyyMMdd}.csv";

        _logger.LogInformation("Exported swap history with {Count} events", events.Count);
        return File(bytes, "text/csv", fileName);
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
    // Lease Report
    // ========================================

    /// <summary>
    /// Gets lease contracts for report.
    /// </summary>
    [HttpGet("leases")]
    [ProducesResponseType(typeof(IEnumerable<LeaseReportItemDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<LeaseReportItemDto>>> GetLeaseReport(
        [FromQuery] string? status = null,
        [FromQuery] int? vendorId = null,
        [FromQuery] int? expiringWithinDays = null,
        CancellationToken cancellationToken = default)
    {
        var query = _context.LeaseContracts
            .Include(lc => lc.Asset)
            .AsNoTracking();

        var now = DateTime.UtcNow.Date;

        var contracts = await query.ToListAsync(cancellationToken);

        // Group by contract number to aggregate assets
        var grouped = contracts
            .GroupBy(c => c.ContractNumber ?? $"LC-{c.Id}")
            .Select(g => {
                var first = g.First();
                var endDate = first.EndDate;
                var daysUntil = (endDate - now).Days;

                string contractStatus;
                if (endDate < now)
                    contractStatus = "expired";
                else if (daysUntil <= 90)
                    contractStatus = "expiring";
                else
                    contractStatus = "active";

                return new LeaseReportItemDto
                {
                    Id = first.Id,
                    ContractNumber = g.Key,
                    VendorName = first.Vendor ?? "Onbekend",
                    StartDate = first.StartDate.ToString("yyyy-MM-dd"),
                    EndDate = first.EndDate.ToString("yyyy-MM-dd"),
                    MonthlyAmount = first.MonthlyRate,
                    TotalValue = first.TotalValue,
                    AssetCount = g.Count(),
                    Assets = g.Select(c => new LeaseAssetItemDto
                    {
                        AssetId = c.AssetId,
                        AssetCode = c.Asset?.AssetCode ?? "",
                        AssetName = c.Asset?.AssetName,
                        SerialNumber = c.Asset?.SerialNumber
                    }).ToList(),
                    Status = contractStatus,
                    DaysUntilExpiration = daysUntil > 0 ? daysUntil : null,
                    Notes = first.Notes
                };
            });

        // Apply status filter
        if (!string.IsNullOrEmpty(status) && status != "all")
        {
            grouped = grouped.Where(c => c.Status == status);
        }

        // Apply expiring filter
        if (expiringWithinDays.HasValue)
        {
            grouped = grouped.Where(c =>
                c.DaysUntilExpiration.HasValue &&
                c.DaysUntilExpiration.Value <= expiringWithinDays.Value &&
                c.DaysUntilExpiration.Value >= 0);
        }

        var result = grouped.OrderBy(c => c.EndDate).ToList();

        _logger.LogInformation("Lease report generated with {Count} contracts", result.Count);
        return Ok(result);
    }

    /// <summary>
    /// Gets lease report summary.
    /// </summary>
    [HttpGet("leases/summary")]
    [ProducesResponseType(typeof(LeaseReportSummaryDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<LeaseReportSummaryDto>> GetLeaseReportSummary(
        CancellationToken cancellationToken = default)
    {
        var contracts = await _context.LeaseContracts
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        var now = DateTime.UtcNow.Date;

        // Group by contract number
        var grouped = contracts
            .GroupBy(c => c.ContractNumber ?? $"LC-{c.Id}")
            .Select(g => {
                var first = g.First();
                var endDate = first.EndDate;
                var daysUntil = (endDate - now).Days;

                string status;
                if (endDate < now)
                    status = "expired";
                else if (daysUntil <= 90)
                    status = "expiring";
                else
                    status = "active";

                return new { first.Vendor, first.MonthlyRate, Status = status };
            })
            .ToList();

        var summary = new LeaseReportSummaryDto
        {
            TotalContracts = grouped.Count,
            ActiveContracts = grouped.Count(c => c.Status == "active"),
            ExpiringContracts = grouped.Count(c => c.Status == "expiring"),
            ExpiredContracts = grouped.Count(c => c.Status == "expired"),
            TotalMonthlyAmount = grouped.Sum(c => c.MonthlyRate ?? 0),
            ContractsByVendor = grouped
                .Where(c => !string.IsNullOrEmpty(c.Vendor))
                .GroupBy(c => c.Vendor!)
                .ToDictionary(g => g.Key, g => g.Count())
        };

        return Ok(summary);
    }

    /// <summary>
    /// Exports lease report as CSV.
    /// </summary>
    [HttpGet("leases/export")]
    [ProducesResponseType(typeof(FileContentResult), StatusCodes.Status200OK)]
    public async Task<IActionResult> ExportLeaseReport(
        [FromQuery] string? status = null,
        [FromQuery] int? expiringWithinDays = null,
        CancellationToken cancellationToken = default)
    {
        var contracts = await _context.LeaseContracts
            .Include(c => c.Asset)
            .AsNoTracking()
            .OrderBy(c => c.EndDate)
            .ToListAsync(cancellationToken);

        var sb = new StringBuilder();
        sb.AppendLine("ContractNumber,Vendor,StartDate,EndDate,MonthlyAmount,AssetCode,AssetName,SerialNumber");

        foreach (var c in contracts)
        {
            sb.AppendLine(string.Join(",",
                EscapeCsv(c.ContractNumber ?? ""),
                EscapeCsv(c.Vendor ?? ""),
                c.StartDate.ToString("yyyy-MM-dd"),
                c.EndDate.ToString("yyyy-MM-dd"),
                c.MonthlyRate?.ToString("F2") ?? "",
                EscapeCsv(c.Asset?.AssetCode ?? ""),
                EscapeCsv(c.Asset?.AssetName ?? ""),
                EscapeCsv(c.Asset?.SerialNumber ?? "")
            ));
        }

        var bytes = Encoding.UTF8.GetBytes(sb.ToString());
        var fileName = $"lease-contracten-{DateTime.UtcNow:yyyyMMdd}.csv";

        _logger.LogInformation("Exported lease report with {Count} contracts", contracts.Count);
        return File(bytes, "text/csv", fileName);
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

// ========================================
// DTO Classes
// ========================================

public class HardwareReportItemDto
{
    public int Id { get; set; }
    public string AssetCode { get; set; } = "";
    public string Name { get; set; } = "";
    public string AssetTypeName { get; set; } = "";
    public string? CategoryName { get; set; }
    public string? Brand { get; set; }
    public string? Model { get; set; }
    public string? SerialNumber { get; set; }
    public string Status { get; set; } = "";
    public string? OwnerName { get; set; }
    public string? OwnerEmail { get; set; }
    public string? ServiceName { get; set; }
    public string? BuildingName { get; set; }
    public string? Location { get; set; }
    public string? IntuneDeviceId { get; set; }
    public string? IntuneComplianceState { get; set; }
    public DateTime? IntuneLastSync { get; set; }
    public DateTime? PurchaseDate { get; set; }
    public DateTime? InstallationDate { get; set; }
    public DateTime? WarrantyExpiration { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class HardwareReportSummaryDto
{
    public int TotalAssets { get; set; }
    public Dictionary<string, int> ByStatus { get; set; } = new();
    public Dictionary<string, int> ByAssetType { get; set; } = new();
    public Dictionary<string, int> ByService { get; set; } = new();
}

public class WorkplaceReportItemDto
{
    public int Id { get; set; }
    public string Code { get; set; } = "";
    public string Name { get; set; } = "";
    public string? BuildingName { get; set; }
    public string? Floor { get; set; }
    public string? Room { get; set; }
    public string? OccupantName { get; set; }
    public string? OccupantEmail { get; set; }
    public string? ServiceName { get; set; }
    public bool IsOccupied { get; set; }
    public int EquipmentCount { get; set; }
    public List<WorkplaceEquipmentItemDto> Equipment { get; set; } = new();
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class WorkplaceEquipmentItemDto
{
    public int AssetId { get; set; }
    public string AssetCode { get; set; } = "";
    public string? AssetName { get; set; }
    public string EquipmentType { get; set; } = "";
    public string? Brand { get; set; }
    public string? Model { get; set; }
}

public class WorkplaceReportSummaryDto
{
    public int TotalWorkplaces { get; set; }
    public int OccupiedWorkplaces { get; set; }
    public int AvailableWorkplaces { get; set; }
    public int OccupancyRate { get; set; }
    public Dictionary<string, BuildingOccupancyData> ByBuilding { get; set; } = new();
}

public class BuildingOccupancyData
{
    public int Total { get; set; }
    public int Occupied { get; set; }
}

public class SwapHistoryItemDto
{
    public int Id { get; set; }
    public string SwapDate { get; set; } = "";
    public string? UserName { get; set; }
    public string? UserEmail { get; set; }
    public string? ServiceName { get; set; }
    public string? TechnicianName { get; set; }
    public string? TechnicianEmail { get; set; }
    public string? OldAssetCode { get; set; }
    public string? OldAssetName { get; set; }
    public string? OldSerialNumber { get; set; }
    public string? NewAssetCode { get; set; }
    public string? NewAssetName { get; set; }
    public string? NewSerialNumber { get; set; }
    public string? Location { get; set; }
    public string? Notes { get; set; }
    public int? RolloutSessionId { get; set; }
    public string? RolloutSessionName { get; set; }
}

public class SwapHistorySummaryDto
{
    public int TotalSwaps { get; set; }
    public Dictionary<string, int> ByTechnician { get; set; } = new();
    public Dictionary<string, int> ByService { get; set; } = new();
    public List<MonthlyCount> ByMonth { get; set; } = new();
}

public class MonthlyCount
{
    public string Month { get; set; } = "";
    public int Count { get; set; }
}

// License DTOs are defined in DjoppieInventory.Core.DTOs.LicenseDtos

public class LeaseReportItemDto
{
    public int Id { get; set; }
    public string ContractNumber { get; set; } = "";
    public string VendorName { get; set; } = "";
    public string StartDate { get; set; } = "";
    public string EndDate { get; set; } = "";
    public decimal? MonthlyAmount { get; set; }
    public decimal? TotalValue { get; set; }
    public int AssetCount { get; set; }
    public List<LeaseAssetItemDto> Assets { get; set; } = new();
    public string Status { get; set; } = "";
    public int? DaysUntilExpiration { get; set; }
    public string? Notes { get; set; }
}

public class LeaseAssetItemDto
{
    public int AssetId { get; set; }
    public string AssetCode { get; set; } = "";
    public string? AssetName { get; set; }
    public string? SerialNumber { get; set; }
}

public class LeaseReportSummaryDto
{
    public int TotalContracts { get; set; }
    public int ActiveContracts { get; set; }
    public int ExpiringContracts { get; set; }
    public int ExpiredContracts { get; set; }
    public decimal TotalMonthlyAmount { get; set; }
    public Dictionary<string, int> ContractsByVendor { get; set; } = new();
}

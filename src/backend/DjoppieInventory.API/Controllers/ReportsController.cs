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
    private readonly IReportService _reportService;
    private readonly ApplicationDbContext _context; // Keep for endpoints not yet migrated to service
    private readonly ILicenseService _licenseService;
    private readonly ILogger<ReportsController> _logger;

    public ReportsController(
        IReportService reportService,
        ApplicationDbContext context,
        ILicenseService licenseService,
        ILogger<ReportsController> logger)
    {
        _reportService = reportService;
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
    // Rollout Session Reports
    // ========================================

    /// <summary>
    /// Gets rollout session overview with KPIs and breakdowns.
    /// </summary>
    [HttpGet("rollout/sessions/{sessionId}/overview")]
    [ProducesResponseType(typeof(RolloutSessionOverviewDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<RolloutSessionOverviewDto>> GetRolloutSessionOverview(
        int sessionId,
        [FromQuery] List<int>? serviceIds = null,
        [FromQuery] List<int>? buildingIds = null,
        CancellationToken cancellationToken = default)
    {
        var session = await _context.RolloutSessions
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.Id == sessionId, cancellationToken);

        if (session == null)
            return NotFound($"Session {sessionId} not found");

        // Get all workplaces for this session with filters
        var workplacesQuery = _context.RolloutWorkplaces
            .Include(w => w.RolloutDay)
            .Include(w => w.Service).ThenInclude(s => s!.Sector)
            .Include(w => w.Building)
            .Include(w => w.AssetAssignments).ThenInclude(a => a.NewAsset)
            .Include(w => w.AssetAssignments).ThenInclude(a => a.OldAsset)
            .Where(w => w.RolloutDay.RolloutSessionId == sessionId)
            .AsNoTracking();

        if (serviceIds != null && serviceIds.Count > 0)
            workplacesQuery = workplacesQuery.Where(w => w.ServiceId.HasValue && serviceIds.Contains(w.ServiceId.Value));

        if (buildingIds != null && buildingIds.Count > 0)
            workplacesQuery = workplacesQuery.Where(w => w.BuildingId.HasValue && buildingIds.Contains(w.BuildingId.Value));

        var workplaces = await workplacesQuery.ToListAsync(cancellationToken);

        // Calculate statistics
        var totalWorkplaces = workplaces.Count;
        var completedWorkplaces = workplaces.Count(w => w.Status == RolloutWorkplaceStatus.Completed);
        var pendingWorkplaces = workplaces.Count(w => w.Status == RolloutWorkplaceStatus.Pending || w.Status == RolloutWorkplaceStatus.Ready);
        var inProgressWorkplaces = workplaces.Count(w => w.Status == RolloutWorkplaceStatus.InProgress);

        var allAssignments = workplaces.SelectMany(w => w.AssetAssignments).ToList();
        var totalNewAssets = allAssignments.Count(a => a.NewAssetId.HasValue);
        var installedAssets = allAssignments.Count(a => a.Status == AssetAssignmentStatus.Installed);
        var oldAssetsDecommissioned = allAssignments.Count(a => a.OldAssetId.HasValue && a.Status == AssetAssignmentStatus.Installed);
        var qrCodesApplied = allAssignments.Count(a => a.QrCodeApplied == true);
        var missingQrCodes = allAssignments.Count(a => a.QRCodeRequired && a.QrCodeApplied != true);

        // Sector breakdown
        var sectorBreakdown = workplaces
            .Where(w => w.Service?.Sector != null)
            .GroupBy(w => w.Service!.Sector!)
            .Select(g => new RolloutSectorBreakdownDto
            {
                SectorId = g.Key.Id,
                SectorName = g.Key.Name,
                TotalWorkplaces = g.Count(),
                CompletedWorkplaces = g.Count(w => w.Status == RolloutWorkplaceStatus.Completed),
                CompletionPercentage = g.Count() > 0 ? Math.Round((decimal)g.Count(w => w.Status == RolloutWorkplaceStatus.Completed) / g.Count() * 100, 1) : 0,
                Services = g.GroupBy(w => w.Service!)
                    .Select(sg => new RolloutServiceBreakdownDto
                    {
                        ServiceId = sg.Key.Id,
                        ServiceName = sg.Key.Name,
                        TotalWorkplaces = sg.Count(),
                        CompletedWorkplaces = sg.Count(w => w.Status == RolloutWorkplaceStatus.Completed),
                        CompletionPercentage = sg.Count() > 0 ? Math.Round((decimal)sg.Count(w => w.Status == RolloutWorkplaceStatus.Completed) / sg.Count() * 100, 1) : 0
                    }).ToList()
            }).ToList();

        // Building breakdown
        var buildingBreakdown = workplaces
            .Where(w => w.Building != null)
            .GroupBy(w => w.Building!)
            .Select(g => new RolloutBuildingBreakdownDto
            {
                BuildingId = g.Key.Id,
                BuildingName = g.Key.Name,
                TotalWorkplaces = g.Count(),
                CompletedWorkplaces = g.Count(w => w.Status == RolloutWorkplaceStatus.Completed),
                CompletionPercentage = g.Count() > 0 ? Math.Round((decimal)g.Count(w => w.Status == RolloutWorkplaceStatus.Completed) / g.Count() * 100, 1) : 0
            }).ToList();

        // Timeline
        var timeline = workplaces
            .GroupBy(w => w.RolloutDay.Date.Date)
            .OrderBy(g => g.Key)
            .Select(g => new RolloutProgressTimelineDto
            {
                Date = g.Key,
                PlannedWorkplaces = g.Count(),
                CompletedWorkplaces = g.Count(w => w.Status == RolloutWorkplaceStatus.Completed)
            }).ToList();

        // Calculate cumulative
        var cumulative = 0;
        for (var i = 0; i < timeline.Count; i++)
        {
            cumulative += timeline[i].CompletedWorkplaces;
            timeline[i] = timeline[i] with { CumulativeCompleted = cumulative };
        }

        var overview = new RolloutSessionOverviewDto
        {
            TotalWorkplaces = totalWorkplaces,
            CompletedWorkplaces = completedWorkplaces,
            PendingWorkplaces = pendingWorkplaces,
            InProgressWorkplaces = inProgressWorkplaces,
            CompletionPercentage = totalWorkplaces > 0 ? Math.Round((decimal)completedWorkplaces / totalWorkplaces * 100, 1) : 0,
            TotalNewAssets = totalNewAssets,
            InstalledAssets = installedAssets,
            OldAssetsDecommissioned = oldAssetsDecommissioned,
            QrCodesApplied = qrCodesApplied,
            MissingQrCodes = missingQrCodes,
            SectorBreakdown = sectorBreakdown,
            BuildingBreakdown = buildingBreakdown,
            Timeline = timeline
        };

        _logger.LogInformation("Generated rollout overview for session {SessionId}: {Completed}/{Total} workplaces",
            sessionId, completedWorkplaces, totalWorkplaces);

        return Ok(overview);
    }

    /// <summary>
    /// Gets SWAP checklist for a rollout session.
    /// </summary>
    [HttpGet("rollout/sessions/{sessionId}/checklist")]
    [ProducesResponseType(typeof(List<RolloutDayChecklistDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<List<RolloutDayChecklistDto>>> GetRolloutChecklist(
        int sessionId,
        [FromQuery] List<int>? serviceIds = null,
        [FromQuery] List<int>? buildingIds = null,
        [FromQuery] string? status = null,
        CancellationToken cancellationToken = default)
    {
        var session = await _context.RolloutSessions
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.Id == sessionId, cancellationToken);

        if (session == null)
            return NotFound($"Session {sessionId} not found");

        var daysQuery = _context.RolloutDays
            .Include(d => d.Workplaces).ThenInclude(w => w.Service)
            .Include(d => d.Workplaces).ThenInclude(w => w.Building)
            .Include(d => d.Workplaces).ThenInclude(w => w.PhysicalWorkplace)
            .Include(d => d.Workplaces).ThenInclude(w => w.AssetAssignments).ThenInclude(a => a.AssetType)
            .Include(d => d.Workplaces).ThenInclude(w => w.AssetAssignments).ThenInclude(a => a.NewAsset)
            .Include(d => d.Workplaces).ThenInclude(w => w.AssetAssignments).ThenInclude(a => a.OldAsset)
            .Where(d => d.RolloutSessionId == sessionId)
            .OrderBy(d => d.Date)
            .AsNoTracking();

        var days = await daysQuery.ToListAsync(cancellationToken);

        var checklist = new List<RolloutDayChecklistDto>();

        foreach (var day in days)
        {
            var filteredWorkplaces = day.Workplaces.AsEnumerable();

            if (serviceIds != null && serviceIds.Count > 0)
                filteredWorkplaces = filteredWorkplaces.Where(w => w.ServiceId.HasValue && serviceIds.Contains(w.ServiceId.Value));

            if (buildingIds != null && buildingIds.Count > 0)
                filteredWorkplaces = filteredWorkplaces.Where(w => w.BuildingId.HasValue && buildingIds.Contains(w.BuildingId.Value));

            if (!string.IsNullOrEmpty(status) && Enum.TryParse<RolloutWorkplaceStatus>(status, true, out var statusEnum))
                filteredWorkplaces = filteredWorkplaces.Where(w => w.Status == statusEnum);

            var workplaceList = filteredWorkplaces.ToList();
            if (workplaceList.Count == 0) continue;

            var dayChecklist = new RolloutDayChecklistDto
            {
                DayId = day.Id,
                Date = day.Date,
                Notes = day.Notes,
                TotalWorkplaces = workplaceList.Count,
                CompletedWorkplaces = workplaceList.Count(w => w.Status == RolloutWorkplaceStatus.Completed),
                Workplaces = workplaceList
                    .OrderBy(w => w.Service?.Name)
                    .ThenBy(w => w.PhysicalWorkplace?.Name)
                    .Select(w => MapToWorkplaceChecklist(w))
                    .ToList()
            };

            checklist.Add(dayChecklist);
        }

        _logger.LogInformation("Generated rollout checklist for session {SessionId}: {Days} days",
            sessionId, checklist.Count);

        return Ok(checklist);
    }

    /// <summary>
    /// Gets old assets not yet scheduled in any rollout.
    /// </summary>
    [HttpGet("rollout/sessions/{sessionId}/unscheduled")]
    [ProducesResponseType(typeof(List<UnscheduledAssetDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<UnscheduledAssetDto>>> GetUnscheduledAssets(
        int sessionId,
        [FromQuery] int limit = 50,
        CancellationToken cancellationToken = default)
    {
        // Get asset type codes for laptops and desktops
        var deviceTypeCodes = new[] { "LAP", "DESK", "LAPTOP", "DESKTOP" };

        // Find assets that are InGebruik but not scheduled as old assets in any active session
        var scheduledOldAssetIds = await _context.WorkplaceAssetAssignments
            .Where(a => a.OldAssetId.HasValue)
            .Where(a => a.RolloutWorkplace.RolloutDay.RolloutSession.Status != RolloutSessionStatus.Completed)
            .Select(a => a.OldAssetId!.Value)
            .ToListAsync(cancellationToken);

        var unscheduledAssets = await _context.Assets
            .Include(a => a.AssetType)
            .Include(a => a.Service)
            .Where(a => a.Status == AssetStatus.InGebruik)
            .Where(a => a.AssetType != null && deviceTypeCodes.Contains(a.AssetType.Code.ToUpper()))
            .Where(a => !scheduledOldAssetIds.Contains(a.Id))
            .OrderBy(a => a.InstallationDate)
            .Take(limit)
            .AsNoTracking()
            .Select(a => new UnscheduledAssetDto
            {
                AssetId = a.Id,
                AssetCode = a.AssetCode,
                SerialNumber = a.SerialNumber,
                AssetTypeName = a.AssetType != null ? a.AssetType.Name : "",
                PrimaryUserName = a.Owner,
                PrimaryUserId = null, // Asset doesn't store EntraId
                ServiceName = a.Service != null ? a.Service.Name : null,
                InstallationDate = a.InstallationDate,
                AgeInDays = a.InstallationDate.HasValue
                    ? (int)(DateTime.Today - a.InstallationDate.Value).TotalDays
                    : 0,
                Priority = a.InstallationDate.HasValue
                    ? (DateTime.Today - a.InstallationDate.Value).TotalDays > 1460 ? "High"
                    : (DateTime.Today - a.InstallationDate.Value).TotalDays > 730 ? "Medium"
                    : "Low"
                    : "Unknown"
            })
            .ToListAsync(cancellationToken);

        _logger.LogInformation("Found {Count} unscheduled assets for rollout", unscheduledAssets.Count);

        return Ok(unscheduledAssets);
    }

    /// <summary>
    /// Gets filter options for rollout reports.
    /// </summary>
    [HttpGet("rollout/sessions/{sessionId}/filter-options")]
    [ProducesResponseType(typeof(RolloutReportFilterOptionsDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<RolloutReportFilterOptionsDto>> GetRolloutFilterOptions(
        int sessionId,
        CancellationToken cancellationToken = default)
    {
        var session = await _context.RolloutSessions
            .Include(s => s.Days)
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.Id == sessionId, cancellationToken);

        if (session == null)
            return NotFound($"Session {sessionId} not found");

        var workplaces = await _context.RolloutWorkplaces
            .Include(w => w.Service)
            .Include(w => w.Building)
            .Where(w => w.RolloutDay.RolloutSessionId == sessionId)
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        var services = workplaces
            .Where(w => w.ServiceId.HasValue)
            .GroupBy(w => w.ServiceId!.Value)
            .Select(g => new FilterOptionDto
            {
                Id = g.Key,
                Name = g.First().Service!.Name,
                Count = g.Count()
            })
            .OrderBy(f => f.Name)
            .ToList();

        var buildings = workplaces
            .Where(w => w.BuildingId.HasValue)
            .GroupBy(w => w.BuildingId!.Value)
            .Select(g => new FilterOptionDto
            {
                Id = g.Key,
                Name = g.First().Building!.Name,
                Count = g.Count()
            })
            .OrderBy(f => f.Name)
            .ToList();

        var statuses = Enum.GetValues<RolloutWorkplaceStatus>()
            .Select(s => new FilterOptionDto
            {
                Id = (int)s,
                Name = s.ToString(),
                Count = workplaces.Count(w => w.Status == s)
            })
            .Where(f => f.Count > 0)
            .ToList();

        var options = new RolloutReportFilterOptionsDto
        {
            Services = services,
            Buildings = buildings,
            Statuses = statuses,
            MinDate = session.Days.Any() ? session.Days.Min(d => d.Date) : session.PlannedStartDate,
            MaxDate = session.Days.Any() ? session.Days.Max(d => d.Date) : session.PlannedEndDate ?? session.PlannedStartDate.AddMonths(1)
        };

        return Ok(options);
    }

    /// <summary>
    /// Exports rollout session to Excel.
    /// </summary>
    [HttpGet("rollout/sessions/{sessionId}/export")]
    [ProducesResponseType(typeof(FileContentResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ExportRolloutToExcel(
        int sessionId,
        [FromQuery] List<int>? serviceIds = null,
        [FromQuery] List<int>? buildingIds = null,
        CancellationToken cancellationToken = default)
    {
        var session = await _context.RolloutSessions
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.Id == sessionId, cancellationToken);

        if (session == null)
            return NotFound($"Session {sessionId} not found");

        // Get overview data
        var overviewResult = await GetRolloutSessionOverview(sessionId, serviceIds, buildingIds, cancellationToken);
        var overview = (overviewResult.Result as OkObjectResult)?.Value as RolloutSessionOverviewDto;

        // Get checklist data
        var checklistResult = await GetRolloutChecklist(sessionId, serviceIds, buildingIds, null, cancellationToken);
        var checklist = (checklistResult.Result as OkObjectResult)?.Value as List<RolloutDayChecklistDto>;

        // Get unscheduled assets
        var unscheduledResult = await GetUnscheduledAssets(sessionId, 100, cancellationToken);
        var unscheduled = (unscheduledResult.Result as OkObjectResult)?.Value as List<UnscheduledAssetDto>;

        using var workbook = new ClosedXML.Excel.XLWorkbook();

        // Sheet 1: Overview
        var overviewSheet = workbook.Worksheets.Add("Overzicht");
        CreateOverviewSheet(overviewSheet, session, overview);

        // Sheet 2: SWAP Checklist
        var checklistSheet = workbook.Worksheets.Add("SWAP Checklist");
        CreateChecklistSheet(checklistSheet, checklist);

        // Sheet 3: Unscheduled Assets
        var unscheduledSheet = workbook.Worksheets.Add("Niet Gepland");
        CreateUnscheduledSheet(unscheduledSheet, unscheduled);

        // Sheet 4: Sector Breakdown
        var sectorSheet = workbook.Worksheets.Add("Per Sector");
        CreateSectorSheet(sectorSheet, overview?.SectorBreakdown);

        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        var content = stream.ToArray();

        var fileName = $"rollout-rapport-{session.SessionName.Replace(" ", "-")}-{DateTime.UtcNow:yyyyMMdd}.xlsx";

        _logger.LogInformation("Exported rollout report for session {SessionId} to Excel", sessionId);

        return File(content, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", fileName);
    }

    private RolloutWorkplaceChecklistDto MapToWorkplaceChecklist(RolloutWorkplace w)
    {
        var equipmentRows = new List<RolloutEquipmentRowDto>();

        // Group assignments by type (LAP/DESK = Desktop/Laptop, DOCK = Docking)
        var laptopAssignments = w.AssetAssignments
            .Where(a => a.AssetType?.Code?.ToUpper() is "LAP" or "LAPTOP" or "DESK" or "DESKTOP")
            .ToList();

        var dockingAssignments = w.AssetAssignments
            .Where(a => a.AssetType?.Code?.ToUpper() is "DOCK" or "DOCKING")
            .ToList();

        foreach (var a in laptopAssignments)
        {
            equipmentRows.Add(new RolloutEquipmentRowDto
            {
                AssignmentId = a.Id,
                EquipmentType = "Desktop/Laptop",
                Category = a.AssignmentCategory.ToString(),
                NewAssetId = a.NewAssetId,
                NewAssetCode = a.NewAsset?.AssetCode,
                NewSerialNumber = a.NewAsset?.SerialNumber ?? a.SerialNumberCaptured,
                QrCodeApplied = a.QrCodeApplied,
                IsSharedDevice = false, // TODO: Add IsSharedDevice property to Asset entity if needed
                OldAssetId = a.OldAssetId,
                OldAssetCode = a.OldAsset?.AssetCode,
                OldSerialNumber = a.OldAsset?.SerialNumber,
                Status = a.Status.ToString(),
                IsMissingSerialNumber = string.IsNullOrEmpty(a.NewAsset?.SerialNumber) && string.IsNullOrEmpty(a.SerialNumberCaptured)
            });
        }

        foreach (var a in dockingAssignments)
        {
            equipmentRows.Add(new RolloutEquipmentRowDto
            {
                AssignmentId = a.Id,
                EquipmentType = "Docking",
                Category = a.AssignmentCategory.ToString(),
                NewAssetId = a.NewAssetId,
                NewAssetCode = a.NewAsset?.AssetCode,
                NewSerialNumber = a.NewAsset?.SerialNumber ?? a.SerialNumberCaptured,
                QrCodeApplied = a.QrCodeApplied,
                IsSharedDevice = false,
                OldAssetId = a.OldAssetId,
                OldAssetCode = a.OldAsset?.AssetCode,
                OldSerialNumber = a.OldAsset?.SerialNumber,
                Status = a.Status.ToString(),
                IsMissingSerialNumber = string.IsNullOrEmpty(a.NewAsset?.SerialNumber) && string.IsNullOrEmpty(a.SerialNumberCaptured)
            });
        }

        var hasMissing = equipmentRows.Any(e => e.IsMissingSerialNumber);

        return new RolloutWorkplaceChecklistDto
        {
            WorkplaceId = w.Id,
            WorkplaceName = w.PhysicalWorkplace?.Name ?? w.UserName ?? $"Workplace {w.Id}",
            Location = w.PhysicalWorkplace != null
                ? string.Join(", ", new[] { w.PhysicalWorkplace.Floor, w.PhysicalWorkplace.Room }.Where(s => !string.IsNullOrEmpty(s)))
                : w.Location,
            UserId = w.UserEntraId,
            UserDisplayName = w.UserName,
            UserJobTitle = null, // Will be enriched by Graph API on frontend
            ServiceName = w.Service?.Name ?? "",
            BuildingName = w.Building?.Name ?? "",
            Status = w.Status.ToString(),
            CompletedAt = w.CompletedAt,
            Notes = w.Notes,
            HasMissingSerialNumbers = hasMissing,
            EquipmentRows = equipmentRows
        };
    }

    private void CreateOverviewSheet(ClosedXML.Excel.IXLWorksheet sheet, RolloutSession session, RolloutSessionOverviewDto? overview)
    {
        var row = 1;

        // Title
        sheet.Cell(row, 1).Value = $"Rollout Rapport: {session.SessionName}";
        sheet.Cell(row, 1).Style.Font.Bold = true;
        sheet.Cell(row, 1).Style.Font.FontSize = 16;
        sheet.Range(row, 1, row, 4).Merge();
        row += 2;

        // Session info
        sheet.Cell(row, 1).Value = "Periode:";
        sheet.Cell(row, 2).Value = $"{session.PlannedStartDate:dd-MM-yyyy} - {session.PlannedEndDate ?? session.PlannedStartDate.AddMonths(1):dd-MM-yyyy}";
        row++;
        sheet.Cell(row, 1).Value = "Status:";
        sheet.Cell(row, 2).Value = session.Status.ToString();
        row += 2;

        if (overview == null) return;

        // KPIs
        sheet.Cell(row, 1).Value = "Statistieken";
        sheet.Cell(row, 1).Style.Font.Bold = true;
        row++;

        var kpis = new[]
        {
            ("Totaal Werkplekken", overview.TotalWorkplaces),
            ("Voltooid", overview.CompletedWorkplaces),
            ("In Uitvoering", overview.InProgressWorkplaces),
            ("Gepland", overview.PendingWorkplaces),
            ("Voortgang %", (int)overview.CompletionPercentage),
            ("Nieuwe Assets", overview.TotalNewAssets),
            ("Geïnstalleerd", overview.InstalledAssets),
            ("QR Codes Toegepast", overview.QrCodesApplied),
            ("Ontbrekende QR", overview.MissingQrCodes)
        };

        foreach (var (label, value) in kpis)
        {
            sheet.Cell(row, 1).Value = label;
            sheet.Cell(row, 2).Value = value;
            row++;
        }

        sheet.Columns().AdjustToContents();
    }

    private void CreateChecklistSheet(ClosedXML.Excel.IXLWorksheet sheet, List<RolloutDayChecklistDto>? checklist)
    {
        var row = 1;

        // Headers
        var headers = new[] { "Datum", "Dienst", "Gebouw", "Werkplek", "Medewerker", "Laptop SN", "QR", "Docking SN", "QR", "Status", "Notities" };
        for (var col = 1; col <= headers.Length; col++)
        {
            sheet.Cell(row, col).Value = headers[col - 1];
            sheet.Cell(row, col).Style.Font.Bold = true;
            sheet.Cell(row, col).Style.Fill.BackgroundColor = ClosedXML.Excel.XLColor.FromHtml("#0078D4");
            sheet.Cell(row, col).Style.Font.FontColor = ClosedXML.Excel.XLColor.White;
        }
        row++;

        if (checklist == null) return;

        foreach (var day in checklist)
        {
            foreach (var wp in day.Workplaces)
            {
                var laptop = wp.EquipmentRows.FirstOrDefault(e => e.EquipmentType == "Desktop/Laptop");
                var docking = wp.EquipmentRows.FirstOrDefault(e => e.EquipmentType == "Docking");

                sheet.Cell(row, 1).Value = day.Date.ToString("dd-MM-yyyy");
                sheet.Cell(row, 2).Value = wp.ServiceName;
                sheet.Cell(row, 3).Value = wp.BuildingName;
                sheet.Cell(row, 4).Value = wp.WorkplaceName;
                sheet.Cell(row, 5).Value = wp.UserDisplayName ?? "";
                sheet.Cell(row, 6).Value = laptop?.NewSerialNumber ?? "";
                sheet.Cell(row, 7).Value = laptop?.QrCodeApplied == true ? "✓" : "";
                sheet.Cell(row, 8).Value = docking?.NewSerialNumber ?? "";
                sheet.Cell(row, 9).Value = docking?.QrCodeApplied == true ? "✓" : "";
                sheet.Cell(row, 10).Value = wp.Status;
                sheet.Cell(row, 11).Value = wp.Notes ?? "";

                // Yellow highlight for missing serial numbers
                if (laptop?.IsMissingSerialNumber == true)
                {
                    sheet.Cell(row, 6).Style.Fill.BackgroundColor = ClosedXML.Excel.XLColor.Yellow;
                }
                if (docking?.IsMissingSerialNumber == true)
                {
                    sheet.Cell(row, 8).Style.Fill.BackgroundColor = ClosedXML.Excel.XLColor.Yellow;
                }

                // Green for completed
                if (wp.Status == "Completed")
                {
                    sheet.Cell(row, 10).Style.Fill.BackgroundColor = ClosedXML.Excel.XLColor.LightGreen;
                }

                row++;
            }
        }

        sheet.Columns().AdjustToContents();
        sheet.SheetView.FreezeRows(1);
    }

    private void CreateUnscheduledSheet(ClosedXML.Excel.IXLWorksheet sheet, List<UnscheduledAssetDto>? unscheduled)
    {
        var row = 1;

        // Headers
        var headers = new[] { "Asset Code", "Serienummer", "Type", "Eigenaar", "Dienst", "Installatie Datum", "Leeftijd (dagen)", "Prioriteit" };
        for (var col = 1; col <= headers.Length; col++)
        {
            sheet.Cell(row, col).Value = headers[col - 1];
            sheet.Cell(row, col).Style.Font.Bold = true;
            sheet.Cell(row, col).Style.Fill.BackgroundColor = ClosedXML.Excel.XLColor.FromHtml("#0078D4");
            sheet.Cell(row, col).Style.Font.FontColor = ClosedXML.Excel.XLColor.White;
        }
        row++;

        if (unscheduled == null) return;

        foreach (var asset in unscheduled)
        {
            sheet.Cell(row, 1).Value = asset.AssetCode;
            sheet.Cell(row, 2).Value = asset.SerialNumber ?? "";
            sheet.Cell(row, 3).Value = asset.AssetTypeName;
            sheet.Cell(row, 4).Value = asset.PrimaryUserName ?? "";
            sheet.Cell(row, 5).Value = asset.ServiceName ?? "";
            sheet.Cell(row, 6).Value = asset.InstallationDate?.ToString("dd-MM-yyyy") ?? "";
            sheet.Cell(row, 7).Value = asset.AgeInDays;
            sheet.Cell(row, 8).Value = asset.Priority;

            // Color coding for priority
            var priorityColor = asset.Priority switch
            {
                "High" => ClosedXML.Excel.XLColor.LightCoral,
                "Medium" => ClosedXML.Excel.XLColor.LightYellow,
                _ => ClosedXML.Excel.XLColor.NoColor
            };
            if (priorityColor != ClosedXML.Excel.XLColor.NoColor)
            {
                sheet.Cell(row, 8).Style.Fill.BackgroundColor = priorityColor;
            }

            row++;
        }

        sheet.Columns().AdjustToContents();
        sheet.SheetView.FreezeRows(1);
    }

    private void CreateSectorSheet(ClosedXML.Excel.IXLWorksheet sheet, List<RolloutSectorBreakdownDto>? breakdown)
    {
        var row = 1;

        // Headers
        var headers = new[] { "Sector", "Dienst", "Totaal", "Voltooid", "Voortgang %" };
        for (var col = 1; col <= headers.Length; col++)
        {
            sheet.Cell(row, col).Value = headers[col - 1];
            sheet.Cell(row, col).Style.Font.Bold = true;
            sheet.Cell(row, col).Style.Fill.BackgroundColor = ClosedXML.Excel.XLColor.FromHtml("#0078D4");
            sheet.Cell(row, col).Style.Font.FontColor = ClosedXML.Excel.XLColor.White;
        }
        row++;

        if (breakdown == null) return;

        foreach (var sector in breakdown)
        {
            // Sector row (bold)
            sheet.Cell(row, 1).Value = sector.SectorName;
            sheet.Cell(row, 3).Value = sector.TotalWorkplaces;
            sheet.Cell(row, 4).Value = sector.CompletedWorkplaces;
            sheet.Cell(row, 5).Value = sector.CompletionPercentage;
            sheet.Range(row, 1, row, 5).Style.Font.Bold = true;
            sheet.Range(row, 1, row, 5).Style.Fill.BackgroundColor = ClosedXML.Excel.XLColor.LightGray;
            row++;

            // Service rows
            foreach (var service in sector.Services)
            {
                sheet.Cell(row, 2).Value = service.ServiceName;
                sheet.Cell(row, 3).Value = service.TotalWorkplaces;
                sheet.Cell(row, 4).Value = service.CompletedWorkplaces;
                sheet.Cell(row, 5).Value = service.CompletionPercentage;
                row++;
            }
        }

        sheet.Columns().AdjustToContents();
        sheet.SheetView.FreezeRows(1);
    }

    // ========================================
    // Serial Number Management
    // ========================================

    /// <summary>
    /// Gets all assets linked to a rollout session for serial number management.
    /// Returns all new assets (both assigned via assignments and directly linked).
    /// </summary>
    [HttpGet("rollout/sessions/{sessionId}/serial-numbers")]
    [ProducesResponseType(typeof(List<RolloutAssetSerialDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<List<RolloutAssetSerialDto>>> GetRolloutAssetSerials(
        int sessionId,
        [FromQuery] bool onlyMissing = false,
        CancellationToken cancellationToken = default)
    {
        var session = await _context.RolloutSessions
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.Id == sessionId, cancellationToken);

        if (session == null)
            return NotFound($"Session {sessionId} not found");

        // Get all assignments with new assets for this session
        var assignmentsWithAssets = await _context.WorkplaceAssetAssignments
            .Include(a => a.NewAsset).ThenInclude(asset => asset!.AssetType)
            .Include(a => a.RolloutWorkplace).ThenInclude(w => w.Service)
            .Include(a => a.RolloutWorkplace).ThenInclude(w => w.Building)
            .Include(a => a.RolloutWorkplace).ThenInclude(w => w.RolloutDay)
            .Include(a => a.RolloutWorkplace).ThenInclude(w => w.PhysicalWorkplace)
            .Include(a => a.AssetType)
            .Where(a => a.RolloutWorkplace.RolloutDay.RolloutSessionId == sessionId)
            .Where(a => a.NewAssetId.HasValue)
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        var results = assignmentsWithAssets
            .Where(a => a.NewAsset != null)
            .Select(a => new RolloutAssetSerialDto
            {
                AssetId = a.NewAsset!.Id,
                AssetCode = a.NewAsset.AssetCode,
                AssetName = a.NewAsset.AssetName,
                EquipmentType = a.AssetType?.Name ?? a.NewAsset.AssetType?.Name ?? "Unknown",
                CurrentSerialNumber = a.NewAsset.SerialNumber ?? a.SerialNumberCaptured,
                Brand = a.NewAsset.Brand,
                Model = a.NewAsset.Model,
                WorkplaceName = a.RolloutWorkplace.PhysicalWorkplace?.Name ?? a.RolloutWorkplace.UserName ?? $"Workplace {a.RolloutWorkplace.Id}",
                UserDisplayName = a.RolloutWorkplace.UserName,
                ServiceName = a.RolloutWorkplace.Service?.Name ?? "",
                BuildingName = a.RolloutWorkplace.Building?.Name ?? "",
                Date = a.RolloutWorkplace.RolloutDay?.Date,
                Status = a.NewAsset.Status.ToString(),
                IsMissingSerial = string.IsNullOrEmpty(a.NewAsset.SerialNumber) && string.IsNullOrEmpty(a.SerialNumberCaptured)
            })
            .DistinctBy(a => a.AssetId) // Remove duplicates if same asset in multiple assignments
            .OrderBy(a => a.ServiceName)
            .ThenBy(a => a.Date)
            .ThenBy(a => a.WorkplaceName)
            .ToList();

        if (onlyMissing)
        {
            results = results.Where(a => a.IsMissingSerial).ToList();
        }

        _logger.LogInformation("Found {Count} assets for serial number management in session {SessionId} (missing only: {OnlyMissing})",
            results.Count, sessionId, onlyMissing);

        return Ok(results);
    }

    /// <summary>
    /// Bulk update serial numbers for assets.
    /// </summary>
    [HttpPatch("rollout/sessions/{sessionId}/serial-numbers/bulk")]
    [ProducesResponseType(typeof(BulkSerialNumberUpdateResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<BulkSerialNumberUpdateResult>> BulkUpdateSerialNumbers(
        int sessionId,
        [FromBody] BulkSerialNumberUpdateRequest request,
        CancellationToken cancellationToken = default)
    {
        if (request.Updates == null || request.Updates.Count == 0)
        {
            return BadRequest(new { message = "No updates provided" });
        }

        var successCount = 0;
        var errors = new List<string>();

        foreach (var update in request.Updates)
        {
            if (string.IsNullOrWhiteSpace(update.SerialNumber))
            {
                errors.Add($"Asset {update.AssetId}: Serienummer mag niet leeg zijn");
                continue;
            }

            var asset = await _context.Assets.FindAsync(new object[] { update.AssetId }, cancellationToken);
            if (asset == null)
            {
                errors.Add($"Asset {update.AssetId}: Niet gevonden");
                continue;
            }

            asset.SerialNumber = update.SerialNumber.Trim();
            asset.UpdatedAt = DateTime.UtcNow;

            // Also update any assignments that reference this asset
            var assignments = await _context.WorkplaceAssetAssignments
                .Where(a => a.NewAssetId == update.AssetId)
                .ToListAsync(cancellationToken);

            foreach (var assignment in assignments)
            {
                assignment.SerialNumberCaptured = update.SerialNumber.Trim();
                assignment.UpdatedAt = DateTime.UtcNow;
            }

            successCount++;
        }

        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Bulk updated {SuccessCount} serial numbers for session {SessionId}. Errors: {ErrorCount}",
            successCount, sessionId, errors.Count);

        return Ok(new BulkSerialNumberUpdateResult
        {
            SuccessCount = successCount,
            FailedCount = errors.Count,
            Errors = errors
        });
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

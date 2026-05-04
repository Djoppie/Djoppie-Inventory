using DjoppieInventory.Core.DTOs.PhysicalWorkplace;
using DjoppieInventory.Core.Entities;
using DjoppieInventory.Core.Entities.Enums;
using DjoppieInventory.Infrastructure.Data;
using DjoppieInventory.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DjoppieInventory.API.Controllers.Workplaces;

/// <summary>
/// Controller for workplace search, filtering, bulk operations, import/export, and statistics.
/// </summary>
[ApiController]
[Route("api/workplaces")]
[Authorize]
public class WorkplaceSearchController : ControllerBase
{
    private readonly IPhysicalWorkplaceService _workplaceService;
    private readonly ApplicationDbContext _context;
    private readonly ILogger<WorkplaceSearchController> _logger;

    public WorkplaceSearchController(
        IPhysicalWorkplaceService workplaceService,
        ApplicationDbContext context,
        ILogger<WorkplaceSearchController> logger)
    {
        _workplaceService = workplaceService;
        _context = context;
        _logger = logger;
    }

    // ============================================================
    // Statistics Endpoints for Dashboard Widgets
    // ============================================================

    /// <summary>
    /// Gets overall workplace statistics including occupancy and equipment rates.
    /// Used for the main dashboard workplace overview widget.
    /// </summary>
    [HttpGet("statistics")]
    [ProducesResponseType(typeof(WorkplaceStatisticsDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<WorkplaceStatisticsDto>> GetStatistics(
        CancellationToken cancellationToken = default)
    {
        var workplaces = await _context.PhysicalWorkplaces
            .Where(pw => pw.IsActive)
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        var totalWorkplaces = workplaces.Count;
        var activeWorkplaces = workplaces.Count(pw => pw.IsActive);
        var occupiedWorkplaces = workplaces.Count(pw => pw.CurrentOccupantEntraId != null || pw.CurrentOccupantName != null);
        var vacantWorkplaces = activeWorkplaces - occupiedWorkplaces;
        var occupancyRate = activeWorkplaces > 0
            ? Math.Round((decimal)occupiedWorkplaces / activeWorkplaces * 100, 1)
            : 0;

        // Equipment statistics
        var totalDocking = workplaces.Count(pw => pw.HasDockingStation);
        var filledDocking = workplaces.Count(pw => pw.DockingStationAssetId.HasValue);

        var totalMonitors = workplaces.Sum(pw => pw.MonitorCount);
        var filledMonitors = workplaces.Count(pw => pw.Monitor1AssetId.HasValue)
            + workplaces.Count(pw => pw.Monitor2AssetId.HasValue)
            + workplaces.Count(pw => pw.Monitor3AssetId.HasValue);

        var totalKeyboards = activeWorkplaces; // Every workplace needs a keyboard
        var filledKeyboards = workplaces.Count(pw => pw.KeyboardAssetId.HasValue);

        var totalMice = activeWorkplaces; // Every workplace needs a mouse
        var filledMice = workplaces.Count(pw => pw.MouseAssetId.HasValue);

        var totalSlots = totalDocking + totalMonitors + totalKeyboards + totalMice;
        var filledSlots = filledDocking + filledMonitors + filledKeyboards + filledMice;
        var overallEquipmentRate = totalSlots > 0
            ? Math.Round((decimal)filledSlots / totalSlots * 100, 1)
            : 0;

        var equipment = new EquipmentStatisticsDto(
            totalDocking, filledDocking,
            totalMonitors, filledMonitors,
            totalKeyboards, filledKeyboards,
            totalMice, filledMice,
            overallEquipmentRate
        );

        return Ok(new WorkplaceStatisticsDto(
            totalWorkplaces,
            activeWorkplaces,
            occupiedWorkplaces,
            vacantWorkplaces,
            occupancyRate,
            equipment
        ));
    }

    /// <summary>
    /// Gets occupancy statistics grouped by building.
    /// Used for the building occupancy distribution widget.
    /// </summary>
    [HttpGet("statistics/by-building")]
    [ProducesResponseType(typeof(IEnumerable<BuildingOccupancyDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<BuildingOccupancyDto>>> GetStatisticsByBuilding(
        CancellationToken cancellationToken = default)
    {
        // Load data into memory first to avoid LINQ translation issues
        var workplaces = await _context.PhysicalWorkplaces
            .Include(pw => pw.Building)
            .Where(pw => pw.IsActive)
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        // Perform grouping and calculations in memory
        var stats = workplaces
            .GroupBy(pw => new { pw.BuildingId, BuildingName = pw.Building?.Name, BuildingCode = pw.Building?.Code })
            .Select(g =>
            {
                var totalWorkplaces = g.Count();
                var occupiedWorkplaces = g.Count(pw => pw.CurrentOccupantEntraId != null || pw.CurrentOccupantName != null);
                var vacantWorkplaces = g.Count(pw => pw.CurrentOccupantEntraId == null && pw.CurrentOccupantName == null);
                var occupancyRate = totalWorkplaces > 0
                    ? Math.Round((decimal)occupiedWorkplaces / totalWorkplaces * 100, 1)
                    : 0;

                return new BuildingOccupancyDto(
                    g.Key.BuildingId,
                    g.Key.BuildingName ?? "Unknown Building",
                    g.Key.BuildingCode,
                    totalWorkplaces,
                    occupiedWorkplaces,
                    vacantWorkplaces,
                    occupancyRate
                );
            })
            .OrderByDescending(b => b.TotalWorkplaces)
            .ToList();

        return Ok(stats);
    }

    /// <summary>
    /// Gets occupancy statistics grouped by service/department.
    /// Used for the service occupancy distribution widget.
    /// </summary>
    [HttpGet("statistics/by-service")]
    [ProducesResponseType(typeof(IEnumerable<ServiceOccupancyDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<ServiceOccupancyDto>>> GetStatisticsByService(
        CancellationToken cancellationToken = default)
    {
        // Load data into memory first to avoid LINQ translation issues
        var workplaces = await _context.PhysicalWorkplaces
            .Include(pw => pw.Service)
            .Where(pw => pw.IsActive)
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        // Perform grouping and calculations in memory
        var stats = workplaces
            .GroupBy(pw => new { pw.ServiceId, ServiceName = pw.Service?.Name, ServiceCode = pw.Service?.Code })
            .Select(g =>
            {
                var totalWorkplaces = g.Count();
                var occupiedWorkplaces = g.Count(pw => pw.CurrentOccupantEntraId != null || pw.CurrentOccupantName != null);
                var vacantWorkplaces = g.Count(pw => pw.CurrentOccupantEntraId == null && pw.CurrentOccupantName == null);
                var occupancyRate = totalWorkplaces > 0
                    ? Math.Round((decimal)occupiedWorkplaces / totalWorkplaces * 100, 1)
                    : 0;

                return new ServiceOccupancyDto(
                    g.Key.ServiceId,
                    g.Key.ServiceName ?? "Geen dienst",
                    g.Key.ServiceCode,
                    totalWorkplaces,
                    occupiedWorkplaces,
                    vacantWorkplaces,
                    occupancyRate
                );
            })
            .OrderByDescending(s => s.TotalWorkplaces)
            .ToList();

        return Ok(stats);
    }

    /// <summary>
    /// Gets equipment status breakdown by type.
    /// Used for the equipment distribution widget.
    /// </summary>
    [HttpGet("statistics/equipment")]
    [ProducesResponseType(typeof(IEnumerable<EquipmentTypeStatusDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<EquipmentTypeStatusDto>>> GetEquipmentStatistics(
        CancellationToken cancellationToken = default)
    {
        var workplaces = await _context.PhysicalWorkplaces
            .Where(pw => pw.IsActive)
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        var activeCount = workplaces.Count;

        var equipmentStats = new List<EquipmentTypeStatusDto>
        {
            CreateEquipmentStat("docking", "Docking Stations",
                workplaces.Count(pw => pw.HasDockingStation),
                workplaces.Count(pw => pw.DockingStationAssetId.HasValue)),
            CreateEquipmentStat("monitor", "Monitors",
                workplaces.Sum(pw => pw.MonitorCount),
                workplaces.Count(pw => pw.Monitor1AssetId.HasValue)
                    + workplaces.Count(pw => pw.Monitor2AssetId.HasValue)
                    + workplaces.Count(pw => pw.Monitor3AssetId.HasValue)),
            CreateEquipmentStat("keyboard", "Keyboards",
                activeCount,
                workplaces.Count(pw => pw.KeyboardAssetId.HasValue)),
            CreateEquipmentStat("mouse", "Mice",
                activeCount,
                workplaces.Count(pw => pw.MouseAssetId.HasValue))
        };

        return Ok(equipmentStats);
    }

    private static EquipmentTypeStatusDto CreateEquipmentStat(string type, string displayName, int total, int filled)
    {
        var fillRate = total > 0 ? Math.Round((decimal)filled / total * 100, 1) : 0;
        return new EquipmentTypeStatusDto(type, displayName, total, filled, total - filled, fillRate);
    }

    // ============================================================
    // Bulk Operations
    // ============================================================

    /// <summary>
    /// Downloads a CSV template for bulk workplace import.
    /// Includes valid building and service codes as reference.
    /// </summary>
    [HttpGet("template")]
    [ProducesResponseType(typeof(FileContentResult), StatusCodes.Status200OK)]
    public async Task<IActionResult> DownloadTemplate(CancellationToken cancellationToken = default)
    {
        var buildings = await _context.Buildings
            .Where(b => b.IsActive)
            .OrderBy(b => b.SortOrder)
            .Select(b => new { b.Code, b.Name })
            .ToListAsync(cancellationToken);

        var services = await _context.Services
            .Where(s => s.IsActive)
            .OrderBy(s => s.SortOrder)
            .Select(s => new { s.Code, s.Name })
            .ToListAsync(cancellationToken);

        var csv = new System.Text.StringBuilder();

        // Header comments with valid codes
        csv.AppendLine("# Physical Workplace Import Template");
        csv.AppendLine("# ");
        csv.AppendLine("# Valid Building Codes:");
        foreach (var b in buildings)
            csv.AppendLine($"#   {b.Code} = {b.Name}");
        csv.AppendLine("# ");
        csv.AppendLine("# Valid Service Codes (optional):");
        foreach (var s in services)
            csv.AppendLine($"#   {s.Code} = {s.Name}");
        csv.AppendLine("# ");
        csv.AppendLine("# Workplace Types: Desktop=0, Laptop=1, HotDesk=2, MeetingRoom=3");
        csv.AppendLine("# ");
        csv.AppendLine("# Required fields: Code, Name, BuildingCode");
        csv.AppendLine("# ");

        // CSV Header
        csv.AppendLine("Code,Name,Description,BuildingCode,ServiceCode,Floor,Room,Type,MonitorCount,HasDockingStation");

        // Example rows
        csv.AppendLine("GH-BZ-L04,Loket 4 Burgerzaken,Vierde loket Burgerzaken,GHUIS,BURG,Gelijkvloers,Lokettenhal,Laptop,2,true");
        csv.AppendLine("PG-IT-03,Werkplek IT 3,Developer werkplek,POORT,IT,1e verdieping,Lokaal IT,Desktop,3,false");
        csv.AppendLine("PL-FLEX-02,Flexplek 2,Gedeelde werkplek,PLAK,,Gelijkvloers,Open kantoor,HotDesk,1,true");

        var bytes = System.Text.Encoding.UTF8.GetBytes(csv.ToString());
        var fileName = $"workplace-import-template_{DateTime.UtcNow:yyyyMMdd}.csv";

        _logger.LogInformation("Workplace CSV template downloaded");
        return File(bytes, "text/csv", fileName);
    }

    /// <summary>
    /// Exports all workplaces to CSV format (compatible with import template).
    /// </summary>
    [HttpGet("export")]
    [ProducesResponseType(typeof(FileContentResult), StatusCodes.Status200OK)]
    public async Task<IActionResult> ExportCsv(
        [FromQuery] int? buildingId = null,
        [FromQuery] int? serviceId = null,
        [FromQuery] bool? isActive = null,
        CancellationToken cancellationToken = default)
    {
        var query = _context.PhysicalWorkplaces
            .Include(pw => pw.Building)
            .Include(pw => pw.Service)
            .AsNoTracking();

        if (buildingId.HasValue)
            query = query.Where(pw => pw.BuildingId == buildingId.Value);

        if (serviceId.HasValue)
            query = query.Where(pw => pw.ServiceId == serviceId.Value);

        if (isActive.HasValue)
            query = query.Where(pw => pw.IsActive == isActive.Value);

        var workplaces = await query
            .OrderBy(pw => pw.Building.Name)
            .ThenBy(pw => pw.Service != null ? pw.Service.Name : "")
            .ThenBy(pw => pw.Code)
            .ToListAsync(cancellationToken);

        var csv = new System.Text.StringBuilder();

        // CSV Header
        csv.AppendLine("Code,Name,Description,BuildingCode,ServiceCode,Floor,Room,Type,MonitorCount,HasDockingStation");

        // Data rows
        foreach (var wp in workplaces)
        {
            var description = EscapeCsvField(wp.Description ?? "");
            var name = EscapeCsvField(wp.Name);
            var floor = EscapeCsvField(wp.Floor ?? "");
            var room = EscapeCsvField(wp.Room ?? "");

            csv.AppendLine($"{wp.Code},{name},{description},{wp.Building?.Code ?? ""},{wp.Service?.Code ?? ""},{floor},{room},{(int)wp.Type},{wp.MonitorCount},{wp.HasDockingStation.ToString().ToLowerInvariant()}");
        }

        var bytes = System.Text.Encoding.UTF8.GetBytes(csv.ToString());
        var fileName = $"workplaces-export_{DateTime.UtcNow:yyyyMMdd_HHmmss}.csv";

        _logger.LogInformation("Exported {Count} workplaces to CSV", workplaces.Count);
        return File(bytes, "text/csv", fileName);
    }

    /// <summary>
    /// Escapes a field for CSV output (handles commas and quotes).
    /// </summary>
    private static string EscapeCsvField(string field)
    {
        if (string.IsNullOrEmpty(field))
            return "";

        // If field contains comma, newline, or quote, wrap in quotes and escape internal quotes
        if (field.Contains(',') || field.Contains('"') || field.Contains('\n') || field.Contains('\r'))
        {
            return $"\"{field.Replace("\"", "\"\"")}\"";
        }
        return field;
    }

    /// <summary>
    /// Imports workplaces from a CSV file.
    /// </summary>
    [HttpPost("import")]
    [Consumes("multipart/form-data")]
    [ProducesResponseType(typeof(WorkplaceCsvImportResultDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<WorkplaceCsvImportResultDto>> ImportCsv(
        IFormFile file,
        CancellationToken cancellationToken = default)
    {
        if (file == null || file.Length == 0)
            return BadRequest("No file uploaded. Please provide a CSV file.");

        if (file.Length > 5 * 1024 * 1024)
            return BadRequest("File size exceeds maximum allowed size of 5 MB.");

        var fileExtension = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (fileExtension != ".csv")
            return BadRequest("Invalid file type. Only CSV files (.csv) are allowed.");

        // Load lookup data
        var buildings = await _context.Buildings
            .Where(b => b.IsActive)
            .ToDictionaryAsync(b => b.Code.ToUpperInvariant(), b => b.Id, cancellationToken);

        var services = await _context.Services
            .Where(s => s.IsActive)
            .ToDictionaryAsync(s => s.Code.ToUpperInvariant(), s => s.Id, cancellationToken);

        var existingCodes = (await _context.PhysicalWorkplaces
            .Select(pw => pw.Code.ToUpperInvariant())
            .ToListAsync(cancellationToken)).ToHashSet();

        var results = new List<WorkplaceCsvImportRowResult>();
        var workplacesToCreate = new List<(int rowNum, PhysicalWorkplace workplace)>();

        using var reader = new StreamReader(file.OpenReadStream());
        var rowNumber = 0;

        while (!reader.EndOfStream)
        {
            var line = await reader.ReadLineAsync(cancellationToken);
            rowNumber++;

            // Skip empty lines and comments
            if (string.IsNullOrWhiteSpace(line) || line.TrimStart().StartsWith('#'))
                continue;

            // Skip header row
            if (rowNumber == 1 || line.StartsWith("Code,", StringComparison.OrdinalIgnoreCase))
            {
                // Check if this is the actual header row
                if (line.Contains("BuildingCode", StringComparison.OrdinalIgnoreCase))
                    continue;
            }

            var columns = ParseCsvLine(line);
            if (columns.Length < 4)
            {
                results.Add(new WorkplaceCsvImportRowResult(rowNumber, null, null, false,
                    "Invalid row format. Expected at least 4 columns: Code, Name, Description, BuildingCode", null));
                continue;
            }

            var code = columns[0].Trim();
            var name = columns[1].Trim();
            var description = columns.Length > 2 ? columns[2].Trim() : null;
            var buildingCode = columns.Length > 3 ? columns[3].Trim().ToUpperInvariant() : null;
            var serviceCode = columns.Length > 4 ? columns[4].Trim().ToUpperInvariant() : null;
            var floor = columns.Length > 5 ? columns[5].Trim() : null;
            var room = columns.Length > 6 ? columns[6].Trim() : null;
            var typeStr = columns.Length > 7 ? columns[7].Trim() : "Laptop";
            var monitorCountStr = columns.Length > 8 ? columns[8].Trim() : "2";
            var hasDockingStr = columns.Length > 9 ? columns[9].Trim() : "true";

            // Validate required fields
            if (string.IsNullOrWhiteSpace(code))
            {
                results.Add(new WorkplaceCsvImportRowResult(rowNumber, code, name, false, "Code is required", null));
                continue;
            }

            if (string.IsNullOrWhiteSpace(name))
            {
                results.Add(new WorkplaceCsvImportRowResult(rowNumber, code, name, false, "Name is required", null));
                continue;
            }

            if (string.IsNullOrWhiteSpace(buildingCode))
            {
                results.Add(new WorkplaceCsvImportRowResult(rowNumber, code, name, false, "BuildingCode is required", null));
                continue;
            }

            // Check for duplicate code
            if (existingCodes.Contains(code.ToUpperInvariant()))
            {
                results.Add(new WorkplaceCsvImportRowResult(rowNumber, code, name, false,
                    $"Workplace with code '{code}' already exists", null));
                continue;
            }

            // Validate building
            if (!buildings.TryGetValue(buildingCode, out var buildingId))
            {
                results.Add(new WorkplaceCsvImportRowResult(rowNumber, code, name, false,
                    $"Invalid BuildingCode '{buildingCode}'", null));
                continue;
            }

            // Validate service (if provided)
            int? serviceId = null;
            if (!string.IsNullOrWhiteSpace(serviceCode))
            {
                if (!services.TryGetValue(serviceCode, out var sId))
                {
                    results.Add(new WorkplaceCsvImportRowResult(rowNumber, code, name, false,
                        $"Invalid ServiceCode '{serviceCode}'", null));
                    continue;
                }
                serviceId = sId;
            }

            // Parse type
            var workplaceType = WorkplaceType.Laptop;
            if (!string.IsNullOrWhiteSpace(typeStr))
            {
                if (int.TryParse(typeStr, out var typeInt) && Enum.IsDefined(typeof(WorkplaceType), typeInt))
                    workplaceType = (WorkplaceType)typeInt;
                else if (Enum.TryParse<WorkplaceType>(typeStr, true, out var typeEnum))
                    workplaceType = typeEnum;
            }

            // Parse monitor count
            var monitorCount = 2;
            if (!string.IsNullOrWhiteSpace(monitorCountStr))
                int.TryParse(monitorCountStr, out monitorCount);

            // Parse has docking station
            var hasDocking = true;
            if (!string.IsNullOrWhiteSpace(hasDockingStr))
                bool.TryParse(hasDockingStr, out hasDocking);

            var workplace = new PhysicalWorkplace
            {
                Code = code,
                Name = name,
                Description = string.IsNullOrWhiteSpace(description) ? null : description,
                BuildingId = buildingId,
                ServiceId = serviceId,
                Floor = string.IsNullOrWhiteSpace(floor) ? null : floor,
                Room = string.IsNullOrWhiteSpace(room) ? null : room,
                Type = workplaceType,
                MonitorCount = monitorCount,
                HasDockingStation = hasDocking,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            workplacesToCreate.Add((rowNumber, workplace));
            existingCodes.Add(code.ToUpperInvariant()); // Prevent duplicates within same import
        }

        // Save all valid workplaces
        foreach (var (rowNum, workplace) in workplacesToCreate)
        {
            try
            {
                _context.PhysicalWorkplaces.Add(workplace);
                await _context.SaveChangesAsync(cancellationToken);
                results.Add(new WorkplaceCsvImportRowResult(rowNum, workplace.Code, workplace.Name, true, null, workplace.Id));
            }
            catch (Exception ex)
            {
                results.Add(new WorkplaceCsvImportRowResult(rowNum, workplace.Code, workplace.Name, false,
                    $"Database error: {ex.Message}", null));
            }
        }

        var successCount = results.Count(r => r.Success);
        var errorCount = results.Count(r => !r.Success);

        _logger.LogInformation("Workplace CSV import completed. Success: {Success}, Errors: {Errors}",
            successCount, errorCount);

        return Ok(new WorkplaceCsvImportResultDto(
            results.Count,
            successCount,
            errorCount,
            errorCount == 0,
            results
        ));
    }

    /// <summary>
    /// Deletes ALL physical workplaces. Use with caution!
    /// This is a hard delete that cannot be undone.
    /// </summary>
    [HttpDelete("all")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> DeleteAll(
        [FromQuery] bool confirm = false,
        CancellationToken cancellationToken = default)
    {
        if (!confirm)
            return BadRequest("You must pass ?confirm=true to delete all workplaces");

        // Check for any workplaces with fixed assets
        var workplacesWithAssets = await _context.PhysicalWorkplaces
            .Where(pw => pw.DockingStationAssetId != null
                || pw.Monitor1AssetId != null
                || pw.Monitor2AssetId != null
                || pw.Monitor3AssetId != null
                || pw.KeyboardAssetId != null
                || pw.MouseAssetId != null)
            .CountAsync(cancellationToken);

        if (workplacesWithAssets > 0)
        {
            // Clear asset assignments first
            var workplacesWithEquipment = await _context.PhysicalWorkplaces
                .Where(pw => pw.DockingStationAssetId != null
                    || pw.Monitor1AssetId != null
                    || pw.Monitor2AssetId != null
                    || pw.Monitor3AssetId != null
                    || pw.KeyboardAssetId != null
                    || pw.MouseAssetId != null)
                .ToListAsync(cancellationToken);

            foreach (var wp in workplacesWithEquipment)
            {
                wp.DockingStationAssetId = null;
                wp.Monitor1AssetId = null;
                wp.Monitor2AssetId = null;
                wp.Monitor3AssetId = null;
                wp.KeyboardAssetId = null;
                wp.MouseAssetId = null;
            }
            await _context.SaveChangesAsync(cancellationToken);
        }

        // Clear PhysicalWorkplaceId from assets
        var assetsWithWorkplace = await _context.Assets
            .Where(a => a.PhysicalWorkplaceId != null)
            .ToListAsync(cancellationToken);

        foreach (var asset in assetsWithWorkplace)
        {
            asset.PhysicalWorkplaceId = null;
        }
        await _context.SaveChangesAsync(cancellationToken);

        // Now delete all workplaces
        var allWorkplaces = await _context.PhysicalWorkplaces.ToListAsync(cancellationToken);
        var count = allWorkplaces.Count;

        _context.PhysicalWorkplaces.RemoveRange(allWorkplaces);
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogWarning("Deleted ALL {Count} physical workplaces", count);

        return Ok(new { message = $"Deleted {count} physical workplaces", count });
    }

    /// <summary>
    /// Bulk creates multiple workplaces for a service/building using a template.
    /// Creates workplaces with sequential codes like "GH-BZ-L01", "GH-BZ-L02", etc.
    /// </summary>
    [HttpPost("bulk")]
    [ProducesResponseType(typeof(BulkCreateWorkplacesResultDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<BulkCreateWorkplacesResultDto>> BulkCreate(
        [FromBody] BulkCreateWorkplacesDto dto,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var result = await _workplaceService.BulkCreateAsync(dto, cancellationToken);

            _logger.LogInformation("Bulk workplace creation completed. Success: {Success}, Errors: {Errors}",
                result.SuccessCount, result.FailureCount);

            return Ok(new BulkCreateWorkplacesResultDto(
                dto.Count,
                result.SuccessCount,
                result.FailureCount,
                result.CreatedWorkplaces.Select(w => new BulkCreateWorkplaceItemResult(
                    w.Id, w.Code, w.Name, true, null)).ToList()
                    .Concat(result.Errors.Select(e => new BulkCreateWorkplaceItemResult(
                        null, "", "", false, e))).ToList()
            ));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    // ============================================================
    // Workplace Gap Analysis Endpoints
    // ============================================================

    /// <summary>
    /// Analyzes the gap between user-assigned device owners and physical workplaces.
    /// Finds owners of laptops AND desktops/PCs (status InGebruik) who don't have a
    /// corresponding PhysicalWorkplace.
    /// </summary>
    [HttpGet("workplace-gap-analysis")]
    [ProducesResponseType(typeof(WorkplaceGapAnalysisDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<WorkplaceGapAnalysisDto>> GetWorkplaceGapAnalysis(
        [FromQuery] int? serviceId = null,
        [FromQuery] int limit = 100,
        CancellationToken cancellationToken = default)
    {
        // User-assigned end-user devices: laptops + desktops/PCs.
        // Aligned with DataQualityService.IsUserAssignedTypeCode (lap/desk/pc).
        var deviceKeywords = new[] { "laptop", "notebook", "lap", "desktop", "desk", "pc" };

        // Get all user-assigned devices that are InGebruik and have an owner
        var devicesInUseQuery = _context.Assets
            .Include(a => a.AssetType)
            .Include(a => a.Service)
            .Where(a => a.Status == AssetStatus.InGebruik)
            .Where(a => a.Owner != null && a.Owner != "")
            .Where(a =>
                (a.AssetType != null && (
                    deviceKeywords.Any(kw => a.AssetType.Code.ToLower().Contains(kw)) ||
                    deviceKeywords.Any(kw => a.AssetType.Name.ToLower().Contains(kw))
                )) ||
                deviceKeywords.Any(kw => a.Category.ToLower().Contains(kw))
            );

        if (serviceId.HasValue)
        {
            devicesInUseQuery = devicesInUseQuery.Where(a => a.ServiceId == serviceId.Value);
        }

        var devicesInUse = await devicesInUseQuery
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        // Get all existing workplace occupants (both email and name, normalized to lowercase)
        var existingOccupants = await _context.PhysicalWorkplaces
            .Where(pw => pw.IsActive && (
                (pw.CurrentOccupantEmail != null && pw.CurrentOccupantEmail != "") ||
                (pw.CurrentOccupantName != null && pw.CurrentOccupantName != "")
            ))
            .Select(pw => new {
                Email = pw.CurrentOccupantEmail != null ? pw.CurrentOccupantEmail.ToLower() : null,
                Name = pw.CurrentOccupantName != null ? pw.CurrentOccupantName.ToLower() : null
            })
            .ToListAsync(cancellationToken);

        // Build sets for both email and name matching
        var existingOccupantEmails = existingOccupants
            .Where(o => o.Email != null)
            .Select(o => o.Email!)
            .ToHashSet();
        var existingOccupantNames = existingOccupants
            .Where(o => o.Name != null)
            .Select(o => o.Name!)
            .ToHashSet();

        // Find device owners without workplaces (check both email and name)
        var orphanOwners = devicesInUse
            .Where(a => {
                var ownerLower = a.Owner!.ToLower();
                // Check if owner matches either an email OR a name
                return !existingOccupantEmails.Contains(ownerLower) &&
                       !existingOccupantNames.Contains(ownerLower);
            })
            .GroupBy(a => a.Owner!.ToLower())
            .Select(g => g.First()) // Take first device per unique owner
            .ToList();

        var ownersWithWorkplace = devicesInUse
            .Where(a => {
                var ownerLower = a.Owner!.ToLower();
                return existingOccupantEmails.Contains(ownerLower) ||
                       existingOccupantNames.Contains(ownerLower);
            })
            .GroupBy(a => a.Owner!.ToLower())
            .Count();

        // Group orphans by service
        var gapsByService = orphanOwners
            .GroupBy(a => new { a.ServiceId, ServiceName = a.Service?.Name, ServiceCode = a.Service?.Code })
            .Select(g => new WorkplaceGapByServiceDto(
                g.Key.ServiceId,
                g.Key.ServiceName ?? "Geen dienst",
                g.Key.ServiceCode,
                g.Count(),
                devicesInUse.Count(l => l.ServiceId == g.Key.ServiceId)
            ))
            .OrderByDescending(g => g.OwnersWithoutWorkplace)
            .ToList();

        // Create detailed orphan list (limited)
        var orphanDetails = orphanOwners
            .Take(limit)
            .Select(a => new OrphanDeviceOwnerDto(
                a.Owner!,
                ExtractNameFromEmail(a.Owner!),
                a.JobTitle,
                a.OfficeLocation,
                a.ServiceId,
                a.Service?.Name,
                a.Id,
                a.AssetCode,
                a.Brand,
                a.Model,
                a.SerialNumber,
                ClassifyDeviceType(a.AssetType?.Code, a.AssetType?.Name, a.Category)
            ))
            .OrderBy(o => o.ServiceName)
            .ThenBy(o => o.OwnerEmail)
            .ToList();

        var totalDeviceOwnersInUse = devicesInUse.GroupBy(a => a.Owner!.ToLower()).Count();
        var ownersWithoutWorkplace = orphanOwners.Count;
        var gapPercentage = totalDeviceOwnersInUse > 0
            ? Math.Round((decimal)ownersWithoutWorkplace / totalDeviceOwnersInUse * 100, 1)
            : 0;

        _logger.LogInformation(
            "Workplace gap analysis: {Total} device owners, {WithWorkplace} with workplace, {Without} without workplace ({Gap}%)",
            totalDeviceOwnersInUse, ownersWithWorkplace, ownersWithoutWorkplace, gapPercentage);

        // Get debug info about workplaces
        var totalActiveWorkplaces = await _context.PhysicalWorkplaces
            .CountAsync(pw => pw.IsActive, cancellationToken);
        var workplacesWithOccupant = existingOccupants.Count;

        // Sample occupant info (show both name and email)
        var sampleOccupants = existingOccupants
            .Take(3)
            .Select(o => o.Name ?? o.Email ?? "null")
            .ToList();

        var debugInfo = new WorkplaceGapDebugDto(
            totalActiveWorkplaces,
            workplacesWithOccupant,
            totalActiveWorkplaces - workplacesWithOccupant,
            devicesInUse.Take(3).Select(l => l.Owner ?? "null").ToList(),
            sampleOccupants
        );

        _logger.LogInformation(
            "Debug - {TotalWorkplaces} active workplaces, {WithOccupant} with occupant email, {Without} without",
            totalActiveWorkplaces, workplacesWithOccupant, totalActiveWorkplaces - workplacesWithOccupant);

        return Ok(new WorkplaceGapAnalysisDto(
            totalDeviceOwnersInUse,
            ownersWithWorkplace,
            ownersWithoutWorkplace,
            gapPercentage,
            gapsByService,
            orphanDetails,
            debugInfo
        ));
    }

    private static string ClassifyDeviceType(string? typeCode, string? typeName, string? category)
    {
        var haystack = string.Join(' ', typeCode, typeName, category).ToLowerInvariant();
        if (haystack.Contains("desktop") || haystack.Contains("desk") || haystack.Contains("pc"))
            return "desktop";
        return "laptop";
    }

    /// <summary>
    /// Auto-creates missing workplaces for laptop owners who don't have one.
    /// Creates a PhysicalWorkplace for each orphan owner with their laptop info.
    /// </summary>
    [HttpPost("auto-create-missing")]
    [ProducesResponseType(typeof(AutoCreateWorkplacesResultDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<AutoCreateWorkplacesResultDto>> AutoCreateMissingWorkplaces(
        [FromBody] AutoCreateMissingWorkplacesDto dto,
        CancellationToken cancellationToken = default)
    {
        // Validate default building exists
        var building = await _context.Buildings.FindAsync(new object[] { dto.DefaultBuildingId }, cancellationToken);
        if (building == null)
            return BadRequest($"Building with ID {dto.DefaultBuildingId} not found");

        // User-assigned end-user devices: laptops + desktops/PCs
        var deviceKeywords = new[] { "laptop", "notebook", "lap", "desktop", "desk", "pc" };

        // Get all user-assigned devices that are InGebruik and have an owner
        var laptopsInUseQuery = _context.Assets
            .Include(a => a.AssetType)
            .Include(a => a.Service)
            .Where(a => a.Status == AssetStatus.InGebruik)
            .Where(a => a.Owner != null && a.Owner != "")
            .Where(a =>
                (a.AssetType != null && (
                    deviceKeywords.Any(kw => a.AssetType.Code.ToLower().Contains(kw)) ||
                    deviceKeywords.Any(kw => a.AssetType.Name.ToLower().Contains(kw))
                )) ||
                deviceKeywords.Any(kw => a.Category.ToLower().Contains(kw))
            );

        // Filter by service IDs if provided
        if (dto.ServiceIds != null && dto.ServiceIds.Length > 0)
        {
            laptopsInUseQuery = laptopsInUseQuery.Where(a => a.ServiceId.HasValue && dto.ServiceIds.Contains(a.ServiceId.Value));
        }

        var laptopsInUse = await laptopsInUseQuery
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        // Get all existing workplace occupant emails
        var existingOccupantEmails = await _context.PhysicalWorkplaces
            .Where(pw => pw.IsActive && pw.CurrentOccupantEmail != null && pw.CurrentOccupantEmail != "")
            .Select(pw => pw.CurrentOccupantEmail!.ToLower())
            .Distinct()
            .ToListAsync(cancellationToken);

        var existingOccupantEmailSet = existingOccupantEmails.ToHashSet();

        // Get existing workplace codes for uniqueness check
        var existingCodes = (await _context.PhysicalWorkplaces
            .Select(pw => pw.Code.ToUpperInvariant())
            .ToListAsync(cancellationToken)).ToHashSet();

        // Find orphan owners (unique by email)
        var orphanOwners = laptopsInUse
            .Where(a => !existingOccupantEmailSet.Contains(a.Owner!.ToLower()))
            .GroupBy(a => a.Owner!.ToLower())
            .Select(g => g.First())
            .Take(dto.MaxToCreate)
            .ToList();

        var results = new List<AutoCreateWorkplaceItemResult>();

        foreach (var laptop in orphanOwners)
        {
            var ownerEmail = laptop.Owner!;
            var ownerName = ExtractNameFromEmail(ownerEmail);

            // Generate unique workplace code: WP-{initials}-{number}
            var initials = GetInitials(ownerName ?? ownerEmail);
            var workplaceCode = GenerateUniqueWorkplaceCode(initials, existingCodes);
            existingCodes.Add(workplaceCode.ToUpperInvariant());

            var workplaceName = $"Werkplek {ownerName ?? ownerEmail}";

            // Determine building - use service's default building if available, otherwise use provided default
            var buildingId = dto.DefaultBuildingId;
            var serviceId = laptop.ServiceId;

            var workplace = new PhysicalWorkplace
            {
                Code = workplaceCode,
                Name = workplaceName,
                Description = $"Auto-aangemaakt voor {ownerEmail}",
                BuildingId = buildingId,
                ServiceId = serviceId,
                Type = dto.WorkplaceType,
                MonitorCount = dto.MonitorCount,
                HasDockingStation = dto.HasDockingStation,
                CurrentOccupantEmail = ownerEmail,
                CurrentOccupantName = ownerName,
                OccupiedSince = DateTime.UtcNow,
                OccupantDeviceAssetCode = laptop.AssetCode,
                OccupantDeviceSerial = laptop.SerialNumber,
                OccupantDeviceBrand = laptop.Brand,
                OccupantDeviceModel = laptop.Model,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            try
            {
                _context.PhysicalWorkplaces.Add(workplace);
                await _context.SaveChangesAsync(cancellationToken);

                results.Add(new AutoCreateWorkplaceItemResult(
                    workplace.Id,
                    workplaceCode,
                    workplaceName,
                    ownerEmail,
                    ownerName,
                    true,
                    null
                ));

                _logger.LogInformation("Auto-created workplace {Code} for {Owner}", workplaceCode, ownerEmail);
            }
            catch (Exception ex)
            {
                results.Add(new AutoCreateWorkplaceItemResult(
                    null,
                    workplaceCode,
                    workplaceName,
                    ownerEmail,
                    ownerName,
                    false,
                    ex.Message
                ));

                _logger.LogError(ex, "Failed to auto-create workplace for {Owner}", ownerEmail);
            }
        }

        var successCount = results.Count(r => r.Success);
        var errorCount = results.Count(r => !r.Success);

        _logger.LogInformation(
            "Auto-create workplaces completed. Success: {Success}, Errors: {Errors}",
            successCount, errorCount);

        return Ok(new AutoCreateWorkplacesResultDto(
            results.Count,
            successCount,
            errorCount,
            results
        ));
    }

    /// <summary>
    /// Extracts a display name from an email address.
    /// E.g., "jan.janssen@domain.be" -> "Jan Janssen"
    /// </summary>
    private static string? ExtractNameFromEmail(string email)
    {
        if (string.IsNullOrWhiteSpace(email))
            return null;

        var atIndex = email.IndexOf('@');
        if (atIndex <= 0)
            return null;

        var localPart = email[..atIndex];

        // Handle formats: firstname.lastname, firstname_lastname, firstnamelastname
        var parts = localPart.Split(new[] { '.', '_', '-' }, StringSplitOptions.RemoveEmptyEntries);

        if (parts.Length >= 2)
        {
            // Capitalize each part
            var formattedParts = parts.Select(p =>
                char.ToUpper(p[0]) + (p.Length > 1 ? p[1..].ToLower() : "")
            );
            return string.Join(" ", formattedParts);
        }

        // Single word - just capitalize
        if (parts.Length == 1)
        {
            var part = parts[0];
            return char.ToUpper(part[0]) + (part.Length > 1 ? part[1..].ToLower() : "");
        }

        return localPart;
    }

    /// <summary>
    /// Gets initials from a name for workplace code generation.
    /// E.g., "Jan Janssen" -> "JJ", "Marie Van Der Berg" -> "MVD"
    /// </summary>
    private static string GetInitials(string name)
    {
        if (string.IsNullOrWhiteSpace(name))
            return "WP";

        var parts = name.Split(new[] { ' ', '.', '_', '-' }, StringSplitOptions.RemoveEmptyEntries);
        var initials = string.Concat(parts.Select(p => char.ToUpper(p[0])));

        return initials.Length >= 2 ? initials[..Math.Min(3, initials.Length)] : "WP";
    }

    /// <summary>
    /// Generates a unique workplace code based on initials.
    /// E.g., "JJ" -> "WP-JJ-001", if exists then "WP-JJ-002", etc.
    /// </summary>
    private static string GenerateUniqueWorkplaceCode(string initials, HashSet<string> existingCodes)
    {
        var prefix = $"WP-{initials}";
        var number = 1;

        while (number < 1000)
        {
            var code = $"{prefix}-{number:D3}";
            if (!existingCodes.Contains(code.ToUpperInvariant()))
                return code;
            number++;
        }

        // Fallback with timestamp
        return $"WP-{initials}-{DateTime.UtcNow:HHmmss}";
    }

    /// <summary>
    /// Parses a CSV line handling quoted fields with commas
    /// </summary>
    private static string[] ParseCsvLine(string line)
    {
        var result = new List<string>();
        var current = new System.Text.StringBuilder();
        var inQuotes = false;

        for (int i = 0; i < line.Length; i++)
        {
            var c = line[i];

            if (c == '"')
            {
                inQuotes = !inQuotes;
            }
            else if (c == ',' && !inQuotes)
            {
                result.Add(current.ToString());
                current.Clear();
            }
            else
            {
                current.Append(c);
            }
        }

        result.Add(current.ToString());
        return result.ToArray();
    }
}

using System.Globalization;
using System.Text;
using DjoppieInventory.Core.DTOs;
using DjoppieInventory.Core.Entities;
using DjoppieInventory.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DjoppieInventory.API.Controllers.Reports;

/// <summary>
/// Read-only leasing report endpoints. Per-asset rows with computed return-deadline
/// urgency thresholds: yellow (90d), orange (45d), red (21d).
/// </summary>
[ApiController]
[Route("api/reports/leases")]
[Authorize]
public class LeaseReportsController : ControllerBase
{
    private const int YellowThresholdDays = 90;
    private const int OrangeThresholdDays = 45;
    private const int RedThresholdDays = 21;

    private readonly ApplicationDbContext _context;
    private readonly ILogger<LeaseReportsController> _logger;

    public LeaseReportsController(ApplicationDbContext context, ILogger<LeaseReportsController> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// GET /api/reports/leases — per-asset rows under all (or filtered) lease contracts.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<LeaseReportRowDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<LeaseReportRowDto>>> GetLeaseRows(
        [FromQuery] string? urgency = null,
        [FromQuery] string? leaseStatus = null,
        [FromQuery] int? leaseContractId = null,
        [FromQuery] string? search = null,
        CancellationToken ct = default)
    {
        var today = DateTime.UtcNow.Date;

        var query = _context.Assets
            .AsNoTracking()
            .Where(a => a.LeaseContractId != null)
            .Include(a => a.LeaseContract)
            .Include(a => a.AssetType)
            .Include(a => a.Employee)
            .AsQueryable();

        if (leaseContractId.HasValue)
        {
            query = query.Where(a => a.LeaseContractId == leaseContractId.Value);
        }

        if (!string.IsNullOrWhiteSpace(leaseStatus) &&
            Enum.TryParse<LeaseStatus>(leaseStatus, true, out var leaseStatusEnum))
        {
            query = query.Where(a => a.LeaseStatus == leaseStatusEnum);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim().ToLower();
            query = query.Where(a =>
                (a.SerialNumber != null && a.SerialNumber.ToLower().Contains(s)) ||
                a.AssetCode.ToLower().Contains(s) ||
                (a.Owner != null && a.Owner.ToLower().Contains(s)) ||
                (a.LeaseContract!.LeaseScheduleNumber.ToLower().Contains(s)) ||
                (a.LeaseContract!.VendorName.ToLower().Contains(s)));
        }

        var assets = await query.ToListAsync(ct);

        var rows = assets.Select(a => BuildRow(a, today)).ToList();

        if (!string.IsNullOrWhiteSpace(urgency))
        {
            rows = rows.Where(r => string.Equals(r.UrgencyBucket, urgency, StringComparison.OrdinalIgnoreCase)).ToList();
        }

        // Sort: most urgent first, then by end date
        rows = rows
            .OrderBy(r => UrgencyOrder(r.UrgencyBucket))
            .ThenBy(r => r.PlannedLeaseEnd)
            .ThenBy(r => r.AssetCode)
            .ToList();

        return Ok(rows);
    }

    /// <summary>
    /// GET /api/reports/leases/summary — KPI dashboard summary.
    /// </summary>
    [HttpGet("summary")]
    [ProducesResponseType(typeof(LeaseReportSummaryDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<LeaseReportSummaryDto>> GetSummary(CancellationToken ct = default)
    {
        var today = DateTime.UtcNow.Date;

        var totalContracts = await _context.LeaseContracts.CountAsync(ct);

        var leasedAssets = await _context.Assets
            .AsNoTracking()
            .Where(a => a.LeaseContractId != null)
            .Include(a => a.LeaseContract)
            .ToListAsync(ct);

        var rows = leasedAssets.Select(a => BuildRow(a, today)).ToList();

        var active = rows.Where(r => r.LeaseStatus == nameof(LeaseStatus.InLease)).ToList();

        var summary = new LeaseReportSummaryDto
        {
            TotalContracts = totalContracts,
            ActiveAssets = active.Count,
            ReturnedAssets = rows.Count(r => r.LeaseStatus == nameof(LeaseStatus.Returned)),
            YellowAssets = active.Count(r => r.UrgencyBucket == "Yellow"),
            OrangeAssets = active.Count(r => r.UrgencyBucket == "Orange"),
            RedAssets = active.Count(r => r.UrgencyBucket == "Red"),
            OverdueAssets = active.Count(r => r.DaysRemaining < 0),
            AssetsByVendor = active
                .GroupBy(r => r.VendorName)
                .ToDictionary(g => g.Key, g => g.Count()),
        };

        return Ok(summary);
    }

    /// <summary>
    /// GET /api/reports/leases/export — CSV export of all (filtered) lease rows.
    /// </summary>
    [HttpGet("export")]
    [Produces("text/csv")]
    public async Task<IActionResult> Export(
        [FromQuery] string? urgency = null,
        [FromQuery] string? leaseStatus = null,
        [FromQuery] int? leaseContractId = null,
        [FromQuery] string? search = null,
        CancellationToken ct = default)
    {
        var result = await GetLeaseRows(urgency, leaseStatus, leaseContractId, search, ct);

        if (result.Result is not OkObjectResult ok || ok.Value is not IEnumerable<LeaseReportRowDto> rows)
        {
            return BadRequest("Could not produce export");
        }

        var sb = new StringBuilder();
        sb.AppendLine("Asset Code;Serial;Description;Brand;Model;Owner;Asset Status;Lease Schedule;Vendor;Customer;Planned Lease End;Days Remaining;Urgency;Lease Status");
        foreach (var r in rows)
        {
            sb.Append(Csv(r.AssetCode)).Append(';');
            sb.Append(Csv(r.SerialNumber ?? string.Empty)).Append(';');
            sb.Append(Csv(r.Description ?? string.Empty)).Append(';');
            sb.Append(Csv(r.Brand ?? string.Empty)).Append(';');
            sb.Append(Csv(r.Model ?? string.Empty)).Append(';');
            sb.Append(Csv(r.Owner ?? string.Empty)).Append(';');
            sb.Append(Csv(r.AssetStatus)).Append(';');
            sb.Append(Csv(r.LeaseScheduleNumber)).Append(';');
            sb.Append(Csv(r.VendorName)).Append(';');
            sb.Append(Csv(r.Customer ?? string.Empty)).Append(';');
            sb.Append(r.PlannedLeaseEnd.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture)).Append(';');
            sb.Append(r.DaysRemaining.ToString(CultureInfo.InvariantCulture)).Append(';');
            sb.Append(Csv(r.UrgencyBucket)).Append(';');
            sb.AppendLine(Csv(r.LeaseStatus));
        }

        var bytes = Encoding.UTF8.GetPreamble().Concat(Encoding.UTF8.GetBytes(sb.ToString())).ToArray();
        return File(bytes, "text/csv", $"lease-contracts-{DateTime.UtcNow:yyyy-MM-dd}.csv");
    }

    // ----- Helpers -----

    private static LeaseReportRowDto BuildRow(Asset asset, DateTime today)
    {
        var contract = asset.LeaseContract!;
        var daysRemaining = (int)(contract.PlannedLeaseEnd.Date - today).TotalDays;
        var urgency = ComputeUrgency(asset.LeaseStatus, daysRemaining);

        return new LeaseReportRowDto
        {
            AssetId = asset.Id,
            AssetCode = asset.AssetCode,
            SerialNumber = asset.SerialNumber,
            Description = !string.IsNullOrWhiteSpace(asset.Brand) || !string.IsNullOrWhiteSpace(asset.Model)
                ? $"{asset.Brand} {asset.Model}".Trim()
                : asset.AssetName,
            Brand = asset.Brand,
            Model = asset.Model,
            AssetTypeName = asset.AssetType?.Name,
            Owner = asset.Owner ?? asset.Employee?.DisplayName,
            AssetStatus = asset.Status.ToString(),
            LeaseContractId = contract.Id,
            LeaseScheduleNumber = contract.LeaseScheduleNumber,
            VendorName = contract.VendorName,
            Customer = contract.Customer,
            ContractStatus = contract.ContractStatus,
            PlannedLeaseEnd = contract.PlannedLeaseEnd,
            LeaseStatus = asset.LeaseStatus.ToString(),
            DaysRemaining = daysRemaining,
            UrgencyBucket = urgency,
        };
    }

    private static string ComputeUrgency(LeaseStatus leaseStatus, int daysRemaining)
    {
        if (leaseStatus == LeaseStatus.Returned) return "Returned";
        if (leaseStatus == LeaseStatus.Cancelled) return "Cancelled";
        if (leaseStatus == LeaseStatus.None) return "None";

        // InLease: bucket by days remaining
        if (daysRemaining < RedThresholdDays) return "Red";       // includes negative (overdue)
        if (daysRemaining < OrangeThresholdDays) return "Orange";
        if (daysRemaining < YellowThresholdDays) return "Yellow";
        return "Active";
    }

    private static int UrgencyOrder(string urgency) => urgency switch
    {
        "Red" => 0,
        "Orange" => 1,
        "Yellow" => 2,
        "Active" => 3,
        "Returned" => 4,
        "Cancelled" => 5,
        _ => 6,
    };

    private static string Csv(string value)
    {
        if (string.IsNullOrEmpty(value)) return string.Empty;
        if (value.Contains(';') || value.Contains('"') || value.Contains('\n'))
        {
            return "\"" + value.Replace("\"", "\"\"") + "\"";
        }
        return value;
    }
}

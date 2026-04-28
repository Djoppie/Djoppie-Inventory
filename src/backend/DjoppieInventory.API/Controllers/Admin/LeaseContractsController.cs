using System.Globalization;
using System.Text;
using DjoppieInventory.Core.DTOs;
using DjoppieInventory.Core.Entities;
using DjoppieInventory.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;

namespace DjoppieInventory.API.Controllers.Admin;

/// <summary>
/// Admin controller for managing lease contracts and importing them from supplier CSV exports.
/// </summary>
[ApiController]
[Route("api/admin/leases")]
[Authorize]
[EnableRateLimiting("bulk")]
public class LeaseContractsController : ControllerBase
{
    private const int MaxFileSizeBytes = 5 * 1024 * 1024;

    private readonly ApplicationDbContext _context;
    private readonly ILogger<LeaseContractsController> _logger;

    public LeaseContractsController(ApplicationDbContext context, ILogger<LeaseContractsController> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// GET /api/admin/leases — list all lease contracts (raw, not aggregated).
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<LeaseContract>>> GetAll(CancellationToken ct = default)
    {
        var contracts = await _context.LeaseContracts
            .AsNoTracking()
            .OrderBy(c => c.PlannedLeaseEnd)
            .ToListAsync(ct);
        return Ok(contracts);
    }

    /// <summary>
    /// POST /api/admin/leases/import — import lease contracts and asset links from supplier CSV.
    /// Expected columns (case-insensitive, order-flexible):
    ///   Serial number; Asset class; Description; Contract status; Customer; Lease schedule; Planned lease end
    /// </summary>
    [HttpPost("import")]
    [Consumes("multipart/form-data")]
    [ProducesResponseType(typeof(LeaseImportResultDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<LeaseImportResultDto>> Import(
        IFormFile file,
        CancellationToken ct = default)
    {
        if (file == null || file.Length == 0)
        {
            return BadRequest("No file uploaded. Please provide a CSV file.");
        }
        if (file.Length > MaxFileSizeBytes)
        {
            return BadRequest($"File exceeds {MaxFileSizeBytes / 1024 / 1024} MB.");
        }
        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (ext != ".csv" && ext != ".txt")
        {
            return BadRequest("Only .csv files are accepted.");
        }

        // Read full file as text
        string content;
        using (var reader = new StreamReader(file.OpenReadStream(), Encoding.UTF8, detectEncodingFromByteOrderMarks: true))
        {
            content = await reader.ReadToEndAsync(ct);
        }

        var parsed = ParseLeaseCsv(content);
        if (parsed.Errors.Count > 0 && parsed.Rows.Count == 0)
        {
            return BadRequest(new LeaseImportResultDto { Errors = parsed.Errors });
        }

        var result = new LeaseImportResultDto { Errors = parsed.Errors };

        // Group rows by lease schedule for contract upserts
        var rowsBySchedule = parsed.Rows
            .Where(r => !string.IsNullOrWhiteSpace(r.LeaseSchedule))
            .GroupBy(r => r.LeaseSchedule!.Trim());

        var existingContracts = await _context.LeaseContracts.ToDictionaryAsync(c => c.LeaseScheduleNumber, ct);

        foreach (var group in rowsBySchedule)
        {
            var sample = group.First();
            if (!existingContracts.TryGetValue(group.Key, out var contract))
            {
                contract = new LeaseContract
                {
                    LeaseScheduleNumber = group.Key,
                    VendorName = sample.Customer ?? "Unknown",
                    Customer = sample.Customer,
                    ContractStatus = sample.ContractStatus,
                    PlannedLeaseEnd = sample.PlannedLeaseEnd ?? DateTime.MinValue,
                    CreatedAt = DateTime.UtcNow,
                };
                _context.LeaseContracts.Add(contract);
                existingContracts[group.Key] = contract;
                result = result with { ContractsCreated = result.ContractsCreated + 1 };
            }
            else
            {
                var changed = false;
                if (sample.PlannedLeaseEnd.HasValue && contract.PlannedLeaseEnd != sample.PlannedLeaseEnd.Value)
                {
                    contract.PlannedLeaseEnd = sample.PlannedLeaseEnd.Value;
                    changed = true;
                }
                if (!string.IsNullOrWhiteSpace(sample.Customer) && contract.Customer != sample.Customer)
                {
                    contract.Customer = sample.Customer;
                    changed = true;
                }
                if (!string.IsNullOrWhiteSpace(sample.ContractStatus) && contract.ContractStatus != sample.ContractStatus)
                {
                    contract.ContractStatus = sample.ContractStatus;
                    changed = true;
                }
                if (changed)
                {
                    contract.UpdatedAt = DateTime.UtcNow;
                    result = result with { ContractsUpdated = result.ContractsUpdated + 1 };
                }
            }
        }

        // Save contracts first so we have IDs for asset linking
        await _context.SaveChangesAsync(ct);

        // Now match assets by serial number
        var serials = parsed.Rows
            .Where(r => !string.IsNullOrWhiteSpace(r.SerialNumber))
            .Select(r => r.SerialNumber!.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        var assetsBySerial = await _context.Assets
            .Where(a => a.SerialNumber != null && serials.Contains(a.SerialNumber))
            .ToDictionaryAsync(a => a.SerialNumber!, StringComparer.OrdinalIgnoreCase, ct);

        var unmatched = new List<LeaseImportUnmatchedDto>();
        var linked = 0;
        var updated = 0;

        foreach (var row in parsed.Rows)
        {
            if (string.IsNullOrWhiteSpace(row.SerialNumber) || string.IsNullOrWhiteSpace(row.LeaseSchedule))
            {
                continue;
            }

            var serial = row.SerialNumber.Trim();
            if (!assetsBySerial.TryGetValue(serial, out var asset))
            {
                unmatched.Add(new LeaseImportUnmatchedDto
                {
                    SerialNumber = serial,
                    Description = row.Description,
                    LeaseScheduleNumber = row.LeaseSchedule,
                    Reason = "No asset with this serial number was found in the inventory",
                });
                continue;
            }

            var contract = existingContracts[row.LeaseSchedule!.Trim()];
            var newLeaseStatus = MapLeaseStatus(row.ContractStatus);
            var changed = false;

            if (asset.LeaseContractId != contract.Id)
            {
                if (asset.LeaseContractId == null) linked++; else updated++;
                asset.LeaseContractId = contract.Id;
                changed = true;
            }
            if (asset.LeaseStatus != newLeaseStatus)
            {
                asset.LeaseStatus = newLeaseStatus;
                changed = true;
                if (asset.LeaseContractId == contract.Id) updated++;
            }

            if (changed)
            {
                asset.UpdatedAt = DateTime.UtcNow;
            }
        }

        await _context.SaveChangesAsync(ct);

        return Ok(result with
        {
            AssetsLinked = linked,
            AssetsUpdated = updated,
            UnmatchedSerials = unmatched,
        });
    }

    /// <summary>
    /// DELETE /api/admin/leases/{id} — delete a lease contract and detach all linked assets.
    /// </summary>
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken ct = default)
    {
        var contract = await _context.LeaseContracts.FindAsync(new object[] { id }, ct);
        if (contract == null) return NotFound();

        // Detach assets via FK SetNull behaviour by clearing the FK explicitly
        var linkedAssets = await _context.Assets.Where(a => a.LeaseContractId == id).ToListAsync(ct);
        foreach (var a in linkedAssets)
        {
            a.LeaseContractId = null;
            a.LeaseStatus = LeaseStatus.None;
            a.UpdatedAt = DateTime.UtcNow;
        }

        _context.LeaseContracts.Remove(contract);
        await _context.SaveChangesAsync(ct);
        return NoContent();
    }

    // ---- CSV parsing helpers ----

    private static LeaseStatus MapLeaseStatus(string? supplierStatus)
    {
        if (string.IsNullOrWhiteSpace(supplierStatus)) return LeaseStatus.InLease;
        var s = supplierStatus.Trim().ToLowerInvariant();
        if (s.Contains("return")) return LeaseStatus.Returned;
        if (s.Contains("cancel")) return LeaseStatus.Cancelled;
        if (s.Contains("end")) return LeaseStatus.Returned;
        return LeaseStatus.InLease;
    }

    private record ParsedRow(string? SerialNumber, string? AssetClass, string? Description, string? ContractStatus, string? Customer, string? LeaseSchedule, DateTime? PlannedLeaseEnd);
    private record ParseResult(List<ParsedRow> Rows, List<string> Errors);

    private static ParseResult ParseLeaseCsv(string content)
    {
        var rows = new List<ParsedRow>();
        var errors = new List<string>();

        var lines = content.Split(new[] { "\r\n", "\n" }, StringSplitOptions.None)
            .Where(l => !string.IsNullOrWhiteSpace(l))
            .ToList();
        if (lines.Count < 2)
        {
            errors.Add("CSV must contain a header row and at least one data row.");
            return new ParseResult(rows, errors);
        }

        // Detect separator (; or , or tab)
        var headerLine = lines[0];
        var sep = DetectSeparator(headerLine);
        var header = SplitCsvLine(headerLine, sep)
            .Select(h => NormalizeHeader(h))
            .ToList();

        int FindCol(params string[] candidates)
        {
            foreach (var c in candidates)
            {
                var idx = header.IndexOf(c);
                if (idx >= 0) return idx;
            }
            return -1;
        }

        var serialIdx = FindCol("serialnumber", "serial");
        var classIdx = FindCol("assetclass", "class");
        var descIdx = FindCol("description");
        var statusIdx = FindCol("contractstatus", "status");
        var customerIdx = FindCol("customer");
        var scheduleIdx = FindCol("leaseschedule", "schedule");
        var endIdx = FindCol("plannedleaseend", "leaseend", "endofcontract", "leaseenddate", "end");

        if (serialIdx < 0)
        {
            errors.Add("Required column 'Serial number' not found.");
        }
        if (scheduleIdx < 0)
        {
            errors.Add("Required column 'Lease schedule' not found.");
        }
        if (endIdx < 0)
        {
            errors.Add("Required column 'Planned lease end' not found.");
        }
        if (errors.Count > 0)
        {
            return new ParseResult(rows, errors);
        }

        for (int i = 1; i < lines.Count; i++)
        {
            var fields = SplitCsvLine(lines[i], sep);
            string? Get(int idx) => idx >= 0 && idx < fields.Count ? fields[idx]?.Trim() : null;

            var endRaw = Get(endIdx);
            DateTime? endDate = null;
            if (!string.IsNullOrWhiteSpace(endRaw))
            {
                endDate = TryParseDate(endRaw);
                if (!endDate.HasValue)
                {
                    errors.Add($"Row {i + 1}: could not parse date '{endRaw}'");
                    continue;
                }
            }

            rows.Add(new ParsedRow(
                SerialNumber: Get(serialIdx),
                AssetClass: Get(classIdx),
                Description: Get(descIdx),
                ContractStatus: Get(statusIdx),
                Customer: Get(customerIdx),
                LeaseSchedule: Get(scheduleIdx),
                PlannedLeaseEnd: endDate));
        }

        return new ParseResult(rows, errors);
    }

    private static char DetectSeparator(string headerLine)
    {
        var counts = new Dictionary<char, int>
        {
            [';'] = headerLine.Count(c => c == ';'),
            [','] = headerLine.Count(c => c == ','),
            ['\t'] = headerLine.Count(c => c == '\t'),
        };
        return counts.OrderByDescending(kv => kv.Value).First().Key;
    }

    private static List<string> SplitCsvLine(string line, char sep)
    {
        var fields = new List<string>();
        var sb = new StringBuilder();
        var inQuotes = false;
        for (int i = 0; i < line.Length; i++)
        {
            var c = line[i];
            if (inQuotes)
            {
                if (c == '"')
                {
                    if (i + 1 < line.Length && line[i + 1] == '"')
                    {
                        sb.Append('"');
                        i++;
                    }
                    else
                    {
                        inQuotes = false;
                    }
                }
                else
                {
                    sb.Append(c);
                }
            }
            else
            {
                if (c == '"')
                {
                    inQuotes = true;
                }
                else if (c == sep)
                {
                    fields.Add(sb.ToString());
                    sb.Clear();
                }
                else
                {
                    sb.Append(c);
                }
            }
        }
        fields.Add(sb.ToString());
        return fields;
    }

    private static string NormalizeHeader(string h) =>
        new string(h.ToLowerInvariant().Where(c => !char.IsWhiteSpace(c) && c != '_' && c != '-').ToArray());

    private static DateTime? TryParseDate(string raw)
    {
        var formats = new[]
        {
            "dd/MM/yyyy", "d/M/yyyy", "yyyy-MM-dd", "MM/dd/yyyy",
            "dd-MM-yyyy", "d-M-yyyy", "yyyy/MM/dd",
        };
        foreach (var fmt in formats)
        {
            if (DateTime.TryParseExact(raw, fmt, CultureInfo.InvariantCulture, DateTimeStyles.None, out var parsed))
            {
                return DateTime.SpecifyKind(parsed, DateTimeKind.Utc);
            }
        }
        if (DateTime.TryParse(raw, CultureInfo.InvariantCulture, DateTimeStyles.None, out var fallback))
        {
            return DateTime.SpecifyKind(fallback, DateTimeKind.Utc);
        }
        return null;
    }
}

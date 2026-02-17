using System.Globalization;
using System.Text;
using DjoppieInventory.Core.DTOs;
using DjoppieInventory.Core.Entities;
using DjoppieInventory.Core.Interfaces;
using Microsoft.Extensions.Logging;

namespace DjoppieInventory.Infrastructure.Services;

/// <summary>
/// Service for importing assets from CSV files with validation and automatic event creation.
/// Simplified CSV structure - optional fields can be auto-filled from Intune.
/// </summary>
public class CsvImportService : ICsvImportService
{
    private readonly IAssetRepository _assetRepository;
    private readonly IAssetTypeRepository _assetTypeRepository;
    private readonly IServiceRepository _serviceRepository;
    private readonly IAssetEventService _assetEventService;
    private readonly IAssetCodeGenerator _assetCodeGenerator;
    private readonly ILogger<CsvImportService> _logger;

    // Simplified CSV columns
    // Required: SerialNumber, AssetTypeCode, Status, PurchaseDate
    // Optional: IsDummy, AssetName, ServiceCode, Owner, Brand, Model, InstallationDate, WarrantyExpiry, Notes
    private static readonly string[] ExpectedHeaders =
    {
        "SerialNumber",      // 0 - REQUIRED
        "AssetTypeCode",     // 1 - REQUIRED
        "Status",            // 2 - REQUIRED (default: Stock)
        "PurchaseDate",      // 3 - REQUIRED
        "IsDummy",           // 4 - optional (default: false) - true/false or 1/0
        "AssetName",         // 5 - optional (Intune: DeviceName)
        "ServiceCode",       // 6 - optional (location/department)
        "Owner",             // 7 - optional (Intune: Primary User)
        "Brand",             // 8 - optional (Intune)
        "Model",             // 9 - optional (Intune)
        "InstallationDate",  // 10 - optional
        "WarrantyExpiry",    // 11 - optional
        "Notes"              // 12 - optional
    };

    public CsvImportService(
        IAssetRepository assetRepository,
        IAssetTypeRepository assetTypeRepository,
        IServiceRepository serviceRepository,
        IAssetEventService assetEventService,
        IAssetCodeGenerator assetCodeGenerator,
        ILogger<CsvImportService> logger)
    {
        _assetRepository = assetRepository;
        _assetTypeRepository = assetTypeRepository;
        _serviceRepository = serviceRepository;
        _assetEventService = assetEventService;
        _assetCodeGenerator = assetCodeGenerator;
        _logger = logger;
    }

    public async Task<CsvImportResultDto> ImportAssetsAsync(
        Stream csvStream,
        string performedBy,
        string performedByEmail,
        CancellationToken cancellationToken = default)
    {
        var result = new CsvImportResultDto();
        var rowResults = new List<CsvRowResultDto>();

        try
        {
            // Parse CSV file
            var csvRows = ParseCsvStream(csvStream);
            result = result with { TotalRows = csvRows.Count };

            // Pre-fetch reference data for validation (avoid N+1 queries)
            var assetTypes = (await _assetTypeRepository.GetAllAsync(includeInactive: false, cancellationToken))
                .ToDictionary(at => at.Code, at => at, StringComparer.OrdinalIgnoreCase);
            var services = (await _serviceRepository.GetAllAsync(includeInactive: false, cancellationToken: cancellationToken))
                .ToDictionary(s => s.Code, s => s, StringComparer.OrdinalIgnoreCase);

            // Get all existing serial numbers for duplicate detection
            var existingSerialNumbers = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

            // Process each row
            foreach (var csvRow in csvRows)
            {
                var rowResult = await ProcessCsvRowAsync(
                    csvRow,
                    assetTypes,
                    services,
                    existingSerialNumbers,
                    performedBy,
                    performedByEmail,
                    cancellationToken);

                rowResults.Add(rowResult);

                // Track successfully imported serial numbers to avoid duplicates within same import
                if (rowResult.Success && !string.IsNullOrEmpty(rowResult.SerialNumber))
                {
                    existingSerialNumbers.Add(rowResult.SerialNumber);
                }
            }

            var successCount = rowResults.Count(r => r.Success);
            var errorCount = rowResults.Count(r => !r.Success);

            result = result with
            {
                SuccessCount = successCount,
                ErrorCount = errorCount,
                Results = rowResults
            };

            _logger.LogInformation(
                "CSV import completed by {PerformedBy}: {SuccessCount} successful, {ErrorCount} failed out of {TotalRows} rows",
                performedBy, successCount, errorCount, result.TotalRows);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "CSV import failed with exception for user {PerformedBy}", performedBy);
            throw;
        }

        return result;
    }

    public async Task<CsvImportResultDto> ValidateAssetsAsync(
        Stream csvStream,
        CancellationToken cancellationToken = default)
    {
        var result = new CsvImportResultDto();
        var rowResults = new List<CsvRowResultDto>();

        try
        {
            // Parse CSV file
            var csvRows = ParseCsvStream(csvStream);
            result = result with { TotalRows = csvRows.Count };

            // Pre-fetch reference data for validation (avoid N+1 queries)
            var assetTypes = (await _assetTypeRepository.GetAllAsync(includeInactive: false, cancellationToken))
                .ToDictionary(at => at.Code, at => at, StringComparer.OrdinalIgnoreCase);
            var services = (await _serviceRepository.GetAllAsync(includeInactive: false, cancellationToken: cancellationToken))
                .ToDictionary(s => s.Code, s => s, StringComparer.OrdinalIgnoreCase);

            // Track serial numbers within this CSV for duplicate detection
            var serialNumbersInCsv = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

            // Process each row for validation only
            foreach (var csvRow in csvRows)
            {
                var rowResult = await ValidateCsvRowAsync(
                    csvRow,
                    assetTypes,
                    services,
                    serialNumbersInCsv,
                    cancellationToken);

                rowResults.Add(rowResult);

                // Track serial numbers to detect duplicates within this import
                if (!string.IsNullOrWhiteSpace(csvRow.SerialNumber))
                {
                    serialNumbersInCsv.Add(csvRow.SerialNumber);
                }
            }

            var successCount = rowResults.Count(r => r.Success);
            var errorCount = rowResults.Count(r => !r.Success);

            result = result with
            {
                SuccessCount = successCount,
                ErrorCount = errorCount,
                Results = rowResults
            };

            _logger.LogInformation(
                "CSV validation completed: {SuccessCount} valid, {ErrorCount} invalid out of {TotalRows} rows",
                successCount, errorCount, result.TotalRows);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "CSV validation failed with exception");
            throw;
        }

        return result;
    }

    private async Task<CsvRowResultDto> ValidateCsvRowAsync(
        CsvImportRowDto csvRow,
        Dictionary<string, AssetType> assetTypes,
        Dictionary<string, Service> services,
        HashSet<string> serialNumbersInCsv,
        CancellationToken cancellationToken)
    {
        var errors = new List<string>();

        // Validate REQUIRED fields
        if (string.IsNullOrWhiteSpace(csvRow.SerialNumber))
        {
            errors.Add("SerialNumber is required");
        }

        if (string.IsNullOrWhiteSpace(csvRow.AssetTypeCode))
        {
            errors.Add("AssetTypeCode is required");
        }

        if (string.IsNullOrWhiteSpace(csvRow.PurchaseDate))
        {
            errors.Add("PurchaseDate is required");
        }

        // Validate serial number uniqueness
        if (!string.IsNullOrWhiteSpace(csvRow.SerialNumber))
        {
            if (serialNumbersInCsv.Contains(csvRow.SerialNumber))
            {
                errors.Add($"SerialNumber '{csvRow.SerialNumber}' is duplicated in this CSV");
            }
            else if (await _assetRepository.SerialNumberExistsAsync(csvRow.SerialNumber, excludeAssetId: null, cancellationToken))
            {
                errors.Add($"SerialNumber '{csvRow.SerialNumber}' already exists in the database");
            }
        }

        // Validate AssetTypeCode (required)
        if (!string.IsNullOrWhiteSpace(csvRow.AssetTypeCode))
        {
            if (!assetTypes.ContainsKey(csvRow.AssetTypeCode))
            {
                var validCodes = string.Join(", ", assetTypes.Keys.OrderBy(k => k));
                errors.Add($"AssetTypeCode '{csvRow.AssetTypeCode}' not found. Valid: {validCodes}");
            }
        }

        // Validate ServiceCode if provided
        if (!string.IsNullOrWhiteSpace(csvRow.ServiceCode))
        {
            if (!services.ContainsKey(csvRow.ServiceCode))
            {
                var validCodes = string.Join(", ", services.Keys.OrderBy(k => k));
                errors.Add($"ServiceCode '{csvRow.ServiceCode}' not found. Valid: {validCodes}");
            }
        }

        // Validate Status (default: Stock)
        var statusValue = string.IsNullOrWhiteSpace(csvRow.Status) ? "Stock" : csvRow.Status;
        if (!Enum.TryParse<AssetStatus>(statusValue, ignoreCase: true, out _))
        {
            errors.Add($"Invalid Status '{csvRow.Status}'. Valid: InGebruik, Stock, Herstelling, Defect, UitDienst");
        }

        // Validate dates
        ValidateDateFormat(csvRow.PurchaseDate, "PurchaseDate", errors, required: true);
        ValidateDateFormat(csvRow.WarrantyExpiry, "WarrantyExpiry", errors, required: false);
        ValidateDateFormat(csvRow.InstallationDate, "InstallationDate", errors, required: false);

        return new CsvRowResultDto
        {
            RowNumber = csvRow.RowNumber,
            Success = errors.Count == 0,
            SerialNumber = csvRow.SerialNumber,
            Errors = errors
        };
    }

    private void ValidateDateFormat(string? dateString, string fieldName, List<string> errors, bool required)
    {
        if (string.IsNullOrWhiteSpace(dateString))
        {
            if (required)
            {
                errors.Add($"{fieldName} is required");
            }
            return;
        }

        // Supported date formats (European and ISO)
        var formats = new[]
        {
            "dd-MM-yyyy", "dd/MM/yyyy", "d-M-yyyy", "d/M/yyyy",
            "yyyy-MM-dd", "yyyy/MM/dd"
        };

        foreach (var format in formats)
        {
            if (DateTime.TryParseExact(dateString.Trim(), format, CultureInfo.InvariantCulture, DateTimeStyles.None, out _))
            {
                return; // Valid date
            }
        }

        // Try generic parsing as fallback
        if (DateTime.TryParse(dateString, new CultureInfo("nl-BE"), DateTimeStyles.None, out _))
        {
            return; // Valid date
        }

        errors.Add($"{fieldName} '{dateString}' is invalid. Use DD-MM-YYYY or YYYY-MM-DD");
    }

    private async Task<CsvRowResultDto> ProcessCsvRowAsync(
        CsvImportRowDto csvRow,
        Dictionary<string, AssetType> assetTypes,
        Dictionary<string, Service> services,
        HashSet<string> existingSerialNumbers,
        string performedBy,
        string performedByEmail,
        CancellationToken cancellationToken)
    {
        var errors = new List<string>();

        // Validate REQUIRED fields
        if (string.IsNullOrWhiteSpace(csvRow.SerialNumber))
        {
            errors.Add("SerialNumber is required");
        }

        if (string.IsNullOrWhiteSpace(csvRow.AssetTypeCode))
        {
            errors.Add("AssetTypeCode is required");
        }

        if (string.IsNullOrWhiteSpace(csvRow.PurchaseDate))
        {
            errors.Add("PurchaseDate is required");
        }

        // Validate serial number uniqueness
        if (!string.IsNullOrWhiteSpace(csvRow.SerialNumber))
        {
            if (existingSerialNumbers.Contains(csvRow.SerialNumber))
            {
                errors.Add($"SerialNumber '{csvRow.SerialNumber}' is duplicated in this import");
            }
            else if (await _assetRepository.SerialNumberExistsAsync(csvRow.SerialNumber, excludeAssetId: null, cancellationToken))
            {
                errors.Add($"SerialNumber '{csvRow.SerialNumber}' already exists in the system");
            }
        }

        // Validate AssetTypeCode (required)
        AssetType? assetType = null;
        if (!string.IsNullOrWhiteSpace(csvRow.AssetTypeCode))
        {
            if (!assetTypes.TryGetValue(csvRow.AssetTypeCode, out assetType))
            {
                var validCodes = string.Join(", ", assetTypes.Keys.OrderBy(k => k));
                errors.Add($"AssetTypeCode '{csvRow.AssetTypeCode}' not found. Valid codes: {validCodes}");
            }
        }

        // Validate ServiceCode if provided
        Service? service = null;
        if (!string.IsNullOrWhiteSpace(csvRow.ServiceCode))
        {
            if (!services.TryGetValue(csvRow.ServiceCode, out service))
            {
                var validCodes = string.Join(", ", services.Keys.OrderBy(k => k));
                errors.Add($"ServiceCode '{csvRow.ServiceCode}' not found. Valid codes: {validCodes}");
            }
        }

        // Validate and parse Status (default: Stock)
        AssetStatus status = AssetStatus.Stock;
        var statusValue = string.IsNullOrWhiteSpace(csvRow.Status) ? "Stock" : csvRow.Status;
        if (!Enum.TryParse<AssetStatus>(statusValue, ignoreCase: true, out status))
        {
            errors.Add($"Invalid Status '{csvRow.Status}'. Valid values: InGebruik, Stock, Herstelling, Defect, UitDienst");
        }

        // Validate and parse dates
        DateTime? purchaseDate = ParseDate(csvRow.PurchaseDate, "PurchaseDate", errors, required: true);
        DateTime? warrantyExpiry = ParseDate(csvRow.WarrantyExpiry, "WarrantyExpiry", errors, required: false);
        DateTime? installationDate = ParseDate(csvRow.InstallationDate, "InstallationDate", errors, required: false);

        // If there are validation errors, return failure result
        if (errors.Count > 0)
        {
            return new CsvRowResultDto
            {
                RowNumber = csvRow.RowNumber,
                Success = false,
                SerialNumber = csvRow.SerialNumber,
                Errors = errors
            };
        }

        // Create the asset
        try
        {
            // Determine year from purchase date or current year
            int year = purchaseDate?.Year ?? DateTime.UtcNow.Year;

            // Generate asset code using the new format (TYPE-YY-MERK-NUMMER)
            var assetCode = await _assetCodeGenerator.GenerateCodeAsync(
                assetType!.Id,
                csvRow.Brand, // Brand for asset code (e.g., DELL, HP)
                year,
                isDummy: csvRow.IsDummy,
                cancellationToken);

            // Use AssetType.Name as Category
            var category = assetType.Name;

            var asset = new Asset
            {
                AssetCode = assetCode,
                SerialNumber = csvRow.SerialNumber,
                AssetName = csvRow.AssetName ?? string.Empty,
                Category = category,
                AssetTypeId = assetType.Id,
                ServiceId = service?.Id,
                Owner = csvRow.Owner,
                Brand = csvRow.Brand,
                Model = csvRow.Model,
                Status = status,
                PurchaseDate = purchaseDate,
                WarrantyExpiry = warrantyExpiry,
                InstallationDate = installationDate,
                IsDummy = csvRow.IsDummy
            };

            var createdAsset = await _assetRepository.CreateAsync(asset, cancellationToken);

            // Create "Created" event with notes from CSV
            await _assetEventService.CreateCreatedEventAsync(
                createdAsset.Id,
                performedBy,
                performedByEmail,
                csvRow.Notes,
                cancellationToken);

            _logger.LogInformation(
                "CSV import: Created asset {AssetCode} with serial {SerialNumber} (Row {RowNumber})",
                createdAsset.AssetCode, createdAsset.SerialNumber, csvRow.RowNumber);

            return new CsvRowResultDto
            {
                RowNumber = csvRow.RowNumber,
                Success = true,
                AssetCode = createdAsset.AssetCode,
                SerialNumber = createdAsset.SerialNumber,
                Errors = new List<string>()
            };
        }
        catch (Microsoft.EntityFrameworkCore.DbUpdateException dbEx) when (dbEx.InnerException?.Message.Contains("UNIQUE constraint failed") == true)
        {
            _logger.LogWarning("CSV import: Duplicate serial number detected for row {RowNumber}: {SerialNumber}", csvRow.RowNumber, csvRow.SerialNumber);
            return new CsvRowResultDto
            {
                RowNumber = csvRow.RowNumber,
                Success = false,
                SerialNumber = csvRow.SerialNumber,
                Errors = new List<string> { $"SerialNumber '{csvRow.SerialNumber}' already exists in the database" }
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to create asset from CSV row {RowNumber}", csvRow.RowNumber);
            return new CsvRowResultDto
            {
                RowNumber = csvRow.RowNumber,
                Success = false,
                SerialNumber = csvRow.SerialNumber,
                Errors = new List<string> { $"Failed to create asset: {ex.Message}" }
            };
        }
    }

    private DateTime? ParseDate(string? dateString, string fieldName, List<string> errors, bool required)
    {
        if (string.IsNullOrWhiteSpace(dateString))
        {
            if (required)
            {
                errors.Add($"{fieldName} is required");
            }
            return null;
        }

        // Supported date formats (European and ISO)
        var formats = new[]
        {
            "dd-MM-yyyy",   // European: 15-01-2024
            "dd/MM/yyyy",   // European with slash: 15/01/2024
            "d-M-yyyy",     // European short: 5-1-2024
            "d/M/yyyy",     // European short with slash: 5/1/2024
            "yyyy-MM-dd",   // ISO: 2024-01-15
            "yyyy/MM/dd",   // ISO with slash: 2024/01/15
        };

        foreach (var format in formats)
        {
            if (DateTime.TryParseExact(dateString.Trim(), format, CultureInfo.InvariantCulture, DateTimeStyles.None, out var date))
            {
                return date;
            }
        }

        // Try generic parsing as fallback
        if (DateTime.TryParse(dateString, new CultureInfo("nl-BE"), DateTimeStyles.None, out var nlDate))
        {
            return nlDate;
        }

        errors.Add($"{fieldName} '{dateString}' is not a valid date. Supported formats: DD-MM-YYYY or YYYY-MM-DD");
        return null;
    }

    private List<CsvImportRowDto> ParseCsvStream(Stream csvStream)
    {
        var rows = new List<CsvImportRowDto>();

        using var reader = new StreamReader(csvStream, Encoding.UTF8);

        // Read and validate header
        var headerLine = reader.ReadLine();
        if (string.IsNullOrWhiteSpace(headerLine))
        {
            throw new InvalidOperationException("CSV file is empty or has no header row");
        }

        var headers = ParseCsvLine(headerLine);
        ValidateHeaders(headers);

        // Read data rows
        int rowNumber = 1;
        string? line;
        while ((line = reader.ReadLine()) != null)
        {
            // Skip empty lines and comment lines (starting with #)
            if (string.IsNullOrWhiteSpace(line) || line.TrimStart().StartsWith('#'))
            {
                continue;
            }

            var values = ParseCsvLine(line);

            // Ensure we have enough columns (pad with empty strings if needed)
            while (values.Count < ExpectedHeaders.Length)
            {
                values.Add(string.Empty);
            }

            var row = new CsvImportRowDto
            {
                RowNumber = rowNumber,
                SerialNumber = GetValue(values, 0),
                AssetTypeCode = GetValue(values, 1),
                Status = GetValueOrDefault(values, 2, "Stock"),
                PurchaseDate = GetValue(values, 3),
                IsDummy = ParseBool(GetValueOrNull(values, 4)),
                AssetName = GetValueOrNull(values, 5),
                ServiceCode = GetValueOrNull(values, 6),
                Owner = GetValueOrNull(values, 7),
                Brand = GetValueOrNull(values, 8),
                Model = GetValueOrNull(values, 9),
                InstallationDate = GetValueOrNull(values, 10),
                WarrantyExpiry = GetValueOrNull(values, 11),
                Notes = GetValueOrNull(values, 12)
            };

            rows.Add(row);
            rowNumber++;
        }

        return rows;
    }

    private void ValidateHeaders(List<string> headers)
    {
        // Check minimum required headers (at least the 4 required columns)
        if (headers.Count < 4)
        {
            throw new InvalidOperationException(
                $"CSV file has {headers.Count} columns, expected at least 4 required columns. " +
                $"Required: SerialNumber, AssetTypeCode, Status, PurchaseDate");
        }

        // Validate first 4 headers are correct (required columns)
        var requiredHeaders = new[] { "SerialNumber", "AssetTypeCode", "Status", "PurchaseDate" };
        for (int i = 0; i < requiredHeaders.Length && i < headers.Count; i++)
        {
            if (!headers[i].Equals(requiredHeaders[i], StringComparison.OrdinalIgnoreCase))
            {
                throw new InvalidOperationException(
                    $"CSV header mismatch at column {i + 1}. Expected '{requiredHeaders[i]}', got '{headers[i]}'");
            }
        }
    }

    private List<string> ParseCsvLine(string line)
    {
        var values = new List<string>();
        var currentValue = new StringBuilder();
        bool inQuotes = false;

        for (int i = 0; i < line.Length; i++)
        {
            char c = line[i];

            if (c == '"')
            {
                if (inQuotes && i + 1 < line.Length && line[i + 1] == '"')
                {
                    currentValue.Append('"');
                    i++;
                }
                else
                {
                    inQuotes = !inQuotes;
                }
            }
            else if (c == ',' && !inQuotes)
            {
                values.Add(currentValue.ToString().Trim());
                currentValue.Clear();
            }
            else
            {
                currentValue.Append(c);
            }
        }

        values.Add(currentValue.ToString().Trim());
        return values;
    }

    private string GetValue(List<string> values, int index)
    {
        return index < values.Count ? values[index] : string.Empty;
    }

    private string GetValueOrDefault(List<string> values, int index, string defaultValue)
    {
        var value = GetValue(values, index);
        return string.IsNullOrWhiteSpace(value) ? defaultValue : value;
    }

    private string? GetValueOrNull(List<string> values, int index)
    {
        var value = GetValue(values, index);
        return string.IsNullOrWhiteSpace(value) ? null : value;
    }

    private bool ParseBool(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return false;

        // Support various boolean formats
        var lower = value.ToLowerInvariant().Trim();
        return lower == "true" || lower == "1" || lower == "yes" || lower == "ja";
    }

    public async Task<byte[]> GenerateCsvTemplateAsync(CancellationToken cancellationToken = default)
    {
        // Fetch current service codes for the comments
        var services = await _serviceRepository.GetAllAsync(includeInactive: false, cancellationToken: cancellationToken);
        var assetTypes = await _assetTypeRepository.GetAllAsync(includeInactive: false, cancellationToken);

        var sb = new StringBuilder();

        // Header row
        sb.AppendLine(string.Join(",", ExpectedHeaders));

        // Example row with sample data (using European date format)
        var exampleRow = new[]
        {
            "ABC123",           // SerialNumber (REQUIRED)
            "LAP",              // AssetTypeCode (REQUIRED)
            "Stock",            // Status (REQUIRED, default: Stock)
            "15-01-2024",       // PurchaseDate (REQUIRED) - DD-MM-YYYY
            "false",            // IsDummy (optional, default: false)
            "",                 // AssetName (optional - Intune)
            "IT",               // ServiceCode (optional - location)
            "",                 // Owner (optional - Intune)
            "",                 // Brand (optional - Intune)
            "",                 // Model (optional - Intune)
            "",                 // InstallationDate (optional)
            "15-01-2027",       // WarrantyExpiry (optional) - DD-MM-YYYY
            "Imported asset"    // Notes (optional)
        };

        sb.AppendLine(string.Join(",", exampleRow.Select(EscapeCsvValue)));

        // Add instructions as comments
        sb.AppendLine();
        sb.AppendLine("# ========================================");
        sb.AppendLine("# CSV Import Template - Djoppie Inventory");
        sb.AppendLine("# ========================================");
        sb.AppendLine("#");
        sb.AppendLine("# REQUIRED COLUMNS:");
        sb.AppendLine("#   - SerialNumber: Unique device serial number");
        sb.AppendLine("#   - AssetTypeCode: Type code (see below)");
        sb.AppendLine("#   - Status: InGebruik, Stock, Herstelling, Defect, UitDienst, Nieuw");
        sb.AppendLine("#   - PurchaseDate: DD-MM-YYYY (European) or YYYY-MM-DD (ISO)");
        sb.AppendLine("#");
        sb.AppendLine("# OPTIONAL COLUMNS:");
        sb.AppendLine("#   - IsDummy: true/false, 1/0, yes/no, ja/nee (default: false)");
        sb.AppendLine("#             Dummy assets get 'DUM-' prefix in asset code");
        sb.AppendLine("#");
        sb.AppendLine("# OPTIONAL COLUMNS (will be auto-filled from Intune if available):");
        sb.AppendLine("#   - AssetName: Device name (Intune: DeviceName)");
        sb.AppendLine("#   - Owner: Primary user (Intune: Primary User)");
        sb.AppendLine("#   - Brand: Manufacturer (Intune)");
        sb.AppendLine("#   - Model: Model name (Intune)");
        sb.AppendLine("#");
        sb.AppendLine("# OTHER OPTIONAL COLUMNS:");
        sb.AppendLine("#   - ServiceCode: Department/Location code (see below)");
        sb.AppendLine("#   - InstallationDate: DD-MM-YYYY or YYYY-MM-DD");
        sb.AppendLine("#   - WarrantyExpiry: DD-MM-YYYY or YYYY-MM-DD");
        sb.AppendLine("#   - Notes: Additional information");
        sb.AppendLine("#");

        // List valid AssetTypeCodes
        sb.AppendLine("# ASSET TYPE CODES:");
        foreach (var at in assetTypes.OrderBy(a => a.SortOrder))
        {
            sb.AppendLine($"#   {at.Code} = {at.Name}");
        }
        sb.AppendLine("#");

        // List valid ServiceCodes (used as location)
        sb.AppendLine("# SERVICE CODES (Location):");
        foreach (var s in services.OrderBy(s => s.SortOrder))
        {
            sb.AppendLine($"#   {s.Code} = {s.Name}");
        }
        sb.AppendLine("#");
        sb.AppendLine("# DELETE THIS EXAMPLE ROW AND ADD YOUR DATA BELOW");
        sb.AppendLine("# ========================================");

        return Encoding.UTF8.GetBytes(sb.ToString());
    }

    // Legacy synchronous method for backwards compatibility
    public byte[] GenerateCsvTemplate()
    {
        return GenerateCsvTemplateAsync(CancellationToken.None).GetAwaiter().GetResult();
    }

    private string EscapeCsvValue(string value)
    {
        if (string.IsNullOrEmpty(value))
        {
            return string.Empty;
        }

        if (value.Contains(',') || value.Contains('"') || value.Contains('\n') || value.Contains('\r'))
        {
            return $"\"{value.Replace("\"", "\"\"")}\"";
        }

        return value;
    }
}

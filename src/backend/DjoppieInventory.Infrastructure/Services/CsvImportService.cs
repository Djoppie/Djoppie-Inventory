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

    // CSV columns - supports both creating new assets and updating existing ones
    // AssetCode: If provided and exists → update; if not provided or doesn't exist → create new
    // For CREATE: AssetTypeCode and PurchaseDate are REQUIRED
    // For UPDATE: AssetCode is REQUIRED
    private static readonly string[] ExpectedHeaders =
    {
        "AssetCode",           // 0 - For updates (if exists, update; otherwise create new)
        "SerialNumber",        // 1 - Optional (NOT unique - only AssetCode is unique)
        "AssetTypeCode",       // 2 - REQUIRED for new assets
        "Status",              // 3 - REQUIRED (default: Stock)
        "PurchaseDate",        // 4 - REQUIRED for new assets
        "IsDummy",             // 5 - Optional (default: false) - true/false or 1/0
        "AssetName",           // 6 - Optional (Intune: DeviceName)
        "Alias",               // 7 - Optional user-friendly name
        "ServiceCode",         // 8 - Optional (location/department)
        "InstallationLocation", // 9 - Optional (specific location within building)
        "Owner",               // 10 - Optional (Intune: Primary User)
        "JobTitle",            // 11 - Optional (job title of assigned user)
        "OfficeLocation",      // 12 - Optional (office location of assigned user)
        "Brand",               // 13 - Optional (Intune)
        "Model",               // 14 - Optional (Intune)
        "InstallationDate",    // 15 - Optional
        "WarrantyExpiry",      // 16 - Optional
        "Notes",               // 17 - Optional
        "LegacyBuilding",      // 18 - Optional (for historical data migration)
        "LegacyDepartment"     // 19 - Optional (for historical data migration)
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

            // Track asset codes in this import to detect duplicates
            var assetCodesInImport = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

            // Process each row
            foreach (var csvRow in csvRows)
            {
                var rowResult = await ProcessCsvRowAsync(
                    csvRow,
                    assetTypes,
                    services,
                    assetCodesInImport,
                    performedBy,
                    performedByEmail,
                    cancellationToken);

                rowResults.Add(rowResult);

                // Track successfully created/updated asset codes
                if (rowResult.Success && !string.IsNullOrEmpty(rowResult.AssetCode))
                {
                    assetCodesInImport.Add(rowResult.AssetCode);
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

            // Track asset codes within this CSV for duplicate detection
            var assetCodesInCsv = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

            // Process each row for validation only
            foreach (var csvRow in csvRows)
            {
                var rowResult = await ValidateCsvRowAsync(
                    csvRow,
                    assetTypes,
                    services,
                    assetCodesInCsv,
                    cancellationToken);

                rowResults.Add(rowResult);

                // Track asset codes to detect duplicates within this import (for new assets)
                if (!string.IsNullOrWhiteSpace(csvRow.AssetCode))
                {
                    assetCodesInCsv.Add(csvRow.AssetCode);
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
        HashSet<string> assetCodesInCsv,
        CancellationToken cancellationToken)
    {
        var errors = new List<string>();
        bool isUpdate = !string.IsNullOrWhiteSpace(csvRow.AssetCode);

        // Validate AssetCode if provided (UPDATE mode)
        if (isUpdate)
        {
            var existingAsset = await _assetRepository.GetByAssetCodeAsync(csvRow.AssetCode!, cancellationToken);
            if (existingAsset == null)
            {
                errors.Add($"AssetCode '{csvRow.AssetCode}' does not exist in the database. Cannot update non-existent asset.");
            }
        }

        // Validate REQUIRED fields for CREATE mode
        if (!isUpdate)
        {
            if (string.IsNullOrWhiteSpace(csvRow.AssetTypeCode))
            {
                errors.Add("AssetTypeCode is required for new assets");
            }

            if (string.IsNullOrWhiteSpace(csvRow.PurchaseDate))
            {
                errors.Add("PurchaseDate is required for new assets");
            }
        }

        // SerialNumber is now optional and NOT unique (per user requirement)
        // No validation needed for SerialNumber

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
        HashSet<string> existingAssetCodes,
        string performedBy,
        string performedByEmail,
        CancellationToken cancellationToken)
    {
        var errors = new List<string>();
        bool isUpdate = !string.IsNullOrWhiteSpace(csvRow.AssetCode);

        // Determine mode: UPDATE or CREATE
        Asset? existingAsset = null;
        if (isUpdate)
        {
            existingAsset = await _assetRepository.GetByAssetCodeAsync(csvRow.AssetCode!, cancellationToken);
            if (existingAsset == null)
            {
                errors.Add($"AssetCode '{csvRow.AssetCode}' does not exist. Cannot update non-existent asset.");
                return new CsvRowResultDto
                {
                    RowNumber = csvRow.RowNumber,
                    Success = false,
                    AssetCode = csvRow.AssetCode,
                    SerialNumber = csvRow.SerialNumber,
                    Errors = errors
                };
            }
        }

        // Validate REQUIRED fields for CREATE mode only
        if (!isUpdate)
        {
            if (string.IsNullOrWhiteSpace(csvRow.AssetTypeCode))
            {
                errors.Add("AssetTypeCode is required for new assets");
            }

            if (string.IsNullOrWhiteSpace(csvRow.PurchaseDate))
            {
                errors.Add("PurchaseDate is required for new assets");
            }
        }

        // SerialNumber is now optional and NOT unique (per user requirement)
        // No uniqueness validation for SerialNumber

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
        DateTime? purchaseDate = ParseDate(csvRow.PurchaseDate, "PurchaseDate", errors, required: !isUpdate);
        DateTime? warrantyExpiry = ParseDate(csvRow.WarrantyExpiry, "WarrantyExpiry", errors, required: false);
        DateTime? installationDate = ParseDate(csvRow.InstallationDate, "InstallationDate", errors, required: false);

        // If there are validation errors, return failure result
        if (errors.Count > 0)
        {
            return new CsvRowResultDto
            {
                RowNumber = csvRow.RowNumber,
                Success = false,
                AssetCode = csvRow.AssetCode,
                SerialNumber = csvRow.SerialNumber,
                Errors = errors
            };
        }

        // CREATE or UPDATE the asset
        try
        {
            Asset asset;
            string operationMode;

            if (isUpdate)
            {
                // UPDATE mode: update existing asset
                asset = existingAsset!;
                operationMode = "Updated";

                // Update fields if provided in CSV (allowing partial updates)
                if (!string.IsNullOrWhiteSpace(csvRow.SerialNumber))
                    asset.SerialNumber = csvRow.SerialNumber;

                if (!string.IsNullOrWhiteSpace(csvRow.AssetName))
                    asset.AssetName = csvRow.AssetName;

                if (!string.IsNullOrWhiteSpace(csvRow.Alias))
                    asset.Alias = csvRow.Alias;

                if (!string.IsNullOrWhiteSpace(csvRow.InstallationLocation))
                    asset.InstallationLocation = csvRow.InstallationLocation;

                if (!string.IsNullOrWhiteSpace(csvRow.Owner))
                    asset.Owner = csvRow.Owner;

                if (!string.IsNullOrWhiteSpace(csvRow.JobTitle))
                    asset.JobTitle = csvRow.JobTitle;

                if (!string.IsNullOrWhiteSpace(csvRow.OfficeLocation))
                    asset.OfficeLocation = csvRow.OfficeLocation;

                if (!string.IsNullOrWhiteSpace(csvRow.Brand))
                    asset.Brand = csvRow.Brand;

                if (!string.IsNullOrWhiteSpace(csvRow.Model))
                    asset.Model = csvRow.Model;

                if (!string.IsNullOrWhiteSpace(csvRow.LegacyBuilding))
                    asset.LegacyBuilding = csvRow.LegacyBuilding;

                if (!string.IsNullOrWhiteSpace(csvRow.LegacyDepartment))
                    asset.LegacyDepartment = csvRow.LegacyDepartment;

                // Update status (always update if provided)
                asset.Status = status;

                // Update dates if provided
                if (purchaseDate.HasValue)
                    asset.PurchaseDate = purchaseDate;

                if (warrantyExpiry.HasValue)
                    asset.WarrantyExpiry = warrantyExpiry;

                if (installationDate.HasValue)
                    asset.InstallationDate = installationDate;

                // Update ServiceId if ServiceCode provided
                if (service != null)
                    asset.ServiceId = service.Id;

                // Update AssetTypeId if AssetTypeCode provided
                if (assetType != null)
                {
                    asset.AssetTypeId = assetType.Id;
                    asset.Category = assetType.Name;
                }

                asset.UpdatedAt = DateTime.UtcNow;

                await _assetRepository.UpdateAsync(asset, cancellationToken);

                // Create "Note" event with notes from CSV update
                if (!string.IsNullOrWhiteSpace(csvRow.Notes))
                {
                    await _assetEventService.CreateEventAsync(
                        asset.Id,
                        AssetEventType.Note,
                        "Asset updated via CSV import",
                        null,
                        null,
                        performedBy,
                        performedByEmail,
                        csvRow.Notes,
                        cancellationToken);
                }
            }
            else
            {
                // CREATE mode: create new asset
                operationMode = "Created";

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

                asset = new Asset
                {
                    AssetCode = assetCode,
                    SerialNumber = csvRow.SerialNumber,
                    AssetName = csvRow.AssetName ?? string.Empty,
                    Alias = csvRow.Alias,
                    Category = category,
                    AssetTypeId = assetType.Id,
                    ServiceId = service?.Id,
                    InstallationLocation = csvRow.InstallationLocation,
                    Owner = csvRow.Owner,
                    JobTitle = csvRow.JobTitle,
                    OfficeLocation = csvRow.OfficeLocation,
                    Brand = csvRow.Brand,
                    Model = csvRow.Model,
                    Status = status,
                    PurchaseDate = purchaseDate,
                    WarrantyExpiry = warrantyExpiry,
                    InstallationDate = installationDate,
                    IsDummy = csvRow.IsDummy,
                    LegacyBuilding = csvRow.LegacyBuilding,
                    LegacyDepartment = csvRow.LegacyDepartment
                };

                asset = await _assetRepository.CreateAsync(asset, cancellationToken);

                // Create "Created" event with notes from CSV
                await _assetEventService.CreateCreatedEventAsync(
                    asset.Id,
                    performedBy,
                    performedByEmail,
                    csvRow.Notes,
                    cancellationToken);
            }

            _logger.LogInformation(
                "CSV import: {Operation} asset {AssetCode} (Row {RowNumber})",
                operationMode, asset.AssetCode, csvRow.RowNumber);

            return new CsvRowResultDto
            {
                RowNumber = csvRow.RowNumber,
                Success = true,
                AssetCode = asset.AssetCode,
                SerialNumber = asset.SerialNumber,
                Errors = new List<string>()
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to {Operation} asset from CSV row {RowNumber}", isUpdate ? "update" : "create", csvRow.RowNumber);
            return new CsvRowResultDto
            {
                RowNumber = csvRow.RowNumber,
                Success = false,
                AssetCode = csvRow.AssetCode,
                SerialNumber = csvRow.SerialNumber,
                Errors = new List<string> { $"Failed to {(isUpdate ? "update" : "create")} asset: {ex.Message}" }
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
                AssetCode = GetValueOrNull(values, 0),
                SerialNumber = GetValueOrNull(values, 1),
                AssetTypeCode = GetValue(values, 2),
                Status = GetValueOrDefault(values, 3, "Stock"),
                PurchaseDate = GetValue(values, 4),
                IsDummy = ParseBool(GetValueOrNull(values, 5)),
                AssetName = GetValueOrNull(values, 6),
                Alias = GetValueOrNull(values, 7),
                ServiceCode = GetValueOrNull(values, 8),
                InstallationLocation = GetValueOrNull(values, 9),
                Owner = GetValueOrNull(values, 10),
                JobTitle = GetValueOrNull(values, 11),
                OfficeLocation = GetValueOrNull(values, 12),
                Brand = GetValueOrNull(values, 13),
                Model = GetValueOrNull(values, 14),
                InstallationDate = GetValueOrNull(values, 15),
                WarrantyExpiry = GetValueOrNull(values, 16),
                Notes = GetValueOrNull(values, 17),
                LegacyBuilding = GetValueOrNull(values, 18),
                LegacyDepartment = GetValueOrNull(values, 19)
            };

            rows.Add(row);
            rowNumber++;
        }

        return rows;
    }

    private void ValidateHeaders(List<string> headers)
    {
        // Check minimum required headers (at least the 5 core columns)
        if (headers.Count < 5)
        {
            throw new InvalidOperationException(
                $"CSV file has {headers.Count} columns, expected at least 5 core columns. " +
                $"Expected: AssetCode, SerialNumber, AssetTypeCode, Status, PurchaseDate");
        }

        // Validate first 5 headers are correct (core columns - order matters)
        var requiredHeaders = new[] { "AssetCode", "SerialNumber", "AssetTypeCode", "Status", "PurchaseDate" };
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
            "",                     // AssetCode (leave empty for new asset, or provide existing code to update)
            "ABC123",               // SerialNumber (optional - NOT unique)
            "LAP",                  // AssetTypeCode (REQUIRED for new assets)
            "Stock",                // Status (REQUIRED, default: Stock)
            "15-01-2024",           // PurchaseDate (REQUIRED for new assets) - DD-MM-YYYY
            "false",                // IsDummy (optional, default: false)
            "",                     // AssetName (optional - Intune)
            "My Laptop",            // Alias (optional - user-friendly name)
            "IT",                   // ServiceCode (optional - location)
            "Room 201",             // InstallationLocation (optional - specific location)
            "",                     // Owner (optional - Intune)
            "",                     // JobTitle (optional)
            "",                     // OfficeLocation (optional)
            "",                     // Brand (optional - Intune)
            "",                     // Model (optional - Intune)
            "",                     // InstallationDate (optional)
            "15-01-2027",           // WarrantyExpiry (optional) - DD-MM-YYYY
            "Imported asset",       // Notes (optional)
            "",                     // LegacyBuilding (optional - for historical data)
            ""                      // LegacyDepartment (optional - for historical data)
        };

        sb.AppendLine(string.Join(",", exampleRow.Select(EscapeCsvValue)));

        // Add instructions as comments
        sb.AppendLine();
        sb.AppendLine("# ========================================");
        sb.AppendLine("# CSV Import Template - Djoppie Inventory");
        sb.AppendLine("# ========================================");
        sb.AppendLine("#");
        sb.AppendLine("# IMPORT MODES:");
        sb.AppendLine("#   - CREATE: Leave AssetCode empty - system auto-generates code");
        sb.AppendLine("#   - UPDATE: Provide existing AssetCode - updates existing asset");
        sb.AppendLine("#");
        sb.AppendLine("# REQUIRED COLUMNS (for creating new assets):");
        sb.AppendLine("#   - AssetTypeCode: Type code (see below)");
        sb.AppendLine("#   - Status: InGebruik, Stock, Herstelling, Defect, UitDienst, Nieuw (default: Stock)");
        sb.AppendLine("#   - PurchaseDate: DD-MM-YYYY (European) or YYYY-MM-DD (ISO)");
        sb.AppendLine("#");
        sb.AppendLine("# REQUIRED COLUMNS (for updating existing assets):");
        sb.AppendLine("#   - AssetCode: Existing asset code (e.g., LAP-26-DELL-00001)");
        sb.AppendLine("#");
        sb.AppendLine("# IMPORTANT NOTES:");
        sb.AppendLine("#   - Only AssetCode must be unique (NOT SerialNumber)");
        sb.AppendLine("#   - SerialNumber is optional and can be duplicated");
        sb.AppendLine("#   - IsDummy: true/false, 1/0, yes/no, ja/nee (default: false)");
        sb.AppendLine("#");
        sb.AppendLine("# OPTIONAL COLUMNS (will be auto-filled from Intune if available):");
        sb.AppendLine("#   - AssetName: Device name (Intune: DeviceName)");
        sb.AppendLine("#   - Owner: Primary user (Intune: Primary User)");
        sb.AppendLine("#   - Brand: Manufacturer (Intune)");
        sb.AppendLine("#   - Model: Model name (Intune)");
        sb.AppendLine("#");
        sb.AppendLine("# OTHER OPTIONAL COLUMNS:");
        sb.AppendLine("#   - Alias: User-friendly nickname for the asset");
        sb.AppendLine("#   - SerialNumber: Device serial number (optional, NOT unique)");
        sb.AppendLine("#   - ServiceCode: Department/Location code (see below)");
        sb.AppendLine("#   - InstallationLocation: Specific location (e.g., Room 201)");
        sb.AppendLine("#   - JobTitle: Job title of assigned user");
        sb.AppendLine("#   - OfficeLocation: Office location of assigned user");
        sb.AppendLine("#   - InstallationDate: DD-MM-YYYY or YYYY-MM-DD");
        sb.AppendLine("#   - WarrantyExpiry: DD-MM-YYYY or YYYY-MM-DD");
        sb.AppendLine("#   - Notes: Additional information");
        sb.AppendLine("#   - LegacyBuilding: Legacy building field (for historical data)");
        sb.AppendLine("#   - LegacyDepartment: Legacy department field (for historical data)");
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

    public async Task<byte[]> ExportAssetsToCsvAsync(string? status = null, CancellationToken cancellationToken = default)
    {
        // Fetch assets from repository with status filter
        var assets = await _assetRepository.GetAllAsync(status, cancellationToken);

        var sb = new StringBuilder();

        // Header row
        sb.AppendLine(string.Join(",", ExpectedHeaders));

        // Data rows
        foreach (var asset in assets.OrderBy(a => a.AssetCode))
        {
            var row = new[]
            {
                asset.AssetCode,                                                    // AssetCode
                asset.SerialNumber ?? string.Empty,                                 // SerialNumber
                asset.AssetType?.Code ?? string.Empty,                              // AssetTypeCode
                asset.Status.ToString(),                                            // Status
                asset.PurchaseDate?.ToString("dd-MM-yyyy") ?? string.Empty,         // PurchaseDate
                asset.IsDummy ? "true" : "false",                                   // IsDummy
                asset.AssetName ?? string.Empty,                                    // AssetName
                asset.Alias ?? string.Empty,                                        // Alias
                asset.Service?.Code ?? string.Empty,                                // ServiceCode
                asset.InstallationLocation ?? string.Empty,                         // InstallationLocation
                asset.Owner ?? string.Empty,                                        // Owner
                asset.JobTitle ?? string.Empty,                                     // JobTitle
                asset.OfficeLocation ?? string.Empty,                               // OfficeLocation
                asset.Brand ?? string.Empty,                                        // Brand
                asset.Model ?? string.Empty,                                        // Model
                asset.InstallationDate?.ToString("dd-MM-yyyy") ?? string.Empty,     // InstallationDate
                asset.WarrantyExpiry?.ToString("dd-MM-yyyy") ?? string.Empty,       // WarrantyExpiry
                string.Empty,                                                       // Notes (empty - notes are in AssetEvents)
                asset.LegacyBuilding ?? string.Empty,                               // LegacyBuilding
                asset.LegacyDepartment ?? string.Empty                              // LegacyDepartment
            };

            sb.AppendLine(string.Join(",", row.Select(v => EscapeCsvValue(v))));
        }

        _logger.LogInformation("Exported {Count} assets to CSV", assets.Count());
        return Encoding.UTF8.GetBytes(sb.ToString());
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

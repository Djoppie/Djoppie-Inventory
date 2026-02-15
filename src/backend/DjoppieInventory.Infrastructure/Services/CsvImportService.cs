using System.Globalization;
using System.Text;
using DjoppieInventory.Core.DTOs;
using DjoppieInventory.Core.Entities;
using DjoppieInventory.Core.Interfaces;
using Microsoft.Extensions.Logging;

namespace DjoppieInventory.Infrastructure.Services;

/// <summary>
/// Service for importing assets from CSV files with validation and automatic event creation
/// </summary>
public class CsvImportService : ICsvImportService
{
    private readonly IAssetRepository _assetRepository;
    private readonly IAssetTypeRepository _assetTypeRepository;
    private readonly IBuildingRepository _buildingRepository;
    private readonly IServiceRepository _serviceRepository;
    private readonly IAssetEventService _assetEventService;
    private readonly IAssetCodeGenerator _assetCodeGenerator;
    private readonly ILogger<CsvImportService> _logger;

    // Expected CSV columns in order
    private static readonly string[] ExpectedHeaders =
    {
        "SerialNumber",
        "AssetName",
        "Category",
        "AssetTypeCode",
        "BuildingCode",
        "ServiceCode",
        "Owner",
        "Brand",
        "Model",
        "Status",
        "PurchaseDate",
        "WarrantyExpiry",
        "InstallationDate",
        "InstallationLocation",
        "Notes"
    };

    public CsvImportService(
        IAssetRepository assetRepository,
        IAssetTypeRepository assetTypeRepository,
        IBuildingRepository buildingRepository,
        IServiceRepository serviceRepository,
        IAssetEventService assetEventService,
        IAssetCodeGenerator assetCodeGenerator,
        ILogger<CsvImportService> logger)
    {
        _assetRepository = assetRepository;
        _assetTypeRepository = assetTypeRepository;
        _buildingRepository = buildingRepository;
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
            var buildings = (await _buildingRepository.GetAllAsync(includeInactive: false, cancellationToken))
                .ToDictionary(b => b.Code, b => b, StringComparer.OrdinalIgnoreCase);
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
                    buildings,
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

    private async Task<CsvRowResultDto> ProcessCsvRowAsync(
        CsvImportRowDto csvRow,
        Dictionary<string, AssetType> assetTypes,
        Dictionary<string, Building> buildings,
        Dictionary<string, Service> services,
        HashSet<string> existingSerialNumbers,
        string performedBy,
        string performedByEmail,
        CancellationToken cancellationToken)
    {
        var errors = new List<string>();

        // Validate required fields
        if (string.IsNullOrWhiteSpace(csvRow.SerialNumber))
        {
            errors.Add("SerialNumber is required");
        }

        if (string.IsNullOrWhiteSpace(csvRow.Category))
        {
            errors.Add("Category is required");
        }

        if (string.IsNullOrWhiteSpace(csvRow.AssetTypeCode))
        {
            errors.Add("AssetTypeCode is required");
        }

        // Validate serial number uniqueness
        if (!string.IsNullOrWhiteSpace(csvRow.SerialNumber))
        {
            if (existingSerialNumbers.Contains(csvRow.SerialNumber))
            {
                errors.Add($"SerialNumber '{csvRow.SerialNumber}' already exists or is duplicated in this import");
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
                errors.Add($"AssetTypeCode '{csvRow.AssetTypeCode}' not found in the system");
            }
        }

        // Validate BuildingCode if provided
        Building? building = null;
        if (!string.IsNullOrWhiteSpace(csvRow.BuildingCode))
        {
            if (!buildings.TryGetValue(csvRow.BuildingCode, out building))
            {
                errors.Add($"BuildingCode '{csvRow.BuildingCode}' not found");
            }
        }

        // Validate ServiceCode if provided
        Service? service = null;
        if (!string.IsNullOrWhiteSpace(csvRow.ServiceCode))
        {
            if (!services.TryGetValue(csvRow.ServiceCode, out service))
            {
                errors.Add($"ServiceCode '{csvRow.ServiceCode}' not found");
            }
        }

        // Validate and parse Status
        AssetStatus status = AssetStatus.Stock; // Default
        if (!string.IsNullOrWhiteSpace(csvRow.Status))
        {
            if (!Enum.TryParse<AssetStatus>(csvRow.Status, ignoreCase: true, out status))
            {
                errors.Add($"Invalid Status '{csvRow.Status}'. Valid values: InGebruik, Stock, Herstelling, Defect, UitDienst");
            }
        }

        // Validate and parse dates
        DateTime? purchaseDate = ParseDate(csvRow.PurchaseDate, "PurchaseDate", errors);
        DateTime? warrantyExpiry = ParseDate(csvRow.WarrantyExpiry, "WarrantyExpiry", errors);
        DateTime? installationDate = ParseDate(csvRow.InstallationDate, "InstallationDate", errors);

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
            // Determine year from purchase date, installation date, or current year
            int year = purchaseDate?.Year ?? installationDate?.Year ?? DateTime.UtcNow.Year;

            // Generate asset code using the new format
            // assetType is guaranteed to be non-null here due to validation above
            var assetCode = await _assetCodeGenerator.GenerateCodeAsync(
                assetType!.Id,
                building?.Id,
                year,
                isDummy: false,
                cancellationToken);

            var asset = new Asset
            {
                AssetCode = assetCode,
                SerialNumber = csvRow.SerialNumber,
                AssetName = csvRow.AssetName ?? string.Empty,
                Category = csvRow.Category,
                AssetTypeId = assetType?.Id,
                BuildingId = building?.Id,
                ServiceId = service?.Id,
                Owner = csvRow.Owner,
                Brand = csvRow.Brand,
                Model = csvRow.Model,
                Status = status,
                PurchaseDate = purchaseDate,
                WarrantyExpiry = warrantyExpiry,
                InstallationDate = installationDate,
                InstallationLocation = csvRow.InstallationLocation,
                IsDummy = false
            };

            var createdAsset = await _assetRepository.CreateAsync(asset, cancellationToken);

            // Create "Created" event with notes from CSV
            var eventDescription = $"Asset created via CSV import by {performedBy}";
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

    private DateTime? ParseDate(string? dateString, string fieldName, List<string> errors)
    {
        if (string.IsNullOrWhiteSpace(dateString))
        {
            return null;
        }

        if (DateTime.TryParseExact(dateString, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var date))
        {
            return date;
        }

        // Try other common formats
        if (DateTime.TryParse(dateString, CultureInfo.InvariantCulture, DateTimeStyles.None, out date))
        {
            return date;
        }

        errors.Add($"{fieldName} '{dateString}' is not a valid date. Expected format: yyyy-MM-dd");
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
        int rowNumber = 1; // Row number for data rows (excluding header)
        string? line;
        while ((line = reader.ReadLine()) != null)
        {
            // Skip empty lines
            if (string.IsNullOrWhiteSpace(line))
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
                AssetName = GetValueOrNull(values, 1),
                Category = GetValue(values, 2),
                AssetTypeCode = GetValueOrNull(values, 3),
                BuildingCode = GetValueOrNull(values, 4),
                ServiceCode = GetValueOrNull(values, 5),
                Owner = GetValueOrNull(values, 6),
                Brand = GetValueOrNull(values, 7),
                Model = GetValueOrNull(values, 8),
                Status = GetValueOrNull(values, 9),
                PurchaseDate = GetValueOrNull(values, 10),
                WarrantyExpiry = GetValueOrNull(values, 11),
                InstallationDate = GetValueOrNull(values, 12),
                InstallationLocation = GetValueOrNull(values, 13),
                Notes = GetValueOrNull(values, 14)
            };

            rows.Add(row);
            rowNumber++;
        }

        return rows;
    }

    private void ValidateHeaders(List<string> headers)
    {
        if (headers.Count != ExpectedHeaders.Length)
        {
            throw new InvalidOperationException(
                $"CSV file has {headers.Count} columns, expected {ExpectedHeaders.Length}. " +
                $"Expected headers: {string.Join(", ", ExpectedHeaders)}");
        }

        for (int i = 0; i < ExpectedHeaders.Length; i++)
        {
            if (!headers[i].Equals(ExpectedHeaders[i], StringComparison.OrdinalIgnoreCase))
            {
                throw new InvalidOperationException(
                    $"CSV header mismatch at column {i + 1}. Expected '{ExpectedHeaders[i]}', got '{headers[i]}'");
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
                    // Escaped quote
                    currentValue.Append('"');
                    i++; // Skip next quote
                }
                else
                {
                    // Toggle quote mode
                    inQuotes = !inQuotes;
                }
            }
            else if (c == ',' && !inQuotes)
            {
                // End of field
                values.Add(currentValue.ToString().Trim());
                currentValue.Clear();
            }
            else
            {
                currentValue.Append(c);
            }
        }

        // Add last field
        values.Add(currentValue.ToString().Trim());

        return values;
    }

    private string GetValue(List<string> values, int index)
    {
        return index < values.Count ? values[index] : string.Empty;
    }

    private string? GetValueOrNull(List<string> values, int index)
    {
        var value = GetValue(values, index);
        return string.IsNullOrWhiteSpace(value) ? null : value;
    }

    public byte[] GenerateCsvTemplate()
    {
        var sb = new StringBuilder();

        // Header row
        sb.AppendLine(string.Join(",", ExpectedHeaders));

        // Example row with sample data
        var exampleRow = new[]
        {
            "ABC123",                           // SerialNumber
            "Laptop IT-001",                    // AssetName
            "Laptop",                           // Category
            "LAP",                              // AssetTypeCode
            "DBK",                              // BuildingCode
            "IT",                               // ServiceCode
            "Jan Janssen",                      // Owner
            "Dell",                             // Brand
            "Latitude 5520",                    // Model
            "Stock",                            // Status
            "2024-01-15",                       // PurchaseDate
            "2027-01-15",                       // WarrantyExpiry
            "2024-02-01",                       // InstallationDate
            "Kantoor 101",                      // InstallationLocation
            "Test import from CSV template"     // Notes
        };

        sb.AppendLine(string.Join(",", exampleRow.Select(EscapeCsvValue)));

        // Add comments explaining the format
        sb.AppendLine();
        sb.AppendLine("# CSV Import Template for Djoppie Inventory");
        sb.AppendLine("# ");
        sb.AppendLine("# Required columns:");
        sb.AppendLine("#   - SerialNumber: Unique serial number (required)");
        sb.AppendLine("#   - Category: Asset category (required)");
        sb.AppendLine("# ");
        sb.AppendLine("# Optional columns:");
        sb.AppendLine("#   - AssetName: Device name");
        sb.AppendLine("#   - AssetTypeCode: Must match an existing asset type code (e.g., LAP, DESK, MON)");
        sb.AppendLine("#   - BuildingCode: Must match an existing building code (e.g., DBK, WZC)");
        sb.AppendLine("#   - ServiceCode: Must match an existing service code (e.g., IT, FIN)");
        sb.AppendLine("#   - Owner: Primary user name");
        sb.AppendLine("#   - Brand: Manufacturer/brand");
        sb.AppendLine("#   - Model: Model name/number");
        sb.AppendLine("#   - Status: InGebruik, Stock, Herstelling, Defect, or UitDienst (default: Stock)");
        sb.AppendLine("#   - PurchaseDate: Format yyyy-MM-dd");
        sb.AppendLine("#   - WarrantyExpiry: Format yyyy-MM-dd");
        sb.AppendLine("#   - InstallationDate: Format yyyy-MM-dd");
        sb.AppendLine("#   - InstallationLocation: Room/floor within building");
        sb.AppendLine("#   - Notes: Additional information");

        return Encoding.UTF8.GetBytes(sb.ToString());
    }

    private string EscapeCsvValue(string value)
    {
        if (string.IsNullOrEmpty(value))
        {
            return string.Empty;
        }

        // If value contains comma, quote, or newline, wrap in quotes and escape internal quotes
        if (value.Contains(',') || value.Contains('"') || value.Contains('\n') || value.Contains('\r'))
        {
            return $"\"{value.Replace("\"", "\"\"")}\"";
        }

        return value;
    }
}

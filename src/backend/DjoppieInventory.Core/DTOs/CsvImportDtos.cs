namespace DjoppieInventory.Core.DTOs;

/// <summary>
/// Represents a single row from the CSV import file
/// </summary>
public record CsvImportRowDto
{
    /// <summary>
    /// The row number in the CSV file (1-based, excluding header)
    /// </summary>
    public int RowNumber { get; init; }

    /// <summary>
    /// Serial number of the device - REQUIRED and must be unique
    /// </summary>
    public string SerialNumber { get; init; } = string.Empty;

    /// <summary>
    /// Official device name
    /// </summary>
    public string? AssetName { get; init; }

    /// <summary>
    /// Asset category (e.g., Laptop, Desktop, Monitor)
    /// </summary>
    public string Category { get; init; } = string.Empty;

    /// <summary>
    /// Asset type code (e.g., LAP, DESK, MON) - will be validated against AssetType table
    /// </summary>
    public string? AssetTypeCode { get; init; }

    /// <summary>
    /// Building code (e.g., DBK, WZC) - will be validated against Building table
    /// </summary>
    public string? BuildingCode { get; init; }

    /// <summary>
    /// Service/Department code (e.g., IT, FIN) - will be validated against Service table
    /// </summary>
    public string? ServiceCode { get; init; }

    /// <summary>
    /// Primary user assigned to this asset
    /// </summary>
    public string? Owner { get; init; }

    /// <summary>
    /// Brand of the asset
    /// </summary>
    public string? Brand { get; init; }

    /// <summary>
    /// Model of the asset
    /// </summary>
    public string? Model { get; init; }

    /// <summary>
    /// Status (InGebruik, Stock, Herstelling, Defect, UitDienst)
    /// </summary>
    public string? Status { get; init; }

    /// <summary>
    /// Purchase date (format: yyyy-MM-dd)
    /// </summary>
    public string? PurchaseDate { get; init; }

    /// <summary>
    /// Warranty expiry date (format: yyyy-MM-dd)
    /// </summary>
    public string? WarrantyExpiry { get; init; }

    /// <summary>
    /// Installation date (format: yyyy-MM-dd)
    /// </summary>
    public string? InstallationDate { get; init; }

    /// <summary>
    /// Installation location (room/floor within building)
    /// </summary>
    public string? InstallationLocation { get; init; }

    /// <summary>
    /// Additional notes
    /// </summary>
    public string? Notes { get; init; }
}

/// <summary>
/// Result of a CSV import operation with detailed success/failure information
/// </summary>
public record CsvImportResultDto
{
    /// <summary>
    /// Total number of rows in the CSV file (excluding header)
    /// </summary>
    public int TotalRows { get; init; }

    /// <summary>
    /// Number of assets successfully imported
    /// </summary>
    public int SuccessCount { get; init; }

    /// <summary>
    /// Number of rows that failed validation or import
    /// </summary>
    public int ErrorCount { get; init; }

    /// <summary>
    /// Detailed results for each row
    /// </summary>
    public List<CsvRowResultDto> Results { get; init; } = new();

    /// <summary>
    /// Indicates if the entire import was successful
    /// </summary>
    public bool IsFullySuccessful => ErrorCount == 0 && SuccessCount == TotalRows;
}

/// <summary>
/// Result for a single CSV row import
/// </summary>
public record CsvRowResultDto
{
    /// <summary>
    /// The row number in the CSV file (1-based, excluding header)
    /// </summary>
    public int RowNumber { get; init; }

    /// <summary>
    /// Whether the row was successfully imported
    /// </summary>
    public bool Success { get; init; }

    /// <summary>
    /// The generated asset code (only if successful)
    /// </summary>
    public string? AssetCode { get; init; }

    /// <summary>
    /// The serial number from the CSV row
    /// </summary>
    public string? SerialNumber { get; init; }

    /// <summary>
    /// List of validation or import errors for this row
    /// </summary>
    public List<string> Errors { get; init; } = new();
}

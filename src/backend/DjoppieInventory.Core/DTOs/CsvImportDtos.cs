namespace DjoppieInventory.Core.DTOs;

/// <summary>
/// Represents a single row from the CSV import file
/// Supports both creating new assets and updating existing ones (based on AssetCode)
/// </summary>
public record CsvImportRowDto
{
    /// <summary>
    /// The row number in the CSV file (1-based, excluding header)
    /// </summary>
    public int RowNumber { get; init; }

    /// <summary>
    /// Asset code - If provided and exists, updates existing asset. If not provided or doesn't exist, creates new asset.
    /// Format: TYPE-YY-MERK-NUMMER (e.g., LAP-26-DELL-00001) or DUM-TYPE-YY-MERK-NUMMER for dummy assets
    /// </summary>
    public string? AssetCode { get; init; }

    /// <summary>
    /// Serial number of the device - OPTIONAL (only AssetCode must be unique, not SerialNumber)
    /// </summary>
    public string? SerialNumber { get; init; }

    /// <summary>
    /// Asset type code (e.g., LAP, DESK, MON) - REQUIRED for new assets
    /// </summary>
    public string AssetTypeCode { get; init; } = string.Empty;

    /// <summary>
    /// Status (InGebruik, Stock, Herstelling, Defect, UitDienst, Nieuw) - REQUIRED, default: Stock
    /// </summary>
    public string Status { get; init; } = "Stock";

    /// <summary>
    /// Purchase date (format: yyyy-MM-dd or dd-MM-yyyy) - REQUIRED for new assets
    /// </summary>
    public string PurchaseDate { get; init; } = string.Empty;

    /// <summary>
    /// Device name - optional, will be fetched from Intune (DeviceName) if exists
    /// </summary>
    public string? AssetName { get; init; }

    /// <summary>
    /// User-friendly alias/nickname for the asset - optional
    /// </summary>
    public string? Alias { get; init; }

    /// <summary>
    /// Service/Department code (e.g., IT, FIN) - optional, used as location
    /// </summary>
    public string? ServiceCode { get; init; }

    /// <summary>
    /// Specific installation location within building (e.g., "Room 201") - optional
    /// </summary>
    public string? InstallationLocation { get; init; }

    /// <summary>
    /// Primary user - optional, will be fetched from Intune (Primary User) if exists
    /// </summary>
    public string? Owner { get; init; }

    /// <summary>
    /// Job title of the assigned user - optional
    /// </summary>
    public string? JobTitle { get; init; }

    /// <summary>
    /// Office location of the assigned user - optional
    /// </summary>
    public string? OfficeLocation { get; init; }

    /// <summary>
    /// Brand - optional, will be fetched from Intune if exists
    /// </summary>
    public string? Brand { get; init; }

    /// <summary>
    /// Model - optional, will be fetched from Intune if exists
    /// </summary>
    public string? Model { get; init; }

    /// <summary>
    /// Installation date (format: yyyy-MM-dd or dd-MM-yyyy) - optional
    /// </summary>
    public string? InstallationDate { get; init; }

    /// <summary>
    /// Warranty expiry date (format: yyyy-MM-dd or dd-MM-yyyy) - optional
    /// </summary>
    public string? WarrantyExpiry { get; init; }

    /// <summary>
    /// Additional notes - optional
    /// </summary>
    public string? Notes { get; init; }

    /// <summary>
    /// Is this a dummy/placeholder asset - optional, default: false
    /// </summary>
    public bool IsDummy { get; init; } = false;

    /// <summary>
    /// Legacy building field (for historical data migration) - optional
    /// </summary>
    public string? LegacyBuilding { get; init; }

    /// <summary>
    /// Legacy department field (for historical data migration) - optional
    /// </summary>
    public string? LegacyDepartment { get; init; }
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

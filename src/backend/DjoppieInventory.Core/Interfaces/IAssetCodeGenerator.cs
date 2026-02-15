namespace DjoppieInventory.Core.Interfaces;

/// <summary>
/// Represents the components of a parsed asset code
/// </summary>
public class AssetCodeComponents
{
    /// <summary>
    /// Indicates if this is a dummy/test asset
    /// </summary>
    public bool IsDummy { get; set; }

    /// <summary>
    /// Asset type code (e.g., "LAP", "DESK", "MON")
    /// </summary>
    public string AssetTypeCode { get; set; } = string.Empty;

    /// <summary>
    /// Year component (2 digits)
    /// </summary>
    public int Year { get; set; }

    /// <summary>
    /// Building code (optional, e.g., "DBK", "WZC")
    /// </summary>
    public string? BuildingCode { get; set; }

    /// <summary>
    /// Sequential number within the type/year/building combination
    /// </summary>
    public int Number { get; set; }
}

/// <summary>
/// Service interface for generating and validating asset codes.
/// Asset code format: [DUM-]TYPE-YY-[LOC-]NUMMER
///
/// Examples:
/// - LAP-25-DBK-00001 (Normal laptop at DBK in 2025)
/// - LAP-25-00001 (Normal laptop, no building specified)
/// - DUM-LAP-25-WZC-90001 (Dummy laptop at WZC in 2025)
/// - DESK-26-GBS-00042 (Desktop at GBS in 2026, number 42)
///
/// Numbering rules:
/// - Normal assets: 00001-89999
/// - Dummy assets: 90001-99999
/// - Auto-increment per TYPE per YEAR (optionally per BUILDING if specified)
/// </summary>
public interface IAssetCodeGenerator
{
    /// <summary>
    /// Generates a new unique asset code following the pattern: [DUM-]TYPE-YY-[LOC-]NUMMER
    /// </summary>
    /// <param name="assetTypeId">ID of the asset type (determines TYPE component)</param>
    /// <param name="buildingId">Optional ID of the building (determines LOC component)</param>
    /// <param name="year">Year for the asset (determines YY component, typically purchase year)</param>
    /// <param name="isDummy">If true, generates a dummy asset code (starts with "DUM-" and uses numbers 90001+)</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Generated asset code (e.g., "LAP-25-DBK-00001")</returns>
    Task<string> GenerateCodeAsync(
        int assetTypeId,
        int? buildingId,
        int year,
        bool isDummy,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Generates multiple asset codes in a single operation for bulk imports.
    /// More efficient than calling GenerateCodeAsync multiple times.
    /// Returns codes in order, guaranteed to be unique and sequential.
    /// </summary>
    /// <param name="assetTypeId">ID of the asset type</param>
    /// <param name="buildingId">Optional ID of the building</param>
    /// <param name="year">Year for the assets</param>
    /// <param name="isDummy">If true, generates dummy asset codes</param>
    /// <param name="count">Number of codes to generate</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>List of generated asset codes</returns>
    Task<IEnumerable<string>> GenerateBulkCodesAsync(
        int assetTypeId,
        int? buildingId,
        int year,
        bool isDummy,
        int count,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Validates whether an asset code follows the correct format.
    /// Does not check if the code exists in the database, only validates format.
    /// </summary>
    /// <param name="assetCode">Asset code to validate</param>
    /// <returns>True if format is valid, false otherwise</returns>
    bool ValidateCodeFormat(string assetCode);

    /// <summary>
    /// Parses an asset code string and extracts its components.
    /// Useful for analyzing existing codes or validating user input.
    /// </summary>
    /// <param name="assetCode">Asset code to parse</param>
    /// <returns>Parsed components, or null if code format is invalid</returns>
    AssetCodeComponents? ParseCode(string assetCode);
}

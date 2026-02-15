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
    /// Brand code (max 4 chars, e.g., "DELL", "HP", "LENO")
    /// </summary>
    public string? BrandCode { get; set; }

    /// <summary>
    /// Sequential number within the type/year/brand combination
    /// </summary>
    public int Number { get; set; }
}

/// <summary>
/// Service interface for generating and validating asset codes.
/// Asset code format: [DUM-]TYPE-YY-MERK-NUMMER
///
/// Examples:
/// - LAP-26-DELL-00001 (Normal Dell laptop in 2026)
/// - DUM-LAP-26-HP-90001 (Dummy HP laptop in 2026)
/// - DESK-26-LENO-00042 (Lenovo desktop in 2026, number 42)
///
/// MERK = first 4 characters of brand, uppercased.
///
/// Numbering rules:
/// - Normal assets: 00001-89999
/// - Dummy assets: 90001-99999
/// - Auto-increment per TYPE per YEAR per BRAND
/// </summary>
public interface IAssetCodeGenerator
{
    /// <summary>
    /// Generates a new unique asset code following the pattern: [DUM-]TYPE-YY-MERK-NUMMER
    /// </summary>
    /// <param name="assetTypeId">ID of the asset type (determines TYPE component)</param>
    /// <param name="brand">Brand/manufacturer name (first 4 chars uppercased become MERK component)</param>
    /// <param name="year">Year for the asset (determines YY component)</param>
    /// <param name="isDummy">If true, generates a dummy asset code (starts with "DUM-" and uses numbers 90001+)</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Generated asset code (e.g., "LAP-26-DELL-00001")</returns>
    Task<string> GenerateCodeAsync(
        int assetTypeId,
        string? brand,
        int year,
        bool isDummy,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Generates multiple asset codes in a single operation for bulk imports.
    /// Returns codes in order, guaranteed to be unique and sequential.
    /// </summary>
    Task<IEnumerable<string>> GenerateBulkCodesAsync(
        int assetTypeId,
        string? brand,
        int year,
        bool isDummy,
        int count,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Validates whether an asset code follows the correct format.
    /// </summary>
    bool ValidateCodeFormat(string assetCode);

    /// <summary>
    /// Parses an asset code string and extracts its components.
    /// </summary>
    AssetCodeComponents? ParseCode(string assetCode);
}

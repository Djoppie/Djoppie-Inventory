using DjoppieInventory.Core.DTOs;

namespace DjoppieInventory.Core.Interfaces;

/// <summary>
/// Service interface for CSV import operations
/// </summary>
public interface ICsvImportService
{
    /// <summary>
    /// Imports assets from a CSV file stream.
    /// Validates each row, creates assets with auto-generated codes, and creates "Created" events.
    /// </summary>
    /// <param name="csvStream">The CSV file stream to import</param>
    /// <param name="performedBy">Display name of the user performing the import</param>
    /// <param name="performedByEmail">Email address of the user performing the import</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Import result with success/failure details for each row</returns>
    Task<CsvImportResultDto> ImportAssetsAsync(
        Stream csvStream,
        string performedBy,
        string performedByEmail,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Generates a CSV template file with headers and example data.
    /// Used for download by users to understand the expected format.
    /// </summary>
    /// <returns>CSV template as byte array (UTF-8 encoded)</returns>
    byte[] GenerateCsvTemplate();
}

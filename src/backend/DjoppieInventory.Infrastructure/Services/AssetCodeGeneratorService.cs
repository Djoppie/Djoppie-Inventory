using System.Text.RegularExpressions;
using DjoppieInventory.Core.Interfaces;
using DjoppieInventory.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace DjoppieInventory.Infrastructure.Services;

/// <summary>
/// Service for generating and validating asset codes following the format: [DUM-]TYPE-YY-MERK-NUMMER
/// Examples: LAP-26-DELL-00001, DUM-LAP-26-HP-90001
/// </summary>
public class AssetCodeGeneratorService : IAssetCodeGenerator
{
    private readonly ApplicationDbContext _context;

    // Regex pattern to validate asset code format
    // Matches: [DUM-]TYPE-YY-MERK-NNNNN
    private static readonly Regex AssetCodePattern = new(
        @"^(?<dummy>DUM-)?(?<type>[A-Z]{2,10})-(?<year>\d{2})-(?<brand>[A-Z0-9]{1,4})-(?<number>\d{5})$",
        RegexOptions.Compiled | RegexOptions.IgnoreCase
    );

    public AssetCodeGeneratorService(ApplicationDbContext context)
    {
        _context = context ?? throw new ArgumentNullException(nameof(context));
    }

    /// <summary>
    /// Converts a brand name to a max 4-char uppercase code.
    /// E.g., "Dell Inc." -> "DELL", "Hewlett-Packard" -> "HEWL", "HP" -> "HP"
    /// </summary>
    private static string ToBrandCode(string? brand)
    {
        if (string.IsNullOrWhiteSpace(brand))
            return "XXXX";

        // Take only alphanumeric characters, uppercase, max 4 chars
        var cleaned = new string(brand.Where(char.IsLetterOrDigit).ToArray()).ToUpper();
        return cleaned.Length > 4 ? cleaned[..4] : cleaned.Length > 0 ? cleaned : "XXXX";
    }

    public async Task<string> GenerateCodeAsync(
        int assetTypeId,
        string? brand,
        int year,
        bool isDummy,
        CancellationToken cancellationToken = default)
    {
        // 1. Get the AssetType code
        var assetType = await _context.AssetTypes.FindAsync(new object[] { assetTypeId }, cancellationToken);
        if (assetType == null)
            throw new ArgumentException($"AssetType with ID {assetTypeId} not found.", nameof(assetTypeId));

        // 2. Convert brand to 4-char code
        var brandCode = ToBrandCode(brand);

        // 3. Format year as 2 digits
        var yearTwoDigit = (year % 100).ToString("D2");

        // 4. Build the prefix: [DUM-]TYPE-YY-MERK
        var prefix = isDummy
            ? $"DUM-{assetType.Code}-{yearTwoDigit}-{brandCode}"
            : $"{assetType.Code}-{yearTwoDigit}-{brandCode}";

        // 5. Calculate the next number
        var nextNumber = await GetNextNumberAsync(prefix, isDummy, cancellationToken);

        // 6. Build and return the complete asset code
        return $"{prefix}-{nextNumber:D5}";
    }

    public async Task<IEnumerable<string>> GenerateBulkCodesAsync(
        int assetTypeId,
        string? brand,
        int year,
        bool isDummy,
        int count,
        CancellationToken cancellationToken = default)
    {
        if (count <= 0)
            throw new ArgumentException("Count must be greater than 0.", nameof(count));

        if (count > 1000)
            throw new ArgumentException("Cannot generate more than 1000 codes at once.", nameof(count));

        // 1. Get the AssetType code
        var assetType = await _context.AssetTypes.FindAsync(new object[] { assetTypeId }, cancellationToken);
        if (assetType == null)
            throw new ArgumentException($"AssetType with ID {assetTypeId} not found.", nameof(assetTypeId));

        // 2. Convert brand to 4-char code
        var brandCode = ToBrandCode(brand);

        // 3. Format year as 2 digits
        var yearTwoDigit = (year % 100).ToString("D2");

        // 4. Build the prefix: [DUM-]TYPE-YY-MERK
        var prefix = isDummy
            ? $"DUM-{assetType.Code}-{yearTwoDigit}-{brandCode}"
            : $"{assetType.Code}-{yearTwoDigit}-{brandCode}";

        // 5. Get the starting number
        var startNumber = await GetNextNumberAsync(prefix, isDummy, cancellationToken);

        // 6. Generate sequential codes
        var codes = new List<string>(count);
        for (int i = 0; i < count; i++)
        {
            var number = startNumber + i;

            if (isDummy && number > 99999)
                throw new InvalidOperationException("Dummy asset number exceeded maximum (99999).");

            if (!isDummy && number > 89999)
                throw new InvalidOperationException("Normal asset number exceeded maximum (89999).");

            codes.Add($"{prefix}-{number:D5}");
        }

        return codes;
    }

    public bool ValidateCodeFormat(string assetCode)
    {
        if (string.IsNullOrWhiteSpace(assetCode))
            return false;

        return AssetCodePattern.IsMatch(assetCode);
    }

    public AssetCodeComponents? ParseCode(string assetCode)
    {
        if (string.IsNullOrWhiteSpace(assetCode))
            return null;

        var match = AssetCodePattern.Match(assetCode);
        if (!match.Success)
            return null;

        return new AssetCodeComponents
        {
            IsDummy = match.Groups["dummy"].Success,
            AssetTypeCode = match.Groups["type"].Value.ToUpper(),
            Year = int.Parse(match.Groups["year"].Value),
            BrandCode = match.Groups["brand"].Success
                ? match.Groups["brand"].Value.ToUpper()
                : null,
            Number = int.Parse(match.Groups["number"].Value)
        };
    }

    /// <summary>
    /// Gets the next available number for a given prefix.
    /// For dummy assets: starts at 90001
    /// For normal assets: starts at 00001
    /// </summary>
    private async Task<int> GetNextNumberAsync(string prefix, bool isDummy, CancellationToken cancellationToken)
    {
        var prefixPattern = prefix + "-";
        var existingCodes = await _context.Assets
            .Where(a => a.AssetCode.StartsWith(prefixPattern))
            .Select(a => a.AssetCode)
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        if (isDummy)
        {
            int maxDummyNumber = 90000;
            foreach (var code in existingCodes)
            {
                if (code.Length >= 5)
                {
                    var numberPart = code[^5..];
                    if (int.TryParse(numberPart, out var number) && number >= 90001 && number > maxDummyNumber)
                        maxDummyNumber = number;
                }
            }
            return maxDummyNumber + 1;
        }
        else
        {
            int maxNumber = 0;
            foreach (var code in existingCodes)
            {
                if (code.Length >= 5)
                {
                    var numberPart = code[^5..];
                    if (int.TryParse(numberPart, out var number) && number < 90000 && number > maxNumber)
                        maxNumber = number;
                }
            }
            return maxNumber + 1;
        }
    }
}

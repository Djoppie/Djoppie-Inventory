using System.Text.RegularExpressions;
using DjoppieInventory.Core.Interfaces;
using DjoppieInventory.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace DjoppieInventory.Infrastructure.Services;

/// <summary>
/// Service for generating and validating asset codes following the format: [DUM-]TYPE-YY-[LOC-]NUMMER
/// Examples: LAP-25-DBK-00001, DUM-LAP-25-WZC-90001
/// </summary>
public class AssetCodeGeneratorService : IAssetCodeGenerator
{
    private readonly ApplicationDbContext _context;

    // Regex pattern to validate asset code format
    // Matches: [DUM-]TYPE-YY-[LOC-]NNNNN
    private static readonly Regex AssetCodePattern = new(
        @"^(?<dummy>DUM-)?(?<type>[A-Z]{2,10})-(?<year>\d{2})(?:-(?<building>[A-Z0-9]{2,10}))?-(?<number>\d{5})$",
        RegexOptions.Compiled | RegexOptions.IgnoreCase
    );

    public AssetCodeGeneratorService(ApplicationDbContext context)
    {
        _context = context ?? throw new ArgumentNullException(nameof(context));
    }

    public async Task<string> GenerateCodeAsync(
        int assetTypeId,
        int? buildingId,
        int year,
        bool isDummy,
        CancellationToken cancellationToken = default)
    {
        // 1. Get the AssetType code
        var assetType = await _context.AssetTypes.FindAsync(new object[] { assetTypeId }, cancellationToken);
        if (assetType == null)
            throw new ArgumentException($"AssetType with ID {assetTypeId} not found.", nameof(assetTypeId));

        // 2. Get the Building code (optional)
        string? buildingCode = null;
        if (buildingId.HasValue)
        {
            var building = await _context.Buildings.FindAsync(new object[] { buildingId.Value }, cancellationToken);
            if (building == null)
                throw new ArgumentException($"Building with ID {buildingId.Value} not found.", nameof(buildingId));

            buildingCode = building.Code;
        }

        // 3. Format year as 2 digits
        var yearTwoDigit = (year % 100).ToString("D2");

        // 4. Build the prefix pattern for querying existing codes
        var prefix = isDummy
            ? $"DUM-{assetType.Code}-{yearTwoDigit}"
            : $"{assetType.Code}-{yearTwoDigit}";

        if (!string.IsNullOrEmpty(buildingCode))
        {
            prefix += $"-{buildingCode}";
        }

        // 5. Calculate the next number
        var nextNumber = await GetNextNumberAsync(prefix, isDummy, cancellationToken);

        // 6. Build and return the complete asset code
        var assetCode = $"{prefix}-{nextNumber:D5}";
        return assetCode;
    }

    public async Task<IEnumerable<string>> GenerateBulkCodesAsync(
        int assetTypeId,
        int? buildingId,
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

        // 2. Get the Building code (optional)
        string? buildingCode = null;
        if (buildingId.HasValue)
        {
            var building = await _context.Buildings.FindAsync(new object[] { buildingId.Value }, cancellationToken);
            if (building == null)
                throw new ArgumentException($"Building with ID {buildingId.Value} not found.", nameof(buildingId));

            buildingCode = building.Code;
        }

        // 3. Format year as 2 digits
        var yearTwoDigit = (year % 100).ToString("D2");

        // 4. Build the prefix pattern
        var prefix = isDummy
            ? $"DUM-{assetType.Code}-{yearTwoDigit}"
            : $"{assetType.Code}-{yearTwoDigit}";

        if (!string.IsNullOrEmpty(buildingCode))
        {
            prefix += $"-{buildingCode}";
        }

        // 5. Get the starting number
        var startNumber = await GetNextNumberAsync(prefix, isDummy, cancellationToken);

        // 6. Generate sequential codes
        var codes = new List<string>(count);
        for (int i = 0; i < count; i++)
        {
            var number = startNumber + i;

            // Validate number range
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

        var components = new AssetCodeComponents
        {
            IsDummy = match.Groups["dummy"].Success,
            AssetTypeCode = match.Groups["type"].Value.ToUpper(),
            Year = int.Parse(match.Groups["year"].Value),
            BuildingCode = match.Groups["building"].Success
                ? match.Groups["building"].Value.ToUpper()
                : null,
            Number = int.Parse(match.Groups["number"].Value)
        };

        return components;
    }

    /// <summary>
    /// Gets the next available number for a given prefix.
    /// For dummy assets: starts at 90001
    /// For normal assets: starts at 00001
    /// </summary>
    private async Task<int> GetNextNumberAsync(string prefix, bool isDummy, CancellationToken cancellationToken)
    {
        // Query all asset codes that start with this prefix
        var prefixPattern = prefix + "-";
        var existingCodes = await _context.Assets
            .Where(a => a.AssetCode.StartsWith(prefixPattern))
            .Select(a => a.AssetCode)
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        if (isDummy)
        {
            // For dummy assets: find max number >= 90001, start at 90001 if none exist
            int maxDummyNumber = 90000;
            foreach (var code in existingCodes)
            {
                // Extract the number part (last 5 digits)
                var numberPart = code.Substring(code.Length - 5);
                if (int.TryParse(numberPart, out var number) && number >= 90001 && number > maxDummyNumber)
                {
                    maxDummyNumber = number;
                }
            }
            return maxDummyNumber + 1;
        }
        else
        {
            // For normal assets: find max number < 90000, start at 1
            int maxNumber = 0;
            foreach (var code in existingCodes)
            {
                // Extract the number part (last 5 digits)
                var numberPart = code.Substring(code.Length - 5);
                if (int.TryParse(numberPart, out var number) && number < 90000 && number > maxNumber)
                {
                    maxNumber = number;
                }
            }
            return maxNumber + 1;
        }
    }
}

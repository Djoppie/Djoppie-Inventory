using System.Data;
using System.Text.RegularExpressions;
using DjoppieInventory.Core.Entities;
using DjoppieInventory.Core.Interfaces;
using DjoppieInventory.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;

namespace DjoppieInventory.Infrastructure.Services;

/// <summary>
/// Service for generating and validating asset codes following the format: [DUM-]TYPE-YY-MERK-NUMMER
/// Examples: LAP-26-DELL-00001, DUM-LAP-26-HP-90001
///
/// Year (YY) calculation from purchase date:
/// - If purchase month is November (11) or December (12), use next year
/// - Otherwise, use the purchase date year
/// - If no purchase date provided, use current date
///
/// Concurrency: number issuance is backed by a per-prefix
/// <see cref="AssetCodeCounter"/> row updated inside a serializable
/// transaction. Two concurrent <c>POST /assets</c> requests against the same
/// prefix can no longer collide on the same number — the prior MAX(code)+1
/// approach hit unique-violation 500s under bulk and rollout-day load.
/// </summary>
public class AssetCodeGeneratorService : IAssetCodeGenerator
{
    private const int NormalStartNumber = 1;
    private const int NormalMaxNumber = 89999;
    private const int DummyStartNumber = 90001;
    private const int DummyMaxNumber = 99999;
    private const int BulkMaxBatch = 1000;

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

    /// <summary>
    /// Calculates the year code from a purchase date.
    /// If purchase month is November or December, returns the next year.
    /// </summary>
    public int CalculateYearFromPurchaseDate(DateTime? purchaseDate)
    {
        var date = purchaseDate ?? DateTime.UtcNow;

        // If purchase is in November (11) or December (12), use next year
        if (date.Month >= 11)
        {
            return date.Year + 1;
        }

        return date.Year;
    }

    public async Task<string> GenerateCodeAsync(
        int assetTypeId,
        string? brand,
        DateTime? purchaseDate,
        bool isDummy,
        CancellationToken cancellationToken = default)
    {
        var prefix = await BuildPrefixAsync(assetTypeId, brand, purchaseDate, isDummy, cancellationToken);
        var number = await ReserveNumbersAsync(prefix, isDummy, count: 1, cancellationToken);
        return $"{prefix}-{number:D5}";
    }

    public async Task<IEnumerable<string>> GenerateBulkCodesAsync(
        int assetTypeId,
        string? brand,
        DateTime? purchaseDate,
        bool isDummy,
        int count,
        CancellationToken cancellationToken = default)
    {
        if (count <= 0)
            throw new ArgumentException("Count must be greater than 0.", nameof(count));

        if (count > BulkMaxBatch)
            throw new ArgumentException($"Cannot generate more than {BulkMaxBatch} codes at once.", nameof(count));

        var prefix = await BuildPrefixAsync(assetTypeId, brand, purchaseDate, isDummy, cancellationToken);
        var startNumber = await ReserveNumbersAsync(prefix, isDummy, count, cancellationToken);

        var codes = new List<string>(count);
        for (int i = 0; i < count; i++)
        {
            codes.Add($"{prefix}-{(startNumber + i):D5}");
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

    private async Task<string> BuildPrefixAsync(
        int assetTypeId,
        string? brand,
        DateTime? purchaseDate,
        bool isDummy,
        CancellationToken cancellationToken)
    {
        var assetType = await _context.AssetTypes.FindAsync(new object[] { assetTypeId }, cancellationToken);
        if (assetType == null)
            throw new ArgumentException($"AssetType with ID {assetTypeId} not found.", nameof(assetTypeId));

        var brandCode = ToBrandCode(brand);
        var year = CalculateYearFromPurchaseDate(purchaseDate);
        var yearTwoDigit = (year % 100).ToString("D2");

        return isDummy
            ? $"DUM-{assetType.Code}-{yearTwoDigit}-{brandCode}"
            : $"{assetType.Code}-{yearTwoDigit}-{brandCode}";
    }

    /// <summary>
    /// Atomically reserves <paramref name="count"/> consecutive numbers for
    /// the given <paramref name="prefix"/>. Returns the first number; the
    /// caller is responsible for emitting <c>start..start+count-1</c>.
    ///
    /// Concurrency model: a serializable transaction guards a single
    /// <see cref="AssetCodeCounter"/> row per prefix. The first call seeds
    /// the counter from the existing <c>Assets</c> table so legacy data is
    /// respected; thereafter all increments come from the counter row, never
    /// from MAX(code)+1.
    ///
    /// The transactional block is run through the configured
    /// <see cref="IExecutionStrategy"/>. On Azure SQL the DbContext is
    /// configured with <c>EnableRetryOnFailure</c>, which is incompatible
    /// with user-initiated transactions unless the entire transaction is
    /// wrapped as one retriable unit — exactly what
    /// <see cref="IExecutionStrategy.ExecuteAsync"/> does for us.
    /// </summary>
    private async Task<int> ReserveNumbersAsync(
        string prefix,
        bool isDummy,
        int count,
        CancellationToken cancellationToken)
    {
        if (count <= 0)
        {
            throw new ArgumentException("Count must be positive.", nameof(count));
        }

        var rangeStart = isDummy ? DummyStartNumber : NormalStartNumber;
        var rangeMax = isDummy ? DummyMaxNumber : NormalMaxNumber;

        var strategy = _context.Database.CreateExecutionStrategy();

        return await strategy.ExecuteAsync(async ct =>
        {
            // We retry once on lost-race counter inserts (DbUpdateException).
            // Genuine transient infrastructure failures are handled one layer
            // up by the execution strategy.
            const int maxAttempts = 3;
            for (int attempt = 1; attempt <= maxAttempts; attempt++)
            {
                try
                {
                    await using IDbContextTransaction tx =
                        await _context.Database.BeginTransactionAsync(IsolationLevel.Serializable, ct);

                    var counter = await _context.AssetCodeCounters
                        .FirstOrDefaultAsync(c => c.Prefix == prefix, ct);

                    int issued;
                    if (counter is null)
                    {
                        // First time we see this prefix. Seed from the existing
                        // Assets table so a deployment that already has historical
                        // codes does not start re-issuing low numbers.
                        var seedFrom = await GetMaxExistingNumberAsync(prefix, isDummy, ct);
                        issued = Math.Max(rangeStart, seedFrom + 1);

                        counter = new AssetCodeCounter
                        {
                            Prefix = prefix,
                            NextNumber = issued + count,
                            CreatedAt = DateTime.UtcNow,
                            UpdatedAt = DateTime.UtcNow,
                        };
                        _context.AssetCodeCounters.Add(counter);
                    }
                    else
                    {
                        issued = counter.NextNumber;
                        counter.NextNumber = issued + count;
                        counter.UpdatedAt = DateTime.UtcNow;
                    }

                    if (issued + count - 1 > rangeMax)
                    {
                        var bucket = isDummy ? "Dummy" : "Normal";
                        throw new InvalidOperationException(
                            $"{bucket} asset number range exhausted for prefix '{prefix}' (max {rangeMax}).");
                    }

                    await _context.SaveChangesAsync(ct);
                    await tx.CommitAsync(ct);

                    return issued;
                }
                catch (DbUpdateException) when (attempt < maxAttempts)
                {
                    // Lost the race to insert the very first counter row; another
                    // request created it concurrently. Retry — the second pass
                    // will hit the existing counter and increment it cleanly.
                    _context.ChangeTracker.Clear();
                }
            }

            throw new InvalidOperationException(
                $"Could not reserve asset code numbers for prefix '{prefix}' after {maxAttempts} attempts.");
        }, cancellationToken);
    }

    /// <summary>
    /// Computes the maximum number already used in the <c>Assets</c> table
    /// for a given prefix. Only used to seed a brand-new counter row.
    /// </summary>
    private async Task<int> GetMaxExistingNumberAsync(
        string prefix,
        bool isDummy,
        CancellationToken cancellationToken)
    {
        var prefixPattern = prefix + "-";
        var existingCodes = await _context.Assets
            .Where(a => a.AssetCode.StartsWith(prefixPattern))
            .Select(a => a.AssetCode)
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        int max = isDummy ? DummyStartNumber - 1 : 0;
        foreach (var code in existingCodes)
        {
            if (code.Length < 5) continue;
            var numberPart = code[^5..];
            if (!int.TryParse(numberPart, out var number)) continue;

            if (isDummy && number < DummyStartNumber) continue;
            if (!isDummy && number >= DummyStartNumber) continue;

            if (number > max) max = number;
        }
        return max;
    }
}

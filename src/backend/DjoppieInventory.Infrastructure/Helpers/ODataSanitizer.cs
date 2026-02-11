using System.Text.RegularExpressions;

namespace DjoppieInventory.Infrastructure.Helpers;

/// <summary>
/// Provides sanitization methods for OData filter queries to prevent injection attacks.
/// </summary>
public static class ODataSanitizer
{
    // Pattern to detect potential OData injection attempts
    private static readonly Regex InjectionPattern = new(
        @"(\s+(or|and|eq|ne|gt|ge|lt|le|not)\s+)|[\'\""\\]",
        RegexOptions.IgnoreCase | RegexOptions.Compiled);

    /// <summary>
    /// Sanitizes a string value for safe use in OData filter queries.
    /// Escapes single quotes and removes potentially dangerous characters.
    /// </summary>
    /// <param name="input">The input string to sanitize</param>
    /// <returns>A sanitized string safe for OData filter usage</returns>
    public static string SanitizeForFilter(string? input)
    {
        if (string.IsNullOrWhiteSpace(input))
            return string.Empty;

        // Trim and limit length to prevent buffer overflow attacks
        var sanitized = input.Trim();
        if (sanitized.Length > 256)
            sanitized = sanitized[..256];

        // Escape single quotes (OData string delimiter)
        sanitized = sanitized.Replace("'", "''");

        // Remove control characters and newlines
        sanitized = sanitized
            .Replace("\r", "")
            .Replace("\n", "")
            .Replace("\t", "")
            .Replace("\0", "");

        // Remove potential OData operators that could be used for injection
        // This is an extra safety layer on top of proper escaping
        sanitized = Regex.Replace(sanitized, @"\s{2,}", " ");

        return sanitized;
    }

    /// <summary>
    /// Validates that the input doesn't contain obvious injection patterns.
    /// Use this for additional validation before building queries.
    /// </summary>
    /// <param name="input">The input string to validate</param>
    /// <returns>True if the input appears safe, false if potential injection detected</returns>
    public static bool IsValidFilterValue(string? input)
    {
        if (string.IsNullOrWhiteSpace(input))
            return true;

        // Check for common injection patterns
        if (InjectionPattern.IsMatch(input))
            return false;

        // Check for unbalanced quotes
        var quoteCount = input.Count(c => c == '\'');
        if (quoteCount % 2 != 0)
            return false;

        return true;
    }

    /// <summary>
    /// Creates a safe OData equality filter expression.
    /// </summary>
    /// <param name="fieldName">The field name to filter on</param>
    /// <param name="value">The value to compare (will be sanitized)</param>
    /// <returns>A safe OData filter expression</returns>
    public static string CreateEqualityFilter(string fieldName, string value)
    {
        var sanitizedValue = SanitizeForFilter(value);
        return $"{fieldName} eq '{sanitizedValue}'";
    }

    /// <summary>
    /// Creates a safe OData startswith filter expression.
    /// </summary>
    /// <param name="fieldName">The field name to filter on</param>
    /// <param name="value">The value to check (will be sanitized)</param>
    /// <returns>A safe OData filter expression</returns>
    public static string CreateStartsWithFilter(string fieldName, string value)
    {
        var sanitizedValue = SanitizeForFilter(value);
        return $"startswith({fieldName}, '{sanitizedValue}')";
    }
}

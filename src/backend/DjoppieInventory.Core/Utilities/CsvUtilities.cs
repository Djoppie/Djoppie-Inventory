using System.Text;

namespace DjoppieInventory.Core.Utilities;

/// <summary>
/// CSV parsing and processing utilities
/// </summary>
public static class CsvUtilities
{
    /// <summary>
    /// Parses a CSV line into fields, respecting quoted values that may contain delimiters.
    /// Example: "Field1","Field,2","Field3" → ["Field1", "Field,2", "Field3"]
    /// </summary>
    /// <param name="line">CSV line to parse</param>
    /// <param name="delimiter">Field delimiter (default: comma)</param>
    /// <returns>Array of field values</returns>
    public static string[] ParseCsvLine(string line, char delimiter = ',')
    {
        var result = new List<string>();
        var inQuotes = false;
        var current = new StringBuilder();

        foreach (var c in line)
        {
            if (c == '"')
            {
                inQuotes = !inQuotes;
            }
            else if (c == delimiter && !inQuotes)
            {
                result.Add(current.ToString());
                current.Clear();
            }
            else
            {
                current.Append(c);
            }
        }
        result.Add(current.ToString());

        return result.ToArray();
    }

    /// <summary>
    /// Detects the delimiter used in a CSV header line by counting occurrences.
    /// Prefers semicolon for European locales.
    /// </summary>
    /// <param name="headerLine">First line of CSV file</param>
    /// <returns>Detected delimiter character (comma, semicolon, or tab)</returns>
    public static char DetectDelimiter(string headerLine)
    {
        // Count occurrences of common delimiters
        var commaCount = headerLine.Count(c => c == ',');
        var semicolonCount = headerLine.Count(c => c == ';');
        var tabCount = headerLine.Count(c => c == '\t');

        // Return the most common one (prefer semicolon for European locales)
        if (semicolonCount >= commaCount && semicolonCount >= tabCount)
            return ';';
        if (tabCount > commaCount)
            return '\t';
        return ',';
    }
}

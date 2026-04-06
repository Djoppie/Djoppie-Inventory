using System.Globalization;
using System.Text;

namespace DjoppieInventory.Core.Utilities;

/// <summary>
/// Text manipulation utilities for string processing
/// </summary>
public static class TextUtilities
{
    /// <summary>
    /// Removes diacritics (accents) from text for normalization and comparison.
    /// Example: "Café" → "Cafe", "Zürich" → "Zurich"
    /// </summary>
    /// <param name="text">Text to remove diacritics from</param>
    /// <returns>Text with diacritics removed</returns>
    public static string RemoveDiacritics(string text)
    {
        if (string.IsNullOrEmpty(text))
            return text;

        var normalizedString = text.Normalize(NormalizationForm.FormD);
        var stringBuilder = new StringBuilder(normalizedString.Length);

        foreach (var c in normalizedString)
        {
            var unicodeCategory = CharUnicodeInfo.GetUnicodeCategory(c);
            if (unicodeCategory != UnicodeCategory.NonSpacingMark)
            {
                stringBuilder.Append(c);
            }
        }

        return stringBuilder.ToString().Normalize(NormalizationForm.FormC);
    }
}

using System.Text.RegularExpressions;

namespace DjoppieInventory.API.Helpers;

/// <summary>
/// Provides input validation methods for API endpoints.
/// </summary>
public static class InputValidator
{
    /// <summary>
    /// Maximum allowed length for asset code prefix.
    /// </summary>
    public const int MaxPrefixLength = 20;

    /// <summary>
    /// Maximum allowed length for serial numbers.
    /// </summary>
    public const int MaxSerialNumberLength = 100;

    /// <summary>
    /// Maximum allowed length for asset codes.
    /// </summary>
    public const int MaxAssetCodeLength = 50;

    /// <summary>
    /// Pattern for valid asset code prefix (uppercase letters and numbers only).
    /// </summary>
    private static readonly Regex PrefixPattern = new(@"^[A-Z0-9]+$", RegexOptions.Compiled);

    /// <summary>
    /// Pattern for valid asset code following the format: [DUM-]TYPE-YY-MERK-NNNNN
    /// Examples: LAP-24-DBK-00001, DUM-LAP-26-HP-90001
    /// </summary>
    private static readonly Regex AssetCodePattern = new(@"^(?:DUM-)?[A-Z]{2,10}-\d{2}-[A-Z0-9]{1,4}-\d{5}$", RegexOptions.Compiled | RegexOptions.IgnoreCase);

    /// <summary>
    /// Validates an asset code prefix.
    /// </summary>
    /// <param name="prefix">The prefix to validate</param>
    /// <param name="errorMessage">Error message if validation fails</param>
    /// <returns>True if valid, false otherwise</returns>
    public static bool ValidatePrefix(string? prefix, out string? errorMessage)
    {
        if (string.IsNullOrWhiteSpace(prefix))
        {
            errorMessage = "Prefix is required";
            return false;
        }

        if (prefix.Length > MaxPrefixLength)
        {
            errorMessage = $"Prefix cannot exceed {MaxPrefixLength} characters";
            return false;
        }

        if (!PrefixPattern.IsMatch(prefix))
        {
            errorMessage = "Prefix must contain only uppercase letters and numbers";
            return false;
        }

        errorMessage = null;
        return true;
    }

    /// <summary>
    /// Validates an asset code.
    /// </summary>
    /// <param name="assetCode">The asset code to validate</param>
    /// <param name="errorMessage">Error message if validation fails</param>
    /// <returns>True if valid, false otherwise</returns>
    public static bool ValidateAssetCode(string? assetCode, out string? errorMessage)
    {
        if (string.IsNullOrWhiteSpace(assetCode))
        {
            errorMessage = "Asset code is required";
            return false;
        }

        if (assetCode.Length > MaxAssetCodeLength)
        {
            errorMessage = $"Asset code cannot exceed {MaxAssetCodeLength} characters";
            return false;
        }

        if (!AssetCodePattern.IsMatch(assetCode))
        {
            errorMessage = "Asset code must be in format TYPE-YY-MERK-NNNNN (e.g., LAP-24-DBK-00001) or DUM-TYPE-YY-MERK-NNNNN for dummy assets";
            return false;
        }

        errorMessage = null;
        return true;
    }

    /// <summary>
    /// Validates a serial number.
    /// </summary>
    /// <param name="serialNumber">The serial number to validate</param>
    /// <param name="errorMessage">Error message if validation fails</param>
    /// <returns>True if valid, false otherwise</returns>
    public static bool ValidateSerialNumber(string? serialNumber, out string? errorMessage)
    {
        if (string.IsNullOrWhiteSpace(serialNumber))
        {
            errorMessage = "Serial number is required";
            return false;
        }

        if (serialNumber.Length > MaxSerialNumberLength)
        {
            errorMessage = $"Serial number cannot exceed {MaxSerialNumberLength} characters";
            return false;
        }

        // Check for potentially dangerous characters
        if (serialNumber.Contains('<') || serialNumber.Contains('>') ||
            serialNumber.Contains('\'') || serialNumber.Contains('"'))
        {
            errorMessage = "Serial number contains invalid characters";
            return false;
        }

        errorMessage = null;
        return true;
    }

    /// <summary>
    /// Validates a device ID (GUID format for Intune).
    /// </summary>
    /// <param name="deviceId">The device ID to validate</param>
    /// <param name="errorMessage">Error message if validation fails</param>
    /// <returns>True if valid, false otherwise</returns>
    public static bool ValidateDeviceId(string? deviceId, out string? errorMessage)
    {
        if (string.IsNullOrWhiteSpace(deviceId))
        {
            errorMessage = "Device ID is required";
            return false;
        }

        if (deviceId.Length > 100)
        {
            errorMessage = "Device ID is too long";
            return false;
        }

        // Intune device IDs are typically GUIDs
        if (!Guid.TryParse(deviceId, out _))
        {
            errorMessage = "Device ID must be a valid GUID";
            return false;
        }

        errorMessage = null;
        return true;
    }

    /// <summary>
    /// Validates a search/filter string.
    /// </summary>
    /// <param name="searchTerm">The search term to validate</param>
    /// <param name="maxLength">Maximum allowed length</param>
    /// <param name="errorMessage">Error message if validation fails</param>
    /// <returns>True if valid, false otherwise</returns>
    public static bool ValidateSearchTerm(string? searchTerm, int maxLength, out string? errorMessage)
    {
        if (string.IsNullOrWhiteSpace(searchTerm))
        {
            errorMessage = "Search term is required";
            return false;
        }

        if (searchTerm.Length > maxLength)
        {
            errorMessage = $"Search term cannot exceed {maxLength} characters";
            return false;
        }

        // Check for SQL injection patterns
        var lowerSearch = searchTerm.ToLowerInvariant();
        if (lowerSearch.Contains("--") || lowerSearch.Contains(";") ||
            lowerSearch.Contains("/*") || lowerSearch.Contains("*/") ||
            lowerSearch.Contains("xp_") || lowerSearch.Contains("exec("))
        {
            errorMessage = "Search term contains invalid characters";
            return false;
        }

        errorMessage = null;
        return true;
    }
}

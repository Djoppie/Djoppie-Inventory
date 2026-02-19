using DjoppieInventory.API.Helpers;

namespace DjoppieInventory.Tests.Helpers;

public class InputValidatorTests
{
    #region ValidatePrefix Tests

    [Theory]
    [InlineData("LAP", true)]
    [InlineData("MON", true)]
    [InlineData("PC123", true)]
    [InlineData("A", true)]
    [InlineData("ABCDEFGHIJ1234567890", true)] // 20 chars - max length
    public void ValidatePrefix_ValidInputs_ReturnsTrue(string prefix, bool expected)
    {
        var result = InputValidator.ValidatePrefix(prefix, out var errorMessage);

        Assert.Equal(expected, result);
        Assert.Null(errorMessage);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void ValidatePrefix_NullOrEmpty_ReturnsFalse(string? prefix)
    {
        var result = InputValidator.ValidatePrefix(prefix, out var errorMessage);

        Assert.False(result);
        Assert.Equal("Prefix is required", errorMessage);
    }

    [Fact]
    public void ValidatePrefix_TooLong_ReturnsFalse()
    {
        var prefix = new string('A', 21); // 21 chars - exceeds max

        var result = InputValidator.ValidatePrefix(prefix, out var errorMessage);

        Assert.False(result);
        Assert.Contains("cannot exceed", errorMessage);
    }

    [Theory]
    [InlineData("lap")] // lowercase
    [InlineData("Lap")] // mixed case
    [InlineData("LAP-")] // has dash
    [InlineData("LAP 1")] // has space
    [InlineData("LAP@")] // has special char
    public void ValidatePrefix_InvalidCharacters_ReturnsFalse(string prefix)
    {
        var result = InputValidator.ValidatePrefix(prefix, out var errorMessage);

        Assert.False(result);
        Assert.Contains("uppercase letters and numbers", errorMessage);
    }

    #endregion

    #region ValidateAssetCode Tests

    [Theory]
    [InlineData("LAP-24-DBK-00001", true)]
    [InlineData("MON-26-DELL-99999", true)]
    [InlineData("PC-23-HP-00001", true)]
    [InlineData("DUM-LAP-24-ASUS-90001", true)]
    [InlineData("lap-24-dbk-00001", true)] // Case insensitive
    public void ValidateAssetCode_ValidInputs_ReturnsTrue(string code, bool expected)
    {
        var result = InputValidator.ValidateAssetCode(code, out var errorMessage);

        Assert.Equal(expected, result);
        Assert.Null(errorMessage);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void ValidateAssetCode_NullOrEmpty_ReturnsFalse(string? code)
    {
        var result = InputValidator.ValidateAssetCode(code, out var errorMessage);

        Assert.False(result);
        Assert.Equal("Asset code is required", errorMessage);
    }

    [Theory]
    [InlineData("LAP0001")] // missing dashes
    [InlineData("LAP-001")] // wrong format
    [InlineData("LAP-00001")] // wrong format
    [InlineData("LAP-0001")] // old format (4 digits)
    [InlineData("-24-DBK-00001")] // no type
    [InlineData("LAP-24-00001")] // missing brand
    [InlineData("LAP-24-DBK-0001")] // only 4 digits (needs 5)
    [InlineData("L-24-DBK-00001")] // type too short (needs 2-10 chars)
    public void ValidateAssetCode_InvalidFormat_ReturnsFalse(string code)
    {
        var result = InputValidator.ValidateAssetCode(code, out var errorMessage);

        Assert.False(result);
        Assert.Contains("TYPE-YY-MERK-NNNNN", errorMessage);
    }

    #endregion

    #region ValidateSerialNumber Tests

    [Theory]
    [InlineData("ABC123", true)]
    [InlineData("SN-2024-001", true)]
    [InlineData("12345678901234567890", true)]
    public void ValidateSerialNumber_ValidInputs_ReturnsTrue(string serialNumber, bool expected)
    {
        var result = InputValidator.ValidateSerialNumber(serialNumber, out var errorMessage);

        Assert.Equal(expected, result);
        Assert.Null(errorMessage);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void ValidateSerialNumber_NullOrEmpty_ReturnsFalse(string? serialNumber)
    {
        var result = InputValidator.ValidateSerialNumber(serialNumber, out var errorMessage);

        Assert.False(result);
        Assert.Equal("Serial number is required", errorMessage);
    }

    [Fact]
    public void ValidateSerialNumber_TooLong_ReturnsFalse()
    {
        var serialNumber = new string('A', 101); // exceeds max 100

        var result = InputValidator.ValidateSerialNumber(serialNumber, out var errorMessage);

        Assert.False(result);
        Assert.Contains("cannot exceed", errorMessage);
    }

    [Theory]
    [InlineData("SN<script>")]
    [InlineData("SN>alert")]
    [InlineData("SN'injection")]
    [InlineData("SN\"test")]
    public void ValidateSerialNumber_DangerousCharacters_ReturnsFalse(string serialNumber)
    {
        var result = InputValidator.ValidateSerialNumber(serialNumber, out var errorMessage);

        Assert.False(result);
        Assert.Contains("invalid characters", errorMessage);
    }

    #endregion

    #region ValidateDeviceId Tests

    [Theory]
    [InlineData("00000000-0000-0000-0000-000000000000", true)]
    [InlineData("a1b2c3d4-e5f6-7890-abcd-ef1234567890", true)]
    public void ValidateDeviceId_ValidGuid_ReturnsTrue(string deviceId, bool expected)
    {
        var result = InputValidator.ValidateDeviceId(deviceId, out var errorMessage);

        Assert.Equal(expected, result);
        Assert.Null(errorMessage);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void ValidateDeviceId_NullOrEmpty_ReturnsFalse(string? deviceId)
    {
        var result = InputValidator.ValidateDeviceId(deviceId, out var errorMessage);

        Assert.False(result);
        Assert.Equal("Device ID is required", errorMessage);
    }

    [Theory]
    [InlineData("not-a-guid")]
    [InlineData("12345")]
    [InlineData("00000000-0000-0000-0000")] // incomplete
    public void ValidateDeviceId_InvalidGuid_ReturnsFalse(string deviceId)
    {
        var result = InputValidator.ValidateDeviceId(deviceId, out var errorMessage);

        Assert.False(result);
        Assert.Contains("valid GUID", errorMessage);
    }

    #endregion

    #region ValidateSearchTerm Tests

    [Theory]
    [InlineData("laptop", true)]
    [InlineData("windows 10", true)]
    [InlineData("Dell Latitude", true)]
    public void ValidateSearchTerm_ValidInputs_ReturnsTrue(string searchTerm, bool expected)
    {
        var result = InputValidator.ValidateSearchTerm(searchTerm, 100, out var errorMessage);

        Assert.Equal(expected, result);
        Assert.Null(errorMessage);
    }

    [Theory]
    [InlineData("test--injection")]
    [InlineData("test; DROP TABLE")]
    [InlineData("test/* comment */")]
    [InlineData("xp_cmdshell")]
    [InlineData("exec(")]
    public void ValidateSearchTerm_SqlInjectionPatterns_ReturnsFalse(string searchTerm)
    {
        var result = InputValidator.ValidateSearchTerm(searchTerm, 100, out var errorMessage);

        Assert.False(result);
        Assert.Contains("invalid characters", errorMessage);
    }

    #endregion
}

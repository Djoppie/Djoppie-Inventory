using DjoppieInventory.Infrastructure.Helpers;

namespace DjoppieInventory.Tests.Helpers;

public class ODataSanitizerTests
{
    #region SanitizeForFilter Tests

    [Theory]
    [InlineData(null, "")]
    [InlineData("", "")]
    [InlineData("   ", "")]
    public void SanitizeForFilter_NullOrEmpty_ReturnsEmpty(string? input, string expected)
    {
        var result = ODataSanitizer.SanitizeForFilter(input);

        Assert.Equal(expected, result);
    }

    [Fact]
    public void SanitizeForFilter_NormalInput_ReturnsSameValue()
    {
        var input = "ABC123";

        var result = ODataSanitizer.SanitizeForFilter(input);

        Assert.Equal("ABC123", result);
    }

    [Fact]
    public void SanitizeForFilter_SingleQuote_EscapesCorrectly()
    {
        var input = "O'Brien";

        var result = ODataSanitizer.SanitizeForFilter(input);

        Assert.Equal("O''Brien", result);
    }

    [Fact]
    public void SanitizeForFilter_MultipleQuotes_EscapesAll()
    {
        var input = "Test'with'quotes";

        var result = ODataSanitizer.SanitizeForFilter(input);

        Assert.Equal("Test''with''quotes", result);
    }

    [Fact]
    public void SanitizeForFilter_ControlCharacters_RemovesAll()
    {
        var input = "Test\r\n\tValue\0";

        var result = ODataSanitizer.SanitizeForFilter(input);

        Assert.Equal("TestValue", result);
    }

    [Fact]
    public void SanitizeForFilter_TooLong_Truncates()
    {
        var input = new string('A', 300);

        var result = ODataSanitizer.SanitizeForFilter(input);

        Assert.Equal(256, result.Length);
    }

    [Fact]
    public void SanitizeForFilter_LeadingTrailingWhitespace_Trims()
    {
        var input = "  Test Value  ";

        var result = ODataSanitizer.SanitizeForFilter(input);

        Assert.Equal("Test Value", result);
    }

    #endregion

    #region IsValidFilterValue Tests

    [Theory]
    [InlineData(null, true)]
    [InlineData("", true)]
    [InlineData("   ", true)]
    public void IsValidFilterValue_NullOrEmpty_ReturnsTrue(string? input, bool expected)
    {
        var result = ODataSanitizer.IsValidFilterValue(input);

        Assert.Equal(expected, result);
    }

    [Theory]
    [InlineData("ABC123")]
    [InlineData("normal-value")]
    [InlineData("Windows 10")]
    public void IsValidFilterValue_SafeInput_ReturnsTrue(string input)
    {
        var result = ODataSanitizer.IsValidFilterValue(input);

        Assert.True(result);
    }

    [Theory]
    [InlineData("' or 1 eq 1")] // SQL-style injection
    [InlineData("test' and 'a' eq 'a")] // OData injection
    [InlineData("value eq 'test")] // Unbalanced quotes
    [InlineData("' or serialNumber ne '")] // OData operator injection
    public void IsValidFilterValue_InjectionPattern_ReturnsFalse(string input)
    {
        var result = ODataSanitizer.IsValidFilterValue(input);

        Assert.False(result);
    }

    #endregion

    #region CreateEqualityFilter Tests

    [Fact]
    public void CreateEqualityFilter_NormalValue_CreatesCorrectFilter()
    {
        var result = ODataSanitizer.CreateEqualityFilter("serialNumber", "ABC123");

        Assert.Equal("serialNumber eq 'ABC123'", result);
    }

    [Fact]
    public void CreateEqualityFilter_ValueWithQuote_EscapesQuote()
    {
        var result = ODataSanitizer.CreateEqualityFilter("deviceName", "John's Laptop");

        Assert.Equal("deviceName eq 'John''s Laptop'", result);
    }

    [Fact]
    public void CreateEqualityFilter_EmptyValue_CreatesFilterWithEmpty()
    {
        var result = ODataSanitizer.CreateEqualityFilter("field", "");

        Assert.Equal("field eq ''", result);
    }

    #endregion

    #region CreateStartsWithFilter Tests

    [Fact]
    public void CreateStartsWithFilter_NormalValue_CreatesCorrectFilter()
    {
        var result = ODataSanitizer.CreateStartsWithFilter("deviceName", "LAPTOP");

        Assert.Equal("startswith(deviceName, 'LAPTOP')", result);
    }

    [Fact]
    public void CreateStartsWithFilter_ValueWithQuote_EscapesQuote()
    {
        var result = ODataSanitizer.CreateStartsWithFilter("deviceName", "User's");

        Assert.Equal("startswith(deviceName, 'User''s')", result);
    }

    #endregion

    #region Security Injection Prevention Tests

    [Fact]
    public void SanitizeForFilter_ODataInjectionAttempt_NeutralizedInOutput()
    {
        // Attempt to break out of filter and add OR condition
        var maliciousInput = "' or 1 eq 1 or serialNumber eq '";

        var result = ODataSanitizer.SanitizeForFilter(maliciousInput);

        // Single quotes are escaped, preventing injection
        Assert.Equal("'' or 1 eq 1 or serialNumber eq ''", result);

        // The resulting filter would be:
        // serialNumber eq ''' or 1 eq 1 or serialNumber eq '''
        // Which searches for the literal string, not an injection
    }

    [Fact]
    public void CreateEqualityFilter_WithInjectionAttempt_ProducesLiteralSearch()
    {
        var maliciousInput = "ABC' or deviceName eq 'ADMIN";

        var result = ODataSanitizer.CreateEqualityFilter("serialNumber", maliciousInput);

        // The filter searches for the literal string including the escaped quote
        Assert.Equal("serialNumber eq 'ABC'' or deviceName eq ''ADMIN'", result);
    }

    #endregion
}

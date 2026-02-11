using DjoppieInventory.Core.DTOs;

namespace DjoppieInventory.Tests.DTOs;

public class PagedResultDtoTests
{
    [Fact]
    public void TotalPages_WithEvenDivision_CalculatesCorrectly()
    {
        var dto = new PagedResultDto<string>
        {
            TotalCount = 100,
            PageSize = 10,
            PageNumber = 1
        };

        Assert.Equal(10, dto.TotalPages);
    }

    [Fact]
    public void TotalPages_WithRemainder_RoundsUp()
    {
        var dto = new PagedResultDto<string>
        {
            TotalCount = 101,
            PageSize = 10,
            PageNumber = 1
        };

        Assert.Equal(11, dto.TotalPages);
    }

    [Fact]
    public void TotalPages_WithZeroPageSize_ReturnsZero()
    {
        var dto = new PagedResultDto<string>
        {
            TotalCount = 100,
            PageSize = 0,
            PageNumber = 1
        };

        Assert.Equal(0, dto.TotalPages);
    }

    [Fact]
    public void TotalPages_WithZeroTotalCount_ReturnsZero()
    {
        var dto = new PagedResultDto<string>
        {
            TotalCount = 0,
            PageSize = 10,
            PageNumber = 1
        };

        Assert.Equal(0, dto.TotalPages);
    }

    [Theory]
    [InlineData(1, false)]
    [InlineData(2, true)]
    [InlineData(5, true)]
    public void HasPreviousPage_BasedOnPageNumber(int pageNumber, bool expected)
    {
        var dto = new PagedResultDto<string>
        {
            TotalCount = 100,
            PageSize = 10,
            PageNumber = pageNumber
        };

        Assert.Equal(expected, dto.HasPreviousPage);
    }

    [Theory]
    [InlineData(1, 100, 10, true)]   // Page 1 of 10, has next
    [InlineData(9, 100, 10, true)]   // Page 9 of 10, has next
    [InlineData(10, 100, 10, false)] // Page 10 of 10, no next
    [InlineData(11, 100, 10, false)] // Beyond last page
    [InlineData(1, 5, 10, false)]    // Only 1 page total
    public void HasNextPage_BasedOnPageAndTotal(int pageNumber, int totalCount, int pageSize, bool expected)
    {
        var dto = new PagedResultDto<string>
        {
            TotalCount = totalCount,
            PageSize = pageSize,
            PageNumber = pageNumber
        };

        Assert.Equal(expected, dto.HasNextPage);
    }

    [Fact]
    public void Items_DefaultsToEmptyList()
    {
        var dto = new PagedResultDto<string>();

        Assert.NotNull(dto.Items);
        Assert.Empty(dto.Items);
    }

    [Fact]
    public void Items_CanBeSet()
    {
        var items = new List<string> { "A", "B", "C" };
        var dto = new PagedResultDto<string>
        {
            Items = items
        };

        Assert.Equal(3, dto.Items.Count());
        Assert.Contains("A", dto.Items);
    }

    [Fact]
    public void SinglePage_HasCorrectNavigationProperties()
    {
        var dto = new PagedResultDto<string>
        {
            TotalCount = 5,
            PageSize = 10,
            PageNumber = 1,
            Items = new List<string> { "1", "2", "3", "4", "5" }
        };

        Assert.Equal(1, dto.TotalPages);
        Assert.False(dto.HasPreviousPage);
        Assert.False(dto.HasNextPage);
    }

    [Fact]
    public void MiddlePage_HasCorrectNavigationProperties()
    {
        var dto = new PagedResultDto<string>
        {
            TotalCount = 50,
            PageSize = 10,
            PageNumber = 3
        };

        Assert.Equal(5, dto.TotalPages);
        Assert.True(dto.HasPreviousPage);
        Assert.True(dto.HasNextPage);
    }
}

namespace DjoppieInventory.Core.DTOs;

public record EmployeeReportItemDto
{
    public int EmployeeId { get; init; }
    public string DisplayName { get; init; } = string.Empty;
    public string? JobTitle { get; init; }
    public string? ServiceName { get; init; }
    public int? ServiceId { get; init; }
    public string? WorkplaceCode { get; init; }
    public int? WorkplaceId { get; init; }
    public int AssetCount { get; init; }
    /// <summary>Asset code of the employee's primary laptop, if any.</summary>
    public string? PrimaryLaptopCode { get; init; }
    /// <summary>Serial number of the employee's primary laptop (shown under the code).</summary>
    public string? PrimaryLaptopSerial { get; init; }
    /// <summary>Asset code of the employee's primary desktop, if any.</summary>
    public string? PrimaryDesktopCode { get; init; }
    /// <summary>Serial number of the employee's primary desktop (shown under the code).</summary>
    public string? PrimaryDesktopSerial { get; init; }
    public int IntuneCompliant { get; init; }
    public int IntuneNonCompliant { get; init; }
    public DateTime? LastEventDate { get; init; }
}

public record EmployeeTimelineItemDto
{
    public int EventId { get; init; }
    public DateTime EventDate { get; init; }
    public string EventType { get; init; } = string.Empty;
    public string EventTypeDisplay { get; init; } = string.Empty;
    public string Description { get; init; } = string.Empty;
    public int AssetId { get; init; }
    public string AssetCode { get; init; } = string.Empty;
    public string? OldValue { get; init; }
    public string? NewValue { get; init; }
}

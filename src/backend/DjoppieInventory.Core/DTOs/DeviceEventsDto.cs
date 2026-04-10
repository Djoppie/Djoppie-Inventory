namespace DjoppieInventory.Core.DTOs;

public class DeviceEventsResponseDto
{
    public string DeviceId { get; set; } = string.Empty;
    public string DeviceName { get; set; } = string.Empty;
    public List<DeviceEventDto> Events { get; set; } = new();
    public DateTime RetrievedAt { get; set; } = DateTime.UtcNow;
}

public class DeviceEventDto
{
    public DateTime Timestamp { get; set; }
    public string EventType { get; set; } = string.Empty;
    public string Severity { get; set; } = "info";
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public Dictionary<string, string>? Details { get; set; }
}

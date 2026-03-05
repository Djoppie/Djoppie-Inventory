namespace DjoppieInventory.Core.DTOs;

/// <summary>
/// DTO for returning asset event information
/// </summary>
public record AssetEventDto(
    int Id,
    int AssetId,
    string EventType,
    string Description,
    string? Notes,
    string? OldValue,
    string? NewValue,
    string? PerformedBy,
    string? PerformedByEmail,
    DateTime EventDate
);

/// <summary>
/// DTO for creating a new asset event
/// </summary>
public record CreateAssetEventDto(
    int AssetId,
    string EventType,
    string Description,
    string? Notes,
    string? OldValue,
    string? NewValue
);

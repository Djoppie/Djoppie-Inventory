namespace DjoppieInventory.Core.DTOs;

/// <summary>
/// DTO for returning building information
/// </summary>
public record BuildingDto(
    int Id,
    string Code,
    string Name,
    string? Address,
    bool IsActive,
    int SortOrder
);

/// <summary>
/// DTO for creating a new building
/// </summary>
public record CreateBuildingDto(
    string Code,
    string Name,
    string? Address,
    int SortOrder = 0
);

/// <summary>
/// DTO for updating an existing building
/// </summary>
public record UpdateBuildingDto(
    string Name,
    string? Address,
    bool IsActive,
    int SortOrder
);

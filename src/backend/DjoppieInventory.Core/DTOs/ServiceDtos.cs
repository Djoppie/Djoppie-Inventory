namespace DjoppieInventory.Core.DTOs;

/// <summary>
/// Lightweight sector info for embedding in ServiceDto
/// </summary>
public record SectorInfoDto(
    int Id,
    string Code,
    string Name
);

/// <summary>
/// DTO for returning service information
/// </summary>
public record ServiceDto(
    int Id,
    string Code,
    string Name,
    int? SectorId,
    SectorInfoDto? Sector,
    bool IsActive,
    int SortOrder
);

/// <summary>
/// DTO for creating a new service
/// </summary>
public record CreateServiceDto(
    string Code,
    string Name,
    int? SectorId,
    int SortOrder = 0
);

/// <summary>
/// DTO for updating an existing service
/// </summary>
public record UpdateServiceDto(
    string Name,
    int? SectorId,
    bool IsActive,
    int SortOrder
);

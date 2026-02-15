namespace DjoppieInventory.Core.DTOs;

/// <summary>
/// DTO for returning sector information
/// </summary>
public record SectorDto(
    int Id,
    string Code,
    string Name,
    bool IsActive,
    int SortOrder,
    List<ServiceDto>? Services = null
);

/// <summary>
/// DTO for creating a new sector
/// </summary>
public record CreateSectorDto(
    string Code,
    string Name,
    int SortOrder = 0
);

/// <summary>
/// DTO for updating an existing sector
/// </summary>
public record UpdateSectorDto(
    string Name,
    bool IsActive,
    int SortOrder
);

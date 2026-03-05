namespace DjoppieInventory.Core.DTOs;

/// <summary>
/// DTO for returning asset type information
/// </summary>
public record AssetTypeDto(
    int Id,
    string Code,
    string Name,
    string? Description,
    bool IsActive,
    int SortOrder,
    int? CategoryId
);

/// <summary>
/// DTO for creating a new asset type
/// </summary>
public record CreateAssetTypeDto(
    string Code,
    string Name,
    string? Description,
    int SortOrder = 0,
    int? CategoryId = null
);

/// <summary>
/// DTO for updating an existing asset type
/// </summary>
public record UpdateAssetTypeDto(
    string Name,
    string? Description,
    bool IsActive,
    int SortOrder,
    int? CategoryId
);

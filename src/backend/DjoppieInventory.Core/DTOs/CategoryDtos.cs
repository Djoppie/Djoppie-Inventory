namespace DjoppieInventory.Core.DTOs;

/// <summary>
/// DTO for returning category data
/// </summary>
public record CategoryDto(
    int Id,
    string Code,
    string Name,
    string? Description,
    bool IsActive,
    int SortOrder,
    int AssetTypeCount
);

/// <summary>
/// DTO for returning category with its asset types
/// </summary>
public record CategoryWithAssetTypesDto(
    int Id,
    string Code,
    string Name,
    string? Description,
    bool IsActive,
    int SortOrder,
    List<AssetTypeDto> AssetTypes
);

/// <summary>
/// DTO for creating a new category
/// </summary>
public record CreateCategoryDto(
    string Code,
    string Name,
    string? Description,
    int SortOrder = 0
);

/// <summary>
/// DTO for updating an existing category
/// </summary>
public record UpdateCategoryDto(
    string Code,
    string Name,
    string? Description,
    bool IsActive,
    int SortOrder
);

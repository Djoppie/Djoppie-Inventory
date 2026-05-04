using DjoppieInventory.Core.Entities.Enums;

namespace DjoppieInventory.Core.DTOs.PhysicalWorkplace;

/// <summary>
/// DTO for bulk-patching multiple physical workplaces.
/// Only fields that are non-null will be applied; null means "leave unchanged."
/// </summary>
public record BulkUpdateWorkplacesDto(
    IEnumerable<int> Ids,
    int? BuildingId,
    int? ServiceId,
    WorkplaceType? Type,
    bool? IsActive,
    string? Floor
);

/// <summary>
/// Result of a bulk update operation
/// </summary>
public record BulkUpdateWorkplacesResult(
    int Updated,
    int Skipped,
    IEnumerable<string> Errors
);

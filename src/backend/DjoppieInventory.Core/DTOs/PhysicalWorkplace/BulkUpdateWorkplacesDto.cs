using DjoppieInventory.Core.Entities.Enums;

namespace DjoppieInventory.Core.DTOs.PhysicalWorkplace;

/// <summary>
/// DTO for bulk-patching multiple physical workplaces.
/// Only fields that are non-null will be applied; null means "leave unchanged."
///
/// Uniform fields (BuildingId, ServiceId, Type, IsActive, Floor, Room) are
/// applied identically to every workplace in <see cref="Ids"/>.
///
/// Per-id fields (<see cref="Codes"/> and <see cref="Names"/>) carry distinct
/// values per workplace — produced client-side from a template like
/// <c>PG-RO-FO-{n+1:02}</c>. The backend treats them as the resolved final
/// values and validates uniqueness for codes (global + per-building).
/// </summary>
public record BulkUpdateWorkplacesDto(
    IEnumerable<int> Ids,
    int? BuildingId,
    int? ServiceId,
    WorkplaceType? Type,
    bool? IsActive,
    string? Floor,
    string? Room,
    IDictionary<int, string>? Codes,
    IDictionary<int, string>? Names
);

/// <summary>
/// Result of a bulk update operation
/// </summary>
public record BulkUpdateWorkplacesResult(
    int Updated,
    int Skipped,
    IEnumerable<string> Errors
);

using DjoppieInventory.Core.Entities.Enums;

namespace DjoppieInventory.Core.DTOs.PhysicalWorkplace;

/// <summary>
/// DTO for bulk creating workplaces for a service/building
/// </summary>
public record BulkCreateWorkplacesDto(
    int BuildingId,
    int? ServiceId,
    string CodePrefix,
    int StartNumber,
    int Count,
    string NameTemplate,
    string? Floor,
    string? Room,
    WorkplaceType Type = WorkplaceType.Laptop,
    int MonitorCount = 2,
    bool HasDockingStation = true
);

/// <summary>
/// Result of bulk workplace creation
/// </summary>
public record BulkCreateWorkplacesResultDto(
    int TotalRequested,
    int SuccessCount,
    int ErrorCount,
    List<BulkCreateWorkplaceItemResult> Results
);

/// <summary>
/// Individual result for each workplace in bulk create
/// </summary>
public record BulkCreateWorkplaceItemResult(
    int? Id,
    string Code,
    string Name,
    bool Success,
    string? Error
);

/// <summary>
/// DTO for CSV import of workplaces
/// </summary>
public record WorkplaceCsvImportResultDto(
    int TotalRows,
    int SuccessCount,
    int ErrorCount,
    bool IsFullySuccessful,
    List<WorkplaceCsvImportRowResult> Results
);

/// <summary>
/// Individual row result for CSV import
/// </summary>
public record WorkplaceCsvImportRowResult(
    int RowNumber,
    string? Code,
    string? Name,
    bool Success,
    string? Error,
    int? CreatedId
);

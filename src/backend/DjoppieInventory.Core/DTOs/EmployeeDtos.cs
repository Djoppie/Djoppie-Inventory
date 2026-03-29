using DjoppieInventory.Core.Entities.Enums;

namespace DjoppieInventory.Core.DTOs;

/// <summary>
/// Lightweight service info for embedding in EmployeeDto
/// </summary>
public record ServiceInfoDto(
    int Id,
    string Code,
    string Name
);

/// <summary>
/// Lightweight employee info for embedding in other DTOs (e.g., AssetDto)
/// </summary>
public record EmployeeInfoDto(
    int Id,
    string EntraId,
    string DisplayName,
    string? Email,
    string? JobTitle,
    int? ServiceId,
    string? ServiceName
);

/// <summary>
/// DTO for returning employee information
/// </summary>
public record EmployeeDto(
    int Id,
    string EntraId,
    string UserPrincipalName,
    string DisplayName,
    string? Email,
    string? Department,
    string? JobTitle,
    string? OfficeLocation,
    string? MobilePhone,
    string? CompanyName,
    int? ServiceId,
    ServiceInfoDto? Service,
    bool IsActive,
    int SortOrder,
    int AssetCount,
    DateTime? EntraLastSyncAt,
    EntraSyncStatus EntraSyncStatus,
    DateTime CreatedAt,
    DateTime? UpdatedAt
);

/// <summary>
/// DTO for creating a new employee (manual entry or from Entra sync)
/// </summary>
public record CreateEmployeeDto(
    string EntraId,
    string UserPrincipalName,
    string DisplayName,
    string? Email = null,
    string? Department = null,
    string? JobTitle = null,
    string? OfficeLocation = null,
    string? MobilePhone = null,
    string? CompanyName = null,
    int? ServiceId = null
);

/// <summary>
/// DTO for updating an existing employee
/// </summary>
public record UpdateEmployeeDto(
    string DisplayName,
    string? Email,
    string? Department,
    string? JobTitle,
    string? OfficeLocation,
    string? MobilePhone,
    string? CompanyName,
    int? ServiceId,
    bool IsActive,
    int SortOrder = 0
);

/// <summary>
/// Result of an employee sync operation
/// </summary>
public record EmployeeSyncResultDto(
    int TotalProcessed,
    int Created,
    int Updated,
    int Skipped,
    int Failed,
    List<string> Errors
);

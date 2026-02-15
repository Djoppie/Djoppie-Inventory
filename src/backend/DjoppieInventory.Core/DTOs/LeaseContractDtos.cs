namespace DjoppieInventory.Core.DTOs;

/// <summary>
/// DTO for returning lease contract information
/// </summary>
public record LeaseContractDto(
    int Id,
    int AssetId,
    string? ContractNumber,
    string? Vendor,
    DateTime StartDate,
    DateTime EndDate,
    decimal? MonthlyRate,
    decimal? TotalValue,
    string Status,
    string? Notes
);

/// <summary>
/// DTO for creating a new lease contract
/// </summary>
public record CreateLeaseContractDto(
    int AssetId,
    string? ContractNumber,
    string? Vendor,
    DateTime StartDate,
    DateTime EndDate,
    decimal? MonthlyRate,
    decimal? TotalValue,
    string? Notes
);

/// <summary>
/// DTO for updating an existing lease contract
/// </summary>
public record UpdateLeaseContractDto(
    string? ContractNumber,
    string? Vendor,
    DateTime StartDate,
    DateTime EndDate,
    decimal? MonthlyRate,
    decimal? TotalValue,
    string Status,
    string? Notes
);

using DjoppieInventory.Core.DTOs.PhysicalWorkplace;

namespace DjoppieInventory.Core.DTOs.LaptopSwap;

/// <summary>
/// Mode of operation for device deployment
/// </summary>
public enum DeploymentMode
{
    /// <summary>
    /// Onboarding - New user gets a device (no old device)
    /// </summary>
    Onboarding = 0,

    /// <summary>
    /// Swap - Replace old device with new device
    /// </summary>
    Swap = 1
}

/// <summary>
/// Request DTO for executing a laptop swap or onboarding operation
/// </summary>
public record ExecuteDeploymentDto(
    /// <summary>
    /// Mode: Onboarding (no old laptop) or Swap (replace old laptop)
    /// </summary>
    DeploymentMode Mode,

    /// <summary>
    /// Old laptop asset ID (required for Swap mode, null for Onboarding)
    /// </summary>
    int? OldLaptopAssetId,

    /// <summary>
    /// New laptop asset ID to assign to user
    /// </summary>
    int NewLaptopAssetId,

    /// <summary>
    /// Entra ID (Azure AD) of the user receiving the laptop
    /// </summary>
    string NewOwnerEntraId,

    /// <summary>
    /// Display name of the user
    /// </summary>
    string NewOwnerName,

    /// <summary>
    /// Email address of the user
    /// </summary>
    string NewOwnerEmail,

    /// <summary>
    /// Optional job title from Entra ID
    /// </summary>
    string? NewOwnerJobTitle,

    /// <summary>
    /// Optional office location from Entra ID
    /// </summary>
    string? NewOwnerOfficeLocation,

    /// <summary>
    /// Optional physical workplace ID to update occupant and equipment
    /// </summary>
    int? PhysicalWorkplaceId,

    /// <summary>
    /// Whether to update equipment slots on the workplace
    /// </summary>
    bool UpdateEquipmentSlots,

    /// <summary>
    /// Equipment slot assignments (if UpdateEquipmentSlots is true)
    /// </summary>
    UpdateEquipmentSlotsDto? EquipmentSlots,

    /// <summary>
    /// Optional notes about the deployment
    /// </summary>
    string? Notes
);

/// <summary>
/// Response DTO for deployment operation result
/// </summary>
public record DeploymentResultDto(
    bool Success,
    string DeploymentId,
    DeploymentMode Mode,
    AssetDeploymentSummaryDto? OldLaptop,
    AssetDeploymentSummaryDto NewLaptop,
    WorkplaceDeploymentSummaryDto? PhysicalWorkplace,
    List<AssetEventSummaryDto> AssetEventsCreated,
    DateTime Timestamp
);

/// <summary>
/// Summary of asset changes in deployment
/// </summary>
public record AssetDeploymentSummaryDto(
    int AssetId,
    string AssetCode,
    string? SerialNumber,
    string OldStatus,
    string NewStatus,
    string? OldOwner,
    string? NewOwner,
    DateTime? InstallationDate
);

/// <summary>
/// Summary of workplace changes in deployment
/// </summary>
public record WorkplaceDeploymentSummaryDto(
    int Id,
    string Code,
    string? Name,
    bool EquipmentUpdated,
    bool OccupantUpdated,
    string? PreviousOccupant,
    string? NewOccupant
);

/// <summary>
/// Summary of created asset event
/// </summary>
public record AssetEventSummaryDto(
    int EventId,
    int AssetId,
    string EventType,
    string Description
);

/// <summary>
/// Occupant conflict information when workplace has different occupant
/// </summary>
public record OccupantConflictDto(
    string CurrentOccupantName,
    string? CurrentOccupantEmail,
    DateTime? OccupiedSince,
    string RequestedOccupantName,
    string RequestedOccupantEmail
);

/// <summary>
/// Item in deployment history report
/// </summary>
public record DeploymentHistoryItemDto(
    int Id,
    DateTime DeploymentDate,
    DeploymentMode Mode,
    DeploymentAssetInfoDto? OldLaptop,
    DeploymentAssetInfoDto NewLaptop,
    DeploymentOwnerInfoDto Owner,
    DeploymentWorkplaceInfoDto? PhysicalWorkplace,
    string? PerformedBy,
    string? PerformedByEmail,
    string? Notes
);

/// <summary>
/// Asset info for history display
/// </summary>
public record DeploymentAssetInfoDto(
    int AssetId,
    string AssetCode,
    string? SerialNumber,
    string? Brand,
    string? Model,
    string PreviousStatus,
    string NewStatus
);

/// <summary>
/// Owner info for history display
/// </summary>
public record DeploymentOwnerInfoDto(
    string Name,
    string Email,
    string? EntraId
);

/// <summary>
/// Workplace info for history display
/// </summary>
public record DeploymentWorkplaceInfoDto(
    int Id,
    string Code,
    string? Name,
    string? BuildingName
);

/// <summary>
/// Paged result wrapper for deployment history
/// </summary>
public record DeploymentHistoryResultDto(
    List<DeploymentHistoryItemDto> Items,
    int PageNumber,
    int PageSize,
    int TotalCount,
    int TotalPages
);

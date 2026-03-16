using DjoppieInventory.Core.Entities;
using DjoppieInventory.Core.Entities.Enums;

namespace DjoppieInventory.Core.DTOs;

/// <summary>
/// Request to record an asset deployment
/// </summary>
public class AssetDeploymentRequest
{
    /// <summary>
    /// Rollout session ID
    /// </summary>
    public int RolloutSessionId { get; set; }

    /// <summary>
    /// Workplace ID (optional)
    /// </summary>
    public int? RolloutWorkplaceId { get; set; }

    /// <summary>
    /// Workplace asset assignment ID (optional)
    /// </summary>
    public int? WorkplaceAssetAssignmentId { get; set; }

    /// <summary>
    /// Asset ID being deployed
    /// </summary>
    public int AssetId { get; set; }

    /// <summary>
    /// New owner of the asset
    /// </summary>
    public string NewOwner { get; set; } = string.Empty;

    /// <summary>
    /// New service/department ID (optional)
    /// </summary>
    public int? NewServiceId { get; set; }

    /// <summary>
    /// New physical location (optional)
    /// </summary>
    public string? NewLocation { get; set; }

    /// <summary>
    /// Optional notes about the deployment
    /// </summary>
    public string? Notes { get; set; }
}

/// <summary>
/// Request to record an asset decommission
/// </summary>
public class AssetDecommissionRequest
{
    /// <summary>
    /// Rollout session ID
    /// </summary>
    public int RolloutSessionId { get; set; }

    /// <summary>
    /// Workplace ID (optional)
    /// </summary>
    public int? RolloutWorkplaceId { get; set; }

    /// <summary>
    /// Workplace asset assignment ID (optional)
    /// </summary>
    public int? WorkplaceAssetAssignmentId { get; set; }

    /// <summary>
    /// Asset ID being decommissioned
    /// </summary>
    public int AssetId { get; set; }

    /// <summary>
    /// Target status (UitDienst or Defect)
    /// </summary>
    public AssetStatus TargetStatus { get; set; } = AssetStatus.UitDienst;

    /// <summary>
    /// Optional notes about the decommission
    /// </summary>
    public string? Notes { get; set; }
}

/// <summary>
/// Request to record an asset transfer
/// </summary>
public class AssetTransferRequest
{
    /// <summary>
    /// Rollout session ID
    /// </summary>
    public int RolloutSessionId { get; set; }

    /// <summary>
    /// Workplace ID (optional)
    /// </summary>
    public int? RolloutWorkplaceId { get; set; }

    /// <summary>
    /// Asset ID being transferred
    /// </summary>
    public int AssetId { get; set; }

    /// <summary>
    /// New owner of the asset (null if only location changes)
    /// </summary>
    public string? NewOwner { get; set; }

    /// <summary>
    /// New service/department ID (optional)
    /// </summary>
    public int? NewServiceId { get; set; }

    /// <summary>
    /// New physical location (optional)
    /// </summary>
    public string? NewLocation { get; set; }

    /// <summary>
    /// Optional notes about the transfer
    /// </summary>
    public string? Notes { get; set; }
}

/// <summary>
/// DTO representing an asset movement record
/// </summary>
public class AssetMovementDto
{
    /// <summary>
    /// Movement ID
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// Rollout session ID
    /// </summary>
    public int RolloutSessionId { get; set; }

    /// <summary>
    /// Rollout session name
    /// </summary>
    public string? SessionName { get; set; }

    /// <summary>
    /// Workplace ID (if applicable)
    /// </summary>
    public int? RolloutWorkplaceId { get; set; }

    /// <summary>
    /// Workplace user name (if applicable)
    /// </summary>
    public string? WorkplaceUserName { get; set; }

    /// <summary>
    /// Asset ID
    /// </summary>
    public int AssetId { get; set; }

    /// <summary>
    /// Asset code
    /// </summary>
    public string AssetCode { get; set; } = string.Empty;

    /// <summary>
    /// Asset name
    /// </summary>
    public string AssetName { get; set; } = string.Empty;

    /// <summary>
    /// Serial number
    /// </summary>
    public string? SerialNumber { get; set; }

    /// <summary>
    /// Type of movement
    /// </summary>
    public MovementType MovementType { get; set; }

    /// <summary>
    /// Movement type display name
    /// </summary>
    public string MovementTypeName => MovementType.ToString();

    /// <summary>
    /// Previous asset status
    /// </summary>
    public AssetStatus? PreviousStatus { get; set; }

    /// <summary>
    /// New asset status
    /// </summary>
    public AssetStatus NewStatus { get; set; }

    /// <summary>
    /// Previous owner
    /// </summary>
    public string? PreviousOwner { get; set; }

    /// <summary>
    /// New owner
    /// </summary>
    public string? NewOwner { get; set; }

    /// <summary>
    /// Previous service ID
    /// </summary>
    public int? PreviousServiceId { get; set; }

    /// <summary>
    /// Previous service name
    /// </summary>
    public string? PreviousServiceName { get; set; }

    /// <summary>
    /// New service ID
    /// </summary>
    public int? NewServiceId { get; set; }

    /// <summary>
    /// New service name
    /// </summary>
    public string? NewServiceName { get; set; }

    /// <summary>
    /// Previous location
    /// </summary>
    public string? PreviousLocation { get; set; }

    /// <summary>
    /// New location
    /// </summary>
    public string? NewLocation { get; set; }

    /// <summary>
    /// Technician who performed the movement
    /// </summary>
    public string PerformedBy { get; set; } = string.Empty;

    /// <summary>
    /// Technician email
    /// </summary>
    public string PerformedByEmail { get; set; } = string.Empty;

    /// <summary>
    /// Timestamp when performed
    /// </summary>
    public DateTime PerformedAt { get; set; }

    /// <summary>
    /// Notes
    /// </summary>
    public string? Notes { get; set; }
}

/// <summary>
/// Summary statistics for movements in a rollout session
/// </summary>
public class MovementSummaryDto
{
    /// <summary>
    /// Rollout session ID
    /// </summary>
    public int RolloutSessionId { get; set; }

    /// <summary>
    /// Rollout session name
    /// </summary>
    public string SessionName { get; set; } = string.Empty;

    /// <summary>
    /// Total number of movements
    /// </summary>
    public int TotalMovements { get; set; }

    /// <summary>
    /// Number of deployments
    /// </summary>
    public int Deployments { get; set; }

    /// <summary>
    /// Number of decommissions
    /// </summary>
    public int Decommissions { get; set; }

    /// <summary>
    /// Number of transfers
    /// </summary>
    public int Transfers { get; set; }

    /// <summary>
    /// Breakdown by asset type
    /// </summary>
    public List<MovementByAssetTypeDto> ByAssetType { get; set; } = new();

    /// <summary>
    /// Breakdown by service
    /// </summary>
    public List<MovementByServiceDto> ByService { get; set; } = new();

    /// <summary>
    /// Breakdown by technician
    /// </summary>
    public List<MovementByTechnicianDto> ByTechnician { get; set; } = new();

    /// <summary>
    /// Breakdown by date
    /// </summary>
    public List<MovementByDateDto> ByDate { get; set; } = new();
}

/// <summary>
/// Movement count by asset type
/// </summary>
public class MovementByAssetTypeDto
{
    public string AssetTypeName { get; set; } = string.Empty;
    public int Count { get; set; }
    public int Deployments { get; set; }
    public int Decommissions { get; set; }
}

/// <summary>
/// Movement count by service
/// </summary>
public class MovementByServiceDto
{
    public int ServiceId { get; set; }
    public string ServiceName { get; set; } = string.Empty;
    public int Count { get; set; }
    public int Deployments { get; set; }
    public int Decommissions { get; set; }
}

/// <summary>
/// Movement count by technician
/// </summary>
public class MovementByTechnicianDto
{
    public string TechnicianName { get; set; } = string.Empty;
    public string TechnicianEmail { get; set; } = string.Empty;
    public int Count { get; set; }
    public int Deployments { get; set; }
    public int Decommissions { get; set; }
}

/// <summary>
/// Movement count by date
/// </summary>
public class MovementByDateDto
{
    public DateTime Date { get; set; }
    public int Count { get; set; }
    public int Deployments { get; set; }
    public int Decommissions { get; set; }
}

using DjoppieInventory.Core.Entities.Enums;

namespace DjoppieInventory.Core.DTOs;

/// <summary>
/// DTO representing a workplace asset assignment
/// </summary>
public class WorkplaceAssetAssignmentDto
{
    /// <summary>
    /// Assignment ID
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// Workplace ID
    /// </summary>
    public int RolloutWorkplaceId { get; set; }

    /// <summary>
    /// Asset type ID
    /// </summary>
    public int AssetTypeId { get; set; }

    /// <summary>
    /// Asset type name
    /// </summary>
    public string AssetTypeName { get; set; } = string.Empty;

    /// <summary>
    /// Asset type code
    /// </summary>
    public string AssetTypeCode { get; set; } = string.Empty;

    /// <summary>
    /// Assignment category (UserAssigned or WorkplaceFixed)
    /// </summary>
    public AssignmentCategory AssignmentCategory { get; set; }

    /// <summary>
    /// Source type (ExistingInventory, NewFromTemplate, CreateOnSite)
    /// </summary>
    public AssetSourceType SourceType { get; set; }

    /// <summary>
    /// New asset ID if assigned
    /// </summary>
    public int? NewAssetId { get; set; }

    /// <summary>
    /// New asset code
    /// </summary>
    public string? NewAssetCode { get; set; }

    /// <summary>
    /// New asset name
    /// </summary>
    public string? NewAssetName { get; set; }

    /// <summary>
    /// New asset serial number
    /// </summary>
    public string? NewAssetSerialNumber { get; set; }

    /// <summary>
    /// Old asset ID being replaced
    /// </summary>
    public int? OldAssetId { get; set; }

    /// <summary>
    /// Old asset code
    /// </summary>
    public string? OldAssetCode { get; set; }

    /// <summary>
    /// Old asset name
    /// </summary>
    public string? OldAssetName { get; set; }

    /// <summary>
    /// Old asset serial number
    /// </summary>
    public string? OldAssetSerialNumber { get; set; }

    /// <summary>
    /// Template ID if using NewFromTemplate
    /// </summary>
    public int? AssetTemplateId { get; set; }

    /// <summary>
    /// Template name
    /// </summary>
    public string? AssetTemplateName { get; set; }

    /// <summary>
    /// Position/slot number for ordering
    /// </summary>
    public int Position { get; set; }

    /// <summary>
    /// Whether serial number capture is required
    /// </summary>
    public bool SerialNumberRequired { get; set; }

    /// <summary>
    /// Whether QR code scanning is required
    /// </summary>
    public bool QRCodeRequired { get; set; }

    /// <summary>
    /// Captured serial number during execution
    /// </summary>
    public string? SerialNumberCaptured { get; set; }

    /// <summary>
    /// Current execution status
    /// </summary>
    public AssetAssignmentStatus Status { get; set; }

    /// <summary>
    /// Status display name
    /// </summary>
    public string StatusName => Status.ToString();

    /// <summary>
    /// Timestamp when installed
    /// </summary>
    public DateTime? InstalledAt { get; set; }

    /// <summary>
    /// Technician who installed
    /// </summary>
    public string? InstalledBy { get; set; }

    /// <summary>
    /// Technician email
    /// </summary>
    public string? InstalledByEmail { get; set; }

    /// <summary>
    /// Notes
    /// </summary>
    public string? Notes { get; set; }

    /// <summary>
    /// Additional metadata as JSON
    /// </summary>
    public string? MetadataJson { get; set; }

    /// <summary>
    /// Created timestamp
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// Updated timestamp
    /// </summary>
    public DateTime UpdatedAt { get; set; }
}

/// <summary>
/// Request to create a workplace asset assignment
/// </summary>
public class CreateWorkplaceAssetAssignmentRequest
{
    /// <summary>
    /// Workplace ID
    /// </summary>
    public int RolloutWorkplaceId { get; set; }

    /// <summary>
    /// Asset type ID
    /// </summary>
    public int AssetTypeId { get; set; }

    /// <summary>
    /// Assignment category (default: UserAssigned)
    /// </summary>
    public AssignmentCategory AssignmentCategory { get; set; } = AssignmentCategory.UserAssigned;

    /// <summary>
    /// Source type (default: ExistingInventory)
    /// </summary>
    public AssetSourceType SourceType { get; set; } = AssetSourceType.ExistingInventory;

    /// <summary>
    /// Existing asset ID to assign (if SourceType = ExistingInventory)
    /// </summary>
    public int? NewAssetId { get; set; }

    /// <summary>
    /// Old asset ID being replaced (optional)
    /// </summary>
    public int? OldAssetId { get; set; }

    /// <summary>
    /// Template ID (if SourceType = NewFromTemplate)
    /// </summary>
    public int? AssetTemplateId { get; set; }

    /// <summary>
    /// Position/slot number for ordering
    /// </summary>
    public int Position { get; set; } = 1;

    /// <summary>
    /// Whether serial number capture is required
    /// </summary>
    public bool SerialNumberRequired { get; set; } = true;

    /// <summary>
    /// Whether QR code scanning is required
    /// </summary>
    public bool QRCodeRequired { get; set; } = false;

    /// <summary>
    /// Notes
    /// </summary>
    public string? Notes { get; set; }

    /// <summary>
    /// Additional metadata as JSON
    /// </summary>
    public string? MetadataJson { get; set; }
}

/// <summary>
/// Request to update an assignment during planning
/// </summary>
public class UpdateWorkplaceAssetAssignmentRequest
{
    /// <summary>
    /// Assignment category
    /// </summary>
    public AssignmentCategory? AssignmentCategory { get; set; }

    /// <summary>
    /// Source type
    /// </summary>
    public AssetSourceType? SourceType { get; set; }

    /// <summary>
    /// New asset ID
    /// </summary>
    public int? NewAssetId { get; set; }

    /// <summary>
    /// Old asset ID
    /// </summary>
    public int? OldAssetId { get; set; }

    /// <summary>
    /// Template ID
    /// </summary>
    public int? AssetTemplateId { get; set; }

    /// <summary>
    /// Position
    /// </summary>
    public int? Position { get; set; }

    /// <summary>
    /// Whether serial number is required
    /// </summary>
    public bool? SerialNumberRequired { get; set; }

    /// <summary>
    /// Whether QR code is required
    /// </summary>
    public bool? QRCodeRequired { get; set; }

    /// <summary>
    /// Notes
    /// </summary>
    public string? Notes { get; set; }

    /// <summary>
    /// Metadata JSON
    /// </summary>
    public string? MetadataJson { get; set; }
}

/// <summary>
/// Request to update assignment status during execution
/// </summary>
public class UpdateAssignmentStatusRequest
{
    /// <summary>
    /// New status
    /// </summary>
    public AssetAssignmentStatus Status { get; set; }

    /// <summary>
    /// Serial number captured during execution
    /// </summary>
    public string? SerialNumberCaptured { get; set; }

    /// <summary>
    /// Notes about the status change
    /// </summary>
    public string? Notes { get; set; }
}

/// <summary>
/// Summary of assignments for a workplace
/// </summary>
public class WorkplaceAssignmentSummaryDto
{
    /// <summary>
    /// Workplace ID
    /// </summary>
    public int WorkplaceId { get; set; }

    /// <summary>
    /// Total number of assignments
    /// </summary>
    public int TotalAssignments { get; set; }

    /// <summary>
    /// Number of pending assignments
    /// </summary>
    public int PendingAssignments { get; set; }

    /// <summary>
    /// Number of installed assignments
    /// </summary>
    public int InstalledAssignments { get; set; }

    /// <summary>
    /// Number of skipped assignments
    /// </summary>
    public int SkippedAssignments { get; set; }

    /// <summary>
    /// Number of failed assignments
    /// </summary>
    public int FailedAssignments { get; set; }

    /// <summary>
    /// Progress percentage
    /// </summary>
    public int ProgressPercent => TotalAssignments > 0
        ? (int)Math.Round((InstalledAssignments + SkippedAssignments) * 100.0 / TotalAssignments)
        : 0;

    /// <summary>
    /// Assignments needing serial number capture
    /// </summary>
    public int SerialNumbersRequired { get; set; }

    /// <summary>
    /// Serial numbers already captured
    /// </summary>
    public int SerialNumbersCaptured { get; set; }

    /// <summary>
    /// Assignments by asset type
    /// </summary>
    public List<AssignmentByAssetTypeDto> ByAssetType { get; set; } = new();
}

/// <summary>
/// Assignment count by asset type
/// </summary>
public class AssignmentByAssetTypeDto
{
    /// <summary>
    /// Asset type ID
    /// </summary>
    public int AssetTypeId { get; set; }

    /// <summary>
    /// Asset type name
    /// </summary>
    public string AssetTypeName { get; set; } = string.Empty;

    /// <summary>
    /// Total count
    /// </summary>
    public int Total { get; set; }

    /// <summary>
    /// Installed count
    /// </summary>
    public int Installed { get; set; }

    /// <summary>
    /// Pending count
    /// </summary>
    public int Pending { get; set; }
}

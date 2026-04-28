using DjoppieInventory.Core.Entities;

namespace DjoppieInventory.Core.DTOs;

// ==================== Read DTOs ====================

public class AssetRequestSummaryDto
{
    public int Id { get; set; }
    public string RequestType { get; set; } = string.Empty; // "onboarding" | "offboarding"
    public string Status { get; set; } = string.Empty;
    public string RequestedFor { get; set; } = string.Empty;
    public int? EmployeeId { get; set; }
    public string? EmployeeDisplayName { get; set; }
    public DateTime RequestedDate { get; set; }
    public int? PhysicalWorkplaceId { get; set; }
    public string? PhysicalWorkplaceName { get; set; }
    public int LineCount { get; set; }
    public int CompletedLineCount { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
}

public class AssetRequestDetailDto : AssetRequestSummaryDto
{
    public string? Notes { get; set; }
    public string CreatedBy { get; set; } = string.Empty;
    public string? ModifiedBy { get; set; }
    public DateTime? ModifiedAt { get; set; }
    public List<AssetRequestLineDto> Lines { get; set; } = new();
}

public class AssetRequestLineDto
{
    public int Id { get; set; }
    public int AssetTypeId { get; set; }
    public string AssetTypeName { get; set; } = string.Empty;
    public string SourceType { get; set; } = string.Empty;     // "ToBeAssigned" | "ExistingInventory" | "NewFromTemplate"
    public int? AssetId { get; set; }
    public string? AssetCode { get; set; }
    public string? AssetName { get; set; }
    public int? AssetTemplateId { get; set; }
    public string? AssetTemplateName { get; set; }
    public string Status { get; set; } = string.Empty;          // "Pending" | "Reserved" | "Completed" | "Skipped"
    public string? ReturnAction { get; set; }                   // null | "ReturnToStock" | "Decommission" | "Reassign"
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class AssetRequestStatisticsDto
{
    public int ActiveRequests { get; set; }
    public int MonthlyRequests { get; set; }
    public int InProgressRequests { get; set; }
}

// ==================== Write DTOs ====================

public class CreateAssetRequestDto
{
    public string RequestType { get; set; } = string.Empty; // "onboarding" | "offboarding"
    public string RequestedFor { get; set; } = string.Empty;
    public int? EmployeeId { get; set; }
    public DateTime RequestedDate { get; set; }
    public int? PhysicalWorkplaceId { get; set; }
    public string? Notes { get; set; }
    public List<CreateAssetRequestLineDto> Lines { get; set; } = new();
}

public class UpdateAssetRequestDto
{
    public string? RequestedFor { get; set; }
    public int? EmployeeId { get; set; }
    public DateTime? RequestedDate { get; set; }
    public int? PhysicalWorkplaceId { get; set; }
    public string? Notes { get; set; }
}

public class CreateAssetRequestLineDto
{
    public int AssetTypeId { get; set; }
    public string SourceType { get; set; } = "ToBeAssigned";
    public int? AssetId { get; set; }
    public int? AssetTemplateId { get; set; }
    public string? ReturnAction { get; set; }
    public string? Notes { get; set; }
}

public class UpdateAssetRequestLineDto
{
    public int? AssetTypeId { get; set; }
    public string? SourceType { get; set; }
    public int? AssetId { get; set; }
    public int? AssetTemplateId { get; set; }
    public string? Status { get; set; }       // "Pending" | "Reserved" | "Completed" | "Skipped"
    public string? ReturnAction { get; set; }
    public string? Notes { get; set; }
}

public class AssetRequestTransitionDto
{
    public string Target { get; set; } = string.Empty; // "Approved" | "InProgress" | "Completed" | "Cancelled"
}

public class LinkEmployeeDto
{
    public int EmployeeId { get; set; }
}

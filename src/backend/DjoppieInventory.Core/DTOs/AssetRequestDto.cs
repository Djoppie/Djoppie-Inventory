using DjoppieInventory.Core.Entities;

namespace DjoppieInventory.Core.DTOs;

/// <summary>
/// DTO for asset request operations
/// </summary>
public class AssetRequestDto
{
    public int Id { get; set; }
    public DateTime RequestedDate { get; set; }
    public string RequestType { get; set; } = string.Empty;
    public string EmployeeName { get; set; } = string.Empty;
    public string AssetType { get; set; } = string.Empty;
    public string? Notes { get; set; }
    public string Status { get; set; } = string.Empty;
    public int? AssignedAssetId { get; set; }
    public string? AssignedAssetCode { get; set; }
    public string CreatedBy { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public string? ModifiedBy { get; set; }
    public DateTime? ModifiedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
}

/// <summary>
/// DTO for creating a new asset request
/// </summary>
public class CreateAssetRequestDto
{
    public DateTime RequestedDate { get; set; }
    public string RequestType { get; set; } = string.Empty; // "onboarding" or "offboarding"
    public string EmployeeName { get; set; } = string.Empty;
    public string AssetType { get; set; } = string.Empty;
    public string? Notes { get; set; }
}

/// <summary>
/// DTO for updating an asset request
/// </summary>
public class UpdateAssetRequestDto
{
    public DateTime? RequestedDate { get; set; }
    public string? RequestType { get; set; }
    public string? EmployeeName { get; set; }
    public string? AssetType { get; set; }
    public string? Notes { get; set; }
    public string? Status { get; set; }
    public int? AssignedAssetId { get; set; }
}

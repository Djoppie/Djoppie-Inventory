namespace DjoppieInventory.Core.DTOs;

/// <summary>
/// Data Transfer Object for Asset entity
/// </summary>
public class AssetDto
{
    public int Id { get; set; }
    public string AssetCode { get; set; } = string.Empty;
    public string AssetName { get; set; } = string.Empty;
    public string? Alias { get; set; }
    public string Category { get; set; } = string.Empty;
    public bool IsDummy { get; set; }

    // Relational fields
    public int? AssetTypeId { get; set; }
    public AssetTypeInfo? AssetType { get; set; }
    public int? ServiceId { get; set; }
    public ServiceInfo? Service { get; set; }
    public string? InstallationLocation { get; set; }
    public int? PhysicalWorkplaceId { get; set; }
    public PhysicalWorkplaceInfo? PhysicalWorkplace { get; set; }
    public int? BuildingId { get; set; }
    public BuildingInfo? Building { get; set; }

    // Legacy fields (for historical data)
    public string? LegacyBuilding { get; set; }
    public string? LegacyDepartment { get; set; }

    // User assignment fields
    public int? EmployeeId { get; set; }
    public EmployeeInfoDto? Employee { get; set; }
    public string? Owner { get; set; } // Legacy field - kept for backwards compatibility
    public string? JobTitle { get; set; }
    public string? OfficeLocation { get; set; }

    public string Status { get; set; } = string.Empty;
    public string? Brand { get; set; }
    public string? Model { get; set; }

    // SerialNumber is optional - can be filled in later
    public string? SerialNumber { get; set; }

    public DateTime? PurchaseDate { get; set; }
    public DateTime? WarrantyExpiry { get; set; }
    public DateTime? InstallationDate { get; set; }

    // Intune integration fields (synced from Microsoft Intune for laptops/desktops)
    public DateTime? IntuneEnrollmentDate { get; set; }
    public DateTime? IntuneLastCheckIn { get; set; }
    public DateTime? IntuneCertificateExpiry { get; set; }
    public DateTime? IntuneSyncedAt { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

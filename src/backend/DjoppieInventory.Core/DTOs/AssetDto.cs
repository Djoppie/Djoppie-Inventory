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

    // Legacy fields (for historical data)
    public string? LegacyBuilding { get; set; }
    public string? LegacyDepartment { get; set; }

    // User assignment fields
    public string? Owner { get; set; }
    public string? JobTitle { get; set; }
    public string? OfficeLocation { get; set; }

    public string Status { get; set; } = string.Empty;
    public string? Brand { get; set; }
    public string? Model { get; set; }

    // SerialNumber is required in the entity
    public string SerialNumber { get; set; } = string.Empty;

    public DateTime? PurchaseDate { get; set; }
    public DateTime? WarrantyExpiry { get; set; }
    public DateTime? InstallationDate { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

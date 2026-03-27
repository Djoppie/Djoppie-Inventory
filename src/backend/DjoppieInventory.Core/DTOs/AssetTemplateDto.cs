namespace DjoppieInventory.Core.DTOs;

public class AssetTemplateDto
{
    public int Id { get; set; }
    public string TemplateName { get; set; } = string.Empty;
    public string? AssetName { get; set; }
    public string? Category { get; set; }

    // Relational fields
    public int? AssetTypeId { get; set; }
    public AssetTypeInfo? AssetType { get; set; }
    public int? ServiceId { get; set; }
    public ServiceInfo? Service { get; set; }
    public string? InstallationLocation { get; set; }
    public string? Status { get; set; }

    public string? Brand { get; set; }
    public string? Model { get; set; }
    public string? Owner { get; set; }
    public DateTime? PurchaseDate { get; set; }
    public DateTime? WarrantyExpiry { get; set; }
    public DateTime? InstallationDate { get; set; }
}

/// <summary>
/// Lightweight asset type info for template responses
/// </summary>
public class AssetTypeInfo
{
    public int Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public int? CategoryId { get; set; }
}

/// <summary>
/// Lightweight service info for template responses
/// </summary>
public class ServiceInfo
{
    public int Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
}

/// <summary>
/// Lightweight physical workplace info for asset responses
/// </summary>
public class PhysicalWorkplaceInfo
{
    public int Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? CurrentOccupantName { get; set; }
    public string? ServiceName { get; set; }
    public string? SectorName { get; set; }
    public string? BuildingName { get; set; }
    public string? Floor { get; set; }
}

/// <summary>
/// Lightweight building info for asset responses
/// </summary>
public class BuildingInfo
{
    public int Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Address { get; set; }
}

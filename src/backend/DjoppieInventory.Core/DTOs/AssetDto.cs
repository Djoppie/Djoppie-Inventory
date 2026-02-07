namespace DjoppieInventory.Core.DTOs;

public class AssetDto
{
    public int Id { get; set; }
    public string AssetCode { get; set; } = string.Empty;
    public string AssetName { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public bool IsDummy { get; set; }
    public string Building { get; set; } = string.Empty;
    public string Owner { get; set; } = string.Empty;
    public string Department { get; set; } = string.Empty;
    public string? JobTitle { get; set; }
    public string? OfficeLocation { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? Brand { get; set; }
    public string? Model { get; set; }
    public string? SerialNumber { get; set; }
    public DateTime? PurchaseDate { get; set; }
    public DateTime? WarrantyExpiry { get; set; }
    public DateTime? InstallationDate { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

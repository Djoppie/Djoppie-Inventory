namespace DjoppieInventory.Core.Entities;

/// <summary>
/// Represents a reusable template for creating assets with predefined values.
/// Templates allow quick creation of similar assets with common attributes.
/// </summary>
public class AssetTemplate
{
    /// <summary>
    /// Unique identifier for the template
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// Display name for the template (e.g., "Dell Latitude Laptop")
    /// </summary>
    public string TemplateName { get; set; } = string.Empty;

    /// <summary>
    /// Optional default asset name or description for assets created from this template
    /// </summary>
    public string? AssetName { get; set; }

    /// <summary>
    /// Asset category (e.g., Computing, Peripherals, Networking, Displays)
    /// </summary>
    public string Category { get; set; } = string.Empty;

    /// <summary>
    /// Default manufacturer or brand (optional)
    /// </summary>
    public string? Brand { get; set; }

    /// <summary>
    /// Default model number or name (optional)
    /// </summary>
    public string? Model { get; set; }

    /// <summary>
    /// Default primary user for assets created from this template (optional)
    /// </summary>
    public string? Owner { get; set; }

    /// <summary>
    /// Default installation location or building (optional)
    /// </summary>
    public string? Building { get; set; }

    /// <summary>
    /// Default department assignment (optional)
    /// </summary>
    public string? Department { get; set; }

    /// <summary>
    /// Default office location (optional)
    /// </summary>
    public string? OfficeLocation { get; set; }

    /// <summary>
    /// Default purchase date for assets created from this template (optional)
    /// </summary>
    public DateTime? PurchaseDate { get; set; }

    /// <summary>
    /// Default warranty expiration date (optional)
    /// </summary>
    public DateTime? WarrantyExpiry { get; set; }

    /// <summary>
    /// Default installation date (optional)
    /// </summary>
    public DateTime? InstallationDate { get; set; }

    /// <summary>
    /// Indicates whether this template is active and available for use (soft delete)
    /// </summary>
    public bool IsActive { get; set; } = true;
}

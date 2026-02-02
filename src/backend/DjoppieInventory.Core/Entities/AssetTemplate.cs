namespace DjoppieInventory.Core.Entities;

public class AssetTemplate
{
    public int Id { get; set; }
    public string TemplateName { get; set; } = string.Empty;
    public string AssetName { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string Brand { get; set; } = string.Empty;
    public string Model { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
}

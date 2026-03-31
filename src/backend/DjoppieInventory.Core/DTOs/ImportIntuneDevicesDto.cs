namespace DjoppieInventory.Core.DTOs;

/// <summary>
/// DTO for importing Intune devices as assets
/// </summary>
public class ImportIntuneDevicesDto
{
    /// <summary>
    /// List of Intune device IDs to import
    /// </summary>
    public List<string> DeviceIds { get; set; } = new();

    /// <summary>
    /// Asset type ID to assign to imported devices (e.g., Laptop type ID)
    /// </summary>
    public int AssetTypeId { get; set; }

    /// <summary>
    /// Initial status for imported assets (default: Stock)
    /// </summary>
    public string Status { get; set; } = "Stock";
}

/// <summary>
/// Result of importing Intune devices
/// </summary>
public class ImportIntuneDevicesResultDto
{
    public int TotalRequested { get; set; }
    public int Imported { get; set; }
    public int Skipped { get; set; }
    public int Failed { get; set; }
    public List<ImportedDeviceInfo> ImportedDevices { get; set; } = new();
    public List<SkippedDeviceInfo> SkippedDevices { get; set; } = new();
    public List<FailedDeviceInfo> FailedDevices { get; set; } = new();
}

public class ImportedDeviceInfo
{
    public string DeviceId { get; set; } = string.Empty;
    public string DeviceName { get; set; } = string.Empty;
    public string SerialNumber { get; set; } = string.Empty;
    public string AssetCode { get; set; } = string.Empty;
    public int AssetId { get; set; }
}

public class SkippedDeviceInfo
{
    public string DeviceId { get; set; } = string.Empty;
    public string DeviceName { get; set; } = string.Empty;
    public string SerialNumber { get; set; } = string.Empty;
    public string Reason { get; set; } = string.Empty;
}

public class FailedDeviceInfo
{
    public string DeviceId { get; set; } = string.Empty;
    public string DeviceName { get; set; } = string.Empty;
    public string Error { get; set; } = string.Empty;
}

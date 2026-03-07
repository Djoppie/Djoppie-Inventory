namespace DjoppieInventory.Core.DTOs.Rollout;

/// <summary>
/// DTO for bulk workplace creation request
/// </summary>
public class BulkCreateWorkplacesDto
{
    /// <summary>
    /// Number of workplaces to create (1-50)
    /// </summary>
    public int Count { get; set; }

    /// <summary>
    /// Primary service ID for the workplaces
    /// </summary>
    public int ServiceId { get; set; }

    /// <summary>
    /// Optional sector ID (stored implicitly via ScheduledServiceIds on day)
    /// </summary>
    public int? SectorId { get; set; }

    /// <summary>
    /// Whether this is a laptop setup (true) or desktop setup (false)
    /// </summary>
    public bool IsLaptopSetup { get; set; } = true;

    /// <summary>
    /// Configuration for standard asset plans
    /// </summary>
    public StandardAssetPlanConfig AssetPlanConfig { get; set; } = new();
}

/// <summary>
/// Configuration for standard asset plans per workplace
/// </summary>
public class StandardAssetPlanConfig
{
    /// <summary>
    /// Include laptop in asset plan
    /// </summary>
    public bool IncludeLaptop { get; set; } = true;

    /// <summary>
    /// Include desktop in asset plan
    /// </summary>
    public bool IncludeDesktop { get; set; } = false;

    /// <summary>
    /// Include docking station in asset plan
    /// </summary>
    public bool IncludeDocking { get; set; } = true;

    /// <summary>
    /// Number of monitors (1-3)
    /// </summary>
    public int MonitorCount { get; set; } = 2;

    /// <summary>
    /// Include keyboard in asset plan
    /// </summary>
    public bool IncludeKeyboard { get; set; } = true;

    /// <summary>
    /// Include mouse in asset plan
    /// </summary>
    public bool IncludeMouse { get; set; } = true;
}

/// <summary>
/// Result DTO for bulk workplace creation
/// </summary>
public class BulkCreateWorkplacesResultDto
{
    /// <summary>
    /// Number of workplaces created
    /// </summary>
    public int Created { get; set; }

    /// <summary>
    /// List of created workplaces
    /// </summary>
    public List<RolloutWorkplaceDto> Workplaces { get; set; } = new();
}

namespace DjoppieInventory.Core.DTOs.Rollout;

/// <summary>
/// DTO for bulk workplace creation from Microsoft Graph users
/// </summary>
public class BulkCreateFromGraphDto
{
    /// <summary>
    /// Department name from Azure AD to fetch users from (legacy)
    /// </summary>
    public string? Department { get; set; }

    /// <summary>
    /// Azure AD group ID to fetch users from (MG-* service groups)
    /// </summary>
    public string? GroupId { get; set; }

    /// <summary>
    /// Service ID to assign to the workplaces
    /// </summary>
    public int ServiceId { get; set; }

    /// <summary>
    /// Optional list of user IDs to include (if empty, all users from department/group are included)
    /// </summary>
    public List<string>? SelectedUserIds { get; set; }

    /// <summary>
    /// Configuration for standard asset plans
    /// </summary>
    public StandardAssetPlanConfig AssetPlanConfig { get; set; } = new();
}

/// <summary>
/// DTO representing an Azure AD group (service group)
/// </summary>
public class GraphGroupDto
{
    public string Id { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string ServiceName { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Mail { get; set; }
}

/// <summary>
/// DTO representing a Graph user for workplace creation preview
/// </summary>
public class GraphUserDto
{
    public string Id { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string? UserPrincipalName { get; set; }
    public string? Mail { get; set; }
    public string? Department { get; set; }
    public string? OfficeLocation { get; set; }
    public string? JobTitle { get; set; }
}

/// <summary>
/// Result DTO for bulk workplace creation from Graph
/// </summary>
public class BulkCreateFromGraphResultDto
{
    /// <summary>
    /// Number of workplaces created
    /// </summary>
    public int Created { get; set; }

    /// <summary>
    /// Number of users skipped (already have workplace)
    /// </summary>
    public int Skipped { get; set; }

    /// <summary>
    /// List of created workplaces
    /// </summary>
    public List<RolloutWorkplaceDto> Workplaces { get; set; } = new();

    /// <summary>
    /// List of skipped user names
    /// </summary>
    public List<string> SkippedUsers { get; set; } = new();
}

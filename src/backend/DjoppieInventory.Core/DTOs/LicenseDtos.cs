namespace DjoppieInventory.Core.DTOs;

/// <summary>
/// Aggregated license summary for the organization
/// </summary>
public class LicenseSummaryDto
{
    public List<LicenseInfoDto> Licenses { get; set; } = new();
    public int TotalPurchased { get; set; }
    public int TotalAssigned { get; set; }
    public int TotalAvailable { get; set; }
    public int UtilizationPercentage { get; set; }
    public DateTime RetrievedAt { get; set; } = DateTime.UtcNow;
    public string? ErrorMessage { get; set; }
}

/// <summary>
/// Individual license SKU information
/// </summary>
public class LicenseInfoDto
{
    public string SkuId { get; set; } = "";
    public string SkuPartNumber { get; set; } = "";
    public string DisplayName { get; set; } = "";
    public int PrepaidUnits { get; set; }
    public int ConsumedUnits { get; set; }
    public int AvailableUnits { get; set; }
    public int UtilizationPercentage { get; set; }
    public bool IsE3 { get; set; }
    public bool IsE5 { get; set; }
    public bool IsF1 { get; set; }
}

/// <summary>
/// User with assigned licenses
/// </summary>
public class LicenseUserDto
{
    public string UserId { get; set; } = "";
    public string DisplayName { get; set; } = "";
    public string UserPrincipalName { get; set; } = "";
    public string? Department { get; set; }
    public string? JobTitle { get; set; }
    public string? CompanyName { get; set; }
    public string? OfficeLocation { get; set; }
    public List<AssignedLicenseDto> AssignedLicenses { get; set; } = new();
}

/// <summary>
/// Individual license assignment for a user
/// </summary>
public class AssignedLicenseDto
{
    public string SkuId { get; set; } = "";
    public string SkuPartNumber { get; set; } = "";
    public string DisplayName { get; set; } = "";
}

/// <summary>
/// License distribution by department
/// </summary>
public class LicenseByDepartmentDto
{
    public string DepartmentName { get; set; } = "";
    public int TotalUsers { get; set; }
    public Dictionary<string, int> ByLicenseType { get; set; } = new();
}

/// <summary>
/// License statistics summary
/// </summary>
public class LicenseStatisticsDto
{
    public List<LicenseByDepartmentDto> ByDepartment { get; set; } = new();
    public Dictionary<string, int> ByJobTitle { get; set; } = new();
    public DateTime RetrievedAt { get; set; } = DateTime.UtcNow;
    public string? ErrorMessage { get; set; }
}

/// <summary>
/// License optimization analysis results
/// </summary>
public class LicenseOptimizationDto
{
    /// <summary>Users who haven't signed in for a long time</summary>
    public List<InactiveUserDto> InactiveUsers { get; set; } = new();

    /// <summary>Users who could be downgraded to a lower license tier</summary>
    public List<DowngradeRecommendationDto> DowngradeRecommendations { get; set; } = new();

    /// <summary>Summary statistics</summary>
    public OptimizationSummaryDto Summary { get; set; } = new();

    public DateTime RetrievedAt { get; set; } = DateTime.UtcNow;
    public string? ErrorMessage { get; set; }
}

/// <summary>
/// User identified as inactive (no recent sign-in)
/// </summary>
public class InactiveUserDto
{
    public string UserId { get; set; } = "";
    public string DisplayName { get; set; } = "";
    public string UserPrincipalName { get; set; } = "";
    public string? Department { get; set; }
    public string? JobTitle { get; set; }
    public DateTime? LastSignIn { get; set; }
    public int DaysSinceLastSignIn { get; set; }
    public string CurrentLicense { get; set; } = "";
    public string LicenseCategory { get; set; } = ""; // E3, E5, F1
    public decimal MonthlyCost { get; set; }
    public string Recommendation { get; set; } = ""; // "Remove", "Review"
}

/// <summary>
/// Recommendation to downgrade a user's license
/// </summary>
public class DowngradeRecommendationDto
{
    public string UserId { get; set; } = "";
    public string DisplayName { get; set; } = "";
    public string UserPrincipalName { get; set; } = "";
    public string? Department { get; set; }
    public string? JobTitle { get; set; }
    public DateTime? LastSignIn { get; set; }
    public string CurrentLicense { get; set; } = "";
    public string CurrentCategory { get; set; } = ""; // E5, E3
    public string RecommendedLicense { get; set; } = "";
    public string RecommendedCategory { get; set; } = ""; // E3, F1
    public string Reason { get; set; } = "";
    public decimal MonthlySavings { get; set; }
}

/// <summary>
/// Summary of optimization potential
/// </summary>
public class OptimizationSummaryDto
{
    public int TotalUsersAnalyzed { get; set; }
    public int InactiveUserCount { get; set; }
    public int DowngradeCandidateCount { get; set; }

    /// <summary>Licenses that could be freed by removing inactive users</summary>
    public int PotentialFreedLicenses { get; set; }

    /// <summary>Estimated monthly savings in EUR</summary>
    public decimal EstimatedMonthlySavings { get; set; }

    /// <summary>Estimated yearly savings in EUR</summary>
    public decimal EstimatedYearlySavings { get; set; }

    /// <summary>Breakdown by license type</summary>
    public Dictionary<string, int> InactiveByLicenseType { get; set; } = new();
    public Dictionary<string, int> DowngradesByLicenseType { get; set; } = new();

    /// <summary>Approximate license costs per month (EUR)</summary>
    public static readonly Dictionary<string, decimal> LicenseCosts = new()
    {
        ["E5"] = 57.00m,  // Microsoft 365 E5
        ["E3"] = 39.00m,  // Microsoft 365 E3
        ["F1"] = 10.00m,  // Microsoft 365 F1
    };
}

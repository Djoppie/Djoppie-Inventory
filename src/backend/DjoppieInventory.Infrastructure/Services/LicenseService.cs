using DjoppieInventory.Core.DTOs;
using DjoppieInventory.Core.Interfaces;
using Microsoft.Extensions.Logging;
using Microsoft.Graph;
using Microsoft.Graph.Models;

namespace DjoppieInventory.Infrastructure.Services;

/// <summary>
/// Service implementation for Microsoft 365 license management operations.
/// Uses Microsoft Graph API to retrieve license information.
/// </summary>
public class LicenseService : ILicenseService
{
    private readonly GraphServiceClient _graphClient;
    private readonly ILogger<LicenseService> _logger;

    /// <summary>
    /// SKU mapping for E3/E5/F1 identification with display names
    /// </summary>
    private static readonly Dictionary<string, (string Category, string DisplayName)> LicenseSkuMap = new(StringComparer.OrdinalIgnoreCase)
    {
        // E3 Licenses
        ["ENTERPRISEPACK"] = ("E3", "Office 365 E3"),
        ["SPE_E3"] = ("E3", "Microsoft 365 E3"),
        ["MICROSOFT365_E3"] = ("E3", "Microsoft 365 E3"),
        ["M365EDU_A3_FACULTY"] = ("E3", "Microsoft 365 A3 Faculty"),
        ["M365EDU_A3_STUDENT"] = ("E3", "Microsoft 365 A3 Student"),

        // E5 Licenses
        ["ENTERPRISEPREMIUM"] = ("E5", "Office 365 E5"),
        ["SPE_E5"] = ("E5", "Microsoft 365 E5"),
        ["MICROSOFT365_E5"] = ("E5", "Microsoft 365 E5"),
        ["M365_E5"] = ("E5", "Microsoft 365 E5"),
        ["M365EDU_A5_FACULTY"] = ("E5", "Microsoft 365 A5 Faculty"),
        ["M365EDU_A5_STUDENT"] = ("E5", "Microsoft 365 A5 Student"),

        // F1 Licenses
        ["DESKLESSPACK"] = ("F1", "Office 365 F1"),
        ["SPE_F1"] = ("F1", "Microsoft 365 F1"),
        ["M365_F1"] = ("F1", "Microsoft 365 F1"),
        ["O365_BUSINESS_ESSENTIALS"] = ("F1", "Microsoft 365 Business Basic"),
    };

    public LicenseService(
        GraphServiceClient graphClient,
        ILogger<LicenseService> logger)
    {
        _graphClient = graphClient ?? throw new ArgumentNullException(nameof(graphClient));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    /// <inheritdoc/>
    public async Task<LicenseSummaryDto> GetLicenseSummaryAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogInformation("Retrieving license summary from Microsoft Graph");

            var subscribedSkus = await _graphClient.SubscribedSkus
                .GetAsync(requestConfiguration =>
                {
                    requestConfiguration.QueryParameters.Select = new[]
                    {
                        "skuId", "skuPartNumber", "prepaidUnits", "consumedUnits", "capabilityStatus"
                    };
                }, cancellationToken);

            var skuList = subscribedSkus?.Value ?? new List<SubscribedSku>();
            _logger.LogInformation("Retrieved {Count} subscribed SKUs", skuList.Count);

            var licenses = new List<LicenseInfoDto>();
            var totalPurchased = 0;
            var totalAssigned = 0;

            foreach (var sku in skuList)
            {
                if (sku.SkuPartNumber == null || sku.SkuId == null)
                    continue;

                // Check if this is an E3, E5, or F1 license
                if (!LicenseSkuMap.TryGetValue(sku.SkuPartNumber, out var licenseInfo))
                    continue;

                // Only include enabled licenses
                if (sku.CapabilityStatus != "Enabled")
                    continue;

                var prepaidUnits = sku.PrepaidUnits?.Enabled ?? 0;
                var consumedUnits = sku.ConsumedUnits ?? 0;
                var availableUnits = Math.Max(0, prepaidUnits - consumedUnits);
                var utilizationPercentage = prepaidUnits > 0
                    ? (int)Math.Round((double)consumedUnits / prepaidUnits * 100)
                    : 0;

                var licenseDto = new LicenseInfoDto
                {
                    SkuId = sku.SkuId.ToString()!,
                    SkuPartNumber = sku.SkuPartNumber,
                    DisplayName = licenseInfo.DisplayName,
                    PrepaidUnits = prepaidUnits,
                    ConsumedUnits = consumedUnits,
                    AvailableUnits = availableUnits,
                    UtilizationPercentage = utilizationPercentage,
                    IsE3 = licenseInfo.Category == "E3",
                    IsE5 = licenseInfo.Category == "E5",
                    IsF1 = licenseInfo.Category == "F1",
                };

                licenses.Add(licenseDto);
                totalPurchased += prepaidUnits;
                totalAssigned += consumedUnits;
            }

            var totalAvailable = Math.Max(0, totalPurchased - totalAssigned);
            var overallUtilization = totalPurchased > 0
                ? (int)Math.Round((double)totalAssigned / totalPurchased * 100)
                : 0;

            _logger.LogInformation(
                "License summary: {LicenseCount} license types, {TotalPurchased} purchased, {TotalAssigned} assigned, {UtilizationPercentage}% utilization",
                licenses.Count, totalPurchased, totalAssigned, overallUtilization);

            return new LicenseSummaryDto
            {
                Licenses = licenses.OrderBy(l => l.DisplayName).ToList(),
                TotalPurchased = totalPurchased,
                TotalAssigned = totalAssigned,
                TotalAvailable = totalAvailable,
                UtilizationPercentage = overallUtilization,
                RetrievedAt = DateTime.UtcNow
            };
        }
        catch (ServiceException ex) when (ex.ResponseStatusCode == 403)
        {
            _logger.LogWarning("Insufficient permissions for license API: {Message}", ex.Message);
            return new LicenseSummaryDto
            {
                ErrorMessage = "Insufficient Graph API permissions. Required: Organization.Read.All"
            };
        }
        catch (ServiceException ex)
        {
            _logger.LogError(ex, "Microsoft Graph API error while retrieving license summary. Status: {StatusCode}", ex.ResponseStatusCode);
            throw new InvalidOperationException($"Failed to retrieve license summary: {ex.Message}", ex);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error while retrieving license summary");
            throw;
        }
    }

    /// <inheritdoc/>
    public async Task<IEnumerable<LicenseUserDto>> GetLicenseUsersAsync(
        string? skuId = null,
        string? department = null,
        CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogInformation("Retrieving users with licenses. SKU filter: {SkuId}, Department: {Department}", skuId, department);

            var allUsers = new List<User>();
            var pageIteratorHeaders = new Dictionary<string, string>
            {
                { "ConsistencyLevel", "eventual" }
            };

            // Build filter - only get users with assigned licenses
            var filter = "assignedLicenses/$count ne 0";

            // Get users with pagination
            var usersResponse = await _graphClient.Users
                .GetAsync(requestConfiguration =>
                {
                    requestConfiguration.QueryParameters.Select = new[]
                    {
                        "id", "displayName", "userPrincipalName", "department",
                        "jobTitle", "companyName", "officeLocation", "assignedLicenses"
                    };
                    requestConfiguration.QueryParameters.Filter = filter;
                    requestConfiguration.QueryParameters.Top = 999;
                    requestConfiguration.QueryParameters.Count = true;
                    requestConfiguration.Headers.Add("ConsistencyLevel", "eventual");
                }, cancellationToken);

            if (usersResponse?.Value != null)
            {
                allUsers.AddRange(usersResponse.Value);
            }

            // Handle pagination
            var nextLink = usersResponse?.OdataNextLink;
            while (!string.IsNullOrEmpty(nextLink))
            {
                var nextPageResponse = await _graphClient.Users
                    .WithUrl(nextLink)
                    .GetAsync(requestConfiguration =>
                    {
                        requestConfiguration.Headers.Add("ConsistencyLevel", "eventual");
                    }, cancellationToken);

                if (nextPageResponse?.Value != null)
                {
                    allUsers.AddRange(nextPageResponse.Value);
                }

                nextLink = nextPageResponse?.OdataNextLink;
            }

            _logger.LogInformation("Retrieved {Count} users with licenses", allUsers.Count);

            // Get all subscribed SKUs to map SKU IDs to part numbers
            var subscribedSkus = await _graphClient.SubscribedSkus
                .GetAsync(requestConfiguration =>
                {
                    requestConfiguration.QueryParameters.Select = new[] { "skuId", "skuPartNumber" };
                }, cancellationToken);

            var skuIdToPartNumber = subscribedSkus?.Value?
                .Where(s => s.SkuId.HasValue && s.SkuPartNumber != null)
                .ToDictionary(s => s.SkuId!.Value, s => s.SkuPartNumber!)
                ?? new Dictionary<Guid, string>();

            // Map users to DTOs
            var result = allUsers
                .Where(u => u.Id != null && u.UserPrincipalName != null)
                .Select(u =>
                {
                    var assignedLicenses = u.AssignedLicenses?
                        .Where(al => al.SkuId.HasValue)
                        .Select(al =>
                        {
                            var skuIdGuid = al.SkuId!.Value;
                            skuIdToPartNumber.TryGetValue(skuIdGuid, out var skuPartNumber);

                            // Get display info for known licenses
                            var displayName = skuPartNumber != null &&
                                              LicenseSkuMap.TryGetValue(skuPartNumber, out var info)
                                ? info.DisplayName
                                : skuPartNumber ?? "Unknown License";

                            return new AssignedLicenseDto
                            {
                                SkuId = skuIdGuid.ToString(),
                                SkuPartNumber = skuPartNumber ?? "",
                                DisplayName = displayName
                            };
                        })
                        .Where(al => string.IsNullOrEmpty(skuId) || al.SkuId == skuId)
                        .ToList() ?? new List<AssignedLicenseDto>();

                    return new LicenseUserDto
                    {
                        UserId = u.Id!,
                        DisplayName = u.DisplayName ?? "",
                        UserPrincipalName = u.UserPrincipalName!,
                        Department = u.Department,
                        JobTitle = u.JobTitle,
                        CompanyName = u.CompanyName,
                        OfficeLocation = u.OfficeLocation,
                        AssignedLicenses = assignedLicenses
                    };
                })
                .Where(u => u.AssignedLicenses.Count > 0) // Only include users with matching licenses
                .Where(u => string.IsNullOrEmpty(department) ||
                            (u.Department?.Contains(department, StringComparison.OrdinalIgnoreCase) ?? false))
                .OrderBy(u => u.DisplayName)
                .ToList();

            _logger.LogInformation("Returning {Count} users after filtering", result.Count);

            return result;
        }
        catch (ServiceException ex) when (ex.ResponseStatusCode == 403)
        {
            _logger.LogWarning("Insufficient permissions for user license API: {Message}", ex.Message);
            return Enumerable.Empty<LicenseUserDto>();
        }
        catch (ServiceException ex)
        {
            _logger.LogError(ex, "Microsoft Graph API error while retrieving license users. Status: {StatusCode}", ex.ResponseStatusCode);
            throw new InvalidOperationException($"Failed to retrieve license users: {ex.Message}", ex);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error while retrieving license users");
            throw;
        }
    }

    /// <inheritdoc/>
    public async Task<LicenseOptimizationDto> GetLicenseOptimizationAsync(
        int inactiveDaysThreshold = 90,
        CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogInformation("Analyzing license optimization with {Threshold} days inactivity threshold", inactiveDaysThreshold);

            var inactiveUsers = new List<InactiveUserDto>();
            var downgradeRecommendations = new List<DowngradeRecommendationDto>();

            // Get all subscribed SKUs to map SKU IDs
            var subscribedSkus = await _graphClient.SubscribedSkus
                .GetAsync(requestConfiguration =>
                {
                    requestConfiguration.QueryParameters.Select = new[] { "skuId", "skuPartNumber" };
                }, cancellationToken);

            var skuIdToPartNumber = subscribedSkus?.Value?
                .Where(s => s.SkuId.HasValue && s.SkuPartNumber != null)
                .ToDictionary(s => s.SkuId!.Value, s => s.SkuPartNumber!)
                ?? new Dictionary<Guid, string>();

            // Get users with sign-in activity
            var allUsers = new List<User>();
            var usersResponse = await _graphClient.Users
                .GetAsync(requestConfiguration =>
                {
                    requestConfiguration.QueryParameters.Select = new[]
                    {
                        "id", "displayName", "userPrincipalName", "department",
                        "jobTitle", "assignedLicenses", "signInActivity"
                    };
                    requestConfiguration.QueryParameters.Filter = "assignedLicenses/$count ne 0";
                    requestConfiguration.QueryParameters.Top = 999;
                    requestConfiguration.QueryParameters.Count = true;
                    requestConfiguration.Headers.Add("ConsistencyLevel", "eventual");
                }, cancellationToken);

            if (usersResponse?.Value != null)
                allUsers.AddRange(usersResponse.Value);

            // Handle pagination
            var nextLink = usersResponse?.OdataNextLink;
            while (!string.IsNullOrEmpty(nextLink))
            {
                var nextPage = await _graphClient.Users
                    .WithUrl(nextLink)
                    .GetAsync(requestConfiguration =>
                    {
                        requestConfiguration.Headers.Add("ConsistencyLevel", "eventual");
                    }, cancellationToken);

                if (nextPage?.Value != null)
                    allUsers.AddRange(nextPage.Value);

                nextLink = nextPage?.OdataNextLink;
            }

            _logger.LogInformation("Analyzing {Count} users for optimization", allUsers.Count);

            var now = DateTime.UtcNow;
            var inactiveThresholdDate = now.AddDays(-inactiveDaysThreshold);

            // Job titles that suggest frontline workers (could use F1 instead of E3)
            var frontlineJobTitles = new[] {
                "receptionist", "onthaal", "balie", "poetshulp", "schoonmaak",
                "technisch medewerker", "arbeider", "chauffeur", "magazijn",
                "onderhoud", "conciërge", "bewaking", "security"
            };

            foreach (var user in allUsers)
            {
                if (user.Id == null || user.AssignedLicenses == null)
                    continue;

                // Get user's E3/E5/F1 license
                var userLicenses = user.AssignedLicenses
                    .Where(al => al.SkuId.HasValue)
                    .Select(al =>
                    {
                        var skuId = al.SkuId!.Value;
                        skuIdToPartNumber.TryGetValue(skuId, out var partNumber);
                        if (partNumber != null && LicenseSkuMap.TryGetValue(partNumber, out var info))
                            return (SkuId: skuId, PartNumber: partNumber, Category: info.Category, DisplayName: info.DisplayName);
                        return (SkuId: skuId, PartNumber: partNumber ?? "", Category: (string?)null, DisplayName: (string?)null);
                    })
                    .Where(l => l.Category != null)
                    .ToList();

                if (!userLicenses.Any())
                    continue;

                var primaryLicense = userLicenses
                    .OrderByDescending(l => l.Category == "E5" ? 3 : l.Category == "E3" ? 2 : 1)
                    .First();

                var lastSignIn = user.SignInActivity?.LastSignInDateTime?.DateTime;
                var daysSinceSignIn = lastSignIn.HasValue
                    ? (int)(now - lastSignIn.Value).TotalDays
                    : 365; // Assume very inactive if no sign-in data

                var licenseCost = OptimizationSummaryDto.LicenseCosts.TryGetValue(primaryLicense.Category!, out var cost) ? cost : 0;

                // Check if user is inactive
                if (!lastSignIn.HasValue || lastSignIn < inactiveThresholdDate)
                {
                    var recommendation = daysSinceSignIn > 180 ? "Verwijderen" : "Controleren";

                    inactiveUsers.Add(new InactiveUserDto
                    {
                        UserId = user.Id,
                        DisplayName = user.DisplayName ?? "",
                        UserPrincipalName = user.UserPrincipalName ?? "",
                        Department = user.Department,
                        JobTitle = user.JobTitle,
                        LastSignIn = lastSignIn,
                        DaysSinceLastSignIn = daysSinceSignIn,
                        CurrentLicense = primaryLicense.DisplayName ?? primaryLicense.PartNumber,
                        LicenseCategory = primaryLicense.Category!,
                        MonthlyCost = licenseCost,
                        Recommendation = recommendation
                    });
                }
                // Check for downgrade potential (only for active users)
                else if (primaryLicense.Category == "E5" || primaryLicense.Category == "E3")
                {
                    var jobTitle = user.JobTitle?.ToLowerInvariant() ?? "";
                    var isFrontlineCandidate = frontlineJobTitles.Any(ft => jobTitle.Contains(ft));

                    // E5 users with low activity could potentially use E3
                    if (primaryLicense.Category == "E5" && daysSinceSignIn > 30)
                    {
                        var savings = OptimizationSummaryDto.LicenseCosts["E5"] - OptimizationSummaryDto.LicenseCosts["E3"];
                        downgradeRecommendations.Add(new DowngradeRecommendationDto
                        {
                            UserId = user.Id,
                            DisplayName = user.DisplayName ?? "",
                            UserPrincipalName = user.UserPrincipalName ?? "",
                            Department = user.Department,
                            JobTitle = user.JobTitle,
                            LastSignIn = lastSignIn,
                            CurrentLicense = primaryLicense.DisplayName ?? primaryLicense.PartNumber,
                            CurrentCategory = "E5",
                            RecommendedLicense = "Microsoft 365 E3",
                            RecommendedCategory = "E3",
                            Reason = $"Lage activiteit ({daysSinceSignIn} dagen sinds laatste login)",
                            MonthlySavings = savings
                        });
                    }
                    // E3 users with frontline job titles could use F1
                    else if (primaryLicense.Category == "E3" && isFrontlineCandidate)
                    {
                        var savings = OptimizationSummaryDto.LicenseCosts["E3"] - OptimizationSummaryDto.LicenseCosts["F1"];
                        downgradeRecommendations.Add(new DowngradeRecommendationDto
                        {
                            UserId = user.Id,
                            DisplayName = user.DisplayName ?? "",
                            UserPrincipalName = user.UserPrincipalName ?? "",
                            Department = user.Department,
                            JobTitle = user.JobTitle,
                            LastSignIn = lastSignIn,
                            CurrentLicense = primaryLicense.DisplayName ?? primaryLicense.PartNumber,
                            CurrentCategory = "E3",
                            RecommendedLicense = "Microsoft 365 F1",
                            RecommendedCategory = "F1",
                            Reason = $"Frontline functie: {user.JobTitle}",
                            MonthlySavings = savings
                        });
                    }
                }
            }

            // Calculate summary
            var inactiveByType = inactiveUsers
                .GroupBy(u => u.LicenseCategory)
                .ToDictionary(g => g.Key, g => g.Count());

            var downgradesByType = downgradeRecommendations
                .GroupBy(r => $"{r.CurrentCategory}→{r.RecommendedCategory}")
                .ToDictionary(g => g.Key, g => g.Count());

            var totalInactiveSavings = inactiveUsers.Sum(u => u.MonthlyCost);
            var totalDowngradeSavings = downgradeRecommendations.Sum(r => r.MonthlySavings);
            var totalMonthlySavings = totalInactiveSavings + totalDowngradeSavings;

            var summary = new OptimizationSummaryDto
            {
                TotalUsersAnalyzed = allUsers.Count,
                InactiveUserCount = inactiveUsers.Count,
                DowngradeCandidateCount = downgradeRecommendations.Count,
                PotentialFreedLicenses = inactiveUsers.Count,
                EstimatedMonthlySavings = totalMonthlySavings,
                EstimatedYearlySavings = totalMonthlySavings * 12,
                InactiveByLicenseType = inactiveByType,
                DowngradesByLicenseType = downgradesByType
            };

            _logger.LogInformation(
                "Optimization analysis complete: {Inactive} inactive users, {Downgrades} downgrade candidates, €{Savings}/month potential savings",
                inactiveUsers.Count, downgradeRecommendations.Count, totalMonthlySavings);

            return new LicenseOptimizationDto
            {
                InactiveUsers = inactiveUsers.OrderByDescending(u => u.DaysSinceLastSignIn).ToList(),
                DowngradeRecommendations = downgradeRecommendations.OrderByDescending(r => r.MonthlySavings).ToList(),
                Summary = summary,
                RetrievedAt = DateTime.UtcNow
            };
        }
        catch (ServiceException ex) when (ex.ResponseStatusCode == 403)
        {
            _logger.LogWarning("Insufficient permissions for license optimization API: {Message}", ex.Message);
            return new LicenseOptimizationDto
            {
                ErrorMessage = "Onvoldoende Graph API permissies. Vereist: AuditLog.Read.All voor sign-in activiteit"
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during license optimization analysis");
            return new LicenseOptimizationDto
            {
                ErrorMessage = $"Fout bij analyse: {ex.Message}"
            };
        }
    }

    /// <inheritdoc/>
    public async Task<LicenseStatisticsDto> GetLicenseStatisticsAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogInformation("Retrieving license statistics");

            // Get all users with licenses
            var users = await GetLicenseUsersAsync(cancellationToken: cancellationToken);
            var userList = users.ToList();

            // Group by department
            var byDepartment = userList
                .Where(u => !string.IsNullOrEmpty(u.Department))
                .GroupBy(u => u.Department!)
                .Select(g =>
                {
                    var deptUsers = g.ToList();
                    var byLicenseType = new Dictionary<string, int>();

                    foreach (var user in deptUsers)
                    {
                        foreach (var license in user.AssignedLicenses)
                        {
                            if (!LicenseSkuMap.TryGetValue(license.SkuPartNumber, out var info))
                                continue;

                            var category = info.Category;
                            if (!byLicenseType.TryGetValue(category, out var count))
                                count = 0;
                            byLicenseType[category] = count + 1;
                        }
                    }

                    return new LicenseByDepartmentDto
                    {
                        DepartmentName = g.Key,
                        TotalUsers = deptUsers.Count,
                        ByLicenseType = byLicenseType
                    };
                })
                .OrderByDescending(d => d.TotalUsers)
                .ToList();

            // Group by job title
            var byJobTitle = userList
                .Where(u => !string.IsNullOrEmpty(u.JobTitle))
                .GroupBy(u => u.JobTitle!)
                .ToDictionary(g => g.Key, g => g.Count())
                .OrderByDescending(kvp => kvp.Value)
                .Take(20)
                .ToDictionary(kvp => kvp.Key, kvp => kvp.Value);

            _logger.LogInformation(
                "License statistics: {DepartmentCount} departments, {JobTitleCount} job titles",
                byDepartment.Count, byJobTitle.Count);

            return new LicenseStatisticsDto
            {
                ByDepartment = byDepartment,
                ByJobTitle = byJobTitle,
                RetrievedAt = DateTime.UtcNow
            };
        }
        catch (ServiceException ex) when (ex.ResponseStatusCode == 403)
        {
            _logger.LogWarning("Insufficient permissions for license statistics API: {Message}", ex.Message);
            return new LicenseStatisticsDto
            {
                ErrorMessage = "Insufficient Graph API permissions. Required: User.Read.All, Directory.Read.All"
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error while retrieving license statistics");
            throw;
        }
    }
}

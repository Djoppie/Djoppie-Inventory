using DjoppieInventory.Core.Interfaces;
using Microsoft.Graph;
using Microsoft.Graph.Models;
using Microsoft.Extensions.Logging;

namespace DjoppieInventory.Infrastructure.Services;

/// <summary>
/// Service implementation for Microsoft Graph user operations.
/// Uses Microsoft Graph API to interact with Azure AD users.
/// </summary>
public class GraphUserService : IGraphUserService
{
    private readonly GraphServiceClient _graphClient;
    private readonly ILogger<GraphUserService> _logger;

    public GraphUserService(GraphServiceClient graphClient, ILogger<GraphUserService> logger)
    {
        _graphClient = graphClient ?? throw new ArgumentNullException(nameof(graphClient));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    /// <inheritdoc/>
    public async Task<IEnumerable<User>> SearchUsersAsync(string searchQuery, int top = 10)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(searchQuery))
            {
                throw new ArgumentException("Search query cannot be null or empty", nameof(searchQuery));
            }

            _logger.LogInformation("Searching for users with query: {SearchQuery}", searchQuery);

            // Search using filter for displayName and userPrincipalName
            // Using startswith and contains approaches for better results
            var users = await _graphClient.Users
                .GetAsync(requestConfiguration =>
                {
                    // Use search query parameter for more flexible searching
                    // Note: This requires ConsistencyLevel=eventual header
                    requestConfiguration.Headers.Add("ConsistencyLevel", "eventual");

                    // Search across displayName, mail, and userPrincipalName
                    requestConfiguration.QueryParameters.Search = $"\"displayName:{searchQuery}\" OR \"mail:{searchQuery}\" OR \"userPrincipalName:{searchQuery}\"";

                    requestConfiguration.QueryParameters.Top = top;
                    requestConfiguration.QueryParameters.Orderby = new[] { "displayName" };
                    requestConfiguration.QueryParameters.Select = new[]
                    {
                        "id", "displayName", "userPrincipalName", "mail",
                        "department", "officeLocation", "jobTitle", "mobilePhone",
                        "businessPhones", "companyName"
                    };
                });

            var userList = users?.Value ?? new List<User>();
            _logger.LogInformation("Found {Count} users matching query: {SearchQuery}", userList.Count, searchQuery);

            return userList;
        }
        catch (ServiceException ex)
        {
            _logger.LogError(ex, "Microsoft Graph API error while searching users with query {SearchQuery}. Status: {StatusCode}", searchQuery, ex.ResponseStatusCode);
            throw new InvalidOperationException($"Failed to search users: {ex.Message}", ex);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error while searching users with query {SearchQuery}", searchQuery);
            throw;
        }
    }

    /// <inheritdoc/>
    public async Task<User?> GetUserByIdAsync(string userId)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(userId))
            {
                throw new ArgumentException("User ID cannot be null or empty", nameof(userId));
            }

            _logger.LogInformation("Retrieving user with ID: {UserId}", userId);

            var user = await _graphClient.Users[userId]
                .GetAsync(requestConfiguration =>
                {
                    requestConfiguration.QueryParameters.Select = new[]
                    {
                        "id", "displayName", "userPrincipalName", "mail",
                        "department", "officeLocation", "jobTitle", "mobilePhone",
                        "businessPhones", "companyName"
                    };
                });

            if (user != null)
            {
                _logger.LogInformation("Found user: {DisplayName} ({UserId})", user.DisplayName, userId);
            }
            else
            {
                _logger.LogWarning("User not found with ID: {UserId}", userId);
            }

            return user;
        }
        catch (ServiceException ex) when (ex.ResponseStatusCode == (int)System.Net.HttpStatusCode.NotFound)
        {
            _logger.LogWarning("User not found with ID: {UserId}", userId);
            return null;
        }
        catch (ServiceException ex)
        {
            _logger.LogError(ex, "Microsoft Graph API error while retrieving user {UserId}. Status: {StatusCode}", userId, ex.ResponseStatusCode);
            throw new InvalidOperationException($"Failed to retrieve user: {ex.Message}", ex);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error while retrieving user {UserId}", userId);
            throw;
        }
    }

    /// <inheritdoc/>
    public async Task<User?> GetUserByUpnAsync(string userPrincipalName)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(userPrincipalName))
            {
                throw new ArgumentException("User Principal Name cannot be null or empty", nameof(userPrincipalName));
            }

            _logger.LogInformation("Retrieving user with UPN: {UserPrincipalName}", userPrincipalName);

            var user = await _graphClient.Users[userPrincipalName]
                .GetAsync(requestConfiguration =>
                {
                    requestConfiguration.QueryParameters.Select = new[]
                    {
                        "id", "displayName", "userPrincipalName", "mail",
                        "department", "officeLocation", "jobTitle", "mobilePhone",
                        "businessPhones", "companyName"
                    };
                });

            if (user != null)
            {
                _logger.LogInformation("Found user: {DisplayName} ({UserPrincipalName})", user.DisplayName, userPrincipalName);
            }
            else
            {
                _logger.LogWarning("User not found with UPN: {UserPrincipalName}", userPrincipalName);
            }

            return user;
        }
        catch (ServiceException ex) when (ex.ResponseStatusCode == (int)System.Net.HttpStatusCode.NotFound)
        {
            _logger.LogWarning("User not found with UPN: {UserPrincipalName}", userPrincipalName);
            return null;
        }
        catch (ServiceException ex)
        {
            _logger.LogError(ex, "Microsoft Graph API error while retrieving user {UserPrincipalName}. Status: {StatusCode}", userPrincipalName, ex.ResponseStatusCode);
            throw new InvalidOperationException($"Failed to retrieve user: {ex.Message}", ex);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error while retrieving user {UserPrincipalName}", userPrincipalName);
            throw;
        }
    }

    /// <inheritdoc/>
    public async Task<User?> GetUserManagerAsync(string userId)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(userId))
            {
                throw new ArgumentException("User ID cannot be null or empty", nameof(userId));
            }

            _logger.LogInformation("Retrieving manager for user: {UserId}", userId);

            var manager = await _graphClient.Users[userId].Manager
                .GetAsync(requestConfiguration =>
                {
                    requestConfiguration.QueryParameters.Select = new[]
                    {
                        "id", "displayName", "userPrincipalName", "mail",
                        "department", "officeLocation", "jobTitle"
                    };
                });

            // Cast DirectoryObject to User
            var managerUser = manager as User;

            if (managerUser != null)
            {
                _logger.LogInformation("Found manager: {DisplayName} for user {UserId}", managerUser.DisplayName, userId);
            }
            else
            {
                _logger.LogWarning("No manager found for user: {UserId}", userId);
            }

            return managerUser;
        }
        catch (ServiceException ex) when (ex.ResponseStatusCode == (int)System.Net.HttpStatusCode.NotFound)
        {
            _logger.LogWarning("No manager found for user: {UserId}", userId);
            return null;
        }
        catch (ServiceException ex)
        {
            _logger.LogError(ex, "Microsoft Graph API error while retrieving manager for user {UserId}. Status: {StatusCode}", userId, ex.ResponseStatusCode);
            throw new InvalidOperationException($"Failed to retrieve user manager: {ex.Message}", ex);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error while retrieving manager for user {UserId}", userId);
            throw;
        }
    }

    /// <inheritdoc/>
    public async Task<IEnumerable<User>> GetUsersByDepartmentAsync(string department, int top = 100)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(department))
            {
                throw new ArgumentException("Department cannot be null or empty", nameof(department));
            }

            _logger.LogInformation("Retrieving users from department: {Department}", department);

            // Escape single quotes in department name for OData filter
            var escapedDepartment = department.Replace("'", "''");

            var users = await _graphClient.Users
                .GetAsync(requestConfiguration =>
                {
                    requestConfiguration.QueryParameters.Filter = $"department eq '{escapedDepartment}'";
                    requestConfiguration.QueryParameters.Top = top;
                    requestConfiguration.QueryParameters.Orderby = new[] { "displayName" };
                    requestConfiguration.QueryParameters.Select = new[]
                    {
                        "id", "displayName", "userPrincipalName", "mail",
                        "department", "officeLocation", "jobTitle", "mobilePhone",
                        "businessPhones", "companyName"
                    };
                });

            var userList = users?.Value ?? new List<User>();
            _logger.LogInformation("Found {Count} users in department: {Department}", userList.Count, department);

            return userList;
        }
        catch (ServiceException ex)
        {
            _logger.LogError(ex, "Microsoft Graph API error while retrieving users from department {Department}. Status: {StatusCode}", department, ex.ResponseStatusCode);
            throw new InvalidOperationException($"Failed to retrieve users by department: {ex.Message}", ex);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error while retrieving users from department {Department}", department);
            throw;
        }
    }

    /// <inheritdoc/>
    public async Task<IEnumerable<string>> GetAllDepartmentsAsync(int top = 999)
    {
        try
        {
            _logger.LogInformation("Retrieving all unique departments from Azure AD");

            var users = await _graphClient.Users
                .GetAsync(requestConfiguration =>
                {
                    requestConfiguration.QueryParameters.Top = top;
                    requestConfiguration.QueryParameters.Select = new[] { "department" };
                    requestConfiguration.QueryParameters.Filter = "department ne null";
                });

            var departments = users?.Value?
                .Select(u => u.Department)
                .Where(d => !string.IsNullOrWhiteSpace(d))
                .Distinct()
                .OrderBy(d => d)
                .ToList() ?? new List<string?>();

            _logger.LogInformation("Found {Count} unique departments", departments.Count);

            return departments!;
        }
        catch (ServiceException ex)
        {
            _logger.LogError(ex, "Microsoft Graph API error while retrieving departments. Status: {StatusCode}", ex.ResponseStatusCode);
            throw new InvalidOperationException($"Failed to retrieve departments: {ex.Message}", ex);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error while retrieving departments");
            throw;
        }
    }

    /// <inheritdoc/>
    public async Task<IEnumerable<Group>> GetServiceGroupsAsync(int top = 999)
    {
        try
        {
            _logger.LogInformation("Retrieving ALL service distribution groups (MG-*) from Azure AD with pagination");

            var allGroups = new List<Group>();

            // Get groups starting with "MG-" using startsWith filter with pagination
            var response = await _graphClient.Groups
                .GetAsync(requestConfiguration =>
                {
                    requestConfiguration.QueryParameters.Filter = "startsWith(displayName, 'MG-')";
                    requestConfiguration.QueryParameters.Top = top;
                    requestConfiguration.QueryParameters.Select = new[]
                    {
                        "id", "displayName", "description", "mail", "mailEnabled",
                        "securityEnabled", "groupTypes", "mailNickname"
                    };
                });

            if (response?.Value != null)
            {
                allGroups.AddRange(response.Value);
            }

            // Handle pagination - fetch all pages
            while (response?.OdataNextLink != null)
            {
                _logger.LogInformation("Fetching next page of service groups...");
                response = await _graphClient.Groups
                    .WithUrl(response.OdataNextLink)
                    .GetAsync();

                if (response?.Value != null)
                {
                    allGroups.AddRange(response.Value);
                }
            }

            // Filter out sector groups (MG-SECTOR-*) client-side and sort by displayName
            var serviceGroups = allGroups
                .Where(g => !string.IsNullOrEmpty(g.DisplayName) &&
                           !g.DisplayName.StartsWith("MG-SECTOR-", StringComparison.OrdinalIgnoreCase))
                .OrderBy(g => g.DisplayName)
                .ToList();

            _logger.LogInformation("Found {Count} service groups (total)", serviceGroups.Count);

            return serviceGroups;
        }
        catch (ServiceException ex)
        {
            _logger.LogError(ex, "Microsoft Graph API error while retrieving service groups. Status: {StatusCode}", ex.ResponseStatusCode);
            throw new InvalidOperationException($"Failed to retrieve service groups: {ex.Message}", ex);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error while retrieving service groups");
            throw;
        }
    }

    /// <inheritdoc/>
    public async Task<IEnumerable<Group>> GetSectorGroupsAsync(int top = 50)
    {
        try
        {
            _logger.LogInformation("Retrieving sector distribution groups (MG-SECTOR-*) from Azure AD");

            // Get groups starting with "MG-SECTOR-" using startsWith filter
            // Note: Can't use $orderBy with startsWith filter, so we sort client-side
            var groups = await _graphClient.Groups
                .GetAsync(requestConfiguration =>
                {
                    requestConfiguration.QueryParameters.Filter = "startsWith(displayName, 'MG-SECTOR-')";
                    requestConfiguration.QueryParameters.Top = top;
                    requestConfiguration.QueryParameters.Select = new[]
                    {
                        "id", "displayName", "description", "mail", "mailEnabled",
                        "securityEnabled", "groupTypes"
                    };
                });

            // Sort by displayName client-side
            var sectorGroups = groups?.Value?
                .Where(g => !string.IsNullOrEmpty(g.DisplayName))
                .OrderBy(g => g.DisplayName)
                .ToList() ?? new List<Group>();

            _logger.LogInformation("Found {Count} sector groups", sectorGroups.Count);

            return sectorGroups;
        }
        catch (ServiceException ex)
        {
            _logger.LogError(ex, "Microsoft Graph API error while retrieving sector groups. Status: {StatusCode}", ex.ResponseStatusCode);
            throw new InvalidOperationException($"Failed to retrieve sector groups: {ex.Message}", ex);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error while retrieving sector groups");
            throw;
        }
    }

    /// <inheritdoc/>
    public async Task<IEnumerable<User>> GetGroupMembersAsync(string groupId, int top = 200)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(groupId))
            {
                throw new ArgumentException("Group ID cannot be null or empty", nameof(groupId));
            }

            _logger.LogInformation("Retrieving members of group: {GroupId}", groupId);

            var members = await _graphClient.Groups[groupId].Members
                .GetAsync(requestConfiguration =>
                {
                    requestConfiguration.QueryParameters.Top = top;
                    requestConfiguration.QueryParameters.Select = new[]
                    {
                        "id", "displayName", "userPrincipalName", "mail",
                        "department", "officeLocation", "jobTitle"
                    };
                });

            // Filter to only User objects (exclude nested groups, devices, etc.)
            var users = members?.Value?
                .OfType<User>()
                .OrderBy(u => u.DisplayName)
                .ToList() ?? new List<User>();

            _logger.LogInformation("Found {Count} user members in group {GroupId}", users.Count, groupId);

            return users;
        }
        catch (ServiceException ex) when (ex.ResponseStatusCode == (int)System.Net.HttpStatusCode.NotFound)
        {
            _logger.LogWarning("Group not found: {GroupId}", groupId);
            return new List<User>();
        }
        catch (ServiceException ex)
        {
            _logger.LogError(ex, "Microsoft Graph API error while retrieving group members {GroupId}. Status: {StatusCode}", groupId, ex.ResponseStatusCode);
            throw new InvalidOperationException($"Failed to retrieve group members: {ex.Message}", ex);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error while retrieving group members {GroupId}", groupId);
            throw;
        }
    }

    /// <inheritdoc/>
    public async Task<IEnumerable<Group>> GetSectorServiceGroupsAsync(string sectorGroupId, int top = 100)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(sectorGroupId))
            {
                throw new ArgumentException("Sector group ID cannot be null or empty", nameof(sectorGroupId));
            }

            _logger.LogInformation("Retrieving service groups nested in sector: {SectorGroupId}", sectorGroupId);

            // Get all members of the sector group (including nested groups)
            var members = await _graphClient.Groups[sectorGroupId].Members
                .GetAsync(requestConfiguration =>
                {
                    requestConfiguration.QueryParameters.Top = top;
                });

            // Filter to only Group objects that start with "MG-" but not "MG-SECTOR-"
            var serviceGroups = members?.Value?
                .OfType<Group>()
                .Where(g => !string.IsNullOrEmpty(g.DisplayName) &&
                           g.DisplayName.StartsWith("MG-", StringComparison.OrdinalIgnoreCase) &&
                           !g.DisplayName.StartsWith("MG-SECTOR-", StringComparison.OrdinalIgnoreCase))
                .OrderBy(g => g.DisplayName)
                .ToList() ?? new List<Group>();

            _logger.LogInformation("Found {Count} service groups in sector {SectorGroupId}", serviceGroups.Count, sectorGroupId);

            return serviceGroups;
        }
        catch (ServiceException ex) when (ex.ResponseStatusCode == (int)System.Net.HttpStatusCode.NotFound)
        {
            _logger.LogWarning("Sector group not found: {SectorGroupId}", sectorGroupId);
            return new List<Group>();
        }
        catch (ServiceException ex)
        {
            _logger.LogError(ex, "Microsoft Graph API error while retrieving sector services {SectorGroupId}. Status: {StatusCode}", sectorGroupId, ex.ResponseStatusCode);
            throw new InvalidOperationException($"Failed to retrieve sector services: {ex.Message}", ex);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error while retrieving sector services {SectorGroupId}", sectorGroupId);
            throw;
        }
    }
}

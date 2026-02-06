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
}

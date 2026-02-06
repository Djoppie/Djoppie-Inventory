using Microsoft.Graph.Models;

namespace DjoppieInventory.Core.Interfaces;

/// <summary>
/// Service interface for Microsoft Graph user operations.
/// Provides methods to search and retrieve user information from Azure AD.
/// </summary>
public interface IGraphUserService
{
    /// <summary>
    /// Searches for users by display name or email address.
    /// </summary>
    /// <param name="searchQuery">The search query (name or email)</param>
    /// <param name="top">Maximum number of results to return (default: 10)</param>
    /// <returns>A collection of users matching the search criteria</returns>
    Task<IEnumerable<User>> SearchUsersAsync(string searchQuery, int top = 10);

    /// <summary>
    /// Retrieves a specific user by their Azure AD object ID.
    /// </summary>
    /// <param name="userId">The user's Azure AD object identifier</param>
    /// <returns>The user if found, otherwise null</returns>
    Task<User?> GetUserByIdAsync(string userId);

    /// <summary>
    /// Retrieves a specific user by their User Principal Name (UPN/email).
    /// </summary>
    /// <param name="userPrincipalName">The user's UPN (email address)</param>
    /// <returns>The user if found, otherwise null</returns>
    Task<User?> GetUserByUpnAsync(string userPrincipalName);

    /// <summary>
    /// Retrieves the user's manager.
    /// </summary>
    /// <param name="userId">The user's Azure AD object identifier</param>
    /// <returns>The manager user if found, otherwise null</returns>
    Task<User?> GetUserManagerAsync(string userId);
}

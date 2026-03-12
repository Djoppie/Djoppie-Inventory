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

    /// <summary>
    /// Retrieves users by department name.
    /// </summary>
    /// <param name="department">The department name to filter by</param>
    /// <param name="top">Maximum number of results to return (default: 100)</param>
    /// <returns>A collection of users in the specified department</returns>
    Task<IEnumerable<User>> GetUsersByDepartmentAsync(string department, int top = 100);

    /// <summary>
    /// Retrieves all unique departments from Azure AD users.
    /// </summary>
    /// <param name="top">Maximum number of users to scan (default: 999)</param>
    /// <returns>A distinct list of department names</returns>
    Task<IEnumerable<string>> GetAllDepartmentsAsync(int top = 999);

    /// <summary>
    /// Retrieves all service distribution groups from Azure AD (MG-* groups, excluding MG-SECTOR-*).
    /// </summary>
    /// <param name="top">Maximum number of groups to return (default: 100)</param>
    /// <returns>A collection of groups representing services</returns>
    Task<IEnumerable<Group>> GetServiceGroupsAsync(int top = 100);

    /// <summary>
    /// Retrieves all sector distribution groups from Azure AD (MG-SECTOR-* groups).
    /// </summary>
    /// <param name="top">Maximum number of groups to return (default: 50)</param>
    /// <returns>A collection of groups representing sectors</returns>
    Task<IEnumerable<Group>> GetSectorGroupsAsync(int top = 50);

    /// <summary>
    /// Retrieves all members (users) of a specific group.
    /// </summary>
    /// <param name="groupId">The group's Azure AD object identifier</param>
    /// <param name="top">Maximum number of members to return (default: 200)</param>
    /// <returns>A collection of users who are members of the group</returns>
    Task<IEnumerable<User>> GetGroupMembersAsync(string groupId, int top = 200);

    /// <summary>
    /// Retrieves all service groups (MG-* but not MG-SECTOR-*) that are members of a sector group.
    /// This is used to establish the sector-service hierarchy.
    /// </summary>
    /// <param name="sectorGroupId">The sector group's Azure AD object identifier</param>
    /// <param name="top">Maximum number of groups to return (default: 100)</param>
    /// <returns>A collection of service groups that are nested within the sector</returns>
    Task<IEnumerable<Group>> GetSectorServiceGroupsAsync(string sectorGroupId, int top = 100);
}

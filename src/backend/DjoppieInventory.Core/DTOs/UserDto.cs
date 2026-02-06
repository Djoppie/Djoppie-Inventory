namespace DjoppieInventory.Core.DTOs;

/// <summary>
/// DTO representing a user from Azure AD / Microsoft Graph.
/// Provides essential user information for asset assignment.
/// </summary>
public class UserDto
{
    /// <summary>
    /// The Azure AD object ID of the user.
    /// </summary>
    public string Id { get; set; } = string.Empty;

    /// <summary>
    /// The display name of the user (e.g., "John Doe").
    /// </summary>
    public string DisplayName { get; set; } = string.Empty;

    /// <summary>
    /// The user principal name / email address (e.g., "john.doe@company.com").
    /// </summary>
    public string UserPrincipalName { get; set; } = string.Empty;

    /// <summary>
    /// The user's email address.
    /// </summary>
    public string? Mail { get; set; }

    /// <summary>
    /// The user's department.
    /// </summary>
    public string? Department { get; set; }

    /// <summary>
    /// The user's office location.
    /// </summary>
    public string? OfficeLocation { get; set; }

    /// <summary>
    /// The user's job title.
    /// </summary>
    public string? JobTitle { get; set; }

    /// <summary>
    /// The user's mobile phone number.
    /// </summary>
    public string? MobilePhone { get; set; }

    /// <summary>
    /// The user's business phone numbers.
    /// </summary>
    public List<string>? BusinessPhones { get; set; }

    /// <summary>
    /// The user's company name.
    /// </summary>
    public string? CompanyName { get; set; }
}

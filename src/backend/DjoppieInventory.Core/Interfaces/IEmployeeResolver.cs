namespace DjoppieInventory.Core.Interfaces;

/// <summary>
/// Resolves a free-text <c>Asset.Owner</c> string (UPN or DisplayName) to an
/// <c>Employee.Id</c> FK. Used by every write-path that assigns Asset.Owner so
/// both fields stay aligned going forward, preventing the data drift that
/// required the one-shot backfill endpoint.
/// </summary>
public interface IEmployeeResolver
{
    /// <summary>
    /// Returns the matching active Employee id for the given owner string, or
    /// null when there is no match. Matching is case-insensitive against
    /// UserPrincipalName first, then DisplayName.
    /// </summary>
    Task<int?> ResolveEmployeeIdAsync(string? owner, CancellationToken ct = default);
}

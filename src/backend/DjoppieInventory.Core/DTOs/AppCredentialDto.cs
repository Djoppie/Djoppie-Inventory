namespace DjoppieInventory.Core.DTOs;

/// <summary>
/// Represents a single credential (client secret or certificate) on an Entra ID
/// application registration, including expiry state for monitoring.
/// </summary>
public class AppCredentialDto
{
    /// <summary>Application (client) ID — the value developers paste into their apps.</summary>
    public string AppId { get; set; } = string.Empty;

    /// <summary>Directory object ID of the application registration.</summary>
    public string ObjectId { get; set; } = string.Empty;

    /// <summary>Display name of the app registration.</summary>
    public string DisplayName { get; set; } = string.Empty;

    /// <summary>"Secret" for passwordCredentials, "Certificate" for keyCredentials.</summary>
    public string CredentialType { get; set; } = string.Empty;

    /// <summary>Unique identifier of the credential on the app registration.</summary>
    public string? KeyId { get; set; }

    /// <summary>Friendly name / hint of the credential (e.g. secret description).</summary>
    public string? CredentialDisplayName { get; set; }

    public DateTime? StartDateTime { get; set; }

    public DateTime? EndDateTime { get; set; }

    /// <summary>Number of days until expiry. Negative if already expired.</summary>
    public int? DaysUntilExpiry { get; set; }

    /// <summary>"Valid", "Expiring" (&lt;= 30 days) or "Expired".</summary>
    public string Status { get; set; } = string.Empty;
}

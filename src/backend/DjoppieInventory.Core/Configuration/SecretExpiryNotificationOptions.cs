namespace DjoppieInventory.Core.Configuration;

/// <summary>
/// Configuration for the scheduled secret expiry notification background service.
/// Controls whether the job runs, who receives alerts, and the warning window.
/// </summary>
public class SecretExpiryNotificationOptions
{
    public const string SectionName = "SecretExpiryNotifications";

    /// <summary>Master toggle. Defaults to false so the job is opt-in.</summary>
    public bool Enabled { get; set; } = false;

    /// <summary>How many days before expiry the first warning should be sent.</summary>
    public int WarningDays { get; set; } = 14;

    /// <summary>The user principal name (UPN) Graph sends the mail *from*. Must have Mail.Send permission scope.</summary>
    public string SenderUpn { get; set; } = string.Empty;

    /// <summary>One or more recipient email addresses.</summary>
    public List<string> Recipients { get; set; } = new();

    /// <summary>How often the scheduler re-checks the tenant. Default: 24 hours (once per day).</summary>
    public TimeSpan CheckInterval { get; set; } = TimeSpan.FromHours(24);

    /// <summary>Delay before the first run after application start. Default: 1 minute.</summary>
    public TimeSpan InitialDelay { get; set; } = TimeSpan.FromMinutes(1);
}

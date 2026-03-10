namespace DjoppieInventory.Core.DTOs;

/// <summary>
/// Provisioning timeline for a device from Autopilot registration to user delivery
/// </summary>
public class ProvisioningTimelineDto
{
    /// <summary>
    /// Whether the device was found in Autopilot/Intune
    /// </summary>
    public bool Found { get; set; }

    /// <summary>
    /// Error message if device not found or retrieval failed
    /// </summary>
    public string? ErrorMessage { get; set; }

    /// <summary>
    /// Intune device ID
    /// </summary>
    public string? DeviceId { get; set; }

    /// <summary>
    /// Device serial number
    /// </summary>
    public string? SerialNumber { get; set; }

    /// <summary>
    /// Overall provisioning status: Pending, InProgress, Complete, Failed, Unknown
    /// </summary>
    public string OverallStatus { get; set; } = "Unknown";

    /// <summary>
    /// Overall progress percentage (0-100)
    /// </summary>
    public int ProgressPercent { get; set; }

    /// <summary>
    /// Total duration from start to completion
    /// </summary>
    public TimeSpan? TotalDuration { get; set; }

    /// <summary>
    /// Total duration formatted as string (e.g., "45 min 23 sec")
    /// </summary>
    public string? TotalDurationFormatted { get; set; }

    /// <summary>
    /// List of provisioning timeline events
    /// </summary>
    public List<ProvisioningEventDto> Events { get; set; } = new();

    // === Key Timestamps ===

    /// <summary>
    /// When the device was registered in Windows Autopilot
    /// </summary>
    public DateTime? AutopilotRegisteredAt { get; set; }

    /// <summary>
    /// When device enrollment started (OOBE)
    /// </summary>
    public DateTime? EnrollmentStartedAt { get; set; }

    /// <summary>
    /// When ESP Device Setup phase started
    /// </summary>
    public DateTime? EspDeviceSetupStartedAt { get; set; }

    /// <summary>
    /// When ESP Device Setup phase completed
    /// </summary>
    public DateTime? EspDeviceSetupCompletedAt { get; set; }

    /// <summary>
    /// When ESP Account Setup phase started
    /// </summary>
    public DateTime? EspAccountSetupStartedAt { get; set; }

    /// <summary>
    /// When ESP Account Setup phase completed
    /// </summary>
    public DateTime? EspAccountSetupCompletedAt { get; set; }

    /// <summary>
    /// When the primary user first signed in
    /// </summary>
    public DateTime? UserSignInAt { get; set; }

    /// <summary>
    /// When provisioning was fully completed
    /// </summary>
    public DateTime? ProvisioningCompletedAt { get; set; }

    /// <summary>
    /// When this data was retrieved
    /// </summary>
    public DateTime RetrievedAt { get; set; } = DateTime.UtcNow;
}

/// <summary>
/// Individual provisioning event/phase
/// </summary>
public class ProvisioningEventDto
{
    /// <summary>
    /// Unique identifier for this event
    /// </summary>
    public string Id { get; set; } = string.Empty;

    /// <summary>
    /// Phase: Registration, Enrollment, DeviceSetup, AccountSetup, Complete
    /// </summary>
    public string Phase { get; set; } = string.Empty;

    /// <summary>
    /// Status: Pending, InProgress, Complete, Failed, Skipped
    /// </summary>
    public string Status { get; set; } = string.Empty;

    /// <summary>
    /// Display title for the event
    /// </summary>
    public string Title { get; set; } = string.Empty;

    /// <summary>
    /// Additional description or details
    /// </summary>
    public string? Description { get; set; }

    /// <summary>
    /// When this phase started
    /// </summary>
    public DateTime? StartedAt { get; set; }

    /// <summary>
    /// When this phase completed
    /// </summary>
    public DateTime? CompletedAt { get; set; }

    /// <summary>
    /// Duration of this phase
    /// </summary>
    public TimeSpan? Duration { get; set; }

    /// <summary>
    /// Duration formatted as string (e.g., "5 min 12 sec")
    /// </summary>
    public string? DurationFormatted { get; set; }

    /// <summary>
    /// Progress percentage for this phase (0-100)
    /// </summary>
    public int? ProgressPercent { get; set; }

    /// <summary>
    /// Error message if phase failed
    /// </summary>
    public string? ErrorMessage { get; set; }

    /// <summary>
    /// Order for sorting events
    /// </summary>
    public int Order { get; set; }
}

namespace DjoppieInventory.Core.DTOs;

/// <summary>
/// Result of syncing Intune data to Asset entities
/// </summary>
public class IntuneSyncResultDto
{
    /// <summary>
    /// Total number of assets processed
    /// </summary>
    public int TotalProcessed { get; set; }

    /// <summary>
    /// Number of assets successfully synced with Intune data
    /// </summary>
    public int SuccessCount { get; set; }

    /// <summary>
    /// Number of assets where device was not found in Intune
    /// </summary>
    public int NotFoundCount { get; set; }

    /// <summary>
    /// Number of assets that failed to sync due to errors
    /// </summary>
    public int ErrorCount { get; set; }

    /// <summary>
    /// Number of assets skipped (no serial number or not a laptop/desktop)
    /// </summary>
    public int SkippedCount { get; set; }

    /// <summary>
    /// When the sync started
    /// </summary>
    public DateTime StartedAt { get; set; }

    /// <summary>
    /// When the sync completed
    /// </summary>
    public DateTime CompletedAt { get; set; }

    /// <summary>
    /// Duration of the sync operation
    /// </summary>
    public TimeSpan Duration => CompletedAt - StartedAt;

    /// <summary>
    /// Detailed results for each asset
    /// </summary>
    public List<IntuneSyncItemResult> Items { get; set; } = new();

    /// <summary>
    /// Error messages encountered during sync
    /// </summary>
    public List<string> Errors { get; set; } = new();
}

/// <summary>
/// Result for a single asset sync operation
/// </summary>
public class IntuneSyncItemResult
{
    /// <summary>
    /// Asset ID
    /// </summary>
    public int AssetId { get; set; }

    /// <summary>
    /// Asset code
    /// </summary>
    public string AssetCode { get; set; } = string.Empty;

    /// <summary>
    /// Serial number used for lookup
    /// </summary>
    public string? SerialNumber { get; set; }

    /// <summary>
    /// Status of the sync: Success, NotFound, Error, Skipped
    /// </summary>
    public string Status { get; set; } = string.Empty;

    /// <summary>
    /// Error message if sync failed
    /// </summary>
    public string? ErrorMessage { get; set; }

    /// <summary>
    /// Intune enrollment date (if found)
    /// </summary>
    public DateTime? IntuneEnrollmentDate { get; set; }

    /// <summary>
    /// Intune last check-in date (if found)
    /// </summary>
    public DateTime? IntuneLastCheckIn { get; set; }

    /// <summary>
    /// Intune certificate expiry (if found)
    /// </summary>
    public DateTime? IntuneCertificateExpiry { get; set; }
}

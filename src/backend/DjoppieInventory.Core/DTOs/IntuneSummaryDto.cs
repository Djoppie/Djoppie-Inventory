namespace DjoppieInventory.Core.DTOs;

public record IntuneSummaryDto
{
    public int TotalEnrolled { get; init; }
    public int Compliant { get; init; }
    public int NonCompliant { get; init; }
    public int Stale { get; init; }       // lastSync > 30 days
    public int Unenrolled { get; init; }  // assets without intuneDeviceId
    public int ErrorState { get; init; }
    public Dictionary<string, int> ByCompliance { get; init; } = new();
    public DateTime? RetrievedAt { get; init; }
}

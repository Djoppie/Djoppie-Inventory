using DjoppieInventory.Core.DTOs;
using DjoppieInventory.Core.Entities;
using DjoppieInventory.Core.Entities.Enums;

namespace DjoppieInventory.Core.Interfaces;

/// <summary>
/// Service interface for generating reports and analytics.
/// Abstracts complex LINQ queries and report generation logic.
/// </summary>
public interface IReportService
{
    // ===== HARDWARE REPORTS =====

    /// <summary>
    /// Gets hardware inventory report with filtering
    /// </summary>
    Task<HardwareReportResult> GetHardwareInventoryReportAsync(
        AssetStatus? status = null,
        int? assetTypeId = null,
        int? categoryId = null,
        string? searchTerm = null,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Exports hardware inventory to CSV
    /// </summary>
    Task<byte[]> ExportHardwareInventoryCsvAsync(
        AssetStatus? status = null,
        int? assetTypeId = null,
        int? categoryId = null,
        CancellationToken cancellationToken = default);

    // ===== WORKPLACE REPORTS =====

    /// <summary>
    /// Gets workplace occupancy report
    /// </summary>
    Task<WorkplaceOccupancyReport> GetWorkplaceOccupancyReportAsync(
        int? buildingId = null,
        int? serviceId = null,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets workplace equipment summary
    /// </summary>
    Task<WorkplaceEquipmentReport> GetWorkplaceEquipmentReportAsync(
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Exports workplace data to CSV
    /// </summary>
    Task<byte[]> ExportWorkplacesCsvAsync(
        int? buildingId = null,
        int? serviceId = null,
        CancellationToken cancellationToken = default);

    // ===== SWAP/MOVEMENT REPORTS =====

    /// <summary>
    /// Gets asset swap history report
    /// </summary>
    Task<AssetSwapHistoryReport> GetAssetSwapHistoryAsync(
        DateTime? fromDate = null,
        DateTime? toDate = null,
        int? assetId = null,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets asset event history
    /// </summary>
    Task<IEnumerable<AssetEventDto>> GetAssetEventsAsync(
        int? assetId = null,
        string? eventType = null,
        DateTime? fromDate = null,
        DateTime? toDate = null,
        CancellationToken cancellationToken = default);

    // ===== ROLLOUT REPORTS =====

    /// <summary>
    /// Gets rollout session summary report
    /// </summary>
    Task<RolloutSessionSummaryReport> GetRolloutSessionSummaryAsync(
        int sessionId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets rollout day detail report
    /// </summary>
    Task<RolloutDayDetailReport> GetRolloutDayDetailAsync(
        int dayId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets unscheduled assets that could be used in rollout
    /// </summary>
    Task<IEnumerable<Asset>> GetUnscheduledRolloutAssetsAsync(
        int sessionId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets serial number tracking report for rollout
    /// </summary>
    Task<SerialNumberTrackingReport> GetSerialNumberTrackingReportAsync(
        int sessionId,
        CancellationToken cancellationToken = default);
}

// ===== REPORT RESULT DTOs =====

public record HardwareReportResult(
    int TotalAssets,
    Dictionary<AssetStatus, int> AssetsByStatus,
    Dictionary<string, int> AssetsByType,
    List<AssetDto> Assets
);

public record WorkplaceOccupancyReport(
    int TotalWorkplaces,
    int OccupiedWorkplaces,
    int AvailableWorkplaces,
    double OccupancyRate,
    List<WorkplaceOccupancyDto> Workplaces
);

public record WorkplaceOccupancyDto(
    int WorkplaceId,
    string Code,
    string? BuildingName,
    string? ServiceName,
    string? OccupantName,
    string? OccupantEmail,
    bool IsActive,
    int FixedAssetCount
);

public record WorkplaceEquipmentReport(
    int TotalWorkplaces,
    int WorkplacesWithDocking,
    int WorkplacesWithMonitors,
    Dictionary<string, int> EquipmentCounts
);

public record AssetSwapHistoryReport(
    int TotalSwaps,
    List<AssetSwapDto> Swaps
);

public record AssetSwapDto(
    int EventId,
    DateTime Timestamp,
    int AssetId,
    string AssetCode,
    string? PreviousOwner,
    string? NewOwner,
    string? Notes
);

public record RolloutSessionSummaryReport(
    int SessionId,
    string Name,
    int TotalDays,
    int TotalWorkplaces,
    int CompletedWorkplaces,
    int PendingWorkplaces,
    double CompletionRate,
    List<RolloutDaySummary> Days
);

public record RolloutDaySummary(
    int DayId,
    DateTime Date,
    int WorkplacesScheduled,
    int WorkplacesCompleted,
    int AssetsDeployed
);

public record RolloutDayDetailReport(
    int DayId,
    DateTime Date,
    string SessionName,
    int TotalWorkplaces,
    int CompletedWorkplaces,
    List<RolloutWorkplaceDetail> Workplaces
);

public record RolloutWorkplaceDetail(
    int WorkplaceId,
    string Code,
    string? OccupantName,
    string Status,
    int AssetsScheduled,
    int AssetsInstalled
);

public record SerialNumberTrackingReport(
    int SessionId,
    int TotalAssignments,
    int AssignmentsWithSerials,
    int AssignmentsMissingSerials,
    double CompletionRate,
    List<SerialNumberAssignment> Assignments
);

public record SerialNumberAssignment(
    int AssignmentId,
    int WorkplaceId,
    string WorkplaceCode,
    string AssetTypeName,
    int? AssetId,
    string? AssetCode,
    string? SerialNumber,
    bool HasSerialNumber
);

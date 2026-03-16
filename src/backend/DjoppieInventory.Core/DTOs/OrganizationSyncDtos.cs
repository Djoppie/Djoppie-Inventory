using DjoppieInventory.Core.Entities.Enums;

namespace DjoppieInventory.Core.DTOs;

/// <summary>
/// Result of an organization sync operation
/// </summary>
public class OrganizationSyncResultDto
{
    /// <summary>
    /// Whether the sync was successful overall
    /// </summary>
    public bool Success { get; set; }

    /// <summary>
    /// Timestamp when sync started
    /// </summary>
    public DateTime StartedAt { get; set; }

    /// <summary>
    /// Timestamp when sync completed
    /// </summary>
    public DateTime CompletedAt { get; set; }

    /// <summary>
    /// Duration of the sync operation
    /// </summary>
    public TimeSpan Duration => CompletedAt - StartedAt;

    /// <summary>
    /// Number of sectors created
    /// </summary>
    public int SectorsCreated { get; set; }

    /// <summary>
    /// Number of sectors updated
    /// </summary>
    public int SectorsUpdated { get; set; }

    /// <summary>
    /// Number of services created
    /// </summary>
    public int ServicesCreated { get; set; }

    /// <summary>
    /// Number of services updated
    /// </summary>
    public int ServicesUpdated { get; set; }

    /// <summary>
    /// Number of services linked to sectors
    /// </summary>
    public int ServicesLinkedToSectors { get; set; }

    /// <summary>
    /// Total member count across all services
    /// </summary>
    public int TotalMemberCount { get; set; }

    /// <summary>
    /// Error messages encountered during sync
    /// </summary>
    public List<string> Errors { get; set; } = new();

    /// <summary>
    /// Warning messages encountered during sync
    /// </summary>
    public List<string> Warnings { get; set; } = new();
}

/// <summary>
/// Current sync status for the organization
/// </summary>
public class OrganizationSyncStatusDto
{
    /// <summary>
    /// Last sync timestamp for sectors
    /// </summary>
    public DateTime? LastSectorSyncAt { get; set; }

    /// <summary>
    /// Last sync timestamp for services
    /// </summary>
    public DateTime? LastServiceSyncAt { get; set; }

    /// <summary>
    /// Total number of sectors
    /// </summary>
    public int TotalSectors { get; set; }

    /// <summary>
    /// Number of sectors synced with Entra
    /// </summary>
    public int SyncedSectors { get; set; }

    /// <summary>
    /// Number of sectors with sync errors
    /// </summary>
    public int FailedSectors { get; set; }

    /// <summary>
    /// Total number of services
    /// </summary>
    public int TotalServices { get; set; }

    /// <summary>
    /// Number of services synced with Entra
    /// </summary>
    public int SyncedServices { get; set; }

    /// <summary>
    /// Number of services with sync errors
    /// </summary>
    public int FailedServices { get; set; }

    /// <summary>
    /// Individual sector sync statuses
    /// </summary>
    public List<EntitySyncStatusDto> Sectors { get; set; } = new();

    /// <summary>
    /// Individual service sync statuses
    /// </summary>
    public List<EntitySyncStatusDto> Services { get; set; } = new();
}

/// <summary>
/// Sync status for an individual sector or service
/// </summary>
public class EntitySyncStatusDto
{
    /// <summary>
    /// Entity ID
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// Entity code
    /// </summary>
    public string Code { get; set; } = string.Empty;

    /// <summary>
    /// Entity name
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Entra group ID if linked
    /// </summary>
    public string? EntraGroupId { get; set; }

    /// <summary>
    /// Whether Entra sync is enabled
    /// </summary>
    public bool EntraSyncEnabled { get; set; }

    /// <summary>
    /// Last sync status
    /// </summary>
    public EntraSyncStatus SyncStatus { get; set; }

    /// <summary>
    /// Last sync timestamp
    /// </summary>
    public DateTime? LastSyncAt { get; set; }

    /// <summary>
    /// Last sync error message
    /// </summary>
    public string? SyncError { get; set; }

    /// <summary>
    /// Member count (for services)
    /// </summary>
    public int? MemberCount { get; set; }
}

/// <summary>
/// Organization hierarchy (sectors with services)
/// </summary>
public class OrganizationHierarchyDto
{
    /// <summary>
    /// Sectors with their services
    /// </summary>
    public List<SectorHierarchyDto> Sectors { get; set; } = new();

    /// <summary>
    /// Services not assigned to any sector
    /// </summary>
    public List<ServiceHierarchyDto> UnassignedServices { get; set; } = new();

    /// <summary>
    /// Total member count across all services
    /// </summary>
    public int TotalMemberCount { get; set; }

    /// <summary>
    /// Total number of sectors
    /// </summary>
    public int TotalSectors { get; set; }

    /// <summary>
    /// Total number of services
    /// </summary>
    public int TotalServices { get; set; }
}

/// <summary>
/// Sector with its child services
/// </summary>
public class SectorHierarchyDto
{
    /// <summary>
    /// Sector ID
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// Sector code
    /// </summary>
    public string Code { get; set; } = string.Empty;

    /// <summary>
    /// Sector name
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Whether the sector is active
    /// </summary>
    public bool IsActive { get; set; }

    /// <summary>
    /// Entra group ID if linked
    /// </summary>
    public string? EntraGroupId { get; set; }

    /// <summary>
    /// Manager display name
    /// </summary>
    public string? ManagerDisplayName { get; set; }

    /// <summary>
    /// Manager email
    /// </summary>
    public string? ManagerEmail { get; set; }

    /// <summary>
    /// Services in this sector
    /// </summary>
    public List<ServiceHierarchyDto> Services { get; set; } = new();

    /// <summary>
    /// Total member count for this sector (sum of all services)
    /// </summary>
    public int TotalMemberCount => Services.Sum(s => s.MemberCount);
}

/// <summary>
/// Service in the hierarchy
/// </summary>
public class ServiceHierarchyDto
{
    /// <summary>
    /// Service ID
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// Service code
    /// </summary>
    public string Code { get; set; } = string.Empty;

    /// <summary>
    /// Service name
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Whether the service is active
    /// </summary>
    public bool IsActive { get; set; }

    /// <summary>
    /// Parent sector ID (null if unassigned)
    /// </summary>
    public int? SectorId { get; set; }

    /// <summary>
    /// Parent sector name
    /// </summary>
    public string? SectorName { get; set; }

    /// <summary>
    /// Entra group ID if linked
    /// </summary>
    public string? EntraGroupId { get; set; }

    /// <summary>
    /// Member count from Entra
    /// </summary>
    public int MemberCount { get; set; }

    /// <summary>
    /// Primary building ID
    /// </summary>
    public int? BuildingId { get; set; }

    /// <summary>
    /// Primary building name
    /// </summary>
    public string? BuildingName { get; set; }

    /// <summary>
    /// Manager display name
    /// </summary>
    public string? ManagerDisplayName { get; set; }

    /// <summary>
    /// Manager email
    /// </summary>
    public string? ManagerEmail { get; set; }

    /// <summary>
    /// Last Entra sync timestamp
    /// </summary>
    public DateTime? LastSyncAt { get; set; }
}

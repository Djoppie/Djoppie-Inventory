namespace DjoppieInventory.Core.DTOs;

/// <summary>
/// Represents a node in the organization hierarchy tree.
/// Used for displaying sectors, services, and workplaces in a tree view.
/// </summary>
public record OrganizationTreeNodeDto
{
    /// <summary>
    /// Unique identifier for this node (combines type and id for uniqueness)
    /// Format: "sector-{id}", "service-{id}", "workplace-{id}"
    /// </summary>
    public required string NodeId { get; init; }

    /// <summary>
    /// Database ID of the entity
    /// </summary>
    public int Id { get; init; }

    /// <summary>
    /// Type of node: "sector", "service", "workplace", "employee"
    /// </summary>
    public required string NodeType { get; init; }

    /// <summary>
    /// Short code (e.g., "ORG", "IT", "GH-BZ-L01")
    /// </summary>
    public required string Code { get; init; }

    /// <summary>
    /// Display name
    /// </summary>
    public required string Name { get; init; }

    /// <summary>
    /// Parent node ID (null for root sectors)
    /// </summary>
    public string? ParentNodeId { get; init; }

    /// <summary>
    /// Whether this node is active
    /// </summary>
    public bool IsActive { get; init; } = true;

    /// <summary>
    /// Count of direct children (services in sector, workplaces in service, etc.)
    /// </summary>
    public int ChildCount { get; init; }

    /// <summary>
    /// Total count of all descendants (recursive)
    /// </summary>
    public int TotalDescendantCount { get; init; }

    /// <summary>
    /// Additional metadata for the node (varies by type)
    /// </summary>
    public OrganizationNodeMetadata? Metadata { get; init; }

    /// <summary>
    /// Child nodes (populated when loading full tree)
    /// </summary>
    public List<OrganizationTreeNodeDto>? Children { get; init; }
}

/// <summary>
/// Additional metadata for organization tree nodes
/// </summary>
public record OrganizationNodeMetadata
{
    // Sector metadata
    public string? ManagerName { get; init; }
    public string? ManagerEmail { get; init; }

    // Service metadata
    public int? SectorId { get; init; }
    public string? SectorCode { get; init; }
    public int? MemberCount { get; init; }
    public int? BuildingId { get; init; }
    public string? BuildingName { get; init; }

    // Workplace metadata
    public int? ServiceId { get; init; }
    public string? ServiceCode { get; init; }
    public string? WorkplaceType { get; init; }
    public string? CurrentOccupantName { get; init; }
    public string? CurrentOccupantEmail { get; init; }
    public int? MonitorCount { get; init; }
    public bool? HasDockingStation { get; init; }

    // Employee metadata
    public string? EntraId { get; init; }
    public string? Email { get; init; }
    public string? DeviceAssetCode { get; init; }
}

/// <summary>
/// Request options for loading organization tree
/// </summary>
public record OrganizationTreeRequestDto
{
    /// <summary>
    /// Include inactive items in the tree
    /// </summary>
    public bool IncludeInactive { get; init; } = false;

    /// <summary>
    /// Include workplace level nodes
    /// </summary>
    public bool IncludeWorkplaces { get; init; } = true;

    /// <summary>
    /// Include employee level nodes (current occupants)
    /// </summary>
    public bool IncludeEmployees { get; init; } = false;

    /// <summary>
    /// Filter to specific sector IDs (null = all)
    /// </summary>
    public List<int>? SectorIds { get; init; }

    /// <summary>
    /// Maximum depth to load (0 = sectors only, 1 = + services, 2 = + workplaces, 3 = + employees)
    /// </summary>
    public int MaxDepth { get; init; } = 3;
}

/// <summary>
/// Response containing the full organization tree
/// </summary>
public record OrganizationTreeResponseDto
{
    /// <summary>
    /// Root nodes (sectors)
    /// </summary>
    public required List<OrganizationTreeNodeDto> Roots { get; init; }

    /// <summary>
    /// Summary statistics
    /// </summary>
    public required OrganizationTreeStatsDto Stats { get; init; }
}

/// <summary>
/// Statistics about the organization tree
/// </summary>
public record OrganizationTreeStatsDto
{
    public int TotalSectors { get; init; }
    public int ActiveSectors { get; init; }
    public int TotalServices { get; init; }
    public int ActiveServices { get; init; }
    public int TotalWorkplaces { get; init; }
    public int ActiveWorkplaces { get; init; }
    public int OccupiedWorkplaces { get; init; }
    public int TotalEmployees { get; init; }
}

/// <summary>
/// Flat list item for autocomplete/search functionality
/// </summary>
public record OrganizationFlatItemDto
{
    public required string NodeId { get; init; }
    public int Id { get; init; }
    public required string NodeType { get; init; }
    public required string Code { get; init; }
    public required string Name { get; init; }

    /// <summary>
    /// Full path for display (e.g., "ORG > IT > GH-IT-01")
    /// </summary>
    public required string FullPath { get; init; }

    /// <summary>
    /// Search-friendly combined text
    /// </summary>
    public required string SearchText { get; init; }

    public bool IsActive { get; init; }
}

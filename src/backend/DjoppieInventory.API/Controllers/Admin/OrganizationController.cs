using DjoppieInventory.Core.DTOs;
using DjoppieInventory.Core.Entities.Enums;
using DjoppieInventory.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DjoppieInventory.API.Controllers.Admin;

/// <summary>
/// Controller for organization hierarchy operations.
/// Provides tree view of Sectors > Services > Workplaces > Employees.
/// </summary>
[ApiController]
[Route("api/admin/organization")]
[Authorize]
public class OrganizationController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<OrganizationController> _logger;

    public OrganizationController(
        ApplicationDbContext context,
        ILogger<OrganizationController> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Gets the full organization hierarchy as a tree structure.
    /// </summary>
    /// <param name="includeInactive">Include inactive items</param>
    /// <param name="includeWorkplaces">Include workplace level (default: true)</param>
    /// <param name="includeEmployees">Include employee/occupant level</param>
    /// <param name="maxDepth">Maximum depth (0=sectors, 1=+services, 2=+workplaces, 3=+employees)</param>
    /// <param name="cancellationToken">Cancellation token</param>
    [HttpGet("tree")]
    [ProducesResponseType(typeof(OrganizationTreeResponseDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<OrganizationTreeResponseDto>> GetTree(
        [FromQuery] bool includeInactive = false,
        [FromQuery] bool includeWorkplaces = true,
        [FromQuery] bool includeEmployees = false,
        [FromQuery] int maxDepth = 3,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation(
            "Loading organization tree (includeInactive={IncludeInactive}, includeWorkplaces={IncludeWorkplaces}, maxDepth={MaxDepth})",
            includeInactive, includeWorkplaces, maxDepth);

        // Load all data upfront to avoid multiple queries
        var sectorsQuery = _context.Sectors.AsQueryable();
        var servicesQuery = _context.Services.Include(s => s.Building).AsQueryable();
        var workplacesQuery = _context.PhysicalWorkplaces.Include(w => w.Building).AsQueryable();

        if (!includeInactive)
        {
            sectorsQuery = sectorsQuery.Where(s => s.IsActive);
            servicesQuery = servicesQuery.Where(s => s.IsActive);
            workplacesQuery = workplacesQuery.Where(w => w.IsActive);
        }

        var sectors = await sectorsQuery
            .OrderBy(s => s.SortOrder)
            .ThenBy(s => s.Name)
            .ToListAsync(cancellationToken);

        var services = maxDepth >= 1
            ? await servicesQuery
                .OrderBy(s => s.SortOrder)
                .ThenBy(s => s.Name)
                .ToListAsync(cancellationToken)
            : [];

        var workplaces = maxDepth >= 2 && includeWorkplaces
            ? await workplacesQuery
                .OrderBy(w => w.Code)
                .ToListAsync(cancellationToken)
            : [];

        // Group data for efficient lookup
        var servicesBySector = services.GroupBy(s => s.SectorId ?? 0)
            .ToDictionary(g => g.Key, g => g.ToList());

        var workplacesByService = workplaces.GroupBy(w => w.ServiceId ?? 0)
            .ToDictionary(g => g.Key, g => g.ToList());

        // Services without sector (orphaned)
        var orphanedServices = servicesBySector.GetValueOrDefault(0, []);

        // Build tree
        var roots = new List<OrganizationTreeNodeDto>();

        foreach (var sector in sectors)
        {
            var sectorServices = servicesBySector.GetValueOrDefault(sector.Id, []);

            var sectorNode = new OrganizationTreeNodeDto
            {
                NodeId = $"sector-{sector.Id}",
                Id = sector.Id,
                NodeType = "sector",
                Code = sector.Code,
                Name = sector.Name,
                ParentNodeId = null,
                IsActive = sector.IsActive,
                ChildCount = sectorServices.Count,
                TotalDescendantCount = CalculateTotalDescendants(sectorServices, workplacesByService),
                Metadata = new OrganizationNodeMetadata
                {
                    ManagerName = sector.ManagerDisplayName,
                    ManagerEmail = sector.ManagerEmail
                },
                Children = maxDepth >= 1
                    ? BuildServiceNodes(sectorServices, workplacesByService, sector.Id, maxDepth, includeEmployees)
                    : null
            };

            roots.Add(sectorNode);
        }

        // Add orphaned services as a virtual "No Sector" node if any exist
        if (orphanedServices.Count > 0)
        {
            var orphanNode = new OrganizationTreeNodeDto
            {
                NodeId = "sector-0",
                Id = 0,
                NodeType = "sector",
                Code = "NONE",
                Name = "(Geen sector)",
                ParentNodeId = null,
                IsActive = true,
                ChildCount = orphanedServices.Count,
                TotalDescendantCount = CalculateTotalDescendants(orphanedServices, workplacesByService),
                Children = maxDepth >= 1
                    ? BuildServiceNodes(orphanedServices, workplacesByService, 0, maxDepth, includeEmployees)
                    : null
            };
            roots.Add(orphanNode);
        }

        // Calculate statistics
        var stats = new OrganizationTreeStatsDto
        {
            TotalSectors = await _context.Sectors.CountAsync(cancellationToken),
            ActiveSectors = await _context.Sectors.CountAsync(s => s.IsActive, cancellationToken),
            TotalServices = await _context.Services.CountAsync(cancellationToken),
            ActiveServices = await _context.Services.CountAsync(s => s.IsActive, cancellationToken),
            TotalWorkplaces = await _context.PhysicalWorkplaces.CountAsync(cancellationToken),
            ActiveWorkplaces = await _context.PhysicalWorkplaces.CountAsync(w => w.IsActive, cancellationToken),
            OccupiedWorkplaces = await _context.PhysicalWorkplaces
                .CountAsync(w => w.IsActive && w.CurrentOccupantEntraId != null, cancellationToken),
            TotalEmployees = await _context.PhysicalWorkplaces
                .Where(w => w.CurrentOccupantEntraId != null)
                .Select(w => w.CurrentOccupantEntraId)
                .Distinct()
                .CountAsync(cancellationToken)
        };

        return Ok(new OrganizationTreeResponseDto
        {
            Roots = roots,
            Stats = stats
        });
    }

    /// <summary>
    /// Gets a flat list of all organization items for search/autocomplete.
    /// </summary>
    [HttpGet("flat")]
    [ProducesResponseType(typeof(List<OrganizationFlatItemDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<OrganizationFlatItemDto>>> GetFlatList(
        [FromQuery] bool includeInactive = false,
        [FromQuery] string? nodeTypes = null, // comma-separated: "sector,service,workplace"
        [FromQuery] string? search = null,
        CancellationToken cancellationToken = default)
    {
        var items = new List<OrganizationFlatItemDto>();
        var typeFilter = nodeTypes?.Split(',', StringSplitOptions.RemoveEmptyEntries)
            .Select(t => t.Trim().ToLowerInvariant())
            .ToHashSet() ?? ["sector", "service", "workplace"];

        // Load sectors
        if (typeFilter.Contains("sector"))
        {
            var sectorsQuery = _context.Sectors.AsQueryable();
            if (!includeInactive) sectorsQuery = sectorsQuery.Where(s => s.IsActive);

            var sectors = await sectorsQuery.ToListAsync(cancellationToken);
            items.AddRange(sectors.Select(s => new OrganizationFlatItemDto
            {
                NodeId = $"sector-{s.Id}",
                Id = s.Id,
                NodeType = "sector",
                Code = s.Code,
                Name = s.Name,
                FullPath = s.Name,
                SearchText = $"{s.Code} {s.Name}".ToLowerInvariant(),
                IsActive = s.IsActive
            }));
        }

        // Load services with sector info
        if (typeFilter.Contains("service"))
        {
            var servicesQuery = _context.Services.Include(s => s.Sector).AsQueryable();
            if (!includeInactive) servicesQuery = servicesQuery.Where(s => s.IsActive);

            var services = await servicesQuery.ToListAsync(cancellationToken);
            items.AddRange(services.Select(s => new OrganizationFlatItemDto
            {
                NodeId = $"service-{s.Id}",
                Id = s.Id,
                NodeType = "service",
                Code = s.Code,
                Name = s.Name,
                FullPath = s.Sector != null ? $"{s.Sector.Name} > {s.Name}" : s.Name,
                SearchText = $"{s.Code} {s.Name} {s.Sector?.Code} {s.Sector?.Name}".ToLowerInvariant(),
                IsActive = s.IsActive
            }));
        }

        // Load workplaces with service/building info
        if (typeFilter.Contains("workplace"))
        {
            var workplacesQuery = _context.PhysicalWorkplaces
                .Include(w => w.Service).ThenInclude(s => s!.Sector)
                .Include(w => w.Building)
                .AsQueryable();
            if (!includeInactive) workplacesQuery = workplacesQuery.Where(w => w.IsActive);

            var workplaces = await workplacesQuery.ToListAsync(cancellationToken);
            items.AddRange(workplaces.Select(w => new OrganizationFlatItemDto
            {
                NodeId = $"workplace-{w.Id}",
                Id = w.Id,
                NodeType = "workplace",
                Code = w.Code,
                Name = w.Name,
                FullPath = BuildWorkplacePath(w),
                SearchText = $"{w.Code} {w.Name} {w.Service?.Code} {w.Service?.Name} {w.Building?.Name}".ToLowerInvariant(),
                IsActive = w.IsActive
            }));
        }

        // Apply search filter
        if (!string.IsNullOrWhiteSpace(search))
        {
            var searchLower = search.ToLowerInvariant();
            items = items.Where(i => i.SearchText.Contains(searchLower)).ToList();
        }

        return Ok(items.OrderBy(i => i.NodeType switch
        {
            "sector" => 0,
            "service" => 1,
            "workplace" => 2,
            _ => 3
        }).ThenBy(i => i.FullPath).ToList());
    }

    /// <summary>
    /// Gets services grouped by sector for dropdown/filter use.
    /// </summary>
    [HttpGet("services-by-sector")]
    [ProducesResponseType(typeof(List<SectorWithServicesDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<SectorWithServicesDto>>> GetServicesBySector(
        [FromQuery] bool includeInactive = false,
        CancellationToken cancellationToken = default)
    {
        var sectorsQuery = _context.Sectors.AsQueryable();
        var servicesQuery = _context.Services.AsQueryable();

        if (!includeInactive)
        {
            sectorsQuery = sectorsQuery.Where(s => s.IsActive);
            servicesQuery = servicesQuery.Where(s => s.IsActive);
        }

        var sectors = await sectorsQuery
            .OrderBy(s => s.SortOrder)
            .ThenBy(s => s.Name)
            .ToListAsync(cancellationToken);

        var services = await servicesQuery
            .OrderBy(s => s.SortOrder)
            .ThenBy(s => s.Name)
            .ToListAsync(cancellationToken);

        var servicesBySector = services.GroupBy(s => s.SectorId ?? 0)
            .ToDictionary(g => g.Key, g => g.ToList());

        var result = sectors.Select(sector => new SectorWithServicesDto
        {
            Id = sector.Id,
            Code = sector.Code,
            Name = sector.Name,
            IsActive = sector.IsActive,
            Services = servicesBySector.GetValueOrDefault(sector.Id, [])
                .Select(s => new ServiceSummaryDto
                {
                    Id = s.Id,
                    Code = s.Code,
                    Name = s.Name,
                    IsActive = s.IsActive
                }).ToList()
        }).ToList();

        // Add orphaned services if any
        var orphaned = servicesBySector.GetValueOrDefault(0, []);
        if (orphaned.Count > 0)
        {
            result.Add(new SectorWithServicesDto
            {
                Id = 0,
                Code = "NONE",
                Name = "(Geen sector)",
                IsActive = true,
                Services = orphaned.Select(s => new ServiceSummaryDto
                {
                    Id = s.Id,
                    Code = s.Code,
                    Name = s.Name,
                    IsActive = s.IsActive
                }).ToList()
            });
        }

        return Ok(result);
    }

    /// <summary>
    /// Gets children of a specific node (for lazy loading tree).
    /// </summary>
    [HttpGet("children/{nodeId}")]
    [ProducesResponseType(typeof(List<OrganizationTreeNodeDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<OrganizationTreeNodeDto>>> GetChildren(
        string nodeId,
        [FromQuery] bool includeInactive = false,
        CancellationToken cancellationToken = default)
    {
        var parts = nodeId.Split('-', 2);
        if (parts.Length != 2 || !int.TryParse(parts[1], out var id))
        {
            return BadRequest("Invalid node ID format. Expected: type-id (e.g., sector-1)");
        }

        var nodeType = parts[0].ToLowerInvariant();
        var children = new List<OrganizationTreeNodeDto>();

        switch (nodeType)
        {
            case "sector":
                var servicesQuery = _context.Services
                    .Include(s => s.Building)
                    .Where(s => s.SectorId == id);
                if (!includeInactive) servicesQuery = servicesQuery.Where(s => s.IsActive);

                var services = await servicesQuery
                    .OrderBy(s => s.SortOrder)
                    .ThenBy(s => s.Name)
                    .ToListAsync(cancellationToken);

                var workplaceCountByService = await _context.PhysicalWorkplaces
                    .Where(w => w.ServiceId != null && (includeInactive || w.IsActive))
                    .GroupBy(w => w.ServiceId!.Value)
                    .Select(g => new { ServiceId = g.Key, Count = g.Count() })
                    .ToDictionaryAsync(x => x.ServiceId, x => x.Count, cancellationToken);

                children = services.Select(s => new OrganizationTreeNodeDto
                {
                    NodeId = $"service-{s.Id}",
                    Id = s.Id,
                    NodeType = "service",
                    Code = s.Code,
                    Name = s.Name,
                    ParentNodeId = nodeId,
                    IsActive = s.IsActive,
                    ChildCount = workplaceCountByService.GetValueOrDefault(s.Id, 0),
                    TotalDescendantCount = workplaceCountByService.GetValueOrDefault(s.Id, 0),
                    Metadata = new OrganizationNodeMetadata
                    {
                        SectorId = s.SectorId,
                        MemberCount = s.MemberCount,
                        BuildingId = s.BuildingId,
                        BuildingName = s.Building?.Name,
                        ManagerName = s.ManagerDisplayName,
                        ManagerEmail = s.ManagerEmail
                    }
                }).ToList();
                break;

            case "service":
                var workplacesQuery = _context.PhysicalWorkplaces
                    .Include(w => w.Building)
                    .Where(w => w.ServiceId == id);
                if (!includeInactive) workplacesQuery = workplacesQuery.Where(w => w.IsActive);

                var workplaces = await workplacesQuery
                    .OrderBy(w => w.Code)
                    .ToListAsync(cancellationToken);

                children = workplaces.Select(w => new OrganizationTreeNodeDto
                {
                    NodeId = $"workplace-{w.Id}",
                    Id = w.Id,
                    NodeType = "workplace",
                    Code = w.Code,
                    Name = w.Name,
                    ParentNodeId = nodeId,
                    IsActive = w.IsActive,
                    ChildCount = w.CurrentOccupantEntraId != null ? 1 : 0,
                    TotalDescendantCount = w.CurrentOccupantEntraId != null ? 1 : 0,
                    Metadata = new OrganizationNodeMetadata
                    {
                        ServiceId = w.ServiceId,
                        WorkplaceType = w.Type.ToString(),
                        CurrentOccupantName = w.CurrentOccupantName,
                        CurrentOccupantEmail = w.CurrentOccupantEmail,
                        MonitorCount = w.MonitorCount,
                        HasDockingStation = w.HasDockingStation
                    }
                }).ToList();
                break;

            default:
                return BadRequest($"Unknown node type: {nodeType}");
        }

        return Ok(children);
    }

    #region Private Helpers

    private List<OrganizationTreeNodeDto> BuildServiceNodes(
        List<Core.Entities.Service> services,
        Dictionary<int, List<Core.Entities.PhysicalWorkplace>> workplacesByService,
        int sectorId,
        int maxDepth,
        bool includeEmployees)
    {
        return services.Select(service =>
        {
            var serviceWorkplaces = workplacesByService.GetValueOrDefault(service.Id, []);

            return new OrganizationTreeNodeDto
            {
                NodeId = $"service-{service.Id}",
                Id = service.Id,
                NodeType = "service",
                Code = service.Code,
                Name = service.Name,
                ParentNodeId = $"sector-{sectorId}",
                IsActive = service.IsActive,
                ChildCount = serviceWorkplaces.Count,
                TotalDescendantCount = serviceWorkplaces.Count + serviceWorkplaces.Count(w => w.CurrentOccupantEntraId != null),
                Metadata = new OrganizationNodeMetadata
                {
                    SectorId = service.SectorId,
                    SectorCode = null, // Could populate if needed
                    MemberCount = service.MemberCount,
                    BuildingId = service.BuildingId,
                    BuildingName = service.Building?.Name,
                    ManagerName = service.ManagerDisplayName,
                    ManagerEmail = service.ManagerEmail
                },
                Children = maxDepth >= 2
                    ? BuildWorkplaceNodes(serviceWorkplaces, service.Id, includeEmployees)
                    : null
            };
        }).ToList();
    }

    private List<OrganizationTreeNodeDto> BuildWorkplaceNodes(
        List<Core.Entities.PhysicalWorkplace> workplaces,
        int serviceId,
        bool includeEmployees)
    {
        return workplaces.Select(workplace =>
        {
            var children = includeEmployees && workplace.CurrentOccupantEntraId != null
                ? new List<OrganizationTreeNodeDto>
                {
                    new OrganizationTreeNodeDto
                    {
                        NodeId = $"employee-{workplace.Id}-{workplace.CurrentOccupantEntraId}",
                        Id = workplace.Id,
                        NodeType = "employee",
                        Code = workplace.CurrentOccupantEmail ?? "",
                        Name = workplace.CurrentOccupantName ?? "Unknown",
                        ParentNodeId = $"workplace-{workplace.Id}",
                        IsActive = true,
                        ChildCount = 0,
                        TotalDescendantCount = 0,
                        Metadata = new OrganizationNodeMetadata
                        {
                            EntraId = workplace.CurrentOccupantEntraId,
                            Email = workplace.CurrentOccupantEmail,
                            DeviceAssetCode = workplace.OccupantDeviceAssetCode
                        }
                    }
                }
                : null;

            return new OrganizationTreeNodeDto
            {
                NodeId = $"workplace-{workplace.Id}",
                Id = workplace.Id,
                NodeType = "workplace",
                Code = workplace.Code,
                Name = workplace.Name,
                ParentNodeId = $"service-{serviceId}",
                IsActive = workplace.IsActive,
                ChildCount = workplace.CurrentOccupantEntraId != null ? 1 : 0,
                TotalDescendantCount = workplace.CurrentOccupantEntraId != null ? 1 : 0,
                Metadata = new OrganizationNodeMetadata
                {
                    ServiceId = workplace.ServiceId,
                    ServiceCode = null,
                    WorkplaceType = workplace.Type.ToString(),
                    CurrentOccupantName = workplace.CurrentOccupantName,
                    CurrentOccupantEmail = workplace.CurrentOccupantEmail,
                    MonitorCount = workplace.MonitorCount,
                    HasDockingStation = workplace.HasDockingStation,
                    BuildingId = workplace.BuildingId,
                    BuildingName = workplace.Building?.Name
                },
                Children = children
            };
        }).ToList();
    }

    private static int CalculateTotalDescendants(
        List<Core.Entities.Service> services,
        Dictionary<int, List<Core.Entities.PhysicalWorkplace>> workplacesByService)
    {
        var count = services.Count;
        foreach (var service in services)
        {
            var workplaces = workplacesByService.GetValueOrDefault(service.Id, []);
            count += workplaces.Count;
            count += workplaces.Count(w => w.CurrentOccupantEntraId != null);
        }
        return count;
    }

    private static string BuildWorkplacePath(Core.Entities.PhysicalWorkplace workplace)
    {
        var parts = new List<string>();
        if (workplace.Service?.Sector != null)
            parts.Add(workplace.Service.Sector.Name);
        if (workplace.Service != null)
            parts.Add(workplace.Service.Name);
        parts.Add(workplace.Name);
        return string.Join(" > ", parts);
    }

    #endregion
}

/// <summary>
/// Sector with its services for grouped dropdown
/// </summary>
public record SectorWithServicesDto
{
    public int Id { get; init; }
    public required string Code { get; init; }
    public required string Name { get; init; }
    public bool IsActive { get; init; }
    public required List<ServiceSummaryDto> Services { get; init; }
}

/// <summary>
/// Minimal service info for dropdown
/// </summary>
public record ServiceSummaryDto
{
    public int Id { get; init; }
    public required string Code { get; init; }
    public required string Name { get; init; }
    public bool IsActive { get; init; }
}

using AutoMapper;
using DjoppieInventory.Core.Domain;
using DjoppieInventory.Core.DTOs;
using DjoppieInventory.Core.Entities;
using DjoppieInventory.Core.Interfaces;
using DjoppieInventory.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace DjoppieInventory.Infrastructure.Services;

/// <summary>
/// Centralised mutator for asset status, ownership and location.
/// See <see cref="IAssetAssignmentService"/> for the contract.
/// </summary>
public class AssetAssignmentService : IAssetAssignmentService
{
    private readonly ApplicationDbContext _context;
    private readonly IAssetEventService _events;
    private readonly IMapper _mapper;
    private readonly ILogger<AssetAssignmentService> _logger;

    public AssetAssignmentService(
        ApplicationDbContext context,
        IAssetEventService events,
        IMapper mapper,
        ILogger<AssetAssignmentService> logger)
    {
        _context = context;
        _events = events;
        _mapper = mapper;
        _logger = logger;
    }

    public async Task<AssetDto> AssignToEmployeeAsync(
        int assetId,
        AssignAssetToEmployeeDto request,
        string performedBy,
        string? performedByEmail,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);

        var asset = await LoadAssetForMutationAsync(assetId, cancellationToken);
        var employee = await _context.Employees
            .Include(e => e.Service)
            .Include(e => e.CurrentWorkplace)
            .FirstOrDefaultAsync(e => e.Id == request.EmployeeId, cancellationToken)
            ?? throw new KeyNotFoundException($"Employee with ID {request.EmployeeId} not found");

        var oldStatus = asset.Status;
        var oldOwner = asset.Owner;
        var newStatus = ResolveImplicitStatus(asset.Status, AssetStatus.InGebruik);

        EnsureStatusTransitionAllowed(oldStatus, newStatus, callerIsAdmin: false, allowAdminOverride: false);

        asset.EmployeeId = employee.Id;
        asset.Owner = employee.DisplayName;
        asset.JobTitle = employee.JobTitle;
        asset.ServiceId = employee.ServiceId;
        asset.Status = newStatus;
        asset.InstallationDate ??= request.InstallationDate ?? DateTime.UtcNow;
        asset.UpdatedAt = DateTime.UtcNow;

        // If the employee has a current workplace, surface it on the asset
        // for the location chain. This is independent of "workplace-fixed"
        // assets — laptops follow the user but still benefit from a building.
        if (employee.CurrentWorkplace is not null)
        {
            asset.BuildingId ??= employee.CurrentWorkplace.BuildingId;
        }

        await _context.SaveChangesAsync(cancellationToken);

        await WriteOwnerEventsAsync(asset, oldOwner, oldStatus, performedBy, performedByEmail, request.Notes, cancellationToken);

        _logger.LogInformation(
            "Asset {AssetCode} assigned to employee {EmployeeId} ({Owner}) by {PerformedBy}",
            asset.AssetCode, employee.Id, employee.DisplayName, performedBy);

        return await ProjectAsync(asset.Id, cancellationToken);
    }

    public async Task<AssetDto> AssignToWorkplaceAsync(
        int assetId,
        AssignAssetToWorkplaceDto request,
        string performedBy,
        string? performedByEmail,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);

        var asset = await LoadAssetForMutationAsync(assetId, cancellationToken);
        var workplace = await _context.PhysicalWorkplaces
            .Include(w => w.Building)
            .FirstOrDefaultAsync(w => w.Id == request.PhysicalWorkplaceId, cancellationToken)
            ?? throw new KeyNotFoundException($"Physical workplace with ID {request.PhysicalWorkplaceId} not found");

        var oldStatus = asset.Status;
        var oldLocation = ComposeLocationLabel(asset);
        var newStatus = ResolveImplicitStatus(asset.Status, AssetStatus.InGebruik);

        EnsureStatusTransitionAllowed(oldStatus, newStatus, callerIsAdmin: false, allowAdminOverride: false);

        asset.PhysicalWorkplaceId = workplace.Id;
        asset.BuildingId = workplace.BuildingId;
        if (!string.IsNullOrWhiteSpace(request.InstallationLocation))
        {
            asset.InstallationLocation = request.InstallationLocation;
        }
        asset.Status = newStatus;
        asset.InstallationDate ??= request.InstallationDate ?? DateTime.UtcNow;
        asset.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        await WriteLocationEventsAsync(asset, oldLocation, oldStatus, performedBy, performedByEmail, request.Notes, cancellationToken);

        _logger.LogInformation(
            "Asset {AssetCode} assigned to workplace {WorkplaceCode} by {PerformedBy}",
            asset.AssetCode, workplace.Code, performedBy);

        return await ProjectAsync(asset.Id, cancellationToken);
    }

    public async Task<AssetDto> UnassignAsync(
        int assetId,
        UnassignAssetDto request,
        string performedBy,
        string? performedByEmail,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);

        var asset = await LoadAssetForMutationAsync(assetId, cancellationToken);

        var oldStatus = asset.Status;
        var oldOwner = asset.Owner;
        var oldLocation = ComposeLocationLabel(asset);

        EnsureStatusTransitionAllowed(oldStatus, request.TargetStatus, callerIsAdmin: false, allowAdminOverride: false);

        asset.EmployeeId = null;
        asset.Owner = null;
        asset.JobTitle = null;
        asset.OfficeLocation = null;
        asset.PhysicalWorkplaceId = null;
        asset.Status = request.TargetStatus;
        asset.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        await WriteOwnerEventsAsync(asset, oldOwner, oldStatus, performedBy, performedByEmail, request.Reason, cancellationToken);
        await WriteLocationEventsAsync(asset, oldLocation, oldStatus, performedBy, performedByEmail, request.Reason, cancellationToken);

        _logger.LogInformation(
            "Asset {AssetCode} unassigned by {PerformedBy} (target status: {TargetStatus})",
            asset.AssetCode, performedBy, request.TargetStatus);

        return await ProjectAsync(asset.Id, cancellationToken);
    }

    public async Task<AssetDto> ChangeStatusAsync(
        int assetId,
        ChangeAssetStatusDto request,
        bool callerIsAdmin,
        string performedBy,
        string? performedByEmail,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);

        var asset = await LoadAssetForMutationAsync(assetId, cancellationToken);
        var oldStatus = asset.Status;

        EnsureStatusTransitionAllowed(
            oldStatus,
            request.NewStatus,
            callerIsAdmin,
            allowAdminOverride: request.AdminOverride);

        if (oldStatus == request.NewStatus)
        {
            // No-op: still acknowledge to keep the API idempotent.
            return await ProjectAsync(asset.Id, cancellationToken);
        }

        asset.Status = request.NewStatus;
        asset.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        var notes = request.Reason;
        if (request.AdminOverride && callerIsAdmin)
        {
            notes = string.IsNullOrWhiteSpace(notes)
                ? "[admin-override]"
                : $"[admin-override] {notes}";
        }

        await _events.CreateStatusChangedEventAsync(
            asset.Id,
            oldStatus,
            request.NewStatus,
            performedBy,
            performedByEmail,
            notes,
            cancellationToken);

        _logger.LogInformation(
            "Asset {AssetCode} status changed {Old} → {New} by {PerformedBy} (override: {Override})",
            asset.AssetCode, oldStatus, request.NewStatus, performedBy,
            request.AdminOverride && callerIsAdmin);

        return await ProjectAsync(asset.Id, cancellationToken);
    }

    private async Task<Asset> LoadAssetForMutationAsync(int assetId, CancellationToken cancellationToken)
    {
        return await _context.Assets.FirstOrDefaultAsync(a => a.Id == assetId, cancellationToken)
            ?? throw new KeyNotFoundException($"Asset with ID {assetId} not found");
    }

    private async Task<AssetDto> ProjectAsync(int assetId, CancellationToken cancellationToken)
    {
        // Reload with full graph for accurate AssetDto + EffectiveLocation projection.
        var fresh = await _context.Assets
            .AsNoTracking()
            .Include(a => a.AssetType)
            .Include(a => a.Service).ThenInclude(s => s!.Sector)
            .Include(a => a.Building)
            .Include(a => a.PhysicalWorkplace).ThenInclude(w => w!.Building)
            .Include(a => a.PhysicalWorkplace).ThenInclude(w => w!.Service).ThenInclude(s => s!.Sector)
            .Include(a => a.Employee).ThenInclude(e => e!.Service)
            .Include(a => a.Employee).ThenInclude(e => e!.CurrentWorkplace)
            .FirstOrDefaultAsync(a => a.Id == assetId, cancellationToken)
            ?? throw new InvalidOperationException($"Asset {assetId} disappeared mid-update");

        return _mapper.Map<AssetDto>(fresh);
    }

    private static AssetStatus ResolveImplicitStatus(AssetStatus current, AssetStatus desiredOnAssign)
    {
        // Assignment endpoints are the canonical Nieuw → InGebruik path.
        // Stock → InGebruik is also fine. Other statuses pass through
        // unchanged: assigning a Defect / Herstelling / UitDienst asset is a
        // workflow error and EnsureStatusTransitionAllowed will reject it.
        return current switch
        {
            AssetStatus.Nieuw => desiredOnAssign,
            AssetStatus.Stock => desiredOnAssign,
            _ => current,
        };
    }

    private static void EnsureStatusTransitionAllowed(
        AssetStatus from,
        AssetStatus to,
        bool callerIsAdmin,
        bool allowAdminOverride)
    {
        if (AssetStateMachine.IsAllowed(from, to))
        {
            return;
        }

        if (allowAdminOverride && callerIsAdmin && AssetStateMachine.IsAllowedForAdminOverride(from, to))
        {
            return;
        }

        var reason = AssetStateMachine.GetRejectionReason(from, to)
            ?? $"Statusovergang van '{from}' naar '{to}' is niet toegestaan.";
        throw new InvalidOperationException(reason);
    }

    private async Task WriteOwnerEventsAsync(
        Asset asset,
        string? oldOwner,
        AssetStatus oldStatus,
        string performedBy,
        string? performedByEmail,
        string? notes,
        CancellationToken cancellationToken)
    {
        if (asset.Status != oldStatus)
        {
            await _events.CreateStatusChangedEventAsync(
                asset.Id, oldStatus, asset.Status, performedBy, performedByEmail, notes, cancellationToken);
        }

        if (!string.Equals(asset.Owner, oldOwner, StringComparison.Ordinal))
        {
            await _events.CreateOwnerChangedEventAsync(
                asset.Id, oldOwner, asset.Owner, performedBy, performedByEmail, notes, cancellationToken);
        }
    }

    private async Task WriteLocationEventsAsync(
        Asset asset,
        string? oldLocation,
        AssetStatus oldStatus,
        string performedBy,
        string? performedByEmail,
        string? notes,
        CancellationToken cancellationToken)
    {
        if (asset.Status != oldStatus)
        {
            await _events.CreateStatusChangedEventAsync(
                asset.Id, oldStatus, asset.Status, performedBy, performedByEmail, notes, cancellationToken);
        }

        var newLocation = ComposeLocationLabel(asset);
        if (!string.Equals(oldLocation, newLocation, StringComparison.Ordinal))
        {
            await _events.CreateLocationChangedEventAsync(
                asset.Id, oldLocation, newLocation, performedBy, performedByEmail, notes, cancellationToken);
        }
    }

    private static string? ComposeLocationLabel(Asset asset)
    {
        if (asset.PhysicalWorkplaceId is not null)
        {
            return $"workplace:{asset.PhysicalWorkplaceId}";
        }
        if (asset.BuildingId is not null)
        {
            return $"building:{asset.BuildingId}";
        }
        if (!string.IsNullOrWhiteSpace(asset.InstallationLocation))
        {
            return $"text:{asset.InstallationLocation}";
        }
        return null;
    }
}

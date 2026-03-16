using System.Text;
using DjoppieInventory.Core.DTOs;
using DjoppieInventory.Core.Entities;
using DjoppieInventory.Core.Entities.Enums;
using DjoppieInventory.Core.Interfaces;
using DjoppieInventory.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace DjoppieInventory.Infrastructure.Services;

/// <summary>
/// Service implementation for recording and tracking asset movements during rollout execution.
/// Provides audit trail and reporting for asset lifecycle events.
/// </summary>
public class AssetMovementService : IAssetMovementService
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<AssetMovementService> _logger;

    public AssetMovementService(
        ApplicationDbContext context,
        ILogger<AssetMovementService> logger)
    {
        _context = context ?? throw new ArgumentNullException(nameof(context));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    /// <inheritdoc/>
    public async Task<RolloutAssetMovement> RecordDeploymentAsync(
        AssetDeploymentRequest request,
        string performedBy,
        string performedByEmail,
        CancellationToken cancellationToken = default)
    {
        var asset = await _context.Assets
            .Include(a => a.Service)
            .FirstOrDefaultAsync(a => a.Id == request.AssetId, cancellationToken);

        if (asset == null)
        {
            throw new InvalidOperationException($"Asset with ID {request.AssetId} not found");
        }

        var movement = new RolloutAssetMovement
        {
            RolloutSessionId = request.RolloutSessionId,
            RolloutWorkplaceId = request.RolloutWorkplaceId,
            WorkplaceAssetAssignmentId = request.WorkplaceAssetAssignmentId,
            AssetId = request.AssetId,
            MovementType = MovementType.Deployed,
            PreviousStatus = asset.Status,
            NewStatus = AssetStatus.InGebruik,
            PreviousOwner = asset.Owner,
            NewOwner = request.NewOwner,
            PreviousServiceId = asset.ServiceId,
            NewServiceId = request.NewServiceId,
            PreviousLocation = asset.InstallationLocation,
            NewLocation = request.NewLocation,
            SerialNumber = asset.SerialNumber,
            PerformedBy = performedBy,
            PerformedByEmail = performedByEmail,
            PerformedAt = DateTime.UtcNow,
            Notes = request.Notes,
            CreatedAt = DateTime.UtcNow
        };

        // Update the asset
        asset.Status = AssetStatus.InGebruik;
        asset.Owner = request.NewOwner;
        asset.ServiceId = request.NewServiceId;
        asset.InstallationLocation = request.NewLocation;
        asset.InstallationDate = DateTime.UtcNow;
        asset.LastRolloutSessionId = request.RolloutSessionId;
        asset.UpdatedAt = DateTime.UtcNow;

        _context.RolloutAssetMovements.Add(movement);
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "Recorded deployment: Asset {AssetCode} deployed to {NewOwner} by {PerformedBy}",
            asset.AssetCode, request.NewOwner, performedBy);

        return movement;
    }

    /// <inheritdoc/>
    public async Task<RolloutAssetMovement> RecordDecommissionAsync(
        AssetDecommissionRequest request,
        string performedBy,
        string performedByEmail,
        CancellationToken cancellationToken = default)
    {
        var asset = await _context.Assets
            .Include(a => a.Service)
            .FirstOrDefaultAsync(a => a.Id == request.AssetId, cancellationToken);

        if (asset == null)
        {
            throw new InvalidOperationException($"Asset with ID {request.AssetId} not found");
        }

        // Validate target status
        if (request.TargetStatus != AssetStatus.UitDienst && request.TargetStatus != AssetStatus.Defect)
        {
            throw new ArgumentException("Target status must be UitDienst or Defect", nameof(request.TargetStatus));
        }

        var movement = new RolloutAssetMovement
        {
            RolloutSessionId = request.RolloutSessionId,
            RolloutWorkplaceId = request.RolloutWorkplaceId,
            WorkplaceAssetAssignmentId = request.WorkplaceAssetAssignmentId,
            AssetId = request.AssetId,
            MovementType = MovementType.Decommissioned,
            PreviousStatus = asset.Status,
            NewStatus = request.TargetStatus,
            PreviousOwner = asset.Owner,
            NewOwner = null,
            PreviousServiceId = asset.ServiceId,
            NewServiceId = null,
            PreviousLocation = asset.InstallationLocation,
            NewLocation = null,
            SerialNumber = asset.SerialNumber,
            PerformedBy = performedBy,
            PerformedByEmail = performedByEmail,
            PerformedAt = DateTime.UtcNow,
            Notes = request.Notes,
            CreatedAt = DateTime.UtcNow
        };

        // Update the asset
        asset.Status = request.TargetStatus;
        asset.Owner = null;
        asset.ServiceId = null;
        asset.InstallationLocation = null;
        asset.LastRolloutSessionId = request.RolloutSessionId;
        asset.CurrentWorkplaceAssignmentId = null;
        asset.UpdatedAt = DateTime.UtcNow;

        _context.RolloutAssetMovements.Add(movement);
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "Recorded decommission: Asset {AssetCode} decommissioned with status {Status} by {PerformedBy}",
            asset.AssetCode, request.TargetStatus, performedBy);

        return movement;
    }

    /// <inheritdoc/>
    public async Task<RolloutAssetMovement> RecordTransferAsync(
        AssetTransferRequest request,
        string performedBy,
        string performedByEmail,
        CancellationToken cancellationToken = default)
    {
        var asset = await _context.Assets
            .Include(a => a.Service)
            .FirstOrDefaultAsync(a => a.Id == request.AssetId, cancellationToken);

        if (asset == null)
        {
            throw new InvalidOperationException($"Asset with ID {request.AssetId} not found");
        }

        var movement = new RolloutAssetMovement
        {
            RolloutSessionId = request.RolloutSessionId,
            RolloutWorkplaceId = request.RolloutWorkplaceId,
            AssetId = request.AssetId,
            MovementType = MovementType.Transferred,
            PreviousStatus = asset.Status,
            NewStatus = asset.Status, // Status typically doesn't change on transfer
            PreviousOwner = asset.Owner,
            NewOwner = request.NewOwner ?? asset.Owner,
            PreviousServiceId = asset.ServiceId,
            NewServiceId = request.NewServiceId ?? asset.ServiceId,
            PreviousLocation = asset.InstallationLocation,
            NewLocation = request.NewLocation ?? asset.InstallationLocation,
            SerialNumber = asset.SerialNumber,
            PerformedBy = performedBy,
            PerformedByEmail = performedByEmail,
            PerformedAt = DateTime.UtcNow,
            Notes = request.Notes,
            CreatedAt = DateTime.UtcNow
        };

        // Update the asset
        if (request.NewOwner != null)
            asset.Owner = request.NewOwner;
        if (request.NewServiceId != null)
            asset.ServiceId = request.NewServiceId;
        if (request.NewLocation != null)
            asset.InstallationLocation = request.NewLocation;
        asset.LastRolloutSessionId = request.RolloutSessionId;
        asset.UpdatedAt = DateTime.UtcNow;

        _context.RolloutAssetMovements.Add(movement);
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "Recorded transfer: Asset {AssetCode} transferred to {NewOwner} by {PerformedBy}",
            asset.AssetCode, request.NewOwner ?? asset.Owner, performedBy);

        return movement;
    }

    /// <inheritdoc/>
    public async Task<IEnumerable<AssetMovementDto>> GetMovementsBySessionAsync(
        int sessionId,
        CancellationToken cancellationToken = default)
    {
        var movements = await _context.RolloutAssetMovements
            .Include(m => m.RolloutSession)
            .Include(m => m.RolloutWorkplace)
            .Include(m => m.Asset)
            .Include(m => m.PreviousService)
            .Include(m => m.NewService)
            .Where(m => m.RolloutSessionId == sessionId)
            .OrderByDescending(m => m.PerformedAt)
            .ToListAsync(cancellationToken);

        return movements.Select(MapToDto);
    }

    /// <inheritdoc/>
    public async Task<IEnumerable<AssetMovementDto>> GetMovementsByWorkplaceAsync(
        int workplaceId,
        CancellationToken cancellationToken = default)
    {
        var movements = await _context.RolloutAssetMovements
            .Include(m => m.RolloutSession)
            .Include(m => m.RolloutWorkplace)
            .Include(m => m.Asset)
            .Include(m => m.PreviousService)
            .Include(m => m.NewService)
            .Where(m => m.RolloutWorkplaceId == workplaceId)
            .OrderByDescending(m => m.PerformedAt)
            .ToListAsync(cancellationToken);

        return movements.Select(MapToDto);
    }

    /// <inheritdoc/>
    public async Task<IEnumerable<AssetMovementDto>> GetMovementsByAssetAsync(
        int assetId,
        CancellationToken cancellationToken = default)
    {
        var movements = await _context.RolloutAssetMovements
            .Include(m => m.RolloutSession)
            .Include(m => m.RolloutWorkplace)
            .Include(m => m.Asset)
            .Include(m => m.PreviousService)
            .Include(m => m.NewService)
            .Where(m => m.AssetId == assetId)
            .OrderByDescending(m => m.PerformedAt)
            .ToListAsync(cancellationToken);

        return movements.Select(MapToDto);
    }

    /// <inheritdoc/>
    public async Task<MovementSummaryDto> GetMovementSummaryAsync(
        int sessionId,
        CancellationToken cancellationToken = default)
    {
        var session = await _context.RolloutSessions
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.Id == sessionId, cancellationToken);

        if (session == null)
        {
            throw new InvalidOperationException($"Rollout session with ID {sessionId} not found");
        }

        var movements = await _context.RolloutAssetMovements
            .Include(m => m.Asset)
                .ThenInclude(a => a!.AssetType)
            .Include(m => m.NewService)
            .Where(m => m.RolloutSessionId == sessionId)
            .ToListAsync(cancellationToken);

        var summary = new MovementSummaryDto
        {
            RolloutSessionId = sessionId,
            SessionName = session.SessionName,
            TotalMovements = movements.Count,
            Deployments = movements.Count(m => m.MovementType == MovementType.Deployed),
            Decommissions = movements.Count(m => m.MovementType == MovementType.Decommissioned),
            Transfers = movements.Count(m => m.MovementType == MovementType.Transferred)
        };

        // Group by asset type
        summary.ByAssetType = movements
            .Where(m => m.Asset?.AssetType != null)
            .GroupBy(m => m.Asset!.AssetType!.Name)
            .Select(g => new MovementByAssetTypeDto
            {
                AssetTypeName = g.Key,
                Count = g.Count(),
                Deployments = g.Count(m => m.MovementType == MovementType.Deployed),
                Decommissions = g.Count(m => m.MovementType == MovementType.Decommissioned)
            })
            .OrderByDescending(x => x.Count)
            .ToList();

        // Group by service
        summary.ByService = movements
            .Where(m => m.NewService != null)
            .GroupBy(m => new { m.NewServiceId, m.NewService!.Name })
            .Select(g => new MovementByServiceDto
            {
                ServiceId = g.Key.NewServiceId!.Value,
                ServiceName = g.Key.Name,
                Count = g.Count(),
                Deployments = g.Count(m => m.MovementType == MovementType.Deployed),
                Decommissions = g.Count(m => m.MovementType == MovementType.Decommissioned)
            })
            .OrderByDescending(x => x.Count)
            .ToList();

        // Group by technician
        summary.ByTechnician = movements
            .GroupBy(m => new { m.PerformedBy, m.PerformedByEmail })
            .Select(g => new MovementByTechnicianDto
            {
                TechnicianName = g.Key.PerformedBy,
                TechnicianEmail = g.Key.PerformedByEmail,
                Count = g.Count(),
                Deployments = g.Count(m => m.MovementType == MovementType.Deployed),
                Decommissions = g.Count(m => m.MovementType == MovementType.Decommissioned)
            })
            .OrderByDescending(x => x.Count)
            .ToList();

        // Group by date
        summary.ByDate = movements
            .GroupBy(m => m.PerformedAt.Date)
            .Select(g => new MovementByDateDto
            {
                Date = g.Key,
                Count = g.Count(),
                Deployments = g.Count(m => m.MovementType == MovementType.Deployed),
                Decommissions = g.Count(m => m.MovementType == MovementType.Decommissioned)
            })
            .OrderBy(x => x.Date)
            .ToList();

        return summary;
    }

    /// <inheritdoc/>
    public async Task<string> ExportToCsvAsync(
        int sessionId,
        CancellationToken cancellationToken = default)
    {
        var movements = await _context.RolloutAssetMovements
            .Include(m => m.RolloutSession)
            .Include(m => m.RolloutWorkplace)
            .Include(m => m.Asset)
            .Include(m => m.PreviousService)
            .Include(m => m.NewService)
            .Where(m => m.RolloutSessionId == sessionId)
            .OrderBy(m => m.PerformedAt)
            .ToListAsync(cancellationToken);

        var sb = new StringBuilder();

        // Header
        sb.AppendLine("Id,MovementType,AssetCode,AssetName,SerialNumber,PreviousStatus,NewStatus," +
                      "PreviousOwner,NewOwner,PreviousService,NewService,PreviousLocation,NewLocation," +
                      "PerformedBy,PerformedByEmail,PerformedAt,WorkplaceUser,Notes");

        foreach (var m in movements)
        {
            sb.AppendLine(string.Join(",",
                m.Id,
                EscapeCsvField(m.MovementType.ToString()),
                EscapeCsvField(m.Asset?.AssetCode ?? ""),
                EscapeCsvField(m.Asset?.AssetName ?? ""),
                EscapeCsvField(m.SerialNumber ?? ""),
                EscapeCsvField(m.PreviousStatus?.ToString() ?? ""),
                EscapeCsvField(m.NewStatus.ToString()),
                EscapeCsvField(m.PreviousOwner ?? ""),
                EscapeCsvField(m.NewOwner ?? ""),
                EscapeCsvField(m.PreviousService?.Name ?? ""),
                EscapeCsvField(m.NewService?.Name ?? ""),
                EscapeCsvField(m.PreviousLocation ?? ""),
                EscapeCsvField(m.NewLocation ?? ""),
                EscapeCsvField(m.PerformedBy),
                EscapeCsvField(m.PerformedByEmail),
                m.PerformedAt.ToString("yyyy-MM-dd HH:mm:ss"),
                EscapeCsvField(m.RolloutWorkplace?.UserName ?? ""),
                EscapeCsvField(m.Notes ?? "")
            ));
        }

        return sb.ToString();
    }

    /// <inheritdoc/>
    public async Task<IEnumerable<AssetMovementDto>> GetMovementsByDateRangeAsync(
        DateTime startDate,
        DateTime endDate,
        MovementType? movementType = null,
        CancellationToken cancellationToken = default)
    {
        var query = _context.RolloutAssetMovements
            .Include(m => m.RolloutSession)
            .Include(m => m.RolloutWorkplace)
            .Include(m => m.Asset)
            .Include(m => m.PreviousService)
            .Include(m => m.NewService)
            .Where(m => m.PerformedAt >= startDate && m.PerformedAt <= endDate);

        if (movementType.HasValue)
        {
            query = query.Where(m => m.MovementType == movementType.Value);
        }

        var movements = await query
            .OrderByDescending(m => m.PerformedAt)
            .ToListAsync(cancellationToken);

        return movements.Select(MapToDto);
    }

    #region Private Methods

    private static AssetMovementDto MapToDto(RolloutAssetMovement m)
    {
        return new AssetMovementDto
        {
            Id = m.Id,
            RolloutSessionId = m.RolloutSessionId,
            SessionName = m.RolloutSession?.SessionName,
            RolloutWorkplaceId = m.RolloutWorkplaceId,
            WorkplaceUserName = m.RolloutWorkplace?.UserName,
            AssetId = m.AssetId,
            AssetCode = m.Asset?.AssetCode ?? "",
            AssetName = m.Asset?.AssetName ?? "",
            SerialNumber = m.SerialNumber,
            MovementType = m.MovementType,
            PreviousStatus = m.PreviousStatus,
            NewStatus = m.NewStatus,
            PreviousOwner = m.PreviousOwner,
            NewOwner = m.NewOwner,
            PreviousServiceId = m.PreviousServiceId,
            PreviousServiceName = m.PreviousService?.Name,
            NewServiceId = m.NewServiceId,
            NewServiceName = m.NewService?.Name,
            PreviousLocation = m.PreviousLocation,
            NewLocation = m.NewLocation,
            PerformedBy = m.PerformedBy,
            PerformedByEmail = m.PerformedByEmail,
            PerformedAt = m.PerformedAt,
            Notes = m.Notes
        };
    }

    private static string EscapeCsvField(string field)
    {
        if (string.IsNullOrEmpty(field))
            return "";

        if (field.Contains(',') || field.Contains('"') || field.Contains('\n') || field.Contains('\r'))
        {
            return $"\"{field.Replace("\"", "\"\"")}\"";
        }

        return field;
    }

    #endregion
}

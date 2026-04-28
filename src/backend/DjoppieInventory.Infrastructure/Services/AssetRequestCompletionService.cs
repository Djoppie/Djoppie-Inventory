using DjoppieInventory.Core.Entities;
using DjoppieInventory.Core.Interfaces;
using DjoppieInventory.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace DjoppieInventory.Infrastructure.Services;

public class AssetRequestCompletionService : IAssetRequestCompletionService
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<AssetRequestCompletionService> _logger;

    public AssetRequestCompletionService(
        ApplicationDbContext context,
        ILogger<AssetRequestCompletionService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<CompletionResult> TransitionAsync(
        int requestId,
        AssetRequestStatus target,
        string performedBy,
        string? performedByEmail,
        CancellationToken cancellationToken = default)
    {
        var request = await _context.AssetRequests
            .Include(r => r.Employee)
            .Include(r => r.Lines).ThenInclude(l => l.Asset)
            .FirstOrDefaultAsync(r => r.Id == requestId, cancellationToken)
            ?? throw new InvalidOperationException($"AssetRequest {requestId} not found.");

        ValidateTransition(request.Status, target);

        if (target == AssetRequestStatus.Completed)
        {
            ValidateCompletion(request);
        }

        await using var tx = await _context.Database.BeginTransactionAsync(cancellationToken);

        var affected = new List<int>();

        if (target == AssetRequestStatus.Completed)
        {
            foreach (var line in request.Lines.Where(l => l.Status != AssetRequestLineStatus.Skipped))
            {
                if (request.RequestType == AssetRequestType.Onboarding)
                {
                    ApplyOnboardingLine(request, line, performedBy, performedByEmail);
                }
                else
                {
                    ApplyOffboardingLine(request, line, performedBy, performedByEmail);
                }

                if (line.AssetId.HasValue) affected.Add(line.AssetId.Value);
                line.Status = AssetRequestLineStatus.Completed;
                line.UpdatedAt = DateTime.UtcNow;
            }

            request.CompletedAt = DateTime.UtcNow;
        }

        request.Status = target;
        request.ModifiedBy = performedBy;
        request.ModifiedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);
        await tx.CommitAsync(cancellationToken);

        _logger.LogInformation("AssetRequest {Id} transitioned to {Status} by {User}",
            request.Id, target, performedBy);

        return new CompletionResult
        {
            Request = request,
            AffectedAssetIds = affected
        };
    }

    private static void ValidateTransition(AssetRequestStatus current, AssetRequestStatus target)
    {
        if (current == target) return;

        var allowed = current switch
        {
            AssetRequestStatus.Pending => new[] { AssetRequestStatus.Approved, AssetRequestStatus.InProgress, AssetRequestStatus.Cancelled },
            AssetRequestStatus.Approved => new[] { AssetRequestStatus.InProgress, AssetRequestStatus.Cancelled },
            AssetRequestStatus.InProgress => new[] { AssetRequestStatus.Completed, AssetRequestStatus.Cancelled },
            AssetRequestStatus.Completed => Array.Empty<AssetRequestStatus>(),
            AssetRequestStatus.Cancelled => Array.Empty<AssetRequestStatus>(),
            AssetRequestStatus.Rejected => Array.Empty<AssetRequestStatus>(),
            _ => Array.Empty<AssetRequestStatus>()
        };

        if (!allowed.Contains(target))
            throw new InvalidOperationException(
                $"Cannot transition AssetRequest from {current} to {target}.");
    }

    private static void ValidateCompletion(AssetRequest request)
    {
        foreach (var line in request.Lines.Where(l => l.Status != AssetRequestLineStatus.Skipped))
        {
            if (line.AssetId == null)
                throw new InvalidOperationException(
                    $"Line {line.Id} has no AssetId; cannot complete request.");

            if (line.Asset == null)
                throw new InvalidOperationException(
                    $"Line {line.Id} references a missing asset.");

            if (request.RequestType == AssetRequestType.Onboarding)
            {
                if (line.Asset.Status != AssetStatus.Nieuw && line.Asset.Status != AssetStatus.Stock)
                    throw new InvalidOperationException(
                        $"Asset {line.Asset.AssetCode} must be Nieuw or Stock to onboard (was {line.Asset.Status}).");
            }
            else // Offboarding
            {
                if (line.ReturnAction == null)
                    throw new InvalidOperationException(
                        $"Line {line.Id} requires a ReturnAction for offboarding.");

                if (line.Asset.Status != AssetStatus.InGebruik)
                    throw new InvalidOperationException(
                        $"Asset {line.Asset.AssetCode} must be InGebruik to offboard (was {line.Asset.Status}).");
            }
        }
    }

    private static void ApplyOnboardingLine(
        AssetRequest request,
        AssetRequestLine line,
        string performedBy,
        string? performedByEmail)
    {
        var asset = line.Asset!;
        var previousStatus = asset.Status;

        asset.Status = AssetStatus.InGebruik;
        asset.EmployeeId = request.EmployeeId;
        asset.Owner = request.Employee?.DisplayName ?? request.RequestedFor;
        if (request.Employee?.ServiceId != null)
            asset.ServiceId = request.Employee.ServiceId;
        if (asset.InstallationDate == null)
            asset.InstallationDate = DateTime.UtcNow;
        asset.UpdatedAt = DateTime.UtcNow;

        var ev = new AssetEvent
        {
            AssetId = asset.Id,
            EventType = AssetEventType.DeviceOnboarded,
            Description = $"Onboarded via request #{request.Id}",
            OldValue = previousStatus.ToString(),
            NewValue = AssetStatus.InGebruik.ToString(),
            Notes = $"Request line {line.Id}; RequestedFor={request.RequestedFor}",
            PerformedBy = performedBy,
            PerformedByEmail = performedByEmail,
            EventDate = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow
        };
        asset.Events.Add(ev);
    }

    private static void ApplyOffboardingLine(
        AssetRequest request,
        AssetRequestLine line,
        string performedBy,
        string? performedByEmail)
    {
        var asset = line.Asset!;
        var previousStatus = asset.Status;
        var action = line.ReturnAction!.Value;

        asset.Status = action switch
        {
            AssetReturnAction.ReturnToStock => AssetStatus.Stock,
            AssetReturnAction.Decommission => AssetStatus.UitDienst,
            AssetReturnAction.Reassign => AssetStatus.Stock,
            _ => throw new InvalidOperationException($"Unknown ReturnAction {action}")
        };
        asset.EmployeeId = null;
        asset.Owner = null;
        asset.UpdatedAt = DateTime.UtcNow;

        var description = action switch
        {
            AssetReturnAction.ReturnToStock => $"Returned to stock via request #{request.Id}",
            AssetReturnAction.Decommission => $"Decommissioned via request #{request.Id}",
            AssetReturnAction.Reassign => $"Returned for reassignment via request #{request.Id}",
            _ => $"Offboarded via request #{request.Id}"
        };

        var ev = new AssetEvent
        {
            AssetId = asset.Id,
            EventType = AssetEventType.DeviceOffboarded,
            Description = description,
            OldValue = previousStatus.ToString(),
            NewValue = asset.Status.ToString(),
            Notes = string.IsNullOrWhiteSpace(line.Notes)
                ? $"Request line {line.Id}"
                : $"Request line {line.Id}; {line.Notes}",
            PerformedBy = performedBy,
            PerformedByEmail = performedByEmail,
            EventDate = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow
        };
        asset.Events.Add(ev);
    }
}

using DjoppieInventory.Core.DTOs.LaptopSwap;
using DjoppieInventory.Core.Entities;
using DjoppieInventory.Core.Interfaces;
using DjoppieInventory.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace DjoppieInventory.Infrastructure.Services;

/// <summary>
/// Service for handling device deployments (onboarding and laptop swaps)
/// </summary>
public class DeploymentService : IDeploymentService
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<DeploymentService> _logger;

    public DeploymentService(ApplicationDbContext context, ILogger<DeploymentService> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <inheritdoc />
    public async Task<DeploymentResultDto> ExecuteDeploymentAsync(
        ExecuteDeploymentDto request,
        string performedBy,
        string performedByEmail,
        CancellationToken cancellationToken = default)
    {
        // Generate deployment ID
        var deploymentId = $"DEP-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString()[..8].ToUpper()}";
        var timestamp = DateTime.UtcNow;
        var assetEvents = new List<AssetEventSummaryDto>();

        _logger.LogInformation(
            "Starting deployment {DeploymentId}: Mode={Mode}, NewLaptop={NewLaptopId}, OldLaptop={OldLaptopId}, User={User}",
            deploymentId, request.Mode, request.NewLaptopAssetId, request.OldLaptopAssetId, request.NewOwnerEmail);

        // Use a transaction to ensure atomicity
        await using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);

        try
        {
            Asset? newLaptop = null;
            AssetDeploymentSummaryDto? newLaptopSummary = null;

            // For Onboarding and Swap modes, validate and fetch new laptop
            if (request.Mode != DeploymentMode.Offboarding)
            {
                if (!request.NewLaptopAssetId.HasValue)
                {
                    throw new ArgumentException("New laptop ID is required for onboarding and swap modes");
                }

                newLaptop = await _context.Assets
                    .Include(a => a.AssetType)
                    .FirstOrDefaultAsync(a => a.Id == request.NewLaptopAssetId.Value, cancellationToken);

                if (newLaptop == null)
                {
                    throw new ArgumentException($"New laptop with ID {request.NewLaptopAssetId} not found");
                }

                if (newLaptop.Status != AssetStatus.Stock && newLaptop.Status != AssetStatus.Nieuw)
                {
                    throw new ArgumentException(
                        $"New laptop {newLaptop.AssetCode} is not available (current status: {newLaptop.Status}). Must be Stock or Nieuw.");
                }
            }

            Asset? oldLaptop = null;
            AssetDeploymentSummaryDto? oldLaptopSummary = null;

            // Parse the target status for old laptop
            var oldLaptopTargetStatus = request.OldAssetNewStatus?.ToLower() switch
            {
                "stock" => AssetStatus.Stock,
                "defect" => AssetStatus.Defect,
                _ => AssetStatus.UitDienst
            };

            // For Swap and Offboarding modes, validate and process old laptop
            if (request.Mode == DeploymentMode.Swap || request.Mode == DeploymentMode.Offboarding)
            {
                if (!request.OldLaptopAssetId.HasValue)
                {
                    throw new ArgumentException("Old laptop ID is required for swap and offboarding modes");
                }

                oldLaptop = await _context.Assets
                    .Include(a => a.AssetType)
                    .FirstOrDefaultAsync(a => a.Id == request.OldLaptopAssetId.Value, cancellationToken);

                if (oldLaptop == null)
                {
                    throw new ArgumentException($"Old laptop with ID {request.OldLaptopAssetId} not found");
                }

                // Store old values for summary
                var oldLaptopOldStatus = oldLaptop.Status.ToString();
                var oldLaptopOldOwner = oldLaptop.Owner;

                // Update old laptop - set to target status and clear owner
                oldLaptop.Status = oldLaptopTargetStatus;
                oldLaptop.Owner = null;
                oldLaptop.JobTitle = null;
                oldLaptop.OfficeLocation = null;
                oldLaptop.UpdatedAt = timestamp;

                // Determine event type and description based on mode
                var oldLaptopEventType = request.Mode == DeploymentMode.Offboarding
                    ? AssetEventType.DeviceOffboarded
                    : AssetEventType.LaptopSwapped;

                var oldLaptopEventDescription = request.Mode == DeploymentMode.Offboarding
                    ? $"Device offboarded - Status: {oldLaptopOldStatus} → {oldLaptopTargetStatus}, Owner: {oldLaptopOldOwner ?? "none"} → cleared"
                    : $"Laptop swapped out - Status: {oldLaptopOldStatus} → {oldLaptopTargetStatus}, Owner: {oldLaptopOldOwner ?? "none"} → cleared";

                // Create asset event for old laptop
                var oldLaptopEvent = new AssetEvent
                {
                    AssetId = oldLaptop.Id,
                    EventType = oldLaptopEventType,
                    Description = oldLaptopEventDescription,
                    OldValue = $"Status: {oldLaptopOldStatus}, Owner: {oldLaptopOldOwner}",
                    NewValue = $"Status: {oldLaptopTargetStatus}, Owner: null",
                    PerformedBy = performedBy,
                    PerformedByEmail = performedByEmail,
                    Notes = $"Part of deployment {deploymentId}. {request.Notes}",
                    EventDate = timestamp,
                    CreatedAt = timestamp
                };
                _context.AssetEvents.Add(oldLaptopEvent);

                oldLaptopSummary = new AssetDeploymentSummaryDto(
                    oldLaptop.Id,
                    oldLaptop.AssetCode,
                    oldLaptop.SerialNumber,
                    oldLaptopOldStatus,
                    oldLaptopTargetStatus.ToString(),
                    oldLaptopOldOwner,
                    null,
                    null
                );

                assetEvents.Add(new AssetEventSummaryDto(
                    oldLaptopEvent.Id,
                    oldLaptop.Id,
                    oldLaptopEventType.ToString(),
                    oldLaptopEvent.Description
                ));
            }

            // For Onboarding and Swap modes, process new laptop assignment
            if (request.Mode != DeploymentMode.Offboarding && newLaptop != null)
            {
                // Store new laptop old values for summary
                var newLaptopOldStatus = newLaptop.Status.ToString();
                var newLaptopOldOwner = newLaptop.Owner;

                // Update new laptop - assign to user
                newLaptop.Status = AssetStatus.InGebruik;
                newLaptop.Owner = request.NewOwnerEmail;
                newLaptop.JobTitle = request.NewOwnerJobTitle;
                newLaptop.OfficeLocation = request.NewOwnerOfficeLocation;
                newLaptop.InstallationDate = timestamp;
                newLaptop.UpdatedAt = timestamp;

                // Create asset event for new laptop
                var eventType = request.Mode == DeploymentMode.Onboarding
                    ? AssetEventType.DeviceOnboarded
                    : AssetEventType.LaptopSwapped;

                var eventDescription = request.Mode == DeploymentMode.Onboarding
                    ? $"Device onboarded - Status: {newLaptopOldStatus} → InGebruik, Owner: → {request.NewOwnerName}"
                    : $"Laptop swapped in - Status: {newLaptopOldStatus} → InGebruik, Owner: → {request.NewOwnerName}";

                var newLaptopEvent = new AssetEvent
                {
                    AssetId = newLaptop.Id,
                    EventType = eventType,
                    Description = eventDescription,
                    OldValue = $"Status: {newLaptopOldStatus}, Owner: {newLaptopOldOwner}",
                    NewValue = $"Status: InGebruik, Owner: {request.NewOwnerEmail}",
                    PerformedBy = performedBy,
                    PerformedByEmail = performedByEmail,
                    Notes = $"Part of deployment {deploymentId}. {request.Notes}",
                    EventDate = timestamp,
                    CreatedAt = timestamp
                };
                _context.AssetEvents.Add(newLaptopEvent);

                assetEvents.Add(new AssetEventSummaryDto(
                    newLaptopEvent.Id,
                    newLaptop.Id,
                    eventType.ToString(),
                    newLaptopEvent.Description
                ));

                newLaptopSummary = new AssetDeploymentSummaryDto(
                    newLaptop.Id,
                    newLaptop.AssetCode,
                    newLaptop.SerialNumber,
                    newLaptopOldStatus,
                    "InGebruik",
                    newLaptopOldOwner,
                    request.NewOwnerName,
                    timestamp
                );
            }

            // Handle physical workplace update if requested
            WorkplaceDeploymentSummaryDto? workplaceSummary = null;

            if (request.PhysicalWorkplaceId.HasValue)
            {
                var workplace = await _context.PhysicalWorkplaces
                    .Include(w => w.Building)
                    .FirstOrDefaultAsync(w => w.Id == request.PhysicalWorkplaceId.Value, cancellationToken);

                if (workplace == null)
                {
                    throw new ArgumentException($"Physical workplace with ID {request.PhysicalWorkplaceId} not found");
                }

                var previousOccupant = workplace.CurrentOccupantName;
                var occupantUpdated = false;
                var equipmentUpdated = false;

                // For Offboarding mode, clear the occupant if requested
                if (request.Mode == DeploymentMode.Offboarding && request.ClearWorkplaceOccupant)
                {
                    if (!string.IsNullOrEmpty(workplace.CurrentOccupantEntraId))
                    {
                        workplace.CurrentOccupantEntraId = null;
                        workplace.CurrentOccupantName = null;
                        workplace.CurrentOccupantEmail = null;
                        workplace.OccupiedSince = null;
                        occupantUpdated = true;
                    }
                }
                // For Onboarding and Swap modes, update occupant to new owner
                else if (request.Mode != DeploymentMode.Offboarding && workplace.CurrentOccupantEntraId != request.NewOwnerEntraId)
                {
                    workplace.CurrentOccupantEntraId = request.NewOwnerEntraId;
                    workplace.CurrentOccupantName = request.NewOwnerName;
                    workplace.CurrentOccupantEmail = request.NewOwnerEmail;
                    workplace.OccupiedSince = timestamp;
                    occupantUpdated = true;
                }

                // Update equipment slots if requested
                if (request.UpdateEquipmentSlots && request.EquipmentSlots != null)
                {
                    var slots = request.EquipmentSlots;

                    // Collect old and new asset IDs to update PhysicalWorkplaceId
                    var oldAssetIds = new List<int?>
                    {
                        workplace.DockingStationAssetId,
                        workplace.Monitor1AssetId,
                        workplace.Monitor2AssetId,
                        workplace.Monitor3AssetId,
                        workplace.KeyboardAssetId,
                        workplace.MouseAssetId
                    }.Where(id => id.HasValue).Select(id => id!.Value).ToHashSet();

                    var newAssetIds = new List<int?>
                    {
                        slots.DockingStationAssetId,
                        slots.Monitor1AssetId,
                        slots.Monitor2AssetId,
                        slots.Monitor3AssetId,
                        slots.KeyboardAssetId,
                        slots.MouseAssetId
                    }.Where(id => id.HasValue).Select(id => id!.Value).ToHashSet();

                    // Assets removed from workplace - clear PhysicalWorkplaceId
                    var removedAssetIds = oldAssetIds.Except(newAssetIds).ToList();
                    if (removedAssetIds.Any())
                    {
                        var removedAssets = await _context.Assets
                            .Where(a => removedAssetIds.Contains(a.Id))
                            .ToListAsync(cancellationToken);
                        foreach (var asset in removedAssets)
                        {
                            asset.PhysicalWorkplaceId = null;
                            asset.BuildingId = null;
                        }
                    }

                    // Assets added to workplace - set PhysicalWorkplaceId and BuildingId
                    var addedAssetIds = newAssetIds.Except(oldAssetIds).ToList();
                    if (addedAssetIds.Any())
                    {
                        var addedAssets = await _context.Assets
                            .Where(a => addedAssetIds.Contains(a.Id))
                            .ToListAsync(cancellationToken);
                        foreach (var asset in addedAssets)
                        {
                            asset.PhysicalWorkplaceId = workplace.Id;
                            asset.BuildingId = workplace.BuildingId;
                        }
                    }

                    // Track which slots changed
                    if (workplace.DockingStationAssetId != slots.DockingStationAssetId)
                    {
                        workplace.DockingStationAssetId = slots.DockingStationAssetId;
                        equipmentUpdated = true;
                    }
                    if (workplace.Monitor1AssetId != slots.Monitor1AssetId)
                    {
                        workplace.Monitor1AssetId = slots.Monitor1AssetId;
                        equipmentUpdated = true;
                    }
                    if (workplace.Monitor2AssetId != slots.Monitor2AssetId)
                    {
                        workplace.Monitor2AssetId = slots.Monitor2AssetId;
                        equipmentUpdated = true;
                    }
                    if (workplace.Monitor3AssetId != slots.Monitor3AssetId)
                    {
                        workplace.Monitor3AssetId = slots.Monitor3AssetId;
                        equipmentUpdated = true;
                    }
                    if (workplace.KeyboardAssetId != slots.KeyboardAssetId)
                    {
                        workplace.KeyboardAssetId = slots.KeyboardAssetId;
                        equipmentUpdated = true;
                    }
                    if (workplace.MouseAssetId != slots.MouseAssetId)
                    {
                        workplace.MouseAssetId = slots.MouseAssetId;
                        equipmentUpdated = true;
                    }
                }

                workplace.UpdatedAt = timestamp;

                // For offboarding with clear occupant, new occupant should be null
                var newOccupantName = request.Mode == DeploymentMode.Offboarding && request.ClearWorkplaceOccupant
                    ? null
                    : request.NewOwnerName;

                workplaceSummary = new WorkplaceDeploymentSummaryDto(
                    workplace.Id,
                    workplace.Code,
                    workplace.Name,
                    equipmentUpdated,
                    occupantUpdated,
                    previousOccupant,
                    newOccupantName
                );
            }

            // Save all changes
            await _context.SaveChangesAsync(cancellationToken);

            // Commit transaction
            await transaction.CommitAsync(cancellationToken);

            _logger.LogInformation(
                "Deployment {DeploymentId} completed successfully. Mode={Mode}, NewLaptop={NewLaptop}, OldLaptop={OldLaptop}",
                deploymentId, request.Mode, newLaptop?.AssetCode ?? "N/A", oldLaptop?.AssetCode ?? "N/A");

            return new DeploymentResultDto(
                true,
                deploymentId,
                request.Mode,
                oldLaptopSummary,
                newLaptopSummary,
                workplaceSummary,
                assetEvents,
                timestamp
            );
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync(cancellationToken);

            _logger.LogError(ex, "Deployment {DeploymentId} failed: {Message}", deploymentId, ex.Message);
            throw;
        }
    }

    /// <inheritdoc />
    public async Task<OccupantConflictDto?> CheckOccupantConflictAsync(
        int physicalWorkplaceId,
        string requestedOwnerEntraId,
        string requestedOwnerName,
        string requestedOwnerEmail,
        CancellationToken cancellationToken = default)
    {
        var workplace = await _context.PhysicalWorkplaces
            .AsNoTracking()
            .FirstOrDefaultAsync(w => w.Id == physicalWorkplaceId, cancellationToken);

        if (workplace == null)
        {
            return null;
        }

        // No conflict if workplace is unoccupied
        if (string.IsNullOrEmpty(workplace.CurrentOccupantEntraId))
        {
            return null;
        }

        // No conflict if same person
        if (workplace.CurrentOccupantEntraId == requestedOwnerEntraId)
        {
            return null;
        }

        // Different occupant - return conflict info
        return new OccupantConflictDto(
            workplace.CurrentOccupantName ?? "Unknown",
            workplace.CurrentOccupantEmail,
            workplace.OccupiedSince,
            requestedOwnerName,
            requestedOwnerEmail
        );
    }

    /// <inheritdoc />
    public async Task<DeploymentHistoryResultDto> GetDeploymentHistoryAsync(
        DateTime? fromDate,
        DateTime? toDate,
        string? ownerEmail,
        DeploymentMode? mode,
        int pageNumber,
        int pageSize,
        CancellationToken cancellationToken = default)
    {
        // Ensure valid pagination
        pageNumber = Math.Max(1, pageNumber);
        pageSize = Math.Clamp(pageSize, 1, 200);

        // Filter by deployment event types
        var eventTypes = new List<AssetEventType>();
        if (mode == null)
        {
            eventTypes.Add(AssetEventType.LaptopSwapped);
            eventTypes.Add(AssetEventType.DeviceOnboarded);
            eventTypes.Add(AssetEventType.DeviceOffboarded);
        }
        else if (mode == DeploymentMode.Swap)
        {
            eventTypes.Add(AssetEventType.LaptopSwapped);
        }
        else if (mode == DeploymentMode.Offboarding)
        {
            eventTypes.Add(AssetEventType.DeviceOffboarded);
        }
        else
        {
            eventTypes.Add(AssetEventType.DeviceOnboarded);
        }

        // Build query for deployment events
        var query = _context.AssetEvents
            .AsNoTracking()
            .Include(e => e.Asset)
                .ThenInclude(a => a.AssetType)
            .Where(e => eventTypes.Contains(e.EventType));

        // Apply date filters
        if (fromDate.HasValue)
        {
            query = query.Where(e => e.EventDate >= fromDate.Value);
        }
        if (toDate.HasValue)
        {
            query = query.Where(e => e.EventDate <= toDate.Value);
        }

        // Apply owner filter
        if (!string.IsNullOrEmpty(ownerEmail))
        {
            query = query.Where(e => e.NewValue != null && e.NewValue.Contains(ownerEmail));
        }

        // Get total count
        var totalCount = await query.CountAsync(cancellationToken);
        var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);

        // Get paged results
        var events = await query
            .OrderByDescending(e => e.EventDate)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        // Map to DTOs
        var items = events.Select(e => MapToHistoryItem(e)).ToList();

        return new DeploymentHistoryResultDto(
            items,
            pageNumber,
            pageSize,
            totalCount,
            totalPages
        );
    }

    private static DeploymentHistoryItemDto MapToHistoryItem(AssetEvent evt)
    {
        // Parse the new value to extract owner email
        // NewValue format: "Status: InGebruik, Owner: email@example.com"
        var ownerEmail = "";
        if (!string.IsNullOrEmpty(evt.NewValue))
        {
            var ownerMatch = evt.NewValue.Split("Owner: ");
            if (ownerMatch.Length > 1)
            {
                ownerEmail = ownerMatch[1].Trim();
            }
        }

        // Get owner name from description
        // Description formats:
        // - Onboarding: "Device onboarded - Status: Stock → InGebruik, Owner: → Jo Wijnen"
        // - Swap: "Laptop swapped in - Status: Nieuw → InGebruik, Owner: → Jo Wijnen"
        // - Offboarding: "Device offboarded - Status: InGebruik → Stock, Owner: jo@email.com → cleared"
        var ownerName = "";
        if (!string.IsNullOrEmpty(evt.Description))
        {
            // Split by "Owner: " first, then get after the last " → "
            var ownerParts = evt.Description.Split("Owner: ");
            if (ownerParts.Length > 1)
            {
                var afterOwner = ownerParts[1]; // e.g., "→ Jo Wijnen" or "jo@email.com → cleared"
                var arrowParts = afterOwner.Split(" → ");
                if (arrowParts.Length > 1)
                {
                    ownerName = arrowParts[^1].Trim(); // Last part after arrow
                    // For offboarding, "cleared" is not a name
                    if (ownerName.Equals("cleared", StringComparison.OrdinalIgnoreCase))
                    {
                        // For offboarding, get the previous owner from before the arrow
                        ownerName = arrowParts[0].Trim();
                        ownerEmail = arrowParts[0].Trim(); // Often the email for offboarding
                    }
                }
                else
                {
                    ownerName = afterOwner.Trim();
                }
            }
        }

        var deploymentMode = evt.EventType switch
        {
            AssetEventType.DeviceOnboarded => DeploymentMode.Onboarding,
            AssetEventType.DeviceOffboarded => DeploymentMode.Offboarding,
            _ => DeploymentMode.Swap
        };

        // For the new laptop field, show the asset being processed
        // For offboarding, this is actually the "old" device being returned
        var assetInfo = new DeploymentAssetInfoDto(
            evt.AssetId,
            evt.Asset?.AssetCode ?? "",
            evt.Asset?.SerialNumber,
            evt.Asset?.Brand,
            evt.Asset?.Model,
            ParseStatusFromValue(evt.OldValue),
            ParseStatusFromValue(evt.NewValue)
        );

        // For offboarding, the asset shown is actually the old device (being returned)
        // For onboarding/swap, this is the new device being assigned
        DeploymentAssetInfoDto? oldLaptopInfo = null;
        DeploymentAssetInfoDto? newLaptopInfo = assetInfo;

        if (deploymentMode == DeploymentMode.Offboarding)
        {
            // For offboarding, the recorded asset is the OLD device being returned
            oldLaptopInfo = assetInfo;
            newLaptopInfo = null;
        }

        return new DeploymentHistoryItemDto(
            evt.Id,
            evt.EventDate,
            deploymentMode,
            oldLaptopInfo,
            newLaptopInfo,
            new DeploymentOwnerInfoDto(ownerName, ownerEmail, null),
            null, // Workplace info would need separate tracking
            evt.PerformedBy,
            evt.PerformedByEmail,
            evt.Notes
        );
    }

    private static string ParseStatusFromValue(string? value)
    {
        if (string.IsNullOrEmpty(value)) return "";

        // Value format: "Status: StatusName, Owner: ..."
        var parts = value.Split(',');
        if (parts.Length > 0)
        {
            var statusPart = parts[0].Replace("Status: ", "").Trim();
            return statusPart;
        }
        return "";
    }
}

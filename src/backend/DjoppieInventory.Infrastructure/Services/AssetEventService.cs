using System.Text.Json;
using DjoppieInventory.Core.Entities;
using DjoppieInventory.Core.Interfaces;
using Microsoft.Extensions.Logging;

namespace DjoppieInventory.Infrastructure.Services;

/// <summary>
/// Service for managing asset events and audit trail.
/// Automatically creates events when asset changes occur.
/// </summary>
public class AssetEventService : IAssetEventService
{
    private readonly IAssetEventRepository _assetEventRepository;
    private readonly ILogger<AssetEventService> _logger;

    public AssetEventService(
        IAssetEventRepository assetEventRepository,
        ILogger<AssetEventService> logger)
    {
        _assetEventRepository = assetEventRepository;
        _logger = logger;
    }

    public async Task<AssetEvent> CreateEventAsync(
        int assetId,
        AssetEventType eventType,
        string description,
        string? oldValue,
        string? newValue,
        string performedBy,
        string? performedByEmail,
        string? notes = null,
        CancellationToken cancellationToken = default)
    {
        var assetEvent = new AssetEvent
        {
            AssetId = assetId,
            EventType = eventType,
            Description = description,
            OldValue = oldValue,
            NewValue = newValue,
            PerformedBy = performedBy,
            PerformedByEmail = performedByEmail,
            Notes = notes,
            EventDate = DateTime.UtcNow
        };

        var createdEvent = await _assetEventRepository.CreateAsync(assetEvent, cancellationToken);

        _logger.LogInformation(
            "Created {EventType} event for asset {AssetId} by {PerformedBy}",
            eventType, assetId, performedBy);

        return createdEvent;
    }

    public async Task<AssetEvent> CreateCreatedEventAsync(
        int assetId,
        string performedBy,
        string? performedByEmail,
        string? notes = null,
        CancellationToken cancellationToken = default)
    {
        var description = $"Asset created by {performedBy}";

        return await CreateEventAsync(
            assetId,
            AssetEventType.Created,
            description,
            oldValue: null,
            newValue: "Created",
            performedBy,
            performedByEmail,
            notes,
            cancellationToken);
    }

    public async Task<AssetEvent> CreateStatusChangedEventAsync(
        int assetId,
        AssetStatus oldStatus,
        AssetStatus newStatus,
        string performedBy,
        string? performedByEmail,
        string? notes = null,
        CancellationToken cancellationToken = default)
    {
        var description = $"Status changed from {oldStatus} to {newStatus}";

        return await CreateEventAsync(
            assetId,
            AssetEventType.StatusChanged,
            description,
            oldValue: oldStatus.ToString(),
            newValue: newStatus.ToString(),
            performedBy,
            performedByEmail,
            notes,
            cancellationToken);
    }

    public async Task<AssetEvent> CreateOwnerChangedEventAsync(
        int assetId,
        string? oldOwner,
        string? newOwner,
        string performedBy,
        string? performedByEmail,
        string? notes = null,
        CancellationToken cancellationToken = default)
    {
        var oldOwnerDisplay = string.IsNullOrWhiteSpace(oldOwner) ? "(unassigned)" : oldOwner;
        var newOwnerDisplay = string.IsNullOrWhiteSpace(newOwner) ? "(unassigned)" : newOwner;
        var description = $"Owner changed from {oldOwnerDisplay} to {newOwnerDisplay}";

        return await CreateEventAsync(
            assetId,
            AssetEventType.OwnerChanged,
            description,
            oldValue: oldOwner,
            newValue: newOwner,
            performedBy,
            performedByEmail,
            notes,
            cancellationToken);
    }

    public async Task<AssetEvent> CreateLocationChangedEventAsync(
        int assetId,
        string? oldLocation,
        string? newLocation,
        string performedBy,
        string? performedByEmail,
        string? notes = null,
        CancellationToken cancellationToken = default)
    {
        var oldLocationDisplay = string.IsNullOrWhiteSpace(oldLocation) ? "(not set)" : oldLocation;
        var newLocationDisplay = string.IsNullOrWhiteSpace(newLocation) ? "(not set)" : newLocation;
        var description = $"Location changed from {oldLocationDisplay} to {newLocationDisplay}";

        return await CreateEventAsync(
            assetId,
            AssetEventType.LocationChanged,
            description,
            oldValue: oldLocation,
            newValue: newLocation,
            performedBy,
            performedByEmail,
            notes,
            cancellationToken);
    }

    public async Task<AssetEvent?> CreateIntuneSnapshotEventAsync(
        Asset asset,
        string reason,
        string performedBy,
        string? performedByEmail,
        CancellationToken cancellationToken = default)
    {
        // Only create snapshot if there's Intune data to preserve
        if (!asset.IntuneEnrollmentDate.HasValue &&
            !asset.IntuneLastCheckIn.HasValue &&
            !asset.IntuneCertificateExpiry.HasValue)
        {
            _logger.LogDebug(
                "No Intune data to snapshot for asset {AssetId} ({AssetCode})",
                asset.Id, asset.AssetCode);
            return null;
        }

        // Create a snapshot object with all relevant data
        var snapshot = new
        {
            Owner = asset.Owner,
            Status = asset.Status.ToString(),
            IntuneEnrollmentDate = asset.IntuneEnrollmentDate,
            IntuneLastCheckIn = asset.IntuneLastCheckIn,
            IntuneCertificateExpiry = asset.IntuneCertificateExpiry,
            IntuneSyncedAt = asset.IntuneSyncedAt,
            SnapshotReason = reason,
            SnapshotTakenAt = DateTime.UtcNow
        };

        var snapshotJson = JsonSerializer.Serialize(snapshot, new JsonSerializerOptions
        {
            WriteIndented = false,
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        });

        var description = $"Intune data snapshot: {reason}";
        if (!string.IsNullOrWhiteSpace(asset.Owner))
        {
            description += $" (Owner: {asset.Owner})";
        }

        var assetEvent = await CreateEventAsync(
            asset.Id,
            AssetEventType.IntuneSnapshot,
            description,
            oldValue: snapshotJson,
            newValue: null,
            performedBy,
            performedByEmail,
            notes: $"Enrollment: {asset.IntuneEnrollmentDate?.ToString("yyyy-MM-dd") ?? "N/A"}, " +
                   $"Last Check-in: {asset.IntuneLastCheckIn?.ToString("yyyy-MM-dd HH:mm") ?? "N/A"}, " +
                   $"Certificate Expiry: {asset.IntuneCertificateExpiry?.ToString("yyyy-MM-dd") ?? "N/A"}",
            cancellationToken);

        _logger.LogInformation(
            "Created Intune snapshot for asset {AssetId} ({AssetCode}): {Reason}",
            asset.Id, asset.AssetCode, reason);

        return assetEvent;
    }
}

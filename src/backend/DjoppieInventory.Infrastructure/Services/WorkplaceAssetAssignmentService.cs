using DjoppieInventory.Core.DTOs;
using DjoppieInventory.Core.Entities;
using DjoppieInventory.Core.Entities.Enums;
using DjoppieInventory.Core.Interfaces;
using DjoppieInventory.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace DjoppieInventory.Infrastructure.Services;

/// <summary>
/// Service implementation for managing workplace asset assignments.
/// Replaces JSON-based AssetPlansJson with proper relational management.
/// </summary>
public class WorkplaceAssetAssignmentService : IWorkplaceAssetAssignmentService
{
    private readonly ApplicationDbContext _context;
    private readonly IAssetMovementService _movementService;
    private readonly IAssetCodeGenerator _assetCodeGenerator;
    private readonly ILogger<WorkplaceAssetAssignmentService> _logger;

    public WorkplaceAssetAssignmentService(
        ApplicationDbContext context,
        IAssetMovementService movementService,
        IAssetCodeGenerator assetCodeGenerator,
        ILogger<WorkplaceAssetAssignmentService> logger)
    {
        _context = context ?? throw new ArgumentNullException(nameof(context));
        _movementService = movementService ?? throw new ArgumentNullException(nameof(movementService));
        _assetCodeGenerator = assetCodeGenerator ?? throw new ArgumentNullException(nameof(assetCodeGenerator));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    /// <inheritdoc/>
    public async Task<IEnumerable<WorkplaceAssetAssignmentDto>> GetByWorkplaceIdAsync(
        int workplaceId,
        CancellationToken cancellationToken = default)
    {
        var assignments = await _context.WorkplaceAssetAssignments
            .Include(a => a.AssetType)
            .Include(a => a.NewAsset)
            .Include(a => a.OldAsset)
            .Include(a => a.AssetTemplate)
            .Where(a => a.RolloutWorkplaceId == workplaceId)
            .OrderBy(a => a.Position)
            .ThenBy(a => a.Id)
            .ToListAsync(cancellationToken);

        return assignments.Select(MapToDto);
    }

    /// <inheritdoc/>
    public async Task<WorkplaceAssetAssignmentDto?> GetByIdAsync(
        int assignmentId,
        CancellationToken cancellationToken = default)
    {
        var assignment = await _context.WorkplaceAssetAssignments
            .Include(a => a.AssetType)
            .Include(a => a.NewAsset)
            .Include(a => a.OldAsset)
            .Include(a => a.AssetTemplate)
            .FirstOrDefaultAsync(a => a.Id == assignmentId, cancellationToken);

        return assignment == null ? null : MapToDto(assignment);
    }

    /// <inheritdoc/>
    public async Task<WorkplaceAssetAssignmentDto> CreateAsync(
        CreateWorkplaceAssetAssignmentRequest request,
        CancellationToken cancellationToken = default)
    {
        // Validate workplace exists
        var workplace = await _context.RolloutWorkplaces
            .FirstOrDefaultAsync(w => w.Id == request.RolloutWorkplaceId, cancellationToken);

        if (workplace == null)
        {
            throw new InvalidOperationException($"Workplace with ID {request.RolloutWorkplaceId} not found");
        }

        // Validate asset type exists
        var assetType = await _context.AssetTypes
            .FirstOrDefaultAsync(t => t.Id == request.AssetTypeId, cancellationToken);

        if (assetType == null)
        {
            throw new InvalidOperationException($"Asset type with ID {request.AssetTypeId} not found");
        }

        var assignment = new WorkplaceAssetAssignment
        {
            RolloutWorkplaceId = request.RolloutWorkplaceId,
            AssetTypeId = request.AssetTypeId,
            AssignmentCategory = request.AssignmentCategory,
            SourceType = request.SourceType,
            NewAssetId = request.NewAssetId,
            OldAssetId = request.OldAssetId,
            AssetTemplateId = request.AssetTemplateId,
            Position = request.Position,
            SerialNumberRequired = request.SerialNumberRequired,
            QRCodeRequired = request.QRCodeRequired,
            Status = AssetAssignmentStatus.Pending,
            Notes = request.Notes,
            MetadataJson = request.MetadataJson,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.WorkplaceAssetAssignments.Add(assignment);

        // Update workplace total items
        workplace.TotalItems++;
        workplace.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        // Reload with includes
        await _context.Entry(assignment)
            .Reference(a => a.AssetType)
            .LoadAsync(cancellationToken);

        if (assignment.NewAssetId.HasValue)
        {
            await _context.Entry(assignment)
                .Reference(a => a.NewAsset)
                .LoadAsync(cancellationToken);
        }

        _logger.LogInformation(
            "Created assignment {AssignmentId} for workplace {WorkplaceId} with asset type {AssetTypeName}",
            assignment.Id, request.RolloutWorkplaceId, assetType.Name);

        return MapToDto(assignment);
    }

    /// <inheritdoc/>
    public async Task<IEnumerable<WorkplaceAssetAssignmentDto>> BulkCreateAsync(
        int workplaceId,
        IEnumerable<CreateWorkplaceAssetAssignmentRequest> requests,
        CancellationToken cancellationToken = default)
    {
        var workplace = await _context.RolloutWorkplaces
            .FirstOrDefaultAsync(w => w.Id == workplaceId, cancellationToken);

        if (workplace == null)
        {
            throw new InvalidOperationException($"Workplace with ID {workplaceId} not found");
        }

        var requestList = requests.ToList();
        var assignments = new List<WorkplaceAssetAssignment>();

        foreach (var request in requestList)
        {
            request.RolloutWorkplaceId = workplaceId;

            var assignment = new WorkplaceAssetAssignment
            {
                RolloutWorkplaceId = workplaceId,
                AssetTypeId = request.AssetTypeId,
                AssignmentCategory = request.AssignmentCategory,
                SourceType = request.SourceType,
                NewAssetId = request.NewAssetId,
                OldAssetId = request.OldAssetId,
                AssetTemplateId = request.AssetTemplateId,
                Position = request.Position,
                SerialNumberRequired = request.SerialNumberRequired,
                QRCodeRequired = request.QRCodeRequired,
                Status = AssetAssignmentStatus.Pending,
                Notes = request.Notes,
                MetadataJson = request.MetadataJson,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.WorkplaceAssetAssignments.Add(assignment);
            assignments.Add(assignment);
        }

        workplace.TotalItems += requestList.Count;
        workplace.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "Bulk created {Count} assignments for workplace {WorkplaceId}",
            assignments.Count, workplaceId);

        // Return with full details
        return await GetByWorkplaceIdAsync(workplaceId, cancellationToken);
    }

    /// <inheritdoc/>
    public async Task<WorkplaceAssetAssignmentDto> UpdateStatusAsync(
        int assignmentId,
        UpdateAssignmentStatusRequest request,
        string performedBy,
        string performedByEmail,
        CancellationToken cancellationToken = default)
    {
        var assignment = await _context.WorkplaceAssetAssignments
            .Include(a => a.AssetType)
            .Include(a => a.NewAsset)
            .Include(a => a.OldAsset)
            .Include(a => a.RolloutWorkplace)
                .ThenInclude(w => w.RolloutDay)
            .FirstOrDefaultAsync(a => a.Id == assignmentId, cancellationToken);

        if (assignment == null)
        {
            throw new InvalidOperationException($"Assignment with ID {assignmentId} not found");
        }

        var previousStatus = assignment.Status;
        assignment.Status = request.Status;
        assignment.SerialNumberCaptured = request.SerialNumberCaptured ?? assignment.SerialNumberCaptured;
        assignment.UpdatedAt = DateTime.UtcNow;

        if (request.Status == AssetAssignmentStatus.Installed)
        {
            assignment.InstalledAt = DateTime.UtcNow;
            assignment.InstalledBy = performedBy;
            assignment.InstalledByEmail = performedByEmail;

            // Update workplace completed items
            if (previousStatus != AssetAssignmentStatus.Installed)
            {
                assignment.RolloutWorkplace.CompletedItems++;
                assignment.RolloutWorkplace.UpdatedAt = DateTime.UtcNow;
            }

            // Record deployment movement if new asset is assigned
            if (assignment.NewAssetId.HasValue && assignment.NewAsset != null)
            {
                var sessionId = assignment.RolloutWorkplace.RolloutDay.RolloutSessionId;
                var deploymentRequest = new AssetDeploymentRequest
                {
                    RolloutSessionId = sessionId,
                    RolloutWorkplaceId = assignment.RolloutWorkplaceId,
                    WorkplaceAssetAssignmentId = assignmentId,
                    AssetId = assignment.NewAssetId.Value,
                    NewOwner = assignment.RolloutWorkplace.UserName,
                    NewServiceId = assignment.RolloutWorkplace.ServiceId,
                    NewLocation = assignment.RolloutWorkplace.Location,
                    Notes = request.Notes
                };

                await _movementService.RecordDeploymentAsync(
                    deploymentRequest,
                    performedBy,
                    performedByEmail,
                    cancellationToken);
            }

            // Record decommission movement if old asset is being replaced
            if (assignment.OldAssetId.HasValue)
            {
                var sessionId = assignment.RolloutWorkplace.RolloutDay.RolloutSessionId;
                var decommissionRequest = new AssetDecommissionRequest
                {
                    RolloutSessionId = sessionId,
                    RolloutWorkplaceId = assignment.RolloutWorkplaceId,
                    WorkplaceAssetAssignmentId = assignmentId,
                    AssetId = assignment.OldAssetId.Value,
                    TargetStatus = AssetStatus.UitDienst,
                    Notes = $"Replaced during rollout - {request.Notes}"
                };

                await _movementService.RecordDecommissionAsync(
                    decommissionRequest,
                    performedBy,
                    performedByEmail,
                    cancellationToken);
            }
        }

        if (request.Notes != null)
        {
            assignment.Notes = string.IsNullOrEmpty(assignment.Notes)
                ? request.Notes
                : $"{assignment.Notes}\n{request.Notes}";
        }

        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "Updated assignment {AssignmentId} status from {PreviousStatus} to {NewStatus} by {PerformedBy}",
            assignmentId, previousStatus, request.Status, performedBy);

        return MapToDto(assignment);
    }

    /// <inheritdoc/>
    public async Task<WorkplaceAssetAssignmentDto> UpdateAsync(
        int assignmentId,
        UpdateWorkplaceAssetAssignmentRequest request,
        CancellationToken cancellationToken = default)
    {
        var assignment = await _context.WorkplaceAssetAssignments
            .Include(a => a.AssetType)
            .Include(a => a.NewAsset)
            .Include(a => a.OldAsset)
            .Include(a => a.AssetTemplate)
            .FirstOrDefaultAsync(a => a.Id == assignmentId, cancellationToken);

        if (assignment == null)
        {
            throw new InvalidOperationException($"Assignment with ID {assignmentId} not found");
        }

        if (request.AssignmentCategory.HasValue)
            assignment.AssignmentCategory = request.AssignmentCategory.Value;

        if (request.SourceType.HasValue)
            assignment.SourceType = request.SourceType.Value;

        if (request.NewAssetId.HasValue)
            assignment.NewAssetId = request.NewAssetId.Value;

        if (request.OldAssetId.HasValue)
            assignment.OldAssetId = request.OldAssetId.Value;

        if (request.AssetTemplateId.HasValue)
            assignment.AssetTemplateId = request.AssetTemplateId.Value;

        if (request.Position.HasValue)
            assignment.Position = request.Position.Value;

        if (request.SerialNumberRequired.HasValue)
            assignment.SerialNumberRequired = request.SerialNumberRequired.Value;

        if (request.QRCodeRequired.HasValue)
            assignment.QRCodeRequired = request.QRCodeRequired.Value;

        if (request.Notes != null)
            assignment.Notes = request.Notes;

        if (request.MetadataJson != null)
            assignment.MetadataJson = request.MetadataJson;

        assignment.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        // Reload relationships if changed
        if (request.NewAssetId.HasValue)
        {
            await _context.Entry(assignment)
                .Reference(a => a.NewAsset)
                .LoadAsync(cancellationToken);
        }

        if (request.OldAssetId.HasValue)
        {
            await _context.Entry(assignment)
                .Reference(a => a.OldAsset)
                .LoadAsync(cancellationToken);
        }

        if (request.AssetTemplateId.HasValue)
        {
            await _context.Entry(assignment)
                .Reference(a => a.AssetTemplate)
                .LoadAsync(cancellationToken);
        }

        _logger.LogInformation("Updated assignment {AssignmentId}", assignmentId);

        return MapToDto(assignment);
    }

    /// <inheritdoc/>
    public async Task DeleteAsync(
        int assignmentId,
        CancellationToken cancellationToken = default)
    {
        var assignment = await _context.WorkplaceAssetAssignments
            .Include(a => a.RolloutWorkplace)
            .FirstOrDefaultAsync(a => a.Id == assignmentId, cancellationToken);

        if (assignment == null)
        {
            throw new InvalidOperationException($"Assignment with ID {assignmentId} not found");
        }

        // Update workplace totals
        assignment.RolloutWorkplace.TotalItems--;
        if (assignment.Status == AssetAssignmentStatus.Installed)
        {
            assignment.RolloutWorkplace.CompletedItems--;
        }
        assignment.RolloutWorkplace.UpdatedAt = DateTime.UtcNow;

        _context.WorkplaceAssetAssignments.Remove(assignment);
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Deleted assignment {AssignmentId}", assignmentId);
    }

    /// <inheritdoc/>
    public async Task DeleteByWorkplaceIdAsync(
        int workplaceId,
        CancellationToken cancellationToken = default)
    {
        var assignments = await _context.WorkplaceAssetAssignments
            .Where(a => a.RolloutWorkplaceId == workplaceId)
            .ToListAsync(cancellationToken);

        var workplace = await _context.RolloutWorkplaces
            .FirstOrDefaultAsync(w => w.Id == workplaceId, cancellationToken);

        if (workplace != null)
        {
            workplace.TotalItems = 0;
            workplace.CompletedItems = 0;
            workplace.UpdatedAt = DateTime.UtcNow;
        }

        _context.WorkplaceAssetAssignments.RemoveRange(assignments);
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "Deleted {Count} assignments for workplace {WorkplaceId}",
            assignments.Count, workplaceId);
    }

    /// <inheritdoc/>
    public async Task<WorkplaceAssetAssignmentDto> AssignExistingAssetAsync(
        int assignmentId,
        int assetId,
        CancellationToken cancellationToken = default)
    {
        var assignment = await _context.WorkplaceAssetAssignments
            .Include(a => a.AssetType)
            .FirstOrDefaultAsync(a => a.Id == assignmentId, cancellationToken);

        if (assignment == null)
        {
            throw new InvalidOperationException($"Assignment with ID {assignmentId} not found");
        }

        var asset = await _context.Assets
            .FirstOrDefaultAsync(a => a.Id == assetId, cancellationToken);

        if (asset == null)
        {
            throw new InvalidOperationException($"Asset with ID {assetId} not found");
        }

        assignment.NewAssetId = assetId;
        assignment.SourceType = AssetSourceType.ExistingInventory;
        assignment.UpdatedAt = DateTime.UtcNow;

        // Link asset to this assignment
        asset.CurrentWorkplaceAssignmentId = assignmentId;
        asset.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        await _context.Entry(assignment)
            .Reference(a => a.NewAsset)
            .LoadAsync(cancellationToken);

        _logger.LogInformation(
            "Assigned existing asset {AssetCode} to assignment {AssignmentId}",
            asset.AssetCode, assignmentId);

        return MapToDto(assignment);
    }

    /// <inheritdoc/>
    public async Task<WorkplaceAssetAssignmentDto> SetOldAssetAsync(
        int assignmentId,
        int oldAssetId,
        CancellationToken cancellationToken = default)
    {
        var assignment = await _context.WorkplaceAssetAssignments
            .Include(a => a.AssetType)
            .Include(a => a.NewAsset)
            .FirstOrDefaultAsync(a => a.Id == assignmentId, cancellationToken);

        if (assignment == null)
        {
            throw new InvalidOperationException($"Assignment with ID {assignmentId} not found");
        }

        var oldAsset = await _context.Assets
            .FirstOrDefaultAsync(a => a.Id == oldAssetId, cancellationToken);

        if (oldAsset == null)
        {
            throw new InvalidOperationException($"Asset with ID {oldAssetId} not found");
        }

        assignment.OldAssetId = oldAssetId;
        assignment.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        await _context.Entry(assignment)
            .Reference(a => a.OldAsset)
            .LoadAsync(cancellationToken);

        _logger.LogInformation(
            "Set old asset {AssetCode} for assignment {AssignmentId}",
            oldAsset.AssetCode, assignmentId);

        return MapToDto(assignment);
    }

    /// <inheritdoc/>
    public async Task<WorkplaceAssetAssignmentDto> CreateAssetFromTemplateAsync(
        int assignmentId,
        string serialNumber,
        string performedBy,
        string performedByEmail,
        CancellationToken cancellationToken = default)
    {
        var assignment = await _context.WorkplaceAssetAssignments
            .Include(a => a.AssetType)
            .Include(a => a.AssetTemplate)
            .Include(a => a.RolloutWorkplace)
            .FirstOrDefaultAsync(a => a.Id == assignmentId, cancellationToken);

        if (assignment == null)
        {
            throw new InvalidOperationException($"Assignment with ID {assignmentId} not found");
        }

        if (assignment.AssetTemplateId == null || assignment.AssetTemplate == null)
        {
            throw new InvalidOperationException("Assignment does not have a template configured");
        }

        var template = assignment.AssetTemplate;

        // Generate asset code using the new format
        var assetCode = await _assetCodeGenerator.GenerateCodeAsync(
            assignment.AssetTypeId,
            template.Brand,
            DateTime.UtcNow,
            false,
            cancellationToken);

        // Create new asset from template
        var asset = new Asset
        {
            AssetCode = assetCode,
            AssetName = template.AssetName ?? $"{template.TemplateName} - {assignment.RolloutWorkplace.UserName}",
            Category = template.Category ?? string.Empty,
            AssetTypeId = assignment.AssetTypeId,
            Brand = template.Brand,
            Model = template.Model,
            SerialNumber = serialNumber,
            Owner = assignment.RolloutWorkplace.UserName,
            ServiceId = assignment.RolloutWorkplace.ServiceId,
            InstallationLocation = assignment.RolloutWorkplace.Location,
            Status = AssetStatus.Nieuw,
            CurrentWorkplaceAssignmentId = assignmentId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Assets.Add(asset);
        await _context.SaveChangesAsync(cancellationToken);

        // Link to assignment
        assignment.NewAssetId = asset.Id;
        assignment.SerialNumberCaptured = serialNumber;
        assignment.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        await _context.Entry(assignment)
            .Reference(a => a.NewAsset)
            .LoadAsync(cancellationToken);

        _logger.LogInformation(
            "Created asset {AssetCode} from template {TemplateName} for assignment {AssignmentId} by {PerformedBy}",
            assetCode, template.TemplateName, assignmentId, performedBy);

        return MapToDto(assignment);
    }

    /// <inheritdoc/>
    public async Task<WorkplaceAssignmentSummaryDto> GetSummaryAsync(
        int workplaceId,
        CancellationToken cancellationToken = default)
    {
        var assignments = await _context.WorkplaceAssetAssignments
            .Include(a => a.AssetType)
            .Where(a => a.RolloutWorkplaceId == workplaceId)
            .ToListAsync(cancellationToken);

        var summary = new WorkplaceAssignmentSummaryDto
        {
            WorkplaceId = workplaceId,
            TotalAssignments = assignments.Count,
            PendingAssignments = assignments.Count(a => a.Status == AssetAssignmentStatus.Pending),
            InstalledAssignments = assignments.Count(a => a.Status == AssetAssignmentStatus.Installed),
            SkippedAssignments = assignments.Count(a => a.Status == AssetAssignmentStatus.Skipped),
            FailedAssignments = assignments.Count(a => a.Status == AssetAssignmentStatus.Failed),
            SerialNumbersRequired = assignments.Count(a => a.SerialNumberRequired),
            SerialNumbersCaptured = assignments.Count(a => !string.IsNullOrEmpty(a.SerialNumberCaptured)),
            ByAssetType = assignments
                .GroupBy(a => new { a.AssetTypeId, a.AssetType.Name })
                .Select(g => new AssignmentByAssetTypeDto
                {
                    AssetTypeId = g.Key.AssetTypeId,
                    AssetTypeName = g.Key.Name,
                    Total = g.Count(),
                    Installed = g.Count(a => a.Status == AssetAssignmentStatus.Installed),
                    Pending = g.Count(a => a.Status == AssetAssignmentStatus.Pending)
                })
                .OrderBy(x => x.AssetTypeName)
                .ToList()
        };

        return summary;
    }

    /// <inheritdoc/>
    public async Task<int> CompleteWorkplaceAssignmentsAsync(
        int workplaceId,
        string performedBy,
        string performedByEmail,
        CancellationToken cancellationToken = default)
    {
        var pendingAssignments = await _context.WorkplaceAssetAssignments
            .Include(a => a.RolloutWorkplace)
                .ThenInclude(w => w.RolloutDay)
            .Include(a => a.AssetType)
            .Include(a => a.NewAsset)
            .Include(a => a.OldAsset)
            .Where(a => a.RolloutWorkplaceId == workplaceId &&
                       a.Status == AssetAssignmentStatus.Pending)
            .ToListAsync(cancellationToken);

        var completedCount = 0;

        foreach (var assignment in pendingAssignments)
        {
            var request = new UpdateAssignmentStatusRequest
            {
                Status = AssetAssignmentStatus.Installed,
                Notes = "Auto-completed with workplace"
            };

            await UpdateStatusAsync(
                assignment.Id,
                request,
                performedBy,
                performedByEmail,
                cancellationToken);

            completedCount++;
        }

        // Update PhysicalWorkplace with occupant and fixed assets
        await UpdatePhysicalWorkplaceAsync(workplaceId, cancellationToken);

        _logger.LogInformation(
            "Completed {Count} pending assignments for workplace {WorkplaceId} by {PerformedBy}",
            completedCount, workplaceId, performedBy);

        return completedCount;
    }

    /// <summary>
    /// Updates the PhysicalWorkplace with occupant information and fixed asset slots
    /// when a rollout workplace is completed.
    /// </summary>
    private async Task UpdatePhysicalWorkplaceAsync(int rolloutWorkplaceId, CancellationToken cancellationToken)
    {
        // Get the rollout workplace with its physical workplace reference
        var rolloutWorkplace = await _context.RolloutWorkplaces
            .Include(w => w.PhysicalWorkplace)
            .FirstOrDefaultAsync(w => w.Id == rolloutWorkplaceId, cancellationToken);

        if (rolloutWorkplace?.PhysicalWorkplaceId == null || rolloutWorkplace.PhysicalWorkplace == null)
        {
            _logger.LogDebug("No PhysicalWorkplace linked to RolloutWorkplace {WorkplaceId}, skipping update", rolloutWorkplaceId);
            return;
        }

        var physicalWorkplace = rolloutWorkplace.PhysicalWorkplace;

        // Update occupant information
        physicalWorkplace.CurrentOccupantEntraId = rolloutWorkplace.UserEntraId;
        physicalWorkplace.CurrentOccupantName = rolloutWorkplace.UserName;
        physicalWorkplace.CurrentOccupantEmail = rolloutWorkplace.UserEmail;
        physicalWorkplace.OccupiedSince = DateTime.UtcNow;

        // Get all installed assignments for this workplace to update equipment slots
        var installedAssignments = await _context.WorkplaceAssetAssignments
            .Include(a => a.AssetType)
            .Where(a => a.RolloutWorkplaceId == rolloutWorkplaceId &&
                       a.Status == AssetAssignmentStatus.Installed &&
                       a.AssignmentCategory == AssignmentCategory.WorkplaceFixed &&
                       a.NewAssetId.HasValue)
            .ToListAsync(cancellationToken);

        // Track monitors for slot assignment
        var monitorSlot = 1;

        foreach (var assignment in installedAssignments)
        {
            var assetTypeCode = assignment.AssetType?.Code?.ToLowerInvariant() ?? "";

            switch (assetTypeCode)
            {
                case "docking":
                    physicalWorkplace.DockingStationAssetId = assignment.NewAssetId;
                    break;
                case "monitor":
                    // Assign monitors to slots in order (1, 2, 3)
                    switch (monitorSlot)
                    {
                        case 1:
                            physicalWorkplace.Monitor1AssetId = assignment.NewAssetId;
                            break;
                        case 2:
                            physicalWorkplace.Monitor2AssetId = assignment.NewAssetId;
                            break;
                        case 3:
                            physicalWorkplace.Monitor3AssetId = assignment.NewAssetId;
                            break;
                    }
                    monitorSlot++;
                    break;
                case "keyboard":
                    physicalWorkplace.KeyboardAssetId = assignment.NewAssetId;
                    break;
                case "mouse":
                    physicalWorkplace.MouseAssetId = assignment.NewAssetId;
                    break;
            }
        }

        physicalWorkplace.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "Updated PhysicalWorkplace {PhysicalWorkplaceId} with occupant {OccupantName} and {EquipmentCount} fixed assets",
            physicalWorkplace.Id, physicalWorkplace.CurrentOccupantName, installedAssignments.Count);
    }

    #region Private Methods

    private static WorkplaceAssetAssignmentDto MapToDto(WorkplaceAssetAssignment assignment)
    {
        return new WorkplaceAssetAssignmentDto
        {
            Id = assignment.Id,
            RolloutWorkplaceId = assignment.RolloutWorkplaceId,
            AssetTypeId = assignment.AssetTypeId,
            AssetTypeName = assignment.AssetType?.Name ?? "",
            AssetTypeCode = assignment.AssetType?.Code ?? "",
            AssignmentCategory = assignment.AssignmentCategory,
            SourceType = assignment.SourceType,
            NewAssetId = assignment.NewAssetId,
            NewAssetCode = assignment.NewAsset?.AssetCode,
            NewAssetName = assignment.NewAsset?.AssetName,
            NewAssetSerialNumber = assignment.NewAsset?.SerialNumber,
            OldAssetId = assignment.OldAssetId,
            OldAssetCode = assignment.OldAsset?.AssetCode,
            OldAssetName = assignment.OldAsset?.AssetName,
            OldAssetSerialNumber = assignment.OldAsset?.SerialNumber,
            AssetTemplateId = assignment.AssetTemplateId,
            AssetTemplateName = assignment.AssetTemplate?.TemplateName,
            Position = assignment.Position,
            SerialNumberRequired = assignment.SerialNumberRequired,
            QRCodeRequired = assignment.QRCodeRequired,
            SerialNumberCaptured = assignment.SerialNumberCaptured,
            Status = assignment.Status,
            InstalledAt = assignment.InstalledAt,
            InstalledBy = assignment.InstalledBy,
            InstalledByEmail = assignment.InstalledByEmail,
            Notes = assignment.Notes,
            MetadataJson = assignment.MetadataJson,
            CreatedAt = assignment.CreatedAt,
            UpdatedAt = assignment.UpdatedAt
        };
    }

    #endregion
}

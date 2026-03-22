using DjoppieInventory.Core.DTOs.Rollout;
using DjoppieInventory.Core.Entities;
using DjoppieInventory.Core.Interfaces;
using Microsoft.Extensions.Logging;
using System.Text.Json;

namespace DjoppieInventory.Infrastructure.Services;

/// <summary>
/// Service for handling rollout workplace business logic.
/// Extracts complex operations from the controller for better separation of concerns.
/// </summary>
public class RolloutWorkplaceService : IRolloutWorkplaceService
{
    private readonly IRolloutRepository _rolloutRepository;
    private readonly IAssetRepository _assetRepository;
    private readonly IAssetCodeGenerator _assetCodeGenerator;
    private readonly IAssetEventService _assetEventService;
    private readonly ILogger<RolloutWorkplaceService> _logger;

    public RolloutWorkplaceService(
        IRolloutRepository rolloutRepository,
        IAssetRepository assetRepository,
        IAssetCodeGenerator assetCodeGenerator,
        IAssetEventService assetEventService,
        ILogger<RolloutWorkplaceService> logger)
    {
        _rolloutRepository = rolloutRepository;
        _assetRepository = assetRepository;
        _assetCodeGenerator = assetCodeGenerator;
        _assetEventService = assetEventService;
        _logger = logger;
    }

    /// <inheritdoc />
    public async Task<WorkplaceOperationResult> CompleteWorkplaceAsync(
        int workplaceId,
        string? notes,
        string completedBy,
        string completedByEmail)
    {
        var workplace = await _rolloutRepository.GetWorkplaceByIdAsync(workplaceId);
        if (workplace == null)
        {
            return WorkplaceOperationResult.NotFound($"Workplace with ID {workplaceId} not found");
        }

        var assetPlans = ParseAssetPlans(workplace.AssetPlansJson);

        try
        {
            await _rolloutRepository.ExecuteInTransactionAsync(async () =>
            {
                await TransitionAssetsForCompletion(workplace, assetPlans, completedBy, completedByEmail);
                UpdateWorkplaceAsCompleted(workplace, assetPlans, notes, completedBy, completedByEmail);
                await UpdatePhysicalWorkplaceAsync(workplace, assetPlans);
                await _rolloutRepository.SaveChangesAsync();
                await _rolloutRepository.UpdateDayTotalsAsync(workplace.RolloutDayId);
            });

            return WorkplaceOperationResult.Ok(workplace);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex,
                "Failed to complete workplace {WorkplaceId}, transaction rolled back. Exception: {ExceptionType}, Message: {Message}, Inner: {InnerMessage}",
                workplaceId, ex.GetType().Name, ex.Message, ex.InnerException?.Message ?? "None");

            var errorDetails = BuildErrorDetails(ex);
            return WorkplaceOperationResult.Error(
                $"Er is een fout opgetreden bij het voltooien van de werkplek. Alle wijzigingen zijn teruggedraaid. Details: {errorDetails}");
        }
    }

    /// <inheritdoc />
    public async Task<WorkplaceOperationResult> ReopenWorkplaceAsync(int workplaceId, bool reverseAssets)
    {
        var workplace = await _rolloutRepository.GetWorkplaceByIdAsync(workplaceId);
        if (workplace == null)
        {
            return WorkplaceOperationResult.NotFound($"Workplace with ID {workplaceId} not found");
        }

        if (workplace.Status != RolloutWorkplaceStatus.Completed)
        {
            return WorkplaceOperationResult.BadRequest(
                $"Workplace is not completed (current status: {workplace.Status})");
        }

        var assetPlans = ParseAssetPlans(workplace.AssetPlansJson);

        try
        {
            await _rolloutRepository.ExecuteInTransactionAsync(async () =>
            {
                if (reverseAssets)
                {
                    await ReverseAssetTransitions(assetPlans);
                }

                ResetWorkplaceToInProgress(workplace, assetPlans, reverseAssets);
                await _rolloutRepository.SaveChangesAsync();
                await _rolloutRepository.UpdateDayTotalsAsync(workplace.RolloutDayId);
            });

            _logger.LogInformation("Workplace {WorkplaceId} reopened (reverseAssets: {ReverseAssets})",
                workplaceId, reverseAssets);

            return WorkplaceOperationResult.Ok(workplace);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to reopen workplace {WorkplaceId}", workplaceId);
            return WorkplaceOperationResult.Error("Er is een fout opgetreden bij het heropenen van de werkplek.");
        }
    }

    /// <inheritdoc />
    public async Task<WorkplaceOperationResult> UpdateItemDetailsAsync(
        int workplaceId,
        int itemIndex,
        UpdateItemDetailsDto details)
    {
        var workplace = await _rolloutRepository.GetWorkplaceByIdAsync(workplaceId);
        if (workplace == null)
        {
            return WorkplaceOperationResult.NotFound($"Workplace with ID {workplaceId} not found");
        }

        var assetPlans = ParseAssetPlans(workplace.AssetPlansJson);

        if (itemIndex < 0 || itemIndex >= assetPlans.Count)
        {
            return WorkplaceOperationResult.BadRequest(
                $"Item index {itemIndex} is out of range (0-{assetPlans.Count - 1})");
        }

        var plan = assetPlans[itemIndex];

        // Update basic fields
        UpdatePlanBasicFields(plan, details);

        // Update user name if provided
        if (!string.IsNullOrWhiteSpace(details.UserName))
        {
            workplace.UserName = details.UserName;
        }

        // Handle old asset serial number (asset being replaced)
        if (!string.IsNullOrWhiteSpace(details.OldSerialNumber))
        {
            await LinkOldAsset(plan, details.OldSerialNumber);
        }

        // Handle new asset serial number (search or create)
        if (!string.IsNullOrWhiteSpace(details.SerialNumber))
        {
            await HandleNewAssetSerial(plan, details.SerialNumber, workplace, workplaceId, itemIndex);
        }

        // Mark as installed if requested
        if (details.MarkAsInstalled)
        {
            plan.Status = "installed";
            workplace.CompletedItems = assetPlans.Count(p => p.Status == "installed");
        }

        // Auto-set to InProgress if still Pending
        if (workplace.Status == RolloutWorkplaceStatus.Pending)
        {
            workplace.Status = RolloutWorkplaceStatus.InProgress;
        }

        workplace.AssetPlansJson = JsonSerializer.Serialize(assetPlans);
        await _rolloutRepository.UpdateWorkplaceAsync(workplace);

        return WorkplaceOperationResult.Ok(workplace);
    }

    /// <inheritdoc />
    public async Task<WorkplaceOperationResult> StartWorkplaceAsync(int workplaceId)
    {
        var workplace = await _rolloutRepository.GetWorkplaceByIdAsync(workplaceId);
        if (workplace == null)
        {
            return WorkplaceOperationResult.NotFound($"Workplace with ID {workplaceId} not found");
        }

        if (workplace.Status != RolloutWorkplaceStatus.Pending &&
            workplace.Status != RolloutWorkplaceStatus.Ready)
        {
            return WorkplaceOperationResult.BadRequest($"Workplace is already {workplace.Status}");
        }

        workplace.Status = RolloutWorkplaceStatus.InProgress;
        await _rolloutRepository.UpdateWorkplaceAsync(workplace);

        return WorkplaceOperationResult.Ok(workplace);
    }

    /// <inheritdoc />
    public async Task<WorkplaceOperationResult> UpdateItemStatusAsync(
        int workplaceId,
        int itemIndex,
        string status)
    {
        var workplace = await _rolloutRepository.GetWorkplaceByIdAsync(workplaceId);
        if (workplace == null)
        {
            return WorkplaceOperationResult.NotFound($"Workplace with ID {workplaceId} not found");
        }

        var assetPlans = ParseAssetPlans(workplace.AssetPlansJson);

        if (itemIndex < 0 || itemIndex >= assetPlans.Count)
        {
            return WorkplaceOperationResult.BadRequest(
                $"Item index {itemIndex} is out of range (0-{assetPlans.Count - 1})");
        }

        assetPlans[itemIndex].Status = status;
        workplace.AssetPlansJson = JsonSerializer.Serialize(assetPlans);
        workplace.CompletedItems = assetPlans.Count(p => p.Status == "installed");

        // Auto-set to InProgress if still Pending
        if (workplace.Status == RolloutWorkplaceStatus.Pending)
        {
            workplace.Status = RolloutWorkplaceStatus.InProgress;
        }

        await _rolloutRepository.UpdateWorkplaceAsync(workplace);

        return WorkplaceOperationResult.Ok(workplace);
    }

    /// <inheritdoc />
    public async Task<WorkplaceOperationResult> MoveWorkplaceAsync(int workplaceId, DateTime targetDate)
    {
        var workplace = await _rolloutRepository.GetWorkplaceByIdAsync(workplaceId);
        if (workplace == null)
        {
            return WorkplaceOperationResult.NotFound($"Workplace with ID {workplaceId} not found");
        }

        var currentDay = await _rolloutRepository.GetDayByIdAsync(workplace.RolloutDayId);
        if (currentDay == null)
        {
            return WorkplaceOperationResult.NotFound("Current rollout day not found");
        }

        // Check if moving to the same date as the day
        if (currentDay.Date.Date == targetDate.Date)
        {
            // If already has a scheduledDate, clear it to "unmove"
            if (workplace.ScheduledDate != null)
            {
                workplace.ScheduledDate = null;
                workplace.UpdatedAt = DateTime.UtcNow;
                await _rolloutRepository.UpdateWorkplaceAsync(workplace);
                return WorkplaceOperationResult.Ok(workplace);
            }
            return WorkplaceOperationResult.BadRequest("Workplace is already on this date");
        }

        workplace.ScheduledDate = targetDate.Date;
        workplace.UpdatedAt = DateTime.UtcNow;
        await _rolloutRepository.UpdateWorkplaceAsync(workplace);

        return WorkplaceOperationResult.Ok(workplace);
    }

    #region Private Helper Methods

    /// <summary>
    /// Updates the PhysicalWorkplace with occupant information and fixed asset slots
    /// when a rollout workplace is completed.
    /// </summary>
    private Task UpdatePhysicalWorkplaceAsync(RolloutWorkplace workplace, List<AssetPlanDto> assetPlans)
    {
        // Skip if no physical workplace is linked
        if (workplace.PhysicalWorkplaceId == null || workplace.PhysicalWorkplace == null)
        {
            _logger.LogDebug("No PhysicalWorkplace linked to RolloutWorkplace {WorkplaceId}, skipping update", workplace.Id);
            return Task.CompletedTask;
        }

        var physicalWorkplace = workplace.PhysicalWorkplace;

        // Update occupant information
        physicalWorkplace.CurrentOccupantEntraId = workplace.UserEntraId;
        physicalWorkplace.CurrentOccupantName = workplace.UserName;
        physicalWorkplace.CurrentOccupantEmail = workplace.UserEmail;
        physicalWorkplace.OccupiedSince = DateTime.UtcNow;

        // Track monitors for slot assignment
        var monitorSlot = 1;
        var equipmentCount = 0;

        // Update equipment slots from asset plans
        foreach (var plan in assetPlans.Where(p => p.ExistingAssetId.HasValue))
        {
            var equipmentType = plan.EquipmentType?.ToLowerInvariant() ?? "";

            switch (equipmentType)
            {
                case "docking":
                    physicalWorkplace.DockingStationAssetId = plan.ExistingAssetId;
                    equipmentCount++;
                    break;
                case "monitor":
                    switch (monitorSlot)
                    {
                        case 1:
                            physicalWorkplace.Monitor1AssetId = plan.ExistingAssetId;
                            break;
                        case 2:
                            physicalWorkplace.Monitor2AssetId = plan.ExistingAssetId;
                            break;
                        case 3:
                            physicalWorkplace.Monitor3AssetId = plan.ExistingAssetId;
                            break;
                    }
                    monitorSlot++;
                    equipmentCount++;
                    break;
                case "keyboard":
                    physicalWorkplace.KeyboardAssetId = plan.ExistingAssetId;
                    equipmentCount++;
                    break;
                case "mouse":
                    physicalWorkplace.MouseAssetId = plan.ExistingAssetId;
                    equipmentCount++;
                    break;
            }
        }

        physicalWorkplace.UpdatedAt = DateTime.UtcNow;

        _logger.LogInformation(
            "Updated PhysicalWorkplace {PhysicalWorkplaceId} ({Code}) with occupant {OccupantName} and {EquipmentCount} fixed assets",
            physicalWorkplace.Id, physicalWorkplace.Code, physicalWorkplace.CurrentOccupantName, equipmentCount);

        return Task.CompletedTask;
    }

    private static List<AssetPlanDto> ParseAssetPlans(string? json)
    {
        if (string.IsNullOrWhiteSpace(json))
        {
            return new List<AssetPlanDto>();
        }

        return JsonSerializer.Deserialize<List<AssetPlanDto>>(json) ?? new List<AssetPlanDto>();
    }

    private async Task TransitionAssetsForCompletion(
        RolloutWorkplace workplace,
        List<AssetPlanDto> assetPlans,
        string completedBy,
        string completedByEmail)
    {
        foreach (var plan in assetPlans)
        {
            // New/existing asset -> InGebruik
            if (plan.ExistingAssetId.HasValue)
            {
                var asset = await _assetRepository.GetByIdAsync(plan.ExistingAssetId.Value);
                if (asset != null)
                {
                    var oldStatus = asset.Status;

                    asset.Status = AssetStatus.InGebruik;
                    asset.InstallationDate = DateTime.UtcNow;
                    asset.Owner = workplace.UserName;
                    asset.ServiceId = workplace.ServiceId;
                    asset.InstallationLocation = workplace.Location;
                    asset.UpdatedAt = DateTime.UtcNow;
                    await _assetRepository.UpdateAsync(asset);

                    // Create audit event for status change
                    await _assetEventService.CreateStatusChangedEventAsync(
                        asset.Id,
                        oldStatus,
                        AssetStatus.InGebruik,
                        completedBy,
                        completedByEmail,
                        $"Rollout werkplek: {workplace.UserName}");

                    _logger.LogInformation("Asset {AssetCode} transitioned to InGebruik for {User}",
                        asset.AssetCode, workplace.UserName);
                }
            }

            // Old asset -> UitDienst
            if (plan.OldAssetId.HasValue)
            {
                var oldAsset = await _assetRepository.GetByIdAsync(plan.OldAssetId.Value);
                if (oldAsset != null)
                {
                    var oldStatus = oldAsset.Status;

                    oldAsset.Status = AssetStatus.UitDienst;
                    oldAsset.UpdatedAt = DateTime.UtcNow;
                    await _assetRepository.UpdateAsync(oldAsset);

                    // Create audit event for decommissioning
                    await _assetEventService.CreateStatusChangedEventAsync(
                        oldAsset.Id,
                        oldStatus,
                        AssetStatus.UitDienst,
                        completedBy,
                        completedByEmail,
                        $"Rollout werkplek: {workplace.UserName} (vervangen)");

                    _logger.LogInformation("Old asset {AssetCode} decommissioned (UitDienst)",
                        oldAsset.AssetCode);
                }
            }

            // Mark pending items as installed (preserve skipped status)
            if (plan.Status != "skipped")
            {
                plan.Status = "installed";
            }
        }
    }

    private static void UpdateWorkplaceAsCompleted(
        RolloutWorkplace workplace,
        List<AssetPlanDto> assetPlans,
        string? notes,
        string completedBy,
        string completedByEmail)
    {
        workplace.AssetPlansJson = JsonSerializer.Serialize(assetPlans);
        workplace.Status = RolloutWorkplaceStatus.Completed;
        workplace.CompletedItems = assetPlans.Count(p => p.Status == "installed");
        workplace.CompletedAt = DateTime.UtcNow;
        workplace.CompletedBy = completedBy;
        workplace.CompletedByEmail = completedByEmail;
        workplace.UpdatedAt = DateTime.UtcNow;

        if (!string.IsNullOrWhiteSpace(notes))
        {
            workplace.Notes = notes;
        }
    }

    private async Task ReverseAssetTransitions(List<AssetPlanDto> assetPlans)
    {
        foreach (var plan in assetPlans)
        {
            // Reverse: InGebruik -> Nieuw
            if (plan.ExistingAssetId.HasValue)
            {
                var asset = await _assetRepository.GetByIdAsync(plan.ExistingAssetId.Value);
                if (asset != null && asset.Status == AssetStatus.InGebruik)
                {
                    asset.Status = AssetStatus.Nieuw;
                    asset.Owner = null;
                    asset.InstallationDate = null;
                    asset.InstallationLocation = null;
                    asset.UpdatedAt = DateTime.UtcNow;
                    await _assetRepository.UpdateAsync(asset);

                    _logger.LogInformation("Asset {AssetCode} reversed to Nieuw", asset.AssetCode);
                }
            }

            // Reverse: UitDienst -> InGebruik
            if (plan.OldAssetId.HasValue)
            {
                var oldAsset = await _assetRepository.GetByIdAsync(plan.OldAssetId.Value);
                if (oldAsset != null && oldAsset.Status == AssetStatus.UitDienst)
                {
                    oldAsset.Status = AssetStatus.InGebruik;
                    oldAsset.UpdatedAt = DateTime.UtcNow;
                    await _assetRepository.UpdateAsync(oldAsset);

                    _logger.LogInformation("Old asset {AssetCode} reversed to InGebruik", oldAsset.AssetCode);
                }
            }

            // Reset item status to pending
            if (plan.Status == "installed")
            {
                plan.Status = "pending";
            }
        }
    }

    private static void ResetWorkplaceToInProgress(
        RolloutWorkplace workplace,
        List<AssetPlanDto> assetPlans,
        bool reverseAssets)
    {
        workplace.AssetPlansJson = JsonSerializer.Serialize(assetPlans);
        workplace.Status = RolloutWorkplaceStatus.InProgress;
        workplace.CompletedAt = null;
        workplace.CompletedBy = null;
        workplace.CompletedByEmail = null;
        workplace.UpdatedAt = DateTime.UtcNow;

        if (reverseAssets)
        {
            workplace.CompletedItems = 0;
        }
    }

    private static void UpdatePlanBasicFields(AssetPlanDto plan, UpdateItemDetailsDto details)
    {
        if (!string.IsNullOrWhiteSpace(details.Brand))
        {
            plan.Brand = details.Brand;
        }

        if (!string.IsNullOrWhiteSpace(details.Model))
        {
            plan.Model = details.Model;
        }
    }

    private async Task LinkOldAsset(AssetPlanDto plan, string oldSerialNumber)
    {
        var oldAsset = await _assetRepository.GetBySerialNumberAsync(oldSerialNumber);
        if (oldAsset != null)
        {
            plan.OldAssetId = oldAsset.Id;
            plan.OldAssetCode = oldAsset.AssetCode;
            plan.OldAssetName = oldAsset.AssetName;
            plan.Metadata ??= new Dictionary<string, string>();
            plan.Metadata["oldSerial"] = oldSerialNumber;
        }
    }

    private async Task HandleNewAssetSerial(
        AssetPlanDto plan,
        string serialNumber,
        RolloutWorkplace workplace,
        int workplaceId,
        int itemIndex)
    {
        plan.Metadata ??= new Dictionary<string, string>();
        plan.Metadata["serialNumber"] = serialNumber;

        // First check if another asset already has this serial number
        var existingAsset = await _assetRepository.GetBySerialNumberAsync(serialNumber);
        if (existingAsset != null)
        {
            LinkExistingAsset(plan, existingAsset, serialNumber, workplaceId, itemIndex);
        }
        else if (plan.ExistingAssetId.HasValue)
        {
            await UpdateLinkedAssetSerial(plan, serialNumber);
        }
        else
        {
            await CreateNewAsset(plan, serialNumber, workplace, workplaceId, itemIndex);
        }
    }

    private void LinkExistingAsset(
        AssetPlanDto plan,
        Asset existingAsset,
        string serialNumber,
        int workplaceId,
        int itemIndex)
    {
        plan.ExistingAssetId = existingAsset.Id;
        plan.ExistingAssetCode = existingAsset.AssetCode;
        plan.ExistingAssetName = existingAsset.AssetName;
        plan.CreateNew = false;

        _logger.LogInformation(
            "Linked existing asset {AssetCode} (serial: {Serial}) to workplace {WorkplaceId} item {ItemIndex}",
            existingAsset.AssetCode, serialNumber, workplaceId, itemIndex);
    }

    private async Task UpdateLinkedAssetSerial(AssetPlanDto plan, string serialNumber)
    {
        var linkedAsset = await _assetRepository.GetByIdAsync(plan.ExistingAssetId!.Value);
        if (linkedAsset != null && string.IsNullOrEmpty(linkedAsset.SerialNumber))
        {
            linkedAsset.SerialNumber = serialNumber;
            linkedAsset.UpdatedAt = DateTime.UtcNow;
            await _assetRepository.UpdateAsync(linkedAsset);

            _logger.LogInformation("Updated serial number on existing asset {AssetCode} to {Serial}",
                linkedAsset.AssetCode, serialNumber);
        }
    }

    private async Task CreateNewAsset(
        AssetPlanDto plan,
        string serialNumber,
        RolloutWorkplace workplace,
        int workplaceId,
        int itemIndex)
    {
        var assetTypeCode = GetAssetTypeCode(plan.EquipmentType);
        if (assetTypeCode == null)
        {
            return;
        }

        var assetType = await _rolloutRepository.GetAssetTypeByCodeAsync(assetTypeCode);
        if (assetType == null)
        {
            return;
        }

        var assetName = BuildAssetName(plan.EquipmentType, serialNumber, plan.Brand, plan.Model);
        var generatedCode = await _assetCodeGenerator.GenerateCodeAsync(
            assetType.Id, plan.Brand, DateTime.UtcNow, false);

        var newAsset = new Asset
        {
            AssetTypeId = assetType.Id,
            Category = assetType.Name,
            AssetCode = generatedCode,
            AssetName = assetName,
            Brand = plan.Brand,
            Model = plan.Model,
            SerialNumber = serialNumber,
            Status = AssetStatus.Nieuw,
            ServiceId = workplace.ServiceId,
            IsDummy = false,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var createdAsset = await _assetRepository.CreateAsync(newAsset);
        plan.ExistingAssetId = createdAsset.Id;
        plan.ExistingAssetCode = createdAsset.AssetCode;
        plan.ExistingAssetName = createdAsset.AssetName;
        plan.CreateNew = false;

        _logger.LogInformation(
            "Created new asset {AssetCode} (serial: {Serial}) for workplace {WorkplaceId} item {ItemIndex}",
            createdAsset.AssetCode, serialNumber, workplaceId, itemIndex);
    }

    private static string? GetAssetTypeCode(string equipmentType)
    {
        return equipmentType.ToLower() switch
        {
            "laptop" => "LAP",
            "desktop" => "DESK",
            "docking" => "DOCK",
            "monitor" => "MON",
            "keyboard" => "KEYB",
            "mouse" => "MOUSE",
            _ => null
        };
    }

    private static string BuildAssetName(string equipmentType, string serialNumber, string? brand, string? model)
    {
        var typeUpper = equipmentType.ToUpper();

        // DOCK-serial / MON-serial format for docking and monitor
        if ((typeUpper == "DOCKING" || typeUpper == "MONITOR") && !string.IsNullOrEmpty(serialNumber))
        {
            var namePrefix = typeUpper == "DOCKING" ? "DOCK" : "MON";
            return $"{namePrefix}-{serialNumber}";
        }

        // type_brand_model format for others
        var assetNameParts = new List<string> { equipmentType.ToLower() };
        if (!string.IsNullOrEmpty(brand))
        {
            assetNameParts.Add(brand.ToLower().Replace(" ", "_"));
        }
        if (!string.IsNullOrEmpty(model))
        {
            assetNameParts.Add(model.ToLower().Replace(" ", "_"));
        }

        return string.Join("_", assetNameParts);
    }

    private static string BuildErrorDetails(Exception ex)
    {
        var errorDetails = $"{ex.GetType().Name}: {ex.Message}";
        if (ex.InnerException != null)
        {
            errorDetails += $" -> {ex.InnerException.GetType().Name}: {ex.InnerException.Message}";
        }
        return errorDetails;
    }

    #endregion
}

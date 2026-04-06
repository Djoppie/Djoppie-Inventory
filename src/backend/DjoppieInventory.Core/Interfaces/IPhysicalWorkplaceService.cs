using DjoppieInventory.Core.DTOs.PhysicalWorkplace;
using DjoppieInventory.Core.Entities;

namespace DjoppieInventory.Core.Interfaces;

/// <summary>
/// Service interface for managing physical workplace locations.
/// Abstracts business logic for workplace CRUD operations and occupant management.
/// </summary>
public interface IPhysicalWorkplaceService
{
    /// <summary>
    /// Gets all physical workplaces with optional filtering
    /// </summary>
    Task<IEnumerable<PhysicalWorkplaceDto>> GetAllAsync(
        int? buildingId = null,
        int? serviceId = null,
        bool? isActive = null,
        bool? hasOccupant = null,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets a single workplace by ID with all related data
    /// </summary>
    Task<PhysicalWorkplace?> GetByIdAsync(int id, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets a workplace with DTO projection
    /// </summary>
    Task<PhysicalWorkplaceDto?> GetDtoByIdAsync(int id, CancellationToken cancellationToken = default);

    /// <summary>
    /// Creates a new physical workplace
    /// </summary>
    Task<PhysicalWorkplace> CreateAsync(CreatePhysicalWorkplaceDto dto, CancellationToken cancellationToken = default);

    /// <summary>
    /// Updates an existing physical workplace
    /// </summary>
    Task<PhysicalWorkplace> UpdateAsync(int id, UpdatePhysicalWorkplaceDto dto, CancellationToken cancellationToken = default);

    /// <summary>
    /// Soft deletes a workplace by setting IsActive to false
    /// </summary>
    Task<bool> DeleteAsync(int id, CancellationToken cancellationToken = default);

    /// <summary>
    /// Updates workplace occupant information
    /// </summary>
    Task<PhysicalWorkplace> UpdateOccupantAsync(
        int id,
        UpdateOccupantDto dto,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets assets associated with a workplace
    /// </summary>
    Task<IEnumerable<Asset>> GetWorkplaceAssetsAsync(
        int workplaceId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Assigns an asset to a workplace
    /// </summary>
    Task AssignAssetAsync(
        int workplaceId,
        int assetId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Removes an asset from a workplace
    /// </summary>
    Task RemoveAssetAsync(
        int workplaceId,
        int assetId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Checks if a workplace code already exists (for validation)
    /// </summary>
    Task<bool> CodeExistsAsync(
        string code,
        int? excludeId = null,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets workplace statistics (total, occupied, available, etc.)
    /// </summary>
    Task<WorkplaceStatisticsDto> GetStatisticsAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Bulk creates workplaces from a template
    /// </summary>
    Task<BulkCreateResult> BulkCreateAsync(
        BulkCreateWorkplacesDto dto,
        CancellationToken cancellationToken = default);
}

/// <summary>
/// Result of bulk workplace creation
/// </summary>
public record BulkCreateResult(
    int SuccessCount,
    int FailureCount,
    List<string> Errors,
    List<PhysicalWorkplace> CreatedWorkplaces
);


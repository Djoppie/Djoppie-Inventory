using DjoppieInventory.Core.DTOs;
using DjoppieInventory.Core.DTOs.Rollout;
using DjoppieInventory.Core.Entities;
using DjoppieInventory.Core.Entities.Enums;

namespace DjoppieInventory.Core.Interfaces;

/// <summary>
/// Service interface for managing workplace asset assignments.
/// Replaces JSON-based AssetPlansJson with proper relational management.
/// </summary>
public interface IWorkplaceAssetAssignmentService
{
    /// <summary>
    /// Gets all assignments for a workplace.
    /// </summary>
    /// <param name="workplaceId">Workplace ID</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>List of assignments</returns>
    Task<IEnumerable<WorkplaceAssetAssignmentDto>> GetByWorkplaceIdAsync(
        int workplaceId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets a single assignment by ID.
    /// </summary>
    /// <param name="assignmentId">Assignment ID</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Assignment if found</returns>
    Task<WorkplaceAssetAssignmentDto?> GetByIdAsync(
        int assignmentId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Creates a new assignment for a workplace.
    /// </summary>
    /// <param name="request">Create request</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Created assignment</returns>
    Task<WorkplaceAssetAssignmentDto> CreateAsync(
        CreateWorkplaceAssetAssignmentRequest request,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Creates multiple assignments for a workplace in bulk.
    /// </summary>
    /// <param name="workplaceId">Workplace ID</param>
    /// <param name="requests">List of create requests</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Created assignments</returns>
    Task<IEnumerable<WorkplaceAssetAssignmentDto>> BulkCreateAsync(
        int workplaceId,
        IEnumerable<CreateWorkplaceAssetAssignmentRequest> requests,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Updates an assignment's status during execution.
    /// </summary>
    /// <param name="assignmentId">Assignment ID</param>
    /// <param name="request">Status update request</param>
    /// <param name="performedBy">Technician name</param>
    /// <param name="performedByEmail">Technician email</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Updated assignment</returns>
    Task<WorkplaceAssetAssignmentDto> UpdateStatusAsync(
        int assignmentId,
        UpdateAssignmentStatusRequest request,
        string performedBy,
        string performedByEmail,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Updates an assignment's configuration during planning.
    /// </summary>
    /// <param name="assignmentId">Assignment ID</param>
    /// <param name="request">Update request</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Updated assignment</returns>
    Task<WorkplaceAssetAssignmentDto> UpdateAsync(
        int assignmentId,
        UpdateWorkplaceAssetAssignmentRequest request,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Deletes an assignment.
    /// </summary>
    /// <param name="assignmentId">Assignment ID</param>
    /// <param name="cancellationToken">Cancellation token</param>
    Task DeleteAsync(
        int assignmentId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Deletes all assignments for a workplace.
    /// </summary>
    /// <param name="workplaceId">Workplace ID</param>
    /// <param name="cancellationToken">Cancellation token</param>
    Task DeleteByWorkplaceIdAsync(
        int workplaceId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Assigns an existing asset to an assignment.
    /// </summary>
    /// <param name="assignmentId">Assignment ID</param>
    /// <param name="assetId">Asset ID to assign</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Updated assignment</returns>
    Task<WorkplaceAssetAssignmentDto> AssignExistingAssetAsync(
        int assignmentId,
        int assetId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Sets the old asset being replaced for an assignment.
    /// </summary>
    /// <param name="assignmentId">Assignment ID</param>
    /// <param name="oldAssetId">Old asset ID</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Updated assignment</returns>
    Task<WorkplaceAssetAssignmentDto> SetOldAssetAsync(
        int assignmentId,
        int oldAssetId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Creates a new asset from template and assigns it to the assignment.
    /// </summary>
    /// <param name="assignmentId">Assignment ID</param>
    /// <param name="serialNumber">Serial number for the new asset</param>
    /// <param name="performedBy">Technician name</param>
    /// <param name="performedByEmail">Technician email</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Updated assignment with new asset</returns>
    Task<WorkplaceAssetAssignmentDto> CreateAssetFromTemplateAsync(
        int assignmentId,
        string serialNumber,
        string performedBy,
        string performedByEmail,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets assignments summary for a workplace.
    /// </summary>
    /// <param name="workplaceId">Workplace ID</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Assignment summary</returns>
    Task<WorkplaceAssignmentSummaryDto> GetSummaryAsync(
        int workplaceId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Completes a workplace by updating all pending assignments to installed.
    /// </summary>
    /// <param name="workplaceId">Workplace ID</param>
    /// <param name="performedBy">Technician name</param>
    /// <param name="performedByEmail">Technician email</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Number of assignments completed</returns>
    Task<int> CompleteWorkplaceAssignmentsAsync(
        int workplaceId,
        string performedBy,
        string performedByEmail,
        CancellationToken cancellationToken = default);
}

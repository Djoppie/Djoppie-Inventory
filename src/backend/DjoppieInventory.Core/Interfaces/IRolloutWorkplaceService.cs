using DjoppieInventory.Core.DTOs.Rollout;
using DjoppieInventory.Core.Entities;

namespace DjoppieInventory.Core.Interfaces;

/// <summary>
/// Service interface for rollout workplace business logic operations.
/// Handles complex workflows like completing, reopening, and updating workplaces.
/// </summary>
public interface IRolloutWorkplaceService
{
    /// <summary>
    /// Completes a workplace, transitioning all linked assets:
    /// - New assets: Nieuw -> InGebruik (sets Owner and InstallationDate)
    /// - Old assets: -> UitDienst
    /// </summary>
    /// <param name="workplaceId">The workplace ID to complete</param>
    /// <param name="notes">Optional completion notes</param>
    /// <param name="completedBy">Name of the user completing the workplace</param>
    /// <param name="completedByEmail">Email of the user completing the workplace</param>
    /// <returns>Result containing the updated workplace or error details</returns>
    Task<WorkplaceOperationResult> CompleteWorkplaceAsync(
        int workplaceId,
        string? notes,
        string completedBy,
        string completedByEmail);

    /// <summary>
    /// Reopens a completed workplace for further editing.
    /// Optionally reverses asset status transitions.
    /// </summary>
    /// <param name="workplaceId">The workplace ID to reopen</param>
    /// <param name="reverseAssets">If true, reverses asset status changes (InGebruik->Nieuw, UitDienst->InGebruik)</param>
    /// <returns>Result containing the updated workplace or error details</returns>
    Task<WorkplaceOperationResult> ReopenWorkplaceAsync(
        int workplaceId,
        bool reverseAssets);

    /// <summary>
    /// Updates item details during execution (serial number, brand/model, asset linking).
    /// Searches for existing asset by serial, or creates a new one, then links it to the plan.
    /// </summary>
    /// <param name="workplaceId">The workplace ID</param>
    /// <param name="itemIndex">The index of the asset plan item to update</param>
    /// <param name="details">The details to update</param>
    /// <returns>Result containing the updated workplace or error details</returns>
    Task<WorkplaceOperationResult> UpdateItemDetailsAsync(
        int workplaceId,
        int itemIndex,
        UpdateItemDetailsDto details);

    /// <summary>
    /// Starts a workplace execution (sets status to InProgress).
    /// Validates that the workplace is in a valid starting state.
    /// </summary>
    /// <param name="workplaceId">The workplace ID to start</param>
    /// <returns>Result containing the updated workplace or error details</returns>
    Task<WorkplaceOperationResult> StartWorkplaceAsync(int workplaceId);

    /// <summary>
    /// Updates a single asset plan item status (installed, skipped, pending).
    /// </summary>
    /// <param name="workplaceId">The workplace ID</param>
    /// <param name="itemIndex">The index of the asset plan item</param>
    /// <param name="status">The new status</param>
    /// <returns>Result containing the updated workplace or error details</returns>
    Task<WorkplaceOperationResult> UpdateItemStatusAsync(
        int workplaceId,
        int itemIndex,
        string status);

    /// <summary>
    /// Moves a workplace to a different scheduled date.
    /// The workplace stays in its original planning but will be executed on the new date.
    /// </summary>
    /// <param name="workplaceId">The workplace ID</param>
    /// <param name="targetDate">The target date for execution</param>
    /// <returns>Result containing the updated workplace or error details</returns>
    Task<WorkplaceOperationResult> MoveWorkplaceAsync(
        int workplaceId,
        DateTime targetDate);
}

/// <summary>
/// Result of a workplace operation, containing either the updated workplace or error details.
/// </summary>
public class WorkplaceOperationResult
{
    public bool Success { get; private set; }
    public RolloutWorkplace? Workplace { get; private set; }
    public string? ErrorMessage { get; private set; }
    public int StatusCode { get; private set; }

    private WorkplaceOperationResult() { }

    public static WorkplaceOperationResult Ok(RolloutWorkplace workplace)
    {
        return new WorkplaceOperationResult
        {
            Success = true,
            Workplace = workplace,
            StatusCode = 200
        };
    }

    public static WorkplaceOperationResult NotFound(string message)
    {
        return new WorkplaceOperationResult
        {
            Success = false,
            ErrorMessage = message,
            StatusCode = 404
        };
    }

    public static WorkplaceOperationResult BadRequest(string message)
    {
        return new WorkplaceOperationResult
        {
            Success = false,
            ErrorMessage = message,
            StatusCode = 400
        };
    }

    public static WorkplaceOperationResult Error(string message, int statusCode = 500)
    {
        return new WorkplaceOperationResult
        {
            Success = false,
            ErrorMessage = message,
            StatusCode = statusCode
        };
    }

    /// <summary>
    /// Pattern matching helper for handling result
    /// </summary>
    public TResult Match<TResult>(
        Func<RolloutWorkplace, TResult> onSuccess,
        Func<WorkplaceOperationResult, TResult> onError)
    {
        return Success ? onSuccess(Workplace!) : onError(this);
    }
}

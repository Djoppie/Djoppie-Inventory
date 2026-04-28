using DjoppieInventory.Core.Entities;

namespace DjoppieInventory.Core.Interfaces;

public class CompletionResult
{
    public AssetRequest Request { get; set; } = null!;
    public List<int> AffectedAssetIds { get; set; } = new();
}

public interface IAssetRequestCompletionService
{
    /// <summary>
    /// Transition the request through its lifecycle.
    /// Validates pre-conditions and, when transitioning to Completed,
    /// applies asset mutations + writes AssetEvents atomically.
    /// </summary>
    Task<CompletionResult> TransitionAsync(
        int requestId,
        AssetRequestStatus target,
        string performedBy,
        string? performedByEmail,
        CancellationToken cancellationToken = default);
}

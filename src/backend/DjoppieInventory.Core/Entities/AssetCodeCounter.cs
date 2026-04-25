namespace DjoppieInventory.Core.Entities;

/// <summary>
/// Per-prefix counter row that backs atomic asset-code generation.
///
/// Each unique asset-code prefix (e.g. <c>LAP-26-DELL</c> or <c>DUM-LAP-26-HP</c>)
/// has at most one <see cref="AssetCodeCounter"/> row. The counter is updated
/// inside a serializable transaction to guarantee that two concurrent
/// asset-creation requests cannot collide on the same number — a real bug
/// that the prior MAX(AssetCode)+1 approach exhibited under bulk-create and
/// rollout-day load.
///
/// <see cref="NextNumber"/> always points at the *next* number to hand out;
/// callers reserve one or more numbers by reading and incrementing it
/// atomically.
/// </summary>
public class AssetCodeCounter
{
    public int Id { get; set; }

    /// <summary>
    /// Prefix without the trailing dash and number, e.g. <c>LAP-26-DELL</c> or
    /// <c>DUM-LAP-26-HP</c>. Unique.
    /// </summary>
    public string Prefix { get; set; } = string.Empty;

    /// <summary>
    /// The next number to be issued for this prefix. After issuing,
    /// the value is incremented by the count of numbers reserved.
    /// Normal range: 1–89999. Dummy range: 90001–99999.
    /// </summary>
    public int NextNumber { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

using DjoppieInventory.Core.Entities;
using DjoppieInventory.Core.Entities.Enums;

namespace DjoppieInventory.Infrastructure.Services;

public class RolloutMovementClassifierService
{
    public RolloutMovementType Classify(IEnumerable<WorkplaceAssetAssignment> assignments)
    {
        var list = assignments.ToList();
        var hasNew = list.Any(a => a.NewAssetId.HasValue);
        var hasOld = list.Any(a => a.OldAssetId.HasValue);

        return (hasNew, hasOld) switch
        {
            (true, false) => RolloutMovementType.Onboarding,
            (false, true) => RolloutMovementType.Offboarding,
            (true, true)  => RolloutMovementType.Swap,
            _             => RolloutMovementType.Other
        };
    }
}

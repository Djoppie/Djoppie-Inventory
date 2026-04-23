using DjoppieInventory.Core.Entities;
using DjoppieInventory.Core.Entities.Enums;
using DjoppieInventory.Infrastructure.Services;
using FluentAssertions;

namespace DjoppieInventory.Tests.Services;

public class RolloutMovementClassifierServiceTests
{
    private readonly RolloutMovementClassifierService _sut = new();

    [Fact]
    public void Classify_OnlyNewAssets_ReturnsOnboarding()
    {
        var assignments = new List<WorkplaceAssetAssignment>
        {
            new() { NewAssetId = 100, OldAssetId = null },
            new() { NewAssetId = 101, OldAssetId = null }
        };

        var result = _sut.Classify(assignments);

        result.Should().Be(RolloutMovementType.Onboarding);
    }
}

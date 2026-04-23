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

    [Fact]
    public void Classify_OnlyOldAssets_ReturnsOffboarding()
    {
        var assignments = new List<WorkplaceAssetAssignment>
        {
            new() { NewAssetId = null, OldAssetId = 200 }
        };
        _sut.Classify(assignments).Should().Be(RolloutMovementType.Offboarding);
    }

    [Fact]
    public void Classify_BothNewAndOld_ReturnsSwap()
    {
        var assignments = new List<WorkplaceAssetAssignment>
        {
            new() { NewAssetId = 100, OldAssetId = 200 }
        };
        _sut.Classify(assignments).Should().Be(RolloutMovementType.Swap);
    }

    [Fact]
    public void Classify_MixedAcrossRows_ReturnsSwap()
    {
        var assignments = new List<WorkplaceAssetAssignment>
        {
            new() { NewAssetId = 100, OldAssetId = null },
            new() { NewAssetId = null, OldAssetId = 200 }
        };
        _sut.Classify(assignments).Should().Be(RolloutMovementType.Swap);
    }

    [Fact]
    public void Classify_EmptyList_ReturnsOther()
    {
        _sut.Classify(new List<WorkplaceAssetAssignment>()).Should().Be(RolloutMovementType.Other);
    }

    [Fact]
    public void Classify_AllAssignmentsNull_ReturnsOther()
    {
        var assignments = new List<WorkplaceAssetAssignment>
        {
            new() { NewAssetId = null, OldAssetId = null }
        };
        _sut.Classify(assignments).Should().Be(RolloutMovementType.Other);
    }
}

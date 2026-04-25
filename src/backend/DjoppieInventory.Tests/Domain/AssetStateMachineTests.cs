using DjoppieInventory.Core.Domain;
using DjoppieInventory.Core.Entities;
using FluentAssertions;

namespace DjoppieInventory.Tests.Domain;

/// <summary>
/// Unit tests for the canonical AssetStatus state machine. These tests
/// document the workflow rules: new assets only progress via the
/// assignment endpoints, and UitDienst is terminal under regular rules
/// (admin override is the only escape hatch).
/// </summary>
public class AssetStateMachineTests
{
    [Fact]
    public void IsAllowed_NoOpTransition_AlwaysAllowed()
    {
        foreach (AssetStatus status in Enum.GetValues<AssetStatus>())
        {
            AssetStateMachine.IsAllowed(status, status).Should().BeTrue(
                $"a no-op {status} → {status} write must be a benign no-op");
        }
    }

    [Theory]
    [InlineData(AssetStatus.Nieuw, AssetStatus.InGebruik)]
    [InlineData(AssetStatus.Nieuw, AssetStatus.Stock)]
    public void IsAllowed_NieuwAllowedTargets_AreAllowed(AssetStatus from, AssetStatus to)
    {
        AssetStateMachine.IsAllowed(from, to).Should().BeTrue();
    }

    [Theory]
    [InlineData(AssetStatus.Nieuw, AssetStatus.Herstelling)]
    [InlineData(AssetStatus.Nieuw, AssetStatus.Defect)]
    [InlineData(AssetStatus.Nieuw, AssetStatus.UitDienst)]
    public void IsAllowed_NieuwForbiddenTargets_AreRejected(AssetStatus from, AssetStatus to)
    {
        AssetStateMachine.IsAllowed(from, to).Should().BeFalse(
            $"new assets must not jump straight to {to} — go through Stock or InGebruik first");
    }

    [Theory]
    [InlineData(AssetStatus.InGebruik, AssetStatus.Stock)]
    [InlineData(AssetStatus.InGebruik, AssetStatus.Herstelling)]
    [InlineData(AssetStatus.InGebruik, AssetStatus.Defect)]
    [InlineData(AssetStatus.InGebruik, AssetStatus.UitDienst)]
    public void IsAllowed_InGebruikAllReturnPaths_AreAllowed(AssetStatus from, AssetStatus to)
    {
        AssetStateMachine.IsAllowed(from, to).Should().BeTrue();
    }

    [Fact]
    public void IsAllowed_InGebruikToNieuw_IsRejected()
    {
        AssetStateMachine.IsAllowed(AssetStatus.InGebruik, AssetStatus.Nieuw).Should().BeFalse(
            "an in-use asset cannot regress back to Nieuw");
    }

    [Theory]
    [InlineData(AssetStatus.Stock, AssetStatus.InGebruik)]
    [InlineData(AssetStatus.Stock, AssetStatus.Herstelling)]
    [InlineData(AssetStatus.Stock, AssetStatus.Defect)]
    [InlineData(AssetStatus.Stock, AssetStatus.UitDienst)]
    public void IsAllowed_StockToCirculation_IsAllowed(AssetStatus from, AssetStatus to)
    {
        AssetStateMachine.IsAllowed(from, to).Should().BeTrue();
    }

    [Theory]
    [InlineData(AssetStatus.Herstelling, AssetStatus.InGebruik)]
    [InlineData(AssetStatus.Herstelling, AssetStatus.Stock)]
    [InlineData(AssetStatus.Herstelling, AssetStatus.Defect)]
    [InlineData(AssetStatus.Herstelling, AssetStatus.UitDienst)]
    public void IsAllowed_HerstellingOutcomes_AreAllowed(AssetStatus from, AssetStatus to)
    {
        AssetStateMachine.IsAllowed(from, to).Should().BeTrue();
    }

    [Theory]
    [InlineData(AssetStatus.Defect, AssetStatus.Herstelling)]
    [InlineData(AssetStatus.Defect, AssetStatus.UitDienst)]
    public void IsAllowed_DefectAllowedTargets_AreAllowed(AssetStatus from, AssetStatus to)
    {
        AssetStateMachine.IsAllowed(from, to).Should().BeTrue();
    }

    [Theory]
    [InlineData(AssetStatus.Defect, AssetStatus.InGebruik)]
    [InlineData(AssetStatus.Defect, AssetStatus.Stock)]
    public void IsAllowed_DefectShortcuts_AreRejected(AssetStatus from, AssetStatus to)
    {
        AssetStateMachine.IsAllowed(from, to).Should().BeFalse(
            "a defect asset must go through Herstelling before re-entering circulation");
    }

    [Theory]
    [InlineData(AssetStatus.UitDienst, AssetStatus.InGebruik)]
    [InlineData(AssetStatus.UitDienst, AssetStatus.Stock)]
    [InlineData(AssetStatus.UitDienst, AssetStatus.Herstelling)]
    [InlineData(AssetStatus.UitDienst, AssetStatus.Defect)]
    [InlineData(AssetStatus.UitDienst, AssetStatus.Nieuw)]
    public void IsAllowed_UitDienstIsTerminal_AllExitsRejected(AssetStatus from, AssetStatus to)
    {
        AssetStateMachine.IsAllowed(from, to).Should().BeFalse(
            "UitDienst is terminal under the regular workflow — admin override is the only escape");
    }

    [Theory]
    [InlineData(AssetStatus.UitDienst, AssetStatus.InGebruik)]
    [InlineData(AssetStatus.UitDienst, AssetStatus.Stock)]
    [InlineData(AssetStatus.Defect, AssetStatus.InGebruik)]
    [InlineData(AssetStatus.Nieuw, AssetStatus.UitDienst)]
    public void IsAllowedForAdminOverride_AllowsAnyTransition(AssetStatus from, AssetStatus to)
    {
        AssetStateMachine.IsAllowedForAdminOverride(from, to).Should().BeTrue(
            "admin override is the noodknop — anything goes when an admin asks for it");
    }

    [Fact]
    public void GetRejectionReason_ReturnsDutchMessage_ForUitDienstExit()
    {
        var reason = AssetStateMachine.GetRejectionReason(AssetStatus.UitDienst, AssetStatus.InGebruik);

        reason.Should().NotBeNull();
        reason.Should().Contain("uit dienst");
        reason.Should().Contain("admin");
    }

    [Fact]
    public void GetRejectionReason_ReturnsNull_WhenTransitionAllowed()
    {
        AssetStateMachine.GetRejectionReason(AssetStatus.Nieuw, AssetStatus.InGebruik).Should().BeNull();
        AssetStateMachine.GetRejectionReason(AssetStatus.InGebruik, AssetStatus.InGebruik).Should().BeNull();
    }

    [Fact]
    public void GetRejectionReason_ReturnsNieuwSpecificMessage_ForForbiddenNieuwTarget()
    {
        var reason = AssetStateMachine.GetRejectionReason(AssetStatus.Nieuw, AssetStatus.Defect);

        reason.Should().NotBeNull();
        reason.Should().Contain("nieuw asset");
    }
}

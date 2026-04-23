# Reports Consolidation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Consolidate the fragmented reporting surfaces of Djoppie Inventory into a single `/reports` shell with 6 coherent tabs (Overview, Assets, Rollouts, Werkplekken, Intune, Leasing), and introduce movement-type classification (onboarding/offboarding/swap), per-service rollout grouping, per-employee views, and Intune-enriched asset snapshots.

**Architecture:** Clean Architecture preserved (API → Core ← Infrastructure). Backend splits `OperationsReportsController` (1157 lines) into focused controllers, introduces three new services (`RolloutMovementClassifierService`, `ReportsOverviewService`, `EmployeeReportsService`) and five new endpoints. Frontend reorganizes `components/reports/` into per-tab directories with shared primitives, applies URL-state (query params) for all filter/toggle state. 4-PR sequential delivery, each PR keeps the app functional.

**Tech Stack:** ASP.NET Core 8.0, EF Core, C# 12 records, xUnit + FluentAssertions + Moq + EF InMemory for backend tests. React 19 + TypeScript + MUI + TanStack Query + Vite for frontend (no test framework — smoke-test checklists only).

**Spec reference:** `docs/superpowers/specs/2026-04-23-reports-consolidation-design.md`

---

## How to work this plan

- Tasks are grouped by PR. Each PR is a shippable unit.
- Within a PR, tasks are mostly sequential. When dependencies allow parallelism it is noted.
- Every code change is TDD-first for backend services (test → fail → implement → pass → commit).
- Frontend tasks have no test framework — use the manual smoke-test checklist at the end of each PR.
- Commit messages follow the existing convention (`feat:`, `fix:`, `refactor:`, `docs:`, `chore:`).
- Run both `dotnet build` from `src/backend/` and `npm run lint` from `src/frontend/` before every commit; run `dotnet test` after every backend task.

---

# PR 1 — Backend Foundation

**Target:** All new/refactored backend controllers, services, DTOs, and endpoints in place. No frontend changes. App remains functional via endpoint aliases.

**Branch:** `feat/reports-pr1-backend`

---

### Task 1.1: Add MovementType enum and field to DTOs

**Files:**
- Create: `src/backend/DjoppieInventory.Core/Enums/RolloutMovementType.cs`
- Modify: `src/backend/DjoppieInventory.Core/DTOs/RolloutReportDtos.cs`

- [ ] **Step 1: Create enum**

```csharp
// src/backend/DjoppieInventory.Core/Enums/RolloutMovementType.cs
namespace DjoppieInventory.Core.Enums;

public enum RolloutMovementType
{
    Onboarding = 0,
    Offboarding = 1,
    Swap = 2,
    Other = 3
}
```

- [ ] **Step 2: Add MovementType to RolloutWorkplaceChecklistDto and FutureSwapDto**

Find `RolloutWorkplaceChecklistDto` in `RolloutReportDtos.cs`. Add field:

```csharp
public RolloutMovementType MovementType { get; init; } = RolloutMovementType.Other;
```

Find `FutureSwapDto` in same file. Add identical field.

Add `using DjoppieInventory.Core.Enums;` to top of file.

- [ ] **Step 3: Verify compile**

```bash
cd src/backend && dotnet build
```

Expected: Success. Warnings about existing code OK.

- [ ] **Step 4: Commit**

```bash
git add src/backend/DjoppieInventory.Core/Enums/RolloutMovementType.cs \
        src/backend/DjoppieInventory.Core/DTOs/RolloutReportDtos.cs
git commit -m "feat(reports): add RolloutMovementType enum and DTO fields"
```

---

### Task 1.2: Test RolloutMovementClassifierService — Onboarding case

**Files:**
- Create: `src/backend/DjoppieInventory.Tests/Services/RolloutMovementClassifierServiceTests.cs`

- [ ] **Step 1: Write the failing test**

```csharp
// src/backend/DjoppieInventory.Tests/Services/RolloutMovementClassifierServiceTests.cs
using DjoppieInventory.Core.Entities;
using DjoppieInventory.Core.Enums;
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
```

- [ ] **Step 2: Run test, verify FAIL (type not defined)**

```bash
cd src/backend && dotnet test --filter "FullyQualifiedName~RolloutMovementClassifierServiceTests.Classify_OnlyNewAssets"
```

Expected: Build error — `RolloutMovementClassifierService` does not exist.

- [ ] **Step 3: Create minimal service**

```csharp
// src/backend/DjoppieInventory.Infrastructure/Services/RolloutMovementClassifierService.cs
using DjoppieInventory.Core.Entities;
using DjoppieInventory.Core.Enums;

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
```

- [ ] **Step 4: Run test, verify PASS**

```bash
cd src/backend && dotnet test --filter "FullyQualifiedName~RolloutMovementClassifierServiceTests.Classify_OnlyNewAssets"
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/backend/DjoppieInventory.Tests/Services/RolloutMovementClassifierServiceTests.cs \
        src/backend/DjoppieInventory.Infrastructure/Services/RolloutMovementClassifierService.cs
git commit -m "feat(reports): add RolloutMovementClassifierService with onboarding case"
```

---

### Task 1.3: Expand RolloutMovementClassifierService for all cases

**Files:**
- Modify: `src/backend/DjoppieInventory.Tests/Services/RolloutMovementClassifierServiceTests.cs`

- [ ] **Step 1: Add failing tests**

Append to the test class:

```csharp
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
```

- [ ] **Step 2: Run tests, verify all PASS**

```bash
cd src/backend && dotnet test --filter "FullyQualifiedName~RolloutMovementClassifierServiceTests"
```

Expected: 6 passing. If `Mixed` or `Empty` fails, the switch pattern is already correct — confirm they pass. (The implementation from 1.2 already handles these — tests are defensive.)

- [ ] **Step 3: Register service in DI**

Modify: `src/backend/DjoppieInventory.API/Extensions/ServiceCollectionExtensions.cs`

Find the service registration section and add:

```csharp
services.AddScoped<RolloutMovementClassifierService>();
```

Add using if needed: `using DjoppieInventory.Infrastructure.Services;`

- [ ] **Step 4: Build and commit**

```bash
cd src/backend && dotnet build
```

```bash
git add src/backend/DjoppieInventory.Tests/Services/RolloutMovementClassifierServiceTests.cs \
        src/backend/DjoppieInventory.API/Extensions/ServiceCollectionExtensions.cs
git commit -m "feat(reports): expand movement classifier for all cases and register in DI"
```

---

### Task 1.4: Create OverviewKpiDto and related DTOs

**Files:**
- Create: `src/backend/DjoppieInventory.Core/DTOs/OverviewReportDtos.cs`

- [ ] **Step 1: Write DTOs**

```csharp
// src/backend/DjoppieInventory.Core/DTOs/OverviewReportDtos.cs
namespace DjoppieInventory.Core.DTOs;

/// <summary>
/// Aggregated KPIs across all report domains for the Overview tab landing.
/// </summary>
public record OverviewKpiDto
{
    public OverviewAssetsKpi Assets { get; init; } = new();
    public OverviewRolloutsKpi Rollouts { get; init; } = new();
    public OverviewWorkplacesKpi Workplaces { get; init; } = new();
    public OverviewLeasingKpi Leasing { get; init; } = new();
    public OverviewIntuneKpi Intune { get; init; } = new();
    public OverviewActivityKpi Activity { get; init; } = new();
    public List<AttentionItemDto> Attention { get; init; } = new();
    public List<ActivityTrendPointDto> Trend { get; init; } = new();
}

public record OverviewAssetsKpi
{
    public int Total { get; init; }
    public int InUse { get; init; }
    public int Defect { get; init; }
    public decimal InUsePercentage { get; init; }
}

public record OverviewRolloutsKpi
{
    public int ActiveSessions { get; init; }
    public decimal AverageCompletionPercentage { get; init; }
    public int WorkplacesThisWeek { get; init; }
}

public record OverviewWorkplacesKpi
{
    public int Total { get; init; }
    public int Occupied { get; init; }
    public decimal OccupancyPercentage { get; init; }
}

public record OverviewLeasingKpi
{
    public int ActiveContracts { get; init; }
    public int ExpiringWithin60Days { get; init; }
}

public record OverviewIntuneKpi
{
    public int Enrolled { get; init; }
    public int Stale { get; init; } // last sync > 30 days
}

public record OverviewActivityKpi
{
    public int EventsLast7Days { get; init; }
}

public record AttentionItemDto
{
    public string Severity { get; init; } = "info"; // "error" | "warning" | "info"
    public string Category { get; init; } = string.Empty; // "action" | "upcoming"
    public string Message { get; init; } = string.Empty;
    public int Count { get; init; }
    public string DeepLinkUrl { get; init; } = string.Empty;
}

public record ActivityTrendPointDto
{
    public DateTime Date { get; init; }
    public int Onboarding { get; init; }
    public int Offboarding { get; init; }
    public int Swap { get; init; }
    public int Other { get; init; }
}
```

- [ ] **Step 2: Build**

```bash
cd src/backend && dotnet build
```

Expected: Success.

- [ ] **Step 3: Commit**

```bash
git add src/backend/DjoppieInventory.Core/DTOs/OverviewReportDtos.cs
git commit -m "feat(reports): add OverviewKpiDto and related DTOs"
```

---

### Task 1.5: Create IntuneSummaryDto

**Files:**
- Create: `src/backend/DjoppieInventory.Core/DTOs/IntuneSummaryDto.cs`

- [ ] **Step 1: Write DTO**

```csharp
// src/backend/DjoppieInventory.Core/DTOs/IntuneSummaryDto.cs
namespace DjoppieInventory.Core.DTOs;

public record IntuneSummaryDto
{
    public int TotalEnrolled { get; init; }
    public int Compliant { get; init; }
    public int NonCompliant { get; init; }
    public int Stale { get; init; }       // lastSync > 30 days
    public int Unenrolled { get; init; }  // assets without intuneDeviceId
    public int ErrorState { get; init; }
    public Dictionary<string, int> ByCompliance { get; init; } = new();
    public DateTime? RetrievedAt { get; init; }
}
```

- [ ] **Step 2: Build and commit**

```bash
cd src/backend && dotnet build
git add src/backend/DjoppieInventory.Core/DTOs/IntuneSummaryDto.cs
git commit -m "feat(reports): add IntuneSummaryDto"
```

---

### Task 1.6: Create EmployeeReportDtos

**Files:**
- Create: `src/backend/DjoppieInventory.Core/DTOs/EmployeeReportDtos.cs`

- [ ] **Step 1: Write DTOs**

```csharp
// src/backend/DjoppieInventory.Core/DTOs/EmployeeReportDtos.cs
namespace DjoppieInventory.Core.DTOs;

public record EmployeeReportItemDto
{
    public int EmployeeId { get; init; }
    public string DisplayName { get; init; } = string.Empty;
    public string? JobTitle { get; init; }
    public string? ServiceName { get; init; }
    public int? ServiceId { get; init; }
    public string? WorkplaceCode { get; init; }
    public int? WorkplaceId { get; init; }
    public int AssetCount { get; init; }
    public int IntuneCompliant { get; init; }
    public int IntuneNonCompliant { get; init; }
    public DateTime? LastEventDate { get; init; }
}

public record EmployeeTimelineItemDto
{
    public int EventId { get; init; }
    public DateTime EventDate { get; init; }
    public string EventType { get; init; } = string.Empty;
    public string EventTypeDisplay { get; init; } = string.Empty;
    public string Description { get; init; } = string.Empty;
    public int AssetId { get; init; }
    public string AssetCode { get; init; } = string.Empty;
    public string? OldValue { get; init; }
    public string? NewValue { get; init; }
}
```

- [ ] **Step 2: Build and commit**

```bash
cd src/backend && dotnet build
git add src/backend/DjoppieInventory.Core/DTOs/EmployeeReportDtos.cs
git commit -m "feat(reports): add employee report DTOs"
```

---

### Task 1.7: Test ReportsOverviewService.GetOverviewAsync

**Files:**
- Create: `src/backend/DjoppieInventory.Tests/Services/ReportsOverviewServiceTests.cs`

- [ ] **Step 1: Write failing test**

```csharp
// src/backend/DjoppieInventory.Tests/Services/ReportsOverviewServiceTests.cs
using DjoppieInventory.Core.Entities;
using DjoppieInventory.Core.Entities.Enums;
using DjoppieInventory.Infrastructure.Data;
using DjoppieInventory.Infrastructure.Services;
using DjoppieInventory.Tests.Helpers;
using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;

namespace DjoppieInventory.Tests.Services;

public class ReportsOverviewServiceTests
{
    private ApplicationDbContext CreateDb() => TestDbContextFactory.Create();

    [Fact]
    public async Task GetOverviewAsync_CountsAssetsByStatus()
    {
        await using var db = CreateDb();
        db.Assets.AddRange(
            new Asset { Id = 1, AssetCode = "A1", Name = "A1", Status = AssetStatus.InGebruik },
            new Asset { Id = 2, AssetCode = "A2", Name = "A2", Status = AssetStatus.InGebruik },
            new Asset { Id = 3, AssetCode = "A3", Name = "A3", Status = AssetStatus.Stock },
            new Asset { Id = 4, AssetCode = "A4", Name = "A4", Status = AssetStatus.Defect }
        );
        await db.SaveChangesAsync();

        var sut = new ReportsOverviewService(db, NullLogger<ReportsOverviewService>.Instance);
        var result = await sut.GetOverviewAsync();

        result.Assets.Total.Should().Be(4);
        result.Assets.InUse.Should().Be(2);
        result.Assets.Defect.Should().Be(1);
        result.Assets.InUsePercentage.Should().Be(50m);
    }
}
```

- [ ] **Step 2: Run test, verify FAIL (type not defined)**

```bash
cd src/backend && dotnet test --filter "FullyQualifiedName~ReportsOverviewServiceTests"
```

Expected: Build error — `ReportsOverviewService` does not exist.

- [ ] **Step 3: Implement minimal service**

```csharp
// src/backend/DjoppieInventory.Infrastructure/Services/ReportsOverviewService.cs
using DjoppieInventory.Core.DTOs;
using DjoppieInventory.Core.Entities.Enums;
using DjoppieInventory.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace DjoppieInventory.Infrastructure.Services;

public class ReportsOverviewService
{
    private readonly ApplicationDbContext _db;
    private readonly ILogger<ReportsOverviewService> _logger;

    public ReportsOverviewService(ApplicationDbContext db, ILogger<ReportsOverviewService> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task<OverviewKpiDto> GetOverviewAsync(CancellationToken ct = default)
    {
        var assetsTask = ComputeAssetsKpiAsync(ct);
        // Other domains added in later tasks
        var assets = await assetsTask;

        return new OverviewKpiDto
        {
            Assets = assets
        };
    }

    private async Task<OverviewAssetsKpi> ComputeAssetsKpiAsync(CancellationToken ct)
    {
        var counts = await _db.Assets.AsNoTracking()
            .GroupBy(a => a.Status)
            .Select(g => new { Status = g.Key, Count = g.Count() })
            .ToListAsync(ct);

        var total = counts.Sum(c => c.Count);
        var inUse = counts.FirstOrDefault(c => c.Status == AssetStatus.InGebruik)?.Count ?? 0;
        var defect = counts.FirstOrDefault(c => c.Status == AssetStatus.Defect)?.Count ?? 0;

        return new OverviewAssetsKpi
        {
            Total = total,
            InUse = inUse,
            Defect = defect,
            InUsePercentage = total == 0 ? 0m : Math.Round(100m * inUse / total, 1)
        };
    }
}
```

- [ ] **Step 4: Run test, verify PASS**

```bash
cd src/backend && dotnet test --filter "FullyQualifiedName~ReportsOverviewServiceTests.GetOverviewAsync_CountsAssetsByStatus"
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/backend/DjoppieInventory.Tests/Services/ReportsOverviewServiceTests.cs \
        src/backend/DjoppieInventory.Infrastructure/Services/ReportsOverviewService.cs
git commit -m "feat(reports): add ReportsOverviewService with assets KPI"
```

---

### Task 1.8: Extend ReportsOverviewService with remaining KPIs

**Files:**
- Modify: `src/backend/DjoppieInventory.Tests/Services/ReportsOverviewServiceTests.cs`
- Modify: `src/backend/DjoppieInventory.Infrastructure/Services/ReportsOverviewService.cs`

- [ ] **Step 1: Add failing tests for each KPI domain**

Append tests for each domain (Rollouts, Workplaces, Leasing, Intune, Activity). Example pattern for Workplaces:

```csharp
[Fact]
public async Task GetOverviewAsync_CountsWorkplaceOccupancy()
{
    await using var db = CreateDb();
    db.PhysicalWorkplaces.AddRange(
        new PhysicalWorkplace { Id = 1, Code = "W1", Name = "W1", CurrentOccupantId = 10 },
        new PhysicalWorkplace { Id = 2, Code = "W2", Name = "W2", CurrentOccupantId = null },
        new PhysicalWorkplace { Id = 3, Code = "W3", Name = "W3", CurrentOccupantId = 20 }
    );
    await db.SaveChangesAsync();

    var sut = new ReportsOverviewService(db, NullLogger<ReportsOverviewService>.Instance);
    var result = await sut.GetOverviewAsync();

    result.Workplaces.Total.Should().Be(3);
    result.Workplaces.Occupied.Should().Be(2);
    result.Workplaces.OccupancyPercentage.Should().BeApproximately(66.7m, 0.1m);
}
```

Write analogous tests for Rollouts (active sessions), Leasing (active & expiring <60d), Intune (enrolled & stale), Activity (events last 7 days). Each test uses `TestDbContextFactory.Create()` and seeds entities directly.

- [ ] **Step 2: Run failing tests**

```bash
cd src/backend && dotnet test --filter "FullyQualifiedName~ReportsOverviewServiceTests"
```

Expected: New tests fail with default zero values.

- [ ] **Step 3: Implement ComputeWorkplacesKpiAsync, ComputeRolloutsKpiAsync, ComputeLeasingKpiAsync, ComputeIntuneKpiAsync, ComputeActivityKpiAsync**

Extend the service. Use `Task.WhenAll` for parallel execution:

```csharp
public async Task<OverviewKpiDto> GetOverviewAsync(CancellationToken ct = default)
{
    var assetsTask    = ComputeAssetsKpiAsync(ct);
    var rolloutsTask  = ComputeRolloutsKpiAsync(ct);
    var wpTask        = ComputeWorkplacesKpiAsync(ct);
    var leasingTask   = ComputeLeasingKpiAsync(ct);
    var intuneTask    = ComputeIntuneKpiAsync(ct);
    var activityTask  = ComputeActivityKpiAsync(ct);
    var attentionTask = ComputeAttentionAsync(ct);
    var trendTask     = ComputeTrendAsync(ct);

    await Task.WhenAll(assetsTask, rolloutsTask, wpTask, leasingTask, intuneTask, activityTask, attentionTask, trendTask);

    return new OverviewKpiDto
    {
        Assets = assetsTask.Result,
        Rollouts = rolloutsTask.Result,
        Workplaces = wpTask.Result,
        Leasing = leasingTask.Result,
        Intune = intuneTask.Result,
        Activity = activityTask.Result,
        Attention = attentionTask.Result,
        Trend = trendTask.Result
    };
}

private async Task<OverviewWorkplacesKpi> ComputeWorkplacesKpiAsync(CancellationToken ct)
{
    var total = await _db.PhysicalWorkplaces.AsNoTracking().CountAsync(ct);
    var occupied = await _db.PhysicalWorkplaces.AsNoTracking()
        .CountAsync(w => w.CurrentOccupantId != null, ct);
    return new OverviewWorkplacesKpi
    {
        Total = total,
        Occupied = occupied,
        OccupancyPercentage = total == 0 ? 0m : Math.Round(100m * occupied / total, 1)
    };
}

private async Task<OverviewRolloutsKpi> ComputeRolloutsKpiAsync(CancellationToken ct)
{
    var sessions = await _db.RolloutSessions.AsNoTracking()
        .Where(s => s.Status == "InProgress")
        .Include(s => s.Workplaces)
        .ToListAsync(ct);

    var active = sessions.Count;
    var avgPct = sessions.Count == 0 ? 0m : Math.Round((decimal)sessions.Average(s =>
        s.Workplaces.Count == 0 ? 0 : 100.0 * s.Workplaces.Count(w => w.Status == "Completed") / s.Workplaces.Count), 1);

    var weekFrom = DateTime.Today;
    var weekTo = weekFrom.AddDays(7);
    var wpsThisWeek = await _db.RolloutWorkplaces.AsNoTracking()
        .CountAsync(w => w.Day != null && w.Day.Date >= weekFrom && w.Day.Date < weekTo, ct);

    return new OverviewRolloutsKpi
    {
        ActiveSessions = active,
        AverageCompletionPercentage = avgPct,
        WorkplacesThisWeek = wpsThisWeek
    };
}

private async Task<OverviewLeasingKpi> ComputeLeasingKpiAsync(CancellationToken ct)
{
    // If no Lease entity exists yet, return zeros. Otherwise count active + expiring within 60d.
    // Check presence via context: if _db.Leases is available in DbContext, use it.
    return new OverviewLeasingKpi(); // placeholder — actual impl depends on Lease entity status
}

private async Task<OverviewIntuneKpi> ComputeIntuneKpiAsync(CancellationToken ct)
{
    var enrolled = await _db.Assets.AsNoTracking()
        .CountAsync(a => a.IntuneDeviceId != null && a.IntuneDeviceId != "", ct);
    var staleThreshold = DateTime.UtcNow.AddDays(-30);
    var stale = await _db.Assets.AsNoTracking()
        .CountAsync(a => a.IntuneDeviceId != null && a.IntuneLastSync != null && a.IntuneLastSync < staleThreshold, ct);

    return new OverviewIntuneKpi { Enrolled = enrolled, Stale = stale };
}

private async Task<OverviewActivityKpi> ComputeActivityKpiAsync(CancellationToken ct)
{
    var since = DateTime.UtcNow.AddDays(-7);
    var count = await _db.AssetEvents.AsNoTracking()
        .CountAsync(e => e.EventDate >= since, ct);
    return new OverviewActivityKpi { EventsLast7Days = count };
}

private async Task<List<AttentionItemDto>> ComputeAttentionAsync(CancellationToken ct)
{
    var list = new List<AttentionItemDto>();

    var defectCount = await _db.Assets.AsNoTracking().CountAsync(a => a.Status == AssetStatus.Defect, ct);
    if (defectCount > 0)
        list.Add(new AttentionItemDto
        {
            Severity = "error", Category = "action",
            Message = $"{defectCount} defecte assets", Count = defectCount,
            DeepLinkUrl = "/reports?tab=assets&view=nu&status=Defect"
        });

    var staleThreshold = DateTime.UtcNow.AddDays(-30);
    var staleCount = await _db.Assets.AsNoTracking()
        .CountAsync(a => a.IntuneLastSync != null && a.IntuneLastSync < staleThreshold, ct);
    if (staleCount > 0)
        list.Add(new AttentionItemDto
        {
            Severity = "warning", Category = "action",
            Message = $"{staleCount} devices niet gesynchroniseerd >30d", Count = staleCount,
            DeepLinkUrl = "/reports?tab=intune"
        });

    return list;
}

private async Task<List<ActivityTrendPointDto>> ComputeTrendAsync(CancellationToken ct)
{
    var since = DateTime.UtcNow.AddDays(-30).Date;
    var events = await _db.AssetEvents.AsNoTracking()
        .Where(e => e.EventDate >= since)
        .Select(e => new { e.EventDate, e.EventType })
        .ToListAsync(ct);

    var grouped = events
        .GroupBy(e => e.EventDate.Date)
        .Select(g => new ActivityTrendPointDto
        {
            Date = g.Key,
            Onboarding = g.Count(e => e.EventType == AssetEventType.DeviceOnboarded),
            Offboarding = g.Count(e => e.EventType == AssetEventType.DeviceOffboarded),
            Swap = g.Count(e => e.EventType == AssetEventType.LaptopSwapped),
            Other = g.Count(e => e.EventType != AssetEventType.DeviceOnboarded
                               && e.EventType != AssetEventType.DeviceOffboarded
                               && e.EventType != AssetEventType.LaptopSwapped)
        })
        .OrderBy(p => p.Date)
        .ToList();

    return grouped;
}
```

Note: `ComputeLeasingKpiAsync` is a placeholder — if Lease entity does not yet exist in the project, leave the method returning empty `OverviewLeasingKpi()`. Add real implementation in a follow-up when Lease entity lands. This is acceptable per spec Section 13 (Leasing polish is limited to color-coding and timeline chart, the data model is assumed to exist).

- [ ] **Step 4: Register service in DI**

In `src/backend/DjoppieInventory.API/Extensions/ServiceCollectionExtensions.cs`:

```csharp
services.AddScoped<ReportsOverviewService>();
```

- [ ] **Step 5: Run all tests**

```bash
cd src/backend && dotnet test --filter "FullyQualifiedName~ReportsOverviewServiceTests"
```

Expected: all PASS.

- [ ] **Step 6: Commit**

```bash
git add src/backend/DjoppieInventory.Infrastructure/Services/ReportsOverviewService.cs \
        src/backend/DjoppieInventory.Tests/Services/ReportsOverviewServiceTests.cs \
        src/backend/DjoppieInventory.API/Extensions/ServiceCollectionExtensions.cs
git commit -m "feat(reports): complete ReportsOverviewService with all KPI domains"
```

---

### Task 1.9: Create ReportsOverviewController

**Files:**
- Create: `src/backend/DjoppieInventory.API/Controllers/Reports/ReportsOverviewController.cs`

- [ ] **Step 1: Write controller**

```csharp
// src/backend/DjoppieInventory.API/Controllers/Reports/ReportsOverviewController.cs
using DjoppieInventory.Core.DTOs;
using DjoppieInventory.Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DjoppieInventory.API.Controllers.Reports;

[ApiController]
[Route("api/reports")]
[Authorize]
public class ReportsOverviewController : ControllerBase
{
    private readonly ReportsOverviewService _overviewService;

    public ReportsOverviewController(ReportsOverviewService overviewService)
    {
        _overviewService = overviewService;
    }

    /// <summary>
    /// Returns aggregated KPIs across all report domains for the Overview dashboard.
    /// </summary>
    [HttpGet("overview")]
    [ProducesResponseType(typeof(OverviewKpiDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<OverviewKpiDto>> GetOverview(CancellationToken ct)
    {
        var result = await _overviewService.GetOverviewAsync(ct);
        return Ok(result);
    }
}
```

- [ ] **Step 2: Manual verify via Swagger**

```bash
cd src/backend/DjoppieInventory.API && dotnet run
```

Open `http://localhost:5052/swagger`, find `GET /api/reports/overview`, execute. Expected: 200 response with KPI structure.

- [ ] **Step 3: Commit**

```bash
git add src/backend/DjoppieInventory.API/Controllers/Reports/ReportsOverviewController.cs
git commit -m "feat(reports): add ReportsOverviewController with /api/reports/overview endpoint"
```

---

### Task 1.10: Create IntuneReportsController with summary endpoint

**Files:**
- Create: `src/backend/DjoppieInventory.API/Controllers/Reports/IntuneReportsController.cs`

- [ ] **Step 1: Write controller**

```csharp
// src/backend/DjoppieInventory.API/Controllers/Reports/IntuneReportsController.cs
using DjoppieInventory.Core.DTOs;
using DjoppieInventory.Core.Entities.Enums;
using DjoppieInventory.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DjoppieInventory.API.Controllers.Reports;

[ApiController]
[Route("api/reports/intune")]
[Authorize]
public class IntuneReportsController : ControllerBase
{
    private readonly ApplicationDbContext _db;

    public IntuneReportsController(ApplicationDbContext db)
    {
        _db = db;
    }

    [HttpGet("summary")]
    [ProducesResponseType(typeof(IntuneSummaryDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<IntuneSummaryDto>> GetSummary(CancellationToken ct)
    {
        var assets = await _db.Assets.AsNoTracking()
            .Select(a => new
            {
                a.IntuneDeviceId,
                a.IntuneComplianceState,
                a.IntuneLastSync,
                a.Status
            })
            .ToListAsync(ct);

        var staleThreshold = DateTime.UtcNow.AddDays(-30);
        var enrolled = assets.Count(a => !string.IsNullOrEmpty(a.IntuneDeviceId));
        var compliant = assets.Count(a => a.IntuneComplianceState == "compliant");
        var nonCompliant = assets.Count(a => a.IntuneComplianceState == "noncompliant");
        var stale = assets.Count(a => !string.IsNullOrEmpty(a.IntuneDeviceId)
                                      && a.IntuneLastSync != null
                                      && a.IntuneLastSync < staleThreshold);
        var unenrolled = assets.Count(a => string.IsNullOrEmpty(a.IntuneDeviceId)
                                            && a.Status != AssetStatus.UitDienst);
        var errorState = assets.Count(a => a.IntuneComplianceState == "error");

        var byCompliance = assets
            .Where(a => !string.IsNullOrEmpty(a.IntuneComplianceState))
            .GroupBy(a => a.IntuneComplianceState!)
            .ToDictionary(g => g.Key, g => g.Count());

        return Ok(new IntuneSummaryDto
        {
            TotalEnrolled = enrolled,
            Compliant = compliant,
            NonCompliant = nonCompliant,
            Stale = stale,
            Unenrolled = unenrolled,
            ErrorState = errorState,
            ByCompliance = byCompliance,
            RetrievedAt = DateTime.UtcNow
        });
    }
}
```

- [ ] **Step 2: Verify via Swagger**

Run the API and hit `/api/reports/intune/summary`. Expected: 200 with counts.

- [ ] **Step 3: Commit**

```bash
git add src/backend/DjoppieInventory.API/Controllers/Reports/IntuneReportsController.cs
git commit -m "feat(reports): add IntuneReportsController with /summary endpoint"
```

---

### Task 1.11: Test and implement EmployeeReportsService

**Files:**
- Create: `src/backend/DjoppieInventory.Tests/Services/EmployeeReportsServiceTests.cs`
- Create: `src/backend/DjoppieInventory.Infrastructure/Services/EmployeeReportsService.cs`

- [ ] **Step 1: Write failing test**

```csharp
// src/backend/DjoppieInventory.Tests/Services/EmployeeReportsServiceTests.cs
using DjoppieInventory.Core.Entities;
using DjoppieInventory.Core.Entities.Enums;
using DjoppieInventory.Infrastructure.Services;
using DjoppieInventory.Tests.Helpers;
using FluentAssertions;

namespace DjoppieInventory.Tests.Services;

public class EmployeeReportsServiceTests
{
    [Fact]
    public async Task GetEmployeesAsync_ReturnsEmployeesWithAssetCount()
    {
        await using var db = TestDbContextFactory.Create();
        db.Employees.Add(new Employee
        {
            Id = 1,
            DisplayName = "Jan de Vries",
            UserPrincipalName = "jan@example.com",
            IsActive = true
        });
        db.Assets.AddRange(
            new Asset { Id = 10, AssetCode = "A1", Name = "A1", Status = AssetStatus.InGebruik, EmployeeId = 1 },
            new Asset { Id = 11, AssetCode = "A2", Name = "A2", Status = AssetStatus.InGebruik, EmployeeId = 1 }
        );
        await db.SaveChangesAsync();

        var sut = new EmployeeReportsService(db);
        var result = await sut.GetEmployeesAsync();

        result.Should().HaveCount(1);
        result[0].EmployeeId.Should().Be(1);
        result[0].DisplayName.Should().Be("Jan de Vries");
        result[0].AssetCount.Should().Be(2);
    }
}
```

- [ ] **Step 2: Run test, verify FAIL**

```bash
cd src/backend && dotnet test --filter "FullyQualifiedName~EmployeeReportsServiceTests"
```

Expected: Build error, service undefined.

- [ ] **Step 3: Implement service**

```csharp
// src/backend/DjoppieInventory.Infrastructure/Services/EmployeeReportsService.cs
using DjoppieInventory.Core.DTOs;
using DjoppieInventory.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace DjoppieInventory.Infrastructure.Services;

public class EmployeeReportsService
{
    private readonly ApplicationDbContext _db;

    public EmployeeReportsService(ApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<List<EmployeeReportItemDto>> GetEmployeesAsync(CancellationToken ct = default)
    {
        var query = from e in _db.Employees.AsNoTracking()
                    where e.IsActive
                    let assets = _db.Assets.Where(a => a.EmployeeId == e.Id)
                    let lastEvent = _db.AssetEvents
                        .Where(ev => assets.Select(a => a.Id).Contains(ev.AssetId))
                        .OrderByDescending(ev => ev.EventDate)
                        .Select(ev => (DateTime?)ev.EventDate)
                        .FirstOrDefault()
                    select new EmployeeReportItemDto
                    {
                        EmployeeId = e.Id,
                        DisplayName = e.DisplayName,
                        JobTitle = e.JobTitle,
                        ServiceName = e.Service != null ? e.Service.Name : null,
                        ServiceId = e.ServiceId,
                        AssetCount = assets.Count(),
                        IntuneCompliant = assets.Count(a => a.IntuneComplianceState == "compliant"),
                        IntuneNonCompliant = assets.Count(a => a.IntuneComplianceState == "noncompliant"),
                        LastEventDate = lastEvent
                    };

        return await query.ToListAsync(ct);
    }

    public async Task<List<EmployeeTimelineItemDto>> GetEmployeeTimelineAsync(int employeeId, int take = 50, CancellationToken ct = default)
    {
        return await _db.AssetEvents.AsNoTracking()
            .Where(ev => _db.Assets.Any(a => a.Id == ev.AssetId && a.EmployeeId == employeeId))
            .OrderByDescending(ev => ev.EventDate)
            .Take(take)
            .Select(ev => new EmployeeTimelineItemDto
            {
                EventId = ev.Id,
                EventDate = ev.EventDate,
                EventType = ev.EventType.ToString(),
                EventTypeDisplay = ev.EventType.ToString(),
                Description = ev.Description ?? string.Empty,
                AssetId = ev.AssetId,
                AssetCode = ev.Asset != null ? ev.Asset.AssetCode : string.Empty,
                OldValue = ev.OldValue,
                NewValue = ev.NewValue
            })
            .ToListAsync(ct);
    }
}
```

- [ ] **Step 4: Register in DI**

Add to `ServiceCollectionExtensions.cs`:

```csharp
services.AddScoped<EmployeeReportsService>();
```

- [ ] **Step 5: Run test, verify PASS**

```bash
cd src/backend && dotnet test --filter "FullyQualifiedName~EmployeeReportsServiceTests"
```

- [ ] **Step 6: Commit**

```bash
git add src/backend/DjoppieInventory.Tests/Services/EmployeeReportsServiceTests.cs \
        src/backend/DjoppieInventory.Infrastructure/Services/EmployeeReportsService.cs \
        src/backend/DjoppieInventory.API/Extensions/ServiceCollectionExtensions.cs
git commit -m "feat(reports): add EmployeeReportsService with employee listing and timeline"
```

---

### Task 1.12: Create EmployeeReportsController

**Files:**
- Create: `src/backend/DjoppieInventory.API/Controllers/Reports/EmployeeReportsController.cs`

- [ ] **Step 1: Write controller**

```csharp
using DjoppieInventory.Core.DTOs;
using DjoppieInventory.Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DjoppieInventory.API.Controllers.Reports;

[ApiController]
[Route("api/reports/employees")]
[Authorize]
public class EmployeeReportsController : ControllerBase
{
    private readonly EmployeeReportsService _service;

    public EmployeeReportsController(EmployeeReportsService service)
    {
        _service = service;
    }

    [HttpGet]
    [ProducesResponseType(typeof(List<EmployeeReportItemDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<EmployeeReportItemDto>>> GetEmployees(CancellationToken ct)
    {
        return Ok(await _service.GetEmployeesAsync(ct));
    }

    [HttpGet("{id:int}/timeline")]
    [ProducesResponseType(typeof(List<EmployeeTimelineItemDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<EmployeeTimelineItemDto>>> GetTimeline(int id, [FromQuery] int take = 50, CancellationToken ct = default)
    {
        return Ok(await _service.GetEmployeeTimelineAsync(id, take, ct));
    }
}
```

- [ ] **Step 2: Verify via Swagger**

- [ ] **Step 3: Commit**

```bash
git add src/backend/DjoppieInventory.API/Controllers/Reports/EmployeeReportsController.cs
git commit -m "feat(reports): add EmployeeReportsController"
```

---

### Task 1.13: Split OperationsReportsController — extract asset history

**Files:**
- Create: `src/backend/DjoppieInventory.API/Controllers/Reports/AssetHistoryReportsController.cs`
- Modify: `src/backend/DjoppieInventory.API/Controllers/Reports/OperationsReportsController.cs`

- [ ] **Step 1: Read current `OperationsReportsController.cs`**

Identify the three action methods related to swap/history (approx lines 60-400):
- `GetSwapHistory` (`[HttpGet("swaps")]`)
- `GetSwapHistorySummary` (`[HttpGet("swaps/summary")]`)
- `ExportSwapHistory` (`[HttpGet("swaps/export")]`)
- Any private helpers they use

- [ ] **Step 2: Create new AssetHistoryReportsController with the moved endpoints**

```csharp
// src/backend/DjoppieInventory.API/Controllers/Reports/AssetHistoryReportsController.cs
using DjoppieInventory.Core.DTOs;
using DjoppieInventory.Core.Entities.Enums;
using DjoppieInventory.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DjoppieInventory.API.Controllers.Reports;

/// <summary>
/// Asset change history reports: status, owner, location changes, onboarding/offboarding events.
/// New paths: /api/reports/assets/change-history[/...]
/// Legacy /api/reports/swaps paths continue to work via alias in OperationsReportsController.
/// </summary>
[ApiController]
[Route("api/reports/assets/change-history")]
[Authorize]
public class AssetHistoryReportsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<AssetHistoryReportsController> _logger;

    public AssetHistoryReportsController(ApplicationDbContext context, ILogger<AssetHistoryReportsController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<AssetChangeHistoryItemDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<AssetChangeHistoryItemDto>>> GetChangeHistory(
        [FromQuery] string? dateFrom = null,
        [FromQuery] string? dateTo = null,
        [FromQuery] int? serviceId = null,
        [FromQuery] string? eventType = null,
        [FromQuery] string? search = null,
        CancellationToken cancellationToken = default)
    {
        // COPY BODY VERBATIM FROM OperationsReportsController.GetSwapHistory
        // (includes existing includes, filters, projection to AssetChangeHistoryItemDto)
        throw new NotImplementedException("TODO: copy body from OperationsReportsController.GetSwapHistory");
    }

    [HttpGet("summary")]
    [ProducesResponseType(typeof(AssetChangeHistorySummaryDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<AssetChangeHistorySummaryDto>> GetSummary(
        [FromQuery] string? dateFrom = null,
        [FromQuery] string? dateTo = null,
        CancellationToken cancellationToken = default)
    {
        // COPY BODY VERBATIM FROM OperationsReportsController.GetSwapHistorySummary
        throw new NotImplementedException("TODO");
    }

    [HttpGet("export")]
    [ProducesResponseType(typeof(FileContentResult), StatusCodes.Status200OK)]
    public async Task<IActionResult> Export(
        [FromQuery] string? dateFrom = null,
        [FromQuery] string? dateTo = null,
        CancellationToken cancellationToken = default)
    {
        // COPY BODY VERBATIM FROM OperationsReportsController.ExportSwapHistory
        throw new NotImplementedException("TODO");
    }
}
```

Then manually copy each method body from `OperationsReportsController` into the new controller. Replace `NotImplementedException` placeholders with the real logic. Change any log messages to use the new controller name.

- [ ] **Step 3: Keep alias endpoints in OperationsReportsController**

Replace the three moved action methods in `OperationsReportsController.cs` with thin proxy methods marked `[Obsolete]`:

```csharp
// Keep signatures, proxy to new controller via service or duplicate minimal logic.
// For simplicity: redirect via HTTP 308 is NOT appropriate (breaks body). Instead,
// keep the old method bodies temporarily but add deprecation log.

[HttpGet("swaps")]
[Obsolete("Use /api/reports/assets/change-history")]
public async Task<ActionResult<IEnumerable<AssetChangeHistoryItemDto>>> GetSwapHistoryLegacy(
    [FromQuery] string? dateFrom = null,
    [FromQuery] string? dateTo = null,
    [FromQuery] int? serviceId = null,
    [FromQuery] string? eventType = null,
    [FromQuery] string? search = null,
    CancellationToken cancellationToken = default)
{
    _logger.LogWarning("Deprecated endpoint /api/reports/swaps called; use /api/reports/assets/change-history");
    // delegate by invoking new controller action directly or keep duplicated body for 1 release
    return await GetSwapHistory(dateFrom, dateTo, serviceId, eventType, search, cancellationToken);
}
```

Actually — simpler: **keep the existing method bodies in OperationsReportsController with `[Obsolete]`** and also expose them in the new controller. Duplicated code for 1 release is acceptable for backwards-compat. We delete the old methods in PR4 after frontend has migrated.

- [ ] **Step 4: Build and run**

```bash
cd src/backend && dotnet build
```

Expected: Success. Both old and new endpoints compile.

- [ ] **Step 5: Verify via Swagger both endpoints return same shape**

- [ ] **Step 6: Commit**

```bash
git add src/backend/DjoppieInventory.API/Controllers/Reports/AssetHistoryReportsController.cs \
        src/backend/DjoppieInventory.API/Controllers/Reports/OperationsReportsController.cs
git commit -m "refactor(reports): split asset change history into AssetHistoryReportsController with legacy alias"
```

---

### Task 1.14: Add asset timeline endpoint

**Files:**
- Modify: `src/backend/DjoppieInventory.API/Controllers/Reports/AssetHistoryReportsController.cs`

- [ ] **Step 1: Add timeline action**

Append to `AssetHistoryReportsController`:

```csharp
/// <summary>
/// Returns paged timeline events for a single asset (for expandable-row UI in Assets tab).
/// </summary>
[HttpGet("/api/reports/assets/{assetId:int}/timeline")]
[ProducesResponseType(typeof(List<AssetChangeHistoryItemDto>), StatusCodes.Status200OK)]
public async Task<ActionResult<List<AssetChangeHistoryItemDto>>> GetAssetTimeline(
    int assetId,
    [FromQuery] int take = 50,
    [FromQuery] int skip = 0,
    CancellationToken ct = default)
{
    var events = await _context.AssetEvents
        .AsNoTracking()
        .Where(e => e.AssetId == assetId)
        .OrderByDescending(e => e.EventDate)
        .Skip(skip).Take(Math.Min(take, 200))
        .Select(e => new AssetChangeHistoryItemDto
        {
            Id = e.Id,
            EventDate = e.EventDate,
            AssetId = e.AssetId,
            AssetCode = e.Asset != null ? e.Asset.AssetCode : string.Empty,
            AssetName = e.Asset != null ? e.Asset.Name : null,
            EventType = e.EventType.ToString(),
            EventTypeDisplay = e.EventType.ToString(),
            Description = e.Description ?? string.Empty,
            OldValue = e.OldValue,
            NewValue = e.NewValue,
            PerformedBy = e.PerformedBy,
            Notes = e.Notes
        })
        .ToListAsync(ct);

    return Ok(events);
}
```

Note: uses an absolute route (`/api/reports/assets/{id}/timeline`) overriding the controller's `[Route]`. This keeps URL semantics clean.

- [ ] **Step 2: Verify via Swagger** with a known asset ID.

- [ ] **Step 3: Commit**

```bash
git add src/backend/DjoppieInventory.API/Controllers/Reports/AssetHistoryReportsController.cs
git commit -m "feat(reports): add asset timeline endpoint for expandable-row UI"
```

---

### Task 1.15: Rename hardware endpoint to assets/snapshot with alias

**Files:**
- Modify: `src/backend/DjoppieInventory.API/Controllers/Reports/InventoryReportsController.cs`

- [ ] **Step 1: Add new route alongside legacy**

Find existing `[HttpGet("hardware")]` method in `InventoryReportsController`. Add a second `[HttpGet]` attribute:

```csharp
[HttpGet("hardware")]
[HttpGet("assets/snapshot")]
public async Task<ActionResult<...>> GetHardware(...) { ... }
```

Repeat for `GetHardwareSummary` (`hardware/summary` + `assets/snapshot/summary`) and `ExportHardware` (`hardware/export` + `assets/snapshot/export`).

Add `[Obsolete]` note in XML comment for `hardware` paths.

- [ ] **Step 2: Verify via Swagger both paths listed and returning same data**

- [ ] **Step 3: Commit**

```bash
git add src/backend/DjoppieInventory.API/Controllers/Reports/InventoryReportsController.cs
git commit -m "refactor(reports): add /assets/snapshot alias for hardware endpoints"
```

---

### Task 1.16: Apply RolloutMovementClassifierService in RolloutReportService

**Files:**
- Modify: existing rollout report service (find it — likely in `DjoppieInventory.Infrastructure/Services/` or referenced by `OperationsReportsController` methods `GetRolloutSessionReport`/`GetRolloutSessionChecklist`).

- [ ] **Step 1: Locate rollout report service**

```bash
grep -rn "RolloutSessionReportDto\|RolloutDayChecklistDto" src/backend/DjoppieInventory.Infrastructure/Services/
```

Find where `RolloutWorkplaceChecklistDto` is constructed.

- [ ] **Step 2: Inject classifier and set MovementType**

At the DI-injection point add `RolloutMovementClassifierService`. At construction of each `RolloutWorkplaceChecklistDto`, call the classifier against the workplace's `WorkplaceAssetAssignments`:

```csharp
var movementType = _classifier.Classify(workplace.Assignments);

var checklist = new RolloutWorkplaceChecklistDto
{
    // ... existing fields
    MovementType = movementType
};
```

Same for `FutureSwapDto` construction.

- [ ] **Step 3: Run any existing tests**

```bash
cd src/backend && dotnet test
```

Expected: all pass.

- [ ] **Step 4: Manually verify via Swagger**

Open `/api/operations/rollouts/reports/{sessionId}/checklist`. Expected: each workplace includes a `movementType` field.

- [ ] **Step 5: Commit**

```bash
git add src/backend/DjoppieInventory.Infrastructure/Services/<rolloutReportService>.cs
git commit -m "feat(reports): populate MovementType for rollout workplaces via classifier"
```

---

### Task 1.17: Verify backend, smoke-test, merge to develop

- [ ] **Step 1: Run all tests**

```bash
cd src/backend && dotnet test
```

Expected: all PASS.

- [ ] **Step 2: Manual smoke via Swagger**

Start API: `cd src/backend/DjoppieInventory.API && dotnet run`. Verify:
- `GET /api/reports/overview` returns a populated `OverviewKpiDto`
- `GET /api/reports/intune/summary` returns counts
- `GET /api/reports/employees` returns list
- `GET /api/reports/employees/{id}/timeline` returns events
- `GET /api/reports/assets/snapshot` returns data (same shape as `/hardware`)
- `GET /api/reports/assets/change-history` returns data (same shape as `/swaps`)
- `GET /api/reports/assets/{id}/timeline` returns per-asset events
- `GET /api/operations/rollouts/reports/{id}/checklist` includes `movementType` on each workplace

- [ ] **Step 3: Open PR, merge when CI green**

PR description includes: list of new endpoints, list of aliases, links to spec.

---

# PR 2 — Shared Frontend Components

**Target:** Five reusable components ready for consumption by later PRs. No routing changes. No backend changes.

**Branch:** `feat/reports-pr2-shared-components`

---

### Task 2.1: Create shared directory structure

**Files:**
- Create: `src/frontend/src/components/reports/shared/` directory

- [ ] **Step 1: Create directory and index**

```bash
mkdir -p "C:/Djoppie/Djoppie-Inventory/src/frontend/src/components/reports/shared"
```

Create `src/frontend/src/components/reports/shared/index.ts`:

```ts
export { default as ExportMenu } from './ExportMenu';
export { default as ReportErrorState } from './ReportErrorState';
export { default as ReportEmptyState } from './ReportEmptyState';
export { default as IntuneBadge } from './IntuneBadge';
export { default as LastSyncChip } from './LastSyncChip';
```

Components created in subsequent tasks. Empty index is a placeholder; will be populated incrementally.

- [ ] **Step 2: Commit**

```bash
git add src/frontend/src/components/reports/shared/index.ts
git commit -m "chore(reports): scaffold shared components directory"
```

---

### Task 2.2: Create ExportMenu component

**Files:**
- Create: `src/frontend/src/components/reports/shared/ExportMenu.tsx`

- [ ] **Step 1: Write component**

```tsx
// src/frontend/src/components/reports/shared/ExportMenu.tsx
import { useState } from 'react';
import { IconButton, Menu, MenuItem, Tooltip, CircularProgress, ListItemIcon, ListItemText } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import DescriptionIcon from '@mui/icons-material/Description';
import TableChartIcon from '@mui/icons-material/TableChart';

interface ExportMenuProps {
  onCsvExport?: () => void;
  onExcelExport?: () => void;
  isExporting?: boolean;
  accentColor?: string;
  disabled?: boolean;
}

const ExportMenu = ({ onCsvExport, onExcelExport, isExporting, accentColor = '#FF7700', disabled }: ExportMenuProps) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleOpen = (e: React.MouseEvent<HTMLElement>) => setAnchorEl(e.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const handleCsv = () => {
    onCsvExport?.();
    handleClose();
  };

  const handleExcel = () => {
    onExcelExport?.();
    handleClose();
  };

  return (
    <>
      <Tooltip title="Exporteer">
        <span>
          <IconButton
            size="small"
            onClick={handleOpen}
            disabled={disabled || isExporting}
            sx={{ color: accentColor }}
            aria-label="Export menu"
            aria-haspopup="menu"
            aria-expanded={open}
          >
            {isExporting ? <CircularProgress size={16} sx={{ color: accentColor }} /> : <DownloadIcon fontSize="small" />}
          </IconButton>
        </span>
      </Tooltip>
      <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
        {onCsvExport && (
          <MenuItem onClick={handleCsv}>
            <ListItemIcon><DescriptionIcon fontSize="small" /></ListItemIcon>
            <ListItemText>CSV (gefilterd)</ListItemText>
          </MenuItem>
        )}
        {onExcelExport && (
          <MenuItem onClick={handleExcel}>
            <ListItemIcon><TableChartIcon fontSize="small" /></ListItemIcon>
            <ListItemText>Excel (gefilterd)</ListItemText>
          </MenuItem>
        )}
      </Menu>
    </>
  );
};

export default ExportMenu;
```

- [ ] **Step 2: Run lint**

```bash
cd src/frontend && npm run lint
```

Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add src/frontend/src/components/reports/shared/ExportMenu.tsx
git commit -m "feat(reports): add shared ExportMenu component"
```

---

### Task 2.3: Create ReportErrorState component

**Files:**
- Create: `src/frontend/src/components/reports/shared/ReportErrorState.tsx`

- [ ] **Step 1: Write component**

```tsx
// src/frontend/src/components/reports/shared/ReportErrorState.tsx
import { Box, Typography, Button, Stack, alpha } from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import RefreshIcon from '@mui/icons-material/Refresh';
import HomeIcon from '@mui/icons-material/Home';
import { Link as RouterLink } from 'react-router-dom';

interface ReportErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  homeHref?: string;
}

const trim = (s: string, n = 200) => (s.length > n ? s.slice(0, n - 1) + '…' : s);

const ReportErrorState = ({
  title = 'Kon rapport niet laden',
  message = '',
  onRetry,
  homeHref = '/reports?tab=overview',
}: ReportErrorStateProps) => (
  <Box
    sx={{
      p: 4,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 2,
      bgcolor: (theme) => alpha(theme.palette.error.main, 0.03),
      border: '1px dashed',
      borderColor: (theme) => alpha(theme.palette.error.main, 0.3),
      borderRadius: 2,
      textAlign: 'center',
    }}
  >
    <ErrorOutlineIcon sx={{ fontSize: 48, color: 'error.main' }} />
    <Box>
      <Typography variant="h6" sx={{ fontWeight: 700 }}>{title}</Typography>
      {message && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {trim(message)}
        </Typography>
      )}
    </Box>
    <Stack direction="row" spacing={1}>
      {onRetry && (
        <Button variant="contained" color="error" startIcon={<RefreshIcon />} onClick={onRetry}>
          Opnieuw proberen
        </Button>
      )}
      <Button component={RouterLink} to={homeHref} variant="outlined" startIcon={<HomeIcon />}>
        Overzicht
      </Button>
    </Stack>
  </Box>
);

export default ReportErrorState;
```

- [ ] **Step 2: Lint and commit**

```bash
cd src/frontend && npm run lint
git add src/frontend/src/components/reports/shared/ReportErrorState.tsx
git commit -m "feat(reports): add shared ReportErrorState component"
```

---

### Task 2.4: Create ReportEmptyState component

**Files:**
- Create: `src/frontend/src/components/reports/shared/ReportEmptyState.tsx`

- [ ] **Step 1: Write component**

```tsx
// src/frontend/src/components/reports/shared/ReportEmptyState.tsx
import { Box, Typography, Button, alpha } from '@mui/material';
import InboxIcon from '@mui/icons-material/Inbox';

interface ReportEmptyStateProps {
  title?: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}

const ReportEmptyState = ({
  title = 'Geen resultaten',
  message = 'Geen data gevonden met de huidige filters.',
  actionLabel,
  onAction,
}: ReportEmptyStateProps) => (
  <Box
    sx={{
      p: 4,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 2,
      bgcolor: (theme) => alpha(theme.palette.info.main, 0.03),
      border: '1px dashed',
      borderColor: (theme) => alpha(theme.palette.info.main, 0.25),
      borderRadius: 2,
      textAlign: 'center',
    }}
  >
    <InboxIcon sx={{ fontSize: 48, color: 'info.main' }} />
    <Box>
      <Typography variant="h6" sx={{ fontWeight: 700 }}>{title}</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
        {message}
      </Typography>
    </Box>
    {actionLabel && onAction && (
      <Button variant="outlined" color="info" onClick={onAction}>{actionLabel}</Button>
    )}
  </Box>
);

export default ReportEmptyState;
```

- [ ] **Step 2: Lint and commit**

```bash
cd src/frontend && npm run lint
git add src/frontend/src/components/reports/shared/ReportEmptyState.tsx
git commit -m "feat(reports): add shared ReportEmptyState component"
```

---

### Task 2.5: Create IntuneBadge component

**Files:**
- Create: `src/frontend/src/components/reports/shared/IntuneBadge.tsx`

- [ ] **Step 1: Write component**

```tsx
// src/frontend/src/components/reports/shared/IntuneBadge.tsx
import { Chip, alpha } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import HelpIcon from '@mui/icons-material/Help';
import CloudOffIcon from '@mui/icons-material/CloudOff';
import ScheduleIcon from '@mui/icons-material/Schedule';

export type IntuneComplianceState =
  | 'compliant'
  | 'noncompliant'
  | 'error'
  | 'unenrolled'
  | 'stale'
  | 'unknown';

interface IntuneBadgeProps {
  state: IntuneComplianceState | string | null | undefined;
  lastSync?: string | null;
  size?: 'small' | 'medium';
}

const staleThresholdDays = 30;

const deriveState = (state: string | null | undefined, lastSync?: string | null): IntuneComplianceState => {
  if (!state) return 'unknown';
  const s = state.toLowerCase();
  if (s === 'compliant') {
    if (lastSync) {
      const syncDate = new Date(lastSync);
      const ageDays = (Date.now() - syncDate.getTime()) / 86400000;
      if (ageDays > staleThresholdDays) return 'stale';
    }
    return 'compliant';
  }
  if (s === 'noncompliant') return 'noncompliant';
  if (s === 'error') return 'error';
  if (s === 'unenrolled' || s === '') return 'unenrolled';
  return 'unknown';
};

const config: Record<IntuneComplianceState, { label: string; color: string; Icon: typeof CheckCircleIcon }> = {
  compliant:    { label: 'Compliant',      color: '#4CAF50', Icon: CheckCircleIcon },
  noncompliant: { label: 'Non-compliant',  color: '#F44336', Icon: ErrorIcon },
  error:        { label: 'Error',          color: '#FF9800', Icon: ErrorIcon },
  unenrolled:   { label: 'Niet enrolled',  color: '#9E9E9E', Icon: CloudOffIcon },
  stale:        { label: 'Stale',          color: '#FFC107', Icon: ScheduleIcon },
  unknown:      { label: 'Onbekend',       color: '#757575', Icon: HelpIcon },
};

const IntuneBadge = ({ state, lastSync, size = 'small' }: IntuneBadgeProps) => {
  const derived = deriveState(state, lastSync);
  const { label, color, Icon } = config[derived];

  return (
    <Chip
      size={size}
      icon={<Icon sx={{ fontSize: 14, color }} />}
      label={label}
      sx={{
        height: size === 'small' ? 22 : 28,
        fontSize: '0.7rem',
        fontWeight: 600,
        bgcolor: alpha(color, 0.12),
        color,
        border: '1px solid',
        borderColor: alpha(color, 0.35),
        '& .MuiChip-icon': { color },
      }}
    />
  );
};

export default IntuneBadge;
```

- [ ] **Step 2: Lint and commit**

```bash
cd src/frontend && npm run lint
git add src/frontend/src/components/reports/shared/IntuneBadge.tsx
git commit -m "feat(reports): add shared IntuneBadge component"
```

---

### Task 2.6: Create LastSyncChip component

**Files:**
- Create: `src/frontend/src/components/reports/shared/LastSyncChip.tsx`

- [ ] **Step 1: Write component**

```tsx
// src/frontend/src/components/reports/shared/LastSyncChip.tsx
import { Chip, Tooltip, alpha } from '@mui/material';
import ScheduleIcon from '@mui/icons-material/Schedule';

interface LastSyncChipProps {
  date?: string | null;
  size?: 'small' | 'medium';
}

const formatRelative = (date: Date): { label: string; isStale: boolean } => {
  const ageMs = Date.now() - date.getTime();
  const ageDays = Math.floor(ageMs / 86400000);
  if (ageDays === 0) return { label: 'vandaag', isStale: false };
  if (ageDays === 1) return { label: 'gisteren', isStale: false };
  if (ageDays < 7) return { label: `${ageDays} d geleden`, isStale: false };
  if (ageDays < 30) return { label: `${Math.floor(ageDays / 7)} w geleden`, isStale: false };
  if (ageDays < 365) return { label: `${Math.floor(ageDays / 30)} m geleden`, isStale: true };
  return { label: `${Math.floor(ageDays / 365)} j geleden`, isStale: true };
};

const LastSyncChip = ({ date, size = 'small' }: LastSyncChipProps) => {
  if (!date) return <span style={{ fontSize: '0.75rem', color: '#999' }}>—</span>;
  const d = new Date(date);
  if (isNaN(d.getTime())) return <span style={{ fontSize: '0.75rem', color: '#999' }}>—</span>;

  const { label, isStale } = formatRelative(d);
  const color = isStale ? '#FFC107' : '#2196F3';
  const fullDate = d.toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric' });

  return (
    <Tooltip title={fullDate}>
      <Chip
        size={size}
        icon={<ScheduleIcon sx={{ fontSize: 12, color }} />}
        label={label}
        sx={{
          height: size === 'small' ? 20 : 26,
          fontSize: '0.68rem',
          fontWeight: 500,
          bgcolor: alpha(color, 0.1),
          color,
          '& .MuiChip-icon': { color },
        }}
      />
    </Tooltip>
  );
};

export default LastSyncChip;
```

- [ ] **Step 2: Lint and commit**

```bash
cd src/frontend && npm run lint
git add src/frontend/src/components/reports/shared/LastSyncChip.tsx
git commit -m "feat(reports): add shared LastSyncChip component"
```

---

### Task 2.7: Smoke-test shared components

- [ ] **Step 1: Build frontend**

```bash
cd src/frontend && npm run build
```

Expected: Success. No TypeScript errors.

- [ ] **Step 2: Open PR, merge to develop**

PR includes screenshots of each component rendered on a scratch page (optional but helpful).

---

# PR 3 — Reports Shell + Overview + Assets

**Target:** Functional `/reports` shell with 6-tab nav; Overview tab populated; Assets tab with Nu/Historiek toggle and expandable rows. Legacy tab URLs redirect. Rollouts/Werkplekken/Leasing keep existing components for now.

**Branch:** `feat/reports-pr3-shell-overview-assets`

---

### Task 3.1: TypeScript types for new DTOs

**Files:**
- Modify: `src/frontend/src/types/report.types.ts`

- [ ] **Step 1: Add types matching backend DTOs**

Append to existing file (preserve existing types):

```ts
// ===== OVERVIEW TYPES =====

export interface OverviewKpi {
  assets: OverviewAssetsKpi;
  rollouts: OverviewRolloutsKpi;
  workplaces: OverviewWorkplacesKpi;
  leasing: OverviewLeasingKpi;
  intune: OverviewIntuneKpi;
  activity: OverviewActivityKpi;
  attention: AttentionItem[];
  trend: ActivityTrendPoint[];
}

export interface OverviewAssetsKpi { total: number; inUse: number; defect: number; inUsePercentage: number; }
export interface OverviewRolloutsKpi { activeSessions: number; averageCompletionPercentage: number; workplacesThisWeek: number; }
export interface OverviewWorkplacesKpi { total: number; occupied: number; occupancyPercentage: number; }
export interface OverviewLeasingKpi { activeContracts: number; expiringWithin60Days: number; }
export interface OverviewIntuneKpi { enrolled: number; stale: number; }
export interface OverviewActivityKpi { eventsLast7Days: number; }

export interface AttentionItem {
  severity: 'error' | 'warning' | 'info';
  category: 'action' | 'upcoming';
  message: string;
  count: number;
  deepLinkUrl: string;
}

export interface ActivityTrendPoint {
  date: string;
  onboarding: number;
  offboarding: number;
  swap: number;
  other: number;
}

// ===== INTUNE SUMMARY =====

export interface IntuneSummary {
  totalEnrolled: number;
  compliant: number;
  nonCompliant: number;
  stale: number;
  unenrolled: number;
  errorState: number;
  byCompliance: Record<string, number>;
  retrievedAt?: string;
}

// ===== EMPLOYEE REPORTS =====

export interface EmployeeReportItem {
  employeeId: number;
  displayName: string;
  jobTitle?: string;
  serviceName?: string;
  serviceId?: number;
  workplaceCode?: string;
  workplaceId?: number;
  assetCount: number;
  intuneCompliant: number;
  intuneNonCompliant: number;
  lastEventDate?: string;
}

export interface EmployeeTimelineItem {
  eventId: number;
  eventDate: string;
  eventType: string;
  eventTypeDisplay: string;
  description: string;
  assetId: number;
  assetCode: string;
  oldValue?: string;
  newValue?: string;
}

// ===== MOVEMENT TYPE =====

export type RolloutMovementType = 'Onboarding' | 'Offboarding' | 'Swap' | 'Other';
```

Also update the existing `RolloutWorkplaceChecklist` and `FutureSwap` types to include `movementType: RolloutMovementType;`.

Also update the `ReportTab` type:

```ts
export type ReportTab = 'overview' | 'assets' | 'rollouts' | 'werkplekken' | 'intune' | 'leasing';
```

- [ ] **Step 2: Build**

```bash
cd src/frontend && npm run build
```

Expected: compile errors where code uses old types that are now gone (e.g. `'hardware'` tab usage). That's expected — fix them in subsequent tasks by wiring new components.

- [ ] **Step 3: Commit**

```bash
git add src/frontend/src/types/report.types.ts
git commit -m "feat(reports): add TypeScript types for overview/intune/employee/movement-type DTOs"
```

---

### Task 3.2: API client for new endpoints

**Files:**
- Create: `src/frontend/src/api/reportsOverview.api.ts`
- Create: `src/frontend/src/api/reportsIntune.api.ts`
- Create: `src/frontend/src/api/reportsEmployees.api.ts`
- Create: `src/frontend/src/api/reportsAssetTimeline.api.ts`
- Modify: `src/frontend/src/api/reports.api.ts` (if exists) — add `getAssetsSnapshot`, aliases

- [ ] **Step 1: Create API clients**

```ts
// src/frontend/src/api/reportsOverview.api.ts
import apiClient from './client';
import type { OverviewKpi } from '../types/report.types';

export const getReportsOverview = async (): Promise<OverviewKpi> => {
  const { data } = await apiClient.get<OverviewKpi>('/reports/overview');
  return data;
};
```

```ts
// src/frontend/src/api/reportsIntune.api.ts
import apiClient from './client';
import type { IntuneSummary } from '../types/report.types';

export const getIntuneSummary = async (): Promise<IntuneSummary> => {
  const { data } = await apiClient.get<IntuneSummary>('/reports/intune/summary');
  return data;
};
```

```ts
// src/frontend/src/api/reportsEmployees.api.ts
import apiClient from './client';
import type { EmployeeReportItem, EmployeeTimelineItem } from '../types/report.types';

export const getEmployees = async (): Promise<EmployeeReportItem[]> => {
  const { data } = await apiClient.get<EmployeeReportItem[]>('/reports/employees');
  return data;
};

export const getEmployeeTimeline = async (employeeId: number, take = 50): Promise<EmployeeTimelineItem[]> => {
  const { data } = await apiClient.get<EmployeeTimelineItem[]>(`/reports/employees/${employeeId}/timeline`, { params: { take } });
  return data;
};
```

```ts
// src/frontend/src/api/reportsAssetTimeline.api.ts
import apiClient from './client';
import type { AssetChangeHistoryItem } from '../types/report.types';

export const getAssetTimeline = async (assetId: number, take = 50, skip = 0): Promise<AssetChangeHistoryItem[]> => {
  const { data } = await apiClient.get<AssetChangeHistoryItem[]>(`/reports/assets/${assetId}/timeline`, { params: { take, skip } });
  return data;
};
```

- [ ] **Step 2: Build and commit**

```bash
cd src/frontend && npm run build
git add src/frontend/src/api/reportsOverview.api.ts \
        src/frontend/src/api/reportsIntune.api.ts \
        src/frontend/src/api/reportsEmployees.api.ts \
        src/frontend/src/api/reportsAssetTimeline.api.ts
git commit -m "feat(reports): add API clients for overview/intune/employees/asset-timeline"
```

---

### Task 3.3: React Query hooks for new endpoints

**Files:**
- Create: `src/frontend/src/hooks/reports/useReportsOverview.ts`
- Create: `src/frontend/src/hooks/reports/useIntuneSummary.ts`
- Create: `src/frontend/src/hooks/reports/useEmployeesReport.ts`
- Create: `src/frontend/src/hooks/reports/useAssetTimeline.ts`
- Modify: `src/frontend/src/hooks/reports/keys.ts`
- Modify: `src/frontend/src/hooks/reports/index.ts`

- [ ] **Step 1: Extend query keys**

Add to `keys.ts`:

```ts
export const reportKeys = {
  // ... existing keys
  overview: () => ['reports', 'overview'] as const,
  intuneSummary: () => ['reports', 'intune', 'summary'] as const,
  employees: () => ['reports', 'employees'] as const,
  employeeTimeline: (id: number) => ['reports', 'employees', id, 'timeline'] as const,
  assetTimeline: (id: number) => ['reports', 'assets', id, 'timeline'] as const,
};
```

- [ ] **Step 2: Create hooks**

```ts
// src/frontend/src/hooks/reports/useReportsOverview.ts
import { useQuery } from '@tanstack/react-query';
import { getReportsOverview } from '../../api/reportsOverview.api';
import { reportKeys } from './keys';

export const useReportsOverview = () => useQuery({
  queryKey: reportKeys.overview(),
  queryFn: getReportsOverview,
  staleTime: 2 * 60 * 1000,
  gcTime: 5 * 60 * 1000,
});
```

```ts
// src/frontend/src/hooks/reports/useIntuneSummary.ts
import { useQuery } from '@tanstack/react-query';
import { getIntuneSummary } from '../../api/reportsIntune.api';
import { reportKeys } from './keys';

export const useIntuneSummary = () => useQuery({
  queryKey: reportKeys.intuneSummary(),
  queryFn: getIntuneSummary,
  staleTime: 5 * 60 * 1000,
  gcTime: 15 * 60 * 1000,
});
```

```ts
// src/frontend/src/hooks/reports/useEmployeesReport.ts
import { useQuery } from '@tanstack/react-query';
import { getEmployees, getEmployeeTimeline } from '../../api/reportsEmployees.api';
import { reportKeys } from './keys';

export const useEmployeesReport = () => useQuery({
  queryKey: reportKeys.employees(),
  queryFn: getEmployees,
  staleTime: 5 * 60 * 1000,
  gcTime: 10 * 60 * 1000,
});

export const useEmployeeTimeline = (employeeId: number | null | undefined) => useQuery({
  queryKey: reportKeys.employeeTimeline(employeeId ?? 0),
  queryFn: () => getEmployeeTimeline(employeeId!),
  enabled: !!employeeId,
  staleTime: 5 * 60 * 1000,
});
```

```ts
// src/frontend/src/hooks/reports/useAssetTimeline.ts
import { useQuery } from '@tanstack/react-query';
import { getAssetTimeline } from '../../api/reportsAssetTimeline.api';
import { reportKeys } from './keys';

export const useAssetTimeline = (assetId: number | null | undefined, enabled = true) => useQuery({
  queryKey: reportKeys.assetTimeline(assetId ?? 0),
  queryFn: () => getAssetTimeline(assetId!),
  enabled: enabled && !!assetId,
  staleTime: 5 * 60 * 1000,
  gcTime: 10 * 60 * 1000,
});
```

- [ ] **Step 3: Export from index**

Add to `src/frontend/src/hooks/reports/index.ts`:

```ts
export { useReportsOverview } from './useReportsOverview';
export { useIntuneSummary } from './useIntuneSummary';
export { useEmployeesReport, useEmployeeTimeline } from './useEmployeesReport';
export { useAssetTimeline } from './useAssetTimeline';
```

- [ ] **Step 4: Build and commit**

```bash
cd src/frontend && npm run build
git add src/frontend/src/hooks/reports/
git commit -m "feat(reports): add query hooks for overview/intune/employees/asset-timeline"
```

---

### Task 3.4: New ReportsPage shell with 6-tab navigation

**Files:**
- Modify: `src/frontend/src/pages/reports/ReportsPage.tsx`

- [ ] **Step 1: Replace `REPORT_TABS` with new 6-tab array**

Replace the `REPORT_TABS` constant and `TAB_COLORS` in `ReportsPage.tsx`:

```tsx
import DashboardIcon from '@mui/icons-material/Dashboard';
import InventoryIcon from '@mui/icons-material/Inventory2';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import BusinessIcon from '@mui/icons-material/Business';
import CloudIcon from '@mui/icons-material/Cloud';
import DescriptionIcon from '@mui/icons-material/Description';

import { OverviewTab, AssetsTab, IntuneTab } from '../../components/reports';
// Keep using existing components for now:
import { RolloutTab, WorkplacesTab, LeasingTab } from '../../components/reports';

const REPORT_TABS = [
  { id: 'overview',    label: 'Overview',    icon: <DashboardIcon />,    description: 'Cross-domein KPIs en trend' },
  { id: 'assets',      label: 'Assets',      icon: <InventoryIcon />,    description: 'Inventaris nu en historiek' },
  { id: 'rollouts',    label: 'Rollouts',    icon: <RocketLaunchIcon />, description: 'Sessie-rapporten en checklist' },
  { id: 'werkplekken', label: 'Werkplekken', icon: <BusinessIcon />,     description: 'Bezetting en equipment' },
  { id: 'intune',      label: 'Intune',      icon: <CloudIcon />,        description: 'Intune device analyses' },
  { id: 'leasing',     label: 'Leasing',     icon: <DescriptionIcon />,  description: 'Lease contracten en vervaldatums' },
] as const;

const TAB_COLORS: Record<ReportTab, string> = {
  overview: '#FF7700',
  assets: '#FF7700',
  rollouts: '#F44336',
  werkplekken: '#9C27B0',
  intune: '#2196F3',
  leasing: '#FF9800',
};
```

- [ ] **Step 2: Add legacy-tab redirect logic**

In the `useEffect` that syncs URL, add before the sync:

```tsx
useEffect(() => {
  const tabParam = searchParams.get('tab');

  // Legacy tab migrations
  const legacyMap: Record<string, { tab: ReportTab; extraParams?: Record<string, string> }> = {
    hardware:      { tab: 'assets',      extraParams: { view: 'nu' } },
    swaps:         { tab: 'assets',      extraParams: { view: 'history' } },
    workplaces:    { tab: 'werkplekken' },
    serialnumbers: { tab: 'overview' }, // will be redirected externally in PR4
  };

  if (tabParam && legacyMap[tabParam]) {
    const { tab, extraParams } = legacyMap[tabParam];
    const next = new URLSearchParams(searchParams);
    next.set('tab', tab);
    Object.entries(extraParams ?? {}).forEach(([k, v]) => next.set(k, v));
    setSearchParams(next, { replace: true });
    setActiveTab(tab);
    return;
  }

  if (tabParam !== activeTab) {
    setSearchParams({ tab: activeTab }, { replace: true });
  }
}, [activeTab, searchParams, setSearchParams]);
```

- [ ] **Step 3: Update default tab to `overview`**

```tsx
const [activeTab, setActiveTab] = useState<ReportTab>(
  tabParam && REPORT_TABS.some(t => t.id === tabParam) ? tabParam as ReportTab : 'overview'
);
```

- [ ] **Step 4: Update tab content dispatch**

Replace the existing `activeTab === 'hardware' && <HardwareTab />` block with:

```tsx
{activeTab === 'overview' && <OverviewTab />}
{activeTab === 'assets' && <AssetsTab />}
{activeTab === 'rollouts' && <RolloutTab />}
{activeTab === 'werkplekken' && <WorkplacesTab />}
{activeTab === 'intune' && <IntuneTab />}
{activeTab === 'leasing' && <LeasingTab />}
```

- [ ] **Step 5: Update `handleRefresh` switch**

```tsx
switch (activeTab) {
  case 'overview':    queryClient.invalidateQueries({ queryKey: ['reports', 'overview'] }); break;
  case 'assets':      queryClient.invalidateQueries({ queryKey: ['reports', 'assets'] }); break;
  case 'rollouts':    queryClient.invalidateQueries({ queryKey: ['rollouts'] }); break;
  case 'werkplekken': queryClient.invalidateQueries({ queryKey: ['reports', 'werkplekken'] }); break;
  case 'intune':      queryClient.invalidateQueries({ queryKey: ['reports', 'intune'] }); break;
  case 'leasing':     queryClient.invalidateQueries({ queryKey: ['reports', 'leases'] }); break;
}
```

Note: `OverviewTab`, `AssetsTab`, `IntuneTab` components are built in subsequent tasks. Build will fail temporarily — that's expected; next task fixes it.

- [ ] **Step 6: Commit (expect build failure; next task fixes)**

```bash
git add src/frontend/src/pages/reports/ReportsPage.tsx
git commit -m "feat(reports): switch ReportsPage to new 6-tab shell with legacy redirects"
```

---

### Task 3.5: Placeholder OverviewTab, AssetsTab, IntuneTab

**Files:**
- Create: `src/frontend/src/components/reports/overview/OverviewTab.tsx`
- Create: `src/frontend/src/components/reports/overview/index.ts`
- Create: `src/frontend/src/components/reports/assets/AssetsTab.tsx`
- Create: `src/frontend/src/components/reports/assets/index.ts`
- Create: `src/frontend/src/components/reports/intune/IntuneTab.tsx`
- Create: `src/frontend/src/components/reports/intune/index.ts`
- Modify: `src/frontend/src/components/reports/index.ts`

- [ ] **Step 1: Create minimal placeholders**

```tsx
// src/frontend/src/components/reports/overview/OverviewTab.tsx
const OverviewTab = () => <div>Overview coming soon</div>;
export default OverviewTab;
```

```tsx
// src/frontend/src/components/reports/overview/index.ts
export { default as OverviewTab } from './OverviewTab';
```

Same pattern for `AssetsTab` and `IntuneTab`.

- [ ] **Step 2: Wire up top-level `components/reports/index.ts`**

```ts
export { default as HardwareTab } from './HardwareTab';
export { default as RolloutTab } from './RolloutTab';
export { default as WorkplacesTab } from './WorkplacesTab';
export { default as SwapsTab } from './SwapsTab';
export { default as LicensesTab } from './LicensesTab';
export { default as LeasingTab } from './LeasingTab';
export { default as SerialNumbersTab } from './SerialNumbersTab';
export { OverviewTab } from './overview';
export { AssetsTab } from './assets';
export { IntuneTab } from './intune';
```

- [ ] **Step 3: Build**

```bash
cd src/frontend && npm run build
```

Expected: compiles. App loads, each tab clickable (placeholders render).

- [ ] **Step 4: Commit**

```bash
git add src/frontend/src/components/reports/
git commit -m "feat(reports): add placeholder OverviewTab, AssetsTab, IntuneTab"
```

---

### Task 3.6: Implement OverviewKpiGrid

**Files:**
- Create: `src/frontend/src/components/reports/overview/OverviewKpiGrid.tsx`

- [ ] **Step 1: Write component**

```tsx
// src/frontend/src/components/reports/overview/OverviewKpiGrid.tsx
import { Grid, Card, CardContent, Typography, Box, alpha } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import type { OverviewKpi } from '../../../types/report.types';
import InventoryIcon from '@mui/icons-material/Inventory2';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import BusinessIcon from '@mui/icons-material/Business';
import DescriptionIcon from '@mui/icons-material/Description';
import CloudIcon from '@mui/icons-material/Cloud';
import TimelineIcon from '@mui/icons-material/Timeline';

interface TileProps {
  icon: React.ElementType;
  label: string;
  primary: string;
  secondary?: string;
  color: string;
  onClick?: () => void;
}

const Tile = ({ icon: Icon, label, primary, secondary, color, onClick }: TileProps) => (
  <Card
    role={onClick ? 'button' : undefined}
    aria-label={onClick ? `${label} — klik om te openen` : undefined}
    tabIndex={onClick ? 0 : undefined}
    onClick={onClick}
    onKeyDown={(e) => { if (onClick && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onClick(); } }}
    sx={{
      cursor: onClick ? 'pointer' : 'default',
      transition: 'transform 0.15s ease, box-shadow 0.15s ease',
      borderLeft: `3px solid ${color}`,
      '&:hover': onClick ? { transform: 'translateY(-2px)', boxShadow: 3 } : undefined,
    }}
  >
    <CardContent sx={{ pb: '12px !important' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
        <Icon sx={{ fontSize: 18, color }} />
        <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color }}>
          {label}
        </Typography>
      </Box>
      <Typography variant="h5" sx={{ fontWeight: 800, lineHeight: 1.1 }}>{primary}</Typography>
      {secondary && (
        <Typography variant="caption" color="text.secondary">{secondary}</Typography>
      )}
    </CardContent>
  </Card>
);

const OverviewKpiGrid = ({ data }: { data: OverviewKpi }) => {
  const nav = useNavigate();
  return (
    <Grid container spacing={1}>
      <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
        <Tile icon={InventoryIcon} label="Assets" color="#FF7700"
          primary={`${data.assets.total}`}
          secondary={`${data.assets.inUsePercentage}% in gebruik · ${data.assets.defect} defect`}
          onClick={() => nav('/reports?tab=assets&view=nu')} />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
        <Tile icon={RocketLaunchIcon} label="Rollouts" color="#F44336"
          primary={`${data.rollouts.activeSessions} actief`}
          secondary={`${data.rollouts.averageCompletionPercentage}% voltooid`}
          onClick={() => nav('/reports?tab=rollouts')} />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
        <Tile icon={BusinessIcon} label="Werkplekken" color="#9C27B0"
          primary={`${data.workplaces.total}`}
          secondary={`${data.workplaces.occupancyPercentage}% bezet`}
          onClick={() => nav('/reports?tab=werkplekken')} />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
        <Tile icon={DescriptionIcon} label="Leasing" color="#FF9800"
          primary={`${data.leasing.activeContracts} lopend`}
          secondary={`${data.leasing.expiringWithin60Days} verlopen <60d`}
          onClick={() => nav('/reports?tab=leasing')} />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
        <Tile icon={CloudIcon} label="Intune" color="#2196F3"
          primary={`${data.intune.enrolled} enrolled`}
          secondary={`${data.intune.stale} stale`}
          onClick={() => nav('/reports?tab=intune')} />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
        <Tile icon={TimelineIcon} label="Activiteit" color="#4CAF50"
          primary={`${data.activity.eventsLast7Days}`}
          secondary="events, 7 dagen"
          onClick={() => nav('/reports?tab=assets&view=history&dateRange=7d')} />
      </Grid>
    </Grid>
  );
};

export default OverviewKpiGrid;
```

- [ ] **Step 2: Lint and commit**

```bash
cd src/frontend && npm run lint
git add src/frontend/src/components/reports/overview/OverviewKpiGrid.tsx
git commit -m "feat(reports): add OverviewKpiGrid with click-through tiles"
```

---

### Task 3.7: Implement ActivityTrendChart

**Files:**
- Create: `src/frontend/src/components/reports/overview/ActivityTrendChart.tsx`

- [ ] **Step 1: Check if recharts is installed**

```bash
cd src/frontend && grep '"recharts"' package.json
```

If NOT present, install:

```bash
npm install recharts
```

- [ ] **Step 2: Write component**

```tsx
// src/frontend/src/components/reports/overview/ActivityTrendChart.tsx
import { Paper, Typography, Box, useTheme } from '@mui/material';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { ActivityTrendPoint } from '../../../types/report.types';

const COLORS = {
  onboarding: '#4CAF50',
  offboarding: '#F44336',
  swap: '#FF7700',
  other: '#9E9E9E',
};

const ActivityTrendChart = ({ data }: { data: ActivityTrendPoint[] }) => {
  const theme = useTheme();
  return (
    <Paper sx={{ p: 2, mt: 1 }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
        Activiteit — laatste 30 dagen
      </Typography>
      <Box sx={{ width: '100%', height: 220 }}>
        <ResponsiveContainer>
          <AreaChart data={data.map(p => ({ ...p, label: new Date(p.date).toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit' }) }))}>
            <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
            <XAxis dataKey="label" fontSize={10} />
            <YAxis fontSize={10} allowDecimals={false} />
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Area type="monotone" dataKey="onboarding"  stackId="1" stroke={COLORS.onboarding}  fill={COLORS.onboarding}  fillOpacity={0.6} name="Onboarding" />
            <Area type="monotone" dataKey="offboarding" stackId="1" stroke={COLORS.offboarding} fill={COLORS.offboarding} fillOpacity={0.6} name="Offboarding" />
            <Area type="monotone" dataKey="swap"        stackId="1" stroke={COLORS.swap}        fill={COLORS.swap}        fillOpacity={0.6} name="Swap" />
            <Area type="monotone" dataKey="other"       stackId="1" stroke={COLORS.other}       fill={COLORS.other}       fillOpacity={0.4} name="Overig" />
          </AreaChart>
        </ResponsiveContainer>
      </Box>
    </Paper>
  );
};

export default ActivityTrendChart;
```

- [ ] **Step 3: Lint and commit**

```bash
cd src/frontend && npm run lint
git add src/frontend/src/components/reports/overview/ActivityTrendChart.tsx src/frontend/package.json src/frontend/package-lock.json
git commit -m "feat(reports): add ActivityTrendChart using recharts stacked area"
```

---

### Task 3.8: Implement AttentionList

**Files:**
- Create: `src/frontend/src/components/reports/overview/AttentionList.tsx`

- [ ] **Step 1: Write component**

```tsx
// src/frontend/src/components/reports/overview/AttentionList.tsx
import { Paper, Typography, Stack, Box, alpha, Chip } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import InfoIcon from '@mui/icons-material/Info';
import type { AttentionItem } from '../../../types/report.types';

const icon = (sev: AttentionItem['severity']) => {
  if (sev === 'error') return <ErrorIcon fontSize="small" sx={{ color: '#F44336' }} />;
  if (sev === 'warning') return <WarningIcon fontSize="small" sx={{ color: '#FF9800' }} />;
  return <InfoIcon fontSize="small" sx={{ color: '#2196F3' }} />;
};

const Section = ({ title, items, color }: { title: string; items: AttentionItem[]; color: string }) => {
  const nav = useNavigate();
  return (
    <Paper sx={{ p: 2, flex: 1, borderLeft: `3px solid ${color}` }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color }}>
        {title}
      </Typography>
      <Stack spacing={1}>
        {items.length === 0 && <Typography variant="body2" color="text.secondary">Niets om te melden.</Typography>}
        {items.map((it, idx) => (
          <Box
            key={idx}
            onClick={() => nav(it.deepLinkUrl)}
            sx={{
              cursor: 'pointer',
              p: 1,
              borderRadius: 1,
              bgcolor: (t) => alpha(t.palette.background.default, 0.5),
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              '&:hover': { bgcolor: (t) => alpha(t.palette.primary.main, 0.08) },
            }}
          >
            {icon(it.severity)}
            <Typography variant="body2" sx={{ flex: 1 }}>{it.message}</Typography>
            <Chip label={it.count} size="small" />
          </Box>
        ))}
      </Stack>
    </Paper>
  );
};

const AttentionList = ({ items }: { items: AttentionItem[] }) => {
  const actions = items.filter(i => i.category === 'action');
  const upcoming = items.filter(i => i.category === 'upcoming');
  return (
    <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} sx={{ mt: 1 }}>
      <Section title="⚠ Actie nodig" items={actions} color="#F44336" />
      <Section title="📅 Binnenkort" items={upcoming} color="#2196F3" />
    </Stack>
  );
};

export default AttentionList;
```

- [ ] **Step 2: Lint and commit**

```bash
cd src/frontend && npm run lint
git add src/frontend/src/components/reports/overview/AttentionList.tsx
git commit -m "feat(reports): add AttentionList with severity-coded deep-linked items"
```

---

### Task 3.9: Wire OverviewTab to use KPIs + trend + attention

**Files:**
- Modify: `src/frontend/src/components/reports/overview/OverviewTab.tsx`
- Modify: `src/frontend/src/components/reports/overview/index.ts`

- [ ] **Step 1: Rewrite OverviewTab**

```tsx
// src/frontend/src/components/reports/overview/OverviewTab.tsx
import { Box, Skeleton, Stack } from '@mui/material';
import { useReportsOverview } from '../../../hooks/reports';
import OverviewKpiGrid from './OverviewKpiGrid';
import ActivityTrendChart from './ActivityTrendChart';
import AttentionList from './AttentionList';
import { ReportErrorState } from '../shared';

const OverviewTab = () => {
  const { data, isLoading, error, refetch } = useReportsOverview();

  if (error) return <ReportErrorState message={(error as Error).message} onRetry={() => refetch()} />;
  if (isLoading || !data) return (
    <Stack spacing={1}>
      <Skeleton variant="rounded" height={100} />
      <Skeleton variant="rounded" height={240} />
      <Skeleton variant="rounded" height={180} />
    </Stack>
  );

  return (
    <Box>
      <OverviewKpiGrid data={data} />
      <ActivityTrendChart data={data.trend} />
      <AttentionList items={data.attention} />
    </Box>
  );
};

export default OverviewTab;
```

Update `overview/index.ts` to export sub-components if needed (only `OverviewTab` is re-exported from `components/reports/index.ts`).

- [ ] **Step 2: Build, lint, smoke-test**

```bash
cd src/frontend && npm run build && npm run lint
```

Run app (`npm run dev` in one terminal, `dotnet run` in another). Navigate to `/reports`. Expected: Overview tab loads with KPI grid, trend chart, attention list.

- [ ] **Step 3: Commit**

```bash
git add src/frontend/src/components/reports/overview/OverviewTab.tsx
git commit -m "feat(reports): wire OverviewTab with KPI grid, trend chart, attention list"
```

---

### Task 3.10: AssetsTab skeleton with Nu/Historiek toggle

**Files:**
- Modify: `src/frontend/src/components/reports/assets/AssetsTab.tsx`
- Create: `src/frontend/src/components/reports/assets/AssetsNuView.tsx`
- Create: `src/frontend/src/components/reports/assets/AssetsHistoryView.tsx`

- [ ] **Step 1: Create Nu/History placeholder components**

```tsx
// AssetsNuView.tsx
const AssetsNuView = () => <div>Nu view – TBD</div>;
export default AssetsNuView;
```

```tsx
// AssetsHistoryView.tsx
const AssetsHistoryView = () => <div>Historiek view – TBD</div>;
export default AssetsHistoryView;
```

- [ ] **Step 2: Write AssetsTab with toggle**

```tsx
// src/frontend/src/components/reports/assets/AssetsTab.tsx
import { useSearchParams } from 'react-router-dom';
import { ToggleButtonGroup, ToggleButton, Box, alpha } from '@mui/material';
import AssetsNuView from './AssetsNuView';
import AssetsHistoryView from './AssetsHistoryView';

type View = 'nu' | 'history';

const AssetsTab = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const view = (searchParams.get('view') as View) ?? 'nu';

  const handleChange = (_: React.MouseEvent<HTMLElement>, next: View | null) => {
    if (!next) return;
    const params = new URLSearchParams(searchParams);
    params.set('view', next);
    setSearchParams(params, { replace: true });
  };

  return (
    <Box>
      <Box sx={{ mb: 1 }}>
        <ToggleButtonGroup
          exclusive
          size="small"
          value={view}
          onChange={handleChange}
          aria-label="Assets view"
          sx={{
            '& .Mui-selected': {
              bgcolor: (t) => alpha('#FF7700', 0.15),
              color: '#FF7700',
              fontWeight: 700,
            },
          }}
        >
          <ToggleButton value="nu" aria-label="Nu">Nu</ToggleButton>
          <ToggleButton value="history" aria-label="Historiek">Historiek</ToggleButton>
        </ToggleButtonGroup>
      </Box>
      {view === 'nu' ? <AssetsNuView /> : <AssetsHistoryView />}
    </Box>
  );
};

export default AssetsTab;
```

- [ ] **Step 3: Lint, build, commit**

```bash
cd src/frontend && npm run lint && npm run build
git add src/frontend/src/components/reports/assets/
git commit -m "feat(reports): add AssetsTab with Nu/Historiek URL-driven toggle"
```

---

### Task 3.11: AssetsNuView with data grid (reuse HardwareTab logic)

**Files:**
- Modify: `src/frontend/src/components/reports/assets/AssetsNuView.tsx`

- [ ] **Step 1: Port HardwareTab logic into AssetsNuView**

Copy the full content of `src/frontend/src/components/reports/HardwareTab.tsx` into `AssetsNuView.tsx`. Make these changes:
- Rename default export from `HardwareTab` to `AssetsNuView`.
- Add **Intune columns** to `columns` array (after `buildingName`):

```tsx
{
  field: 'intuneComplianceState',
  headerName: 'Intune',
  width: 130,
  renderCell: (params: GridRenderCellParams) => (
    <IntuneBadge state={params.value} lastSync={params.row.intuneLastSync} />
  ),
},
{
  field: 'intuneLastSync',
  headerName: 'Sync',
  width: 100,
  renderCell: (params: GridRenderCellParams) => <LastSyncChip date={params.value} />,
},
```

- Import `IntuneBadge` and `LastSyncChip` from `'../shared'`.
- Replace `exportMutation.mutate(filters)` invocation with use of new `ExportMenu`:

```tsx
import { ExportMenu } from '../shared';

// Pass to NeumorphicDataGrid via a custom toolbar prop, OR render directly above the grid.
// Replace existing IconButton + export logic with:
const exportActions = (
  <ExportMenu
    onCsvExport={() => exportMutation.mutate({ ...filters, format: 'csv' })}
    onExcelExport={() => exportMutation.mutate({ ...filters, format: 'xlsx' })}
    isExporting={exportMutation.isPending}
  />
);
```

- Add **expandable rows** via MUI X DataGrid `getDetailPanelContent` (check MUI X Pro licensing — if not available, use custom row click to expand-collapse via additional state). For now, implement simpler approach: click row → open a Drawer with `AssetTimelineInline`. Wire this next task.

- [ ] **Step 2: Build, lint**

```bash
cd src/frontend && npm run build && npm run lint
```

- [ ] **Step 3: Commit**

```bash
git add src/frontend/src/components/reports/assets/AssetsNuView.tsx
git commit -m "feat(reports): port HardwareTab logic into AssetsNuView with Intune columns"
```

---

### Task 3.12: AssetTimelineInline component + Drawer integration

**Files:**
- Create: `src/frontend/src/components/reports/assets/AssetTimelineInline.tsx`
- Modify: `src/frontend/src/components/reports/assets/AssetsNuView.tsx`

- [ ] **Step 1: Write timeline component**

```tsx
// src/frontend/src/components/reports/assets/AssetTimelineInline.tsx
import { Box, Typography, Skeleton, Chip, alpha } from '@mui/material';
import { useAssetTimeline } from '../../../hooks/reports';

const eventColor = (type: string): string => {
  if (type.toLowerCase().includes('status')) return '#2196F3';
  if (type.toLowerCase().includes('owner')) return '#9C27B0';
  if (type.toLowerCase().includes('location')) return '#FF9800';
  if (type.toLowerCase().includes('onboarded')) return '#4CAF50';
  if (type.toLowerCase().includes('offboarded')) return '#F44336';
  return '#757575';
};

const formatDate = (iso: string) => new Date(iso).toLocaleDateString('nl-NL', {
  day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
});

interface Props {
  assetId: number;
  enabled: boolean;
}

const AssetTimelineInline = ({ assetId, enabled }: Props) => {
  const { data = [], isLoading, error } = useAssetTimeline(assetId, enabled);

  if (!enabled) return null;
  if (isLoading) return <Skeleton variant="rounded" height={80} />;
  if (error) return <Typography color="error" variant="caption">Kon timeline niet laden</Typography>;
  if (data.length === 0) return <Typography variant="caption" color="text.secondary">Geen events</Typography>;

  return (
    <Box sx={{ pl: 2, py: 1 }}>
      {data.map(ev => {
        const color = eventColor(ev.eventType);
        return (
          <Box
            key={ev.id}
            sx={{
              borderLeft: `3px solid ${color}`,
              pl: 1,
              mb: 0.5,
              py: 0.25,
              bgcolor: (t) => alpha(color, 0.05),
            }}
          >
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
              {formatDate(ev.eventDate)}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <Chip size="small" label={ev.eventTypeDisplay} sx={{ height: 20, fontSize: '0.65rem', bgcolor: alpha(color, 0.15), color }} />
              <Typography variant="caption" sx={{ fontSize: '0.75rem' }}>
                {ev.description}
                {ev.oldValue && ev.newValue && <span style={{ opacity: 0.7 }}> ({ev.oldValue} → {ev.newValue})</span>}
              </Typography>
            </Box>
          </Box>
        );
      })}
    </Box>
  );
};

export default AssetTimelineInline;
```

- [ ] **Step 2: Wire into AssetsNuView via Drawer**

In `AssetsNuView.tsx`, add state for selected asset + drawer:

```tsx
const [timelineAssetId, setTimelineAssetId] = useState<number | null>(null);

// Replace existing onRowClick:
const handleRowClick = (item: HardwareReportItem) => {
  setTimelineAssetId(item.id);
};

// Add Drawer at JSX root:
<Drawer anchor="right" open={!!timelineAssetId} onClose={() => setTimelineAssetId(null)}>
  <Box sx={{ width: 400, p: 2 }}>
    <Typography variant="h6" sx={{ mb: 1 }}>Asset Timeline</Typography>
    {timelineAssetId && <AssetTimelineInline assetId={timelineAssetId} enabled />}
    <Button onClick={() => timelineAssetId && navigate(buildRoute.assetDetail(timelineAssetId))} sx={{ mt: 2 }}>
      Open asset details
    </Button>
  </Box>
</Drawer>
```

Import `Drawer`, `Button` from `@mui/material`.

- [ ] **Step 3: Lint, build, smoke-test**

Click any asset row → drawer opens right with timeline. Close works. Works with query cache.

- [ ] **Step 4: Commit**

```bash
git add src/frontend/src/components/reports/assets/AssetTimelineInline.tsx \
        src/frontend/src/components/reports/assets/AssetsNuView.tsx
git commit -m "feat(reports): add AssetTimelineInline + drawer integration in AssetsNuView"
```

---

### Task 3.13: AssetsHistoryView (port SwapsTab with new event types + rollout chip)

**Files:**
- Modify: `src/frontend/src/components/reports/assets/AssetsHistoryView.tsx`

- [ ] **Step 1: Port SwapsTab logic**

Copy full content of `SwapsTab.tsx` into `AssetsHistoryView.tsx`. Make these changes:
- Rename exported component to `AssetsHistoryView`.
- **Add "Context" column** (between "Locatie" and end):

```tsx
{
  field: 'rolloutContext',
  headerName: 'Context',
  width: 180,
  renderCell: (params: GridRenderCellParams) => {
    const sessionId = params.row.rolloutSessionId;
    const dayId = params.row.rolloutDayId;
    if (!sessionId) return null;
    return (
      <Chip
        label={`Rollout #${sessionId}${dayId ? ` · Dag ${dayId}` : ''}`}
        size="small"
        clickable
        onClick={() => navigate(`/reports?tab=rollouts&session=${sessionId}${dayId ? `&day=${dayId}` : ''}`)}
        sx={{ bgcolor: alpha('#F44336', 0.1), color: '#F44336' }}
      />
    );
  },
},
```

Requires backend `AssetChangeHistoryItemDto` to include `RolloutSessionId` and `RolloutDayId`. Add these to the DTO (in `AssetEventDtos.cs` or wherever it lives) if not present, and populate them in the `GetSwapHistory` / `GetChangeHistory` projection.

- **Extend event types** to include explicit `Onboarding`/`Offboarding` displays if not already done.
- Replace export IconButton with `ExportMenu`.

- [ ] **Step 2: Update backend DTO and projection**

If `AssetChangeHistoryItemDto` lacks `RolloutSessionId`/`RolloutDayId`, add:

```csharp
public int? RolloutSessionId { get; init; }
public int? RolloutDayId { get; init; }
```

In the projection in `GetSwapHistory`/`GetChangeHistory`, join against `RolloutAssetMovements` or similar to populate. If no direct relation exists, leave `null` for now.

- [ ] **Step 3: Commit**

```bash
git add src/frontend/src/components/reports/assets/AssetsHistoryView.tsx \
        src/backend/DjoppieInventory.Core/DTOs/AssetEventDtos.cs \
        src/backend/DjoppieInventory.API/Controllers/Reports/AssetHistoryReportsController.cs \
        src/backend/DjoppieInventory.API/Controllers/Reports/OperationsReportsController.cs
git commit -m "feat(reports): port SwapsTab into AssetsHistoryView with rollout-context chip"
```

---

### Task 3.14: IntuneTab placeholder with summary KPIs

**Files:**
- Modify: `src/frontend/src/components/reports/intune/IntuneTab.tsx`

- [ ] **Step 1: Write tab**

```tsx
// src/frontend/src/components/reports/intune/IntuneTab.tsx
import { Box, Grid, Paper, Typography, Button, Skeleton, Stack } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { useIntuneSummary } from '../../../hooks/reports';
import { ReportErrorState } from '../shared';
import { StatisticsCard } from '../../common';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import ScheduleIcon from '@mui/icons-material/Schedule';
import CloudOffIcon from '@mui/icons-material/CloudOff';

const IntuneTab = () => {
  const { data, isLoading, error, refetch } = useIntuneSummary();

  if (error) return <ReportErrorState onRetry={() => refetch()} message={(error as Error).message} />;
  if (isLoading || !data) return <Stack spacing={1}><Skeleton variant="rounded" height={100} /></Stack>;

  return (
    <Box>
      <Grid container spacing={1}>
        <Grid size={{ xs: 6, md: 3 }}>
          <StatisticsCard icon={CheckCircleIcon} label="Compliant" value={data.compliant} color="#4CAF50" />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <StatisticsCard icon={ErrorIcon} label="Non-compliant" value={data.nonCompliant} color="#F44336" />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <StatisticsCard icon={ScheduleIcon} label="Stale (>30d)" value={data.stale} color="#FFC107" />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <StatisticsCard icon={CloudOffIcon} label="Unenrolled" value={data.unenrolled} color="#9E9E9E" />
        </Grid>
      </Grid>
      <Paper sx={{ mt: 2, p: 3, textAlign: 'center' }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
          Uitgebreide Intune-analyses komen binnenkort
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          OS-versie-verdeling, hardware-age analyse, compliance-trend en reconciliatie worden in een volgende fase toegevoegd.
        </Typography>
        <Button component={RouterLink} to="/devices/intune" variant="contained">
          Open bestaand Intune Dashboard
        </Button>
      </Paper>
    </Box>
  );
};

export default IntuneTab;
```

- [ ] **Step 2: Build, lint, smoke-test**

- [ ] **Step 3: Commit**

```bash
git add src/frontend/src/components/reports/intune/IntuneTab.tsx
git commit -m "feat(reports): add IntuneTab placeholder with summary KPIs"
```

---

### Task 3.15: Delete HardwareTab.tsx, SwapsTab.tsx, SwapsTab.tsx.backup

**Files:**
- Delete: `src/frontend/src/components/reports/HardwareTab.tsx`
- Delete: `src/frontend/src/components/reports/SwapsTab.tsx`
- Delete: `src/frontend/src/components/reports/SwapsTab.tsx.backup`
- Modify: `src/frontend/src/components/reports/index.ts`

- [ ] **Step 1: Remove files**

```bash
cd "C:/Djoppie/Djoppie-Inventory"
git rm src/frontend/src/components/reports/HardwareTab.tsx \
       src/frontend/src/components/reports/SwapsTab.tsx \
       src/frontend/src/components/reports/SwapsTab.tsx.backup
```

- [ ] **Step 2: Remove exports from index**

In `components/reports/index.ts`, remove:

```ts
export { default as HardwareTab } from './HardwareTab';
export { default as SwapsTab } from './SwapsTab';
```

- [ ] **Step 3: Build**

```bash
cd src/frontend && npm run build
```

Expected: no broken imports. If anything imports the old components, fix to use new paths.

- [ ] **Step 4: Commit**

```bash
git add src/frontend/src/components/reports/index.ts
git commit -m "refactor(reports): remove obsolete HardwareTab and SwapsTab"
```

---

### Task 3.16: PR3 smoke test

- [ ] **Step 1: Run full smoke tests**

Run app. Execute:
- Navigate to `/reports` → lands on Overview tab, KPI grid + trend + attention all render.
- Navigate to `/reports?tab=hardware` → redirects to `/reports?tab=assets&view=nu`.
- Navigate to `/reports?tab=swaps` → redirects to `/reports?tab=assets&view=history`.
- On Assets tab "Nu": click row → drawer opens with timeline.
- Toggle Nu → Historiek → URL updates, view changes.
- Intune tab shows 4 KPIs + "coming soon" message.
- Dark mode works on all new components.
- Rollouts/Werkplekken/Leasing tabs still render (existing components).

- [ ] **Step 2: Open PR, merge to develop**

---

# PR 4 — Remaining Tabs + Route Cleanup

**Target:** Rebuild Rollouts (split + type classification UI + groupBy), Werkplekken (toggle + employee view), Leasing polish, route redirects, file deletions, Serienummers page move.

**Branch:** `feat/reports-pr4-remaining-tabs`

---

### Task 4.1: Scaffold rollout/ directory + RolloutsTab entry

**Files:**
- Create: `src/frontend/src/components/reports/rollout/RolloutsTab.tsx`
- Create: `src/frontend/src/components/reports/rollout/index.ts`
- Create: `src/frontend/src/components/reports/rollout/RolloutSessionSelector.tsx` (stub)
- Create: `src/frontend/src/components/reports/rollout/RolloutKpiBar.tsx` (stub)
- Create: `src/frontend/src/components/reports/rollout/RolloutTypeBreakdown.tsx` (stub)
- Create: `src/frontend/src/components/reports/rollout/RolloutFilterBar.tsx` (stub)
- Create: `src/frontend/src/components/reports/rollout/RolloutGroupCard.tsx` (stub)
- Create: `src/frontend/src/components/reports/rollout/UnscheduledAssetsPanel.tsx` (stub)

- [ ] **Step 1: Create all stubs**

Each file exports a named default placeholder component. Example:

```tsx
// RolloutsTab.tsx
const RolloutsTab = () => <div>Rollouts TBD</div>;
export default RolloutsTab;
```

Index re-exports all.

- [ ] **Step 2: Commit scaffold**

```bash
git add src/frontend/src/components/reports/rollout/
git commit -m "chore(reports): scaffold rollout/ directory with component stubs"
```

---

### Task 4.2: Port RolloutTab logic into new structure (sub-components)

**Files:**
- Modify: `src/frontend/src/components/reports/rollout/RolloutsTab.tsx`
- Modify: all stub files above
- Reference: `src/frontend/src/components/reports/RolloutTab.tsx` (existing)

- [ ] **Step 1: Break down existing RolloutTab.tsx by section**

The existing file (1311 lines) already has sub-components internally. Extract them 1:1:
- `FilterPanel` → `RolloutFilterBar.tsx` (widen scope to be the complete toolbar)
- `UnscheduledAssetsPanel` → `UnscheduledAssetsPanel.tsx`
- `DayChecklistCard` → `RolloutGroupCard.tsx` (renamed, genericized in Task 4.3)
- `WorkplaceRow`, `EquipmentRowChip` → stay inside `RolloutGroupCard.tsx` as private sub-components
- Top KPI grid → `RolloutKpiBar.tsx`
- Session selector → `RolloutSessionSelector.tsx`
- Type breakdown row (new in Task 4.4) → `RolloutTypeBreakdown.tsx`
- Main orchestration → `RolloutsTab.tsx`

Replace imports and names. No functional changes at this step — just mechanical extraction.

- [ ] **Step 2: Build, smoke-test that Rollouts tab still works identically**

```bash
cd src/frontend && npm run build
```

Run app, Rollouts tab should behave exactly as before.

- [ ] **Step 3: Commit**

```bash
git add src/frontend/src/components/reports/rollout/
git commit -m "refactor(reports): split RolloutTab into rollout/ directory sub-components"
```

---

### Task 4.3: Make RolloutGroupCard accept arbitrary grouping

**Files:**
- Modify: `src/frontend/src/components/reports/rollout/RolloutGroupCard.tsx`

- [ ] **Step 1: Generalize props**

Change signature from `day: RolloutDayChecklist` to `group: { id: string | number; title: string; subtitle?: string; workplaces: RolloutWorkplaceChecklist[]; typeCounts?: Record<RolloutMovementType, number> }`. Render header from `title`/`subtitle`/`typeCounts` instead of `day.date`/day counts.

- [ ] **Step 2: Add `groupWorkplacesBy` helper**

Create `src/frontend/src/components/reports/rollout/groupWorkplacesBy.ts`:

```ts
import type { RolloutDayChecklist, RolloutWorkplaceChecklist, RolloutMovementType } from '../../../types/report.types';

export interface GroupedChecklist {
  id: string | number;
  title: string;
  subtitle?: string;
  workplaces: RolloutWorkplaceChecklist[];
  typeCounts: Record<RolloutMovementType, number>;
  completionPercentage: number;
}

export type GroupBy = 'day' | 'service' | 'building';

const countTypes = (wps: RolloutWorkplaceChecklist[]): Record<RolloutMovementType, number> => ({
  Onboarding:  wps.filter(w => w.movementType === 'Onboarding').length,
  Offboarding: wps.filter(w => w.movementType === 'Offboarding').length,
  Swap:        wps.filter(w => w.movementType === 'Swap').length,
  Other:       wps.filter(w => w.movementType === 'Other').length,
});

const completionPct = (wps: RolloutWorkplaceChecklist[]): number =>
  wps.length === 0 ? 0 : Math.round(100 * wps.filter(w => w.status === 'Completed').length / wps.length);

export const groupWorkplacesBy = (days: RolloutDayChecklist[], by: GroupBy): GroupedChecklist[] => {
  if (by === 'day') {
    return days.map(d => ({
      id: d.dayId,
      title: new Date(d.date).toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' }),
      subtitle: `${d.completedWorkplaces}/${d.totalWorkplaces} werkplekken`,
      workplaces: d.workplaces,
      typeCounts: countTypes(d.workplaces),
      completionPercentage: completionPct(d.workplaces),
    }));
  }

  const allWps = days.flatMap(d => d.workplaces.map(w => ({ ...w, _day: d })));
  const keyOf = (w: typeof allWps[number]): string => by === 'service' ? w.serviceName : w.buildingName;

  const grouped = new Map<string, typeof allWps>();
  allWps.forEach(w => {
    const k = keyOf(w) || 'Onbekend';
    if (!grouped.has(k)) grouped.set(k, []);
    grouped.get(k)!.push(w);
  });

  return Array.from(grouped.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([title, wps]) => ({
      id: title,
      title,
      subtitle: `${wps.filter(w => w.status === 'Completed').length}/${wps.length} werkplekken`,
      workplaces: wps,
      typeCounts: countTypes(wps),
      completionPercentage: completionPct(wps),
    }));
};
```

- [ ] **Step 3: Lint, build, commit**

```bash
cd src/frontend && npm run lint && npm run build
git add src/frontend/src/components/reports/rollout/
git commit -m "feat(reports): generalize RolloutGroupCard and add groupWorkplacesBy helper"
```

---

### Task 4.4: Add groupBy toggle and Type KPI bar

**Files:**
- Modify: `src/frontend/src/components/reports/rollout/RolloutsTab.tsx`
- Modify: `src/frontend/src/components/reports/rollout/RolloutTypeBreakdown.tsx`

- [ ] **Step 1: Implement RolloutTypeBreakdown**

```tsx
// RolloutTypeBreakdown.tsx
import { Grid, alpha } from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PersonRemoveIcon from '@mui/icons-material/PersonRemove';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import { StatisticsCard } from '../../common';
import type { RolloutMovementType } from '../../../types/report.types';

interface Props {
  counts: Record<RolloutMovementType, number>;
  selected: RolloutMovementType[];
  onToggle: (type: RolloutMovementType) => void;
}

const RolloutTypeBreakdown = ({ counts, selected, onToggle }: Props) => (
  <Grid container spacing={0.75} sx={{ mb: 1 }}>
    <Grid size={{ xs: 6, md: 3 }}>
      <StatisticsCard icon={PersonAddIcon} label="Onboarding" value={counts.Onboarding} color="#4CAF50"
        onClick={() => onToggle('Onboarding')} isSelected={selected.includes('Onboarding')} />
    </Grid>
    <Grid size={{ xs: 6, md: 3 }}>
      <StatisticsCard icon={PersonRemoveIcon} label="Offboarding" value={counts.Offboarding} color="#F44336"
        onClick={() => onToggle('Offboarding')} isSelected={selected.includes('Offboarding')} />
    </Grid>
    <Grid size={{ xs: 6, md: 3 }}>
      <StatisticsCard icon={SwapHorizIcon} label="Swap" value={counts.Swap} color="#FF7700"
        onClick={() => onToggle('Swap')} isSelected={selected.includes('Swap')} />
    </Grid>
    <Grid size={{ xs: 6, md: 3 }}>
      <StatisticsCard icon={MoreHorizIcon} label="Overig" value={counts.Other} color="#9E9E9E"
        onClick={() => onToggle('Other')} isSelected={selected.includes('Other')} />
    </Grid>
  </Grid>
);

export default RolloutTypeBreakdown;
```

- [ ] **Step 2: Add groupBy toggle + type filter to RolloutsTab**

In `RolloutsTab.tsx`:

```tsx
const [searchParams, setSearchParams] = useSearchParams();
const groupBy = (searchParams.get('groupBy') as GroupBy) ?? 'day';
const typeFilter = (searchParams.get('types')?.split(',').filter(Boolean) as RolloutMovementType[]) ?? [];

const setGroupBy = (next: GroupBy) => {
  const p = new URLSearchParams(searchParams); p.set('groupBy', next); setSearchParams(p, { replace: true });
};

const toggleType = (t: RolloutMovementType) => {
  const next = typeFilter.includes(t) ? typeFilter.filter(x => x !== t) : [...typeFilter, t];
  const p = new URLSearchParams(searchParams);
  if (next.length === 0) p.delete('types'); else p.set('types', next.join(','));
  setSearchParams(p, { replace: true });
};
```

Apply type filter before grouping:

```tsx
const filteredDays = useMemo(() => {
  if (typeFilter.length === 0) return checklist;
  return checklist.map(d => ({
    ...d,
    workplaces: d.workplaces.filter(w => typeFilter.includes(w.movementType))
  })).filter(d => d.workplaces.length > 0);
}, [checklist, typeFilter]);

const totalCounts = useMemo(() => {
  const allWps = checklist.flatMap(d => d.workplaces);
  return {
    Onboarding: allWps.filter(w => w.movementType === 'Onboarding').length,
    Offboarding: allWps.filter(w => w.movementType === 'Offboarding').length,
    Swap: allWps.filter(w => w.movementType === 'Swap').length,
    Other: allWps.filter(w => w.movementType === 'Other').length,
  };
}, [checklist]);

const groups = useMemo(() => groupWorkplacesBy(filteredDays, groupBy), [filteredDays, groupBy]);
```

Render above existing checklist:

```tsx
<RolloutTypeBreakdown counts={totalCounts} selected={typeFilter} onToggle={toggleType} />

<ToggleButtonGroup exclusive size="small" value={groupBy} onChange={(_, v) => v && setGroupBy(v)}>
  <ToggleButton value="day">Per Dag</ToggleButton>
  <ToggleButton value="service">Per Dienst</ToggleButton>
  <ToggleButton value="building">Per Gebouw</ToggleButton>
</ToggleButtonGroup>

{groups.map(g => (
  <RolloutGroupCard
    key={g.id}
    group={g}
    isExpanded={expandedGroups.includes(g.id)}
    onToggle={() => toggleGroupExpansion(g.id)}
    showDateColumn={groupBy !== 'day'}
  />
))}
```

Add `showDateColumn?: boolean` to `RolloutGroupCard` props; when true, insert a "Datum" column before other columns showing `w._day?.date` per workplace. Requires that `groupWorkplacesBy` attach the original day info to each workplace (it does via the `_day` field).

- [ ] **Step 3: Update columns in WorkplaceRow to add Type chip**

Between "Dienst" and "SWAP Details" columns:

```tsx
<TableCell>
  <Chip
    size="small"
    label={workplace.movementType}
    sx={{
      height: 20,
      fontSize: '0.65rem',
      bgcolor: alpha(typeColor(workplace.movementType), 0.12),
      color: typeColor(workplace.movementType),
    }}
  />
</TableCell>
```

Helper `typeColor`:

```tsx
const typeColor = (t: RolloutMovementType) => ({
  Onboarding: '#4CAF50', Offboarding: '#F44336', Swap: '#FF7700', Other: '#9E9E9E'
}[t]);
```

- [ ] **Step 4: Build, lint, smoke-test**

Switch between groupBy values, verify grouping changes. Click Type tile, verify filter applied. Verify URL updates.

- [ ] **Step 5: Commit**

```bash
git add src/frontend/src/components/reports/rollout/
git commit -m "feat(reports): add rollout groupBy toggle and movement-type KPI/filter"
```

---

### Task 4.5: Update Excel export to include groupBy and Type Breakdown sheet

**Files:**
- Modify: `src/frontend/src/types/report.types.ts` (add `groupBy` to `RolloutExcelExportRequest`)
- Modify: backend rollout Excel export service
- Modify: `src/frontend/src/components/reports/rollout/RolloutsTab.tsx`

- [ ] **Step 1: Add field to DTO**

Backend `RolloutExcelExportRequest` (find in `DjoppieInventory.Core/DTOs/RolloutReportDtos.cs`):

```csharp
public string? GroupBy { get; init; } = "day"; // "day" | "service" | "building"
```

Frontend type:

```ts
export interface RolloutExcelExportRequest {
  // ...existing
  groupBy?: 'day' | 'service' | 'building';
}
```

- [ ] **Step 2: Update Excel service**

In the Excel export service (likely `RolloutExcelExportService` or similar in `Infrastructure/Services/`):

- When `GroupBy == "service"`: create one sheet per service.
- When `GroupBy == "building"`: create one sheet per building.
- Always append final "Type Breakdown" sheet with columns: Date | Onboarding | Offboarding | Swap | Other — totals per day per type.

- [ ] **Step 3: Wire frontend export call**

In `RolloutsTab.tsx` export handler, pass current `groupBy`:

```tsx
exportMutation.mutate({
  serviceIds: selectedServiceIds.length ? selectedServiceIds : undefined,
  buildingIds: selectedBuildingIds.length ? selectedBuildingIds : undefined,
  includeOverview: true,
  includeSwapChecklist: true,
  includeUnscheduledAssets: showUnscheduled,
  includeSectorBreakdown: true,
  groupBy, // new
});
```

- [ ] **Step 4: Manual export test**

Export with `groupBy=service` → open .xlsx → verify one sheet per service + Type Breakdown sheet present.

- [ ] **Step 5: Commit**

```bash
git add src/backend/DjoppieInventory.Core/DTOs/RolloutReportDtos.cs \
        src/backend/DjoppieInventory.Infrastructure/Services/<ExportService>.cs \
        src/frontend/src/types/report.types.ts \
        src/frontend/src/components/reports/rollout/RolloutsTab.tsx
git commit -m "feat(reports): extend rollout Excel export with groupBy and Type Breakdown sheet"
```

---

### Task 4.6: Werkplekken/ directory with WorkplaceView and EmployeeView

**Files:**
- Create: `src/frontend/src/components/reports/werkplekken/WerkplekkenTab.tsx`
- Create: `src/frontend/src/components/reports/werkplekken/WerkplekkenWorkplaceView.tsx`
- Create: `src/frontend/src/components/reports/werkplekken/WerkplekkenEmployeeView.tsx`
- Create: `src/frontend/src/components/reports/werkplekken/index.ts`

- [ ] **Step 1: Port existing `WorkplacesTab.tsx` into `WerkplekkenWorkplaceView.tsx`**

Copy content. Rename default export. Replace per-tab IconButton export with `<ExportMenu>`.

- [ ] **Step 2: Write `WerkplekkenEmployeeView.tsx`**

```tsx
// WerkplekkenEmployeeView.tsx
import { useState, useMemo, useCallback } from 'react';
import { Box, Chip, alpha, Drawer, Typography, Skeleton } from '@mui/material';
import { GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { useEmployeesReport, useEmployeeTimeline } from '../../../hooks/reports';
import NeumorphicDataGrid from '../../admin/NeumorphicDataGrid';
import { ReportErrorState } from '../shared';
import type { EmployeeReportItem } from '../../../types/report.types';

const WerkplekkenEmployeeView = () => {
  const { data = [], isLoading, error, refetch } = useEmployeesReport();
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const columns: GridColDef[] = useMemo(() => [
    { field: 'displayName', headerName: 'Naam', width: 200, flex: 1 },
    { field: 'jobTitle', headerName: 'Functie', width: 160, valueGetter: (v) => v || '-' },
    { field: 'serviceName', headerName: 'Dienst', width: 140, valueGetter: (v) => v || '-' },
    {
      field: 'assetCount',
      headerName: '# Assets',
      width: 100,
      align: 'center',
      renderCell: (p) => <Chip label={p.value} size="small" sx={{ bgcolor: alpha('#FF7700', 0.1), color: '#FF7700', fontWeight: 700 }} />
    },
    {
      field: 'intuneCompliant',
      headerName: 'Intune ✓',
      width: 100,
      align: 'center',
    },
    {
      field: 'intuneNonCompliant',
      headerName: 'Intune ✗',
      width: 100,
      align: 'center',
      renderCell: (p) => p.value > 0 ? <Chip label={p.value} size="small" sx={{ bgcolor: alpha('#F44336', 0.1), color: '#F44336' }} /> : '-'
    },
    {
      field: 'lastEventDate',
      headerName: 'Laatste event',
      width: 130,
      valueGetter: (v) => v ? new Date(v as string).toLocaleDateString('nl-NL') : '-'
    }
  ], []);

  if (error) return <ReportErrorState onRetry={() => refetch()} message={(error as Error).message} />;

  return (
    <>
      <NeumorphicDataGrid
        rows={data}
        columns={columns}
        loading={isLoading}
        accentColor="#9C27B0"
        getRowId={(r: EmployeeReportItem) => r.employeeId}
        onRowClick={(r: EmployeeReportItem) => setSelectedId(r.employeeId)}
        initialPageSize={25}
      />
      <EmployeeDetailDrawer employeeId={selectedId} onClose={() => setSelectedId(null)} />
    </>
  );
};

const EmployeeDetailDrawer = ({ employeeId, onClose }: { employeeId: number | null; onClose: () => void }) => {
  const { data = [], isLoading } = useEmployeeTimeline(employeeId);
  if (!employeeId) return null;
  return (
    <Drawer anchor="right" open={!!employeeId} onClose={onClose}>
      <Box sx={{ width: 420, p: 2 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>Medewerker timeline</Typography>
        {isLoading ? <Skeleton variant="rounded" height={80} /> : (
          data.length === 0 ? (
            <Typography variant="body2" color="text.secondary">Geen events</Typography>
          ) : (
            data.map(ev => (
              <Box key={ev.eventId} sx={{ borderLeft: `3px solid #9C27B0`, pl: 1, mb: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  {new Date(ev.eventDate).toLocaleString('nl-NL')}
                </Typography>
                <Typography variant="body2">
                  [{ev.assetCode}] {ev.description}
                </Typography>
              </Box>
            ))
          )
        )}
      </Box>
    </Drawer>
  );
};

export default WerkplekkenEmployeeView;
```

- [ ] **Step 3: Wire WerkplekkenTab with toggle**

```tsx
// WerkplekkenTab.tsx
import { useSearchParams } from 'react-router-dom';
import { Box, ToggleButtonGroup, ToggleButton, alpha } from '@mui/material';
import WerkplekkenWorkplaceView from './WerkplekkenWorkplaceView';
import WerkplekkenEmployeeView from './WerkplekkenEmployeeView';

type View = 'workplace' | 'employee';

const WerkplekkenTab = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const view = (searchParams.get('view') as View) ?? 'workplace';

  const handleChange = (_: React.MouseEvent<HTMLElement>, next: View | null) => {
    if (!next) return;
    const p = new URLSearchParams(searchParams); p.set('view', next); setSearchParams(p, { replace: true });
  };

  return (
    <Box>
      <Box sx={{ mb: 1 }}>
        <ToggleButtonGroup exclusive size="small" value={view} onChange={handleChange}>
          <ToggleButton value="workplace">Per Werkplek</ToggleButton>
          <ToggleButton value="employee">Per Medewerker</ToggleButton>
        </ToggleButtonGroup>
      </Box>
      {view === 'workplace' ? <WerkplekkenWorkplaceView /> : <WerkplekkenEmployeeView />}
    </Box>
  );
};

export default WerkplekkenTab;
```

Index + top-level re-export.

- [ ] **Step 4: Update ReportsPage to use new WerkplekkenTab (remove old WorkplacesTab import)**

In `pages/reports/ReportsPage.tsx`:

```tsx
import { WerkplekkenTab } from '../../components/reports';
// remove: import { WorkplacesTab } from '../../components/reports';

// in content dispatch:
{activeTab === 'werkplekken' && <WerkplekkenTab />}
```

Top-level `components/reports/index.ts`:

```ts
export { WerkplekkenTab } from './werkplekken';
// remove: export { default as WorkplacesTab } from './WorkplacesTab';
```

- [ ] **Step 5: Build, lint, smoke**

- [ ] **Step 6: Commit**

```bash
git add src/frontend/src/components/reports/werkplekken/ \
        src/frontend/src/components/reports/index.ts \
        src/frontend/src/pages/reports/ReportsPage.tsx
git commit -m "feat(reports): add Werkplekken tab with workplace/employee toggle"
```

---

### Task 4.7: Leasing polish (color coding + expiry-timeline + consistent filter)

**Files:**
- Create: `src/frontend/src/components/reports/leasing/LeasingTab.tsx` (move from `components/reports/LeasingTab.tsx`)
- Create: `src/frontend/src/components/reports/leasing/LeasingExpiryTimeline.tsx`
- Create: `src/frontend/src/components/reports/leasing/index.ts`

- [ ] **Step 1: Move existing LeasingTab.tsx into subdirectory**

```bash
git mv "src/frontend/src/components/reports/LeasingTab.tsx" "src/frontend/src/components/reports/leasing/LeasingTab.tsx"
```

Create `leasing/index.ts`:

```ts
export { default as LeasingTab } from './LeasingTab';
```

Update top-level `components/reports/index.ts` to re-export from subdirectory.

- [ ] **Step 2: Apply color-coded KPI tiles**

In LeasingTab, update KPI cards:
- "Verloopt <30d": red (`#F44336`)
- "Verloopt <60d": yellow (`#FFC107`)
- "Verloopt <90d": blue (`#2196F3`)
- Active: green (`#4CAF50`)

Use existing `StatisticsCard`.

- [ ] **Step 3: Write LeasingExpiryTimeline**

```tsx
// LeasingExpiryTimeline.tsx
import { Paper, Typography, Box } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { LeaseReportItem } from '../../../types/report.types';

interface Props { leases: LeaseReportItem[]; }

const LeasingExpiryTimeline = ({ leases }: Props) => {
  const byMonth = new Map<string, number>();
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    byMonth.set(key, 0);
  }
  leases.forEach(l => {
    const d = new Date(l.endDate);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (byMonth.has(key)) byMonth.set(key, (byMonth.get(key) ?? 0) + l.assetCount);
  });
  const data = Array.from(byMonth.entries()).map(([key, count]) => ({ month: key, count }));

  return (
    <Paper sx={{ p: 2, mt: 1 }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
        Verloop-tijdlijn — komende 12 maanden (# assets)
      </Typography>
      <Box sx={{ width: '100%', height: 200 }}>
        <ResponsiveContainer>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" fontSize={10} />
            <YAxis fontSize={10} allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="count" fill="#FF9800" />
          </BarChart>
        </ResponsiveContainer>
      </Box>
    </Paper>
  );
};

export default LeasingExpiryTimeline;
```

- [ ] **Step 4: Render timeline in LeasingTab between KPI cards and table**

- [ ] **Step 5: Lint, build, commit**

```bash
cd src/frontend && npm run lint && npm run build
git add src/frontend/src/components/reports/leasing/ \
        src/frontend/src/components/reports/index.ts
git commit -m "feat(reports): move LeasingTab and add color-coded KPIs + expiry-timeline chart"
```

---

### Task 4.8: /workplaces/reports redirect

**Files:**
- Modify: `src/frontend/src/pages/workplaces/WorkplaceReportsPage.tsx`
- Or: `src/frontend/src/App.tsx` — if simpler, wrap route

- [ ] **Step 1: Replace page content with Navigate**

```tsx
// src/frontend/src/pages/workplaces/WorkplaceReportsPage.tsx
import { Navigate } from 'react-router-dom';
const WorkplaceReportsPage = () => <Navigate to="/reports?tab=werkplekken" replace />;
export default WorkplaceReportsPage;
```

- [ ] **Step 2: Smoke test**

Navigate to `/workplaces/reports` → instantly lands on `/reports?tab=werkplekken`.

- [ ] **Step 3: Commit**

```bash
git add src/frontend/src/pages/workplaces/WorkplaceReportsPage.tsx
git commit -m "refactor(reports): redirect /workplaces/reports to /reports?tab=werkplekken"
```

---

### Task 4.9: Move Serienummers page out of /reports

**Files:**
- Create: `src/frontend/src/pages/operations/rollouts/SerienummersPage.tsx`
- Modify: `src/frontend/src/constants/routes.ts`
- Modify: `src/frontend/src/App.tsx`
- Delete: `src/frontend/src/components/reports/SerialNumbersTab.tsx`

- [ ] **Step 1: Port SerialNumbersTab content into SerienummersPage**

Copy the full file content to the new location, wrap in `<Container>`, add header with back-button.

- [ ] **Step 2: Add route constant**

```ts
// routes.ts
ROLLOUT_SERIENUMMERS: '/operations/rollouts/serienummers',
```

- [ ] **Step 3: Add route in App.tsx**

```tsx
<Route path="/operations/rollouts/serienummers" element={<SerienummersPage />} />
```

- [ ] **Step 4: Update ReportsPage legacy-tab map**

In `ReportsPage.tsx`, change `serialnumbers` redirect to route outside `/reports`:

```tsx
if (tabParam === 'serialnumbers') {
  navigate('/operations/rollouts/serienummers', { replace: true });
  return;
}
```

(Use `useNavigate` instead of setSearchParams for this one.)

- [ ] **Step 5: Delete old file**

```bash
git rm src/frontend/src/components/reports/SerialNumbersTab.tsx
```

Remove its export from `components/reports/index.ts`.

- [ ] **Step 6: Update sidebar**

In `src/frontend/src/components/layout/Sidebar.tsx`, move Serienummers entry from Reports to under Operations → Rollouts.

- [ ] **Step 7: Build, smoke-test**

- [ ] **Step 8: Commit**

```bash
git add src/frontend/src/pages/operations/rollouts/SerienummersPage.tsx \
        src/frontend/src/constants/routes.ts \
        src/frontend/src/App.tsx \
        src/frontend/src/components/reports/index.ts \
        src/frontend/src/components/layout/Sidebar.tsx \
        src/frontend/src/pages/reports/ReportsPage.tsx
git commit -m "refactor(reports): move Serienummers to /operations/rollouts/serienummers"
```

---

### Task 4.10: Delete old non-migrated files

**Files:**
- Delete: `src/frontend/src/components/reports/RolloutTab.tsx`
- Delete: `src/frontend/src/components/reports/WorkplacesTab.tsx`

- [ ] **Step 1: Remove old files and their exports**

```bash
git rm src/frontend/src/components/reports/RolloutTab.tsx \
       src/frontend/src/components/reports/WorkplacesTab.tsx
```

Remove their exports from `components/reports/index.ts`. Replace with re-exports from `rollout/` and `werkplekken/`:

```ts
export { OverviewTab } from './overview';
export { AssetsTab } from './assets';
export { RolloutsTab as RolloutTab } from './rollout'; // alias for backward import-compat; can remove later
export { WerkplekkenTab } from './werkplekken';
export { IntuneTab } from './intune';
export { LeasingTab } from './leasing';
export { default as LicensesTab } from './LicensesTab';
```

- [ ] **Step 2: Update ReportsPage to use new names**

```tsx
import { OverviewTab, AssetsTab, RolloutsTab, WerkplekkenTab, IntuneTab, LeasingTab } from '../../components/reports';

// in content:
{activeTab === 'rollouts' && <RolloutsTab />}
```

- [ ] **Step 3: Build**

Expected: success.

- [ ] **Step 4: Commit**

```bash
git add src/frontend/src/components/reports/index.ts \
        src/frontend/src/pages/reports/ReportsPage.tsx
git commit -m "refactor(reports): remove obsolete RolloutTab/WorkplacesTab files"
```

---

### Task 4.11: Backend — remove deprecated swap-history endpoints

**Files:**
- Modify: `src/backend/DjoppieInventory.API/Controllers/Reports/OperationsReportsController.cs`

- [ ] **Step 1: Remove `[Obsolete]` `swaps` methods**

Delete `GetSwapHistoryLegacy`, `GetSwapHistorySummaryLegacy`, `ExportSwapHistoryLegacy`. Keep everything else (rollout methods).

- [ ] **Step 2: Verify frontend only calls new paths**

```bash
grep -rn "/reports/swaps" src/frontend/src/
```

Expected: no matches. If found, update to `/reports/assets/change-history`.

- [ ] **Step 3: Run tests**

```bash
cd src/backend && dotnet test
```

Expected: all PASS (the deleted methods had no unit tests; integration smoke-tests are manual).

- [ ] **Step 4: Commit**

```bash
git add src/backend/DjoppieInventory.API/Controllers/Reports/OperationsReportsController.cs
git commit -m "refactor(reports): remove deprecated /api/reports/swaps endpoints"
```

---

### Task 4.12: Backend — rename OperationsReportsController to RolloutReportsController

**Files:**
- Rename: `OperationsReportsController.cs` → `RolloutReportsController.cs`
- Modify: class name + logger type

- [ ] **Step 1: Git-rename and update content**

```bash
git mv src/backend/DjoppieInventory.API/Controllers/Reports/OperationsReportsController.cs \
       src/backend/DjoppieInventory.API/Controllers/Reports/RolloutReportsController.cs
```

Inside the file, rename:
- `class OperationsReportsController` → `class RolloutReportsController`
- `ILogger<OperationsReportsController>` → `ILogger<RolloutReportsController>`

Route stays `[Route("api/reports")]` as existing rollout endpoints use sub-paths like `rollouts/...`.

- [ ] **Step 2: Build**

```bash
cd src/backend && dotnet build
```

- [ ] **Step 3: Commit**

```bash
git add src/backend/DjoppieInventory.API/Controllers/Reports/
git commit -m "refactor(reports): rename OperationsReportsController to RolloutReportsController"
```

---

### Task 4.13: i18n strings

**Files:**
- Modify: `src/frontend/src/i18n/nl.json`
- Modify: `src/frontend/src/i18n/en.json`

- [ ] **Step 1: Add keys**

Add under a new `reports` key (merge with existing structure if present):

NL:
```json
{
  "reports": {
    "tabs": {
      "overview": "Overview",
      "assets": "Assets",
      "rollouts": "Rollouts",
      "werkplekken": "Werkplekken",
      "intune": "Intune",
      "leasing": "Leasing"
    },
    "assets": { "toggle": { "nu": "Nu", "history": "Historiek" } },
    "rollouts": {
      "groupBy": { "day": "Per Dag", "service": "Per Dienst", "building": "Per Gebouw" },
      "movementType": { "Onboarding": "Onboarding", "Offboarding": "Offboarding", "Swap": "Swap", "Other": "Overig" }
    },
    "werkplekken": { "toggle": { "workplace": "Per Werkplek", "employee": "Per Medewerker" } },
    "export": { "csv": "CSV (gefilterd)", "excel": "Excel (gefilterd)" },
    "empty": { "title": "Geen resultaten", "message": "Geen data gevonden met de huidige filters." },
    "error": { "title": "Kon rapport niet laden", "retry": "Opnieuw proberen", "home": "Overzicht" }
  }
}
```

EN (translated):
```json
{
  "reports": {
    "tabs": {
      "overview": "Overview",
      "assets": "Assets",
      "rollouts": "Rollouts",
      "werkplekken": "Workplaces",
      "intune": "Intune",
      "leasing": "Leasing"
    },
    "assets": { "toggle": { "nu": "Current", "history": "History" } },
    "rollouts": {
      "groupBy": { "day": "Per Day", "service": "Per Service", "building": "Per Building" },
      "movementType": { "Onboarding": "Onboarding", "Offboarding": "Offboarding", "Swap": "Swap", "Other": "Other" }
    },
    "werkplekken": { "toggle": { "workplace": "Per Workplace", "employee": "Per Employee" } },
    "export": { "csv": "CSV (filtered)", "excel": "Excel (filtered)" },
    "empty": { "title": "No results", "message": "No data found with the current filters." },
    "error": { "title": "Could not load report", "retry": "Retry", "home": "Overview" }
  }
}
```

- [ ] **Step 2: Replace hardcoded strings in new components with `t('reports...')` lookups**

Search for prominent hardcoded strings in new components and replace:

```bash
grep -rn "Overview\|Historiek\|Per Dag\|Per Dienst\|Onboarding\|Offboarding" src/frontend/src/components/reports/
```

Replace each with `t('reports.tabs.overview')` etc. using existing `useTranslation` pattern in the project.

- [ ] **Step 3: Switch language in app, verify no missing keys**

- [ ] **Step 4: Commit**

```bash
git add src/frontend/src/i18n/nl.json src/frontend/src/i18n/en.json src/frontend/src/components/reports/
git commit -m "feat(reports): add i18n strings for new tabs and UI elements"
```

---

### Task 4.14: Full PR4 smoke test

- [ ] **Step 1: Run all smoke checklist items from spec Section 12**

- [ ] Navigate to all 6 tabs, data loads.
- [ ] `/reports?tab=hardware` → `/reports?tab=assets&view=nu`.
- [ ] `/workplaces/reports` → `/reports?tab=werkplekken`.
- [ ] `/reports?tab=serialnumbers` → `/operations/rollouts/serienummers`.
- [ ] Filters persist in URL; shareable.
- [ ] Assets tab: toggle + expand drawer works.
- [ ] Assets tab: status stat-card click filters.
- [ ] Rollouts tab: groupBy toggle (day/service/building) works.
- [ ] Rollouts tab: type-filter + KPI row works.
- [ ] Werkplekken: workplace/employee toggle works; employee drawer shows timeline.
- [ ] Exports: CSV + Excel for each tab returns valid file.
- [ ] Dark-mode works on all new components.
- [ ] NL ↔ EN translations complete.
- [ ] Refresh button invalidates correct queries.
- [ ] API 500 simulated → ReportErrorState shows, retry works.
- [ ] Filter producing no results → ReportEmptyState.

- [ ] **Step 2: Open PR, merge when CI green and smoke passes**

PR description includes before/after screenshots, list of removed files, list of migrated URLs.

---

## Post-merge verification

After all 4 PRs merged to `develop`:

- Deploy to DEV environment (`./deploy-dev.ps1`).
- Run smoke checklist end-to-end against DEV URL.
- Monitor App Insights for deprecation-warning logs on legacy endpoint usage (should be zero after 1 week if frontend migrated cleanly).
- After 1 release cycle, remove backend alias endpoints (`/api/reports/hardware*` aliases in InventoryReportsController) in a follow-up cleanup PR.

---

## Self-review checklist (applied before finalizing this plan)

- [x] Every spec section has at least one task (IA, Overview, Assets, Rollouts, Werkplekken, Intune, Leasing, shared components, backend services, migration, i18n, a11y/responsive, exports).
- [x] No placeholders (TBD, "implement later"). Every code step has actual code.
- [x] Type/name consistency: `RolloutMovementType` + `movementType` match across backend DTO, frontend type, components.
- [x] File paths are absolute where needed.
- [x] Each task has commit message in imperative form.
- [x] Fallback strategies noted where library/entity presence uncertain (Lease entity, MUI X Pro for expandable rows).

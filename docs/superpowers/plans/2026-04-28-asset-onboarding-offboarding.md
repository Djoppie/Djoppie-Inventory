# Asset Onboarding & Offboarding Lifecycle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a single-employee on/offboarding workflow that extends `AssetRequest` with multi-line asset assignments and atomically mutates real `Asset` records on completion, with auto-linking to `Employee` records via the existing organization sync.

**Architecture:** Server-side: extend `AssetRequest` entity, add `AssetRequestLine` child entity, introduce `AssetRequestCompletionService` for atomic state transitions, hook auto-linking into `OrganizationSyncService`. Client-side: extend the existing `assetRequests.api.ts` / `useAssetRequests.ts` infra, add list/detail pages plus a lines editor, wire the existing `RequestsDashboardPage` to live statistics.

**Tech Stack:** ASP.NET Core 8 + EF Core (SQLite dev / Azure SQL prod), xUnit, React 19 + Vite + MUI + TanStack Query + i18next.

**Reference spec:** `docs/superpowers/specs/2026-04-28-asset-onboarding-offboarding-design.md`

---

## File Map

### Backend (`src/backend/`)

**Modify:**
- `DjoppieInventory.Core/Entities/AssetRequest.cs` — replace old shape, add nav to Lines + Employee + PhysicalWorkplace
- `DjoppieInventory.Core/Interfaces/IAssetRequestRepository.cs` — add filters, line CRUD, statistics
- `DjoppieInventory.Infrastructure/Repositories/AssetRequestRepository.cs` — implement new methods + eager loads
- `DjoppieInventory.Infrastructure/Data/ApplicationDbContext.cs` — add `DbSet<AssetRequestLine>`, update `AssetRequest` config, add `AssetRequestLine` config
- `DjoppieInventory.Infrastructure/Services/OrganizationSyncService.cs` — append `LinkPendingAssetRequestsAsync()` and call it from `SyncOrganizationAsync`
- `DjoppieInventory.Core/Interfaces/IOrganizationSyncService.cs` — expose `LinkPendingAssetRequestsAsync()`
- `DjoppieInventory.Core/DTOs/AssetRequestDto.cs` — replace DTOs
- `DjoppieInventory.API/Controllers/Operations/RequestsController.cs` — rewrite endpoints
- `DjoppieInventory.API/Extensions/ServiceCollectionExtensions.cs` — register `IAssetRequestCompletionService`

**Create:**
- `DjoppieInventory.Core/Entities/AssetRequestLine.cs` — entity + 3 enums (`AssetLineSourceType`, `AssetRequestLineStatus`, `AssetReturnAction`)
- `DjoppieInventory.Core/Interfaces/IAssetRequestCompletionService.cs`
- `DjoppieInventory.Infrastructure/Services/AssetRequestCompletionService.cs`
- `DjoppieInventory.Infrastructure/Migrations/<timestamp>_AddAssetRequestLifecycle.cs` (auto-generated)
- `DjoppieInventory.Tests/Services/AssetRequestCompletionServiceTests.cs`
- `DjoppieInventory.Tests/Services/OrganizationSyncServiceLinkTests.cs`

### Frontend (`src/frontend/src/`)

**Modify:**
- `types/assetRequest.types.ts` — replace types
- `api/assetRequests.api.ts` — replace functions
- `hooks/useAssetRequests.ts` — replace hooks (keep file name)
- `constants/routes.ts` — add detail/new sub-routes
- `App.tsx` — wire new routes
- `pages/operations/requests/RequestsDashboardPage.tsx` — remove `comingSoon`, wire statistics
- `i18n/nl.json`, `i18n/en.json` — add `requests` namespace

**Create:**
- `pages/operations/requests/OnboardingListPage.tsx`
- `pages/operations/requests/OffboardingListPage.tsx`
- `pages/operations/requests/RequestCreatePage.tsx`
- `pages/operations/requests/RequestDetailPage.tsx`
- `components/operations/requests/RequestsList.tsx`
- `components/operations/requests/RequestForm.tsx`
- `components/operations/requests/EmployeePickerWithFallback.tsx`
- `components/operations/requests/RequestLinesEditor.tsx`
- `components/operations/requests/AssetLineRow.tsx`
- `components/operations/requests/RequestStatusTransition.tsx`
- `components/operations/requests/EmployeeLinkChip.tsx`
- `components/operations/requests/RequestStatusBadge.tsx`
- `components/operations/requests/LineStatusBadge.tsx`

---

## Phase 1 — Backend domain & migration

### Task 1: Define `AssetRequestLine` entity and enums

**Files:**
- Create: `src/backend/DjoppieInventory.Core/Entities/AssetRequestLine.cs`

- [ ] **Step 1: Create the entity file**

```csharp
namespace DjoppieInventory.Core.Entities;

/// <summary>
/// Represents a single asset assignment within an AssetRequest (on/offboarding).
/// Multiple lines can exist per request: one per asset type (laptop, monitor, etc.).
/// </summary>
public class AssetRequestLine
{
    public int Id { get; set; }

    public int AssetRequestId { get; set; }
    public AssetRequest AssetRequest { get; set; } = null!;

    public int AssetTypeId { get; set; }
    public AssetType AssetType { get; set; } = null!;

    public AssetLineSourceType SourceType { get; set; } = AssetLineSourceType.ToBeAssigned;

    public int? AssetId { get; set; }
    public Asset? Asset { get; set; }

    public int? AssetTemplateId { get; set; }
    public AssetTemplate? AssetTemplate { get; set; }

    public AssetRequestLineStatus Status { get; set; } = AssetRequestLineStatus.Pending;

    /// <summary>
    /// Offboarding-only: what to do with the asset on completion.
    /// Ignored for onboarding (which always sets the asset to InGebruik).
    /// </summary>
    public AssetReturnAction? ReturnAction { get; set; }

    public string? Notes { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

public enum AssetLineSourceType
{
    ToBeAssigned = 0,
    ExistingInventory = 1,
    NewFromTemplate = 2
}

public enum AssetRequestLineStatus
{
    Pending = 0,
    Reserved = 1,
    Completed = 2,
    Skipped = 3
}

public enum AssetReturnAction
{
    ReturnToStock = 0,
    Decommission = 1,
    Reassign = 2
}
```

- [ ] **Step 2: Build to ensure compiles**

Run: `cd src/backend && dotnet build DjoppieInventory.Core/DjoppieInventory.Core.csproj`
Expected: Build succeeded.

- [ ] **Step 3: Commit**

```bash
git add src/backend/DjoppieInventory.Core/Entities/AssetRequestLine.cs
git commit -m "feat(requests): add AssetRequestLine entity and lifecycle enums"
```

---

### Task 2: Reshape `AssetRequest` entity

**Files:**
- Modify: `src/backend/DjoppieInventory.Core/Entities/AssetRequest.cs`

- [ ] **Step 1: Replace the entity body**

Replace the entire `AssetRequest` class (keep the existing `AssetRequestType` and `AssetRequestStatus` enums at the bottom of the file unchanged). The new class:

```csharp
public class AssetRequest
{
    public int Id { get; set; }

    public AssetRequestType RequestType { get; set; }
    public AssetRequestStatus Status { get; set; } = AssetRequestStatus.Pending;

    /// <summary>
    /// Free-text identifier for the employee (name/email).
    /// Always populated at intake; may be present even before the Entra account exists.
    /// </summary>
    public string RequestedFor { get; set; } = string.Empty;

    /// <summary>
    /// FK to the Employee record once it exists. Populated either manually or
    /// via OrganizationSyncService.LinkPendingAssetRequestsAsync().
    /// </summary>
    public int? EmployeeId { get; set; }
    public Employee? Employee { get; set; }

    public DateTime RequestedDate { get; set; }

    /// <summary>
    /// Optional: where the employee will be seated (onboarding) or was seated (offboarding).
    /// Informational only; no occupancy mutation happens on completion.
    /// </summary>
    public int? PhysicalWorkplaceId { get; set; }
    public PhysicalWorkplace? PhysicalWorkplace { get; set; }

    public string? Notes { get; set; }

    public string CreatedBy { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public string? ModifiedBy { get; set; }
    public DateTime? ModifiedAt { get; set; }
    public DateTime? CompletedAt { get; set; }

    public ICollection<AssetRequestLine> Lines { get; set; } = new List<AssetRequestLine>();
}
```

Removed: `EmployeeName`, `AssetType`, `AssignedAssetId`, `AssignedAsset`. Keep the existing `AssetRequestType` and `AssetRequestStatus` enums in the same file (do not remove them).

- [ ] **Step 2: Verify Core compiles**

Run: `cd src/backend && dotnet build DjoppieInventory.Core/DjoppieInventory.Core.csproj`
Expected: Build succeeded (Infrastructure/API will not compile yet — that is fixed in later tasks).

- [ ] **Step 3: Commit**

```bash
git add src/backend/DjoppieInventory.Core/Entities/AssetRequest.cs
git commit -m "feat(requests): reshape AssetRequest entity for lifecycle workflow"
```

---

### Task 3: Update DbContext — DbSet and EF configuration

**Files:**
- Modify: `src/backend/DjoppieInventory.Infrastructure/Data/ApplicationDbContext.cs`

- [ ] **Step 1: Add DbSet declaration**

Locate the existing `public DbSet<AssetRequest> AssetRequests { get; set; }` line (around line 37). Add directly below:

```csharp
public DbSet<AssetRequestLine> AssetRequestLines { get; set; }
```

- [ ] **Step 2: Replace AssetRequest model configuration**

Find the block starting `// AssetRequest configuration` (around line 585). Replace the entire `modelBuilder.Entity<AssetRequest>(entity => { ... });` block with:

```csharp
// AssetRequest configuration
modelBuilder.Entity<AssetRequest>(entity =>
{
    entity.HasKey(e => e.Id);
    entity.HasIndex(e => e.RequestedDate);
    entity.HasIndex(e => e.RequestType);
    entity.HasIndex(e => e.Status);
    entity.HasIndex(e => e.CreatedAt);
    entity.HasIndex(e => e.EmployeeId);

    entity.Property(e => e.RequestedFor).IsRequired().HasMaxLength(200);
    entity.Property(e => e.Notes).HasMaxLength(2000);
    entity.Property(e => e.CreatedBy).IsRequired().HasMaxLength(200);
    entity.Property(e => e.ModifiedBy).HasMaxLength(200);
    entity.Property(e => e.RequestType).HasConversion<int>();
    entity.Property(e => e.Status).HasConversion<int>();

    entity.HasOne(e => e.Employee)
        .WithMany()
        .HasForeignKey(e => e.EmployeeId)
        .OnDelete(DeleteBehavior.SetNull);

    entity.HasOne(e => e.PhysicalWorkplace)
        .WithMany()
        .HasForeignKey(e => e.PhysicalWorkplaceId)
        .OnDelete(DeleteBehavior.SetNull);

    entity.HasMany(e => e.Lines)
        .WithOne(l => l.AssetRequest)
        .HasForeignKey(l => l.AssetRequestId)
        .OnDelete(DeleteBehavior.Cascade);
});

// AssetRequestLine configuration
modelBuilder.Entity<AssetRequestLine>(entity =>
{
    entity.HasKey(e => e.Id);
    entity.HasIndex(e => e.AssetRequestId);
    entity.HasIndex(e => e.AssetId);
    entity.HasIndex(e => e.Status);

    entity.Property(e => e.Notes).HasMaxLength(2000);
    entity.Property(e => e.SourceType).HasConversion<int>();
    entity.Property(e => e.Status).HasConversion<int>();
    entity.Property(e => e.ReturnAction).HasConversion<int?>();

    entity.HasOne(e => e.AssetType)
        .WithMany()
        .HasForeignKey(e => e.AssetTypeId)
        .OnDelete(DeleteBehavior.Restrict);

    entity.HasOne(e => e.Asset)
        .WithMany()
        .HasForeignKey(e => e.AssetId)
        .OnDelete(DeleteBehavior.SetNull);

    entity.HasOne(e => e.AssetTemplate)
        .WithMany()
        .HasForeignKey(e => e.AssetTemplateId)
        .OnDelete(DeleteBehavior.SetNull);
});
```

- [ ] **Step 3: Build Infrastructure**

Run: `cd src/backend && dotnet build DjoppieInventory.Infrastructure/DjoppieInventory.Infrastructure.csproj`
Expected: Build will fail with errors in `AssetRequestRepository.cs` referencing removed properties — this is fixed in Task 4.

- [ ] **Step 4: Commit**

```bash
git add src/backend/DjoppieInventory.Infrastructure/Data/ApplicationDbContext.cs
git commit -m "feat(requests): add EF model config for AssetRequest lifecycle"
```

---

### Task 4: Update repository interface and implementation

**Files:**
- Modify: `src/backend/DjoppieInventory.Core/Interfaces/IAssetRequestRepository.cs`
- Modify: `src/backend/DjoppieInventory.Infrastructure/Repositories/AssetRequestRepository.cs`

- [ ] **Step 1: Replace the repository interface**

Replace the entire file contents:

```csharp
using DjoppieInventory.Core.Entities;

namespace DjoppieInventory.Core.Interfaces;

public class AssetRequestFilter
{
    public AssetRequestType? Type { get; set; }
    public List<AssetRequestStatus>? Statuses { get; set; }
    public DateTime? DateFrom { get; set; }
    public DateTime? DateTo { get; set; }
    public int? EmployeeId { get; set; }
    public string? SearchQuery { get; set; }
}

public class AssetRequestStatistics
{
    public int ActiveRequests { get; set; }
    public int MonthlyRequests { get; set; }
    public int InProgressRequests { get; set; }
}

public interface IAssetRequestRepository
{
    Task<IEnumerable<AssetRequest>> QueryAsync(AssetRequestFilter filter, CancellationToken cancellationToken = default);
    Task<AssetRequest?> GetByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<AssetRequest> CreateAsync(AssetRequest request, CancellationToken cancellationToken = default);
    Task<AssetRequest> UpdateAsync(AssetRequest request, CancellationToken cancellationToken = default);
    Task DeleteAsync(int id, CancellationToken cancellationToken = default);

    Task<AssetRequestLine> AddLineAsync(AssetRequestLine line, CancellationToken cancellationToken = default);
    Task<AssetRequestLine> UpdateLineAsync(AssetRequestLine line, CancellationToken cancellationToken = default);
    Task DeleteLineAsync(int lineId, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<AssetRequest>> GetUnlinkedAsync(CancellationToken cancellationToken = default);

    Task<AssetRequestStatistics> GetStatisticsAsync(CancellationToken cancellationToken = default);
}
```

- [ ] **Step 2: Replace the repository implementation**

Replace the entire `AssetRequestRepository.cs` body:

```csharp
using DjoppieInventory.Core.Entities;
using DjoppieInventory.Core.Interfaces;
using DjoppieInventory.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace DjoppieInventory.Infrastructure.Repositories;

public class AssetRequestRepository : IAssetRequestRepository
{
    private readonly ApplicationDbContext _context;

    public AssetRequestRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    private IQueryable<AssetRequest> WithIncludes(IQueryable<AssetRequest> query) =>
        query
            .Include(r => r.Employee)
            .Include(r => r.PhysicalWorkplace)
            .Include(r => r.Lines).ThenInclude(l => l.AssetType)
            .Include(r => r.Lines).ThenInclude(l => l.Asset)
            .Include(r => r.Lines).ThenInclude(l => l.AssetTemplate);

    public async Task<IEnumerable<AssetRequest>> QueryAsync(AssetRequestFilter filter, CancellationToken cancellationToken = default)
    {
        var query = _context.AssetRequests.AsQueryable();

        if (filter.Type.HasValue)
            query = query.Where(r => r.RequestType == filter.Type.Value);

        if (filter.Statuses != null && filter.Statuses.Count > 0)
            query = query.Where(r => filter.Statuses.Contains(r.Status));

        if (filter.DateFrom.HasValue)
            query = query.Where(r => r.RequestedDate >= filter.DateFrom.Value);

        if (filter.DateTo.HasValue)
            query = query.Where(r => r.RequestedDate <= filter.DateTo.Value);

        if (filter.EmployeeId.HasValue)
            query = query.Where(r => r.EmployeeId == filter.EmployeeId.Value);

        if (!string.IsNullOrWhiteSpace(filter.SearchQuery))
        {
            var q = filter.SearchQuery.Trim().ToLower();
            query = query.Where(r =>
                r.RequestedFor.ToLower().Contains(q) ||
                (r.Notes != null && r.Notes.ToLower().Contains(q)));
        }

        return await WithIncludes(query)
            .OrderByDescending(r => r.RequestedDate)
            .ThenByDescending(r => r.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public Task<AssetRequest?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
        => WithIncludes(_context.AssetRequests.AsQueryable())
            .FirstOrDefaultAsync(r => r.Id == id, cancellationToken);

    public async Task<AssetRequest> CreateAsync(AssetRequest request, CancellationToken cancellationToken = default)
    {
        _context.AssetRequests.Add(request);
        await _context.SaveChangesAsync(cancellationToken);
        return request;
    }

    public async Task<AssetRequest> UpdateAsync(AssetRequest request, CancellationToken cancellationToken = default)
    {
        _context.AssetRequests.Update(request);
        await _context.SaveChangesAsync(cancellationToken);
        return request;
    }

    public async Task DeleteAsync(int id, CancellationToken cancellationToken = default)
    {
        var request = await _context.AssetRequests.FindAsync(new object[] { id }, cancellationToken);
        if (request != null)
        {
            _context.AssetRequests.Remove(request);
            await _context.SaveChangesAsync(cancellationToken);
        }
    }

    public async Task<AssetRequestLine> AddLineAsync(AssetRequestLine line, CancellationToken cancellationToken = default)
    {
        _context.AssetRequestLines.Add(line);
        await _context.SaveChangesAsync(cancellationToken);
        return line;
    }

    public async Task<AssetRequestLine> UpdateLineAsync(AssetRequestLine line, CancellationToken cancellationToken = default)
    {
        line.UpdatedAt = DateTime.UtcNow;
        _context.AssetRequestLines.Update(line);
        await _context.SaveChangesAsync(cancellationToken);
        return line;
    }

    public async Task DeleteLineAsync(int lineId, CancellationToken cancellationToken = default)
    {
        var line = await _context.AssetRequestLines.FindAsync(new object[] { lineId }, cancellationToken);
        if (line != null)
        {
            _context.AssetRequestLines.Remove(line);
            await _context.SaveChangesAsync(cancellationToken);
        }
    }

    public async Task<IReadOnlyList<AssetRequest>> GetUnlinkedAsync(CancellationToken cancellationToken = default)
    {
        return await _context.AssetRequests
            .Where(r => r.EmployeeId == null && r.Status != AssetRequestStatus.Cancelled)
            .ToListAsync(cancellationToken);
    }

    public async Task<AssetRequestStatistics> GetStatisticsAsync(CancellationToken cancellationToken = default)
    {
        var monthStart = new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        var monthEnd = monthStart.AddMonths(1);

        var active = await _context.AssetRequests
            .CountAsync(r =>
                r.Status == AssetRequestStatus.Pending ||
                r.Status == AssetRequestStatus.Approved ||
                r.Status == AssetRequestStatus.InProgress,
                cancellationToken);

        var monthly = await _context.AssetRequests
            .CountAsync(r => r.CreatedAt >= monthStart && r.CreatedAt < monthEnd, cancellationToken);

        var inProgress = await _context.AssetRequests
            .CountAsync(r => r.Status == AssetRequestStatus.InProgress, cancellationToken);

        return new AssetRequestStatistics
        {
            ActiveRequests = active,
            MonthlyRequests = monthly,
            InProgressRequests = inProgress
        };
    }
}
```

- [ ] **Step 3: Build Infrastructure**

Run: `cd src/backend && dotnet build DjoppieInventory.Infrastructure/DjoppieInventory.Infrastructure.csproj`
Expected: Build succeeded. (API project may still be broken — fixed in later tasks.)

- [ ] **Step 4: Commit**

```bash
git add src/backend/DjoppieInventory.Core/Interfaces/IAssetRequestRepository.cs src/backend/DjoppieInventory.Infrastructure/Repositories/AssetRequestRepository.cs
git commit -m "feat(requests): repository with filtered queries and line CRUD"
```

---

### Task 5: Generate database migration

**Files:**
- Create: `src/backend/DjoppieInventory.Infrastructure/Migrations/<timestamp>_AddAssetRequestLifecycle.cs` (auto)

- [ ] **Step 1: Generate migration**

Run from `src/backend`:
```bash
dotnet ef migrations add AddAssetRequestLifecycle \
  --project DjoppieInventory.Infrastructure \
  --startup-project DjoppieInventory.API
```

Expected: New migration file created under `DjoppieInventory.Infrastructure/Migrations/` with `Up` dropping `EmployeeName`, `AssetType`, `AssignedAssetId` columns, adding the new columns + the `AssetRequestLines` table + indexes.

- [ ] **Step 2: Review the generated migration**

Open the generated `*_AddAssetRequestLifecycle.cs`. Verify:
- `Up()` drops the old columns and FK on `AssetRequests`.
- `Up()` adds `RequestedFor` (NOT NULL, max 200), `EmployeeId` (nullable FK to `Employees`), `PhysicalWorkplaceId` (nullable FK to `PhysicalWorkplaces`).
- `Up()` creates `AssetRequestLines` table with all properties from Task 1 + the three FKs (`AssetTypeId` Restrict, `AssetId` SetNull, `AssetTemplateId` SetNull) + `AssetRequestId` Cascade FK.
- `Up()` creates the indexes listed in Task 3 step 2.
- `Down()` reverses cleanly.

If `EmployeeName`/`AssetType`/`AssignedAssetId` are not dropped, manually edit the migration to drop them as the first operations in `Up()` and recreate them in `Down()`. (EF should handle this automatically because the entity properties are removed.)

- [ ] **Step 3: Apply to local SQLite**

```bash
dotnet ef database update \
  --project DjoppieInventory.Infrastructure \
  --startup-project DjoppieInventory.API
```

Expected: Migration applied. The local `djoppie.db` reflects the new schema.

- [ ] **Step 4: Commit**

```bash
git add src/backend/DjoppieInventory.Infrastructure/Migrations/
git commit -m "feat(requests): EF migration AddAssetRequestLifecycle"
```

---

## Phase 2 — Backend service & API

### Task 6: Replace request DTOs

**Files:**
- Modify: `src/backend/DjoppieInventory.Core/DTOs/AssetRequestDto.cs`

- [ ] **Step 1: Replace the entire file**

```csharp
using DjoppieInventory.Core.Entities;

namespace DjoppieInventory.Core.DTOs;

// ==================== Read DTOs ====================

public class AssetRequestSummaryDto
{
    public int Id { get; set; }
    public string RequestType { get; set; } = string.Empty; // "onboarding" | "offboarding"
    public string Status { get; set; } = string.Empty;
    public string RequestedFor { get; set; } = string.Empty;
    public int? EmployeeId { get; set; }
    public string? EmployeeDisplayName { get; set; }
    public DateTime RequestedDate { get; set; }
    public int? PhysicalWorkplaceId { get; set; }
    public string? PhysicalWorkplaceName { get; set; }
    public int LineCount { get; set; }
    public int CompletedLineCount { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
}

public class AssetRequestDetailDto : AssetRequestSummaryDto
{
    public string? Notes { get; set; }
    public string CreatedBy { get; set; } = string.Empty;
    public string? ModifiedBy { get; set; }
    public DateTime? ModifiedAt { get; set; }
    public List<AssetRequestLineDto> Lines { get; set; } = new();
}

public class AssetRequestLineDto
{
    public int Id { get; set; }
    public int AssetTypeId { get; set; }
    public string AssetTypeName { get; set; } = string.Empty;
    public string SourceType { get; set; } = string.Empty;     // "ToBeAssigned" | "ExistingInventory" | "NewFromTemplate"
    public int? AssetId { get; set; }
    public string? AssetCode { get; set; }
    public string? AssetName { get; set; }
    public int? AssetTemplateId { get; set; }
    public string? AssetTemplateName { get; set; }
    public string Status { get; set; } = string.Empty;          // "Pending" | "Reserved" | "Completed" | "Skipped"
    public string? ReturnAction { get; set; }                   // null | "ReturnToStock" | "Decommission" | "Reassign"
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class AssetRequestStatisticsDto
{
    public int ActiveRequests { get; set; }
    public int MonthlyRequests { get; set; }
    public int InProgressRequests { get; set; }
}

// ==================== Write DTOs ====================

public class CreateAssetRequestDto
{
    public string RequestType { get; set; } = string.Empty; // "onboarding" | "offboarding"
    public string RequestedFor { get; set; } = string.Empty;
    public int? EmployeeId { get; set; }
    public DateTime RequestedDate { get; set; }
    public int? PhysicalWorkplaceId { get; set; }
    public string? Notes { get; set; }
    public List<CreateAssetRequestLineDto> Lines { get; set; } = new();
}

public class UpdateAssetRequestDto
{
    public string? RequestedFor { get; set; }
    public int? EmployeeId { get; set; }
    public DateTime? RequestedDate { get; set; }
    public int? PhysicalWorkplaceId { get; set; }
    public string? Notes { get; set; }
}

public class CreateAssetRequestLineDto
{
    public int AssetTypeId { get; set; }
    public string SourceType { get; set; } = "ToBeAssigned";
    public int? AssetId { get; set; }
    public int? AssetTemplateId { get; set; }
    public string? ReturnAction { get; set; }
    public string? Notes { get; set; }
}

public class UpdateAssetRequestLineDto
{
    public int? AssetTypeId { get; set; }
    public string? SourceType { get; set; }
    public int? AssetId { get; set; }
    public int? AssetTemplateId { get; set; }
    public string? Status { get; set; }       // "Pending" | "Reserved" | "Completed" | "Skipped"
    public string? ReturnAction { get; set; }
    public string? Notes { get; set; }
}

public class AssetRequestTransitionDto
{
    public string Target { get; set; } = string.Empty; // "Approved" | "InProgress" | "Completed" | "Cancelled"
}

public class LinkEmployeeDto
{
    public int EmployeeId { get; set; }
}
```

- [ ] **Step 2: Build Core**

Run: `cd src/backend && dotnet build DjoppieInventory.Core/DjoppieInventory.Core.csproj`
Expected: Build succeeded.

- [ ] **Step 3: Commit**

```bash
git add src/backend/DjoppieInventory.Core/DTOs/AssetRequestDto.cs
git commit -m "feat(requests): rewrite DTOs for lifecycle workflow"
```

---

### Task 7: Define `IAssetRequestCompletionService`

**Files:**
- Create: `src/backend/DjoppieInventory.Core/Interfaces/IAssetRequestCompletionService.cs`

- [ ] **Step 1: Create the interface**

```csharp
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
```

- [ ] **Step 2: Build Core**

Run: `cd src/backend && dotnet build DjoppieInventory.Core/DjoppieInventory.Core.csproj`
Expected: Build succeeded.

- [ ] **Step 3: Commit**

```bash
git add src/backend/DjoppieInventory.Core/Interfaces/IAssetRequestCompletionService.cs
git commit -m "feat(requests): define IAssetRequestCompletionService"
```

---

### Task 8: Implement `AssetRequestCompletionService`

**Files:**
- Create: `src/backend/DjoppieInventory.Infrastructure/Services/AssetRequestCompletionService.cs`

- [ ] **Step 1: Create the service**

```csharp
using DjoppieInventory.Core.Entities;
using DjoppieInventory.Core.Interfaces;
using DjoppieInventory.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace DjoppieInventory.Infrastructure.Services;

public class AssetRequestCompletionService : IAssetRequestCompletionService
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<AssetRequestCompletionService> _logger;

    public AssetRequestCompletionService(
        ApplicationDbContext context,
        ILogger<AssetRequestCompletionService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<CompletionResult> TransitionAsync(
        int requestId,
        AssetRequestStatus target,
        string performedBy,
        string? performedByEmail,
        CancellationToken cancellationToken = default)
    {
        var request = await _context.AssetRequests
            .Include(r => r.Employee)
            .Include(r => r.Lines).ThenInclude(l => l.Asset)
            .FirstOrDefaultAsync(r => r.Id == requestId, cancellationToken)
            ?? throw new InvalidOperationException($"AssetRequest {requestId} not found.");

        ValidateTransition(request.Status, target);

        if (target == AssetRequestStatus.Completed)
        {
            ValidateCompletion(request);
        }

        await using var tx = await _context.Database.BeginTransactionAsync(cancellationToken);

        var affected = new List<int>();

        if (target == AssetRequestStatus.Completed)
        {
            foreach (var line in request.Lines.Where(l => l.Status != AssetRequestLineStatus.Skipped))
            {
                if (request.RequestType == AssetRequestType.Onboarding)
                {
                    ApplyOnboardingLine(request, line, performedBy, performedByEmail);
                }
                else
                {
                    ApplyOffboardingLine(request, line, performedBy, performedByEmail);
                }

                if (line.AssetId.HasValue) affected.Add(line.AssetId.Value);
                line.Status = AssetRequestLineStatus.Completed;
                line.UpdatedAt = DateTime.UtcNow;
            }

            request.CompletedAt = DateTime.UtcNow;
        }

        request.Status = target;
        request.ModifiedBy = performedBy;
        request.ModifiedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);
        await tx.CommitAsync(cancellationToken);

        _logger.LogInformation("AssetRequest {Id} transitioned to {Status} by {User}",
            request.Id, target, performedBy);

        return new CompletionResult
        {
            Request = request,
            AffectedAssetIds = affected
        };
    }

    private static void ValidateTransition(AssetRequestStatus current, AssetRequestStatus target)
    {
        if (current == target) return;

        var allowed = current switch
        {
            AssetRequestStatus.Pending => new[] { AssetRequestStatus.Approved, AssetRequestStatus.InProgress, AssetRequestStatus.Cancelled },
            AssetRequestStatus.Approved => new[] { AssetRequestStatus.InProgress, AssetRequestStatus.Cancelled },
            AssetRequestStatus.InProgress => new[] { AssetRequestStatus.Completed, AssetRequestStatus.Cancelled },
            AssetRequestStatus.Completed => Array.Empty<AssetRequestStatus>(),
            AssetRequestStatus.Cancelled => Array.Empty<AssetRequestStatus>(),
            AssetRequestStatus.Rejected => Array.Empty<AssetRequestStatus>(),
            _ => Array.Empty<AssetRequestStatus>()
        };

        if (!allowed.Contains(target))
            throw new InvalidOperationException(
                $"Cannot transition AssetRequest from {current} to {target}.");
    }

    private static void ValidateCompletion(AssetRequest request)
    {
        foreach (var line in request.Lines.Where(l => l.Status != AssetRequestLineStatus.Skipped))
        {
            if (line.AssetId == null)
                throw new InvalidOperationException(
                    $"Line {line.Id} has no AssetId; cannot complete request.");

            if (line.Asset == null)
                throw new InvalidOperationException(
                    $"Line {line.Id} references a missing asset.");

            if (request.RequestType == AssetRequestType.Onboarding)
            {
                if (line.Asset.Status != AssetStatus.Nieuw && line.Asset.Status != AssetStatus.Stock)
                    throw new InvalidOperationException(
                        $"Asset {line.Asset.AssetCode} must be Nieuw or Stock to onboard (was {line.Asset.Status}).");
            }
            else // Offboarding
            {
                if (line.ReturnAction == null)
                    throw new InvalidOperationException(
                        $"Line {line.Id} requires a ReturnAction for offboarding.");

                if (line.Asset.Status != AssetStatus.InGebruik)
                    throw new InvalidOperationException(
                        $"Asset {line.Asset.AssetCode} must be InGebruik to offboard (was {line.Asset.Status}).");
            }
        }
    }

    private static void ApplyOnboardingLine(
        AssetRequest request,
        AssetRequestLine line,
        string performedBy,
        string? performedByEmail)
    {
        var asset = line.Asset!;
        var previousStatus = asset.Status;

        asset.Status = AssetStatus.InGebruik;
        asset.EmployeeId = request.EmployeeId;
        asset.Owner = request.Employee?.DisplayName ?? request.RequestedFor;
        if (request.Employee?.ServiceId != null)
            asset.ServiceId = request.Employee.ServiceId;
        if (asset.InstallationDate == null)
            asset.InstallationDate = DateTime.UtcNow;
        asset.UpdatedAt = DateTime.UtcNow;

        var ev = new AssetEvent
        {
            AssetId = asset.Id,
            EventType = AssetEventType.DeviceOnboarded,
            Description = $"Onboarded via request #{request.Id}",
            OldValue = previousStatus.ToString(),
            NewValue = AssetStatus.InGebruik.ToString(),
            Notes = $"Request line {line.Id}; RequestedFor={request.RequestedFor}",
            PerformedBy = performedBy,
            PerformedByEmail = performedByEmail,
            EventDate = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow
        };
        asset.Events.Add(ev);
    }

    private static void ApplyOffboardingLine(
        AssetRequest request,
        AssetRequestLine line,
        string performedBy,
        string? performedByEmail)
    {
        var asset = line.Asset!;
        var previousStatus = asset.Status;
        var action = line.ReturnAction!.Value;

        asset.Status = action switch
        {
            AssetReturnAction.ReturnToStock => AssetStatus.Stock,
            AssetReturnAction.Decommission => AssetStatus.UitDienst,
            AssetReturnAction.Reassign => AssetStatus.Stock,
            _ => throw new InvalidOperationException($"Unknown ReturnAction {action}")
        };
        asset.EmployeeId = null;
        asset.Owner = null;
        asset.UpdatedAt = DateTime.UtcNow;

        var description = action switch
        {
            AssetReturnAction.ReturnToStock => $"Returned to stock via request #{request.Id}",
            AssetReturnAction.Decommission => $"Decommissioned via request #{request.Id}",
            AssetReturnAction.Reassign => $"Returned for reassignment via request #{request.Id}",
            _ => $"Offboarded via request #{request.Id}"
        };

        var ev = new AssetEvent
        {
            AssetId = asset.Id,
            EventType = AssetEventType.DeviceOffboarded,
            Description = description,
            OldValue = previousStatus.ToString(),
            NewValue = asset.Status.ToString(),
            Notes = string.IsNullOrWhiteSpace(line.Notes)
                ? $"Request line {line.Id}"
                : $"Request line {line.Id}; {line.Notes}",
            PerformedBy = performedBy,
            PerformedByEmail = performedByEmail,
            EventDate = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow
        };
        asset.Events.Add(ev);
    }
}
```

- [ ] **Step 2: Build Infrastructure**

Run: `cd src/backend && dotnet build DjoppieInventory.Infrastructure/DjoppieInventory.Infrastructure.csproj`
Expected: Build succeeded.

- [ ] **Step 3: Commit**

```bash
git add src/backend/DjoppieInventory.Infrastructure/Services/AssetRequestCompletionService.cs
git commit -m "feat(requests): atomic completion service with asset mutations"
```

---

### Task 9: Auto-link pending requests in `OrganizationSyncService`

**Files:**
- Modify: `src/backend/DjoppieInventory.Core/Interfaces/IOrganizationSyncService.cs`
- Modify: `src/backend/DjoppieInventory.Infrastructure/Services/OrganizationSyncService.cs`

- [ ] **Step 1: Add the method to the interface**

In `IOrganizationSyncService.cs`, add a method declaration alongside the existing ones:

```csharp
/// <summary>
/// Attempts to link unresolved AssetRequests (EmployeeId == null) to
/// matching Employee records by UPN/email/displayName.
/// Returns the number of requests linked.
/// </summary>
Task<int> LinkPendingAssetRequestsAsync(CancellationToken cancellationToken = default);
```

- [ ] **Step 2: Implement the method**

In `OrganizationSyncService.cs`, add this method (anywhere inside the class — convention puts it near the bottom):

```csharp
public async Task<int> LinkPendingAssetRequestsAsync(CancellationToken cancellationToken = default)
{
    var pending = await _context.AssetRequests
        .Where(r => r.EmployeeId == null && r.Status != AssetRequestStatus.Cancelled)
        .ToListAsync(cancellationToken);

    if (pending.Count == 0) return 0;

    var employees = await _context.Employees
        .Where(e => e.IsActive)
        .ToListAsync(cancellationToken);

    int linked = 0;

    foreach (var request in pending)
    {
        var key = (request.RequestedFor ?? string.Empty).Trim();
        if (string.IsNullOrEmpty(key)) continue;

        Employee? match = null;

        if (key.Contains('@'))
        {
            var matches = employees.Where(e =>
                string.Equals(e.UserPrincipalName, key, StringComparison.OrdinalIgnoreCase) ||
                string.Equals(e.Email, key, StringComparison.OrdinalIgnoreCase)).ToList();
            if (matches.Count == 1) match = matches[0];
        }
        else
        {
            var matches = employees.Where(e =>
                string.Equals(e.DisplayName?.Trim(), key, StringComparison.OrdinalIgnoreCase)).ToList();
            if (matches.Count == 1) match = matches[0];
        }

        if (match != null)
        {
            request.EmployeeId = match.Id;
            request.ModifiedAt = DateTime.UtcNow;
            request.ModifiedBy = "system:auto-link";
            linked++;
            _logger.LogInformation(
                "Auto-linked AssetRequest {RequestId} to Employee {EmployeeId} ({DisplayName})",
                request.Id, match.Id, match.DisplayName);
        }
    }

    if (linked > 0)
    {
        await _context.SaveChangesAsync(cancellationToken);
    }

    return linked;
}
```

- [ ] **Step 3: Invoke the method at the end of `SyncOrganizationAsync`**

In the `SyncOrganizationAsync` method, locate the line `await LinkServicesToSectorsAsync(result, cancellationToken);` (around line 51). Add directly after it:

```csharp
// Link any AssetRequests that now have a matching Employee
var linkedRequests = await LinkPendingAssetRequestsAsync(cancellationToken);
if (linkedRequests > 0)
{
    _logger.LogInformation("Auto-linked {Count} pending AssetRequests after sync", linkedRequests);
}
```

- [ ] **Step 4: Build and verify**

Run: `cd src/backend && dotnet build`
Expected: Build succeeded.

- [ ] **Step 5: Commit**

```bash
git add src/backend/DjoppieInventory.Core/Interfaces/IOrganizationSyncService.cs src/backend/DjoppieInventory.Infrastructure/Services/OrganizationSyncService.cs
git commit -m "feat(requests): auto-link pending AssetRequests after Entra sync"
```

---

### Task 10: Rewrite `RequestsController`

**Files:**
- Modify: `src/backend/DjoppieInventory.API/Controllers/Operations/RequestsController.cs`

- [ ] **Step 1: Replace the controller body**

Replace the entire file contents:

```csharp
using DjoppieInventory.Core.DTOs;
using DjoppieInventory.Core.Entities;
using DjoppieInventory.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace DjoppieInventory.API.Controllers.Operations;

[Authorize]
[ApiController]
[Route("api/operations/requests")]
public class RequestsController : ControllerBase
{
    private readonly IAssetRequestRepository _repository;
    private readonly IAssetRequestCompletionService _completion;
    private readonly ILogger<RequestsController> _logger;

    public RequestsController(
        IAssetRequestRepository repository,
        IAssetRequestCompletionService completion,
        ILogger<RequestsController> logger)
    {
        _repository = repository;
        _completion = completion;
        _logger = logger;
    }

    private string CurrentUser => User.FindFirst(ClaimTypes.Name)?.Value ?? "Unknown";
    private string? CurrentUserEmail => User.FindFirst(ClaimTypes.Email)?.Value
                                        ?? User.FindFirst("preferred_username")?.Value;

    // ===== Request CRUD =====

    [HttpGet]
    public async Task<ActionResult<IEnumerable<AssetRequestSummaryDto>>> Query(
        [FromQuery] string? type,
        [FromQuery] string[]? status,
        [FromQuery] DateTime? dateFrom,
        [FromQuery] DateTime? dateTo,
        [FromQuery] int? employeeId,
        [FromQuery] string? q)
    {
        var filter = new AssetRequestFilter
        {
            Type = ParseType(type),
            Statuses = status?.Select(ParseStatus).ToList(),
            DateFrom = dateFrom,
            DateTo = dateTo,
            EmployeeId = employeeId,
            SearchQuery = q
        };

        var requests = await _repository.QueryAsync(filter);
        return Ok(requests.Select(MapToSummary));
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<AssetRequestDetailDto>> GetById(int id)
    {
        var request = await _repository.GetByIdAsync(id);
        return request == null ? NotFound() : Ok(MapToDetail(request));
    }

    [HttpPost]
    public async Task<ActionResult<AssetRequestDetailDto>> Create([FromBody] CreateAssetRequestDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.RequestedFor))
            return BadRequest("RequestedFor is required.");

        var request = new AssetRequest
        {
            RequestType = ParseType(dto.RequestType) ?? AssetRequestType.Onboarding,
            RequestedFor = dto.RequestedFor.Trim(),
            EmployeeId = dto.EmployeeId,
            RequestedDate = dto.RequestedDate,
            PhysicalWorkplaceId = dto.PhysicalWorkplaceId,
            Notes = dto.Notes,
            Status = AssetRequestStatus.Pending,
            CreatedBy = CurrentUser,
            CreatedAt = DateTime.UtcNow
        };

        foreach (var lineDto in dto.Lines)
        {
            request.Lines.Add(new AssetRequestLine
            {
                AssetTypeId = lineDto.AssetTypeId,
                SourceType = ParseSourceType(lineDto.SourceType),
                AssetId = lineDto.AssetId,
                AssetTemplateId = lineDto.AssetTemplateId,
                ReturnAction = ParseReturnAction(lineDto.ReturnAction),
                Notes = lineDto.Notes,
                Status = AssetRequestLineStatus.Pending,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            });
        }

        var created = await _repository.CreateAsync(request);
        var refreshed = await _repository.GetByIdAsync(created.Id);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, MapToDetail(refreshed!));
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<AssetRequestDetailDto>> Update(int id, [FromBody] UpdateAssetRequestDto dto)
    {
        var request = await _repository.GetByIdAsync(id);
        if (request == null) return NotFound();

        if (dto.RequestedFor != null) request.RequestedFor = dto.RequestedFor.Trim();
        if (dto.EmployeeId.HasValue) request.EmployeeId = dto.EmployeeId.Value;
        if (dto.RequestedDate.HasValue) request.RequestedDate = dto.RequestedDate.Value;
        if (dto.PhysicalWorkplaceId.HasValue) request.PhysicalWorkplaceId = dto.PhysicalWorkplaceId.Value;
        if (dto.Notes != null) request.Notes = dto.Notes;

        request.ModifiedBy = CurrentUser;
        request.ModifiedAt = DateTime.UtcNow;

        await _repository.UpdateAsync(request);
        var refreshed = await _repository.GetByIdAsync(id);
        return Ok(MapToDetail(refreshed!));
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var request = await _repository.GetByIdAsync(id);
        if (request == null) return NotFound();
        if (request.Status != AssetRequestStatus.Pending)
            return Conflict("Only Pending requests can be deleted.");

        await _repository.DeleteAsync(id);
        return NoContent();
    }

    // ===== Line CRUD =====

    [HttpPost("{id:int}/lines")]
    public async Task<ActionResult<AssetRequestLineDto>> AddLine(int id, [FromBody] CreateAssetRequestLineDto dto)
    {
        var request = await _repository.GetByIdAsync(id);
        if (request == null) return NotFound();
        if (request.Status == AssetRequestStatus.Completed || request.Status == AssetRequestStatus.Cancelled)
            return Conflict("Cannot add lines to a completed or cancelled request.");

        var line = new AssetRequestLine
        {
            AssetRequestId = id,
            AssetTypeId = dto.AssetTypeId,
            SourceType = ParseSourceType(dto.SourceType),
            AssetId = dto.AssetId,
            AssetTemplateId = dto.AssetTemplateId,
            ReturnAction = ParseReturnAction(dto.ReturnAction),
            Notes = dto.Notes,
            Status = AssetRequestLineStatus.Pending,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _repository.AddLineAsync(line);
        var refreshed = await _repository.GetByIdAsync(id);
        var inserted = refreshed!.Lines.First(l => l.Id == line.Id);
        return Ok(MapLine(inserted));
    }

    [HttpPut("{id:int}/lines/{lineId:int}")]
    public async Task<ActionResult<AssetRequestLineDto>> UpdateLine(int id, int lineId, [FromBody] UpdateAssetRequestLineDto dto)
    {
        var request = await _repository.GetByIdAsync(id);
        if (request == null) return NotFound();
        var line = request.Lines.FirstOrDefault(l => l.Id == lineId);
        if (line == null) return NotFound();
        if (request.Status == AssetRequestStatus.Completed || request.Status == AssetRequestStatus.Cancelled)
            return Conflict("Cannot edit lines on a completed or cancelled request.");

        if (dto.AssetTypeId.HasValue) line.AssetTypeId = dto.AssetTypeId.Value;
        if (dto.SourceType != null) line.SourceType = ParseSourceType(dto.SourceType);
        if (dto.AssetId.HasValue) line.AssetId = dto.AssetId.Value;
        if (dto.AssetTemplateId.HasValue) line.AssetTemplateId = dto.AssetTemplateId.Value;
        if (dto.Status != null) line.Status = ParseLineStatus(dto.Status);
        if (dto.ReturnAction != null) line.ReturnAction = ParseReturnAction(dto.ReturnAction);
        if (dto.Notes != null) line.Notes = dto.Notes;

        await _repository.UpdateLineAsync(line);
        var refreshed = await _repository.GetByIdAsync(id);
        var updated = refreshed!.Lines.First(l => l.Id == lineId);
        return Ok(MapLine(updated));
    }

    [HttpDelete("{id:int}/lines/{lineId:int}")]
    public async Task<IActionResult> DeleteLine(int id, int lineId)
    {
        var request = await _repository.GetByIdAsync(id);
        if (request == null) return NotFound();
        if (request.Status == AssetRequestStatus.Completed)
            return Conflict("Cannot remove lines from a completed request.");
        var line = request.Lines.FirstOrDefault(l => l.Id == lineId);
        if (line == null) return NotFound();

        await _repository.DeleteLineAsync(lineId);
        return NoContent();
    }

    // ===== Transition / link =====

    [HttpPost("{id:int}/transition")]
    public async Task<ActionResult<AssetRequestDetailDto>> Transition(int id, [FromBody] AssetRequestTransitionDto dto)
    {
        try
        {
            var target = ParseStatus(dto.Target);
            await _completion.TransitionAsync(id, target, CurrentUser, CurrentUserEmail);
            var refreshed = await _repository.GetByIdAsync(id);
            return Ok(MapToDetail(refreshed!));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpPost("{id:int}/link-employee")]
    public async Task<ActionResult<AssetRequestDetailDto>> LinkEmployee(int id, [FromBody] LinkEmployeeDto dto)
    {
        var request = await _repository.GetByIdAsync(id);
        if (request == null) return NotFound();

        request.EmployeeId = dto.EmployeeId;
        request.ModifiedBy = CurrentUser;
        request.ModifiedAt = DateTime.UtcNow;
        await _repository.UpdateAsync(request);

        var refreshed = await _repository.GetByIdAsync(id);
        return Ok(MapToDetail(refreshed!));
    }

    // ===== Statistics =====

    [HttpGet("statistics")]
    public async Task<ActionResult<AssetRequestStatisticsDto>> GetStatistics()
    {
        var s = await _repository.GetStatisticsAsync();
        return Ok(new AssetRequestStatisticsDto
        {
            ActiveRequests = s.ActiveRequests,
            MonthlyRequests = s.MonthlyRequests,
            InProgressRequests = s.InProgressRequests
        });
    }

    // ===== Mappers / parsers =====

    private static AssetRequestSummaryDto MapToSummary(AssetRequest r) => new()
    {
        Id = r.Id,
        RequestType = r.RequestType.ToString().ToLower(),
        Status = r.Status.ToString(),
        RequestedFor = r.RequestedFor,
        EmployeeId = r.EmployeeId,
        EmployeeDisplayName = r.Employee?.DisplayName,
        RequestedDate = r.RequestedDate,
        PhysicalWorkplaceId = r.PhysicalWorkplaceId,
        PhysicalWorkplaceName = r.PhysicalWorkplace?.Name,
        LineCount = r.Lines.Count,
        CompletedLineCount = r.Lines.Count(l => l.Status == AssetRequestLineStatus.Completed),
        CreatedAt = r.CreatedAt,
        CompletedAt = r.CompletedAt
    };

    private static AssetRequestDetailDto MapToDetail(AssetRequest r)
    {
        var dto = new AssetRequestDetailDto
        {
            Id = r.Id,
            RequestType = r.RequestType.ToString().ToLower(),
            Status = r.Status.ToString(),
            RequestedFor = r.RequestedFor,
            EmployeeId = r.EmployeeId,
            EmployeeDisplayName = r.Employee?.DisplayName,
            RequestedDate = r.RequestedDate,
            PhysicalWorkplaceId = r.PhysicalWorkplaceId,
            PhysicalWorkplaceName = r.PhysicalWorkplace?.Name,
            LineCount = r.Lines.Count,
            CompletedLineCount = r.Lines.Count(l => l.Status == AssetRequestLineStatus.Completed),
            CreatedAt = r.CreatedAt,
            CompletedAt = r.CompletedAt,
            Notes = r.Notes,
            CreatedBy = r.CreatedBy,
            ModifiedBy = r.ModifiedBy,
            ModifiedAt = r.ModifiedAt,
            Lines = r.Lines.OrderBy(l => l.Id).Select(MapLine).ToList()
        };
        return dto;
    }

    private static AssetRequestLineDto MapLine(AssetRequestLine l) => new()
    {
        Id = l.Id,
        AssetTypeId = l.AssetTypeId,
        AssetTypeName = l.AssetType?.Name ?? string.Empty,
        SourceType = l.SourceType.ToString(),
        AssetId = l.AssetId,
        AssetCode = l.Asset?.AssetCode,
        AssetName = l.Asset?.AssetName,
        AssetTemplateId = l.AssetTemplateId,
        AssetTemplateName = l.AssetTemplate?.Name,
        Status = l.Status.ToString(),
        ReturnAction = l.ReturnAction?.ToString(),
        Notes = l.Notes,
        CreatedAt = l.CreatedAt,
        UpdatedAt = l.UpdatedAt
    };

    private static AssetRequestType? ParseType(string? value) => value?.ToLower() switch
    {
        "onboarding" => AssetRequestType.Onboarding,
        "offboarding" => AssetRequestType.Offboarding,
        null or "" => null,
        _ => null
    };

    private static AssetRequestStatus ParseStatus(string value) => value switch
    {
        "Pending" => AssetRequestStatus.Pending,
        "Approved" => AssetRequestStatus.Approved,
        "InProgress" => AssetRequestStatus.InProgress,
        "Completed" => AssetRequestStatus.Completed,
        "Cancelled" => AssetRequestStatus.Cancelled,
        "Rejected" => AssetRequestStatus.Rejected,
        _ => throw new ArgumentException($"Unknown status '{value}'")
    };

    private static AssetLineSourceType ParseSourceType(string value) => value switch
    {
        "ToBeAssigned" => AssetLineSourceType.ToBeAssigned,
        "ExistingInventory" => AssetLineSourceType.ExistingInventory,
        "NewFromTemplate" => AssetLineSourceType.NewFromTemplate,
        _ => AssetLineSourceType.ToBeAssigned
    };

    private static AssetRequestLineStatus ParseLineStatus(string value) => value switch
    {
        "Pending" => AssetRequestLineStatus.Pending,
        "Reserved" => AssetRequestLineStatus.Reserved,
        "Completed" => AssetRequestLineStatus.Completed,
        "Skipped" => AssetRequestLineStatus.Skipped,
        _ => throw new ArgumentException($"Unknown line status '{value}'")
    };

    private static AssetReturnAction? ParseReturnAction(string? value) => value switch
    {
        null or "" => null,
        "ReturnToStock" => AssetReturnAction.ReturnToStock,
        "Decommission" => AssetReturnAction.Decommission,
        "Reassign" => AssetReturnAction.Reassign,
        _ => throw new ArgumentException($"Unknown return action '{value}'")
    };
}
```

- [ ] **Step 2: Build API**

Run: `cd src/backend && dotnet build DjoppieInventory.API/DjoppieInventory.API.csproj`
Expected: Build will fail with "IAssetRequestCompletionService not registered" only at runtime — compile should succeed if the service interface is correctly referenced.

- [ ] **Step 3: Commit**

```bash
git add src/backend/DjoppieInventory.API/Controllers/Operations/RequestsController.cs
git commit -m "feat(requests): rewrite controller with lines, transitions, statistics"
```

---

### Task 11: Register `AssetRequestCompletionService` in DI

**Files:**
- Modify: `src/backend/DjoppieInventory.API/Extensions/ServiceCollectionExtensions.cs`

- [ ] **Step 1: Add registration**

Locate the line `services.AddScoped<IAssetMovementService, AssetMovementService>();` (around line 48). Add directly below:

```csharp
services.AddScoped<IAssetRequestCompletionService, AssetRequestCompletionService>();
```

If the file uses sorted using-directives, add `using DjoppieInventory.Core.Interfaces;` and `using DjoppieInventory.Infrastructure.Services;` at the top if not already present (they typically are).

- [ ] **Step 2: Run the API**

Run: `cd src/backend/DjoppieInventory.API && dotnet build`
Expected: Build succeeded.

Run: `cd src/backend/DjoppieInventory.API && dotnet run` and verify it starts without DI errors. Then `Ctrl+C` to stop.

- [ ] **Step 3: Commit**

```bash
git add src/backend/DjoppieInventory.API/Extensions/ServiceCollectionExtensions.cs
git commit -m "feat(requests): register AssetRequestCompletionService"
```

---

## Phase 3 — Backend tests

### Task 12: Test `AssetRequestCompletionService` — onboarding happy path

**Files:**
- Create: `src/backend/DjoppieInventory.Tests/Services/AssetRequestCompletionServiceTests.cs`

- [ ] **Step 1: Write the test class with the onboarding happy-path test**

```csharp
using DjoppieInventory.Core.Entities;
using DjoppieInventory.Core.Interfaces;
using DjoppieInventory.Infrastructure.Data;
using DjoppieInventory.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;

namespace DjoppieInventory.Tests.Services;

public class AssetRequestCompletionServiceTests
{
    private static ApplicationDbContext NewContext()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        return new ApplicationDbContext(options);
    }

    private static AssetType SeedAssetType(ApplicationDbContext ctx, string code = "LAP")
    {
        var category = new Category { Code = "TST", Name = "Test", IsActive = true, CreatedAt = DateTime.UtcNow };
        ctx.Categories.Add(category);
        ctx.SaveChanges();

        var assetType = new AssetType
        {
            Code = code, Name = "Laptop", CategoryId = category.Id,
            IsActive = true, CreatedAt = DateTime.UtcNow
        };
        ctx.AssetTypes.Add(assetType);
        ctx.SaveChanges();
        return assetType;
    }

    private static Asset SeedAsset(ApplicationDbContext ctx, AssetType type, AssetStatus status)
    {
        var asset = new Asset
        {
            AssetCode = $"LAP-26-TST-{Random.Shared.Next(10000, 99999)}",
            AssetName = "Test Laptop",
            Category = "Computing",
            AssetTypeId = type.Id,
            Status = status,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        ctx.Assets.Add(asset);
        ctx.SaveChanges();
        return asset;
    }

    private static Employee SeedEmployee(ApplicationDbContext ctx)
    {
        var emp = new Employee
        {
            EntraId = Guid.NewGuid().ToString(),
            UserPrincipalName = "jan.janssen@example.com",
            DisplayName = "Jan Janssen",
            Email = "jan.janssen@example.com",
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };
        ctx.Employees.Add(emp);
        ctx.SaveChanges();
        return emp;
    }

    [Fact]
    public async Task Transition_To_Completed_OnboardsAsset()
    {
        await using var ctx = NewContext();
        var type = SeedAssetType(ctx);
        var asset = SeedAsset(ctx, type, AssetStatus.Nieuw);
        var employee = SeedEmployee(ctx);

        var request = new AssetRequest
        {
            RequestType = AssetRequestType.Onboarding,
            Status = AssetRequestStatus.InProgress,
            RequestedFor = employee.UserPrincipalName,
            EmployeeId = employee.Id,
            RequestedDate = DateTime.UtcNow.Date,
            CreatedBy = "tester",
            CreatedAt = DateTime.UtcNow,
            Lines = new List<AssetRequestLine>
            {
                new()
                {
                    AssetTypeId = type.Id,
                    SourceType = AssetLineSourceType.ExistingInventory,
                    AssetId = asset.Id,
                    Status = AssetRequestLineStatus.Reserved,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                }
            }
        };
        ctx.AssetRequests.Add(request);
        await ctx.SaveChangesAsync();

        var service = new AssetRequestCompletionService(ctx, NullLogger<AssetRequestCompletionService>.Instance);

        var result = await service.TransitionAsync(request.Id, AssetRequestStatus.Completed, "tester", "tester@x");

        var reloaded = await ctx.Assets.Include(a => a.Events).FirstAsync(a => a.Id == asset.Id);
        Assert.Equal(AssetStatus.InGebruik, reloaded.Status);
        Assert.Equal(employee.Id, reloaded.EmployeeId);
        Assert.Equal(employee.DisplayName, reloaded.Owner);
        Assert.NotNull(reloaded.InstallationDate);
        Assert.Single(reloaded.Events);
        Assert.Equal(AssetEventType.DeviceOnboarded, reloaded.Events.Single().EventType);

        var reloadedRequest = await ctx.AssetRequests.Include(r => r.Lines).FirstAsync(r => r.Id == request.Id);
        Assert.Equal(AssetRequestStatus.Completed, reloadedRequest.Status);
        Assert.NotNull(reloadedRequest.CompletedAt);
        Assert.All(reloadedRequest.Lines, l => Assert.Equal(AssetRequestLineStatus.Completed, l.Status));
        Assert.Single(result.AffectedAssetIds);
    }
}
```

- [ ] **Step 2: Run the test**

Run: `cd src/backend && dotnet test DjoppieInventory.Tests/DjoppieInventory.Tests.csproj --filter "FullyQualifiedName~AssetRequestCompletionServiceTests.Transition_To_Completed_OnboardsAsset"`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/backend/DjoppieInventory.Tests/Services/AssetRequestCompletionServiceTests.cs
git commit -m "test(requests): onboarding happy-path completion test"
```

---

### Task 13: Test `AssetRequestCompletionService` — offboarding (all return actions)

**Files:**
- Modify: `src/backend/DjoppieInventory.Tests/Services/AssetRequestCompletionServiceTests.cs`

- [ ] **Step 1: Append the offboarding tests**

Add inside the existing test class, after the onboarding test:

```csharp
[Theory]
[InlineData(AssetReturnAction.ReturnToStock, AssetStatus.Stock)]
[InlineData(AssetReturnAction.Decommission, AssetStatus.UitDienst)]
[InlineData(AssetReturnAction.Reassign, AssetStatus.Stock)]
public async Task Transition_To_Completed_OffboardsAsset(AssetReturnAction action, AssetStatus expectedStatus)
{
    await using var ctx = NewContext();
    var type = SeedAssetType(ctx);
    var asset = SeedAsset(ctx, type, AssetStatus.InGebruik);
    asset.Owner = "Jan Janssen";
    asset.EmployeeId = SeedEmployee(ctx).Id;
    await ctx.SaveChangesAsync();

    var request = new AssetRequest
    {
        RequestType = AssetRequestType.Offboarding,
        Status = AssetRequestStatus.InProgress,
        RequestedFor = "Jan Janssen",
        RequestedDate = DateTime.UtcNow.Date,
        CreatedBy = "tester",
        CreatedAt = DateTime.UtcNow,
        Lines = new List<AssetRequestLine>
        {
            new()
            {
                AssetTypeId = type.Id,
                SourceType = AssetLineSourceType.ExistingInventory,
                AssetId = asset.Id,
                ReturnAction = action,
                Status = AssetRequestLineStatus.Reserved,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            }
        }
    };
    ctx.AssetRequests.Add(request);
    await ctx.SaveChangesAsync();

    var service = new AssetRequestCompletionService(ctx, NullLogger<AssetRequestCompletionService>.Instance);
    await service.TransitionAsync(request.Id, AssetRequestStatus.Completed, "tester", null);

    var reloaded = await ctx.Assets.Include(a => a.Events).FirstAsync(a => a.Id == asset.Id);
    Assert.Equal(expectedStatus, reloaded.Status);
    Assert.Null(reloaded.Owner);
    Assert.Null(reloaded.EmployeeId);
    Assert.Single(reloaded.Events);
    Assert.Equal(AssetEventType.DeviceOffboarded, reloaded.Events.Single().EventType);
}

[Fact]
public async Task Transition_To_Completed_Throws_WhenOffboardingHasNoReturnAction()
{
    await using var ctx = NewContext();
    var type = SeedAssetType(ctx);
    var asset = SeedAsset(ctx, type, AssetStatus.InGebruik);

    var request = new AssetRequest
    {
        RequestType = AssetRequestType.Offboarding,
        Status = AssetRequestStatus.InProgress,
        RequestedFor = "Jan",
        RequestedDate = DateTime.UtcNow.Date,
        CreatedBy = "tester",
        CreatedAt = DateTime.UtcNow,
        Lines = new List<AssetRequestLine>
        {
            new()
            {
                AssetTypeId = type.Id,
                SourceType = AssetLineSourceType.ExistingInventory,
                AssetId = asset.Id,
                ReturnAction = null,
                Status = AssetRequestLineStatus.Pending,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            }
        }
    };
    ctx.AssetRequests.Add(request);
    await ctx.SaveChangesAsync();

    var service = new AssetRequestCompletionService(ctx, NullLogger<AssetRequestCompletionService>.Instance);
    await Assert.ThrowsAsync<InvalidOperationException>(() =>
        service.TransitionAsync(request.Id, AssetRequestStatus.Completed, "tester", null));

    var reloadedAsset = await ctx.Assets.FirstAsync(a => a.Id == asset.Id);
    Assert.Equal(AssetStatus.InGebruik, reloadedAsset.Status);
}

[Fact]
public async Task Transition_Skipped_Lines_AreNotMutated()
{
    await using var ctx = NewContext();
    var type = SeedAssetType(ctx);
    var asset = SeedAsset(ctx, type, AssetStatus.Nieuw);
    var employee = SeedEmployee(ctx);

    var request = new AssetRequest
    {
        RequestType = AssetRequestType.Onboarding,
        Status = AssetRequestStatus.InProgress,
        RequestedFor = employee.UserPrincipalName,
        EmployeeId = employee.Id,
        RequestedDate = DateTime.UtcNow.Date,
        CreatedBy = "tester",
        CreatedAt = DateTime.UtcNow,
        Lines = new List<AssetRequestLine>
        {
            new()
            {
                AssetTypeId = type.Id,
                SourceType = AssetLineSourceType.ExistingInventory,
                AssetId = asset.Id,
                Status = AssetRequestLineStatus.Skipped,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            }
        }
    };
    ctx.AssetRequests.Add(request);
    await ctx.SaveChangesAsync();

    var service = new AssetRequestCompletionService(ctx, NullLogger<AssetRequestCompletionService>.Instance);
    await service.TransitionAsync(request.Id, AssetRequestStatus.Completed, "tester", null);

    var reloaded = await ctx.Assets.FirstAsync(a => a.Id == asset.Id);
    Assert.Equal(AssetStatus.Nieuw, reloaded.Status);
}
```

- [ ] **Step 2: Run all tests in the file**

Run: `cd src/backend && dotnet test DjoppieInventory.Tests/DjoppieInventory.Tests.csproj --filter "FullyQualifiedName~AssetRequestCompletionServiceTests"`
Expected: All tests PASS.

- [ ] **Step 3: Commit**

```bash
git add src/backend/DjoppieInventory.Tests/Services/AssetRequestCompletionServiceTests.cs
git commit -m "test(requests): offboarding return-action and skip behavior"
```

---

### Task 14: Test `OrganizationSyncService.LinkPendingAssetRequestsAsync`

**Files:**
- Create: `src/backend/DjoppieInventory.Tests/Services/OrganizationSyncServiceLinkTests.cs`

- [ ] **Step 1: Write the link tests**

```csharp
using DjoppieInventory.Core.Entities;
using DjoppieInventory.Core.Interfaces;
using DjoppieInventory.Infrastructure.Data;
using DjoppieInventory.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using Xunit;

namespace DjoppieInventory.Tests.Services;

public class OrganizationSyncServiceLinkTests
{
    private static ApplicationDbContext NewContext()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        return new ApplicationDbContext(options);
    }

    private static Employee Emp(string upn, string displayName, string? email = null) => new()
    {
        EntraId = Guid.NewGuid().ToString(),
        UserPrincipalName = upn,
        DisplayName = displayName,
        Email = email ?? upn,
        IsActive = true,
        CreatedAt = DateTime.UtcNow
    };

    private static AssetRequest Req(string requestedFor) => new()
    {
        RequestType = AssetRequestType.Onboarding,
        Status = AssetRequestStatus.Pending,
        RequestedFor = requestedFor,
        RequestedDate = DateTime.UtcNow,
        CreatedBy = "tester",
        CreatedAt = DateTime.UtcNow
    };

    private static OrganizationSyncService NewService(ApplicationDbContext ctx)
    {
        var graph = new Mock<IGraphUserService>(MockBehavior.Strict);
        return new OrganizationSyncService(ctx, graph.Object, NullLogger<OrganizationSyncService>.Instance);
    }

    [Fact]
    public async Task LinkPending_MatchesByUpn()
    {
        await using var ctx = NewContext();
        ctx.Employees.Add(Emp("jan.janssen@example.com", "Jan Janssen"));
        ctx.AssetRequests.Add(Req("jan.janssen@example.com"));
        await ctx.SaveChangesAsync();

        var service = NewService(ctx);
        var linked = await service.LinkPendingAssetRequestsAsync();

        Assert.Equal(1, linked);
        var req = await ctx.AssetRequests.SingleAsync();
        Assert.NotNull(req.EmployeeId);
    }

    [Fact]
    public async Task LinkPending_MatchesByDisplayName_CaseInsensitive()
    {
        await using var ctx = NewContext();
        ctx.Employees.Add(Emp("a@x.com", "Marie Dubois"));
        ctx.AssetRequests.Add(Req("marie dubois"));
        await ctx.SaveChangesAsync();

        var service = NewService(ctx);
        var linked = await service.LinkPendingAssetRequestsAsync();

        Assert.Equal(1, linked);
    }

    [Fact]
    public async Task LinkPending_DoesNotLink_WhenAmbiguous()
    {
        await using var ctx = NewContext();
        ctx.Employees.AddRange(
            Emp("jan@x.com", "Jan Janssen"),
            Emp("jan2@x.com", "Jan Janssen"));
        ctx.AssetRequests.Add(Req("Jan Janssen"));
        await ctx.SaveChangesAsync();

        var service = NewService(ctx);
        var linked = await service.LinkPendingAssetRequestsAsync();

        Assert.Equal(0, linked);
        var req = await ctx.AssetRequests.SingleAsync();
        Assert.Null(req.EmployeeId);
    }

    [Fact]
    public async Task LinkPending_SkipsCancelledRequests()
    {
        await using var ctx = NewContext();
        ctx.Employees.Add(Emp("a@x.com", "A B"));
        var req = Req("A B");
        req.Status = AssetRequestStatus.Cancelled;
        ctx.AssetRequests.Add(req);
        await ctx.SaveChangesAsync();

        var service = NewService(ctx);
        var linked = await service.LinkPendingAssetRequestsAsync();

        Assert.Equal(0, linked);
    }
}
```

- [ ] **Step 2: Run the tests**

Run: `cd src/backend && dotnet test DjoppieInventory.Tests/DjoppieInventory.Tests.csproj --filter "FullyQualifiedName~OrganizationSyncServiceLinkTests"`
Expected: All four PASS.

- [ ] **Step 3: Commit**

```bash
git add src/backend/DjoppieInventory.Tests/Services/OrganizationSyncServiceLinkTests.cs
git commit -m "test(requests): auto-link match strategies and ambiguity handling"
```

---

### Task 15: Backend smoke test — full build + run all tests

- [ ] **Step 1: Build everything**

Run: `cd src/backend && dotnet build`
Expected: Build succeeded with 0 errors.

- [ ] **Step 2: Run all tests**

Run: `cd src/backend && dotnet test`
Expected: All tests PASS (existing + the new ones from Tasks 12–14).

- [ ] **Step 3: Run the API and hit Swagger**

Run: `cd src/backend/DjoppieInventory.API && dotnet run`
Open `http://localhost:5052/swagger` and verify:
- `POST /api/operations/requests` accepts a body with `lines`.
- `POST /api/operations/requests/{id}/transition` is listed.
- `GET /api/operations/requests/statistics` is listed.

`Ctrl+C` to stop.

- [ ] **Step 4: No commit needed** — this is a verification step.

---

## Phase 4 — Frontend types, API client, hooks

### Task 16: Replace `assetRequest.types.ts`

**Files:**
- Modify: `src/frontend/src/types/assetRequest.types.ts`

- [ ] **Step 1: Replace the entire file**

```typescript
/**
 * Asset Request Types — on/offboarding lifecycle.
 * Matches backend DTOs in DjoppieInventory.Core/DTOs/AssetRequestDto.cs.
 */

export type AssetRequestType = 'onboarding' | 'offboarding';

export type AssetRequestStatus =
  | 'Pending'
  | 'Approved'
  | 'InProgress'
  | 'Completed'
  | 'Cancelled'
  | 'Rejected';

export type AssetRequestLineSourceType =
  | 'ToBeAssigned'
  | 'ExistingInventory'
  | 'NewFromTemplate';

export type AssetRequestLineStatus =
  | 'Pending'
  | 'Reserved'
  | 'Completed'
  | 'Skipped';

export type AssetReturnAction =
  | 'ReturnToStock'
  | 'Decommission'
  | 'Reassign';

export interface AssetRequestSummaryDto {
  id: number;
  requestType: AssetRequestType;
  status: AssetRequestStatus;
  requestedFor: string;
  employeeId?: number;
  employeeDisplayName?: string;
  requestedDate: string;
  physicalWorkplaceId?: number;
  physicalWorkplaceName?: string;
  lineCount: number;
  completedLineCount: number;
  createdAt: string;
  completedAt?: string;
}

export interface AssetRequestLineDto {
  id: number;
  assetTypeId: number;
  assetTypeName: string;
  sourceType: AssetRequestLineSourceType;
  assetId?: number;
  assetCode?: string;
  assetName?: string;
  assetTemplateId?: number;
  assetTemplateName?: string;
  status: AssetRequestLineStatus;
  returnAction?: AssetReturnAction;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AssetRequestDetailDto extends AssetRequestSummaryDto {
  notes?: string;
  createdBy: string;
  modifiedBy?: string;
  modifiedAt?: string;
  lines: AssetRequestLineDto[];
}

export interface AssetRequestStatisticsDto {
  activeRequests: number;
  monthlyRequests: number;
  inProgressRequests: number;
}

export interface CreateAssetRequestLineDto {
  assetTypeId: number;
  sourceType: AssetRequestLineSourceType;
  assetId?: number;
  assetTemplateId?: number;
  returnAction?: AssetReturnAction;
  notes?: string;
}

export interface CreateAssetRequestDto {
  requestType: AssetRequestType;
  requestedFor: string;
  employeeId?: number;
  requestedDate: string;
  physicalWorkplaceId?: number;
  notes?: string;
  lines: CreateAssetRequestLineDto[];
}

export interface UpdateAssetRequestDto {
  requestedFor?: string;
  employeeId?: number;
  requestedDate?: string;
  physicalWorkplaceId?: number;
  notes?: string;
}

export interface UpdateAssetRequestLineDto {
  assetTypeId?: number;
  sourceType?: AssetRequestLineSourceType;
  assetId?: number;
  assetTemplateId?: number;
  status?: AssetRequestLineStatus;
  returnAction?: AssetReturnAction;
  notes?: string;
}

export interface AssetRequestFilters {
  type?: AssetRequestType;
  status?: AssetRequestStatus[];
  dateFrom?: string;
  dateTo?: string;
  employeeId?: number;
  q?: string;
}

export interface AssetRequestTransitionDto {
  target: 'Approved' | 'InProgress' | 'Completed' | 'Cancelled';
}
```

- [ ] **Step 2: Build the frontend**

Run: `cd src/frontend && npm run lint`
Expected: ESLint passes (the existing API client / hooks file referencing old types will fail to typecheck — that's OK, fixed in Task 17–18).

- [ ] **Step 3: Commit**

```bash
git add src/frontend/src/types/assetRequest.types.ts
git commit -m "feat(requests): rewrite frontend types for lifecycle workflow"
```

---

### Task 17: Replace `assetRequests.api.ts`

**Files:**
- Modify: `src/frontend/src/api/assetRequests.api.ts`

- [ ] **Step 1: Replace the entire file**

```typescript
import { apiClient } from './client';
import type {
  AssetRequestDetailDto,
  AssetRequestFilters,
  AssetRequestLineDto,
  AssetRequestStatisticsDto,
  AssetRequestSummaryDto,
  AssetRequestTransitionDto,
  CreateAssetRequestDto,
  CreateAssetRequestLineDto,
  UpdateAssetRequestDto,
  UpdateAssetRequestLineDto,
} from '../types/assetRequest.types';

const BASE = '/operations/requests';

function toQueryParams(filters: AssetRequestFilters): Record<string, string | string[]> {
  const params: Record<string, string | string[]> = {};
  if (filters.type) params.type = filters.type;
  if (filters.status && filters.status.length > 0) params.status = filters.status;
  if (filters.dateFrom) params.dateFrom = filters.dateFrom;
  if (filters.dateTo) params.dateTo = filters.dateTo;
  if (filters.employeeId !== undefined) params.employeeId = String(filters.employeeId);
  if (filters.q) params.q = filters.q;
  return params;
}

export const queryAssetRequests = async (
  filters: AssetRequestFilters = {}
): Promise<AssetRequestSummaryDto[]> => {
  const { data } = await apiClient.get<AssetRequestSummaryDto[]>(BASE, {
    params: toQueryParams(filters),
  });
  return data;
};

export const getAssetRequestById = async (id: number): Promise<AssetRequestDetailDto> => {
  const { data } = await apiClient.get<AssetRequestDetailDto>(`${BASE}/${id}`);
  return data;
};

export const createAssetRequest = async (
  request: CreateAssetRequestDto
): Promise<AssetRequestDetailDto> => {
  const { data } = await apiClient.post<AssetRequestDetailDto>(BASE, request);
  return data;
};

export const updateAssetRequest = async (
  id: number,
  request: UpdateAssetRequestDto
): Promise<AssetRequestDetailDto> => {
  const { data } = await apiClient.put<AssetRequestDetailDto>(`${BASE}/${id}`, request);
  return data;
};

export const deleteAssetRequest = async (id: number): Promise<void> => {
  await apiClient.delete(`${BASE}/${id}`);
};

export const addAssetRequestLine = async (
  requestId: number,
  line: CreateAssetRequestLineDto
): Promise<AssetRequestLineDto> => {
  const { data } = await apiClient.post<AssetRequestLineDto>(`${BASE}/${requestId}/lines`, line);
  return data;
};

export const updateAssetRequestLine = async (
  requestId: number,
  lineId: number,
  line: UpdateAssetRequestLineDto
): Promise<AssetRequestLineDto> => {
  const { data } = await apiClient.put<AssetRequestLineDto>(
    `${BASE}/${requestId}/lines/${lineId}`,
    line
  );
  return data;
};

export const deleteAssetRequestLine = async (
  requestId: number,
  lineId: number
): Promise<void> => {
  await apiClient.delete(`${BASE}/${requestId}/lines/${lineId}`);
};

export const transitionAssetRequest = async (
  id: number,
  transition: AssetRequestTransitionDto
): Promise<AssetRequestDetailDto> => {
  const { data } = await apiClient.post<AssetRequestDetailDto>(
    `${BASE}/${id}/transition`,
    transition
  );
  return data;
};

export const linkAssetRequestEmployee = async (
  id: number,
  employeeId: number
): Promise<AssetRequestDetailDto> => {
  const { data } = await apiClient.post<AssetRequestDetailDto>(
    `${BASE}/${id}/link-employee`,
    { employeeId }
  );
  return data;
};

export const getAssetRequestStatistics =
  async (): Promise<AssetRequestStatisticsDto> => {
    const { data } = await apiClient.get<AssetRequestStatisticsDto>(`${BASE}/statistics`);
    return data;
  };
```

- [ ] **Step 2: Verify it compiles**

Run: `cd src/frontend && npx tsc --noEmit`
Expected: No errors in this file (errors in `useAssetRequests.ts` expected — fixed next).

- [ ] **Step 3: Commit**

```bash
git add src/frontend/src/api/assetRequests.api.ts
git commit -m "feat(requests): API client for lifecycle endpoints"
```

---

### Task 18: Replace `useAssetRequests.ts` with new hooks

**Files:**
- Modify: `src/frontend/src/hooks/useAssetRequests.ts`

- [ ] **Step 1: Replace the entire file**

```typescript
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  addAssetRequestLine,
  createAssetRequest,
  deleteAssetRequest,
  deleteAssetRequestLine,
  getAssetRequestById,
  getAssetRequestStatistics,
  linkAssetRequestEmployee,
  queryAssetRequests,
  transitionAssetRequest,
  updateAssetRequest,
  updateAssetRequestLine,
} from '../api/assetRequests.api';
import type {
  AssetRequestFilters,
  AssetRequestTransitionDto,
  CreateAssetRequestDto,
  CreateAssetRequestLineDto,
  UpdateAssetRequestDto,
  UpdateAssetRequestLineDto,
} from '../types/assetRequest.types';

export const assetRequestKeys = {
  all: ['assetRequests'] as const,
  lists: () => [...assetRequestKeys.all, 'list'] as const,
  list: (filters: AssetRequestFilters) => [...assetRequestKeys.lists(), filters] as const,
  detail: (id: number) => [...assetRequestKeys.all, 'detail', id] as const,
  statistics: () => [...assetRequestKeys.all, 'statistics'] as const,
};

export const useAssetRequests = (filters: AssetRequestFilters = {}) =>
  useQuery({
    queryKey: assetRequestKeys.list(filters),
    queryFn: () => queryAssetRequests(filters),
  });

export const useAssetRequest = (id: number | undefined) =>
  useQuery({
    queryKey: assetRequestKeys.detail(id ?? -1),
    queryFn: () => getAssetRequestById(id!),
    enabled: !!id,
  });

export const useAssetRequestStatistics = () =>
  useQuery({
    queryKey: assetRequestKeys.statistics(),
    queryFn: getAssetRequestStatistics,
    staleTime: 60 * 1000,
  });

const invalidateAll = (qc: ReturnType<typeof useQueryClient>) =>
  qc.invalidateQueries({ queryKey: assetRequestKeys.all });

export const useCreateAssetRequest = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateAssetRequestDto) => createAssetRequest(dto),
    onSuccess: () => invalidateAll(qc),
  });
};

export const useUpdateAssetRequest = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: UpdateAssetRequestDto }) =>
      updateAssetRequest(id, dto),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: assetRequestKeys.detail(vars.id) });
      qc.invalidateQueries({ queryKey: assetRequestKeys.lists() });
    },
  });
};

export const useDeleteAssetRequest = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteAssetRequest(id),
    onSuccess: () => invalidateAll(qc),
  });
};

export const useAddAssetRequestLine = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ requestId, dto }: { requestId: number; dto: CreateAssetRequestLineDto }) =>
      addAssetRequestLine(requestId, dto),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: assetRequestKeys.detail(vars.requestId) });
      qc.invalidateQueries({ queryKey: assetRequestKeys.lists() });
    },
  });
};

export const useUpdateAssetRequestLine = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      requestId,
      lineId,
      dto,
    }: {
      requestId: number;
      lineId: number;
      dto: UpdateAssetRequestLineDto;
    }) => updateAssetRequestLine(requestId, lineId, dto),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: assetRequestKeys.detail(vars.requestId) });
    },
  });
};

export const useDeleteAssetRequestLine = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ requestId, lineId }: { requestId: number; lineId: number }) =>
      deleteAssetRequestLine(requestId, lineId),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: assetRequestKeys.detail(vars.requestId) });
    },
  });
};

export const useTransitionAssetRequest = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: AssetRequestTransitionDto }) =>
      transitionAssetRequest(id, dto),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: assetRequestKeys.detail(vars.id) });
      qc.invalidateQueries({ queryKey: assetRequestKeys.lists() });
      qc.invalidateQueries({ queryKey: assetRequestKeys.statistics() });
    },
  });
};

export const useLinkAssetRequestEmployee = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, employeeId }: { id: number; employeeId: number }) =>
      linkAssetRequestEmployee(id, employeeId),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: assetRequestKeys.detail(vars.id) });
    },
  });
};
```

- [ ] **Step 2: Typecheck**

Run: `cd src/frontend && npx tsc --noEmit`
Expected: No errors in this file.

- [ ] **Step 3: Commit**

```bash
git add src/frontend/src/hooks/useAssetRequests.ts
git commit -m "feat(requests): React Query hooks for lifecycle workflow"
```

---

## Phase 5 — Frontend pages and components

### Task 19: Add request detail/new routes

**Files:**
- Modify: `src/frontend/src/constants/routes.ts`

- [ ] **Step 1: Add new route entries**

In the `ROUTES` object (right after `REQUESTS_REPORTS`), add:

```typescript
  /** Onboarding new request */
  REQUEST_ONBOARDING_NEW: '/operations/requests/onboarding/new',

  /** Onboarding detail page (requires :id parameter) */
  REQUEST_ONBOARDING_DETAIL: '/operations/requests/onboarding/:id',

  /** Offboarding new request */
  REQUEST_OFFBOARDING_NEW: '/operations/requests/offboarding/new',

  /** Offboarding detail page (requires :id parameter) */
  REQUEST_OFFBOARDING_DETAIL: '/operations/requests/offboarding/:id',
```

In `buildRoute`, add helpers:

```typescript
  /**
   * Builds the onboarding request detail route.
   */
  onboardingRequestDetail: (id: number | string) => `/operations/requests/onboarding/${id}`,

  /**
   * Builds the offboarding request detail route.
   */
  offboardingRequestDetail: (id: number | string) => `/operations/requests/offboarding/${id}`,
```

- [ ] **Step 2: Build**

Run: `cd src/frontend && npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/frontend/src/constants/routes.ts
git commit -m "feat(requests): add detail/new sub-routes"
```

---

### Task 20: Create i18n entries

**Files:**
- Modify: `src/frontend/src/i18n/nl.json`
- Modify: `src/frontend/src/i18n/en.json`

- [ ] **Step 1: Add Dutch keys**

Open `src/frontend/src/i18n/nl.json`. Add a top-level `"requests"` object (place it alphabetically; if `requests` already exists, merge):

```json
"requests": {
  "onboarding": {
    "title": "Onboarding aanvragen",
    "subtitle": "Nieuwe medewerkers en hun assets",
    "newButton": "Nieuwe onboarding",
    "createTitle": "Nieuwe onboarding aanvraag"
  },
  "offboarding": {
    "title": "Offboarding aanvragen",
    "subtitle": "Vertrekkende medewerkers en assets retourneren",
    "newButton": "Nieuwe offboarding",
    "createTitle": "Nieuwe offboarding aanvraag"
  },
  "form": {
    "requestedFor": "Medewerker (naam of e-mail)",
    "requestedForHelper": "Mag ingevuld worden voordat de Entra account bestaat",
    "linkedEmployee": "Gekoppeld aan medewerker",
    "notLinked": "Nog niet gekoppeld",
    "requestedDate": "Geplande datum",
    "physicalWorkplace": "Werkplek (optioneel)",
    "notes": "Opmerkingen"
  },
  "lines": {
    "title": "Asset toewijzingen",
    "addLine": "Regel toevoegen",
    "assetType": "Asset type",
    "source": "Bron",
    "asset": "Asset",
    "template": "Template",
    "returnAction": "Retour-actie",
    "status": "Status",
    "notes": "Opmerkingen",
    "noLines": "Nog geen asset-regels toegevoegd"
  },
  "sourceType": {
    "ToBeAssigned": "Nog te bepalen",
    "ExistingInventory": "Bestaande asset",
    "NewFromTemplate": "Nieuw via template"
  },
  "lineStatus": {
    "Pending": "Open",
    "Reserved": "Gereserveerd",
    "Completed": "Voltooid",
    "Skipped": "Overgeslagen"
  },
  "returnAction": {
    "ReturnToStock": "Terug naar stock",
    "Decommission": "Uit dienst",
    "Reassign": "Hertoewijzen"
  },
  "status": {
    "Pending": "Open",
    "Approved": "Goedgekeurd",
    "InProgress": "In behandeling",
    "Completed": "Voltooid",
    "Cancelled": "Geannuleerd",
    "Rejected": "Afgewezen"
  },
  "actions": {
    "approve": "Goedkeuren",
    "start": "Starten",
    "complete": "Afronden",
    "cancel": "Annuleren",
    "delete": "Verwijderen"
  },
  "confirm": {
    "completeOnboarding": "Bij afronding worden alle gekoppelde assets op 'In gebruik' gezet en aan de medewerker toegewezen. Doorgaan?",
    "completeOffboarding": "Bij afronding worden alle gekoppelde assets afgemeld volgens hun retour-actie. Doorgaan?",
    "cancel": "Aanvraag annuleren? Reeds afgeronde wijzigingen blijven bestaan.",
    "delete": "Aanvraag definitief verwijderen?"
  }
}
```

- [ ] **Step 2: Add English keys**

Open `src/frontend/src/i18n/en.json` and add the same structure under `"requests"`:

```json
"requests": {
  "onboarding": {
    "title": "Onboarding requests",
    "subtitle": "New employees and their assets",
    "newButton": "New onboarding",
    "createTitle": "New onboarding request"
  },
  "offboarding": {
    "title": "Offboarding requests",
    "subtitle": "Departing employees and asset returns",
    "newButton": "New offboarding",
    "createTitle": "New offboarding request"
  },
  "form": {
    "requestedFor": "Employee (name or email)",
    "requestedForHelper": "Can be filled in before the Entra account exists",
    "linkedEmployee": "Linked employee",
    "notLinked": "Not yet linked",
    "requestedDate": "Planned date",
    "physicalWorkplace": "Workplace (optional)",
    "notes": "Notes"
  },
  "lines": {
    "title": "Asset assignments",
    "addLine": "Add line",
    "assetType": "Asset type",
    "source": "Source",
    "asset": "Asset",
    "template": "Template",
    "returnAction": "Return action",
    "status": "Status",
    "notes": "Notes",
    "noLines": "No asset lines added yet"
  },
  "sourceType": {
    "ToBeAssigned": "To be determined",
    "ExistingInventory": "Existing asset",
    "NewFromTemplate": "New from template"
  },
  "lineStatus": {
    "Pending": "Open",
    "Reserved": "Reserved",
    "Completed": "Completed",
    "Skipped": "Skipped"
  },
  "returnAction": {
    "ReturnToStock": "Return to stock",
    "Decommission": "Decommission",
    "Reassign": "Reassign"
  },
  "status": {
    "Pending": "Open",
    "Approved": "Approved",
    "InProgress": "In progress",
    "Completed": "Completed",
    "Cancelled": "Cancelled",
    "Rejected": "Rejected"
  },
  "actions": {
    "approve": "Approve",
    "start": "Start",
    "complete": "Complete",
    "cancel": "Cancel",
    "delete": "Delete"
  },
  "confirm": {
    "completeOnboarding": "On completion, all linked assets will be marked as In Use and assigned to the employee. Continue?",
    "completeOffboarding": "On completion, all linked assets will be processed according to their return action. Continue?",
    "cancel": "Cancel the request? Already-completed changes remain.",
    "delete": "Delete the request permanently?"
  }
}
```

- [ ] **Step 3: Verify JSON parses**

Run: `cd src/frontend && node -e "JSON.parse(require('fs').readFileSync('src/i18n/nl.json','utf8')); JSON.parse(require('fs').readFileSync('src/i18n/en.json','utf8')); console.log('ok')"`
Expected: prints `ok`.

- [ ] **Step 4: Commit**

```bash
git add src/frontend/src/i18n/nl.json src/frontend/src/i18n/en.json
git commit -m "feat(requests): i18n keys for lifecycle workflow"
```

---

### Task 21: Status badge components

**Files:**
- Create: `src/frontend/src/components/operations/requests/RequestStatusBadge.tsx`
- Create: `src/frontend/src/components/operations/requests/LineStatusBadge.tsx`

- [ ] **Step 1: Create `RequestStatusBadge.tsx`**

```tsx
import { Chip } from '@mui/material';
import { useTranslation } from 'react-i18next';
import type { AssetRequestStatus } from '../../../types/assetRequest.types';

const COLOR: Record<AssetRequestStatus, 'default' | 'primary' | 'success' | 'warning' | 'info' | 'error'> = {
  Pending: 'default',
  Approved: 'info',
  InProgress: 'warning',
  Completed: 'success',
  Cancelled: 'default',
  Rejected: 'error',
};

interface Props {
  status: AssetRequestStatus;
  size?: 'small' | 'medium';
}

export function RequestStatusBadge({ status, size = 'small' }: Props) {
  const { t } = useTranslation();
  return (
    <Chip
      size={size}
      color={COLOR[status]}
      label={t(`requests.status.${status}`)}
      variant={status === 'Pending' || status === 'Cancelled' ? 'outlined' : 'filled'}
    />
  );
}
```

- [ ] **Step 2: Create `LineStatusBadge.tsx`**

```tsx
import { Chip } from '@mui/material';
import { useTranslation } from 'react-i18next';
import type { AssetRequestLineStatus } from '../../../types/assetRequest.types';

const COLOR: Record<AssetRequestLineStatus, 'default' | 'success' | 'warning'> = {
  Pending: 'default',
  Reserved: 'warning',
  Completed: 'success',
  Skipped: 'default',
};

interface Props {
  status: AssetRequestLineStatus;
}

export function LineStatusBadge({ status }: Props) {
  const { t } = useTranslation();
  return (
    <Chip
      size="small"
      color={COLOR[status]}
      label={t(`requests.lineStatus.${status}`)}
      variant={status === 'Skipped' ? 'outlined' : 'filled'}
    />
  );
}
```

- [ ] **Step 3: Typecheck**

Run: `cd src/frontend && npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add src/frontend/src/components/operations/requests/RequestStatusBadge.tsx src/frontend/src/components/operations/requests/LineStatusBadge.tsx
git commit -m "feat(requests): status badge components"
```

---

### Task 22: Employee picker with free-text fallback

**Files:**
- Create: `src/frontend/src/components/operations/requests/EmployeePickerWithFallback.tsx`
- Create: `src/frontend/src/components/operations/requests/EmployeeLinkChip.tsx`

- [ ] **Step 1: Create `EmployeePickerWithFallback.tsx`**

This component combines an employee Autocomplete with a free-text fallback. It uses the existing employee search via `organization.api.ts`. Look up the existing API in that file and adapt accordingly. If a `searchEmployees` function does not yet exist, add a thin call:

First, inspect `src/frontend/src/api/organization.api.ts` to find an employees-search method. If one exists (e.g., `getEmployees`), use it. Otherwise, add this minimal helper to that file:

```typescript
export const searchEmployees = async (query: string): Promise<{ id: number; displayName: string; userPrincipalName: string }[]> => {
  const { data } = await apiClient.get<{ id: number; displayName: string; userPrincipalName: string }[]>(
    '/admin/employees',
    { params: { q: query } }
  );
  return data;
};
```

(If `/admin/employees?q=` is not yet supported by the backend, fetch all employees with `getEmployees()` and filter client-side. Use whichever pattern already exists in the codebase — do not invent a new API.)

Then create the component:

```tsx
import { useState } from 'react';
import { Autocomplete, TextField, Stack, Switch, FormControlLabel, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

interface EmployeeOption {
  id: number;
  displayName: string;
  userPrincipalName: string;
}

interface Props {
  value: { requestedFor: string; employeeId?: number };
  onChange: (next: { requestedFor: string; employeeId?: number }) => void;
  fetchEmployees: (query: string) => Promise<EmployeeOption[]>;
  required?: boolean;
}

export function EmployeePickerWithFallback({ value, onChange, fetchEmployees, required }: Props) {
  const { t } = useTranslation();
  const [useFreeText, setUseFreeText] = useState<boolean>(value.employeeId === undefined);
  const [query, setQuery] = useState<string>('');

  const { data: options = [] } = useQuery({
    queryKey: ['employee-search', query],
    queryFn: () => fetchEmployees(query),
    enabled: !useFreeText && query.length >= 2,
  });

  return (
    <Stack spacing={1}>
      <FormControlLabel
        control={
          <Switch
            checked={useFreeText}
            onChange={(e) => setUseFreeText(e.target.checked)}
          />
        }
        label={t('requests.form.requestedForHelper')}
      />
      {useFreeText ? (
        <TextField
          required={required}
          label={t('requests.form.requestedFor')}
          value={value.requestedFor}
          onChange={(e) => onChange({ requestedFor: e.target.value, employeeId: undefined })}
        />
      ) : (
        <Autocomplete<EmployeeOption>
          options={options}
          getOptionLabel={(o) => `${o.displayName} (${o.userPrincipalName})`}
          onInputChange={(_, v) => setQuery(v)}
          value={options.find((o) => o.id === value.employeeId) ?? null}
          onChange={(_, selected) =>
            onChange(
              selected
                ? { requestedFor: selected.userPrincipalName, employeeId: selected.id }
                : { requestedFor: '', employeeId: undefined }
            )
          }
          renderInput={(params) => (
            <TextField {...params} required={required} label={t('requests.form.requestedFor')} />
          )}
        />
      )}
      {!useFreeText && value.employeeId && (
        <Typography variant="caption" color="success.main">
          {t('requests.form.linkedEmployee')}
        </Typography>
      )}
    </Stack>
  );
}
```

- [ ] **Step 2: Create `EmployeeLinkChip.tsx`**

```tsx
import { Chip, Tooltip } from '@mui/material';
import LinkIcon from '@mui/icons-material/Link';
import LinkOffIcon from '@mui/icons-material/LinkOff';
import { useTranslation } from 'react-i18next';

interface Props {
  employeeDisplayName?: string;
  onRelink?: () => void;
}

export function EmployeeLinkChip({ employeeDisplayName, onRelink }: Props) {
  const { t } = useTranslation();
  if (employeeDisplayName) {
    return (
      <Tooltip title={t('requests.form.linkedEmployee')}>
        <Chip icon={<LinkIcon />} label={employeeDisplayName} color="success" size="small" />
      </Tooltip>
    );
  }
  return (
    <Tooltip title={t('requests.form.notLinked')}>
      <Chip
        icon={<LinkOffIcon />}
        label={t('requests.form.notLinked')}
        size="small"
        variant="outlined"
        color="warning"
        onClick={onRelink}
      />
    </Tooltip>
  );
}
```

- [ ] **Step 3: Typecheck**

Run: `cd src/frontend && npx tsc --noEmit`
Expected: No errors. (If `searchEmployees` was added to `organization.api.ts`, the file compiles.)

- [ ] **Step 4: Commit**

```bash
git add src/frontend/src/components/operations/requests/EmployeePickerWithFallback.tsx src/frontend/src/components/operations/requests/EmployeeLinkChip.tsx src/frontend/src/api/organization.api.ts
git commit -m "feat(requests): employee picker with free-text fallback + link chip"
```

---

### Task 23: Asset line row component

**Files:**
- Create: `src/frontend/src/components/operations/requests/AssetLineRow.tsx`

- [ ] **Step 1: Create the component**

This row uses existing hooks: `useAssetTypes` (from `useAssets.ts` or admin hooks — locate the actual export name), `useAssets` for asset lookup, `useAssetTemplates` for templates. Discover the exports via `grep "export" src/frontend/src/hooks/useAssets.ts` if needed before writing.

```tsx
import {
  Stack,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Tooltip,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { useTranslation } from 'react-i18next';
import type {
  AssetRequestLineDto,
  AssetRequestLineSourceType,
  AssetRequestType,
  AssetReturnAction,
  CreateAssetRequestLineDto,
} from '../../../types/assetRequest.types';
import { LineStatusBadge } from './LineStatusBadge';

export type EditableLine = (AssetRequestLineDto | (CreateAssetRequestLineDto & { id?: number }));

interface Props {
  line: EditableLine;
  requestType: AssetRequestType;
  assetTypes: { id: number; name: string }[];
  onChange: (next: EditableLine) => void;
  onSkipToggle?: () => void;
  onDelete: () => void;
  /** Controls passed in from parent for asset/template pickers — kept dumb on purpose */
  assetPicker: React.ReactNode;
  templatePicker: React.ReactNode;
  readOnly?: boolean;
}

const SOURCE_TYPES: AssetRequestLineSourceType[] = [
  'ToBeAssigned',
  'ExistingInventory',
  'NewFromTemplate',
];

const RETURN_ACTIONS: AssetReturnAction[] = ['ReturnToStock', 'Decommission', 'Reassign'];

export function AssetLineRow({
  line,
  requestType,
  assetTypes,
  onChange,
  onSkipToggle,
  onDelete,
  assetPicker,
  templatePicker,
  readOnly,
}: Props) {
  const { t } = useTranslation();
  const sourceType = (line as AssetRequestLineDto).sourceType ?? 'ToBeAssigned';
  const status = (line as AssetRequestLineDto).status;

  return (
    <Stack direction="row" spacing={2} alignItems="flex-start" sx={{ width: '100%' }}>
      <FormControl size="small" sx={{ minWidth: 160 }}>
        <InputLabel>{t('requests.lines.assetType')}</InputLabel>
        <Select
          value={line.assetTypeId ?? ''}
          label={t('requests.lines.assetType')}
          onChange={(e) => onChange({ ...line, assetTypeId: Number(e.target.value) })}
          disabled={readOnly}
        >
          {assetTypes.map((at) => (
            <MenuItem key={at.id} value={at.id}>
              {at.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl size="small" sx={{ minWidth: 180 }}>
        <InputLabel>{t('requests.lines.source')}</InputLabel>
        <Select
          value={sourceType}
          label={t('requests.lines.source')}
          onChange={(e) =>
            onChange({ ...line, sourceType: e.target.value as AssetRequestLineSourceType })
          }
          disabled={readOnly}
        >
          {SOURCE_TYPES.map((s) => (
            <MenuItem key={s} value={s}>
              {t(`requests.sourceType.${s}`)}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {sourceType === 'ExistingInventory' && (
        <div style={{ flex: 1, minWidth: 220 }}>{assetPicker}</div>
      )}
      {sourceType === 'NewFromTemplate' && (
        <div style={{ flex: 1, minWidth: 220 }}>{templatePicker}</div>
      )}

      {requestType === 'offboarding' && (
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>{t('requests.lines.returnAction')}</InputLabel>
          <Select
            value={line.returnAction ?? ''}
            label={t('requests.lines.returnAction')}
            onChange={(e) =>
              onChange({ ...line, returnAction: e.target.value as AssetReturnAction })
            }
            disabled={readOnly}
          >
            {RETURN_ACTIONS.map((a) => (
              <MenuItem key={a} value={a}>
                {t(`requests.returnAction.${a}`)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}

      <TextField
        size="small"
        label={t('requests.lines.notes')}
        value={line.notes ?? ''}
        onChange={(e) => onChange({ ...line, notes: e.target.value })}
        sx={{ flex: 2, minWidth: 200 }}
        disabled={readOnly}
      />

      {status && <LineStatusBadge status={status} />}

      {onSkipToggle && (
        <Tooltip title={t('requests.lineStatus.Skipped')}>
          <IconButton onClick={onSkipToggle} size="small" disabled={readOnly}>
            <VisibilityOffIcon />
          </IconButton>
        </Tooltip>
      )}

      <Tooltip title={t('requests.actions.delete')}>
        <IconButton onClick={onDelete} size="small" color="error" disabled={readOnly}>
          <DeleteIcon />
        </IconButton>
      </Tooltip>
    </Stack>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `cd src/frontend && npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/frontend/src/components/operations/requests/AssetLineRow.tsx
git commit -m "feat(requests): asset line row with source/return-action controls"
```

---

### Task 24: Lines editor component

**Files:**
- Create: `src/frontend/src/components/operations/requests/RequestLinesEditor.tsx`

- [ ] **Step 1: Create the editor**

This component manages a list of editable lines. It accepts callback handlers from the parent (so it works for both create-mode without a request id and detail-mode with mutation hooks).

```tsx
import { Box, Button, Stack, Typography, Divider, Autocomplete, TextField } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { AssetLineRow, type EditableLine } from './AssetLineRow';
import type { AssetRequestType } from '../../../types/assetRequest.types';
import { getAllAssets } from '../../../api/assets.api';
import { getAllAssetTemplates } from '../../../api/templates.api';
import { adminApi } from '../../../api/admin.api';

interface AssetTypeOption {
  id: number;
  name: string;
}

interface Props {
  lines: EditableLine[];
  requestType: AssetRequestType;
  onLinesChange: (lines: EditableLine[]) => void;
  readOnly?: boolean;
}

export function RequestLinesEditor({ lines, requestType, onLinesChange, readOnly }: Props) {
  const { t } = useTranslation();

  const { data: assetTypes = [] } = useQuery<AssetTypeOption[]>({
    queryKey: ['admin-asset-types'],
    queryFn: () => adminApi.getAssetTypes(),
  });

  const { data: assets = [] } = useQuery({
    queryKey: ['assets-for-line-picker'],
    queryFn: () => getAllAssets(),
  });

  const { data: templates = [] } = useQuery({
    queryKey: ['asset-templates-for-line-picker'],
    queryFn: () => getAllAssetTemplates(),
  });

  const updateLine = (idx: number, next: EditableLine) => {
    const copy = lines.slice();
    copy[idx] = next;
    onLinesChange(copy);
  };

  const removeLine = (idx: number) => {
    onLinesChange(lines.filter((_, i) => i !== idx));
  };

  const addLine = () => {
    onLinesChange([
      ...lines,
      {
        assetTypeId: assetTypes[0]?.id ?? 0,
        sourceType: 'ToBeAssigned',
      },
    ]);
  };

  const skipToggle = (idx: number) => {
    const cur = lines[idx];
    if (!('status' in cur)) return; // create-mode lines have no status yet
    const next = cur.status === 'Skipped' ? 'Pending' : 'Skipped';
    updateLine(idx, { ...cur, status: next });
  };

  return (
    <Box>
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
        <Typography variant="h6">{t('requests.lines.title')}</Typography>
        {!readOnly && (
          <Button startIcon={<AddIcon />} onClick={addLine} variant="outlined" size="small">
            {t('requests.lines.addLine')}
          </Button>
        )}
      </Stack>

      {lines.length === 0 && (
        <Typography color="text.secondary" variant="body2">
          {t('requests.lines.noLines')}
        </Typography>
      )}

      <Stack spacing={2} divider={<Divider flexItem />}>
        {lines.map((line, idx) => {
          const assetPicker = (
            <Autocomplete
              size="small"
              options={assets}
              getOptionLabel={(a) => `${a.assetCode} — ${a.assetName ?? ''}`}
              value={assets.find((a) => a.id === line.assetId) ?? null}
              onChange={(_, selected) =>
                updateLine(idx, { ...line, assetId: selected?.id, sourceType: 'ExistingInventory' })
              }
              renderInput={(params) => <TextField {...params} label={t('requests.lines.asset')} />}
              disabled={readOnly}
            />
          );
          const templatePicker = (
            <Autocomplete
              size="small"
              options={templates}
              getOptionLabel={(tpl) => tpl.name}
              value={templates.find((tpl) => tpl.id === line.assetTemplateId) ?? null}
              onChange={(_, selected) =>
                updateLine(idx, {
                  ...line,
                  assetTemplateId: selected?.id,
                  sourceType: 'NewFromTemplate',
                })
              }
              renderInput={(params) => (
                <TextField {...params} label={t('requests.lines.template')} />
              )}
              disabled={readOnly}
            />
          );

          return (
            <AssetLineRow
              key={('id' in line && line.id) || `new-${idx}`}
              line={line}
              requestType={requestType}
              assetTypes={assetTypes}
              onChange={(next) => updateLine(idx, next)}
              onSkipToggle={'status' in line ? () => skipToggle(idx) : undefined}
              onDelete={() => removeLine(idx)}
              assetPicker={assetPicker}
              templatePicker={templatePicker}
              readOnly={readOnly}
            />
          );
        })}
      </Stack>
    </Box>
  );
}
```

If `getAllAssets`, `getAllAssetTemplates`, or `adminApi.getAssetTypes` do not exist with those exact names, replace each call with the equivalent existing one (search via `grep -l "AssetType" src/frontend/src/api/`). Do not invent new API functions.

- [ ] **Step 2: Typecheck**

Run: `cd src/frontend && npx tsc --noEmit`
Expected: No errors. If imports are wrong, replace with the actual function names from the codebase.

- [ ] **Step 3: Commit**

```bash
git add src/frontend/src/components/operations/requests/RequestLinesEditor.tsx
git commit -m "feat(requests): lines editor with asset/template pickers"
```

---

### Task 25: Request form (header)

**Files:**
- Create: `src/frontend/src/components/operations/requests/RequestForm.tsx`

- [ ] **Step 1: Create the header form**

```tsx
import { Stack, TextField, Autocomplete } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { EmployeePickerWithFallback } from './EmployeePickerWithFallback';
import { getAllPhysicalWorkplaces } from '../../../api/physicalWorkplaces.api';
import { searchEmployees } from '../../../api/organization.api';

export interface RequestFormState {
  requestedFor: string;
  employeeId?: number;
  requestedDate: string; // ISO
  physicalWorkplaceId?: number;
  notes?: string;
}

interface Props {
  value: RequestFormState;
  onChange: (next: RequestFormState) => void;
  readOnly?: boolean;
}

export function RequestForm({ value, onChange, readOnly }: Props) {
  const { t } = useTranslation();

  const { data: workplaces = [] } = useQuery({
    queryKey: ['physical-workplaces-for-picker'],
    queryFn: () => getAllPhysicalWorkplaces(),
  });

  return (
    <Stack spacing={2}>
      <EmployeePickerWithFallback
        required
        value={{ requestedFor: value.requestedFor, employeeId: value.employeeId }}
        onChange={(next) => onChange({ ...value, ...next })}
        fetchEmployees={searchEmployees}
      />

      <TextField
        type="date"
        label={t('requests.form.requestedDate')}
        value={value.requestedDate.substring(0, 10)}
        onChange={(e) =>
          onChange({ ...value, requestedDate: new Date(e.target.value).toISOString() })
        }
        InputLabelProps={{ shrink: true }}
        disabled={readOnly}
        required
      />

      <Autocomplete
        options={workplaces}
        getOptionLabel={(w) => `${w.code} — ${w.name}`}
        value={workplaces.find((w) => w.id === value.physicalWorkplaceId) ?? null}
        onChange={(_, selected) =>
          onChange({ ...value, physicalWorkplaceId: selected?.id })
        }
        renderInput={(params) => (
          <TextField {...params} label={t('requests.form.physicalWorkplace')} />
        )}
        disabled={readOnly}
      />

      <TextField
        label={t('requests.form.notes')}
        value={value.notes ?? ''}
        onChange={(e) => onChange({ ...value, notes: e.target.value })}
        multiline
        rows={3}
        disabled={readOnly}
      />
    </Stack>
  );
}
```

If `getAllPhysicalWorkplaces` does not exist with that exact name, find the actual export in `src/frontend/src/api/physicalWorkplaces.api.ts` and substitute.

- [ ] **Step 2: Typecheck**

Run: `cd src/frontend && npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/frontend/src/components/operations/requests/RequestForm.tsx
git commit -m "feat(requests): header form with employee picker + workplace + notes"
```

---

### Task 26: Status transition action bar

**Files:**
- Create: `src/frontend/src/components/operations/requests/RequestStatusTransition.tsx`

- [ ] **Step 1: Create the component**

```tsx
import { useState } from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Stack } from '@mui/material';
import { useTranslation } from 'react-i18next';
import type { AssetRequestDetailDto } from '../../../types/assetRequest.types';

type TransitionTarget = 'Approved' | 'InProgress' | 'Completed' | 'Cancelled';

interface Props {
  request: AssetRequestDetailDto;
  onTransition: (target: TransitionTarget) => Promise<void>;
  busy?: boolean;
}

export function RequestStatusTransition({ request, onTransition, busy }: Props) {
  const { t } = useTranslation();
  const [pending, setPending] = useState<TransitionTarget | null>(null);

  const allowed: TransitionTarget[] = (() => {
    switch (request.status) {
      case 'Pending':
        return ['Approved', 'InProgress', 'Cancelled'];
      case 'Approved':
        return ['InProgress', 'Cancelled'];
      case 'InProgress':
        return ['Completed', 'Cancelled'];
      default:
        return [];
    }
  })();

  const confirmKey: Record<TransitionTarget, string> = {
    Approved: 'requests.actions.approve',
    InProgress: 'requests.actions.start',
    Completed:
      request.requestType === 'onboarding'
        ? 'requests.confirm.completeOnboarding'
        : 'requests.confirm.completeOffboarding',
    Cancelled: 'requests.confirm.cancel',
  };

  const buttonLabel: Record<TransitionTarget, string> = {
    Approved: 'requests.actions.approve',
    InProgress: 'requests.actions.start',
    Completed: 'requests.actions.complete',
    Cancelled: 'requests.actions.cancel',
  };

  return (
    <>
      <Stack direction="row" spacing={1}>
        {allowed.map((tgt) => (
          <Button
            key={tgt}
            variant={tgt === 'Completed' ? 'contained' : 'outlined'}
            color={tgt === 'Cancelled' ? 'error' : tgt === 'Completed' ? 'success' : 'primary'}
            disabled={busy}
            onClick={() => setPending(tgt)}
          >
            {t(buttonLabel[tgt])}
          </Button>
        ))}
      </Stack>

      <Dialog open={pending !== null} onClose={() => setPending(null)}>
        <DialogTitle>{pending && t(buttonLabel[pending])}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {pending && (pending === 'Completed' || pending === 'Cancelled')
              ? t(confirmKey[pending])
              : null}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPending(null)}>{t('requests.actions.cancel')}</Button>
          <Button
            variant="contained"
            color={pending === 'Cancelled' ? 'error' : 'primary'}
            disabled={busy}
            onClick={async () => {
              if (!pending) return;
              await onTransition(pending);
              setPending(null);
            }}
          >
            {pending && t(buttonLabel[pending])}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `cd src/frontend && npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/frontend/src/components/operations/requests/RequestStatusTransition.tsx
git commit -m "feat(requests): status transition bar with confirmations"
```

---

### Task 27: Shared list component

**Files:**
- Create: `src/frontend/src/components/operations/requests/RequestsList.tsx`

- [ ] **Step 1: Create the list**

```tsx
import {
  Box,
  Button,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAssetRequests } from '../../../hooks/useAssetRequests';
import { RequestStatusBadge } from './RequestStatusBadge';
import { EmployeeLinkChip } from './EmployeeLinkChip';
import type { AssetRequestType } from '../../../types/assetRequest.types';
import { Loading } from '../../common/Loading';
import { ErrorMessage } from '../../common/ErrorMessage';

interface Props {
  type: AssetRequestType;
  newPath: string;
  detailPath: (id: number) => string;
  titleKey: string;
  subtitleKey: string;
  newButtonKey: string;
}

export function RequestsList({ type, newPath, detailPath, titleKey, subtitleKey, newButtonKey }: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: requests, isLoading, error } = useAssetRequests({ type });

  if (isLoading) return <Loading />;
  if (error) return <ErrorMessage message={String(error)} />;

  return (
    <Box sx={{ p: 2.5 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3}>
        <Box>
          <Typography variant="h5" fontWeight={700}>
            {t(titleKey)}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t(subtitleKey)}
          </Typography>
        </Box>
        <Button startIcon={<AddIcon />} variant="contained" onClick={() => navigate(newPath)}>
          {t(newButtonKey)}
        </Button>
      </Stack>

      <Paper variant="outlined">
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>{t('requests.form.requestedFor')}</TableCell>
                <TableCell>{t('requests.form.linkedEmployee')}</TableCell>
                <TableCell>{t('requests.form.requestedDate')}</TableCell>
                <TableCell>{t('requests.lines.title')}</TableCell>
                <TableCell>{t('requests.lines.status')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(requests ?? []).map((r) => (
                <TableRow
                  key={r.id}
                  hover
                  onClick={() => navigate(detailPath(r.id))}
                  sx={{ cursor: 'pointer' }}
                >
                  <TableCell>{r.requestedFor}</TableCell>
                  <TableCell>
                    <EmployeeLinkChip employeeDisplayName={r.employeeDisplayName} />
                  </TableCell>
                  <TableCell>{new Date(r.requestedDate).toLocaleDateString()}</TableCell>
                  <TableCell>
                    {r.completedLineCount} / {r.lineCount}
                  </TableCell>
                  <TableCell>
                    <RequestStatusBadge status={r.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}
```

If `Loading` and `ErrorMessage` exports differ, replace with the actual exports from `components/common/`.

- [ ] **Step 2: Typecheck**

Run: `cd src/frontend && npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/frontend/src/components/operations/requests/RequestsList.tsx
git commit -m "feat(requests): shared list component for on/offboarding"
```

---

### Task 28: List pages (onboarding + offboarding)

**Files:**
- Create: `src/frontend/src/pages/operations/requests/OnboardingListPage.tsx`
- Create: `src/frontend/src/pages/operations/requests/OffboardingListPage.tsx`

- [ ] **Step 1: Onboarding page**

```tsx
import { RequestsList } from '../../../components/operations/requests/RequestsList';
import { ROUTES, buildRoute } from '../../../constants/routes';

export default function OnboardingListPage() {
  return (
    <RequestsList
      type="onboarding"
      newPath={ROUTES.REQUEST_ONBOARDING_NEW}
      detailPath={(id) => buildRoute.onboardingRequestDetail(id)}
      titleKey="requests.onboarding.title"
      subtitleKey="requests.onboarding.subtitle"
      newButtonKey="requests.onboarding.newButton"
    />
  );
}
```

- [ ] **Step 2: Offboarding page**

```tsx
import { RequestsList } from '../../../components/operations/requests/RequestsList';
import { ROUTES, buildRoute } from '../../../constants/routes';

export default function OffboardingListPage() {
  return (
    <RequestsList
      type="offboarding"
      newPath={ROUTES.REQUEST_OFFBOARDING_NEW}
      detailPath={(id) => buildRoute.offboardingRequestDetail(id)}
      titleKey="requests.offboarding.title"
      subtitleKey="requests.offboarding.subtitle"
      newButtonKey="requests.offboarding.newButton"
    />
  );
}
```

- [ ] **Step 3: Typecheck**

Run: `cd src/frontend && npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add src/frontend/src/pages/operations/requests/OnboardingListPage.tsx src/frontend/src/pages/operations/requests/OffboardingListPage.tsx
git commit -m "feat(requests): on/offboarding list pages"
```

---

### Task 29: Create page

**Files:**
- Create: `src/frontend/src/pages/operations/requests/RequestCreatePage.tsx`

- [ ] **Step 1: Create the page**

```tsx
import { useState } from 'react';
import { Box, Button, Paper, Stack, Typography } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { RequestForm, type RequestFormState } from '../../../components/operations/requests/RequestForm';
import { RequestLinesEditor } from '../../../components/operations/requests/RequestLinesEditor';
import type { EditableLine } from '../../../components/operations/requests/AssetLineRow';
import { useCreateAssetRequest } from '../../../hooks/useAssetRequests';
import { buildRoute } from '../../../constants/routes';
import type { AssetRequestType, CreateAssetRequestLineDto } from '../../../types/assetRequest.types';

export default function RequestCreatePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const requestType: AssetRequestType = location.pathname.includes('/offboarding/')
    ? 'offboarding'
    : 'onboarding';

  const [form, setForm] = useState<RequestFormState>({
    requestedFor: '',
    requestedDate: new Date().toISOString(),
  });
  const [lines, setLines] = useState<EditableLine[]>([]);
  const create = useCreateAssetRequest();

  const submit = async () => {
    const linesDto: CreateAssetRequestLineDto[] = lines.map((l) => ({
      assetTypeId: l.assetTypeId,
      sourceType: 'sourceType' in l ? (l.sourceType ?? 'ToBeAssigned') : 'ToBeAssigned',
      assetId: l.assetId,
      assetTemplateId: l.assetTemplateId,
      returnAction: l.returnAction,
      notes: l.notes,
    }));

    const created = await create.mutateAsync({
      requestType,
      requestedFor: form.requestedFor,
      employeeId: form.employeeId,
      requestedDate: form.requestedDate,
      physicalWorkplaceId: form.physicalWorkplaceId,
      notes: form.notes,
      lines: linesDto,
    });

    const path =
      requestType === 'onboarding'
        ? buildRoute.onboardingRequestDetail(created.id)
        : buildRoute.offboardingRequestDetail(created.id);
    navigate(path);
  };

  return (
    <Box sx={{ p: 2.5 }}>
      <Typography variant="h5" fontWeight={700} mb={3}>
        {t(
          requestType === 'onboarding'
            ? 'requests.onboarding.createTitle'
            : 'requests.offboarding.createTitle',
        )}
      </Typography>

      <Stack spacing={3}>
        <Paper variant="outlined" sx={{ p: 2.5 }}>
          <RequestForm value={form} onChange={setForm} />
        </Paper>

        <Paper variant="outlined" sx={{ p: 2.5 }}>
          <RequestLinesEditor lines={lines} requestType={requestType} onLinesChange={setLines} />
        </Paper>

        <Stack direction="row" justifyContent="flex-end" spacing={1}>
          <Button onClick={() => navigate(-1)}>{t('requests.actions.cancel')}</Button>
          <Button
            variant="contained"
            onClick={submit}
            disabled={!form.requestedFor || create.isPending}
          >
            {t(
              requestType === 'onboarding'
                ? 'requests.onboarding.newButton'
                : 'requests.offboarding.newButton',
            )}
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `cd src/frontend && npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/frontend/src/pages/operations/requests/RequestCreatePage.tsx
git commit -m "feat(requests): create page for on/offboarding"
```

---

### Task 30: Detail page

**Files:**
- Create: `src/frontend/src/pages/operations/requests/RequestDetailPage.tsx`

- [ ] **Step 1: Create the page**

```tsx
import { Box, Paper, Stack, Typography } from '@mui/material';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  useAddAssetRequestLine,
  useAssetRequest,
  useDeleteAssetRequestLine,
  useTransitionAssetRequest,
  useUpdateAssetRequest,
  useUpdateAssetRequestLine,
} from '../../../hooks/useAssetRequests';
import { RequestForm } from '../../../components/operations/requests/RequestForm';
import { RequestLinesEditor } from '../../../components/operations/requests/RequestLinesEditor';
import { RequestStatusTransition } from '../../../components/operations/requests/RequestStatusTransition';
import { RequestStatusBadge } from '../../../components/operations/requests/RequestStatusBadge';
import { EmployeeLinkChip } from '../../../components/operations/requests/EmployeeLinkChip';
import { Loading } from '../../../components/common/Loading';
import { ErrorMessage } from '../../../components/common/ErrorMessage';
import type { EditableLine } from '../../../components/operations/requests/AssetLineRow';

export default function RequestDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const requestId = id ? Number(id) : undefined;
  const { data: request, isLoading, error } = useAssetRequest(requestId);
  const updateRequest = useUpdateAssetRequest();
  const addLine = useAddAssetRequestLine();
  const updateLine = useUpdateAssetRequestLine();
  const deleteLine = useDeleteAssetRequestLine();
  const transition = useTransitionAssetRequest();

  if (isLoading) return <Loading />;
  if (error || !request) return <ErrorMessage message={String(error ?? 'Not found')} />;

  const readOnly = request.status === 'Completed' || request.status === 'Cancelled';

  const onLinesChange = async (next: EditableLine[]) => {
    // Reconcile against current request.lines: add/update/delete by id.
    const existingById = new Map(request.lines.map((l) => [l.id, l]));
    const seen = new Set<number>();

    for (const line of next) {
      if ('id' in line && line.id !== undefined && existingById.has(line.id)) {
        seen.add(line.id);
        const existing = existingById.get(line.id)!;
        if (
          existing.assetTypeId !== line.assetTypeId ||
          existing.sourceType !== ('sourceType' in line ? line.sourceType : 'ToBeAssigned') ||
          existing.assetId !== line.assetId ||
          existing.assetTemplateId !== line.assetTemplateId ||
          existing.returnAction !== line.returnAction ||
          existing.notes !== line.notes ||
          ('status' in line && existing.status !== line.status)
        ) {
          await updateLine.mutateAsync({
            requestId: request.id,
            lineId: line.id,
            dto: {
              assetTypeId: line.assetTypeId,
              sourceType: 'sourceType' in line ? line.sourceType : 'ToBeAssigned',
              assetId: line.assetId,
              assetTemplateId: line.assetTemplateId,
              status: 'status' in line ? line.status : undefined,
              returnAction: line.returnAction,
              notes: line.notes,
            },
          });
        }
      } else {
        await addLine.mutateAsync({
          requestId: request.id,
          dto: {
            assetTypeId: line.assetTypeId,
            sourceType: 'sourceType' in line ? (line.sourceType ?? 'ToBeAssigned') : 'ToBeAssigned',
            assetId: line.assetId,
            assetTemplateId: line.assetTemplateId,
            returnAction: line.returnAction,
            notes: line.notes,
          },
        });
      }
    }

    for (const existing of request.lines) {
      if (!seen.has(existing.id)) {
        await deleteLine.mutateAsync({ requestId: request.id, lineId: existing.id });
      }
    }
  };

  return (
    <Box sx={{ p: 2.5 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3}>
        <Stack>
          <Typography variant="h5" fontWeight={700}>
            #{request.id} — {request.requestedFor}
          </Typography>
          <Stack direction="row" spacing={1} mt={1} alignItems="center">
            <RequestStatusBadge status={request.status} />
            <EmployeeLinkChip employeeDisplayName={request.employeeDisplayName} />
          </Stack>
        </Stack>
        <RequestStatusTransition
          request={request}
          onTransition={async (target) => {
            await transition.mutateAsync({ id: request.id, dto: { target } });
          }}
          busy={transition.isPending}
        />
      </Stack>

      <Stack spacing={3}>
        <Paper variant="outlined" sx={{ p: 2.5 }}>
          <RequestForm
            value={{
              requestedFor: request.requestedFor,
              employeeId: request.employeeId,
              requestedDate: request.requestedDate,
              physicalWorkplaceId: request.physicalWorkplaceId,
              notes: request.notes,
            }}
            onChange={async (next) => {
              await updateRequest.mutateAsync({
                id: request.id,
                dto: {
                  requestedFor: next.requestedFor,
                  employeeId: next.employeeId,
                  requestedDate: next.requestedDate,
                  physicalWorkplaceId: next.physicalWorkplaceId,
                  notes: next.notes,
                },
              });
            }}
            readOnly={readOnly}
          />
        </Paper>

        <Paper variant="outlined" sx={{ p: 2.5 }}>
          <RequestLinesEditor
            lines={request.lines}
            requestType={request.requestType}
            onLinesChange={onLinesChange}
            readOnly={readOnly}
          />
        </Paper>

        {request.notes && (
          <Typography variant="body2" color="text.secondary">
            {t('requests.form.notes')}: {request.notes}
          </Typography>
        )}
      </Stack>
    </Box>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `cd src/frontend && npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/frontend/src/pages/operations/requests/RequestDetailPage.tsx
git commit -m "feat(requests): detail page with header, lines, transitions"
```

---

### Task 31: Wire routes in `App.tsx`

**Files:**
- Modify: `src/frontend/src/App.tsx`

- [ ] **Step 1: Replace the request routes**

Locate the existing block (around line 128–130):

```tsx
<Route path={ROUTES.REQUESTS_ONBOARDING} element={<RequestsDashboardPage />} />
<Route path={ROUTES.REQUESTS_OFFBOARDING} element={<RequestsDashboardPage />} />
<Route path={ROUTES.REQUESTS_REPORTS} element={<RequestsReportsPage />} />
```

Replace with:

```tsx
<Route path={ROUTES.REQUESTS_ONBOARDING} element={<OnboardingListPage />} />
<Route path={ROUTES.REQUEST_ONBOARDING_NEW} element={<RequestCreatePage />} />
<Route path={ROUTES.REQUEST_ONBOARDING_DETAIL} element={<RequestDetailPage />} />
<Route path={ROUTES.REQUESTS_OFFBOARDING} element={<OffboardingListPage />} />
<Route path={ROUTES.REQUEST_OFFBOARDING_NEW} element={<RequestCreatePage />} />
<Route path={ROUTES.REQUEST_OFFBOARDING_DETAIL} element={<RequestDetailPage />} />
<Route path={ROUTES.REQUESTS_REPORTS} element={<RequestsReportsPage />} />
```

Add imports near the top of `App.tsx` (alphabetical with the rest):

```tsx
import OnboardingListPage from './pages/operations/requests/OnboardingListPage';
import OffboardingListPage from './pages/operations/requests/OffboardingListPage';
import RequestCreatePage from './pages/operations/requests/RequestCreatePage';
import RequestDetailPage from './pages/operations/requests/RequestDetailPage';
```

- [ ] **Step 2: Typecheck**

Run: `cd src/frontend && npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/frontend/src/App.tsx
git commit -m "feat(requests): wire on/offboarding routes"
```

---

### Task 32: Wire dashboard statistics + remove "coming soon"

**Files:**
- Modify: `src/frontend/src/pages/operations/requests/RequestsDashboardPage.tsx`

- [ ] **Step 1: Replace the file**

Open the existing file, then:

(a) Add imports:

```tsx
import { useAssetRequestStatistics } from '../../../hooks/useAssetRequests';
```

(b) Inside the component, replace the static `stats` array. Find:

```tsx
const stats = [
  {
    label: 'Actieve Aanvragen',
    value: '0',
    ...
```

Replace the entire `const stats = [ ... ];` block with:

```tsx
const { data: statistics } = useAssetRequestStatistics();

const stats = [
  {
    label: 'Actieve Aanvragen',
    value: String(statistics?.activeRequests ?? 0),
    color: '#1976D2',
    Icon: AssignmentIcon,
  },
  {
    label: 'Deze Maand',
    value: String(statistics?.monthlyRequests ?? 0),
    color: '#43A047',
    Icon: CalendarMonthIcon,
  },
  {
    label: 'In Behandeling',
    value: String(statistics?.inProgressRequests ?? 0),
    color: '#FF9800',
    Icon: HourglassEmptyIcon,
  },
];
```

(c) In the `quickActions` array, remove `comingSoon: true,` from both Onboarding and Offboarding entries (the `Historiek` entry is already not coming-soon).

- [ ] **Step 2: Typecheck and lint**

Run: `cd src/frontend && npx tsc --noEmit && npm run lint`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/frontend/src/pages/operations/requests/RequestsDashboardPage.tsx
git commit -m "feat(requests): wire dashboard statistics and enable workflow tiles"
```

---

## Phase 6 — End-to-end verification

### Task 33: End-to-end smoke test

- [ ] **Step 1: Start backend**

Run in one terminal: `cd src/backend/DjoppieInventory.API && dotnet watch run`
Expected: API on `http://localhost:5052`.

- [ ] **Step 2: Start frontend**

Run in another terminal: `cd src/frontend && npm run dev`
Expected: Vite on `http://localhost:5173`.

- [ ] **Step 3: Walk the onboarding flow in the browser**

Open `http://localhost:5173/operations/requests`. Verify:
1. Dashboard shows live (zero) statistics — no "Binnenkort beschikbaar" tags.
2. Click **Onboarding** → list page renders with empty table.
3. Click **Nieuwe onboarding** → create page.
4. Fill `RequestedFor` with an Entra display name (or email) and pick a date. Add a line with an existing asset (status `Nieuw` or `Stock`). Submit.
5. You land on the detail page with status `Pending`.
6. Click **Starten** → status `InProgress`.
7. Click **Afronden** → confirmation appears → confirm. The line status flips to `Completed`, the request status flips to `Completed`. Refresh the assets page to confirm the asset is now `In gebruik` and the owner is set.

- [ ] **Step 4: Walk the offboarding flow**

Repeat for an offboarding request: pick an asset that is `In gebruik`, set the line `ReturnAction` to `Terug naar stock`, transition to `Completed`. Verify the asset's status flips to `Stock` and the owner is cleared.

- [ ] **Step 5: Verify auto-link (manual trigger)**

Trigger an organization sync (existing endpoint or the configured background job). Then create an onboarding request whose `RequestedFor` exactly matches an Entra display name. After the next sync, refresh the detail page — the `EmployeeLinkChip` should switch from "Niet gekoppeld" to the matched name.

- [ ] **Step 6: No commit needed.** This is a manual verification step.

If any step fails, fix the underlying issue, re-test, and commit the fix as a separate task.

---

## Self-review checklist (post-write)

- [x] Spec §3.1 (extended `AssetRequest`) → Tasks 2, 3, 5
- [x] Spec §3.2 (new `AssetRequestLine`) → Tasks 1, 3, 5
- [x] Spec §3.3 (validation rules) → Task 8 (`ValidateCompletion`), Task 10 (controller pre-conditions)
- [x] Spec §4 (workflow + transitions) → Task 8 (`ValidateTransition` + apply methods)
- [x] Spec §4.1 (onboarding completion) → Task 8 `ApplyOnboardingLine`, Task 12 test
- [x] Spec §4.2 (offboarding completion) → Task 8 `ApplyOffboardingLine`, Task 13 tests
- [x] Spec §4.3 (cancellation semantics) → Task 8 (`Cancelled` is allowed from any active state and bypasses asset mutation)
- [x] Spec §5 (auto-link) → Task 9, Task 14 tests
- [x] Spec §6 (API surface) → Task 10
- [x] Spec §7 (service layer + DI) → Tasks 7, 8, 11
- [x] Spec §8 (migration) → Task 5
- [x] Spec §9 (frontend pages, components, routes, dashboard wiring, i18n) → Tasks 19–32
- [x] Spec §10 (permissions: `[Authorize]` only) → Task 10 (already on the controller class)
- [x] Spec §11 (backend tests; frontend tests deferred) → Tasks 12–14
- [x] Spec §12 (docs follow-ups) → out of scope per spec; no task needed

No placeholders, type names consistent (e.g. `AssetRequestStatus`, `AssetRequestLineStatus`, `AssetReturnAction` used consistently between backend and frontend tasks).

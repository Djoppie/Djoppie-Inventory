# Asset Onboarding & Offboarding Lifecycle — Design Spec

**Date:** 2026-04-28
**Status:** Approved (brainstorming)
**Scope:** Single-employee on/offboarding workflow, separate from Rollout feature

## 1. Goal

Provide IT-support with a lightweight per-employee on/offboarding workflow that:

- Captures intake info before the Entra account exists.
- Tracks 0+ asset assignment lines per request, each with its own status.
- Mutates real `Asset` records atomically when a request is completed (status transitions, owner, installation date, audit events).
- Auto-links an `Employee` record to the request once the employee appears in Entra sync.

This complements the existing **Rollout** feature (bulk multi-day, workplace-driven), which remains the tool for planned mass deployments.

## 2. Non-goals

- Bulk import (Rollout owns this).
- HR-system integration (later, via separate ingest).
- Multi-stage approval workflow with distinct approver roles.
- Email or Teams notifications.
- Linking a workplace at create time other than as an optional attribute (no occupancy mutations).

## 3. Domain model

### 3.1 `AssetRequest` (extend existing entity)

```csharp
public class AssetRequest
{
    public int Id { get; set; }
    public AssetRequestType RequestType { get; set; }   // Onboarding | Offboarding
    public AssetRequestStatus Status { get; set; }      // Pending | Approved | InProgress | Completed | Cancelled | Rejected

    // Employee linkage
    public string RequestedFor { get; set; } = "";      // free-text, always filled at intake (name, email, etc.)
    public int? EmployeeId { get; set; }                // FK, set after auto-link or manual link
    public Employee? Employee { get; set; }

    // Planning
    public DateTime RequestedDate { get; set; }
    public int? PhysicalWorkplaceId { get; set; }       // optional, where the employee will be seated
    public PhysicalWorkplace? PhysicalWorkplace { get; set; }

    public string? Notes { get; set; }

    // Audit
    public string CreatedBy { get; set; } = "";
    public DateTime CreatedAt { get; set; }
    public string? ModifiedBy { get; set; }
    public DateTime? ModifiedAt { get; set; }
    public DateTime? CompletedAt { get; set; }

    public ICollection<AssetRequestLine> Lines { get; set; } = new List<AssetRequestLine>();
}
```

**Removed fields** (breaking, DEV only — current data is placeholder):

- `EmployeeName` (replaced by `RequestedFor` + optional `EmployeeId`)
- `AssetType` (moves to `AssetRequestLine.AssetTypeId`)
- `AssignedAssetId` (moves to `AssetRequestLine.AssetId`)

The existing `AssetRequestType` and `AssetRequestStatus` enums are reused as-is.

### 3.2 `AssetRequestLine` (new entity)

```csharp
public class AssetRequestLine
{
    public int Id { get; set; }
    public int AssetRequestId { get; set; }
    public AssetRequest AssetRequest { get; set; } = null!;

    public int AssetTypeId { get; set; }                // Laptop, Monitor, Docking, etc.
    public AssetType AssetType { get; set; } = null!;

    public AssetLineSourceType SourceType { get; set; } = AssetLineSourceType.ToBeAssigned;
    public int? AssetId { get; set; }                   // selected/created asset
    public Asset? Asset { get; set; }
    public int? AssetTemplateId { get; set; }           // for NewFromTemplate
    public AssetTemplate? AssetTemplate { get; set; }

    public AssetRequestLineStatus Status { get; set; } = AssetRequestLineStatus.Pending;

    // Offboarding-only: what to do with the asset on completion.
    // Onboarding always sets the asset to InGebruik; this field is ignored there.
    public AssetReturnAction? ReturnAction { get; set; }

    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

public enum AssetLineSourceType
{
    ToBeAssigned = 0,       // placeholder, only AssetTypeId known
    ExistingInventory = 1,  // pick from inventory
    NewFromTemplate = 2     // create new asset from template
}

public enum AssetRequestLineStatus
{
    Pending = 0,
    Reserved = 1,           // asset selected/allocated but not yet handed over
    Completed = 2,          // asset transition applied
    Skipped = 3             // line not executed; ignored at completion
}

public enum AssetReturnAction
{
    ReturnToStock = 0,      // Asset.Status -> Stock, Owner cleared
    Decommission = 1,       // Asset.Status -> UitDienst
    Reassign = 2            // Asset.Status -> Stock with note; manual reassignment expected
}
```

### 3.3 Validation rules

- `RequestedFor` is required at all times (1..200 chars).
- `RequestedDate` is required.
- `EmployeeId` may be null until linked.
- A request can be `Completed` only if every non-`Skipped` line satisfies:
  - **Onboarding:** `AssetId != null`, `Asset.Status ∈ { Nieuw, Stock }`.
  - **Offboarding:** `AssetId != null`, `ReturnAction != null`, `Asset.Status == InGebruik`.
- Lines may be edited while the request is in `Pending`, `Approved`, or `InProgress`. Lines are read-only after `Completed` or `Cancelled`.
- A request may only be deleted while in `Pending`.

## 4. Workflow & state transitions

```
Pending ──► Approved ──► InProgress ──► Completed
   │           │              │
   └───────────┴──────────────┴──────► Cancelled
```

`Approved` is optional. Default IT flow is `Pending → InProgress → Completed`. The existing `Rejected` status is kept available for future approval workflows but not surfaced in initial UI.

### 4.1 Onboarding completion (atomic)

For each line where `Status != Skipped`:

1. Resolve `Asset` from `AssetId` (or, for `NewFromTemplate`, create via existing template flow first; line records the resulting `AssetId`).
2. Apply mutations:
   - `Asset.Status` → `InGebruik`
   - `Asset.EmployeeId` → request's `EmployeeId` (if linked, else null)
   - `Asset.Owner` → request's `Employee.DisplayName ?? RequestedFor` (kept in sync with FK; `Owner` is the legacy free-text field still used in many UI places)
   - `Asset.ServiceId` → request's `Employee.ServiceId` if available
   - `Asset.InstallationDate` → `DateTime.UtcNow` (if null)
3. Append `AssetEvent` with `EventType = DeviceOnboarded` (existing enum value), `Description = "Onboarded via request #{requestId}"`, `OldValue = previous status`, `NewValue = "InGebruik"`, `Notes` referencing the request id and line id.
4. Set `Line.Status` → `Completed`.

Then `AssetRequest.Status` → `Completed`, `CompletedAt` = now.

### 4.2 Offboarding completion (atomic)

For each line where `Status != Skipped`:

1. Resolve `Asset` from `AssetId`.
2. Apply mutations based on `ReturnAction` (in all cases: `Asset.EmployeeId = null`, `Asset.Owner = null`):
   - `ReturnToStock` → `Asset.Status = Stock`.
   - `Decommission` → `Asset.Status = UitDienst`.
   - `Reassign` → `Asset.Status = Stock`; line `Notes` are carried into the asset event for traceability.
3. Append `AssetEvent` with `EventType = DeviceOffboarded` (existing enum value), `Description` describing the return action (`"Returned to stock via request #{requestId}"` / `"Decommissioned via request #{requestId}"` / `"Returned for reassignment via request #{requestId}"`), `OldValue = "InGebruik"`, `NewValue = new status`.
4. Set `Line.Status` → `Completed`.

Then `AssetRequest.Status` → `Completed`, `CompletedAt` = now.

### 4.3 Cancellation

Cancelling a request:

- Sets request status to `Cancelled`.
- Does **not** revert any already-`Completed` lines (those should be cancelled before by reverting individual asset state manually if needed).
- Lines remain in their last state for audit history.

## 5. Auto-link Employee

`OrganizationSyncService` is extended with a post-sync step `LinkPendingAssetRequestsAsync()`:

- Selects every `AssetRequest` with `EmployeeId == null`.
- For each, attempts to match against the just-synced employees:
  1. **Email/UPN match** — if `RequestedFor` contains `@`, exact match on `UserPrincipalName` or `Email` (case-insensitive).
  2. **DisplayName match** — exact match on `DisplayName` (case-insensitive, trimmed).
- On unique match: set `EmployeeId`, log via `ILogger` (no per-request audit table; the link is visible from the request itself).
- On zero or multiple matches: leave unlinked. Surface in UI for manual resolution.

No fuzzy matching in v1.

## 6. API surface

Base path: `/api/operations/requests`

| Method | Route | Notes |
|---|---|---|
| GET | `/` | Filters: `type`, `status[]`, `dateFrom`, `dateTo`, `employeeId`, `q` (free-text on RequestedFor). Paged. |
| GET | `/{id}` | Returns request + lines + employee + workplace summary. |
| POST | `/` | Body: header + initial lines array. |
| PUT | `/{id}` | Update header (RequestedFor, RequestedDate, PhysicalWorkplaceId, Notes). Status changes go via /transition. |
| DELETE | `/{id}` | Allowed only when `Status == Pending`. |
| POST | `/{id}/lines` | Add a line. |
| PUT | `/{id}/lines/{lineId}` | Update a line (assign asset, change source, set ReturnAction, mark Skipped/Reserved). |
| DELETE | `/{id}/lines/{lineId}` | Remove a line (only if `Status != Completed`). |
| POST | `/{id}/transition` | Body: `{ "target": "Approved\|InProgress\|Completed\|Cancelled" }`. Validates pre-conditions and applies atomic asset mutations on Completed. |
| POST | `/{id}/link-employee` | Body: `{ "employeeId": 123 }`. Manual link override. |
| GET | `/statistics` | `{ activeRequests, monthlyRequests, inProgressRequests }` for the dashboard tiles. |

All endpoints require `[Authorize]`. No admin-only constraints in v1.

### 6.1 DTOs

New DTOs (replacing the current `AssetRequestDto`/`Create*`/`Update*` shape):

- `AssetRequestSummaryDto` (list rows)
- `AssetRequestDetailDto` (with lines, employee, workplace)
- `AssetRequestLineDto`
- `CreateAssetRequestDto` (header + optional `lines: CreateAssetRequestLineDto[]`)
- `UpdateAssetRequestDto`
- `CreateAssetRequestLineDto`, `UpdateAssetRequestLineDto`
- `AssetRequestTransitionDto` (`target` enum value)
- `AssetRequestStatisticsDto`

## 7. Service layer

- `IAssetRequestRepository` — extended with line CRUD, filtered queries with eager loading of `Lines`, `Lines.Asset`, `Lines.AssetType`, `Lines.AssetTemplate`, `Employee`, `PhysicalWorkplace`.
- New `AssetRequestCompletionService` — orchestrates `CompleteAsync(int requestId)`:
  - Pre-validates all lines.
  - Applies asset mutations + writes `AssetEvent`s.
  - Updates request status + `CompletedAt`.
  - Single EF transaction (rollback on any failure).
- `OrganizationSyncService` — adds `LinkPendingAssetRequestsAsync()` invoked at the end of each sync cycle.
- DI registration in `Program.cs`.

## 8. Database migration

Migration name: `AddAssetRequestLifecycle`

- `AssetRequest` table:
  - Drop `EmployeeName`, `AssetType`, `AssignedAssetId`.
  - Add `RequestedFor` (string, 200, required), `EmployeeId` (int?, FK Employees), `PhysicalWorkplaceId` (int?, FK PhysicalWorkplaces).
- New `AssetRequestLines` table with all columns from §3.2.
- Indexes:
  - `AssetRequests(EmployeeId)`, `AssetRequests(Status, RequestType)`, `AssetRequests(RequestedDate)`.
  - `AssetRequestLines(AssetRequestId)`, `AssetRequestLines(AssetId)`, `AssetRequestLines(Status)`.
- DEV is allowed to drop and recreate the `AssetRequests` rows (current data is placeholder/empty).

## 9. Frontend

### 9.1 Routes

Existing in `routes.ts`:

- `/operations/requests` → `RequestsDashboardPage` (existing)
- `/operations/requests/onboarding` → **new** `OnboardingListPage`
- `/operations/requests/offboarding` → **new** `OffboardingListPage`
- `/operations/requests/reports` → `RequestsReportsPage` (existing)

New routes to add:

- `/operations/requests/onboarding/new`, `/operations/requests/offboarding/new` → `RequestCreatePage`
- `/operations/requests/onboarding/:id`, `/operations/requests/offboarding/:id` → `RequestDetailPage`

`buildRoute` helpers added accordingly.

### 9.2 Pages

- `pages/operations/requests/OnboardingListPage.tsx`
- `pages/operations/requests/OffboardingListPage.tsx`
- `pages/operations/requests/RequestCreatePage.tsx`
- `pages/operations/requests/RequestDetailPage.tsx`

The two list pages share a `RequestsList` component that takes `type` as a prop. The detail page handles both onboarding and offboarding via `request.type`.

### 9.3 Components

Under `components/operations/requests/`:

- `RequestForm.tsx` — header form (Employee picker with free-text fallback, RequestedDate, optional PhysicalWorkplace picker, Notes).
- `EmployeePickerWithFallback.tsx` — search Employees by name/email, with "use as free text" option for unlinked intake.
- `RequestLinesEditor.tsx` — table of lines with add/remove/edit.
- `AssetLineRow.tsx` — single line UI: AssetType selector, source switcher (Existing / Template / Placeholder), asset picker (existing) or template picker (new), Skip toggle, ReturnAction selector for offboarding, status badge, notes.
- `RequestStatusTransition.tsx` — buttons (`Approve`, `Start`, `Complete`, `Cancel`) with confirmation dialog explaining the asset mutations.
- `EmployeeLinkChip.tsx` — shows linked/unlinked state with manual relink button.
- `RequestStatusBadge.tsx`, `LineStatusBadge.tsx`.
- `RequestStatisticsCards.tsx` — replaces the placeholder stats on `RequestsDashboardPage` with live data.

### 9.4 API client + hooks

- `api/requests.api.ts` — full CRUD and transition methods.
- `hooks/requests/useRequests.ts`, `useRequest.ts`, `useRequestMutations.ts`, `useRequestTransition.ts`, `useRequestStatistics.ts`.

### 9.5 Dashboard wiring

`RequestsDashboardPage`:

- `comingSoon` flags removed from the Onboarding and Offboarding cards.
- Stats fed by `useRequestStatistics()`.

### 9.6 i18n

New namespace `requests` in `nl.json` + `en.json` covering page titles, status labels, transition confirmations, source-type labels, and return-action labels.

## 10. Permissions

All endpoints require `[Authorize]`. No admin-only constraints in v1. Adding role gating later is out of scope and tracked separately under the existing roles roadmap.

## 11. Testing

Backend (xUnit):

- Repository: filtered queries, line CRUD.
- `AssetRequestCompletionService`: onboarding happy path, offboarding happy path per `ReturnAction`, validation failures (missing `AssetId`, wrong asset status), atomic rollback on partial failure.
- Auto-link: email match, displayName match, ambiguous → no link.

Frontend:

- Tests are not currently configured in `src/frontend`; manual UI verification for v1, formal tests deferred.

## 12. Documentation updates

- `CLAUDE.md` — add brief mention of the lifecycle feature alongside the Rollout section.
- `docs/wiki/User-Guide/` — add a Dutch user guide page (separate task, after implementation).

## 13. Open follow-ups (not in scope)

- Approval roles and `Rejected` UI.
- HR system push (auto-create requests when an employee is hired/terminated).
- Notification (email/Teams) on status changes.
- Bulk creation from a CSV of new hires.
- Linking a request to an existing Rollout session (for cases where a single onboarding belongs to a planned rollout day).

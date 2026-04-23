# Reports Consolidation — Design Spec (Fase A)

**Date:** 2026-04-23
**Status:** Approved for plan-writing
**Scope:** Consolidate and modernize the `/reports` section of Djoppie Inventory. Intune deep-analytics and Requests/Swaps integration are explicitly out of scope — captured as follow-up specs (Fase B, Fase C).

---

## 1. Goals & non-goals

### Goals

- Reduce fragmented reporting surfaces (currently 6 tabs in `/reports` + `/workplaces/reports` + `/operations/requests/reports` + `/operations/swaps/history`) into one coherent `/reports` shell with 6 hoofdsecties.
- Provide a professional, modern UI: executive overview dashboard on landing, focused tabs for deep dives.
- Consolidate overlapping data (Hardware inventaris + Asset Geschiedenis + Swap History) into a single "Assets" tab with a Nu/Historiek toggle and per-asset expandable timelines.
- Surface onboarding/offboarding/swap classification throughout Rollout reports for management-level visibility.
- Prepare integration hooks for Fase B (Intune deep-analytics) and Fase C (Requests/Swaps history).
- Deliver consistent filter UX, export UX, error/empty/loading states across all tabs.

### Non-goals

- **Intune deep analytics** (OS distribution, hardware-age, compliance trends, enrollment funnel). Only placeholder tab + summary KPIs in this spec.
- **Requests/Swaps workflow rebuild** (onboarding/offboarding flows, swap execution). `RequestsDashboardPage` TODOs and `LaptopSwapPage` remain untouched.
- **Role-based access control** on reports. All reports remain `[Authorize]` (any authenticated user) for now.
- **Frontend test framework setup.** Project has no test setup yet; adding one is a separate refactor.
- **LicensesTab** rework — remains as-is in this phase.

---

## 2. Information architecture

### 2.1 Route structure

`/reports` shell with 6 tabs, all state in URL query params:

| Tab | URL | Purpose |
|---|---|---|
| Overview | `?tab=overview` *(default)* | Executive dashboard — cross-domain KPIs, trend chart, attention list |
| Assets | `?tab=assets&view=nu\|history` | Current inventory + full history, hybrid pattern (toggle + expandable rows) |
| Rollouts | `?tab=rollouts&session={id}&groupBy=day\|service\|building` | Session overview + grouped checklist with type classification |
| Werkplekken | `?tab=werkplekken&view=workplace\|employee` | Occupancy + employee-centric view |
| Intune | `?tab=intune` | Placeholder with summary KPIs (Fase B fills content) |
| Leasing | `?tab=leasing` | Lease contracts, expiry timeline |

Deep-linkable state: filters, selected session/day/asset, expansion state. Example:
`/reports?tab=assets&view=nu&status=Defect&serviceId=12&asset=LAP-26-DELL-00012`

### 2.2 Route migrations

| Old URL | New URL | Strategy |
|---|---|---|
| `/reports?tab=hardware` | `/reports?tab=assets&view=nu` | Query-param rewrite on mount |
| `/reports?tab=swaps` | `/reports?tab=assets&view=history` | Idem |
| `/reports?tab=workplaces` | `/reports?tab=werkplekken` | Rename (NL) |
| `/reports?tab=serialnumbers` | `/operations/rollouts/serienummers` | `<Navigate>` |
| `/workplaces/reports` | `/reports?tab=werkplekken` | Route stays, renders `<Navigate>` |
| `/operations/swaps/history` | **unchanged** (Fase C) | — |
| `/operations/requests/reports` | **unchanged** (Fase C) | — |

Bookmarks, sidebar links, and dashboard-tile links all get updated in the same PR set where redirects land.

### 2.3 Sidebar changes

- **Reports** group keeps 6 items (matching tabs above).
- **Serienummers** moves from Reports to child-entry under **Operations → Rollouts**.

---

## 3. Tab designs

### 3.1 Overview tab (landing)

**Layout (top to bottom):**

1. **KPI grid** — 6 tiles, responsive (4-col desktop / 2-col tablet / 1-col mobile):
   - Assets (total, in-use %, defect count)
   - Rollouts (active sessions, completion %)
   - Werkplekken (total, occupancy %)
   - Leasing (active contracts, expiring <60d)
   - Intune (enrolled, stale >30d)
   - Activiteit (count of `AssetEvents` with `EventDate` in the last 7 days; click-through opens Assets → Historiek with date-filter applied)

   Each tile click-throughs to the relevant tab with appropriate filters pre-applied.
2. **Activity trend chart** — full-width stacked area chart (last 30 days), grouping events by type: onboarding / offboarding / swap / other.
3. **Attention list** — 2-column panel:
   - *Actie nodig:* defect assets, non-compliant devices, stale devices, delayed rollouts.
   - *Binnenkort:* expiring leases, active-rollout workplaces this week, unscheduled old assets.
   Each item is a deep-link.

**Backend:** `GET /api/reports/overview` → `OverviewKpiDto` aggregating all domains. Hook: `useReportsOverview()`, `staleTime: 2m`.

**Components:** `OverviewKpiGrid`, `ActivityTrendChart`, `AttentionList`.

### 3.2 Assets tab

**Top-level toggle:** segmented control `Nu | Historiek`, URL state `view=nu|history`. Default `nu`.

#### 3.2.1 View "Nu" (snapshot)

- **Stat cards (horizontal, scrollable):** Totaal / InGebruik / Stock / Herstelling / Defect / Nieuw — each clickable as status filter.
- **Filter bar:** search + collapsible advanced filters (Sector/Service hierarchical, AssetType, Gebouw, Intune compliance) + `ExportMenu`.
- **DataGrid columns:** Asset Code (chip) · Naam (+SN) · Type · Status (badge) · Eigenaar · Werkplek · Dienst · **Intune badge** · **Last sync**.
- **Expandable rows:** click chevron → inline `AssetTimelineInline` component. Lazy-loads last 50 events via `GET /api/reports/assets/{id}/timeline`. Caches per asset.

#### 3.2.2 View "Historiek" (event log)

- **Stat cards:** Totaal / Status-changes / Owner-changes / Active-assets.
- **Event-type breakdown row:** chip-row per type (status/owner/location/onboarding/offboarding).
- **Filter bar:** date range, event type, Sector/Service hierarchical, search.
- **DataGrid columns:** Datum · Asset Code · Type · Serienummer · Gebeurtenis · Oude Waarde · Nieuwe Waarde · Huidige Eigenaar · Dienst · Locatie · **Rollout-context chip** (deep-link to `/reports?tab=rollouts&session=X&day=Y`).

**Shared components:** `AssetFiltersBar`, `AssetStatusCards`.

**Hooks:** `useAssetsSnapshot(filters)`, `useAssetChangeHistory(filters)`, `useAssetTimeline(assetId)`.

### 3.3 Rollouts tab

Existing `RolloutTab` functionality preserved, with three additions and one split:

#### 3.3.1 Movement-type classification (new)

Server-side classifier in Infrastructure layer: `RolloutMovementClassifierService`. Classifies each `RolloutWorkplace`:

| Type | Rule |
|---|---|
| **Onboarding** | Has new asset(s), no old asset(s) |
| **Offboarding** | Has old asset(s), no new asset(s) |
| **Swap** | Has both new and old |
| **Overig** | Only workplace-fixed peripherals / edge cases |

New field on `RolloutWorkplaceChecklist` and `FutureSwap` DTOs: `movementType`.

#### 3.3.2 Type KPI row + filter

- New KPI row under existing session KPIs: `[Onboarding: N] [Offboarding: N] [Swap: N] [Overig: N]` — tiles clickable as filter.
- New filter dimension: multi-select chip filter for Type.
- New column "Type" in workplace-table with colored chips.

#### 3.3.3 GroupBy toggle (new)

Segmented control `Per Dag | Per Dienst | Per Gebouw` above the checklist. URL state `groupBy=day|service|building`, default `day`.

- `day`: existing behavior.
- `service`: workplaces grouped by service, card header shows service name + type-badges + completion %.
- `building`: grouped by building. Workplace rows get added "Datum" column so temporal context is preserved.

Client-side regrouping via `useMemo`/`groupWorkplacesBy()` — no backend change.

#### 3.3.4 Splitting `RolloutTab.tsx` (1311 lines)

Split into `components/reports/rollout/` directory: `RolloutsTab`, `RolloutSessionSelector`, `RolloutKpiBar`, `RolloutTypeBreakdown`, `RolloutFilterBar`, `RolloutGroupCard` (formerly `DayChecklistCard`, genericized), `UnscheduledAssetsPanel`.

#### 3.3.5 Serial-number edit flow

Edit dialog moves out of Reports context. Chip/link in rollout checklist deep-links to `/operations/rollouts/serienummers?workplace={id}` for the edit flow. Keeps the function accessible without polluting report views.

#### 3.3.6 Excel export

`RolloutExcelExportRequest` extended with `groupBy` — sheet structure follows grouping. New "Type Breakdown" sheet with counts per day and per service.

### 3.4 Werkplekken tab

**Top-level toggle:** `Per Werkplek | Per Medewerker`, URL state `view=workplace|employee`, default `workplace`.

#### 3.4.1 View "Per Werkplek" (existing, polished)

- Stat cards: Totaal / Bezet / Beschikbaar / Bezettingsgraad.
- Hierarchical Sector/Service filter (project standard pattern per CLAUDE.md).
- Table: Code · Naam · Gebouw · Verdieping/Kamer · Occupant · Equipment (chip-list) · Status.
- **Expandable row:** workplace assets as inline list. Equipment chips deep-link to `/reports?tab=assets&asset=X`.

#### 3.4.2 View "Per Medewerker" (new)

- Columns: Naam (+jobtitle) · Dienst · Werkplek (click → switch view) · # Assets (click → assets filter) · Intune-status summary · Last event date.
- **Expandable row:** detail panel with current assets (status chips), Intune devices, last-10 events timeline.

**Backend:** `GET /api/reports/employees`, `GET /api/reports/employees/{id}/timeline`.

**New service:** `EmployeeReportsService` (Infrastructure).

### 3.5 Intune tab (placeholder)

- 4 KPI tiles (Enrolled / Compliant / Non-compliant / Stale) using real data from new `GET /api/reports/intune/summary`.
- Placeholder message pointing to `/devices/intune` for deep dives until Fase B.
- `IntuneReportsController` created even with single endpoint — Fase B adds methods without creating controller.

### 3.6 Leasing tab

Existing `LeasingTab` functionality preserved. Polish:

1. KPI color-coding: red (expiry <30d) / yellow (<60d) / blue (<90d).
2. New expiry-timeline chart (12-month bar visualization).
3. Consistent hierarchical Sector/Service filter.

No backend changes.

---

## 4. Shared components & patterns

### 4.1 New shared components (under `components/reports/shared/`)

- `ExportMenu` — dropdown with CSV + Excel options, delegates to prop callbacks.
- `ReportErrorState` — unified error UI with retry + back-to-overview.
- `ReportEmptyState` — unified empty-state with icon + actionable text.
- `IntuneBadge` — compliance-state badge (compliant/non-compliant/unenrolled/stale/unknown).
- `LastSyncChip` — date + relative time display.

### 4.2 Reused components

- `StatisticsCard` (existing) — all KPI tiles.
- `NeumorphicDataGrid` (existing) — all data tables.
- Hierarchical Sector/Service filter pattern from CLAUDE.md — used in every tab with a Service/Sector filter.
- `getNeumorph*` utilities — neumorphic design system consistency.

---

## 5. Backend architecture

### 5.1 Controller splits & moves

`OperationsReportsController.cs` (1157 lines) splits into:

- **`RolloutReportsController.cs`** (~800 lines) — session overview, checklist, filter options, Excel export. Route prefix `/api/operations/rollouts/reports/*` unchanged.
- **`AssetHistoryReportsController.cs`** (~300 lines, new under `Controllers/Reports/`) — asset change history, per-asset timeline, history summary, export.

### 5.2 New controllers

- `ReportsOverviewController` — `GET /api/reports/overview`.
- `IntuneReportsController` — `GET /api/reports/intune/summary` (Fase B extends).
- `EmployeeReportsController` — employee-scoped queries.

### 5.3 New endpoints

| Endpoint | Purpose |
|---|---|
| `GET /api/reports/overview` | Aggregated KPIs for Overview tab |
| `GET /api/reports/assets/snapshot` | Assets "Nu" view data (was `/hardware`) |
| `GET /api/reports/assets/snapshot/summary` | Stat-card data |
| `GET /api/reports/assets/snapshot/export` | CSV/Excel export |
| `GET /api/reports/assets/change-history` | History view (moved from OperationsReports) |
| `GET /api/reports/assets/change-history/export` | CSV/Excel export |
| `GET /api/reports/assets/{id}/timeline` | Expandable-row data, paginated (default 50) |
| `GET /api/reports/employees` | Per-medewerker view data |
| `GET /api/reports/employees/{id}/timeline` | Employee-detail events |
| `GET /api/reports/werkplekken/export` | CSV/Excel (existing endpoint renamed) |
| `GET /api/reports/leasing/export` | CSV/Excel |
| `GET /api/reports/intune/summary` | KPI tile + Overview data |

### 5.4 Endpoint aliases (backwards-compat)

- `GET /api/reports/hardware` → 200 with deprecation header, proxies to `/api/reports/assets/snapshot`. Removed after 1 release.
- `GET /api/reports/hardware/summary` → idem.

### 5.5 New services (Infrastructure layer)

- `RolloutMovementClassifierService` — classifies workplace movement type. Unit-testable, reused by Overview and Fase C.
- `ReportsOverviewService` — cross-domain aggregation with parallel EF queries (`Task.WhenAll`).
- `EmployeeReportsService` — employee-scoped queries.

### 5.6 DTO changes

- `RolloutWorkplaceChecklist.movementType: string` (new, optional server-side) — Onboarding/Offboarding/Swap/Other.
- `FutureSwap.movementType` — same classification.
- `OverviewKpiDto` — new.
- `IntuneSummaryDto` — new with `totalEnrolled`, `compliant`, `nonCompliant`, `stale`, `unenrolled`, `errorState`, `byCompliance`.
- `EmployeeReportItem`, `EmployeeTimelineItem` — new.

### 5.7 Performance

- Parallel EF queries in Overview service (`Task.WhenAll`).
- `.AsNoTracking()` + direct projections for all read-paths.
- Asset timeline paginated (default 50, "load more" button on frontend).
- Index check: `AssetEvents(AssetId, EventDate)` — add migration if missing.

---

## 6. Frontend architecture

### 6.1 File structure

```
src/frontend/src/components/reports/
├── overview/
│   ├── OverviewTab.tsx
│   ├── OverviewKpiGrid.tsx
│   ├── ActivityTrendChart.tsx
│   └── AttentionList.tsx
├── assets/
│   ├── AssetsTab.tsx
│   ├── AssetsNuView.tsx
│   ├── AssetsHistoryView.tsx
│   ├── AssetTimelineInline.tsx
│   ├── AssetFiltersBar.tsx
│   └── AssetStatusCards.tsx
├── rollout/
│   ├── RolloutsTab.tsx
│   ├── RolloutSessionSelector.tsx
│   ├── RolloutKpiBar.tsx
│   ├── RolloutTypeBreakdown.tsx
│   ├── RolloutFilterBar.tsx
│   ├── RolloutGroupCard.tsx
│   └── UnscheduledAssetsPanel.tsx
├── werkplekken/
│   ├── WerkplekkenTab.tsx
│   ├── WerkplekkenWorkplaceView.tsx
│   └── WerkplekkenEmployeeView.tsx
├── intune/
│   └── IntuneTab.tsx         (placeholder)
├── leasing/
│   └── LeasingTab.tsx        (moved)
├── LicensesTab.tsx           (UNCHANGED — not surfaced as a tab in this spec,
│                              but export retained in index.ts for future use)
├── shared/
│   ├── ExportMenu.tsx
│   ├── ReportErrorState.tsx
│   ├── ReportEmptyState.tsx
│   ├── IntuneBadge.tsx
│   └── LastSyncChip.tsx
└── index.ts
```

### 6.2 Files deleted

- `HardwareTab.tsx` — content splits into `assets/AssetsNuView.tsx`.
- `SwapsTab.tsx` — content moves to `assets/AssetsHistoryView.tsx`.
- `SwapsTab.tsx.backup` — obsolete.
- `WorkplacesTab.tsx` — replaced by `werkplekken/*`.
- `RolloutTab.tsx` — split into `rollout/*`.
- `SerialNumbersTab.tsx` — moves to `src/pages/operations/rollouts/SerienummersPage.tsx`.

### 6.3 Hook layer

New under `hooks/reports/`:
- `useReportsOverview()`
- `useAssetsSnapshot(filters)` *(replaces `useHardwareReport`)*
- `useAssetTimeline(assetId)`
- `useEmployeesReport(filters)`
- `useEmployeeTimeline(employeeId)`
- `useIntuneSummary()`

Existing hooks renamed where endpoint renamed. React-Query key structure:
```
['reports', 'overview']
['reports', 'assets', 'snapshot', filters]
['reports', 'assets', 'history', filters]
['reports', 'assets', 'timeline', assetId]
['reports', 'rollouts', sessionId, filters]
['reports', 'werkplekken', 'workplace'|'employee', filters]
['reports', 'leasing', filters]
['reports', 'intune', 'summary']
```

### 6.4 Caching strategy

| Query | staleTime | cacheTime |
|---|---|---|
| Overview KPIs | 2 min | 5 min |
| Assets snapshot | 30s | 2 min |
| Asset history | 1 min | 5 min |
| Asset timeline | 5 min | 10 min |
| Rollout checklist | 30s | 2 min |
| Werkplekken | 5 min | 10 min |
| Leasing | 10 min | 30 min |
| Intune summary | 5 min | 15 min |

### 6.5 Query invalidation

- Asset mutation → invalidate `['reports','assets']`, `['reports','overview']`.
- Rollout workplace complete → invalidate `['reports','rollouts',sessionId]`, `['reports','overview']`.
- Employee/workplace mutation → invalidate `['reports','werkplekken']`, `['reports','overview']`.

---

## 7. Error handling, empty states, loading

- **Loading:** skeleton screens per tab, not centered spinners.
- **Empty:** shared `ReportEmptyState` with icon + actionable text.
- **Error:** shared `ReportErrorState` with retry button + fallback "back to Overview" link. Specific error trimmed to 200 chars. Overview KPI-tiles fall back to `—` with tooltip after 10s timeout instead of infinite skeleton.
- **Silent failures avoided:** expandable timeline failure shows inline error + retry on that row; rest of table continues working.
- **401/403:** existing MSAL auto-refresh; 403 not surfaced (no role-gated reports in this spec).

---

## 8. Exports

### 8.1 Shared `ExportMenu` component

```tsx
<ExportMenu
  onCsvExport={() => exportMutation.mutate({format: 'csv'})}
  onExcelExport={() => exportMutation.mutate({format: 'xlsx'})}
  isExporting={exportMutation.isPending}
/>
```

### 8.2 Per-tab exports

| Tab | CSV | Excel |
|---|---|---|
| Overview | — | — (users export per tab) |
| Assets (Nu) | ✅ filtered rows | ✅ filtered rows |
| Assets (Historiek) | ✅ filtered events | ✅ filtered events |
| Rollouts | — | ✅ existing multi-sheet + new Type Breakdown sheet |
| Werkplekken | ✅ | ✅ |
| Leasing | ✅ | ✅ |
| Intune | — | — (Fase B) |

**Filenames:** `{tab}-{yyyy-MM-dd}.{ext}` (e.g. `assets-2026-04-23.xlsx`).

**Libraries:** Existing `OpenXml` for Excel (used by Rollout export); `System.Text` for CSV.

---

## 9. i18n

New strings added to `src/frontend/src/i18n/nl.json` and `en.json`:

- Tab labels: Overview, Assets, Rollouts, Werkplekken, Intune, Leasing.
- Toggle labels: Nu, Historiek, Per Dag, Per Dienst, Per Gebouw, Per Werkplek, Per Medewerker.
- Movement types: Onboarding, Offboarding, Swap, Overig.
- KPI labels, attention items, empty/error messages, export options.

Strings referencing "Hardware"/"Asset Geschiedenis"/"Swaps" are renamed to "Assets"/"Assets Historiek".

---

## 10. Accessibility & responsive

- All tabs keyboard-navigable (Tab/Shift+Tab, arrow keys in tab-nav).
- KPI tiles have `role="button"` + `aria-label`.
- Expandable rows have `aria-expanded` + `aria-controls`.
- Status chips include text content, not color-only.
- Responsive breakpoints (MUI default): desktop (≥lg) as mockups; tablet (md) 3-col KPI grid + single-row filters; mobile (xs/sm) 2-col KPI grid + collapsible filter bar + scrollable tabs + horizontal-scroll tables.

---

## 11. Migration & PR strategy

Recommended: 4 sequential PRs, each keeping the app functional.

1. **Backend foundation:** controller split (`OperationsReportsController` → `RolloutReportsController` + `AssetHistoryReportsController`), new endpoints (overview, employees, intune summary, asset timeline), new services. Old endpoints alias the new. No UI changes.
2. **Shared components:** `ExportMenu`, `IntuneBadge`, `LastSyncChip`, `ReportErrorState`, `ReportEmptyState`. No route changes.
3. **Reports shell + Overview + Assets tab:** new `/reports` shell with 6-tab nav. Overview tab (new), Assets tab (hybrid A+D, new). Rollouts/Werkplekken/Leasing tabs render their **existing** components (`RolloutTab`, `WorkplacesTab`, `LeasingTab`) unchanged. Intune tab placeholder added. Old routes (`?tab=hardware`, `?tab=swaps`) redirect to Assets. `HardwareTab` + `SwapsTab` files deleted.
4. **Remaining tabs + route cleanup:** Rollouts tab rebuilt (split into directory + type-classification + groupBy), Werkplekken tab rebuilt (toggle + employee view), Leasing tab polished. Redirects for `/workplaces/reports` and `?tab=serialnumbers`. Serienummers page created under `/operations/rollouts/serienummers`. Old `RolloutTab.tsx`, `WorkplacesTab.tsx`, `LeasingTab.tsx`, `SerialNumbersTab.tsx` files deleted/moved. Sidebar updated.

Per PR:
- Manual smoke-test checklist executed.
- i18n strings complete (nl + en).
- Dark-mode preserved on all new components.
- Backwards-compat redirects verified.

---

## 12. Manual smoke-test checklist

Run before merging each PR.

- [ ] Navigate to all 6 tabs, data loads without error.
- [ ] Old URL `/reports?tab=hardware` redirects to new.
- [ ] Old URL `/workplaces/reports` redirects to `/reports?tab=werkplekken`.
- [ ] Old URL `/reports?tab=serialnumbers` redirects to `/operations/rollouts/serienummers`.
- [ ] Filters persist in URL; copy-paste URL in new tab reproduces state.
- [ ] Assets tab: Nu/Historiek toggle works, expandable timeline loads per asset.
- [ ] Assets tab: status stat-card click applies filter.
- [ ] Rollouts tab: groupBy toggle reorganizes correctly (day/service/building).
- [ ] Rollouts tab: type-filter + type-KPI row work.
- [ ] Werkplekken tab: Per Werkplek / Per Medewerker toggle works; employee expansion shows timeline.
- [ ] Exports deliver valid CSV and Excel with filtered data.
- [ ] Dark-mode appearance preserved on new components.
- [ ] NL + EN translations complete (switch language, verify no missing keys).
- [ ] Refresh button (per tab) invalidates relevant queries only.
- [ ] Error state: simulate API 500, error UI + retry work.
- [ ] Empty state: filter producing no results shows `ReportEmptyState`.

---

## 13. Out of scope (captured for follow-up specs)

### Fase B — Intune Deep Analytics

- OS-version distribution
- Hardware-age analysis per model
- Compliance trend over time
- Enrollment funnel (autopilot → enrolled → compliant)
- Djoppie-vs-Intune reconciliation (unenrolled / missing)
- Primary-user mismatch detection
- Sync health monitoring

### Fase C — Requests & Swaps

- `RequestsDashboardPage` onboarding/offboarding workflow implementation
- Requests history integration into Assets history events
- `LaptopSwapPage` history integration into Rollouts tab or Assets history
- Potential removal of `/operations/swaps/history` and `/operations/requests/reports` once fully integrated

---

## 14. Key decisions (audit trail)

| Decision | Choice | Rationale |
|---|---|---|
| Reports consolidation scope | 4 hoofdsecties → grew to 6 (incl. Overview + Intune + Medewerkers-as-subview) | User approved 6-tab shell including Overview landing, Intune placeholder, Werkplekken with employee toggle |
| Landing experience | Overview dashboard + tabs | Professional, modern, executive-friendly; click-through to detail |
| Assets tab pattern | Hybrid A+D (top-level toggle + expandable rows in Nu) | Combines broad queries (Historiek) with focused per-asset drill-down (Nu expansion) |
| Intune placement | Own tab + KPI tile in Overview + columns in Assets | Centralized deep analytics + contextual presence everywhere |
| Medewerkers view | Sub-view of Werkplekken (not 7th tab) | Keeps structure clean; conceptually workplace ↔ employee are coupled |
| Rollouts grouping | Toggle day/service/building + type classification | Management can see "dienst X: 4 onboarding, 1 offboarding"; field team keeps day-based default |
| Export formats | CSV + Excel uniform per tab via shared `ExportMenu` | Consistency + predictability |
| Serienummers | Moved out of Reports to `/operations/rollouts/serienummers` | Operational tool, not a report |
| Frontend tests | Not added in this spec | No existing test setup; out of scope |

---

## 15. Approval

Design approved section-by-section on 2026-04-23. Proceeding to implementation plan via `writing-plans` skill.

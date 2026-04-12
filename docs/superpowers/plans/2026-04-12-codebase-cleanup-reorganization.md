# Codebase Cleanup & Herorganisatie - Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Clean up all dead code, split monoliths, and reorganize the entire Djoppie Inventory codebase by feature domain (Inventory, Workplaces, Operations, Devices, Reports, Admin, Dashboard) with consistent API routes and navigation.

**Architecture:** Feature-based vertical slicing. Each phase handles one feature domain end-to-end: backend controllers + services → API routes → frontend pages + components + hooks → frontend routes. Phase 0 removes all dead code first. Phase 7-8 handle cross-cutting concerns and documentation.

**Tech Stack:** ASP.NET Core 8 (C#), React 19 + TypeScript + Vite, MUI, TanStack Query, MSAL React

**Spec:** `docs/superpowers/specs/2026-04-12-codebase-cleanup-reorganization-design.md`

---

## Phase Overview

This plan is split into phases. Each phase is independently executable and results in a buildable, working application.

| Phase | Name | Risk | Key Changes |
|-------|------|------|-------------|
| 0 | Dead Code Cleanup | Low | Remove unused files, docs, components |
| 1 | Inventory | Medium | Move 5 controllers + pages, update routes |
| 2 | Workplaces | High | Split PhysicalWorkplacesController (1816 lines) |
| 3 | Operations | Medium | Move rollout controllers, requests, swaps |
| 4 | Devices | High | Split IntuneController (979) + IntuneService (2054) |
| 5 | Reports | High | Split ReportsController (2052 lines, ~162 methods) |
| 6 | Admin | Medium | Move 7 controllers, RBAC prep |
| 7 | Dashboard & Cross-cutting | Medium | Sidebar refactor, navigation groups |
| 8 | Documentation | Low | CLAUDE.md rewrite, feature docs |

---

## Task 1: Fase 0 - Backend Dead Code Cleanup

**Files:**
- Delete: `src/backend/DjoppieInventory.API/Controllers/LeaseContractsController.cs`
- Delete: `src/backend/DjoppieInventory.Core/Entities/LeaseContract.cs`
- Delete: `src/backend/DjoppieInventory.Core/Interfaces/ILeaseContractRepository.cs`
- Delete: `src/backend/DjoppieInventory.Core/DTOs/LeaseContractDtos.cs`
- Delete: `src/backend/DjoppieInventory.Infrastructure/Repositories/LeaseContractRepository.cs`
- Delete: `src/backend/DjoppieInventory.Infrastructure/Services/AssetPlanSyncService.cs`
- Delete: `src/backend/DjoppieInventory.Tests/Fixtures/RolloutTestFixture.cs`
- Delete: `src/backend/DjoppieInventory.Tests/Fixtures/RolloutTestFixtureTests.cs`
- Delete: `src/backend/DjoppieInventory.Tests/Integration/RolloutWorkplacesControllerTests.cs`
- Delete: `src/backend/DjoppieInventory.Tests/Services/AssetMovementServiceTests.cs`
- Delete: `src/backend/DjoppieInventory.Tests/Services/RolloutEdgeCaseTests.cs`
- Delete: `src/backend/DjoppieInventory.Tests/Services/WorkplaceAssetAssignmentServiceTests.cs`
- Delete: `src/backend/DjoppieInventory.Tests/TEST-SUITE-SUMMARY.md`
- Delete: `src/backend/DjoppieInventory.Tests/README.md`
- Modify: `src/backend/DjoppieInventory.API/Extensions/ServiceCollectionExtensions.cs` (remove lease + AssetPlanSync registrations)
- Modify: `src/backend/DjoppieInventory.Infrastructure/Data/ApplicationDbContext.cs` (remove LeaseContract DbSet - keep table for migration history)
- Modify: `src/backend/DjoppieInventory.Tests/DjoppieInventory.Tests.csproj` (remove Compile Remove entries)

- [ ] **Step 1: Delete LeaseContract files**

Delete these 5 files (entity, controller, interface, repository, DTOs):

```bash
cd C:\Djoppie\Djoppie-Inventory\.claude\worktrees\kind-liskov
git rm src/backend/DjoppieInventory.API/Controllers/LeaseContractsController.cs
git rm src/backend/DjoppieInventory.Core/Entities/LeaseContract.cs
git rm src/backend/DjoppieInventory.Core/Interfaces/ILeaseContractRepository.cs
git rm src/backend/DjoppieInventory.Core/DTOs/LeaseContractDtos.cs
git rm src/backend/DjoppieInventory.Infrastructure/Repositories/LeaseContractRepository.cs
```

- [ ] **Step 2: Remove LeaseContract DI registration**

In `src/backend/DjoppieInventory.API/Extensions/ServiceCollectionExtensions.cs`, remove line 29:

```csharp
services.AddScoped<ILeaseContractRepository, LeaseContractRepository>();
```

- [ ] **Step 3: Remove AssetPlanSyncService**

Delete the file and remove its DI registration:

```bash
git rm src/backend/DjoppieInventory.Infrastructure/Services/AssetPlanSyncService.cs
```

In `ServiceCollectionExtensions.cs`, remove line 48:

```csharp
services.AddScoped<AssetPlanSyncService>();
```

Also search for `AssetPlanSyncService` usage in `RolloutDaysController.cs` and `RolloutWorkplacesController.cs` and remove those constructor injections and method calls.

- [ ] **Step 4: Remove LeaseContract from ApplicationDbContext**

In `src/backend/DjoppieInventory.Infrastructure/Data/ApplicationDbContext.cs`, remove the `DbSet<LeaseContract>` property. Do NOT remove any migration files or the LeaseContracts table configuration in `OnModelCreating` - EF Core needs migration history intact.

- [ ] **Step 5: Delete disabled test files**

```bash
git rm src/backend/DjoppieInventory.Tests/Fixtures/RolloutTestFixture.cs
git rm src/backend/DjoppieInventory.Tests/Fixtures/RolloutTestFixtureTests.cs
git rm src/backend/DjoppieInventory.Tests/Integration/RolloutWorkplacesControllerTests.cs
git rm src/backend/DjoppieInventory.Tests/Services/AssetMovementServiceTests.cs
git rm src/backend/DjoppieInventory.Tests/Services/RolloutEdgeCaseTests.cs
git rm src/backend/DjoppieInventory.Tests/Services/WorkplaceAssetAssignmentServiceTests.cs
git rm src/backend/DjoppieInventory.Tests/TEST-SUITE-SUMMARY.md
git rm src/backend/DjoppieInventory.Tests/README.md
```

- [ ] **Step 6: Clean up test project file**

In `src/backend/DjoppieInventory.Tests/DjoppieInventory.Tests.csproj`, remove the entire `<ItemGroup>` block with `<Compile Remove=...>` entries (lines 24-33 approximately).

- [ ] **Step 7: Fix any remaining LeaseContract references**

Search the entire backend for remaining `LeaseContract` references (excluding migrations):

```bash
cd src/backend
grep -r "LeaseContract" --include="*.cs" -l | grep -v Migrations
```

Fix each reference found (likely in `ReportService.cs` and `Asset.cs` navigation properties). For `ReportService.cs`, remove lease-related report methods. For entity navigation properties, remove `LeaseContract` references.

- [ ] **Step 8: Build verification**

```bash
cd src/backend
dotnet build
```

Expected: Build succeeds with 0 errors.

- [ ] **Step 9: Run tests**

```bash
cd src/backend/DjoppieInventory.Tests
dotnet test
```

Expected: All remaining tests pass (PagedResultDtoTests, InputValidatorTests, ODataSanitizerTests).

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "chore: remove dead backend code (LeaseContracts, AssetPlanSync, disabled tests)"
```

---

## Task 2: Fase 0 - Frontend Dead Code Cleanup

**Files:**
- Delete: All 6 files in `src/frontend/src/components/widgets/`
- Delete: `src/frontend/src/components/admin/AdminNavigation.tsx`
- Delete: `src/frontend/src/components/admin/AdminSection.tsx`
- Delete: `src/frontend/src/components/admin/OrganizationTab.tsx`
- Delete: `src/frontend/src/components/common/AnimatedStatusChip.tsx`
- Delete: `src/frontend/src/components/common/DeviceAutocomplete.tsx`
- Delete: `src/frontend/src/components/common/NeumorphicButton.tsx`
- Delete: `src/frontend/src/components/dashboard/AssetKPIs.tsx`
- Delete: `src/frontend/src/components/physicalWorkplaces/AnimatedStatChip.tsx`
- Delete: `src/frontend/src/components/physicalWorkplaces/PhysicalWorkplaceSelector.tsx`
- Delete: `src/frontend/src/components/assets/LeaseContractCard.tsx`
- Delete: `src/frontend/src/components/assets/LeaseContractDialog.tsx`
- Delete: `src/frontend/src/api/leaseContracts.api.ts`
- Modify: `src/frontend/src/components/common/index.ts` (remove unused exports)
- Modify: `src/frontend/src/api/organization.api.ts` (remove createNodeId, parseNodeId)
- Modify: `src/frontend/src/types/deployment.types.ts` (remove unused interfaces)

- [ ] **Step 1: Delete widget components**

```bash
cd C:\Djoppie\Djoppie-Inventory\.claude\worktrees\kind-liskov
git rm -r src/frontend/src/components/widgets/
```

- [ ] **Step 2: Delete unused admin components**

```bash
git rm src/frontend/src/components/admin/AdminNavigation.tsx
git rm src/frontend/src/components/admin/AdminSection.tsx
git rm src/frontend/src/components/admin/OrganizationTab.tsx
```

- [ ] **Step 3: Delete unused common components**

```bash
git rm src/frontend/src/components/common/AnimatedStatusChip.tsx
git rm src/frontend/src/components/common/DeviceAutocomplete.tsx
git rm src/frontend/src/components/common/NeumorphicButton.tsx
```

- [ ] **Step 4: Delete unused dashboard and workplace components**

```bash
git rm src/frontend/src/components/dashboard/AssetKPIs.tsx
git rm src/frontend/src/components/physicalWorkplaces/AnimatedStatChip.tsx
git rm src/frontend/src/components/physicalWorkplaces/PhysicalWorkplaceSelector.tsx
```

- [ ] **Step 5: Delete LeaseContract frontend files**

```bash
git rm src/frontend/src/components/assets/LeaseContractCard.tsx
git rm src/frontend/src/components/assets/LeaseContractDialog.tsx
git rm src/frontend/src/api/leaseContracts.api.ts
```

- [ ] **Step 6: Clean up common/index.ts exports**

In `src/frontend/src/components/common/index.ts`, remove exports for deleted components: `AnimatedStatusChip`, `DeviceAutocomplete`, `NeumorphicButton`.

- [ ] **Step 7: Remove orphaned API functions**

In `src/frontend/src/api/organization.api.ts`, remove the `createNodeId()` and `parseNodeId()` functions.

- [ ] **Step 8: Remove unused type definitions**

In `src/frontend/src/types/deployment.types.ts`, remove the unused interfaces: `DeploymentAssetInfo`, `DeploymentOwnerInfo`, `DeploymentWorkplaceInfo` (only if they are not referenced by other active types).

- [ ] **Step 9: Search for remaining references to deleted components**

```bash
cd src/frontend
grep -r "LeaseContract\|AnimatedStatusChip\|DeviceAutocomplete\|NeumorphicButton\|AssetKPIs\|PhysicalWorkplaceSelector\|widgets/" --include="*.ts" --include="*.tsx" -l src/
```

Fix any remaining imports/references found.

- [ ] **Step 10: Build verification**

```bash
cd src/frontend
npm run build
```

Expected: Build succeeds with 0 errors.

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -m "chore: remove dead frontend code (widgets, unused components, LeaseContract UI)"
```

---

## Task 3: Fase 0 - Documentation Cleanup

**Files:**
- Delete: `docs/_archive/` (entire directory, 46 files)
- Delete: `REPORTS-REDESIGN-IMPLEMENTATION.md` (root)
- Delete: `REPORTS-REDESIGN-SUMMARY.md` (root)
- Delete: `MIGRATION-GUIDE.md` (root)

- [ ] **Step 1: Delete archived docs**

```bash
cd C:\Djoppie\Djoppie-Inventory\.claude\worktrees\kind-liskov
git rm -r docs/_archive/
```

- [ ] **Step 2: Delete outdated root docs**

```bash
git rm REPORTS-REDESIGN-IMPLEMENTATION.md
git rm REPORTS-REDESIGN-SUMMARY.md
git rm MIGRATION-GUIDE.md
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "chore: remove archived docs and outdated root documentation"
```

---

## Task 4: Fase 1 - Backend Inventory Reorganization

**Files:**
- Create: `src/backend/DjoppieInventory.API/Controllers/Inventory/` (directory)
- Move: `AssetsController.cs` → `Controllers/Inventory/AssetsController.cs`
- Move: `AssetTemplatesController.cs` → `Controllers/Inventory/AssetTemplatesController.cs`
- Move: `AssetEventsController.cs` → `Controllers/Inventory/AssetEventsController.cs`
- Move: `CsvImportController.cs` → `Controllers/Inventory/CsvImportController.cs`
- Move: `QRCodeController.cs` → `Controllers/Inventory/QRCodeController.cs`

- [ ] **Step 1: Create Inventory controller directory and move files**

```bash
cd C:\Djoppie\Djoppie-Inventory\.claude\worktrees\kind-liskov\src\backend\DjoppieInventory.API\Controllers
mkdir Inventory
git mv AssetsController.cs Inventory/
git mv AssetTemplatesController.cs Inventory/
git mv AssetEventsController.cs Inventory/
git mv CsvImportController.cs Inventory/
git mv QRCodeController.cs Inventory/
```

- [ ] **Step 2: Update namespaces in moved controllers**

In each of the 5 moved files, update the namespace from:
```csharp
namespace DjoppieInventory.API.Controllers;
```
to:
```csharp
namespace DjoppieInventory.API.Controllers.Inventory;
```

- [ ] **Step 3: Update route attributes**

Update `[Route]` attributes in each controller:

- `AssetsController.cs`: `[Route("api/[controller]")]` → `[Route("api/inventory/assets")]`
- `AssetTemplatesController.cs`: `[Route("api/[controller]")]` → `[Route("api/inventory/templates")]`
- `AssetEventsController.cs`: `[Route("api/[controller]")]` → `[Route("api/inventory/events")]`
- `CsvImportController.cs`: `[Route("api/[controller]")]` → `[Route("api/inventory/import")]`
- `QRCodeController.cs`: `[Route("api/[controller]")]` → `[Route("api/inventory/qrcode")]`

- [ ] **Step 4: Build verification**

```bash
cd src/backend
dotnet build
```

Expected: Build succeeds.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "refactor: move inventory controllers to Controllers/Inventory/ with new API routes"
```

---

## Task 5: Fase 1 - Frontend Inventory Reorganization

**Files:**
- Create: `src/frontend/src/pages/inventory/` (directory)
- Move: Pages related to inventory into `pages/inventory/`
- Create: `src/frontend/src/components/inventory/` (directory)
- Move: Asset components into `components/inventory/`
- Modify: `src/frontend/src/constants/routes.ts` (update route paths)
- Modify: `src/frontend/src/App.tsx` (update imports and routes)
- Modify: `src/frontend/src/api/assets.api.ts` (update API base URLs)
- Modify: `src/frontend/src/api/assetEvents.api.ts` (update API base URLs)
- Modify: `src/frontend/src/api/csvImport.api.ts` (update API base URLs)
- Modify: `src/frontend/src/api/templates.api.ts` (update API base URLs)

- [ ] **Step 1: Create directory structure**

```bash
cd C:\Djoppie\Djoppie-Inventory\.claude\worktrees\kind-liskov\src\frontend\src
mkdir -p pages/inventory
mkdir -p components/inventory
```

- [ ] **Step 2: Move inventory pages**

```bash
git mv pages/DeviceManagementPage.tsx pages/inventory/AssetsPage.tsx
git mv pages/AssetDetailPage.tsx pages/inventory/
git mv pages/AddAssetPage.tsx pages/inventory/
git mv pages/EditAssetPage.tsx pages/inventory/
git mv pages/BulkCreateAssetPage.tsx pages/inventory/
git mv pages/AssetTemplatesPage.tsx pages/inventory/
git mv pages/ScanPage.tsx pages/inventory/
```

- [ ] **Step 3: Move inventory components**

```bash
git mv components/assets/* components/inventory/
rmdir components/assets
git mv components/import/CsvImportDialog.tsx components/inventory/
rmdir components/import
git mv components/export/ExportDialog.tsx components/inventory/
rmdir components/export
```

- [ ] **Step 4: Update API base URLs**

In each API file, update the endpoint paths:

`src/frontend/src/api/assets.api.ts`: Change all `/assets` calls to `/inventory/assets`
`src/frontend/src/api/assetEvents.api.ts`: Change all `/assetevents` calls to `/inventory/events`
`src/frontend/src/api/csvImport.api.ts`: Change all `/csvimport` calls to `/inventory/import`
`src/frontend/src/api/templates.api.ts`: Change all `/assettemplates` calls to `/inventory/templates`

For QR code endpoints referenced anywhere, change `/qrcode` to `/inventory/qrcode`.

- [ ] **Step 5: Update routes.ts**

Update `src/frontend/src/constants/routes.ts` with new inventory paths:

```typescript
// Inventory
INVENTORY_ASSETS: '/inventory/assets',
ASSETS_NEW: '/inventory/assets/new',
ASSETS_BULK_NEW: '/inventory/assets/bulk-create',
ASSET_DETAIL: '/inventory/assets/:id',
ASSET_EDIT: '/inventory/assets/:id/edit',
ASSET_SOFTWARE: '/inventory/assets/:id/software',
ASSET_INTUNE: '/inventory/assets/:id/intune',
TEMPLATES: '/inventory/templates',
SCAN: '/inventory/scan',
```

Update `buildRoute` helpers accordingly.

- [ ] **Step 6: Update App.tsx**

Update all lazy imports to point to new `pages/inventory/` paths. Update all `<Route>` elements to use new `ROUTES.*` constants.

- [ ] **Step 7: Update all internal navigation references**

Search for old route paths (`/assets/`, `/devices/new`, `/templates`) in all components and hooks. Update `useNavigate()` calls and `<Link>` components.

```bash
grep -r "'/assets" --include="*.ts" --include="*.tsx" src/ | grep -v node_modules
grep -r "'/devices/new\|'/devices/bulk" --include="*.ts" --include="*.tsx" src/ | grep -v node_modules
grep -r "'/templates" --include="*.ts" --include="*.tsx" src/ | grep -v node_modules
```

- [ ] **Step 8: Build verification**

```bash
cd src/frontend
npm run build
```

Expected: Build succeeds.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "refactor: reorganize inventory pages/components with /inventory/ routes"
```

---

## Task 6: Fase 2 - Backend Workplaces Reorganization

**Files:**
- Create: `src/backend/DjoppieInventory.API/Controllers/Workplaces/` (directory)
- Move + Split: `PhysicalWorkplacesController.cs` (1816 lines) → 3 controllers in `Controllers/Workplaces/`

- [ ] **Step 1: Create Workplaces controller directory**

```bash
mkdir src/backend/DjoppieInventory.API/Controllers/Workplaces
```

- [ ] **Step 2: Analyze PhysicalWorkplacesController for split boundaries**

Read `PhysicalWorkplacesController.cs` and identify which methods belong to:
1. **WorkplacesController** - CRUD: Create, Read, Update, Delete, GetAll, GetById
2. **WorkplaceSearchController** - Search, filter, bulk operations
3. **WorkplaceAssetsController** - Equipment slot management, device assignment

- [ ] **Step 3: Create WorkplacesController.cs with CRUD methods**

Create `Controllers/Workplaces/WorkplacesController.cs` with:
- Namespace: `DjoppieInventory.API.Controllers.Workplaces`
- Route: `[Route("api/workplaces")]`
- Move CRUD endpoints from PhysicalWorkplacesController

- [ ] **Step 4: Create WorkplaceSearchController.cs**

Create `Controllers/Workplaces/WorkplaceSearchController.cs` with:
- Route: `[Route("api/workplaces")]`
- Move search/filter/bulk endpoints

- [ ] **Step 5: Create WorkplaceAssetsController.cs**

Create `Controllers/Workplaces/WorkplaceAssetsController.cs` with:
- Route: `[Route("api/workplaces")]`
- Move equipment/asset assignment endpoints

- [ ] **Step 6: Delete original PhysicalWorkplacesController.cs**

```bash
git rm src/backend/DjoppieInventory.API/Controllers/PhysicalWorkplacesController.cs
```

- [ ] **Step 7: Build verification**

```bash
cd src/backend
dotnet build
```

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "refactor: split PhysicalWorkplacesController into 3 focused controllers"
```

---

## Task 7: Fase 2 - Frontend Workplaces Reorganization

**Files:**
- Create: `src/frontend/src/pages/workplaces/` (directory)
- Create: `src/frontend/src/components/workplaces/` (directory)
- Move: Workplace pages and components
- Modify: API URLs, routes, imports

- [ ] **Step 1: Create directory structure and move files**

```bash
cd src/frontend/src
mkdir -p pages/workplaces
mkdir -p components/workplaces
git mv pages/PhysicalWorkplacesPage.tsx pages/workplaces/WorkplacesPage.tsx
git mv pages/WorkplaceDetailPage.tsx pages/workplaces/
git mv pages/WorkplaceReportsPage.tsx pages/workplaces/
git mv components/physicalWorkplaces/* components/workplaces/
rmdir components/physicalWorkplaces
```

- [ ] **Step 2: Update API URLs**

In `src/frontend/src/api/physicalWorkplaces.api.ts`: Change all `/physicalworkplaces` to `/workplaces`.

- [ ] **Step 3: Update routes.ts and App.tsx**

Routes stay at `/workplaces` and `/workplaces/:id` (no change needed for URL paths, only import paths in App.tsx).

- [ ] **Step 4: Update all imports referencing old paths**

Search and fix all imports from `components/physicalWorkplaces/` → `components/workplaces/`.

- [ ] **Step 5: Build verification and commit**

```bash
cd src/frontend && npm run build
git add -A
git commit -m "refactor: reorganize workplaces pages/components, rename physicalWorkplaces"
```

---

## Task 8: Fase 3 - Backend Operations Reorganization

**Files:**
- Create: `src/backend/DjoppieInventory.API/Controllers/Operations/` (directory)
- Move: `Controllers/Rollout/` → `Controllers/Operations/Rollout/`
- Move: `AssetRequestsController.cs` → `Controllers/Operations/RequestsController.cs`
- Move: `DeploymentController.cs` → `Controllers/Operations/DeploymentController.cs`

- [ ] **Step 1: Create Operations directory and move files**

```bash
cd src/backend/DjoppieInventory.API/Controllers
mkdir Operations
git mv Rollout Operations/Rollout
git mv AssetRequestsController.cs Operations/RequestsController.cs
git mv DeploymentController.cs Operations/
```

- [ ] **Step 2: Update namespaces**

All moved files: `namespace DjoppieInventory.API.Controllers.Operations;`
Rollout files: `namespace DjoppieInventory.API.Controllers.Operations.Rollout;`

- [ ] **Step 3: Update route attributes**

- Rollout controllers: `[Route("api/rollout/...")]` → `[Route("api/operations/rollouts/...")]`
- RequestsController: `[Route("api/[controller]")]` → `[Route("api/operations/requests")]`
- DeploymentController: `[Route("api/[controller]")]` → `[Route("api/operations/deployments")]`

- [ ] **Step 4: Build verification and commit**

```bash
cd src/backend && dotnet build
git add -A
git commit -m "refactor: move operations controllers (rollout, requests, deployment) under Controllers/Operations/"
```

---

## Task 9: Fase 3 - Frontend Operations Reorganization

**Files:**
- Create: `src/frontend/src/pages/operations/` (with rollouts/, requests/, swaps/ subdirs)
- Move: Rollout, request, swap pages
- Create: `src/frontend/src/components/operations/` (with rollout/, requests/, swaps/ subdirs)
- Move: Rollout components
- Modify: API URLs, routes, imports

- [ ] **Step 1: Create directory structure**

```bash
cd src/frontend/src
mkdir -p pages/operations/rollouts
mkdir -p pages/operations/requests
mkdir -p pages/operations/swaps
mkdir -p components/operations/rollout
mkdir -p components/operations/requests
mkdir -p components/operations/swaps
```

- [ ] **Step 2: Move rollout pages**

```bash
git mv pages/RolloutListPage.tsx pages/operations/rollouts/
git mv pages/RolloutPlannerPage.tsx pages/operations/rollouts/
git mv pages/RolloutPlannerPage.module.css pages/operations/rollouts/
git mv pages/RolloutExecutionPage.tsx pages/operations/rollouts/
git mv pages/RolloutReportPage.tsx pages/operations/rollouts/
git mv pages/RolloutDayDetailPage.tsx pages/operations/rollouts/
```

- [ ] **Step 3: Move request and swap pages**

```bash
git mv pages/RequestsDashboardPage.tsx pages/operations/requests/
git mv pages/RequestsReportsPage.tsx pages/operations/requests/
git mv pages/LaptopSwapPage.tsx pages/operations/swaps/
git mv pages/DeploymentHistoryPage.tsx pages/operations/swaps/
```

- [ ] **Step 4: Move rollout components**

```bash
git mv components/rollout/* components/operations/rollout/
rmdir components/rollout
```

- [ ] **Step 5: Update API URLs**

- `rollout.api.ts`: `/rollout/` → `/operations/rollouts/`
- `assetRequests.api.ts`: `/assetrequests` → `/operations/requests`
- `deployment.api.ts`: `/deployment` → `/operations/deployments`

- [ ] **Step 6: Update routes.ts with operations paths**

```typescript
// Operations - Rollouts
ROLLOUTS: '/operations/rollouts',
ROLLOUTS_NEW: '/operations/rollouts/new',
ROLLOUT_EDIT: '/operations/rollouts/:id',
ROLLOUT_EXECUTE: '/operations/rollouts/:id/execute',
ROLLOUT_REPORT: '/operations/rollouts/:id/report',
ROLLOUT_DAY_DETAIL: '/operations/rollouts/:id/days/:dayId',
ROLLOUT_DAY_EDIT: '/operations/rollouts/:id/days/:dayId/edit',

// Operations - Requests
REQUESTS: '/operations/requests',
REQUESTS_ONBOARDING: '/operations/requests/onboarding',
REQUESTS_OFFBOARDING: '/operations/requests/offboarding',
REQUESTS_REPORTS: '/operations/requests/reports',

// Operations - Swaps
LAPTOP_SWAP: '/operations/swaps',
DEPLOYMENT_HISTORY: '/operations/swaps/history',
```

- [ ] **Step 7: Update App.tsx imports and routes**

- [ ] **Step 8: Update all internal navigation references**

- [ ] **Step 9: Build verification and commit**

```bash
cd src/frontend && npm run build
git add -A
git commit -m "refactor: reorganize operations pages/components with /operations/ routes"
```

---

## Task 10: Fase 4 - Backend Devices Reorganization + IntuneController Split

**Files:**
- Create: `src/backend/DjoppieInventory.API/Controllers/Devices/` (directory)
- Split: `IntuneController.cs` (979 lines) → `IntuneDevicesController.cs`, `IntuneSyncController.cs`, `IntuneHealthController.cs`
- Move: existing Intune-related controllers into `Controllers/Devices/`

- [ ] **Step 1: Create Devices directory**

```bash
mkdir src/backend/DjoppieInventory.API/Controllers/Devices
```

- [ ] **Step 2: Analyze IntuneController for split boundaries**

Read `IntuneController.cs` and identify method groups:
1. **IntuneDevicesController** - Device CRUD, lookup, search, import
2. **IntuneSyncController** - Sync operations, batch sync
3. **IntuneHealthController** - Health status, configuration, compliance

- [ ] **Step 3: Create 3 split controllers**

Create each controller in `Controllers/Devices/` with:
- Namespace: `DjoppieInventory.API.Controllers.Devices`
- Routes: `[Route("api/devices/intune")]`, `[Route("api/devices/intune/sync")]`, `[Route("api/devices/intune/health")]`

- [ ] **Step 4: Delete original IntuneController.cs**

- [ ] **Step 5: Split IntuneService.cs (2054 lines)**

Analyze and split `IntuneService.cs` into:
- `IntuneDeviceService.cs` - Device operations
- `IntuneHealthService.cs` - Health queries
- Keep existing `IntuneSyncService.cs`

Create corresponding interfaces and update DI registrations.

- [ ] **Step 6: Build verification and commit**

```bash
cd src/backend && dotnet build
git add -A
git commit -m "refactor: split IntuneController and IntuneService into focused domain services"
```

---

## Task 11: Fase 4 - Frontend Devices Reorganization

**Files:**
- Create: `src/frontend/src/pages/devices/` (directory)
- Create: `src/frontend/src/components/devices/` (with intune/, licenses/, software/ subdirs)
- Move: Device-related pages and components
- Modify: API URLs, routes

- [ ] **Step 1: Create directories and move pages**

```bash
cd src/frontend/src
mkdir -p pages/devices
mkdir -p components/devices/intune
mkdir -p components/devices/licenses
mkdir -p components/devices/software
git mv pages/IntuneDeviceDashboardPage.tsx pages/devices/
git mv pages/InstalledSoftwarePage.tsx pages/devices/
git mv pages/AutopilotDevicesPage.tsx pages/devices/
git mv pages/AutopilotTimelinePage.tsx pages/devices/
git mv pages/AssetIntunePage.tsx pages/devices/
```

- [ ] **Step 2: Move device components**

```bash
git mv components/intune-dashboard/* components/devices/intune/
rmdir components/intune-dashboard
git mv components/intune/* components/devices/intune/
rmdir components/intune
```

- [ ] **Step 3: Update API URLs**

`intune.api.ts`: `/intune/` → `/devices/intune/`
`software.api.ts`: Update if needed

- [ ] **Step 4: Update routes.ts**

```typescript
// Devices
DEVICES: '/devices',
INTUNE_DASHBOARD: '/devices/intune',
AUTOPILOT_DEVICES: '/devices/autopilot',
AUTOPILOT_TIMELINE: '/devices/autopilot/timeline/:serialNumber',
```

- [ ] **Step 5: Build verification and commit**

```bash
cd src/frontend && npm run build
git add -A
git commit -m "refactor: reorganize devices pages/components with /devices/ routes"
```

---

## Task 12: Fase 5 - Backend Reports Split

**Files:**
- Create: `src/backend/DjoppieInventory.API/Controllers/Reports/` (directory)
- Split: `ReportsController.cs` (2052 lines) → 5 controllers
- Split: `ReportService.cs` → 4 domain services

- [ ] **Step 1: Create Reports directory**

```bash
mkdir src/backend/DjoppieInventory.API/Controllers/Reports
```

- [ ] **Step 2: Analyze ReportsController for split boundaries**

Read the full `ReportsController.cs` and categorize all ~162 methods into:
1. **InventoryReportsController** - Asset statistics, type distributions
2. **DeviceReportsController** - Hardware reports, Intune data
3. **WorkplaceReportsController** - Workplace statistics
4. **OperationsReportsController** - Rollout reports, swap history
5. **LeaseReportsController** - Lease/warranty overviews

- [ ] **Step 3: Create 5 report controllers**

Each with `[Route("api/reports/...")]` and namespace `DjoppieInventory.API.Controllers.Reports`.

- [ ] **Step 4: Split ReportService.cs accordingly**

Create: `InventoryReportService.cs`, `DeviceReportService.cs`, `WorkplaceReportService.cs`, `OperationsReportService.cs`
With corresponding interfaces. Update DI registrations.

- [ ] **Step 5: Delete originals, build, commit**

```bash
cd src/backend && dotnet build
git add -A
git commit -m "refactor: split ReportsController (2052 lines) into 5 domain-specific controllers"
```

---

## Task 13: Fase 5 - Frontend Reports Reorganization

- [ ] **Step 1: Move reports page**

```bash
mkdir -p src/frontend/src/pages/reports
git mv src/frontend/src/pages/ReportsPage.tsx src/frontend/src/pages/reports/
```

- [ ] **Step 2: Update API URLs in reports.api.ts**

Update endpoints to match new backend routes.

- [ ] **Step 3: Update routes, App.tsx, build, commit**

---

## Task 14: Fase 6 - Backend Admin Reorganization

**Files:**
- Create: `src/backend/DjoppieInventory.API/Controllers/Admin/` (directory)
- Move: `OrganizationController.cs`, `SectorsController.cs`, `ServicesController.cs`, `BuildingsController.cs`, `CategoriesController.cs`, `AssetTypesController.cs`, `EmployeesController.cs` → `Controllers/Admin/`

- [ ] **Step 1: Create Admin directory and move controllers**

```bash
cd src/backend/DjoppieInventory.API/Controllers
mkdir Admin
git mv OrganizationController.cs Admin/
git mv SectorsController.cs Admin/
git mv ServicesController.cs Admin/
git mv BuildingsController.cs Admin/
git mv CategoriesController.cs Admin/
git mv AssetTypesController.cs Admin/
git mv EmployeesController.cs Admin/
```

- [ ] **Step 2: Update namespaces**

All moved files: `namespace DjoppieInventory.API.Controllers.Admin;`

- [ ] **Step 3: Update route attributes**

Most already use `[Route("api/admin/[controller]")]` - verify and update:
- `OrganizationController`: `[Route("api/organization")]` → `[Route("api/admin/organization")]`

- [ ] **Step 4: Build verification and commit**

```bash
cd src/backend && dotnet build
git add -A
git commit -m "refactor: move admin controllers to Controllers/Admin/"
```

---

## Task 15: Fase 6 - Frontend Admin Reorganization

- [ ] **Step 1: Move admin pages**

```bash
mkdir -p src/frontend/src/pages/admin
git mv src/frontend/src/pages/AdminAssetsPage.tsx src/frontend/src/pages/admin/
git mv src/frontend/src/pages/AdminOrganisationPage.tsx src/frontend/src/pages/admin/
git mv src/frontend/src/pages/AdminLocationsPage.tsx src/frontend/src/pages/admin/
```

- [ ] **Step 2: Update API URLs in admin.api.ts**

Update `/organization` → `/admin/organization` if not already.

- [ ] **Step 3: Update routes, App.tsx, build, commit**

---

## Task 16: Fase 7 - Backend Dashboard & Cross-cutting

**Files:**
- Create: `src/backend/DjoppieInventory.API/Controllers/Dashboard/` (directory)
- Create: `src/backend/DjoppieInventory.API/Controllers/User/` (directory)
- Create: `src/backend/DjoppieInventory.API/Controllers/Graph/` (directory)
- Move: `UserController.cs` → `Controllers/User/`
- Move: `GraphController.cs` → `Controllers/Graph/`

- [ ] **Step 1: Create directories and move files**

```bash
cd src/backend/DjoppieInventory.API/Controllers
mkdir Dashboard User Graph
git mv UserController.cs User/
git mv GraphController.cs Graph/
```

- [ ] **Step 2: Update namespaces**

- [ ] **Step 3: Build verification and commit**

```bash
cd src/backend && dotnet build
git add -A
git commit -m "refactor: move User and Graph controllers to feature directories"
```

---

## Task 17: Fase 7 - Frontend Dashboard & Sidebar Reorganization

**Files:**
- Create: `src/frontend/src/pages/dashboard/` (directory)
- Move: `DashboardOverviewPage.tsx` → `pages/dashboard/`
- Modify: `src/frontend/src/components/layout/Sidebar.tsx` (refactor into feature groups)
- Create: `src/frontend/src/components/layout/NavigationGroup.tsx`

- [ ] **Step 1: Move dashboard page**

```bash
mkdir -p src/frontend/src/pages/dashboard
git mv src/frontend/src/pages/DashboardOverviewPage.tsx src/frontend/src/pages/dashboard/
```

- [ ] **Step 2: Create NavigationGroup component**

Create `src/frontend/src/components/layout/NavigationGroup.tsx` - a reusable collapsible navigation section with icon, label, and children items.

- [ ] **Step 3: Refactor Sidebar.tsx**

Refactor `Sidebar.tsx` (982 lines) to use `NavigationGroup` components organized by feature:
- Dashboard
- Inventory (Assets, Templates)
- Workplaces
- Operations (Rollouts, Requests, Swaps)
- Devices (Overview, Intune, Licenses, Software)
- Reports
- Admin

- [ ] **Step 4: Update App.tsx with all final routes**

Ensure all routes use the new `ROUTES` constants and point to the correct page locations.

- [ ] **Step 5: Build verification and commit**

```bash
cd src/frontend && npm run build
git add -A
git commit -m "refactor: reorganize dashboard, refactor sidebar with feature-grouped navigation"
```

---

## Task 18: Fase 7 - Cleanup Remaining Root-Level Pages

- [ ] **Step 1: Check for any pages still in root pages/ directory**

```bash
ls src/frontend/src/pages/*.tsx
```

Any remaining `.tsx` files that are not in a subdirectory need to be moved to their appropriate feature directory.

- [ ] **Step 2: Move any stragglers**

Move `InventoryPage.tsx` (if still exists) or any other remaining root-level pages.

- [ ] **Step 3: Verify no orphaned imports**

```bash
grep -r "from.*pages/[A-Z]" --include="*.tsx" --include="*.ts" src/frontend/src/ | grep -v "pages/(inventory|workplaces|operations|devices|reports|admin|dashboard)/"
```

- [ ] **Step 4: Full build verification and commit**

```bash
cd src/frontend && npm run build
cd ../backend && dotnet build
git add -A
git commit -m "refactor: move all remaining root-level pages to feature directories"
```

---

## Task 19: Fase 8 - Documentation Update

**Files:**
- Modify: `CLAUDE.md` (full rewrite)
- Modify: `README.md` (update)
- Modify: `ARCHITECTURE.md` (update)
- Create: `docs/features/inventory.md`
- Create: `docs/features/workplaces.md`
- Create: `docs/features/operations.md`
- Create: `docs/features/devices.md`
- Create: `docs/features/reports.md`
- Create: `docs/features/admin.md`
- Modify: `docs/API-REFERENCE.md` (update routes)

- [ ] **Step 1: Rewrite CLAUDE.md**

Rewrite with:
- Updated project overview with 7 feature pillars
- New backend structure (Controllers organized by feature)
- New frontend structure (pages/components by feature)
- Updated API routes table
- Updated development commands (unchanged)
- New navigation structure

- [ ] **Step 2: Create per-feature documentation**

Create `docs/features/` directory with one `.md` per feature explaining:
- What the feature covers
- Backend controllers and services involved
- Frontend pages and key components
- API endpoints
- Future development notes

- [ ] **Step 3: Update API-REFERENCE.md**

Update all endpoint paths to reflect new route structure.

- [ ] **Step 4: Update README.md and ARCHITECTURE.md**

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "docs: rewrite CLAUDE.md and documentation for new feature-based structure"
```

---

## Task 20: Final Verification

- [ ] **Step 1: Full backend build**

```bash
cd src/backend
dotnet build
dotnet test
```

- [ ] **Step 2: Full frontend build**

```bash
cd src/frontend
npm run build
```

- [ ] **Step 3: Verify no orphaned files**

```bash
# Check for files still in old locations
ls src/backend/DjoppieInventory.API/Controllers/*.cs
ls src/frontend/src/pages/*.tsx
ls src/frontend/src/components/widgets/
ls src/frontend/src/components/physicalWorkplaces/
```

Expected: No files in old root locations (except maybe a few cross-cutting ones).

- [ ] **Step 4: Verify route consistency**

Check that all frontend API calls match backend route attributes.

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "chore: final verification - codebase cleanup and reorganization complete"
```

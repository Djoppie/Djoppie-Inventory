# Codebase Cleanup & Herorganisatie - Design Spec

## Samenvatting

Volledige cleanup en herorganisatie van Djoppie Inventory: dead code verwijderen, monolithen splitsen, frontend + backend + API routes hergroeperen per feature-domein, navigatiestructuur herorganiseren, en documentatie updaten.

**Principes:**
- Alles wat niet actief werkt gaat weg
- Feature-gebaseerde organisatie (verticale slicing)
- Fase-per-fase aanpak met testbare tussenresultaten
- Data-integriteit als prioriteit bij monolith-splits

## De 7 Feature-Pijlers

| # | Feature | Scope |
|---|---------|-------|
| 1 | **Dashboard** | KPI's, overzicht, quick actions |
| 2 | **Inventory** | Assets, templates, QR codes, CSV import/export, asset events |
| 3 | **Workplaces** | Physical workplaces, equipment locaties |
| 4 | **Operations** | Rollouts, requests (on/offboarding), laptop swaps |
| 5 | **Devices** | Intune device management, licenses, installed software, monitoring |
| 6 | **Reports** | Hardware, workplaces, operations, lease rapportages |
| 7 | **Admin** | Organization sync, locaties, asset types/categories, toekomstige RBAC |

### Feature-toewijzing van bestaande functionaliteit

- **CSV Import/Export** → Inventory (import tool + export/backup/rapportage)
- **Lease Contracts** → Verwijderd (niet actief, later opnieuw opbouwen)
- **Organization Sync** (Sectors/Services/Buildings) → Admin
- **Licenses & Installed Software** → Devices
- **Asset Events/History** → Inventory
- **Graph/Employee management** → Admin (employees), Graph blijft cross-cutting utility
- **Reports** → Eigen sectie, opgesplitst per domein

---

## Fase 0: Dead Code Cleanup

**Doel:** Alles verwijderen wat niet actief werkt. Geen functionele wijzigingen.
**Risico:** Laag.

### Backend - Te verwijderen

| Bestand | Reden |
|---------|-------|
| `LeaseContractsController.cs` | Feature niet actief |
| `LeaseContract.cs` (entity) | Feature niet actief |
| `ILeaseContractRepository.cs` | Feature niet actief |
| `LeaseContractRepository.cs` | Feature niet actief |
| Alle Lease DTOs | Feature niet actief |
| `AssetPlanSyncService.cs` | Geen interface, legacy sync |
| 6 disabled test files | Verouderd, vereisen schema-updates |
| Duplicate `GraphGroupDto/GraphUserDto` in `BulkCreateFromGraphDto.cs` | Refactor: extraheer naar eigen DTO-bestand in `DTOs/Graph/` |

### Frontend - Te verwijderen

| Bestand | Reden |
|---------|-------|
| `components/widgets/AssetTypeDistributionWidget.tsx` | Nooit gerenderd |
| `components/widgets/IntuneSyncStatusWidget.tsx` | Nooit gerenderd |
| `components/widgets/LeaseWarrantyWidget.tsx` | Nooit gerenderd |
| `components/widgets/RecentActivityWidget.tsx` | Nooit gerenderd |
| `components/widgets/StatusDistributionWidget.tsx` | Nooit gerenderd |
| `components/widgets/index.ts` | Lege exports |
| `components/admin/AdminNavigation.tsx` | Niet geimporteerd |
| `components/admin/AdminSection.tsx` | Niet geimporteerd |
| `components/admin/OrganizationTab.tsx` | Niet geimporteerd |
| `components/common/AnimatedStatusChip.tsx` | Niet geimporteerd |
| `components/common/DeviceAutocomplete.tsx` | Niet geimporteerd |
| `components/common/NeumorphicButton.tsx` | Niet geimporteerd |
| `components/dashboard/AssetKPIs.tsx` | Niet geimporteerd |
| `components/physicalWorkplaces/AnimatedStatChip.tsx` | Niet geimporteerd |
| `components/physicalWorkplaces/PhysicalWorkplaceSelector.tsx` | Niet geimporteerd |
| `createNodeId()`, `parseNodeId()` in `organization.api.ts` | Orphaned functies |
| `DeploymentAssetInfo`, `DeploymentOwnerInfo`, `DeploymentWorkplaceInfo` in `deployment.types.ts` | Unused types |

### Docs - Te verwijderen

| Pad | Reden |
|-----|-------|
| `docs/_archive/` (46 bestanden, 748KB) | Verouderde historiek |
| `REPORTS-REDESIGN-IMPLEMENTATION.md` (root) | Verouderd |
| `MIGRATION-GUIDE.md` (root) | Verouderd |

---

## Fase 1: Inventory

**Doel:** Assets, templates, QR, CSV, events hergroeperen.

### Backend Structuur

```
Controllers/Inventory/
  AssetsController.cs
  AssetTemplatesController.cs
  AssetEventsController.cs
  CsvImportController.cs
  QRCodeController.cs
```

### API Routes

| Huidig | Nieuw |
|--------|-------|
| `/api/assets` | `/api/inventory/assets` |
| `/api/assettemplates` | `/api/inventory/templates` |
| `/api/assetevents` | `/api/inventory/events` |
| `/api/csvimport` | `/api/inventory/import` |
| `/api/qrcode` | `/api/inventory/qrcode` |

### Frontend Structuur

```
pages/inventory/
  AssetsPage.tsx
  AssetDetailPage.tsx
  AssetCreatePage.tsx
  AssetTemplatesPage.tsx

components/inventory/
  AssetForm.tsx
  AssetTableView.tsx
  CsvImportDialog.tsx
  ExportDialog.tsx
  (bestaande asset-componenten verplaatst)
```

### Frontend Routes

| Huidig | Nieuw |
|--------|-------|
| `/assets` | `/inventory/assets` |
| `/assets/:id` | `/inventory/assets/:id` |
| `/devices/new` | `/inventory/assets/new` |
| `/devices/bulk-create` | `/inventory/assets/bulk-create` |
| `/templates` | `/inventory/templates` |

---

## Fase 2: Workplaces

**Doel:** PhysicalWorkplacesController (1816 regels) splitsen, hergroeperen.

### Backend Monolith Split

```
Controllers/Workplaces/
  WorkplacesController.cs        (CRUD operaties)
  WorkplaceSearchController.cs   (zoeken, filteren)
  WorkplaceAssetsController.cs   (equipment toewijzing)
```

`PhysicalWorkplaceService.cs` (21.7K) wordt opgesplitst in lijn met de controller-split.

### API Routes

| Huidig | Nieuw |
|--------|-------|
| `/api/physicalworkplaces` | `/api/workplaces` |
| `/api/physicalworkplaces/search` | `/api/workplaces/search` |
| `/api/physicalworkplaces/{id}/assets` | `/api/workplaces/{id}/assets` |

### Frontend Structuur

```
pages/workplaces/
  WorkplacesPage.tsx
  WorkplaceDetailPage.tsx

components/workplaces/
  WorkplaceForm.tsx
  WorkplaceAssetList.tsx
  (bestaande physicalWorkplaces-componenten verplaatst en hernoemd)
```

### Frontend Routes

| Huidig | Nieuw |
|--------|-------|
| `/workplaces` | `/workplaces` (behouden) |
| `/workplaces/:id` | `/workplaces/:id` (behouden) |

---

## Fase 3: Operations

**Doel:** Rollouts, requests, swaps groeperen onder Operations.

### Backend Structuur

```
Controllers/Operations/
  Rollout/
    RolloutSessionsController.cs    (bestaand)
    RolloutDaysController.cs        (bestaand)
    RolloutWorkplacesController.cs  (bestaand)
    RolloutGraphController.cs       (bestaand)
    RolloutReportsController.cs     (bestaand)
  RequestsController.cs
  DeploymentController.cs
  LaptopSwapController.cs
```

### API Routes

| Huidig | Nieuw |
|--------|-------|
| `/api/rollout/sessions` | `/api/operations/rollouts/sessions` |
| `/api/rollout/days` | `/api/operations/rollouts/days` |
| `/api/rollout/workplaces` | `/api/operations/rollouts/workplaces` |
| `/api/rollout/graph` | `/api/operations/rollouts/graph` |
| `/api/rollout/reports` | `/api/operations/rollouts/reports` |
| `/api/assetrequests` | `/api/operations/requests` |
| `/api/deployment` | `/api/operations/deployments` |
| `/api/laptopswap` (nieuw) | `/api/operations/swaps` |

### Frontend Structuur

```
pages/operations/
  rollouts/
    RolloutListPage.tsx
    RolloutPlannerPage.tsx
    RolloutExecutionPage.tsx      (1727 regels - opsplitsen in subcomponenten)
    RolloutDayDetailPage.tsx
  requests/
    RequestsDashboardPage.tsx
    RequestsReportsPage.tsx
  swaps/
    LaptopSwapPage.tsx

components/operations/
  rollout/
    (bestaande rollout-componenten)
  requests/
    (request-componenten)
  swaps/
    (swap-componenten)
```

### Frontend Routes

| Huidig | Nieuw |
|--------|-------|
| `/rollouts` | `/operations/rollouts` |
| `/rollouts/new` | `/operations/rollouts/new` |
| `/rollouts/:id` | `/operations/rollouts/:id` |
| `/requests` | `/operations/requests` |
| `/laptop-swap` | `/operations/swaps` |

### RolloutExecutionPage Split

Het bestand van 1727 regels wordt opgesplitst:
- `RolloutExecutionPage.tsx` - Orchestratie en state management
- `components/operations/rollout/execution/WorkplaceExecutionPanel.tsx` - Per-workplace UI
- `components/operations/rollout/execution/AssetScanSection.tsx` - Serial scan logic
- `components/operations/rollout/execution/ExecutionProgress.tsx` - Voortgangsindicator

---

## Fase 4: Devices

**Doel:** IntuneController (979 regels) en IntuneService (2054 regels) splitsen.

### Backend Monolith Split

```
Controllers/Devices/
  IntuneDevicesController.cs     (device CRUD, lookup)
  IntuneSyncController.cs        (sync operaties)
  IntuneHealthController.cs      (health, configuration status)
  LicensesController.cs

Services/
  IntuneDeviceService.cs         (device operaties)
  IntuneSyncService.cs           (sync logica - bestaand, hergebruiken)
  IntuneHealthService.cs         (health queries)
  LicenseService.cs              (bestaand)
```

### API Routes

| Huidig | Nieuw |
|--------|-------|
| `/api/intune/devices` | `/api/devices/intune` |
| `/api/intune/sync` | `/api/devices/intune/sync` |
| `/api/intune/health` | `/api/devices/intune/health` |
| `/api/intune/licenses` | `/api/devices/licenses` |

### Frontend Structuur

```
pages/devices/
  DevicesDashboardPage.tsx
  DeviceDetailPage.tsx
  IntuneDashboardPage.tsx
  LicensesPage.tsx
  InstalledSoftwarePage.tsx
  AutopilotPage.tsx

components/devices/
  intune/
    OverviewTab.tsx
    (overige Intune tabs)
  licenses/
    LicensesTab.tsx             (1347 regels - refactor)
  software/
    InstalledSoftwarePage.tsx    (1225 regels - refactor)
```

### Frontend Routes

| Huidig | Nieuw |
|--------|-------|
| `/devices` | `/devices` (behouden) |
| `/devices/:id` | `/devices/:id` (behouden) |
| `/devices/intune-dashboard` | `/devices/intune` |
| `/devices/autopilot` | `/devices/autopilot` (behouden) |

---

## Fase 5: Reports

**Doel:** ReportsController (2052 regels, ~162 methods) splitsen naar domein-specifieke controllers.

### Backend Monolith Split

```
Controllers/Reports/
  InventoryReportsController.cs    (asset statistieken, types)
  DeviceReportsController.cs       (hardware, Intune rapporten)
  WorkplaceReportsController.cs    (workplace statistieken)
  OperationsReportsController.cs   (rollout, swap history)
  LeaseReportsController.cs        (lease/warranty overzichten)

Services/
  ReportService.cs → opgesplitst per domein:
    InventoryReportService.cs
    DeviceReportService.cs
    WorkplaceReportService.cs
    OperationsReportService.cs
```

### API Routes

| Huidig | Nieuw |
|--------|-------|
| `/api/reports/hardware` | `/api/reports/devices` |
| `/api/reports/workplaces` | `/api/reports/workplaces` |
| `/api/reports/rollout` | `/api/reports/operations` |
| `/api/reports/leases` | `/api/reports/leases` |
| `/api/reports/inventory` (nieuw) | `/api/reports/inventory` |

### Frontend Structuur

```
pages/reports/
  ReportsOverviewPage.tsx
  InventoryReportsPage.tsx
  DeviceReportsPage.tsx
  WorkplaceReportsPage.tsx
  OperationsReportsPage.tsx

components/reports/
  ReportCard.tsx
  ExportDialog.tsx              (herbruikbaar, verplaatst vanuit inventory)
```

### Frontend Routes

| Huidig | Nieuw |
|--------|-------|
| `/reports` | `/reports` (behouden, wordt overview) |
| n/a | `/reports/inventory`, `/reports/devices`, `/reports/workplaces`, `/reports/operations` |

---

## Fase 6: Admin

**Doel:** Organization, locaties, types hergroeperen + RBAC voorbereiding.

### Backend Structuur

```
Controllers/Admin/
  OrganizationController.cs
  SectorsController.cs
  ServicesController.cs
  BuildingsController.cs
  CategoriesController.cs
  AssetTypesController.cs
  EmployeesController.cs
```

### API Routes

| Huidig | Nieuw |
|--------|-------|
| `/api/organization` | `/api/admin/organization` |
| `/api/sectors` | `/api/admin/sectors` |
| `/api/services` | `/api/admin/services` |
| `/api/buildings` | `/api/admin/buildings` |
| `/api/categories` | `/api/admin/categories` |
| `/api/assettypes` | `/api/admin/asset-types` |
| `/api/employees` | `/api/admin/employees` |

### Frontend Structuur

```
pages/admin/
  AdminPage.tsx                 (tab container)

components/admin/
  OrganizationTab.tsx           (nieuw, actief)
  LocationsTab.tsx
  AssetTypesTab.tsx
  CategoriesTab.tsx
  EmployeesTab.tsx
  ServicesTab.tsx                (1408 regels - splitsen in subcomponenten)
```

### ServicesTab Split

`ServicesTab.tsx` (1408 regels) wordt opgesplitst:
- `ServicesTab.tsx` - Container en state
- `components/admin/services/ServiceList.tsx` - Tabel/lijst
- `components/admin/services/ServiceForm.tsx` - Create/edit formulier
- `components/admin/services/ServiceSyncDialog.tsx` - Entra sync dialog

### Frontend Routes

| Huidig | Nieuw |
|--------|-------|
| `/admin/assets` | `/admin` (met tabs) |
| `/admin/organisation` | `/admin` (organisation tab) |
| `/admin/locations` | `/admin` (locations tab) |

### RBAC Voorbereiding

- `AuthenticationExtensions.cs` TODO afwerken voor app roles
- Admin policy (`RequireAdminRole`) consistent toepassen op alle Admin controllers
- Documenteren welke endpoints admin-only worden bij RBAC implementatie

---

## Fase 7: Dashboard & Cross-cutting

**Doel:** Dashboard, navigatie/sidebar, shared componenten.

### Backend

```
Controllers/Dashboard/
  DashboardController.cs         (KPI aggregatie endpoint)

Controllers/User/
  UserController.cs

Controllers/Graph/
  GraphController.cs             (Entra users/groups - cross-cutting utility)
```

### API Routes

| Huidig | Nieuw |
|--------|-------|
| `/api/user` | `/api/user` (behouden) |
| `/api/graph` | `/api/graph` (behouden, cross-cutting) |
| n/a | `/api/dashboard` (nieuw KPI endpoint) |

### Frontend

```
pages/dashboard/
  DashboardPage.tsx

components/layout/
  Sidebar.tsx                    (982 regels - refactor)
  AppLayout.tsx
  NavigationGroup.tsx            (nieuw - collapsible feature-groep)

components/common/
  (opkuisen na verwijdering unused componenten)
```

### Sidebar Refactor

`Sidebar.tsx` (982 regels) wordt gerefactored:
- Feature-gegroepeerde navigatie met collapsible secties
- `NavigationGroup.tsx` component voor herbruikbare groepering
- Navigatie-items per feature-pijler:
  - Dashboard
  - Inventory (Assets, Templates)
  - Workplaces
  - Operations (Rollouts, Requests, Swaps)
  - Devices (Overview, Intune, Licenses, Software)
  - Reports
  - Admin

---

## Fase 8: Documentatie & Afronding

### Documentatie Updates

- **CLAUDE.md**: Volledig herschrijven met nieuwe structuur, routes, feature-groepen
- **README.md**: Updaten met nieuwe navigatie en feature-overzicht
- **ARCHITECTURE.md**: Updaten met feature-gegroepeerde architectuur
- **docs/**: Alleen actieve, up-to-date docs behouden
- **Per feature**: Korte `.md` instructie in `docs/features/` voor toekomstige ontwikkeling:
  - `docs/features/inventory.md`
  - `docs/features/workplaces.md`
  - `docs/features/operations.md`
  - `docs/features/devices.md`
  - `docs/features/reports.md`
  - `docs/features/admin.md`
- **API Reference**: Updaten met nieuwe routes

### Final Checks

- [ ] Backend build succesvol (`dotnet build`)
- [ ] Frontend build succesvol (`npm run build`)
- [ ] Alle nieuwe routes bereikbaar
- [ ] Navigatie doorlopen - elke feature-groep
- [ ] CORS configuratie correct voor nieuwe routes
- [ ] Auth policies correct op alle controllers
- [ ] Bundle size check (lazy loading intact)
- [ ] Database migraties ongewijzigd (geen schema changes)

---

## Volgorde en Afhankelijkheden

```
Fase 0 (Dead Code)
  └─→ Fase 1 (Inventory)
  └─→ Fase 2 (Workplaces)
  └─→ Fase 3 (Operations)
  └─→ Fase 4 (Devices)
  └─→ Fase 5 (Reports)
  └─→ Fase 6 (Admin)
       └─→ Fase 7 (Dashboard & Cross-cutting)  ← hangt af van navigatie-kennis van alle features
            └─→ Fase 8 (Docs)                   ← hangt af van alles
```

Fase 1-6 kunnen in willekeurige volgorde na Fase 0, maar de voorgestelde volgorde minimaliseert afhankelijkheden. Fase 7 moet na alle feature-fasen (sidebar moet alle routes kennen). Fase 8 is altijd laatste.

## Risicobeheer

| Risico | Mitigatie |
|--------|----------|
| Data-integriteit bij monolith split | Alleen code-organisatie wijzigen, geen entity/schema changes |
| Breaking API routes | Frontend en backend tegelijk per fase aanpassen |
| Regressie in bestaande features | Per fase build verificatie (backend + frontend) |
| Verlies van functionaliteit | Git branch per fase, rollback mogelijk |
| CORS issues na route changes | CORS configuratie updaten in Fase 7/8 |

## Buiten scope

- Nieuwe features bouwen
- Database schema wijzigingen
- Performance optimalisaties (behalve bundle size check)
- RBAC implementatie (alleen voorbereiding)
- Lease Contracts herimplementatie
- Test coverage uitbreiden (behalve verwijderen van broken tests)

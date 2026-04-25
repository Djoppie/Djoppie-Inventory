# Architecture Overview

A compact, current map of how **Djoppie Inventory** is built. For deep dives see [docs/wiki/Technical-Reference/01-Architecture.md](docs/wiki/Technical-Reference/01-Architecture.md), [docs/BACKEND-ARCHITECTURE.md](docs/BACKEND-ARCHITECTURE.md), and [docs/DATA-MODEL.md](docs/DATA-MODEL.md).

---

## 1. System Context

```
        ┌─────────────────────────────────────────────────────┐
        │                  Microsoft Entra ID                  │
        │              (tenant: Diepenbeek)                    │
        └───────────────┬───────────────────┬─────────────────┘
                  MSAL  │       JWT (Bearer)│
                        │                   │
   ┌────────────────────▼─────┐     ┌───────▼──────────────────┐
   │  Frontend (React 19 SPA) │ ──► │  Backend (ASP.NET Core 8)│
   │  Vite · MUI · MSAL React │ REST│  Identity.Web · EF Core  │
   │  TanStack Query · Axios  │     │  Microsoft.Graph SDK     │
   └──────────────────────────┘     └──┬──────────┬────────────┘
                                       │          │
                                  EF   │          │ Graph SDK
                                       ▼          ▼
                              ┌──────────────┐  ┌────────────────┐
                              │ SQLite (dev) │  │ Microsoft Graph│
                              │ Azure SQL(p) │  │ Intune / Entra │
                              └──────────────┘  └────────────────┘
```

Hosted on **Azure**: Static Web App (frontend), App Service Linux (backend), Azure SQL Serverless, Key Vault (Managed Identity), Application Insights.

---

## 2. Tech Stack

| Layer | Stack |
|-------|-------|
| Frontend | React 19, TypeScript, Vite, MUI v7, TanStack Query, React Router 7, MSAL React, i18next, html5-qrcode, qrcode.react, ExcelJS, Recharts |
| Backend | ASP.NET Core 8.0 (C# 12), EF Core 8 (SQL Server provider), AutoMapper, FluentValidation, Microsoft.Identity.Web 4, Microsoft.Graph 5, ClosedXML, Swashbuckle |
| Auth | Microsoft Entra ID, OAuth 2.0 + PKCE, JWT Bearer |
| Storage | SQLite (dev) · Azure SQL (prod) |
| Infra | Azure Static Web Apps · App Service · Azure SQL · Key Vault · App Insights · Bicep IaC (`infra/`) |
| CI/CD | Azure DevOps pipeline at `.azuredevops/azure-pipelines.yml` |

---

## 3. Backend — Clean Architecture (3 projects)

```
src/backend/
├── DjoppieInventory.API/             ← HTTP edge: controllers, Program.cs, auth
├── DjoppieInventory.Core/            ← Domain: entities, DTOs, interfaces, enums
└── DjoppieInventory.Infrastructure/  ← EF Core, repositories, external services
```

Controllers are organised as **feature-based vertical slices**:

```
Controllers/
├── Admin/        organization, sectors, services, buildings, categories,
│                 asset types, employees                  → /api/admin/*
├── Devices/      Intune devices, sync, health           → /api/devices/intune/*
├── Graph/        Entra users/groups for bulk import     → /api/graph
├── Inventory/    assets, templates, events, CSV import,
│                 QR codes                               → /api/inventory/*
├── Operations/
│   ├── Rollout/  sessions, days, workplaces, graph,
│   │             reports                                → /api/operations/rollouts/*
│   ├── Requests  asset requests                          → /api/operations/requests
│   └── Deployment laptop swap / deployment tracking     → /api/operations/deployments
├── Reports/      inventory, workplace, operations,
│                 device reports                         → /api/reports/*
├── User/         current user profile                   → /api/user
└── Workplaces/   workplaces, search, asset assignment   → /api/workplaces/*
```

Cross-cutting infrastructure services:

| Service | Role |
|---------|------|
| `IntuneService` | Microsoft Graph SDK calls into Intune (devices, compliance, apps) |
| `OrganizationSyncService` | Pulls sectors/services/employees from Entra mail groups (`MG-*`) |
| `AssetMovementService` | Records every status transition during rollouts (audit trail) |
| `WorkplaceAssetAssignmentService` | Relational asset assignments per workplace |
| `AssetCodeGeneratorService` | Generates `[DUM-]TYPE-YY-BRAND-NNNNN`, finds next free number |

---

## 4. Frontend — Feature Slices

```
src/frontend/src/
├── api/           Axios instance + MSAL interceptor + per-feature API modules
├── components/    UI by feature: admin/ common/ dashboard/ devices/intune/
│                  inventory/ layout/ operations/rollout/ print/ workplaces/
├── pages/         Top-level routes mirroring features
├── hooks/         useAssets, useRollout/*, usePlanningViewMode, …
├── types/         TS contracts shared across components
├── i18n/          nl.json (default) · en.json
├── config/        MSAL & app config
└── utils/, constants/
```

State: server data via TanStack Query (caching, optimistic updates); UI/local state via React hooks. No global store.

Route layout (excerpt):

| Page | Route |
|------|-------|
| Dashboard overview | `/` |
| Assets | `/inventory/assets` |
| Asset detail | `/inventory/assets/:id` |
| QR scan | `/inventory/scan` |
| Intune dashboard | `/devices/intune` |
| Rollouts | `/operations/rollouts` |
| Reports | `/reports` |
| Workplaces | `/workplaces` |
| Admin | `/admin` |

---

## 5. Authentication Flow

```
User → SPA → MSAL (PKCE) → Entra ID
                              │  JWT (aud=api://eb5b…/access_as_user)
                              ▼
SPA stores token in MSAL cache; Axios interceptor adds Authorization header
                              │
                              ▼
Backend validates with Microsoft.Identity.Web (JWKS, audience, issuer)
                              │
                              ▼
Authorized controller; downstream Graph calls via OBO / app-only token
```

App registrations:

- **Frontend SPA** — `b0b10b6c-8638-4bdd-9684-de4a55afd521` (one for all envs)
- **Backend API** — `eb5bcf06-8032-494f-a363-92b6802c44bf` (shared local + Azure DEV)

Required Graph permissions (admin-consent):
`DeviceManagementManagedDevices.Read.All`, `Device.Read.All`, `Directory.Read.All` (Application & Delegated), `User.Read` (Delegated).

Authorization: `[Authorize]` everywhere by fallback policy; `[Authorize(Policy = "RequireAdminRole")]` for admin endpoints.

---

## 6. Data Model (high level)

```
   Sector ──< Service ──< Employee
                │
                └──< Workplace ──< WorkplaceAssetAssignment >── Asset
                                                                  │
   Building ──< Service                                          AssetEvent (audit)
   Category ──< AssetType ──< AssetTemplate                       │
                              └─< Asset                          AssetMovement (rollout)

   RolloutSession ──< RolloutDay ──< RolloutWorkplace ──< WorkplaceAssetAssignment
                                                          ──< RolloutAssetMovement
                                  └─< RolloutDayService
```

`AssetStatus` enum: `InGebruik (0)`, `Stock (1)`, `Herstelling (2)`, `Defect (3)`, `UitDienst (4)`, `Nieuw (5)`.

Full ER diagram + cardinalities: [docs/DATA-MODEL.md](docs/DATA-MODEL.md).

---

## 7. Rollout Subsystem

The largest feature, with its own state machine.

**Phases**: Planning → Configuration → Execution → Reporting.

**Atomic completion transaction** (per workplace): new assets `Nieuw → InGebruik` (+ owner, install date), old assets `InGebruik → UitDienst|Defect|Stock`, workplace `InProgress → Completed`. Every transition writes a `RolloutAssetMovement` row.

Detailed walkthrough: [docs/ROLLOUT-WORKFLOW-GUIDE.md](docs/ROLLOUT-WORKFLOW-GUIDE.md).

---

## 8. Cross-Cutting Concerns

| Concern | Implementation |
|---------|----------------|
| Logging / telemetry | Application Insights via `Microsoft.ApplicationInsights.AspNetCore` |
| Health checks | `/health` (DB ping) + `AspNetCore.HealthChecks.UI.Client` |
| Rate limiting | Built-in ASP.NET Core limiter — 100 req/min global, 20 req/min on Intune routes |
| CORS | Dynamic policy: dev allows `localhost:5173/5174`, prod reads `Frontend:AllowedOrigins` |
| Secrets | Local: User Secrets · Azure: Key Vault via Managed Identity (`AzureAd--ClientSecret`, `ConnectionStrings--DefaultConnection`, `ApplicationInsights--ConnectionString`) |
| DB provider switch | SQLite when `Development`, Azure SQL otherwise; SQL has 5×30s retry policy |
| Migrations in prod | Auto-applied only when `Database:AutoMigrate=true`, otherwise manual |
| QR codes | Backend SVG via `QRCoder`, frontend render via `qrcode.react`, scan via `html5-qrcode` |
| i18n | `i18next` with browser detection; default Dutch |

---

## 9. Deployment Topology

```
Azure Subscription / rg-djoppie-inventory-dev
├── Static Web App (swa-djoppie-inventory-dev)         ← Vite dist/
├── App Service (app-djoppie-inventory-dev-api-k5xdqp) ← .NET publish
│     └── Managed Identity → Key Vault references
├── Azure SQL (Serverless, auto-pause)
├── Key Vault (kv-djoppie-dev-k5xdqp)
└── Application Insights
```

Bicep templates in `infra/bicep/`. PROD topology mirrors DEV with autoscale, failover group, and stricter SKUs (see `infra/bicep/main.prod.bicep`).

---

## 10. Where to Look Next

| You want to… | Read |
|--------------|------|
| Run it locally | [DEVELOPMENT.md](DEVELOPMENT.md) |
| Deploy to Azure | [docs/wiki/Administrator-Guide/03-Deployment.md](docs/wiki/Administrator-Guide/03-Deployment.md) |
| Understand auth | [docs/wiki/Administrator-Guide/02-Entra-Configuration.md](docs/wiki/Administrator-Guide/02-Entra-Configuration.md) + [docs/GRAPH-API.md](docs/GRAPH-API.md) |
| Hack on rollout | [docs/ROLLOUT-WORKFLOW-GUIDE.md](docs/ROLLOUT-WORKFLOW-GUIDE.md) |
| Touch the data model | [docs/DATA-MODEL.md](docs/DATA-MODEL.md) |
| Match existing UI patterns | [docs/COMPACT-DESIGN-PATTERNS.md](docs/COMPACT-DESIGN-PATTERNS.md), [docs/DJOPPIE-NEOMORPH-STYLE-GUIDE.md](docs/DJOPPIE-NEOMORPH-STYLE-GUIDE.md) |

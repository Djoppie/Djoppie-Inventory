# CLAUDE.md

Guidance for Claude Code when working with this repository.

## Project Overview

**Djoppie Inventory** - Asset management system for IT-support at Gemeente Diepenbeek. Tracks IT assets with Microsoft Intune integration, QR code scanning, and rollout workflow for employee on/offboarding.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | ASP.NET Core 8.0, C# 12, Entity Framework Core |
| Frontend | React 19, TypeScript, Vite, Material-UI, TanStack Query |
| Auth | Microsoft Entra ID (MSAL) |
| Database | SQLite (dev) / Azure SQL (prod) |
| Integrations | Microsoft Graph, Intune API |

## Quick Start

```bash
# Backend (http://localhost:5052)
cd src/backend/DjoppieInventory.API && dotnet run

# Frontend (http://localhost:5173)
cd src/frontend && npm run dev

# Tests
cd src/backend && dotnet test
```

## Project Structure

```
src/backend/
├── DjoppieInventory.API/           # Controllers, Program.cs
│   └── Controllers/Rollout/        # Split rollout controllers
├── DjoppieInventory.Core/          # Entities, DTOs, Interfaces
│   └── Entities/Enums/             # Status enums
└── DjoppieInventory.Infrastructure/ # DbContext, Repositories, Services

src/frontend/src/
├── api/            # Axios API clients
├── components/     # React components
│   └── rollout/    # Rollout-specific (planning/, reporting/)
├── hooks/          # React Query hooks
│   └── rollout/    # Rollout hooks
├── pages/          # Page components
├── types/          # TypeScript types
└── i18n/           # Translations (nl/en)
```

## Key Enums

**AssetStatus** (`Core/Entities/Asset.cs`):
- `InGebruik` (0), `Stock` (1), `Herstelling` (2), `Defect` (3), `UitDienst` (4), `Nieuw` (5)

**AssetAssignmentStatus** (`Core/Entities/Enums/`):
- `Pending` (0), `Installed` (1), `Skipped` (2), `Failed` (3)

## Database Commands

```bash
# From src/backend directory
dotnet ef migrations add <Name> --project DjoppieInventory.Infrastructure --startup-project DjoppieInventory.API
dotnet ef database update --project DjoppieInventory.Infrastructure --startup-project DjoppieInventory.API
```

## Rollout Feature

Employee on/offboarding workflow with asset deployment tracking.

### Workflow
1. **Planning** - Create session → Add days → Configure workplaces
2. **Configuration** - Assign assets: laptops (user), peripherals (workplace)
3. **Execution** - Scan serials, complete workplaces
4. **Reporting** - Asset movement reports, CSV export

### Organization Hierarchy
```
Sector (MG-SECTOR-*) → Service (MG-*) → Workplace
```
Auto-synced from Entra mail groups.

### Key Controllers
| Controller | Purpose |
|------------|---------|
| `RolloutSessionsController` | Session CRUD, start/complete |
| `RolloutDaysController` | Day management |
| `RolloutWorkplacesController` | Workplace + asset assignments |
| `RolloutReportsController` | Progress, movements, export |

### Key Services
| Service | Purpose |
|---------|---------|
| `OrganizationSyncService` | Entra mail group sync |
| `AssetMovementService` | Asset status tracking |
| `WorkplaceAssetAssignmentService` | Assignment management |

### Key Entities
| Entity | Purpose |
|--------|---------|
| `RolloutSession`, `RolloutDay`, `RolloutWorkplace` | Core workflow |
| `WorkplaceAssetAssignment` | Relational asset assignments |
| `RolloutAssetMovement` | Audit trail |
| `RolloutDayService` | Day-service junction |

## Authentication

- **Frontend SPA**: `b0b10b6c-8638-4bdd-9684-de4a55afd521`
- **Backend API**: `eb5bcf06-8032-494f-a363-92b6802c44bf`
- **Tenant**: `7db28d6f-d542-40c1-b529-5e5ed2aad545`

Secrets via User Secrets (dev) or Key Vault (prod). See `appsettings.*.json`.

## Common Tasks

### Add Entity
1. Create in `Core/Entities/`
2. Add DTOs in `Core/DTOs/`
3. Add interface in `Core/Interfaces/`
4. Implement in `Infrastructure/Repositories/`
5. Add DbSet to `ApplicationDbContext.cs`
6. Register in `ServiceCollectionExtensions.cs`
7. Create migration, create controller

### Add API Endpoint
1. Add method to controller with `[Authorize]`
2. Add DTOs if needed
3. Test via Swagger: http://localhost:5052/swagger

### Troubleshoot 401 Errors
1. Check `VITE_ENTRA_API_SCOPE` matches backend `Audience`
2. Clear browser storage (F12 → Application → Clear)
3. Verify admin consent: `az ad app permission admin-consent --id <client-id>`

## Code Conventions

- **Neomorph UI**: Use CSS variables from `index.css` (`--dark-bg-*`, `--neu-shadow-*`, `--djoppie-orange-*`)
- **API responses**: Return DTOs, not entities
- **Hooks**: Use TanStack Query for server state
- **i18n**: Dutch primary (`nl.json`), English secondary (`en.json`)

## Docs

| File | Content |
|------|---------|
| `docs/ROLLOUT-ARCHITECTURE.md` | Rollout technical design |
| `docs/ROLLOUT-WORKFLOW-GUIDE.md` | User guide (Dutch) |
| `.full-stack-feature/` | Feature implementation docs |
| `.azuredevops/README.md` | CI/CD setup |

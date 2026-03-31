# Architecture

Djoppie Inventory is a full-stack IT asset management system built with React and ASP.NET Core.

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              DJOPPIE INVENTORY                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────┐         ┌─────────────────────┐                   │
│  │      FRONTEND       │  REST   │       BACKEND       │                   │
│  │     React + TS      │◄───────►│    ASP.NET Core     │                   │
│  │   Material-UI       │   API   │    Clean Arch       │                   │
│  └──────────┬──────────┘         └──────────┬──────────┘                   │
│             │                               │                               │
│             │ MSAL                          │ EF Core                       │
│             ▼                               ▼                               │
│  ┌─────────────────────┐         ┌─────────────────────┐                   │
│  │   Microsoft Entra   │         │      Database       │                   │
│  │    ID (Azure AD)    │         │   SQLite / Azure    │                   │
│  └─────────────────────┘         └─────────────────────┘                   │
│                                             │                               │
│                                             │ Graph SDK                     │
│                                             ▼                               │
│                                  ┌─────────────────────┐                   │
│                                  │   Microsoft Graph   │                   │
│                                  │   Intune / Entra    │                   │
│                                  └─────────────────────┘                   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Technology Stack

### Frontend

- **React 19** with TypeScript
- **Material-UI (MUI)** for components
- **TanStack Query** for server state
- **React Router** for navigation
- **MSAL React** for authentication
- **Vite** for build tooling

### Backend

- **ASP.NET Core 8.0** with C# 12
- **Entity Framework Core** for ORM
- **Microsoft.Identity.Web** for auth
- **Microsoft.Graph SDK** for Intune

### Infrastructure

- **Azure Static Web Apps** (frontend)
- **Azure App Service** (backend)
- **Azure SQL Database** (production)
- **Azure Key Vault** (secrets)

---

## Project Structure

```
Djoppie-Inventory/
├── .claude/                    # Claude Code configuration
│   ├── agents/                 # Agent definitions
│   ├── skills/                 # Custom skills
│   └── tasks/                  # Task templates
│
├── src/
│   ├── frontend/               # React SPA
│   │   └── src/
│   │       ├── api/            # API client layer
│   │       ├── components/     # UI components (by feature)
│   │       ├── hooks/          # Custom React hooks
│   │       ├── pages/          # Page components
│   │       ├── types/          # TypeScript definitions
│   │       └── utils/          # Utilities
│   │
│   └── backend/                # ASP.NET Core API
│       ├── DjoppieInventory.API/           # Controllers, Program.cs
│       ├── DjoppieInventory.Core/          # Entities, DTOs, Interfaces
│       ├── DjoppieInventory.Infrastructure/# DbContext, Repositories
│       └── DjoppieInventory.Tests/         # Unit tests
│
├── docs/                       # Documentation
├── CLAUDE.md                   # Development instructions
├── QUICK_START.md              # Getting started guide
└── ARCHITECTURE.md             # This file
```

---

## Feature Modules

### 1. Asset Management

Core CRUD operations for IT assets with QR codes.

```
Frontend:                      Backend:
components/assets/             Controllers/AssetsController.cs
pages/AssetListPage.tsx        Core/Entities/Asset.cs
pages/AssetDetailPage.tsx      Core/DTOs/AssetDto.cs
hooks/useAssets.ts
```

### 2. Rollout Workflow

Equipment deployment planning and execution.

```
Frontend:                      Backend:
components/rollout/            Controllers/Rollout/
├── planner/                   ├── RolloutSessionsController.cs
├── execution/                 ├── RolloutDaysController.cs
├── workplace-dialog/          └── RolloutWorkplacesController.cs
pages/RolloutPlannerPage.tsx   Core/Entities/RolloutSession.cs
pages/RolloutExecutionPage.tsx Core/Entities/RolloutWorkplace.cs
hooks/rollout/
```

### 3. Physical Workplaces

Location and equipment tracking.

```
Frontend:                      Backend:
components/physicalWorkplaces/ Controllers/PhysicalWorkplacesController.cs
pages/PhysicalWorkplacesPage.tsx
hooks/usePhysicalWorkplaces.ts
```

### 4. Organization

Services, sectors, buildings hierarchy.

```
Frontend:                      Backend:
components/organization/       Controllers/ServicesController.cs
                               Controllers/SectorsController.cs
                               Controllers/BuildingsController.cs
```

### 5. Intune Integration

Microsoft Intune device sync.

```
Frontend:                      Backend:
components/intune/             Controllers/IntuneController.cs
                               Infrastructure/Services/IntuneService.cs
```

---

## Data Flow

### Authentication Flow

```
User → MSAL React → Entra ID → JWT Token
                                   ↓
                            API Request + Bearer Token
                                   ↓
                            Backend validates with Identity.Web
                                   ↓
                            Authorized API response
```

### API Request Pattern

```
React Component
     ↓ useQuery/useMutation
TanStack Query
     ↓
API Client (Axios + MSAL interceptor)
     ↓ HTTP + JWT
ASP.NET Controller
     ↓
Service Layer
     ↓
Repository (EF Core)
     ↓
Database
```

---

## Database Schema

### Core Entities

```
Asset                   RolloutSession          Service
├── Id                  ├── Id                  ├── Id
├── Name                ├── SessionName         ├── Name
├── AssetCode           ├── Status              ├── SectorId
├── SerialNumber        ├── PlannedStartDate    └── TeamCoordinator
├── Status              └── TotalWorkplaces
├── OwnerId
├── ServiceId           RolloutWorkplace        Sector
└── BuildingId          ├── Id                  ├── Id
                        ├── RolloutDayId        └── Name
                        ├── UserName
                        └── Status              Building
                                                ├── Id
                                                └── Name
```

### Asset Status Enum

```csharp
InGebruik = 0,   // In use
Stock = 1,       // In stock
Herstelling = 2, // Under repair
Defect = 3,      // Defective
UitDienst = 4,   // Decommissioned
Nieuw = 5        // New (not yet deployed)
```

---

## Security

### Authentication

- Microsoft Entra ID (Azure AD)
- OAuth 2.0 + PKCE for SPA
- JWT Bearer tokens

### Authorization

- Role-based access control
- `RequireAdminRole` policy for admin operations

### Secrets Management

- Development: .NET User Secrets
- Production: Azure Key Vault

---

## Deployment

### Azure Resources

```
Resource Group: rg-djoppie-inventory-dev
├── Static Web App (Frontend)
├── App Service (Backend API)
├── SQL Database
├── Key Vault
└── Application Insights
```

### CI/CD

- Azure DevOps Pipelines
- Manual deploy scripts available

See [QUICK_START.md](QUICK_START.md) for deployment commands.

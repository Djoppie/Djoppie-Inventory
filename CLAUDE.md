# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Djoppie Inventory** is an asset and inventory management system designed for IT-support and inventory managers. The system focuses on tracking IT assets with integration to Microsoft Intune for enhanced hardware inventory management.

### Core Features

- QR code scanning for instant asset lookup
- Intune-enhanced hardware inventory (Intune Managed, Microsoft Entra Joined, or Entra Hybrid joined devices)
- Real-time inventory checks with filtering (All/InGebruik/Stock/Herstelling/Defect/UitDienst/Nieuw)
- Asset data management (owner, location, status, installation dates)
- Digital QR code generation and download
- Asset template library for quick creation
- Multilingual support (Dutch/English)

### Asset Status Enum

The system uses the following status values (defined in `DjoppieInventory.Core/Entities/Asset.cs:34`):

- `InGebruik` (0) - In gebruik (in use)
- `Stock` (1) - Stock (in stock)
- `Herstelling` (2) - Herstelling (repair)
- `Defect` (3) - Defect (broken/defective)
- `UitDienst` (4) - Uit dienst (decommissioned)
- `Nieuw` (5) - Nieuw (new) - Asset added to inventory but not yet in use

## Technology Stack

### Backend

- **ASP.NET Core 8.0** - Web API framework
- **C# 12** - Programming language
- **Entity Framework Core** - ORM for database access
- **Microsoft.Identity.Web** - Entra ID authentication
- **Microsoft.Graph** - SDK for Intune/Microsoft Graph API integration
- **Azure Key Vault** - Secret management (production)
- **SQLite** (development) / **Azure SQL** (production) - Database

### Frontend

- **React 19** with TypeScript
- **Vite** - Build tool and dev server
- **Material-UI (MUI)** - Component library
- **React Router** - Client-side routing
- **TanStack Query (React Query)** - Server state management
- **Axios** - HTTP client
- **MSAL React** (@azure/msal-react) - Microsoft authentication
- **html5-qrcode** - QR code scanning
- **qrcode.react** - QR code generation
- **i18next** - Internationalization

## Architecture

### Backend Structure (Clean Architecture)

Controllers are organized into feature-based vertical slices under `Controllers/`:

```
src/backend/
├── DjoppieInventory.API/           # API Layer
│   ├── Controllers/                # API endpoints (feature-based)
│   │   ├── Admin/                  # /api/admin/*
│   │   │   ├── AdminOrganizationController.cs   # Organization CRUD
│   │   │   ├── AdminSectorsController.cs         # Organization sectors
│   │   │   ├── AdminServicesController.cs        # Organization services (Dienst ICT, etc.)
│   │   │   ├── AdminBuildingsController.cs       # Building/location management
│   │   │   ├── AdminCategoriesController.cs      # Asset categories
│   │   │   ├── AdminAssetTypesController.cs      # Asset types (laptop, monitor, etc.)
│   │   │   └── AdminEmployeesController.cs       # Employee management
│   │   ├── Devices/                # /api/devices/*
│   │   │   ├── IntuneDevicesController.cs        # Intune device lookup
│   │   │   ├── IntuneSyncController.cs           # Intune sync operations
│   │   │   └── IntuneHealthController.cs         # Intune connection health
│   │   ├── Graph/                  # /api/graph
│   │   │   └── GraphController.cs                # Azure AD users/groups for bulk import
│   │   ├── Inventory/              # /api/inventory/*
│   │   │   ├── AssetsController.cs               # Asset CRUD + sorting/filtering
│   │   │   ├── AssetTemplatesController.cs       # Asset template library
│   │   │   ├── AssetEventsController.cs          # Asset history/audit events
│   │   │   ├── CsvImportController.cs            # Bulk CSV import
│   │   │   └── QRCodeController.cs               # QR code generation
│   │   ├── Operations/             # /api/operations/*
│   │   │   ├── Rollout/            # /api/operations/rollouts/*
│   │   │   │   ├── RolloutSessionsController.cs  # Session CRUD, start/complete
│   │   │   │   ├── RolloutDaysController.cs      # Day management, service scheduling
│   │   │   │   ├── RolloutWorkplacesController.cs # Workplace CRUD, asset assignments
│   │   │   │   ├── RolloutGraphController.cs     # Entra group import for rollouts
│   │   │   │   └── RolloutReportsController.cs   # Progress reports, asset movement exports
│   │   │   ├── RequestsController.cs             # Asset requests
│   │   │   └── DeploymentController.cs           # Deployment tracking
│   │   ├── Reports/                # /api/reports/*
│   │   │   ├── InventoryReportsController.cs
│   │   │   ├── WorkplaceReportsController.cs
│   │   │   ├── OperationsReportsController.cs
│   │   │   └── DeviceReportsController.cs
│   │   ├── User/                   # /api/user
│   │   │   └── UserController.cs                 # User profile
│   │   └── Workplaces/             # /api/workplaces/*
│   │       ├── WorkplacesController.cs           # Physical workplace CRUD
│   │       ├── WorkplaceSearchController.cs      # Workplace search
│   │       └── WorkplaceAssetsController.cs      # Workplace asset management
│   ├── Program.cs                  # Application entry point & DI configuration
│   └── appsettings.*.json          # Environment-specific configuration
│
├── DjoppieInventory.Core/          # Domain Layer
│   ├── Entities/                   # Domain models
│   │   ├── Asset.cs               # Asset entity with AssetStatus enum
│   │   ├── RolloutSession.cs      # Rollout planning session
│   │   ├── RolloutDay.cs          # Single rollout day
│   │   ├── RolloutWorkplace.cs    # Workplace with AssetPlansJson
│   │   ├── WorkplaceAssetAssignment.cs  # Relational asset assignments
│   │   ├── RolloutAssetMovement.cs      # Asset movement audit trail
│   │   ├── RolloutDayService.cs         # Day-service junction table
│   │   ├── Service.cs             # Organization service unit
│   │   ├── Sector.cs              # Organization sector
│   │   ├── Building.cs            # Physical location
│   │   ├── Category.cs            # Asset category
│   │   ├── AssetType.cs           # Asset type classification
│   │   ├── AssetTemplate.cs       # Quick-create templates
│   │   └── AssetEvent.cs          # Audit trail events
│   ├── DTOs/                      # Data transfer objects
│   └── Interfaces/                # Repository & service contracts
│
└── DjoppieInventory.Infrastructure/ # Infrastructure Layer
    ├── Data/
    │   └── ApplicationDbContext.cs # EF Core DbContext
    ├── Repositories/              # Data access implementations
    └── Services/
        ├── IntuneService.cs       # Microsoft Graph/Intune integration
        ├── OrganizationSyncService.cs  # Entra mail group sync
        ├── AssetMovementService.cs     # Asset deployment/decommission tracking
        └── WorkplaceAssetAssignmentService.cs  # Workplace asset assignment management
```

### API Routes

| Feature | Route |
|---------|-------|
| Assets | `/api/inventory/assets` |
| Asset Templates | `/api/inventory/templates` |
| Asset Events | `/api/inventory/events` |
| CSV Import | `/api/inventory/import` |
| QR Code | `/api/inventory/qrcode` |
| Workplaces | `/api/workplaces` |
| Rollout Sessions | `/api/operations/rollouts/sessions` |
| Rollout Days | `/api/operations/rollouts/days` |
| Rollout Workplaces | `/api/operations/rollouts/workplaces` |
| Rollout Graph | `/api/operations/rollouts/graph` |
| Rollout Reports | `/api/operations/rollouts/reports` |
| Asset Requests | `/api/operations/requests` |
| Deployment | `/api/operations/deployments` |
| Intune Devices | `/api/devices/intune` |
| Reports | `/api/reports` |
| Admin | `/api/admin/[controller]` |
| Organization | `/api/admin/organization` |
| User | `/api/user` |
| Graph | `/api/graph` |

### Frontend Structure

Pages and components are organized into feature-based vertical slices:

```
src/frontend/
├── src/
│   ├── api/           # API client layer (Axios + React Query integration)
│   │   ├── client.ts          # Base Axios instance
│   │   ├── authInterceptor.ts # MSAL token injection
│   │   ├── assets.api.ts      # Asset CRUD operations
│   │   ├── rollout.api.ts     # Rollout workflow API
│   │   ├── intune.api.ts      # Intune device lookup
│   │   ├── organization.api.ts # Organization/admin data
│   │   └── graph.api.ts       # Azure AD users/groups
│   ├── components/    # Reusable UI components (feature-based)
│   │   ├── admin/         # Admin data tables and tabs per entity
│   │   ├── common/        # Shared: Loading, ErrorMessage, etc.
│   │   ├── dashboard/     # Dashboard widgets and components
│   │   ├── devices/
│   │   │   └── intune/    # Intune dashboard and device management components
│   │   ├── inventory/     # AssetCard, AssetForm, AssetList, CsvImportDialog, ExportDialog, etc.
│   │   ├── layout/        # Layout, Sidebar, NavigationGroup, Breadcrumbs, Navigation
│   │   ├── operations/
│   │   │   └── rollout/   # All rollout components (execution, planner, planning, reporting, etc.)
│   │   ├── print/         # BulkPrintLabelDialog
│   │   └── workplaces/    # WorkplaceCard, EditDialog, EquipmentChip, etc.
│   ├── pages/         # Page-level components (feature-based)
│   │   ├── admin/         # AdminAssetsPage, AdminOrganisationPage, AdminLocationsPage
│   │   ├── dashboard/     # DashboardOverviewPage
│   │   ├── devices/       # IntuneDeviceDashboardPage, AutopilotDevicesPage, AutopilotTimelinePage
│   │   ├── inventory/     # AssetsPage, AssetDetailPage, AddAssetPage, EditAssetPage,
│   │   │                  # BulkCreateAssetPage, AssetTemplatesPage, ScanPage,
│   │   │                  # InventoryPage, InstalledSoftwarePage, AssetIntunePage
│   │   ├── operations/
│   │   │   ├── rollouts/  # RolloutListPage, RolloutPlannerPage, RolloutExecutionPage,
│   │   │   │              # RolloutReportPage, RolloutDayDetailPage
│   │   │   ├── requests/  # RequestsDashboardPage, RequestsReportsPage
│   │   │   └── swaps/     # LaptopSwapPage, DeploymentHistoryPage
│   │   ├── reports/       # ReportsPage
│   │   └── workplaces/    # WorkplacesPage, WorkplaceDetailPage, WorkplaceReportsPage
│   ├── hooks/         # Custom React hooks (useRollout.ts, useAssets.ts, etc.)
│   ├── types/         # TypeScript type definitions
│   ├── config/        # MSAL and app configuration
│   ├── utils/         # Helper functions
│   ├── constants/     # App constants (rollout.constants.ts)
│   └── i18n/          # Translation files (nl/en)
├── .env.development   # Local dev environment variables
├── .env.production    # Azure production environment variables
├── package.json
└── vite.config.ts
```

### Frontend Routes

| Page | Route |
|------|-------|
| Dashboard | `/` |
| Assets | `/inventory/assets` |
| Add Asset | `/inventory/assets/new` |
| Asset Detail | `/inventory/assets/:id` |
| Asset Templates | `/inventory/templates` |
| QR Scan | `/inventory/scan` |
| Inventory Overview | `/inventory` |
| Intune Dashboard | `/devices/intune` |
| Rollouts | `/operations/rollouts` |
| Asset Requests | `/operations/requests` |
| Laptop Swap | `/operations/swaps` |
| Reports | `/reports` |
| Workplaces | `/workplaces` |
| Admin | `/admin` |

### Authentication Architecture

The application uses **Microsoft Entra ID** (Azure AD) for authentication:

- **Frontend SPA** (shared for all environments): `b0b10b6c-8638-4bdd-9684-de4a55afd521`
- **Backend API - DEV** (shared for local dev and Azure DEV): `eb5bcf06-8032-494f-a363-92b6802c44bf`

Both local development and Azure DEV environments use the same backend API registration, simplifying configuration and token management during development.

**Authentication Flow**:

1. User logs in via MSAL React → Redirects to Entra ID
2. After successful auth, receives JWT access token
3. Token includes scope: `api://{backend-client-id}/access_as_user`
4. Frontend includes token in API requests via Axios interceptors
5. Backend validates token using Microsoft.Identity.Web
6. Backend uses service principal to call Microsoft Graph/Intune APIs

**Key Configuration** (Program.cs:16-32):

- JWT Bearer authentication with Microsoft Entra ID
- Token acquisition for downstream API calls (Microsoft Graph)
- In-memory token cache
- Fallback policy requires authenticated users
- Custom "RequireAdminRole" policy for admin operations

## Development Commands

### > Backend

All commands should be run from the `src/backend` directory unless specified otherwise.

**Local Development**:

```bash
# Restore dependencies
dotnet restore

# Build solution
dotnet build

# Run API (starts at http://localhost:5052)
cd DjoppieInventory.API
dotnet run

# Run API with watch mode (auto-reload on changes)
dotnet watch run

# Run tests
cd DjoppieInventory.Tests
dotnet test

# Run specific test
dotnet test --filter "FullyQualifiedName~AssetControllerTests"
```

**Database Migrations**:

```bash
# Create new migration (from src/backend directory)
dotnet ef migrations add <MigrationName> \
  --project DjoppieInventory.Infrastructure \
  --startup-project DjoppieInventory.API

# Apply migrations (local SQLite)
dotnet ef database update \
  --project DjoppieInventory.Infrastructure \
  --startup-project DjoppieInventory.API

# Apply migrations to Azure SQL (requires connection string)
dotnet ef database update \
  --project DjoppieInventory.Infrastructure \
  --startup-project DjoppieInventory.API \
  --connection "Server=..."

# Remove last migration (if not applied)
dotnet ef migrations remove \
  --project DjoppieInventory.Infrastructure \
  --startup-project DjoppieInventory.API

# List migrations
dotnet ef migrations list \
  --project DjoppieInventory.Infrastructure \
  --startup-project DjoppieInventory.API

# Generate SQL script
dotnet ef migrations script \
  --project DjoppieInventory.Infrastructure \
  --startup-project DjoppieInventory.API \
  --output migration.sql
```

**Code Quality**:

```bash
# Format code
dotnet format

# Analyze code
dotnet analyze

# Publish for deployment
cd DjoppieInventory.API
dotnet publish -c Release -o ./publish
```

### > Frontend

All commands should be run from the `src/frontend` directory.

**Development**:

```bash
# Install dependencies
npm install

# Start dev server (http://localhost:5173)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint

# Lint and fix
npm run lint -- --fix
```

**Testing**:

```bash
# Tests are not yet configured
# When added, typically: npm test
```

**Manual Deployment (SWA CLI)**:

Use this when the Azure DevOps pipeline is not available or for quick deployments:

```bash
# 1. Build the frontend
cd src/frontend
npm run build

# 2. Get the SWA deployment token (requires Azure CLI login)
az staticwebapp secrets list --name swa-djoppie-inventory-dev --query "properties.apiKey" -o tsv

# 3. Deploy using SWA CLI
npx @azure/static-web-apps-cli deploy ./dist \
  --deployment-token "<TOKEN_FROM_STEP_2>" \
  --env production
```

Alternative one-liner (if logged into Azure CLI):

```bash
cd src/frontend && npm run build && npx @azure/static-web-apps-cli deploy ./dist --deployment-token "$(az staticwebapp secrets list --name swa-djoppie-inventory-dev --query 'properties.apiKey' -o tsv)" --env production
```

Frontend URL: <https://blue-cliff-031d65b03.1.azurestaticapps.net>

### > Backend Manual Deployment

Use this when the Azure DevOps pipeline is not available or for quick deployments:

```bash
# 1. Build the backend
cd src/backend/DjoppieInventory.API
dotnet publish -c Release -o ./publish

# 2. Create zip package (PowerShell)
powershell -Command "Compress-Archive -Path './publish/*' -DestinationPath './deploy.zip' -Force"

# 3. Deploy to Azure App Service (requires Azure CLI login)
az webapp deployment source config-zip \
  --resource-group rg-djoppie-inventory-dev \
  --name app-djoppie-inventory-dev-api-k5xdqp \
  --src deploy.zip
```

Alternative one-liner (if logged into Azure CLI):

```bash
cd src/backend/DjoppieInventory.API && dotnet publish -c Release -o ./publish && powershell -Command "Compress-Archive -Path './publish/*' -DestinationPath './deploy.zip' -Force" && az webapp deployment source config-zip --resource-group rg-djoppie-inventory-dev --name app-djoppie-inventory-dev-api-k5xdqp --src deploy.zip
```

Backend URL: <https://app-djoppie-inventory-dev-api-k5xdqp.azurewebsites.net>

## Environment Configuration

### Secret Management

The application uses **Azure Key Vault** for production secret management:

- **Development**: Secrets stored in .NET User Secrets (never committed to git)
- **Production**: Secrets stored in Azure Key Vault (`kv-djoppie-dev-k5xdqp`)
- **Authentication**: App Service uses Managed Identity to access Key Vault
- **Configuration**: Key Vault secrets override appsettings.json values

**Key Vault Secret Naming Convention**:

- Configuration key: `AzureAd:ClientSecret`
- Key Vault secret name: `AzureAd--ClientSecret` (uses `--` instead of `:`)

**Required Secrets in Key Vault**:

- `ConnectionStrings--DefaultConnection` - SQL Database connection string
- `AzureAd--ClientSecret` - Entra ID client secret for Microsoft Graph API
- `ApplicationInsights--ConnectionString` - Application Insights telemetry

For detailed Key Vault management, see:

- [Key Vault Configuration Guide](docs/KEYVAULT-CONFIGURATION-GUIDE.md)
- [Key Vault Quick Reference](KEYVAULT-QUICK-REFERENCE.md)

### Local Development Setup

**Setting up User Secrets** (one-time setup for secrets):

```bash
cd src/backend/DjoppieInventory.API

# Set the Entra ID client secret (get from Azure Portal or team lead)
dotnet user-secrets set "AzureAd:ClientSecret" "your-client-secret-here"
```

**Backend** (`src/backend/DjoppieInventory.API/appsettings.Development.json`):

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Data Source=djoppie.db"
  },
  "AzureAd": {
    "Instance": "https://login.microsoftonline.com/",
    "TenantId": "7db28d6f-d542-40c1-b529-5e5ed2aad545",
    "ClientId": "eb5bcf06-8032-494f-a363-92b6802c44bf",
    "ClientSecret": "SET_VIA_USER_SECRETS",
    "Domain": "diepenbeek.onmicrosoft.com",
    "Audience": "api://eb5bcf06-8032-494f-a363-92b6802c44bf",
    "Scopes": "access_as_user"
  },
  "MicrosoftGraph": {
    "BaseUrl": "https://graph.microsoft.com/v1.0",
    "Scopes": [ "https://graph.microsoft.com/.default" ]
  },
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning",
      "Microsoft.EntityFrameworkCore": "Information"
    }
  }
}
```

**Frontend** (`src/frontend/.env.development`):

```env
VITE_API_URL=http://localhost:5052/api
VITE_ENTRA_CLIENT_ID=b0b10b6c-8638-4bdd-9684-de4a55afd521
VITE_ENTRA_TENANT_ID=7db28d6f-d542-40c1-b529-5e5ed2aad545
VITE_ENTRA_AUTHORITY=https://login.microsoftonline.com/7db28d6f-d542-40c1-b529-5e5ed2aad545
VITE_ENTRA_REDIRECT_URI=http://localhost:5173
VITE_ENTRA_API_SCOPE=api://eb5bcf06-8032-494f-a363-92b6802c44bf/access_as_user
```

### Azure DEV Environment

**Backend** (configured via App Service settings, referenced in `appsettings.AzureDev.json`):

- Uses Azure SQL Database (connection string stored in Key Vault)
- Backend API Client ID: `eb5bcf06-8032-494f-a363-92b6802c44bf`
- Audience: `api://eb5bcf06-8032-494f-a363-92b6802c44bf`

**Frontend** (`src/frontend/.env.production`):

- Points to Azure-deployed backend API
- Uses Azure DEV Backend API scope

## Deployment

### Quick Start - Local Development

```bash
# Terminal 1: Start backend
cd src/backend/DjoppieInventory.API
dotnet run

# Terminal 2: Start frontend
cd src/frontend
npm install
npm run dev
```

Access: <http://localhost:5173>

### Azure DEV Deployment

**Automated deployment** (recommended):

```powershell
# From repository root
.\deploy-dev.ps1
```

This PowerShell script handles:

1. Prerequisite checks (Azure CLI, .NET, Node.js)
2. Entra ID app verification
3. Infrastructure deployment (or verification)
4. Backend build and deployment
5. Frontend build and deployment
6. Configuration of all app settings

**Manual steps** for specific operations:

```powershell
# Deploy backend only
cd src/backend/DjoppieInventory.API
dotnet publish -c Release -o ./publish
# Then upload to App Service via Azure Portal or CLI

# Deploy frontend only
cd src/frontend
npm run build
# Deploy dist/ folder to Static Web App

# Run migrations against Azure SQL
# First, get connection string from Key Vault
# Then run: dotnet ef database update with connection string
```

### Azure DevOps CI/CD

Pipeline configuration: `.azuredevops/azure-pipelines.yml`

**Setup instructions**: `.azuredevops/README.md`

The pipeline includes:

- Multi-stage builds (Backend, Frontend, Infrastructure)
- Automated testing
- Deployment to DEV and PROD environments
- Database migration steps

**Required pipeline variables** (configured in Azure DevOps Library):

- `AZURE_SUBSCRIPTION_ID`
- `ENTRA_TENANT_ID`
- `ENTRA_CLIENT_ID_DEV`
- `ENTRA_CLIENT_ID_PROD`
- Database connection strings (via Key Vault)

## Rollout Workflow Feature

The rollout feature manages IT device deployments to workplaces for employee on/offboarding. It's a major subsystem with its own architecture.

### Primary Use Case

- **Onboarding**: New employee receives laptop + docking + monitors + peripherals at their workplace
- **Offboarding**: Employee leaves, equipment returns to stock or is reassigned
- **Bulk Import**: Create workplaces from Entra mail groups (MG-*) for team onboarding

### Workflow Phases

1. **Planning** (RolloutPlannerPage): Create sessions → Add days → Configure workplaces
   - Dual-view scheduling: Calendar-based AND list-based views
   - Bulk import from Entra mail groups
2. **Configuration** (RolloutWorkplaceDialog): Asset assignment per workplace:
   - **User-assigned assets**: Laptops assigned to users (status=Nieuw→InGebruik)
   - **Workplace-fixed assets**: Docking, monitors, keyboard, mouse assigned to workplace location
   - **Old devices**: Register devices being returned (InGebruik→UitDienst)
3. **Execution** (RolloutExecutionPage): Scan serials, track progress, complete workplaces
4. **Reporting** (RolloutReportPage): Professional asset movement reports with export

### Organization Hierarchy

```
Sector (MG-SECTOR-*) → Service (MG-*) → Workplace
   ↓                      ↓
Sector Manager      Teamcoördinator → Employees
```

Auto-synced from Microsoft Entra mail groups.

### Asset Status Transitions (Atomic)

```
Completion Transaction:
  New Assets:   Nieuw → InGebruik (+ Owner, InstallationDate)
  Old Assets:   InGebruik → UitDienst/Defect
  Workplace:    InProgress → Completed
```

### Key Files

**Backend Controllers**:

- `Controllers/Operations/Rollout/RolloutSessionsController.cs` - Session CRUD, start/complete
- `Controllers/Operations/Rollout/RolloutDaysController.cs` - Day management, service scheduling
- `Controllers/Operations/Rollout/RolloutWorkplacesController.cs` - Workplace CRUD, asset assignments
- `Controllers/Operations/Rollout/RolloutGraphController.cs` - Entra group import for rollouts
- `Controllers/Operations/Rollout/RolloutReportsController.cs` - Progress reports, asset movement exports

**Backend Services**:

- `Services/OrganizationSyncService.cs` - Entra mail group sync
- `Services/AssetMovementService.cs` - Asset deployment/decommission tracking
- `Services/WorkplaceAssetAssignmentService.cs` - Workplace asset assignment management

**Frontend Pages**:

- `pages/operations/rollouts/RolloutListPage.tsx` - Session list
- `pages/operations/rollouts/RolloutPlannerPage.tsx` - Planning view
- `pages/operations/rollouts/RolloutExecutionPage.tsx` - Execution view
- `pages/operations/rollouts/RolloutReportPage.tsx` - Reports
- `pages/operations/rollouts/RolloutDayDetailPage.tsx` - Day detail view

**Frontend Hooks**:

- `hooks/useRollout.ts` - Core rollout mutations/queries
- `hooks/rollout/useRolloutReports.ts` - Report queries and exports
- `hooks/rollout/useAssetAssignments.ts` - Assignment management
- `hooks/usePlanningViewMode.ts` - Calendar/list view preference

**Frontend Components**:

- `components/operations/rollout/planning/PlanningViewToggle.tsx` - View mode toggle
- `components/operations/rollout/planning/PlanningListView.tsx` - List view with sorting/filtering
- `components/operations/rollout/reporting/AssetMovementTable.tsx` - Movement audit table
- `components/operations/rollout/reporting/ProgressDashboard.tsx` - Session progress visualization

**Entities**:

- `RolloutSession.cs`, `RolloutDay.cs`, `RolloutWorkplace.cs`
- `WorkplaceAssetAssignment.cs` - Relational asset assignments (replaces JSON)
- `RolloutAssetMovement.cs` - Asset movement audit trail
- `RolloutDayService.cs` - Day-service junction table

**Documentation**: `docs/ROLLOUT-ARCHITECTURE.md`, `docs/ROLLOUT-WORKFLOW-GUIDE.md`

### Database Schema

**WorkplaceAssetAssignment** (replaces AssetPlansJson for new features):

- Links workplace to asset type, new asset, old asset, and template
- Tracks assignment category (UserAssigned, WorkplaceFixed)
- Tracks source type (ExistingInventory, NewFromTemplate, CreateOnSite)
- Tracks status (Pending, Installed, Skipped, Failed)

**RolloutAssetMovement** (audit trail):

- Records all asset status transitions during rollout execution
- Captures previous/new status, owner, service, location, building
- Links to session and workplace for reporting

### AssetPlansJson Structure (Legacy)

Existing workplaces may still use JSON in `RolloutWorkplace.AssetPlansJson`:

```json
[
  {
    "equipmentType": "laptop",
    "createNew": false,
    "existingAssetId": 1042,
    "status": "installed",
    "metadata": { "serialNumber": "ABC123" }
  }
]
```

## Key Implementation Notes

### Database Context Switching (Program.cs:34-54)

The application automatically selects the database provider based on environment:

- **Development**: SQLite (`djoppie.db` file)
- **Production**: Azure SQL Server with connection retry logic (5 retries, 30s max delay)

This allows for lightweight local development while maintaining production-grade database in Azure.

### CORS Configuration (Program.cs:66-95)

CORS policy dynamically adjusts based on environment:

- **Development**: Allows localhost:5173 and 5174 (Vite default ports)
- **Production**: Reads allowed origins from `Frontend:AllowedOrigins` config section

When adding new frontend URLs, update the configuration rather than modifying code.

### Automatic Database Migrations (Program.cs:167-201)

- **Production**: Only applies migrations if `Database:AutoMigrate` is set to `true`
- **Development**: Always ensures database is created via `EnsureCreated()`

For production deployments, prefer manual migrations or controlled automation via CI/CD.

### Microsoft Graph Integration

The `IntuneService` (DjoppieInventory.Infrastructure/Services/IntuneService.cs) uses the Microsoft Graph SDK to retrieve device information from Intune.

**Required API Permissions** (must be granted admin consent):

- `DeviceManagementManagedDevices.Read.All` (Application)
- `Device.Read.All` (Application)
- `Directory.Read.All` (Application & Delegated)
- `User.Read` (Delegated)

Check permissions via:

```powershell
az ad app permission list --id <backend-api-client-id>
```

Grant admin consent via:

```powershell
az ad app permission admin-consent --id <backend-api-client-id>
```

### QR Code Generation

The system generates QR codes containing asset codes:

- Backend: `Controllers/Inventory/QRCodeController.cs` generates SVG format QR codes
- Frontend: `qrcode.react` library renders QR codes in UI
- Download: Users can download SVG files for printing (format: `{AssetCode}-QR.svg`)

## Common Workflows

### Adding a New Entity

1. Create entity class in `DjoppieInventory.Core/Entities/`
2. Add corresponding DTOs in `DjoppieInventory.Core/DTOs/`
3. Create repository interface in `DjoppieInventory.Core/Interfaces/`
4. Implement repository in `DjoppieInventory.Infrastructure/Repositories/`
5. Add DbSet to `ApplicationDbContext.cs`
6. Register repository in `Program.cs` DI container
7. Create migration: `dotnet ef migrations add Add{EntityName}`
8. Apply migration: `dotnet ef database update`
9. Create controller in the appropriate `DjoppieInventory.API/Controllers/{Feature}/` directory

### Adding a New API Endpoint

1. Identify the feature area (Inventory, Admin, Operations, Devices, Reports, Workplaces)
2. Add method to the appropriate controller under `Controllers/{Feature}/` or create a new controller there
3. Define request/response DTOs if needed
4. Add authorization attribute if required: `[Authorize]` or `[Authorize(Policy = "RequireAdminRole")]`
5. Test endpoint via Swagger at <http://localhost:5052/swagger>
6. Update frontend API layer (e.g., `api/assets.api.ts`) to call the new endpoint

### Adding a New Frontend Page

1. Create the page component under `pages/{feature}/` (e.g., `pages/inventory/NewPage.tsx`)
2. Add the corresponding route in `App.tsx`
3. Add any reusable components under `components/{feature}/`
4. Add navigation entry in the sidebar if needed

### Modifying Asset Status Enum

When adding/removing status values from `AssetStatus` enum:

1. Update enum in `DjoppieInventory.Core/Entities/Asset.cs`
2. Create migration if needed (EF Core handles enum as int)
3. Update frontend TypeScript types
4. Update frontend filters and status badges
5. Update translation files in `src/frontend/src/i18n/` (nl.json, en.json)
6. Test all status-dependent features (filters, status badges, status updates)

### Troubleshooting Authentication Issues

**401 Unauthorized errors**:

1. Verify frontend is using correct API scope for environment
2. Check `VITE_ENTRA_API_SCOPE` matches backend `Audience` configuration
3. Clear browser cache and MSAL cache (F12 → Application → Clear storage)
4. Verify admin consent is granted for all required permissions
5. Check token in browser DevTools → Application → Session Storage → look for `msal.token.keys.*`
6. Decode JWT at jwt.ms to verify claims and audience

**Admin consent errors**:

```powershell
# Grant admin consent for backend API
az ad app permission admin-consent --id <backend-client-id>
```

## Repository Information

- **Remote**: <https://github.com/Djoppie/Djoppie-Inventory.git>
- **Contact**: <jo.wijnen@diepenbeek.be>
- **Tenant**: Diepenbeek (7db28d6f-d542-40c1-b529-5e5ed2aad545)

## Additional Documentation

- **README.md** - User guide in Dutch
- **README-DEPLOYMENT.md** - Complete deployment guide
- **PRODUCTION-DEPLOYMENT-GUIDE.md** - Production deployment checklist
- **PRODUCTION-READINESS-ASSESSMENT.md** - Production readiness report
- **SECURITY-REMEDIATION-CHECKLIST.md** - Security hardening guide
- **docs/BACKEND-CONFIGURATION-GUIDE.md** - Backend configuration reference
- **docs/ROLLOUT-ARCHITECTURE.md** - Rollout workflow technical architecture
- **docs/ROLLOUT-WORKFLOW-GUIDE.md** - Rollout user guide (Dutch)
- **.azuredevops/README.md** - Azure DevOps pipeline setup

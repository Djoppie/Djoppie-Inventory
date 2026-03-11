# Architecture Documentation - Djoppie Inventory

> **Compact technical reference for developers**
>
> Last Updated: March 11, 2026

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture Layers](#architecture-layers)
3. [Authentication & Security](#authentication--security)
4. [Database Schema](#database-schema)
5. [Key Services](#key-services)
6. [API Endpoints](#api-endpoints)
7. [Frontend Architecture](#frontend-architecture)
8. [Deployment](#deployment)

---

## System Overview

Djoppie Inventory is an asset management system built for Gemeente Diepenbeek, tracking IT assets with Microsoft Intune integration. The system follows Clean Architecture principles with clear separation between domain, infrastructure, and presentation layers.

### Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **Backend** | ASP.NET Core Web API | 8.0 |
| **Frontend** | React with TypeScript | 19.2.0 |
| **Database** | SQLite (dev) / Azure SQL (prod) | - |
| **Authentication** | Microsoft Entra ID | - |
| **Integration** | Microsoft Graph SDK | Latest |
| **Build Tool** | Vite | 7.2.4 |
| **UI Library** | Material-UI (MUI) | 7.3.7 |

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Microsoft Entra ID                            │
│                   (Authentication Provider)                      │
└──────────────┬──────────────────────────┬───────────────────────┘
               │                          │
               │ JWT Token                │ Service Principal
               │                          │
        ┌──────▼──────┐          ┌────────▼────────┐
        │   React SPA  │          │ Microsoft Graph │
        │  (Frontend)  │          │  / Intune API   │
        │              │          └─────────────────┘
        │  - Material  │                   ▲
        │    UI        │                   │
        │  - MSAL      │                   │
        │  - React     │                   │
        │    Query     │                   │
        └──────┬───────┘                   │
               │                           │
               │ REST API                  │
               │ (Bearer Token)            │
               │                           │
        ┌──────▼───────────────────────────┴────┐
        │    ASP.NET Core Web API               │
        │                                       │
        │  - Authentication Middleware          │
        │  - Rate Limiting                      │
        │  - Exception Handling                 │
        │  - IntuneService                      │
        └──────┬────────────────────────────────┘
               │
               │ Entity Framework Core
               │
        ┌──────▼──────────┐
        │    Database      │
        │                  │
        │  SQLite (dev)    │
        │  Azure SQL (prod)│
        └──────────────────┘
```

---

## Architecture Layers

The backend follows **Clean Architecture** with dependency inversion:

```
┌─────────────────────────────────────────────────────────────────┐
│                         API Layer                                │
│               DjoppieInventory.API                               │
│                                                                  │
│  - Controllers (REST endpoints)                                  │
│  - Middleware (Exception handling, Rate limiting)                │
│  - Extensions (Service registration)                             │
│  - Program.cs (Entry point, DI configuration)                    │
└──────────────────┬────────────────────────────┬──────────────────┘
                   │                            │
         Depends on│                            │Depends on
                   │                            │
        ┌──────────▼──────────┐      ┌─────────▼──────────────────┐
        │    Core Layer       │      │  Infrastructure Layer       │
        │ (Domain/Business)   │      │  (Data Access & Services)   │
        │                     │      │                             │
        │  - Entities         │◄─────┤  - ApplicationDbContext     │
        │  - DTOs             │      │  - Repositories             │
        │  - Interfaces       │      │  - IntuneService            │
        │  - Validators       │      │  - Migrations               │
        └─────────────────────┘      └─────────────────────────────┘
              (No dependencies)              (Implements Core)
```

### Layer Responsibilities

| Layer | Namespace | Purpose | Dependencies |
|-------|-----------|---------|--------------|
| **Core** | `DjoppieInventory.Core` | Domain models, business logic interfaces, DTOs | None (pure domain) |
| **Infrastructure** | `DjoppieInventory.Infrastructure` | Data access, external service integrations | Core |
| **API** | `DjoppieInventory.API` | REST endpoints, middleware, authentication | Core, Infrastructure |

### Core Layer Structure

```
DjoppieInventory.Core/
├── Entities/
│   ├── Asset.cs                    # Main asset entity
│   ├── AssetStatus (enum)          # InGebruik, Stock, Herstelling, etc.
│   ├── AssetTemplate.cs            # Quick-create templates
│   ├── AssetType.cs                # LAP, DESK, MON, etc.
│   ├── AssetEvent.cs               # Audit trail / event log
│   ├── Category.cs                 # Groups of asset types
│   ├── Building.cs                 # Physical locations
│   ├── Service.cs                  # Departments/teams
│   ├── Sector.cs                   # Organizational sectors
│   ├── LeaseContract.cs            # Leasing information
│   └── RolloutSession.cs           # Rollout planning workflow
├── DTOs/
│   ├── AssetDto.cs
│   ├── CreateAssetDto.cs
│   ├── UpdateAssetDto.cs
│   └── ...
├── Interfaces/
│   ├── IAssetRepository.cs
│   ├── IIntuneService.cs
│   └── ...
└── Validators/
    └── (FluentValidation rules)
```

### Infrastructure Layer Structure

```
DjoppieInventory.Infrastructure/
├── Data/
│   ├── ApplicationDbContext.cs     # EF Core DbContext
│   └── Migrations/                 # Database migrations
├── Repositories/
│   ├── AssetRepository.cs
│   ├── AssetTemplateRepository.cs
│   └── ...
└── Services/
    └── IntuneService.cs            # Microsoft Graph integration
```

### API Layer Structure

```
DjoppieInventory.API/
├── Controllers/
│   ├── AssetsController.cs         # Asset CRUD operations
│   ├── AssetTypesController.cs     # Asset type management
│   ├── AssetTemplatesController.cs # Template management
│   ├── AssetEventsController.cs    # Event history
│   ├── BuildingsController.cs      # Location management
│   ├── CategoriesController.cs     # Category management
│   ├── ServicesController.cs       # Department management
│   ├── SectorsController.cs        # Sector management
│   ├── LeaseContractsController.cs # Lease management
│   ├── IntuneController.cs         # Intune device data
│   ├── GraphController.cs          # MS Graph queries
│   ├── QRCodeController.cs         # QR code generation
│   ├── RolloutsController.cs       # Rollout planning
│   ├── CsvImportController.cs      # Bulk import
│   └── UserController.cs           # User profile
├── Extensions/
│   ├── AuthenticationExtensions.cs # Entra ID setup
│   ├── DatabaseExtensions.cs       # EF Core configuration
│   ├── ServiceCollectionExt.cs     # DI registration
│   └── ...
├── Middleware/
│   └── ExceptionHandlingMiddleware.cs
└── Program.cs                      # Application entry point
```

---

## Authentication & Security

### Authentication Flow

```
┌──────────┐     1. Login      ┌─────────────┐
│  Browser │─────────────────► │  Entra ID   │
│  (React) │                    │   (IdP)     │
└────┬─────┘                    └──────┬──────┘
     │                                 │
     │  2. Auth code (PKCE)            │
     │◄────────────────────────────────┘
     │
     │  3. Exchange code for tokens
     │─────────────────────────────────►
     │                                 │
     │  4. Access token (JWT)          │
     │◄────────────────────────────────┘
     │
     │  5. API call + Bearer token     ┌─────────────┐
     │─────────────────────────────────►│   Backend   │
     │                                  │     API     │
     │                                  └──────┬──────┘
     │                                         │
     │                                         │ 6. Validate
     │                                         │    token
     │                                         ▼
     │                                  ┌─────────────┐
     │  7. Response                     │  Entra ID   │
     │◄─────────────────────────────────┤  (Token     │
                                        │   validation)│
                                        └─────────────┘
```

### Entra ID Configuration

| Component | Client ID | Purpose |
|-----------|-----------|---------|
| **Frontend SPA** | `b0b10b6c-8638-4bdd-9684-de4a55afd521` | User authentication (shared for all environments) |
| **Backend API (DEV)** | `eb5bcf06-8032-494f-a363-92b6802c44bf` | Token validation + Microsoft Graph access |

**Required API Permissions** (Backend):
- `DeviceManagementManagedDevices.Read.All` (Application)
- `Device.Read.All` (Application)
- `Directory.Read.All` (Application + Delegated)
- `User.Read` (Delegated)

### Security Features

| Feature | Implementation | Location |
|---------|---------------|----------|
| **Rate Limiting** | Fixed window limiter (100 req/min global, 20 req/min for Intune) | `Program.cs:30-88` |
| **HTTPS Enforcement** | Mandatory in production | Azure App Service |
| **Token Validation** | JWT Bearer with audience/issuer checks | `AuthenticationExtensions.cs` |
| **CORS** | Environment-specific allow list | `Program.cs:66-95` |
| **Input Validation** | FluentValidation on all DTOs | Core layer |
| **Secret Management** | Azure Key Vault with Managed Identity | Production only |
| **Exception Handling** | Global middleware with structured logging | `ExceptionHandlingMiddleware.cs` |

### Authorization Policies

```csharp
// Program.cs configuration
services.AddAuthorization(options =>
{
    options.FallbackPolicy = new AuthorizationPolicyBuilder()
        .RequireAuthenticatedUser()
        .Build();

    options.AddPolicy("RequireAdminRole", policy =>
        policy.RequireRole("Admin"));
});
```

---

## Database Schema

### Entity Relationship Diagram

```
┌─────────────────┐         ┌──────────────────┐
│    Category     │         │   AssetType      │
│─────────────────│         │──────────────────│
│ Id (PK)         │◄───┐    │ Id (PK)          │
│ Code (UQ)       │    │    │ Code (UQ)        │
│ Name            │    └────│ CategoryId (FK)  │
│ Description     │         │ Name             │
└─────────────────┘         └────────┬─────────┘
                                     │
                                     │ 1:N
                                     │
        ┌────────────────────────────┼────────────────────┐
        │                            │                    │
        │                            ▼                    │
        │                 ┌──────────────────┐            │
        │                 │     Asset        │            │
        │                 │──────────────────│            │
        │                 │ Id (PK)          │            │
        │                 │ AssetCode (UQ)   │            │
        │                 │ AssetName        │            │
        │                 │ Alias            │            │
        │                 │ Category         │            │
        │                 │ SerialNumber (UQ)│            │
        │                 │ Owner            │            │
        │                 │ Status (enum)    │            │
        │                 │ Brand, Model     │            │
        │          ┌──────│ AssetTypeId (FK) │            │
        │          │      │ ServiceId (FK)   │───┐        │
        │          │      │ InstallationLoc. │   │        │
        │          │      │ PurchaseDate     │   │        │
        │          │      │ WarrantyExpiry   │   │        │
        │          │      └─────┬────────────┘   │        │
        │          │            │                │        │
        │          │            │ 1:N            │        │
        │          │            ▼                │        │
        │          │   ┌────────────────┐        │        │
        │          │   │  AssetEvent    │        │        │
        │          │   │────────────────│        │        │
        │          │   │ Id (PK)        │        │        │
        │          │   │ AssetId (FK)   │        │        │
        │          │   │ EventType      │        │        │
        │          │   │ Description    │        │        │
        │          │   │ OldValue       │        │        │
        │          │   │ NewValue       │        │        │
        │          │   │ PerformedBy    │        │        │
        │          │   │ EventDate      │        │        │
        │          │   └────────────────┘        │        │
        │          │                             │        │
        │          │   ┌────────────────┐        │        │
        │          │   │ LeaseContract  │        │        │
        │          │   │────────────────│        │        │
        │          └──►│ AssetId (FK)   │        │        │
        │              │ ContractNumber │        │        │
        │              │ Vendor         │        │        │
        │              │ StartDate      │        │        │
        │              │ EndDate        │        │        │
        │              │ MonthlyRate    │        │        │
        │              │ Status (enum)  │        │        │
        │              └────────────────┘        │        │
        │                                        │        │
        └────────────────────────────────────────┘        │
                                                          │
┌─────────────────┐         ┌──────────────────┐         │
│     Sector      │         │     Service      │         │
│─────────────────│         │──────────────────│         │
│ Id (PK)         │◄───┐    │ Id (PK)          │◄────────┘
│ Code (UQ)       │    └────│ SectorId (FK)    │
│ Name            │         │ Code (UQ)        │
└─────────────────┘         │ Name             │
                            └──────────────────┘

┌─────────────────┐
│    Building     │
│─────────────────│
│ Id (PK)         │
│ Code (UQ)       │
│ Name            │
│ Address         │
│ IsActive        │
└─────────────────┘

┌──────────────────┐         ┌─────────────────┐
│ AssetTemplate    │         │ RolloutSession  │
│──────────────────│         │─────────────────│
│ Id (PK)          │         │ Id (PK)         │
│ TemplateName     │         │ SessionName     │
│ AssetName        │         │ Description     │
│ AssetTypeId (FK) │         │ Status (enum)   │
│ ServiceId (FK)   │         │ PlannedStartDate│
│ Category         │         │ CreatedBy       │
│ Brand, Model     │         └────────┬────────┘
│ Status           │                  │ 1:N
└──────────────────┘                  ▼
                            ┌─────────────────┐
                            │   RolloutDay    │
                            │─────────────────│
                            │ Id (PK)         │
                            │ SessionId (FK)  │
                            │ Date            │
                            │ ServiceIds      │
                            └────────┬────────┘
                                     │ 1:N
                                     ▼
                            ┌──────────────────┐
                            │ RolloutWorkplace │
                            │──────────────────│
                            │ Id (PK)          │
                            │ RolloutDayId (FK)│
                            │ ServiceId (FK)   │
                            │ UserName         │
                            │ UserEmail        │
                            │ Location         │
                            │ AssetPlansJson   │
                            │ Status (enum)    │
                            │ CompletedBy      │
                            └──────────────────┘
```

### Key Entities

#### Asset Entity

The core entity representing IT assets.

```csharp
public class Asset
{
    public int Id { get; set; }
    public string AssetCode { get; set; }           // AUTO: PREFIX-####
    public string AssetName { get; set; }           // From Intune
    public string? Alias { get; set; }              // User-friendly name
    public string Category { get; set; }
    public bool IsDummy { get; set; }               // Test/dummy assets
    public string? Owner { get; set; }
    public string? JobTitle { get; set; }
    public string? OfficeLocation { get; set; }
    public AssetStatus Status { get; set; }
    public string? Brand { get; set; }
    public string? Model { get; set; }
    public string? SerialNumber { get; set; }       // Unique when provided
    public DateTime? PurchaseDate { get; set; }
    public DateTime? WarrantyExpiry { get; set; }
    public DateTime? InstallationDate { get; set; }

    // Relational properties
    public int? AssetTypeId { get; set; }
    public int? ServiceId { get; set; }
    public string? InstallationLocation { get; set; }

    // Navigation properties
    public AssetType? AssetType { get; set; }
    public Service? Service { get; set; }
    public ICollection<AssetEvent> Events { get; set; }
    public ICollection<LeaseContract> LeaseContracts { get; set; }
}
```

#### AssetStatus Enum

```csharp
public enum AssetStatus
{
    InGebruik = 0,      // In gebruik (in use)
    Stock = 1,          // Stock (available)
    Herstelling = 2,    // Herstelling (repair)
    Defect = 3,         // Defect (broken)
    UitDienst = 4,      // Uit dienst (decommissioned)
    Nieuw = 5           // Nieuw (new, not yet deployed)
}
```

### Database Providers

| Environment | Provider | Connection String Location |
|-------------|----------|---------------------------|
| **Development** | SQLite | `appsettings.Development.json` (file: `djoppie.db`) |
| **Azure DEV** | Azure SQL | Azure Key Vault: `ConnectionStrings--DefaultConnection` |
| **Azure PROD** | Azure SQL | Azure Key Vault: `ConnectionStrings--DefaultConnection` |

**Migration Strategy:**
- Local dev: `EnsureCreated()` on startup
- Azure: Manual migrations via EF Core CLI or CI/CD

---

## Key Services

### IntuneService

**Purpose**: Integrate with Microsoft Graph API to retrieve device information from Intune.

**Location**: `DjoppieInventory.Infrastructure/Services/IntuneService.cs`

**Key Operations**:
- `GetManagedDevicesAsync()` - Retrieve all Intune managed devices
- `GetDeviceBySerialNumberAsync(string serialNumber)` - Find specific device
- `SearchDevicesByNameAsync(string searchTerm)` - Search devices

**Graph API Endpoints Used**:
- `GET /deviceManagement/managedDevices`
- `GET /devices`
- `GET /directoryObjects`

**Rate Limiting**: 20 requests per minute (configured in `Program.cs:46-56`)

### QRCodeController

**Purpose**: Generate QR codes for assets (SVG format).

**Location**: `DjoppieInventory.API/Controllers/QRCodeController.cs`

**Endpoint**: `GET /api/qrcode/{assetCode}`

**Response**: SVG data containing the asset code

---

## API Endpoints

### Core Controllers

| Controller | Base Route | Purpose |
|-----------|-----------|---------|
| `AssetsController` | `/api/assets` | Asset CRUD operations |
| `AssetTypesController` | `/api/assettypes` | Asset type management |
| `AssetTemplatesController` | `/api/assettemplates` | Template management |
| `AssetEventsController` | `/api/assetevents` | Event history/audit trail |
| `BuildingsController` | `/api/buildings` | Location management |
| `CategoriesController` | `/api/categories` | Category management |
| `ServicesController` | `/api/services` | Department/service management |
| `SectorsController` | `/api/sectors` | Sector management |
| `LeaseContractsController` | `/api/leasecontracts` | Lease contract management |
| `IntuneController` | `/api/intune` | Intune device queries |
| `GraphController` | `/api/graph` | Microsoft Graph queries |
| `QRCodeController` | `/api/qrcode` | QR code generation |
| `RolloutsController` | `/api/rollouts` | Rollout planning workflow |
| `CsvImportController` | `/api/csvimport` | Bulk import from CSV |
| `UserController` | `/api/user` | Current user profile |

### AssetsController Endpoints

```
GET    /api/assets              - List all assets (with filtering)
GET    /api/assets/{id}         - Get asset by ID
GET    /api/assets/code/{code}  - Get asset by asset code
POST   /api/assets              - Create new asset
PUT    /api/assets/{id}         - Update asset
DELETE /api/assets/{id}         - Delete asset
GET    /api/assets/export/csv   - Export assets to CSV
GET    /api/assets/export/excel - Export assets to Excel
```

### Authentication

All endpoints require authentication via JWT Bearer token except:
- `/api/health` (health check)
- Swagger UI (development only)

**Admin-only endpoints** use `[Authorize(Policy = "RequireAdminRole")]`

---

## Frontend Architecture

### Component Structure

```
src/frontend/src/
├── main.tsx                        # Entry point + MSAL provider
├── App.tsx                         # Root component + routing
├── api/
│   ├── axiosInstance.ts            # Axios with MSAL interceptor
│   ├── assetService.ts             # Asset API calls
│   ├── templateService.ts          # Template API calls
│   └── intuneService.ts            # Intune API calls
├── components/                     # Reusable UI components
│   ├── AssetTableView.tsx          # Main asset list/table
│   ├── StatusBadge.tsx             # Status indicator
│   ├── QRCodeDisplay.tsx           # QR code viewer
│   └── Navigation.tsx              # App navigation
├── pages/                          # Page-level components (routed)
│   ├── DashboardPage.tsx
│   ├── AssetDetailPage.tsx
│   ├── AddAssetPage.tsx
│   ├── EditAssetPage.tsx
│   ├── ScanPage.tsx
│   ├── RolloutPlannerPage.tsx
│   └── ...
├── hooks/                          # Custom React hooks
│   ├── useAssets.ts                # TanStack Query for assets
│   └── useAuth.ts                  # Authentication state
├── config/
│   ├── msalConfig.ts               # MSAL configuration
│   └── apiConfig.ts                # API base URL
├── i18n/                           # Translations
│   ├── nl.json                     # Dutch (primary)
│   └── en.json                     # English
├── types/                          # TypeScript definitions
└── utils/                          # Helper functions
```

### State Management

| Concern | Technology | Purpose |
|---------|-----------|---------|
| **Server State** | TanStack Query (React Query) | API data caching, refetching, mutations |
| **Authentication** | MSAL React | Token management, silent auth |
| **Local State** | React useState/useReducer | Component-level state |
| **Theme** | React Context | Dark/light mode |
| **Language** | i18next | Dutch/English translations |

### Data Flow

```
User Action
    │
    ▼
React Component (Page/Component)
    │
    ▼
Custom Hook (useAssets, useAuth)
    │
    ▼
TanStack Query (cache, refetch, mutations)
    │
    ▼
API Service (Axios + MSAL interceptor)
    │
    ▼
Backend API ──► Response ──► TanStack Cache ──► Component Re-render
```

### Key Frontend Patterns

| Pattern | Implementation |
|---------|---------------|
| **Authentication** | MSAL React handles login flow, token acquisition, silent refresh |
| **HTTP Client** | Axios instance with automatic Bearer token injection via interceptor |
| **Routing** | React Router 7 with protected routes |
| **Forms** | Controlled components with Material-UI inputs |
| **QR Scanning** | html5-qrcode library for camera access |
| **QR Generation** | qrcode.react for rendering + SVG download |

---

## Deployment

### Development Environment

```bash
# Backend (Terminal 1)
cd src/backend/DjoppieInventory.API
dotnet run
# Runs at http://localhost:5052

# Frontend (Terminal 2)
cd src/frontend
npm install
npm run dev
# Runs at http://localhost:5173
```

### Azure DEV Environment

**Infrastructure** (deployed via Bicep):
- Resource Group: `rg-djoppie-inventory-dev`
- App Service Plan: F1 Free tier
- App Service: Backend API (.NET 8)
- Static Web App: Frontend SPA (React)
- Azure SQL: Serverless (0.5-1 vCore, auto-pause 60min)
- Key Vault: Standard (secrets management)
- Application Insights: Monitoring and telemetry
- Log Analytics Workspace: Centralized logging

**Deployment Methods**:

1. **Automated** (recommended):
   ```powershell
   # From repository root
   .\deploy-dev.ps1
   ```

2. **Manual Backend**:
   ```bash
   cd src/backend/DjoppieInventory.API
   dotnet publish -c Release -o ./publish
   # Upload to App Service via Azure CLI or Portal
   ```

3. **Manual Frontend**:
   ```bash
   cd src/frontend
   npm run build
   # Deploy dist/ to Static Web App
   ```

### Environment Variables

**Backend** (`appsettings.{Environment}.json` + Key Vault):
- `ConnectionStrings:DefaultConnection` - Database connection string
- `AzureAd:TenantId` - Entra ID tenant
- `AzureAd:ClientId` - Backend API client ID
- `AzureAd:ClientSecret` - Client secret (Key Vault only)
- `AzureAd:Audience` - Expected token audience
- `ApplicationInsights:ConnectionString` - Telemetry endpoint

**Frontend** (`.env.{environment}`):
- `VITE_API_URL` - Backend API base URL
- `VITE_ENTRA_CLIENT_ID` - Frontend SPA client ID
- `VITE_ENTRA_TENANT_ID` - Entra ID tenant
- `VITE_ENTRA_AUTHORITY` - Entra ID authority URL
- `VITE_ENTRA_REDIRECT_URI` - Redirect URI after auth
- `VITE_ENTRA_API_SCOPE` - Backend API scope

### Database Migrations

```bash
# Create new migration
cd src/backend
dotnet ef migrations add <MigrationName> \
  --project DjoppieInventory.Infrastructure \
  --startup-project DjoppieInventory.API

# Apply migrations locally
dotnet ef database update \
  --project DjoppieInventory.Infrastructure \
  --startup-project DjoppieInventory.API

# Apply migrations to Azure SQL
# (Get connection string from Key Vault first)
dotnet ef database update \
  --project DjoppieInventory.Infrastructure \
  --startup-project DjoppieInventory.API \
  --connection "Server=tcp:..."
```

---

## Additional Resources

- **User Manual**: [README.md](README.md) - Dutch user guide
- **Developer Guide**: [CLAUDE.md](CLAUDE.md) - Comprehensive development reference
- **Azure DevOps Wiki**: [docs/wiki/](docs/wiki/) - Structured documentation
- **Print Label Feature**: [docs/PRINT-LABEL-FEATURE.md](docs/PRINT-LABEL-FEATURE.md)
- **Rollout Process**: [docs/ROLLOUT-PROCESS-GUIDE.md](docs/ROLLOUT-PROCESS-GUIDE.md)

---

**Document Version**: 1.0
**Last Updated**: March 11, 2026
**Author**: Claude Code (Anthropic)
**Maintainer**: jo.wijnen@diepenbeek.be

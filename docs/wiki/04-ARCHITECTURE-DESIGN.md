# Architecture Design - Djoppie Inventory

> Top-level architecture overview of the Djoppie Inventory asset management system.

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [High-Level Architecture](#2-high-level-architecture)
3. [Backend Architecture](#3-backend-architecture)
4. [Frontend Architecture](#4-frontend-architecture)
5. [Authentication and Security](#5-authentication-and-security)
6. [Data Architecture](#6-data-architecture)
7. [Azure Infrastructure](#7-azure-infrastructure)
8. [Integration Points](#8-integration-points)
9. [Technology Stack](#9-technology-stack)

---

## 1. System Overview

**Djoppie Inventory** is an asset and inventory management system designed for IT-support and inventory managers at Gemeente Diepenbeek. The system tracks IT assets with integration to Microsoft Intune for enhanced hardware inventory management.

### Core Capabilities

| Capability | Description |
|-----------|-------------|
| **Asset Management** | CRUD operations for IT assets with status tracking |
| **QR Code Scanning** | Instant asset lookup via device camera |
| **Intune Integration** | Pull device data from Microsoft Intune/Entra |
| **Status Tracking** | Track assets through lifecycle states |
| **Asset Templates** | Quick creation from predefined templates |
| **Multilingual** | Dutch (primary) and English support |
| **QR Code Generation** | Generate and download SVG QR codes for assets |

### Asset Lifecycle States

```
  [Stock] --> [InGebruik] --> [Herstelling] --> [InGebruik]
                  |                                  |
                  v                                  v
              [Defect] -----------------------> [UitDienst]
```

| Status | Dutch | Description |
|--------|-------|-------------|
| `InGebruik` (0) | In gebruik | Asset is actively in use |
| `Stock` (1) | Stock | Available in inventory |
| `Herstelling` (2) | Herstelling | Under repair |
| `Defect` (3) | Defect | Broken / defective |
| `UitDienst` (4) | Uit dienst | Decommissioned |

---

## 2. High-Level Architecture

```
                    +------------------+
                    | Microsoft Entra  |
                    | ID (Azure AD)    |
                    |  Tenant:         |
                    |  Diepenbeek      |
                    +--------+---------+
                             |
              JWT Tokens     |     Service Principal
           +---------------++--------------+
           |                                |
           v                                v
+----------+----------+        +-----------+-----------+
|    Frontend SPA     |        |   Microsoft Graph     |
|    (React 19)       |        |   / Intune API        |
|                     |        +-----------+-----------+
|  Static Web App     |                    ^
|  (Azure)            |                    |
+---------+-----------+                    |
          |                                |
          | REST API + Bearer Token        |
          |                                |
          v                                |
+---------+-----------+                    |
|    Backend API      +--------------------+
|    (ASP.NET Core 8) |
|                     |
|  App Service        |
|  (Azure)            |
+---------+-----------+
          |
          | Entity Framework Core
          |
          v
+---------+-----------+
|    Database         |
|    SQLite (local)   |
|    Azure SQL (prod) |
+---------------------+
```

### Request Flow

1. **User** opens the web application in a browser
2. **MSAL.js** authenticates the user against **Entra ID** and obtains a JWT token
3. **React SPA** makes API calls with the JWT token in the `Authorization` header
4. **ASP.NET Core API** validates the token and processes the request
5. **Entity Framework Core** reads/writes data to the database
6. For Intune data, the API uses its **service principal** credentials to call **Microsoft Graph**

---

## 3. Backend Architecture

### Clean Architecture (3 Layers)

```
+------------------------------------------------------------------+
|                        API Layer                                  |
|  DjoppieInventory.API                                            |
|                                                                  |
|  Controllers/          Extensions/          Middleware/           |
|  - AssetsController    - AuthenticationExt   - ExceptionHandling |
|  - AssetTemplates      - DatabaseExt                             |
|  - IntuneController    - ServiceCollection                       |
|  - QRCodeController                                              |
|  - UserController      Program.cs (entry point)                  |
+------------------------------------------------------------------+
          |                        |
          v                        v
+-------------------+    +-------------------+
|   Core Layer      |    | Infrastructure    |
|   (Domain)        |    | Layer             |
|                   |    |                   |
|   Entities/       |    | Data/             |
|   - Asset         |    | - AppDbContext    |
|   - AssetTemplate |    |                   |
|                   |    | Repositories/     |
|   DTOs/           |    | - AssetRepo       |
|   - AssetDto      |    | - TemplateRepo    |
|   - CreateAssetDto|    |                   |
|                   |    | Services/         |
|   Interfaces/     |    | - IntuneService   |
|   - IAssetRepo    |    |   (Graph API)     |
|   - ITemplateRepo |    |                   |
|                   |    |                   |
|   Validators/     |    |                   |
|   - FluentValid.  |    |                   |
+-------------------+    +-------------------+
```

### Dependency Direction

```text
API Layer --> Core Layer <-- Infrastructure Layer
```

- **Core** has no dependencies on other layers
- **API** depends on Core (DTOs, interfaces)
- **Infrastructure** depends on Core (implements interfaces)
- Dependencies are resolved via **Dependency Injection** in `Program.cs`

### API Endpoints

| Controller | Route | Purpose |
|-----------|-------|---------|
| `AssetsController` | `/api/assets` | Asset CRUD operations |
| `AssetTemplatesController` | `/api/assettemplates` | Template management |
| `IntuneController` | `/api/intune` | Intune device data |
| `QRCodeController` | `/api/qrcode` | QR code generation (SVG) |
| `UserController` | `/api/user` | Current user profile |

All endpoints require authentication. Admin endpoints use the `RequireAdminRole` policy.

### Key Backend Patterns

| Pattern | Implementation |
|---------|---------------|
| Repository Pattern | `IAssetRepository` / `AssetRepository` |
| DTO Mapping | AutoMapper for Entity <-> DTO conversion |
| Validation | FluentValidation for input validation |
| Exception Handling | Global middleware (`ExceptionHandlingMiddleware`) |
| Configuration | Options pattern with environment-specific `appsettings` |

---

## 4. Frontend Architecture

### Component Structure

```
src/frontend/src/
  |
  +-- App.tsx                    # Root component, routing setup
  +-- main.tsx                   # Entry point, MSAL provider
  |
  +-- pages/                     # Page-level components (routed)
  |     +-- DashboardPage        # Home dashboard with stats
  |     +-- AssetDetailPage      # Single asset view + QR code
  |     +-- AddAssetPage         # Create new asset form
  |     +-- EditAssetPage        # Edit existing asset
  |     +-- BulkCreateAssetPage  # Bulk asset creation
  |     +-- AssetTemplatesPage   # Manage templates
  |     +-- ScanPage             # QR code scanner
  |
  +-- components/                # Reusable UI components
  |     +-- AssetList            # Filterable asset table
  |     +-- StatusBadge          # Color-coded status indicator
  |     +-- QRCodeDisplay        # QR code viewer + download
  |     +-- Navigation           # App navigation bar
  |     +-- LoadingSpinner       # Loading animation
  |
  +-- api/                       # API service layer
  |     +-- axiosInstance        # Axios with MSAL interceptor
  |     +-- assetService         # Asset API calls
  |     +-- templateService      # Template API calls
  |     +-- intuneService        # Intune API calls
  |
  +-- hooks/                     # Custom React hooks
  |     +-- useAssets            # TanStack Query for assets
  |     +-- useAuth              # Authentication state
  |
  +-- config/                    # App configuration
  |     +-- msalConfig           # MSAL configuration
  |     +-- apiConfig            # API base URL
  |
  +-- contexts/                  # React contexts
  |     +-- ThemeContext          # Light/dark mode
  |
  +-- i18n/                      # Translations
  |     +-- nl.json              # Dutch (primary)
  |     +-- en.json              # English
  |
  +-- theme/                     # Material-UI theme
  +-- types/                     # TypeScript type definitions
  +-- constants/                 # App constants
```

### Frontend Data Flow

```
User Action
    |
    v
React Component (Page/Component)
    |
    v
Custom Hook (useAssets, useAuth)
    |
    v
TanStack Query (cache, refetch, mutations)
    |
    v
API Service (Axios + MSAL interceptor)
    |
    v
ASP.NET Core API --> Response --> TanStack Cache --> Component Re-render
```

### Key Frontend Patterns

| Pattern | Technology | Purpose |
|---------|-----------|---------|
| Server state management | TanStack Query | Caching, refetching, optimistic updates |
| Authentication | MSAL React | Token management, silent auth |
| HTTP Client | Axios | API calls with auth interceptor |
| Routing | React Router 7 | Client-side navigation |
| UI Components | Material-UI 7 | Design system |
| Internationalization | i18next | Dutch/English translations |
| Form handling | React controlled components | Input management |

---

## 5. Authentication and Security

### Authentication Architecture

```
+-------------+     +----------------+     +------------------+
|  Browser    |     | Entra ID       |     | Backend API      |
|  (React)    |     | (IdP)          |     | (Resource Server)|
+------+------+     +-------+--------+     +--------+---------+
       |                    |                        |
       |  1. Login request  |                        |
       +------------------->|                        |
       |                    |                        |
       |  2. Auth code      |                        |
       |<-------------------+                        |
       |                    |                        |
       |  3. Exchange code  |                        |
       |  for tokens (PKCE) |                        |
       +------------------->|                        |
       |                    |                        |
       |  4. Access token   |                        |
       |  (JWT)             |                        |
       |<-------------------+                        |
       |                    |                        |
       |  5. API call with Bearer token              |
       +-------------------------------------------->|
       |                    |                        |
       |                    |  6. Validate token     |
       |                    |<-----------------------+
       |                    |                        |
       |                    |  7. Token valid        |
       |                    +----------------------->|
       |                    |                        |
       |  8. API response                            |
       |<--------------------------------------------+
```

### Security Measures

| Layer | Measure | Implementation |
|-------|---------|---------------|
| **Transport** | HTTPS only | App Service enforced |
| **Authentication** | OAuth 2.0 + PKCE | MSAL React + Microsoft.Identity.Web |
| **Authorization** | Role-based (RBAC) | `[Authorize]` + custom policies |
| **Secrets** | Azure Key Vault | Managed Identity access |
| **Database** | Encrypted connections | TLS + SQL Server encryption |
| **API** | Token validation | JWT Bearer with audience/issuer checks |
| **CORS** | Restricted origins | Environment-specific allow list |
| **Input** | FluentValidation | Server-side validation on all inputs |

### Token Claims Used

| Claim | Purpose |
|-------|---------|
| `aud` | Audience validation (`api://eb5bcf06-...`) |
| `iss` | Issuer validation (Entra ID) |
| `roles` | Authorization policy evaluation |
| `preferred_username` | User display name |
| `oid` | User object ID |

---

## 6. Data Architecture

### Entity Model

```
+---------------------------+        +---------------------------+
|         Asset             |        |     AssetTemplate         |
+---------------------------+        +---------------------------+
| Id           : int (PK)  |        | Id           : int (PK)  |
| AssetCode    : string    |        | TemplateName : string    |
| AssetName    : string    |        | Category     : string    |
| Category     : string    |        | Brand        : string?   |
| Owner        : string    |        | Model        : string?   |
| Building     : string    |        | Description  : string?   |
| SpaceOrFloor : string    |        | CreatedAt    : DateTime  |
| Status       : AssetStatus|       | UpdatedAt    : DateTime  |
| Brand        : string?   |        +---------------------------+
| Model        : string?   |
| SerialNumber : string?   |
| PurchaseDate : DateTime? |
| WarrantyExpiry: DateTime?|
| InstallationDate: DateTime?|
| CreatedAt    : DateTime  |
| UpdatedAt    : DateTime  |
+---------------------------+
```

### Database Strategy

| Environment | Provider | Configuration |
|-------------|----------|---------------|
| **Local Development** | SQLite | File: `djoppie.db` (auto-created) |
| **Azure DEV** | Azure SQL (Serverless) | GP_S_Gen5, 0.5-1 vCore, auto-pause 60 min |
| **Azure PROD** | Azure SQL (Standard) | GP_S_Gen5, 1-2 vCore |

Database provider is selected automatically in `DatabaseExtensions.cs` based on the `ASPNETCORE_ENVIRONMENT` value.

### Migration Strategy

- **Local**: `EnsureCreated()` on startup (no migration history)
- **Azure DEV**: `EnsureCreated()` when `Database:AutoMigrate = true`
- **Azure PROD**: Manual migrations via EF Core CLI or CI/CD pipeline

---

## 7. Azure Infrastructure

### DEV Environment

```
Azure Subscription
  |
  +-- rg-djoppie-inventory-dev (West Europe)
       |
       +-- Key Vault (Standard)
       |     - SQL connection string
       |     - Entra client secret
       |     - Entra tenant/client IDs
       |     - App Insights connection string
       |
       +-- Log Analytics Workspace
       |     - Central log aggregation
       |     - 30-day retention
       |
       +-- Application Insights
       |     - Connected to Log Analytics
       |     - Request tracing
       |     - Dependency tracking
       |
       +-- SQL Server (Serverless)
       |     - GP_S_Gen5 (0.5-1 vCore)
       |     - 32 GB max size
       |     - Auto-pause after 60 min
       |     - TDE enabled
       |
       +-- App Service Plan (F1 Free)
       |     +-- App Service (Backend API)
       |           - .NET 8 runtime
       |           - System-assigned Managed Identity
       |           - Key Vault RBAC access
       |           - HTTPS only
       |           - Health check: /health
       |
       +-- Static Web App (Free)
             - React SPA hosting
             - Global CDN
             - Custom domain support
             - Staging environments
```

### PROD Environment (Planned??)

Additional features over DEV:

| Feature | Implementation |
|---------|---------------|
| App Service Plan | S1 Standard (deployment slots) |
| SQL Database | 1-2 vCore, no auto-pause |
| Key Vault | Purge protection enabled |
| Redis Cache | C0 Basic (optional) |
| Auto-scaling | 1-3 instances |
| Geo-replication | North Europe (optional) |
| Log retention | 90 days |

### Cost Summary

| Environment | Monthly Cost |
|-------------|-------------|
| DEV | ~6-8.50 EUR |
| PROD (base) | ~140-160 EUR |
| PROD (+ Redis) | ~155-175 EUR |
| PROD (+ Redis + DR) | ~190-220 EUR |

---

## 8. Integration Points

### Microsoft Graph / Intune

The backend integrates with Microsoft Graph to retrieve device information from Intune:

```
Backend API
    |
    +-- IntuneService (DjoppieInventory.Infrastructure/Services/IntuneService.cs)
          |
          +-- Microsoft.Graph SDK
                |
                +-- GET /deviceManagement/managedDevices
                +-- GET /devices
                +-- GET /directoryObjects
```

**Required API Permissions**:

| Permission | Type | Description |
|------------|------|-------------|
| `DeviceManagementManagedDevices.Read.All` | Application | Read Intune devices |
| `Device.Read.All` | Application | Read Entra device objects |
| `Directory.Read.All` | Application + Delegated | Read directory data |
| `User.Read` | Delegated | Read user profile |

### QR Code System

```
Asset Creation/Update
    |
    v
QR Code Generation (Backend - QRCodeController)
    |
    +-- Generates SVG with asset code
    +-- Returns SVG data to frontend
    |
    v
QR Code Display (Frontend - qrcode.react)
    |
    +-- Renders QR code in asset detail view
    +-- Download as SVG file ({AssetCode}-QR.svg)

QR Code Scanning (Frontend - html5-qrcode)
    |
    +-- Opens device camera
    +-- Decodes QR code content (asset code)
    +-- Navigates to asset detail page
```

---

## 9. Technology Stack

### Backend

| Technology | Version | Purpose |
|-----------|---------|---------|
| ASP.NET Core | 8.0 | Web API framework |
| C# | 12 | Programming language |
| Entity Framework Core | 8.x | ORM / Data access |
| Microsoft.Identity.Web | Latest | Entra ID authentication |
| Microsoft.Graph SDK | Latest | Intune/Graph integration |
| FluentValidation | Latest | Input validation |
| AutoMapper | Latest | Object mapping |
| Application Insights SDK | Latest | Telemetry |

### Frontend

| Technology | Version | Purpose |
|-----------|---------|---------|
| React | 19.2.0 | UI framework |
| TypeScript | 5.9.3 | Type safety |
| Vite | 7.2.4 | Build tool / dev server |
| Material-UI (MUI) | 7.3.7 | Component library |
| React Router | 7.12.0 | Client-side routing |
| TanStack Query | 5.90.17 | Server state / caching |
| Axios | 1.13.2 | HTTP client |
| MSAL React | 5.0.3 | Authentication |
| i18next | 25.7.4 | Internationalization |
| html5-qrcode | 2.3.8 | QR code scanning |
| qrcode.react | 4.2.0 | QR code generation |
| date-fns | 4.1.0 | Date formatting |

### Infrastructure

| Technology | Purpose |
|-----------|---------|
| Azure App Service | Backend API hosting |
| Azure Static Web Apps | Frontend SPA hosting |
| Azure SQL Database | Relational data storage |
| Azure Key Vault | Secrets management |
| Azure Application Insights | APM / Monitoring |
| Azure Log Analytics | Log aggregation |
| Bicep | Infrastructure as Code |
| Azure DevOps Pipelines | CI/CD automation |

### Development Tools

| Tool | Purpose |
|------|---------|
| Git / GitHub | Source control |
| PowerShell 7 | Deployment scripts |
| Azure CLI | Azure resource management |
| EF Core CLI | Database migrations |
| ESLint | Frontend code quality |
| dotnet format | Backend code formatting |

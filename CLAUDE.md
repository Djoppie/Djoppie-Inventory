# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Djoppie Inventory** is an asset and inventory management system designed for IT-support and inventory managers. The system focuses on tracking IT assets with integration to Microsoft Intune for enhanced hardware inventory management.

### Core Features

- QR code scanning for instant asset lookup
- Intune-enhanced hardware inventory (Intune Managed, Microsoft Entra Joined, or Entra Hybrid joined devices)
- Real-time inventory checks with filtering (All/InGebruik/Stock/Herstelling/Defect/UitDienst)
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

## Technology Stack

### Backend

- **ASP.NET Core 8.0** - Web API framework
- **C# 12** - Programming language
- **Entity Framework Core** - ORM for database access
- **Microsoft.Identity.Web** - Entra ID authentication
- **Microsoft.Graph** - SDK for Intune/Microsoft Graph API integration
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

```
src/backend/
├── DjoppieInventory.API/           # API Layer
│   ├── Controllers/                # API endpoints
│   │   ├── AssetsController.cs     # Asset CRUD operations
│   │   ├── AssetTemplatesController.cs
│   │   ├── IntuneController.cs     # Intune device data
│   │   ├── QRCodeController.cs     # QR code generation
│   │   └── UserController.cs       # User profile
│   ├── Program.cs                  # Application entry point & DI configuration
│   ├── appsettings.json           # Base configuration
│   ├── appsettings.Development.json    # Local dev config
│   ├── appsettings.AzureDev.json      # Azure DEV config
│   └── appsettings.Production.json    # Azure PROD config
│
├── DjoppieInventory.Core/          # Domain Layer
│   ├── Entities/                   # Domain models
│   │   ├── Asset.cs               # Asset entity with AssetStatus enum
│   │   └── AssetTemplate.cs
│   ├── DTOs/                      # Data transfer objects
│   └── Interfaces/                # Repository & service contracts
│
└── DjoppieInventory.Infrastructure/ # Infrastructure Layer
    ├── Data/
    │   └── ApplicationDbContext.cs # EF Core DbContext
    ├── Repositories/              # Data access implementations
    └── Services/
        └── IntuneService.cs       # Microsoft Graph/Intune integration
```

### Frontend Structure

```
src/frontend/
├── src/
│   ├── components/    # Reusable UI components
│   ├── pages/         # Page-level components
│   ├── services/      # API service layer (Axios)
│   ├── hooks/         # Custom React hooks
│   ├── config/        # MSAL and app configuration
│   ├── utils/         # Helper functions
│   ├── types/         # TypeScript type definitions
│   └── i18n/          # Translation files (nl/en)
├── .env.development   # Local dev environment variables
├── .env.production    # Azure production environment variables
├── package.json
└── vite.config.ts
```

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

## Environment Configuration

### Local Development Setup

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
    "ClientSecret": "vu-8Q~Z_KOrU5jQGlmGYXLDBDpmDd83hRg2AscA_",
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

- Backend: `QRCodeController.cs` generates SVG format QR codes
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
9. Create controller in `DjoppieInventory.API/Controllers/`

### Adding a New API Endpoint

1. Add method to appropriate controller or create new controller
2. Define request/response DTOs if needed
3. Add authorization attribute if required: `[Authorize]` or `[Authorize(Policy = "RequireAdminRole")]`
4. Test endpoint via Swagger at <http://localhost:5052/swagger>
5. Update frontend service layer to call new endpoint

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
- **.azuredevops/README.md** - Azure DevOps pipeline setup

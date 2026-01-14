# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Djoppie Inventory** is an asset and inventory management system designed for IT-support and inventory managers. The system focuses on tracking IT assets with integration to Microsoft Intune for enhanced hardware inventory management.

### Core Features

- QR code scanning for instant asset lookup
- Intune-enhanced hardware inventory (Intune Managed, Microsoft Entra Joined, or Entra Hybrid joined devices)
- Real-time inventory checks
- Asset data management (owner, location, status, installation dates)
- Digital QR code generation
- Service request creation and tracking
- Professional UI/UX with animations in "Djoppie-style"

### Key Functional Areas

1. **Asset Scanning** - QR code scanning and manual asset code entry
2. **Inventory Dashboard** - Asset listing with filtering by status (All/Active/Maintenance)
3. **Asset Management** - CRUD operations for assets with template library support
4. **Asset Details** - Comprehensive view including QR codes, technical specs, and history

### Asset Data Model

Based on the documentation, assets track:

- **Identification**: Asset Code (unique), Asset Name, Category
- **Assignment**: Owner, Building, Space/Floor, Status (Active/Maintenance)
- **Technical Details**: Brand, Model, Serial Number
- **Lifecycle**: Purchase Date, Warranty Expiry, Installation Date
- **History**: Owner and installation history tracking

### Pre-defined Templates

The system includes asset templates for common IT equipment:

- Dell Latitude Laptop (Computing)
- HP LaserJet Printer (Peripherals)
- Cisco Network Switch (Networking)
- Samsung Monitor 27" (Displays)
- Logitech Wireless Mouse (Peripherals)

## Integration Points

### Microsoft Intune Integration

The system integrates with Microsoft Intune for enhanced hardware inventory:

- Device management portal: <https://intune.microsoft.com/#view/Microsoft_Intune_DeviceSettings/DevicesMenu/~/overview>
- Configuration profiles: Manage Devices / Configuration
- Supports Intune Managed devices, Microsoft Entra Joined, and Entra Hybrid joined devices

## Technology Stack

### Frontend

- **React 18+** - Modern UI framework for building responsive web application
- **TypeScript** - Type safety and better IDE support
- **Vite** - Fast build tool and dev server
- **React Router** - Client-side routing
- **React Query (TanStack Query)** - Server state management and caching
- **Axios** - HTTP client for API calls
- **Tailwind CSS** or **Material-UI** - Styling framework for professional UI
- **html5-qrcode** or **react-qr-scanner** - QR code scanning in browser

### Backend

- **ASP.NET Core 8.0** - Modern, cross-platform web API framework
- **C# 12** - Programming language
- **Entity Framework Core** - ORM for database access
- **Microsoft.Identity.Web** - Entra ID authentication
- **Microsoft.Graph** - SDK for Intune/Microsoft Graph API integration
- **AutoMapper** - Object mapping
- **Serilog** - Structured logging

### Database

- **Azure SQL Database** - Managed relational database
- **Entity Framework Core Migrations** - Database schema management

### Authentication & Authorization

- **Microsoft Entra ID (Azure AD)** - Single sign-on for Diepenbeek tenant
- **OAuth 2.0 / OpenID Connect** - Authentication flow
- **Microsoft Graph API** - Intune device data access
- **Azure App Registration** - Service principal for API access

### Infrastructure

- **Azure App Service** - Backend API hosting
- **Azure Static Web Apps** or **Azure App Service** - Frontend hosting
- **Azure DevOps Pipelines** - CI/CD
- **Azure Key Vault** - Secrets management (connection strings, API keys)
- **Azure Application Insights** - Monitoring and telemetry

## Architecture

### Project Structure

```
Djoppie-Inventory/
├── src/
│   ├── frontend/              # React application
│   │   ├── src/
│   │   │   ├── components/    # Reusable UI components
│   │   │   ├── pages/         # Page-level components
│   │   │   ├── services/      # API service layer
│   │   │   ├── hooks/         # Custom React hooks
│   │   │   ├── utils/         # Helper functions
│   │   │   └── types/         # TypeScript type definitions
│   │   ├── public/
│   │   ├── package.json
│   │   └── vite.config.ts
│   │
│   └── backend/               # ASP.NET Core API
│       ├── DjoppieInventory.API/
│       │   ├── Controllers/   # API endpoints
│       │   ├── Program.cs
│       │   └── appsettings.json
│       ├── DjoppieInventory.Core/
│       │   ├── Entities/      # Domain models
│       │   ├── Interfaces/    # Repository/service interfaces
│       │   └── DTOs/          # Data transfer objects
│       ├── DjoppieInventory.Infrastructure/
│       │   ├── Data/          # DbContext, migrations
│       │   ├── Repositories/  # Data access implementations
│       │   └── Services/      # Business logic, Intune integration
│       └── DjoppieInventory.sln
│
├── azure-pipelines.yml        # CI/CD pipeline definition
└── README.md
```

### Authentication Flow

1. User navigates to web app
2. React app redirects to Microsoft Entra ID login (Diepenbeek tenant)
3. After successful auth, receives JWT access token
4. Token included in API requests to ASP.NET Core backend
5. Backend validates token and authorizes access
6. Backend uses service principal to call Microsoft Graph/Intune APIs

## Development Setup

### Prerequisites

- **Node.js 18+** and **npm**
- **.NET 8.0 SDK**
- **Azure CLI** (for deployment)
- **SQL Server Management Studio** or **Azure Data Studio** (optional, for database)
- **Visual Studio 2022** or **VS Code** with C# extensions

### Frontend Setup

```bash
cd src/frontend
npm install
npm run dev          # Start development server (http://localhost:5173)
npm run build        # Production build
npm run test         # Run tests
```

### Backend Setup

```bash
cd src/backend
dotnet restore
dotnet build

# Run database migrations
dotnet ef database update --project DjoppieInventory.Infrastructure --startup-project DjoppieInventory.API

# Start API
dotnet run --project DjoppieInventory.API    # https://localhost:7001
```

### Environment Configuration

#### Frontend (.env)

```
VITE_API_URL=https://localhost:7001/api
VITE_ENTRA_CLIENT_ID=<app-registration-client-id>
VITE_ENTRA_TENANT_ID=<diepenbeek-tenant-id>
VITE_ENTRA_REDIRECT_URI=http://localhost:5173
```

#### Backend (appsettings.Development.json)

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=DjoppieInventory;Trusted_Connection=true;"
  },
  "AzureAd": {
    "Instance": "https://login.microsoftonline.com/",
    "TenantId": "<diepenbeek-tenant-id>",
    "ClientId": "<backend-app-registration-client-id>",
    "ClientSecret": "<from-key-vault>",
    "Scopes": "api://djoppie-inventory/.default"
  },
  "MicrosoftGraph": {
    "BaseUrl": "https://graph.microsoft.com/v1.0",
    "Scopes": ["https://graph.microsoft.com/.default"]
  }
}
```

## Azure DevOps Deployment

### Azure Resources Setup

1. **Azure SQL Database** - Create database server and database
2. **App Service Plan** - Create plan for API hosting
3. **App Service** - Create web app for ASP.NET Core API
4. **Static Web App** - Create for React frontend (or use App Service)
5. **Azure Entra App Registrations** - Two registrations:
   - Frontend SPA registration (redirect URIs, implicit flow)
   - Backend API registration (expose API, app roles)
6. **Key Vault** - Store connection strings, client secrets
7. **Application Insights** - Monitoring

### Azure Pipeline (azure-pipelines.yml)

Create CI/CD pipeline for automated build and deployment:

```yaml
trigger:
  - main

pool:
  vmImage: 'ubuntu-latest'

variables:
  buildConfiguration: 'Release'

stages:
- stage: Build
  jobs:
  - job: BuildFrontend
    steps:
    - task: NodeTool@0
      inputs:
        versionSpec: '18.x'
    - script: |
        cd src/frontend
        npm ci
        npm run build
      displayName: 'Build React Frontend'
    - task: PublishBuildArtifacts@1
      inputs:
        PathtoPublish: 'src/frontend/dist'
        ArtifactName: 'frontend'

  - job: BuildBackend
    steps:
    - task: UseDotNet@2
      inputs:
        packageType: 'sdk'
        version: '8.x'
    - script: |
        cd src/backend
        dotnet build --configuration $(buildConfiguration)
        dotnet publish -c $(buildConfiguration) -o $(Build.ArtifactStagingDirectory)
      displayName: 'Build ASP.NET Core API'
    - task: PublishBuildArtifacts@1
      inputs:
        PathtoPublish: '$(Build.ArtifactStagingDirectory)'
        ArtifactName: 'backend'

- stage: Deploy
  dependsOn: Build
  jobs:
  - deployment: DeployBackend
    environment: 'production'
    strategy:
      runOnce:
        deploy:
          steps:
          - task: AzureWebApp@1
            inputs:
              azureSubscription: '<azure-service-connection>'
              appType: 'webApp'
              appName: 'djoppie-inventory-api'
              package: '$(Pipeline.Workspace)/backend'

  - deployment: DeployFrontend
    environment: 'production'
    strategy:
      runOnce:
        deploy:
          steps:
          - task: AzureStaticWebApp@0
            inputs:
              app_location: '$(Pipeline.Workspace)/frontend'
              azure_static_web_apps_api_token: '$(AZURE_STATIC_WEB_APPS_API_TOKEN)'
```

### Required Pipeline Variables

Configure these in Azure DevOps:

- `AZURE_SQL_CONNECTION_STRING` - Database connection string
- `ENTRA_CLIENT_ID` - Backend app registration client ID
- `ENTRA_CLIENT_SECRET` - Backend app secret (from Key Vault)
- `ENTRA_TENANT_ID` - Diepenbeek tenant ID
- `AZURE_STATIC_WEB_APPS_API_TOKEN` - Static Web App deployment token

## Microsoft Graph / Intune API Usage

### Required API Permissions

In Entra ID App Registration for backend, grant:

- `DeviceManagementManagedDevices.Read.All` - Read Intune managed devices
- `Device.Read.All` - Read device information
- `Directory.Read.All` - Read directory data

### Example Intune Service Implementation

```csharp
public class IntuneService
{
    private readonly GraphServiceClient _graphClient;

    public async Task<List<ManagedDevice>> GetManagedDevicesAsync()
    {
        var devices = await _graphClient.DeviceManagement.ManagedDevices
            .Request()
            .GetAsync();
        return devices.ToList();
    }

    public async Task<ManagedDevice> GetDeviceBySerialNumberAsync(string serialNumber)
    {
        var devices = await _graphClient.DeviceManagement.ManagedDevices
            .Request()
            .Filter($"serialNumber eq '{serialNumber}'")
            .GetAsync();
        return devices.FirstOrDefault();
    }
}
```

## Testing

### Frontend Testing

```bash
cd src/frontend
npm run test        # Run unit tests (Vitest/Jest)
npm run test:e2e    # Run end-to-end tests (Playwright/Cypress)
```

### Backend Testing

```bash
cd src/backend
dotnet test         # Run all unit and integration tests
```

## Repository Information

- **Remote**: <https://github.com/Djoppie/Djoppie-Inventory.git>
- **Contact**: <jo.wijnen@diepenbeek.be>

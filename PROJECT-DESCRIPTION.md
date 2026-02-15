# Djoppie Inventory

**Modern Asset & Inventory Management System for IT Support Teams**

---

## Overview

Djoppie Inventory is a web-based asset management system designed for IT support teams and inventory managers at Gemeente Diepenbeek. The system provides comprehensive tracking of IT assets with integration to Microsoft Intune for enhanced hardware inventory management.

## Key Features

| Feature | Description |
|---------|-------------|
| **QR Code Scanning** | Instant asset lookup using device camera |
| **Intune Integration** | Automatic device data retrieval from Microsoft Intune |
| **Real-time Filtering** | Filter by status (In Use, Stock, Repair, Defective, Decommissioned) |
| **Asset Templates** | Quick asset creation from predefined templates |
| **Export to Excel/CSV** | Export inventory data with advanced filtering |
| **Label Printing** | Print QR code labels (Dymo LabelWriter 400) |
| **Multilingual** | Dutch and English language support |
| **Dark/Light Mode** | User-selectable visual theme |

## Technology Stack

### Frontend

- React 19 with TypeScript
- Material-UI (MUI) component library
- Vite build tool
- MSAL React for authentication

### Backend

- ASP.NET Core 8.0 Web API
- Entity Framework Core
- Microsoft Graph SDK for Intune
- SQLite (dev) / Azure SQL (production)

### Infrastructure

- Azure Static Web Apps (frontend)
- Azure App Service (backend)
- Azure SQL Database
- Azure Key Vault (secrets)
- Azure Application Insights (monitoring)

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   React SPA     │────▶│  ASP.NET Core   │────▶│   Azure SQL     │
│ Static Web App  │     │   App Service   │     │    Database     │
└─────────────────┘     └────────┬────────┘     └─────────────────┘
                                 │
                    ┌────────────┴────────────┐
                    │                         │
              ┌─────▼─────┐           ┌───────▼───────┐
              │ Entra ID  │           │ Microsoft     │
              │   Auth    │           │ Graph/Intune  │
              └───────────┘           └───────────────┘
```

## Asset Lifecycle

```
[Stock] ──▶ [In Use] ──▶ [Repair] ──▶ [In Use]
                │                         │
                ▼                         ▼
           [Defective] ───────────▶ [Decommissioned]
```

| Status | Dutch | Description |
|--------|-------|-------------|
| InGebruik | In gebruik | Asset is actively in use |
| Stock | Stock | Available in inventory |
| Herstelling | Herstelling | Under repair |
| Defect | Defect | Broken/defective |
| UitDienst | Uit dienst | Decommissioned |

## Environments

| Environment | Frontend URL | Backend URL |
|-------------|--------------|-------------|
| Development | <http://localhost:5173> | <http://localhost:5052> |
| Azure DEV | *.azurestaticapps.net | *.azurewebsites.net |

## Quick Links

### Documentation

- [User Manual](docs/USER-MANUAL.md) - End-user guide
- [Administrator Guide](docs/ADMINISTRATOR-GUIDE.md) - IT admin setup
- [Developer Guide](CLAUDE.md) - Development reference
- [Installation Guide](INSTALLATION-GUIDE.md) - Setup instructions

### Azure DevOps Wiki

- [Wiki Documentation](docs/wiki/README.md) - Structured documentation for Azure DevOps

### Feature Documentation

- [Print Label Feature](docs/PRINT-LABEL-FEATURE.md) - Thermal label printing
- [Export Feature](docs/EXPORT-FEATURE.md) - Excel/CSV export

## Repository Structure

```
Djoppie-Inventory/
├── src/
│   ├── frontend/          # React application
│   └── backend/           # ASP.NET Core API
│       ├── DjoppieInventory.API/           # Web API
│       ├── DjoppieInventory.Core/          # Domain models
│       └── DjoppieInventory.Infrastructure/# Data access
├── infra/
│   └── bicep/             # Infrastructure as Code
├── docs/                  # Documentation
│   ├── wiki/              # Azure DevOps Wiki
│   ├── USER-MANUAL.md
│   └── ADMINISTRATOR-GUIDE.md
├── scripts/               # Deployment scripts
└── .azuredevops/          # CI/CD pipelines
```

## Getting Started

### Prerequisites

- .NET 8.0 SDK
- Node.js 20+
- Azure CLI
- Git

### Local Development

```bash
# Backend (Terminal 1)
cd src/backend/DjoppieInventory.API
dotnet run

# Frontend (Terminal 2)
cd src/frontend
npm install
npm run dev
```

Access the application at <http://localhost:5173>

## Authentication

The application uses Microsoft Entra ID (Azure AD) for authentication:

- **Tenant**: Diepenbeek
- **Frontend App**: SPA authentication with MSAL
- **Backend API**: JWT Bearer token validation
- **Intune Access**: Service principal with Graph API permissions

## Contact

- **Project Lead**: <jo.wijnen@diepenbeek.be>
- **Repository**: <https://github.com/Djoppie/Djoppie-Inventory>
- **IT ServiceDesk**: <https://diepenbeek.sharepoint.com/sites/IN-Servicedesk>

---

**Version**: 1.0
**Last Updated**: February 13, 2026

# Djoppie Inventory

IT Asset Management System for tracking equipment, deployments, and Intune integration.

## Quick Links

| Audience | Document |
|----------|----------|
| **Getting Started** | [QUICK_START.md](QUICK_START.md) |
| **Architecture** | [ARCHITECTURE.md](ARCHITECTURE.md) |
| **Development Guide** | [CLAUDE.md](CLAUDE.md) |
| **User Guide (NL)** | [docs/USER-GUIDE.md](docs/USER-GUIDE.md) |

## Live Environment

| Environment | Frontend | Backend |
|-------------|----------|---------|
| **DEV** | [blue-cliff-031d65b03.1.azurestaticapps.net](https://blue-cliff-031d65b03.1.azurestaticapps.net) | [app-djoppie-inventory-dev-api-k5xdqp.azurewebsites.net](https://app-djoppie-inventory-dev-api-k5xdqp.azurewebsites.net) |

Login with your Diepenbeek Microsoft account.

---

## Features

### Core

- **Asset Management** - CRUD operations for IT assets with QR codes
- **QR Scanner** - Instant asset lookup via camera
- **Intune Integration** - Sync with Microsoft Intune for device inventory

### Rollout Workflow

- **Planning** - Create rollout sessions with days and workplaces
- **Execution** - Track equipment deployment to workplaces
- **Reporting** - Progress dashboards and asset movement reports

### Organization

- **Services & Sectors** - Organizational hierarchy from Entra mail groups
- **Buildings** - Location management
- **Physical Workplaces** - Track equipment at specific locations

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, TypeScript, Material-UI, TanStack Query |
| Backend | ASP.NET Core 8.0, Entity Framework Core |
| Auth | Microsoft Entra ID (Azure AD), MSAL |
| Database | SQLite (dev), Azure SQL (prod) |
| Infrastructure | Azure Static Web Apps, Azure App Service |

---

## Project Structure

```
Djoppie-Inventory/
├── src/
│   ├── frontend/          # React SPA
│   └── backend/           # ASP.NET Core API
├── docs/                  # Documentation
├── .claude/               # Claude Code configuration
│   ├── agents/            # Agent definitions
│   ├── skills/            # Custom skills
│   └── tasks/             # Task templates
├── CLAUDE.md              # Development instructions
├── QUICK_START.md         # Getting started
└── ARCHITECTURE.md        # System design
```

---

## Development

### Prerequisites

- .NET 8 SDK
- Node.js 20+
- Azure CLI (for auth)

### Quick Start

```bash
# Backend
cd src/backend/DjoppieInventory.API
dotnet user-secrets set "AzureAd:ClientSecret" "your-secret"
dotnet run

# Frontend (new terminal)
cd src/frontend
npm install
npm run dev
```

Open <http://localhost:5173>

See [QUICK_START.md](QUICK_START.md) for detailed setup.

---

## Contact

- **Developer**: Jo Wijnen
- **Email**: <jo.wijnen@diepenbeek.be>
- **Tenant**: Diepenbeek (7db28d6f-d542-40c1-b529-5e5ed2aad545)

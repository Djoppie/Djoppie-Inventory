# Quick Start Guide

Get Djoppie Inventory running locally in 5 minutes.

## Prerequisites

- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- [Node.js 20+](https://nodejs.org/)
- [Azure CLI](https://docs.microsoft.com/cli/azure/install-azure-cli) (for Entra ID auth)

## 1. Clone & Setup

```bash
git clone https://github.com/Djoppie/Djoppie-Inventory.git
cd Djoppie-Inventory
```

## 2. Backend Setup

```bash
cd src/backend/DjoppieInventory.API

# Set user secrets (get from team lead or Azure Portal)
dotnet user-secrets set "AzureAd:ClientSecret" "your-client-secret"

# Run backend (starts at http://localhost:5052)
dotnet run
```

## 3. Frontend Setup

```bash
cd src/frontend

# Install dependencies
npm install

# Run frontend (starts at http://localhost:5173)
npm run dev
```

## 4. Access the App

Open <http://localhost:5173> and sign in with your Diepenbeek Microsoft account.

---

## Common Commands

| Task | Command |
|------|---------|
| Run backend | `cd src/backend/DjoppieInventory.API && dotnet run` |
| Run frontend | `cd src/frontend && npm run dev` |
| Build frontend | `cd src/frontend && npm run build` |
| Run tests | `cd src/backend/DjoppieInventory.Tests && dotnet test` |
| Add migration | `dotnet ef migrations add <Name> --project DjoppieInventory.Infrastructure --startup-project DjoppieInventory.API` |
| Apply migrations | `dotnet ef database update --project DjoppieInventory.Infrastructure --startup-project DjoppieInventory.API` |

## Environment

| Environment | Frontend URL | Backend URL |
|-------------|--------------|-------------|
| Local | <http://localhost:5173> | <http://localhost:5052> |
| Azure DEV | <https://blue-cliff-031d65b03.1.azurestaticapps.net> | <https://app-djoppie-inventory-dev-api-k5xdqp.azurewebsites.net> |

## Troubleshooting

**401 Unauthorized**: Clear browser cache, verify `VITE_ENTRA_API_SCOPE` matches backend `Audience`.

**Database errors**: Run `dotnet ef database update` to apply migrations.

**Build failures**: Ensure Node.js 20+ and .NET 8 SDK are installed.

---

See [ARCHITECTURE.md](ARCHITECTURE.md) for system design and [CLAUDE.md](CLAUDE.md) for development guidelines.

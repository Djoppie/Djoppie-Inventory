# Djoppie Inventory

IT asset and inventory management for Gemeente Diepenbeek — track equipment, plan rollouts, integrate with Microsoft Intune, all behind Entra ID single sign-on.

| Audience | Document |
|----------|----------|
| New developer | [DEVELOPMENT.md](DEVELOPMENT.md) |
| Architect / reviewer | [ARCHITECTURE.md](ARCHITECTURE.md) |
| All other docs | [docs/README.md](docs/README.md) |
| End user (NL) | [docs/USER-GUIDE.md](docs/USER-GUIDE.md) |
| AI agents | [CLAUDE.md](CLAUDE.md) |

---

## Live (Azure DEV)

| Tier | URL |
|------|-----|
| Frontend | <https://blue-cliff-031d65b03.1.azurestaticapps.net> |
| Backend API | <https://app-djoppie-inventory-dev-api-k5xdqp.azurewebsites.net> |
| Swagger | <https://app-djoppie-inventory-dev-api-k5xdqp.azurewebsites.net/swagger> |

Sign in with a Diepenbeek Microsoft account.

---

## Highlights

- **Asset CRUD** with auto-generated codes (`TYPE-YY-BRAND-NNNNN`), QR generation/scan, bulk import.
- **Rollout workflow** — plan sessions, schedule days/services, configure workplaces, execute scans, atomically transition asset status (`Nieuw → InGebruik`, `InGebruik → UitDienst/Defect/Stock`).
- **Intune integration** via Microsoft Graph — live compliance, hardware, app inventory.
- **Org sync** from Entra mail groups (sectors, services, employees, managers).
- **Reports** — overview KPIs, attention list, asset history, rollout movements, leasing, workplaces, Intune.
- **Dutch / English** UI.

---

## Tech (one-liner)

React 19 + Vite + MUI + TanStack Query · ASP.NET Core 8 + EF Core · Entra ID · Azure SQL / SQLite · Static Web Apps + App Service · Bicep IaC.

Full breakdown: [ARCHITECTURE.md §2](ARCHITECTURE.md#2-tech-stack).

---

## Get Going

```bash
git clone https://github.com/Djoppie/Djoppie-Inventory.git
cd Djoppie-Inventory

# Backend  (terminal 1)
cd src/backend/DjoppieInventory.API
dotnet user-secrets set "AzureAd:ClientSecret" "<get-from-team>"
dotnet run                     # http://localhost:5052

# Frontend (terminal 2)
cd src/frontend
npm install && npm run dev     # http://localhost:5173
```

Detailed setup, deploys, troubleshooting → [DEVELOPMENT.md](DEVELOPMENT.md).

---

## Repo Layout

```
Djoppie-Inventory/
├── src/
│   ├── backend/        ASP.NET Core 8 (API · Core · Infrastructure · Tests)
│   └── frontend/       React 19 SPA (Vite)
├── infra/              Bicep templates (DEV + PROD)
├── scripts/            PowerShell deploy / verify / DB helpers
├── docs/               All reference documentation
├── .azuredevops/       Azure Pipelines + setup notes
├── .claude/            Agent definitions used by this repo
├── README.md           ← you are here
├── DEVELOPMENT.md      Setup & day-to-day dev guide
├── ARCHITECTURE.md     Compact system overview
└── CLAUDE.md           Verbose agent-facing instructions
```

---

## Contact

- **Maintainer**: Jo Wijnen — <jo.wijnen@diepenbeek.be>
- **Tenant**: Diepenbeek (`7db28d6f-d542-40c1-b529-5e5ed2aad545`)
- **Issues**: <https://github.com/Djoppie/Djoppie-Inventory/issues>

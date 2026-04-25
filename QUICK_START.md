# Quick Start

> The full setup guide moved to [DEVELOPMENT.md](DEVELOPMENT.md). This page is a 60-second cheat-sheet.

```bash
# 1. Clone
git clone https://github.com/Djoppie/Djoppie-Inventory.git
cd Djoppie-Inventory

# 2. Backend  (terminal 1)
cd src/backend/DjoppieInventory.API
dotnet user-secrets set "AzureAd:ClientSecret" "<get-from-team-lead>"
dotnet run                     # http://localhost:5052  (Swagger: /swagger)

# 3. Frontend (terminal 2)
cd src/frontend
npm install
npm run dev                    # http://localhost:5173
```

Sign in with a Diepenbeek Microsoft account.

| Need | Go to |
|------|-------|
| Detailed install + Azure deploy | [DEVELOPMENT.md](DEVELOPMENT.md) |
| Architecture overview | [ARCHITECTURE.md](ARCHITECTURE.md) |
| All other docs | [docs/README.md](docs/README.md) |
| Troubleshooting auth | [DEVELOPMENT.md §9](DEVELOPMENT.md#9-troubleshooting) |

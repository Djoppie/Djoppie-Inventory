# Development & Installation Guide

End-to-end setup for working on **Djoppie Inventory** — local dev, Azure DEV deploys, and the day-to-day commands you actually need.

> Looking for a one-pager? See [README.md](README.md). For architecture see [ARCHITECTURE.md](ARCHITECTURE.md). For per-area depth see [docs/README.md](docs/README.md).

---

## 1. Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| Git | 2.40+ | Source control |
| .NET SDK | 8.0 | Backend (ASP.NET Core 8) |
| Node.js | 20 LTS | Frontend (Vite + React 19) |
| PowerShell | 7+ | Deploy scripts |
| Azure CLI | 2.50+ | Azure auth & deploys |
| EF Core CLI | 8 | Migrations (`dotnet tool install --global dotnet-ef`) |

**Required access**: GitHub repo `Djoppie/Djoppie-Inventory`, an account in the Diepenbeek tenant (`7db28d6f-d542-40c1-b529-5e5ed2aad545`), and Contributor on the Azure subscription if you deploy.

Verify:

```bash
git --version && dotnet --version && node --version && npm --version
```

---

## 2. Clone & Bootstrap

```bash
git clone https://github.com/Djoppie/Djoppie-Inventory.git
cd Djoppie-Inventory
```

The repo is split into `src/backend` (ASP.NET Core) and `src/frontend` (React SPA). Infrastructure (Bicep) lives under `infra/`, ops scripts under `scripts/`.

---

## 3. Backend (Local)

```bash
cd src/backend
dotnet restore
```

### One-time secret setup

The backend needs the Entra ID client secret to call Microsoft Graph. Get it from a team lead or Azure Portal (`AzureAd--ClientSecret` in Key Vault `kv-djoppie-dev-k5xdqp`):

```bash
cd DjoppieInventory.API
dotnet user-secrets set "AzureAd:ClientSecret" "<secret>"
```

User secrets are stored outside the repo and never committed.

### Run

```bash
# from src/backend/DjoppieInventory.API
dotnet run                # http://localhost:5052, Swagger at /swagger
# or with hot reload
dotnet watch run
```

The first run creates a local SQLite database (`djoppie.db`). The DB is auto-created in Development; in production migrations are applied via `Database:AutoMigrate=true` or out-of-band.

### Migrations

```bash
# from src/backend
dotnet ef migrations add <Name> \
  --project DjoppieInventory.Infrastructure \
  --startup-project DjoppieInventory.API

dotnet ef database update \
  --project DjoppieInventory.Infrastructure \
  --startup-project DjoppieInventory.API

# Apply against Azure SQL
dotnet ef database update \
  --project DjoppieInventory.Infrastructure \
  --startup-project DjoppieInventory.API \
  --connection "<azure-sql-connection-string>"
```

### Tests

```bash
cd src/backend/DjoppieInventory.Tests
dotnet test
dotnet test --filter "FullyQualifiedName~AssetControllerTests"
```

---

## 4. Frontend (Local)

```bash
cd src/frontend
npm install
npm run dev               # http://localhost:5173
```

`.env.development` is committed and points at `http://localhost:5052/api`. Override locally with `.env.development.local` if needed (gitignored).

| Command | Purpose |
|---------|---------|
| `npm run dev` | Vite dev server |
| `npm run build` | Type-check + production build to `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | ESLint over `src/` |
| `npm run lint -- --fix` | Auto-fix lint issues |

---

## 5. End-to-End Local Run

```
Terminal 1                      Terminal 2
src/backend/DjoppieInventory.API  src/frontend
dotnet run                        npm run dev
        \                        /
         http://localhost:5173 (open this)
```

Sign in with your Diepenbeek Microsoft account. The browser hits MSAL → Entra ID → returns a JWT → Axios injects it on every API call.

---

## 6. Azure DEV Deployment

### Resources (already provisioned)

| Resource | Name |
|----------|------|
| Resource Group | `rg-djoppie-inventory-dev` |
| App Service (API) | `app-djoppie-inventory-dev-api-k5xdqp` |
| Static Web App (UI) | `swa-djoppie-inventory-dev` |
| Azure SQL | (in resource group) |
| Key Vault | `kv-djoppie-dev-k5xdqp` |
| App Insights | (linked to App Service) |

URLs:
- Frontend: <https://blue-cliff-031d65b03.1.azurestaticapps.net>
- Backend: <https://app-djoppie-inventory-dev-api-k5xdqp.azurewebsites.net>
- Swagger: <https://app-djoppie-inventory-dev-api-k5xdqp.azurewebsites.net/swagger>

### Automated full deploy

```powershell
az login --tenant 7db28d6f-d542-40c1-b529-5e5ed2aad545
.\deploy-dev.ps1                  # checks prereqs, builds, deploys both tiers
```

### Manual: backend only

```bash
cd src/backend/DjoppieInventory.API
dotnet publish -c Release -o ./publish
powershell -Command "Compress-Archive -Path './publish/*' -DestinationPath './deploy.zip' -Force"
az webapp deployment source config-zip \
  --resource-group rg-djoppie-inventory-dev \
  --name app-djoppie-inventory-dev-api-k5xdqp \
  --src deploy.zip
```

### Manual: frontend only (SWA CLI)

```bash
cd src/frontend
npm run build
TOKEN=$(az staticwebapp secrets list --name swa-djoppie-inventory-dev --query 'properties.apiKey' -o tsv)
npx @azure/static-web-apps-cli deploy ./dist --deployment-token "$TOKEN" --env production
```

### CI/CD

Azure DevOps pipeline at `.azuredevops/azure-pipelines.yml`. Setup notes in `.azuredevops/README.md`. The pipeline builds both tiers, runs tests, and deploys to DEV (PROD on tag).

---

## 7. Configuration & Secrets

| Layer | Local | Azure |
|-------|-------|-------|
| Backend secrets | .NET User Secrets | Key Vault (`kv-djoppie-dev-k5xdqp`) via Managed Identity |
| Backend connection string | `Data Source=djoppie.db` (SQLite) | `ConnectionStrings--DefaultConnection` (Azure SQL) |
| Frontend env | `.env.development` | `.env.production` baked into SWA build |

Key Vault secret naming uses `--` for the `:` config separator (e.g. `AzureAd--ClientSecret` → `AzureAd:ClientSecret`). See [docs/wiki/Administrator-Guide/04-Key-Vault.md](docs/wiki/Administrator-Guide/04-Key-Vault.md) for rotation procedure.

---

## 8. Common Workflows

### Add an entity

1. Class in `DjoppieInventory.Core/Entities/`
2. DTO(s) in `DjoppieInventory.Core/DTOs/`
3. `DbSet<T>` on `ApplicationDbContext`
4. Repository under `DjoppieInventory.Infrastructure/Repositories/` + interface in `Core/Interfaces/`
5. Controller in `DjoppieInventory.API/Controllers/<Feature>/`
6. `dotnet ef migrations add Add<Entity>` → `dotnet ef database update`

### Add an API endpoint

1. Pick the feature folder (`Inventory`, `Admin`, `Operations`, `Devices`, `Reports`, `Workplaces`).
2. Add the action; decorate with `[Authorize]` (or `[Authorize(Policy = "RequireAdminRole")]`).
3. Validate via Swagger (`/swagger`).
4. Wire from `src/frontend/src/api/<feature>.api.ts` and call from a `useQuery` / `useMutation`.

### Add a frontend page

1. Component under `src/frontend/src/pages/<feature>/`.
2. Lazy-import + route in `App.tsx`.
3. Reusable bits go in `components/<feature>/`.
4. Add nav entry in the sidebar if user-visible.

### Modify `AssetStatus`

1. Update enum in `Core/Entities/Asset.cs`.
2. Migration if needed.
3. Update TS types, filters/badges, and `i18n/{nl,en}.json` translations.

---

## 9. Troubleshooting

| Symptom | Fix |
|---------|-----|
| `401 Unauthorized` on every call | Verify `VITE_ENTRA_API_SCOPE` matches backend `AzureAd:Audience`. Clear MSAL cache (DevTools → Application → Storage). |
| `redirect_uri_mismatch` after deploy | Run `scripts/add-azure-redirect-uri.ps1`. |
| Graph 403 / Intune empty | Admin consent missing — `az ad app permission admin-consent --id eb5bcf06-8032-494f-a363-92b6802c44bf`. |
| Port 5052 busy | Kill process or change in `Properties/launchSettings.json`. |
| SQLite locked | Stop the app and delete `djoppie.db`; it will be recreated. |
| Vite shows `VITE_*` undefined | `.env.development` missing — copy from sample values in §4. |
| CORS error in browser | Backend not running on `:5052`, or origin not allowed in `Frontend:AllowedOrigins`. |

Decode failing JWTs at <https://jwt.ms> to check `aud` and `scp` claims.

---

## 10. Branch & PR Conventions

- Default branch: **`develop`** (integration). `main` follows production releases.
- Feature branches: `feat/<short-name>`; fixes: `fix/<short-name>`.
- Commits follow Conventional Commits (`feat:`, `fix:`, `chore:`, `refactor:`, `docs:`).
- PRs target `develop`. Tag a reviewer; pipeline must be green.

---

## 11. Useful References

- [ARCHITECTURE.md](ARCHITECTURE.md) — compact system overview
- [docs/README.md](docs/README.md) — full documentation tree
- [CLAUDE.md](CLAUDE.md) — agent-facing project instructions (verbose)
- [docs/wiki/Administrator-Guide/](docs/wiki/Administrator-Guide/) — deployment & ops deep-dives
- Swagger UI at <http://localhost:5052/swagger> — live REST endpoint reference
- [docs/DATA-MODEL.md](docs/DATA-MODEL.md) — entity ER diagram

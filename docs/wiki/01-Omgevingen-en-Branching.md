# Handleiding 1: Omgevingen, Repository & Branching Strategie

**Versie:** 1.0
**Datum:** Januari 2026
**Onderdeel van:** Djoppie Inventory Deployment Handleidingen

---

## Inhoudsopgave

1. [Omgevingen Overzicht](#omgevingen-overzicht)
2. [Lokale Ontwikkelomgeving](#lokale-ontwikkelomgeving)
3. [Develop Omgeving (DEV)](#develop-omgeving-dev)
4. [Productie Omgeving (PROD)](#productie-omgeving-prod)
5. [Git Repository Structuur](#git-repository-structuur)
6. [Branching Strategie](#branching-strategie)
7. [Workflow & Best Practices](#workflow--best-practices)
8. [Troubleshooting](#troubleshooting)

---

## Omgevingen Overzicht

Het Djoppie Inventory project maakt gebruik van drie hoofdomgevingen, elk met een specifiek doel en configuratie.

| Omgeving | Doel | URL Pattern | Branch | Auto-Deploy |
|----------|------|-------------|--------|-------------|
| **Local** | Ontwikkeling op lokale machine | localhost | feature/* | Nee |
| **DEV** | Ontwikkel- en testomgeving | *-dev-*.azurewebsites.net | develop | Ja |
| **PROD** | Productie omgeving | *-prod-*.azurewebsites.net | main | Ja (met approval) |

### Omgeving Karakteristieken

#### Lokale Omgeving
- **Database**: SQLite (bestand in project directory)
- **Backend**: IIS Express of Kestrel (localhost:7001)
- **Frontend**: Vite Dev Server (localhost:5173)
- **Authenticatie**: Mock of echte Entra ID
- **Kosten**: €0

#### DEV Omgeving
- **Database**: SQLite (App Service bestand) of Azure SQL (Basic)
- **Backend**: Azure App Service (B1 tier)
- **Frontend**: Azure Static Web Apps (Free tier)
- **Authenticatie**: Entra ID (dev app registrations)
- **Kosten**: ~€15-20/maand

#### PROD Omgeving
- **Database**: Azure SQL Database (S1 tier)
- **Backend**: Azure App Service (P1V3 tier, 2 instances)
- **Frontend**: Azure Static Web Apps (Standard tier)
- **Authenticatie**: Entra ID (prod app registrations)
- **Kosten**: ~€125-185/maand

---

## Lokale Ontwikkelomgeving

### Vereisten

#### Software Installaties

1. **Git**
   - Download: https://git-scm.com/downloads
   - Verificatie: `git --version`

2. **.NET 8.0 SDK**
   - Download: https://dotnet.microsoft.com/download/dotnet/8.0
   - Verificatie: `dotnet --version`
   - Minimum: 8.0.100

3. **Node.js 18+**
   - Download: https://nodejs.org/ (LTS versie)
   - Verificatie: `node --version`
   - Minimum: 18.0.0

4. **Visual Studio 2022** of **VS Code**
   - Visual Studio: Community/Professional/Enterprise
   - VS Code extensions:
     - C# Dev Kit
     - ESLint
     - Prettier
     - Azure Account
     - Azure Resources

5. **Azure CLI** (optioneel, voor deployment)
   - Download: https://aka.ms/InstallAzureCLIDirect
   - Verificatie: `az --version`

6. **PowerShell 7+** (voor scripts)
   - Download: https://github.com/PowerShell/PowerShell
   - Verificatie: `pwsh --version`

### Repository Clonen

```bash
# Clone de repository
git clone https://github.com/Djoppie/Djoppie-Inventory.git

# Navigeer naar de project directory
cd Djoppie-Inventory
```

### Backend Setup (ASP.NET Core)

#### 1. Restore NuGet Packages

```bash
cd src/backend
dotnet restore
```

#### 2. Configureer appsettings.Development.json

Maak een bestand aan: `src/backend/DjoppieInventory.API/appsettings.Development.json`

```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning",
      "Microsoft.EntityFrameworkCore": "Information"
    }
  },
  "ConnectionStrings": {
    "DefaultConnection": "Data Source=djoppie-inventory.db"
  },
  "AzureAd": {
    "Instance": "https://login.microsoftonline.com/",
    "TenantId": "7db28d6f-d542-40c1-b529-5e5ed2aad545",
    "ClientId": "fc0be7bf-0e71-4c39-8a02-614dfa16322c",
    "ClientSecret": "YOUR_DEV_CLIENT_SECRET",
    "Audience": "api://fc0be7bf-0e71-4c39-8a02-614dfa16322c"
  },
  "MicrosoftGraph": {
    "BaseUrl": "https://graph.microsoft.com/v1.0",
    "Scopes": [
      "https://graph.microsoft.com/.default"
    ]
  },
  "CORS": {
    "AllowedOrigins": [
      "http://localhost:5173",
      "https://localhost:5173"
    ]
  }
}
```

**Belangrijke notities:**
- Vervang `YOUR_DEV_CLIENT_SECRET` met de werkelijke secret uit Entra ID
- Voor pure lokale dev zonder Entra ID: authenticatie kan tijdelijk uitgeschakeld worden

#### 3. Database Migraties Uitvoeren

```bash
# Installeer EF Core tools (als nog niet geïnstalleerd)
dotnet tool install --global dotnet-ef

# Voer migraties uit (maakt SQLite database aan)
dotnet ef database update --project DjoppieInventory.Infrastructure --startup-project DjoppieInventory.API

# Optioneel: seed data toevoegen
dotnet run --project DjoppieInventory.API -- --seed
```

#### 4. Start de Backend

```bash
# Start de API
dotnet run --project DjoppieInventory.API

# Of gebruik Visual Studio: F5
```

Backend draait nu op:
- **HTTPS**: https://localhost:7001
- **HTTP**: http://localhost:5000
- **Swagger**: https://localhost:7001/swagger

### Frontend Setup (React)

#### 1. Installeer Dependencies

```bash
cd src/frontend
npm install
```

#### 2. Configureer .env.development

Maak een bestand aan: `src/frontend/.env.development`

```env
# API Endpoint
VITE_API_URL=https://localhost:7001/api

# Microsoft Entra ID Configuration
VITE_ENTRA_CLIENT_ID=bec7a94f-d35d-4f0e-af77-60f6a9342f2d
VITE_ENTRA_TENANT_ID=7db28d6f-d542-40c1-b529-5e5ed2aad545
VITE_ENTRA_REDIRECT_URI=http://localhost:5173

# Environment
VITE_ENVIRONMENT=development
```

**Belangrijke notities:**
- `VITE_ENTRA_CLIENT_ID` is de **frontend** app registration (SPA)
- Zorg dat redirect URI's zijn toegevoegd in Entra ID app registration

#### 3. Start de Frontend

```bash
# Start Vite dev server
npm run dev

# Of met specifieke port
npm run dev -- --port 5173
```

Frontend draait nu op:
- **Dev Server**: http://localhost:5173
- **Hot Reload**: Automatisch bij code wijzigingen

### Verificatie Lokale Setup

#### Backend Verificatie

```bash
# Health check
curl https://localhost:7001/health

# Expected response
{
  "status": "Healthy",
  "timestamp": "2026-01-18T10:30:00Z"
}

# Swagger UI
# Open browser: https://localhost:7001/swagger
```

#### Frontend Verificatie

1. Open browser: http://localhost:5173
2. Login met Entra ID credentials
3. Dashboard moet laden met asset lijst
4. Check browser console voor errors (F12)

#### Database Verificatie

```bash
# Toon tabellen in SQLite database
dotnet ef dbcontext info --project DjoppieInventory.Infrastructure --startup-project DjoppieInventory.API

# Query database met SQLite tool
sqlite3 src/backend/DjoppieInventory.API/djoppie-inventory.db
sqlite> .tables
sqlite> SELECT * FROM Assets;
```

---

## Develop Omgeving (DEV)

De DEV omgeving is bedoeld voor:
- Integratie testing
- Feature previews
- QA testing
- Demo's aan stakeholders

### Azure Resources (DEV)

| Resource | Naam | Doel |
|----------|------|------|
| Resource Group | `rg-djoppie-dev` | Container voor alle DEV resources |
| App Service Plan | `asp-djoppie-dev` | Compute voor backend (B1 tier) |
| App Service | `app-djoppie-dev-api-{suffix}` | Backend API hosting |
| Static Web App | `swa-djoppie-dev-web-{suffix}` | Frontend hosting |
| Key Vault | `kv-djoppiedev` | Secrets opslag |
| App Insights | `appi-djoppie-dev` | Monitoring |
| Log Analytics | `log-djoppie-dev` | Centralized logging |

### DEV Configuratie

#### Backend App Settings

Configuratie in Azure Portal (App Service > Configuration):

```
ASPNETCORE_ENVIRONMENT = Development
APPLICATIONINSIGHTS_CONNECTION_STRING = [Auto-injected]

AzureAd__Instance = https://login.microsoftonline.com/
AzureAd__TenantId = @Microsoft.KeyVault(VaultName=kv-djoppiedev;SecretName=EntraTenantId)
AzureAd__ClientId = @Microsoft.KeyVault(VaultName=kv-djoppiedev;SecretName=EntraBackendClientId)
AzureAd__ClientSecret = @Microsoft.KeyVault(VaultName=kv-djoppiedev;SecretName=EntraBackendClientSecret)
AzureAd__Audience = api://fc0be7bf-0e71-4c39-8a02-614dfa16322c

CORS__AllowedOrigins__0 = https://swa-djoppie-dev-web.azurestaticapps.net
CORS__AllowedOrigins__1 = http://localhost:5173
```

#### Frontend Static Web App Settings

Configuratie in Azure Portal (Static Web App > Configuration):

```
VITE_API_URL = https://app-djoppie-dev-api.azurewebsites.net/api
VITE_ENTRA_CLIENT_ID = bec7a94f-d35d-4f0e-af77-60f6a9342f2d
VITE_ENTRA_TENANT_ID = 7db28d6f-d542-40c1-b529-5e5ed2aad545
VITE_ENVIRONMENT = dev
```

### DEV URLs

- **Frontend**: https://swa-djoppie-dev-web-{suffix}.azurestaticapps.net
- **Backend API**: https://app-djoppie-dev-api-{suffix}.azurewebsites.net
- **Swagger**: https://app-djoppie-dev-api-{suffix}.azurewebsites.net/swagger
- **Health**: https://app-djoppie-dev-api-{suffix}.azurewebsites.net/health

### Deployment naar DEV

DEV deployment gebeurt automatisch bij elke commit naar de `develop` branch.

```bash
# Lokale wijzigingen committen
git checkout develop
git add .
git commit -m "feat: add new feature"
git push origin develop

# Azure DevOps pipeline start automatisch
# Volg progress in Azure DevOps: Pipelines > Djoppie-Inventory
```

---

## Productie Omgeving (PROD)

De PROD omgeving is de live applicatie voor eindgebruikers.

### Azure Resources (PROD)

| Resource | Naam | Doel |
|----------|------|------|
| Resource Group | `rg-djoppie-prod` | Container voor alle PROD resources |
| App Service Plan | `asp-djoppie-prod` | Compute voor backend (P1V3, 2 instances) |
| App Service | `app-djoppie-prod-api-{suffix}` | Backend API hosting |
| Static Web App | `swa-djoppie-prod-web-{suffix}` | Frontend hosting |
| SQL Database | `sqldb-djoppie-inventory` | Production database |
| SQL Server | `sql-djoppie-prod-{suffix}` | Database server |
| Key Vault | `kv-djoppieprod` | Secrets opslag |
| App Insights | `appi-djoppie-prod` | Monitoring |
| Log Analytics | `log-djoppie-prod` | Centralized logging |

### PROD Configuratie

#### Backend App Settings

```
ASPNETCORE_ENVIRONMENT = Production
APPLICATIONINSIGHTS_CONNECTION_STRING = [Auto-injected]

AzureAd__Instance = https://login.microsoftonline.com/
AzureAd__TenantId = @Microsoft.KeyVault(VaultName=kv-djoppieprod;SecretName=EntraTenantId)
AzureAd__ClientId = @Microsoft.KeyVault(VaultName=kv-djoppieprod;SecretName=EntraBackendClientId)
AzureAd__ClientSecret = @Microsoft.KeyVault(VaultName=kv-djoppieprod;SecretName=EntraBackendClientSecret)
AzureAd__Audience = api://[PROD_BACKEND_CLIENT_ID]

CORS__AllowedOrigins__0 = https://swa-djoppie-prod-web.azurestaticapps.net
```

**Notitie**: Geen localhost in CORS voor productie!

#### Frontend Static Web App Settings

```
VITE_API_URL = https://app-djoppie-prod-api.azurewebsites.net/api
VITE_ENTRA_CLIENT_ID = [PROD_FRONTEND_CLIENT_ID]
VITE_ENTRA_TENANT_ID = 7db28d6f-d542-40c1-b529-5e5ed2aad545
VITE_ENVIRONMENT = prod
```

### PROD URLs

- **Frontend**: https://swa-djoppie-prod-web-{suffix}.azurestaticapps.net
- **Backend API**: https://app-djoppie-prod-api-{suffix}.azurewebsites.net
- **Swagger**: UITGESCHAKELD in productie
- **Health**: https://app-djoppie-prod-api-{suffix}.azurewebsites.net/health

### Deployment naar PROD

PROD deployment vereist approval en gebeurt alleen via de `main` branch.

```bash
# Merge develop naar main (via Pull Request!)
git checkout main
git pull origin main
git merge develop
git push origin main

# Pipeline start met approval gate
# Goedkeuring vereist in Azure DevOps voor deployment naar PROD
```

---

## Git Repository Structuur

```
Djoppie-Inventory/
├── .azure/                          # Azure DevOps specifieke configuratie
├── .github/                         # GitHub specifieke configuratie (indien van toepassing)
├── docs/
│   ├── wiki/                        # Deze handleidingen
│   ├── architecture/                # Architectuur diagrammen
│   └── api/                         # API documentatie
├── infrastructure/                  # Bicep templates (enterprise versie)
│   ├── main.bicep
│   ├── modules/
│   │   └── infrastructure.bicep
│   └── parameters/
│       ├── dev.bicepparam
│       └── prod.bicepparam
├── infrastructure-simple/           # Bicep templates (learning versie)
│   ├── main.bicep
│   ├── parameters/
│   │   ├── dev.bicepparam
│   │   └── prod.bicepparam
│   └── setup-entra-id.ps1
├── src/
│   ├── backend/
│   │   ├── DjoppieInventory.API/
│   │   ├── DjoppieInventory.Core/
│   │   ├── DjoppieInventory.Infrastructure/
│   │   ├── DjoppieInventory.Tests/
│   │   └── DjoppieInventory.slnx
│   └── frontend/
│       ├── src/
│       ├── public/
│       ├── package.json
│       └── vite.config.ts
├── azure-pipelines.yml              # CI/CD pipeline definitie
├── .gitignore
├── CLAUDE.md                        # Project instructies voor Claude AI
└── README.md
```

### Belangrijke Bestanden

| Bestand | Doel |
|---------|------|
| `azure-pipelines.yml` | Azure DevOps CI/CD pipeline configuratie |
| `infrastructure-simple/main.bicep` | Infrastructure as Code template |
| `CLAUDE.md` | Project documentatie en guidelines |
| `.gitignore` | Bestanden uitgesloten van version control |
| `src/backend/DjoppieInventory.slnx` | .NET solution bestand |
| `src/frontend/package.json` | NPM dependencies en scripts |

---

## Branching Strategie

We gebruiken een **simplified Git Flow** strategie met twee main branches en feature branches.

### Branch Types

#### 1. Main Branches

```
main (protected)
└── develop (protected)
    ├── feature/asset-management
    ├── feature/qr-scanner
    ├── bugfix/login-issue
    └── hotfix/critical-security-fix
```

##### `main` - Productie Branch
- **Bevat**: Altijd production-ready code
- **Deploy naar**: PROD omgeving
- **Protection rules**:
  - Requires pull request
  - Requires 1 approval
  - Requires pipeline success
  - No force push
  - No delete

##### `develop` - Ontwikkel Branch
- **Bevat**: Laatste ontwikkelde features voor next release
- **Deploy naar**: DEV omgeving
- **Protection rules**:
  - Requires pull request
  - Requires pipeline success
  - No force push

#### 2. Feature Branches

```bash
# Naming convention
feature/[ticket-id]-short-description
feature/DI-123-add-qr-scanner
feature/DI-456-improve-asset-search
```

**Gebruik voor:**
- Nieuwe features
- Enhancements
- Refactoring

**Lifecycle:**
1. Branch from `develop`
2. Develop locally
3. Create Pull Request naar `develop`
4. Code review
5. Merge en delete

#### 3. Bugfix Branches

```bash
# Naming convention
bugfix/[ticket-id]-short-description
bugfix/DI-789-fix-login-redirect
```

**Gebruik voor:**
- Bug fixes in develop branch
- Non-critical issues

**Lifecycle:**
1. Branch from `develop`
2. Fix locally
3. Create Pull Request naar `develop`
4. Review en merge

#### 4. Hotfix Branches

```bash
# Naming convention
hotfix/[ticket-id]-short-description
hotfix/DI-999-critical-security-patch
```

**Gebruik voor:**
- Kritieke bugs in productie
- Security patches
- Data corruption fixes

**Lifecycle:**
1. Branch from `main`
2. Fix immediately
3. Create PR naar `main` EN `develop`
4. Fast-track review
5. Deploy naar PROD ASAP
6. Merge terug naar `develop`

### Branch Naming Conventies

| Type | Pattern | Voorbeeld |
|------|---------|-----------|
| Feature | `feature/[id]-[description]` | `feature/DI-123-asset-templates` |
| Bugfix | `bugfix/[id]-[description]` | `bugfix/DI-456-fix-search` |
| Hotfix | `hotfix/[id]-[description]` | `hotfix/DI-789-auth-issue` |
| Release | `release/v[version]` | `release/v1.0.0` |
| Experiment | `experiment/[description]` | `experiment/graphql-api` |

---

## Workflow & Best Practices

### Daily Development Workflow

#### 1. Start Nieuwe Feature

```bash
# Zorg dat develop up-to-date is
git checkout develop
git pull origin develop

# Maak feature branch
git checkout -b feature/DI-123-add-export-function

# Werk aan feature
# ... code wijzigingen ...

# Commit regelmatig
git add .
git commit -m "feat: add CSV export functionality"

# Push naar remote
git push origin feature/DI-123-add-export-function
```

#### 2. Create Pull Request

1. Ga naar Azure DevOps / GitHub
2. Create New Pull Request
3. **Van**: `feature/DI-123-add-export-function`
4. **Naar**: `develop`
5. Vul template in:
   - Beschrijving van wijzigingen
   - Linked work items
   - Test plan
   - Screenshots (indien UI wijzigingen)

```markdown
## Beschrijving
Voegt CSV export functionaliteit toe aan asset lijst.

## Wijzigingen
- Nieuwe ExportController in backend
- Export button in frontend asset lijst
- Unit tests voor export service

## Test Plan
- [ ] Kan assets exporteren naar CSV
- [ ] CSV bevat alle kolommen
- [ ] Filtering wordt gerespecteerd in export
- [ ] Error handling bij grote datasets

## Screenshots
![Export Button](screenshot-export-button.png)

## Related Work Items
- DI-123: Add export functionality
```

#### 3. Code Review Process

**Als Reviewer:**
1. Check code quality
2. Verify test coverage
3. Test lokaal (indien nodig)
4. Leave constructive feedback
5. Approve of Request Changes

**Als Author:**
1. Address review comments
2. Push updates
3. Re-request review
4. Squash commits (optioneel)

#### 4. Merge

```bash
# Na approval: merge via Azure DevOps UI
# Of via command line:
git checkout develop
git merge --no-ff feature/DI-123-add-export-function
git push origin develop

# Delete feature branch
git branch -d feature/DI-123-add-export-function
git push origin --delete feature/DI-123-add-export-function
```

### Release Workflow

#### Prepare Release

```bash
# Branch from develop
git checkout develop
git pull origin develop
git checkout -b release/v1.1.0

# Update version numbers
# - package.json
# - AssemblyInfo.cs
# - CHANGELOG.md

git add .
git commit -m "chore: bump version to 1.1.0"
git push origin release/v1.1.0
```

#### Deploy Release

```bash
# Create PR: release/v1.1.0 → main
# Approval + merge

# Tag release
git checkout main
git pull origin main
git tag -a v1.1.0 -m "Release version 1.1.0"
git push origin v1.1.0

# Merge back to develop
git checkout develop
git merge main
git push origin develop
```

### Commit Message Conventies

We volgen **Conventional Commits** specificatie:

```
<type>(<scope>): <subject>

<body>

<footer>
```

#### Types

| Type | Gebruik | Voorbeeld |
|------|---------|-----------|
| `feat` | Nieuwe feature | `feat(assets): add CSV export` |
| `fix` | Bug fix | `fix(auth): resolve redirect loop` |
| `docs` | Documentatie | `docs: update deployment guide` |
| `style` | Code formatting | `style: fix indentation` |
| `refactor` | Code restructure | `refactor(api): simplify controller` |
| `test` | Tests toevoegen | `test(assets): add unit tests` |
| `chore` | Build/config | `chore: update dependencies` |
| `perf` | Performance | `perf(db): optimize query` |

#### Voorbeelden

```bash
# Simple commit
git commit -m "feat: add QR code scanner"

# Commit met scope
git commit -m "fix(api): resolve CORS issue in production"

# Commit met body
git commit -m "feat(assets): add template library

Adds predefined asset templates for:
- Dell Latitude Laptops
- HP Printers
- Cisco Switches

Closes DI-123"

# Breaking change
git commit -m "feat(api)!: change asset API response format

BREAKING CHANGE: Asset API now returns camelCase instead of PascalCase
Clients need to update their JSON parsing logic."
```

### Pull Request Template

Configureer PR template in `.azuredevops/pull_request_template.md`:

```markdown
## Type wijziging
- [ ] Feature
- [ ] Bug fix
- [ ] Hotfix
- [ ] Refactor
- [ ] Documentation

## Beschrijving
<!-- Duidelijke beschrijving van wat er is gewijzigd -->

## Motivatie
<!-- Waarom is deze wijziging nodig? -->

## Wijzigingen
<!-- Bullet list van concrete wijzigingen -->
-
-

## Test Plan
<!-- Hoe heb je dit getest? -->
- [ ] Unit tests toegevoegd
- [ ] Integration tests toegevoegd
- [ ] Handmatig getest in DEV
- [ ] Handmatig getest lokaal

## Screenshots
<!-- Indien UI wijzigingen -->

## Checklist
- [ ] Code volgt project conventions
- [ ] Self-review uitgevoerd
- [ ] Commentaar toegevoegd waar nodig
- [ ] Documentatie bijgewerkt
- [ ] Geen nieuwe warnings
- [ ] Tests slagen
- [ ] CHANGELOG.md bijgewerkt (indien applicable)

## Related Work Items
<!-- Link naar Azure DevOps work items -->
Closes #[work-item-id]
```

---

## Troubleshooting

### Lokale Ontwikkeling Issues

#### Backend start niet

**Probleem**: `The specified framework 'Microsoft.AspNetCore.App', version '8.0.x' was not found`

**Oplossing**:
```bash
# Installeer .NET 8.0 SDK
# Download: https://dotnet.microsoft.com/download/dotnet/8.0

# Verificatie
dotnet --list-sdks
```

#### Database migratie faalt

**Probleem**: `Unable to create an object of type 'ApplicationDbContext'`

**Oplossing**:
```bash
# Zorg dat je in de juiste directory bent
cd src/backend

# Specificeer startup project expliciet
dotnet ef database update \
  --project DjoppieInventory.Infrastructure \
  --startup-project DjoppieInventory.API
```

#### Frontend build errors

**Probleem**: `Module not found: Can't resolve '@mui/material'`

**Oplossing**:
```bash
# Verwijder node_modules en package-lock.json
rm -rf node_modules package-lock.json

# Herinstalleer
npm install

# Clear cache
npm cache clean --force
```

#### CORS errors in browser

**Probleem**: `Access to XMLHttpRequest blocked by CORS policy`

**Oplossing**:
```json
// appsettings.Development.json
{
  "CORS": {
    "AllowedOrigins": [
      "http://localhost:5173",
      "https://localhost:5173"
    ]
  }
}
```

### Git Workflow Issues

#### Merge conflicts

**Probleem**: Conflicts bij merge

**Oplossing**:
```bash
# Update develop branch
git checkout develop
git pull origin develop

# Rebase feature branch
git checkout feature/my-feature
git rebase develop

# Resolve conflicts
# ... edit conflicted files ...

git add .
git rebase --continue

# Force push (alleen voor feature branches!)
git push origin feature/my-feature --force
```

#### Accidentele commit naar main

**Probleem**: Direct committed naar protected branch

**Oplossing**:
```bash
# Dit zou niet mogen door branch protection
# Maar als het toch gebeurt:

# Maak nieuwe branch met huidige wijzigingen
git checkout -b feature/accidental-commit

# Push nieuwe branch
git push origin feature/accidental-commit

# Reset main naar origin
git checkout main
git reset --hard origin/main

# Create PR van nieuwe branch
```

#### Grote bestanden committed

**Probleem**: Accidenteel grote bestanden gecommit (>100MB)

**Oplossing**:
```bash
# Installeer git-filter-repo
# https://github.com/newren/git-filter-repo

# Verwijder bestand uit history
git filter-repo --path path/to/large/file.zip --invert-paths

# Force push (GEVAARLIJK - overleg met team!)
git push origin --force --all
```

### Branch Issues

#### Outdated feature branch

**Probleem**: Feature branch te ver achter op develop

**Oplossing**:
```bash
git checkout feature/my-feature
git fetch origin
git rebase origin/develop

# Of met merge (minder clean):
git merge origin/develop
```

#### Delete remote branch

**Probleem**: Remote feature branch verwijderen

**Oplossing**:
```bash
# Via Git
git push origin --delete feature/old-feature

# Of via Azure DevOps UI: Branches > ... > Delete
```

---

## Cheat Sheet

### Veelgebruikte Commando's

```bash
# === SETUP ===
git clone https://github.com/Djoppie/Djoppie-Inventory.git
cd Djoppie-Inventory

# === DAILY WORKFLOW ===
# Start nieuwe feature
git checkout develop
git pull origin develop
git checkout -b feature/DI-123-my-feature

# Commit wijzigingen
git add .
git commit -m "feat: add new functionality"
git push origin feature/DI-123-my-feature

# Update feature branch met develop
git fetch origin
git rebase origin/develop

# === RELEASE ===
# Create release branch
git checkout -b release/v1.1.0 develop
# ... update versions ...
git commit -m "chore: bump version to 1.1.0"

# Merge to main
git checkout main
git merge release/v1.1.0
git tag -a v1.1.0 -m "Release 1.1.0"
git push origin main --tags

# Merge back to develop
git checkout develop
git merge release/v1.1.0
git push origin develop

# === HOTFIX ===
git checkout -b hotfix/critical-fix main
# ... fix ...
git commit -m "fix: critical security issue"
git checkout main
git merge hotfix/critical-fix
git checkout develop
git merge hotfix/critical-fix

# === CLEANUP ===
# Delete local branch
git branch -d feature/old-feature

# Delete remote branch
git push origin --delete feature/old-feature

# Prune deleted remote branches
git remote prune origin
```

---

## Volgende Stappen

Nu je de omgevingen en branching strategie begrijpt, ga verder naar:

**[Handleiding 2: Azure Infrastructuur Setup →](02-Azure-Infrastructuur-Setup.md)**

Daar leer je:
- Azure resources aanmaken met Bicep
- Resource Groups configureren
- App Services en Static Web Apps deployen
- Key Vault en monitoring instellen

---

**Vragen of problemen?** Contact: jo.wijnen@diepenbeek.be

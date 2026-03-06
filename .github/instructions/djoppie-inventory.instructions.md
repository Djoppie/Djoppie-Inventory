---
description: "Use when working with Djoppie Inventory codebase. Covers Clean Architecture patterns (API/Core/Infrastructure), Entity/DTO design, repository pattern, Entra ID authentication, React component structure, Bicep infrastructure, and development workflows. Applies to backend (.NET 8), frontend (React 19), and infrastructure (Azure/Bicep)."
applyTo: ["src/**/*.cs", "src/**/*.ts", "src/**/*.tsx", "infra/**/*.bicep"]
---

# Djoppie Inventory Development Guidelines

Djoppie Inventory is an asset and inventory management system for IT support with Intune integration. This guide ensures consistent architecture, patterns, and conventions across backend, frontend, and infrastructure.

## Project Structure Overview

```
backend/          → ASP.NET Core 8.0, C# 12 (Clean Architecture)
  API/            → Controllers, middleware, configuration
  Core/           → Entities, DTOs, interfaces, business logic
  Infrastructure/ → EF Core, repositories, external services
  Tests/          → Unit tests

frontend/         → React 19, TypeScript, Vite
  src/
    api/          → Axios API service layer
    components/   → Reusable MUI components
    pages/        → Page-level components
    hooks/        → Custom React hooks
    types/        → TypeScript types and interfaces
    utils/        → Helpers (validation, logging, export)
    i18n/         → Translations (nl.json, en.json)

infra/            → Azure infrastructure (Bicep)
  bicep/
    main.*.bicep  → Environment templates (dev/prod)
    modules/      → Reusable modules (AppService, KeyVault, SQL)
```

## Backend Patterns (C# / ASP.NET Core 8.0)

### Clean Architecture Layers

Follow strict layer separation:

- **API Layer** (`DjoppieInventory.API`): Controllers, middleware, configuration, authentication
- **Core Layer** (`DjoppieInventory.Core`): Entities, DTOs, interfaces, business rules (no dependencies)
- **Infrastructure Layer** (`DjoppieInventory.Infrastructure`): EF Core, repositories, external APIs (Microsoft Graph)

**Anti-pattern**: Business logic in controllers or direct database queries in entities.

### Entity and DTO Pattern

**Entity Design** (in `Core/Entities/`):
- Use properties with public getters/setters
- Include XML documentation comments
- Never reference DTOs or infrastructure
- Use navigation properties for relationships
- Define enums as nested types or separate files

```csharp
public class Asset
{
    /// <summary>Unique identifier for the asset</summary>
    public int Id { get; set; }

    /// <summary>Auto-generated asset code (PREFIX-####)</summary>
    public string AssetCode { get; set; } = string.Empty;

    /// <summary>Current status of the asset</summary>
    public AssetStatus Status { get; set; } = AssetStatus.Nieuw;
}

public enum AssetStatus : byte
{
    InGebruik = 0,   // In use
    Stock = 1,       // In stock
    Herstelling = 2, // Repair
    Defect = 3,      // Defective
    UitDienst = 4,   // Decommissioned
    Nieuw = 5        // New
}
```

**DTO Design** (in `Core/DTOs/`):
- Create separate `*CreateDto` and `*UpdateDto` for write operations
- Always include `*ResponseDto` for read operations
- Map between entities and DTOs in services/repositories, not in controllers
- Use AutoMapper for complex mappings

```csharp
public class AssetResponseDto
{
    public int Id { get; set; }
    public string AssetCode { get; set; } = string.Empty;
    public int Status { get; set; } // Use int for enums in DTOs
    public DateTime CreatedAt { get; set; }
}

public class AssetCreateDto
{
    [Required]
    public string AssetCode { get; set; } = string.Empty;

    public int Status { get; set; } = (int)AssetStatus.Nieuw;
}
```

### Repository Pattern

**Interface** (in `Core/Interfaces/`):
```csharp
public interface IAssetRepository
{
    Task<Asset?> GetByIdAsync(int id);
    Task<IEnumerable<Asset>> GetAllAsync();
    Task<Asset> AddAsync(Asset asset);
    Task UpdateAsync(Asset asset);
    Task DeleteAsync(int id);
}
```

**Implementation** (in `Infrastructure/Repositories/`):
- Inherit repository interfaces from Core
- Use `IAsyncEnumerable` for large result sets
- Add include paths for related entities
- Use `AsNoTracking()` for read-only queries

### Dependency Injection (Program.cs)

Register all services in `Program.cs`:

```csharp
// Repositories
builder.Services.AddScoped<IAssetRepository, AssetRepository>();

// Services
builder.Services.AddScoped<IAssetService, AssetService>();

// External services
builder.Services.AddScoped<IIntuneService, IntuneService>();
```

### Authentication & Authorization

All endpoints use **Entra ID via Microsoft.Identity.Web**:

```csharp
[ApiController]
[Route("api/[controller]")]
[Authorize]  // Requires authentication
public class AssetsController : ControllerBase
{
    [HttpGet("{id}")]
    [Authorize]  // Standard user access
    public async Task<IActionResult> GetAsset(int id) { ... }

    [HttpPost]
    [Authorize(Policy = "RequireAdminRole")]  // Admin only
    public async Task<IActionResult> CreateAsset([FromBody] AssetCreateDto dto) { ... }
}
```

**Admin Policy** is pre-configured in Program.cs. Check CLAUDE.md for Entra ID configuration.

### Enums in API Responses

Always return enums as **integers** in JSON responses (not strings):

```csharp
// ✓ Correct: Use int property in DTO
public int Status { get; set; } // Maps to AssetStatus enum value (0-5)

// ✗ Wrong: String representation
public string Status { get; set; }
```

This keeps API responses compact and compatible with frontend type safety.

### Database Migrations

When modifying entities:

```bash
cd src/backend

# Create migration from API project
dotnet ef migrations add AddAssetHistoryTable \
  --project DjoppieInventory.Infrastructure \
  --startup-project DjoppieInventory.API

# Apply to local SQLite
dotnet ef database update \
  --project DjoppieInventory.Infrastructure \
  --startup-project DjoppieInventory.API

# Production: Use Key Vault for connection string
# dotnet ef database update --connection "Server=...;Database=..."
```

**Migration Safety**:
- Never drop columns in the same release as code removal
- Test rollback before merging
- Add `.sql` files to `/scripts/db/` for manual review

---

## Frontend Patterns (React 19 / TypeScript)

### Project Structure

```
src/
  api/          → Axios service layer (one file per resource)
  components/   → Reusable MUI components
  pages/        → Full-page containers with routing
  hooks/        → Custom React hooks (useAssets, useAuth, etc.)
  types/        → TypeScript interfaces (*.types.ts)
  utils/        → Helpers: validation, logging, export, debounce
  config/       → App config (MSAL, i18n)
  i18n/         → Translation files (nl.json, en.json)
  theme/        → MUI theme and styling
```

### TypeScript Best Practices

**Type Definitions** (`src/types/*.types.ts`):
```typescript
// ✓ Separate file for related types
export interface Asset {
  id: number;
  assetCode: string;
  status: AssetStatus; // Reference enum below
  createdAt: string;
}

export enum AssetStatus {
  InGebruik = 0,
  Stock = 1,
  Herstelling = 2,
  Defect = 3,
  UitDienst = 4,
  Nieuw = 5
}
```

**API Service Layer** (`src/api/*.api.ts`):
```typescript
// One Axios service per resource
import axios from 'axios';
import { Asset, AssetCreateDto } from '../types/asset.types';

const API_URL = import.meta.env.VITE_API_URL;

export const assetApi = {
  getAll: async (): Promise<Asset[]> => {
    const response = await axios.get(`${API_URL}/assets`);
    return response.data;
  },

  getById: async (id: number): Promise<Asset> => {
    const response = await axios.get(`${API_URL}/assets/${id}`);
    return response.data;
  },

  create: async (data: AssetCreateDto): Promise<Asset> => {
    const response = await axios.post(`${API_URL}/assets`, data);
    return response.data;
  }
};
```

### Component Design

**Functional Components with MUI**:
```typescript
import { Box, Button, Card, TextField } from '@mui/material';
import { FC } from 'react';

interface AssetCardProps {
  asset: Asset;
  onEdit: (asset: Asset) => void;
}

export const AssetCard: FC<AssetCardProps> = ({ asset, onEdit }) => {
  return (
    <Card sx={{ p: 2, mb: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <div>
          <h3>{asset.assetCode}</h3>
          <p>Status: {asset.status}</p>
        </div>
        <Button variant="contained" onClick={() => onEdit(asset)}>
          Edit
        </Button>
      </Box>
    </Card>
  );
};
```

**Guidelines**:
- Use `FC<Props>` (Functional Component) with typed props
- Keep components under 300 lines; extract complex logic to hooks
- Use MUI's `sx` prop for styling (not inline styles)
- Memoize expensive components: `memo(AssetCard)`

### Custom Hooks

**Pattern** (`src/hooks/useAssets.ts`):
```typescript
import { useQuery } from '@tanstack/react-query';
import { assetApi } from '../api/assets.api';

export const useAssets = () => {
  return useQuery({
    queryKey: ['assets'],
    queryFn: () => assetApi.getAll(),
    staleTime: 5 * 60 * 1000  // 5 minutes
  });
};
```

**Usage in Components**:
```typescript
const MyPage: FC = () => {
  const { data: assets, isLoading, error } = useAssets();

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;

  return (
    <Box>
      {assets?.map(asset => (
        <AssetCard key={asset.id} asset={asset} />
      ))}
    </Box>
  );
};
```

### State Management

- **Server State**: TanStack Query (React Query) for API data
- **Auth State**: MSAL React (`@azure/msal-react`)
- **UI State**: React `useState` for local component state
- **Global UI State**: Context API if needed (dark mode, language)

### Internationalization (i18next)

**Translation Files** (`src/i18n/nl.json`, `src/i18n/en.json`):
```json
{
  "assets": {
    "title": "Assets",
    "status": {
      "inGebruik": "In use",
      "stock": "Stock"
    }
  }
}
```

**Usage in Components**:
```typescript
import { useTranslation } from 'react-i18next';

export const AssetList: FC = () => {
  const { t } = useTranslation();

  return <h1>{t('assets.title')}</h1>;
};
```

**Add translations before committing** — never hardcode UI text.

---

## Infrastructure Patterns (Bicep / Azure)

### Bicep Module Structure

**Main Template** (`main.dev.bicep`, `main.prod.bicep`):
```bicep
targetScope = 'resourceGroup'

param environment string
param location string
param tags object

// Modules
module appService 'modules/appservice.bicep' = {
  name: 'appService'
  params: {
    environment: environment
    location: location
    tags: tags
  }
}

module keyVault 'modules/keyvault.bicep' = {
  name: 'keyVault'
  params: {
    environment: environment
    tags: tags
  }
}
```

**Module Pattern** (`modules/appservice.bicep`):
```bicep
param environment string
param location string
param tags object

resource appServicePlan 'Microsoft.Web/serverfarms@2023-01-01' = {
  name: 'asp-${environment}-unique'
  location: location
  kind: 'Linux'
  sku: {
    name: environment == 'prod' ? 'P2V2' : 'B2'
  }
  tags: tags
}

@export()
output appServicePlanId string = appServicePlan.id
```

**Guidelines**:
- One concern per module file (e.g., `appservice.bicep`, `keyvault.bicep`)
- Use `param` for inputs, `output` for exports
- Include tags for all resources (billing, governance)
- Use environment-specific values: `sku: environment == 'prod' ? 'P2V2' : 'B2'`

### Environment Configuration

**Development** (`parameters-dev.json`):
```json
{
  "environment": "dev",
  "location": "westeurope",
  "sqlSku": "Basic",
  "appServiceSku": "B2"
}
```

**Production** (`parameters-prod.json`):
```json
{
  "environment": "prod",
  "location": "westeurope",
  "sqlSku": "Standard",
  "appServiceSku": "P2V2"
}
```

---

## Development Commands

### Backend

```bash
cd src/backend

# Restore & build
dotnet restore
dotnet build

# Run with watch mode
cd DjoppieInventory.API
dotnet watch run         # Starts at http://localhost:5052

# Tests
cd ../DjoppieInventory.Tests
dotnet test

# Code quality
dotnet format            # Format code
dotnet analyze          # Run analyzers
```

### Frontend

```bash
cd src/frontend

# Install dependencies
npm install

# Development
npm run dev              # Starts at http://localhost:5173

# Build for production
npm run build
npm run preview          # Test production build

# Linting
npm run lint
npm run lint -- --fix    # Fix automatically
```

### Infrastructure

```bash
cd infra

# Validate template
az bicep build main.dev.bicep

# Deploy
az deployment group create \
  --resource-group djoppie-dev \
  --template-file main.dev.bicep \
  --parameters parameters-dev.json
```

---

## Authentication & Authorization

### Entra ID Configuration

The app uses **Azure Entra ID (Microsoft Entra)** for single sign-on:

- **Frontend Client ID**: `b0b10b6c-8638-4bdd-9684-de4a55afd521`
- **Backend API Client ID**: `eb5bcf06-8032-494f-a363-92b6802c44bf` (dev/local)
- **Tenant**: `7db28d6f-d542-40c1-b529-5e5ed2aad545` (Diepenbeek)

**Admin Policy**:
```csharp
[Authorize(Policy = "RequireAdminRole")]  // Requires specific Entra ID group or role
```

See `.azuredevops/README.md` and `CLAUDE.md` for Entra ID setup.

---

## Deployment Workflows

### Local Development

**Terminal 1: Backend**
```bash
cd src/backend/DjoppieInventory.API
dotnet run  # Localhost:5052
```

**Terminal 2: Frontend**
```bash
cd src/frontend
npm run dev  # Localhost:5173
```

### Azure DEV

**Automated** (recommended):
```powershell
.\deploy-dev.ps1
```

**Manual**:
```powershell
# Backend
cd src/backend/DjoppieInventory.API
dotnet publish -c Release -o publish
# Upload to App Service

# Frontend
cd src/frontend
npm run build
# Deploy dist/ to Static Web App

# Infrastructure
cd infra
az deployment group create \
  --resource-group djoppie-dev \
  --template-file main.dev.bicep \
  --parameters parameters-dev.json
```

### Database Connection

**Local**: SQLite (`djoppie.db`)
**Production**: Azure SQL with connection string from Key Vault

---

## Common Workflows

### Adding a New Entity

1. Create entity in `Core/Entities/`
2. Create DTOs in `Core/DTOs/` (`ResponseDto`, `CreateDto`, `UpdateDto`)
3. Create repository interface in `Core/Interfaces/`
4. Implement repository in `Infrastructure/Repositories/`
5. Add `DbSet<NewEntity>` to `ApplicationDbContext.cs`
6. Register in `Program.cs` DI
7. Create migration: `dotnet ef migrations add AddNewEntity`
8. Create controller in `API/Controllers/`
9. Add tests to `Tests/`

### Adding a New API Endpoint

1. Add method to appropriate controller
2. Include `[Authorize]` or `[Authorize(Policy = "RequireAdminRole")]`
3. Test via Swagger at `http://localhost:5052/swagger`
4. Create frontend API service in `src/api/*.api.ts`
5. Create custom hook in `src/hooks/use*.ts`
6. Create component in `src/components/` or page in `src/pages/`
7. Add tests

### Modifying Asset Status

When adding/removing `AssetStatus` enum values:

1. Update enum in `Core/Entities/Asset.cs`
2. Create migration if needed
3. Update frontend `AssetStatus` enum in `src/types/asset.types.ts`
4. Update frontend filters and status badges
5. Update translation files: `src/i18n/nl.json`, `src/i18n/en.json`
6. Test all status-dependent features
7. Update CLAUDE.md if enum values are user-facing

---

## Troubleshooting

### 401 Unauthorized

- Verify frontend uses correct API scope: `VITE_ENTRA_API_SCOPE`
- Check token in DevTools → Application → Session Storage
- Decode JWT at jwt.ms to verify audience and claims
- Clear MSAL cache: F12 → Application → Clear storage

### Backend won't start

- Check `appsettings.Development.json` connection string
- Verify `AzureAd:ClientSecret` is set: `dotnet user-secrets set "AzureAd:ClientSecret" "..."`
- Check port 5052 is not in use

### Frontend build errors

- Clear `node_modules` and reinstall: `npm install --force`
- Check Node.js version: `node --version` (should be 18+)
- Clear Vite cache: `rm -rf node_modules/.vite`

---

## Resources

- **Project Guide**: `CLAUDE.md`
- **Deployment**: `README-DEPLOYMENT.md`
- **API Endpoints**: `src/backend/DjoppieInventory.API/DjoppieInventory.API.http`
- **CI/CD Setup**: `.azuredevops/README.md`
- **Key Vault**: `KEYVAULT-QUICK-REFERENCE.md`

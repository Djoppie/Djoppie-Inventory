# Djoppie Inventory - Developer Setup Guide

## Prerequisites

Before setting up the development environment, ensure you have the following installed:

### Required Software

| Software | Version | Download |
|----------|---------|----------|
| .NET SDK | 8.0+ | [dotnet.microsoft.com](https://dotnet.microsoft.com/download) |
| Node.js | 18.0+ | [nodejs.org](https://nodejs.org/) |
| Git | Latest | [git-scm.com](https://git-scm.com/) |
| Visual Studio Code | Latest | [code.visualstudio.com](https://code.visualstudio.com/) |

### Recommended VS Code Extensions

- C# Dev Kit (Microsoft)
- ESLint
- Prettier
- GitLens
- REST Client

### Azure Access

You'll need access to:
- Microsoft Entra ID (Azure AD) for authentication
- Azure DevOps for CI/CD (optional)

---

## Quick Start

```bash
# Clone the repository
git clone https://github.com/Djoppie/Djoppie-Inventory.git
cd Djoppie-Inventory

# Set up backend
cd src/backend/DjoppieInventory.API
dotnet restore
dotnet user-secrets set "AzureAd:ClientSecret" "your-client-secret-here"
dotnet run

# In a new terminal, set up frontend
cd src/frontend
npm install
npm run dev
```

Access the application at: http://localhost:5173

---

## Detailed Setup

### Step 1: Clone Repository

```bash
git clone https://github.com/Djoppie/Djoppie-Inventory.git
cd Djoppie-Inventory
```

### Step 2: Backend Setup

#### Install Dependencies

```bash
cd src/backend
dotnet restore
```

#### Configure Secrets

The backend requires a client secret for Microsoft Entra ID authentication. This secret is stored using .NET User Secrets (never commit to git).

```bash
cd DjoppieInventory.API

# Initialize user secrets (if not already done)
dotnet user-secrets init

# Set the client secret (get from Azure Portal or team lead)
dotnet user-secrets set "AzureAd:ClientSecret" "your-client-secret-value"

# Verify the secret is set
dotnet user-secrets list
```

#### Database Setup

The development environment uses SQLite, which is automatically created.

```bash
# Apply migrations (optional - EnsureCreated is used in development)
cd src/backend
dotnet ef database update \
  --project DjoppieInventory.Infrastructure \
  --startup-project DjoppieInventory.API
```

#### Run the Backend

```bash
cd src/backend/DjoppieInventory.API

# Standard run
dotnet run

# With hot reload (recommended for development)
dotnet watch run
```

The API runs at: http://localhost:5052

Swagger documentation: http://localhost:5052/swagger

### Step 3: Frontend Setup

#### Install Dependencies

```bash
cd src/frontend
npm install
```

#### Environment Configuration

The frontend uses `.env.development` for local settings (already configured):

```env
VITE_API_URL=http://localhost:5052/api
VITE_ENTRA_CLIENT_ID=b0b10b6c-8638-4bdd-9684-de4a55afd521
VITE_ENTRA_TENANT_ID=7db28d6f-d542-40c1-b529-5e5ed2aad545
VITE_ENTRA_AUTHORITY=https://login.microsoftonline.com/7db28d6f-d542-40c1-b529-5e5ed2aad545
VITE_ENTRA_REDIRECT_URI=http://localhost:5173
VITE_ENTRA_API_SCOPE=api://eb5bcf06-8032-494f-a363-92b6802c44bf/access_as_user
```

#### Run the Frontend

```bash
npm run dev
```

The application runs at: http://localhost:5173

---

## Project Structure

```
Djoppie-Inventory/
├── src/
│   ├── backend/
│   │   ├── DjoppieInventory.API/           # Presentation layer (Controllers)
│   │   ├── DjoppieInventory.Core/          # Domain layer (Entities, DTOs)
│   │   ├── DjoppieInventory.Infrastructure/ # Data access, Services
│   │   └── DjoppieInventory.Tests/         # Unit and integration tests
│   │
│   └── frontend/
│       ├── src/
│       │   ├── api/           # API client functions
│       │   ├── components/    # React components
│       │   ├── pages/         # Page components
│       │   ├── hooks/         # Custom React hooks
│       │   ├── types/         # TypeScript types
│       │   ├── config/        # Configuration
│       │   ├── utils/         # Utilities
│       │   └── i18n/          # Translations
│       ├── package.json
│       └── vite.config.ts
│
├── docs/                      # Documentation
├── CLAUDE.md                  # AI assistant instructions
└── README.md                  # Project overview
```

---

## Development Workflow

### Backend Development

#### Creating a New Entity

1. **Define the Entity** (`DjoppieInventory.Core/Entities/`)
   ```csharp
   public class NewEntity
   {
       public int Id { get; set; }
       public string Name { get; set; } = string.Empty;
       public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
   }
   ```

2. **Add DbSet** (`DjoppieInventory.Infrastructure/Data/ApplicationDbContext.cs`)
   ```csharp
   public DbSet<NewEntity> NewEntities { get; set; }
   ```

3. **Create Migration**
   ```bash
   dotnet ef migrations add AddNewEntity \
     --project DjoppieInventory.Infrastructure \
     --startup-project DjoppieInventory.API
   ```

4. **Apply Migration**
   ```bash
   dotnet ef database update \
     --project DjoppieInventory.Infrastructure \
     --startup-project DjoppieInventory.API
   ```

5. **Create DTOs** (`DjoppieInventory.Core/DTOs/`)
   ```csharp
   public class NewEntityDto
   {
       public int Id { get; set; }
       public string Name { get; set; } = string.Empty;
   }

   public class CreateNewEntityDto
   {
       [Required]
       public string Name { get; set; } = string.Empty;
   }
   ```

6. **Create Controller** (`DjoppieInventory.API/Controllers/`)
   ```csharp
   [ApiController]
   [Route("api/[controller]")]
   [Authorize]
   public class NewEntitiesController : ControllerBase
   {
       // CRUD operations
   }
   ```

#### Running Tests

```bash
cd src/backend/DjoppieInventory.Tests

# Run all tests
dotnet test

# Run with verbose output
dotnet test --verbosity normal

# Run specific test
dotnet test --filter "FullyQualifiedName~AssetServiceTests"

# Run with coverage
dotnet test --collect:"XPlat Code Coverage"
```

### Frontend Development

#### Creating a New Component

```tsx
// src/components/common/NewComponent.tsx
import { Box, Typography } from '@mui/material';

interface NewComponentProps {
  title: string;
}

export function NewComponent({ title }: NewComponentProps) {
  return (
    <Box>
      <Typography variant="h6">{title}</Typography>
    </Box>
  );
}
```

#### Creating an API Hook

```typescript
// src/hooks/useNewEntity.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { newEntityApi } from '../api/newEntity.api';

export function useNewEntities() {
  return useQuery({
    queryKey: ['newEntities'],
    queryFn: newEntityApi.getAll,
  });
}

export function useCreateNewEntity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: newEntityApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['newEntities'] });
    },
  });
}
```

#### Adding Translations

Edit `src/i18n/nl.json` and `src/i18n/en.json`:

```json
{
  "newEntity": {
    "title": "New Entity",
    "create": "Create New Entity"
  }
}
```

### Code Quality

#### Backend

```bash
# Format code
dotnet format

# Build with warnings as errors
dotnet build --warnaserror
```

#### Frontend

```bash
# Lint
npm run lint

# Lint with auto-fix
npm run lint -- --fix

# Type check
npx tsc --noEmit
```

---

## Database Management

### Local SQLite Database

The development database is stored at:
```
src/backend/DjoppieInventory.API/djoppie.db
```

#### Reset Database

```bash
# Delete the database file
rm src/backend/DjoppieInventory.API/djoppie.db

# Restart the API (database will be recreated)
dotnet run
```

#### View Database

Use any SQLite viewer:
- DB Browser for SQLite
- VS Code SQLite extension
- Azure Data Studio

### Migration Commands

```bash
# Create migration
dotnet ef migrations add <MigrationName> \
  --project DjoppieInventory.Infrastructure \
  --startup-project DjoppieInventory.API

# Apply migrations
dotnet ef database update \
  --project DjoppieInventory.Infrastructure \
  --startup-project DjoppieInventory.API

# Remove last migration (if not applied)
dotnet ef migrations remove \
  --project DjoppieInventory.Infrastructure \
  --startup-project DjoppieInventory.API

# Generate SQL script
dotnet ef migrations script \
  --project DjoppieInventory.Infrastructure \
  --startup-project DjoppieInventory.API \
  --output migration.sql

# List migrations
dotnet ef migrations list \
  --project DjoppieInventory.Infrastructure \
  --startup-project DjoppieInventory.API
```

---

## Authentication

### How It Works

1. User clicks "Sign in with Microsoft"
2. MSAL redirects to Microsoft Entra ID login
3. User authenticates with their credentials
4. Entra ID returns JWT access token
5. Frontend includes token in API requests
6. Backend validates token and authorizes requests

### Configuration

**Frontend** (MSAL React):
- Client ID: `b0b10b6c-8638-4bdd-9684-de4a55afd521`
- Scope: `api://eb5bcf06-8032-494f-a363-92b6802c44bf/access_as_user`

**Backend** (Microsoft.Identity.Web):
- Client ID: `eb5bcf06-8032-494f-a363-92b6802c44bf`
- Audience: `api://eb5bcf06-8032-494f-a363-92b6802c44bf`

### Troubleshooting Auth

1. **Clear MSAL cache**: F12 > Application > Clear storage
2. **Check token**: Decode at jwt.ms
3. **Verify scope**: Ensure frontend scope matches backend audience
4. **Admin consent**: May be required for new permissions

---

## Debugging

### Backend Debugging

#### VS Code

1. Install C# Dev Kit extension
2. Open the solution folder
3. Press F5 to start debugging
4. Set breakpoints in code

#### Visual Studio

1. Open `src/backend/DjoppieInventory.sln`
2. Press F5 to start with debugger
3. Use breakpoints and watches

### Frontend Debugging

#### Browser DevTools

1. Open browser DevTools (F12)
2. Use Sources tab for breakpoints
3. Use Network tab for API calls
4. Use React DevTools extension

#### VS Code

1. Install "Debugger for Chrome" extension
2. Create launch.json configuration
3. Press F5 to start debugging

---

## Common Commands Reference

### Backend

```bash
# Restore packages
dotnet restore

# Build
dotnet build

# Run
dotnet run

# Run with watch
dotnet watch run

# Test
dotnet test

# Format
dotnet format

# Publish
dotnet publish -c Release -o ./publish
```

### Frontend

```bash
# Install dependencies
npm install

# Development server
npm run dev

# Build production
npm run build

# Preview build
npm run preview

# Lint
npm run lint

# Type check
npx tsc --noEmit
```

### Git

```bash
# Create feature branch
git checkout -b feature/my-feature

# Commit changes
git add .
git commit -m "feat: add new feature"

# Push branch
git push -u origin feature/my-feature

# Sync with main
git fetch origin
git rebase origin/main
```

---

## Environment Variables

### Backend (appsettings.Development.json)

| Variable | Description | Default |
|----------|-------------|---------|
| ConnectionStrings:DefaultConnection | Database connection | SQLite: djoppie.db |
| AzureAd:TenantId | Entra tenant ID | 7db28d6f-... |
| AzureAd:ClientId | Backend app ID | eb5bcf06-... |
| AzureAd:ClientSecret | **USER SECRETS** | - |
| Logging:LogLevel:Default | Log level | Information |

### Frontend (.env.development)

| Variable | Description | Default |
|----------|-------------|---------|
| VITE_API_URL | Backend API URL | http://localhost:5052/api |
| VITE_ENTRA_CLIENT_ID | Frontend app ID | b0b10b6c-... |
| VITE_ENTRA_TENANT_ID | Entra tenant ID | 7db28d6f-... |
| VITE_ENTRA_AUTHORITY | Auth endpoint | https://login.microsoftonline.com/... |
| VITE_ENTRA_REDIRECT_URI | OAuth redirect | http://localhost:5173 |
| VITE_ENTRA_API_SCOPE | API scope | api://.../access_as_user |

---

## Getting Help

### Documentation

- **CLAUDE.md**: AI assistant instructions and codebase overview
- **docs/ARCHITECTURE.md**: System architecture
- **docs/API-REFERENCE.md**: API endpoints
- **docs/DATA-MODEL.md**: Database schema
- **docs/ROLLOUT-WORKFLOW-GUIDE.md**: Rollout feature guide

### Contacts

- **Repository**: https://github.com/Djoppie/Djoppie-Inventory
- **Maintainer**: jo.wijnen@diepenbeek.be

### Troubleshooting

1. Check existing documentation
2. Search GitHub issues
3. Review error logs
4. Ask team members

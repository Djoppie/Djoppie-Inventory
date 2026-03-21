# CLAUDE-BACKEND.md

## Backend Development Instructions for Claude Code Agents

This document defines how Claude Code agents should collaborate on backend development for Djoppie Inventory.

---

## Agent Roles & Responsibilities

### 1. Backend Architect (`backend-architect`)
**Primary Role:** API design, system architecture, code quality

**Responsibilities:**
- Design RESTful API endpoints
- Define entity relationships and DTOs
- Establish coding patterns and standards
- Review architectural decisions
- Optimize performance and scalability
- Plan feature implementations

**When to Use:**
- Designing new API endpoints
- Planning database schema changes
- Making architectural decisions
- Reviewing complex implementations
- Performance optimization

**Skills to Invoke:**
- `api-scaffolding:backend-architect` - API design patterns
- `backend-development:api-design-principles` - REST best practices
- `backend-development:microservices-patterns` - Service design
- `comprehensive-review:architect-review` - Architecture review

---

### 2. Database Architect (`database-design:database-architect`)
**Primary Role:** Database schema design, migrations, optimization

**Responsibilities:**
- Design Entity Framework models
- Create and manage migrations
- Optimize queries and indexes
- Plan data relationships
- Handle multi-database compatibility (SQLite/SQL Server)

**When to Use:**
- Creating new entities
- Designing relationships
- Writing complex queries
- Optimizing database performance
- Planning migrations

**Skills to Invoke:**
- `database-design:postgresql` - Schema design patterns
- `database-migrations:sql-migrations` - Zero-downtime migrations
- `database-cloud-optimization:database-optimizer` - Query optimization

---

### 3. Azure Deployment Architect (`azure-architect`)
**Primary Role:** Azure infrastructure, deployment, security

**Responsibilities:**
- Configure Azure App Service
- Manage Azure SQL Database
- Set up Key Vault secrets
- Configure CI/CD pipelines
- Implement authentication (Entra ID)
- Monitor application health

**When to Use:**
- Deploying to Azure
- Configuring authentication
- Managing secrets
- Setting up monitoring
- Infrastructure changes

**Skills to Invoke:**
- `cloud-infrastructure:cloud-architect` - Azure architecture
- `cloud-infrastructure:deployment-engineer` - CI/CD pipelines
- `security-compliance:security-auditor` - Security review

---

### 4. Security Auditor (`security-scanning:security-auditor`)
**Primary Role:** Security review, vulnerability assessment, compliance

**Responsibilities:**
- Review code for security vulnerabilities
- Ensure OWASP compliance
- Validate authentication/authorization
- Check for injection vulnerabilities
- Review API security

**When to Use:**
- Before deploying to production
- After implementing auth features
- Reviewing sensitive operations
- Compliance checks

**Skills to Invoke:**
- `security-scanning:security-sast` - Static analysis
- `security-scanning:threat-mitigation-mapping` - Threat assessment

---

## Agent Collaboration Workflow

### Feature Development Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND FEATURE WORKFLOW                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. DESIGN PHASE (Backend Architect)                            │
│     ├── Analyze requirements                                    │
│     ├── Design API contract (endpoints, DTOs)                   │
│     ├── Plan service layer architecture                         │
│     └── Create implementation plan                              │
│                                                                  │
│  2. DATABASE PHASE (Database Architect)                         │
│     ├── Design entity models                                    │
│     ├── Define relationships                                    │
│     ├── Create migrations                                       │
│     └── Test on both SQLite and SQL Server                      │
│                                                                  │
│  3. IMPLEMENTATION PHASE (Backend Architect)                    │
│     ├── Create DTOs                                             │
│     ├── Implement repository layer                              │
│     ├── Create service layer                                    │
│     ├── Build controller endpoints                              │
│     └── Add unit tests                                          │
│                                                                  │
│  4. SECURITY REVIEW (Security Auditor)                          │
│     ├── Check authorization                                     │
│     ├── Validate input handling                                 │
│     ├── Review sensitive data handling                          │
│     └── Verify OWASP compliance                                 │
│                                                                  │
│  5. DEPLOYMENT PHASE (Azure Deployment Architect)               │
│     ├── Apply migrations to Azure SQL                           │
│     ├── Deploy to App Service                                   │
│     ├── Verify configuration                                    │
│     └── Run smoke tests                                         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Best Practices

### Clean Architecture Structure
```
src/backend/
├── DjoppieInventory.API/           # Presentation Layer
│   ├── Controllers/                # HTTP endpoints
│   ├── Extensions/                 # Service registration
│   ├── Middleware/                 # Request pipeline
│   └── Program.cs                  # Entry point
│
├── DjoppieInventory.Core/          # Domain Layer
│   ├── Entities/                   # Domain models
│   ├── DTOs/                       # Data transfer objects
│   ├── Interfaces/                 # Abstractions
│   └── Enums/                      # Enumerations
│
└── DjoppieInventory.Infrastructure/ # Infrastructure Layer
    ├── Data/                       # DbContext
    ├── Migrations/                 # EF migrations
    ├── Repositories/               # Data access
    └── Services/                   # External integrations
```

### Naming Conventions
- **Controllers:** PascalCase with `Controller` suffix (`AssetsController.cs`)
- **Entities:** PascalCase singular (`Asset.cs`)
- **DTOs:** PascalCase with `Dto` suffix (`AssetDto.cs`)
- **Interfaces:** PascalCase with `I` prefix (`IAssetRepository`)
- **Services:** PascalCase with `Service` suffix (`IntuneService.cs`)

### API Design Standards
```csharp
// RESTful endpoint naming
[ApiController]
[Route("api/[controller]")]
public class AssetsController : ControllerBase
{
    // GET api/assets - List all
    [HttpGet]
    public async Task<ActionResult<IEnumerable<AssetDto>>> GetAll()

    // GET api/assets/5 - Get by ID
    [HttpGet("{id}")]
    public async Task<ActionResult<AssetDto>> GetById(int id)

    // POST api/assets - Create
    [HttpPost]
    public async Task<ActionResult<AssetDto>> Create(CreateAssetDto dto)

    // PUT api/assets/5 - Update
    [HttpPut("{id}")]
    public async Task<ActionResult<AssetDto>> Update(int id, UpdateAssetDto dto)

    // DELETE api/assets/5 - Delete
    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(int id)
}
```

### Entity Framework Patterns
```csharp
// Entity with proper navigation properties
public class Asset
{
    public int Id { get; set; }
    public string AssetCode { get; set; } = string.Empty;

    // Foreign key with navigation
    public int? CategoryId { get; set; }
    public Category? Category { get; set; }

    // Collection navigation
    public ICollection<AssetEvent> Events { get; set; } = new List<AssetEvent>();
}

// DbContext configuration
protected override void OnModelCreating(ModelBuilder modelBuilder)
{
    // Use NoAction for SQL Server compatibility (avoid cascade conflicts)
    modelBuilder.Entity<Asset>()
        .HasOne(a => a.Category)
        .WithMany(c => c.Assets)
        .HasForeignKey(a => a.CategoryId)
        .OnDelete(DeleteBehavior.NoAction);
}
```

### Migration Best Practices
```bash
# Always test migrations on both databases
# 1. Local SQLite
dotnet ef database update

# 2. Azure SQL Server
AZURE_SQL_CONNECTION="..." dotnet ef database update

# For SQL Server compatibility:
# - Use NoAction instead of SetNull/Cascade for multiple FK paths
# - Use explicit column types (int vs INTEGER)
# - Avoid SQLite-specific syntax
```

---

## Current TODO Tasks

### High Priority
- [ ] **Add request validation middleware**
  - Agent: Backend Architect
  - Pattern: FluentValidation with automatic model validation

- [ ] **Implement API versioning**
  - Agent: Backend Architect
  - Scope: URL-based versioning (`/api/v1/assets`)

- [ ] **Add response caching** for static data
  - Agent: Backend Architect
  - Scope: Categories, AssetTypes, Buildings

### Medium Priority
- [ ] **Create audit logging service**
  - Agent: Backend Architect + Security Auditor
  - Scope: Track all data modifications

- [ ] **Implement rate limiting**
  - Agent: Security Auditor
  - Pattern: ASP.NET Core rate limiting middleware

- [ ] **Add health check endpoints**
  - Agent: Azure Deployment Architect
  - Scope: Database, Graph API connectivity

### Low Priority
- [ ] **Add OpenAPI documentation**
  - Agent: Backend Architect
  - Tool: Swashbuckle with XML comments

- [ ] **Implement background job processing**
  - Agent: Backend Architect
  - Pattern: Hangfire or Azure Functions

### Database Tasks
- [ ] **Add indexes for frequently queried columns**
  - Agent: Database Architect
  - Scope: AssetCode, SerialNumber, Status

- [ ] **Review and optimize N+1 queries**
  - Agent: Database Architect
  - Tool: EF Core query logging

---

## Migration Checklist

Before creating a new migration:

- [ ] Entity model follows naming conventions
- [ ] Proper data types for SQL Server compatibility
- [ ] Foreign keys use `DeleteBehavior.NoAction` for multiple paths
- [ ] Nullable properties marked correctly
- [ ] Required string properties have `MaxLength` attribute
- [ ] Indexes defined for frequently queried columns
- [ ] Seed data uses explicit IDs

After creating migration:

- [ ] Test on local SQLite database
- [ ] Test on Azure SQL Server
- [ ] Review generated SQL for compatibility
- [ ] Update DTOs if entity changed
- [ ] Update frontend types if API contract changed

---

## Deployment Checklist

### Pre-Deployment
- [ ] All tests pass (`dotnet test`)
- [ ] No build warnings (`dotnet build`)
- [ ] Migrations applied to Azure SQL
- [ ] Environment variables configured in Key Vault
- [ ] CORS settings updated if needed

### Deployment Steps
```bash
# 1. Build for production
dotnet publish -c Release -o ./publish

# 2. Apply migrations to Azure
AZURE_SQL_CONNECTION="..." dotnet ef database update

# 3. Deploy via Azure DevOps
az pipelines run --name "Djoppie-Inventory.git" --branch develop

# 4. Verify deployment
curl https://app-djoppie-inventory-dev-api-*.azurewebsites.net/api/health
```

### Post-Deployment
- [ ] Verify API health endpoint
- [ ] Test authentication flow
- [ ] Check Application Insights for errors
- [ ] Verify database connectivity

---

## Skills Quick Reference

| Task | Skill to Use |
|------|--------------|
| Design new API | `backend-development:api-design-principles` |
| Create migrations | `database-migrations:sql-migrations` |
| Optimize queries | `database-cloud-optimization:database-optimizer` |
| Security review | `security-scanning:security-sast` |
| Deploy to Azure | `cloud-infrastructure:deployment-engineer` |
| Code review | `comprehensive-review:full-review` |
| Architecture review | `comprehensive-review:architect-review` |

---

## Security Guidelines

### Authentication
- All endpoints require `[Authorize]` unless explicitly public
- Admin operations use `[Authorize(Policy = "RequireAdminRole")]`
- Token validation via Microsoft.Identity.Web

### Input Validation
```csharp
// Always validate input
public class CreateAssetDto
{
    [Required]
    [MaxLength(50)]
    public string AssetCode { get; set; } = string.Empty;

    [MaxLength(100)]
    public string? SerialNumber { get; set; }
}
```

### Sensitive Data
- Never log passwords or tokens
- Use Key Vault for secrets
- Sanitize error messages in production

---

## Integration Points

### With Frontend Team
- API contracts documented via Swagger
- DTOs define the API contract
- Breaking changes require version bump

### With Azure
- Connection strings in Key Vault
- Managed Identity for service-to-service
- Application Insights for monitoring

### With Microsoft Graph
- IntuneService handles device queries
- GraphController handles user/group queries
- Scopes defined in appsettings.json

---

## Agent Communication Protocol

When handing off between agents:

```markdown
## Handoff: [Source Agent] → [Target Agent]

### Context
[Brief description of what was done]

### Files Modified
- `path/to/file.cs` - [what changed]

### Database Changes
- Migration: `[MigrationName]` - [what it does]
- Applied to: [SQLite/Azure SQL/Both]

### Next Steps
1. [Specific task for next agent]
2. [Another task]

### Notes
[Any important context or decisions made]
```

---

## Common Commands

```bash
# Build
dotnet build

# Run locally
cd DjoppieInventory.API && dotnet run

# Run tests
cd DjoppieInventory.Tests && dotnet test

# Create migration
dotnet ef migrations add [Name] \
  --project DjoppieInventory.Infrastructure \
  --startup-project DjoppieInventory.API

# Apply migration (local)
dotnet ef database update \
  --project DjoppieInventory.Infrastructure \
  --startup-project DjoppieInventory.API

# Apply migration (Azure)
AZURE_SQL_CONNECTION="..." dotnet ef database update \
  --project DjoppieInventory.Infrastructure \
  --startup-project DjoppieInventory.API
```

---

**Contact:** jo.wijnen@diepenbeek.be

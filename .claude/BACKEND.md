# Backend Development Instructions

Instructions for Claude Code agents working on the ASP.NET Core backend.

## Technology Stack

- **ASP.NET Core 8.0** with C# 12
- **Entity Framework Core** for ORM
- **SQLite** (development) / **Azure SQL** (production)
- **Microsoft.Identity.Web** for Entra ID auth
- **Microsoft.Graph SDK** for Intune integration

## Project Structure

```
src/backend/
├── DjoppieInventory.API/           # API Layer
│   ├── Controllers/                # REST endpoints
│   │   ├── Rollout/                # Rollout feature controllers
│   │   └── *.cs                    # Other controllers
│   └── Program.cs                  # App configuration
│
├── DjoppieInventory.Core/          # Domain Layer
│   ├── Entities/                   # Domain models
│   ├── DTOs/                       # Data transfer objects
│   └── Interfaces/                 # Contracts
│
├── DjoppieInventory.Infrastructure/# Data Layer
│   ├── Data/ApplicationDbContext.cs
│   ├── Repositories/
│   └── Services/IntuneService.cs
│
└── DjoppieInventory.Tests/         # Unit tests
```

## Key Commands

```bash
# Run API (from src/backend/DjoppieInventory.API)
dotnet run

# Build
dotnet build

# Run tests
cd DjoppieInventory.Tests && dotnet test

# Create migration (from src/backend)
dotnet ef migrations add <Name> \
  --project DjoppieInventory.Infrastructure \
  --startup-project DjoppieInventory.API

# Apply migrations
dotnet ef database update \
  --project DjoppieInventory.Infrastructure \
  --startup-project DjoppieInventory.API
```

## Coding Standards

### Controllers
- Keep thin - delegate to services
- Use `[ApiController]` attribute
- Return `ActionResult<T>` for typed responses
- Use `[Authorize]` or `[Authorize(Policy = "RequireAdminRole")]`

```csharp
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AssetsController : ControllerBase
{
    private readonly IAssetRepository _repository;

    [HttpGet]
    public async Task<ActionResult<IEnumerable<AssetDto>>> GetAll()
    {
        var assets = await _repository.GetAllAsync();
        return Ok(assets);
    }
}
```

### Entities
- Located in `Core/Entities/`
- Use data annotations for validation
- Include audit fields: `CreatedAt`, `UpdatedAt`

```csharp
public class Asset
{
    public int Id { get; set; }
    [Required, MaxLength(100)]
    public string Name { get; set; } = string.Empty;
    public AssetStatus Status { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
```

### DTOs
- Located in `Core/DTOs/`
- Separate Create, Update, and Response DTOs
- Never expose entities directly

### Repositories
- Interface in `Core/Interfaces/`
- Implementation in `Infrastructure/Repositories/`
- Use async methods

## Database Migrations

### SQLite vs SQL Server Compatibility
- Avoid `datetime2` (use `TEXT` or let EF handle)
- Avoid `nvarchar` explicit types
- Test migrations on both databases

### Migration Flow
1. Create migration: `dotnet ef migrations add <Name>`
2. Review generated code in `Infrastructure/Migrations/`
3. Apply locally: `dotnet ef database update`
4. Generate SQL for production: `dotnet ef migrations script`

## Authentication

### Entra ID Configuration
```csharp
// Program.cs
builder.Services.AddMicrosoftIdentityWebApiAuthentication(
    builder.Configuration, "AzureAd");
```

### Required Scopes
- `access_as_user` for API access
- `DeviceManagementManagedDevices.Read.All` for Intune

## Asset Status Enum

```csharp
public enum AssetStatus
{
    InGebruik = 0,   // In use
    Stock = 1,       // In stock
    Herstelling = 2, // Under repair
    Defect = 3,      // Defective
    UitDienst = 4,   // Decommissioned
    Nieuw = 5        // New
}
```

## Error Handling

Use Problem Details (RFC 7807):
```csharp
return Problem(
    detail: "Asset not found",
    statusCode: StatusCodes.Status404NotFound
);
```

## Logging

Use structured logging:
```csharp
_logger.LogInformation("Asset {AssetId} updated by {UserId}", id, userId);
```

## Testing

```bash
# Run all tests
dotnet test

# Run specific test
dotnet test --filter "FullyQualifiedName~AssetTests"
```

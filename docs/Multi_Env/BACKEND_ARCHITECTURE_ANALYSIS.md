# Djoppie Inventory - Backend Architecture Analysis

**Date:** January 27, 2026
**Version:** 1.0
**Author:** Backend Architecture Review

## Executive Summary

The Djoppie Inventory system is a .NET 8.0 web API built with Clean Architecture principles, designed for asset and inventory management with Microsoft Intune integration. The backend follows a three-layer architecture pattern and is production-ready for Azure deployment.

## 1. Project Structure

### 1.1 Solution Architecture

The backend follows a **Clean Architecture** pattern with clear separation of concerns:

```
DjoppieInventory/
├── DjoppieInventory.API/              # Presentation Layer
├── DjoppieInventory.Core/             # Domain Layer
├── DjoppieInventory.Infrastructure/   # Data Access Layer
└── DjoppieInventory.Tests/            # Test Projects
```

### 1.2 Layer Responsibilities

#### **DjoppieInventory.API** (Presentation Layer)
- **Purpose:** HTTP endpoint exposure, request/response handling
- **Technologies:**
  - ASP.NET Core 8.0 Web API
  - Microsoft.Identity.Web (Entra ID authentication)
  - Swashbuckle (OpenAPI/Swagger documentation)
  - QRCoder (QR code generation)
  - Application Insights integration
- **Key Components:**
  - `Program.cs` - Application startup and configuration
  - Controllers: `AssetsController`, `AssetTemplatesController`, `QRCodeController`
  - API versioning ready
  - CORS configuration for frontend integration
- **Dependencies:**
  - Microsoft.Identity.Web 3.6.3
  - Microsoft.Graph 5.91.0
  - Microsoft.ApplicationInsights.AspNetCore 2.22.0
  - Azure.Identity 1.14.3
  - AutoMapper.Extensions.Microsoft.DependencyInjection 12.0.1
  - QRCoder 1.7.0

#### **DjoppieInventory.Core** (Domain Layer)
- **Purpose:** Business entities, domain logic, and abstractions
- **Technologies:**
  - .NET 8.0 Class Library
  - Pure C# with no external dependencies
- **Key Components:**
  - **Entities:** `Asset`, `AssetTemplate`, `AssetStatus` enum
  - **Interfaces:** `IAssetRepository`, `IAssetTemplateRepository`
  - **DTOs:** Data transfer objects for API contracts
- **Design Principles:**
  - No dependency on Infrastructure or API layers
  - Framework-agnostic domain models
  - Repository pattern interfaces

#### **DjoppieInventory.Infrastructure** (Data Access Layer)
- **Purpose:** Database access, external service integration
- **Technologies:**
  - Entity Framework Core 8.0.11
  - SQL Server provider (production)
  - SQLite provider (development)
- **Key Components:**
  - `ApplicationDbContext` - EF Core DbContext with model configuration
  - Repository implementations: `AssetRepository`, `AssetTemplateRepository`
  - EF Core Migrations for schema management
  - Seed data for 5 pre-defined asset templates
- **Database Providers:**
  - Production: `Microsoft.EntityFrameworkCore.SqlServer`
  - Development: `Microsoft.EntityFrameworkCore.Sqlite`

## 2. Data Model Analysis

### 2.1 Core Entities

#### **Asset Entity**
```csharp
public class Asset
{
    // Primary Key
    public int Id { get; set; }

    // Identification (Required)
    public string AssetCode { get; set; }      // Unique index, max 50 chars
    public string AssetName { get; set; }      // Required, max 200 chars
    public string Category { get; set; }       // Required, max 100 chars

    // Assignment (Required)
    public string Owner { get; set; }          // Required, max 200 chars
    public string Building { get; set; }       // Required, max 100 chars
    public string SpaceOrFloor { get; set; }   // Required, max 100 chars
    public AssetStatus Status { get; set; }    // Enum: Active(0), Maintenance(1)

    // Technical Details (Optional)
    public string? Brand { get; set; }         // Max 100 chars
    public string? Model { get; set; }         // Max 200 chars
    public string? SerialNumber { get; set; }  // Max 100 chars

    // Lifecycle (Optional)
    public DateTime? PurchaseDate { get; set; }
    public DateTime? WarrantyExpiry { get; set; }
    public DateTime? InstallationDate { get; set; }

    // Audit Fields
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
```

**Database Constraints:**
- Unique index on `AssetCode`
- All required fields enforced at database level
- Status stored as integer (0=Active, 1=Maintenance)

#### **AssetTemplate Entity**
```csharp
public class AssetTemplate
{
    public int Id { get; set; }
    public string TemplateName { get; set; }   // Required, max 200 chars
    public string AssetName { get; set; }      // Required, max 200 chars
    public string Category { get; set; }       // Required, max 100 chars
    public string Brand { get; set; }          // Required, max 100 chars
    public string Model { get; set; }          // Required, max 200 chars
    public bool IsActive { get; set; }
}
```

**Pre-seeded Templates:**
1. Dell Latitude Laptop (Computing)
2. HP LaserJet Printer (Peripherals)
3. Cisco Network Switch (Networking)
4. Samsung Monitor 27" (Displays)
5. Logitech Wireless Mouse (Peripherals)

### 2.2 Database Schema

**Migration:** `20260115005601_InitialCreate`

**Tables:**
- `Assets` - Asset inventory records
- `AssetTemplates` - Reusable asset templates

**Indexes:**
- Unique index on `Assets.AssetCode` for fast lookup and QR code scanning
- Primary key clustered indexes on both tables

## 3. API Architecture

### 3.1 Authentication & Authorization

**Strategy:** Microsoft Entra ID (Azure AD) with JWT Bearer tokens

```csharp
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddMicrosoftIdentityWebApi(builder.Configuration.GetSection("AzureAd"));
```

**Configuration Requirements:**
- `AzureAd:TenantId` - Diepenbeek tenant ID
- `AzureAd:ClientId` - Backend API app registration
- `AzureAd:ClientSecret` - Stored in Azure Key Vault
- `AzureAd:Audience` - API identifier (api://fc0be7bf-0e71-4c39-8a02-614dfa16322c)

**Required API Permissions:**
- DeviceManagementManagedDevices.Read.All (Intune integration)
- Device.Read.All (Device information)
- Directory.Read.All (Directory data)

### 3.2 CORS Configuration

**Development:**
```csharp
policy.WithOrigins("http://localhost:5173", "https://localhost:5173")
    .AllowAnyMethod()
    .AllowAnyHeader()
    .AllowCredentials();
```

**Production:**
```csharp
var allowedOrigins = ["https://lemon-glacier-041730903.1.azurestaticapps.net"];
policy.WithOrigins(allowedOrigins)
    .AllowAnyMethod()
    .AllowAnyHeader()
    .AllowCredentials();
```

### 3.3 Database Connection Strategy

**Environment-based Provider Selection:**

**Production:** Azure SQL Database with retry logic
```csharp
options.UseSqlServer(
    connectionString,
    sqlServerOptionsAction: sqlOptions =>
    {
        sqlOptions.EnableRetryOnFailure(
            maxRetryCount: 5,
            maxRetryDelay: TimeSpan.FromSeconds(30),
            errorNumbersToAdd: null);
    });
```

**Development:** SQLite for local development
```csharp
options.UseSqlite("Data Source=djoppie.db");
```

**Connection String Management:**
- Production: Azure Key Vault reference
  ```json
  "@Microsoft.KeyVault(SecretUri=https://kv-djoppie-dev-uld7i4.vault.azure.net/secrets/SqlConnectionString/)"
  ```
- Development: Local configuration file

### 3.4 API Endpoints

#### **AssetsController**
- `GET /api/assets` - List all assets with optional status filter
- `GET /api/assets/{id}` - Get asset by ID
- `GET /api/assets/code/{assetCode}` - Get asset by code (QR scan lookup)
- `POST /api/assets` - Create new asset
- `PUT /api/assets/{id}` - Update existing asset
- `DELETE /api/assets/{id}` - Delete asset

#### **AssetTemplatesController**
- `GET /api/assettemplates` - List all active templates
- `GET /api/assettemplates/{id}` - Get template by ID

#### **QRCodeController**
- `GET /api/qrcode/generate/{assetCode}` - Generate QR code PNG image
- Returns binary image data for printing/display

### 3.5 Dependency Injection

**Registered Services:**
```csharp
// Database Context
builder.Services.AddDbContext<ApplicationDbContext>(options => ...);

// Repositories
builder.Services.AddScoped<IAssetRepository, AssetRepository>();
builder.Services.AddScoped<IAssetTemplateRepository, AssetTemplateRepository>();

// AutoMapper
builder.Services.AddAutoMapper(typeof(Program).Assembly);

// Application Insights
builder.Services.AddApplicationInsightsTelemetry();
```

**Service Lifetimes:**
- DbContext: Scoped (per request)
- Repositories: Scoped (per request)
- AutoMapper: Singleton

## 4. Configuration Management

### 4.1 Configuration Hierarchy

**appsettings.json** (Base configuration)
```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "AllowedHosts": "*"
}
```

**appsettings.Production.json** (Production overrides)
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "@Microsoft.KeyVault(SecretUri=...)"
  },
  "AzureAd": {
    "Instance": "https://login.microsoftonline.com/",
    "TenantId": "@Microsoft.KeyVault(SecretUri=...)",
    "ClientId": "@Microsoft.KeyVault(SecretUri=...)",
    "ClientSecret": "@Microsoft.KeyVault(SecretUri=...)",
    "Audience": "api://fc0be7bf-0e71-4c39-8a02-614dfa16322c"
  },
  "MicrosoftGraph": {
    "BaseUrl": "https://graph.microsoft.com/v1.0",
    "Scopes": ["https://graph.microsoft.com/.default"]
  },
  "ApplicationInsights": {
    "ConnectionString": "InstrumentationKey=..."
  },
  "Frontend": {
    "AllowedOrigins": ["https://lemon-glacier-041730903.1.azurestaticapps.net"]
  }
}
```

### 4.2 Secrets Management

**Production Strategy:** Azure Key Vault integration

**Required Secrets:**
1. `SqlConnectionString` - Azure SQL Database connection string
2. `EntraTenantId` - Microsoft Entra tenant ID
3. `EntraBackendClientId` - Backend API app registration client ID
4. `EntraBackendClientSecret` - Backend API client secret

**Access Method:** App Service configuration with Key Vault references
- Requires: Managed Identity enabled on App Service
- Permissions: Key Vault "Get" and "List" secrets

## 5. Database Migration Strategy

### 5.1 Migration Management

**EF Core Migrations:**
- Initial migration: `20260115005601_InitialCreate`
- Command: `dotnet ef migrations add {MigrationName}`
- Applied at: Infrastructure project level

### 5.2 Production Deployment

**Automatic Migration (Optional):**
```csharp
if (app.Environment.IsProduction())
{
    var autoMigrate = builder.Configuration.GetValue<bool>("Database:AutoMigrate", false);
    if (autoMigrate)
    {
        using (var scope = app.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            db.Database.Migrate();
        }
    }
}
```

**Recommended Approach for Production:**
1. Manual migration via CI/CD pipeline before app deployment
2. Use Azure DevOps pipeline task
3. Command: `dotnet ef database update --project DjoppieInventory.Infrastructure --startup-project DjoppieInventory.API`

## 6. Monitoring & Observability

### 6.1 Application Insights Integration

**Telemetry Collection:**
```csharp
builder.Services.AddApplicationInsightsTelemetry();
```

**Tracked Metrics:**
- Request/response times
- HTTP status codes
- Exception tracking
- Dependency calls (SQL, Graph API)
- Custom events and metrics

**Configuration:**
- Connection string stored in `ApplicationInsights:ConnectionString`
- Automatic instrumentation for ASP.NET Core requests
- SQL query performance tracking via EF Core

### 6.2 Logging

**Provider:** ASP.NET Core built-in logging

**Log Levels:**
- Default: Information
- Microsoft.AspNetCore: Warning
- Microsoft.EntityFrameworkCore: Warning (production)

**Recommended Enhancement:** Serilog for structured logging
- Not currently implemented
- Should be added for production-grade logging

## 7. Microsoft Graph / Intune Integration

### 7.1 Current Implementation Status

**NuGet Package Installed:** Microsoft.Graph 5.91.0

**Configuration Present:**
```json
"MicrosoftGraph": {
  "BaseUrl": "https://graph.microsoft.com/v1.0",
  "Scopes": ["https://graph.microsoft.com/.default"]
}
```

**Status:** Graph client configuration present but service implementation not yet implemented.

### 7.2 Planned Integration

**Required Service:**
```csharp
public interface IIntuneService
{
    Task<List<ManagedDevice>> GetManagedDevicesAsync();
    Task<ManagedDevice> GetDeviceBySerialNumberAsync(string serialNumber);
    Task<DeviceHardwareInfo> GetDeviceHardwareAsync(string deviceId);
}
```

**Authentication:**
- Service principal (client credentials flow)
- Client ID and secret from Entra ID app registration
- Scopes: DeviceManagementManagedDevices.Read.All

## 8. Security Analysis

### 8.1 Authentication Security

**Strengths:**
- Microsoft Entra ID enterprise-grade authentication
- JWT bearer token validation
- Support for OAuth 2.0 / OpenID Connect

**Considerations:**
- Token expiration and refresh handling (client-side)
- API key rotation for Graph API client secret

### 8.2 Data Security

**Current Implementation:**
- HTTPS enforcement in production
- CORS restrictions to known origins
- SQL injection protection via EF Core parameterized queries

**Recommendations:**
- Add rate limiting middleware (e.g., AspNetCoreRateLimit)
- Implement request validation and sanitization
- Add audit logging for sensitive operations

### 8.3 Secrets Management

**Current State:** Azure Key Vault integration configured

**Best Practices Applied:**
- No secrets in source code
- Key Vault references in appsettings.Production.json
- Managed Identity for Key Vault access

## 9. Performance Characteristics

### 9.1 Database Performance

**Optimizations:**
- Unique index on AssetCode for fast QR code lookups
- Connection retry logic for transient failures
- Scoped DbContext prevents connection leaks

**Potential Improvements:**
- Add database indexes for common query patterns (Owner, Building, Status)
- Implement caching layer (Redis) for frequently accessed data
- Consider read replicas for high-traffic scenarios

### 9.2 API Performance

**Current State:**
- Synchronous repository calls
- Direct database queries via EF Core
- AutoMapper for DTO mapping

**Scalability Considerations:**
- Stateless API design enables horizontal scaling
- App Service auto-scaling ready
- No in-memory state management

## 10. Deployment Readiness

### 10.1 Azure App Service Requirements

**Runtime:**
- .NET 8.0 runtime
- Windows or Linux App Service

**Configuration:**
- App Settings: All Key Vault references
- Managed Identity: System-assigned or user-assigned
- HTTPS Only: Enabled
- Always On: Enabled (production)

**Scaling:**
- Supports horizontal scaling (multiple instances)
- No session state or sticky sessions required

### 10.2 Database Requirements

**Azure SQL Database:**
- Minimum tier: Basic (DTU) or GP_S_Gen5_1 (vCore serverless)
- Firewall rules: Allow Azure services
- Connection encryption: Required

**Migration Process:**
- Run `dotnet ef database update` during deployment
- Or enable `Database:AutoMigrate=true` app setting

### 10.3 Missing Components for Production

**Critical:**
1. Serilog structured logging implementation
2. Health check endpoints (`/health`, `/health/ready`)
3. Intune service implementation
4. API versioning strategy
5. Response caching middleware

**Recommended:**
6. Rate limiting middleware
7. Request/response compression
8. API documentation (Swagger in production)
9. Distributed caching (Redis)
10. Background job processing (Hangfire)

## 11. Testing Status

**Test Project:** DjoppieInventory.Tests (exists but content not analyzed)

**Required Test Coverage:**
- Unit tests for repositories
- Integration tests for API endpoints
- Graph API service mocking
- Database migration tests

## 12. Cost Optimization Opportunities

### 12.1 Database

**Development:**
- Serverless Azure SQL (auto-pause enabled)
- GP_S_Gen5_1 (0.5 vCore)
- Cost: ~$5-10/month with auto-pause

**Production:**
- Start with S0 Standard tier (~$15/month)
- Scale based on DTU usage

### 12.2 App Service

**Development:**
- F1 Free tier (limited to 60 minutes/day)
- Or B1 Basic (~$13/month)

**Production:**
- Start with S1 Standard (~$70/month)
- Enables deployment slots and auto-scaling

## 13. Technical Debt & Recommendations

### 13.1 Immediate Actions

1. **Add Health Checks:**
   ```csharp
   builder.Services.AddHealthChecks()
       .AddDbContextCheck<ApplicationDbContext>();
   ```

2. **Implement Serilog:**
   ```csharp
   builder.Host.UseSerilog((context, configuration) =>
       configuration.ReadFrom.Configuration(context.Configuration));
   ```

3. **Complete Intune Integration:**
   - Implement `IntuneService` class
   - Register with DI container
   - Add to AssetsController for enrichment

4. **Add API Versioning:**
   ```csharp
   builder.Services.AddApiVersioning(options =>
   {
       options.DefaultApiVersion = new ApiVersion(1, 0);
       options.AssumeDefaultVersionWhenUnspecified = true;
       options.ReportApiVersions = true;
   });
   ```

### 13.2 Future Enhancements

1. **Caching Layer:** Redis for template and asset lookups
2. **Background Jobs:** Scheduled Intune sync
3. **Audit Logging:** Track all asset modifications
4. **Soft Deletes:** Implement `IsDeleted` flag instead of hard deletes
5. **Bulk Operations:** Bulk asset import/export endpoints

## 14. Conclusion

### 14.1 Architecture Strengths

- Clean Architecture with proper separation of concerns
- Azure-ready with Key Vault and Application Insights integration
- Environment-specific configuration (SQLite dev, SQL Server prod)
- Retry logic for transient failures
- CORS and authentication properly configured

### 14.2 Production Readiness Score: 7/10

**Ready:**
- Core API functionality
- Database schema and migrations
- Authentication/authorization
- Azure configuration structure

**Needs Completion:**
- Intune/Graph API service implementation
- Health checks and monitoring
- Structured logging (Serilog)
- Comprehensive test coverage

### 14.3 Deployment Recommendation

**Status:** Ready for initial deployment with manual Graph API integration to follow.

**Deployment Path:**
1. Deploy infrastructure (Bicep templates)
2. Configure Key Vault secrets
3. Deploy API to App Service
4. Run database migrations
5. Verify authentication flow
6. Implement Intune service post-deployment
7. Add health checks and monitoring

---

**Next Steps:** Proceed with Azure architecture design and Bicep template creation.

# Rollout Workflow - Technische Architectuur

**Versie**: 1.0
**Laatst Bijgewerkt**: 14 maart 2026

## Architectuur Overzicht

### Clean Architecture Lagen

```
┌─────────────────────────────────────┐
│        Presentation Layer           │
│  (React Components, Pages, Hooks)   │
└────────────┬────────────────────────┘
             │ HTTP/JSON
┌────────────▼────────────────────────┐
│          API Layer                  │
│    (RolloutsController.cs)          │
│    - DTOs in/out                    │
│    - Validation                     │
│    - Authorization                  │
└────────────┬────────────────────────┘
             │ DTOs
┌────────────▼────────────────────────┐
│         Core Layer                  │
│  (Entities, Interfaces, DTOs)       │
│    - Domain Models                  │
│    - Business Rules                 │
│    - Repository Contracts           │
└────────────┬────────────────────────┘
             │ Domain Objects
┌────────────▼────────────────────────┐
│     Infrastructure Layer            │
│  (Repositories, EF Core Context)    │
│    - Data Access                    │
│    - External Services              │
└────────────┬────────────────────────┘
             │ SQL/ADO.NET
┌────────────▼────────────────────────┐
│          Database                   │
│  (SQLite dev / Azure SQL prod)      │
└─────────────────────────────────────┘
```

---

## Frontend Architectuur

### Component Hiërarchie

```
RolloutListPage (Overzicht alle sessies)
  └── SessionCard (per sessie)

RolloutPlannerPage (Planning fase)
  ├── PlanningStatistics (Header met stats)
  ├── PlanningStatusFilter (Filter controls)
  ├── PlanningDateHeader (Datum navigatie)
  ├── RolloutDayCard[] (Per dag)
  │     ├── Day Header (Naam, datum, chips)
  │     └── Workplace List (Tabel met werkplekken)
  ├── RolloutDayDialog (Dag CRUD)
  ├── RolloutWorkplaceDialog (Werkplek CRUD)
  │     ├── UpdateWorkplaceAssetsSection
  │     ├── OldDeviceConfigSection
  │     └── MultiDeviceConfigSection
  └── BulkImportFromGraphDialog (Azure AD import)

RolloutExecutionPage (Uitvoering fase)
  ├── Workplace List (Toon alle workplaces)
  ├── Asset Item Cards (Per asset in plan)
  │     ├── Serial Search Field
  │     └── Template Selector
  └── WorkplaceCompletionDialog (Voltooien)

RolloutReportPage (Rapportage fase)
  ├── Progress Charts
  ├── Day Breakdown
  └── Asset Statistics
```

### State Management

**Server State** (TanStack Query):
- Alle rollout data (sessions, days, workplaces)
- Asset data (voor serial lookup)
- Azure AD data (voor bulk import)

**Local State** (useState):
- Dialog open/closed
- Form inputs
- Filter selections
- UI toggles (expanded/collapsed)

**No Global State**: Geen Redux/Zustand nodig (React Query caching is voldoende)

---

## Data Flow

### 1. Sessie Aanmaken

```
User Action
  ↓
CreateSessionDialog (local state)
  ↓
useCreateRolloutSession() mutation
  ↓
POST /api/rollouts
  ↓ (DTO validation)
RolloutsController.CreateSession()
  ↓
_rolloutRepository.CreateSessionAsync()
  ↓ (EF Core)
Database INSERT
  ↓ (on success)
Query invalidation: rolloutKeys.sessions()
  ↓
UI Re-render (cached list updated)
```

### 2. Werkplek Voltooien (Transactioneel)

```
User Action: "Voltooien"
  ↓
useCompleteRolloutWorkplace() mutation
  ↓
POST /api/rollouts/workplaces/{id}/complete
  ↓
RolloutsController.CompleteWorkplace()
  ↓
BEGIN TRANSACTION
  │
  ├─→ Update new assets: Nieuw → InGebruik
  ├─→ Set Owner, InstallationDate
  ├─→ Update old assets: InGebruik → UitDienst
  ├─→ Update workplace: status = Completed
  └─→ Update day: CompletedWorkplaces++
  ↓
COMMIT (or ROLLBACK on error)
  ↓
Query invalidation: workplace, day, session
  ↓
UI Re-render (all affected data refetched)
```

### 3. Azure AD Bulk Import

```
User Action: "Importeer Werkplekken"
  ↓
BulkImportFromGraphDialog
  ↓
Step 1: Fetch groups
  GET /api/rollouts/graph/service-groups
  ↓
Step 2: Fetch group members
  GET /api/rollouts/graph/groups/{id}/members
  ↓
Step 3: Create workplaces
  POST /api/rollouts/days/{dayId}/workplaces/from-graph
  ↓
RolloutsController.BulkCreateWorkplacesFromGraph()
  ↓
FOR EACH user:
  - Check duplicate (email match)
  - Generate AssetPlans JSON
  - Create RolloutWorkplace entity
  ↓
Batch INSERT (single database round-trip)
  ↓
Query invalidation: workplaces, day
  ↓
UI Re-render (workplace list updated)
```

---

## Backend Architectuur

### RolloutsController Endpoints

**Session Management**:
```csharp
GET    /api/rollouts?status={status}
POST   /api/rollouts
GET    /api/rollouts/{id}?includeDays={bool}&includeWorkplaces={bool}
PUT    /api/rollouts/{id}
DELETE /api/rollouts/{id}
```

**Day Management**:
```csharp
GET    /api/rollouts/{sessionId}/days?includeWorkplaces={bool}
POST   /api/rollouts/{sessionId}/days
GET    /api/rollouts/days/{dayId}?includeWorkplaces={bool}
PUT    /api/rollouts/days/{dayId}
PATCH  /api/rollouts/days/{dayId}/status
DELETE /api/rollouts/days/{dayId}
```

**Workplace Management**:
```csharp
GET    /api/rollouts/days/{dayId}/workplaces?status={status}
POST   /api/rollouts/days/{dayId}/workplaces
GET    /api/rollouts/workplaces/{workplaceId}
PUT    /api/rollouts/workplaces/{workplaceId}
POST   /api/rollouts/workplaces/{workplaceId}/status
POST   /api/rollouts/workplaces/{workplaceId}/start
POST   /api/rollouts/workplaces/{workplaceId}/complete
POST   /api/rollouts/workplaces/{workplaceId}/reopen?reverseAssets={bool}
DELETE /api/rollouts/workplaces/{workplaceId}
```

**Workplace Item Management**:
```csharp
POST   /api/rollouts/workplaces/{id}/items/{index}/status
POST   /api/rollouts/workplaces/{id}/items/{index}/details
```

**Bulk Operations**:
```csharp
POST   /api/rollouts/days/{dayId}/workplaces/bulk
POST   /api/rollouts/days/{dayId}/workplaces/from-graph
```

**Azure AD Integration**:
```csharp
GET    /api/rollouts/graph/departments
GET    /api/rollouts/graph/users?department={name}
GET    /api/rollouts/graph/service-groups
GET    /api/rollouts/graph/sector-groups
GET    /api/rollouts/graph/sectors/{sectorId}/services
GET    /api/rollouts/graph/groups/{groupId}/members
GET    /api/rollouts/graph/service-mapping
```

**Reporting**:
```csharp
GET    /api/rollouts/{sessionId}/progress
GET    /api/rollouts/days/{dayId}/new-assets
```

### Repository Pattern

```csharp
public interface IRolloutRepository
{
    // Session CRUD
    Task<RolloutSession> CreateSessionAsync(RolloutSession session);
    Task<RolloutSession?> GetSessionByIdAsync(int id, bool includeDays = false, bool includeWorkplaces = false);
    Task<IEnumerable<RolloutSession>> GetAllSessionsAsync(RolloutSessionStatus? status = null);
    Task<RolloutSession> UpdateSessionAsync(RolloutSession session);
    Task DeleteSessionAsync(int id);

    // Day CRUD
    Task<RolloutDay> CreateDayAsync(RolloutDay day);
    Task<RolloutDay?> GetDayByIdAsync(int id, bool includeWorkplaces = false);
    Task<IEnumerable<RolloutDay>> GetDaysBySessionIdAsync(int sessionId, bool includeWorkplaces = false);
    Task<RolloutDay> UpdateDayAsync(RolloutDay day);
    Task<bool> DeleteDayAsync(int id);

    // Workplace CRUD
    Task<RolloutWorkplace> CreateWorkplaceAsync(RolloutWorkplace workplace);
    Task<IEnumerable<RolloutWorkplace>> CreateWorkplacesAsync(IEnumerable<RolloutWorkplace> workplaces);
    Task<RolloutWorkplace?> GetWorkplaceByIdAsync(int id);
    Task<IEnumerable<RolloutWorkplace>> GetWorkplacesByDayIdAsync(int dayId);
    Task<IEnumerable<RolloutWorkplace>> GetWorkplacesByStatusAsync(int dayId, RolloutWorkplaceStatus status);
    Task<RolloutWorkplace> UpdateWorkplaceAsync(RolloutWorkplace workplace);
    Task<bool> DeleteWorkplaceAsync(int id);

    // Statistics & Reporting
    Task<SessionStats> GetSessionStatsAsync(int sessionId);
    Task UpdateDayTotalsAsync(int dayId);

    // Transactions
    Task ExecuteInTransactionAsync(Func<Task> action);

    // Helpers
    Task SaveChangesAsync();
    Task<AssetType?> GetAssetTypeByCodeAsync(string code);
}
```

### DTO Strategy

**Request DTOs** (Input):
```csharp
public class CreateRolloutSessionDto
{
    public string SessionName { get; set; }
    public string? Description { get; set; }
    public DateTime PlannedStartDate { get; set; }
    public DateTime PlannedEndDate { get; set; }
}

public class CreateRolloutWorkplaceDto
{
    public int RolloutDayId { get; set; }
    public string UserName { get; set; }
    public string? UserEmail { get; set; }
    public string? Location { get; set; }
    public int? ServiceId { get; set; }
    public List<AssetPlanDto> AssetPlans { get; set; }
    public string? Notes { get; set; }
}
```

**Response DTOs** (Output):
```csharp
public class RolloutSessionDto
{
    public int Id { get; set; }
    public string SessionName { get; set; }
    public string? Description { get; set; }
    public string Status { get; set; } // Enum as string
    public DateTime PlannedStartDate { get; set; }
    public DateTime PlannedEndDate { get; set; }
    public DateTime CreatedAt { get; set; }
    public int TotalDays { get; set; }
    public int TotalWorkplaces { get; set; }
    public int CompletedWorkplaces { get; set; }
    public decimal CompletionPercentage { get; set; }
    public List<RolloutDayDto>? Days { get; set; } // Optional include
}
```

**DTO Mapping**:
- Manual mapping in controller (no AutoMapper)
- Explicit property assignments
- Computed fields (CompletionPercentage)
- Frontend-friendly field names

---

## Database Schema

### Entity Relationships

```
RolloutSession (1) ──< (N) RolloutDay (1) ──< (N) RolloutWorkplace
                                                           │
                                                           │
                                            (JSON: AssetPlan[])
                                                           │
                                                           ├─→ Asset (ExistingAssetId)
                                                           └─→ Asset (OldAssetId)
```

### Key Tables

**RolloutSessions**:
```sql
CREATE TABLE RolloutSessions (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    SessionName NVARCHAR(200) NOT NULL,
    Description NVARCHAR(MAX),
    Status INT NOT NULL, -- RolloutSessionStatus enum
    PlannedStartDate DATETIME2 NOT NULL,
    PlannedEndDate DATETIME2 NOT NULL,
    StartedAt DATETIME2,
    CompletedAt DATETIME2,
    CreatedBy NVARCHAR(200) NOT NULL,
    CreatedByEmail NVARCHAR(200) NOT NULL,
    CreatedAt DATETIME2 NOT NULL,
    UpdatedAt DATETIME2 NOT NULL,

    INDEX IX_RolloutSessions_Status (Status),
    INDEX IX_RolloutSessions_CreatedAt (CreatedAt)
);
```

**RolloutDays**:
```sql
CREATE TABLE RolloutDays (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    RolloutSessionId INT NOT NULL,
    Date DATETIME2 NOT NULL,
    Name NVARCHAR(200) NOT NULL,
    DayNumber INT NOT NULL,
    ScheduledServiceIds NVARCHAR(MAX), -- CSV: "1,2,3"
    Status INT NOT NULL, -- RolloutDayStatus enum
    TotalWorkplaces INT NOT NULL DEFAULT 0,
    CompletedWorkplaces INT NOT NULL DEFAULT 0,
    Notes NVARCHAR(MAX),
    CreatedAt DATETIME2 NOT NULL,
    UpdatedAt DATETIME2 NOT NULL,

    FOREIGN KEY (RolloutSessionId) REFERENCES RolloutSessions(Id) ON DELETE CASCADE,
    INDEX IX_RolloutDays_SessionId (RolloutSessionId),
    INDEX IX_RolloutDays_Date (Date)
);
```

**RolloutWorkplaces**:
```sql
CREATE TABLE RolloutWorkplaces (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    RolloutDayId INT NOT NULL,
    UserName NVARCHAR(200) NOT NULL,
    UserEmail NVARCHAR(200),
    Location NVARCHAR(200),
    ScheduledDate DATETIME2,
    ServiceId INT,
    IsLaptopSetup BIT NOT NULL DEFAULT 0,
    AssetPlansJson NVARCHAR(MAX) NOT NULL, -- JSON array of AssetPlan
    Status INT NOT NULL, -- RolloutWorkplaceStatus enum
    TotalItems INT NOT NULL DEFAULT 0,
    CompletedItems INT NOT NULL DEFAULT 0,
    CompletedAt DATETIME2,
    CompletedBy NVARCHAR(200),
    CompletedByEmail NVARCHAR(200),
    Notes NVARCHAR(MAX),
    CreatedAt DATETIME2 NOT NULL,
    UpdatedAt DATETIME2 NOT NULL,

    FOREIGN KEY (RolloutDayId) REFERENCES RolloutDays(Id) ON DELETE CASCADE,
    FOREIGN KEY (ServiceId) REFERENCES Services(Id) ON DELETE SET NULL,
    INDEX IX_RolloutWorkplaces_DayId (RolloutDayId),
    INDEX IX_RolloutWorkplaces_Status (Status)
);
```

### AssetPlansJson Structure

Stored as JSON string in `RolloutWorkplaces.AssetPlansJson`:

```json
[
  {
    "equipmentType": "laptop",
    "createNew": false,
    "requiresSerialNumber": true,
    "requiresQRCode": false,
    "status": "installed",
    "brand": "Dell",
    "model": "Latitude 7420",
    "existingAssetId": 1042,
    "existingAssetCode": "LAP-DELL-2026-0042",
    "existingAssetName": "laptop_dell_latitude_7420",
    "metadata": {
      "serialNumber": "ABC123456"
    }
  },
  {
    "equipmentType": "monitor",
    "createNew": true,
    "requiresSerialNumber": false,
    "requiresQRCode": true,
    "status": "installed",
    "brand": "Dell",
    "model": "P2422H",
    "existingAssetId": 2031,
    "existingAssetCode": "MON-DELL-2026-0031",
    "metadata": {
      "position": "left",
      "hasCamera": "false",
      "serialNumber": "XYZ789012"
    }
  }
]
```

**Design Rationale**:
- JSON for flexibility (variable number of assets per workplace)
- Indexed status in parent table for filtering
- Metadata extensible for future features

---

## Security Architecture

### Authentication Flow

```
User (Browser)
  ↓ (MSAL React)
Microsoft Entra ID
  ↓ (JWT token with scope: api://{backend-client-id}/access_as_user)
Frontend App
  ↓ (Bearer token in Authorization header)
Backend API
  ↓ (Microsoft.Identity.Web validation)
RolloutsController [Authorize]
  ↓
Business Logic
```

### Authorization

**All endpoints**:
- Require authenticated user (`[Authorize]` attribute)
- Token validation via Microsoft.Identity.Web
- User identity from Claims (User.FindFirstValue)

**Admin-only operations** (future):
- `[Authorize(Policy = "RequireAdminRole")]`
- Currently not implemented (all authenticated users have full access)

### Input Validation

**DTO Validation**:
```csharp
// Enum parsing with error handling
if (!Enum.TryParse<RolloutSessionStatus>(dto.Status, true, out var status))
{
    return BadRequest(new { message = $"Invalid status value: {dto.Status}" });
}

// Range validation
if (dto.Count < 1 || dto.Count > 50)
{
    return BadRequest(new { message = "Count must be between 1 and 50" });
}
```

**SQL Injection Prevention**:
- EF Core parameterized queries (automatic)
- No raw SQL usage in rollout workflow

**XSS Prevention**:
- React automatic escaping (JSX)
- No `dangerouslySetInnerHTML` usage

---

## Performance Optimizations

### Backend

**Database Efficiency**:
```csharp
// Batch fetching to avoid N+1 queries
var assets = await _assetRepository.GetByIdsAsync(assetIds);

// Selective includes
var session = await _rolloutRepository.GetSessionByIdAsync(
    id,
    includeDays: true,
    includeWorkplaces: false // Only load what's needed
);

// Async all the way (no blocking I/O)
await _rolloutRepository.CreateWorkplacesAsync(workplaces);
```

**Transaction Management**:
```csharp
// Azure SQL retry-compatible transactions
await _rolloutRepository.ExecuteInTransactionAsync(async () => {
    // All operations in single transaction
    // Automatically retries transient failures
});
```

### Frontend

**React Query Caching**:
```typescript
// Cached with intelligent invalidation
useQuery({
  queryKey: rolloutKeys.workplaces(dayId),
  queryFn: () => rolloutApi.getRolloutWorkplaces(dayId),
  staleTime: 5000, // Cache for 5 seconds
  cacheTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
});
```

**Debouncing**:
```typescript
// Serial number search (500ms debounce)
const debouncedSearch = useMemo(
  () => debounce(searchBySerial, 500),
  []
);
```

**Lazy Loading**:
- Accordion components only render expanded content
- Dialog components mount on open (not pre-rendered)
- Workplace lists paginated client-side (if > 100 items)

---

## Error Handling Strategy

### Backend

**Transaction Rollback**:
```csharp
try
{
    await _rolloutRepository.ExecuteInTransactionAsync(async () => {
        // Asset transitions
        // Workplace updates
        // Day totals update
    });
}
catch (Exception ex)
{
    _logger.LogError(ex, "Failed to complete workplace {WorkplaceId}", workplaceId);
    return StatusCode(500, new {
        message = "Er is een fout opgetreden. Alle wijzigingen zijn teruggedraaid.",
        details = ex.Message // Only in non-production
    });
}
```

**Validation Errors**:
```csharp
// Return 400 Bad Request with Dutch error messages
return BadRequest(new {
    message = "Ongeldige invoer",
    errors = new Dictionary<string, string> {
        { "Count", "Aantal moet tussen 1 en 50 zijn" }
    }
});
```

### Frontend

**React Query Error Handling**:
```typescript
const { mutate, isError, error } = useCompleteRolloutWorkplace();

mutate({ workplaceId, data }, {
  onError: (error) => {
    enqueueSnackbar(
      error.response?.data?.message || 'Er is een fout opgetreden',
      { variant: 'error' }
    );
  },
  onSuccess: () => {
    enqueueSnackbar('Werkplek voltooid!', { variant: 'success' });
  }
});
```

**Network Error Recovery**:
- React Query automatic retries (3x with exponential backoff)
- User-friendly error messages (Dutch)
- Retry button for failed mutations

---

## Testing Strategy (Recommended)

### Backend Tests

**Unit Tests** (xUnit + Moq):
```csharp
[Fact]
public async Task CompleteWorkplace_Should_Transition_Assets()
{
    // Arrange
    var mockRepo = new Mock<IRolloutRepository>();
    var mockAssetRepo = new Mock<IAssetRepository>();
    var controller = new RolloutsController(mockRepo.Object, mockAssetRepo.Object, ...);

    // Act
    var result = await controller.CompleteWorkplace(workplaceId, dto);

    // Assert
    mockAssetRepo.Verify(r => r.UpdateAsync(It.Is<Asset>(a => a.Status == AssetStatus.InGebruik)), Times.Once);
}
```

**Integration Tests**:
```csharp
[Fact]
public async Task CreateWorkplace_Should_Insert_And_Return_Entity()
{
    // Use in-memory database
    var options = new DbContextOptionsBuilder<ApplicationDbContext>()
        .UseInMemoryDatabase(databaseName: "TestDb")
        .Options;

    using (var context = new ApplicationDbContext(options))
    {
        var repo = new RolloutRepository(context);
        var workplace = new RolloutWorkplace { ... };

        var result = await repo.CreateWorkplaceAsync(workplace);

        Assert.NotNull(result);
        Assert.True(result.Id > 0);
    }
}
```

### Frontend Tests

**Unit Tests** (Jest + React Testing Library):
```typescript
describe('useRolloutSessions', () => {
  it('should fetch sessions and cache result', async () => {
    const mockSessions = [{ id: 1, sessionName: 'Test' }];
    mockApiClient.get.mockResolvedValue({ data: mockSessions });

    const { result, waitFor } = renderHook(() => useRolloutSessions(), {
      wrapper: QueryClientProvider,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockSessions);
  });
});
```

**Integration Tests** (Playwright):
```typescript
test('Complete rollout workflow', async ({ page }) => {
  // 1. Create session
  await page.goto('/rollouts');
  await page.click('button:has-text("Nieuwe Rollout")');
  await page.fill('input[name="sessionName"]', 'E2E Test Session');
  await page.click('button:has-text("Opslaan")');

  // 2. Add day
  await page.click('text=E2E Test Session');
  await page.click('button:has-text("Nieuwe Dag")');
  // ... etc

  // 3. Add workplace
  // 4. Execute workplace
  // 5. Verify completion
});
```

---

## Deployment Architecture

### Development Environment

```
┌──────────────┐         ┌──────────────┐
│  Frontend    │ :5173   │  Backend     │ :5052
│  (Vite dev)  │────────▶│  (dotnet run)│
└──────────────┘         └──────┬───────┘
                                │
                         ┌──────▼───────┐
                         │  SQLite DB   │
                         │  (djoppie.db)│
                         └──────────────┘
```

### Production Environment (Azure)

```
┌──────────────────┐         ┌────────────────────┐
│  Static Web App  │         │   App Service      │
│  (React build)   │────────▶│   (ASP.NET Core)   │
└──────────────────┘  HTTPS  └─────────┬──────────┘
                                        │
                             ┌──────────▼────────────┐
                             │   Azure SQL Database  │
                             │  (Production data)    │
                             └───────────────────────┘
                                        │
                             ┌──────────▼────────────┐
                             │   Azure Key Vault     │
                             │  (Secrets, conn str)  │
                             └───────────────────────┘
```

**Infrastructure as Code**: ARM templates / Bicep (not yet implemented)

---

## Monitoring & Logging

### Backend Logging

**Structured Logging** (Serilog recommended):
```csharp
_logger.LogInformation(
    "Workplace {WorkplaceId} completed by {User} with {ItemCount} items",
    workplaceId,
    completedBy,
    assetPlans.Count
);

_logger.LogError(ex,
    "Failed to complete workplace {WorkplaceId}, transaction rolled back",
    workplaceId
);
```

**Application Insights** (Azure):
- Request telemetry (API calls)
- Dependency telemetry (database queries)
- Exception telemetry (errors)
- Custom events (business metrics)

### Frontend Logging

**Currently**: Console.log/error (development only)

**Recommended**: Structured logging library
```typescript
import { logger } from './utils/logger';

logger.info('Workplace completed', { workplaceId, userId });
logger.error('Failed to fetch workplaces', { error, dayId });
```

---

## Future Enhancements

### Planned Features

1. **Offline Support**:
   - Service Worker for PWA
   - IndexedDB caching
   - Sync when online

2. **Real-Time Collaboration**:
   - SignalR for live updates
   - Multiple users can execute simultaneously
   - Conflict resolution

3. **Advanced Reporting**:
   - Export to Excel/PDF
   - Custom report builder
   - Email scheduling

4. **Asset Scanning**:
   - Barcode/QR scanner integration
   - Mobile app (React Native)
   - Camera serial number OCR

5. **Workflow Automation**:
   - Email notifications (workspace ready, completed)
   - Scheduled rollouts
   - Auto-reschedule incomplete workplaces

---

## References

**Backend Technologies**:
- ASP.NET Core 8.0: https://learn.microsoft.com/en-us/aspnet/core/
- Entity Framework Core: https://learn.microsoft.com/en-us/ef/core/
- Microsoft.Identity.Web: https://learn.microsoft.com/en-us/azure/active-directory/develop/

**Frontend Technologies**:
- React 19: https://react.dev/
- TanStack Query: https://tanstack.com/query/latest
- Material-UI: https://mui.com/

**Patterns & Best Practices**:
- Clean Architecture: https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html
- Repository Pattern: https://learn.microsoft.com/en-us/aspnet/mvc/overview/older-versions/getting-started-with-ef-5-using-mvc-4/implementing-the-repository-and-unit-of-work-patterns-in-an-asp-net-mvc-application

---

**Document Versie**: 1.0
**Laatste Update**: 14 maart 2026
**Auteur**: Claude Code (Project Coordinator)
**Review Status**: Technical Review Pending

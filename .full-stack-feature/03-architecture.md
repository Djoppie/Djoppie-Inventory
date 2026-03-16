# Rollout Feature Redesign - Complete Architecture Document

## Executive Summary

This document provides a comprehensive architecture design for the Rollout Feature Redesign. The design addresses the current 70KB monolithic `RolloutsController.cs` by introducing a modular, service-oriented architecture with clear separation of concerns.

---

## Part 1: Backend Architecture

### 1.1 Controller Decomposition Strategy

The existing `RolloutsController.cs` (1667 lines) will be decomposed into focused controllers:

```
Controllers/Rollouts/
├── RolloutSessionsController.cs     # Session CRUD (~150 lines)
├── RolloutDaysController.cs         # Day management (~120 lines)
├── RolloutWorkplacesController.cs   # Workplace CRUD + execution (~300 lines)
├── RolloutGraphController.cs        # Azure AD/Graph integration (~200 lines)
├── RolloutReportsController.cs      # Statistics & reporting (~150 lines)
└── RolloutBulkOperationsController.cs # Bulk create operations (~200 lines)
```

### 1.2 API Endpoints

#### Sessions API (`/api/rollouts/sessions`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Get all sessions with optional status filter |
| GET | `/{id}` | Get session by ID with optional includes |
| POST | `/` | Create new session |
| PUT | `/{id}` | Update session |
| DELETE | `/{id}` | Delete session (cascade) |
| PATCH | `/{id}/status` | Update session status |

#### Days API (`/api/rollouts/days`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/session/{sessionId}` | Get all days for a session |
| GET | `/{id}` | Get specific day |
| POST | `/session/{sessionId}` | Create day for session |
| PUT | `/{id}` | Update day |
| DELETE | `/{id}` | Delete day (cascade) |
| PATCH | `/{id}/status` | Update day status |
| GET | `/{id}/calendar` | Get calendar view data |

#### Workplaces API (`/api/rollouts/workplaces`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/day/{dayId}` | Get workplaces for day |
| GET | `/{id}` | Get specific workplace |
| POST | `/day/{dayId}` | Create workplace |
| PUT | `/{id}` | Update workplace |
| DELETE | `/{id}` | Delete workplace |
| POST | `/{id}/start` | Start execution |
| POST | `/{id}/complete` | Complete workplace |
| POST | `/{id}/reopen` | Reopen completed |
| POST | `/{id}/move` | Reschedule to new date |
| POST | `/{id}/items/{index}/details` | Update item details |
| POST | `/{id}/items/{index}/status` | Update item status |

#### Graph API (`/api/rollouts/graph`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/departments` | Get all departments |
| GET | `/users` | Get users by department |
| GET | `/service-groups` | Get MG-* groups |
| GET | `/sector-groups` | Get MG-SECTOR-* groups |
| GET | `/sectors/{id}/services` | Get services under sector |
| GET | `/groups/{id}/members` | Get group members |
| GET | `/service-mapping` | Compare DB services with AD groups |
| POST | `/sync` | Trigger organization sync |

#### Reports API (`/api/rollouts/reports`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/session/{id}/progress` | Get session progress statistics |
| GET | `/session/{id}/asset-changes` | Get asset status change report |
| GET | `/session/{id}/asset-changes/export` | Export CSV |
| GET | `/session/{id}/summary` | Get session summary |
| GET | `/session/{id}/daily-summary` | Get daily breakdown |

#### Bulk Operations API (`/api/rollouts/bulk`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/workplaces/day/{dayId}` | Bulk create workplaces |
| POST | `/workplaces/from-graph/day/{dayId}` | Create from Azure AD |
| GET | `/assets/day/{dayId}` | Get assets for bulk print |
| POST | `/validate` | Validate bulk operation |

---

### 1.3 Service Layer Architecture

```
Core/Interfaces/
├── Sessions/
│   ├── IRolloutSessionService.cs
│   └── IRolloutSessionRepository.cs
├── Days/
│   ├── IRolloutDayService.cs
│   └── IRolloutDayRepository.cs
├── Workplaces/
│   ├── IRolloutWorkplaceService.cs
│   ├── IRolloutWorkplaceRepository.cs
│   └── IWorkplaceAssetService.cs
├── Graph/
│   ├── IOrganizationSyncService.cs      # NEW: Entra sync
│   └── IGraphUserService.cs
├── Reporting/
│   ├── IRolloutReportService.cs
│   └── IAssetMovementService.cs         # NEW: Track movements
└── Common/
    ├── IOperationResult.cs
    └── IUnitOfWork.cs
```

#### IOrganizationSyncService.cs (NEW)
```csharp
public interface IOrganizationSyncService
{
    Task<OrganizationSyncResult> SyncOrganizationAsync(CancellationToken ct = default);
    Task<OrganizationSyncStatus> GetSyncStatusAsync();
    Task<SectorSyncResult> SyncSectorAsync(string entraGroupId, CancellationToken ct = default);
    Task<OrganizationHierarchyDto> GetHierarchyAsync(bool includeUnmapped = false);
}
```

#### IAssetMovementService.cs (NEW)
```csharp
public interface IAssetMovementService
{
    Task<RolloutAssetMovement> RecordDeploymentAsync(
        int assetId, int workplaceId, int sessionId, string deployedBy, string deployedByEmail);
    Task<RolloutAssetMovement> RecordDecommissionAsync(
        int assetId, int workplaceId, int sessionId, string processedBy, string processedByEmail);
    Task<IEnumerable<RolloutAssetMovement>> GetMovementsBySessionAsync(int sessionId);
    Task<AssetMovementSummary> GetMovementSummaryAsync(int sessionId);
    Task<byte[]> ExportToCsvAsync(int sessionId, AssetMovementExportOptions? options = null);
}
```

---

### 1.4 Authorization Strategy

#### Authorization Matrix

| Operation | Admin | Rollout-Manager | Technician | Viewer |
|-----------|-------|-----------------|------------|--------|
| Create Session | Yes | Yes | No | No |
| Edit Session | Yes | Yes | No | No |
| Delete Session | Yes | Yes (own) | No | No |
| Create Day/Workplace | Yes | Yes | No | No |
| Start Execution | Yes | Yes | Yes | No |
| Complete Workplace | Yes | Yes | Yes | No |
| View Reports | Yes | Yes | Yes | Yes |
| Export Reports | Yes | Yes | Yes | No |
| Sync Organization | Yes | No | No | No |

---

## Part 2: Frontend Architecture

### 2.1 Component Hierarchy

```
src/frontend/src/features/rollout/
├── components/
│   ├── session/
│   │   ├── SessionCard.tsx
│   │   ├── SessionForm.tsx
│   │   ├── SessionStatusBadge.tsx
│   │   └── SessionProgressBar.tsx
│   │
│   ├── planning/
│   │   ├── PlanningCalendar.tsx       # Enhanced calendar view
│   │   ├── PlanningListView.tsx       # List view alternative
│   │   ├── PlanningViewToggle.tsx     # Calendar/List switch
│   │   ├── DayCard.tsx
│   │   ├── DayDialog.tsx
│   │   └── DateHeader.tsx
│   │
│   ├── workplace/
│   │   ├── WorkplaceCard.tsx
│   │   ├── WorkplaceDialog.tsx        # Full config wizard (4 steps)
│   │   ├── WorkplaceForm.tsx
│   │   ├── WorkplaceStatusChip.tsx
│   │   └── RescheduleDialog.tsx
│   │
│   ├── assets/
│   │   ├── AssetAssignmentList.tsx
│   │   ├── AssetAssignmentCard.tsx
│   │   ├── AssetPicker.tsx
│   │   ├── OldDeviceSection.tsx
│   │   ├── NewDeviceSection.tsx
│   │   └── TemplateSelector.tsx
│   │
│   ├── execution/
│   │   ├── ExecutionWorkplaceList.tsx
│   │   ├── ExecutionItemCard.tsx
│   │   ├── SerialScanner.tsx
│   │   ├── CompletionSummary.tsx
│   │   └── CompletionDialog.tsx
│   │
│   ├── reporting/
│   │   ├── ProgressDashboard.tsx
│   │   ├── DayProgressChart.tsx
│   │   ├── AssetMovementTable.tsx
│   │   ├── ExportOptionsDialog.tsx
│   │   └── SummaryCards.tsx
│   │
│   └── graph/
│       ├── BulkImportDialog.tsx
│       ├── UserSelectionList.tsx
│       ├── GroupSelector.tsx
│       └── ServiceMapper.tsx
│
├── hooks/
│   ├── useRolloutSessions.ts
│   ├── useRolloutDays.ts
│   ├── useRolloutWorkplaces.ts
│   ├── useAssetAssignments.ts         # NEW
│   ├── useRolloutExecution.ts
│   ├── useRolloutReports.ts
│   ├── useGraphImport.ts
│   └── useCalendarView.ts
│
├── api/
│   ├── sessions.api.ts
│   ├── days.api.ts
│   ├── workplaces.api.ts
│   ├── assignments.api.ts             # NEW
│   ├── reports.api.ts
│   └── graph.api.ts
│
└── types/
    ├── session.types.ts
    ├── day.types.ts
    ├── workplace.types.ts
    ├── assignment.types.ts            # NEW
    └── report.types.ts
```

### 2.2 Routing Structure

```typescript
export const rolloutRoutes = [
  { path: 'rollouts', element: <RolloutListPage /> },
  { path: 'rollouts/new', element: <RolloutPlannerPage /> },
  { path: 'rollouts/:sessionId', element: <RolloutPlannerPage /> },
  { path: 'rollouts/:sessionId/calendar', element: <RolloutCalendarPage /> },
  { path: 'rollouts/:sessionId/execute', element: <RolloutExecutionPage /> },
  { path: 'rollouts/:sessionId/reports', element: <RolloutReportPage /> },
];
```

### 2.3 Key UI Components

#### Planning View Toggle
- Toggle between **Calendar View** and **List View**
- Persisted user preference

#### Workplace Configuration Wizard (4 Steps)
1. **User Info** - Search/select user from Entra
2. **New Devices** - Select laptop from inventory, add docking/monitors/peripherals
3. **Old Devices** - Register devices being returned
4. **Review** - Summary before saving

#### Asset Movement Report Table
- Shows all asset deployments and decommissions
- Status transitions with visual indicators
- Export to CSV functionality

### 2.4 State Management Patterns

#### React Query Key Structure
```typescript
export const rolloutKeys = {
  sessions: () => ['rollout', 'sessions'],
  session: (id) => ['rollout', 'sessions', 'detail', id],
  daysBySession: (sessionId) => ['rollout', 'days', 'session', sessionId],
  workplacesByDay: (dayId) => ['rollout', 'workplaces', 'day', dayId],
  progress: (sessionId) => ['rollout', 'reports', 'progress', sessionId],
  assetMovements: (sessionId) => ['rollout', 'reports', 'movements', sessionId],
};
```

#### Optimistic Updates
- Session status changes
- Workplace completion
- Item status updates

---

## Part 3: Cross-Cutting Concerns

### 3.1 Error Handling

#### Backend
- Global exception middleware
- Structured ProblemDetails responses
- Operation result pattern for service layer

#### Frontend
- ApiError class with typed error handling
- Toast notifications for user feedback
- React Query error boundaries

### 3.2 Input Validation

#### Backend
- FluentValidation for request DTOs
- Custom validators for business rules
- Input sanitization for display

#### Frontend
- Zod schemas for form validation
- Real-time validation feedback
- Accessibility-compliant error messages

### 3.3 Security

- Role-based authorization policies
- Rate limiting for bulk operations
- Input sanitization for serial numbers
- CORS configuration per environment

---

## Part 4: Design System Integration

### Djoppie-neomorph CSS Variables

| Variable | Usage |
|----------|-------|
| `--dark-bg-base` | Page backgrounds |
| `--dark-bg-elevated` | Cards, dialogs |
| `--dark-bg-raised` | Buttons, active elements |
| `--neu-shadow-dark-md` | Card shadows |
| `--neu-shadow-dark-lg` | Modal shadows |
| `--djoppie-orange-500` | Primary accent (#FF7700) |

### Component Styling Pattern
```tsx
<Paper sx={{
  bgcolor: 'var(--dark-bg-elevated)',
  boxShadow: 'var(--neu-shadow-dark-md)',
  borderRadius: 3,
}}>
```

---

## Part 5: Migration Strategy

### Phase 1: Backend Preparation
1. Add new entity tables with migrations
2. Implement dual-write in existing endpoints
3. Create data migration scripts
4. Deploy to DEV environment

### Phase 2: Controller Refactoring
1. Extract services from monolithic controller
2. Create new controller files
3. Maintain old routes as aliases
4. Add deprecation headers

### Phase 3: Frontend Migration
1. Update API client to new endpoints
2. Migrate hooks to new key structure
3. Update components incrementally
4. Feature flag for new UI

### Phase 4: Cleanup
1. Remove dual-write logic
2. Remove deprecated endpoints
3. Remove old JSON column
4. Update documentation

---

## Part 6: Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Data migration from JSON | High | Dual-write period, rollback capability |
| Breaking API changes | High | Version API, maintain v1 during transition |
| Performance degradation | Medium | Proper indexes, batch operations, pagination |
| Entra sync failures | Medium | Retry logic, fallback to manual, sync status UI |
| Frontend state sync issues | Medium | React Query invalidation, optimistic updates |

---

## Appendix: Files to Create/Modify

### New Backend Files
- `Controllers/Rollouts/RolloutSessionsController.cs`
- `Controllers/Rollouts/RolloutDaysController.cs`
- `Controllers/Rollouts/RolloutWorkplacesController.cs`
- `Controllers/Rollouts/RolloutGraphController.cs`
- `Controllers/Rollouts/RolloutReportsController.cs`
- `Controllers/Rollouts/RolloutBulkOperationsController.cs`
- `Services/OrganizationSyncService.cs`
- `Services/AssetMovementService.cs`
- `DTOs/Rollout/WorkplaceAssetAssignmentDto.cs`
- `DTOs/Rollout/AssetMovementReportDto.cs`

### New Frontend Files
- `features/rollout/components/planning/PlanningViewToggle.tsx`
- `features/rollout/components/planning/PlanningListView.tsx`
- `features/rollout/components/workplace/WorkplaceDialog.tsx` (refactored)
- `features/rollout/components/reporting/AssetMovementTable.tsx`
- `features/rollout/components/reporting/ProgressDashboard.tsx`
- `features/rollout/hooks/useAssetAssignments.ts`
- `features/rollout/api/assignments.api.ts`

### Modified Files
- `Entities/Sector.cs` - Add Entra sync fields
- `Entities/Service.cs` - Add Entra sync fields + BuildingId
- `Entities/RolloutWorkplace.cs` - Add UserEntraId, BuildingId, AssetAssignments
- `ApplicationDbContext.cs` - Add new DbSets
- `pages/rollout/RolloutPlannerPage.tsx` - View toggle
- `pages/rollout/RolloutReportPage.tsx` - New reporting UI

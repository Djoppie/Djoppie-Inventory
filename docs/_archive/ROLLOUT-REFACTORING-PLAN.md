# Rollout Code Refactoring Plan

## Executive Summary

This document outlines a comprehensive refactoring plan for the rollout-related code in Djoppie Inventory. The goal is to improve code maintainability, reduce complexity, and follow clean code principles while maintaining full functionality.

---

## Completed Refactoring (Phase 1)

### Backend Changes

1. **Created `IRolloutWorkplaceService` interface**
   - File: `src/backend/DjoppieInventory.Core/Interfaces/IRolloutWorkplaceService.cs`
   - Defines contracts for workplace operations with result pattern

2. **Implemented `RolloutWorkplaceService`**
   - File: `src/backend/DjoppieInventory.Infrastructure/Services/RolloutWorkplaceService.cs`
   - Extracted complex business logic from controller:
     - `CompleteWorkplaceAsync()` - Asset transitions and completion
     - `ReopenWorkplaceAsync()` - Reverse asset transitions
     - `UpdateItemDetailsAsync()` - Serial lookup, asset creation
     - `StartWorkplaceAsync()` - Status transition
     - `UpdateItemStatusAsync()` - Item status changes
     - `MoveWorkplaceAsync()` - Workplace rescheduling

3. **Refactored `RolloutsController.cs`**
   - Reduced from **1,777 lines to 1,418 lines** (-20%)
   - Controller now delegates to service for complex operations
   - Uses result pattern for cleaner error handling

### Frontend Changes

4. **Extracted `PlanningCalendar` component**
   - File: `src/frontend/src/components/rollout/PlanningCalendar.tsx` (742 lines)
   - Includes service filter functionality
   - Exports `getServiceColor` utility and `RescheduledWorkplace` type

5. **Refactored `RolloutPlannerPage.tsx`**
   - Reduced from **1,967 lines to 1,369 lines** (-30%)
   - Imports extracted `PlanningCalendar` component
   - Cleaner separation of concerns

### Summary Metrics (Phase 1)

| File | Before | After | Reduction |
|------|--------|-------|-----------|
| `RolloutsController.cs` | 1,777 | 1,418 | -20% |
| `RolloutPlannerPage.tsx` | 1,967 | 1,369 | -30% |
| **New Files Created** | - | - | - |
| `IRolloutWorkplaceService.cs` | - | 113 | N/A |
| `RolloutWorkplaceService.cs` | - | 380 | N/A |
| `PlanningCalendar.tsx` | - | 742 | N/A |

---

## Completed Refactoring (Phase 2)

### Frontend Changes

1. **Created workplace-dialog folder structure**
   - Directory: `src/frontend/src/components/rollout/workplace-dialog/`
   - Organized hooks, components, and utilities into separate files

2. **Extracted custom hooks**
   - `useWorkplaceForm.ts` - Form state management (consolidates 30+ useState calls)
   - `useUserSearch.ts` - User search and device fetching logic
   - `useAssetScanner.ts` - QR scanning and asset lookup logic

3. **Extracted UI components**
   - `UserInfoSection.tsx` - User name, email, location form fields
   - `DeviceDisplaySection.tsx` - Intune devices and owner assets display
   - `ScanDialog.tsx` - QR code scanning modal dialog

4. **Extracted utilities**
   - `assetPlanBuilder.ts` - Asset plan building logic for API submission
   - `types.ts` - Shared TypeScript interfaces

5. **Refactored `RolloutWorkplaceDialog.tsx`**
   - Reduced from **1,745 lines to 807 lines** (-54%)
   - Main component now orchestrates extracted sub-components
   - Uses custom hooks for state management
   - Cleaner separation of concerns

### Summary Metrics (Phase 2)

| File | Before | After | Reduction |
|------|--------|-------|-----------|
| `RolloutWorkplaceDialog.tsx` | 1,745 | 807 | -54% |
| **New Files Created** | - | Lines | - |
| `types.ts` | - | 118 | N/A |
| `useWorkplaceForm.ts` | - | 162 | N/A |
| `useUserSearch.ts` | - | 103 | N/A |
| `useAssetScanner.ts` | - | 143 | N/A |
| `UserInfoSection.tsx` | - | 196 | N/A |
| `DeviceDisplaySection.tsx` | - | 141 | N/A |
| `ScanDialog.tsx` | - | 303 | N/A |
| `assetPlanBuilder.ts` | - | 93 | N/A |

### Combined Metrics (Phase 1 + Phase 2)

| File | Original | Current | Total Reduction |
|------|----------|---------|-----------------|
| `RolloutsController.cs` | 1,777 | 1,418 | -20% |
| `RolloutPlannerPage.tsx` | 1,967 | 1,369 | -30% |
| `RolloutWorkplaceDialog.tsx` | 1,745 | 807 | -54% |
| **Total lines reduced** | 5,489 | 3,594 | -35% |

---

## Completed Refactoring (Phase 3)

### Frontend Changes

1. **Created rollout hooks folder structure**
   - Directory: `src/frontend/src/hooks/rollout/`
   - Organized hooks by domain (sessions, days, workplaces, progress)

2. **Extracted query keys**
   - `keys.ts` - Centralized React Query cache key definitions

3. **Split hooks into domain-specific files**
   - `useRolloutSessions.ts` - Session CRUD hooks (5 hooks)
   - `useRolloutDays.ts` - Day CRUD hooks (6 hooks)
   - `useRolloutWorkplaces.ts` - Workplace CRUD and workflow hooks (14 hooks)
   - `useRolloutProgress.ts` - Progress/statistics hooks (1 hook)

4. **Created index.ts for clean re-exports**
   - Single entry point for all rollout hooks
   - Maintains backward compatibility via `useRollout.ts` re-export

5. **Refactored `useRollout.ts`**
   - Reduced from **527 lines to 47 lines** (-91%)
   - Now a simple re-export file for backward compatibility
   - New code should import directly from `./rollout`

### Summary Metrics (Phase 3)

| File | Before | After | Reduction |
|------|--------|-------|-----------|
| `useRollout.ts` | 527 | 47 | -91% |
| **New Files Created** | - | Lines | - |
| `keys.ts` | - | 18 | N/A |
| `useRolloutSessions.ts` | - | 86 | N/A |
| `useRolloutDays.ts` | - | 110 | N/A |
| `useRolloutWorkplaces.ts` | - | 265 | N/A |
| `useRolloutProgress.ts` | - | 20 | N/A |
| `index.ts` | - | 49 | N/A |

### Combined Metrics (All Phases)

| File | Original | Current | Total Reduction |
|------|----------|---------|-----------------|
| `RolloutsController.cs` | 1,777 | 1,418 | -20% |
| `RolloutPlannerPage.tsx` | 1,967 | 1,369 | -30% |
| `RolloutWorkplaceDialog.tsx` | 1,745 | 807 | -54% |
| `useRollout.ts` | 527 | 47 | -91% |
| **Total lines reduced** | 6,016 | 3,641 | **-39%** |

### Benefits of Modular Hook Structure

1. **Better code organization** - Each file has a single responsibility
2. **Improved tree-shaking** - Only import what you need
3. **Easier testing** - Individual hook files can be tested in isolation
4. **Better IntelliSense** - Smaller files load faster in IDEs
5. **Backward compatible** - Existing imports still work via re-export

---

---

## Analysis Summary

### Files Analyzed

| File | Lines | Cyclomatic Complexity | Issues |
|------|-------|----------------------|--------|
| `RolloutsController.cs` | 1,777 | HIGH (25+) | Monolithic controller, mixed concerns |
| `RolloutWorkplaceDialog.tsx` | 1,745 | HIGH | Large component, complex state |
| `RolloutPlannerPage.tsx` | 1,967 | HIGH | Embedded components, filter logic |
| `useRollout.ts` | 527 | LOW | Well-structured but large |

### Key Code Smells Identified

1. **God Class**: `RolloutsController.cs` handles 50+ endpoints
2. **Feature Envy**: Controller has business logic that should be in services
3. **Long Methods**: `CompleteWorkplace` (110 lines), `UpdateItemDetails` (165 lines)
4. **Duplicate Code**: DTO mapping patterns repeated across endpoints
5. **Mixed Concerns**: Graph API, asset management, and workplace logic mixed
6. **Large Component**: `RolloutWorkplaceDialog.tsx` has 1,745 lines
7. **Embedded Components**: `PlanningCalendar` is 350+ lines inside `RolloutPlannerPage`

---

## Refactoring Strategy

### Phase 1: Backend Service Extraction (High Priority)

#### 1.1 Create `RolloutWorkplaceService`

Extract workplace-related business logic from controller:

```
src/backend/DjoppieInventory.Core/Interfaces/IRolloutWorkplaceService.cs
src/backend/DjoppieInventory.Infrastructure/Services/RolloutWorkplaceService.cs
```

**Methods to extract:**
- `CompleteWorkplaceAsync()` - Asset transitions, status updates
- `ReopenWorkplaceAsync()` - Reverse asset transitions
- `UpdateItemDetailsAsync()` - Serial lookup, asset creation
- `StartWorkplaceAsync()` - Status transition validation

#### 1.2 Create `RolloutAssetPlanService`

Handle asset plan generation and template loading:

```
src/backend/DjoppieInventory.Core/Interfaces/IRolloutAssetPlanService.cs
src/backend/DjoppieInventory.Infrastructure/Services/RolloutAssetPlanService.cs
```

**Methods to extract:**
- `GenerateStandardAssetPlans()` - Currently private in controller
- `LoadTemplatesForConfigAsync()` - Template fetching
- `BuildAssetPlanFromTemplate()` - Plan creation from templates

#### 1.3 Create `RolloutDtoMapper`

Centralize DTO mapping logic:

```
src/backend/DjoppieInventory.API/Mappers/RolloutDtoMapper.cs
```

**Methods to extract:**
- `MapToSessionDto()`
- `MapToDayDto()`
- `MapToWorkplaceDto()`

Consider using AutoMapper profiles for consistency.

### Phase 2: Frontend Component Extraction (High Priority)

#### 2.1 Extract `PlanningCalendar` Component

Move from `RolloutPlannerPage.tsx` to separate file:

```
src/frontend/src/components/rollout/PlanningCalendar.tsx
```

**Benefits:**
- Reduces page file from ~2000 to ~1600 lines
- Reusable calendar component
- Cleaner separation of concerns

#### 2.2 Extract `ServiceFilterPanel` Component

```
src/frontend/src/components/rollout/ServiceFilterPanel.tsx
```

**Contains:**
- Service search/filter UI
- Sector grouping logic
- Filter state management

#### 2.3 Split `RolloutWorkplaceDialog` into Sub-components

```
src/frontend/src/components/rollout/workplace-dialog/
  ├── WorkplaceDialogHeader.tsx
  ├── UserSearchSection.tsx
  ├── DeviceListSection.tsx
  ├── AssetScanDialog.tsx
  └── index.tsx (main dialog)
```

### Phase 3: Custom Hooks Extraction (Medium Priority)

#### 3.1 Create `useDateNavigation` Hook

```typescript
// src/frontend/src/hooks/useDateNavigation.ts
export const useDateNavigation = (initialDays: RolloutDay[]) => {
  const [currentMonth, setCurrentMonth] = useState<Date>();
  const goToPreviousMonth = () => {...};
  const goToNextMonth = () => {...};
  return { currentMonth, goToPreviousMonth, goToNextMonth };
};
```

#### 3.2 Create `useServiceFilter` Hook

```typescript
// src/frontend/src/hooks/useServiceFilter.ts
export const useServiceFilter = () => {
  const [selectedServiceIds, setSelectedServiceIds] = useState<number[]>([]);
  const [filterExpanded, setFilterExpanded] = useState(false);
  // ... filter logic
  return { selectedServiceIds, toggleService, clearFilter, isFilterActive };
};
```

#### 3.3 Create `useAssetScanner` Hook

Extract QR scanning logic from `RolloutWorkplaceDialog`:

```typescript
// src/frontend/src/hooks/useAssetScanner.ts
export const useAssetScanner = () => {
  const [scanMode, setScanMode] = useState<AssetScanMode>(null);
  const [isScanning, setIsScanning] = useState(false);
  const handleScanSuccess = async (code: string) => {...};
  return { scanMode, isScanning, openScanner, handleScanSuccess };
};
```

### Phase 4: Constants and Utilities (Low Priority)

#### 4.1 Move `SERVICE_COLORS` to Constants

```typescript
// src/frontend/src/constants/colors.constants.ts
export const SERVICE_COLORS = [...];
export const getServiceColor = (serviceId: number) => {...};
```

#### 4.2 Create `statusUtils.ts`

```typescript
// src/frontend/src/utils/statusUtils.ts
export const getStatusTranslationKey = (status: string): string => {...};
export const parseWorkplaceStatus = (status: string): RolloutWorkplaceStatus => {...};
```

---

## Detailed Refactoring: RolloutsController.cs

### Current Structure (1,777 lines)

```
Lines 1-45:     Constructor & dependencies (7 services injected)
Lines 47-188:   Session endpoints (5 endpoints)
Lines 189-324:  Day endpoints (6 endpoints)
Lines 326-981:  Workplace endpoints (15 endpoints) ← MAIN ISSUE
Lines 983-1400: Bulk/Graph endpoints (10 endpoints)
Lines 1402-1508: Statistics endpoints (3 endpoints)
Lines 1510-1777: Helper/mapping methods (5 methods)
```

### Proposed Restructuring

**Split into 4 smaller controllers:**

1. `RolloutSessionsController.cs` (~200 lines)
   - Session CRUD operations
   - Session statistics

2. `RolloutDaysController.cs` (~200 lines)
   - Day CRUD operations
   - Day status updates

3. `RolloutWorkplacesController.cs` (~400 lines)
   - Workplace CRUD
   - Start/Complete/Reopen actions
   - Item status updates (delegates to service)

4. `RolloutBulkController.cs` (~300 lines)
   - Bulk workplace creation
   - Graph API integration
   - Import from Azure AD

**Or keep single controller but extract to services:**

```csharp
// RolloutsController.cs - Simplified
public class RolloutsController : ControllerBase
{
    private readonly IRolloutWorkplaceService _workplaceService;
    private readonly IRolloutAssetPlanService _assetPlanService;
    private readonly IRolloutDtoMapper _mapper;
    // ... other minimal dependencies

    [HttpPost("workplaces/{workplaceId}/complete")]
    public async Task<ActionResult<RolloutWorkplaceDto>> CompleteWorkplace(
        int workplaceId,
        [FromBody] CompleteWorkplaceDto dto)
    {
        var result = await _workplaceService.CompleteWorkplaceAsync(
            workplaceId,
            dto,
            User.GetUserId(),
            User.GetEmail());

        return result.Match(
            workplace => Ok(_mapper.MapToWorkplaceDto(workplace)),
            error => StatusCode(error.StatusCode, error.Message));
    }
}
```

### Before/After: CompleteWorkplace Method

**Before (110 lines):**
```csharp
[HttpPost("workplaces/{workplaceId}/complete")]
public async Task<ActionResult<RolloutWorkplaceDto>> CompleteWorkplace(...)
{
    var workplace = await _rolloutRepository.GetWorkplaceByIdAsync(workplaceId);
    if (workplace == null) return NotFound(...);

    var assetPlans = JsonSerializer.Deserialize<List<AssetPlanDto>>(...);
    var completedBy = User.FindFirstValue(ClaimTypes.Name);

    try
    {
        await _rolloutRepository.ExecuteInTransactionAsync(async () =>
        {
            foreach (var plan in assetPlans)
            {
                if (plan.ExistingAssetId.HasValue)
                {
                    var asset = await _assetRepository.GetByIdAsync(...);
                    // 20 lines of asset transition logic
                }
                if (plan.OldAssetId.HasValue)
                {
                    // 15 lines of old asset logic
                }
            }
            // 20 lines of workplace update logic
        });
        return Ok(MapToWorkplaceDto(workplace));
    }
    catch (Exception ex)
    {
        // 15 lines of error handling
    }
}
```

**After (15 lines):**
```csharp
[HttpPost("workplaces/{workplaceId}/complete")]
public async Task<ActionResult<RolloutWorkplaceDto>> CompleteWorkplace(
    int workplaceId,
    [FromBody] CompleteWorkplaceDto dto)
{
    var context = new WorkplaceCompletionContext(
        workplaceId,
        dto.Notes,
        User.FindFirstValue(ClaimTypes.Name) ?? "Unknown",
        User.FindFirstValue(ClaimTypes.Email) ?? "unknown@example.com");

    var result = await _workplaceService.CompleteAsync(context);

    return result.Match(
        workplace => Ok(_mapper.MapToDto(workplace)),
        error => Problem(error.Message, statusCode: error.StatusCode));
}
```

---

## Detailed Refactoring: RolloutWorkplaceDialog.tsx

### Current Structure (1,745 lines)

```
Lines 1-67:      Imports and interfaces
Lines 68-97:     TabPanel component (embedded)
Lines 98-259:    State declarations (30+ useState calls)
Lines 260-500:   Event handlers (user search, scan, device menu)
Lines 500-650:   buildAssetPlans function
Lines 650-850:   handleSave function
Lines 850-1745:  JSX rendering
```

### Key Issues

1. **30+ useState calls** - Complex state management
2. **Embedded TabPanel** - Should be in separate file
3. **Mixed concerns** - QR scanning, form handling, API calls
4. **Long render function** - 900+ lines of JSX

### Proposed Structure

```
src/frontend/src/components/rollout/workplace-dialog/
├── index.tsx                    # Main dialog (orchestration)
├── types.ts                     # Shared types
├── hooks/
│   ├── useWorkplaceForm.ts      # Form state management
│   ├── useUserSearch.ts         # User search logic
│   ├── useDeviceActions.ts      # Device menu actions
│   └── useAssetScanner.ts       # QR/manual scan logic
├── sections/
│   ├── UserInfoSection.tsx      # User name, email, location
│   ├── DeviceListSection.tsx    # Intune devices, owner assets
│   ├── ConfigItemsSection.tsx   # New device configuration
│   ├── OldDevicesSection.tsx    # Old device returns
│   └── ScanDialog.tsx           # QR scanner modal
└── utils/
    └── assetPlanBuilder.ts      # buildAssetPlans logic
```

### Before/After: State Management

**Before (30+ useState):**
```typescript
const [userName, setUserName] = useState('');
const [userEmail, setUserEmail] = useState('');
const [location, setLocation] = useState('');
const [serviceId, setServiceId] = useState<number | undefined>();
const [scheduledDate, setScheduledDate] = useState<string | undefined>();
const [workplaceStatus, setWorkplaceStatus] = useState<RolloutWorkplaceStatus>('Pending');
const [oldDevices, setOldDevices] = useState<OldDeviceConfig[]>([]);
const [configItems, setConfigItems] = useState<AssetConfigItem[]>([]);
// ... 20+ more useState calls
```

**After (useReducer or custom hook):**
```typescript
// hooks/useWorkplaceForm.ts
interface WorkplaceFormState {
  user: { name: string; email: string; location: string };
  service: { id?: number; scheduledDate?: string };
  status: RolloutWorkplaceStatus;
  devices: { old: OldDeviceConfig[]; config: AssetConfigItem[] };
}

export const useWorkplaceForm = (workplace?: RolloutWorkplace) => {
  const [state, dispatch] = useReducer(workplaceReducer, initialState);

  const setUserName = (name: string) =>
    dispatch({ type: 'SET_USER_NAME', payload: name });

  // ... other actions

  return { state, setUserName, setUserEmail, ... };
};

// In component:
const { state, setUserName, setUserEmail } = useWorkplaceForm(workplace);
```

---

## Detailed Refactoring: useRollout.ts

### Current Structure (527 lines)

The hook file is well-organized but could benefit from splitting:

```
Lines 1-43:     Query keys definition
Lines 45-122:   Session hooks (5 hooks)
Lines 124-232:  Day hooks (6 hooks)
Lines 234-513:  Workplace hooks (15 hooks)
Lines 515-527:  Progress hooks (1 hook)
```

### Proposed Split

```
src/frontend/src/hooks/rollout/
├── index.ts                     # Re-exports all hooks
├── keys.ts                      # Query key definitions
├── useRolloutSessions.ts        # Session-related hooks
├── useRolloutDays.ts            # Day-related hooks
├── useRolloutWorkplaces.ts      # Workplace-related hooks
└── useRolloutProgress.ts        # Progress/statistics hooks
```

### Benefits

1. **Smaller file sizes** - Each file ~100-150 lines
2. **Better tree-shaking** - Import only needed hooks
3. **Easier testing** - Test each hook file separately
4. **Clearer ownership** - Each file has single responsibility

---

## Priority Matrix

| Task | Impact | Effort | Priority |
|------|--------|--------|----------|
| Extract `RolloutWorkplaceService` | HIGH | MEDIUM | P1 |
| Extract `PlanningCalendar` component | HIGH | LOW | P1 |
| Split `RolloutWorkplaceDialog` | HIGH | HIGH | P2 |
| Create DTO mapper class | MEDIUM | LOW | P2 |
| Extract service filter hook | MEDIUM | LOW | P2 |
| Split `useRollout.ts` | LOW | LOW | P3 |
| Create status utilities | LOW | LOW | P3 |

---

## Implementation Checklist

### Phase 1 (Immediate - High Impact)

- [ ] Create `IRolloutWorkplaceService` interface
- [ ] Implement `RolloutWorkplaceService` with CompleteWorkplace logic
- [ ] Move `CompleteWorkplace` transaction logic to service
- [ ] Move `ReopenWorkplace` logic to service
- [ ] Update controller to use service
- [ ] Extract `PlanningCalendar.tsx` from `RolloutPlannerPage.tsx`
- [ ] Add unit tests for `RolloutWorkplaceService`

### Phase 2 (Short-term - Medium Impact)

- [ ] Create `RolloutDtoMapper` class
- [ ] Replace inline mapping with mapper
- [ ] Extract `ServiceFilterPanel.tsx`
- [ ] Create `useServiceFilter` hook
- [ ] Split `RolloutWorkplaceDialog` into sub-components
- [ ] Create `useWorkplaceForm` hook

### Phase 3 (Long-term - Maintenance)

- [ ] Split `useRollout.ts` into separate files
- [ ] Move constants to dedicated files
- [ ] Create status utility functions
- [ ] Add comprehensive documentation
- [ ] Performance optimization review

---

## Metrics (Expected After Refactoring)

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| `RolloutsController.cs` lines | 1,777 | ~800 | -55% |
| `RolloutWorkplaceDialog.tsx` lines | 1,745 | ~400 | -77% |
| `RolloutPlannerPage.tsx` lines | 1,967 | ~1,400 | -29% |
| Average cyclomatic complexity | 25+ | <10 | -60% |
| Test coverage (rollout module) | ~20% | >80% | +300% |

---

## Risk Assessment

### Low Risk
- Extracting constants and utilities
- Creating new hook files
- Extracting `PlanningCalendar` component

### Medium Risk
- Creating service layer (requires careful testing)
- Splitting dialog into sub-components
- Changing DTO mapping approach

### High Risk
- Modifying `CompleteWorkplace` transaction logic
- Changing state management in dialog
- Breaking API contracts (avoid)

### Mitigation Strategies

1. **Incremental refactoring** - One change at a time
2. **Comprehensive testing** - Add tests before refactoring
3. **Feature flags** - Enable gradual rollout
4. **Rollback plan** - Git branches for each phase

---

## Next Steps

1. Review and approve this plan
2. Create feature branch: `refactor/rollout-cleanup`
3. Start with Phase 1 high-priority items
4. Code review each PR before merge
5. Validate in development environment
6. Deploy to staging for testing

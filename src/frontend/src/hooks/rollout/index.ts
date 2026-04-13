/**
 * Rollout Hooks - Index
 *
 * Re-exports all rollout-related React Query hooks for convenient importing.
 *
 * Usage:
 *   import { useRolloutSessions, useCreateRolloutWorkplace } from '../hooks/rollout';
 */

// Query Keys
export { rolloutKeys } from './keys';

// Session Hooks
export {
  useRolloutSessions,
  useRolloutSession,
  useCreateRolloutSession,
  useUpdateRolloutSession,
  useDeleteRolloutSession,
  useStartRolloutSession,
  useCompleteRolloutSession,
  useCancelRolloutSession,
} from './useRolloutSessions';

// Day Hooks
export {
  useRolloutDays,
  useRolloutDay,
  useCreateRolloutDay,
  useUpdateRolloutDay,
  useUpdateRolloutDayStatus,
  useDeleteRolloutDay,
} from './useRolloutDays';

// Workplace Hooks
export {
  useRolloutWorkplaces,
  useRolloutWorkplace,
  useCreateRolloutWorkplace,
  useUpdateRolloutWorkplace,
  useStartRolloutWorkplace,
  useUpdateWorkplaceStatus,
  useUpdateItemStatus,
  useUpdateItemDetails,
  useCompleteRolloutWorkplace,
  useReopenRolloutWorkplace,
  useMoveRolloutWorkplace,
  useDeleteRolloutWorkplace,
  useBulkCreateWorkplaces,
  useNewAssetsForDay,
} from './useRolloutWorkplaces';

// Progress Hooks
export { useRolloutProgress } from './useRolloutProgress';

// Asset Report Hooks
export { useRolloutAssetReport, useExportAssetReport } from './useRolloutAssetReport';

// Reports Hooks
export {
  useSessionProgressStats,
  useDaysProgress,
  useDayProgressStats,
  useSessionMovements,
  useDayMovements,
  useExportSessionMovements,
  useExportSessionReport,
  formatReportDate,
  formatReportDateTime,
  getMovementTypeLabel,
  getEquipmentTypeLabel,
  getMovementStatusColor,
} from './useRolloutReports';

// Asset Assignments Hooks
export {
  useWorkplaceAssignments,
  useCreateAssignment,
  useUpdateAssignment,
  useDeleteAssignment,
  useAssignmentStats,
} from './useAssetAssignments';

// Filter Hooks
export {
  useRolloutPlannerFilters,
  useRolloutExecutionFilters,
  PLANNING_SEARCH_DEBOUNCE_MS,
  PLANNING_VIEW_MODE_STORAGE_KEY,
} from './useRolloutFilters';
export type {
  PlanningViewMode,
  PlanningSortOption,
  DayStatusFilter,
  WorkplaceStatusFilter,
  RolloutPlannerFiltersState,
  RolloutPlannerFiltersActions,
  RolloutExecutionFiltersState,
  RolloutExecutionFiltersActions,
} from './useRolloutFilters';

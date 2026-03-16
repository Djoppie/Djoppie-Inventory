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

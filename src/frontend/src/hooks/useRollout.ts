/**
 * React Query hooks for Rollout workflow
 *
 * This file re-exports all rollout hooks from the modularized structure.
 * For new code, prefer importing directly from './rollout' for clarity.
 *
 * @deprecated Import from './rollout' directly for new code
 */

export {
  // Query Keys
  rolloutKeys,

  // Session Hooks
  useRolloutSessions,
  useRolloutSession,
  useCreateRolloutSession,
  useUpdateRolloutSession,
  useDeleteRolloutSession,

  // Day Hooks
  useRolloutDays,
  useRolloutDay,
  useCreateRolloutDay,
  useUpdateRolloutDay,
  useUpdateRolloutDayStatus,
  useDeleteRolloutDay,

  // Workplace Hooks
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

  // Progress Hooks
  useRolloutProgress,
} from './rollout';

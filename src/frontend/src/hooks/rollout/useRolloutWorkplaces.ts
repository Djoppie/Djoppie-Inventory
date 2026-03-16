/**
 * Workplace Hooks for Rollout Operations
 *
 * React Query hooks for managing rollout workplaces (CRUD and workflow operations).
 */

import { useQuery, useMutation, useQueryClient, type UseQueryResult, type UseMutationResult } from '@tanstack/react-query';
import type { Asset } from '../../types/asset.types';
import type {
  RolloutWorkplace,
  CreateRolloutWorkplace,
  UpdateRolloutWorkplace,
  CompleteWorkplace,
  RolloutWorkplacesQueryParams,
  BulkCreateWorkplaces,
  BulkCreateWorkplacesResult,
  UpdateItemDetails,
  MoveWorkplace,
} from '../../types/rollout';
import * as rolloutApi from '../../api/rollout.api';
import { rolloutKeys } from './keys';

/**
 * Fetch workplaces for a day
 */
export const useRolloutWorkplaces = (
  dayId: number,
  params?: RolloutWorkplacesQueryParams
): UseQueryResult<RolloutWorkplace[], Error> => {
  return useQuery({
    queryKey: [...rolloutKeys.workplaces(dayId), params],
    queryFn: () => rolloutApi.getRolloutWorkplaces(dayId, params),
    enabled: !!dayId && dayId > 0,
  });
};

/**
 * Fetch a specific workplace
 */
export const useRolloutWorkplace = (
  workplaceId: number
): UseQueryResult<RolloutWorkplace, Error> => {
  return useQuery({
    queryKey: rolloutKeys.workplace(workplaceId),
    queryFn: () => rolloutApi.getRolloutWorkplace(workplaceId),
    enabled: !!workplaceId && workplaceId > 0,
  });
};

/**
 * Create a new workplace
 */
export const useCreateRolloutWorkplace = (): UseMutationResult<
  RolloutWorkplace,
  Error,
  { dayId: number; data: CreateRolloutWorkplace }
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ dayId, data }) => rolloutApi.createRolloutWorkplace(dayId, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: rolloutKeys.workplaces(data.rolloutDayId) });
      queryClient.invalidateQueries({ queryKey: rolloutKeys.day(data.rolloutDayId) });
      // Also invalidate the days list so accordion header chips (workplace counts) update
      queryClient.invalidateQueries({ queryKey: [...rolloutKeys.all, 'days'] });
    },
  });
};

/**
 * Update a workplace
 */
export const useUpdateRolloutWorkplace = (): UseMutationResult<
  RolloutWorkplace,
  Error,
  { workplaceId: number; data: UpdateRolloutWorkplace }
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ workplaceId, data }) => rolloutApi.updateRolloutWorkplace(workplaceId, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: rolloutKeys.workplace(data.id) });
      queryClient.invalidateQueries({ queryKey: rolloutKeys.workplaces(data.rolloutDayId) });
      queryClient.invalidateQueries({ queryKey: rolloutKeys.day(data.rolloutDayId) });
      // Also invalidate the days list so planning header chips (rescheduledCount) update when scheduledDate changes
      queryClient.invalidateQueries({ queryKey: [...rolloutKeys.all, 'days'] });
    },
  });
};

/**
 * Start a workplace execution
 */
export const useStartRolloutWorkplace = (): UseMutationResult<
  RolloutWorkplace,
  Error,
  number
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (workplaceId) => rolloutApi.startRolloutWorkplace(workplaceId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: rolloutKeys.workplace(data.id) });
      queryClient.invalidateQueries({ queryKey: rolloutKeys.workplaces(data.rolloutDayId) });
    },
  });
};

/**
 * Update a workplace's status (e.g., mark as Ready)
 */
export const useUpdateWorkplaceStatus = (): UseMutationResult<
  RolloutWorkplace,
  Error,
  { workplaceId: number; dayId: number; status: string }
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ workplaceId, status }) => rolloutApi.updateWorkplaceStatus(workplaceId, status),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: rolloutKeys.workplaces(variables.dayId) });
      queryClient.invalidateQueries({ queryKey: rolloutKeys.day(variables.dayId) });
      // Also invalidate the days list so planning header chips (readyCount, rescheduledCount) update immediately
      queryClient.invalidateQueries({ queryKey: [...rolloutKeys.all, 'days'] });
    },
  });
};

/**
 * Update a single asset plan item status
 */
export const useUpdateItemStatus = (): UseMutationResult<
  RolloutWorkplace,
  Error,
  { workplaceId: number; itemIndex: number; status: string }
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ workplaceId, itemIndex, status }) =>
      rolloutApi.updateItemStatus(workplaceId, itemIndex, status),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: rolloutKeys.workplace(data.id) });
      queryClient.invalidateQueries({ queryKey: rolloutKeys.workplaces(data.rolloutDayId) });
    },
  });
};

/**
 * Update item details during execution (serial, brand/model, asset linking)
 */
export const useUpdateItemDetails = (): UseMutationResult<
  RolloutWorkplace,
  Error,
  { workplaceId: number; itemIndex: number; data: UpdateItemDetails }
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ workplaceId, itemIndex, data }) =>
      rolloutApi.updateItemDetails(workplaceId, itemIndex, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: rolloutKeys.workplace(data.id) });
      queryClient.invalidateQueries({ queryKey: rolloutKeys.workplaces(data.rolloutDayId) });
      queryClient.invalidateQueries({ queryKey: rolloutKeys.day(data.rolloutDayId) });
    },
  });
};

/**
 * Complete a workplace (transitions all asset statuses)
 */
export const useCompleteRolloutWorkplace = (): UseMutationResult<
  RolloutWorkplace,
  Error,
  { workplaceId: number; data: CompleteWorkplace }
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ workplaceId, data }) => rolloutApi.completeRolloutWorkplace(workplaceId, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: rolloutKeys.workplace(data.id) });
      queryClient.invalidateQueries({ queryKey: rolloutKeys.workplaces(data.rolloutDayId) });
      queryClient.invalidateQueries({ queryKey: rolloutKeys.day(data.rolloutDayId) });
      queryClient.invalidateQueries({ queryKey: rolloutKeys.sessions() });
      // Also invalidate the days list so total progress (completedWorkplaces) updates immediately
      queryClient.invalidateQueries({ queryKey: [...rolloutKeys.all, 'days'] });
    },
  });
};

/**
 * Reopen a completed workplace for further editing
 */
export const useReopenRolloutWorkplace = (): UseMutationResult<
  RolloutWorkplace,
  Error,
  { workplaceId: number; reverseAssets?: boolean }
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ workplaceId, reverseAssets }) =>
      rolloutApi.reopenRolloutWorkplace(workplaceId, reverseAssets),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: rolloutKeys.workplace(data.id) });
      queryClient.invalidateQueries({ queryKey: rolloutKeys.workplaces(data.rolloutDayId) });
      queryClient.invalidateQueries({ queryKey: rolloutKeys.day(data.rolloutDayId) });
      queryClient.invalidateQueries({ queryKey: rolloutKeys.sessions() });
      // Also invalidate the days list so total progress (completedWorkplaces) updates immediately
      queryClient.invalidateQueries({ queryKey: [...rolloutKeys.all, 'days'] });
    },
  });
};

/**
 * Move a workplace to a different date by updating its scheduledDate.
 * The workplace stays in its original planning but will be executed on the new date.
 */
export const useMoveRolloutWorkplace = (): UseMutationResult<
  RolloutWorkplace,
  Error,
  { workplaceId: number; sourceDayId: number; data: MoveWorkplace }
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ workplaceId, data }) =>
      rolloutApi.moveRolloutWorkplace(workplaceId, data),
    onSuccess: (updatedWorkplace, variables) => {
      // Invalidate the day queries since workplace now has a different scheduled date
      queryClient.invalidateQueries({ queryKey: rolloutKeys.workplaces(variables.sourceDayId) });
      queryClient.invalidateQueries({ queryKey: rolloutKeys.day(variables.sourceDayId) });
      // Invalidate workplace query
      queryClient.invalidateQueries({ queryKey: rolloutKeys.workplace(updatedWorkplace.id) });
      // Invalidate sessions and days list (for calendar display)
      queryClient.invalidateQueries({ queryKey: rolloutKeys.sessions() });
      queryClient.invalidateQueries({ queryKey: [...rolloutKeys.all, 'days'] });
    },
  });
};

/**
 * Delete a workplace
 */
export const useDeleteRolloutWorkplace = (): UseMutationResult<
  void,
  Error,
  { workplaceId: number; dayId: number }
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ workplaceId }) => rolloutApi.deleteRolloutWorkplace(workplaceId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: rolloutKeys.workplaces(variables.dayId) });
      queryClient.invalidateQueries({ queryKey: rolloutKeys.day(variables.dayId) });
      // Also invalidate the days list so accordion header chips (workplace counts) update
      queryClient.invalidateQueries({ queryKey: [...rolloutKeys.all, 'days'] });
    },
  });
};

/**
 * Bulk create workplaces for a day
 */
export const useBulkCreateWorkplaces = (): UseMutationResult<
  BulkCreateWorkplacesResult,
  Error,
  { dayId: number; data: BulkCreateWorkplaces }
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ dayId, data }) => rolloutApi.bulkCreateWorkplaces(dayId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: rolloutKeys.workplaces(variables.dayId) });
      queryClient.invalidateQueries({ queryKey: rolloutKeys.day(variables.dayId) });
      queryClient.invalidateQueries({ queryKey: rolloutKeys.newAssets(variables.dayId) });
      // Also invalidate the days list so accordion header chips (workplace counts) update
      queryClient.invalidateQueries({ queryKey: [...rolloutKeys.all, 'days'] });
    },
  });
};

/**
 * Fetch new assets for a day (for QR code printing)
 */
export const useNewAssetsForDay = (dayId: number): UseQueryResult<Asset[], Error> => {
  return useQuery({
    queryKey: rolloutKeys.newAssets(dayId),
    queryFn: () => rolloutApi.getNewAssetsForDay(dayId),
    enabled: !!dayId && dayId > 0,
  });
};

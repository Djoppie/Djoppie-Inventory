/**
 * Day Hooks for Rollout Operations
 *
 * React Query hooks for managing rollout days (CRUD operations).
 */

import { useQuery, useMutation, useQueryClient, type UseQueryResult, type UseMutationResult } from '@tanstack/react-query';
import type {
  RolloutDay,
  CreateRolloutDay,
  UpdateRolloutDay,
  RolloutDaysQueryParams,
} from '../../types/rollout';
import * as rolloutApi from '../../api/rollout.api';
import { rolloutKeys } from './keys';

/**
 * Fetch days for a session
 */
export const useRolloutDays = (
  sessionId: number,
  params?: RolloutDaysQueryParams
): UseQueryResult<RolloutDay[], Error> => {
  return useQuery({
    queryKey: [...rolloutKeys.days(sessionId), params],
    queryFn: () => rolloutApi.getRolloutDays(sessionId, params),
    enabled: !!sessionId && sessionId > 0,
    // Always refetch when component mounts to ensure fresh data (workplaces status)
    refetchOnMount: 'always',
    staleTime: 0,
  });
};

/**
 * Fetch a specific day
 */
export const useRolloutDay = (
  dayId: number,
  params?: RolloutDaysQueryParams
): UseQueryResult<RolloutDay, Error> => {
  return useQuery({
    queryKey: [...rolloutKeys.day(dayId), params],
    queryFn: () => rolloutApi.getRolloutDay(dayId, params),
    enabled: !!dayId && dayId > 0,
  });
};

/**
 * Create a new rollout day
 */
export const useCreateRolloutDay = (): UseMutationResult<
  RolloutDay,
  Error,
  { sessionId: number; data: CreateRolloutDay }
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sessionId, data }) => rolloutApi.createRolloutDay(sessionId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: rolloutKeys.days(variables.sessionId) });
      queryClient.invalidateQueries({ queryKey: rolloutKeys.session(variables.sessionId) });
    },
  });
};

/**
 * Update a rollout day
 */
export const useUpdateRolloutDay = (): UseMutationResult<
  RolloutDay,
  Error,
  { dayId: number; data: UpdateRolloutDay }
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ dayId, data }) => rolloutApi.updateRolloutDay(dayId, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: rolloutKeys.day(data.id) });
      queryClient.invalidateQueries({ queryKey: rolloutKeys.days(data.rolloutSessionId) });
      queryClient.invalidateQueries({ queryKey: rolloutKeys.session(data.rolloutSessionId) });
    },
  });
};

/**
 * Update a rollout day's status
 */
export const useUpdateRolloutDayStatus = (): UseMutationResult<
  RolloutDay,
  Error,
  { dayId: number; sessionId: number; status: string }
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ dayId, status }) => rolloutApi.updateRolloutDayStatus(dayId, status),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: rolloutKeys.days(variables.sessionId) });
      queryClient.invalidateQueries({ queryKey: rolloutKeys.session(variables.sessionId) });
    },
  });
};

/**
 * Delete a rollout day
 */
export const useDeleteRolloutDay = (): UseMutationResult<
  void,
  Error,
  { dayId: number; sessionId: number }
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ dayId }) => rolloutApi.deleteRolloutDay(dayId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: rolloutKeys.days(variables.sessionId) });
      queryClient.invalidateQueries({ queryKey: rolloutKeys.session(variables.sessionId) });
    },
  });
};

/**
 * Session Hooks for Rollout Operations
 *
 * React Query hooks for managing rollout sessions (CRUD operations).
 */

import { useQuery, useMutation, useQueryClient, type UseQueryResult, type UseMutationResult } from '@tanstack/react-query';
import type {
  RolloutSession,
  CreateRolloutSession,
  UpdateRolloutSession,
  RolloutSessionsQueryParams,
  RolloutSessionQueryParams,
} from '../../types/rollout';
import * as rolloutApi from '../../api/rollout.api';
import { rolloutKeys } from './keys';

/**
 * Fetch all rollout sessions
 */
export const useRolloutSessions = (
  params?: RolloutSessionsQueryParams
): UseQueryResult<RolloutSession[], Error> => {
  return useQuery({
    queryKey: [...rolloutKeys.sessions(), params],
    queryFn: () => rolloutApi.getRolloutSessions(params),
  });
};

/**
 * Fetch a specific rollout session
 */
export const useRolloutSession = (
  id: number,
  params?: RolloutSessionQueryParams
): UseQueryResult<RolloutSession, Error> => {
  return useQuery({
    queryKey: [...rolloutKeys.session(id), params],
    queryFn: () => rolloutApi.getRolloutSession(id, params),
    enabled: !!id && id > 0,
  });
};

/**
 * Create a new rollout session
 */
export const useCreateRolloutSession = (): UseMutationResult<
  RolloutSession,
  Error,
  CreateRolloutSession
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: rolloutApi.createRolloutSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rolloutKeys.sessions() });
    },
  });
};

/**
 * Update a rollout session
 */
export const useUpdateRolloutSession = (): UseMutationResult<
  RolloutSession,
  Error,
  { id: number; data: UpdateRolloutSession }
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => rolloutApi.updateRolloutSession(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: rolloutKeys.session(variables.id) });
      queryClient.invalidateQueries({ queryKey: rolloutKeys.sessions() });
    },
  });
};

/**
 * Delete a rollout session
 */
export const useDeleteRolloutSession = (): UseMutationResult<void, Error, number> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: rolloutApi.deleteRolloutSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rolloutKeys.sessions() });
    },
  });
};

/**
 * Start a rollout session (Planning → InProgress)
 */
export const useStartRolloutSession = (): UseMutationResult<
  RolloutSession,
  Error,
  number
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: rolloutApi.startRolloutSession,
    onSuccess: (_, sessionId) => {
      queryClient.invalidateQueries({ queryKey: rolloutKeys.session(sessionId) });
      queryClient.invalidateQueries({ queryKey: rolloutKeys.sessions() });
    },
  });
};

/**
 * Complete a rollout session (InProgress → Completed)
 */
export const useCompleteRolloutSession = (): UseMutationResult<
  RolloutSession,
  Error,
  number
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: rolloutApi.completeRolloutSession,
    onSuccess: (_, sessionId) => {
      queryClient.invalidateQueries({ queryKey: rolloutKeys.session(sessionId) });
      queryClient.invalidateQueries({ queryKey: rolloutKeys.sessions() });
    },
  });
};

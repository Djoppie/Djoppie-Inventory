/**
 * React Query hooks for Rollout workflow
 * Provides data fetching, mutations, and caching for rollout operations
 */

import { useQuery, useMutation, useQueryClient, type UseQueryResult, type UseMutationResult } from '@tanstack/react-query';
import type { Asset } from '../types/asset.types';
import type {
  RolloutSession,
  CreateRolloutSession,
  UpdateRolloutSession,
  RolloutDay,
  CreateRolloutDay,
  UpdateRolloutDay,
  RolloutWorkplace,
  CreateRolloutWorkplace,
  UpdateRolloutWorkplace,
  CompleteWorkplace,
  RolloutProgress,
  RolloutSessionsQueryParams,
  RolloutSessionQueryParams,
  RolloutDaysQueryParams,
  RolloutWorkplacesQueryParams,
  BulkCreateWorkplaces,
  BulkCreateWorkplacesResult,
  UpdateItemDetails,
} from '../types/rollout';
import * as rolloutApi from '../api/rollout.api';

// ===== QUERY KEYS =====
export const rolloutKeys = {
  all: ['rollouts'] as const,
  sessions: () => [...rolloutKeys.all, 'sessions'] as const,
  session: (id: number) => [...rolloutKeys.all, 'session', id] as const,
  days: (sessionId: number) => [...rolloutKeys.all, 'days', sessionId] as const,
  day: (dayId: number) => [...rolloutKeys.all, 'day', dayId] as const,
  workplaces: (dayId: number) => [...rolloutKeys.all, 'workplaces', dayId] as const,
  workplace: (workplaceId: number) => [...rolloutKeys.all, 'workplace', workplaceId] as const,
  progress: (sessionId: number) => [...rolloutKeys.all, 'progress', sessionId] as const,
  newAssets: (dayId: number) => [...rolloutKeys.all, 'newAssets', dayId] as const,
};

// ===== SESSION HOOKS =====

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

// ===== DAY HOOKS =====

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

// ===== WORKPLACE HOOKS =====

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

// ===== PROGRESS HOOKS =====

/**
 * Fetch progress statistics for a session
 */
export const useRolloutProgress = (sessionId: number): UseQueryResult<RolloutProgress, Error> => {
  return useQuery({
    queryKey: rolloutKeys.progress(sessionId),
    queryFn: () => rolloutApi.getRolloutProgress(sessionId),
    enabled: !!sessionId && sessionId > 0,
  });
};

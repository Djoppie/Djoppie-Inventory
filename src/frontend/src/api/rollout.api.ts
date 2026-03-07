/**
 * Rollout API - API calls for rollout workflow
 * Handles sessions, days, and workplaces management
 */

import { apiClient } from './client';
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

// ===== SESSION API CALLS =====

/**
 * Get all rollout sessions with optional status filter
 */
export const getRolloutSessions = async (params?: RolloutSessionsQueryParams): Promise<RolloutSession[]> => {
  const response = await apiClient.get<RolloutSession[]>('/rollouts', { params });
  return response.data;
};

/**
 * Get a specific rollout session by ID
 */
export const getRolloutSession = async (
  id: number,
  params?: RolloutSessionQueryParams
): Promise<RolloutSession> => {
  const response = await apiClient.get<RolloutSession>(`/rollouts/${id}`, { params });
  return response.data;
};

/**
 * Create a new rollout session
 */
export const createRolloutSession = async (data: CreateRolloutSession): Promise<RolloutSession> => {
  const response = await apiClient.post<RolloutSession>('/rollouts', data);
  return response.data;
};

/**
 * Update an existing rollout session
 */
export const updateRolloutSession = async (id: number, data: UpdateRolloutSession): Promise<RolloutSession> => {
  const response = await apiClient.put<RolloutSession>(`/rollouts/${id}`, data);
  return response.data;
};

/**
 * Delete a rollout session (cascade deletes days and workplaces)
 */
export const deleteRolloutSession = async (id: number): Promise<void> => {
  await apiClient.delete(`/rollouts/${id}`);
};

// ===== DAY API CALLS =====

/**
 * Get all days for a specific session
 */
export const getRolloutDays = async (
  sessionId: number,
  params?: RolloutDaysQueryParams
): Promise<RolloutDay[]> => {
  const response = await apiClient.get<RolloutDay[]>(`/rollouts/${sessionId}/days`, { params });
  return response.data;
};

/**
 * Get a specific day by ID
 */
export const getRolloutDay = async (
  dayId: number,
  params?: RolloutDaysQueryParams
): Promise<RolloutDay> => {
  const response = await apiClient.get<RolloutDay>(`/rollouts/days/${dayId}`, { params });
  return response.data;
};

/**
 * Create a new rollout day
 */
export const createRolloutDay = async (sessionId: number, data: CreateRolloutDay): Promise<RolloutDay> => {
  const response = await apiClient.post<RolloutDay>(`/rollouts/${sessionId}/days`, data);
  return response.data;
};

/**
 * Update an existing rollout day
 */
export const updateRolloutDay = async (dayId: number, data: UpdateRolloutDay): Promise<RolloutDay> => {
  const response = await apiClient.put<RolloutDay>(`/rollouts/days/${dayId}`, data);
  return response.data;
};

/**
 * Delete a rollout day (cascade deletes workplaces)
 */
export const deleteRolloutDay = async (dayId: number): Promise<void> => {
  await apiClient.delete(`/rollouts/days/${dayId}`);
};

// ===== WORKPLACE API CALLS =====

/**
 * Get all workplaces for a specific day
 */
export const getRolloutWorkplaces = async (
  dayId: number,
  params?: RolloutWorkplacesQueryParams
): Promise<RolloutWorkplace[]> => {
  const response = await apiClient.get<RolloutWorkplace[]>(`/rollouts/days/${dayId}/workplaces`, { params });
  return response.data;
};

/**
 * Get a specific workplace by ID
 */
export const getRolloutWorkplace = async (workplaceId: number): Promise<RolloutWorkplace> => {
  const response = await apiClient.get<RolloutWorkplace>(`/rollouts/workplaces/${workplaceId}`);
  return response.data;
};

/**
 * Create a new workplace
 */
export const createRolloutWorkplace = async (
  dayId: number,
  data: CreateRolloutWorkplace
): Promise<RolloutWorkplace> => {
  const response = await apiClient.post<RolloutWorkplace>(`/rollouts/days/${dayId}/workplaces`, data);
  return response.data;
};

/**
 * Update an existing workplace
 */
export const updateRolloutWorkplace = async (
  workplaceId: number,
  data: UpdateRolloutWorkplace
): Promise<RolloutWorkplace> => {
  const response = await apiClient.put<RolloutWorkplace>(`/rollouts/workplaces/${workplaceId}`, data);
  return response.data;
};

/**
 * Start a workplace execution (sets status to InProgress)
 */
export const startRolloutWorkplace = async (workplaceId: number): Promise<RolloutWorkplace> => {
  const response = await apiClient.post<RolloutWorkplace>(`/rollouts/workplaces/${workplaceId}/start`);
  return response.data;
};

/**
 * Update a single asset plan item status (installed/skipped)
 */
export const updateItemStatus = async (
  workplaceId: number,
  itemIndex: number,
  status: string
): Promise<RolloutWorkplace> => {
  const response = await apiClient.post<RolloutWorkplace>(
    `/rollouts/workplaces/${workplaceId}/items/${itemIndex}/status`,
    { status }
  );
  return response.data;
};

/**
 * Update item details during execution (serial, brand/model, asset linking/creation)
 */
export const updateItemDetails = async (
  workplaceId: number,
  itemIndex: number,
  data: UpdateItemDetails
): Promise<RolloutWorkplace> => {
  const response = await apiClient.post<RolloutWorkplace>(
    `/rollouts/workplaces/${workplaceId}/items/${itemIndex}/details`,
    data
  );
  return response.data;
};

/**
 * Mark a workplace as completed (transitions all asset statuses)
 */
export const completeRolloutWorkplace = async (
  workplaceId: number,
  data: CompleteWorkplace
): Promise<RolloutWorkplace> => {
  const response = await apiClient.post<RolloutWorkplace>(`/rollouts/workplaces/${workplaceId}/complete`, data);
  return response.data;
};

/**
 * Delete a workplace
 */
export const deleteRolloutWorkplace = async (workplaceId: number): Promise<void> => {
  await apiClient.delete(`/rollouts/workplaces/${workplaceId}`);
};

/**
 * Bulk create workplaces for a day with standard asset plans
 */
export const bulkCreateWorkplaces = async (
  dayId: number,
  data: BulkCreateWorkplaces
): Promise<BulkCreateWorkplacesResult> => {
  const response = await apiClient.post<BulkCreateWorkplacesResult>(
    `/rollouts/days/${dayId}/workplaces/bulk`,
    data
  );
  return response.data;
};

/**
 * Get new assets for a day (for QR code printing)
 */
export const getNewAssetsForDay = async (dayId: number): Promise<Asset[]> => {
  const response = await apiClient.get<Asset[]>(`/rollouts/days/${dayId}/new-assets`);
  return response.data;
};

// ===== PROGRESS & REPORTING API CALLS =====

/**
 * Get comprehensive progress statistics for a session
 */
export const getRolloutProgress = async (sessionId: number): Promise<RolloutProgress> => {
  const response = await apiClient.get<RolloutProgress>(`/rollouts/${sessionId}/progress`);
  return response.data;
};

// ===== HELPER FUNCTIONS =====

/**
 * Check if a session is editable (Planning or Ready status)
 */
export const isSessionEditable = (session: RolloutSession): boolean => {
  return session.status === 'Planning' || session.status === 'Ready';
};

/**
 * Check if a session is active (Ready or InProgress)
 */
export const isSessionActive = (session: RolloutSession): boolean => {
  return session.status === 'Ready' || session.status === 'InProgress';
};

/**
 * Check if a workplace can be edited
 */
export const isWorkplaceEditable = (workplace: RolloutWorkplace): boolean => {
  return workplace.status === 'Pending' || workplace.status === 'InProgress';
};

/**
 * Calculate completion percentage
 */
export const calculateCompletionPercentage = (completed: number, total: number): number => {
  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
};

/**
 * Format date for display
 */
export const formatRolloutDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('nl-NL', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

/**
 * Get status color for display
 */
export const getStatusColor = (status: string): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' => {
  switch (status) {
    case 'Planning':
      return 'default';
    case 'Ready':
      return 'info';
    case 'InProgress':
      return 'primary';
    case 'Completed':
      return 'success';
    case 'Cancelled':
    case 'Failed':
      return 'error';
    case 'Pending':
      return 'default';
    case 'Skipped':
      return 'warning';
    default:
      return 'default';
  }
};

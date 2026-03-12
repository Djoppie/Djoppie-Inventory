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
  GraphUser,
  GraphGroup,
  BulkCreateFromGraph,
  BulkCreateFromGraphResult,
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
 * Update the status of a rollout day (Planning → Ready → Completed)
 */
export const updateRolloutDayStatus = async (dayId: number, status: string): Promise<RolloutDay> => {
  const response = await apiClient.patch<RolloutDay>(`/rollouts/days/${dayId}/status`, { status });
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
 * Update workplace status (e.g., mark as Ready)
 */
export const updateWorkplaceStatus = async (workplaceId: number, status: string): Promise<RolloutWorkplace> => {
  const response = await apiClient.post<RolloutWorkplace>(`/rollouts/workplaces/${workplaceId}/status`, { status });
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
 * Reopen a completed workplace for further editing
 * @param reverseAssets If true, reverses asset status changes (InGebruik → Nieuw, UitDienst → InGebruik)
 */
export const reopenRolloutWorkplace = async (
  workplaceId: number,
  reverseAssets: boolean = false
): Promise<RolloutWorkplace> => {
  const response = await apiClient.post<RolloutWorkplace>(
    `/rollouts/workplaces/${workplaceId}/reopen`,
    null,
    { params: { reverseAssets } }
  );
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

// ===== GRAPH API CALLS =====

/**
 * Get all unique departments from Azure AD
 */
export const getGraphDepartments = async (): Promise<string[]> => {
  const response = await apiClient.get<string[]>('/rollouts/graph/departments');
  return response.data;
};

/**
 * Get users from Azure AD by department
 */
export const getGraphUsersByDepartment = async (department: string): Promise<GraphUser[]> => {
  const response = await apiClient.get<GraphUser[]>('/rollouts/graph/users', {
    params: { department },
  });
  return response.data;
};

/**
 * Get all service distribution groups (MG-*) from Azure AD
 */
export const getGraphServiceGroups = async (): Promise<GraphGroup[]> => {
  const response = await apiClient.get<GraphGroup[]>('/rollouts/graph/service-groups');
  return response.data;
};

/**
 * Get all sector distribution groups (MG-SECTOR-*) from Azure AD
 */
export const getGraphSectorGroups = async (): Promise<GraphGroup[]> => {
  const response = await apiClient.get<GraphGroup[]>('/rollouts/graph/sector-groups');
  return response.data;
};

/**
 * Get service groups (MG-*) nested within a sector group
 */
export const getGraphSectorServices = async (sectorId: string): Promise<GraphGroup[]> => {
  const response = await apiClient.get<GraphGroup[]>(`/rollouts/graph/sectors/${sectorId}/services`);
  return response.data;
};

/**
 * Get members of a specific Azure AD group
 */
export const getGraphGroupMembers = async (groupId: string): Promise<GraphUser[]> => {
  const response = await apiClient.get<GraphUser[]>(`/rollouts/graph/groups/${groupId}/members`);
  return response.data;
};

/**
 * Bulk create workplaces from Azure AD users
 */
export const bulkCreateWorkplacesFromGraph = async (
  dayId: number,
  data: BulkCreateFromGraph
): Promise<BulkCreateFromGraphResult> => {
  const response = await apiClient.post<BulkCreateFromGraphResult>(
    `/rollouts/days/${dayId}/workplaces/from-graph`,
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

/**
 * Get service mapping comparison between database and Azure AD
 */
export const getServiceMapping = async (): Promise<{
  databaseServices: { id: number; code: string; name: string }[];
  azureAdGroups: { id: string; displayName: string; serviceName: string }[];
  matches: { databaseService: string; azureAdGroup: string | null; isMatched: boolean }[];
  unmatchedDatabaseServices: string[];
  unmatchedAzureAdGroups: string[];
}> => {
  const response = await apiClient.get('/rollouts/graph/service-mapping');
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

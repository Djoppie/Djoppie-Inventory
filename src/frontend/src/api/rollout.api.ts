/**
 * Rollout Workflow API Service
 *
 * Provides API methods for managing rollout sessions, items, and asset swaps.
 * All endpoints require authentication and follow the standard error handling patterns.
 */

import { apiClient } from './client';
import {
  RolloutSession,
  RolloutSessionSummary,
  CreateRolloutSessionDto,
  UpdateRolloutSessionDto,
  RolloutItem,
  CreateRolloutItemDto,
  UpdateRolloutItemDto,
  AssetSwap,
  CreateAssetSwapDto,
  ExecuteSwapDto,
  RolloutProgress,
  RolloutSessionStatus,
  RolloutItemStatus,
  MonitorPosition
} from '../types/rollout.types';

// Helper to parse session status string from API to enum value
const parseSessionStatus = (status: string | number): RolloutSessionStatus => {
  if (typeof status === 'number') return status;
  const statusMap: Record<string, RolloutSessionStatus> = {
    'Planning': RolloutSessionStatus.Planning,
    'Ready': RolloutSessionStatus.Ready,
    'InProgress': RolloutSessionStatus.InProgress,
    'Completed': RolloutSessionStatus.Completed,
    'Cancelled': RolloutSessionStatus.Cancelled
  };
  return statusMap[status] ?? RolloutSessionStatus.Planning;
};

// Helper to parse item status string from API to enum value
const parseItemStatus = (status: string | number): RolloutItemStatus => {
  if (typeof status === 'number') return status;
  const statusMap: Record<string, RolloutItemStatus> = {
    'Pending': RolloutItemStatus.Pending,
    'InProgress': RolloutItemStatus.InProgress,
    'Completed': RolloutItemStatus.Completed,
    'Failed': RolloutItemStatus.Failed,
    'Skipped': RolloutItemStatus.Skipped
  };
  return statusMap[status] ?? RolloutItemStatus.Pending;
};

// Transform API response to ensure status is enum value
const transformSession = (session: RolloutSession): RolloutSession => ({
  ...session,
  status: parseSessionStatus(session.status as unknown as string),
  items: session.items?.map(item => ({
    ...item,
    status: parseItemStatus(item.status as unknown as string)
  })) ?? []
});

const transformSessionSummary = (summary: RolloutSessionSummary): RolloutSessionSummary => ({
  ...summary,
  status: parseSessionStatus(summary.status as unknown as string)
});

const transformItem = (item: RolloutItem): RolloutItem => ({
  ...item,
  status: parseItemStatus(item.status as unknown as string)
});

const transformProgress = (progress: RolloutProgress): RolloutProgress => ({
  ...progress,
  status: parseSessionStatus(progress.status as unknown as string)
});

/**
 * Rollout API service
 * Organized into logical sections: Sessions, Items, Swaps, Progress/Reporting
 */
export const rolloutApi = {
  // ============================================================================
  // Session Management
  // ============================================================================

  /**
   * Get all rollout sessions, optionally filtered by status
   * @param status Optional filter by session status
   * @returns Array of rollout session summaries
   */
  getSessions: async (status?: RolloutSessionStatus): Promise<RolloutSessionSummary[]> => {
    const params = status !== undefined ? { status } : {};
    const response = await apiClient.get<RolloutSessionSummary[]>('/rollouts', { params });
    return response.data.map(transformSessionSummary);
  },

  /**
   * Get a specific rollout session with all items and swaps
   * @param id The session ID
   * @returns Complete rollout session details
   */
  getSession: async (id: number): Promise<RolloutSession> => {
    const response = await apiClient.get<RolloutSession>(`/rollouts/${id}`);
    return transformSession(response.data);
  },

  /**
   * Create a new rollout session
   * @param data Session creation data
   * @returns The created session
   */
  createSession: async (data: CreateRolloutSessionDto): Promise<RolloutSession> => {
    const response = await apiClient.post<RolloutSession>('/rollouts', data);
    return transformSession(response.data);
  },

  /**
   * Update an existing rollout session
   * @param id The session ID
   * @param data Session update data (partial)
   * @returns The updated session
   */
  updateSession: async (id: number, data: UpdateRolloutSessionDto): Promise<RolloutSession> => {
    const response = await apiClient.put<RolloutSession>(`/rollouts/${id}`, data);
    return transformSession(response.data);
  },

  /**
   * Delete a rollout session
   * @param id The session ID
   */
  deleteSession: async (id: number): Promise<void> => {
    await apiClient.delete(`/rollouts/${id}`);
  },

  /**
   * Update the status of a rollout session
   * @param id The session ID
   * @param status The new status
   * @returns The updated session
   */
  updateSessionStatus: async (id: number, status: RolloutSessionStatus): Promise<RolloutSession> => {
    // Convert enum to string for backend
    const statusNames = ['Planning', 'Ready', 'InProgress', 'Completed', 'Cancelled'];
    const statusString = statusNames[status] || 'Planning';
    const response = await apiClient.put<RolloutSession>(`/rollouts/${id}/status`, { status: statusString });
    return transformSession(response.data);
  },

  // ============================================================================
  // Item Management
  // ============================================================================

  /**
   * Add a single item to a rollout session
   * @param sessionId The session ID
   * @param data Item creation data
   * @returns The created item
   */
  addItem: async (sessionId: number, data: CreateRolloutItemDto): Promise<RolloutItem> => {
    const response = await apiClient.post<RolloutItem>(`/rollouts/${sessionId}/items`, data);
    return transformItem(response.data);
  },

  /**
   * Add multiple items to a rollout session in bulk
   * @param sessionId The session ID
   * @param items Array of items to create
   * @returns Array of created items
   */
  addItemsBulk: async (sessionId: number, items: CreateRolloutItemDto[]): Promise<RolloutItem[]> => {
    const response = await apiClient.post<RolloutItem[]>(`/rollouts/${sessionId}/items/bulk`, items);
    return response.data.map(transformItem);
  },

  /**
   * Update an existing rollout item
   * @param sessionId The session ID
   * @param itemId The item ID
   * @param data Item update data (partial)
   * @returns The updated item
   */
  updateItem: async (sessionId: number, itemId: number, data: UpdateRolloutItemDto): Promise<RolloutItem> => {
    // Convert status enum to string if present
    const transformedData = { ...data };
    if (data.status !== undefined) {
      const statusNames = ['Pending', 'InProgress', 'Completed', 'Failed', 'Skipped'];
      (transformedData as { status?: string }).status = statusNames[data.status] || 'Pending';
    }
    const response = await apiClient.put<RolloutItem>(`/rollouts/${sessionId}/items/${itemId}`, transformedData);
    return transformItem(response.data);
  },

  /**
   * Delete an item from a rollout session
   * @param sessionId The session ID
   * @param itemId The item ID
   */
  deleteItem: async (sessionId: number, itemId: number): Promise<void> => {
    await apiClient.delete(`/rollouts/${sessionId}/items/${itemId}`);
  },

  /**
   * Mark an item as completed
   * @param sessionId The session ID
   * @param itemId The item ID
   * @param notes Optional completion notes
   * @returns The updated item
   */
  completeItem: async (sessionId: number, itemId: number, notes?: string): Promise<RolloutItem> => {
    const response = await apiClient.put<RolloutItem>(
      `/rollouts/${sessionId}/items/${itemId}/complete`,
      { notes }
    );
    return transformItem(response.data);
  },

  /**
   * Update the monitor position for a rollout item
   * Used for multi-monitor deployments
   * @param sessionId The session ID
   * @param itemId The item ID
   * @param position Monitor position (Left, Right, Center, Primary, Secondary)
   * @param displayNumber Optional display number from Windows settings
   * @returns The updated item
   */
  updateMonitorPosition: async (
    sessionId: number,
    itemId: number,
    position: MonitorPosition,
    displayNumber?: number
  ): Promise<RolloutItem> => {
    const response = await apiClient.put<RolloutItem>(
      `/rollouts/${sessionId}/items/${itemId}/monitor-position`,
      { position, displayNumber }
    );
    return transformItem(response.data);
  },

  // ============================================================================
  // Asset Swap Operations
  // ============================================================================

  /**
   * Create a new asset swap (device replacement)
   * @param sessionId The session ID
   * @param data Swap creation data
   * @returns The created swap
   */
  createSwap: async (sessionId: number, data: CreateAssetSwapDto): Promise<AssetSwap> => {
    const response = await apiClient.post<AssetSwap>(`/rollouts/${sessionId}/swaps`, data);
    return response.data;
  },

  /**
   * Execute an asset swap (mark as completed and update asset statuses)
   * @param sessionId The session ID
   * @param swapId The swap ID
   * @param data Swap execution data (old asset status, notes)
   * @returns The updated swap
   */
  executeSwap: async (sessionId: number, swapId: number, data: ExecuteSwapDto): Promise<AssetSwap> => {
    const response = await apiClient.post<AssetSwap>(
      `/rollouts/${sessionId}/swaps/${swapId}/execute`,
      data
    );
    return response.data;
  },

  // ============================================================================
  // Progress Tracking & Reporting
  // ============================================================================

  /**
   * Get real-time progress statistics for a rollout session
   * @param sessionId The session ID
   * @returns Progress statistics and completion percentage
   */
  getProgress: async (sessionId: number): Promise<RolloutProgress> => {
    const response = await apiClient.get<RolloutProgress>(`/rollouts/${sessionId}/progress`);
    return transformProgress(response.data);
  },

  /**
   * Download QR codes for all assets in a rollout session as ZIP file
   * @param sessionId The session ID
   * @returns Blob containing the ZIP file
   */
  downloadQrCodes: async (sessionId: number): Promise<Blob> => {
    const response = await apiClient.get(`/rollouts/${sessionId}/qr-codes`, {
      responseType: 'blob'
    });
    return response.data;
  },

  /**
   * Download printable checklist for a rollout session as PDF
   * @param sessionId The session ID
   * @returns Blob containing the PDF file
   */
  downloadChecklist: async (sessionId: number): Promise<Blob> => {
    const response = await apiClient.get(`/rollouts/${sessionId}/checklist`, {
      responseType: 'blob'
    });
    return response.data;
  }
};

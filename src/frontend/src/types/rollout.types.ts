/**
 * Rollout Workflow Types
 *
 * Defines TypeScript interfaces and enums for the Rollout Workflow feature.
 * This feature enables IT managers to plan and execute asset deployments in organized sessions.
 */

/**
 * Rollout session status enum
 * Represents the lifecycle stages of a rollout session
 */
export enum RolloutSessionStatus {
  Planning = 0,
  Ready = 1,
  InProgress = 2,
  Completed = 3,
  Cancelled = 4
}

/**
 * Rollout item status enum
 * Tracks the deployment status of individual assets within a session
 */
export enum RolloutItemStatus {
  Pending = 0,
  InProgress = 1,
  Completed = 2,
  Failed = 3,
  Skipped = 4
}

/**
 * Monitor position enum
 * Used for multi-monitor deployments to track screen placement
 */
export type MonitorPosition = 'Left' | 'Right' | 'Center' | 'Primary' | 'Secondary';

/**
 * Rollout session entity
 * Represents a complete deployment session with all items and swaps
 */
export interface RolloutSession {
  id: number;
  sessionName: string;
  description?: string;
  status: RolloutSessionStatus;
  plannedDate: string;
  startedAt?: string;
  completedAt?: string;
  createdBy: string;
  createdByEmail: string;
  createdAt: string;
  updatedAt: string;
  items: RolloutItem[];
  assetSwaps: AssetSwap[];
}

/**
 * Rollout session summary
 * Lightweight session overview for list views with aggregated statistics
 */
export interface RolloutSessionSummary {
  id: number;
  sessionName: string;
  description?: string;
  status: RolloutSessionStatus;
  plannedDate: string;
  createdBy: string;
  totalItems: number;
  completedItems: number;
  pendingItems: number;
  failedItems: number;
}

/**
 * DTO for creating a new rollout session
 */
export interface CreateRolloutSessionDto {
  sessionName: string;
  description?: string;
  plannedDate: string;
}

/**
 * DTO for updating an existing rollout session
 * All fields are optional to allow partial updates
 */
export interface UpdateRolloutSessionDto {
  sessionName?: string;
  description?: string;
  plannedDate?: string;
  status?: RolloutSessionStatus;
}

/**
 * Rollout item entity
 * Represents a single asset to be deployed within a session
 */
export interface RolloutItem {
  id: number;
  rolloutSessionId: number;
  assetId: number;
  assetCode?: string;
  assetName?: string;
  assetType?: string;
  targetUser?: string;
  targetUserEmail?: string;
  targetLocation?: string;
  targetServiceId?: number;
  targetServiceName?: string;
  monitorPosition?: MonitorPosition;
  monitorDisplayNumber?: number;
  status: RolloutItemStatus;
  completedAt?: string;
  completedBy?: string;
  completedByEmail?: string;
  notes?: string;
}

/**
 * DTO for creating a new rollout item
 */
export interface CreateRolloutItemDto {
  assetId: number;
  targetUser?: string;
  targetUserEmail?: string;
  targetLocation?: string;
  targetServiceId?: number;
  monitorPosition?: MonitorPosition;
  monitorDisplayNumber?: number;
}

/**
 * DTO for updating an existing rollout item
 * All fields are optional to allow partial updates
 */
export interface UpdateRolloutItemDto {
  targetUser?: string;
  targetUserEmail?: string;
  targetLocation?: string;
  targetServiceId?: number;
  monitorPosition?: MonitorPosition;
  monitorDisplayNumber?: number;
  status?: RolloutItemStatus;
  notes?: string;
}

/**
 * Asset swap entity
 * Represents a device replacement operation (old device -> new device)
 */
export interface AssetSwap {
  id: number;
  rolloutSessionId: number;
  oldAssetId?: number;
  oldAssetCode?: string;
  oldAssetName?: string;
  newAssetId: number;
  newAssetCode?: string;
  newAssetName?: string;
  targetUser?: string;
  targetLocation?: string;
  swapDate?: string;
  swappedBy?: string;
  oldAssetNewStatus?: string;
  isCompleted: boolean;
  notes?: string;
}

/**
 * DTO for creating a new asset swap
 * oldAssetId is optional for new deployments (not replacements)
 */
export interface CreateAssetSwapDto {
  oldAssetId?: number;
  newAssetId: number;
  targetUser?: string;
  targetLocation?: string;
}

/**
 * DTO for executing an asset swap
 * Defines what happens to the old asset after replacement
 */
export interface ExecuteSwapDto {
  oldAssetNewStatus: 'Stock' | 'Herstelling' | 'Defect' | 'UitDienst';
  notes?: string;
}

/**
 * Rollout progress tracking
 * Provides real-time statistics for session completion
 */
export interface RolloutProgress {
  sessionId: number;
  sessionName: string;
  status: RolloutSessionStatus;
  totalItems: number;
  completedItems: number;
  pendingItems: number;
  inProgressItems: number;
  failedItems: number;
  skippedItems: number;
  completionPercentage: number;
  totalSwaps: number;
  completedSwaps: number;
}

/**
 * Get localized label for session status
 * @param status The rollout session status enum value
 * @returns Dutch label for the status
 */
export function getStatusLabel(status: RolloutSessionStatus): string {
  const labels: Record<RolloutSessionStatus, string> = {
    [RolloutSessionStatus.Planning]: 'Planning',
    [RolloutSessionStatus.Ready]: 'Gereed',
    [RolloutSessionStatus.InProgress]: 'Bezig',
    [RolloutSessionStatus.Completed]: 'Voltooid',
    [RolloutSessionStatus.Cancelled]: 'Geannuleerd'
  };
  return labels[status];
}

/**
 * Get Material-UI chip color for session status
 * @param status The rollout session status enum value
 * @returns MUI chip color prop value
 */
export function getStatusColor(status: RolloutSessionStatus): 'default' | 'info' | 'warning' | 'success' | 'error' {
  const colors: Record<RolloutSessionStatus, 'default' | 'info' | 'warning' | 'success' | 'error'> = {
    [RolloutSessionStatus.Planning]: 'default',
    [RolloutSessionStatus.Ready]: 'info',
    [RolloutSessionStatus.InProgress]: 'warning',
    [RolloutSessionStatus.Completed]: 'success',
    [RolloutSessionStatus.Cancelled]: 'error'
  };
  return colors[status];
}

/**
 * Get localized label for item status
 * @param status The rollout item status enum value
 * @returns Dutch label for the status
 */
export function getItemStatusLabel(status: RolloutItemStatus): string {
  const labels: Record<RolloutItemStatus, string> = {
    [RolloutItemStatus.Pending]: 'In afwachting',
    [RolloutItemStatus.InProgress]: 'Bezig',
    [RolloutItemStatus.Completed]: 'Voltooid',
    [RolloutItemStatus.Failed]: 'Mislukt',
    [RolloutItemStatus.Skipped]: 'Overgeslagen'
  };
  return labels[status];
}

/**
 * Get Material-UI chip color for item status
 * @param status The rollout item status enum value
 * @returns MUI chip color prop value
 */
export function getItemStatusColor(status: RolloutItemStatus): 'default' | 'info' | 'warning' | 'success' | 'error' {
  const colors: Record<RolloutItemStatus, 'default' | 'info' | 'warning' | 'success' | 'error'> = {
    [RolloutItemStatus.Pending]: 'default',
    [RolloutItemStatus.InProgress]: 'info',
    [RolloutItemStatus.Completed]: 'success',
    [RolloutItemStatus.Failed]: 'error',
    [RolloutItemStatus.Skipped]: 'warning'
  };
  return colors[status];
}

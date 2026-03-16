/**
 * TypeScript types for Rollout Reporting
 * Extends rollout types with detailed movement and progress tracking
 */

import type { EquipmentType, RolloutSessionStatus, RolloutWorkplaceStatus } from './rollout';

// ===== ASSET MOVEMENT TYPES =====

/**
 * Represents a single asset movement/transition in a rollout
 */
export interface AssetMovement {
  id: number;
  assetId: number;
  assetCode: string;
  assetName?: string;
  equipmentType: EquipmentType;
  serialNumber?: string;
  brand?: string;
  model?: string;
  previousStatus: string;
  newStatus: string;
  movementType: 'deployment' | 'decommission' | 'transfer';
  workplaceId: number;
  workplaceName: string;
  userName: string;
  userEmail?: string;
  location?: string;
  serviceName?: string;
  dayId: number;
  dayNumber: number;
  date: string;
  executedBy: string;
  executedByEmail?: string;
  executedAt: string;
}

/**
 * Filter options for asset movements table
 */
export interface AssetMovementFilters {
  movementType?: 'all' | 'deployment' | 'decommission';
  equipmentType?: EquipmentType | 'all';
  serviceName?: string;
  dateFrom?: string;
  dateTo?: string;
  searchQuery?: string;
}

/**
 * Sort configuration for asset movements
 */
export interface AssetMovementSort {
  field: 'assetCode' | 'equipmentType' | 'userName' | 'date' | 'executedBy' | 'serviceName';
  direction: 'asc' | 'desc';
}

// ===== SESSION PROGRESS TYPES =====

/**
 * Enhanced progress statistics for a session
 */
export interface SessionProgressStats {
  sessionId: number;
  sessionName: string;
  status: RolloutSessionStatus;
  // Overview stats
  totalDays: number;
  completedDays: number;
  totalWorkplaces: number;
  completedWorkplaces: number;
  pendingWorkplaces: number;
  inProgressWorkplaces: number;
  skippedWorkplaces: number;
  failedWorkplaces: number;
  // Asset stats
  totalAssetsDeployed: number;
  totalAssetsDecommissioned: number;
  // Timing
  plannedStartDate: string;
  plannedEndDate?: string;
  actualStartDate?: string;
  estimatedCompletionDate?: string;
  // Calculated
  completionPercentage: number;
  averageWorkplacesPerDay: number;
  daysRemaining: number;
}

/**
 * Progress data for a single day
 */
export interface DayProgressStats {
  dayId: number;
  dayNumber: number;
  date: string;
  name?: string;
  status: string;
  totalWorkplaces: number;
  completedWorkplaces: number;
  pendingWorkplaces: number;
  inProgressWorkplaces: number;
  skippedWorkplaces: number;
  failedWorkplaces: number;
  completionPercentage: number;
  assetsDeployed: number;
  assetsDecommissioned: number;
}

/**
 * Workplace progress summary
 */
export interface WorkplaceProgressSummary {
  workplaceId: number;
  userName: string;
  userEmail?: string;
  location?: string;
  serviceName?: string;
  status: RolloutWorkplaceStatus;
  totalItems: number;
  completedItems: number;
  completionPercentage: number;
  completedAt?: string;
  completedBy?: string;
}

// ===== DASHBOARD WIDGET TYPES =====

/**
 * Data for progress dashboard cards
 */
export interface ProgressCardData {
  label: string;
  value: number | string;
  icon: string;
  color: 'primary' | 'success' | 'warning' | 'error' | 'info';
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'neutral';
  };
  description?: string;
}

/**
 * Chart data point for timeline visualization
 */
export interface ProgressTimelinePoint {
  date: string;
  completed: number;
  pending: number;
  cumulative: number;
}

// ===== EXPORT TYPES =====

/**
 * Export options for reports
 */
export interface ReportExportOptions {
  format: 'csv' | 'xlsx' | 'pdf';
  includeHeaders: boolean;
  dateFormat: 'iso' | 'nl-NL' | 'en-US';
  columns?: string[];
}

/**
 * Export result with download info
 */
export interface ReportExportResult {
  blob: Blob;
  filename: string;
  contentType: string;
}

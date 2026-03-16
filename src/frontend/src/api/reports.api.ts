/**
 * Reports API - API calls for rollout reporting
 * Handles progress statistics, asset movements, and exports
 */

import { apiClient } from './client';
import type {
  AssetMovement,
  AssetMovementFilters,
  SessionProgressStats,
  DayProgressStats,
  ReportExportOptions,
} from '../types/report.types';

// ===== PROGRESS API CALLS =====

/**
 * Get comprehensive progress statistics for a session
 */
export const getSessionProgress = async (sessionId: number): Promise<SessionProgressStats> => {
  const response = await apiClient.get<SessionProgressStats>(`/rollouts/${sessionId}/progress/stats`);
  return response.data;
};

/**
 * Get progress statistics for all days in a session
 */
export const getDaysProgress = async (sessionId: number): Promise<DayProgressStats[]> => {
  const response = await apiClient.get<DayProgressStats[]>(`/rollouts/${sessionId}/progress/days`);
  return response.data;
};

/**
 * Get progress statistics for a specific day
 */
export const getDayProgress = async (dayId: number): Promise<DayProgressStats> => {
  const response = await apiClient.get<DayProgressStats>(`/rollouts/days/${dayId}/progress`);
  return response.data;
};

// ===== ASSET MOVEMENTS API CALLS =====

/**
 * Get all asset movements for a session
 */
export const getSessionMovements = async (
  sessionId: number,
  filters?: AssetMovementFilters
): Promise<AssetMovement[]> => {
  const params: Record<string, string> = {};

  if (filters?.movementType && filters.movementType !== 'all') {
    params.movementType = filters.movementType;
  }
  if (filters?.equipmentType && filters.equipmentType !== 'all') {
    params.equipmentType = filters.equipmentType;
  }
  if (filters?.serviceName) {
    params.serviceName = filters.serviceName;
  }
  if (filters?.dateFrom) {
    params.dateFrom = filters.dateFrom;
  }
  if (filters?.dateTo) {
    params.dateTo = filters.dateTo;
  }
  if (filters?.searchQuery) {
    params.search = filters.searchQuery;
  }

  const response = await apiClient.get<AssetMovement[]>(`/rollouts/${sessionId}/movements`, { params });
  return response.data;
};

/**
 * Get asset movements for a specific day
 */
export const getDayMovements = async (dayId: number): Promise<AssetMovement[]> => {
  const response = await apiClient.get<AssetMovement[]>(`/rollouts/days/${dayId}/movements`);
  return response.data;
};

// ===== EXPORT API CALLS =====

/**
 * Export session movements as CSV
 */
export const exportSessionMovements = async (
  sessionId: number,
  options?: ReportExportOptions
): Promise<Blob> => {
  const params: Record<string, string | boolean> = {
    format: options?.format || 'csv',
    includeHeaders: options?.includeHeaders !== false,
    dateFormat: options?.dateFormat || 'nl-NL',
  };

  if (options?.columns) {
    params.columns = options.columns.join(',');
  }

  const response = await apiClient.get(`/rollouts/${sessionId}/movements/export`, {
    params,
    responseType: 'blob',
  });
  return response.data;
};

/**
 * Export full session report
 */
export const exportSessionReport = async (
  sessionId: number,
  options?: ReportExportOptions
): Promise<Blob> => {
  const params: Record<string, string | boolean> = {
    format: options?.format || 'csv',
    dateFormat: options?.dateFormat || 'nl-NL',
  };

  const response = await apiClient.get(`/rollouts/${sessionId}/report/export`, {
    params,
    responseType: 'blob',
  });
  return response.data;
};

// ===== HELPER FUNCTIONS =====

/**
 * Trigger download of a blob as a file
 */
export const downloadBlob = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Generate filename for report export
 */
export const generateReportFilename = (
  sessionName: string,
  reportType: string,
  format: string = 'csv'
): string => {
  const sanitizedName = sessionName.replace(/[^a-zA-Z0-9-_]/g, '_');
  const date = new Date().toISOString().split('T')[0];
  return `rollout-${reportType}-${sanitizedName}-${date}.${format}`;
};

/**
 * Format date for display in Dutch locale
 */
export const formatReportDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('nl-NL', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

/**
 * Format datetime for display in Dutch locale
 */
export const formatReportDateTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleString('nl-NL', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Get movement type label in Dutch
 */
export const getMovementTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    deployment: 'In Gebruik',
    decommission: 'Uit Dienst',
    transfer: 'Overdracht',
  };
  return labels[type] || type;
};

/**
 * Get equipment type label in Dutch
 */
export const getEquipmentTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    laptop: 'Laptop',
    desktop: 'Desktop',
    docking: 'Docking Station',
    monitor: 'Monitor',
    keyboard: 'Toetsenbord',
    mouse: 'Muis',
  };
  return labels[type.toLowerCase()] || type;
};

/**
 * Get status color for movement type
 */
export const getMovementStatusColor = (
  type: string
): 'success' | 'error' | 'info' | 'warning' => {
  switch (type) {
    case 'deployment':
      return 'success';
    case 'decommission':
      return 'error';
    case 'transfer':
      return 'info';
    default:
      return 'warning';
  }
};

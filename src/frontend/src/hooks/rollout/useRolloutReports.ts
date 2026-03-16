/**
 * Reports Hooks for Rollout Operations
 *
 * React Query hooks for fetching rollout reports, progress statistics,
 * and asset movement data.
 */

import { useQuery, useMutation, type UseQueryResult, type UseMutationResult } from '@tanstack/react-query';
import type {
  AssetMovement,
  AssetMovementFilters,
  SessionProgressStats,
  DayProgressStats,
  ReportExportOptions,
} from '../../types/report.types';
import * as reportsApi from '../../api/reports.api';
import { rolloutKeys } from './keys';

// Extended query keys for reports
const reportKeys = {
  ...rolloutKeys,
  sessionProgressStats: (sessionId: number) => [...rolloutKeys.all, 'progressStats', sessionId] as const,
  daysProgress: (sessionId: number) => [...rolloutKeys.all, 'daysProgress', sessionId] as const,
  dayProgressStats: (dayId: number) => [...rolloutKeys.all, 'dayProgressStats', dayId] as const,
  sessionMovements: (sessionId: number, filters?: AssetMovementFilters) =>
    [...rolloutKeys.all, 'movements', sessionId, filters] as const,
  dayMovements: (dayId: number) => [...rolloutKeys.all, 'dayMovements', dayId] as const,
};

// ===== PROGRESS HOOKS =====

/**
 * Fetch comprehensive progress statistics for a session
 */
export const useSessionProgressStats = (sessionId: number): UseQueryResult<SessionProgressStats, Error> => {
  return useQuery({
    queryKey: reportKeys.sessionProgressStats(sessionId),
    queryFn: () => reportsApi.getSessionProgress(sessionId),
    enabled: !!sessionId && sessionId > 0,
    staleTime: 30000, // 30 seconds
  });
};

/**
 * Fetch progress statistics for all days in a session
 */
export const useDaysProgress = (sessionId: number): UseQueryResult<DayProgressStats[], Error> => {
  return useQuery({
    queryKey: reportKeys.daysProgress(sessionId),
    queryFn: () => reportsApi.getDaysProgress(sessionId),
    enabled: !!sessionId && sessionId > 0,
    staleTime: 30000,
  });
};

/**
 * Fetch progress statistics for a specific day
 */
export const useDayProgressStats = (dayId: number): UseQueryResult<DayProgressStats, Error> => {
  return useQuery({
    queryKey: reportKeys.dayProgressStats(dayId),
    queryFn: () => reportsApi.getDayProgress(dayId),
    enabled: !!dayId && dayId > 0,
    staleTime: 30000,
  });
};

// ===== MOVEMENTS HOOKS =====

/**
 * Fetch all asset movements for a session with optional filters
 */
export const useSessionMovements = (
  sessionId: number,
  filters?: AssetMovementFilters
): UseQueryResult<AssetMovement[], Error> => {
  return useQuery({
    queryKey: reportKeys.sessionMovements(sessionId, filters),
    queryFn: () => reportsApi.getSessionMovements(sessionId, filters),
    enabled: !!sessionId && sessionId > 0,
    staleTime: 60000, // 1 minute
  });
};

/**
 * Fetch asset movements for a specific day
 */
export const useDayMovements = (dayId: number): UseQueryResult<AssetMovement[], Error> => {
  return useQuery({
    queryKey: reportKeys.dayMovements(dayId),
    queryFn: () => reportsApi.getDayMovements(dayId),
    enabled: !!dayId && dayId > 0,
    staleTime: 60000,
  });
};

// ===== EXPORT HOOKS =====

interface ExportMovementsParams {
  sessionId: number;
  sessionName: string;
  options?: ReportExportOptions;
}

/**
 * Export session movements as a downloadable file
 */
export const useExportSessionMovements = (): UseMutationResult<void, Error, ExportMovementsParams> => {
  return useMutation({
    mutationFn: async ({ sessionId, sessionName, options }) => {
      const blob = await reportsApi.exportSessionMovements(sessionId, options);
      const format = options?.format || 'csv';
      const filename = reportsApi.generateReportFilename(sessionName, 'asset-movements', format);
      reportsApi.downloadBlob(blob, filename);
    },
  });
};

interface ExportReportParams {
  sessionId: number;
  sessionName: string;
  options?: ReportExportOptions;
}

/**
 * Export full session report as a downloadable file
 */
export const useExportSessionReport = (): UseMutationResult<void, Error, ExportReportParams> => {
  return useMutation({
    mutationFn: async ({ sessionId, sessionName, options }) => {
      const blob = await reportsApi.exportSessionReport(sessionId, options);
      const format = options?.format || 'csv';
      const filename = reportsApi.generateReportFilename(sessionName, 'rapport', format);
      reportsApi.downloadBlob(blob, filename);
    },
  });
};

// Re-export utility functions for convenience
export {
  formatReportDate,
  formatReportDateTime,
  getMovementTypeLabel,
  getEquipmentTypeLabel,
  getMovementStatusColor,
} from '../../api/reports.api';

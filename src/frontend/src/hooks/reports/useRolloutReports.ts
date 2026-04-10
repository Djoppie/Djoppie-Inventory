/**
 * useRolloutReports - React Query hooks for comprehensive rollout reporting
 *
 * Provides hooks for:
 * - Session overview with KPIs and breakdowns
 * - Day-by-day checklist with workplace SWAP details
 * - Unscheduled assets list
 * - Filter options
 * - Excel export
 */

import { useQuery, useMutation } from '@tanstack/react-query';
import { reportKeys } from './keys';
import {
  getRolloutSessionOverview,
  getRolloutSessionChecklist,
  getUnscheduledAssets,
  getRolloutReportFilterOptions,
  exportRolloutReport,
  downloadBlob,
  generateReportFilename,
} from '../../api/reports.api';
import type {
  RolloutReportFilters,
  RolloutExcelExportRequest,
} from '../../types/report.types';

/**
 * Hook to fetch rollout session overview with KPIs
 */
export const useRolloutSessionOverview = (
  sessionId: number | undefined,
  filters?: RolloutReportFilters,
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: reportKeys.rolloutOverview(sessionId || 0, filters),
    queryFn: () => getRolloutSessionOverview(sessionId!, filters),
    enabled: enabled && !!sessionId,
    staleTime: 30000, // 30 seconds
  });
};

/**
 * Hook to fetch rollout session checklist (all days with workplaces)
 */
export const useRolloutSessionChecklist = (
  sessionId: number | undefined,
  filters?: RolloutReportFilters,
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: reportKeys.rolloutChecklist(sessionId || 0, filters),
    queryFn: () => getRolloutSessionChecklist(sessionId!, filters),
    enabled: enabled && !!sessionId,
    staleTime: 30000, // 30 seconds
  });
};

/**
 * Hook to fetch unscheduled assets
 */
export const useUnscheduledAssets = (
  sessionId: number | undefined,
  limit: number = 100,
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: reportKeys.rolloutUnscheduled(sessionId || 0, limit),
    queryFn: () => getUnscheduledAssets(sessionId!, limit),
    enabled: enabled && !!sessionId,
    staleTime: 60000, // 1 minute
  });
};

/**
 * Hook to fetch filter options for rollout report
 */
export const useRolloutReportFilterOptions = (
  sessionId: number | undefined,
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: reportKeys.rolloutFilterOptions(sessionId || 0),
    queryFn: () => getRolloutReportFilterOptions(sessionId!),
    enabled: enabled && !!sessionId,
    staleTime: 60000, // 1 minute
  });
};

/**
 * Hook to export rollout report as Excel
 */
export const useExportRolloutReport = (sessionId: number, sessionName: string) => {
  return useMutation({
    mutationFn: (options?: RolloutExcelExportRequest) =>
      exportRolloutReport(sessionId, options),
    onSuccess: (blob) => {
      const filename = generateReportFilename(sessionName, 'rollout-report', 'xlsx');
      downloadBlob(blob, filename);
    },
    onError: (error) => {
      console.error('Failed to export rollout report:', error);
    },
  });
};

// ===== HELPER FUNCTIONS =====

/**
 * Get status color for workplace status
 */
export const getWorkplaceStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    Pending: '#9E9E9E',
    Ready: '#2196F3',
    InProgress: '#FF9800',
    Completed: '#4CAF50',
    Skipped: '#795548',
    Failed: '#F44336',
  };
  return colors[status] || '#9E9E9E';
};

/**
 * Get status label in Dutch
 */
export const getWorkplaceStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    Pending: 'Wachtend',
    Ready: 'Klaar',
    InProgress: 'Bezig',
    Completed: 'Voltooid',
    Skipped: 'Overgeslagen',
    Failed: 'Mislukt',
  };
  return labels[status] || status;
};

/**
 * Get priority color for unscheduled assets
 */
export const getPriorityColor = (priority: string): string => {
  const colors: Record<string, string> = {
    High: '#F44336',
    Medium: '#FF9800',
    Low: '#4CAF50',
  };
  return colors[priority] || '#9E9E9E';
};

/**
 * Get priority label in Dutch
 */
export const getPriorityLabel = (priority: string): string => {
  const labels: Record<string, string> = {
    High: 'Hoog',
    Medium: 'Middel',
    Low: 'Laag',
  };
  return labels[priority] || priority;
};

/**
 * Format date for display in Dutch locale
 */
export const formatRolloutDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('nl-NL', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

/**
 * Get equipment type label
 */
export const getEquipmentTypeLabel = (type: string): string => {
  if (type.includes('Desktop') || type.includes('Laptop')) return 'Desktop/Laptop';
  if (type.includes('Docking')) return 'Docking Station';
  return type;
};

/**
 * Check if a workplace has any issues (missing serials, failed status)
 */
export const hasWorkplaceIssues = (
  status: string,
  hasMissingSerialNumbers: boolean
): boolean => {
  return status === 'Failed' || hasMissingSerialNumbers;
};

/**
 * Workplace Report Hooks
 *
 * React Query hooks for physical workplace reporting.
 */

import { useQuery, useMutation } from '@tanstack/react-query';
import {
  getWorkplaceReport,
  getWorkplaceReportSummary,
  exportWorkplaceReport,
  downloadBlob,
} from '../../api/reports.api';
import { reportKeys } from './keys';

/**
 * Fetch workplace report data
 */
export const useWorkplaceReport = () => {
  return useQuery({
    queryKey: reportKeys.workplacesList(),
    queryFn: getWorkplaceReport,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

/**
 * Fetch workplace report summary (occupancy stats)
 */
export const useWorkplaceReportSummary = () => {
  return useQuery({
    queryKey: reportKeys.workplacesSummary(),
    queryFn: getWorkplaceReportSummary,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

/**
 * Export workplace report to Excel
 */
export const useExportWorkplaceReport = () => {
  return useMutation({
    mutationFn: async () => {
      const blob = await exportWorkplaceReport();
      const date = new Date().toISOString().split('T')[0];
      downloadBlob(blob, `werkplekken-rapport-${date}.csv`);
      return blob;
    },
  });
};

/**
 * Hardware Report Hooks
 *
 * React Query hooks for hardware inventory reporting.
 */

import { useQuery, useMutation } from '@tanstack/react-query';
import {
  getHardwareReport,
  getHardwareReportSummary,
  exportHardwareReport,
  downloadBlob,
} from '../../api/reports.api';
import type { HardwareReportFilters } from '../../types/report.types';
import { reportKeys } from './keys';

/**
 * Fetch hardware inventory report data
 */
export const useHardwareReport = (filters?: HardwareReportFilters) => {
  return useQuery({
    queryKey: reportKeys.hardwareList(filters),
    queryFn: () => getHardwareReport(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

/**
 * Fetch hardware report summary statistics
 */
export const useHardwareReportSummary = () => {
  return useQuery({
    queryKey: reportKeys.hardwareSummary(),
    queryFn: getHardwareReportSummary,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

/**
 * Export hardware report to Excel
 */
export const useExportHardwareReport = () => {
  return useMutation({
    mutationFn: async (filters?: HardwareReportFilters) => {
      const blob = await exportHardwareReport(filters);
      const date = new Date().toISOString().split('T')[0];
      downloadBlob(blob, `hardware-inventaris-${date}.csv`);
      return blob;
    },
  });
};

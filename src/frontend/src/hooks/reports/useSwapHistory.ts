/**
 * Swap History Report Hooks
 *
 * React Query hooks for swap/deployment history reporting.
 */

import { useQuery, useMutation } from '@tanstack/react-query';
import {
  getSwapHistory,
  getSwapHistorySummary,
  exportSwapHistory,
  downloadBlob,
} from '../../api/reports.api';
import type { SwapHistoryFilters } from '../../types/report.types';
import { reportKeys } from './keys';

/**
 * Fetch swap history data
 */
export const useSwapHistory = (filters?: SwapHistoryFilters) => {
  return useQuery({
    queryKey: reportKeys.swapsList(filters),
    queryFn: () => getSwapHistory(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

/**
 * Fetch swap history summary statistics
 */
export const useSwapHistorySummary = (filters?: SwapHistoryFilters) => {
  return useQuery({
    queryKey: reportKeys.swapsSummary(filters),
    queryFn: () => getSwapHistorySummary(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

/**
 * Export swap history to Excel
 */
export const useExportSwapHistory = () => {
  return useMutation({
    mutationFn: async (filters?: SwapHistoryFilters) => {
      const blob = await exportSwapHistory(filters);
      const date = new Date().toISOString().split('T')[0];
      downloadBlob(blob, `swap-geschiedenis-${date}.csv`);
      return blob;
    },
  });
};

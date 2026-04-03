/**
 * Lease Report Hooks
 *
 * React Query hooks for lease contract reporting.
 */

import { useQuery, useMutation } from '@tanstack/react-query';
import {
  getLeaseReport,
  getLeaseReportSummary,
  exportLeaseReport,
  downloadBlob,
} from '../../api/reports.api';
import type { LeaseReportFilters } from '../../types/report.types';
import { reportKeys } from './keys';

/**
 * Fetch lease contracts for report
 */
export const useLeaseReport = (filters?: LeaseReportFilters) => {
  return useQuery({
    queryKey: reportKeys.leasesList(filters),
    queryFn: () => getLeaseReport(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

/**
 * Fetch lease report summary
 */
export const useLeaseReportSummary = () => {
  return useQuery({
    queryKey: reportKeys.leasesSummary(),
    queryFn: getLeaseReportSummary,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

/**
 * Export lease report to Excel
 */
export const useExportLeaseReport = () => {
  return useMutation({
    mutationFn: async (filters?: LeaseReportFilters) => {
      const blob = await exportLeaseReport(filters);
      const date = new Date().toISOString().split('T')[0];
      downloadBlob(blob, `lease-contracten-${date}.csv`);
      return blob;
    },
  });
};

/**
 * Get status color for lease contract
 */
export const getLeaseStatusColor = (
  status: 'active' | 'expiring' | 'expired'
): 'success' | 'warning' | 'error' => {
  switch (status) {
    case 'active':
      return 'success';
    case 'expiring':
      return 'warning';
    case 'expired':
      return 'error';
  }
};

/**
 * Get status label for lease contract
 */
export const getLeaseStatusLabel = (
  status: 'active' | 'expiring' | 'expired'
): string => {
  const labels: Record<string, string> = {
    active: 'Actief',
    expiring: 'Bijna Verlopen',
    expired: 'Verlopen',
  };
  return labels[status];
};

/**
 * Format currency for display
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
};

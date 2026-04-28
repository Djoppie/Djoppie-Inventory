/**
 * Lease Report Hooks
 *
 * React Query hooks for the per-asset leasing report.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getLeaseReport,
  getLeaseReportSummary,
  exportLeaseReport,
  importLeaseCsv,
  downloadBlob,
} from '../../api/reports.api';
import type { LeaseReportFilters, LeaseReportRow } from '../../types/report.types';
import { reportKeys } from './keys';

/** Per-asset lease rows. */
export const useLeaseReport = (filters?: LeaseReportFilters) => {
  return useQuery({
    queryKey: reportKeys.leasesList(filters),
    queryFn: () => getLeaseReport(filters),
    staleTime: 2 * 60 * 1000,
  });
};

/** KPI summary. */
export const useLeaseReportSummary = () => {
  return useQuery({
    queryKey: reportKeys.leasesSummary(),
    queryFn: getLeaseReportSummary,
    staleTime: 2 * 60 * 1000,
  });
};

/** CSV export. */
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

/** CSV import — invalidates lease queries on success. */
export const useImportLeaseCsv = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => importLeaseCsv(file),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: reportKeys.leasesAll() });
    },
  });
};

/** Color tokens for urgency buckets. */
export const URGENCY_COLORS: Record<LeaseReportRow['urgencyBucket'], string> = {
  Active: '#4CAF50',
  Yellow: '#FBC02D',
  Orange: '#FB8C00',
  Red: '#E53935',
  Returned: '#9E9E9E',
  Cancelled: '#9E9E9E',
  None: '#BDBDBD',
};

/** Localized label for urgency buckets. */
export const URGENCY_LABELS: Record<LeaseReportRow['urgencyBucket'], string> = {
  Active: 'Actief',
  Yellow: '< 3 maanden',
  Orange: '< 6 weken',
  Red: '< 3 weken / verlopen',
  Returned: 'Teruggestuurd',
  Cancelled: 'Geannuleerd',
  None: '—',
};

/** Localized label for per-asset lease status. */
export const LEASE_STATUS_LABELS: Record<LeaseReportRow['leaseStatus'], string> = {
  None: '—',
  InLease: 'In lease',
  Returned: 'Teruggestuurd',
  Cancelled: 'Geannuleerd',
};

/** Format euro currency. */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
};

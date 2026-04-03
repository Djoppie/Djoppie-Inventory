/**
 * License Report Hooks
 *
 * React Query hooks for MS365 license reporting via Graph API.
 */

import { useQuery, useMutation } from '@tanstack/react-query';
import {
  getLicenseSummary,
  getLicenseUsers,
  getLicenseOptimization,
  exportLicenseReport,
  downloadBlob,
} from '../../api/reports.api';
import type { LicenseReportFilters } from '../../types/report.types';
import { reportKeys } from './keys';

/**
 * Fetch MS365 license summary
 */
export const useLicenseSummary = () => {
  return useQuery({
    queryKey: reportKeys.licenseSummary(),
    queryFn: getLicenseSummary,
    staleTime: 5 * 60 * 1000, // 5 minutes (license data changes less frequently)
  });
};

/**
 * Fetch license users (users with assigned licenses)
 */
export const useLicenseUsers = (filters?: LicenseReportFilters) => {
  return useQuery({
    queryKey: reportKeys.licenseUsers(filters),
    queryFn: () => getLicenseUsers(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Fetch license optimization analysis
 * Identifies inactive users and downgrade candidates
 */
export const useLicenseOptimization = (
  inactiveDaysThreshold: number = 90,
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: reportKeys.licenseOptimization(inactiveDaysThreshold),
    queryFn: () => getLicenseOptimization(inactiveDaysThreshold),
    staleTime: 10 * 60 * 1000, // 10 minutes (analysis is expensive)
    enabled,
  });
};

/**
 * Export license report to Excel
 */
export const useExportLicenseReport = () => {
  return useMutation({
    mutationFn: async () => {
      const blob = await exportLicenseReport();
      const date = new Date().toISOString().split('T')[0];
      downloadBlob(blob, `ms365-licenties-${date}.csv`);
      return blob;
    },
  });
};

/**
 * Get friendly license name from SKU part number
 */
export const getLicenseDisplayName = (skuPartNumber: string): string => {
  const names: Record<string, string> = {
    ENTERPRISEPACK: 'Office 365 E3',
    ENTERPRISEPREMIUM: 'Office 365 E5',
    DESKLESSPACK: 'Microsoft 365 F1',
    SPE_E3: 'Microsoft 365 E3',
    SPE_E5: 'Microsoft 365 E5',
    O365_BUSINESS_ESSENTIALS: 'Microsoft 365 Business Basic',
    O365_BUSINESS_PREMIUM: 'Microsoft 365 Business Standard',
    SMB_BUSINESS_PREMIUM: 'Microsoft 365 Business Premium',
    EXCHANGESTANDARD: 'Exchange Online (Plan 1)',
    EXCHANGEENTERPRISE: 'Exchange Online (Plan 2)',
    FLOW_FREE: 'Power Automate Free',
    POWER_BI_STANDARD: 'Power BI (free)',
    PROJECTPROFESSIONAL: 'Project Plan 3',
    VISIOCLIENT: 'Visio Plan 2',
  };
  return names[skuPartNumber] || skuPartNumber;
};

/**
 * Get license category (E3, E5, F1, or other)
 */
export const getLicenseCategory = (
  skuPartNumber: string
): 'E3' | 'E5' | 'F1' | 'other' => {
  if (skuPartNumber.includes('E3') || skuPartNumber === 'ENTERPRISEPACK') {
    return 'E3';
  }
  if (skuPartNumber.includes('E5') || skuPartNumber === 'ENTERPRISEPREMIUM') {
    return 'E5';
  }
  if (skuPartNumber.includes('F1') || skuPartNumber === 'DESKLESSPACK') {
    return 'F1';
  }
  return 'other';
};

/**
 * Get color for license category
 */
export const getLicenseColor = (
  category: 'E3' | 'E5' | 'F1' | 'other'
): string => {
  const colors: Record<string, string> = {
    E3: '#1976D2', // Blue
    E5: '#7B1FA2', // Purple
    F1: '#388E3C', // Green
    other: '#757575', // Grey
  };
  return colors[category];
};

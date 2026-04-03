/**
 * Query Keys for Reports Module
 *
 * Centralized query key definitions for React Query cache management.
 * Used across all report hooks for consistent cache invalidation.
 */

export const reportKeys = {
  all: ['reports'] as const,

  // Hardware Reports
  hardware: () => [...reportKeys.all, 'hardware'] as const,
  hardwareList: (filters?: object) =>
    [...reportKeys.hardware(), 'list', filters] as const,
  hardwareSummary: () => [...reportKeys.hardware(), 'summary'] as const,

  // Workplace Reports
  workplaces: () => [...reportKeys.all, 'workplaces'] as const,
  workplacesList: () => [...reportKeys.workplaces(), 'list'] as const,
  workplacesSummary: () => [...reportKeys.workplaces(), 'summary'] as const,

  // Swap History
  swaps: () => [...reportKeys.all, 'swaps'] as const,
  swapsList: (filters?: object) =>
    [...reportKeys.swaps(), 'list', filters] as const,
  swapsSummary: (filters?: object) =>
    [...reportKeys.swaps(), 'summary', filters] as const,

  // License Reports
  licenses: () => [...reportKeys.all, 'licenses'] as const,
  licenseSummary: () => [...reportKeys.licenses(), 'summary'] as const,
  licenseUsers: (filters?: object) =>
    [...reportKeys.licenses(), 'users', filters] as const,
  licenseOptimization: (threshold?: number) =>
    [...reportKeys.licenses(), 'optimization', threshold] as const,

  // Lease Reports
  leases: () => [...reportKeys.all, 'leases'] as const,
  leasesList: (filters?: object) =>
    [...reportKeys.leases(), 'list', filters] as const,
  leasesSummary: () => [...reportKeys.leases(), 'summary'] as const,
};

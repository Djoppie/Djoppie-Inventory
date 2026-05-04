/**
 * Reports API - API calls for rollout reporting
 * Handles progress statistics, asset movements, and exports
 */

import { apiClient } from './client';
import type {
  AssetMovement,
  AssetMovementByDate,
  AssetMovementFilters,
  SessionProgressStats,
  DayProgressStats,
  ReportExportOptions,
  HardwareReportItem,
  HardwareReportFilters,
  HardwareReportSummary,
  WorkplaceReportItem,
  WorkplaceReportSummary,
  AssetChangeHistoryItem,
  AssetChangeHistoryFilters,
  AssetChangeHistorySummary,
  LicenseSummary,
  LicenseUser,
  LicenseReportFilters,
  LicenseOptimization,
  LeaseReportRow,
  LeaseReportSummary,
  LeaseReportFilters,
  LeaseImportResult,
  RolloutSessionOverview,
  RolloutDayChecklist,
  UnscheduledAsset,
  RolloutReportFilterOptions,
  RolloutReportFilters,
  RolloutExcelExportRequest,
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

/**
 * Get asset movements across all sessions within a date range.
 * Hits: GET /api/operations/rollouts/reports/movements/by-date
 * Both dates are required by the backend — always pass them.
 */
export const getMovementsByDateRange = async (
  startDate: string,
  endDate: string,
  movementType?: 'Deployment' | 'Decommission' | 'Transfer'
): Promise<AssetMovementByDate[]> => {
  const params: Record<string, string> = {
    startDate,
    endDate,
  };
  if (movementType) {
    params.movementType = movementType;
  }
  const response = await apiClient.get<AssetMovementByDate[]>('/operations/rollouts/reports/movements/by-date', { params });
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

// ===== HARDWARE REPORT API CALLS =====

/**
 * Get all assets for hardware inventory report
 */
export const getHardwareReport = async (
  filters?: HardwareReportFilters
): Promise<HardwareReportItem[]> => {
  const params: Record<string, string | number> = {};

  if (filters?.status) {
    params.status = filters.status;
  }
  if (filters?.assetTypeId) {
    params.assetTypeId = filters.assetTypeId;
  }
  if (filters?.categoryId) {
    params.categoryId = filters.categoryId;
  }
  if (filters?.serviceId) {
    params.serviceId = filters.serviceId;
  }
  if (filters?.buildingId) {
    params.buildingId = filters.buildingId;
  }
  if (filters?.searchQuery) {
    params.search = filters.searchQuery;
  }

  const response = await apiClient.get<HardwareReportItem[]>('/reports/hardware', { params });
  return response.data;
};

/**
 * Get hardware report summary statistics
 */
export const getHardwareReportSummary = async (): Promise<HardwareReportSummary> => {
  const response = await apiClient.get<HardwareReportSummary>('/reports/hardware/summary');
  return response.data;
};

/**
 * Export hardware report as Excel
 */
export const exportHardwareReport = async (
  filters?: HardwareReportFilters
): Promise<Blob> => {
  const params: Record<string, string | number> = {};

  if (filters?.status) {
    params.status = filters.status;
  }
  if (filters?.assetTypeId) {
    params.assetTypeId = filters.assetTypeId;
  }
  if (filters?.serviceId) {
    params.serviceId = filters.serviceId;
  }
  if (filters?.buildingId) {
    params.buildingId = filters.buildingId;
  }

  const response = await apiClient.get('/reports/hardware/export', {
    params,
    responseType: 'blob',
  });
  return response.data;
};

// ===== WORKPLACE REPORT API CALLS =====

/**
 * Get all workplaces for workplace report
 */
export const getWorkplaceReport = async (): Promise<WorkplaceReportItem[]> => {
  const response = await apiClient.get<WorkplaceReportItem[]>('/reports/workplaces');
  return response.data;
};

/**
 * Get workplace report summary (occupancy stats)
 */
export const getWorkplaceReportSummary = async (): Promise<WorkplaceReportSummary> => {
  const response = await apiClient.get<WorkplaceReportSummary>('/reports/workplaces/summary');
  return response.data;
};

/**
 * Export workplace report as Excel
 */
export const exportWorkplaceReport = async (): Promise<Blob> => {
  const response = await apiClient.get('/reports/workplaces/export', {
    responseType: 'blob',
  });
  return response.data;
};

// ===== SWAP HISTORY REPORT API CALLS =====

/**
 * Get asset change history - tracks all asset status and owner changes
 */
export const getAssetChangeHistory = async (
  filters?: AssetChangeHistoryFilters
): Promise<AssetChangeHistoryItem[]> => {
  const params: Record<string, string | number> = {};

  if (filters?.dateFrom) {
    params.dateFrom = filters.dateFrom;
  }
  if (filters?.dateTo) {
    params.dateTo = filters.dateTo;
  }
  if (filters?.serviceId) {
    params.serviceId = filters.serviceId;
  }
  if (filters?.eventType) {
    params.eventType = filters.eventType;
  }
  if (filters?.searchQuery) {
    params.search = filters.searchQuery;
  }

  const response = await apiClient.get<AssetChangeHistoryItem[]>('/reports/assets/change-history', { params });
  return response.data;
};

/**
 * Get asset change history summary with asset-focused metrics
 */
export const getAssetChangeHistorySummary = async (
  filters?: Pick<AssetChangeHistoryFilters, 'dateFrom' | 'dateTo'>
): Promise<AssetChangeHistorySummary> => {
  const params: Record<string, string> = {};

  if (filters?.dateFrom) {
    params.dateFrom = filters.dateFrom;
  }
  if (filters?.dateTo) {
    params.dateTo = filters.dateTo;
  }

  const response = await apiClient.get<AssetChangeHistorySummary>('/reports/assets/change-history/summary', { params });
  return response.data;
};

/**
 * Export asset change history as CSV
 */
export const exportAssetChangeHistory = async (
  filters?: Pick<AssetChangeHistoryFilters, 'dateFrom' | 'dateTo' | 'serviceId'>
): Promise<Blob> => {
  const params: Record<string, string | number> = {};

  if (filters?.dateFrom) {
    params.dateFrom = filters.dateFrom;
  }
  if (filters?.dateTo) {
    params.dateTo = filters.dateTo;
  }
  if (filters?.serviceId) {
    params.serviceId = filters.serviceId;
  }

  const response = await apiClient.get('/reports/assets/change-history/export', {
    params,
    responseType: 'blob',
  });
  return response.data;
};

// Backward compatibility aliases (deprecated)
/** @deprecated Use getAssetChangeHistory instead */
export const getSwapHistory = getAssetChangeHistory;
/** @deprecated Use getAssetChangeHistorySummary instead */
export const getSwapHistorySummary = getAssetChangeHistorySummary;
/** @deprecated Use exportAssetChangeHistory instead */
export const exportSwapHistory = exportAssetChangeHistory;

// ===== LICENSE REPORT API CALLS =====

/**
 * Get MS365 license summary
 */
export const getLicenseSummary = async (): Promise<LicenseSummary> => {
  const response = await apiClient.get<LicenseSummary>('/reports/licenses/summary');
  return response.data;
};

/**
 * Get license users (users with assigned licenses)
 */
export const getLicenseUsers = async (
  filters?: LicenseReportFilters
): Promise<LicenseUser[]> => {
  const params: Record<string, string> = {};

  if (filters?.skuId) {
    params.skuId = filters.skuId;
  }
  if (filters?.department) {
    params.department = filters.department;
  }
  if (filters?.searchQuery) {
    params.search = filters.searchQuery;
  }

  const response = await apiClient.get<LicenseUser[]>('/reports/licenses/users', { params });
  return response.data;
};

/**
 * Export license report as Excel
 */
export const exportLicenseReport = async (): Promise<Blob> => {
  const response = await apiClient.get('/reports/licenses/export', {
    responseType: 'blob',
  });
  return response.data;
};

/**
 * Get license optimization analysis
 */
export const getLicenseOptimization = async (
  inactiveDaysThreshold: number = 90
): Promise<LicenseOptimization> => {
  const response = await apiClient.get<LicenseOptimization>('/reports/licenses/optimization', {
    params: { inactiveDaysThreshold },
  });
  return response.data;
};

// ===== LEASE REPORT API CALLS =====

const buildLeaseParams = (filters?: LeaseReportFilters): Record<string, string | number> => {
  const params: Record<string, string | number> = {};
  if (filters?.urgency && filters.urgency !== 'all') params.urgency = filters.urgency;
  if (filters?.leaseStatus) params.leaseStatus = filters.leaseStatus;
  if (filters?.leaseContractId) params.leaseContractId = filters.leaseContractId;
  if (filters?.search) params.search = filters.search;
  return params;
};

/**
 * Get per-asset lease report rows.
 */
export const getLeaseReport = async (
  filters?: LeaseReportFilters
): Promise<LeaseReportRow[]> => {
  const response = await apiClient.get<LeaseReportRow[]>('/reports/leases', {
    params: buildLeaseParams(filters),
  });
  return response.data;
};

/**
 * Get lease report KPI summary.
 */
export const getLeaseReportSummary = async (): Promise<LeaseReportSummary> => {
  const response = await apiClient.get<LeaseReportSummary>('/reports/leases/summary');
  return response.data;
};

/**
 * Export lease report as CSV.
 */
export const exportLeaseReport = async (
  filters?: LeaseReportFilters
): Promise<Blob> => {
  const response = await apiClient.get('/reports/leases/export', {
    params: buildLeaseParams(filters),
    responseType: 'blob',
  });
  return response.data;
};

/**
 * Import a supplier lease CSV.
 */
export const importLeaseCsv = async (file: File): Promise<LeaseImportResult> => {
  const form = new FormData();
  form.append('file', file);
  const response = await apiClient.post<LeaseImportResult>('/admin/leases/import', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

// ===== ROLLOUT REPORT API CALLS =====

/**
 * Get rollout session overview with KPIs and breakdowns
 */
export const getRolloutSessionOverview = async (
  sessionId: number,
  filters?: RolloutReportFilters
): Promise<RolloutSessionOverview> => {
  const params: Record<string, string | number | string[]> = {};

  if (filters?.serviceIds && filters.serviceIds.length > 0) {
    params.serviceIds = filters.serviceIds.join(',');
  }
  if (filters?.buildingIds && filters.buildingIds.length > 0) {
    params.buildingIds = filters.buildingIds.join(',');
  }

  const response = await apiClient.get<RolloutSessionOverview>(
    `/reports/rollout/sessions/${sessionId}/overview`,
    { params }
  );
  return response.data;
};

/**
 * Get rollout session checklist (all days with workplaces)
 */
export const getRolloutSessionChecklist = async (
  sessionId: number,
  filters?: RolloutReportFilters
): Promise<RolloutDayChecklist[]> => {
  const params: Record<string, string | number | string[]> = {};

  if (filters?.serviceIds && filters.serviceIds.length > 0) {
    params.serviceIds = filters.serviceIds.join(',');
  }
  if (filters?.buildingIds && filters.buildingIds.length > 0) {
    params.buildingIds = filters.buildingIds.join(',');
  }
  if (filters?.statuses && filters.statuses.length > 0) {
    params.statuses = filters.statuses.join(',');
  }

  const response = await apiClient.get<RolloutDayChecklist[]>(
    `/reports/rollout/sessions/${sessionId}/checklist`,
    { params }
  );
  return response.data;
};

/**
 * Get unscheduled assets (not yet in any rollout)
 */
export const getUnscheduledAssets = async (
  sessionId: number,
  limit: number = 100
): Promise<UnscheduledAsset[]> => {
  const response = await apiClient.get<UnscheduledAsset[]>(
    `/reports/rollout/sessions/${sessionId}/unscheduled`,
    { params: { limit } }
  );
  return response.data;
};

/**
 * Get filter options for rollout report
 */
export const getRolloutReportFilterOptions = async (
  sessionId: number
): Promise<RolloutReportFilterOptions> => {
  const response = await apiClient.get<RolloutReportFilterOptions>(
    `/reports/rollout/sessions/${sessionId}/filter-options`
  );
  return response.data;
};

/**
 * Export rollout report as Excel
 */
export const exportRolloutReport = async (
  sessionId: number,
  options?: RolloutExcelExportRequest
): Promise<Blob> => {
  const params: Record<string, string | boolean> = {};

  if (options?.serviceIds && options.serviceIds.length > 0) {
    params.serviceIds = options.serviceIds.join(',');
  }
  if (options?.buildingIds && options.buildingIds.length > 0) {
    params.buildingIds = options.buildingIds.join(',');
  }
  if (options?.includeOverview !== undefined) {
    params.includeOverview = options.includeOverview;
  }
  if (options?.includeSwapChecklist !== undefined) {
    params.includeSwapChecklist = options.includeSwapChecklist;
  }
  if (options?.includeUnscheduledAssets !== undefined) {
    params.includeUnscheduledAssets = options.includeUnscheduledAssets;
  }
  if (options?.includeSectorBreakdown !== undefined) {
    params.includeSectorBreakdown = options.includeSectorBreakdown;
  }
  if (options?.groupBy) {
    params.groupBy = options.groupBy;
  }

  const response = await apiClient.get(`/reports/rollout/sessions/${sessionId}/export`, {
    params,
    responseType: 'blob',
  });
  return response.data;
};

// ===== SERIAL NUMBER MANAGEMENT API CALLS =====

/**
 * Asset serial number data for rollout session
 */
export interface RolloutAssetSerial {
  assetId: number;
  assetCode: string;
  assetName?: string;
  equipmentType: string;
  currentSerialNumber?: string;
  brand?: string;
  model?: string;
  workplaceName: string;
  userDisplayName?: string;
  serviceName: string;
  buildingName: string;
  date?: string;
  status: string;
  isMissingSerial: boolean;
}

/**
 * Single serial number update
 */
export interface SerialNumberUpdate {
  assetId: number;
  serialNumber: string;
}

/**
 * Bulk serial number update request
 */
export interface BulkSerialNumberUpdateRequest {
  updates: SerialNumberUpdate[];
}

/**
 * Bulk serial number update result
 */
export interface BulkSerialNumberUpdateResult {
  successCount: number;
  failedCount: number;
  errors: string[];
}

/**
 * Get all assets linked to a rollout session for serial number management
 */
export const getRolloutAssetSerials = async (
  sessionId: number,
  onlyMissing: boolean = false
): Promise<RolloutAssetSerial[]> => {
  const response = await apiClient.get<RolloutAssetSerial[]>(
    `/reports/rollout/sessions/${sessionId}/serial-numbers`,
    { params: { onlyMissing } }
  );
  return response.data;
};

/**
 * Bulk update serial numbers for assets
 */
export const bulkUpdateSerialNumbers = async (
  sessionId: number,
  updates: SerialNumberUpdate[]
): Promise<BulkSerialNumberUpdateResult> => {
  const response = await apiClient.patch<BulkSerialNumberUpdateResult>(
    `/reports/rollout/sessions/${sessionId}/serial-numbers/bulk`,
    { updates }
  );
  return response.data;
};

/**
 * Update a single asset's serial number
 */
export const updateAssetSerialNumber = async (
  assetId: number,
  serialNumber: string
): Promise<{ message: string; serialNumber: string }> => {
  const response = await apiClient.patch<{ message: string; serialNumber: string }>(
    `/reports/assets/${assetId}/serial`,
    { assetId, serialNumber }
  );
  return response.data;
};

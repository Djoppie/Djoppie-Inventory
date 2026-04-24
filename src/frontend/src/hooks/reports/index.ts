/**
 * Reports Hooks - Index
 *
 * Re-exports all reporting module React Query hooks for convenient importing.
 *
 * Usage:
 *   import { useHardwareReport, useLicenseSummary } from '../hooks/reports';
 */

// Query Keys
export { reportKeys } from './keys';

// Hardware Report Hooks
export {
  useHardwareReport,
  useHardwareReportSummary,
  useExportHardwareReport,
} from './useHardwareReport';

// Workplace Report Hooks
export {
  useWorkplaceReport,
  useWorkplaceReportSummary,
  useExportWorkplaceReport,
} from './useWorkplaceReports';

// Swap History Hooks
export {
  useSwapHistory,
  useSwapHistorySummary,
  useExportSwapHistory,
} from './useSwapHistory';

// License Report Hooks
export {
  useLicenseSummary,
  useLicenseUsers,
  useLicenseOptimization,
  useExportLicenseReport,
  getLicenseDisplayName,
  getLicenseCategory,
  getLicenseColor,
} from './useLicenseReports';

// Lease Report Hooks
export {
  useLeaseReport,
  useLeaseReportSummary,
  useExportLeaseReport,
  getLeaseStatusColor,
  getLeaseStatusLabel,
  formatCurrency,
} from './useLeaseReports';

// Rollout Report Hooks
export {
  useRolloutSessionOverview,
  useRolloutSessionChecklist,
  useUnscheduledAssets,
  useRolloutReportFilterOptions,
  useExportRolloutReport,
  getWorkplaceStatusColor,
  getWorkplaceStatusLabel,
  getPriorityColor,
  getPriorityLabel,
  formatRolloutDate,
  getEquipmentTypeLabel,
  hasWorkplaceIssues,
} from './useRolloutReports';

// Overview, Intune, Employees, Asset Timeline Hooks
export { useReportsOverview } from './useReportsOverview';
export { useIntuneSummary } from './useIntuneSummary';
export { useEmployeesReport, useEmployeeTimeline } from './useEmployeesReport';
export { useAssetTimeline } from './useAssetTimeline';

/**
 * TypeScript types for Rollout Reporting
 * Extends rollout types with detailed movement and progress tracking
 */

import type { EquipmentType, RolloutSessionStatus, RolloutWorkplaceStatus } from './rollout';

// ===== ASSET MOVEMENT TYPES =====

/**
 * Represents a single asset movement/transition in a rollout
 */
export interface AssetMovement {
  id: number;
  assetId: number;
  assetCode: string;
  assetName?: string;
  equipmentType: EquipmentType;
  serialNumber?: string;
  brand?: string;
  model?: string;
  previousStatus: string;
  newStatus: string;
  movementType: 'deployment' | 'decommission' | 'transfer';
  workplaceId: number;
  workplaceName: string;
  userName: string;
  userEmail?: string;
  location?: string;
  serviceName?: string;
  dayId: number;
  dayNumber: number;
  date: string;
  executedBy: string;
  executedByEmail?: string;
  executedAt: string;
}

/**
 * Filter options for asset movements table
 */
export interface AssetMovementFilters {
  movementType?: 'all' | 'deployment' | 'decommission';
  equipmentType?: EquipmentType | 'all';
  serviceName?: string;
  dateFrom?: string;
  dateTo?: string;
  searchQuery?: string;
}

/**
 * Sort configuration for asset movements
 */
export interface AssetMovementSort {
  field: 'assetCode' | 'equipmentType' | 'userName' | 'date' | 'executedBy' | 'serviceName';
  direction: 'asc' | 'desc';
}

// ===== SESSION PROGRESS TYPES =====

/**
 * Enhanced progress statistics for a session
 */
export interface SessionProgressStats {
  sessionId: number;
  sessionName: string;
  status: RolloutSessionStatus;
  // Overview stats
  totalDays: number;
  completedDays: number;
  totalWorkplaces: number;
  completedWorkplaces: number;
  pendingWorkplaces: number;
  inProgressWorkplaces: number;
  skippedWorkplaces: number;
  failedWorkplaces: number;
  // Asset stats
  totalAssetsDeployed: number;
  totalAssetsDecommissioned: number;
  // Timing
  plannedStartDate: string;
  plannedEndDate?: string;
  actualStartDate?: string;
  estimatedCompletionDate?: string;
  // Calculated
  completionPercentage: number;
  averageWorkplacesPerDay: number;
  daysRemaining: number;
}

/**
 * Progress data for a single day
 */
export interface DayProgressStats {
  dayId: number;
  dayNumber: number;
  date: string;
  name?: string;
  status: string;
  totalWorkplaces: number;
  completedWorkplaces: number;
  pendingWorkplaces: number;
  inProgressWorkplaces: number;
  skippedWorkplaces: number;
  failedWorkplaces: number;
  completionPercentage: number;
  assetsDeployed: number;
  assetsDecommissioned: number;
}

/**
 * Workplace progress summary
 */
export interface WorkplaceProgressSummary {
  workplaceId: number;
  userName: string;
  userEmail?: string;
  location?: string;
  serviceName?: string;
  status: RolloutWorkplaceStatus;
  totalItems: number;
  completedItems: number;
  completionPercentage: number;
  completedAt?: string;
  completedBy?: string;
}

// ===== DASHBOARD WIDGET TYPES =====

/**
 * Data for progress dashboard cards
 */
export interface ProgressCardData {
  label: string;
  value: number | string;
  icon: string;
  color: 'primary' | 'success' | 'warning' | 'error' | 'info';
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'neutral';
  };
  description?: string;
}

/**
 * Chart data point for timeline visualization
 */
export interface ProgressTimelinePoint {
  date: string;
  completed: number;
  pending: number;
  cumulative: number;
}

// ===== EXPORT TYPES =====

/**
 * Export options for reports
 */
export interface ReportExportOptions {
  format: 'csv' | 'xlsx' | 'pdf';
  includeHeaders: boolean;
  dateFormat: 'iso' | 'nl-NL' | 'en-US';
  columns?: string[];
}

/**
 * Export result with download info
 */
export interface ReportExportResult {
  blob: Blob;
  filename: string;
  contentType: string;
}

// ===== HARDWARE REPORT TYPES =====

export interface HardwareReportItem {
  id: number;
  assetCode: string;
  name: string;
  assetTypeName: string;
  categoryName?: string;
  brand?: string;
  model?: string;
  serialNumber?: string;
  status: string;
  ownerName?: string;
  ownerEmail?: string;
  serviceName?: string;
  buildingName?: string;
  location?: string;
  intuneDeviceId?: string;
  intuneComplianceState?: string;
  intuneLastSync?: string;
  purchaseDate?: string;
  installationDate?: string;
  warrantyExpiration?: string;
  createdAt: string;
  updatedAt: string;
}

export interface HardwareReportFilters {
  status?: string;
  assetTypeId?: number;
  categoryId?: number;
  serviceId?: number;
  buildingId?: number;
  searchQuery?: string;
}

export interface HardwareReportSummary {
  totalAssets: number;
  byStatus: Record<string, number>;
  byAssetType: Record<string, number>;
  byService: Record<string, number>;
}

// ===== WORKPLACE REPORT TYPES =====

export interface WorkplaceReportItem {
  id: number;
  code: string;
  name: string;
  buildingName?: string;
  floor?: string;
  room?: string;
  occupantName?: string;
  occupantEmail?: string;
  serviceName?: string;
  isOccupied: boolean;
  equipmentCount: number;
  equipment: WorkplaceEquipmentItem[];
  createdAt: string;
  updatedAt: string;
}

export interface WorkplaceEquipmentItem {
  assetId: number;
  assetCode: string;
  assetName?: string;
  equipmentType: string;
  brand?: string;
  model?: string;
}

export interface WorkplaceReportSummary {
  totalWorkplaces: number;
  occupiedWorkplaces: number;
  availableWorkplaces: number;
  occupancyRate: number;
  byBuilding: Record<string, { total: number; occupied: number }>;
}

// ===== ASSET CHANGE HISTORY REPORT TYPES =====

/**
 * Asset change history item - represents one asset status or owner change event
 */
export interface AssetChangeHistoryItem {
  id: number;
  eventDate: string;
  assetId: number;
  assetCode: string;
  assetName?: string;
  assetTypeName?: string;
  serialNumber?: string;
  eventType: string;
  eventTypeDisplay: string;
  description: string;
  oldValue?: string;
  newValue?: string;
  currentOwner?: string;
  currentStatus?: string;
  serviceName?: string;
  buildingName?: string;
  location?: string;
  performedBy?: string;
  performedByEmail?: string;
  notes?: string;
}

/**
 * Filter options for asset change history
 */
export interface AssetChangeHistoryFilters {
  dateFrom?: string;
  dateTo?: string;
  serviceId?: number;
  eventType?: string;
  searchQuery?: string;
}

/**
 * Asset change history summary with asset-focused metrics
 */
export interface AssetChangeHistorySummary {
  totalChanges: number;
  statusChanges: number;
  ownerChanges: number;
  locationChanges: number;
  uniqueAssetsChanged: number;
  activeAssets: number;
  byEventType: Record<string, number>;
  byService: Record<string, number>;
  byMonth: Array<{ month: string; count: number }>;
}

// Legacy types for backward compatibility (deprecated)
/** @deprecated Use AssetChangeHistoryItem instead */
export type SwapHistoryItem = AssetChangeHistoryItem;
/** @deprecated Use AssetChangeHistoryFilters instead */
export type SwapHistoryFilters = AssetChangeHistoryFilters;
/** @deprecated Use AssetChangeHistorySummary instead */
export type SwapHistorySummary = AssetChangeHistorySummary;

// ===== LICENSE REPORT TYPES =====

export interface LicenseSummary {
  licenses: LicenseInfo[];
  totalPurchased: number;
  totalAssigned: number;
  totalAvailable: number;
  utilizationPercentage: number;
  retrievedAt?: string;
  errorMessage?: string;
}

export interface LicenseInfo {
  skuId: string;
  skuPartNumber: string;
  displayName: string;
  prepaidUnits: number;
  consumedUnits: number;
  availableUnits: number;
  utilizationPercentage: number;
  isE3: boolean;
  isE5: boolean;
  isF1: boolean;
}

export interface LicenseUser {
  userId: string;
  displayName: string;
  userPrincipalName: string;
  department?: string;
  jobTitle?: string;
  assignedLicenses: AssignedLicense[];
}

export interface AssignedLicense {
  skuId: string;
  skuPartNumber: string;
  displayName: string;
}

export interface LicenseReportFilters {
  skuId?: string;
  department?: string;
  searchQuery?: string;
}

// ===== LICENSE OPTIMIZATION TYPES =====

export interface LicenseOptimization {
  inactiveUsers: InactiveUser[];
  downgradeRecommendations: DowngradeRecommendation[];
  summary: OptimizationSummary;
  retrievedAt?: string;
  errorMessage?: string;
}

export interface InactiveUser {
  userId: string;
  displayName: string;
  userPrincipalName: string;
  department?: string;
  jobTitle?: string;
  lastSignIn?: string;
  daysSinceLastSignIn: number;
  currentLicense: string;
  licenseCategory: string;
  monthlyCost: number;
  recommendation: string;
}

export interface DowngradeRecommendation {
  userId: string;
  displayName: string;
  userPrincipalName: string;
  department?: string;
  jobTitle?: string;
  lastSignIn?: string;
  currentLicense: string;
  currentCategory: string;
  recommendedLicense: string;
  recommendedCategory: string;
  reason: string;
  monthlySavings: number;
}

export interface OptimizationSummary {
  totalUsersAnalyzed: number;
  inactiveUserCount: number;
  downgradeCandidateCount: number;
  potentialFreedLicenses: number;
  estimatedMonthlySavings: number;
  estimatedYearlySavings: number;
  inactiveByLicenseType: Record<string, number>;
  downgradesByLicenseType: Record<string, number>;
}

// ===== LEASE REPORT TYPES =====

export interface LeaseReportItem {
  id: number;
  contractNumber: string;
  vendorName: string;
  startDate: string;
  endDate: string;
  monthlyAmount?: number;
  totalValue?: number;
  assetCount: number;
  assets: LeaseAssetItem[];
  status: 'active' | 'expiring' | 'expired';
  daysUntilExpiration?: number;
  notes?: string;
}

export interface LeaseAssetItem {
  assetId: number;
  assetCode: string;
  assetName?: string;
  serialNumber?: string;
}

export interface LeaseReportSummary {
  totalContracts: number;
  activeContracts: number;
  expiringContracts: number;
  expiredContracts: number;
  totalMonthlyAmount: number;
  contractsByVendor: Record<string, number>;
}

export interface LeaseReportFilters {
  status?: 'active' | 'expiring' | 'expired' | 'all';
  vendorId?: number;
  expiringWithinDays?: number;
}

// ===== COMPREHENSIVE ROLLOUT REPORT TYPES =====

/**
 * Complete rollout session report with overview, checklist, and unscheduled assets
 */
export interface RolloutSessionReport {
  sessionId: number;
  sessionName: string;
  startDate: string;
  endDate: string;
  status: string;
  overview: RolloutSessionOverview;
  dayChecklists: RolloutDayChecklist[];
  unscheduledAssets: UnscheduledAsset[];
}

/**
 * Session overview with KPIs and breakdowns
 */
export interface RolloutSessionOverview {
  // Workplace statistics
  totalWorkplaces: number;
  completedWorkplaces: number;
  pendingWorkplaces: number;
  inProgressWorkplaces: number;
  completionPercentage: number;
  // Asset statistics
  totalNewAssets: number;
  installedAssets: number;
  oldAssetsDecommissioned: number;
  qrCodesApplied: number;
  missingQrCodes: number;
  // Breakdowns
  sectorBreakdown: RolloutSectorBreakdown[];
  buildingBreakdown: RolloutBuildingBreakdown[];
  timeline: RolloutProgressTimeline[];
}

/**
 * Sector breakdown with services
 */
export interface RolloutSectorBreakdown {
  sectorId: number;
  sectorName: string;
  totalWorkplaces: number;
  completedWorkplaces: number;
  completionPercentage: number;
  services: RolloutServiceBreakdown[];
}

/**
 * Service breakdown
 */
export interface RolloutServiceBreakdown {
  serviceId: number;
  serviceName: string;
  totalWorkplaces: number;
  completedWorkplaces: number;
  completionPercentage: number;
}

/**
 * Building breakdown
 */
export interface RolloutBuildingBreakdown {
  buildingId: number;
  buildingName: string;
  totalWorkplaces: number;
  completedWorkplaces: number;
  completionPercentage: number;
}

/**
 * Progress timeline point
 */
export interface RolloutProgressTimeline {
  date: string;
  plannedWorkplaces: number;
  completedWorkplaces: number;
  cumulativeCompleted: number;
}

/**
 * Day checklist with workplaces
 */
export interface RolloutDayChecklist {
  dayId: number;
  date: string;
  notes?: string;
  totalWorkplaces: number;
  completedWorkplaces: number;
  workplaces: RolloutWorkplaceChecklist[];
}

/**
 * Workplace checklist item
 */
export interface RolloutWorkplaceChecklist {
  workplaceId: number;
  workplaceName: string;
  location?: string;
  userId?: string;
  userDisplayName?: string;
  userJobTitle?: string;
  serviceName: string;
  buildingName: string;
  status: string;
  completedAt?: string;
  notes?: string;
  hasMissingSerialNumbers: boolean;
  equipmentRows: RolloutEquipmentRow[];
}

/**
 * Equipment row for SWAP checklist (Desktop/Laptop, Docking)
 */
export interface RolloutEquipmentRow {
  assignmentId: number; // For updating serial numbers
  equipmentType: string; // "Desktop/Laptop", "Docking"
  category: string; // UserAssigned, WorkplaceFixed
  // New asset info
  newAssetId?: number;
  newAssetCode?: string;
  newSerialNumber?: string;
  qrCodeApplied?: boolean;
  isSharedDevice: boolean;
  // Old asset info (for swaps)
  oldAssetId?: number;
  oldAssetCode?: string;
  oldSerialNumber?: string;
  // Status indicators
  status: string;
  isMissingSerialNumber: boolean;
}

/**
 * Old asset not yet scheduled in any rollout
 */
export interface UnscheduledAsset {
  assetId: number;
  assetCode: string;
  serialNumber?: string;
  assetTypeName: string;
  primaryUserName?: string;
  primaryUserId?: string;
  serviceName?: string;
  installationDate?: string;
  ageInDays: number;
  priority: string; // High, Medium, Low
}

/**
 * Future swap/planning item
 */
export interface FutureSwap {
  workplaceId: number;
  dayId: number;
  plannedDate: string;
  workplaceName: string;
  userId?: string;
  userDisplayName?: string;
  serviceName: string;
  buildingName: string;
  swapType: string; // Onboarding, Offboarding, Swap
  newAssetCount: number;
  oldAssetCount: number;
}

/**
 * Filter options for rollout reports
 */
export interface RolloutReportFilterOptions {
  services: FilterOption[];
  buildings: FilterOption[];
  statuses: FilterOption[];
  minDate: string;
  maxDate: string;
}

/**
 * Filter option item
 */
export interface FilterOption {
  id: number;
  name: string;
  count: number;
}

/**
 * Excel export request
 */
export interface RolloutExcelExportRequest {
  serviceIds?: number[];
  buildingIds?: number[];
  includeOverview?: boolean;
  includeSwapChecklist?: boolean;
  includeUnscheduledAssets?: boolean;
  includeSectorBreakdown?: boolean;
}

/**
 * Rollout report filters
 */
export interface RolloutReportFilters {
  serviceIds?: number[];
  buildingIds?: number[];
  statuses?: string[];
  dateFrom?: string;
  dateTo?: string;
}

// ===== REPORT TAB TYPES =====

export type ReportTab = 'hardware' | 'rollout' | 'workplaces' | 'swaps' | 'licenses' | 'leasing' | 'serialnumbers';

export interface ReportTabConfig {
  id: ReportTab;
  label: string;
  icon: string;
  description: string;
}

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

// ===== SWAP HISTORY REPORT TYPES =====

export interface SwapHistoryItem {
  id: number;
  swapDate: string;
  userName: string;
  userEmail?: string;
  serviceName?: string;
  technicianName?: string;
  technicianEmail?: string;
  oldAssetCode?: string;
  oldAssetName?: string;
  oldSerialNumber?: string;
  newAssetCode?: string;
  newAssetName?: string;
  newSerialNumber?: string;
  location?: string;
  notes?: string;
  rolloutSessionId?: number;
  rolloutSessionName?: string;
}

export interface SwapHistoryFilters {
  dateFrom?: string;
  dateTo?: string;
  technicianId?: number;
  serviceId?: number;
  searchQuery?: string;
}

export interface SwapHistorySummary {
  totalSwaps: number;
  byTechnician: Record<string, number>;
  byService: Record<string, number>;
  byMonth: Array<{ month: string; count: number }>;
}

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

// ===== REPORT TAB TYPES =====

export type ReportTab = 'hardware' | 'rollout' | 'workplaces' | 'swaps' | 'licenses' | 'leasing';

export interface ReportTabConfig {
  id: ReportTab;
  label: string;
  icon: string;
  description: string;
}

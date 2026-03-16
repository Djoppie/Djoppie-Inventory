/**
 * TypeScript types for Rollout workflow
 * Matches backend DTOs from DjoppieInventory.Core/DTOs/Rollout/
 */

// ===== ENUMS =====

export type RolloutSessionStatus = 'Planning' | 'Ready' | 'InProgress' | 'Completed' | 'Cancelled';
export type RolloutDayStatus = 'Planning' | 'Ready' | 'Completed';
export type RolloutWorkplaceStatus = 'Pending' | 'Ready' | 'InProgress' | 'Completed' | 'Skipped' | 'Failed';
export type EquipmentType = 'laptop' | 'desktop' | 'docking' | 'monitor' | 'keyboard' | 'mouse';
export type AssetPlanStatus = 'pending' | 'installed' | 'skipped';

// ===== SESSION TYPES =====

export interface RolloutSession {
  id: number;
  sessionName: string;
  description?: string;
  status: RolloutSessionStatus;
  plannedStartDate: string;
  plannedEndDate?: string;
  startedAt?: string;
  completedAt?: string;
  createdBy: string;
  createdByEmail: string;
  createdAt: string;
  updatedAt: string;
  totalDays: number;
  totalWorkplaces: number;
  completedWorkplaces: number;
  completionPercentage: number;
  days?: RolloutDay[];
}

export interface CreateRolloutSession {
  sessionName: string;
  description?: string;
  plannedStartDate: string;
  plannedEndDate?: string;
}

export interface UpdateRolloutSession {
  sessionName: string;
  description?: string;
  status: RolloutSessionStatus;
  plannedStartDate: string;
  plannedEndDate?: string;
}

// ===== DAY TYPES =====

export interface RolloutDay {
  id: number;
  rolloutSessionId: number;
  date: string;
  name?: string;
  dayNumber: number;
  scheduledServiceIds: number[];
  status: RolloutDayStatus;
  totalWorkplaces: number;
  completedWorkplaces: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  workplaces?: RolloutWorkplace[];
}

export interface CreateRolloutDay {
  rolloutSessionId: number;
  date: string;
  name?: string;
  dayNumber: number;
  scheduledServiceIds: number[];
  notes?: string;
}

export interface UpdateRolloutDay {
  date: string;
  name?: string;
  dayNumber: number;
  scheduledServiceIds: number[];
  notes?: string;
}

// ===== WORKPLACE TYPES =====

export interface RolloutWorkplace {
  id: number;
  rolloutDayId: number;
  userName: string;
  userEmail?: string;
  location?: string;
  /** Custom scheduled date for this workplace. When null, uses the date from RolloutDay. */
  scheduledDate?: string;
  serviceId?: number;
  serviceName?: string;
  isLaptopSetup: boolean;
  assetPlans: AssetPlan[];
  status: RolloutWorkplaceStatus;
  totalItems: number;
  completedItems: number;
  completedAt?: string;
  completedBy?: string;
  completedByEmail?: string;
  notes?: string;
  /** If this workplace was moved to another day, this points to the new workplace ID (ghost entry) */
  movedToWorkplaceId?: number;
  /** If this workplace was moved from another day, this points to the original workplace ID */
  movedFromWorkplaceId?: number;
  /** The date this workplace was moved to (for ghost entry display) */
  movedToDate?: string;
  /** The date this workplace was moved from (for moved indicator display) */
  movedFromDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRolloutWorkplace {
  rolloutDayId: number;
  userName: string;
  userEmail?: string;
  location?: string;
  /** Custom scheduled date for this workplace. When null, uses the date from RolloutDay. */
  scheduledDate?: string;
  serviceId?: number;
  isLaptopSetup: boolean;
  assetPlans: AssetPlan[];
  notes?: string;
}

export interface UpdateRolloutWorkplace {
  userName: string;
  userEmail?: string | null;
  location?: string | null;
  /** Custom scheduled date for this workplace. When null, uses the date from RolloutDay. */
  scheduledDate?: string | null;
  serviceId?: number | null;
  isLaptopSetup: boolean;
  assetPlans: AssetPlan[];
  status: RolloutWorkplaceStatus;
  notes?: string | null;
}

export interface CompleteWorkplace {
  notes?: string;
}

// ===== ASSET PLAN TYPES =====

export interface AssetPlan {
  equipmentType: EquipmentType;
  existingAssetId?: number;
  existingAssetCode?: string;
  existingAssetName?: string;
  oldAssetId?: number;
  oldAssetCode?: string;
  oldAssetName?: string;
  createNew: boolean;
  brand?: string;
  model?: string;
  metadata: Record<string, string>;
  status: AssetPlanStatus;
  requiresSerialNumber: boolean;
  requiresQRCode: boolean;
}

// ===== PROGRESS & REPORTING TYPES =====

export interface RolloutProgress {
  sessionId: number;
  sessionName: string;
  status: RolloutSessionStatus;
  totalDays: number;
  totalWorkplaces: number;
  completedWorkplaces: number;
  pendingWorkplaces: number;
  inProgressWorkplaces: number;
  skippedWorkplaces: number;
  failedWorkplaces: number;
  completionPercentage: number;
  dayProgress: DayProgress[];
}

export interface DayProgress {
  dayId: number;
  date: string;
  name?: string;
  totalWorkplaces: number;
  completedWorkplaces: number;
  completionPercentage: number;
}

// ===== HELPER TYPES =====

export interface RolloutSessionsQueryParams {
  status?: RolloutSessionStatus;
}

export interface RolloutSessionQueryParams {
  includeDays?: boolean;
  includeWorkplaces?: boolean;
}

export interface RolloutDaysQueryParams {
  includeWorkplaces?: boolean;
}

export interface RolloutWorkplacesQueryParams {
  status?: RolloutWorkplaceStatus;
}

// ===== BULK OPERATION TYPES =====

export interface BulkCreateWorkplaces {
  count: number;
  serviceId: number;
  sectorId?: number;
  isLaptopSetup: boolean;
  assetPlanConfig: StandardAssetPlanConfig;
}

export interface StandardAssetPlanConfig {
  includeLaptop: boolean;
  includeDesktop: boolean;
  includeDocking: boolean;
  monitorCount: number;
  includeKeyboard: boolean;
  includeMouse: boolean;
  // Optional template IDs for each equipment type
  laptopTemplateId?: number;
  desktopTemplateId?: number;
  dockingTemplateId?: number;
  monitorTemplateId?: number;
  keyboardTemplateId?: number;
  mouseTemplateId?: number;
}

export interface BulkCreateWorkplacesResult {
  created: number;
  workplaces: RolloutWorkplace[];
}

// ===== GRAPH API TYPES =====

export interface GraphUser {
  id: string;
  displayName: string;
  userPrincipalName?: string;
  mail?: string;
  department?: string;
  officeLocation?: string;
  jobTitle?: string;
}

export interface GraphGroup {
  id: string;
  displayName: string;
  serviceName: string;
  description?: string;
  mail?: string;
}

export interface BulkCreateFromGraph {
  department?: string;
  groupId?: string;
  serviceId: number;
  selectedUserIds?: string[];
  assetPlanConfig: StandardAssetPlanConfig;
}

export interface BulkCreateFromGraphResult {
  created: number;
  skipped: number;
  workplaces: RolloutWorkplace[];
  skippedUsers: string[];
}

// ===== EXECUTION TYPES =====

export interface UpdateItemDetails {
  serialNumber?: string;
  oldSerialNumber?: string;
  brand?: string;
  model?: string;
  userName?: string;
  markAsInstalled?: boolean;
}

// ===== MOVE WORKPLACE TYPES =====

export interface MoveWorkplace {
  targetDate: string;
}

export interface MoveWorkplaceResult {
  /** The new workplace on the target day */
  workplace: RolloutWorkplace;
  /** The original workplace that remains as a ghost entry on the source day */
  ghostWorkplace: RolloutWorkplace;
  sourceDayId: number;
  targetDayId: number;
  targetDate: string;
  dayCreated: boolean;
  targetDayName: string;
}

// ===== ASSET STATUS REPORT TYPES =====

/**
 * Report showing all asset status changes for a rollout session
 */
export interface RolloutAssetStatusReport {
  sessionId: number;
  sessionName: string;
  generatedAt: string;
  totalAssetsDeployed: number;
  totalAssetsDecommissioned: number;
  totalWorkplacesCompleted: number;
  assetChanges: RolloutAssetChange[];
  daySummaries: RolloutDayAssetSummary[];
}

/**
 * Individual asset status change record
 */
export interface RolloutAssetChange {
  assetId: number;
  assetCode: string;
  assetName?: string;
  equipmentType: string;
  serialNumber?: string;
  brand?: string;
  model?: string;
  oldStatus: string;
  newStatus: string;
  changeType: 'InGebruik' | 'UitDienst';
  workplaceId: number;
  userName: string;
  userEmail?: string;
  location?: string;
  serviceName?: string;
  dayId: number;
  dayNumber: number;
  date: string;
  completedBy: string;
  completedByEmail?: string;
  completedAt: string;
}

/**
 * Per-day asset summary for overview section
 */
export interface RolloutDayAssetSummary {
  dayId: number;
  dayNumber: number;
  date: string;
  dayName?: string;
  assetsDeployed: number;
  assetsDecommissioned: number;
  workplacesCompleted: number;
  workplaceSummaries: RolloutWorkplaceAssetSummary[];
}

/**
 * Per-workplace asset summary
 */
export interface RolloutWorkplaceAssetSummary {
  workplaceId: number;
  userName: string;
  location?: string;
  assetsDeployed: number;
  assetsDecommissioned: number;
  completedBy: string;
  completedAt?: string;
}

// ===== ASSIGNMENT TYPES =====

/**
 * Asset assignment for a workplace
 */
export interface AssetAssignment {
  id: number;
  workplaceId: number;
  assetId?: number;
  assetCode?: string;
  assetName?: string;
  equipmentType: EquipmentType;
  assignmentType: 'new' | 'existing' | 'return';
  serialNumber?: string;
  brand?: string;
  model?: string;
  templateId?: number;
  templateName?: string;
  status: 'pending' | 'assigned' | 'installed' | 'returned' | 'skipped';
  assignedAt?: string;
  assignedBy?: string;
  installedAt?: string;
  installedBy?: string;
  notes?: string;
}

/**
 * Create a new asset assignment
 */
export interface CreateAssetAssignment {
  workplaceId: number;
  equipmentType: EquipmentType;
  assignmentType: 'new' | 'existing' | 'return';
  assetId?: number;
  templateId?: number;
  serialNumber?: string;
  brand?: string;
  model?: string;
  notes?: string;
}

/**
 * Update an existing asset assignment
 */
export interface UpdateAssetAssignment {
  assetId?: number;
  serialNumber?: string;
  brand?: string;
  model?: string;
  status?: 'pending' | 'assigned' | 'installed' | 'returned' | 'skipped';
  notes?: string;
}

/**
 * Workplace assignments summary
 */
export interface WorkplaceAssignmentsSummary {
  workplaceId: number;
  userName: string;
  totalAssignments: number;
  pendingAssignments: number;
  completedAssignments: number;
  assignments: AssetAssignment[];
}

// ===== VIEW PREFERENCE TYPES =====

/**
 * Planning view mode preference
 */
export type PlanningViewMode = 'calendar' | 'list';

/**
 * Planning list view filter options
 */
export interface PlanningListFilters {
  status?: RolloutDayStatus | 'all';
  serviceId?: number;
  dateFrom?: string;
  dateTo?: string;
  searchQuery?: string;
}

/**
 * Planning list sort configuration
 */
export interface PlanningListSort {
  field: 'date' | 'name' | 'workplaces' | 'status' | 'completion';
  direction: 'asc' | 'desc';
}

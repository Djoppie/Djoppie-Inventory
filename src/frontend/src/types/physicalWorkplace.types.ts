/**
 * Physical Workplace types for managing permanent workstation locations.
 * These represent fixed desk/workstation locations where equipment is installed.
 */

// ============================================================
// WorkplaceType - Type of physical workplace
// ============================================================

export enum WorkplaceType {
  Desktop = 0,      // Fixed desktop PC setup
  Laptop = 1,       // Docking station for laptops
  HotDesk = 2,      // Shared/flexible workplace
  MeetingRoom = 3   // Conference room
}

export const WorkplaceTypeLabels: Record<WorkplaceType, string> = {
  [WorkplaceType.Desktop]: 'Desktop',
  [WorkplaceType.Laptop]: 'Laptop werkplek',
  [WorkplaceType.HotDesk]: 'Flexwerkplek',
  [WorkplaceType.MeetingRoom]: 'Vergaderzaal',
};

// ============================================================
// PhysicalWorkplace - Permanent workstation location
// ============================================================

export interface PhysicalWorkplace {
  [key: string]: unknown;
  id: number;
  code: string;
  name: string;
  description?: string;
  buildingId: number;
  buildingName?: string;
  buildingCode?: string;
  serviceId?: number;
  serviceName?: string;
  floor?: string;
  room?: string;
  type: WorkplaceType;
  monitorCount: number;
  hasDockingStation: boolean;
  // Equipment slots
  dockingStationAssetId?: number;
  dockingStationAssetCode?: string;
  dockingStationSerialNumber?: string;
  monitor1AssetId?: number;
  monitor1AssetCode?: string;
  monitor1SerialNumber?: string;
  monitor2AssetId?: number;
  monitor2AssetCode?: string;
  monitor2SerialNumber?: string;
  monitor3AssetId?: number;
  monitor3AssetCode?: string;
  monitor3SerialNumber?: string;
  keyboardAssetId?: number;
  keyboardAssetCode?: string;
  keyboardSerialNumber?: string;
  mouseAssetId?: number;
  mouseAssetCode?: string;
  mouseSerialNumber?: string;
  // Occupant info
  currentOccupantEntraId?: string;
  currentOccupantName?: string;
  currentOccupantEmail?: string;
  occupiedSince?: string;
  // Occupant's device info
  occupantDeviceSerial?: string;
  occupantDeviceBrand?: string;
  occupantDeviceModel?: string;
  occupantDeviceAssetCode?: string;
  isActive: boolean;
  fixedAssetCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PhysicalWorkplaceSummary {
  id: number;
  code: string;
  name: string;
  buildingId?: number;
  buildingName?: string;
  serviceId?: number;
  serviceName?: string;
  floor?: string;
  currentOccupantName?: string;
  currentOccupantEmail?: string;
  isActive: boolean;
  // Equipment summary
  fixedAssetCount?: number;
  hasDockingStation?: boolean;
  monitorCount?: number;
  dockingStationAssetCode?: string;
  monitor1AssetCode?: string;
  monitor2AssetCode?: string;
}

// ============================================================
// DTOs for CRUD operations
// ============================================================

export interface CreatePhysicalWorkplaceDto {
  code: string;
  name: string;
  description?: string;
  buildingId: number;
  serviceId?: number;
  floor?: string;
  room?: string;
  type?: WorkplaceType;
  monitorCount?: number;
  hasDockingStation?: boolean;
}

export interface UpdatePhysicalWorkplaceDto {
  code?: string;
  name?: string;
  description?: string;
  buildingId?: number;
  serviceId?: number;
  floor?: string;
  room?: string;
  type?: WorkplaceType;
  monitorCount?: number;
  hasDockingStation?: boolean;
  isActive?: boolean;
}

export interface UpdateOccupantDto {
  occupantEntraId?: string;
  occupantName?: string;
  occupantEmail?: string;
}

export interface UpdateEquipmentSlotsDto {
  dockingStationAssetId?: number | null;
  monitor1AssetId?: number | null;
  monitor2AssetId?: number | null;
  monitor3AssetId?: number | null;
  keyboardAssetId?: number | null;
  mouseAssetId?: number | null;
}

// ============================================================
// Query filters
// ============================================================

export interface PhysicalWorkplaceFilters {
  buildingId?: number;
  serviceId?: number;
  isActive?: boolean;
  hasOccupant?: boolean;
}

// ============================================================
// Fixed asset at workplace (from GetFixedAssets endpoint)
// ============================================================

export interface WorkplaceFixedAsset {
  id: number;
  assetCode: string;
  assetName: string;
  assetType: string;
  brand?: string;
  model?: string;
  serialNumber?: string;
  status: string;
}

// ============================================================
// Statistics types for Dashboard Widgets
// ============================================================

/**
 * Overall workplace statistics for dashboard overview widget
 */
export interface WorkplaceStatistics {
  totalWorkplaces: number;
  activeWorkplaces: number;
  occupiedWorkplaces: number;
  vacantWorkplaces: number;
  occupancyRate: number;
  equipment: EquipmentStatistics;
}

/**
 * Equipment slot statistics across all workplaces
 */
export interface EquipmentStatistics {
  totalDockingSlots: number;
  filledDockingSlots: number;
  totalMonitorSlots: number;
  filledMonitorSlots: number;
  totalKeyboardSlots: number;
  filledKeyboardSlots: number;
  totalMouseSlots: number;
  filledMouseSlots: number;
  overallEquipmentRate: number;
}

/**
 * Occupancy statistics grouped by building
 */
export interface BuildingOccupancy {
  buildingId: number;
  buildingName: string;
  buildingCode?: string;
  totalWorkplaces: number;
  occupiedWorkplaces: number;
  vacantWorkplaces: number;
  occupancyRate: number;
}

/**
 * Occupancy statistics grouped by service
 */
export interface ServiceOccupancy {
  serviceId?: number;
  serviceName?: string;
  serviceCode?: string;
  totalWorkplaces: number;
  occupiedWorkplaces: number;
  vacantWorkplaces: number;
  occupancyRate: number;
}

/**
 * Recent workplace change event for activity feed
 */
export interface WorkplaceChange {
  workplaceId: number;
  workplaceCode: string;
  workplaceName: string;
  changeType: 'occupancy' | 'equipment';
  description: string;
  userName?: string;
  assetCode?: string;
  changedAt: string;
}

/**
 * Equipment status by type for equipment distribution widget
 */
export interface EquipmentTypeStatus {
  equipmentType: string;
  displayName: string;
  totalSlots: number;
  filledSlots: number;
  emptySlots: number;
  fillRate: number;
}

// ============================================================
// Workplace Gap Analysis Types
// ============================================================

/**
 * Summary statistics for workplace gap analysis
 */
export interface WorkplaceGapAnalysis {
  /** Total laptops with status InGebruik that have an owner */
  totalLaptopsInUse: number;
  /** Laptop owners who have a matching PhysicalWorkplace */
  ownersWithWorkplace: number;
  /** Laptop owners who don't have a PhysicalWorkplace */
  ownersWithoutWorkplace: number;
  /** Percentage of owners without workplace */
  gapPercentage: number;
  /** List of owners without workplaces, grouped by service */
  gapsByService: WorkplaceGapByService[];
  /** Detailed list of orphan owners (limited) */
  orphanOwners: OrphanLaptopOwner[];
  /** Debug info for troubleshooting */
  debug?: WorkplaceGapDebug;
}

/**
 * Debug information for troubleshooting gap analysis
 */
export interface WorkplaceGapDebug {
  /** Total active workplaces */
  totalActiveWorkplaces: number;
  /** Workplaces with CurrentOccupantEmail set */
  workplacesWithOccupant: number;
  /** Workplaces without CurrentOccupantEmail */
  workplacesWithoutOccupant: number;
  /** Sample laptop owner emails */
  sampleLaptopOwners: string[];
  /** Sample occupant emails */
  sampleOccupantEmails: string[];
}

/**
 * Workplace gap statistics grouped by service/department
 */
export interface WorkplaceGapByService {
  serviceId?: number;
  serviceName?: string;
  serviceCode?: string;
  ownersWithoutWorkplace: number;
  totalLaptopOwners: number;
}

/**
 * Details about a laptop owner who doesn't have a PhysicalWorkplace
 */
export interface OrphanLaptopOwner {
  ownerEmail: string;
  ownerName?: string;
  jobTitle?: string;
  officeLocation?: string;
  serviceId?: number;
  serviceName?: string;
  laptopAssetId: number;
  laptopAssetCode: string;
  laptopBrand?: string;
  laptopModel?: string;
  laptopSerialNumber?: string;
}

/**
 * Request DTO for auto-creating missing workplaces
 */
export interface AutoCreateMissingWorkplacesDto {
  /** Default building ID for new workplaces (required) */
  defaultBuildingId: number;
  /** Optional: only create for specific service IDs */
  serviceIds?: number[];
  /** Optional: limit number to create (default: 100) */
  maxToCreate?: number;
  /** Workplace type for new workplaces (default: Laptop) */
  workplaceType?: WorkplaceType;
  /** Number of monitors for new workplaces (default: 2) */
  monitorCount?: number;
  /** Whether new workplaces have docking stations (default: true) */
  hasDockingStation?: boolean;
}

/**
 * Result of auto-creating missing workplaces
 */
export interface AutoCreateWorkplacesResult {
  totalProcessed: number;
  successCount: number;
  errorCount: number;
  results: AutoCreateWorkplaceItemResult[];
}

/**
 * Result for a single auto-created workplace
 */
export interface AutoCreateWorkplaceItemResult {
  workplaceId?: number;
  workplaceCode: string;
  workplaceName: string;
  ownerEmail: string;
  ownerName?: string;
  success: boolean;
  errorMessage?: string;
}

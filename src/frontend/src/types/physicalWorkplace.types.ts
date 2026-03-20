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
  isActive: boolean;
  fixedAssetCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PhysicalWorkplaceSummary {
  id: number;
  code: string;
  name: string;
  buildingName?: string;
  serviceName?: string;
  currentOccupantName?: string;
  isActive: boolean;
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

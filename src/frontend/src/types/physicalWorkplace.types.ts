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

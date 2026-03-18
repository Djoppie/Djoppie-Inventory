import type { UpdateEquipmentSlotsDto } from './physicalWorkplace.types';

/**
 * Mode of operation for device deployment
 */
export enum DeploymentMode {
  /** Onboarding - New user gets a device (no old device) */
  Onboarding = 0,
  /** Swap - Replace old device with new device */
  Swap = 1,
}

/**
 * Request DTO for executing a laptop swap or onboarding operation
 */
export interface ExecuteDeploymentRequest {
  /** Mode: Onboarding (no old laptop) or Swap (replace old laptop) */
  mode: DeploymentMode;
  /** Old laptop asset ID (required for Swap mode, null for Onboarding) */
  oldLaptopAssetId?: number | null;
  /** New laptop asset ID to assign to user */
  newLaptopAssetId: number;
  /** Entra ID (Azure AD) of the user receiving the laptop */
  newOwnerEntraId: string;
  /** Display name of the user */
  newOwnerName: string;
  /** Email address of the user */
  newOwnerEmail: string;
  /** Optional job title from Entra ID */
  newOwnerJobTitle?: string;
  /** Optional office location from Entra ID */
  newOwnerOfficeLocation?: string;
  /** Optional physical workplace ID to update occupant and equipment */
  physicalWorkplaceId?: number | null;
  /** Whether to update equipment slots on the workplace */
  updateEquipmentSlots: boolean;
  /** Equipment slot assignments (if updateEquipmentSlots is true) */
  equipmentSlots?: UpdateEquipmentSlotsDto | null;
  /** Optional notes about the deployment */
  notes?: string;
}

/**
 * Response DTO for deployment operation result
 */
export interface DeploymentResult {
  success: boolean;
  deploymentId: string;
  mode: DeploymentMode;
  oldLaptop?: AssetDeploymentSummary | null;
  newLaptop: AssetDeploymentSummary;
  physicalWorkplace?: WorkplaceDeploymentSummary | null;
  assetEventsCreated: AssetEventSummary[];
  timestamp: string;
}

/**
 * Summary of asset changes in deployment
 */
export interface AssetDeploymentSummary {
  assetId: number;
  assetCode: string;
  serialNumber?: string;
  oldStatus: string;
  newStatus: string;
  oldOwner?: string;
  newOwner?: string;
  installationDate?: string;
}

/**
 * Summary of workplace changes in deployment
 */
export interface WorkplaceDeploymentSummary {
  id: number;
  code: string;
  name?: string;
  equipmentUpdated: boolean;
  occupantUpdated: boolean;
  previousOccupant?: string;
  newOccupant?: string;
}

/**
 * Summary of created asset event
 */
export interface AssetEventSummary {
  eventId: number;
  assetId: number;
  eventType: string;
  description: string;
}

/**
 * Occupant conflict information when workplace has different occupant
 */
export interface OccupantConflict {
  currentOccupantName: string;
  currentOccupantEmail?: string;
  occupiedSince?: string;
  requestedOccupantName: string;
  requestedOccupantEmail: string;
}

/**
 * Occupant conflict response from API (409)
 */
export interface OccupantConflictResponse {
  type: 'conflict';
  message: string;
  currentOccupant: {
    name?: string;
    email?: string;
    occupiedSince?: string;
  };
  requestedOccupant: {
    name?: string;
    email?: string;
  };
}

/**
 * Item in deployment history report
 */
export interface DeploymentHistoryItem {
  id: number;
  deploymentDate: string;
  mode: DeploymentMode;
  oldLaptop?: DeploymentAssetInfo | null;
  newLaptop: DeploymentAssetInfo;
  owner: DeploymentOwnerInfo;
  physicalWorkplace?: DeploymentWorkplaceInfo | null;
  performedBy?: string;
  performedByEmail?: string;
  notes?: string;
}

/**
 * Asset info for history display
 */
export interface DeploymentAssetInfo {
  assetId: number;
  assetCode: string;
  serialNumber?: string;
  brand?: string;
  model?: string;
  previousStatus: string;
  newStatus: string;
}

/**
 * Owner info for history display
 */
export interface DeploymentOwnerInfo {
  name: string;
  email: string;
  entraId?: string;
}

/**
 * Workplace info for history display
 */
export interface DeploymentWorkplaceInfo {
  id: number;
  code: string;
  name?: string;
  buildingName?: string;
}

/**
 * Paged result for deployment history
 */
export interface DeploymentHistoryResult {
  items: DeploymentHistoryItem[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

/**
 * Parameters for fetching deployment history
 */
export interface DeploymentHistoryParams {
  fromDate?: string;
  toDate?: string;
  ownerEmail?: string;
  mode?: DeploymentMode;
  pageNumber?: number;
  pageSize?: number;
}

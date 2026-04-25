export enum AssetStatus {
  InGebruik = 'InGebruik',
  Stock = 'Stock',
  Herstelling = 'Herstelling',
  Defect = 'Defect',
  UitDienst = 'UitDienst',
  Nieuw = 'Nieuw'
}

/**
 * The kind of location chain currently surfaced for an asset.
 * Mirrors the backend enum on EffectiveLocationDto.
 */
export enum LocationChainKind {
  None = 'None',
  Employee = 'Employee',
  Workplace = 'Workplace',
  Stock = 'Stock',
}

export interface EffectiveLocationDto {
  kind: LocationChainKind;

  employeeId?: number;
  employeeName?: string;
  employeeJobTitle?: string;

  physicalWorkplaceId?: number;
  physicalWorkplaceCode?: string;
  physicalWorkplaceName?: string;

  buildingId?: number;
  buildingName?: string;
  buildingAddress?: string;

  serviceId?: number;
  serviceName?: string;
  sectorName?: string;

  installationLocation?: string;
}

export interface Asset {
  id: number;
  assetCode: string;
  assetName: string; // Official device name (DeviceName) - auto-fetched from Intune
  alias?: string; // Optional readable name
  category: string;
  isDummy: boolean;

  // Relational fields
  assetTypeId?: number;
  assetType?: { id: number; code: string; name: string; categoryId?: number };
  serviceId?: number;
  service?: { id: number; code: string; name: string }; // Service is used as location
  installationLocation?: string; // Specific location details (e.g., room number)
  buildingId?: number;
  building?: {
    id: number;
    code: string;
    name: string;
    address?: string;
  };
  physicalWorkplaceId?: number; // Physical workplace this asset is assigned to
  physicalWorkplace?: {
    id: number;
    code: string;
    name: string;
    currentOccupantName?: string;
    serviceName?: string;
    sectorName?: string;
    buildingName?: string;
    floor?: string;
  };

  // Legacy fields (for historical data)
  legacyBuilding?: string;
  legacyDepartment?: string;

  // Employee assignment (new - foreign key relationship)
  employeeId?: number;
  employee?: {
    id: number;
    entraId: string;
    displayName: string;
    email?: string;
    jobTitle?: string;
    serviceId?: number;
    serviceName?: string;
    physicalWorkplaceId?: number;
    physicalWorkplaceCode?: string;
  };

  // Legacy user assignment fields (for backwards compatibility)
  owner?: string; // Legacy field - prefer using employeeId
  officeLocation?: string;
  jobTitle?: string;
  status: AssetStatus;
  brand?: string;
  model?: string;
  serialNumber?: string; // Optional - can be filled in later
  purchaseDate?: string;
  warrantyExpiry?: string;
  installationDate?: string;
  leaseEndDate?: string; // Lease expiration date for tracking device replacements

  // Intune integration fields (synced from Microsoft Intune for laptops/desktops)
  intuneEnrollmentDate?: string;
  intuneLastCheckIn?: string;
  intuneCertificateExpiry?: string;
  intuneSyncedAt?: string;

  createdAt: string;
  updatedAt: string;

  /**
   * Computed location chain for the UI. Reflects the canonical
   * Asset → Employee → Workplace → Building (or
   * Asset → Workplace → Building) graph so the frontend can render one
   * AssetLocationChain component everywhere.
   */
  effectiveLocation?: EffectiveLocationDto;
}

/**
 * DTO for creating a single asset. Owner / employee / building /
 * workplace / status / installation-date are intentionally absent —
 * those flow through the dedicated assignment endpoints.
 */
export interface CreateAssetDto {
  assetTypeId: number;          // REQUIRED
  serialNumber?: string;
  assetName?: string;
  alias?: string;
  category?: string;
  isDummy?: boolean;
  brand?: string;
  model?: string;
  purchaseDate?: string;
  warrantyExpiry?: string;
}

/**
 * DTO for updating an asset's intrinsic properties only. Status,
 * owner, employee, location must use the assignment endpoints.
 */
export interface UpdateAssetDto {
  assetName?: string;
  alias?: string;
  category?: string;
  assetTypeId?: number;
  brand?: string;
  model?: string;
  serialNumber?: string;
  purchaseDate?: string;
  warrantyExpiry?: string;
}

export interface AssetTemplate {
  id: number;
  templateName: string;
  assetName?: string;
  category?: string;

  assetTypeId?: number;
  assetType?: { id: number; code: string; name: string; categoryId?: number };
  serviceId?: number;
  service?: { id: number; code: string; name: string };
  installationLocation?: string;
  status?: string;

  brand?: string;
  model?: string;
  owner?: string;
  purchaseDate?: string;
  warrantyExpiry?: string;
  installationDate?: string;
}

export interface CreateAssetTemplateDto {
  templateName: string;
  assetName?: string;
  category?: string;

  assetTypeId?: number;
  serviceId?: number;
  installationLocation?: string;
  status?: string;

  brand?: string;
  model?: string;
  owner?: string;
  purchaseDate?: string;
  warrantyExpiry?: string;
  installationDate?: string;
}

export interface UpdateAssetTemplateDto {
  templateName: string;
  assetName?: string;
  category?: string;

  assetTypeId?: number;
  serviceId?: number;
  installationLocation?: string;
  status?: string;

  brand?: string;
  model?: string;
  owner?: string;
  purchaseDate?: string;
  warrantyExpiry?: string;
  installationDate?: string;
}

/**
 * Bulk-create DTO mirrors single create — no owner / location / status.
 */
export interface BulkCreateAssetDto {
  assetTypeId: number;
  quantity: number;
  isDummy?: boolean;
  templateId?: number;
  serialNumberPrefix?: string;
  assetName?: string;
  alias?: string;
  category?: string;
  brand?: string;
  model?: string;
  purchaseDate?: string;
  warrantyExpiry?: string;
}

export interface BulkCreateAssetResultDto {
  totalRequested: number;
  successfullyCreated: number;
  failed: number;
  createdAssets: Asset[];
  errors: string[];
  isFullySuccessful: boolean;
}

/**
 * Bulk update only handles intrinsic properties (brand, model,
 * purchase / warranty dates). Status / owner / location → assignment
 * endpoints, called per-asset by the bulk-assign affordances in PR5.
 */
export interface BulkUpdateAssetsDto {
  assetIds: number[];
  purchaseDate?: string;
  updatePurchaseDate: boolean;
  warrantyExpiry?: string;
  updateWarrantyExpiry: boolean;
  brand?: string;
  updateBrand: boolean;
  model?: string;
  updateModel: boolean;
}

export interface BulkUpdateAssetsResultDto {
  updatedCount: number;
  totalRequested: number;
  updatedIds: number[];
  failedIds: number[];
  errors: string[];
}

export interface BulkDeleteAssetsDto {
  assetIds: number[];
}

export interface BulkDeleteAssetsResultDto {
  deletedCount: number;
  totalRequested: number;
  deletedIds: number[];
  failedIds: number[];
  errors: string[];
}

// ===== Assignment-endpoint payloads =====

export interface AssignAssetToEmployeeDto {
  employeeId: number;
  installationDate?: string;
  notes?: string;
}

export interface AssignAssetToWorkplaceDto {
  physicalWorkplaceId: number;
  installationDate?: string;
  installationLocation?: string;
  notes?: string;
}

export interface UnassignAssetDto {
  /** Defaults to AssetStatus.Stock when omitted. */
  targetStatus?: AssetStatus;
  reason?: string;
}

export interface ChangeAssetStatusDto {
  newStatus: AssetStatus;
  /** Honoured only for callers in the admin role — bypasses the state machine. */
  adminOverride?: boolean;
  reason?: string;
}

/**
 * Generic paginated result type matching the backend PagedResultDto<T>
 */
export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

/**
 * Pagination parameters for API requests
 */
export interface PaginationParams {
  pageNumber?: number;
  pageSize?: number;
}

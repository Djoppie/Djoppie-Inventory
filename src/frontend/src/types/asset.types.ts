export enum AssetStatus {
  InGebruik = 'InGebruik',
  Stock = 'Stock',
  Herstelling = 'Herstelling',
  Defect = 'Defect',
  UitDienst = 'UitDienst',
  Nieuw = 'Nieuw'
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
  assetType?: { id: number; code: string; name: string };
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

  // Existing fields
  owner?: string; // Primary user (optional)
  officeLocation?: string;
  jobTitle?: string;
  status: AssetStatus;
  brand?: string;
  model?: string;
  serialNumber?: string; // Optional - can be filled in later
  purchaseDate?: string;
  warrantyExpiry?: string;
  installationDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAssetDto {
  assetTypeId: number; // REQUIRED - determines TYPE component of auto-generated asset code
  serialNumber?: string; // Optional - can be filled in later
  assetName?: string; // Official device name (DeviceName) - auto-fetched from Intune
  alias?: string; // Optional readable name
  category: string;
  isDummy?: boolean;

  // Relational fields
  serviceId?: number; // Service is used as location
  installationLocation?: string; // Specific location details (e.g., room number)
  buildingId?: number; // Building where the asset is located
  physicalWorkplaceId?: number; // Physical workplace for workplace-fixed assets

  // User assignment fields
  owner?: string; // Primary user (optional)
  officeLocation?: string;
  jobTitle?: string;

  status?: AssetStatus | string; // Support both enum and string for flexibility
  brand?: string;
  model?: string;
  purchaseDate?: string;
  warrantyExpiry?: string;
  installationDate?: string;
}

export interface UpdateAssetDto {
  assetName?: string; // Official device name (DeviceName) - auto-fetched from Intune
  alias?: string; // Optional readable name

  // Relational fields
  assetTypeId?: number;
  serviceId?: number; // Service is used as location
  installationLocation?: string; // Specific location details (e.g., room number)
  buildingId?: number; // Building where the asset is located
  physicalWorkplaceId?: number; // Physical workplace for workplace-fixed assets

  // User assignment fields
  owner?: string; // Primary user (optional)
  officeLocation?: string;
  jobTitle?: string;

  status?: AssetStatus | string; // Support both enum and string for flexibility
  brand?: string;
  model?: string;
  serialNumber?: string; // Can be updated, but must remain unique
  category?: string;
  purchaseDate?: string;
  warrantyExpiry?: string;
  installationDate?: string;
}

export interface AssetTemplate {
  id: number;
  templateName: string;
  assetName?: string;  // Optional - alias/description
  category?: string;  // Optional - derived from AssetType

  // Relational fields
  assetTypeId?: number;
  assetType?: { id: number; code: string; name: string };
  serviceId?: number;
  service?: { id: number; code: string; name: string };
  installationLocation?: string;
  status?: string;

  brand?: string;
  model?: string;
  owner?: string;  // Optional - default primary user
  purchaseDate?: string;
  warrantyExpiry?: string;
  installationDate?: string;
}

export interface CreateAssetTemplateDto {
  templateName: string;
  assetName?: string;  // Optional - alias/description
  category?: string;  // Optional - derived from AssetType

  assetTypeId?: number;
  serviceId?: number;
  installationLocation?: string;
  status?: string;

  brand?: string;
  model?: string;
  owner?: string;  // Optional - default primary user
  purchaseDate?: string;
  warrantyExpiry?: string;
  installationDate?: string;
}

export interface UpdateAssetTemplateDto {
  templateName: string;
  assetName?: string;  // Optional - alias/description
  category?: string;  // Optional - derived from AssetType

  assetTypeId?: number;
  serviceId?: number;
  installationLocation?: string;
  status?: string;

  brand?: string;
  model?: string;
  owner?: string;  // Optional - default primary user
  purchaseDate?: string;
  warrantyExpiry?: string;
  installationDate?: string;
}

export interface BulkCreateAssetDto {
  assetTypeId: number; // REQUIRED - determines TYPE component of auto-generated asset codes
  serialNumberPrefix?: string; // Optional - prefix for generating serial numbers
  quantity: number;
  isDummy?: boolean;
  templateId?: number;
  assetName?: string; // Official device name (DeviceName)
  alias?: string; // Optional readable name
  category?: string; // Optional - derived from AssetType

  // Relational fields
  serviceId?: number; // Service/department (optional)
  installationLocation?: string; // Specific location details (optional)

  owner?: string; // Primary user (optional)
  status?: AssetStatus | string; // Support both enum and string for flexibility
  brand?: string;
  model?: string;
  purchaseDate?: string;
  warrantyExpiry?: string;
  installationDate?: string;
}

export interface BulkCreateAssetResultDto {
  totalRequested: number;
  successfullyCreated: number;
  failed: number;
  createdAssets: Asset[];
  errors: string[];
  isFullySuccessful: boolean;
}

export interface BulkUpdateAssetsDto {
  assetIds: number[];
  serviceId?: number;
  updateServiceId: boolean;
  purchaseDate?: string;
  updatePurchaseDate: boolean;
  installationDate?: string;
  updateInstallationDate: boolean;
  warrantyExpiry?: string;
  updateWarrantyExpiry: boolean;
  brand?: string;
  updateBrand: boolean;
  model?: string;
  updateModel: boolean;
  status?: string;
  updateStatus: boolean;
  installationLocation?: string;
  updateInstallationLocation: boolean;
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

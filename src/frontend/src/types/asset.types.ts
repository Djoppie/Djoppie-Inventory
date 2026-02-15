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
  serialNumber: string; // REQUIRED - unique identifier for the device
  purchaseDate?: string;
  warrantyExpiry?: string;
  installationDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAssetDto {
  assetTypeId: number; // REQUIRED - determines TYPE component of auto-generated asset code
  serialNumber: string; // REQUIRED - unique identifier for the device
  assetName?: string; // Official device name (DeviceName) - auto-fetched from Intune
  alias?: string; // Optional readable name
  category: string;
  isDummy?: boolean;

  // Relational fields
  serviceId?: number; // Service is used as location
  installationLocation?: string; // Specific location details (e.g., room number)

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
  serialNumberPrefix: string; // REQUIRED - prefix for generating unique serial numbers
  quantity: number;
  isDummy?: boolean;
  templateId?: number;
  assetName?: string; // Official device name (DeviceName)
  alias?: string; // Optional readable name
  category: string;
  building?: string; // Installation location (optional)
  owner?: string; // Primary user (optional)
  department?: string;
  officeLocation?: string;
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

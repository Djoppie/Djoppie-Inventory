export enum AssetStatus {
  InGebruik = 'InGebruik',
  Stock = 'Stock',
  Herstelling = 'Herstelling',
  Defect = 'Defect',
  UitDienst = 'UitDienst'
}

export interface Asset {
  id: number;
  assetCode: string;
  assetName: string; // Official device name (DeviceName) - auto-fetched from Intune
  alias?: string; // Optional readable name
  category: string;
  isDummy: boolean;

  // New relational fields
  assetTypeId?: number;
  assetType?: { id: number; code: string; name: string };
  buildingId?: number;
  building?: { id: number; code: string; name: string };
  serviceId?: number;
  service?: { id: number; code: string; name: string };
  installationLocation?: string; // Specific location details (e.g., room number)

  // Legacy fields (for migration)
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
  assetCodePrefix: string;
  serialNumber: string; // REQUIRED - unique identifier for the device
  assetName?: string; // Official device name (DeviceName) - auto-fetched from Intune
  alias?: string; // Optional readable name
  category: string;
  isDummy?: boolean;

  // New relational fields
  assetTypeId?: number;
  buildingId?: number;
  serviceId?: number;
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

  // New relational fields
  assetTypeId?: number;
  buildingId?: number;
  serviceId?: number;
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
  category: string;
  brand?: string;
  model?: string;
  owner?: string;  // Optional - default primary user
  building?: string;  // Optional - default location
  department?: string;  // Optional - default department
  purchaseDate?: string;
  warrantyExpiry?: string;
  installationDate?: string;
}

export interface CreateAssetTemplateDto {
  templateName: string;
  assetName?: string;  // Optional - alias/description
  category: string;
  brand?: string;
  model?: string;
  owner?: string;  // Optional - default primary user
  building?: string;  // Optional - default location
  department?: string;  // Optional - default department
  purchaseDate?: string;
  warrantyExpiry?: string;
  installationDate?: string;
}

export interface UpdateAssetTemplateDto {
  templateName: string;
  assetName?: string;  // Optional - alias/description
  category: string;
  brand?: string;
  model?: string;
  owner?: string;  // Optional - default primary user
  building?: string;  // Optional - default location
  department?: string;  // Optional - default department
  purchaseDate?: string;
  warrantyExpiry?: string;
  installationDate?: string;
}

export interface BulkCreateAssetDto {
  assetCodePrefix: string;
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

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
  building?: string; // Installation location (optional)
  owner?: string; // Primary user (optional)
  department?: string; // Optional
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
  building?: string; // Installation location (optional)
  owner?: string; // Primary user (optional)
  department?: string;
  officeLocation?: string;
  jobTitle?: string;
  status?: string;
  brand?: string;
  model?: string;
  purchaseDate?: string;
  warrantyExpiry?: string;
  installationDate?: string;
}

export interface UpdateAssetDto {
  assetName?: string; // Official device name (DeviceName) - auto-fetched from Intune
  alias?: string; // Optional readable name
  owner?: string; // Primary user (optional)
  building?: string; // Installation location (optional)
  department?: string;
  officeLocation?: string;
  jobTitle?: string;
  status?: string;
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
  status?: string;
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

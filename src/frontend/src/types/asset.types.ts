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
  assetName: string;
  category: string;
  isDummy: boolean;
  building: string; // Installation location
  owner: string; // Primary user
  department: string;
  officeLocation?: string;
  jobTitle?: string;
  status: AssetStatus;
  brand?: string;
  model?: string;
  serialNumber?: string;
  purchaseDate?: string;
  warrantyExpiry?: string;
  installationDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAssetDto {
  assetCodePrefix: string;
  assetName: string;
  category: string;
  isDummy?: boolean;
  building: string; // Installation location
  owner: string; // Primary user
  department: string;
  officeLocation?: string;
  jobTitle?: string;
  status?: string;
  brand?: string;
  model?: string;
  serialNumber?: string;
  purchaseDate?: string;
  warrantyExpiry?: string;
  installationDate?: string;
}

export interface UpdateAssetDto {
  assetName: string;
  owner: string;
  building: string;
  department: string;
  officeLocation?: string;
  jobTitle?: string;
  status?: string;
  brand?: string;
  model?: string;
  serialNumber?: string;
  category?: string;
  purchaseDate?: string;
  warrantyExpiry?: string;
  installationDate?: string;
}

export interface AssetTemplate {
  id: number;
  templateName: string;
  assetName: string;
  category: string;
  brand: string;
  model: string;
  owner: string;
  building: string;
  department: string;
  officeLocation?: string;
  purchaseDate?: string;
  warrantyExpiry?: string;
  installationDate?: string;
}

export interface CreateAssetTemplateDto {
  templateName: string;
  assetName: string;
  category: string;
  brand: string;
  model: string;
  owner: string;
  building: string;
  department: string;
  officeLocation?: string;
  purchaseDate?: string;
  warrantyExpiry?: string;
  installationDate?: string;
}

export interface UpdateAssetTemplateDto {
  templateName: string;
  assetName: string;
  category: string;
  brand: string;
  model: string;
  owner: string;
  building: string;
  department: string;
  officeLocation?: string;
  purchaseDate?: string;
  warrantyExpiry?: string;
  installationDate?: string;
}

export interface BulkCreateAssetDto {
  assetCodePrefix: string;
  quantity: number;
  isDummy?: boolean;
  templateId?: number;
  assetName: string;
  category: string;
  building: string; // Installation location
  owner: string; // Primary user
  department: string;
  officeLocation?: string;
  status?: string;
  brand?: string;
  model?: string;
  serialNumberPrefix?: string;
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

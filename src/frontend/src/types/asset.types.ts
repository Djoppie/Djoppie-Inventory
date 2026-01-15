export enum AssetStatus {
  Active = 'Active',
  Maintenance = 'Maintenance'
}

export interface Asset {
  id: number;
  assetCode: string;
  assetName: string;
  category: string;
  owner: string;
  building: string;
  spaceOrFloor: string;
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
  assetCode: string;
  assetName: string;
  category: string;
  owner: string;
  building: string;
  spaceOrFloor: string;
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
  spaceOrFloor: string;
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
}

import { apiClient } from './client';
import { Asset, CreateAssetDto, UpdateAssetDto, BulkCreateAssetDto, BulkCreateAssetResultDto, BulkUpdateAssetsDto, BulkUpdateAssetsResultDto, BulkDeleteAssetsDto, BulkDeleteAssetsResultDto, PagedResult, PaginationParams } from '../types/asset.types';

/**
 * Retrieves all assets (unpaginated). Use for client-side filtering/sorting.
 * For server-side pagination, use getAssetsPaged instead.
 */
export const getAssets = async (statusFilter?: string): Promise<Asset[]> => {
  const params = statusFilter ? { status: statusFilter } : {};
  const response = await apiClient.get<Asset[]>('/assets/all', { params });
  return response.data;
};

/**
 * Retrieves assets with server-side pagination.
 * @param statusFilter Optional status filter
 * @param pagination Pagination parameters (pageNumber, pageSize)
 * @returns Paginated result with items and metadata
 */
export const getAssetsPaged = async (
  statusFilter?: string,
  pagination?: PaginationParams
): Promise<PagedResult<Asset>> => {
  const params: Record<string, string | number> = {};

  if (statusFilter) {
    params.status = statusFilter;
  }
  if (pagination?.pageNumber) {
    params.pageNumber = pagination.pageNumber;
  }
  if (pagination?.pageSize) {
    params.pageSize = pagination.pageSize;
  }

  const response = await apiClient.get<PagedResult<Asset>>('/assets', { params });
  return response.data;
};

export const getAssetById = async (id: number): Promise<Asset> => {
  const response = await apiClient.get<Asset>(`/assets/${id}`);
  return response.data;
};

export const getAssetByCode = async (code: string): Promise<Asset> => {
  const response = await apiClient.get<Asset>(`/assets/by-code/${code}`);
  return response.data;
};

export const createAsset = async (data: CreateAssetDto): Promise<Asset> => {
  // Clean up data: convert empty strings to undefined for optional date fields
  const cleanedData: CreateAssetDto = {
    ...data,
    purchaseDate: data.purchaseDate || undefined,
    warrantyExpiry: data.warrantyExpiry || undefined,
    installationDate: data.installationDate || undefined,
  };
  const response = await apiClient.post<Asset>('/assets', cleanedData);
  return response.data;
};

export const updateAsset = async (id: number, data: UpdateAssetDto): Promise<Asset> => {
  // Clean up data: convert empty strings to undefined for optional date fields
  const cleanedData: UpdateAssetDto = {
    ...data,
    purchaseDate: data.purchaseDate || undefined,
    warrantyExpiry: data.warrantyExpiry || undefined,
    installationDate: data.installationDate || undefined,
  };
  const response = await apiClient.put<Asset>(`/assets/${id}`, cleanedData);
  return response.data;
};

export const deleteAsset = async (id: number): Promise<void> => {
  await apiClient.delete(`/assets/${id}`);
};

export const bulkCreateAssets = async (data: BulkCreateAssetDto): Promise<BulkCreateAssetResultDto> => {
  // Clean up data: convert empty strings to undefined for optional fields
  // This is necessary because the backend expects nullable types and cannot parse empty strings
  const cleanedData: BulkCreateAssetDto = {
    ...data,
    // Convert empty date strings to undefined
    purchaseDate: data.purchaseDate || undefined,
    warrantyExpiry: data.warrantyExpiry || undefined,
    installationDate: data.installationDate || undefined,
    // Convert other empty optional strings to undefined
    serialNumberPrefix: data.serialNumberPrefix || undefined,
    assetName: data.assetName || undefined,
    alias: data.alias || undefined,
    category: data.category || undefined,
    owner: data.owner || undefined,
    installationLocation: data.installationLocation || undefined,
    brand: data.brand || undefined,
    model: data.model || undefined,
  };

  const response = await apiClient.post<BulkCreateAssetResultDto>('/assets/bulk', cleanedData);
  return response.data;
};

export const assetCodeExists = async (code: string): Promise<boolean> => {
  const response = await apiClient.get<boolean>('/assets/code-exists', { params: { code } });
  return response.data;
};

export const serialNumberExists = async (serialNumber: string, excludeAssetId?: number): Promise<boolean> => {
  const params: { serialNumber: string; excludeAssetId?: number } = { serialNumber };
  if (excludeAssetId !== undefined) {
    params.excludeAssetId = excludeAssetId;
  }
  const response = await apiClient.get<boolean>('/assets/serial-exists', { params });
  return response.data;
};

export const getAssetBySerialNumber = async (serialNumber: string): Promise<Asset> => {
  const response = await apiClient.get<Asset>(`/assets/by-serial/${serialNumber}`);
  return response.data;
};

export const bulkUpdateAssets = async (data: BulkUpdateAssetsDto): Promise<BulkUpdateAssetsResultDto> => {
  // Clean up data: convert empty strings to undefined for optional fields
  const cleanedData: BulkUpdateAssetsDto = {
    ...data,
    purchaseDate: data.updatePurchaseDate && data.purchaseDate ? data.purchaseDate : undefined,
    warrantyExpiry: data.updateWarrantyExpiry && data.warrantyExpiry ? data.warrantyExpiry : undefined,
    installationDate: data.updateInstallationDate && data.installationDate ? data.installationDate : undefined,
    brand: data.updateBrand && data.brand ? data.brand : undefined,
    model: data.updateModel && data.model ? data.model : undefined,
    status: data.updateStatus && data.status ? data.status : undefined,
    installationLocation: data.updateInstallationLocation && data.installationLocation ? data.installationLocation : undefined,
    serviceId: data.updateServiceId ? data.serviceId : undefined,
  };

  const response = await apiClient.put<BulkUpdateAssetsResultDto>('/assets/bulk', cleanedData);
  return response.data;
};

export const bulkDeleteAssets = async (data: BulkDeleteAssetsDto): Promise<BulkDeleteAssetsResultDto> => {
  const response = await apiClient.delete<BulkDeleteAssetsResultDto>('/assets/bulk', { data });
  return response.data;
};

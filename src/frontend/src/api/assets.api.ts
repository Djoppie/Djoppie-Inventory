import { apiClient } from './client';
import {
  Asset,
  CreateAssetDto,
  UpdateAssetDto,
  BulkCreateAssetDto,
  BulkCreateAssetResultDto,
  BulkUpdateAssetsDto,
  BulkUpdateAssetsResultDto,
  BulkDeleteAssetsDto,
  BulkDeleteAssetsResultDto,
  PagedResult,
  PaginationParams,
  AssignAssetToEmployeeDto,
  AssignAssetToWorkplaceDto,
  UnassignAssetDto,
  ChangeAssetStatusDto,
} from '../types/asset.types';

/**
 * Retrieves all assets (unpaginated). Use for client-side filtering/sorting.
 * For server-side pagination, use getAssetsPaged instead.
 */
export const getAssets = async (statusFilter?: string): Promise<Asset[]> => {
  const params = statusFilter ? { status: statusFilter } : {};
  const response = await apiClient.get<Asset[]>('/inventory/assets/all', { params });
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

  const response = await apiClient.get<PagedResult<Asset>>('/inventory/assets', { params });
  return response.data;
};

export const getAssetById = async (id: number): Promise<Asset> => {
  const response = await apiClient.get<Asset>(`/inventory/assets/${id}`);
  return response.data;
};

export const getAssetByCode = async (code: string): Promise<Asset> => {
  const response = await apiClient.get<Asset>(`/inventory/assets/by-code/${code}`);
  return response.data;
};

export const createAsset = async (data: CreateAssetDto): Promise<Asset> => {
  // Convert empty strings to undefined for optional date fields
  const cleanedData: CreateAssetDto = {
    ...data,
    purchaseDate: data.purchaseDate || undefined,
    warrantyExpiry: data.warrantyExpiry || undefined,
  };
  const response = await apiClient.post<Asset>('/inventory/assets', cleanedData);
  return response.data;
};

export const updateAsset = async (id: number, data: UpdateAssetDto): Promise<Asset> => {
  const cleanedData: UpdateAssetDto = {
    ...data,
    purchaseDate: data.purchaseDate || undefined,
    warrantyExpiry: data.warrantyExpiry || undefined,
  };
  const response = await apiClient.put<Asset>(`/inventory/assets/${id}`, cleanedData);
  return response.data;
};

export const deleteAsset = async (id: number): Promise<void> => {
  await apiClient.delete(`/inventory/assets/${id}`);
};

export const bulkCreateAssets = async (data: BulkCreateAssetDto): Promise<BulkCreateAssetResultDto> => {
  // Convert empty optional strings to undefined so the backend doesn't
  // see them as "explicit empty" values.
  const cleanedData: BulkCreateAssetDto = {
    ...data,
    purchaseDate: data.purchaseDate || undefined,
    warrantyExpiry: data.warrantyExpiry || undefined,
    serialNumberPrefix: data.serialNumberPrefix || undefined,
    assetName: data.assetName || undefined,
    alias: data.alias || undefined,
    category: data.category || undefined,
    brand: data.brand || undefined,
    model: data.model || undefined,
  };

  const response = await apiClient.post<BulkCreateAssetResultDto>('/inventory/assets/bulk', cleanedData);
  return response.data;
};

export const assetCodeExists = async (code: string): Promise<boolean> => {
  const response = await apiClient.get<boolean>('/inventory/assets/code-exists', { params: { code } });
  return response.data;
};

export const serialNumberExists = async (serialNumber: string, excludeAssetId?: number): Promise<boolean> => {
  const params: { serialNumber: string; excludeAssetId?: number } = { serialNumber };
  if (excludeAssetId !== undefined) {
    params.excludeAssetId = excludeAssetId;
  }
  const response = await apiClient.get<boolean>('/inventory/assets/serial-exists', { params });
  return response.data;
};

export const getAssetBySerialNumber = async (serialNumber: string): Promise<Asset> => {
  const response = await apiClient.get<Asset>(`/inventory/assets/by-serial/${serialNumber}`);
  return response.data;
};

export const bulkUpdateAssets = async (data: BulkUpdateAssetsDto): Promise<BulkUpdateAssetsResultDto> => {
  // Bulk update only handles intrinsic properties (status / owner /
  // location go through the assignment endpoints). Pack only fields
  // explicitly flagged for update.
  const cleanedData: BulkUpdateAssetsDto = {
    ...data,
    purchaseDate: data.updatePurchaseDate && data.purchaseDate ? data.purchaseDate : undefined,
    warrantyExpiry: data.updateWarrantyExpiry && data.warrantyExpiry ? data.warrantyExpiry : undefined,
    brand: data.updateBrand && data.brand ? data.brand : undefined,
    model: data.updateModel && data.model ? data.model : undefined,
  };

  const response = await apiClient.put<BulkUpdateAssetsResultDto>('/inventory/assets/bulk', cleanedData);
  return response.data;
};

export const bulkDeleteAssets = async (data: BulkDeleteAssetsDto): Promise<BulkDeleteAssetsResultDto> => {
  const response = await apiClient.delete<BulkDeleteAssetsResultDto>('/inventory/assets/bulk', { data });
  return response.data;
};

/**
 * Retrieves all assets owned by a specific user (by email address).
 * @param email The owner's email address
 * @returns List of assets owned by the user
 */
export const getAssetsByOwner = async (email: string): Promise<Asset[]> => {
  const response = await apiClient.get<Asset[]>(`/inventory/assets/by-owner/${encodeURIComponent(email)}`);
  return response.data;
};

// ===== Assignment endpoints =====
// The four endpoints below are the only sanctioned paths for changing
// an asset's status, owner, employee link, building or workplace.
// Generic createAsset / updateAsset will silently ignore those fields
// after PR2; use these instead.

export const assignAssetToEmployee = async (
  assetId: number,
  data: AssignAssetToEmployeeDto,
): Promise<Asset> => {
  const response = await apiClient.post<Asset>(`/inventory/assets/${assetId}/assign-employee`, data);
  return response.data;
};

export const assignAssetToWorkplace = async (
  assetId: number,
  data: AssignAssetToWorkplaceDto,
): Promise<Asset> => {
  const response = await apiClient.post<Asset>(`/inventory/assets/${assetId}/assign-workplace`, data);
  return response.data;
};

export const unassignAsset = async (
  assetId: number,
  data: UnassignAssetDto = {},
): Promise<Asset> => {
  const response = await apiClient.post<Asset>(`/inventory/assets/${assetId}/unassign`, data);
  return response.data;
};

export const changeAssetStatus = async (
  assetId: number,
  data: ChangeAssetStatusDto,
): Promise<Asset> => {
  const response = await apiClient.post<Asset>(`/inventory/assets/${assetId}/status`, data);
  return response.data;
};

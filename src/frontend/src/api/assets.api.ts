import { apiClient } from './client';
import { Asset, CreateAssetDto, UpdateAssetDto, BulkCreateAssetDto, BulkCreateAssetResultDto, PagedResult, PaginationParams } from '../types/asset.types';

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
  const response = await apiClient.post<Asset>('/assets', data);
  return response.data;
};

export const updateAsset = async (id: number, data: UpdateAssetDto): Promise<Asset> => {
  const response = await apiClient.put<Asset>(`/assets/${id}`, data);
  return response.data;
};

export const deleteAsset = async (id: number): Promise<void> => {
  await apiClient.delete(`/assets/${id}`);
};

export const bulkCreateAssets = async (data: BulkCreateAssetDto): Promise<BulkCreateAssetResultDto> => {
  const response = await apiClient.post<BulkCreateAssetResultDto>('/assets/bulk', data);
  return response.data;
};

export const getNextAssetNumber = async (prefix: string, isDummy: boolean = false): Promise<number> => {
  const response = await apiClient.get<number>('/assets/next-number', { params: { prefix, isDummy } });
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

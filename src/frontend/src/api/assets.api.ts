import { apiClient } from './client';
import { Asset, CreateAssetDto, UpdateAssetDto, BulkCreateAssetDto, BulkCreateAssetResultDto } from '../types/asset.types';

export const getAssets = async (statusFilter?: string): Promise<Asset[]> => {
  const params = statusFilter ? { status: statusFilter } : {};
  const response = await apiClient.get<Asset[]>('/assets', { params });
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

export const getNextAssetNumber = async (prefix: string): Promise<number> => {
  const response = await apiClient.get<number>('/assets/next-number', { params: { prefix } });
  return response.data;
};

export const assetCodeExists = async (code: string): Promise<boolean> => {
  const response = await apiClient.get<boolean>('/assets/code-exists', { params: { code } });
  return response.data;
};

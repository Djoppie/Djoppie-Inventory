import { apiClient } from './client';
import type {
  AssetRequestDto,
  CreateAssetRequestDto,
  UpdateAssetRequestDto,
} from '../types/assetRequest.types';

/**
 * Asset Requests API Client
 * Handles on/offboarding asset requests
 */

// Get all asset requests
export const getAllAssetRequests = async (): Promise<AssetRequestDto[]> => {
  const { data } = await apiClient.get<AssetRequestDto[]>('/operations/requests');
  return data;
};

// Get asset request by ID
export const getAssetRequestById = async (id: number): Promise<AssetRequestDto> => {
  const { data } = await apiClient.get<AssetRequestDto>(`/operations/requests/${id}`);
  return data;
};

// Get asset requests by date range
export const getAssetRequestsByDateRange = async (
  startDate: Date,
  endDate: Date
): Promise<AssetRequestDto[]> => {
  const { data } = await apiClient.get<AssetRequestDto[]>('/operations/requests/date-range', {
    params: {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    },
  });
  return data;
};

// Create asset request
export const createAssetRequest = async (
  request: CreateAssetRequestDto
): Promise<AssetRequestDto> => {
  const { data } = await apiClient.post<AssetRequestDto>('/operations/requests', request);
  return data;
};

// Update asset request
export const updateAssetRequest = async (
  id: number,
  request: UpdateAssetRequestDto
): Promise<AssetRequestDto> => {
  const { data } = await apiClient.put<AssetRequestDto>(`/operations/requests/${id}`, request);
  return data;
};

// Delete asset request
export const deleteAssetRequest = async (id: number): Promise<void> => {
  await apiClient.delete(`/operations/requests/${id}`);
};

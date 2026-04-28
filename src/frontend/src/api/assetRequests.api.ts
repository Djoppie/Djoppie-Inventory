import { apiClient } from './client';
import type {
  AssetRequestDetailDto,
  AssetRequestFilters,
  AssetRequestLineDto,
  AssetRequestStatisticsDto,
  AssetRequestSummaryDto,
  AssetRequestTransitionDto,
  CreateAssetRequestDto,
  CreateAssetRequestLineDto,
  UpdateAssetRequestDto,
  UpdateAssetRequestLineDto,
} from '../types/assetRequest.types';

const BASE = '/operations/requests';

function toQueryParams(filters: AssetRequestFilters): Record<string, string | string[]> {
  const params: Record<string, string | string[]> = {};
  if (filters.type) params.type = filters.type;
  if (filters.status && filters.status.length > 0) params.status = filters.status;
  if (filters.dateFrom) params.dateFrom = filters.dateFrom;
  if (filters.dateTo) params.dateTo = filters.dateTo;
  if (filters.employeeId !== undefined) params.employeeId = String(filters.employeeId);
  if (filters.q) params.q = filters.q;
  return params;
}

export const queryAssetRequests = async (
  filters: AssetRequestFilters = {}
): Promise<AssetRequestSummaryDto[]> => {
  const { data } = await apiClient.get<AssetRequestSummaryDto[]>(BASE, {
    params: toQueryParams(filters),
  });
  return data;
};

export const getAssetRequestById = async (id: number): Promise<AssetRequestDetailDto> => {
  const { data } = await apiClient.get<AssetRequestDetailDto>(`${BASE}/${id}`);
  return data;
};

export const createAssetRequest = async (
  request: CreateAssetRequestDto
): Promise<AssetRequestDetailDto> => {
  const { data } = await apiClient.post<AssetRequestDetailDto>(BASE, request);
  return data;
};

export const updateAssetRequest = async (
  id: number,
  request: UpdateAssetRequestDto
): Promise<AssetRequestDetailDto> => {
  const { data } = await apiClient.put<AssetRequestDetailDto>(`${BASE}/${id}`, request);
  return data;
};

export const deleteAssetRequest = async (id: number): Promise<void> => {
  await apiClient.delete(`${BASE}/${id}`);
};

export const addAssetRequestLine = async (
  requestId: number,
  line: CreateAssetRequestLineDto
): Promise<AssetRequestLineDto> => {
  const { data } = await apiClient.post<AssetRequestLineDto>(`${BASE}/${requestId}/lines`, line);
  return data;
};

export const updateAssetRequestLine = async (
  requestId: number,
  lineId: number,
  line: UpdateAssetRequestLineDto
): Promise<AssetRequestLineDto> => {
  const { data } = await apiClient.put<AssetRequestLineDto>(
    `${BASE}/${requestId}/lines/${lineId}`,
    line
  );
  return data;
};

export const deleteAssetRequestLine = async (
  requestId: number,
  lineId: number
): Promise<void> => {
  await apiClient.delete(`${BASE}/${requestId}/lines/${lineId}`);
};

export const transitionAssetRequest = async (
  id: number,
  transition: AssetRequestTransitionDto
): Promise<AssetRequestDetailDto> => {
  const { data } = await apiClient.post<AssetRequestDetailDto>(
    `${BASE}/${id}/transition`,
    transition
  );
  return data;
};

export const linkAssetRequestEmployee = async (
  id: number,
  employeeId: number
): Promise<AssetRequestDetailDto> => {
  const { data } = await apiClient.post<AssetRequestDetailDto>(
    `${BASE}/${id}/link-employee`,
    { employeeId }
  );
  return data;
};

export const getAssetRequestStatistics =
  async (): Promise<AssetRequestStatisticsDto> => {
    const { data } = await apiClient.get<AssetRequestStatisticsDto>(`${BASE}/statistics`);
    return data;
  };

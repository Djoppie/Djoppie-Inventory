import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAllAssetRequests,
  getAssetRequestById,
  getAssetRequestsByDateRange,
  createAssetRequest,
  updateAssetRequest,
  deleteAssetRequest,
} from '../api/assetRequests.api';
import type {
  CreateAssetRequestDto,
  UpdateAssetRequestDto,
} from '../types/assetRequest.types';

/**
 * React Query hooks for Asset Requests
 */

// Query keys
export const assetRequestKeys = {
  all: ['assetRequests'] as const,
  lists: () => [...assetRequestKeys.all, 'list'] as const,
  list: (filters: string) => [...assetRequestKeys.lists(), { filters }] as const,
  details: () => [...assetRequestKeys.all, 'detail'] as const,
  detail: (id: number) => [...assetRequestKeys.details(), id] as const,
  dateRange: (startDate: Date, endDate: Date) =>
    [...assetRequestKeys.all, 'dateRange', startDate.toISOString(), endDate.toISOString()] as const,
};

// Get all asset requests
export const useAssetRequests = () => {
  return useQuery({
    queryKey: assetRequestKeys.lists(),
    queryFn: getAllAssetRequests,
  });
};

// Get asset request by ID
export const useAssetRequest = (id: number) => {
  return useQuery({
    queryKey: assetRequestKeys.detail(id),
    queryFn: () => getAssetRequestById(id),
    enabled: !!id,
  });
};

// Get asset requests by date range
export const useAssetRequestsByDateRange = (startDate: Date, endDate: Date) => {
  return useQuery({
    queryKey: assetRequestKeys.dateRange(startDate, endDate),
    queryFn: () => getAssetRequestsByDateRange(startDate, endDate),
  });
};

// Create asset request
export const useCreateAssetRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: CreateAssetRequestDto) => createAssetRequest(request),
    onSuccess: () => {
      // Invalidate and refetch all asset request queries
      queryClient.invalidateQueries({ queryKey: assetRequestKeys.all });
    },
  });
};

// Update asset request
export const useUpdateAssetRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, request }: { id: number; request: UpdateAssetRequestDto }) =>
      updateAssetRequest(id, request),
    onSuccess: (_, variables) => {
      // Invalidate specific request and all lists
      queryClient.invalidateQueries({ queryKey: assetRequestKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: assetRequestKeys.lists() });
    },
  });
};

// Delete asset request
export const useDeleteAssetRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteAssetRequest(id),
    onSuccess: () => {
      // Invalidate all asset request queries
      queryClient.invalidateQueries({ queryKey: assetRequestKeys.all });
    },
  });
};

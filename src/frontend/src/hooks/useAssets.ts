import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as assetsApi from '../api/assets.api';
import { CreateAssetDto, UpdateAssetDto, BulkCreateAssetDto, PaginationParams } from '../types/asset.types';
import { isValidAssetCode } from '../utils/validation';

/**
 * Hook to fetch all assets (unpaginated). Use for client-side filtering/sorting.
 */
export const useAssets = (statusFilter?: string) => {
  return useQuery({
    queryKey: ['assets', statusFilter],
    queryFn: () => assetsApi.getAssets(statusFilter),
  });
};

/**
 * Hook to fetch assets with server-side pagination.
 * @param statusFilter Optional status filter
 * @param pagination Pagination parameters
 */
export const useAssetsPaged = (statusFilter?: string, pagination?: PaginationParams) => {
  return useQuery({
    queryKey: ['assets', 'paged', statusFilter, pagination?.pageNumber, pagination?.pageSize],
    queryFn: () => assetsApi.getAssetsPaged(statusFilter, pagination),
  });
};

export const useAsset = (id: number) => {
  return useQuery({
    queryKey: ['asset', id],
    queryFn: () => assetsApi.getAssetById(id),
    enabled: !!id,
  });
};

export const useAssetByCode = (assetCode: string) => {
  return useQuery({
    queryKey: ['asset', 'code', assetCode],
    queryFn: () => assetsApi.getAssetByCode(assetCode),
    enabled: !!assetCode && isValidAssetCode(assetCode),
  });
};

export const useCreateAsset = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateAssetDto) => assetsApi.createAsset(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
    },
  });
};

export const useUpdateAsset = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateAssetDto }) =>
      assetsApi.updateAsset(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      queryClient.invalidateQueries({ queryKey: ['asset'] });
    },
  });
};

export const useDeleteAsset = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => assetsApi.deleteAsset(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
    },
  });
};

export const useBulkCreateAssets = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: BulkCreateAssetDto) => assetsApi.bulkCreateAssets(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
    },
  });
};

export const useAssetCodeExists = (code: string) => {
  return useQuery({
    queryKey: ['assets', 'code-exists', code],
    queryFn: () => assetsApi.assetCodeExists(code),
    enabled: !!code && code.length >= 3,
  });
};

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  addAssetRequestLine,
  createAssetRequest,
  deleteAssetRequest,
  deleteAssetRequestLine,
  getAssetRequestById,
  getAssetRequestStatistics,
  linkAssetRequestEmployee,
  queryAssetRequests,
  transitionAssetRequest,
  updateAssetRequest,
  updateAssetRequestLine,
} from '../api/assetRequests.api';
import type {
  AssetRequestFilters,
  AssetRequestTransitionDto,
  CreateAssetRequestDto,
  CreateAssetRequestLineDto,
  UpdateAssetRequestDto,
  UpdateAssetRequestLineDto,
} from '../types/assetRequest.types';

export const assetRequestKeys = {
  all: ['assetRequests'] as const,
  lists: () => [...assetRequestKeys.all, 'list'] as const,
  list: (filters: AssetRequestFilters) => [...assetRequestKeys.lists(), filters] as const,
  detail: (id: number) => [...assetRequestKeys.all, 'detail', id] as const,
  statistics: () => [...assetRequestKeys.all, 'statistics'] as const,
};

export const useAssetRequests = (filters: AssetRequestFilters = {}) =>
  useQuery({
    queryKey: assetRequestKeys.list(filters),
    queryFn: () => queryAssetRequests(filters),
  });

export const useAssetRequest = (id: number | undefined) =>
  useQuery({
    queryKey: assetRequestKeys.detail(id ?? -1),
    queryFn: () => getAssetRequestById(id!),
    enabled: !!id,
  });

export const useAssetRequestStatistics = () =>
  useQuery({
    queryKey: assetRequestKeys.statistics(),
    queryFn: getAssetRequestStatistics,
    staleTime: 60 * 1000,
  });

const invalidateAll = (qc: ReturnType<typeof useQueryClient>) =>
  qc.invalidateQueries({ queryKey: assetRequestKeys.all });

export const useCreateAssetRequest = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateAssetRequestDto) => createAssetRequest(dto),
    onSuccess: () => invalidateAll(qc),
  });
};

export const useUpdateAssetRequest = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: UpdateAssetRequestDto }) =>
      updateAssetRequest(id, dto),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: assetRequestKeys.detail(vars.id) });
      qc.invalidateQueries({ queryKey: assetRequestKeys.lists() });
    },
  });
};

export const useDeleteAssetRequest = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteAssetRequest(id),
    onSuccess: () => invalidateAll(qc),
  });
};

export const useAddAssetRequestLine = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ requestId, dto }: { requestId: number; dto: CreateAssetRequestLineDto }) =>
      addAssetRequestLine(requestId, dto),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: assetRequestKeys.detail(vars.requestId) });
      qc.invalidateQueries({ queryKey: assetRequestKeys.lists() });
    },
  });
};

export const useUpdateAssetRequestLine = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      requestId,
      lineId,
      dto,
    }: {
      requestId: number;
      lineId: number;
      dto: UpdateAssetRequestLineDto;
    }) => updateAssetRequestLine(requestId, lineId, dto),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: assetRequestKeys.detail(vars.requestId) });
    },
  });
};

export const useDeleteAssetRequestLine = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ requestId, lineId }: { requestId: number; lineId: number }) =>
      deleteAssetRequestLine(requestId, lineId),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: assetRequestKeys.detail(vars.requestId) });
    },
  });
};

export const useTransitionAssetRequest = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: AssetRequestTransitionDto }) =>
      transitionAssetRequest(id, dto),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: assetRequestKeys.detail(vars.id) });
      qc.invalidateQueries({ queryKey: assetRequestKeys.lists() });
      qc.invalidateQueries({ queryKey: assetRequestKeys.statistics() });
    },
  });
};

export const useLinkAssetRequestEmployee = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, employeeId }: { id: number; employeeId: number }) =>
      linkAssetRequestEmployee(id, employeeId),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: assetRequestKeys.detail(vars.id) });
    },
  });
};

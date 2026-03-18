import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  physicalWorkplacesApi,
  physicalWorkplacesBulkApi,
  BulkCreateWorkplacesDto,
  ExportWorkplacesParams,
} from '../api/physicalWorkplaces.api';
import {
  CreatePhysicalWorkplaceDto,
  UpdatePhysicalWorkplaceDto,
  UpdateOccupantDto,
  PhysicalWorkplaceFilters,
} from '../types/physicalWorkplace.types';

/**
 * Query key factory for physical workplaces
 */
export const physicalWorkplaceKeys = {
  all: ['physicalWorkplaces'] as const,
  lists: () => [...physicalWorkplaceKeys.all, 'list'] as const,
  list: (filters?: PhysicalWorkplaceFilters) => [...physicalWorkplaceKeys.lists(), filters] as const,
  summaries: () => [...physicalWorkplaceKeys.all, 'summary'] as const,
  summary: (buildingId?: number, serviceId?: number) =>
    [...physicalWorkplaceKeys.summaries(), { buildingId, serviceId }] as const,
  details: () => [...physicalWorkplaceKeys.all, 'detail'] as const,
  detail: (id: number) => [...physicalWorkplaceKeys.details(), id] as const,
  assets: (id: number) => [...physicalWorkplaceKeys.detail(id), 'assets'] as const,
};

/**
 * Hook to fetch all physical workplaces with optional filtering
 */
export const usePhysicalWorkplaces = (filters?: PhysicalWorkplaceFilters) => {
  return useQuery({
    queryKey: physicalWorkplaceKeys.list(filters),
    queryFn: () => physicalWorkplacesApi.getAll(filters),
  });
};

/**
 * Hook to fetch physical workplaces summary for dropdowns
 */
export const usePhysicalWorkplacesSummary = (
  buildingId?: number,
  serviceId?: number,
  activeOnly = true
) => {
  return useQuery({
    queryKey: physicalWorkplaceKeys.summary(buildingId, serviceId),
    queryFn: () => physicalWorkplacesApi.getSummary(buildingId, serviceId, activeOnly),
  });
};

/**
 * Hook to fetch a single physical workplace by ID
 */
export const usePhysicalWorkplace = (id: number) => {
  return useQuery({
    queryKey: physicalWorkplaceKeys.detail(id),
    queryFn: () => physicalWorkplacesApi.getById(id),
    enabled: !!id && id > 0,
  });
};

/**
 * Hook to fetch fixed assets for a physical workplace
 */
export const usePhysicalWorkplaceAssets = (id: number) => {
  return useQuery({
    queryKey: physicalWorkplaceKeys.assets(id),
    queryFn: () => physicalWorkplacesApi.getFixedAssets(id),
    enabled: !!id && id > 0,
  });
};

/**
 * Hook to create a new physical workplace
 */
export const useCreatePhysicalWorkplace = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePhysicalWorkplaceDto) => physicalWorkplacesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: physicalWorkplaceKeys.all });
    },
  });
};

/**
 * Hook to update a physical workplace
 */
export const useUpdatePhysicalWorkplace = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdatePhysicalWorkplaceDto }) =>
      physicalWorkplacesApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: physicalWorkplaceKeys.all });
      queryClient.invalidateQueries({ queryKey: physicalWorkplaceKeys.detail(variables.id) });
    },
  });
};

/**
 * Hook to update a physical workplace's occupant
 */
export const useUpdateOccupant = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateOccupantDto }) =>
      physicalWorkplacesApi.updateOccupant(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: physicalWorkplaceKeys.all });
      queryClient.invalidateQueries({ queryKey: physicalWorkplaceKeys.detail(variables.id) });
    },
  });
};

/**
 * Hook to clear a physical workplace's occupant
 */
export const useClearOccupant = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => physicalWorkplacesApi.clearOccupant(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: physicalWorkplaceKeys.all });
      queryClient.invalidateQueries({ queryKey: physicalWorkplaceKeys.detail(id) });
    },
  });
};

/**
 * Hook to delete a physical workplace (soft or hard delete)
 */
export const useDeletePhysicalWorkplace = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, hardDelete = false }: { id: number; hardDelete?: boolean }) =>
      physicalWorkplacesApi.delete(id, hardDelete),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: physicalWorkplaceKeys.all });
    },
  });
};

/**
 * Hook to assign an asset to a physical workplace
 */
export const useAssignAsset = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ workplaceId, assetId }: { workplaceId: number; assetId: number }) =>
      physicalWorkplacesApi.assignAsset(workplaceId, assetId),
    onSuccess: (_, variables) => {
      // Invalidate workplace queries to update asset count
      queryClient.invalidateQueries({ queryKey: physicalWorkplaceKeys.all });
      queryClient.invalidateQueries({ queryKey: physicalWorkplaceKeys.detail(variables.workplaceId) });
      queryClient.invalidateQueries({ queryKey: physicalWorkplaceKeys.assets(variables.workplaceId) });
      // Also invalidate assets list since asset's workplace changed
      queryClient.invalidateQueries({ queryKey: ['assets'] });
    },
  });
};

/**
 * Hook to unassign an asset from a physical workplace
 */
export const useUnassignAsset = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ workplaceId, assetId }: { workplaceId: number; assetId: number }) =>
      physicalWorkplacesApi.unassignAsset(workplaceId, assetId),
    onSuccess: (_, variables) => {
      // Invalidate workplace queries to update asset count
      queryClient.invalidateQueries({ queryKey: physicalWorkplaceKeys.all });
      queryClient.invalidateQueries({ queryKey: physicalWorkplaceKeys.detail(variables.workplaceId) });
      queryClient.invalidateQueries({ queryKey: physicalWorkplaceKeys.assets(variables.workplaceId) });
      // Also invalidate assets list since asset's workplace changed
      queryClient.invalidateQueries({ queryKey: ['assets'] });
    },
  });
};

// ============================================================
// Bulk Operations
// ============================================================

/**
 * Hook to download CSV template for bulk workplace import
 */
export const useDownloadWorkplaceTemplate = () => {
  return useMutation({
    mutationFn: async () => {
      const blob = await physicalWorkplacesBulkApi.downloadTemplate();
      // Trigger browser download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `workplace-import-template_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    },
  });
};

/**
 * Hook to export workplaces to CSV file
 */
export const useExportWorkplacesCsv = () => {
  return useMutation({
    mutationFn: async (params?: ExportWorkplacesParams) => {
      const blob = await physicalWorkplacesBulkApi.exportCsv(params);
      // Trigger browser download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `workplaces-export_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    },
  });
};

/**
 * Hook to import workplaces from CSV file
 */
export const useImportWorkplacesCsv = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => physicalWorkplacesBulkApi.importCsv(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: physicalWorkplaceKeys.all });
    },
  });
};

/**
 * Hook to bulk create workplaces
 */
export const useBulkCreateWorkplaces = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: BulkCreateWorkplacesDto) => physicalWorkplacesBulkApi.bulkCreate(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: physicalWorkplaceKeys.all });
    },
  });
};

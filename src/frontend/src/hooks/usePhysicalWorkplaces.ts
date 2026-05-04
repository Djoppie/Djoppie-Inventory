import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  physicalWorkplacesApi,
  physicalWorkplacesBulkApi,
  physicalWorkplacesStatisticsApi,
  workplaceGapAnalysisApi,
  BulkCreateWorkplacesDto,
  ExportWorkplacesParams,
  BulkUpdateWorkplacesDto,
} from '../api/physicalWorkplaces.api';
import {
  CreatePhysicalWorkplaceDto,
  UpdatePhysicalWorkplaceDto,
  UpdateOccupantDto,
  UpdateEquipmentSlotsDto,
  PhysicalWorkplaceFilters,
  AutoCreateMissingWorkplacesDto,
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
 * Hook to update equipment slots of a physical workplace
 */
export const useUpdateEquipmentSlots = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateEquipmentSlotsDto }) =>
      physicalWorkplacesApi.updateEquipment(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: physicalWorkplaceKeys.all });
      queryClient.invalidateQueries({ queryKey: physicalWorkplaceKeys.detail(variables.id) });
      // Also invalidate assets list since equipment assignments changed
      queryClient.invalidateQueries({ queryKey: ['assets'] });
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

/**
 * Hook to delete all workplaces (use with caution!)
 */
export const useDeleteAllWorkplaces = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => physicalWorkplacesBulkApi.deleteAll(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: physicalWorkplaceKeys.all });
    },
  });
};

/**
 * Hook to bulk-patch multiple workplaces (building, service, type, isActive, floor).
 * Only non-undefined fields are written; undefined means "leave unchanged."
 */
export const useBulkUpdateWorkplaces = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: BulkUpdateWorkplacesDto) => physicalWorkplacesBulkApi.bulkUpdate(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: physicalWorkplaceKeys.all });
    },
  });
};

/**
 * Hook to delete multiple workplaces by IDs
 */
export const useBulkDeleteWorkplaces = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: number[]) => physicalWorkplacesBulkApi.deleteMany(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: physicalWorkplaceKeys.all });
    },
  });
};

// ============================================================
// Statistics Hooks for Dashboard Widgets
// ============================================================

/**
 * Query key factory for workplace statistics
 */
export const workplaceStatisticsKeys = {
  all: ['workplaceStatistics'] as const,
  statistics: () => [...workplaceStatisticsKeys.all, 'overview'] as const,
  byBuilding: () => [...workplaceStatisticsKeys.all, 'byBuilding'] as const,
  byService: () => [...workplaceStatisticsKeys.all, 'byService'] as const,
  equipment: () => [...workplaceStatisticsKeys.all, 'equipment'] as const,
  recentChanges: (limit?: number, buildingId?: number) =>
    [...workplaceStatisticsKeys.all, 'recentChanges', { limit, buildingId }] as const,
};

/**
 * Hook to fetch overall workplace statistics
 * Used for the main dashboard workplace overview widget
 */
export const useWorkplaceStatistics = () => {
  return useQuery({
    queryKey: workplaceStatisticsKeys.statistics(),
    queryFn: () => physicalWorkplacesStatisticsApi.getStatistics(),
    staleTime: 30 * 1000, // 30 seconds - statistics don't change that often
  });
};

/**
 * Hook to fetch occupancy statistics by building
 * Used for the building occupancy distribution widget
 */
export const useWorkplaceStatisticsByBuilding = () => {
  return useQuery({
    queryKey: workplaceStatisticsKeys.byBuilding(),
    queryFn: () => physicalWorkplacesStatisticsApi.getStatisticsByBuilding(),
    staleTime: 30 * 1000,
  });
};

/**
 * Hook to fetch occupancy statistics by service
 * Used for the service occupancy distribution widget
 */
export const useWorkplaceStatisticsByService = () => {
  return useQuery({
    queryKey: workplaceStatisticsKeys.byService(),
    queryFn: () => physicalWorkplacesStatisticsApi.getStatisticsByService(),
    staleTime: 30 * 1000,
  });
};

/**
 * Hook to fetch equipment statistics by type
 * Used for the equipment distribution widget
 */
export const useWorkplaceEquipmentStatistics = () => {
  return useQuery({
    queryKey: workplaceStatisticsKeys.equipment(),
    queryFn: () => physicalWorkplacesStatisticsApi.getEquipmentStatistics(),
    staleTime: 30 * 1000,
  });
};

/**
 * Hook to fetch recent workplace changes
 * Used for the activity feed widget on the dashboard
 */
export const useWorkplaceRecentChanges = (limit = 10, buildingId?: number) => {
  return useQuery({
    queryKey: workplaceStatisticsKeys.recentChanges(limit, buildingId),
    queryFn: () => physicalWorkplacesStatisticsApi.getRecentChanges(limit, buildingId),
    staleTime: 10 * 1000, // 10 seconds - recent changes should refresh more often
  });
};

// ============================================================
// Workplace Gap Analysis Hooks
// ============================================================

/**
 * Query key factory for workplace gap analysis
 */
export const workplaceGapAnalysisKeys = {
  all: ['workplaceGapAnalysis'] as const,
  analysis: (serviceId?: number) => [...workplaceGapAnalysisKeys.all, { serviceId }] as const,
};

/**
 * Hook to fetch workplace gap analysis
 * Finds laptop owners (InGebruik) who don't have a corresponding PhysicalWorkplace
 */
export const useWorkplaceGapAnalysis = (serviceId?: number, limit = 100) => {
  return useQuery({
    queryKey: workplaceGapAnalysisKeys.analysis(serviceId),
    queryFn: () => workplaceGapAnalysisApi.getGapAnalysis(serviceId, limit),
    staleTime: 60 * 1000, // 1 minute - gap analysis is expensive
  });
};

/**
 * Hook to auto-create missing workplaces for orphan laptop owners
 */
export const useAutoCreateMissingWorkplaces = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: AutoCreateMissingWorkplacesDto) => workplaceGapAnalysisApi.autoCreateMissing(dto),
    onSuccess: () => {
      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: physicalWorkplaceKeys.all });
      queryClient.invalidateQueries({ queryKey: workplaceGapAnalysisKeys.all });
      queryClient.invalidateQueries({ queryKey: workplaceStatisticsKeys.all });
    },
  });
};

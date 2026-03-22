import { apiClient } from './client';
import {
  PhysicalWorkplace,
  PhysicalWorkplaceSummary,
  CreatePhysicalWorkplaceDto,
  UpdatePhysicalWorkplaceDto,
  UpdateOccupantDto,
  UpdateEquipmentSlotsDto,
  PhysicalWorkplaceFilters,
  WorkplaceFixedAsset,
  WorkplaceStatistics,
  BuildingOccupancy,
  ServiceOccupancy,
  EquipmentTypeStatus,
  WorkplaceChange,
} from '../types/physicalWorkplace.types';

// ============================================================
// Physical Workplaces API
// ============================================================

export const physicalWorkplacesApi = {
  /**
   * Get all physical workplaces with optional filtering
   */
  getAll: async (filters?: PhysicalWorkplaceFilters): Promise<PhysicalWorkplace[]> => {
    const response = await apiClient.get<PhysicalWorkplace[]>('/physicalworkplaces', {
      params: filters,
    });
    return response.data;
  },

  /**
   * Get physical workplaces summary for dropdowns (simplified data)
   */
  getSummary: async (
    buildingId?: number,
    serviceId?: number,
    activeOnly = true
  ): Promise<PhysicalWorkplaceSummary[]> => {
    const response = await apiClient.get<PhysicalWorkplaceSummary[]>('/physicalworkplaces/summary', {
      params: { buildingId, serviceId, activeOnly },
    });
    return response.data;
  },

  /**
   * Get a specific physical workplace by ID
   */
  getById: async (id: number): Promise<PhysicalWorkplace> => {
    const response = await apiClient.get<PhysicalWorkplace>(`/physicalworkplaces/${id}`);
    return response.data;
  },

  /**
   * Create a new physical workplace
   */
  create: async (data: CreatePhysicalWorkplaceDto): Promise<PhysicalWorkplace> => {
    const response = await apiClient.post<PhysicalWorkplace>('/physicalworkplaces', data);
    return response.data;
  },

  /**
   * Update an existing physical workplace
   */
  update: async (id: number, data: UpdatePhysicalWorkplaceDto): Promise<PhysicalWorkplace> => {
    const response = await apiClient.put<PhysicalWorkplace>(`/physicalworkplaces/${id}`, data);
    return response.data;
  },

  /**
   * Update the current occupant of a physical workplace
   */
  updateOccupant: async (id: number, data: UpdateOccupantDto): Promise<PhysicalWorkplace> => {
    const response = await apiClient.put<PhysicalWorkplace>(`/physicalworkplaces/${id}/occupant`, data);
    return response.data;
  },

  /**
   * Clear the current occupant from a physical workplace
   */
  clearOccupant: async (id: number): Promise<PhysicalWorkplace> => {
    const response = await apiClient.put<PhysicalWorkplace>(`/physicalworkplaces/${id}/occupant`, {
      occupantEntraId: null,
      occupantName: null,
      occupantEmail: null,
    });
    return response.data;
  },

  /**
   * Update equipment slots of a physical workplace
   */
  updateEquipment: async (id: number, data: UpdateEquipmentSlotsDto): Promise<PhysicalWorkplace> => {
    const response = await apiClient.put<PhysicalWorkplace>(`/physicalworkplaces/${id}/equipment`, data);
    return response.data;
  },

  /**
   * Delete a physical workplace (soft delete by default)
   */
  delete: async (id: number, hardDelete = false): Promise<void> => {
    await apiClient.delete(`/physicalworkplaces/${id}`, {
      params: { hardDelete },
    });
  },

  /**
   * Get fixed assets assigned to a physical workplace
   */
  getFixedAssets: async (id: number): Promise<WorkplaceFixedAsset[]> => {
    const response = await apiClient.get<WorkplaceFixedAsset[]>(`/physicalworkplaces/${id}/assets`);
    return response.data;
  },

  /**
   * Assign an asset to a physical workplace as a fixed asset
   */
  assignAsset: async (workplaceId: number, assetId: number): Promise<AssetAssignmentResult> => {
    const response = await apiClient.post<AssetAssignmentResult>(
      `/physicalworkplaces/${workplaceId}/assets/${assetId}`
    );
    return response.data;
  },

  /**
   * Unassign an asset from a physical workplace
   */
  unassignAsset: async (workplaceId: number, assetId: number): Promise<void> => {
    await apiClient.delete(`/physicalworkplaces/${workplaceId}/assets/${assetId}`);
  },
};

// ============================================================
// Response types
// ============================================================

export interface AssetAssignmentResult {
  message: string;
  assetId: number;
  assetCode: string;
  workplaceId: number;
  workplaceCode: string;
}

// ============================================================
// Bulk Import Types
// ============================================================

export interface BulkCreateWorkplacesDto {
  buildingId: number;
  serviceId?: number;
  codePrefix: string;
  startNumber: number;
  count: number;
  nameTemplate: string;
  floor?: string;
  room?: string;
  type?: number;
  monitorCount?: number;
  hasDockingStation?: boolean;
}

export interface BulkCreateWorkplacesResult {
  totalRequested: number;
  successCount: number;
  errorCount: number;
  results: BulkCreateWorkplaceItemResult[];
}

export interface BulkCreateWorkplaceItemResult {
  id?: number;
  code: string;
  name: string;
  success: boolean;
  error?: string;
}

export interface WorkplaceCsvImportResult {
  totalRows: number;
  successCount: number;
  errorCount: number;
  isFullySuccessful: boolean;
  results: WorkplaceCsvImportRowResult[];
}

export interface WorkplaceCsvImportRowResult {
  rowNumber: number;
  code?: string;
  name?: string;
  success: boolean;
  error?: string;
  createdId?: number;
}

// ============================================================
// Bulk Import API Functions
// ============================================================

export interface ExportWorkplacesParams {
  buildingId?: number;
  serviceId?: number;
  isActive?: boolean;
}

export interface DeleteAllResult {
  message: string;
  count: number;
}

export const physicalWorkplacesBulkApi = {
  /**
   * Delete all physical workplaces (requires confirm=true)
   */
  deleteAll: async (): Promise<DeleteAllResult> => {
    const response = await apiClient.delete<DeleteAllResult>('/physicalworkplaces/all', {
      params: { confirm: true },
    });
    return response.data;
  },

  /**
   * Delete multiple workplaces by IDs
   */
  deleteMany: async (ids: number[]): Promise<{ deleted: number; errors: string[] }> => {
    const results = { deleted: 0, errors: [] as string[] };
    for (const id of ids) {
      try {
        await apiClient.delete(`/physicalworkplaces/${id}`, { params: { hardDelete: true } });
        results.deleted++;
      } catch (error) {
        results.errors.push(`ID ${id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    return results;
  },

  /**
   * Download CSV template for bulk workplace import
   */
  downloadTemplate: async (): Promise<Blob> => {
    const response = await apiClient.get('/physicalworkplaces/template', {
      responseType: 'blob',
    });
    return response.data;
  },

  /**
   * Export workplaces to CSV file (compatible with import format)
   */
  exportCsv: async (params?: ExportWorkplacesParams): Promise<Blob> => {
    const response = await apiClient.get('/physicalworkplaces/export', {
      params,
      responseType: 'blob',
    });
    return response.data;
  },

  /**
   * Import workplaces from CSV file
   */
  importCsv: async (file: File): Promise<WorkplaceCsvImportResult> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post<WorkplaceCsvImportResult>(
      '/physicalworkplaces/import',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  /**
   * Bulk create workplaces using a template
   */
  bulkCreate: async (dto: BulkCreateWorkplacesDto): Promise<BulkCreateWorkplacesResult> => {
    const response = await apiClient.post<BulkCreateWorkplacesResult>(
      '/physicalworkplaces/bulk',
      dto
    );
    return response.data;
  },
};

// ============================================================
// Statistics API for Dashboard Widgets
// ============================================================

export const physicalWorkplacesStatisticsApi = {
  /**
   * Get overall workplace statistics including occupancy and equipment rates.
   * Used for the main dashboard workplace overview widget.
   */
  getStatistics: async (): Promise<WorkplaceStatistics> => {
    const response = await apiClient.get<WorkplaceStatistics>('/physicalworkplaces/statistics');
    return response.data;
  },

  /**
   * Get occupancy statistics grouped by building.
   * Used for the building occupancy distribution widget.
   */
  getStatisticsByBuilding: async (): Promise<BuildingOccupancy[]> => {
    const response = await apiClient.get<BuildingOccupancy[]>('/physicalworkplaces/statistics/by-building');
    return response.data;
  },

  /**
   * Get occupancy statistics grouped by service/department.
   * Used for the service occupancy distribution widget.
   */
  getStatisticsByService: async (): Promise<ServiceOccupancy[]> => {
    const response = await apiClient.get<ServiceOccupancy[]>('/physicalworkplaces/statistics/by-service');
    return response.data;
  },

  /**
   * Get equipment status breakdown by type.
   * Used for the equipment distribution widget.
   */
  getEquipmentStatistics: async (): Promise<EquipmentTypeStatus[]> => {
    const response = await apiClient.get<EquipmentTypeStatus[]>('/physicalworkplaces/statistics/equipment');
    return response.data;
  },

  /**
   * Get recent workplace changes (occupancy changes, equipment assignments).
   * Used for the activity feed widget on the dashboard.
   */
  getRecentChanges: async (limit = 10, buildingId?: number): Promise<WorkplaceChange[]> => {
    const response = await apiClient.get<WorkplaceChange[]>('/physicalworkplaces/recent-changes', {
      params: { limit, buildingId },
    });
    return response.data;
  },
};

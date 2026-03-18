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

export const physicalWorkplacesBulkApi = {
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

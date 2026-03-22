import { apiClient } from './client';
import {
  AssetType,
  CreateAssetTypeDto,
  UpdateAssetTypeDto,
  Category,
  CategoryWithAssetTypes,
  CreateCategoryDto,
  UpdateCategoryDto,
  Building,
  CreateBuildingDto,
  UpdateBuildingDto,
  Sector,
  CreateSectorDto,
  UpdateSectorDto,
  Service,
  CreateServiceDto,
  UpdateServiceDto,
  SyncResult,
} from '../types/admin.types';

// ============================================================
// Asset Types API
// ============================================================

export const assetTypesApi = {
  getAll: async (includeInactive = true): Promise<AssetType[]> => {
    const response = await apiClient.get<AssetType[]>('/admin/assettypes', {
      params: { includeInactive },
    });
    return response.data;
  },

  getById: async (id: number): Promise<AssetType> => {
    const response = await apiClient.get<AssetType>(`/admin/assettypes/${id}`);
    return response.data;
  },

  create: async (data: CreateAssetTypeDto): Promise<AssetType> => {
    const response = await apiClient.post<AssetType>('/admin/assettypes', data);
    return response.data;
  },

  update: async (id: number, data: UpdateAssetTypeDto): Promise<AssetType> => {
    const response = await apiClient.put<AssetType>(`/admin/assettypes/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/admin/assettypes/${id}`);
  },
};

// ============================================================
// Categories API
// ============================================================

export const categoriesApi = {
  getAll: async (includeInactive = true): Promise<Category[]> => {
    const response = await apiClient.get<Category[]>('/admin/categories', {
      params: { includeInactive },
    });
    return response.data;
  },

  getById: async (id: number): Promise<CategoryWithAssetTypes> => {
    const response = await apiClient.get<CategoryWithAssetTypes>(`/admin/categories/${id}`);
    return response.data;
  },

  create: async (data: CreateCategoryDto): Promise<Category> => {
    const response = await apiClient.post<Category>('/admin/categories', data);
    return response.data;
  },

  update: async (id: number, data: UpdateCategoryDto): Promise<Category> => {
    const response = await apiClient.put<Category>(`/admin/categories/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/admin/categories/${id}`);
  },
};

// ============================================================
// Buildings API
// ============================================================

export const buildingsApi = {
  getAll: async (includeInactive = true): Promise<Building[]> => {
    const response = await apiClient.get<Building[]>('/admin/buildings', {
      params: { includeInactive },
    });
    return response.data;
  },

  getById: async (id: number): Promise<Building> => {
    const response = await apiClient.get<Building>(`/admin/buildings/${id}`);
    return response.data;
  },

  create: async (data: CreateBuildingDto): Promise<Building> => {
    const response = await apiClient.post<Building>('/admin/buildings', data);
    return response.data;
  },

  update: async (id: number, data: UpdateBuildingDto): Promise<Building> => {
    const response = await apiClient.put<Building>(`/admin/buildings/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/admin/buildings/${id}`);
  },
};

// ============================================================
// Sectors API
// ============================================================

export const sectorsApi = {
  getAll: async (includeInactive = true): Promise<Sector[]> => {
    const response = await apiClient.get<Sector[]>('/admin/sectors', {
      params: { includeInactive },
    });
    return response.data;
  },

  getById: async (id: number): Promise<Sector> => {
    const response = await apiClient.get<Sector>(`/admin/sectors/${id}`);
    return response.data;
  },

  create: async (data: CreateSectorDto): Promise<Sector> => {
    const response = await apiClient.post<Sector>('/admin/sectors', data);
    return response.data;
  },

  update: async (id: number, data: UpdateSectorDto): Promise<Sector> => {
    const response = await apiClient.put<Sector>(`/admin/sectors/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/admin/sectors/${id}`);
  },

  syncFromEntra: async (): Promise<SyncResult> => {
    const response = await apiClient.post<SyncResult>('/admin/sectors/sync-from-entra');
    return response.data;
  },
};

// ============================================================
// Services API
// ============================================================

export const servicesApi = {
  getAll: async (includeInactive = true): Promise<Service[]> => {
    const response = await apiClient.get<Service[]>('/admin/services', {
      params: { includeInactive },
    });
    return response.data;
  },

  getById: async (id: number): Promise<Service> => {
    const response = await apiClient.get<Service>(`/admin/services/${id}`);
    return response.data;
  },

  create: async (data: CreateServiceDto): Promise<Service> => {
    const response = await apiClient.post<Service>('/admin/services', data);
    return response.data;
  },

  update: async (id: number, data: UpdateServiceDto): Promise<Service> => {
    const response = await apiClient.put<Service>(`/admin/services/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/admin/services/${id}`);
  },

  getBySector: async (sectorId: number): Promise<Service[]> => {
    const response = await apiClient.get<Service[]>(`/admin/services/by-sector/${sectorId}`);
    return response.data;
  },

  syncFromEntra: async (): Promise<SyncResult> => {
    const response = await apiClient.post<SyncResult>('/admin/services/sync-from-entra');
    return response.data;
  },

  downloadTemplate: async (): Promise<void> => {
    const response = await apiClient.get('/admin/services/template', {
      responseType: 'blob',
    });
    const blob = new Blob([response.data], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'services-template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  exportCsv: async (): Promise<void> => {
    const response = await apiClient.get('/admin/services/export', {
      responseType: 'blob',
    });
    const blob = new Blob([response.data], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `services-export-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  importCsv: async (file: File): Promise<ServiceCsvImportResult> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post<ServiceCsvImportResult>(
      '/admin/services/import',
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      }
    );
    return response.data;
  },

  deleteAll: async (): Promise<{ message: string; deletedCount: number }> => {
    const response = await apiClient.delete<{ message: string; deletedCount: number }>(
      '/admin/services/all',
      { params: { confirm: true } }
    );
    return response.data;
  },

  deleteMany: async (ids: number[]): Promise<{ deleted: number; errors: string[] }> => {
    const results = await Promise.allSettled(
      ids.map((id) => apiClient.delete(`/admin/services/${id}`))
    );
    const deleted = results.filter((r) => r.status === 'fulfilled').length;
    const errors = results
      .filter((r): r is PromiseRejectedResult => r.status === 'rejected')
      .map((r) => r.reason?.message || 'Unknown error');
    return { deleted, errors };
  },
};

// Service CSV Import Result types
export interface ServiceCsvImportRowResult {
  rowNumber: number;
  code: string;
  name: string;
  success: boolean;
  error?: string;
}

export interface ServiceCsvImportResult {
  totalRows: number;
  successCount: number;
  errorCount: number;
  isFullySuccessful: boolean;
  results: ServiceCsvImportRowResult[];
}

import { apiClient } from './client';
import {
  AssetType,
  CreateAssetTypeDto,
  UpdateAssetTypeDto,
  Building,
  CreateBuildingDto,
  UpdateBuildingDto,
  Sector,
  CreateSectorDto,
  UpdateSectorDto,
  Service,
  CreateServiceDto,
  UpdateServiceDto,
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
};

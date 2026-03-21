import { useQuery } from '@tanstack/react-query';
import { buildingsApi } from '../api/admin.api';

/**
 * Query key factory for buildings
 */
export const buildingKeys = {
  all: ['buildings'] as const,
  lists: () => [...buildingKeys.all, 'list'] as const,
  list: (includeInactive?: boolean) => [...buildingKeys.lists(), { includeInactive }] as const,
  details: () => [...buildingKeys.all, 'detail'] as const,
  detail: (id: number) => [...buildingKeys.details(), id] as const,
};

/**
 * Hook to fetch all buildings
 */
export const useBuildings = (includeInactive = false) => {
  return useQuery({
    queryKey: buildingKeys.list(includeInactive),
    queryFn: () => buildingsApi.getAll(includeInactive),
    staleTime: 5 * 60 * 1000, // Buildings don't change often
  });
};

/**
 * Hook to fetch a single building by ID
 */
export const useBuilding = (id: number) => {
  return useQuery({
    queryKey: buildingKeys.detail(id),
    queryFn: () => buildingsApi.getById(id),
    enabled: !!id && id > 0,
  });
};

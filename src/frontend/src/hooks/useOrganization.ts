import { useQuery } from '@tanstack/react-query';
import {
  getOrganizationTree,
  getOrganizationFlatList,
  getServicesBySector,
  getOrganizationNodeChildren,
} from '../api/organization.api';
import type {
  OrganizationTreeParams,
  OrganizationFlatParams,
} from '../types/organization.types';

export const organizationKeys = {
  all: ['organization'] as const,
  tree: (params?: OrganizationTreeParams) => [...organizationKeys.all, 'tree', params] as const,
  flat: (params?: OrganizationFlatParams) => [...organizationKeys.all, 'flat', params] as const,
  servicesBySector: (includeInactive?: boolean) =>
    [...organizationKeys.all, 'services-by-sector', includeInactive] as const,
  children: (nodeId: string, includeInactive?: boolean) =>
    [...organizationKeys.all, 'children', nodeId, includeInactive] as const,
};

/**
 * Hook to fetch the organization tree
 */
export const useOrganizationTree = (params: OrganizationTreeParams = {}) => {
  return useQuery({
    queryKey: organizationKeys.tree(params),
    queryFn: () => getOrganizationTree(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook to fetch a flat list of organization items
 */
export const useOrganizationFlatList = (params: OrganizationFlatParams = {}) => {
  return useQuery({
    queryKey: organizationKeys.flat(params),
    queryFn: () => getOrganizationFlatList(params),
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Hook to fetch services grouped by sector
 */
export const useServicesBySector = (includeInactive = false) => {
  return useQuery({
    queryKey: organizationKeys.servicesBySector(includeInactive),
    queryFn: () => getServicesBySector(includeInactive),
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Hook to fetch children of a node (for lazy loading)
 */
export const useOrganizationNodeChildren = (
  nodeId: string,
  includeInactive = false,
  enabled = true
) => {
  return useQuery({
    queryKey: organizationKeys.children(nodeId, includeInactive),
    queryFn: () => getOrganizationNodeChildren(nodeId, includeInactive),
    staleTime: 5 * 60 * 1000,
    enabled,
  });
};

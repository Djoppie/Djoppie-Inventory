import { apiClient } from './client';
import type {
  OrganizationTreeResponse,
  OrganizationTreeParams,
  OrganizationFlatItem,
  OrganizationFlatParams,
  SectorWithServices,
  OrganizationTreeNode,
} from '../types/organization.types';

const BASE_URL = '/admin/organization';

/**
 * Get the full organization hierarchy as a tree
 */
export const getOrganizationTree = async (
  params: OrganizationTreeParams = {}
): Promise<OrganizationTreeResponse> => {
  const response = await apiClient.get<OrganizationTreeResponse>(`${BASE_URL}/tree`, {
    params: {
      includeInactive: params.includeInactive ?? false,
      includeWorkplaces: params.includeWorkplaces ?? true,
      includeEmployees: params.includeEmployees ?? false,
      maxDepth: params.maxDepth ?? 3,
    },
  });
  return response.data;
};

/**
 * Get a flat list of organization items for search/autocomplete
 */
export const getOrganizationFlatList = async (
  params: OrganizationFlatParams = {}
): Promise<OrganizationFlatItem[]> => {
  const response = await apiClient.get<OrganizationFlatItem[]>(`${BASE_URL}/flat`, {
    params: {
      includeInactive: params.includeInactive ?? false,
      nodeTypes: params.nodeTypes,
      search: params.search,
    },
  });
  return response.data;
};

/**
 * Get services grouped by sector for dropdown
 */
export const getServicesBySector = async (
  includeInactive = false
): Promise<SectorWithServices[]> => {
  const response = await apiClient.get<SectorWithServices[]>(`${BASE_URL}/services-by-sector`, {
    params: { includeInactive },
  });
  return response.data;
};

/**
 * Get children of a specific node (for lazy loading)
 */
export const getOrganizationNodeChildren = async (
  nodeId: string,
  includeInactive = false
): Promise<OrganizationTreeNode[]> => {
  const response = await apiClient.get<OrganizationTreeNode[]>(
    `${BASE_URL}/children/${encodeURIComponent(nodeId)}`,
    { params: { includeInactive } }
  );
  return response.data;
};

/**
 * Search employees for picker components.
 * Returns the minimal shape used by the asset-request employee picker.
 * Backed by the existing `/admin/employees/search` endpoint
 * (see `employeesApi.search` in `admin.api.ts`).
 */
export interface EmployeeSearchResult {
  id: number;
  displayName: string;
  userPrincipalName: string;
  email?: string;
  jobTitle?: string;
  department?: string;
  serviceName?: string;
}

export const searchEmployees = async (
  query: string
): Promise<EmployeeSearchResult[]> => {
  const response = await apiClient.get<
    Array<EmployeeSearchResult & { service?: { name?: string } | null }>
  >('/admin/employees/search', {
    params: { q: query, maxResults: 20 },
  });
  // Backend returns full EmployeeDto with a nested `service` object — flatten the
  // service.name into a top-level `serviceName` so callers don't need to dig.
  return response.data.map((e) => ({
    ...e,
    serviceName: e.serviceName ?? e.service?.name ?? undefined,
  }));
};


/**
 * Organization hierarchy types for tree view and filtering
 */

export type OrganizationNodeType = 'sector' | 'service' | 'workplace' | 'employee';

export interface OrganizationNodeMetadata {
  // Sector metadata
  managerName?: string;
  managerEmail?: string;

  // Service metadata
  sectorId?: number;
  sectorCode?: string;
  memberCount?: number;
  buildingId?: number;
  buildingName?: string;

  // Workplace metadata
  serviceId?: number;
  serviceCode?: string;
  workplaceType?: string;
  currentOccupantName?: string;
  currentOccupantEmail?: string;
  monitorCount?: number;
  hasDockingStation?: boolean;

  // Employee metadata
  entraId?: string;
  email?: string;
  deviceAssetCode?: string;
}

export interface OrganizationTreeNode {
  nodeId: string;
  id: number;
  nodeType: OrganizationNodeType;
  code: string;
  name: string;
  parentNodeId?: string | null;
  isActive: boolean;
  childCount: number;
  totalDescendantCount: number;
  metadata?: OrganizationNodeMetadata;
  children?: OrganizationTreeNode[];
}

export interface OrganizationTreeStats {
  totalSectors: number;
  activeSectors: number;
  totalServices: number;
  activeServices: number;
  totalWorkplaces: number;
  activeWorkplaces: number;
  occupiedWorkplaces: number;
  totalEmployees: number;
}

export interface OrganizationTreeResponse {
  roots: OrganizationTreeNode[];
  stats: OrganizationTreeStats;
}

export interface OrganizationFlatItem {
  nodeId: string;
  id: number;
  nodeType: OrganizationNodeType;
  code: string;
  name: string;
  fullPath: string;
  searchText: string;
  isActive: boolean;
}

export interface SectorWithServices {
  id: number;
  code: string;
  name: string;
  isActive: boolean;
  services: ServiceSummary[];
}

export interface ServiceSummary {
  id: number;
  code: string;
  name: string;
  isActive: boolean;
}

// Request parameters
export interface OrganizationTreeParams {
  includeInactive?: boolean;
  includeWorkplaces?: boolean;
  includeEmployees?: boolean;
  maxDepth?: number;
}

export interface OrganizationFlatParams {
  includeInactive?: boolean;
  nodeTypes?: string;
  search?: string;
}

// Selection types for tree
export interface OrganizationSelection {
  nodeId: string;
  nodeType: OrganizationNodeType;
  id: number;
  code: string;
  name: string;
}

// Filter state using organization tree
export interface OrganizationFilter {
  sectorIds?: number[];
  serviceIds?: number[];
  workplaceIds?: number[];
  includeDescendants?: boolean;
}

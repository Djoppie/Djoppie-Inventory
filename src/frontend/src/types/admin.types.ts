/**
 * Admin types for managing reference data entities.
 * These types are used across admin management pages for CRUD operations.
 */

// ============================================================
// AssetType - Asset category types (LAP, DESK, MON, etc.)
// ============================================================

export interface AssetType {
  [key: string]: unknown;
  id: number;
  code: string;
  name: string;
  description?: string;
  isActive: boolean;
  sortOrder: number;
}

export interface CreateAssetTypeDto {
  code: string;
  name: string;
  description?: string;
  sortOrder?: number;
}

export interface UpdateAssetTypeDto {
  name: string;
  description?: string;
  isActive: boolean;
  sortOrder: number;
}

// ============================================================
// Building - Physical locations (DBK, WZC, etc.)
// ============================================================

export interface Building {
  [key: string]: unknown;
  id: number;
  code: string;
  name: string;
  address?: string;
  isActive: boolean;
  sortOrder: number;
}

export interface CreateBuildingDto {
  code: string;
  name: string;
  address?: string;
  sortOrder?: number;
}

export interface UpdateBuildingDto {
  name: string;
  address?: string;
  isActive: boolean;
  sortOrder: number;
}

// ============================================================
// Sector - Organizational sectors (ORG, RUI, ZOR, etc.)
// ============================================================

export interface Sector {
  [key: string]: unknown;
  id: number;
  code: string;
  name: string;
  description?: string;
  isActive: boolean;
  sortOrder: number;
}

export interface CreateSectorDto {
  code: string;
  name: string;
  description?: string;
  sortOrder?: number;
}

export interface UpdateSectorDto {
  name: string;
  description?: string;
  isActive: boolean;
  sortOrder: number;
}

// ============================================================
// Service - Department services (IT, FIN, HR, etc.)
// ============================================================

export interface Service {
  [key: string]: unknown;
  id: number;
  code: string;
  name: string;
  description?: string;
  sectorId: number;
  sector?: Sector; // Navigation property
  isActive: boolean;
  sortOrder: number;
}

export interface CreateServiceDto {
  code: string;
  name: string;
  description?: string;
  sectorId: number;
  sortOrder?: number;
}

export interface UpdateServiceDto {
  name: string;
  description?: string;
  sectorId: number;
  isActive: boolean;
  sortOrder: number;
}

// ============================================================
// AssetEvent - Asset lifecycle events (future enhancement)
// ============================================================

export enum AssetEventType {
  Created = 'Created',
  Assigned = 'Assigned',
  Transferred = 'Transferred',
  Repaired = 'Repaired',
  Decommissioned = 'Decommissioned',
  StatusChanged = 'StatusChanged',
}

export interface AssetEvent {
  id: number;
  assetId: number;
  eventType: AssetEventType;
  eventDate: string;
  description?: string;
  performedBy?: string;
  createdAt: string;
}

export interface CreateAssetEventDto {
  assetId: number;
  eventType: AssetEventType;
  eventDate: string;
  description?: string;
  performedBy?: string;
}

// ============================================================
// LeaseContract - Asset lease information (future enhancement)
// ============================================================

export interface LeaseContract {
  id: number;
  contractNumber: string;
  vendor: string;
  startDate: string;
  endDate: string;
  monthlyRate?: number;
  description?: string;
  isActive: boolean;
}

export interface CreateLeaseContractDto {
  contractNumber: string;
  vendor: string;
  startDate: string;
  endDate: string;
  monthlyRate?: number;
  description?: string;
}

export interface UpdateLeaseContractDto {
  vendor: string;
  startDate: string;
  endDate: string;
  monthlyRate?: number;
  description?: string;
  isActive: boolean;
}

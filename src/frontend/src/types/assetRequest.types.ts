/**
 * Asset Request Types
 * Matches backend DTOs for on/offboarding asset requests
 */

export type AssetRequestType = 'onboarding' | 'offboarding';

export type AssetRequestStatus =
  | 'Pending'
  | 'Approved'
  | 'InProgress'
  | 'Completed'
  | 'Cancelled'
  | 'Rejected';

export interface AssetRequestDto {
  id: number;
  requestedDate: string; // ISO date string
  requestType: AssetRequestType;
  employeeName: string;
  assetType: string;
  notes?: string;
  status: AssetRequestStatus;
  assignedAssetId?: number;
  assignedAssetCode?: string;
  createdBy: string;
  createdAt: string; // ISO date string
  modifiedBy?: string;
  modifiedAt?: string; // ISO date string
  completedAt?: string; // ISO date string
}

export interface CreateAssetRequestDto {
  requestedDate: string; // ISO date string
  requestType: AssetRequestType;
  employeeName: string;
  assetType: string;
  notes?: string;
}

export interface UpdateAssetRequestDto {
  requestedDate?: string; // ISO date string
  requestType?: AssetRequestType;
  employeeName?: string;
  assetType?: string;
  notes?: string;
  status?: AssetRequestStatus;
  assignedAssetId?: number;
}

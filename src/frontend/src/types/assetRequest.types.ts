/**
 * Asset Request Types — on/offboarding lifecycle.
 * Matches backend DTOs in DjoppieInventory.Core/DTOs/AssetRequestDto.cs.
 */

export type AssetRequestType = 'onboarding' | 'offboarding';

export type AssetRequestStatus =
  | 'Pending'
  | 'Approved'
  | 'InProgress'
  | 'Completed'
  | 'Cancelled'
  | 'Rejected';

export type AssetRequestLineSourceType =
  | 'ToBeAssigned'
  | 'ExistingInventory'
  | 'NewFromTemplate';

export type AssetRequestLineStatus =
  | 'Pending'
  | 'Reserved'
  | 'Completed'
  | 'Skipped';

export type AssetReturnAction =
  | 'ReturnToStock'
  | 'Decommission'
  | 'Reassign';

/**
 * Compact line summary embedded in `AssetRequestSummaryDto.lines` so the
 * list view can show what assets are on each request without a per-row
 * detail fetch.
 */
export interface AssetRequestLineSummaryDto {
  id: number;
  assetTypeName: string;
  status: AssetRequestLineStatus;
  assetCode?: string;
  assetName?: string;
  brand?: string;
  model?: string;
  serialNumber?: string;
  assetTemplateName?: string;
  returnAction?: AssetReturnAction;
}

export interface AssetRequestSummaryDto {
  id: number;
  requestType: AssetRequestType;
  status: AssetRequestStatus;
  requestedFor: string;
  employeeId?: number;
  employeeDisplayName?: string;
  employeeUpn?: string;
  requestedDate: string;
  physicalWorkplaceId?: number;
  physicalWorkplaceName?: string;
  lineCount: number;
  completedLineCount: number;
  createdAt: string;
  completedAt?: string;
  lines: AssetRequestLineSummaryDto[];
}

export interface AssetRequestLineDto {
  id: number;
  assetTypeId: number;
  assetTypeName: string;
  sourceType: AssetRequestLineSourceType;
  assetId?: number;
  assetCode?: string;
  assetName?: string;
  assetTemplateId?: number;
  assetTemplateName?: string;
  status: AssetRequestLineStatus;
  returnAction?: AssetReturnAction;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AssetRequestDetailDto extends AssetRequestSummaryDto {
  notes?: string;
  createdBy: string;
  modifiedBy?: string;
  modifiedAt?: string;
  lines: AssetRequestLineDto[];
}

export interface AssetRequestStatisticsDto {
  activeRequests: number;
  monthlyRequests: number;
  inProgressRequests: number;
}

export interface CreateAssetRequestLineDto {
  assetTypeId: number;
  sourceType: AssetRequestLineSourceType;
  assetId?: number;
  assetTemplateId?: number;
  returnAction?: AssetReturnAction;
  notes?: string;
}

export interface CreateAssetRequestDto {
  requestType: AssetRequestType;
  requestedFor: string;
  employeeId?: number;
  requestedDate: string;
  physicalWorkplaceId?: number;
  notes?: string;
  lines: CreateAssetRequestLineDto[];
}

export interface UpdateAssetRequestDto {
  requestedFor?: string;
  employeeId?: number;
  requestedDate?: string;
  physicalWorkplaceId?: number;
  notes?: string;
}

export interface UpdateAssetRequestLineDto {
  assetTypeId?: number;
  sourceType?: AssetRequestLineSourceType;
  assetId?: number;
  assetTemplateId?: number;
  status?: AssetRequestLineStatus;
  returnAction?: AssetReturnAction;
  notes?: string;
}

export interface AssetRequestFilters {
  type?: AssetRequestType;
  status?: AssetRequestStatus[];
  dateFrom?: string;
  dateTo?: string;
  employeeId?: number;
  q?: string;
}

export interface AssetRequestTransitionDto {
  target: 'Approved' | 'InProgress' | 'Completed' | 'Cancelled';
}

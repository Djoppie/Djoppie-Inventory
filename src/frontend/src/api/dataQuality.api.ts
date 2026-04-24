import { apiClient } from './client';

/** Counts powering the data-quality dashboard widget. */
export interface DataQualitySummary {
  inUseAssetsTotal: number;
  inUseAssetsWithoutWorkplace: number;
  inUseAssetsWithoutEmployee: number;
  employeeBackfillCandidates: number;
  workplaceBackfillCandidates: number;
}

export interface BackfillSample {
  assetId: number;
  assetCode: string;
  currentOwner?: string;
  matchedEmployeeId?: number;
  matchedEmployeeName?: string;
  matchedWorkplaceId?: number;
  matchedWorkplaceCode?: string;
}

export interface BackfillResult {
  dryRun: boolean;
  scanned: number;
  matched: number;
  unmatched: number;
  samples: BackfillSample[];
}

export const getDataQualitySummary = async (): Promise<DataQualitySummary> => {
  const { data } = await apiClient.get<DataQualitySummary>('/admin/data-quality/summary');
  return data;
};

export const backfillAssetEmployees = async (dryRun: boolean): Promise<BackfillResult> => {
  const { data } = await apiClient.post<BackfillResult>('/admin/data-quality/backfill/asset-employees', null, { params: { dryRun } });
  return data;
};

export const backfillAssetWorkplaces = async (dryRun: boolean): Promise<BackfillResult> => {
  const { data } = await apiClient.post<BackfillResult>('/admin/data-quality/backfill/asset-workplaces', null, { params: { dryRun } });
  return data;
};

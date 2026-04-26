import { apiClient } from './client';

/** Per-brand counts inside the in-use scope returned by the summary endpoint. */
export interface BrandDataQuality {
  brand: string;
  inUseTotal: number;
  withoutWorkplace: number;
  withoutEmployee: number;
}

/** Counts powering the data-quality dashboard widget. Counts honour the
 *  optional `categoryIds` filter passed to {@link getDataQualitySummary}. */
export interface DataQualitySummary {
  inUseAssetsTotal: number;
  inUseAssetsWithoutWorkplace: number;
  inUseAssetsWithoutEmployee: number;
  employeeBackfillCandidates: number;
  workplaceBackfillCandidates: number;
  brands: BrandDataQuality[];
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

/**
 * Fetch the data-quality summary, optionally scoped to one or more asset
 * categories. The backend treats no `categoryIds` (or an empty list) as
 * "all categories".
 */
export const getDataQualitySummary = async (
  categoryIds?: number[],
): Promise<DataQualitySummary> => {
  const params = new URLSearchParams();
  (categoryIds ?? []).forEach((id) => params.append('categoryIds', String(id)));
  const { data } = await apiClient.get<DataQualitySummary>(
    '/admin/data-quality/summary',
    { params },
  );
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

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
  /** Workplace-fixed assets currently linked to an Employee instead of a workplace. */
  misalignedWorkplaceAssets: number;
  /** Subset of misalignedWorkplaceAssets that the auto-fix can resolve. */
  misalignedWorkplaceAssetsFixable: number;
  /** User-assigned assets (laptop / desktop / pc) wrongly anchored to a workplace. */
  userAssetsOnWorkplace: number;
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
 * categories and/or asset types. Both filters AND-combine on the backend;
 * leaving them empty returns the full in-use scope.
 */
export const getDataQualitySummary = async (
  categoryIds?: number[],
  assetTypeIds?: number[],
): Promise<DataQualitySummary> => {
  const params = new URLSearchParams();
  (categoryIds ?? []).forEach((id) => params.append('categoryIds', String(id)));
  (assetTypeIds ?? []).forEach((id) => params.append('assetTypeIds', String(id)));
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

// ---------- Workplace misalignment fix ----------

export interface MisalignedAssetRow {
  assetId: number;
  assetCode: string;
  assetName: string;
  assetTypeCode?: string;
  assetTypeName?: string;
  employeeId?: number;
  employeeName?: string;
  targetWorkplaceId?: number;
  targetWorkplaceCode?: string;
  targetBuildingId?: number;
  /** "move" = asset will be relinked, "skip" = no resolvable target workplace. */
  action: 'move' | 'skip';
}

export interface MisalignedAssetResult {
  dryRun: boolean;
  scanned: number;
  moved: number;
  skipped: number;
  rows: MisalignedAssetRow[];
}

/** Dry-run scan of workplace-fixed assets wrongly attached to an employee. */
export const scanMisalignedWorkplaceAssets = async (): Promise<MisalignedAssetResult> => {
  const { data } = await apiClient.get<MisalignedAssetResult>(
    '/admin/data-quality/misaligned-workplace-assets',
  );
  return data;
};

/** Apply the misalignment fix; writes AssetEvent.OwnerChanged audit rows. */
export const fixMisalignedWorkplaceAssets = async (): Promise<MisalignedAssetResult> => {
  const { data } = await apiClient.post<MisalignedAssetResult>(
    '/admin/data-quality/fix-misaligned-workplace-assets',
  );
  return data;
};

// ---------- User assets on workplace (read-only report) ----------

export interface UserAssetOnWorkplaceRow {
  assetId: number;
  assetCode: string;
  assetName: string;
  assetTypeCode?: string;
  assetTypeName?: string;
  employeeId?: number;
  employeeName?: string;
  physicalWorkplaceId: number;
  physicalWorkplaceCode: string;
  currentOccupantName?: string;
}

export interface UserAssetOnWorkplaceResult {
  total: number;
  rows: UserAssetOnWorkplaceRow[];
}

export const scanUserAssetsOnWorkplace = async (): Promise<UserAssetOnWorkplaceResult> => {
  const { data } = await apiClient.get<UserAssetOnWorkplaceResult>(
    '/admin/data-quality/user-assets-on-workplace',
  );
  return data;
};

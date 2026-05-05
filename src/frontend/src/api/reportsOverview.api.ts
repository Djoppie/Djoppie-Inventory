import { apiClient } from './client';
import type { OverviewKpi } from '../types/report.types';

export interface OverviewKpiQueryParams {
  /** Optional asset-type filter; backend narrows asset/intune/activity/trend/attention KPIs. */
  assetTypeIds?: number[];
}

export const getReportsOverview = async (
  params: OverviewKpiQueryParams = {},
): Promise<OverviewKpi> => {
  const search = new URLSearchParams();
  for (const id of params.assetTypeIds ?? []) {
    search.append('assetTypeIds', String(id));
  }
  const query = search.toString();
  const url = query ? `/reports/overview?${query}` : '/reports/overview';
  const { data } = await apiClient.get<OverviewKpi>(url);
  return data;
};

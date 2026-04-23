import { apiClient } from './client';
import type { OverviewKpi } from '../types/report.types';

export const getReportsOverview = async (): Promise<OverviewKpi> => {
  const { data } = await apiClient.get<OverviewKpi>('/reports/overview');
  return data;
};

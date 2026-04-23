import { apiClient } from './client';
import type { IntuneSummary } from '../types/report.types';

export const getIntuneSummary = async (): Promise<IntuneSummary> => {
  const { data } = await apiClient.get<IntuneSummary>('/reports/intune/summary');
  return data;
};

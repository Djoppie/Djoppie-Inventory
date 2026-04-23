import { apiClient } from './client';
import type { EmployeeReportItem, EmployeeTimelineItem } from '../types/report.types';

export const getEmployees = async (): Promise<EmployeeReportItem[]> => {
  const { data } = await apiClient.get<EmployeeReportItem[]>('/reports/employees');
  return data;
};

export const getEmployeeTimeline = async (employeeId: number, take = 50): Promise<EmployeeTimelineItem[]> => {
  const { data } = await apiClient.get<EmployeeTimelineItem[]>(`/reports/employees/${employeeId}/timeline`, { params: { take } });
  return data;
};

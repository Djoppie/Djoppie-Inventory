import { useQuery } from '@tanstack/react-query';
import { getEmployees, getEmployeeTimeline } from '../../api/reportsEmployees.api';
import { reportKeys } from './keys';

export const useEmployeesReport = () => useQuery({
  queryKey: reportKeys.employees(),
  queryFn: getEmployees,
  staleTime: 5 * 60 * 1000,
  gcTime: 10 * 60 * 1000,
});

export const useEmployeeTimeline = (employeeId: number | null | undefined) => useQuery({
  queryKey: reportKeys.employeeTimeline(employeeId ?? 0),
  queryFn: () => getEmployeeTimeline(employeeId!),
  enabled: !!employeeId,
  staleTime: 5 * 60 * 1000,
});

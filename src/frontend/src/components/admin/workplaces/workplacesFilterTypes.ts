import { WorkplaceType } from '../../../types/physicalWorkplace.types';

export interface WorkplacesFilterState {
  selectedServiceIds: Set<number>;
  selectedBuildingIds: Set<number>;
  selectedTypes: Set<WorkplaceType>;
  activeFilter: 'all' | 'active' | 'inactive';
}

export const initialFilterState: WorkplacesFilterState = {
  selectedServiceIds: new Set(),
  selectedBuildingIds: new Set(),
  selectedTypes: new Set(),
  activeFilter: 'all',
};

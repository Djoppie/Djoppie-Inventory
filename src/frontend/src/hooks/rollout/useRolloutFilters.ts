import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { RolloutWorkplaceStatus, RolloutDayStatus } from '../../types/rollout';

// View mode for planning page
export type PlanningViewMode = 'calendar' | 'list';

// Sort options for planning list view
export type PlanningSortOption = 'date-asc' | 'date-desc' | 'name-asc' | 'name-desc' | 'workplaces-asc' | 'workplaces-desc' | 'completion-asc' | 'completion-desc';

// Filter constants
export const PLANNING_SEARCH_DEBOUNCE_MS = 300;
export const PLANNING_VIEW_MODE_STORAGE_KEY = 'djoppie-rollout-planner-view-mode';

// Workplace status filter values
export type WorkplaceStatusFilter = RolloutWorkplaceStatus | 'all';

// Day status filter values
export type DayStatusFilter = RolloutDayStatus | 'all';

/**
 * Rollout Planner Filter State
 */
export interface RolloutPlannerFiltersState {
  // View mode (calendar vs list)
  viewMode: PlanningViewMode;
  // Status filter for days/workplaces
  statusFilter: DayStatusFilter;
  // Service filter
  serviceFilter: string;
  // Building filter
  buildingFilter: string;
  // Search query (debounced for URL)
  searchQuery: string;
  // Sort option (for list view)
  sortBy: PlanningSortOption;
  // Local search input value
  searchInputValue: string;
}

export interface RolloutPlannerFiltersActions {
  setViewMode: (mode: PlanningViewMode) => void;
  setStatusFilter: (value: DayStatusFilter) => void;
  setServiceFilter: (value: string) => void;
  setBuildingFilter: (value: string) => void;
  setSearchQuery: (value: string) => void;
  setSortBy: (value: PlanningSortOption) => void;
  setSearchInputValue: (value: string) => void;
  clearSearch: () => void;
  clearAllFilters: () => void;
  hasActiveFilters: boolean;
  activeFilterCount: number;
}

/**
 * Hook for managing rollout planner filters with URL persistence
 */
export function useRolloutPlannerFilters(): RolloutPlannerFiltersState & RolloutPlannerFiltersActions {
  const [searchParams, setSearchParams] = useSearchParams();

  // Read filters from URL parameters
  const statusFilter = (searchParams.get('status') as DayStatusFilter) || 'all';
  const serviceFilter = searchParams.get('service') || '';
  const buildingFilter = searchParams.get('building') || '';
  const searchQuery = searchParams.get('search') || '';
  const sortBy = (searchParams.get('sort') as PlanningSortOption) || 'date-asc';

  // View mode from localStorage (not URL)
  const [viewMode, setViewModeState] = useState<PlanningViewMode>(() => {
    const savedMode = localStorage.getItem(PLANNING_VIEW_MODE_STORAGE_KEY);
    return savedMode === 'list' ? 'list' : 'calendar';
  });

  // Local state for search input (debounced updates to URL)
  const [searchInputValue, setSearchInputValue] = useState<string>(searchQuery);

  // Update URL parameters helper
  const updateFilters = useCallback((updates: Record<string, string | null>) => {
    setSearchParams((prev) => {
      const newParams = new URLSearchParams(prev);
      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === '') {
          newParams.delete(key);
        } else {
          newParams.set(key, value);
        }
      });
      return newParams;
    }, { replace: true });
  }, [setSearchParams]);

  // Filter setters
  const setStatusFilter = useCallback((value: DayStatusFilter) => {
    updateFilters({ status: value === 'all' ? null : value });
  }, [updateFilters]);

  const setServiceFilter = useCallback((value: string) => {
    updateFilters({ service: value || null });
  }, [updateFilters]);

  const setBuildingFilter = useCallback((value: string) => {
    updateFilters({ building: value || null });
  }, [updateFilters]);

  const setSearchQuery = useCallback((value: string) => {
    updateFilters({ search: value || null });
  }, [updateFilters]);

  const setSortBy = useCallback((value: PlanningSortOption) => {
    updateFilters({ sort: value === 'date-asc' ? null : value });
  }, [updateFilters]);

  const setViewMode = useCallback((mode: PlanningViewMode) => {
    setViewModeState(mode);
  }, []);

  // Clear search
  const clearSearch = useCallback(() => {
    setSearchInputValue('');
    setSearchQuery('');
  }, [setSearchQuery]);

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    setSearchInputValue('');
    setSearchParams(new URLSearchParams(), { replace: true });
  }, [setSearchParams]);

  // Sync search input with URL when URL changes externally
  useEffect(() => {
    setSearchInputValue(searchQuery);
  }, [searchQuery]);

  // Debounce search query updates to URL
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInputValue !== searchQuery) {
        setSearchQuery(searchInputValue);
      }
    }, PLANNING_SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [searchInputValue, searchQuery, setSearchQuery]);

  // Save view mode to localStorage
  useEffect(() => {
    localStorage.setItem(PLANNING_VIEW_MODE_STORAGE_KEY, viewMode);
  }, [viewMode]);

  // Calculate active filters
  const hasActiveFilters = useMemo(() => {
    return statusFilter !== 'all' || serviceFilter !== '' || buildingFilter !== '' || searchQuery !== '';
  }, [statusFilter, serviceFilter, buildingFilter, searchQuery]);

  // Count selected services (comma-separated values)
  const selectedServiceCount = useMemo(() => {
    if (!serviceFilter) return 0;
    return serviceFilter.split(',').filter(Boolean).length;
  }, [serviceFilter]);

  // Count selected buildings (comma-separated values)
  const selectedBuildingCount = useMemo(() => {
    if (!buildingFilter) return 0;
    return buildingFilter.split(',').filter(Boolean).length;
  }, [buildingFilter]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (statusFilter !== 'all') count++;
    // Count each selected service individually for more accurate filter count
    count += selectedServiceCount;
    // Count each selected building individually
    count += selectedBuildingCount;
    if (searchQuery !== '') count++;
    return count;
  }, [statusFilter, selectedServiceCount, selectedBuildingCount, searchQuery]);

  return {
    // State
    viewMode,
    statusFilter,
    serviceFilter,
    buildingFilter,
    searchQuery,
    sortBy,
    searchInputValue,
    // Actions
    setViewMode,
    setStatusFilter,
    setServiceFilter,
    setBuildingFilter,
    setSearchQuery,
    setSortBy,
    setSearchInputValue,
    clearSearch,
    clearAllFilters,
    hasActiveFilters,
    activeFilterCount,
  };
}

/**
 * Rollout Execution Filter State
 */
export interface RolloutExecutionFiltersState {
  // Service filter
  serviceFilter: string;
  // Building filter
  buildingFilter: string;
  // Workplace status filter
  workplaceStatusFilter: WorkplaceStatusFilter;
  // Search query
  searchQuery: string;
  // Local search input
  searchInputValue: string;
}

export interface RolloutExecutionFiltersActions {
  setServiceFilter: (value: string) => void;
  setBuildingFilter: (value: string) => void;
  setWorkplaceStatusFilter: (value: WorkplaceStatusFilter) => void;
  setSearchQuery: (value: string) => void;
  setSearchInputValue: (value: string) => void;
  clearSearch: () => void;
  clearAllFilters: () => void;
  hasActiveFilters: boolean;
  activeFilterCount: number;
}

/**
 * Hook for managing rollout execution page filters with URL persistence
 */
export function useRolloutExecutionFilters(): RolloutExecutionFiltersState & RolloutExecutionFiltersActions {
  const [searchParams, setSearchParams] = useSearchParams();

  // Read filters from URL parameters (preserve dayId)
  const serviceFilter = searchParams.get('service') || '';
  const buildingFilter = searchParams.get('building') || '';
  const workplaceStatusFilter = (searchParams.get('wpStatus') as WorkplaceStatusFilter) || 'all';
  const searchQuery = searchParams.get('search') || '';

  // Local state for search input
  const [searchInputValue, setSearchInputValue] = useState<string>(searchQuery);

  // Update URL parameters (preserving dayId)
  const updateFilters = useCallback((updates: Record<string, string | null>) => {
    setSearchParams((prev) => {
      const newParams = new URLSearchParams(prev);
      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === '') {
          newParams.delete(key);
        } else {
          newParams.set(key, value);
        }
      });
      return newParams;
    }, { replace: true });
  }, [setSearchParams]);

  // Filter setters
  const setServiceFilter = useCallback((value: string) => {
    updateFilters({ service: value || null });
  }, [updateFilters]);

  const setBuildingFilter = useCallback((value: string) => {
    updateFilters({ building: value || null });
  }, [updateFilters]);

  const setWorkplaceStatusFilter = useCallback((value: WorkplaceStatusFilter) => {
    updateFilters({ wpStatus: value === 'all' ? null : value });
  }, [updateFilters]);

  const setSearchQuery = useCallback((value: string) => {
    updateFilters({ search: value || null });
  }, [updateFilters]);

  // Clear search
  const clearSearch = useCallback(() => {
    setSearchInputValue('');
    setSearchQuery('');
  }, [setSearchQuery]);

  // Clear all filters (preserve dayId)
  const clearAllFilters = useCallback(() => {
    setSearchInputValue('');
    setSearchParams((prev) => {
      const newParams = new URLSearchParams();
      // Preserve dayId if present
      const dayId = prev.get('dayId');
      if (dayId) {
        newParams.set('dayId', dayId);
      }
      return newParams;
    }, { replace: true });
  }, [setSearchParams]);

  // Sync search input with URL
  useEffect(() => {
    setSearchInputValue(searchQuery);
  }, [searchQuery]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInputValue !== searchQuery) {
        setSearchQuery(searchInputValue);
      }
    }, PLANNING_SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [searchInputValue, searchQuery, setSearchQuery]);

  // Calculate active filters
  const hasActiveFilters = useMemo(() => {
    return serviceFilter !== '' || buildingFilter !== '' || workplaceStatusFilter !== 'all' || searchQuery !== '';
  }, [serviceFilter, buildingFilter, workplaceStatusFilter, searchQuery]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (serviceFilter !== '') count++;
    if (buildingFilter !== '') count++;
    if (workplaceStatusFilter !== 'all') count++;
    if (searchQuery !== '') count++;
    return count;
  }, [serviceFilter, buildingFilter, workplaceStatusFilter, searchQuery]);

  return {
    // State
    serviceFilter,
    buildingFilter,
    workplaceStatusFilter,
    searchQuery,
    searchInputValue,
    // Actions
    setServiceFilter,
    setBuildingFilter,
    setWorkplaceStatusFilter,
    setSearchQuery,
    setSearchInputValue,
    clearSearch,
    clearAllFilters,
    hasActiveFilters,
    activeFilterCount,
  };
}

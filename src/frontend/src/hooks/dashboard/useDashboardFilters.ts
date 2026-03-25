import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SortOption, SEARCH_DEBOUNCE_MS, VIEW_MODE_STORAGE_KEY } from '../../constants/dashboard.constants';
import { ViewMode } from '../../components/common/ViewToggle';

export interface DashboardFiltersState {
  statusFilter: string;
  categoryFilter: string;
  serviceFilter: string;
  searchQuery: string;
  sortBy: SortOption;
  viewMode: ViewMode;
  searchInputValue: string;
}

export interface DashboardFiltersActions {
  setStatusFilter: (value: string) => void;
  setCategoryFilter: (value: string) => void;
  setServiceFilter: (value: string) => void;
  setSearchQuery: (value: string) => void;
  setSortBy: (value: SortOption) => void;
  setViewMode: (mode: ViewMode) => void;
  setSearchInputValue: (value: string) => void;
  handleStatusChipClick: (status: string) => void;
  clearSearch: () => void;
}

export function useDashboardFilters(): DashboardFiltersState & DashboardFiltersActions {
  const [searchParams, setSearchParams] = useSearchParams();

  // Read filters from URL parameters (persisted across navigation)
  const statusFilter = searchParams.get('status') || '';
  const categoryFilter = searchParams.get('category') || '';
  const serviceFilter = searchParams.get('service') || '';
  const searchQuery = searchParams.get('search') || '';
  const sortBy = (searchParams.get('sort') as SortOption) || 'date-newest';

  // View mode from localStorage
  const [viewMode, setViewModeState] = useState<ViewMode>(() => {
    const savedMode = localStorage.getItem(VIEW_MODE_STORAGE_KEY);
    return (savedMode === 'card' || savedMode === 'table') ? savedMode : 'card';
  });

  // Local state for search input (to avoid URL updates on every keystroke)
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

  // Filter setters that update URL
  const setStatusFilter = useCallback((value: string) => {
    updateFilters({ status: value || null });
  }, [updateFilters]);

  const setCategoryFilter = useCallback((value: string) => {
    updateFilters({ category: value || null });
  }, [updateFilters]);

  const setServiceFilter = useCallback((value: string) => {
    updateFilters({ service: value || null });
  }, [updateFilters]);

  const setSearchQuery = useCallback((value: string) => {
    updateFilters({ search: value || null });
  }, [updateFilters]);

  const setSortBy = useCallback((value: SortOption) => {
    updateFilters({ sort: value === 'date-newest' ? null : value });
  }, [updateFilters]);

  const setViewMode = useCallback((mode: ViewMode) => {
    setViewModeState(mode);
  }, []);

  // Toggle status filter on chip click
  const handleStatusChipClick = useCallback((status: string) => {
    setStatusFilter(statusFilter === status ? '' : status);
  }, [statusFilter, setStatusFilter]);

  // Clear search
  const clearSearch = useCallback(() => {
    setSearchInputValue('');
    setSearchQuery('');
  }, [setSearchQuery]);

  // Sync search input with URL parameter when it changes externally (e.g., browser back)
  useEffect(() => {
    setSearchInputValue(searchQuery);
  }, [searchQuery]);

  // Debounce search query updates to URL
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInputValue !== searchQuery) {
        setSearchQuery(searchInputValue);
      }
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [searchInputValue, searchQuery, setSearchQuery]);

  // Save view mode to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(VIEW_MODE_STORAGE_KEY, viewMode);
  }, [viewMode]);

  return {
    // State
    statusFilter,
    categoryFilter,
    serviceFilter,
    searchQuery,
    sortBy,
    viewMode,
    searchInputValue,
    // Actions
    setStatusFilter,
    setCategoryFilter,
    setServiceFilter,
    setSearchQuery,
    setSortBy,
    setViewMode,
    setSearchInputValue,
    handleStatusChipClick,
    clearSearch,
  };
}

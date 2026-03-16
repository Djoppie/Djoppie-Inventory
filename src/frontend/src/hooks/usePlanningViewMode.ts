/**
 * Hook for managing planning view mode preference
 *
 * Features:
 * - Persists user preference to localStorage
 * - Provides current mode and setter
 */

import { useCallback, useSyncExternalStore } from 'react';
import type { PlanningViewMode } from '../types/rollout';

const STORAGE_KEY = 'djoppie-planning-view-mode';

/**
 * Load saved preference from localStorage
 */
const loadPreference = (): PlanningViewMode => {
  if (typeof window === 'undefined') return 'calendar';
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'calendar' || saved === 'list') {
      return saved;
    }
  } catch {
    // Ignore storage errors
  }
  return 'calendar';
};

/**
 * Save preference to localStorage
 */
const savePreference = (mode: PlanningViewMode): void => {
  try {
    localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    // Ignore storage errors
  }
};

// For syncing across tabs/windows
let listeners: (() => void)[] = [];
const subscribe = (listener: () => void) => {
  listeners = [...listeners, listener];
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
};

const notifyListeners = () => {
  listeners.forEach((listener) => listener());
};

/**
 * Hook for managing planning view mode with localStorage persistence
 */
export const usePlanningViewMode = () => {
  // Use useSyncExternalStore for better SSR compatibility and external state sync
  const mode = useSyncExternalStore(
    subscribe,
    loadPreference,
    () => 'calendar' as PlanningViewMode // Server snapshot
  );

  const setMode = useCallback((newMode: PlanningViewMode) => {
    savePreference(newMode);
    notifyListeners();
  }, []);

  return { mode, setMode };
};

// Export utility functions
export { loadPreference, savePreference };

/**
 * Rollout Module Constants
 *
 * Centralized constants for the rollout workflow to avoid magic numbers
 * and ensure consistency across components.
 */

// Timing constants (milliseconds)
export const ROLLOUT_TIMING = {
  /** Debounce delay for serial number auto-search */
  SERIAL_SEARCH_DEBOUNCE_MS: 500,

  /** Delay before clearing scan success message */
  SCAN_SUCCESS_CLEAR_DELAY_MS: 1000,

  /** Auto-hide duration for snackbar notifications */
  SNACKBAR_AUTO_HIDE_MS: 2000,

  /** Delay before closing completion dialog */
  COMPLETION_DIALOG_CLOSE_DELAY_MS: 2000,

  /** Cache stale time for Graph API queries (5 minutes) */
  GRAPH_CACHE_STALE_TIME_MS: 5 * 60 * 1000,
} as const;

// Status constants
export const WORKPLACE_STATUS = {
  PENDING: 'Pending',
  READY: 'Ready',
  IN_PROGRESS: 'InProgress',
  COMPLETED: 'Completed',
} as const;

export const SESSION_STATUS = {
  PLANNING: 'Planning',
  READY: 'Ready',
  IN_PROGRESS: 'InProgress',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
} as const;

export const DAY_STATUS = {
  PLANNING: 'Planning',
  READY: 'Ready',
  COMPLETED: 'Completed',
} as const;

// Asset plan status
export const ASSET_PLAN_STATUS = {
  PENDING: 'pending',
  INSTALLED: 'installed',
  SKIPPED: 'skipped',
} as const;

// Return device status (for old devices being returned)
export const RETURN_DEVICE_STATUS = {
  DEFECT: 'Defect',
  UIT_DIENST: 'UitDienst',
} as const;

// Sorting order for workplaces (lower = higher priority)
export const WORKPLACE_STATUS_SORT_ORDER: Record<string, number> = {
  [WORKPLACE_STATUS.IN_PROGRESS]: 0,
  [WORKPLACE_STATUS.READY]: 1,
  [WORKPLACE_STATUS.PENDING]: 2,
  [WORKPLACE_STATUS.COMPLETED]: 3,
};

// Equipment types
export const EQUIPMENT_TYPE = {
  LAPTOP: 'laptop',
  DESKTOP: 'desktop',
  MONITOR: 'monitor',
  DOCKING: 'docking',
  KEYBOARD: 'keyboard',
  MOUSE: 'mouse',
} as const;

// Equipment labels (Dutch)
export const EQUIPMENT_LABELS: Record<string, string> = {
  [EQUIPMENT_TYPE.LAPTOP]: 'Laptop',
  [EQUIPMENT_TYPE.DESKTOP]: 'Desktop',
  [EQUIPMENT_TYPE.MONITOR]: 'Monitor',
  [EQUIPMENT_TYPE.DOCKING]: 'Docking Station',
  [EQUIPMENT_TYPE.KEYBOARD]: 'Toetsenbord',
  [EQUIPMENT_TYPE.MOUSE]: 'Muis',
};

// Equipment icons
export const EQUIPMENT_ICONS: Record<string, string> = {
  [EQUIPMENT_TYPE.LAPTOP]: '💻',
  [EQUIPMENT_TYPE.DESKTOP]: '🖥️',
  [EQUIPMENT_TYPE.MONITOR]: '🖵',
  [EQUIPMENT_TYPE.DOCKING]: '🔌',
  [EQUIPMENT_TYPE.KEYBOARD]: '⌨️',
  [EQUIPMENT_TYPE.MOUSE]: '🖱️',
};

// UI constants
export const ROLLOUT_UI = {
  /** Maximum workplaces to import in one batch */
  MAX_BULK_IMPORT_WORKPLACES: 100,

  /** Minimum serial number length for auto-search */
  MIN_SERIAL_LENGTH_FOR_SEARCH: 3,
} as const;

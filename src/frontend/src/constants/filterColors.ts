/**
 * Filter Colors Constants
 *
 * Centralized color definitions for filter components across the application.
 * These colors ensure visual consistency for service, sector, and building filters.
 *
 * Usage:
 *   import { FILTER_COLORS } from '../constants/filterColors';
 *   // or
 *   import { SERVICE_COLOR, BUILDING_COLOR } from '../constants/filterColors';
 */

/**
 * Service/Sector filter color (Teal)
 * Used for: diensten, sectoren, and related organizational filters
 */
export const SERVICE_COLOR = '#009688';

/**
 * Building/Location filter color (Amber/Yellow)
 * Used for: gebouwen, locaties, and physical location filters
 */
export const BUILDING_COLOR = '#F59E0B';

/**
 * Sector filter color (Blue)
 * Used for: sector headers in organization hierarchy
 * Note: Services within sectors use SERVICE_COLOR (teal)
 */
export const SECTOR_COLOR = '#1976d2';

/**
 * Combined filter colors object for convenient imports
 */
export const FILTER_COLORS = {
  /** Teal - For services and organizational units */
  SERVICE: SERVICE_COLOR,

  /** Amber/Yellow - For buildings and physical locations */
  BUILDING: BUILDING_COLOR,

  /** Blue - For sector headers */
  SECTOR: SECTOR_COLOR,

  /** Orange - For planning/scheduling domain */
  PLANNING: '#FF7700',

  /** Green - For completed/success states */
  SUCCESS: '#4CAF50',

  /** Red - For errors and clear/delete actions */
  DANGER: '#f44336',
} as const;

/**
 * Helper to get alpha version of a filter color
 * Use with MUI's alpha() function:
 *   import { alpha } from '@mui/material';
 *   bgcolor: alpha(SERVICE_COLOR, 0.15)
 */
export type FilterColorKey = keyof typeof FILTER_COLORS;

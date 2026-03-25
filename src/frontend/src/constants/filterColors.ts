/**
 * Filter Colors Constants
 *
 * Centralized color definitions for filter components across the application.
 * These colors ensure visual consistency throughout the application.
 *
 * Organization Hierarchy:
 *   Sector (blue) → Service (teal) → Workplace (teal)
 *
 * Domain Colors:
 *   - Employees: Purple
 *   - Assets: Djoppie Orange
 *   - Buildings: Amber
 *
 * Usage:
 *   import { FILTER_COLORS } from '../constants/filterColors';
 *   // or
 *   import { SERVICE_COLOR, BUILDING_COLOR, EMPLOYEE_COLOR, ASSET_COLOR } from '../constants/filterColors';
 */

// =============================================================================
// ORGANIZATION HIERARCHY COLORS
// =============================================================================

/**
 * Sector color (Blue)
 * Used for: sector headers in organization hierarchy
 */
export const SECTOR_COLOR = '#1976d2';

/**
 * Service color (Teal)
 * Used for: diensten and related organizational filters
 */
export const SERVICE_COLOR = '#009688';

/**
 * Workplace color (Teal - same as service, part of hierarchy)
 * Used for: fysieke werkplekken (aligned with sector-service-workplace hierarchy)
 */
export const WORKPLACE_COLOR = '#009688';

// =============================================================================
// DOMAIN COLORS
// =============================================================================

/**
 * Employee color (Purple)
 * Used for: werknemers, occupants, users
 */
export const EMPLOYEE_COLOR = '#7b1fa2';

/**
 * Asset color (Djoppie Orange)
 * Used for: assets, equipment, inventory items
 */
export const ASSET_COLOR = '#FF7700';

/**
 * Building/Location filter color (Amber/Yellow)
 * Used for: gebouwen, locaties, and physical location filters
 */
export const BUILDING_COLOR = '#F59E0B';

// =============================================================================
// STATUS COLORS
// =============================================================================

/**
 * Success color (Green)
 * Used for: completed states, success messages
 */
export const SUCCESS_COLOR = '#4CAF50';

/**
 * Danger color (Red)
 * Used for: errors, delete actions, warnings
 */
export const DANGER_COLOR = '#f44336';

/**
 * Combined filter colors object for convenient imports
 */
export const FILTER_COLORS = {
  // Organization hierarchy
  SECTOR: SECTOR_COLOR,
  SERVICE: SERVICE_COLOR,
  WORKPLACE: WORKPLACE_COLOR,

  // Domain colors
  EMPLOYEE: EMPLOYEE_COLOR,
  ASSET: ASSET_COLOR,
  BUILDING: BUILDING_COLOR,

  // Status colors
  SUCCESS: SUCCESS_COLOR,
  DANGER: DANGER_COLOR,

  /** @deprecated Use ASSET_COLOR instead */
  PLANNING: ASSET_COLOR,
} as const;

/**
 * Helper to get alpha version of a filter color
 * Use with MUI's alpha() function:
 *   import { alpha } from '@mui/material';
 *   bgcolor: alpha(SERVICE_COLOR, 0.15)
 */
export type FilterColorKey = keyof typeof FILTER_COLORS;

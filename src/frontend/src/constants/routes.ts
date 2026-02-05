/**
 * Application route constants.
 * Centralizes all route paths to ensure consistency across the application.
 */

export const ROUTES = {
  /** Dashboard/Home page showing asset list */
  DASHBOARD: '/',

  /** QR code scanner page */
  SCAN: '/scan',

  /** Create new asset page */
  ASSETS_NEW: '/assets/new',

  /** Bulk create assets page */
  ASSETS_BULK_NEW: '/assets/bulk-create',

  /** Asset detail page (requires :id parameter) */
  ASSET_DETAIL: '/assets/:id',

  /** Edit asset page (requires :id parameter) */
  ASSET_EDIT: '/assets/:id/edit',

  /** Asset templates management page */
  TEMPLATES: '/templates',
} as const;

/**
 * Helper functions for building dynamic routes with parameters
 */
export const buildRoute = {
  /**
   * Builds the asset detail route with the specified asset ID.
   * @param id - The asset ID
   * @returns The full route path
   */
  assetDetail: (id: number | string) => `/assets/${id}`,

  /**
   * Builds the asset edit route with the specified asset ID.
   * @param id - The asset ID
   * @returns The full route path
   */
  assetEdit: (id: number | string) => `/assets/${id}/edit`,
} as const;

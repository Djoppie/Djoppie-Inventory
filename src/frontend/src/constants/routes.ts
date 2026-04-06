/**
 * Application route constants.
 * Centralizes all route paths to ensure consistency across the application.
 */

export const ROUTES = {
  /** Dashboard/Home page showing asset list */
  DASHBOARD: '/',

  /** QR code scanner page */
  SCAN: '/scan',

  /** Device management hub page */
  DEVICE_MANAGEMENT: '/devices',

  /** Create new asset page */
  ASSETS_NEW: '/devices/new',

  /** Bulk create assets page */
  ASSETS_BULK_NEW: '/devices/bulk-create',

  /** Asset detail page (requires :id parameter) */
  ASSET_DETAIL: '/assets/:id',

  /** Edit asset page (requires :id parameter) */
  ASSET_EDIT: '/assets/:id/edit',

  /** Asset templates management page */
  TEMPLATES: '/templates',

  /** Admin management page */
  ADMIN: '/admin',

  /** Admin Assets section (Categories, Asset Types, Intune Sync) */
  ADMIN_ASSETS: '/admin/assets',

  /** Admin Organisation section (Sectors, Services, Employees) */
  ADMIN_ORGANISATION: '/admin/organisation',

  /** Admin Locations section (Physical Workplaces, Buildings) */
  ADMIN_LOCATIONS: '/admin/locations',

  /** Installed software page (requires :id parameter) */
  ASSET_SOFTWARE: '/assets/:id/software',

  /** Asset Intune management page (requires :id parameter) */
  ASSET_INTUNE: '/assets/:id/intune',

  /** Rollout list page */
  ROLLOUTS: '/rollouts',

  /** New rollout planner page */
  ROLLOUTS_NEW: '/rollouts/new',

  /** Edit rollout planner page (requires :id parameter) */
  ROLLOUT_EDIT: '/rollouts/:id',

  /** Rollout execution page (requires :id parameter) */
  ROLLOUT_EXECUTE: '/rollouts/:id/execute',

  /** Rollout report page (requires :id parameter) */
  ROLLOUT_REPORT: '/rollouts/:id/report',

  /** Rollout day detail page (requires :id and :dayId parameters) */
  ROLLOUT_DAY_DETAIL: '/rollouts/:id/days/:dayId',

  /** Rollout day edit page (requires :id and :dayId parameters) */
  ROLLOUT_DAY_EDIT: '/rollouts/:id/days/:dayId/edit',

  /** Autopilot devices list page */
  AUTOPILOT_DEVICES: '/devices/autopilot',

  /** Autopilot device timeline page (requires :serialNumber parameter) */
  AUTOPILOT_TIMELINE: '/devices/autopilot/timeline/:serialNumber',

  /** Physical workplaces management page */
  PHYSICAL_WORKPLACES: '/workplaces',

  /** Physical workplace detail page (requires :id parameter) */
  WORKPLACE_DETAIL: '/workplaces/:id',

  /** Workplace reports page */
  WORKPLACE_REPORTS: '/workplaces/reports',

  /** Requests dashboard page */
  REQUESTS: '/requests',

  /** Onboarding requests page */
  REQUESTS_ONBOARDING: '/requests/onboarding',

  /** Offboarding requests page */
  REQUESTS_OFFBOARDING: '/requests/offboarding',

  /** Requests reports (history of swaps, onboarding, offboarding) */
  REQUESTS_REPORTS: '/requests/reports',

  /** Laptop swap / Device deployment page */
  LAPTOP_SWAP: '/laptop-swap',

  /** Deployment history page */
  DEPLOYMENT_HISTORY: '/laptop-swap/history',

  /** Reports hub page */
  REPORTS: '/reports',
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

  /**
   * Builds the installed software route with the specified asset ID.
   * @param id - The asset ID
   * @returns The full route path
   */
  assetSoftware: (id: number | string) => `/assets/${id}/software`,

  /**
   * Builds the Intune management route with the specified asset ID.
   * @param id - The asset ID
   * @returns The full route path
   */
  assetIntune: (id: number | string) => `/assets/${id}/intune`,

  /**
   * Builds the rollout edit route with the specified rollout ID.
   * @param id - The rollout ID
   * @returns The full route path
   */
  rolloutEdit: (id: number | string) => `/rollouts/${id}`,

  /**
   * Builds the rollout execution route with the specified rollout ID.
   * @param id - The rollout ID
   * @returns The full route path
   */
  rolloutExecute: (id: number | string) => `/rollouts/${id}/execute`,

  /**
   * Builds the rollout report route with the specified rollout ID.
   * @param id - The rollout ID
   * @returns The full route path
   */
  rolloutReport: (id: number | string) => `/rollouts/${id}/report`,

  /**
   * Builds the rollout day detail route.
   * @param sessionId - The rollout session ID
   * @param dayId - The rollout day ID
   * @returns The full route path
   */
  rolloutDayDetail: (sessionId: number | string, dayId: number | string) => `/rollouts/${sessionId}/days/${dayId}`,

  /**
   * Builds the rollout day edit route.
   * @param sessionId - The rollout session ID
   * @param dayId - The rollout day ID
   * @returns The full route path
   */
  rolloutDayEdit: (sessionId: number | string, dayId: number | string) => `/rollouts/${sessionId}/days/${dayId}/edit`,

  /**
   * Builds the Autopilot timeline route with the specified serial number.
   * @param serialNumber - The device serial number
   * @returns The full route path
   */
  autopilotTimeline: (serialNumber: string) => `/devices/autopilot/timeline/${serialNumber}`,

  /**
   * Builds the workplace detail route with the specified workplace ID.
   * @param id - The workplace ID
   * @returns The full route path
   */
  workplaceDetail: (id: number | string) => `/workplaces/${id}`,
} as const;

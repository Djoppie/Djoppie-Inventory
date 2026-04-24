/**
 * Application route constants.
 * Centralizes all route paths to ensure consistency across the application.
 */

export const ROUTES = {
  /** Dashboard/Home page showing asset list */
  DASHBOARD: '/',

  /** QR code scanner page */
  SCAN: '/inventory/scan',

  /** Inventory overview/dashboard page */
  INVENTORY: '/inventory',

  /** Inventory assets list page */
  INVENTORY_ASSETS: '/inventory/assets',

  /** Create new asset page */
  ASSETS_NEW: '/inventory/assets/new',

  /** Bulk create assets page */
  ASSETS_BULK_NEW: '/inventory/assets/bulk-create',

  /** Asset detail page (requires :id parameter) */
  ASSET_DETAIL: '/inventory/assets/:id',

  /** Edit asset page (requires :id parameter) */
  ASSET_EDIT: '/inventory/assets/:id/edit',

  /** Asset templates management page */
  TEMPLATES: '/inventory/templates',

  /** Admin management page */
  ADMIN: '/admin',

  /** Admin Assets section (Categories, Asset Types, Intune Sync) */
  ADMIN_ASSETS: '/admin/assets',

  /** Admin Organisation section (Sectors, Services, Employees) */
  ADMIN_ORGANISATION: '/admin/organisation',

  /** Admin Locations section (Physical Workplaces, Buildings) */
  ADMIN_LOCATIONS: '/admin/locations',

  /** Installed software page (requires :id parameter) */
  ASSET_SOFTWARE: '/inventory/assets/:id/software',

  /** Asset Intune management page (requires :id parameter) */
  ASSET_INTUNE: '/inventory/assets/:id/intune',

  /** Operations dashboard page */
  OPERATIONS: '/operations',

  /** Rollout list page */
  ROLLOUTS: '/operations/rollouts',

  /** New rollout planner page */
  ROLLOUTS_NEW: '/operations/rollouts/new',

  /** Edit rollout planner page (requires :id parameter) */
  ROLLOUT_EDIT: '/operations/rollouts/:id',

  /** Rollout execution page (requires :id parameter) */
  ROLLOUT_EXECUTE: '/operations/rollouts/:id/execute',

  /** Rollout report page (requires :id parameter) */
  ROLLOUT_REPORT: '/operations/rollouts/:id/report',

  /** Rollout day detail page (requires :id and :dayId parameters) */
  ROLLOUT_DAY_DETAIL: '/operations/rollouts/:id/days/:dayId',

  /** Rollout day edit page (requires :id and :dayId parameters) */
  ROLLOUT_DAY_EDIT: '/operations/rollouts/:id/days/:dayId/edit',

  /** Autopilot devices list page */
  AUTOPILOT_DEVICES: '/devices/autopilot',

  /** Autopilot device timeline page (requires :serialNumber parameter) */
  AUTOPILOT_TIMELINE: '/devices/autopilot/timeline/:serialNumber',

  /** Intune Device Dashboard page */
  INTUNE_DASHBOARD: '/devices/intune',

  /** Physical workplaces management page */
  PHYSICAL_WORKPLACES: '/workplaces',

  /** Physical workplace detail page (requires :id parameter) */
  WORKPLACE_DETAIL: '/workplaces/:id',

  /** Workplace reports page */
  WORKPLACE_REPORTS: '/workplaces/reports',

  /** Requests dashboard page */
  REQUESTS: '/operations/requests',

  /** Onboarding requests page */
  REQUESTS_ONBOARDING: '/operations/requests/onboarding',

  /** Offboarding requests page */
  REQUESTS_OFFBOARDING: '/operations/requests/offboarding',

  /** Requests reports (history of swaps, onboarding, offboarding) */
  REQUESTS_REPORTS: '/operations/requests/reports',

  /** Laptop swap / Device deployment page */
  LAPTOP_SWAP: '/operations/swaps',

  /** Deployment history page */
  DEPLOYMENT_HISTORY: '/operations/swaps/history',

  /** Reports hub page */
  REPORTS: '/reports',

  /** Monitoring hub page */
  MONITORING: '/monitoring',

  /** Monitoring → Applicaties (Entra ID app registration credentials) */
  MONITORING_APPLICATIONS: '/monitoring/applications',

  /** Monitoring → Users (MS365 license assignments) */
  MONITORING_USERS: '/monitoring/users',
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
  assetDetail: (id: number | string) => `/inventory/assets/${id}`,

  /**
   * Builds the asset edit route with the specified asset ID.
   * @param id - The asset ID
   * @returns The full route path
   */
  assetEdit: (id: number | string) => `/inventory/assets/${id}/edit`,

  /**
   * Builds the installed software route with the specified asset ID.
   * @param id - The asset ID
   * @returns The full route path
   */
  assetSoftware: (id: number | string) => `/inventory/assets/${id}/software`,

  /**
   * Builds the Intune management route with the specified asset ID.
   * @param id - The asset ID
   * @returns The full route path
   */
  assetIntune: (id: number | string) => `/inventory/assets/${id}/intune`,

  /**
   * Builds the rollout edit route with the specified rollout ID.
   * @param id - The rollout ID
   * @returns The full route path
   */
  rolloutEdit: (id: number | string) => `/operations/rollouts/${id}`,

  /**
   * Builds the rollout execution route with the specified rollout ID.
   * @param id - The rollout ID
   * @returns The full route path
   */
  rolloutExecute: (id: number | string) => `/operations/rollouts/${id}/execute`,

  /**
   * Builds the rollout report route with the specified rollout ID.
   * @param id - The rollout ID
   * @returns The full route path
   */
  rolloutReport: (id: number | string) => `/operations/rollouts/${id}/report`,

  /**
   * Builds the rollout day detail route.
   * @param sessionId - The rollout session ID
   * @param dayId - The rollout day ID
   * @returns The full route path
   */
  rolloutDayDetail: (sessionId: number | string, dayId: number | string) => `/operations/rollouts/${sessionId}/days/${dayId}`,

  /**
   * Builds the rollout day edit route.
   * @param sessionId - The rollout session ID
   * @param dayId - The rollout day ID
   * @returns The full route path
   */
  rolloutDayEdit: (sessionId: number | string, dayId: number | string) => `/operations/rollouts/${sessionId}/days/${dayId}/edit`,

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

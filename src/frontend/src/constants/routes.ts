/**
 * Application route constants.
 * Centralizes all route paths to ensure consistency across the application.
 */

export const ROUTES = {
  /** Dashboard/Home page - overview with summary widgets */
  DASHBOARD: '/',

  /** QR code scanner page */
  SCAN: '/scan',

  // ── Inventory ──────────────────────────────────────────────
  /** Inventory page (full asset list) */
  INVENTORY: '/inventory',

  /** Create new asset page */
  INVENTORY_NEW: '/inventory/new',

  /** Bulk create assets page */
  INVENTORY_BULK_CREATE: '/inventory/bulk-create',

  /** Asset templates management page */
  INVENTORY_TEMPLATES: '/inventory/templates',

  /** Cloud devices page (Intune + Autopilot) */
  INVENTORY_CLOUD: '/inventory/cloud',

  /** Autopilot devices list page */
  INVENTORY_CLOUD_AUTOPILOT: '/inventory/cloud/autopilot',

  /** Autopilot device timeline page (requires :serialNumber parameter) */
  INVENTORY_CLOUD_AUTOPILOT_TIMELINE: '/inventory/cloud/autopilot/timeline/:serialNumber',

  /** Reports hub page */
  INVENTORY_REPORTS: '/inventory/reports',

  // ── Asset detail (cross-cutting, not nested under inventory) ──
  /** Asset detail page (requires :id parameter) */
  ASSET_DETAIL: '/assets/:id',

  /** Edit asset page (requires :id parameter) */
  ASSET_EDIT: '/assets/:id/edit',

  /** Installed software page (requires :id parameter) */
  ASSET_SOFTWARE: '/assets/:id/software',

  /** Asset Intune management page (requires :id parameter) */
  ASSET_INTUNE: '/assets/:id/intune',

  // ── Workplaces ─────────────────────────────────────────────
  /** Physical workplaces management page */
  PHYSICAL_WORKPLACES: '/workplaces',

  /** Physical workplace detail page (requires :id parameter) */
  WORKPLACE_DETAIL: '/workplaces/:id',

  /** Workplace reports page */
  WORKPLACE_REPORTS: '/workplaces/reports',

  // ── Operations ─────────────────────────────────────────────
  /** Rollout sessions list page */
  OPERATIONS_ROLLOUTS: '/operations/rollouts',

  /** New rollout planner page */
  OPERATIONS_ROLLOUTS_NEW: '/operations/rollouts/new',

  /** Edit rollout planner page (requires :id parameter) */
  OPERATIONS_ROLLOUT_EDIT: '/operations/rollouts/:id',

  /** Rollout execution page (requires :id parameter) */
  OPERATIONS_ROLLOUT_EXECUTE: '/operations/rollouts/:id/execute',

  /** Rollout report page (requires :id parameter) */
  OPERATIONS_ROLLOUT_REPORT: '/operations/rollouts/:id/report',

  /** Rollout day detail page (requires :id and :dayId parameters) */
  OPERATIONS_ROLLOUT_DAY_DETAIL: '/operations/rollouts/:id/days/:dayId',

  /** Rollout day edit page (requires :id and :dayId parameters) */
  OPERATIONS_ROLLOUT_DAY_EDIT: '/operations/rollouts/:id/days/:dayId/edit',

  /** Device deployments page */
  OPERATIONS_DEPLOYMENTS: '/operations/deployments',

  /** Deployment history page */
  OPERATIONS_HISTORY: '/operations/history',

  // ── Requests ───────────────────────────────────────────────
  /** Requests dashboard page */
  REQUESTS: '/requests',

  /** Onboarding requests page */
  REQUESTS_ONBOARDING: '/requests/onboarding',

  /** Offboarding requests page */
  REQUESTS_OFFBOARDING: '/requests/offboarding',

  /** Requests reports */
  REQUESTS_REPORTS: '/requests/reports',

  // ── Admin ──────────────────────────────────────────────────
  /** Admin Assets section (Categories, Asset Types, Intune Sync) */
  ADMIN_ASSETS: '/admin/assets',

  /** Admin Organisation section (Sectors, Services, Employees) */
  ADMIN_ORGANISATION: '/admin/organisation',

  /** Admin Locations section (Physical Workplaces, Buildings) */
  ADMIN_LOCATIONS: '/admin/locations',
} as const;

/**
 * Helper functions for building dynamic routes with parameters
 */
export const buildRoute = {
  assetDetail: (id: number | string) => `/assets/${id}`,
  assetEdit: (id: number | string) => `/assets/${id}/edit`,
  assetSoftware: (id: number | string) => `/assets/${id}/software`,
  assetIntune: (id: number | string) => `/assets/${id}/intune`,
  rolloutEdit: (id: number | string) => `/operations/rollouts/${id}`,
  rolloutExecute: (id: number | string) => `/operations/rollouts/${id}/execute`,
  rolloutReport: (id: number | string) => `/operations/rollouts/${id}/report`,
  rolloutDayDetail: (sessionId: number | string, dayId: number | string) => `/operations/rollouts/${sessionId}/days/${dayId}`,
  rolloutDayEdit: (sessionId: number | string, dayId: number | string) => `/operations/rollouts/${sessionId}/days/${dayId}/edit`,
  autopilotTimeline: (serialNumber: string) => `/inventory/cloud/autopilot/timeline/${serialNumber}`,
  workplaceDetail: (id: number | string) => `/workplaces/${id}`,
} as const;

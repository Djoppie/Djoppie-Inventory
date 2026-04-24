import { ComponentType, lazy, LazyExoticComponent, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DjoppieThemeProvider } from './theme/ThemeContext';
import { ROUTES } from './constants/routes';
import Layout from './components/layout/Layout';
import AuthGuard from './components/auth/AuthGuard';
import Loading from './components/common/Loading';

// Wrap React.lazy so stale-chunk failures after a deploy self-heal. When Vite
// rebuilds, chunk hashes change; a browser that loaded index.html before the
// deploy still has references to the old chunk names. Navigating to a
// lazy-loaded route then 404s the old chunk and throws "Failed to fetch
// dynamically imported module". Reload once to pick up the new index.html,
// guarded by sessionStorage so we don't infinite-loop on a real load failure.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function lazyWithRetry<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
): LazyExoticComponent<T> {
  return lazy(async () => {
    const RELOAD_FLAG = 'chunk-reload-attempted';
    try {
      const mod = await factory();
      // Success: clear the flag so a future stale-chunk event can trigger another reload.
      window.sessionStorage.removeItem(RELOAD_FLAG);
      return mod;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const isChunkError = /Failed to fetch dynamically imported module|ChunkLoadError|Importing a module script failed/i.test(message);
      if (isChunkError && !window.sessionStorage.getItem(RELOAD_FLAG)) {
        window.sessionStorage.setItem(RELOAD_FLAG, '1');
        window.location.reload();
        // Return a never-resolving promise so React doesn't surface the error
        // while the page is reloading.
        return new Promise<{ default: T }>(() => {});
      }
      throw error;
    }
  });
}

const DashboardOverviewPage = lazyWithRetry(() => import('./pages/dashboard/DashboardOverviewPage'));
const ScanPage = lazyWithRetry(() => import('./pages/inventory/ScanPage'));
const AssetDetailPage = lazyWithRetry(() => import('./pages/inventory/AssetDetailPage'));
const AddAssetPage = lazyWithRetry(() => import('./pages/inventory/AddAssetPage'));
const EditAssetPage = lazyWithRetry(() => import('./pages/inventory/EditAssetPage'));
const BulkCreateAssetPage = lazyWithRetry(() => import('./pages/inventory/BulkCreateAssetPage'));
const AssetTemplatesPage = lazyWithRetry(() => import('./pages/inventory/AssetTemplatesPage'));
const InventoryPage = lazyWithRetry(() => import('./pages/inventory/InventoryPage'));
const AdminAssetsPage = lazyWithRetry(() => import('./pages/admin/AdminAssetsPage'));
const AdminOrganisationPage = lazyWithRetry(() => import('./pages/admin/AdminOrganisationPage'));
const AdminLocationsPage = lazyWithRetry(() => import('./pages/admin/AdminLocationsPage'));
const InstalledSoftwarePage = lazyWithRetry(() => import('./pages/inventory/InstalledSoftwarePage'));
const AssetIntunePage = lazyWithRetry(() => import('./pages/inventory/AssetIntunePage'));
const RolloutListPage = lazyWithRetry(() => import('./pages/operations/rollouts/RolloutListPage'));
const RolloutPlannerPage = lazyWithRetry(() => import('./pages/operations/rollouts/RolloutPlannerPage'));
const RolloutExecutionPage = lazyWithRetry(() => import('./pages/operations/rollouts/RolloutExecutionPage'));
const RolloutReportPage = lazyWithRetry(() => import('./pages/operations/rollouts/RolloutReportPage'));
const RolloutDayDetailPage = lazyWithRetry(() => import('./pages/operations/rollouts/RolloutDayDetailPage'));
const SerienummersPage = lazyWithRetry(() => import('./pages/operations/rollouts/SerienummersPage'));
const AutopilotDevicesPage = lazyWithRetry(() => import('./pages/devices/AutopilotDevicesPage'));
const AutopilotTimelinePage = lazyWithRetry(() => import('./pages/devices/AutopilotTimelinePage'));
const AssetsPage = lazyWithRetry(() => import('./pages/inventory/AssetsPage'));
const WorkplacesPage = lazyWithRetry(() => import('./pages/workplaces/WorkplacesPage'));
const WorkplaceDetailPage = lazyWithRetry(() => import('./pages/workplaces/WorkplaceDetailPage'));
const WorkplaceReportsPage = lazyWithRetry(() => import('./pages/workplaces/WorkplaceReportsPage'));
const RequestsDashboardPage = lazyWithRetry(() => import('./pages/operations/requests/RequestsDashboardPage'));
const RequestsReportsPage = lazyWithRetry(() => import('./pages/operations/requests/RequestsReportsPage'));
const LaptopSwapPage = lazyWithRetry(() => import('./pages/operations/swaps/LaptopSwapPage'));
const DeploymentHistoryPage = lazyWithRetry(() => import('./pages/operations/swaps/DeploymentHistoryPage'));
const ReportsPage = lazyWithRetry(() => import('./pages/reports/ReportsPage'));
const MonitoringPage = lazyWithRetry(() => import('./pages/monitoring/MonitoringPage'));
const IntuneDeviceDashboardPage = lazyWithRetry(() => import('./pages/devices/IntuneDeviceDashboardPage'));
const OperationsDashboardPage = lazyWithRetry(() => import('./pages/operations/OperationsDashboardPage'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5000,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <DjoppieThemeProvider>
        <BrowserRouter>
          <AuthGuard>
            <Layout>
              <Suspense fallback={<Loading />}>
                <Routes>
                  <Route path={ROUTES.DASHBOARD} element={<DashboardOverviewPage />} />
                  <Route path={ROUTES.SCAN} element={<ScanPage />} />
                  <Route path={ROUTES.INVENTORY_ASSETS} element={<AssetsPage />} />
                  <Route path={ROUTES.ASSET_DETAIL} element={<AssetDetailPage />} />
                  <Route path={ROUTES.ASSETS_NEW} element={<AddAssetPage />} />
                  <Route path={ROUTES.ASSETS_BULK_NEW} element={<BulkCreateAssetPage />} />
                  <Route path={ROUTES.ASSET_EDIT} element={<EditAssetPage />} />
                  <Route path={ROUTES.ASSET_SOFTWARE} element={<InstalledSoftwarePage />} />
                  <Route path={ROUTES.ASSET_INTUNE} element={<AssetIntunePage />} />
                  <Route path={ROUTES.TEMPLATES} element={<AssetTemplatesPage />} />
                  <Route path={ROUTES.INVENTORY} element={<InventoryPage />} />
                  <Route path={ROUTES.ADMIN_ASSETS} element={<AdminAssetsPage />} />
                  <Route path={ROUTES.ADMIN_ORGANISATION} element={<AdminOrganisationPage />} />
                  <Route path={ROUTES.ADMIN_LOCATIONS} element={<AdminLocationsPage />} />
                  <Route path={ROUTES.OPERATIONS} element={<OperationsDashboardPage />} />
                  <Route path={ROUTES.ROLLOUTS} element={<RolloutListPage />} />
                  <Route path={ROUTES.ROLLOUTS_NEW} element={<RolloutPlannerPage />} />
                  <Route path={ROUTES.ROLLOUT_EDIT} element={<RolloutPlannerPage />} />
                  <Route path={ROUTES.ROLLOUT_EXECUTE} element={<RolloutExecutionPage />} />
                  <Route path={ROUTES.ROLLOUT_REPORT} element={<RolloutReportPage />} />
                  <Route path={ROUTES.ROLLOUT_DAY_DETAIL} element={<RolloutDayDetailPage />} />
                  <Route path={ROUTES.ROLLOUT_DAY_EDIT} element={<RolloutDayDetailPage />} />
                  <Route path={ROUTES.ROLLOUT_SERIENUMMERS} element={<SerienummersPage />} />
                  <Route path={ROUTES.AUTOPILOT_DEVICES} element={<AutopilotDevicesPage />} />
                  <Route path={ROUTES.AUTOPILOT_TIMELINE} element={<AutopilotTimelinePage />} />
                  <Route path={ROUTES.INTUNE_DASHBOARD} element={<IntuneDeviceDashboardPage />} />
                  <Route path={ROUTES.WORKPLACE_DETAIL} element={<WorkplaceDetailPage />} />
                  <Route path={ROUTES.WORKPLACE_REPORTS} element={<WorkplaceReportsPage />} />
                  <Route path={ROUTES.PHYSICAL_WORKPLACES} element={<WorkplacesPage />} />
                  <Route path={ROUTES.REQUESTS} element={<RequestsDashboardPage />} />
                  <Route path={ROUTES.REQUESTS_ONBOARDING} element={<RequestsDashboardPage />} />
                  <Route path={ROUTES.REQUESTS_OFFBOARDING} element={<RequestsDashboardPage />} />
                  <Route path={ROUTES.REQUESTS_REPORTS} element={<RequestsReportsPage />} />
                  <Route path={ROUTES.LAPTOP_SWAP} element={<LaptopSwapPage />} />
                  <Route path={ROUTES.DEPLOYMENT_HISTORY} element={<DeploymentHistoryPage />} />
                  <Route path={ROUTES.REPORTS} element={<ReportsPage />} />
                  <Route path={ROUTES.MONITORING} element={<MonitoringPage />} />
                  <Route path={ROUTES.MONITORING_APPLICATIONS} element={<MonitoringPage />} />
                  <Route path={ROUTES.MONITORING_USERS} element={<MonitoringPage />} />
                </Routes>
              </Suspense>
            </Layout>
          </AuthGuard>
        </BrowserRouter>
      </DjoppieThemeProvider>
    </QueryClientProvider>
  );
}

export default App;

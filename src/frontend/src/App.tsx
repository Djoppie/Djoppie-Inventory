import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DjoppieThemeProvider } from './theme/ThemeContext';
import { ROUTES } from './constants/routes';
import Layout from './components/layout/Layout';
import AuthGuard from './components/auth/AuthGuard';
import Loading from './components/common/Loading';

const DashboardOverviewPage = lazy(() => import('./pages/DashboardOverviewPage'));
const ScanPage = lazy(() => import('./pages/inventory/ScanPage'));
const AssetDetailPage = lazy(() => import('./pages/inventory/AssetDetailPage'));
const AddAssetPage = lazy(() => import('./pages/inventory/AddAssetPage'));
const EditAssetPage = lazy(() => import('./pages/inventory/EditAssetPage'));
const BulkCreateAssetPage = lazy(() => import('./pages/inventory/BulkCreateAssetPage'));
const AssetTemplatesPage = lazy(() => import('./pages/inventory/AssetTemplatesPage'));
const AdminAssetsPage = lazy(() => import('./pages/AdminAssetsPage'));
const AdminOrganisationPage = lazy(() => import('./pages/AdminOrganisationPage'));
const AdminLocationsPage = lazy(() => import('./pages/AdminLocationsPage'));
const InstalledSoftwarePage = lazy(() => import('./pages/inventory/InstalledSoftwarePage'));
const AssetIntunePage = lazy(() => import('./pages/inventory/AssetIntunePage'));
const RolloutListPage = lazy(() => import('./pages/operations/rollouts/RolloutListPage'));
const RolloutPlannerPage = lazy(() => import('./pages/operations/rollouts/RolloutPlannerPage'));
const RolloutExecutionPage = lazy(() => import('./pages/operations/rollouts/RolloutExecutionPage'));
const RolloutReportPage = lazy(() => import('./pages/operations/rollouts/RolloutReportPage'));
const RolloutDayDetailPage = lazy(() => import('./pages/operations/rollouts/RolloutDayDetailPage'));
const AutopilotDevicesPage = lazy(() => import('./pages/devices/AutopilotDevicesPage'));
const AutopilotTimelinePage = lazy(() => import('./pages/devices/AutopilotTimelinePage'));
const AssetsPage = lazy(() => import('./pages/inventory/AssetsPage'));
const WorkplacesPage = lazy(() => import('./pages/workplaces/WorkplacesPage'));
const WorkplaceDetailPage = lazy(() => import('./pages/workplaces/WorkplaceDetailPage'));
const WorkplaceReportsPage = lazy(() => import('./pages/workplaces/WorkplaceReportsPage'));
const RequestsDashboardPage = lazy(() => import('./pages/operations/requests/RequestsDashboardPage'));
const RequestsReportsPage = lazy(() => import('./pages/operations/requests/RequestsReportsPage'));
const LaptopSwapPage = lazy(() => import('./pages/operations/swaps/LaptopSwapPage'));
const DeploymentHistoryPage = lazy(() => import('./pages/operations/swaps/DeploymentHistoryPage'));
const ReportsPage = lazy(() => import('./pages/ReportsPage'));
const IntuneDeviceDashboardPage = lazy(() => import('./pages/devices/IntuneDeviceDashboardPage'));

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
                  <Route path={ROUTES.ADMIN_ASSETS} element={<AdminAssetsPage />} />
                  <Route path={ROUTES.ADMIN_ORGANISATION} element={<AdminOrganisationPage />} />
                  <Route path={ROUTES.ADMIN_LOCATIONS} element={<AdminLocationsPage />} />
                  <Route path={ROUTES.ROLLOUTS} element={<RolloutListPage />} />
                  <Route path={ROUTES.ROLLOUTS_NEW} element={<RolloutPlannerPage />} />
                  <Route path={ROUTES.ROLLOUT_EDIT} element={<RolloutPlannerPage />} />
                  <Route path={ROUTES.ROLLOUT_EXECUTE} element={<RolloutExecutionPage />} />
                  <Route path={ROUTES.ROLLOUT_REPORT} element={<RolloutReportPage />} />
                  <Route path={ROUTES.ROLLOUT_DAY_DETAIL} element={<RolloutDayDetailPage />} />
                  <Route path={ROUTES.ROLLOUT_DAY_EDIT} element={<RolloutDayDetailPage />} />
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

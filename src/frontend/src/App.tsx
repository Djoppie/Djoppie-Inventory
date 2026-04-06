import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DjoppieThemeProvider } from './theme/ThemeContext';
import { ROUTES } from './constants/routes';
import Layout from './components/layout/Layout';
import AuthGuard from './components/auth/AuthGuard';
import Loading from './components/common/Loading';

const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const ScanPage = lazy(() => import('./pages/ScanPage'));
const AssetDetailPage = lazy(() => import('./pages/AssetDetailPage'));
const AddAssetPage = lazy(() => import('./pages/AddAssetPage'));
const EditAssetPage = lazy(() => import('./pages/EditAssetPage'));
const BulkCreateAssetPage = lazy(() => import('./pages/BulkCreateAssetPage'));
const AssetTemplatesPage = lazy(() => import('./pages/AssetTemplatesPage'));
const AdminAssetsPage = lazy(() => import('./pages/AdminAssetsPage'));
const AdminOrganisationPage = lazy(() => import('./pages/AdminOrganisationPage'));
const AdminLocationsPage = lazy(() => import('./pages/AdminLocationsPage'));
const InstalledSoftwarePage = lazy(() => import('./pages/InstalledSoftwarePage'));
const AssetIntunePage = lazy(() => import('./pages/AssetIntunePage'));
const RolloutListPage = lazy(() => import('./pages/RolloutListPage'));
const RolloutPlannerPage = lazy(() => import('./pages/RolloutPlannerPage'));
const RolloutExecutionPage = lazy(() => import('./pages/RolloutExecutionPage'));
const RolloutReportPage = lazy(() => import('./pages/RolloutReportPage'));
const RolloutDayDetailPage = lazy(() => import('./pages/RolloutDayDetailPage'));
const AutopilotDevicesPage = lazy(() => import('./pages/AutopilotDevicesPage'));
const AutopilotTimelinePage = lazy(() => import('./pages/AutopilotTimelinePage'));
const DeviceManagementPage = lazy(() => import('./pages/DeviceManagementPage'));
const PhysicalWorkplacesPage = lazy(() => import('./pages/PhysicalWorkplacesPage'));
const WorkplaceDetailPage = lazy(() => import('./pages/WorkplaceDetailPage'));
const WorkplaceReportsPage = lazy(() => import('./pages/WorkplaceReportsPage'));
const RequestsDashboardPage = lazy(() => import('./pages/RequestsDashboardPage'));
const RequestsReportsPage = lazy(() => import('./pages/RequestsReportsPage'));
const LaptopSwapPage = lazy(() => import('./pages/LaptopSwapPage'));
const DeploymentHistoryPage = lazy(() => import('./pages/DeploymentHistoryPage'));
const ReportsPage = lazy(() => import('./pages/ReportsPage'));

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
                  <Route path={ROUTES.DASHBOARD} element={<DashboardPage />} />
                  <Route path={ROUTES.SCAN} element={<ScanPage />} />
                  <Route path={ROUTES.DEVICE_MANAGEMENT} element={<DeviceManagementPage />} />
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
                  <Route path={ROUTES.WORKPLACE_DETAIL} element={<WorkplaceDetailPage />} />
                  <Route path={ROUTES.WORKPLACE_REPORTS} element={<WorkplaceReportsPage />} />
                  <Route path={ROUTES.PHYSICAL_WORKPLACES} element={<PhysicalWorkplacesPage />} />
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

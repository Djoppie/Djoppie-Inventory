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
const AdminPage = lazy(() => import('./pages/AdminPage'));
const InstalledSoftwarePage = lazy(() => import('./pages/InstalledSoftwarePage'));
const AssetIntunePage = lazy(() => import('./pages/AssetIntunePage'));
const RolloutListPage = lazy(() => import('./pages/RolloutListPage'));
const RolloutPlannerPage = lazy(() => import('./pages/RolloutPlannerPage'));
const RolloutExecutionPage = lazy(() => import('./pages/RolloutExecutionPage'));
const RolloutReportPage = lazy(() => import('./pages/RolloutReportPage'));
const AutopilotDevicesPage = lazy(() => import('./pages/AutopilotDevicesPage'));
const AutopilotTimelinePage = lazy(() => import('./pages/AutopilotTimelinePage'));
const DeviceManagementPage = lazy(() => import('./pages/DeviceManagementPage'));

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
                  <Route path={ROUTES.ADMIN} element={<AdminPage />} />
                  <Route path={ROUTES.ROLLOUTS} element={<RolloutListPage />} />
                  <Route path={ROUTES.ROLLOUTS_NEW} element={<RolloutPlannerPage />} />
                  <Route path={ROUTES.ROLLOUT_EDIT} element={<RolloutPlannerPage />} />
                  <Route path={ROUTES.ROLLOUT_EXECUTE} element={<RolloutExecutionPage />} />
                  <Route path={ROUTES.ROLLOUT_REPORT} element={<RolloutReportPage />} />
                  <Route path={ROUTES.AUTOPILOT_DEVICES} element={<AutopilotDevicesPage />} />
                  <Route path={ROUTES.AUTOPILOT_TIMELINE} element={<AutopilotTimelinePage />} />
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

import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DjoppieThemeProvider } from './theme/ThemeContext';
import { ROUTES } from './constants/routes';
import Layout from './components/layout/Layout';
import AuthGuard from './components/auth/AuthGuard';
import Loading from './components/common/Loading';

const DashboardOverviewPage = lazy(() => import('./pages/DashboardOverviewPage'));
const InventoryPage = lazy(() => import('./pages/InventoryPage'));
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
const PhysicalWorkplacesPage = lazy(() => import('./pages/PhysicalWorkplacesPage'));
const WorkplaceDetailPage = lazy(() => import('./pages/WorkplaceDetailPage'));
const WorkplaceReportsPage = lazy(() => import('./pages/WorkplaceReportsPage'));
const RequestsDashboardPage = lazy(() => import('./pages/RequestsDashboardPage'));
const RequestsReportsPage = lazy(() => import('./pages/RequestsReportsPage'));
const LaptopSwapPage = lazy(() => import('./pages/LaptopSwapPage'));
const DeploymentHistoryPage = lazy(() => import('./pages/DeploymentHistoryPage'));
const ReportsPage = lazy(() => import('./pages/ReportsPage'));
const IntuneDeviceDashboardPage = lazy(() => import('./pages/IntuneDeviceDashboardPage'));

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
                  {/* Dashboard */}
                  <Route path={ROUTES.DASHBOARD} element={<DashboardOverviewPage />} />
                  <Route path={ROUTES.SCAN} element={<ScanPage />} />

                  {/* Inventory */}
                  <Route path={ROUTES.INVENTORY} element={<InventoryPage />} />
                  <Route path={ROUTES.INVENTORY_NEW} element={<AddAssetPage />} />
                  <Route path={ROUTES.INVENTORY_BULK_CREATE} element={<BulkCreateAssetPage />} />
                  <Route path={ROUTES.INVENTORY_TEMPLATES} element={<AssetTemplatesPage />} />
                  <Route path={ROUTES.INVENTORY_CLOUD} element={<IntuneDeviceDashboardPage />} />
                  <Route path={ROUTES.INVENTORY_CLOUD_AUTOPILOT} element={<AutopilotDevicesPage />} />
                  <Route path={ROUTES.INVENTORY_CLOUD_AUTOPILOT_TIMELINE} element={<AutopilotTimelinePage />} />
                  <Route path={ROUTES.INVENTORY_REPORTS} element={<ReportsPage />} />

                  {/* Asset detail (cross-cutting) */}
                  <Route path={ROUTES.ASSET_DETAIL} element={<AssetDetailPage />} />
                  <Route path={ROUTES.ASSET_EDIT} element={<EditAssetPage />} />
                  <Route path={ROUTES.ASSET_SOFTWARE} element={<InstalledSoftwarePage />} />
                  <Route path={ROUTES.ASSET_INTUNE} element={<AssetIntunePage />} />

                  {/* Workplaces */}
                  <Route path={ROUTES.WORKPLACE_REPORTS} element={<WorkplaceReportsPage />} />
                  <Route path={ROUTES.WORKPLACE_DETAIL} element={<WorkplaceDetailPage />} />
                  <Route path={ROUTES.PHYSICAL_WORKPLACES} element={<PhysicalWorkplacesPage />} />

                  {/* Operations */}
                  <Route path={ROUTES.OPERATIONS_ROLLOUTS} element={<RolloutListPage />} />
                  <Route path={ROUTES.OPERATIONS_ROLLOUTS_NEW} element={<RolloutPlannerPage />} />
                  <Route path={ROUTES.OPERATIONS_ROLLOUT_EDIT} element={<RolloutPlannerPage />} />
                  <Route path={ROUTES.OPERATIONS_ROLLOUT_EXECUTE} element={<RolloutExecutionPage />} />
                  <Route path={ROUTES.OPERATIONS_ROLLOUT_REPORT} element={<RolloutReportPage />} />
                  <Route path={ROUTES.OPERATIONS_ROLLOUT_DAY_DETAIL} element={<RolloutDayDetailPage />} />
                  <Route path={ROUTES.OPERATIONS_ROLLOUT_DAY_EDIT} element={<RolloutDayDetailPage />} />
                  <Route path={ROUTES.OPERATIONS_DEPLOYMENTS} element={<LaptopSwapPage />} />
                  <Route path={ROUTES.OPERATIONS_HISTORY} element={<DeploymentHistoryPage />} />

                  {/* Requests */}
                  <Route path={ROUTES.REQUESTS} element={<RequestsDashboardPage />} />
                  <Route path={ROUTES.REQUESTS_ONBOARDING} element={<RequestsDashboardPage />} />
                  <Route path={ROUTES.REQUESTS_OFFBOARDING} element={<RequestsDashboardPage />} />
                  <Route path={ROUTES.REQUESTS_REPORTS} element={<RequestsReportsPage />} />

                  {/* Admin */}
                  <Route path={ROUTES.ADMIN_ASSETS} element={<AdminAssetsPage />} />
                  <Route path={ROUTES.ADMIN_ORGANISATION} element={<AdminOrganisationPage />} />
                  <Route path={ROUTES.ADMIN_LOCATIONS} element={<AdminLocationsPage />} />

                  {/* Backward-compatible redirects from old routes */}
                  <Route path="/devices/new" element={<Navigate to={ROUTES.INVENTORY_NEW} replace />} />
                  <Route path="/devices/bulk-create" element={<Navigate to={ROUTES.INVENTORY_BULK_CREATE} replace />} />
                  <Route path="/devices/intune-dashboard" element={<Navigate to={ROUTES.INVENTORY_CLOUD} replace />} />
                  <Route path="/devices/autopilot/timeline/:serialNumber" element={<Navigate to="/inventory/cloud/autopilot/timeline/:serialNumber" replace />} />
                  <Route path="/devices/autopilot" element={<Navigate to={ROUTES.INVENTORY_CLOUD_AUTOPILOT} replace />} />
                  <Route path="/devices" element={<Navigate to={ROUTES.INVENTORY} replace />} />
                  <Route path="/templates" element={<Navigate to={ROUTES.INVENTORY_TEMPLATES} replace />} />
                  <Route path="/reports" element={<Navigate to={ROUTES.INVENTORY_REPORTS} replace />} />
                  <Route path="/rollouts/new" element={<Navigate to={ROUTES.OPERATIONS_ROLLOUTS_NEW} replace />} />
                  <Route path="/rollouts" element={<Navigate to={ROUTES.OPERATIONS_ROLLOUTS} replace />} />
                  <Route path="/laptop-swap/history" element={<Navigate to={ROUTES.OPERATIONS_HISTORY} replace />} />
                  <Route path="/laptop-swap" element={<Navigate to={ROUTES.OPERATIONS_DEPLOYMENTS} replace />} />
                  <Route path="/admin" element={<Navigate to={ROUTES.ADMIN_ASSETS} replace />} />
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

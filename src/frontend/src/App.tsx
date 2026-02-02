import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DjoppieThemeProvider } from './theme/ThemeContext';
import { ROUTES } from './constants/routes';
import Layout from './components/layout/Layout';
import AuthGuard from './components/auth/AuthGuard';
import DashboardPage from './pages/DashboardPage';
import ScanPage from './pages/ScanPage';
import AssetDetailPage from './pages/AssetDetailPage';
import AddAssetPage from './pages/AddAssetPage';
import EditAssetPage from './pages/EditAssetPage';
import BulkCreateAssetPage from './pages/BulkCreateAssetPage';

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
              <Routes>
                <Route path={ROUTES.DASHBOARD} element={<DashboardPage />} />
                <Route path={ROUTES.SCAN} element={<ScanPage />} />
                <Route path={ROUTES.ASSET_DETAIL} element={<AssetDetailPage />} />
                <Route path={ROUTES.ASSETS_NEW} element={<AddAssetPage />} />
                <Route path={ROUTES.ASSETS_BULK_NEW} element={<BulkCreateAssetPage />} />
                <Route path={ROUTES.ASSET_EDIT} element={<EditAssetPage />} />
              </Routes>
            </Layout>
          </AuthGuard>
        </BrowserRouter>
      </DjoppieThemeProvider>
    </QueryClientProvider>
  );
}

export default App;

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DjoppieThemeProvider } from './theme/ThemeContext';
import Layout from './components/layout/Layout';
import DashboardPage from './pages/DashboardPage';
import ScanPage from './pages/ScanPage';
import AssetDetailPage from './pages/AssetDetailPage';
import AddAssetPage from './pages/AddAssetPage';
import EditAssetPage from './pages/EditAssetPage';

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
          <Layout>
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/scan" element={<ScanPage />} />
              <Route path="/assets/:id" element={<AssetDetailPage />} />
              <Route path="/assets/new" element={<AddAssetPage />} />
              <Route path="/assets/:id/edit" element={<EditAssetPage />} />
            </Routes>
          </Layout>
        </BrowserRouter>
      </DjoppieThemeProvider>
    </QueryClientProvider>
  );
}

export default App;

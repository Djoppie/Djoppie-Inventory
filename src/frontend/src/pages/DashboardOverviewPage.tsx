/**
 * DashboardOverviewPage Component
 * Main dashboard with comprehensive overview widgets
 * Shows KPIs, status distribution, asset types, recent activity, Intune sync, and warranty alerts
 */

import { useMemo } from 'react';
import { Box, Typography, useTheme, Grid } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { getNeumorphColors, getNeumorph } from '../utils/neumorphicStyles';

// Hooks
import { useAssets } from '../hooks/useAssets';

// Components
import Loading from '../components/common/Loading';
import ApiErrorDisplay from '../components/common/ApiErrorDisplay';
import StatisticsCard from '../components/common/StatisticsCard';
import {
  StatusDistributionWidget,
  AssetTypeDistributionWidget,
  RecentActivityWidget,
  IntuneSyncStatusWidget,
  LeaseWarrantyWidget,
  WorkplaceOccupancyWidget,
} from '../components/widgets';

// Icons
import {
  Devices,
  CheckCircle,
  Inventory2,
  Build,
  Error as ErrorIcon,
  FiberNew,
  Cloud,
} from '@mui/icons-material';

// Constants
import {
  SUCCESS_COLOR,
  DANGER_COLOR,
  ASSET_COLOR,
} from '../constants/filterColors';

const DashboardOverviewPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const isDark = theme.palette.mode === 'dark';
  const { bgBase } = getNeumorphColors(isDark);

  // Fetch all assets
  const { data: assets, isLoading, error, refetch } = useAssets();

  // Calculate statistics
  const stats = useMemo(() => {
    if (!assets) {
      return {
        total: 0,
        inGebruik: 0,
        stock: 0,
        herstelling: 0,
        defect: 0,
        uitDienst: 0,
        nieuw: 0,
        intuneManagedCount: 0,
      };
    }

    return {
      total: assets.length,
      inGebruik: assets.filter(a => a.status === 'InGebruik').length,
      stock: assets.filter(a => a.status === 'Stock').length,
      herstelling: assets.filter(a => a.status === 'Herstelling').length,
      defect: assets.filter(a => a.status === 'Defect').length,
      uitDienst: assets.filter(a => a.status === 'UitDienst').length,
      nieuw: assets.filter(a => a.status === 'Nieuw').length,
      intuneManagedCount: assets.filter(a => a.intuneSyncedAt).length,
    };
  }, [assets]);

  // Loading state
  if (isLoading) {
    return <Loading message="Dashboard laden..." />;
  }

  // Error state
  if (error) {
    const isNetworkError =
      error instanceof Error &&
      (error.message.includes('Network Error') ||
        error.message.includes('ERR_CONNECTION_REFUSED') ||
        error.message.includes('fetch'));

    if (isNetworkError) {
      return <ApiErrorDisplay onRetry={() => refetch()} />;
    }

    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="h6" color="error">
          Fout bij laden dashboard
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {error instanceof Error ? error.message : 'Onverwachte fout'}
        </Typography>
      </Box>
    );
  }

  const handleNavigateToInventory = (status?: string) => {
    if (status) {
      navigate(`/?status=${status}`);
    } else {
      navigate('/');
    }
  };

  return (
    <Box
      sx={{
        bgcolor: bgBase,
        borderRadius: 3,
        p: { xs: 2, sm: 3 },
        boxShadow: getNeumorph(isDark, 'medium'),
      }}
    >
      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 800,
            color: isDark ? 'rgba(255,255,255,0.95)' : 'rgba(0,0,0,0.9)',
            mb: 0.5,
            letterSpacing: '-0.02em',
          }}
        >
          Dashboard Overzicht
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)',
          }}
        >
          Realtime inzicht in uw IT-assets en inventaris
        </Typography>
      </Box>

      {/* KPI Cards Grid */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 6, sm: 4, md: 3, lg: 1.714 }}>
          <StatisticsCard
            icon={Devices}
            label="Totaal Assets"
            value={stats.total}
            color={ASSET_COLOR}
            onClick={() => handleNavigateToInventory()}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 3, lg: 1.714 }}>
          <StatisticsCard
            icon={CheckCircle}
            label="In Gebruik"
            value={stats.inGebruik}
            color={SUCCESS_COLOR}
            onClick={() => handleNavigateToInventory('InGebruik')}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 3, lg: 1.714 }}>
          <StatisticsCard
            icon={Inventory2}
            label="Stock"
            value={stats.stock}
            color="#2196F3"
            onClick={() => handleNavigateToInventory('Stock')}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 3, lg: 1.714 }}>
          <StatisticsCard
            icon={FiberNew}
            label="Nieuw"
            value={stats.nieuw}
            color="#9C27B0"
            onClick={() => handleNavigateToInventory('Nieuw')}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 3, lg: 1.714 }}>
          <StatisticsCard
            icon={Build}
            label="Herstelling"
            value={stats.herstelling}
            color="#FF9800"
            onClick={() => handleNavigateToInventory('Herstelling')}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 3, lg: 1.714 }}>
          <StatisticsCard
            icon={ErrorIcon}
            label="Defect"
            value={stats.defect}
            color={DANGER_COLOR}
            onClick={() => handleNavigateToInventory('Defect')}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 3, lg: 1.714 }}>
          <StatisticsCard
            icon={Cloud}
            label="Intune Managed"
            value={stats.intuneManagedCount}
            color="#2196F3"
            subtitle={`${stats.total > 0 ? ((stats.intuneManagedCount / stats.total) * 100).toFixed(0) : 0}% dekking`}
          />
        </Grid>
      </Grid>

      {/* Main Widgets Grid */}
      <Grid container spacing={3}>
        {/* Row 1: Status Distribution + Asset Type Distribution */}
        <Grid size={{ xs: 12, lg: 6 }}>
          <StatusDistributionWidget
            counts={{
              inGebruik: stats.inGebruik,
              stock: stats.stock,
              herstelling: stats.herstelling,
              defect: stats.defect,
              uitDienst: stats.uitDienst,
              nieuw: stats.nieuw,
            }}
            onStatusClick={(status) => handleNavigateToInventory(status)}
            isLoading={isLoading}
          />
        </Grid>

        <Grid size={{ xs: 12, lg: 6 }}>
          <AssetTypeDistributionWidget
            assets={assets || []}
            isLoading={isLoading}
          />
        </Grid>

        {/* Row 2: Recent Activity + Intune Sync */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <RecentActivityWidget
            assets={assets || []}
            maxItems={12}
            isLoading={isLoading}
          />
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
          <IntuneSyncStatusWidget
            assets={assets || []}
            isLoading={isLoading}
          />
        </Grid>

        {/* Row 3: Workplace Occupancy + Lease/Warranty */}
        <Grid size={{ xs: 12, lg: 6 }}>
          <WorkplaceOccupancyWidget />
        </Grid>

        <Grid size={{ xs: 12, lg: 6 }}>
          <LeaseWarrantyWidget
            assets={assets || []}
            isLoading={isLoading}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardOverviewPage;

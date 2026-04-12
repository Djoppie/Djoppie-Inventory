import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, useTheme, Fade, CircularProgress } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useAssets } from '../../hooks/useAssets';
import { useWorkplaceStatistics, useWorkplaceEquipmentStatistics } from '../../hooks/usePhysicalWorkplaces';
import { useRolloutSessions } from '../../hooks/rollout';
import { assetEventsApi } from '../../api/assetEvents.api';
import { ASSET_COLOR } from '../../constants/filterColors';
import { buildRoute } from '../../constants/routes';

import KPIHeroSection from './KPIHeroSection';
import AssetDistributionChart from './AssetDistributionChart';
import RecentActivityFeed from './RecentActivityFeed';
import WorkplaceOccupancyRing from './WorkplaceOccupancyRing';
import EquipmentFillRates from './EquipmentFillRates';
import UpcomingRolloutsWidget from './UpcomingRolloutsWidget';
import AlertsWarningsWidget from './AlertsWarningsWidget';

const DashboardHome = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const navigate = useNavigate();
  // Data queries
  const { data: assets = [], isLoading: assetsLoading } = useAssets();
  const { data: workplaceStats } = useWorkplaceStatistics();
  const { data: equipmentStats = [] } = useWorkplaceEquipmentStatistics();
  const { data: rolloutSessions = [] } = useRolloutSessions();
  const { data: recentEvents = [] } = useQuery({
    queryKey: ['asset-events-recent'],
    queryFn: () => assetEventsApi.getRecent(15),
    staleTime: 30000,
  });
  // KPI computations
  const kpiData = useMemo(() => {
    const inGebruik = assets.filter((a) => a.status === 'InGebruik').length;
    const stock = assets.filter((a) => a.status === 'Stock').length;
    const defect = assets.filter((a) => a.status === 'Defect').length;
    const herstelling = assets.filter((a) => a.status === 'Herstelling').length;
    const activeRollouts = rolloutSessions.filter((s) => s.status === 'InProgress').length;
    return {
      total: assets.filter((a) => !a.isDummy).length,
      inGebruik,
      stock,
      aandacht: defect + herstelling,
      activeRollouts,
    };
  }, [assets, rolloutSessions]);

  // Alerts computations
  const alertsData = useMemo(() => {
    const now = new Date();
    const in90Days = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

    const expiringCerts = assets
      .filter((a) => {
        if (!a.intuneCertificateExpiry) return false;
        const expiry = new Date(a.intuneCertificateExpiry);
        return expiry > now && expiry <= in90Days;
      })
      .map((a) => ({
        id: a.id,
        assetCode: a.assetCode,
        daysRemaining: Math.ceil(
          (new Date(a.intuneCertificateExpiry!).getTime() - now.getTime()) / (24 * 60 * 60 * 1000)
        ),
      }))
      .sort((a, b) => a.daysRemaining - b.daysRemaining)
      .slice(0, 5);

    // Count stock per asset type
    const stockByType = new Map<string, number>();
    assets
      .filter((a) => a.status === 'Stock' && a.assetType?.name)
      .forEach((a) => {
        const name = a.assetType!.name;
        stockByType.set(name, (stockByType.get(name) || 0) + 1);
      });
    const lowStockTypes = Array.from(stockByType.entries())
      .filter(([, count]) => count < 5)
      .map(([typeName, count]) => ({ typeName, count }));

    return { expiringCerts, lowStockTypes };
  }, [assets]);

  if (assetsLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress sx={{ color: ASSET_COLOR }} />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, p: { xs: 1.5, md: 2 } }}>
      {/* Dashboard Title */}
      <Fade in timeout={400}>
        <Typography
          variant="h5"
          sx={{
            fontWeight: 800,
            letterSpacing: '-0.02em',
            background: isDark
              ? 'linear-gradient(135deg, #FFFFFF 0%, #FF9933 100%)'
              : 'linear-gradient(135deg, #1A1D29 0%, #FF7700 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Business Dashboard
        </Typography>
      </Fade>

      {/* Row 1: KPI Hero Cards */}
      <Fade in timeout={500}>
        <Box>
          <KPIHeroSection
            totalAssets={kpiData.total}
            inGebruik={kpiData.inGebruik}
            stock={kpiData.stock}
            aandacht={kpiData.aandacht}
            activeRollouts={kpiData.activeRollouts}
          />
        </Box>
      </Fade>

      {/* Row 2: Asset Distribution + Recent Activity */}
      <Fade in timeout={700}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
            gap: 2.5,
          }}
        >
          <AssetDistributionChart assets={assets} />
          <RecentActivityFeed events={recentEvents} />
        </Box>
      </Fade>

      {/* Row 3: Workplace Occupancy + Equipment Status */}
      <Fade in timeout={900}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
            gap: 2.5,
          }}
        >
          <WorkplaceOccupancyRing
            occupancyRate={workplaceStats?.occupancyRate ?? 0}
            totalActive={workplaceStats?.activeWorkplaces ?? 0}
            occupied={workplaceStats?.occupiedWorkplaces ?? 0}
            vacant={workplaceStats?.vacantWorkplaces ?? 0}
          />
          <EquipmentFillRates equipment={equipmentStats} />
        </Box>
      </Fade>

      {/* Row 4: Upcoming Rollouts + Alerts */}
      <Fade in timeout={1100}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
            gap: 2.5,
          }}
        >
          <UpcomingRolloutsWidget
            sessions={rolloutSessions}
            onSessionClick={(id) => navigate(buildRoute.rolloutEdit(id))}
          />
          <AlertsWarningsWidget
            expiringCerts={alertsData.expiringCerts}
            lowStockTypes={alertsData.lowStockTypes}
          />
        </Box>
      </Fade>
    </Box>
  );
};

export default DashboardHome;

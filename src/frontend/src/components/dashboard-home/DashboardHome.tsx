import { Box, Typography, useTheme, Fade, CircularProgress } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useAssets } from '../../hooks/useAssets';
import { useWorkplaceStatistics, useWorkplaceEquipmentStatistics } from '../../hooks/usePhysicalWorkplaces';
import { useRolloutSessions } from '../../hooks/rollout';
import { useBuildings } from '../../hooks/useBuildings';
import { useServices } from '../../hooks/useServices';
import { assetTypesApi, employeesApi } from '../../api/admin.api';
import { ASSET_COLOR } from '../../constants/filterColors';

import {
  InventorySection,
  WorkplacesSection,
  OperationsSection,
  RequestsSection,
  AdminSection,
} from './sections';

const DashboardHome = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  // Data queries
  const { data: assets = [], isLoading: assetsLoading } = useAssets();
  const { data: workplaceStats } = useWorkplaceStatistics();
  const { data: equipmentStats = [] } = useWorkplaceEquipmentStatistics();
  const { data: rolloutSessions = [] } = useRolloutSessions();
  const { data: buildings = [] } = useBuildings(false);
  const { data: services = [] } = useServices(false);

  // Admin data queries
  const { data: assetTypes = [] } = useQuery({
    queryKey: ['admin-asset-types'],
    queryFn: () => assetTypesApi.getAll(false),
    staleTime: 60000,
  });

  const { data: employees = [] } = useQuery({
    queryKey: ['admin-employees-count'],
    queryFn: () => employeesApi.getAll(false),
    staleTime: 60000,
  });

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

      {/* Section Grid */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            md: 'repeat(2, 1fr)',
          },
          gap: 2.5,
        }}
      >
        {/* Inventory Section */}
        <InventorySection assets={assets} delay={0} />

        {/* Workplaces Section */}
        <WorkplacesSection
          workplaceStats={workplaceStats}
          equipmentStats={equipmentStats}
          delay={100}
        />

        {/* Operations Section */}
        <OperationsSection rolloutSessions={rolloutSessions} delay={200} />

        {/* Requests Section */}
        <RequestsSection requests={[]} delay={300} />

        {/* Admin Section - Full Width */}
        <AdminSection
          buildingsCount={buildings.length}
          servicesCount={services.length}
          assetTypesCount={assetTypes.length}
          employeesCount={employees.length}
          delay={400}
        />
      </Box>
    </Box>
  );
};

export default DashboardHome;

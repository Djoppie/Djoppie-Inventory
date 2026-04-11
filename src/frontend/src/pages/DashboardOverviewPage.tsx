/**
 * DashboardOverviewPage Component
 * Professional business dashboard with KPIs, charts, and widgets
 */

import { Box, useTheme } from '@mui/material';
import { getNeumorphColors, getNeumorph } from '../utils/neumorphicStyles';
import DashboardHome from '../components/dashboard-home/DashboardHome';

const DashboardOverviewPage = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { bgBase } = getNeumorphColors(isDark);

  return (
    <Box
      sx={{
        bgcolor: bgBase,
        borderRadius: 3,
        boxShadow: getNeumorph(isDark, 'medium'),
        overflow: 'visible',
      }}
    >
      <DashboardHome />
    </Box>
  );
};

export default DashboardOverviewPage;

import { Box, Typography, useTheme, CircularProgress, Grid } from '@mui/material';
import {
  Devices as DevicesIcon,
  CheckCircle as CompliantIcon,
  Warning as NonCompliantIcon,
  VpnKey as CertIcon,
  SyncProblem as SyncIcon,
} from '@mui/icons-material';
import { getNeumorphColors, getNeumorph } from '../../utils/neumorphicStyles';
import { SUCCESS_COLOR, DANGER_COLOR } from '../../constants/filterColors';

const AMBER_COLOR = '#FF9800';

interface DeviceOverviewStatsProps {
  totalDevices: number | undefined;
  compliantCount: number | undefined;
  nonCompliantCount: number | undefined;
  certIssueCount: number | undefined;
  syncStaleCount: number | undefined;
  loading: boolean;
  certLoading: boolean;
}

interface StatCardProps {
  icon: React.ReactNode;
  value: number | undefined;
  label: string;
  borderColor?: string;
  loading: boolean;
  isDark: boolean;
  bgSurface: string;
}

const StatCard = ({ icon, value, label, borderColor, loading, isDark, bgSurface }: StatCardProps) => (
  <Box
    sx={{
      bgcolor: bgSurface,
      boxShadow: getNeumorph(isDark, 'soft'),
      borderRadius: 2,
      borderLeft: borderColor ? `3px solid ${borderColor}` : '3px solid transparent',
      px: 1.5,
      py: 1.25,
      display: 'flex',
      alignItems: 'center',
      gap: 1.25,
      minHeight: 56,
    }}
  >
    <Box sx={{ color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.45)', display: 'flex' }}>
      {icon}
    </Box>
    <Box>
      {loading ? (
        <CircularProgress size={18} sx={{ color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.3)' }} />
      ) : (
        <Typography
          variant="h6"
          sx={{
            fontWeight: 700,
            fontSize: '1.15rem',
            lineHeight: 1.2,
            color: isDark ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.85)',
          }}
        >
          {value ?? '-'}
        </Typography>
      )}
      <Typography
        variant="caption"
        sx={{
          color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
          fontSize: '0.7rem',
          lineHeight: 1.2,
        }}
      >
        {label}
      </Typography>
    </Box>
  </Box>
);

const DeviceOverviewStats = ({
  totalDevices,
  compliantCount,
  nonCompliantCount,
  certIssueCount,
  syncStaleCount,
  loading,
  certLoading,
}: DeviceOverviewStatsProps) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { bgSurface } = getNeumorphColors(isDark);

  const stats = [
    { icon: <DevicesIcon fontSize="small" />, value: totalDevices, label: 'Total Devices', loading },
    { icon: <CompliantIcon fontSize="small" />, value: compliantCount, label: 'Compliant', borderColor: SUCCESS_COLOR, loading },
    { icon: <NonCompliantIcon fontSize="small" />, value: nonCompliantCount, label: 'Non-Compliant', borderColor: DANGER_COLOR, loading },
    { icon: <CertIcon fontSize="small" />, value: certIssueCount, label: 'Cert Issues', borderColor: DANGER_COLOR, loading: certLoading },
    { icon: <SyncIcon fontSize="small" />, value: syncStaleCount, label: 'Sync Stale', borderColor: AMBER_COLOR, loading },
  ];

  return (
    <Grid container spacing={1.5}>
      {stats.map((stat) => (
        <Grid key={stat.label} size={{ xs: 6, sm: 4, md: 2.4 }}>
          <StatCard {...stat} isDark={isDark} bgSurface={bgSurface} />
        </Grid>
      ))}
    </Grid>
  );
};

export default DeviceOverviewStats;

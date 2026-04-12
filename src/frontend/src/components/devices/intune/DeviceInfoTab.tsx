import { Box, Typography, useTheme, CircularProgress, Grid, Chip } from '@mui/material';
import { getNeumorphColors } from '../../../utils/neumorphicStyles';
import { DANGER_COLOR } from '../../../constants/filterColors';
import type { DeviceHealthInfo } from '../../../types/intune-dashboard.types';

interface DeviceInfoTabProps {
  health: DeviceHealthInfo | undefined;
  loading: boolean;
}

const formatBytes = (bytes: number | undefined): string => {
  if (bytes == null) return '-';
  const gb = bytes / (1024 * 1024 * 1024);
  return `${gb.toFixed(1)} GB`;
};

const formatDate = (dateStr: string | undefined): string => {
  if (!dateStr) return '-';
  try {
    return new Date(dateStr).toLocaleDateString('nl-BE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  } catch {
    return dateStr;
  }
};

interface InfoRowProps {
  label: string;
  value: React.ReactNode;
  isDark: boolean;
}

const InfoRow = ({ label, value, isDark }: InfoRowProps) => (
  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.5 }}>
    <Typography
      variant="caption"
      sx={{ color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)', fontSize: '0.72rem' }}
    >
      {label}
    </Typography>
    <Typography
      variant="body2"
      sx={{
        color: isDark ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.8)',
        fontSize: '0.78rem',
        fontWeight: 500,
        textAlign: 'right',
        maxWidth: '60%',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}
    >
      {value}
    </Typography>
  </Box>
);

const DeviceInfoTab = ({ health, loading }: DeviceInfoTabProps) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  getNeumorphColors(isDark);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
        <CircularProgress size={24} sx={{ color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.3)' }} />
      </Box>
    );
  }

  if (!health) {
    return (
      <Typography variant="body2" sx={{ color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)', py: 2, textAlign: 'center' }}>
        No device health data available.
      </Typography>
    );
  }

  const storageUsage = health.storageUsagePercent != null ? `${health.storageUsagePercent.toFixed(0)}%` : '-';
  const storageDetail = `${formatBytes(health.totalStorageBytes)} total / ${formatBytes(health.freeStorageBytes)} free (${storageUsage})`;

  const leftColumn = [
    { label: 'Model', value: health.model ?? '-' },
    { label: 'Manufacturer', value: health.manufacturer ?? '-' },
    { label: 'Serial Number', value: health.serialNumber ?? '-' },
    { label: 'OS', value: `${health.operatingSystem ?? '-'} ${health.osVersion ?? ''}`.trim() },
    { label: 'Enrollment Date', value: formatDate(health.enrolledDateTime) },
    { label: 'Last Sync', value: formatDate(health.lastSyncDateTime) },
  ];

  const rightColumn = [
    { label: 'Storage', value: storageDetail },
    { label: 'Physical Memory', value: formatBytes(health.physicalMemoryBytes) },
    {
      label: 'Encrypted',
      value: (
        <Chip
          label={health.isEncrypted ? 'Yes' : 'No'}
          size="small"
          sx={{
            height: 20,
            fontSize: '0.65rem',
            fontWeight: 600,
            bgcolor: 'transparent',
            color: health.isEncrypted
              ? (isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)')
              : DANGER_COLOR,
          }}
        />
      ),
    },
    { label: 'WiFi MAC', value: health.wifiMacAddress ?? '-' },
    { label: 'Ethernet MAC', value: health.ethernetMacAddress ?? '-' },
    { label: 'Azure AD Device ID', value: health.azureAdDeviceId ?? '-' },
  ];

  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, sm: 6 }}>
        {leftColumn.map((item) => (
          <InfoRow key={item.label} label={item.label} value={item.value} isDark={isDark} />
        ))}
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        {rightColumn.map((item) => (
          <InfoRow key={item.label} label={item.label} value={item.value} isDark={isDark} />
        ))}
      </Grid>
    </Grid>
  );
};

export default DeviceInfoTab;

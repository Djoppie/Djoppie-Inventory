/**
 * IntuneSyncStatusWidget Component
 * Displays Intune sync status and managed devices overview
 */

import {
  Box,
  Typography,
  Paper,
  alpha,
  useTheme,
  Skeleton,
  Chip,
  LinearProgress,
} from '@mui/material';
import { memo, useMemo } from 'react';
import { getNeumorph, getNeumorphColors } from '../../utils/neumorphicStyles';
import {
  Cloud,
  CloudDone,
  CheckCircle,
  Schedule,
  Warning,
} from '@mui/icons-material';
import { Asset } from '../../types/asset.types';
import { formatDistanceToNow } from 'date-fns';
import { nl } from 'date-fns/locale';

interface IntuneSyncStatusProps {
  assets: Asset[];
  isLoading?: boolean;
}

export const IntuneSyncStatusWidget = memo<IntuneSyncStatusProps>(({
  assets,
  isLoading = false,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { bgSurface } = getNeumorphColors(isDark);

  const intuneStats = useMemo(() => {
    const managedDevices = assets.filter(a => a.intuneSyncedAt);
    const total = assets.length;
    const managedCount = managedDevices.length;
    const coveragePercent = total > 0 ? (managedCount / total) * 100 : 0;

    // Find most recent sync
    let lastSync: Date | null = null;
    if (managedDevices.length > 0) {
      const syncDates = managedDevices
        .map(a => a.intuneSyncedAt)
        .filter((d): d is string => d !== undefined && d !== null)
        .map(d => new Date(d))
        .sort((a, b) => b.getTime() - a.getTime());

      if (syncDates.length > 0) {
        lastSync = syncDates[0];
      }
    }

    // Check for devices with recent check-ins (last 7 days)
    const recentCheckIns = managedDevices.filter(a => {
      if (!a.intuneLastCheckIn) return false;
      const checkInDate = new Date(a.intuneLastCheckIn);
      const daysSinceCheckIn = (Date.now() - checkInDate.getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceCheckIn <= 7;
    }).length;

    // Check for expiring certificates (within 30 days)
    const expiringCerts = managedDevices.filter(a => {
      if (!a.intuneCertificateExpiry) return false;
      const expiryDate = new Date(a.intuneCertificateExpiry);
      const daysUntilExpiry = (expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
      return daysUntilExpiry > 0 && daysUntilExpiry <= 30;
    }).length;

    return {
      total,
      managedCount,
      coveragePercent,
      lastSync,
      recentCheckIns,
      activePercent: managedCount > 0 ? (recentCheckIns / managedCount) * 100 : 0,
      expiringCerts,
    };
  }, [assets]);

  const syncHealthColor = useMemo(() => {
    if (intuneStats.activePercent >= 90) return '#4CAF50'; // Green
    if (intuneStats.activePercent >= 70) return '#FF9800'; // Orange
    return '#F44336'; // Red
  }, [intuneStats.activePercent]);

  if (isLoading) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: 3,
          bgcolor: bgSurface,
          boxShadow: getNeumorph(isDark, 'medium'),
          height: '100%',
        }}
      >
        <Skeleton variant="text" width="60%" height={32} />
        <Box sx={{ mt: 3 }}>
          <Skeleton variant="rectangular" height={80} sx={{ borderRadius: 2, mb: 2 }} />
          <Skeleton variant="rectangular" height={60} sx={{ borderRadius: 2 }} />
        </Box>
      </Paper>
    );
  }

  const lastSyncText = intuneStats.lastSync
    ? formatDistanceToNow(intuneStats.lastSync, { addSuffix: true, locale: nl })
    : 'Nooit';

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 3,
        bgcolor: bgSurface,
        boxShadow: getNeumorph(isDark, 'medium'),
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: `linear-gradient(90deg, #2196F3, ${syncHealthColor})`,
        },
      }}
    >
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: alpha('#2196F3', 0.12),
            border: `1px solid ${alpha('#2196F3', 0.25)}`,
          }}
        >
          <Cloud sx={{ fontSize: 22, color: '#2196F3' }} />
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              color: isDark ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.87)',
            }}
          >
            Intune Sync
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
            }}
          >
            <Schedule sx={{ fontSize: 12 }} />
            {lastSyncText}
          </Typography>
        </Box>
        <Chip
          icon={<CloudDone sx={{ fontSize: 16 }} />}
          label={`${intuneStats.coveragePercent.toFixed(0)}%`}
          size="small"
          sx={{
            fontWeight: 700,
            bgcolor: alpha('#2196F3', 0.15),
            color: '#2196F3',
          }}
        />
      </Box>

      {/* Coverage Overview */}
      <Box
        sx={{
          p: 2.5,
          borderRadius: 2,
          bgcolor: alpha('#2196F3', 0.05),
          border: `1px solid ${alpha('#2196F3', 0.15)}`,
          mb: 2,
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
          <Typography
            variant="body2"
            sx={{
              fontWeight: 600,
              color: isDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.8)',
            }}
          >
            Managed Devices
          </Typography>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              color: '#2196F3',
            }}
          >
            {intuneStats.managedCount}
            <Typography
              component="span"
              variant="body2"
              sx={{
                ml: 0.5,
                color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
                fontWeight: 500,
              }}
            >
              / {intuneStats.total}
            </Typography>
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={intuneStats.coveragePercent}
          sx={{
            height: 8,
            borderRadius: 4,
            bgcolor: alpha('#2196F3', 0.15),
            '& .MuiLinearProgress-bar': {
              borderRadius: 4,
              bgcolor: '#2196F3',
              boxShadow: `0 0 8px ${alpha('#2196F3', 0.5)}`,
            },
          }}
        />
      </Box>

      {/* Health Metrics */}
      <Box sx={{ display: 'flex', gap: 2 }}>
        {/* Active Devices */}
        <Box
          sx={{
            flex: 1,
            p: 2,
            borderRadius: 2,
            bgcolor: alpha(syncHealthColor, 0.08),
            border: `1px solid ${alpha(syncHealthColor, 0.2)}`,
            textAlign: 'center',
          }}
        >
          <CheckCircle sx={{ fontSize: 28, color: syncHealthColor, mb: 0.5 }} />
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              color: syncHealthColor,
              mb: 0.25,
            }}
          >
            {intuneStats.recentCheckIns}
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)',
              fontWeight: 500,
              display: 'block',
            }}
          >
            Actief (7d)
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: syncHealthColor,
              fontWeight: 700,
              fontSize: '0.65rem',
              display: 'block',
              mt: 0.5,
            }}
          >
            {intuneStats.activePercent.toFixed(0)}%
          </Typography>
        </Box>

        {/* Expiring Certificates */}
        <Box
          sx={{
            flex: 1,
            p: 2,
            borderRadius: 2,
            bgcolor: alpha(intuneStats.expiringCerts > 0 ? '#FF9800' : '#4CAF50', 0.08),
            border: `1px solid ${alpha(intuneStats.expiringCerts > 0 ? '#FF9800' : '#4CAF50', 0.2)}`,
            textAlign: 'center',
          }}
        >
          {intuneStats.expiringCerts > 0 ? (
            <Warning sx={{ fontSize: 28, color: '#FF9800', mb: 0.5 }} />
          ) : (
            <CheckCircle sx={{ fontSize: 28, color: '#4CAF50', mb: 0.5 }} />
          )}
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              color: intuneStats.expiringCerts > 0 ? '#FF9800' : '#4CAF50',
              mb: 0.25,
            }}
          >
            {intuneStats.expiringCerts}
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)',
              fontWeight: 500,
              display: 'block',
            }}
          >
            Cert. verlopen
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: intuneStats.expiringCerts > 0 ? '#FF9800' : '#4CAF50',
              fontWeight: 700,
              fontSize: '0.65rem',
              display: 'block',
              mt: 0.5,
            }}
          >
            30 dagen
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
});

IntuneSyncStatusWidget.displayName = 'IntuneSyncStatusWidget';

export default IntuneSyncStatusWidget;

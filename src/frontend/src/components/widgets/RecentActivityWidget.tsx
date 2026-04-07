/**
 * RecentActivityWidget Component
 * Timeline of recent asset changes and events
 */

import {
  Box,
  Typography,
  Paper,
  alpha,
  useTheme,
  Skeleton,
  Chip,
} from '@mui/material';
import { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { getNeumorph, getNeumorphColors } from '../../utils/neumorphicStyles';
import {
  Add,
  Edit,
  SwapHoriz,
  Person,
  Schedule,
  Cloud,
  TrendingUp,
} from '@mui/icons-material';
import { Asset } from '../../types/asset.types';
import { formatDistanceToNow } from 'date-fns';
import { nl } from 'date-fns/locale';

interface ActivityEvent {
  id: string;
  type: 'created' | 'updated' | 'status_change' | 'owner_change' | 'intune_sync';
  assetCode: string;
  assetName: string;
  timestamp: Date;
  details?: string;
  icon: typeof Add;
  color: string;
}

interface RecentActivityProps {
  assets: Asset[];
  maxItems?: number;
  isLoading?: boolean;
}

export const RecentActivityWidget = memo<RecentActivityProps>(({
  assets,
  maxItems = 10,
  isLoading = false,
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const isDark = theme.palette.mode === 'dark';
  const { bgBase, bgSurface } = getNeumorphColors(isDark);

  const activities = useMemo(() => {
    const events: ActivityEvent[] = [];

    // Sort assets by most recent updates
    const sortedAssets = [...assets].sort((a, b) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );

    sortedAssets.slice(0, maxItems).forEach(asset => {
      const createdDate = new Date(asset.createdAt);
      const updatedDate = new Date(asset.updatedAt);
      const timeDiff = updatedDate.getTime() - createdDate.getTime();

      // Recently created (within 1 hour of creation)
      if (timeDiff < 3600000) {
        events.push({
          id: `create-${asset.id}`,
          type: 'created',
          assetCode: asset.assetCode,
          assetName: asset.assetName,
          timestamp: createdDate,
          details: asset.assetType?.name,
          icon: Add,
          color: '#4CAF50',
        });
      }
      // Updated asset
      else {
        // Check if Intune synced recently
        if (asset.intuneSyncedAt) {
          const syncDate = new Date(asset.intuneSyncedAt);
          if (syncDate.getTime() === updatedDate.getTime()) {
            events.push({
              id: `intune-${asset.id}`,
              type: 'intune_sync',
              assetCode: asset.assetCode,
              assetName: asset.assetName,
              timestamp: syncDate,
              details: 'Intune synchronisatie',
              icon: Cloud,
              color: '#2196F3',
            });
            return;
          }
        }

        // Check if owner changed (recently assigned)
        if (asset.owner || asset.employee) {
          events.push({
            id: `owner-${asset.id}`,
            type: 'owner_change',
            assetCode: asset.assetCode,
            assetName: asset.assetName,
            timestamp: updatedDate,
            details: asset.employee?.displayName || asset.owner,
            icon: Person,
            color: '#9C27B0',
          });
        }
        // Status change
        else if (asset.status) {
          const statusLabels: Record<string, string> = {
            InGebruik: 'In Gebruik',
            Stock: 'Stock',
            Herstelling: 'Herstelling',
            Defect: 'Defect',
            UitDienst: 'Uit Dienst',
            Nieuw: 'Nieuw',
          };
          events.push({
            id: `status-${asset.id}`,
            type: 'status_change',
            assetCode: asset.assetCode,
            assetName: asset.assetName,
            timestamp: updatedDate,
            details: statusLabels[asset.status] || asset.status,
            icon: SwapHoriz,
            color: '#FF9800',
          });
        }
        // Generic update
        else {
          events.push({
            id: `update-${asset.id}`,
            type: 'updated',
            assetCode: asset.assetCode,
            assetName: asset.assetName,
            timestamp: updatedDate,
            icon: Edit,
            color: '#607D8B',
          });
        }
      }
    });

    return events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [assets, maxItems]);

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
        <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {[1, 2, 3, 4, 5].map(i => (
            <Box key={i} sx={{ display: 'flex', gap: 2 }}>
              <Skeleton variant="circular" width={40} height={40} />
              <Box sx={{ flex: 1 }}>
                <Skeleton variant="text" width="80%" />
                <Skeleton variant="text" width="60%" />
              </Box>
            </Box>
          ))}
        </Box>
      </Paper>
    );
  }

  if (activities.length === 0) {
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
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Schedule sx={{ fontSize: 48, color: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)', mb: 2 }} />
        <Typography variant="body2" color="text.secondary">
          Geen recente activiteit
        </Typography>
      </Paper>
    );
  }

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
      }}
    >
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
        <TrendingUp sx={{ fontSize: 24, color: '#FF7700' }} />
        <Typography
          variant="h6"
          sx={{
            fontWeight: 700,
            color: isDark ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.87)',
          }}
        >
          Recente Activiteit
        </Typography>
        <Chip
          label={activities.length}
          size="small"
          sx={{
            ml: 'auto',
            fontWeight: 700,
            bgcolor: alpha('#FF7700', 0.15),
            color: '#FF7700',
          }}
        />
      </Box>

      {/* Activity timeline */}
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          pr: 1,
          '&::-webkit-scrollbar': {
            width: 6,
          },
          '&::-webkit-scrollbar-track': {
            bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
            borderRadius: 3,
          },
          '&::-webkit-scrollbar-thumb': {
            bgcolor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
            borderRadius: 3,
            '&:hover': {
              bgcolor: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)',
            },
          },
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {activities.map((activity, index) => {
            const Icon = activity.icon;
            const timeAgo = formatDistanceToNow(activity.timestamp, {
              addSuffix: true,
              locale: nl,
            });

            return (
              <Box
                key={activity.id}
                sx={{
                  display: 'flex',
                  gap: 1.5,
                  position: 'relative',
                  '&::before': index < activities.length - 1 ? {
                    content: '""',
                    position: 'absolute',
                    left: 19,
                    top: 40,
                    bottom: -10,
                    width: 2,
                    bgcolor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                  } : {},
                }}
              >
                {/* Icon */}
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: alpha(activity.color, 0.12),
                    border: `2px solid ${alpha(activity.color, 0.3)}`,
                    flexShrink: 0,
                    zIndex: 1,
                  }}
                >
                  <Icon sx={{ fontSize: 20, color: activity.color }} />
                </Box>

                {/* Content */}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mb: 0.25 }}>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 700,
                        fontFamily: 'monospace',
                        color: '#FF7700',
                        fontSize: '0.8rem',
                      }}
                    >
                      {activity.assetCode}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
                        fontSize: '0.7rem',
                      }}
                    >
                      {timeAgo}
                    </Typography>
                  </Box>
                  <Typography
                    variant="body2"
                    sx={{
                      color: isDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.8)',
                      fontWeight: 500,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {activity.assetName}
                  </Typography>
                  {activity.details && (
                    <Typography
                      variant="caption"
                      sx={{
                        display: 'block',
                        mt: 0.25,
                        color: activity.color,
                        fontWeight: 600,
                        fontSize: '0.7rem',
                      }}
                    >
                      {activity.details}
                    </Typography>
                  )}
                </Box>
              </Box>
            );
          })}
        </Box>
      </Box>
    </Paper>
  );
});

RecentActivityWidget.displayName = 'RecentActivityWidget';

export default RecentActivityWidget;

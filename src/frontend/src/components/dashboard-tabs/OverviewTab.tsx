/**
 * OverviewTab Component
 * Ultra-compact executive dashboard with KPIs, alerts, and activity
 */

import { useMemo } from 'react';
import { Box, Typography, useTheme, alpha, Skeleton, Chip } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import {
  Devices,
  CheckCircle,
  Inventory2,
  Error as ErrorIcon,
  Warning,
  Cloud,
  EventNote,
  TrendingUp,
  Schedule,
} from '@mui/icons-material';
import { useAssets } from '../../hooks/useAssets';
import { useRolloutSessions } from '../../hooks/rollout/useRolloutSessions';
import { getNeumorphColors, getNeumorph } from '../../utils/neumorphicStyles';
import { ROUTES } from '../../constants/routes';
import AssetPlanningCalendar from '../dashboard/AssetPlanningCalendar';
import AssetKPIs from '../dashboard/AssetKPIs';

interface CompactKPIProps {
  icon: React.ElementType;
  label: string;
  value: number | string;
  color: string;
  subtitle?: string;
  onClick?: () => void;
}

const CompactKPI = ({ icon: Icon, label, value, color, subtitle, onClick }: CompactKPIProps) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { bgSurface } = getNeumorphColors(isDark);

  return (
    <Box
      onClick={onClick}
      sx={{
        p: 1,
        borderRadius: 2,
        bgcolor: bgSurface,
        boxShadow: getNeumorph(isDark, 'medium'),
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s ease',
        border: `1px solid ${alpha(color, 0.15)}`,
        '&:hover': onClick
          ? {
              transform: 'translateY(-2px)',
              boxShadow: getNeumorph(isDark, 'strong'),
              borderColor: alpha(color, 0.4),
            }
          : {},
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.3 }}>
        <Icon sx={{ fontSize: 18, color: alpha(color, 0.9) }} />
        <Typography variant="caption" sx={{ fontSize: '0.65rem', color: 'text.secondary', fontWeight: 500 }}>
          {label}
        </Typography>
      </Box>
      <Typography
        variant="h5"
        sx={{
          fontWeight: 700,
          fontSize: '1.5rem',
          lineHeight: 1,
          color: alpha(color, 1),
          mb: subtitle ? 0.3 : 0,
        }}
      >
        {value}
      </Typography>
      {subtitle && (
        <Typography variant="caption" sx={{ fontSize: '0.6rem', color: 'text.disabled' }}>
          {subtitle}
        </Typography>
      )}
    </Box>
  );
};

interface AlertItemProps {
  label: string;
  count: number;
  severity: 'error' | 'warning' | 'info';
  onClick?: () => void;
}

const AlertItem = ({ label, count, severity, onClick }: AlertItemProps) => {
  const severityColors = {
    error: '#EF4444',
    warning: '#F59E0B',
    info: '#3B82F6',
  };

  return (
    <Box
      onClick={onClick}
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        py: 0.5,
        px: 1,
        borderRadius: 1,
        cursor: onClick ? 'pointer' : 'default',
        '&:hover': onClick
          ? {
              bgcolor: alpha(severityColors[severity], 0.05),
            }
          : {},
      }}
    >
      <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'text.primary' }}>
        {label}
      </Typography>
      <Chip
        label={count}
        size="small"
        sx={{
          height: 18,
          fontSize: '0.65rem',
          fontWeight: 600,
          bgcolor: alpha(severityColors[severity], 0.15),
          color: severityColors[severity],
          '& .MuiChip-label': { px: 0.75 },
        }}
      />
    </Box>
  );
};

interface ActivityItemProps {
  title: string;
  subtitle: string;
  timestamp: string;
  icon: React.ElementType;
  color?: string;
}

const ActivityItem = ({ title, subtitle, timestamp, icon: Icon, color = '#3B82F6' }: ActivityItemProps) => {
  return (
    <Box
      sx={{
        display: 'flex',
        gap: 1,
        py: 0.75,
        px: 1,
        borderRadius: 1,
        '&:hover': {
          bgcolor: alpha(color, 0.05),
        },
      }}
    >
      <Box
        sx={{
          mt: 0.3,
          width: 24,
          height: 24,
          borderRadius: '50%',
          bgcolor: alpha(color, 0.15),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Icon sx={{ fontSize: 14, color }} />
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          variant="caption"
          sx={{
            fontSize: '0.7rem',
            fontWeight: 600,
            color: 'text.primary',
            display: 'block',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {title}
        </Typography>
        <Typography
          variant="caption"
          sx={{
            fontSize: '0.65rem',
            color: 'text.secondary',
            display: 'block',
          }}
        >
          {subtitle}
        </Typography>
        <Typography
          variant="caption"
          sx={{
            fontSize: '0.6rem',
            color: 'text.disabled',
          }}
        >
          {timestamp}
        </Typography>
      </Box>
    </Box>
  );
};

const OverviewTab = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const isDark = theme.palette.mode === 'dark';
  const { bgSurface } = getNeumorphColors(isDark);

  const { data: assets, isLoading: assetsLoading } = useAssets();
  const { data: rolloutSessions, isLoading: rolloutsLoading } = useRolloutSessions();

  // Calculate KPIs
  const kpis = useMemo(() => {
    if (!assets) {
      return {
        total: 0,
        inGebruik: 0,
        stock: 0,
        needsAttention: 0,
        intuneManaged: 0,
        missingSerials: 0,
        expiringWarranties: 0,
      };
    }

    const now = new Date();
    const ninetyDaysFromNow = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

    return {
      total: assets.length,
      inGebruik: assets.filter((a) => a.status === 'InGebruik').length,
      stock: assets.filter((a) => a.status === 'Stock').length,
      needsAttention: assets.filter((a) => a.status === 'Defect' || a.status === 'Herstelling').length,
      intuneManaged: assets.filter((a) => a.intuneSyncedAt).length,
      missingSerials: assets.filter((a) => !a.serialNumber || a.serialNumber.trim() === '').length,
      expiringWarranties: assets.filter(
        (a) => a.warrantyExpiry && new Date(a.warrantyExpiry) <= ninetyDaysFromNow
      ).length,
    };
  }, [assets]);

  // Rollout metrics
  const rolloutMetrics = useMemo(() => {
    if (!rolloutSessions) {
      return {
        activeSessions: 0,
        todayRollouts: [],
        thisWeekWorkplaces: 0,
      };
    }

    const now = new Date();
    const today = now.toISOString().split('T')[0];

    return {
      activeSessions: rolloutSessions.filter((s) => s.status === 'InProgress').length,
      todayRollouts: rolloutSessions.filter((s) => {
        // Check if session has any days scheduled for today
        return s.days?.some((d) => d.date?.split('T')[0] === today) ?? false;
      }),
      thisWeekWorkplaces: rolloutSessions.reduce((total, session) => {
        const weekWorkplaces = session.days?.reduce((dayTotal, day) => {
          const dayDate = new Date(day.date || '');
          const diffDays = Math.floor((dayDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          return diffDays >= 0 && diffDays <= 7 ? dayTotal + (day.workplaces?.length || 0) : dayTotal;
        }, 0);
        return total + (weekWorkplaces || 0);
      }, 0),
    };
  }, [rolloutSessions]);

  // Recent activity (latest Intune synced assets)
  const recentActivity = useMemo(() => {
    if (!assets) return [];

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    return assets
      .filter((a) => a.intuneSyncedAt && new Date(a.intuneSyncedAt) >= sevenDaysAgo)
      .sort((a, b) => new Date(b.intuneSyncedAt!).getTime() - new Date(a.intuneSyncedAt!).getTime())
      .slice(0, 8);
  }, [assets]);

  const formatTimestamp = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  if (assetsLoading || rolloutsLoading) {
    return (
      <Box sx={{ p: 1.5 }}>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {[...Array(7)].map((_, i) => (
            <Box key={i} sx={{ flex: '1 1 calc(14.285% - 8px)', minWidth: 120 }}>
              <Skeleton variant="rectangular" height={80} sx={{ borderRadius: 2 }} />
            </Box>
          ))}
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 1.5 }}>
      {/* Critical KPIs - Ultra Compact */}
      <Box
        sx={{
          display: 'flex',
          gap: 1,
          mb: 2,
          flexWrap: 'wrap',
        }}
      >
        <Box sx={{ flex: '1 1 calc(14.285% - 8px)', minWidth: 120 }}>
          <CompactKPI
            icon={Devices}
            label="Total Assets"
            value={kpis.total}
            color="#3B82F6"
            onClick={() => navigate(`${ROUTES.DASHBOARD}?tab=inventory`)}
          />
        </Box>
        <Box sx={{ flex: '1 1 calc(14.285% - 8px)', minWidth: 120 }}>
          <CompactKPI
            icon={CheckCircle}
            label="In Use"
            value={kpis.inGebruik}
            color="#10B981"
            onClick={() => navigate(`${ROUTES.DASHBOARD}?tab=inventory&status=InGebruik`)}
          />
        </Box>
        <Box sx={{ flex: '1 1 calc(14.285% - 8px)', minWidth: 120 }}>
          <CompactKPI
            icon={Inventory2}
            label="Stock"
            value={kpis.stock}
            color="#3B82F6"
            onClick={() => navigate(`${ROUTES.DASHBOARD}?tab=inventory&status=Stock`)}
          />
        </Box>
        <Box sx={{ flex: '1 1 calc(14.285% - 8px)', minWidth: 120 }}>
          <CompactKPI
            icon={ErrorIcon}
            label="Needs Attention"
            value={kpis.needsAttention}
            color="#EF4444"
            onClick={() => navigate(`${ROUTES.DASHBOARD}?tab=inventory&status=Defect,Herstelling`)}
          />
        </Box>
        <Box sx={{ flex: '1 1 calc(14.285% - 8px)', minWidth: 120 }}>
          <CompactKPI
            icon={Cloud}
            label="Intune Managed"
            value={kpis.intuneManaged}
            color="#14B8A6"
            subtitle={`${assets ? ((kpis.intuneManaged / assets.length) * 100).toFixed(0) : 0}% coverage`}
          />
        </Box>
        <Box sx={{ flex: '1 1 calc(14.285% - 8px)', minWidth: 120 }}>
          <CompactKPI
            icon={EventNote}
            label="Active Rollouts"
            value={rolloutMetrics.activeSessions}
            color="#FF7700"
            onClick={() => navigate(`${ROUTES.DASHBOARD}?tab=rollout`)}
          />
        </Box>
        <Box sx={{ flex: '1 1 calc(14.285% - 8px)', minWidth: 120 }}>
          <CompactKPI
            icon={Schedule}
            label="This Week"
            value={rolloutMetrics.thisWeekWorkplaces}
            color="#9C27B0"
            subtitle="workplaces"
          />
        </Box>
      </Box>

      {/* Main Content Grid */}
      <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mb: 2 }}>
        {/* Alarms & Alerts */}
        <Box sx={{ flex: '1 1 calc(33.333% - 12px)', minWidth: 300 }}>
          <Box
            sx={{
              p: 1.5,
              borderRadius: 2,
              bgcolor: bgSurface,
              boxShadow: getNeumorph(isDark, 'medium'),
              height: '100%',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Warning sx={{ fontSize: 18, color: '#F59E0B' }} />
              <Typography variant="subtitle2" sx={{ fontSize: '0.8rem', fontWeight: 700 }}>
                Active Alarms
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              <AlertItem
                label="Expiring Warranties (90 days)"
                count={kpis.expiringWarranties}
                severity="warning"
              />
              <AlertItem label="Missing Serial Numbers" count={kpis.missingSerials} severity="warning" />
              <AlertItem label="Needs Repair" count={kpis.needsAttention} severity="error" />
            </Box>
          </Box>
        </Box>

        {/* Rollout Planning Quick View */}
        <Box sx={{ flex: '1 1 calc(33.333% - 12px)', minWidth: 300 }}>
          <Box
            sx={{
              p: 1.5,
              borderRadius: 2,
              bgcolor: bgSurface,
              boxShadow: getNeumorph(isDark, 'medium'),
              height: '100%',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <EventNote sx={{ fontSize: 18, color: '#FF7700' }} />
              <Typography variant="subtitle2" sx={{ fontSize: '0.8rem', fontWeight: 700 }}>
                Rollout Planning
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              <Box sx={{ py: 0.5, px: 1 }}>
                <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>
                  Active Sessions
                </Typography>
                <Typography variant="h6" sx={{ fontSize: '1.2rem', fontWeight: 700, color: '#FF7700' }}>
                  {rolloutMetrics.activeSessions}
                </Typography>
              </Box>
              {rolloutMetrics.todayRollouts.length > 0 && (
                <Box sx={{ py: 0.5, px: 1 }}>
                  <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'text.secondary', mb: 0.5 }}>
                    Today&apos;s Rollouts
                  </Typography>
                  {rolloutMetrics.todayRollouts.map((session) => (
                    <Chip
                      key={session.id}
                      label={session.sessionName}
                      size="small"
                      sx={{
                        height: 18,
                        fontSize: '0.65rem',
                        mb: 0.5,
                        mr: 0.5,
                      }}
                    />
                  ))}
                </Box>
              )}
            </Box>
          </Box>
        </Box>

        {/* Recent Activity */}
        <Box sx={{ flex: '1 1 calc(33.333% - 12px)', minWidth: 300 }}>
          <Box
            sx={{
              p: 1.5,
              borderRadius: 2,
              bgcolor: bgSurface,
              boxShadow: getNeumorph(isDark, 'medium'),
              height: '100%',
              maxHeight: 300,
              overflow: 'hidden',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <TrendingUp sx={{ fontSize: 18, color: '#3B82F6' }} />
              <Typography variant="subtitle2" sx={{ fontSize: '0.8rem', fontWeight: 700 }}>
                Recent Activity (7 days)
              </Typography>
            </Box>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 0.25,
                maxHeight: 240,
                overflowY: 'auto',
                '&::-webkit-scrollbar': { width: 4 },
                '&::-webkit-scrollbar-thumb': {
                  bgcolor: alpha('#3B82F6', 0.3),
                  borderRadius: 2,
                },
              }}
            >
              {recentActivity.length > 0 ? (
                recentActivity.map((asset) => (
                  <ActivityItem
                    key={asset.id}
                    title={asset.assetCode || 'Unknown Asset'}
                    subtitle={`${asset.assetName || ''} - Intune Synced`}
                    timestamp={formatTimestamp(asset.intuneSyncedAt!)}
                    icon={Cloud}
                    color="#14B8A6"
                  />
                ))
              ) : (
                <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'text.disabled', p: 1 }}>
                  No recent Intune activity
                </Typography>
              )}
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Asset KPIs - Stock, In Use, Swaps */}
      <Box sx={{ mb: 1.5 }}>
        <AssetKPIs />
      </Box>

      {/* Asset Planning Calendar - Full Width */}
      <AssetPlanningCalendar />
    </Box>
  );
};

export default OverviewTab;

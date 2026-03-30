/**
 * ProgressDashboard - Session progress visualization dashboard
 *
 * Features:
 * - Session progress cards with key metrics
 * - Progress bar with percentage
 * - Summary statistics grid
 * - Day-by-day progress breakdown
 * - Djoppie-neomorph styling
 */

import { useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Chip,
  Skeleton,
  Alert,
  Tooltip,
} from '@mui/material';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import PeopleIcon from '@mui/icons-material/People';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import InventoryIcon from '@mui/icons-material/Inventory';
import RemoveCircleIcon from '@mui/icons-material/RemoveCircle';
import ScheduleIcon from '@mui/icons-material/Schedule';
import type { RolloutProgress, RolloutSession } from '../../../types/rollout';
import type { SessionProgressStats, DayProgressStats } from '../../../types/report.types';
import { ASSET_COLOR } from '../../../constants/filterColors';

interface ProgressDashboardProps {
  // Support both existing RolloutProgress and new SessionProgressStats
  progress?: RolloutProgress | SessionProgressStats;
  session?: RolloutSession;
  daysProgress?: DayProgressStats[];
  isLoading?: boolean;
  error?: Error | null;
  compact?: boolean;
}

/**
 * Calculate days remaining
 */
const calculateDaysRemaining = (endDate?: string): number => {
  if (!endDate) return 0;
  const end = new Date(endDate);
  const today = new Date();
  const diffTime = end.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
};

/**
 * Stat Card Component
 */
interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subValue?: string;
  color: string;
  bgColor: string;
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'neutral';
  };
}

const StatCard = ({ icon, label, value, subValue, color, bgColor, trend }: StatCardProps) => (
  <Box
    sx={{
      p: 2,
      borderRadius: 2,
      border: '1px solid',
      borderColor: 'divider',
      bgcolor: bgColor,
      display: 'flex',
      alignItems: 'center',
      gap: 1.5,
      transition: 'all 0.2s ease',
      '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: (theme) =>
          theme.palette.mode === 'dark'
            ? '0 8px 24px rgba(0, 0, 0, 0.4)'
            : '0 4px 12px rgba(0, 0, 0, 0.08)',
        borderColor: color,
      },
    }}
  >
    <Box
      sx={{
        width: 48,
        height: 48,
        borderRadius: 2,
        bgcolor: 'background.paper',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: `0 2px 8px ${color}30`,
      }}
    >
      {icon}
    </Box>
    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
        <Typography
          variant="h5"
          sx={{
            fontWeight: 700,
            color: color,
            lineHeight: 1.2,
          }}
        >
          {value}
        </Typography>
        {trend && (
          <Chip
            label={`${trend.direction === 'up' ? '+' : trend.direction === 'down' ? '-' : ''}${trend.value}%`}
            size="small"
            sx={{
              height: 18,
              fontSize: '0.65rem',
              bgcolor:
                trend.direction === 'up'
                  ? 'rgba(34, 197, 94, 0.12)'
                  : trend.direction === 'down'
                    ? 'rgba(239, 68, 68, 0.12)'
                    : 'rgba(107, 114, 128, 0.12)',
              color:
                trend.direction === 'up'
                  ? '#16a34a'
                  : trend.direction === 'down'
                    ? '#dc2626'
                    : '#6b7280',
            }}
          />
        )}
      </Box>
      <Typography
        variant="caption"
        sx={{
          color: 'text.secondary',
          fontSize: '0.75rem',
          fontWeight: 500,
        }}
      >
        {label}
      </Typography>
      {subValue && (
        <Typography
          variant="caption"
          sx={{
            display: 'block',
            color: 'text.secondary',
            fontSize: '0.7rem',
          }}
        >
          {subValue}
        </Typography>
      )}
    </Box>
  </Box>
);

/**
 * Loading skeleton
 */
const LoadingSkeleton = ({ compact }: { compact?: boolean }) => (
  <Paper
    elevation={0}
    sx={{
      p: compact ? 2 : 3,
      border: '1px solid',
      borderColor: 'divider',
      borderRadius: 2,
    }}
  >
    <Skeleton variant="text" width="40%" height={32} sx={{ mb: 2 }} />
    <Grid container spacing={2}>
      {[1, 2, 3, 4].map((i) => (
        <Grid size={{ xs: 12, sm: 6, md: 3 }} key={i}>
          <Skeleton variant="rectangular" height={80} sx={{ borderRadius: 2 }} />
        </Grid>
      ))}
    </Grid>
    <Skeleton variant="rectangular" height={12} sx={{ mt: 3, borderRadius: 1 }} />
  </Paper>
);

const ProgressDashboard = ({
  progress,
  session,
  daysProgress,
  isLoading = false,
  error = null,
  compact = false,
}: ProgressDashboardProps) => {
  // Derive stats from progress or session
  const stats = useMemo(() => {
    if (progress) {
      return {
        sessionName: progress.sessionName,
        status: progress.status,
        totalDays: progress.totalDays,
        completedDays:
          'completedDays' in progress
            ? progress.completedDays
            : progress.dayProgress?.filter((d) => d.completionPercentage === 100).length || 0,
        totalWorkplaces: progress.totalWorkplaces,
        completedWorkplaces: progress.completedWorkplaces,
        pendingWorkplaces: progress.pendingWorkplaces,
        inProgressWorkplaces: progress.inProgressWorkplaces || 0,
        skippedWorkplaces: progress.skippedWorkplaces || 0,
        failedWorkplaces: progress.failedWorkplaces || 0,
        completionPercentage: progress.completionPercentage,
        totalAssetsDeployed:
          'totalAssetsDeployed' in progress ? progress.totalAssetsDeployed : 0,
        totalAssetsDecommissioned:
          'totalAssetsDecommissioned' in progress ? progress.totalAssetsDecommissioned : 0,
        plannedEndDate:
          'plannedEndDate' in progress
            ? progress.plannedEndDate
            : session?.plannedEndDate,
      };
    }

    if (session) {
      return {
        sessionName: session.sessionName,
        status: session.status,
        totalDays: session.totalDays,
        completedDays: 0,
        totalWorkplaces: session.totalWorkplaces,
        completedWorkplaces: session.completedWorkplaces,
        pendingWorkplaces: session.totalWorkplaces - session.completedWorkplaces,
        inProgressWorkplaces: 0,
        skippedWorkplaces: 0,
        failedWorkplaces: 0,
        completionPercentage: session.completionPercentage,
        totalAssetsDeployed: 0,
        totalAssetsDecommissioned: 0,
        plannedEndDate: session.plannedEndDate,
      };
    }

    return null;
  }, [progress, session]);

  // Loading state
  if (isLoading) {
    return <LoadingSkeleton compact={compact} />;
  }

  // Error state
  if (error) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: compact ? 2 : 3,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
        }}
      >
        <Alert severity="error">
          Fout bij het laden van voortgang: {error.message}
        </Alert>
      </Paper>
    );
  }

  // No data state
  if (!stats) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: compact ? 2 : 3,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
        }}
      >
        <Alert severity="info">Geen voortgangsgegevens beschikbaar.</Alert>
      </Paper>
    );
  }

  const daysRemaining = calculateDaysRemaining(stats.plannedEndDate);
  const isComplete = stats.completionPercentage === 100;

  return (
    <Paper
      elevation={0}
      sx={{
        p: compact ? 2 : 3,
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        background: 'linear-gradient(135deg, rgba(255, 119, 0, 0.02) 0%, transparent 100%)',
      }}
    >
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: compact ? 1.5 : 2 }}>
        <Typography variant={compact ? 'subtitle1' : 'h6'} sx={{ fontWeight: 700, color: 'text.primary' }}>
          {compact ? 'Voortgang' : 'Sessie Voortgang'}
        </Typography>
        <Chip
          label={stats.status}
          size="small"
          sx={{
            bgcolor:
              stats.status === 'Completed'
                ? 'rgba(22, 163, 74, 0.12)'
                : stats.status === 'InProgress'
                  ? 'rgba(255, 119, 0, 0.12)'
                  : stats.status === 'Ready'
                    ? 'rgba(59, 130, 246, 0.12)'
                    : 'rgba(107, 114, 128, 0.12)',
            color:
              stats.status === 'Completed'
                ? '#16a34a'
                : stats.status === 'InProgress'
                  ? ASSET_COLOR
                  : stats.status === 'Ready'
                    ? '#3B82F6'
                    : '#6b7280',
            fontWeight: 600,
          }}
        />
        {isComplete && (
          <Chip
            label="Voltooid"
            size="small"
            icon={<CheckCircleIcon sx={{ fontSize: '0.9rem' }} />}
            sx={{
              bgcolor: 'rgba(22, 163, 74, 0.12)',
              color: '#16a34a',
              fontWeight: 600,
              '& .MuiChip-icon': { color: '#16a34a' },
            }}
          />
        )}
      </Box>

      {/* Stats Grid */}
      <Grid container spacing={compact ? 1.5 : 2}>
        {/* Days Progress */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            icon={<CalendarTodayIcon sx={{ fontSize: 24, color: ASSET_COLOR }} />}
            label="Planningen"
            value={`${stats.completedDays}/${stats.totalDays}`}
            subValue={daysRemaining > 0 ? `${daysRemaining} dagen resterend` : undefined}
            color="{ASSET_COLOR}"
            bgColor="rgba(255, 119, 0, 0.08)"
          />
        </Grid>

        {/* Workplaces Progress */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            icon={<PeopleIcon sx={{ fontSize: 24, color: '#3B82F6' }} />}
            label="Werkplekken"
            value={`${stats.completedWorkplaces}/${stats.totalWorkplaces}`}
            subValue={
              stats.inProgressWorkplaces > 0
                ? `${stats.inProgressWorkplaces} in uitvoering`
                : undefined
            }
            color="#3B82F6"
            bgColor="rgba(59, 130, 246, 0.08)"
          />
        </Grid>

        {/* Assets Deployed */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            icon={<InventoryIcon sx={{ fontSize: 24, color: '#22c55e' }} />}
            label="In Gebruik Gezet"
            value={stats.totalAssetsDeployed}
            color="#22c55e"
            bgColor="rgba(34, 197, 94, 0.08)"
          />
        </Grid>

        {/* Assets Decommissioned */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            icon={<RemoveCircleIcon sx={{ fontSize: 24, color: '#ef4444' }} />}
            label="Uit Dienst Gezet"
            value={stats.totalAssetsDecommissioned}
            color="#ef4444"
            bgColor="rgba(239, 68, 68, 0.08)"
          />
        </Grid>
      </Grid>

      {/* Progress Bar */}
      {stats.totalWorkplaces > 0 && (
        <Box sx={{ mt: compact ? 2 : 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
              Algehele voortgang
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: isComplete ? '#16a34a' : ASSET_COLOR,
                fontWeight: 700,
              }}
            >
              {stats.completedWorkplaces} van {stats.totalWorkplaces} werkplekken ({stats.completionPercentage}%)
            </Typography>
          </Box>
          <Box
            sx={{
              width: '100%',
              height: 10,
              bgcolor: (theme) =>
                theme.palette.mode === 'dark'
                  ? 'rgba(255, 255, 255, 0.08)'
                  : 'rgba(0, 0, 0, 0.08)',
              borderRadius: 5,
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            <Box
              sx={{
                width: `${stats.completionPercentage}%`,
                height: '100%',
                bgcolor: isComplete ? '#16a34a' : ASSET_COLOR,
                transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                borderRadius: 5,
                position: 'relative',
                '&::after': stats.completionPercentage > 0 && stats.completionPercentage < 100 ? {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  bottom: 0,
                  left: 0,
                  background: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.3) 50%, transparent 100%)',
                  animation: 'shimmer 2s infinite',
                } : {},
                '@keyframes shimmer': {
                  '0%': { transform: 'translateX(-100%)' },
                  '100%': { transform: 'translateX(100%)' },
                },
              }}
            />
          </Box>
        </Box>
      )}

      {/* Days Progress Timeline (if available and not compact) */}
      {!compact && daysProgress && daysProgress.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Typography
            variant="caption"
            sx={{ color: 'text.secondary', fontWeight: 600, display: 'block', mb: 1 }}
          >
            Voortgang per dag
          </Typography>
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
            {daysProgress.map((day) => {
              const dayComplete = day.completionPercentage === 100;
              const hasProgress = day.completionPercentage > 0;
              return (
                <Tooltip
                  key={day.dayId}
                  title={`${day.name || `Dag ${day.dayNumber}`}: ${day.completedWorkplaces}/${day.totalWorkplaces} (${day.completionPercentage}%)`}
                >
                  <Box
                    sx={{
                      width: 28,
                      height: 28,
                      borderRadius: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      cursor: 'default',
                      border: '1px solid',
                      borderColor: dayComplete
                        ? '#16a34a'
                        : hasProgress
                          ? ASSET_COLOR
                          : 'divider',
                      bgcolor: dayComplete
                        ? 'rgba(22, 163, 74, 0.15)'
                        : hasProgress
                          ? 'rgba(255, 119, 0, 0.1)'
                          : 'transparent',
                      color: dayComplete
                        ? '#16a34a'
                        : hasProgress
                          ? ASSET_COLOR
                          : 'text.secondary',
                    }}
                  >
                    {day.dayNumber}
                  </Box>
                </Tooltip>
              );
            })}
          </Box>
        </Box>
      )}

      {/* Status breakdown (if not compact and has status data) */}
      {!compact &&
        (stats.skippedWorkplaces > 0 || stats.failedWorkplaces > 0) && (
          <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {stats.skippedWorkplaces > 0 && (
              <Chip
                icon={<ScheduleIcon sx={{ fontSize: '0.9rem' }} />}
                label={`${stats.skippedWorkplaces} overgeslagen`}
                size="small"
                variant="outlined"
                sx={{
                  borderColor: 'warning.main',
                  color: 'warning.main',
                  '& .MuiChip-icon': { color: 'warning.main' },
                }}
              />
            )}
            {stats.failedWorkplaces > 0 && (
              <Chip
                icon={<RemoveCircleIcon sx={{ fontSize: '0.9rem' }} />}
                label={`${stats.failedWorkplaces} mislukt`}
                size="small"
                variant="outlined"
                sx={{
                  borderColor: 'error.main',
                  color: 'error.main',
                  '& .MuiChip-icon': { color: 'error.main' },
                }}
              />
            )}
          </Box>
        )}
    </Paper>
  );
};

export default ProgressDashboard;

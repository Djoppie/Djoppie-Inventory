import React, { useMemo } from 'react';
import { Box, Typography, Chip, Tooltip, Paper, Divider } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ComputerIcon from '@mui/icons-material/Computer';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import { RolloutDay } from '../../types/rollout';

interface PlanningStatisticsProps {
  days: RolloutDay[];
  targetDays?: number;  // Target number of days (default: 5)
  targetWorkstations?: number; // Target workstations (default: 64)
}

interface PostponedInfo {
  userName: string;
  originalDate: string;
  newDate: string;
  reason?: string;
}

/**
 * Statistics component showing progress over 5 days with postponement tracking
 * Designed for reporting verplichte verplaatsingen wegens vertraging
 */
const PlanningStatistics = React.memo<PlanningStatisticsProps>(function PlanningStatistics({
  days,
  targetDays = 5,
  targetWorkstations = 64,
}) {
  // Calculate statistics
  const stats = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Get the last N working days
    const workingDays: Date[] = [];
    const checkDate = new Date(today);
    while (workingDays.length < targetDays) {
      const dayOfWeek = checkDate.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Skip weekends
        workingDays.push(new Date(checkDate));
      }
      checkDate.setDate(checkDate.getDate() - 1); // This mutates the date object
    }
    workingDays.reverse();

    // Track completed workstations per day
    let totalCompleted = 0;
    let totalPlanned = 0;
    const postponedItems: PostponedInfo[] = [];

    for (const day of days) {
      const dayDate = new Date(day.date.split('T')[0]);
      const isInPeriod = workingDays.some(
        wd => wd.getTime() === dayDate.getTime()
      );

      if (isInPeriod || dayDate <= today) {
        totalPlanned += day.totalWorkplaces;
        totalCompleted += day.completedWorkplaces;

        // Check for postponed workplaces
        if (day.workplaces) {
          for (const wp of day.workplaces) {
            if (wp.scheduledDate) {
              const wpDate = wp.scheduledDate.split('T')[0];
              const originalDate = day.date.split('T')[0];
              if (wpDate !== originalDate) {
                postponedItems.push({
                  userName: wp.userName,
                  originalDate,
                  newDate: wpDate,
                  reason: wp.notes,
                });
              }
            }
          }
        }
      }
    }

    const completionRate = totalPlanned > 0
      ? Math.round((totalCompleted / totalPlanned) * 100)
      : 0;

    const targetReached = totalCompleted >= targetWorkstations;
    const onTrack = completionRate >= 80;

    return {
      totalCompleted,
      totalPlanned,
      completionRate,
      postponedCount: postponedItems.length,
      postponedItems,
      targetReached,
      onTrack,
      daysInPeriod: workingDays.length,
      avgPerDay: totalCompleted > 0 && workingDays.length > 0
        ? Math.round(totalCompleted / workingDays.length * 10) / 10
        : 0,
    };
  }, [days, targetDays, targetWorkstations]);

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        mb: 3,
        borderRadius: 4,
        bgcolor: theme => theme.palette.mode === 'dark'
          ? 'var(--dark-bg-elevated)'
          : 'background.paper',
        boxShadow: theme => theme.palette.mode === 'dark'
          ? 'var(--neu-shadow-dark-lg)'
          : 'var(--neu-shadow-light-lg)',
        border: '1px solid',
        borderColor: theme => theme.palette.mode === 'dark'
          ? 'rgba(255,255,255,0.05)'
          : 'rgba(0,0,0,0.05)',
      }}
    >
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
          <TrendingUpIcon sx={{ color: '#FF7700' }} />
          Voortgang ({targetDays} werkdagen)
        </Typography>
        <Chip
          icon={stats.targetReached ? <CheckCircleIcon /> : <AccessTimeIcon />}
          label={stats.targetReached
            ? `Doel bereikt: ${stats.totalCompleted}/${targetWorkstations}`
            : `${stats.totalCompleted}/${targetWorkstations} werkposities`
          }
          sx={{
            bgcolor: stats.targetReached
              ? 'rgba(22, 163, 74, 0.15)'
              : 'rgba(255, 119, 0, 0.15)',
            color: stats.targetReached ? '#16a34a' : '#FF7700',
            fontWeight: 700,
            '& .MuiChip-icon': {
              color: stats.targetReached ? '#16a34a' : '#FF7700',
            },
          }}
        />
      </Box>

      {/* Stats Grid */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' },
          gap: 2,
          mb: 3,
        }}
      >
        {/* Completed */}
        <Box
          sx={{
            p: 2,
            borderRadius: 3,
            bgcolor: theme => theme.palette.mode === 'dark'
              ? 'rgba(22, 163, 74, 0.1)'
              : 'rgba(22, 163, 74, 0.05)',
            boxShadow: theme => theme.palette.mode === 'dark'
              ? 'var(--neu-shadow-dark-sm)'
              : 'var(--neu-shadow-light-sm)',
            textAlign: 'center',
          }}
        >
          <ComputerIcon sx={{ fontSize: 32, color: '#16a34a', mb: 1 }} />
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#16a34a' }}>
            {stats.totalCompleted}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
            Afgewerkt
          </Typography>
        </Box>

        {/* Planned */}
        <Box
          sx={{
            p: 2,
            borderRadius: 3,
            bgcolor: theme => theme.palette.mode === 'dark'
              ? 'rgba(59, 130, 246, 0.1)'
              : 'rgba(59, 130, 246, 0.05)',
            boxShadow: theme => theme.palette.mode === 'dark'
              ? 'var(--neu-shadow-dark-sm)'
              : 'var(--neu-shadow-light-sm)',
            textAlign: 'center',
          }}
        >
          <AccessTimeIcon sx={{ fontSize: 32, color: '#3B82F6', mb: 1 }} />
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#3B82F6' }}>
            {stats.totalPlanned}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
            Gepland
          </Typography>
        </Box>

        {/* Average per day */}
        <Box
          sx={{
            p: 2,
            borderRadius: 3,
            bgcolor: theme => theme.palette.mode === 'dark'
              ? 'rgba(255, 119, 0, 0.1)'
              : 'rgba(255, 119, 0, 0.05)',
            boxShadow: theme => theme.palette.mode === 'dark'
              ? 'var(--neu-shadow-dark-sm)'
              : 'var(--neu-shadow-light-sm)',
            textAlign: 'center',
          }}
        >
          <TrendingUpIcon sx={{ fontSize: 32, color: '#FF7700', mb: 1 }} />
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#FF7700' }}>
            {stats.avgPerDay}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
            Gem. per dag
          </Typography>
        </Box>

        {/* Postponed - for reporting */}
        <Tooltip
          title={stats.postponedCount > 0
            ? "Klik om details te zien van uitgestelde werkplekken voor rapportering"
            : "Geen uitgestelde werkplekken"
          }
        >
          <Box
            sx={{
              p: 2,
              borderRadius: 3,
              bgcolor: theme => stats.postponedCount > 0
                ? theme.palette.mode === 'dark'
                  ? 'rgba(239, 68, 68, 0.15)'
                  : 'rgba(239, 68, 68, 0.08)'
                : theme.palette.mode === 'dark'
                  ? 'rgba(108, 117, 125, 0.1)'
                  : 'rgba(108, 117, 125, 0.05)',
              boxShadow: theme => theme.palette.mode === 'dark'
                ? 'var(--neu-shadow-dark-sm)'
                : 'var(--neu-shadow-light-sm)',
              textAlign: 'center',
              border: stats.postponedCount > 0
                ? '2px dashed rgba(239, 68, 68, 0.4)'
                : 'none',
              cursor: stats.postponedCount > 0 ? 'pointer' : 'default',
              transition: 'all 0.2s ease',
              '&:hover': stats.postponedCount > 0 ? {
                transform: 'translateY(-2px)',
                boxShadow: 'var(--neu-shadow-dark-float)',
              } : {},
            }}
          >
            <EventBusyIcon
              sx={{
                fontSize: 32,
                color: stats.postponedCount > 0 ? '#EF4444' : '#6C757D',
                mb: 1,
              }}
            />
            <Typography
              variant="h4"
              sx={{
                fontWeight: 800,
                color: stats.postponedCount > 0 ? '#EF4444' : '#6C757D',
              }}
            >
              {stats.postponedCount}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
              Uitgesteld
            </Typography>
          </Box>
        </Tooltip>
      </Box>

      {/* Progress bar */}
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
            Voortgang naar doel
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 700, color: stats.targetReached ? '#16a34a' : '#FF7700' }}>
            {Math.min(100, Math.round((stats.totalCompleted / targetWorkstations) * 100))}%
          </Typography>
        </Box>
        <Box
          sx={{
            height: 12,
            borderRadius: 6,
            bgcolor: theme => theme.palette.mode === 'dark'
              ? 'rgba(0,0,0,0.5)'
              : 'rgba(0,0,0,0.1)',
            overflow: 'hidden',
            boxShadow: theme => theme.palette.mode === 'dark'
              ? 'inset 3px 3px 6px rgba(0,0,0,0.6)'
              : 'inset 2px 2px 4px rgba(0,0,0,0.1)',
          }}
        >
          <Box
            sx={{
              height: '100%',
              width: `${Math.min(100, (stats.totalCompleted / targetWorkstations) * 100)}%`,
              borderRadius: 6,
              bgcolor: stats.targetReached ? '#16a34a' : '#FF7700',
              transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
              position: 'relative',
              overflow: 'hidden',
              '&::after': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                animation: 'shimmer 2s infinite',
                '@keyframes shimmer': {
                  '0%': { transform: 'translateX(-100%)' },
                  '100%': { transform: 'translateX(100%)' },
                },
              },
            }}
          />
        </Box>
      </Box>

      {/* Postponed details for reporting */}
      {stats.postponedCount > 0 && (
        <>
          <Divider sx={{ my: 2 }} />
          <Box>
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 700,
                color: '#EF4444',
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                mb: 2,
              }}
            >
              <WarningAmberIcon sx={{ fontSize: 18 }} />
              Uitgestelde werkplekken
            </Typography>
            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 1,
              }}
            >
              {stats.postponedItems.slice(0, 6).map((item, index) => (
                <Tooltip
                  key={index}
                  title={`Van ${new Date(item.originalDate).toLocaleDateString('nl-BE')} naar ${new Date(item.newDate).toLocaleDateString('nl-BE')}${item.reason ? ` - ${item.reason}` : ''}`}
                >
                  <Chip
                    size="small"
                    label={item.userName}
                    sx={{
                      bgcolor: 'rgba(239, 68, 68, 0.1)',
                      color: '#EF4444',
                      fontWeight: 500,
                      '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.2)' },
                    }}
                  />
                </Tooltip>
              ))}
              {stats.postponedItems.length > 6 && (
                <Chip
                  size="small"
                  label={`+${stats.postponedItems.length - 6} meer`}
                  sx={{
                    bgcolor: 'rgba(239, 68, 68, 0.1)',
                    color: '#EF4444',
                    fontWeight: 700,
                  }}
                />
              )}
            </Box>
          </Box>
        </>
      )}
    </Paper>
  );
});

export default PlanningStatistics;

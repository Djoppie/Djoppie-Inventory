import React, { useMemo } from 'react';
import { Box, Typography, useTheme, alpha, Chip } from '@mui/material';
import SettingsApplicationsIcon from '@mui/icons-material/SettingsApplications';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import EditCalendarIcon from '@mui/icons-material/EditCalendar';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import { ASSET_COLOR } from '../../../constants/filterColors';
import { ROUTES } from '../../../constants/routes';
import DashboardSection from './DashboardSection';
import SectionKPICard from './SectionKPICard';

interface RolloutSession {
  id: number;
  sessionName: string;
  status: string;
  days?: Array<{
    id: number;
    date: string;
    workplaces?: Array<{ status: string }>;
  }>;
}

interface OperationsSectionProps {
  rolloutSessions: RolloutSession[];
  delay?: number;
}

const OperationsSection: React.FC<OperationsSectionProps> = ({
  rolloutSessions,
  delay = 0,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const kpis = useMemo(() => {
    const activeRollouts = rolloutSessions.filter(s => s.status === 'InProgress').length;
    const planning = rolloutSessions.filter(s => s.status === 'Planning').length;
    const completed = rolloutSessions.filter(s => s.status === 'Completed').length;

    // Count pending workplaces across all active sessions
    let pendingWorkplaces = 0;
    rolloutSessions
      .filter(s => s.status === 'InProgress')
      .forEach(s => {
        s.days?.forEach(d => {
          pendingWorkplaces += d.workplaces?.filter(w => w.status === 'Pending' || w.status === 'InProgress').length ?? 0;
        });
      });

    return { activeRollouts, planning, completed, pendingWorkplaces };
  }, [rolloutSessions]);

  // Get upcoming rollouts
  const upcomingRollouts = useMemo(() => {
    return rolloutSessions
      .filter(s => s.status === 'InProgress' || s.status === 'Planning')
      .slice(0, 3);
  }, [rolloutSessions]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'InProgress': return '#FF9800';
      case 'Planning': return '#2196F3';
      case 'Completed': return '#4CAF50';
      default: return '#9E9E9E';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'InProgress': return 'Actief';
      case 'Planning': return 'Planning';
      case 'Completed': return 'Voltooid';
      default: return status;
    }
  };

  return (
    <DashboardSection
      title="Operations"
      icon={<SettingsApplicationsIcon />}
      accentColor={ASSET_COLOR}
      route={ROUTES.ROLLOUTS}
      delay={delay}
    >
      {/* KPI Cards Grid */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 1.5,
          mb: 2,
        }}
      >
        <SectionKPICard
          label="Actieve Rollouts"
          value={kpis.activeRollouts}
          color={ASSET_COLOR}
          icon={<RocketLaunchIcon />}
          pulse={kpis.activeRollouts > 0}
        />
        <SectionKPICard
          label="In Planning"
          value={kpis.planning}
          color="#2196F3"
          icon={<EditCalendarIcon />}
        />
        <SectionKPICard
          label="Voltooid"
          value={kpis.completed}
          color="#4CAF50"
          icon={<CheckCircleIcon />}
        />
        <SectionKPICard
          label="Werkplekken Pending"
          value={kpis.pendingWorkplaces}
          color="#FF9800"
          icon={<PendingActionsIcon />}
        />
      </Box>

      {/* Mini Upcoming Rollouts */}
      <Box
        sx={{
          p: 1.5,
          borderRadius: 2,
          bgcolor: isDark ? alpha('#1a1f2e', 0.4) : alpha('#f8f8f8', 0.8),
        }}
      >
        <Typography
          variant="caption"
          sx={{
            fontWeight: 600,
            color: isDark ? alpha('#fff', 0.5) : alpha('#000', 0.5),
            fontSize: '0.65rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            mb: 1,
            display: 'block',
          }}
        >
          Lopende Rollouts
        </Typography>
        {upcomingRollouts.length === 0 ? (
          <Typography variant="caption" sx={{ color: isDark ? alpha('#fff', 0.4) : alpha('#000', 0.4), fontStyle: 'italic' }}>
            Geen actieve rollouts
          </Typography>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
            {upcomingRollouts.map((rollout) => (
              <Box
                key={rollout.id}
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    fontSize: '0.65rem',
                    color: isDark ? alpha('#fff', 0.8) : alpha('#000', 0.8),
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    maxWidth: '60%',
                  }}
                >
                  {rollout.sessionName}
                </Typography>
                <Chip
                  label={getStatusLabel(rollout.status)}
                  size="small"
                  sx={{
                    height: 18,
                    fontSize: '0.55rem',
                    fontWeight: 600,
                    bgcolor: alpha(getStatusColor(rollout.status), 0.15),
                    color: getStatusColor(rollout.status),
                    '& .MuiChip-label': { px: 0.75 },
                  }}
                />
              </Box>
            ))}
          </Box>
        )}
      </Box>
    </DashboardSection>
  );
};

export default OperationsSection;

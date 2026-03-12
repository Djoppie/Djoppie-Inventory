import { Box, Paper, Typography, Grid, Chip } from '@mui/material';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import PeopleIcon from '@mui/icons-material/People';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import type { RolloutDay } from '../../types/rollout';

interface PlanningOverviewProps {
  days: RolloutDay[];
}

/**
 * Overview panel showing key metrics for all planning days
 */
const PlanningOverview = ({ days }: PlanningOverviewProps) => {
  const totalDays = days.length;
  const totalWorkplaces = days.reduce((sum, d) => sum + d.totalWorkplaces, 0);
  const completedWorkplaces = days.reduce((sum, d) => sum + d.completedWorkplaces, 0);
  const completionPercentage = totalWorkplaces > 0
    ? Math.round((completedWorkplaces / totalWorkplaces) * 100)
    : 0;

  const readyDays = days.filter(d => d.status === 'Ready').length;
  const completedDays = days.filter(d => d.status === 'Completed').length;

  const stats = [
    {
      label: 'Totaal Planningen',
      value: totalDays,
      icon: CalendarTodayIcon,
      color: '#FF7700',
      bgcolor: 'rgba(255, 119, 0, 0.12)',
    },
    {
      label: 'Werkplekken',
      value: `${completedWorkplaces}/${totalWorkplaces}`,
      icon: PeopleIcon,
      color: '#3B82F6',
      bgcolor: 'rgba(59, 130, 246, 0.12)',
    },
    {
      label: 'Gereed voor Uitvoering',
      value: readyDays,
      icon: CheckCircleIcon,
      color: '#22c55e',
      bgcolor: 'rgba(34, 197, 94, 0.12)',
    },
    {
      label: 'Voortgang',
      value: `${completionPercentage}%`,
      icon: TrendingUpIcon,
      color: completionPercentage === 100 ? '#16a34a' : '#FF7700',
      bgcolor: completionPercentage === 100 ? 'rgba(22, 163, 74, 0.12)' : 'rgba(255, 119, 0, 0.12)',
    },
  ];

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        mb: 3,
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        background: 'linear-gradient(135deg, rgba(255, 119, 0, 0.02) 0%, transparent 100%)',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary' }}>
          Planning Overzicht
        </Typography>
        {completedDays > 0 && (
          <Chip
            label={`${completedDays} voltooid`}
            size="small"
            sx={{
              bgcolor: 'rgba(22, 163, 74, 0.12)',
              color: '#16a34a',
              fontWeight: 600,
            }}
          />
        )}
      </Box>

      <Grid container spacing={2}>
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Grid size={{ xs: 12, sm: 6, md: 3 }} key={stat.label}>
              <Box
                sx={{
                  p: 2,
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  bgcolor: stat.bgcolor,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                    borderColor: stat.color,
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
                    boxShadow: `0 2px 8px ${stat.color}30`,
                  }}
                >
                  <Icon sx={{ fontSize: 24, color: stat.color }} />
                </Box>
                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: 700,
                      color: stat.color,
                      lineHeight: 1.2,
                    }}
                  >
                    {stat.value}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      color: 'text.secondary',
                      fontSize: '0.75rem',
                      fontWeight: 500,
                    }}
                  >
                    {stat.label}
                  </Typography>
                </Box>
              </Box>
            </Grid>
          );
        })}
      </Grid>

      {/* Progress Bar */}
      {totalWorkplaces > 0 && (
        <Box sx={{ mt: 2.5 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
              Algehele voortgang
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: completionPercentage === 100 ? '#16a34a' : '#FF7700',
                fontWeight: 700,
              }}
            >
              {completedWorkplaces} van {totalWorkplaces} werkplekken
            </Typography>
          </Box>
          <Box
            sx={{
              width: '100%',
              height: 8,
              bgcolor: 'rgba(0, 0, 0, 0.08)',
              borderRadius: 4,
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            <Box
              sx={{
                width: `${completionPercentage}%`,
                height: '100%',
                bgcolor: completionPercentage === 100 ? '#16a34a' : '#FF7700',
                transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                borderRadius: 4,
                position: 'relative',
                '&::after': completionPercentage > 0 ? {
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
                  '0%': {
                    transform: 'translateX(-100%)',
                  },
                  '100%': {
                    transform: 'translateX(100%)',
                  },
                },
              }}
            />
          </Box>
        </Box>
      )}
    </Paper>
  );
};

export default PlanningOverview;

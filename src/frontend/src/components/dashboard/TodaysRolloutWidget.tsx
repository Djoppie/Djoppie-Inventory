import {
  Box,
  Typography,
  Paper,
  alpha,
  useTheme,
  Skeleton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Chip,
  LinearProgress,
  Theme,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import EventIcon from '@mui/icons-material/Event';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { getTodaysRolloutDays } from '../../api/rollout.api';
import type { RolloutDayWithSession } from '../../types/rollout';

/**
 * Get color for day status
 */
const getStatusColor = (status: string, theme: Theme) => {
  switch (status) {
    case 'Completed':
      return theme.palette.success.main;
    case 'Ready':
      return theme.palette.info.main;
    case 'Planning':
    default:
      return theme.palette.warning.main;
  }
};

/**
 * Widget showing today's rollout planning
 * Displays rollout days scheduled for today across all active sessions
 */
const TodaysRolloutWidget = () => {
  const theme = useTheme();
  const navigate = useNavigate();

  const { data: days, isLoading, error } = useQuery({
    queryKey: ['rollout', 'today'],
    queryFn: () => getTodaysRolloutDays(false),
    staleTime: 30000,
  });

  const handleDayClick = (dayId: number, sessionId: number) => {
    navigate(`/operations/rollouts/${sessionId}/days/${dayId}`);
  };

  // Loading state
  if (isLoading) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
          height: '100%',
        }}
      >
        <Skeleton variant="text" width="60%" height={32} />
        <Box sx={{ mt: 2 }}>
          {[1, 2, 3].map((i) => (
            <Box key={i} sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <Skeleton variant="circular" width={32} height={32} />
              <Box sx={{ flex: 1 }}>
                <Skeleton variant="text" width="70%" />
                <Skeleton variant="text" width="40%" />
              </Box>
            </Box>
          ))}
        </Box>
      </Paper>
    );
  }

  // Error state
  if (error) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'error.main',
          bgcolor: alpha(theme.palette.error.main, 0.05),
        }}
      >
        <Typography color="error">
          Fout bij laden planning
        </Typography>
      </Paper>
    );
  }

  // Empty state
  if (!days || days.length === 0) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
          overflow: 'hidden',
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            background: `linear-gradient(90deg, ${theme.palette.grey[400]}, ${theme.palette.grey[500]})`,
          },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 40,
              height: 40,
              borderRadius: 2,
              background: alpha(theme.palette.grey[500], 0.1),
              color: theme.palette.grey[500],
            }}
          >
            <EventIcon />
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Planning vandaag
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
          Geen uitrol gepland voor vandaag
        </Typography>
      </Paper>
    );
  }

  // Calculate totals
  const totalWorkplaces = days.reduce((sum, d) => sum + d.totalWorkplaces, 0);
  const completedWorkplaces = days.reduce((sum, d) => sum + d.completedWorkplaces, 0);
  const progressPercentage = totalWorkplaces > 0 ? Math.round((completedWorkplaces / totalWorkplaces) * 100) : 0;

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
        overflow: 'hidden',
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 4,
          background: `linear-gradient(90deg, ${theme.palette.warning.main}, ${theme.palette.success.main})`,
        },
      }}
    >
      <Box sx={{ p: 3, pb: 2 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 40,
              height: 40,
              borderRadius: 2,
              background: alpha(theme.palette.warning.main, 0.1),
              color: theme.palette.warning.main,
            }}
          >
            <RocketLaunchIcon />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Planning vandaag
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {days.length} {days.length === 1 ? 'dag' : 'dagen'} gepland
            </Typography>
          </Box>
          <Chip
            label={`${completedWorkplaces}/${totalWorkplaces}`}
            size="small"
            icon={<CheckCircleIcon sx={{ fontSize: 14 }} />}
            sx={{
              ml: 'auto',
              fontWeight: 600,
              backgroundColor: alpha(theme.palette.success.main, 0.15),
              color: theme.palette.success.main,
              '& .MuiChip-icon': {
                color: theme.palette.success.main,
              },
            }}
          />
        </Box>

        {/* Overall progress */}
        <Box sx={{ mt: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="caption" color="text.secondary">
              Voortgang
            </Typography>
            <Typography variant="caption" fontWeight={600}>
              {progressPercentage}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={progressPercentage}
            sx={{
              height: 8,
              borderRadius: 1,
              bgcolor: alpha(theme.palette.success.main, 0.15),
              '& .MuiLinearProgress-bar': {
                borderRadius: 1,
                bgcolor: theme.palette.success.main,
              },
            }}
          />
        </Box>
      </Box>

      <Divider />

      {/* Days list */}
      <List sx={{ p: 0 }}>
        {days.map((day: RolloutDayWithSession, index: number) => {
          const statusColor = getStatusColor(day.status, theme);
          const dayProgress = day.totalWorkplaces > 0
            ? Math.round((day.completedWorkplaces / day.totalWorkplaces) * 100)
            : 0;

          return (
            <Box key={day.id}>
              <ListItem disablePadding>
                <ListItemButton
                  onClick={() => handleDayClick(day.id, day.rolloutSessionId)}
                  sx={{
                    py: 1.5,
                    px: 3,
                    '&:hover': {
                      bgcolor: alpha(statusColor, 0.05),
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 32,
                        height: 32,
                        borderRadius: 1.5,
                        bgcolor: alpha(statusColor, 0.1),
                        color: statusColor,
                      }}
                    >
                      <RocketLaunchIcon sx={{ fontSize: 18 }} />
                    </Box>
                  </ListItemIcon>
                  <ListItemText
                    primaryTypographyProps={{ component: 'div' }}
                    secondaryTypographyProps={{ component: 'div' }}
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" fontWeight={600}>
                          {day.sessionName}
                        </Typography>
                        <Chip
                          label={day.status}
                          size="small"
                          sx={{
                            height: 20,
                            fontSize: '0.65rem',
                            fontWeight: 600,
                            bgcolor: alpha(statusColor, 0.15),
                            color: statusColor,
                          }}
                        />
                      </Box>
                    }
                    secondary={
                      <Box sx={{ mt: 0.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <Typography variant="caption" color="text.secondary">
                            {day.name || `Dag ${day.dayNumber}`}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                            {day.completedWorkplaces}/{day.totalWorkplaces} werkplekken
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={dayProgress}
                          sx={{
                            height: 4,
                            borderRadius: 0.5,
                            bgcolor: alpha(statusColor, 0.15),
                            '& .MuiLinearProgress-bar': {
                              borderRadius: 0.5,
                              bgcolor: statusColor,
                            },
                          }}
                        />
                      </Box>
                    }
                  />
                </ListItemButton>
              </ListItem>
              {index < days.length - 1 && <Divider />}
            </Box>
          );
        })}
      </List>

      {/* View all link */}
      <Divider />
      <Box
        sx={{
          p: 2,
          textAlign: 'center',
          cursor: 'pointer',
          '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.05) },
        }}
        onClick={() => navigate('/operations/rollouts')}
      >
        <Typography
          variant="caption"
          sx={{ color: 'primary.main', fontWeight: 600 }}
        >
          Bekijk alle rollouts
        </Typography>
      </Box>
    </Paper>
  );
};

export default TodaysRolloutWidget;

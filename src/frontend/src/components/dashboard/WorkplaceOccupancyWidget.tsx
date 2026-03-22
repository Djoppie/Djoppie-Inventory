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
import { useNavigate } from 'react-router-dom';
import BusinessIcon from '@mui/icons-material/Business';
import PersonIcon from '@mui/icons-material/Person';
import EventSeatIcon from '@mui/icons-material/EventSeat';
import { useWorkplaceStatistics } from '../../hooks/usePhysicalWorkplaces';

/**
 * Widget showing overall workplace occupancy statistics
 * Displays total, occupied, and vacant workplace counts with occupancy rate
 */
const WorkplaceOccupancyWidget = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { data: stats, isLoading, error } = useWorkplaceStatistics();

  const handleClick = () => {
    navigate('/workplaces');
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
          <Skeleton variant="rectangular" height={80} sx={{ borderRadius: 2 }} />
        </Box>
        <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
          <Skeleton variant="rectangular" width="33%" height={60} sx={{ borderRadius: 2 }} />
          <Skeleton variant="rectangular" width="33%" height={60} sx={{ borderRadius: 2 }} />
          <Skeleton variant="rectangular" width="33%" height={60} sx={{ borderRadius: 2 }} />
        </Box>
      </Paper>
    );
  }

  // Error state
  if (error || !stats) {
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
          Fout bij laden werkplekstatistieken
        </Typography>
      </Paper>
    );
  }

  const occupancyColor = stats.occupancyRate >= 80
    ? theme.palette.success.main
    : stats.occupancyRate >= 50
      ? theme.palette.warning.main
      : theme.palette.info.main;

  return (
    <Paper
      elevation={0}
      onClick={handleClick}
      sx={{
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
        overflow: 'hidden',
        position: 'relative',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        '&:hover': {
          borderColor: 'primary.main',
          transform: 'translateY(-2px)',
          boxShadow: theme.shadows[4],
        },
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 4,
          background: `linear-gradient(90deg, ${theme.palette.info.main}, ${occupancyColor})`,
        },
      }}
    >
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 40,
              height: 40,
              borderRadius: 2,
              background: alpha(theme.palette.info.main, 0.1),
              color: theme.palette.info.main,
            }}
          >
            <BusinessIcon />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Werkplekken
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Bezetting overzicht
            </Typography>
          </Box>
          <Chip
            label={`${stats.occupancyRate}%`}
            size="small"
            sx={{
              ml: 'auto',
              fontWeight: 700,
              backgroundColor: alpha(occupancyColor, 0.15),
              color: occupancyColor,
              fontSize: '0.85rem',
            }}
          />
        </Box>

        {/* Progress bar */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Bezettingsgraad
            </Typography>
            <Typography variant="body2" fontWeight={600}>
              {stats.occupiedWorkplaces} / {stats.activeWorkplaces}
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={stats.occupancyRate}
            sx={{
              height: 10,
              borderRadius: 5,
              bgcolor: alpha(occupancyColor, 0.15),
              '& .MuiLinearProgress-bar': {
                borderRadius: 5,
                bgcolor: occupancyColor,
              },
            }}
          />
        </Box>

        {/* Stats grid */}
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Box
            sx={{
              flex: 1,
              p: 2,
              borderRadius: 2,
              bgcolor: alpha(theme.palette.info.main, 0.08),
              textAlign: 'center',
            }}
          >
            <EventSeatIcon sx={{ color: theme.palette.info.main, mb: 0.5 }} />
            <Typography variant="h5" fontWeight={700} color="info.main">
              {stats.activeWorkplaces}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Totaal actief
            </Typography>
          </Box>

          <Box
            sx={{
              flex: 1,
              p: 2,
              borderRadius: 2,
              bgcolor: alpha(theme.palette.success.main, 0.08),
              textAlign: 'center',
            }}
          >
            <PersonIcon sx={{ color: theme.palette.success.main, mb: 0.5 }} />
            <Typography variant="h5" fontWeight={700} color="success.main">
              {stats.occupiedWorkplaces}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Bezet
            </Typography>
          </Box>

          <Box
            sx={{
              flex: 1,
              p: 2,
              borderRadius: 2,
              bgcolor: alpha(theme.palette.warning.main, 0.08),
              textAlign: 'center',
            }}
          >
            <EventSeatIcon sx={{ color: theme.palette.warning.main, mb: 0.5 }} />
            <Typography variant="h5" fontWeight={700} color="warning.main">
              {stats.vacantWorkplaces}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Vrij
            </Typography>
          </Box>
        </Box>
      </Box>
    </Paper>
  );
};

export default WorkplaceOccupancyWidget;

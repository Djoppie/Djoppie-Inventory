import {
  Box,
  Typography,
  Paper,
  alpha,
  useTheme,
  Skeleton,
  LinearProgress,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import DevicesIcon from '@mui/icons-material/Devices';
import DockIcon from '@mui/icons-material/Dock';
import MonitorIcon from '@mui/icons-material/Monitor';
import KeyboardIcon from '@mui/icons-material/Keyboard';
import MouseIcon from '@mui/icons-material/Mouse';
import { useWorkplaceEquipmentStatistics } from '../../hooks/usePhysicalWorkplaces';
import type { EquipmentTypeStatus } from '../../types/physicalWorkplace.types';

/**
 * Get icon component for equipment type
 */
const getEquipmentIcon = (type: string) => {
  switch (type.toLowerCase()) {
    case 'docking':
      return DockIcon;
    case 'monitor':
      return MonitorIcon;
    case 'keyboard':
      return KeyboardIcon;
    case 'mouse':
      return MouseIcon;
    default:
      return DevicesIcon;
  }
};

/**
 * Widget showing equipment fill rates by type
 * Displays docking stations, monitors, keyboards, and mice assignment status
 */
const EquipmentStatusWidget = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { data: equipmentStats, isLoading, error } = useWorkplaceEquipmentStatistics();

  const handleClick = () => {
    navigate('/physical-workplaces');
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
          {[1, 2, 3, 4].map((i) => (
            <Box key={i} sx={{ mb: 2 }}>
              <Skeleton variant="text" width="40%" />
              <Skeleton variant="rectangular" height={8} sx={{ borderRadius: 1, mt: 1 }} />
            </Box>
          ))}
        </Box>
      </Paper>
    );
  }

  // Error state
  if (error || !equipmentStats) {
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
          Fout bij laden apparatuurstatistieken
        </Typography>
      </Paper>
    );
  }

  // Calculate overall fill rate
  const totalSlots = equipmentStats.reduce((sum, e) => sum + e.totalSlots, 0);
  const filledSlots = equipmentStats.reduce((sum, e) => sum + e.filledSlots, 0);
  const overallRate = totalSlots > 0 ? Math.round((filledSlots / totalSlots) * 100) : 0;

  const getProgressColor = (rate: number) => {
    if (rate >= 80) return theme.palette.success.main;
    if (rate >= 50) return theme.palette.warning.main;
    return theme.palette.error.main;
  };

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
          background: `linear-gradient(90deg, ${theme.palette.secondary.main}, ${getProgressColor(overallRate)})`,
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
              background: alpha(theme.palette.secondary.main, 0.1),
              color: theme.palette.secondary.main,
            }}
          >
            <DevicesIcon />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Apparatuur
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Toewijzingsstatus per type
            </Typography>
          </Box>
          <Typography
            variant="body2"
            sx={{
              ml: 'auto',
              fontWeight: 700,
              color: getProgressColor(overallRate),
            }}
          >
            {overallRate}% toegewezen
          </Typography>
        </Box>

        {/* Equipment list */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {equipmentStats.map((equipment: EquipmentTypeStatus) => {
            const Icon = getEquipmentIcon(equipment.equipmentType);
            const progressColor = getProgressColor(equipment.fillRate);

            return (
              <Box key={equipment.equipmentType}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <Icon sx={{ fontSize: 18, color: 'text.secondary' }} />
                  <Typography variant="body2" fontWeight={500}>
                    {equipment.displayName}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ ml: 'auto', color: progressColor, fontWeight: 600 }}
                  >
                    {equipment.filledSlots} / {equipment.totalSlots}
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={equipment.fillRate}
                  sx={{
                    height: 6,
                    borderRadius: 3,
                    bgcolor: alpha(progressColor, 0.15),
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 3,
                      bgcolor: progressColor,
                    },
                  }}
                />
              </Box>
            );
          })}
        </Box>

        {/* Summary footer */}
        <Box
          sx={{
            mt: 3,
            pt: 2,
            borderTop: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            justifyContent: 'space-between',
          }}
        >
          <Typography variant="body2" color="text.secondary">
            Totaal slots
          </Typography>
          <Typography variant="body2" fontWeight={600}>
            {filledSlots} / {totalSlots} toegewezen
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
};

export default EquipmentStatusWidget;

import { Box, Typography, alpha, useTheme, Fade, LinearProgress, Chip } from '@mui/material';
import DevicesIcon from '@mui/icons-material/Devices';
import UsbIcon from '@mui/icons-material/Usb';
import MonitorIcon from '@mui/icons-material/Monitor';
import KeyboardIcon from '@mui/icons-material/Keyboard';
import MouseIcon from '@mui/icons-material/Mouse';
import { getNeumorphColors, getNeumorph, getNeumorphInset } from '../../utils/neumorphicStyles';
import type { EquipmentTypeStatus } from '../../types/physicalWorkplace.types';

interface EquipmentFillRatesProps {
  equipment: EquipmentTypeStatus[];
}

const getBarColor = (fillRate: number) => {
  if (fillRate >= 80) return '#10B981';
  if (fillRate >= 50) return '#FF7700';
  return '#EF4444';
};

const getEquipmentIcon = (equipmentType: string) => {
  switch (equipmentType.toLowerCase()) {
    case 'docking':
      return <UsbIcon sx={{ fontSize: 20 }} />;
    case 'monitor':
      return <MonitorIcon sx={{ fontSize: 20 }} />;
    case 'keyboard':
      return <KeyboardIcon sx={{ fontSize: 20 }} />;
    case 'mouse':
      return <MouseIcon sx={{ fontSize: 20 }} />;
    default:
      return <DevicesIcon sx={{ fontSize: 20 }} />;
  }
};

const EquipmentFillRates = ({ equipment }: EquipmentFillRatesProps) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { bgSurface } = getNeumorphColors(isDark);

  // Calculate overall fill rate
  const totalSlots = equipment.reduce((sum, e) => sum + e.totalSlots, 0);
  const totalFilled = equipment.reduce((sum, e) => sum + e.filledSlots, 0);
  const overallRate = totalSlots > 0 ? Math.round((totalFilled / totalSlots) * 100) : 0;
  const overallColor = getBarColor(overallRate);

  return (
    <Box
      sx={{
        bgcolor: bgSurface,
        borderRadius: 3,
        boxShadow: getNeumorph(isDark),
        borderTop: '3px solid #7E57C2',
        p: 3,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: alpha('#7E57C2', 0.1),
          }}
        >
          <DevicesIcon sx={{ fontSize: 20, color: '#7E57C2' }} />
        </Box>
        <Typography variant="subtitle1" fontWeight={700} color="text.primary">
          Apparatuur Status
        </Typography>
      </Box>

      {/* Equipment rows */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, flex: 1 }}>
        {equipment.map((item, index) => {
          const color = getBarColor(item.fillRate);
          return (
            <Fade in timeout={600 + index * 200} key={item.equipmentType}>
              <Box>
                {/* Label row */}
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    mb: 0.75,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ color: alpha(color, 0.85), display: 'flex' }}>
                      {getEquipmentIcon(item.equipmentType)}
                    </Box>
                    <Typography
                      variant="body2"
                      fontWeight={600}
                      color="text.primary"
                    >
                      {item.displayName}
                    </Typography>
                  </Box>
                  <Typography
                    variant="body2"
                    fontWeight={700}
                    sx={{ color }}
                  >
                    {item.filledSlots} / {item.totalSlots}
                  </Typography>
                </Box>

                {/* Progress bar */}
                <LinearProgress
                  variant="determinate"
                  value={item.fillRate}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    bgcolor: alpha(isDark ? '#fff' : '#000', 0.06),
                    boxShadow: getNeumorphInset(isDark),
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 4,
                      bgcolor: color,
                      boxShadow: `0 0 8px ${alpha(color, 0.4)}`,
                      transition: 'transform 1s ease-out',
                    },
                  }}
                />
              </Box>
            </Fade>
          );
        })}
      </Box>

      {/* Footer */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mt: 3,
          pt: 2,
          borderTop: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Typography variant="body2" fontWeight={600} color="text.secondary">
          Totaal toewijzing
        </Typography>
        <Chip
          label={`${overallRate}%`}
          size="small"
          sx={{
            fontWeight: 700,
            bgcolor: alpha(overallColor, 0.1),
            color: overallColor,
            border: 'none',
          }}
        />
      </Box>
    </Box>
  );
};

export default EquipmentFillRates;

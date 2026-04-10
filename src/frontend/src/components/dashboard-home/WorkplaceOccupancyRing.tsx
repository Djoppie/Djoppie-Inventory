import { useState, useEffect } from 'react';
import { Box, Typography, alpha, useTheme } from '@mui/material';
import BusinessIcon from '@mui/icons-material/Business';
import { getNeumorphColors, getNeumorph } from '../../utils/neumorphicStyles';

interface WorkplaceOccupancyRingProps {
  occupancyRate: number;
  totalActive: number;
  occupied: number;
  vacant: number;
}

const RADIUS = 70;
const STROKE_WIDTH = 12;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const getOccupancyColor = (rate: number) => {
  if (rate >= 80) return '#10B981';
  if (rate >= 50) return '#FF7700';
  return '#EF4444';
};

const WorkplaceOccupancyRing = ({
  occupancyRate,
  totalActive,
  occupied,
  vacant,
}: WorkplaceOccupancyRingProps) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { bgSurface } = getNeumorphColors(isDark);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAnimate(true), 500);
    return () => clearTimeout(timer);
  }, []);

  const color = getOccupancyColor(occupancyRate);
  const offset = animate ? CIRCUMFERENCE * (1 - occupancyRate / 100) : CIRCUMFERENCE;

  const stats = [
    { label: 'Actief', value: totalActive, color: '#3B82F6' },
    { label: 'Bezet', value: occupied, color: '#10B981' },
    { label: 'Vrij', value: vacant, color: '#F59E0B' },
  ];

  return (
    <Box
      sx={{
        bgcolor: bgSurface,
        borderRadius: 3,
        boxShadow: getNeumorph(isDark),
        borderTop: '3px solid #009688',
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
            bgcolor: alpha('#009688', 0.1),
          }}
        >
          <BusinessIcon sx={{ fontSize: 20, color: '#009688' }} />
        </Box>
        <Typography variant="subtitle1" fontWeight={700} color="text.primary">
          Bezettingsgraad Werkplekken
        </Typography>
      </Box>

      {/* SVG Ring */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          flex: 1,
          minHeight: 200,
        }}
      >
        <svg
          width="180"
          height="180"
          viewBox="0 0 180 180"
          style={{ transform: 'rotate(-90deg)' }}
        >
          {/* Background circle */}
          <circle
            cx="90"
            cy="90"
            r={RADIUS}
            fill="none"
            stroke={alpha(isDark ? '#fff' : '#000', 0.08)}
            strokeWidth={STROKE_WIDTH}
          />
          {/* Progress arc */}
          <circle
            cx="90"
            cy="90"
            r={RADIUS}
            fill="none"
            stroke={color}
            strokeWidth={STROKE_WIDTH}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={offset}
            style={{
              transition: 'stroke-dashoffset 1.5s ease-out',
            }}
          />
        </svg>
        {/* Center text overlay */}
        <Box
          sx={{
            position: 'absolute',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Typography
            variant="h3"
            fontWeight={800}
            sx={{ color, lineHeight: 1 }}
          >
            {Math.round(occupancyRate)}%
          </Typography>
          <Typography
            variant="caption"
            sx={{ color: 'text.secondary', mt: 0.5, fontWeight: 500 }}
          >
            bezet
          </Typography>
        </Box>
      </Box>

      {/* Stat boxes */}
      <Box sx={{ display: 'flex', gap: 1.5, mt: 2 }}>
        {stats.map((stat) => (
          <Box
            key={stat.label}
            sx={{
              flex: 1,
              bgcolor: alpha(stat.color, 0.08),
              borderRadius: 2,
              p: 1.5,
              textAlign: 'center',
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 0.5,
                mb: 0.5,
              }}
            >
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  bgcolor: stat.color,
                }}
              />
              <Typography
                variant="caption"
                sx={{ color: 'text.secondary', fontWeight: 500 }}
              >
                {stat.label}
              </Typography>
            </Box>
            <Typography variant="h6" fontWeight={700} color="text.primary">
              {stat.value}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default WorkplaceOccupancyRing;

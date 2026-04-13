import React from 'react';
import { Box, Typography, Fade, useTheme, alpha } from '@mui/material';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarehouseIcon from '@mui/icons-material/Warehouse';
import WarningIcon from '@mui/icons-material/Warning';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import { getNeumorph } from '../../utils/neumorphicStyles';
import { useAnimatedCounter } from './useAnimatedCounter';

interface KPIHeroSectionProps {
  totalAssets: number;
  inGebruik: number;
  stock: number;
  aandacht: number;
  activeRollouts: number;
}

interface KPICardConfig {
  label: string;
  value: number;
  color: string;
  icon: React.ReactNode;
  subtitle?: string;
  pulse?: boolean;
}

const KPICard: React.FC<{ config: KPICardConfig; index: number; isDark: boolean }> = ({
  config,
  index,
  isDark,
}) => {
  const animatedValue = useAnimatedCounter(config.value);

  return (
    <Fade in timeout={400 + index * 150}>
      <Box
        sx={{
          p: 2.5,
          borderRadius: 3,
          bgcolor: isDark ? '#232936' : '#ffffff',
          boxShadow: getNeumorph(isDark, 'medium'),
          borderLeft: `4px solid ${config.color}`,
          transition: 'all 0.25s ease',
          cursor: 'default',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: isDark
              ? `8px 8px 20px rgba(0,0,0,0.6), -4px -4px 12px rgba(255,255,255,0.06), 0 4px 16px ${alpha(config.color, 0.2)}`
              : `8px 8px 20px rgba(0,0,0,0.14), -4px -4px 12px rgba(255,255,255,1), 0 4px 16px ${alpha(config.color, 0.15)}`,
          },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1.5 }}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: alpha(config.color, 0.15),
              color: config.color,
              flexShrink: 0,
              ...(config.pulse && config.value > 0
                ? {
                    animation: 'kpiPulse 2s ease-in-out infinite',
                    '@keyframes kpiPulse': {
                      '0%, 100%': { boxShadow: `0 0 0 0 ${alpha(config.color, 0.4)}` },
                      '50%': { boxShadow: `0 0 0 8px ${alpha(config.color, 0)}` },
                    },
                  }
                : {}),
            }}
          >
            {config.icon}
          </Box>
        </Box>

        <Typography
          variant="h4"
          sx={{
            fontFamily: 'monospace',
            fontVariantNumeric: 'tabular-nums',
            fontWeight: 800,
            fontSize: '2rem',
            lineHeight: 1.2,
            color: isDark ? '#fff' : '#1a1a2e',
          }}
        >
          {animatedValue.toLocaleString()}
        </Typography>

        <Typography
          variant="body2"
          sx={{
            fontFamily: 'Inter, sans-serif',
            fontWeight: 600,
            color: isDark ? alpha('#fff', 0.7) : alpha('#000', 0.6),
            mt: 0.5,
            fontSize: '0.8rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          {config.label}
        </Typography>

        {config.subtitle && (
          <Typography
            variant="caption"
            sx={{
              fontFamily: 'Inter, sans-serif',
              color: isDark ? alpha('#fff', 0.45) : alpha('#000', 0.4),
              mt: 0.25,
              display: 'block',
              fontSize: '0.72rem',
            }}
          >
            {config.subtitle}
          </Typography>
        )}
      </Box>
    </Fade>
  );
};

export const KPIHeroSection: React.FC<KPIHeroSectionProps> = ({
  totalAssets,
  inGebruik,
  stock,
  aandacht,
  activeRollouts,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const inGebruikPercentage = totalAssets > 0 ? Math.round((inGebruik / totalAssets) * 100) : 0;

  const cards: KPICardConfig[] = [
    {
      label: 'Totaal Assets',
      value: totalAssets,
      color: '#FF7700',
      icon: <Inventory2Icon fontSize="small" />,
    },
    {
      label: 'In Gebruik',
      value: inGebruik,
      color: '#4CAF50',
      icon: <CheckCircleIcon fontSize="small" />,
      subtitle: `${inGebruikPercentage}% van totaal`,
    },
    {
      label: 'Beschikbaar',
      value: stock,
      color: '#2196F3',
      icon: <WarehouseIcon fontSize="small" />,
    },
    {
      label: 'Aandacht Vereist',
      value: aandacht,
      color: '#f44336',
      icon: <WarningIcon fontSize="small" />,
      pulse: true,
    },
    {
      label: 'Actieve Rollouts',
      value: activeRollouts,
      color: '#FF7700',
      icon: <RocketLaunchIcon fontSize="small" />,
    },
  ];

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: 'repeat(2, 1fr)',
          sm: 'repeat(3, 1fr)',
          lg: 'repeat(5, 1fr)',
        },
        gap: 2,
      }}
    >
      {cards.map((card, index) => (
        <KPICard key={card.label} config={card} index={index} isDark={isDark} />
      ))}
    </Box>
  );
};

export default KPIHeroSection;

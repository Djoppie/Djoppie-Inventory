import { Box, Typography, alpha, useTheme } from '@mui/material';
import { cloneElement } from 'react';
import { STATUS_CARDS, DUMMY_STATUS_CONFIG, StatusCardConfig } from '../../constants/dashboard.constants';
import { StatusCounts } from '../../hooks/dashboard';
import { getFadeInUpAnimation } from '../../utils/designSystem';

interface StatusCardProps {
  config: StatusCardConfig;
  count: number;
  isSelected: boolean;
  isAnySelected: boolean;
  onClick: () => void;
  index: number;
}

const StatusCard = ({ config, count, isSelected, isAnySelected, onClick, index }: StatusCardProps) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Box
      onClick={onClick}
      sx={{
        px: 2,
        py: 2,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        borderRadius: 2.5,
        border: '1px solid',
        borderColor: isSelected ? config.color : 'divider',
        background: isDark ? config.gradientDark : config.gradientLight,
        transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: isSelected
          ? `0 4px 20px ${config.shadowColor}, inset 0 1px 0 rgba(255,255,255,0.1)`
          : '0 2px 8px rgba(0,0,0,0.08)',
        transform: isSelected ? 'translateY(-4px)' : 'none',
        ...getFadeInUpAnimation(index * 0.08),
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: isSelected
            ? `linear-gradient(90deg, ${config.color}, ${alpha(config.color, 0.6)})`
            : 'transparent',
          transition: 'background 0.2s ease',
        },
        opacity: !isAnySelected || isSelected ? 1 : 0.6,
        '&:hover': {
          borderColor: config.color,
          boxShadow: `0 8px 32px ${config.shadowColor}, inset 0 1px 0 rgba(255,255,255,0.15)`,
          transform: 'translateY(-6px) scale(1.02)',
          opacity: 1,
          '&::before': {
            background: `linear-gradient(90deg, ${config.color}, ${alpha(config.color, 0.6)})`,
          },
          '& .status-card-icon': {
            transform: 'rotate(-10deg) scale(1.15)',
            boxShadow: `0 0 24px ${config.shadowColor}`,
          },
        },
      }}
    >
      {/* Icon Container */}
      <Box
        className="status-card-icon"
        sx={{
          width: 48,
          height: 48,
          borderRadius: 2,
          bgcolor: alpha(config.color, isDark ? 0.2 : 0.15),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          boxShadow: `inset 0 2px 8px ${alpha(config.color, 0.3)}`,
          transition: 'all 0.3s ease',
          position: 'relative',
          '&::after': {
            content: '""',
            position: 'absolute',
            inset: -2,
            borderRadius: 2,
            background: `conic-gradient(from 0deg, ${config.color}, transparent, ${config.color})`,
            opacity: isSelected ? 0.3 : 0,
            transition: 'opacity 0.3s ease',
            animation: isSelected ? 'spin 3s linear infinite' : 'none',
          },
          '@keyframes spin': {
            '0%': { transform: 'rotate(0deg)' },
            '100%': { transform: 'rotate(360deg)' },
          },
        }}
      >
        {cloneElement(config.icon, {
          sx: {
            fontSize: 28,
            color: config.color,
            filter: isSelected ? `drop-shadow(0 0 8px ${config.shadowColor})` : 'none',
            transition: 'filter 0.3s ease',
          },
        })}
      </Box>

      {/* Text Content */}
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography
          variant="h5"
          fontWeight={800}
          lineHeight={1.1}
          sx={{
            color: isSelected ? config.color : 'text.primary',
            textShadow: isSelected ? `0 0 20px ${config.shadowColor}` : 'none',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {count}
        </Typography>
        <Typography
          variant="caption"
          sx={{
            color: isSelected ? config.color : 'text.secondary',
            fontWeight: 600,
            lineHeight: 1.2,
            whiteSpace: 'nowrap',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            fontSize: '0.65rem',
          }}
        >
          {config.label}
        </Typography>
      </Box>
    </Box>
  );
};

interface StatusCardGridProps {
  statusCounts: StatusCounts;
  statusFilter: string;
  onStatusClick: (status: string) => void;
}

export default function StatusCardGrid({ statusCounts, statusFilter, onStatusClick }: StatusCardGridProps) {
  const isAnySelected = statusFilter !== '';
  const showDummy = statusCounts.dummy > 0;

  // Map status keys to counts
  const getCountForStatus = (key: string): number => {
    switch (key) {
      case 'Nieuw': return statusCounts.nieuw;
      case 'InGebruik': return statusCounts.inGebruik;
      case 'Stock': return statusCounts.stock;
      case 'Herstelling': return statusCounts.herstelling;
      case 'Defect': return statusCounts.defect;
      case 'UitDienst': return statusCounts.uitDienst;
      case 'Dummy': return statusCounts.dummy;
      default: return 0;
    }
  };

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: 'repeat(2, 1fr)',
          sm: 'repeat(3, 1fr)',
          md: `repeat(${STATUS_CARDS.length + (showDummy ? 1 : 0)}, 1fr)`,
        },
        gap: 2,
        p: 2.5,
      }}
    >
      {STATUS_CARDS.map((card, index) => (
        <StatusCard
          key={card.key}
          config={card}
          count={getCountForStatus(card.key)}
          isSelected={statusFilter === card.key}
          isAnySelected={isAnySelected}
          onClick={() => onStatusClick(card.key)}
          index={index}
        />
      ))}
      {showDummy && (
        <StatusCard
          config={DUMMY_STATUS_CONFIG}
          count={statusCounts.dummy}
          isSelected={statusFilter === 'Dummy'}
          isAnySelected={isAnySelected}
          onClick={() => onStatusClick('Dummy')}
          index={STATUS_CARDS.length}
        />
      )}
    </Box>
  );
}

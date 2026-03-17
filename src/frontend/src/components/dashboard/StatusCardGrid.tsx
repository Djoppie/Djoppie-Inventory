import { Box, Typography, alpha } from '@mui/material';
import { STATUS_CARDS, DUMMY_STATUS_CONFIG, StatusCardConfig } from '../../constants/dashboard.constants';
import { StatusCounts } from '../../hooks/dashboard';

interface StatusCardProps {
  config: StatusCardConfig;
  count: number;
  isSelected: boolean;
  isAnySelected: boolean;
  onClick: () => void;
}

const StatusCard = ({ config, count, isSelected, isAnySelected, onClick }: StatusCardProps) => (
  <Box
    onClick={onClick}
    sx={{
      px: 2,
      py: 2,
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: 1.5,
      borderRadius: 2,
      border: '1px solid',
      borderColor: isSelected ? config.color : 'divider',
      background: (theme) =>
        theme.palette.mode === 'dark' ? config.gradientDark : config.gradientLight,
      transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
      position: 'relative',
      overflow: 'hidden',
      boxShadow: isSelected
        ? `0 4px 20px ${config.shadowColor}, inset 0 1px 0 rgba(255,255,255,0.1)`
        : '0 2px 8px rgba(0,0,0,0.08)',
      transform: isSelected ? 'translateY(-2px)' : 'none',
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
        boxShadow: `0 6px 24px ${config.shadowColor}, inset 0 1px 0 rgba(255,255,255,0.15)`,
        transform: 'translateY(-2px)',
        opacity: 1,
        '&::before': {
          background: `linear-gradient(90deg, ${config.color}, ${alpha(config.color, 0.6)})`,
        },
      },
    }}
  >
    {/* Color indicator bar */}
    <Box
      sx={{
        width: 4,
        height: 36,
        borderRadius: 1,
        bgcolor: config.color,
        flexShrink: 0,
        boxShadow: `0 0 12px ${config.shadowColor}`,
      }}
    />
    <Box sx={{ minWidth: 0, flex: 1 }}>
      <Typography
        variant="h5"
        fontWeight={800}
        lineHeight={1.1}
        sx={{
          color: isSelected ? config.color : 'text.primary',
          textShadow: isSelected ? `0 0 20px ${config.shadowColor}` : 'none',
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
        gap: 1.5,
        p: 2,
      }}
    >
      {STATUS_CARDS.map((card) => (
        <StatusCard
          key={card.key}
          config={card}
          count={getCountForStatus(card.key)}
          isSelected={statusFilter === card.key}
          isAnySelected={isAnySelected}
          onClick={() => onStatusClick(card.key)}
        />
      ))}
      {showDummy && (
        <StatusCard
          config={DUMMY_STATUS_CONFIG}
          count={statusCounts.dummy}
          isSelected={statusFilter === 'Dummy'}
          isAnySelected={isAnySelected}
          onClick={() => onStatusClick('Dummy')}
        />
      )}
    </Box>
  );
}

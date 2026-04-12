import React from 'react';
import { Box, ToggleButtonGroup, ToggleButton, Badge } from '@mui/material';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ListIcon from '@mui/icons-material/List';
import { ASSET_COLOR } from '../../../constants/filterColors';

export type PlanningStatusFilterValue = 'all' | 'Planning' | 'Ready' | 'Completed';

interface StatusCounts {
  all: number;
  Planning: number;
  Ready: number;
  Completed: number;
}

interface PlanningStatusFilterProps {
  value: PlanningStatusFilterValue;
  onChange: (newValue: PlanningStatusFilterValue) => void;
  counts: StatusCounts;
}

/**
 * Status filter component with neumorphic styling
 * Replaces sorting buttons with a status-based filter
 */
const PlanningStatusFilter: React.FC<PlanningStatusFilterProps> = ({
  value,
  onChange,
  counts,
}) => {
  const handleChange = (
    _event: React.MouseEvent<HTMLElement>,
    newValue: PlanningStatusFilterValue | null
  ) => {
    if (newValue !== null) {
      onChange(newValue);
    }
  };

  const filterOptions: { value: PlanningStatusFilterValue; label: string; icon: React.ReactNode; color: string }[] = [
    { value: 'all', label: 'Alle', icon: <ListIcon fontSize="small" />, color: '#6C757D' },
    { value: 'Planning', label: 'Gepland', icon: <CalendarTodayIcon fontSize="small" />, color: ASSET_COLOR },
    { value: 'Ready', label: 'In Uitvoering', icon: <PlayCircleOutlineIcon fontSize="small" />, color: '#3B82F6' },
    { value: 'Completed', label: 'Voltooid', icon: <CheckCircleIcon fontSize="small" />, color: '#16a34a' },
  ];

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        p: 1.5,
        borderRadius: 3,
        bgcolor: 'background.paper',
        boxShadow: theme => theme.palette.mode === 'dark'
          ? 'var(--neu-shadow-dark-md)'
          : 'var(--neu-shadow-light-md)',
      }}
    >
      <ToggleButtonGroup
        value={value}
        exclusive
        onChange={handleChange}
        aria-label="planning status filter"
        size="small"
        sx={{
          '& .MuiToggleButtonGroup-grouped': {
            border: 'none',
            borderRadius: '12px !important',
            mx: 0.5,
            px: 2,
            py: 1,
            transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
            textTransform: 'none',
            fontWeight: 600,
            fontSize: '0.875rem',
            bgcolor: 'transparent',
            '&:hover': {
              bgcolor: 'action.hover',
              transform: 'translateY(-1px)',
            },
            '&.Mui-selected': {
              boxShadow: theme => theme.palette.mode === 'dark'
                ? 'var(--neu-shadow-dark-inset)'
                : 'var(--neu-shadow-light-inset)',
              '&:hover': {
                transform: 'none',
              },
            },
          },
        }}
      >
        {filterOptions.map((option) => (
          <ToggleButton
            key={option.value}
            value={option.value}
            sx={{
              gap: 1,
              color: value === option.value ? option.color : 'text.secondary',
              '&.Mui-selected': {
                color: option.color,
                bgcolor: `${option.color}15`,
              },
            }}
          >
            {option.icon}
            <span>{option.label}</span>
            <Badge
              badgeContent={counts[option.value]}
              max={99}
              sx={{
                '& .MuiBadge-badge': {
                  bgcolor: value === option.value ? option.color : 'action.disabled',
                  color: 'white',
                  fontWeight: 700,
                  fontSize: '0.7rem',
                  minWidth: 20,
                  height: 20,
                  borderRadius: 10,
                  ml: 1,
                },
              }}
            />
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </Box>
  );
};

export default PlanningStatusFilter;

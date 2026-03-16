/**
 * PlanningViewToggle - Toggle between Calendar and List view for planning
 *
 * Features:
 * - Calendar/List view switch with Djoppie-neomorph styling
 * - Persists user preference to localStorage
 * - Smooth transitions and hover effects
 */

import { useCallback } from 'react';
import { ToggleButton, ToggleButtonGroup, Tooltip, Box, Typography } from '@mui/material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ViewListIcon from '@mui/icons-material/ViewList';
import type { PlanningViewMode } from '../../../types/rollout';
import { usePlanningViewMode, savePreference } from '../../../hooks/usePlanningViewMode';

interface PlanningViewToggleProps {
  value?: PlanningViewMode;
  onChange?: (mode: PlanningViewMode) => void;
  showLabel?: boolean;
  size?: 'small' | 'medium';
}

const PlanningViewToggle = ({
  value,
  onChange,
  showLabel = false,
  size = 'small',
}: PlanningViewToggleProps) => {
  // Use hook for internal state if not controlled
  const { mode: internalMode, setMode: setInternalMode } = usePlanningViewMode();
  const currentMode = value ?? internalMode;

  const handleChange = useCallback(
    (_event: React.MouseEvent<HTMLElement>, newValue: PlanningViewMode | null) => {
      if (newValue !== null) {
        // Save preference
        savePreference(newValue);

        // Update internal state if uncontrolled
        if (!value) {
          setInternalMode(newValue);
        }

        // Call external handler if provided
        onChange?.(newValue);
      }
    },
    [value, onChange, setInternalMode]
  );

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
      {showLabel && (
        <Typography
          variant="body2"
          sx={{
            fontWeight: 500,
            color: 'text.secondary',
            fontSize: '0.875rem',
          }}
        >
          Weergave
        </Typography>
      )}
      <ToggleButtonGroup
        value={currentMode}
        exclusive
        onChange={handleChange}
        aria-label="planning view mode"
        size={size}
        sx={{
          borderRadius: 3,
          overflow: 'hidden',
          border: 'none',
          bgcolor: (theme) =>
            theme.palette.mode === 'dark' ? '#1C1F28' : '#FFFFFF',
          boxShadow: (theme) =>
            theme.palette.mode === 'dark'
              ? '8px 8px 18px rgba(0, 0, 0, 0.75), -5px -5px 12px rgba(255, 255, 255, 0.06), 2px 2px 5px rgba(0, 0, 0, 0.6) inset'
              : '6px 6px 12px rgba(0, 0, 0, 0.15), -6px -6px 12px rgba(255, 255, 255, 0.95)',
          '& .MuiToggleButton-root': {
            border: 'none',
            borderRadius: 0,
            px: size === 'small' ? 1.5 : 2,
            py: size === 'small' ? 0.75 : 1,
            minWidth: 42,
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            color: 'text.secondary',
            bgcolor: 'transparent',
            '&:hover': {
              bgcolor: (theme) =>
                theme.palette.mode === 'dark'
                  ? 'rgba(255, 119, 0, 0.12)'
                  : 'rgba(255, 119, 0, 0.08)',
              color: '#FF7700',
            },
            '&.Mui-selected': {
              bgcolor: (theme) =>
                theme.palette.mode === 'dark'
                  ? 'rgba(255, 119, 0, 0.2)'
                  : 'rgba(255, 119, 0, 0.15)',
              color: '#FF7700',
              fontWeight: 700,
              boxShadow: (theme) =>
                theme.palette.mode === 'dark'
                  ? 'inset 5px 5px 10px rgba(0, 0, 0, 0.5), inset -3px -3px 6px rgba(255, 119, 0, 0.15)'
                  : 'inset 3px 3px 6px rgba(255, 119, 0, 0.2), inset -2px -2px 4px rgba(255, 255, 255, 0.9)',
              '&:hover': {
                bgcolor: (theme) =>
                  theme.palette.mode === 'dark'
                    ? 'rgba(255, 119, 0, 0.25)'
                    : 'rgba(255, 119, 0, 0.2)',
              },
            },
            // First button (Calendar)
            '&:first-of-type': {
              borderTopLeftRadius: 12,
              borderBottomLeftRadius: 12,
            },
            // Last button (List)
            '&:last-of-type': {
              borderTopRightRadius: 12,
              borderBottomRightRadius: 12,
            },
          },
        }}
      >
        <Tooltip title="Kalenderweergave" arrow placement="bottom">
          <ToggleButton value="calendar" aria-label="calendar view">
            <CalendarMonthIcon sx={{ fontSize: size === 'small' ? '1.1rem' : '1.3rem' }} />
          </ToggleButton>
        </Tooltip>
        <Tooltip title="Lijstweergave" arrow placement="bottom">
          <ToggleButton value="list" aria-label="list view">
            <ViewListIcon sx={{ fontSize: size === 'small' ? '1.1rem' : '1.3rem' }} />
          </ToggleButton>
        </Tooltip>
      </ToggleButtonGroup>
    </Box>
  );
};

export default PlanningViewToggle;

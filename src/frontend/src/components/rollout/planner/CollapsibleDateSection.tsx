/**
 * CollapsibleDateSection - Performance-optimized date section with expand/collapse
 *
 * Features:
 * - React.memo to prevent unnecessary re-renders
 * - Auto-collapsed for past dates
 * - Lazy rendering of children when collapsed
 * - Neumorphic styling
 * - Smooth expand/collapse animation
 */

import React, { useState, useMemo, useCallback } from 'react';
import { Box, Collapse, IconButton, Typography, Chip, Stack, useTheme } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import GroupsIcon from '@mui/icons-material/Groups';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import EventRepeatIcon from '@mui/icons-material/EventRepeat';

interface CollapsibleDateSectionProps {
  dateKey: string;
  isToday: boolean;
  isPast: boolean;
  isFuture: boolean;
  totalWorkplaces: number;
  completedWorkplaces: number;
  postponedCount: number;
  planningCount: number;
  defaultExpanded?: boolean;
  children: React.ReactNode;
}

const CollapsibleDateSection = React.memo(function CollapsibleDateSection({
  dateKey,
  isToday,
  isPast,
  isFuture,
  totalWorkplaces,
  completedWorkplaces,
  postponedCount,
  planningCount,
  defaultExpanded,
  children,
}: CollapsibleDateSectionProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  // Default: expanded for today and future, collapsed for past
  const [expanded, setExpanded] = useState(
    defaultExpanded !== undefined ? defaultExpanded : (isToday || isFuture)
  );

  const toggleExpanded = useCallback(() => {
    setExpanded((prev) => !prev);
  }, []);

  // Format date
  const formattedDate = useMemo(() => {
    const date = new Date(dateKey);
    return date.toLocaleDateString('nl-NL', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }, [dateKey]);

  // Calculate progress
  const progress = useMemo(() => {
    if (totalWorkplaces === 0) return 0;
    return Math.round((completedWorkplaces / totalWorkplaces) * 100);
  }, [totalWorkplaces, completedWorkplaces]);

  const isComplete = progress === 100 && totalWorkplaces > 0;

  // Short date format for mobile
  const shortFormattedDate = useMemo(() => {
    const date = new Date(dateKey);
    return date.toLocaleDateString('nl-NL', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  }, [dateKey]);

  return (
    <Box sx={{ mb: 2 }}>
      {/* Header - Always visible */}
      <Box
        onClick={toggleExpanded}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: { xs: 'wrap', sm: 'nowrap' },
          gap: { xs: 1, sm: 2 },
          p: { xs: 1.5, sm: 2 },
          borderRadius: expanded ? '8px 8px 0 0' : 2,
          cursor: 'pointer',
          bgcolor: isDark ? 'var(--dark-bg-elevated)' : '#f8f9fa',
          border: '1px solid',
          borderColor: isToday
            ? '#FF7700'
            : (isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)'),
          boxShadow: isDark
            ? '3px 3px 6px #141719, -3px -3px 6px #282e33'
            : '4px 4px 8px #d1d5db, -4px -4px 8px #ffffff',
          transition: 'all 0.2s ease',
          '&:hover': {
            borderColor: isToday
              ? '#FF7700'
              : (isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.12)'),
            boxShadow: isDark
              ? '4px 4px 8px #141719, -4px -4px 8px #282e33'
              : '5px 5px 10px #d1d5db, -5px -5px 10px #ffffff',
          },
        }}
      >
        {/* Left: Date info */}
        <Stack direction="row" alignItems="center" spacing={{ xs: 1, sm: 2 }} sx={{ minWidth: 0, flexShrink: 1 }}>
          <Box
            sx={{
              width: { xs: 32, sm: 40 },
              height: { xs: 32, sm: 40 },
              borderRadius: 1.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              bgcolor: isToday ? 'rgba(255, 119, 0, 0.1)' : 'rgba(255, 119, 0, 0.05)',
            }}
          >
            <CalendarTodayIcon
              sx={{
                fontSize: { xs: 18, sm: 22 },
                color: isToday ? '#FF7700' : 'rgba(255, 119, 0, 0.6)',
              }}
            />
          </Box>

          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="subtitle1"
              sx={{
                fontWeight: 700,
                fontSize: { xs: '0.875rem', sm: '1rem' },
                color: isToday ? '#FF7700' : (isDark ? '#fff' : '#333'),
                textTransform: 'capitalize',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {isToday ? 'Vandaag' : (
                <>
                  {/* Show short date on mobile, full date on desktop */}
                  <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>
                    {shortFormattedDate}
                  </Box>
                  <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
                    {formattedDate}
                  </Box>
                </>
              )}
            </Typography>
            {isToday && (
              <Typography
                variant="caption"
                sx={{
                  color: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
                  display: { xs: 'none', sm: 'block' },
                }}
              >
                {formattedDate}
              </Typography>
            )}
          </Box>
        </Stack>

        {/* Mobile: Compact stats */}
        <Stack
          direction="row"
          spacing={0.75}
          sx={{
            display: { xs: 'flex', sm: 'none' },
            alignItems: 'center',
          }}
        >
          {/* Compact workplace progress */}
          <Chip
            size="small"
            icon={<GroupsIcon sx={{ fontSize: '12px !important' }} />}
            label={`${completedWorkplaces}/${totalWorkplaces}`}
            sx={{
              height: 22,
              fontSize: '0.7rem',
              fontWeight: 600,
              bgcolor: isComplete
                ? 'rgba(22, 163, 74, 0.1)'
                : 'rgba(255, 119, 0, 0.1)',
              color: isComplete ? '#16a34a' : '#FF7700',
              border: `1px solid ${isComplete ? 'rgba(22, 163, 74, 0.4)' : 'rgba(255, 119, 0, 0.4)'}`,
              '& .MuiChip-icon': { color: 'inherit', ml: 0.5 },
              '& .MuiChip-label': { px: 0.5 },
            }}
          />
          {isComplete && (
            <CheckCircleIcon sx={{ fontSize: 18, color: '#16a34a' }} />
          )}
        </Stack>

        {/* Stats - Right aligned */}
        <Stack direction="row" spacing={1.5} sx={{ display: { xs: 'none', sm: 'flex' }, ml: 'auto', mr: 1 }}>
          {/* Plannings count */}
          <Chip
            size="small"
            label={`${planningCount} planning${planningCount !== 1 ? 's' : ''}`}
            sx={{
              height: 24,
              minWidth: 85,
              fontSize: '0.75rem',
              fontWeight: 600,
              bgcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
              color: isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
              border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.08)',
            }}
          />

          {/* Workplaces */}
          <Chip
            size="small"
            icon={<GroupsIcon sx={{ fontSize: '14px !important' }} />}
            label={`${completedWorkplaces}/${totalWorkplaces}`}
            sx={{
              height: 24,
              minWidth: 60,
              fontSize: '0.75rem',
              fontWeight: 600,
              bgcolor: isComplete
                ? 'rgba(22, 163, 74, 0.1)'
                : 'rgba(255, 119, 0, 0.1)',
              color: isComplete ? '#16a34a' : '#FF7700',
              border: `1px solid ${isComplete ? 'rgba(22, 163, 74, 0.4)' : 'rgba(255, 119, 0, 0.4)'}`,
              '& .MuiChip-icon': {
                color: 'inherit',
              },
            }}
          />

          {/* Postponed indicator */}
          {postponedCount > 0 && (
            <Chip
              size="small"
              icon={<EventRepeatIcon sx={{ fontSize: '14px !important' }} />}
              label={`${postponedCount} uitgesteld`}
              sx={{
                height: 24,
                fontSize: '0.75rem',
                fontWeight: 600,
                bgcolor: 'rgba(234, 179, 8, 0.1)',
                color: '#ca8a04',
                border: '1px solid rgba(234, 179, 8, 0.4)',
                '& .MuiChip-icon': {
                  color: 'inherit',
                },
              }}
            />
          )}

          {/* Complete indicator */}
          {isComplete && (
            <Chip
              size="small"
              icon={<CheckCircleIcon sx={{ fontSize: '14px !important' }} />}
              label="Voltooid"
              sx={{
                height: 24,
                fontSize: '0.75rem',
                fontWeight: 600,
                bgcolor: 'rgba(22, 163, 74, 0.1)',
                color: '#16a34a',
                border: '1px solid rgba(22, 163, 74, 0.4)',
                '& .MuiChip-icon': {
                  color: 'inherit',
                },
              }}
            />
          )}
        </Stack>

        {/* Right: Expand/Collapse */}
        <IconButton
          size="small"
          sx={{
            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
            color: isDark ? 'rgba(255, 255, 255, 0.5)' : 'text.secondary',
          }}
          onClick={(e) => {
            e.stopPropagation();
            toggleExpanded();
          }}
        >
          <ExpandMoreIcon />
        </IconButton>
      </Box>

      {/* Content - Collapsible */}
      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <Box
          sx={{
            p: 2,
            pt: 1,
            borderRadius: '0 0 8px 8px',
            bgcolor: isDark ? 'rgba(0, 0, 0, 0.15)' : '#f0f2f5',
            border: '1px solid',
            borderTop: 'none',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
            boxShadow: isDark
              ? 'inset 2px 2px 4px #141719, inset -2px -2px 4px #282e33'
              : 'inset 2px 2px 5px #d1d5db, inset -2px -2px 5px #ffffff',
          }}
        >
          {children}
        </Box>
      </Collapse>
    </Box>
  );
});

export default CollapsibleDateSection;

/**
 * DateSectionSkeleton - Skeleton loader for CollapsibleDateSection
 *
 * Features:
 * - Neumorphic styling matching the actual component
 * - Animated shimmer effect
 * - Configurable number of day cards
 */

import React from 'react';
import { Box, Skeleton, useTheme } from '@mui/material';
import RolloutDayCardSkeleton from './RolloutDayCardSkeleton';

interface DateSectionSkeletonProps {
  /** Number of day card skeletons to show */
  dayCount?: number;
  /** Whether to show expanded day cards */
  expanded?: boolean;
}

const DateSectionSkeleton = React.memo(function DateSectionSkeleton({
  dayCount = 2,
  expanded = false,
}: DateSectionSkeletonProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Box sx={{ mb: 2 }}>
      {/* Date Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 2,
          borderRadius: 3,
          bgcolor: isDark ? 'var(--dark-bg-elevated)' : 'background.paper',
          boxShadow: isDark
            ? 'var(--neu-shadow-dark-sm)'
            : 'var(--neu-shadow-light-sm)',
        }}
      >
        {/* Left: Date info */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {/* Calendar Icon Box */}
          <Skeleton
            variant="rounded"
            width={44}
            height={44}
            sx={{
              borderRadius: 2,
              bgcolor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
            }}
          />
          {/* Date Text */}
          <Box>
            <Skeleton
              variant="text"
              width={180}
              height={24}
              sx={{
                borderRadius: 1,
                bgcolor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
              }}
            />
          </Box>
        </Box>

        {/* Center: Stats */}
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          {[1, 2, 3].map((i) => (
            <Skeleton
              key={i}
              variant="rounded"
              width={80}
              height={26}
              sx={{
                borderRadius: 13,
                bgcolor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
              }}
            />
          ))}
        </Box>

        {/* Right: Expand button */}
        <Skeleton
          variant="circular"
          width={32}
          height={32}
          sx={{
            bgcolor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
          }}
        />
      </Box>

      {/* Day Cards */}
      <Box
        sx={{
          p: 2,
          pt: 0,
          borderRadius: '0 0 12px 12px',
          bgcolor: isDark ? 'var(--dark-bg-elevated)' : 'background.paper',
          boxShadow: isDark
            ? 'var(--neu-shadow-dark-sm)'
            : 'var(--neu-shadow-light-sm)',
          borderTop: '1px solid',
          borderColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          {Array.from({ length: dayCount }).map((_, index) => (
            <RolloutDayCardSkeleton key={index} expanded={expanded} />
          ))}
        </Box>
      </Box>
    </Box>
  );
});

export default DateSectionSkeleton;

/**
 * RolloutDayCardSkeleton - Skeleton loader for RolloutDayCard
 *
 * Features:
 * - Neumorphic styling matching the actual card
 * - Animated shimmer effect
 * - Matches the exact layout of RolloutDayCard
 */

import React from 'react';
import { Box, Card, Skeleton, useTheme } from '@mui/material';

interface RolloutDayCardSkeletonProps {
  /** Show expanded skeleton with workplace list */
  expanded?: boolean;
  /** Number of workplace skeletons to show when expanded */
  workplaceCount?: number;
}

const RolloutDayCardSkeleton = React.memo(function RolloutDayCardSkeleton({
  expanded = false,
  workplaceCount = 3,
}: RolloutDayCardSkeletonProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Card
      elevation={0}
      sx={{
        position: 'relative',
        borderRadius: 3,
        overflow: 'hidden',
        bgcolor: isDark ? 'var(--dark-bg-elevated)' : 'background.paper',
        boxShadow: isDark
          ? 'var(--neu-shadow-dark-md)'
          : 'var(--neu-shadow-light-md)',
        // Left border accent skeleton
        '&::before': {
          content: '""',
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: 4,
          bgcolor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        },
      }}
    >
      {/* Card Header */}
      <Box
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
        }}
      >
        {/* Planning Info */}
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          {/* Title Row */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
            {/* Service Color Indicator */}
            <Skeleton
              variant="rectangular"
              width={4}
              height={24}
              sx={{
                borderRadius: 2,
                bgcolor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
              }}
            />
            {/* Planning Name */}
            <Skeleton
              variant="text"
              width={140}
              height={28}
              sx={{
                borderRadius: 1,
                bgcolor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
              }}
            />
            {/* Status Badge */}
            <Skeleton
              variant="rounded"
              width={70}
              height={24}
              sx={{
                borderRadius: 12,
                bgcolor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
              }}
            />
          </Box>

          {/* Stats Row */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            {/* Workplace Count */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Skeleton
                variant="circular"
                width={16}
                height={16}
                sx={{
                  bgcolor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
                }}
              />
              <Skeleton
                variant="text"
                width={20}
                height={20}
                sx={{
                  bgcolor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
                }}
              />
            </Box>

            {/* Progress Indicator */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.75,
                px: 1,
                py: 0.25,
                borderRadius: 1,
                bgcolor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
              }}
            >
              <Skeleton
                variant="text"
                width={30}
                height={18}
                sx={{
                  bgcolor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
                }}
              />
              <Skeleton
                variant="rounded"
                width={40}
                height={5}
                sx={{
                  borderRadius: 2.5,
                  bgcolor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
                }}
              />
            </Box>
          </Box>
        </Box>

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {[1, 2, 3].map((i) => (
            <Skeleton
              key={i}
              variant="circular"
              width={32}
              height={32}
              sx={{
                bgcolor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
              }}
            />
          ))}
        </Box>
      </Box>

      {/* Progress Bar */}
      <Skeleton
        variant="rectangular"
        width="100%"
        height={3}
        sx={{
          bgcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
        }}
      />

      {/* Expanded Content */}
      {expanded && (
        <Box
          sx={{
            p: 2,
            bgcolor: isDark ? 'rgba(0, 0, 0, 0.15)' : 'rgba(0, 0, 0, 0.02)',
            borderTop: '1px solid',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.08)',
          }}
        >
          {/* Workplace skeletons */}
          {Array.from({ length: workplaceCount }).map((_, index) => (
            <Box
              key={index}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                p: 1.5,
                mb: index < workplaceCount - 1 ? 1 : 0,
                borderRadius: 2,
                bgcolor: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
              }}
            >
              <Skeleton
                variant="circular"
                width={40}
                height={40}
                sx={{
                  bgcolor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
                }}
              />
              <Box sx={{ flexGrow: 1 }}>
                <Skeleton
                  variant="text"
                  width="60%"
                  height={20}
                  sx={{
                    bgcolor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
                  }}
                />
                <Skeleton
                  variant="text"
                  width="40%"
                  height={16}
                  sx={{
                    bgcolor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)',
                  }}
                />
              </Box>
              <Skeleton
                variant="rounded"
                width={60}
                height={24}
                sx={{
                  borderRadius: 12,
                  bgcolor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
                }}
              />
            </Box>
          ))}
        </Box>
      )}
    </Card>
  );
});

export default RolloutDayCardSkeleton;

/**
 * Djoppie Inventory Design System
 *
 * Enhanced UI/UX patterns and utilities for consistent, professional design
 * across the application. Builds on top of the neumorphic design language.
 *
 * Usage:
 * import { getEnhancedStatCard, getEnhancedTypography } from '../utils/designSystem';
 */

import { alpha } from '@mui/material';
import { getNeumorph, getNeumorphInset, getNeumorphColors } from './neumorphicStyles';

// ============================================================================
// TYPOGRAPHY SYSTEM
// ============================================================================

/**
 * Enhanced typography scale for consistent text hierarchy
 *
 * @returns Typography style objects for different text elements
 *
 * @example
 * const typography = getEnhancedTypography();
 * <Typography sx={typography.pageTitle}>Dashboard</Typography>
 */
export const getEnhancedTypography = () => ({
  // Page-level titles
  pageTitle: {
    fontSize: { xs: '1.75rem', sm: '2rem', md: '2.25rem' },
    fontWeight: 800,
    letterSpacing: '-0.02em',
    lineHeight: 1.2,
  },

  // Section headers
  sectionTitle: {
    fontSize: { xs: '1.25rem', sm: '1.5rem' },
    fontWeight: 700,
    letterSpacing: '-0.01em',
    lineHeight: 1.3,
  },

  // Data/Metric values (large numbers)
  metricValue: {
    fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
    fontWeight: 800,
    lineHeight: 1,
    letterSpacing: '-0.03em',
    fontVariantNumeric: 'tabular-nums', // Consistent number width
  },

  // Card titles
  cardTitle: {
    fontSize: '1rem',
    fontWeight: 600,
    lineHeight: 1.4,
  },

  // Body text
  body: {
    fontSize: '0.95rem',
    lineHeight: 1.6,
    fontWeight: 400,
  },

  // Small text/captions
  caption: {
    fontSize: '0.75rem',
    lineHeight: 1.5,
    fontWeight: 500,
  },
});

// ============================================================================
// BUTTON STYLES
// ============================================================================

/**
 * Enhanced neumorphic button styles with modern interactions
 *
 * @param isDark - Theme mode (dark/light)
 * @param color - Accent color for the button
 * @param variant - Button style variant
 * @returns Button style object
 *
 * @example
 * <Button sx={getNeumorphButton(isDark, ACCENT_COLOR, 'primary')}>
 *   Submit
 * </Button>
 */
export const getNeumorphButton = (
  isDark: boolean,
  color: string,
  variant: 'primary' | 'secondary' | 'ghost' = 'primary'
) => {
  const variants = {
    // Solid filled button with shadow
    primary: {
      bgcolor: color,
      color: '#fff',
      boxShadow: `0 4px 12px ${alpha(color, 0.3)}`,
      '&:hover': {
        bgcolor: alpha(color, 0.9),
        boxShadow: `0 6px 20px ${alpha(color, 0.4)}`,
        transform: 'translateY(-2px)',
      },
      '&:active': {
        transform: 'translateY(0)',
        boxShadow: `0 2px 8px ${alpha(color, 0.3)}`,
      },
      '&:disabled': {
        bgcolor: alpha(color, 0.3),
        color: alpha('#fff', 0.5),
        boxShadow: 'none',
      },
    },

    // Outlined button with neumorphic shadow
    secondary: {
      bgcolor: alpha(color, 0.1),
      color: color,
      border: `2px solid ${alpha(color, 0.3)}`,
      boxShadow: getNeumorph(isDark, 'soft'),
      '&:hover': {
        bgcolor: alpha(color, 0.15),
        borderColor: color,
        boxShadow: `0 4px 16px ${alpha(color, 0.2)}`,
        transform: 'translateY(-2px)',
      },
      '&:active': {
        boxShadow: getNeumorphInset(isDark),
        transform: 'translateY(0)',
      },
      '&:disabled': {
        bgcolor: 'transparent',
        color: alpha(color, 0.3),
        borderColor: alpha(color, 0.2),
      },
    },

    // Minimal ghost button
    ghost: {
      bgcolor: 'transparent',
      color: color,
      boxShadow: 'none',
      '&:hover': {
        bgcolor: alpha(color, 0.08),
        transform: 'translateX(4px)',
      },
      '&:active': {
        bgcolor: alpha(color, 0.12),
      },
      '&:disabled': {
        color: alpha(color, 0.3),
      },
    },
  };

  return {
    ...variants[variant],
    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
    borderRadius: 2,
    px: 3,
    py: 1.25,
    fontWeight: 600,
    textTransform: 'none' as const,
  };
};

// ============================================================================
// CARD COMPONENTS
// ============================================================================

/**
 * Enhanced stat card with modern animations and gradients
 *
 * @param isDark - Theme mode
 * @param accentColor - Primary color for the card
 * @returns Card style object with hover effects
 *
 * @example
 * <Paper sx={getEnhancedStatCard(isDark, '#FF7700')}>
 *   <Stack direction="row">...</Stack>
 * </Paper>
 */
export const getEnhancedStatCard = (isDark: boolean, accentColor: string) => {
  const { bgSurface } = getNeumorphColors(isDark);

  return {
    p: 3,
    borderRadius: 3,
    bgcolor: bgSurface,
    boxShadow: getNeumorph(isDark, 'medium'),
    borderTop: `3px solid ${accentColor}`,
    position: 'relative' as const,
    overflow: 'hidden',
    transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)', // Bounce easing

    // Subtle gradient overlay
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      right: 0,
      width: '50%',
      height: '100%',
      background: `radial-gradient(circle at top right, ${alpha(accentColor, 0.08)} 0%, transparent 70%)`,
      pointerEvents: 'none',
    },

    '&:hover': {
      boxShadow: `${getNeumorph(isDark, 'strong')}, 0 8px 32px ${alpha(accentColor, 0.15)}`,
      transform: 'translateY(-6px) scale(1.03)',
      borderTopWidth: '5px',

      '&::before': {
        background: `radial-gradient(circle at top right, ${alpha(accentColor, 0.12)} 0%, transparent 70%)`,
      },
    },

    '&:active': {
      transform: 'translateY(-4px) scale(1.02)',
    },
  };
};

/**
 * Enhanced icon container with rotation animation
 *
 * @param isDark - Theme mode
 * @param color - Icon accent color
 * @returns Icon container style object
 *
 * @example
 * <Box sx={getEnhancedIconContainer(isDark, '#FF7700')}>
 *   <DashboardIcon />
 * </Box>
 */
export const getEnhancedIconContainer = (isDark: boolean, color: string) => ({
  width: 64,
  height: 64,
  borderRadius: 3,
  bgcolor: alpha(color, isDark ? 0.15 : 0.1),
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow: `inset 0 2px 8px ${alpha(color, 0.2)}`,
  transition: 'all 0.3s ease',
  position: 'relative' as const,

  // Animated glow ring on hover
  '&::after': {
    content: '""',
    position: 'absolute',
    inset: -2,
    borderRadius: 3,
    background: `conic-gradient(from 0deg, ${color}, transparent, ${color})`,
    opacity: 0,
    transition: 'opacity 0.3s ease',
  },

  '&:hover': {
    transform: 'rotate(-5deg) scale(1.1)',
    boxShadow: `0 0 20px ${alpha(color, 0.4)}`,
    bgcolor: alpha(color, isDark ? 0.25 : 0.15),

    '&::after': {
      opacity: 0.3,
      animation: 'spin 3s linear infinite',
    },
  },

  '@keyframes spin': {
    '0%': { transform: 'rotate(0deg)' },
    '100%': { transform: 'rotate(360deg)' },
  },
});

// ============================================================================
// PROGRESS INDICATORS
// ============================================================================

/**
 * Enhanced progress bar with gradient and shimmer effect
 *
 * @param isDark - Theme mode
 * @returns Object with container and bar style functions
 *
 * @example
 * const progressBar = getEnhancedProgressBar(isDark);
 * <Box sx={progressBar.container}>
 *   <Box sx={progressBar.bar('#FF7700', 75)} />
 * </Box>
 */
export const getEnhancedProgressBar = (isDark: boolean) => ({
  container: {
    height: 8,
    borderRadius: 4,
    bgcolor: isDark ? alpha('#fff', 0.05) : alpha('#000', 0.05),
    boxShadow: getNeumorphInset(isDark),
    overflow: 'hidden',
  },

  bar: (color: string, value: number) => ({
    width: `${value}%`,
    height: '100%',
    background: `linear-gradient(90deg, ${color} 0%, ${alpha(color, 0.7)} 100%)`,
    borderRadius: 4,
    transition: 'width 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
    position: 'relative' as const,

    // Shimmer animation
    '&::after': {
      content: '""',
      position: 'absolute',
      inset: 0,
      background: `linear-gradient(90deg, transparent, ${alpha('#fff', 0.3)}, transparent)`,
      animation: 'shimmer 2s infinite',
    },

    '@keyframes shimmer': {
      '0%': { transform: 'translateX(-100%)' },
      '100%': { transform: 'translateX(100%)' },
    },
  }),
});

// ============================================================================
// LAYOUT UTILITIES
// ============================================================================

/**
 * Responsive spacing constants for consistent layouts
 *
 * @example
 * <Box sx={responsiveSpacing.container}>
 *   <Stack sx={responsiveSpacing.stack}>...</Stack>
 * </Box>
 */
export const responsiveSpacing = {
  // Page container padding
  container: {
    px: { xs: 2, sm: 3, md: 4 },
    py: { xs: 2, sm: 3, md: 3 }
  },

  // Section spacing
  section: {
    mb: { xs: 3, sm: 4, md: 5 }
  },

  // Card padding
  card: {
    p: { xs: 2, sm: 2.5, md: 3 }
  },

  // Stack spacing
  stack: {
    spacing: { xs: 1.5, sm: 2, md: 2.5 }
  },
};

// ============================================================================
// ACCESSIBILITY
// ============================================================================

/**
 * Enhanced focus styles for keyboard navigation
 *
 * @param color - Accent color for focus ring
 * @returns Focus style object with visible outline
 *
 * @example
 * <Button sx={{ ...otherStyles, ...getFocusStyles('#FF7700') }}>
 *   Click Me
 * </Button>
 */
export const getFocusStyles = (color: string) => ({
  '&:focus-visible': {
    outline: `3px solid ${color}`,
    outlineOffset: 2,
    boxShadow: `0 0 0 4px ${alpha(color, 0.2)}`,
  },
});

// ============================================================================
// TABLE ENHANCEMENTS
// ============================================================================

/**
 * Enhanced table row styles with hover effects
 *
 * @param isDark - Theme mode
 * @param accentColor - Highlight color
 * @param isSelected - Whether row is selected
 * @returns Table row style object
 *
 * @example
 * <TableRow sx={getEnhancedTableRow(isDark, '#FF7700', false)}>
 *   <TableCell>...</TableCell>
 * </TableRow>
 */
export const getEnhancedTableRow = (
  isDark: boolean,
  accentColor: string,
  isSelected: boolean = false
) => ({
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  borderLeft: isSelected ? `4px solid ${accentColor}` : '4px solid transparent',

  '& td': {
    borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`,
    py: 1.5,
    transition: 'all 0.2s ease',
  },

  '&:hover': {
    bgcolor: alpha(accentColor, isDark ? 0.08 : 0.04),
    transform: 'translateX(4px)',
    borderLeftColor: accentColor,

    '& td': {
      color: accentColor,
      fontWeight: 500,
    },
  },

  ...(isSelected && {
    bgcolor: alpha(accentColor, isDark ? 0.12 : 0.08),

    '&:hover': {
      bgcolor: alpha(accentColor, isDark ? 0.15 : 0.1),
    },
  }),
});

/**
 * Enhanced table header styles with sticky positioning
 *
 * @param isDark - Theme mode
 * @param accentColor - Header color
 * @returns Table header style object
 *
 * @example
 * <TableHead>
 *   <TableRow sx={getEnhancedTableHead(isDark, '#FF7700')}>
 *     <TableCell>Name</TableCell>
 *   </TableRow>
 * </TableHead>
 */
export const getEnhancedTableHead = (isDark: boolean, accentColor: string) => {
  const { bgBase } = getNeumorphColors(isDark);

  return {
    bgcolor: bgBase,
    boxShadow: getNeumorphInset(isDark),

    '& th': {
      color: accentColor,
      fontWeight: 700,
      fontSize: '0.75rem',
      textTransform: 'uppercase' as const,
      letterSpacing: '0.08em',
      borderBottom: `2px solid ${accentColor}`,
      py: 2,
      position: 'sticky' as const,
      top: 0,
      zIndex: 10,
      bgcolor: bgBase,
    },
  };
};

// ============================================================================
// ANIMATION PRESETS
// ============================================================================

/**
 * Fade-in-up animation for staggered card entrances
 *
 * @param delay - Delay in seconds (e.g., 0.1 for 100ms)
 * @returns Animation style object
 *
 * @example
 * {stats.map((stat, index) => (
 *   <Card key={index} sx={getFadeInUpAnimation(index * 0.1)}>
 *     {stat.content}
 *   </Card>
 * ))}
 */
export const getFadeInUpAnimation = (delay: number = 0) => ({
  animation: `fadeInUp 0.5s ease-out ${delay}s backwards`,

  '@keyframes fadeInUp': {
    '0%': {
      opacity: 0,
      transform: 'translateY(20px)'
    },
    '100%': {
      opacity: 1,
      transform: 'translateY(0)'
    },
  },
});

/**
 * Pulse animation for attention-grabbing elements
 *
 * @param color - Pulse color
 * @returns Animation style object
 *
 * @example
 * <Badge sx={getPulseAnimation('#FF7700')}>
 *   New
 * </Badge>
 */
export const getPulseAnimation = (color: string) => ({
  animation: 'pulse 2s infinite',

  '@keyframes pulse': {
    '0%, 100%': {
      boxShadow: `0 0 0 0 ${alpha(color, 0.7)}`
    },
    '50%': {
      boxShadow: `0 0 0 8px ${alpha(color, 0)}`
    },
  },
});

/**
 * NeumorphicButton - Reusable button with neumorphic styling and micro-animations
 *
 * Features:
 * - Neumorphic shadow effects for light/dark mode
 * - Pressed state animation
 * - Loading state with spinner
 * - Multiple variants: primary, secondary, success, danger
 * - Ripple effect on click
 */

import React from 'react';
import { Button, ButtonProps, CircularProgress, useTheme, alpha } from '@mui/material';

type NeumorphicVariant = 'primary' | 'secondary' | 'success' | 'danger';

interface NeumorphicButtonProps extends Omit<ButtonProps, 'variant'> {
  /** Visual variant of the button */
  neumorphicVariant?: NeumorphicVariant;
  /** Show loading spinner */
  loading?: boolean;
  /** MUI Button variant */
  variant?: 'contained' | 'outlined' | 'text';
}

const getVariantColors = (variant: NeumorphicVariant) => {
  switch (variant) {
    case 'primary':
      return { main: '#FF7700', hover: '#e66a00', text: '#fff' };
    case 'secondary':
      return { main: '#6B7280', hover: '#4B5563', text: '#fff' };
    case 'success':
      return { main: '#16a34a', hover: '#15803d', text: '#fff' };
    case 'danger':
      return { main: '#EF4444', hover: '#DC2626', text: '#fff' };
    default:
      return { main: '#FF7700', hover: '#e66a00', text: '#fff' };
  }
};

const NeumorphicButton = React.memo(function NeumorphicButton({
  children,
  neumorphicVariant = 'primary',
  loading = false,
  disabled,
  variant = 'contained',
  sx,
  ...props
}: NeumorphicButtonProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const colors = getVariantColors(neumorphicVariant);

  const isDisabled = disabled || loading;

  return (
    <Button
      disabled={isDisabled}
      variant={variant}
      sx={{
        position: 'relative',
        fontWeight: 600,
        borderRadius: 2,
        textTransform: 'none',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        overflow: 'hidden',

        // Contained variant
        ...(variant === 'contained' && {
          bgcolor: colors.main,
          color: colors.text,
          boxShadow: isDark
            ? `4px 4px 8px #161a1d, -4px -4px 8px #262c33, inset 0 0 0 transparent`
            : `4px 4px 8px #c5cad0, -4px -4px 8px #ffffff, inset 0 0 0 transparent`,
          '&:hover:not(:disabled)': {
            bgcolor: colors.hover,
            transform: 'translateY(-1px)',
            boxShadow: isDark
              ? `6px 6px 12px #161a1d, -6px -6px 12px #262c33`
              : `6px 6px 12px #c5cad0, -6px -6px 12px #ffffff`,
          },
          '&:active:not(:disabled)': {
            transform: 'translateY(1px)',
            boxShadow: isDark
              ? `inset 3px 3px 6px #161a1d, inset -3px -3px 6px #262c33`
              : `inset 3px 3px 6px ${alpha(colors.main, 0.3)}, inset -3px -3px 6px ${alpha('#fff', 0.5)}`,
          },
        }),

        // Outlined variant
        ...(variant === 'outlined' && {
          bgcolor: isDark ? '#1e2328' : '#e8eef3',
          color: colors.main,
          border: `2px solid ${alpha(colors.main, 0.3)}`,
          boxShadow: isDark
            ? '4px 4px 8px #161a1d, -4px -4px 8px #262c33'
            : '4px 4px 8px #c5cad0, -4px -4px 8px #ffffff',
          '&:hover:not(:disabled)': {
            bgcolor: isDark ? '#1e2328' : '#e8eef3',
            borderColor: colors.main,
            transform: 'translateY(-1px)',
            boxShadow: isDark
              ? `6px 6px 12px #161a1d, -6px -6px 12px #262c33, 0 0 10px ${alpha(colors.main, 0.2)}`
              : `6px 6px 12px #c5cad0, -6px -6px 12px #ffffff, 0 0 10px ${alpha(colors.main, 0.15)}`,
          },
          '&:active:not(:disabled)': {
            transform: 'translateY(1px)',
            boxShadow: isDark
              ? 'inset 3px 3px 6px #161a1d, inset -3px -3px 6px #262c33'
              : 'inset 3px 3px 6px #c5cad0, inset -3px -3px 6px #ffffff',
          },
        }),

        // Text variant
        ...(variant === 'text' && {
          color: colors.main,
          '&:hover:not(:disabled)': {
            bgcolor: alpha(colors.main, isDark ? 0.1 : 0.08),
          },
          '&:active:not(:disabled)': {
            bgcolor: alpha(colors.main, isDark ? 0.15 : 0.12),
          },
        }),

        // Disabled state
        '&:disabled': {
          opacity: 0.5,
          cursor: 'not-allowed',
        },

        // Merge with custom sx
        ...sx,
      }}
      {...props}
    >
      {loading && (
        <CircularProgress
          size={18}
          sx={{
            position: 'absolute',
            color: variant === 'contained' ? colors.text : colors.main,
          }}
        />
      )}
      <span style={{ visibility: loading ? 'hidden' : 'visible' }}>{children}</span>
    </Button>
  );
});

export default NeumorphicButton;

import { alpha } from '@mui/material';

/**
 * Neumorphic style utilities
 * Shared styling patterns for consistent UI across the application
 */

// Base colors
export const getNeumorphColors = (isDark: boolean) => ({
  bgBase: isDark ? '#1a1f2e' : '#f0f2f5',
  bgSurface: isDark ? '#232936' : '#ffffff',
  accentColor: '#FF7700',
});

// Raised neumorphic shadow (for cards, buttons, containers)
export const getNeumorph = (isDark: boolean, intensity: 'soft' | 'medium' | 'strong' = 'medium') => {
  const shadows = {
    soft: isDark
      ? '4px 4px 8px rgba(0,0,0,0.4), -2px -2px 6px rgba(255,255,255,0.03)'
      : '4px 4px 8px rgba(0,0,0,0.08), -2px -2px 6px rgba(255,255,255,0.8)',
    medium: isDark
      ? '6px 6px 12px rgba(0,0,0,0.5), -3px -3px 8px rgba(255,255,255,0.04)'
      : '6px 6px 12px rgba(0,0,0,0.1), -3px -3px 8px rgba(255,255,255,0.9)',
    strong: isDark
      ? '8px 8px 16px rgba(0,0,0,0.6), -4px -4px 10px rgba(255,255,255,0.05)'
      : '8px 8px 16px rgba(0,0,0,0.12), -4px -4px 10px rgba(255,255,255,1)',
  };
  return shadows[intensity];
};

// Inset neumorphic shadow (for inputs, toolbars, inset areas)
export const getNeumorphInset = (isDark: boolean) =>
  isDark
    ? 'inset 2px 2px 4px rgba(0,0,0,0.4), inset -1px -1px 3px rgba(255,255,255,0.03)'
    : 'inset 2px 2px 4px rgba(0,0,0,0.06), inset -1px -1px 3px rgba(255,255,255,0.7)';

// TextField with neumorphic inset styling
export const getNeumorphTextField = (isDark: boolean, accentColor: string = '#FF7700') => ({
  '& .MuiOutlinedInput-root': {
    bgcolor: isDark ? '#1a1f2e' : '#f0f2f5',
    borderRadius: 1.5,
    boxShadow: getNeumorphInset(isDark),
    '& fieldset': { border: 'none' },
    '&:hover': {
      boxShadow: `${getNeumorphInset(isDark)}, 0 0 0 1px ${alpha(accentColor, 0.3)}`,
    },
    '&.Mui-focused': {
      boxShadow: `${getNeumorphInset(isDark)}, 0 0 0 2px ${alpha(accentColor, 0.4)}`,
    },
  },
});

// Icon button with neumorphic styling
export const getNeumorphIconButton = (isDark: boolean, color: string = '#FF7700') => ({
  bgcolor: isDark ? '#1a1f2e' : '#f0f2f5',
  color: color,
  boxShadow: getNeumorph(isDark, 'soft'),
  transition: 'all 0.15s ease',
  '&:hover': {
    bgcolor: color,
    color: '#fff',
    transform: 'translateY(-1px)',
    boxShadow: `0 4px 12px ${alpha(color, 0.4)}`,
  },
  '&:active': {
    transform: 'translateY(0)',
    boxShadow: getNeumorphInset(isDark),
  },
});

// Chip with neumorphic styling
export const getNeumorphChip = (isDark: boolean, accentColor: string = '#FF7700') => ({
  bgcolor: alpha(accentColor, 0.1),
  color: accentColor,
  border: 'none',
  fontWeight: 600,
});

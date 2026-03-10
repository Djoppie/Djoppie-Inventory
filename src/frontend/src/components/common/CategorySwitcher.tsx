import { useState, useEffect } from 'react';
import { Box, alpha, useTheme } from '@mui/material';
import LaptopIcon from '@mui/icons-material/Laptop';
import DesktopWindowsIcon from '@mui/icons-material/DesktopWindows';
import DockIcon from '@mui/icons-material/Dock';
import MonitorIcon from '@mui/icons-material/Monitor';
import GridViewIcon from '@mui/icons-material/GridView';

interface CategoryOption {
  id: string;
  label: string;
  icon: React.ElementType;
  value: string;
}

const categories: CategoryOption[] = [
  { id: 'all', label: 'All', icon: GridViewIcon, value: '' },
  { id: 'laptop', label: 'Laptops', icon: LaptopIcon, value: 'Laptop' },
  { id: 'desktop', label: 'Desktops', icon: DesktopWindowsIcon, value: 'Desktop' },
  { id: 'dock', label: 'Docking Stations', icon: DockIcon, value: 'Docking Station' },
  { id: 'monitor', label: 'Monitors', icon: MonitorIcon, value: 'Monitor' },
];

interface CategorySwitcherProps {
  value: string;
  onChange: (category: string) => void;
}

const CategorySwitcher = ({ value, onChange }: CategorySwitcherProps) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <Box
      sx={{
        display: 'flex',
        gap: { xs: 0.5, sm: 0.75 },
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
      }}
    >
      {categories.map((category, index) => {
        const isActive = value === category.value;
        const Icon = category.icon;

        return (
          <Box
            key={category.id}
            onClick={() => onChange(category.value)}
            sx={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              px: { xs: 1, sm: 1.25 },
              py: { xs: 0.5, sm: 0.625 },
              cursor: 'pointer',
              userSelect: 'none',
              borderRadius: 1,
              border: '1.5px solid',
              borderColor: isActive
                ? '#FF7700'
                : isDark
                ? 'rgba(255, 255, 255, 0.12)'
                : 'rgba(0, 0, 0, 0.12)',
              background: isActive
                ? isDark
                  ? 'linear-gradient(135deg, rgba(255, 119, 0, 0.25) 0%, rgba(255, 119, 0, 0.15) 100%)'
                  : 'linear-gradient(135deg, rgba(255, 119, 0, 0.12) 0%, rgba(255, 119, 0, 0.08) 100%)'
                : isDark
                ? 'rgba(255, 255, 255, 0.03)'
                : 'rgba(0, 0, 0, 0.02)',
              boxShadow: isActive
                ? `0 4px 16px ${alpha('#FF7700', 0.3)}, inset 0 1px 0 rgba(255, 255, 255, 0.1), inset 0 -1px 0 rgba(0, 0, 0, 0.1)`
                : `0 2px 8px ${alpha(theme.palette.common.black, 0.08)}, inset 0 1px 0 rgba(255, 255, 255, 0.05)`,
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              transform: isActive ? 'translateY(-2px) scale(1.02)' : 'translateY(0) scale(1)',
              overflow: 'hidden',
              opacity: mounted ? 1 : 0,
              animation: mounted ? `slideInUp 0.4s cubic-bezier(0.4, 0, 0.2, 1) ${index * 0.08}s forwards` : 'none',
              '@keyframes slideInUp': {
                '0%': {
                  opacity: 0,
                  transform: 'translateY(-10px)',
                },
                '100%': {
                  opacity: 1,
                  transform: 'translateY(0)',
                },
              },
              '@keyframes shimmer': {
                '0%': { backgroundPosition: '200% 0' },
                '100%': { backgroundPosition: '-200% 0' },
              },
              '@keyframes pulse-ring': {
                '0%, 100%': {
                  transform: 'scale(1)',
                  opacity: 0.5,
                },
                '50%': {
                  transform: 'scale(1.3)',
                  opacity: 0,
                },
              },
              '@keyframes pulse-dot': {
                '0%, 100%': {
                  opacity: 1,
                },
                '50%': {
                  opacity: 0.6,
                },
              },
              '@keyframes spin-in': {
                '0%': {
                  transform: 'rotate(-180deg) scale(0.5)',
                  opacity: 0,
                },
                '100%': {
                  transform: 'rotate(0deg) scale(1)',
                  opacity: 1,
                },
              },
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '3px',
                background: isActive
                  ? 'linear-gradient(90deg, #FF7700, #FF9933, #FF7700)'
                  : 'transparent',
                opacity: isActive ? 1 : 0,
                transition: 'opacity 0.3s ease',
                backgroundSize: '200% 100%',
                animation: isActive ? 'shimmer 3s linear infinite' : 'none',
              },
              '&::after': {
                content: '""',
                position: 'absolute',
                inset: -2,
                borderRadius: 'inherit',
                padding: '2px',
                background: isActive
                  ? 'linear-gradient(135deg, #FF7700, #FF9933)'
                  : 'transparent',
                WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                WebkitMaskComposite: 'xor',
                maskComposite: 'exclude',
                opacity: isActive ? 0.4 : 0,
                transition: 'opacity 0.3s ease',
                filter: 'blur(8px)',
                pointerEvents: 'none',
              },
              '&:hover': {
                borderColor: isActive ? '#FF7700' : isDark ? 'rgba(255, 119, 0, 0.5)' : 'rgba(255, 119, 0, 0.4)',
                background: isActive
                  ? isDark
                    ? 'linear-gradient(135deg, rgba(255, 119, 0, 0.3) 0%, rgba(255, 119, 0, 0.2) 100%)'
                    : 'linear-gradient(135deg, rgba(255, 119, 0, 0.15) 0%, rgba(255, 119, 0, 0.1) 100%)'
                  : isDark
                  ? 'rgba(255, 119, 0, 0.08)'
                  : 'rgba(255, 119, 0, 0.05)',
                transform: 'translateY(-2px) scale(1.02)',
                boxShadow: isActive
                  ? `0 6px 20px ${alpha('#FF7700', 0.4)}, inset 0 1px 0 rgba(255, 255, 255, 0.15), inset 0 -1px 0 rgba(0, 0, 0, 0.15)`
                  : `0 4px 12px ${alpha('#FF7700', 0.2)}, inset 0 1px 0 rgba(255, 255, 255, 0.1)`,
              },
              '&:active': {
                transform: 'translateY(0) scale(0.98)',
              },
            }}
          >
            {/* Icon with animated effects */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                width: 16,
                height: 16,
              }}
            >
              <Icon
                sx={{
                  fontSize: 16,
                  color: isActive ? '#FF7700' : 'text.secondary',
                  filter: isActive
                    ? 'drop-shadow(0 0 8px rgba(255, 119, 0, 0.6))'
                    : 'none',
                  transition: 'all 0.3s ease',
                  animation: isActive ? 'spin-in 0.3s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
                }}
              />

              {/* Pulsing ring on active */}
              {isActive && (
                <Box
                  sx={{
                    position: 'absolute',
                    inset: -4,
                    border: '2px solid',
                    borderColor: alpha('#FF7700', 0.3),
                    borderRadius: '50%',
                    animation: 'pulse-ring 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                  }}
                />
              )}
            </Box>

            {/* Label */}
            <Box
              component="span"
              sx={{
                fontSize: { xs: '0.65rem', sm: '0.7rem' },
                fontWeight: isActive ? 700 : 600,
                color: isActive ? '#FF7700' : 'text.primary',
                letterSpacing: '0.3px',
                textTransform: 'uppercase',
                whiteSpace: 'nowrap',
                textShadow: isActive
                  ? `0 0 12px ${alpha('#FF7700', 0.4)}`
                  : 'none',
                transition: 'all 0.3s ease',
                fontFamily: theme.typography.fontFamily,
              }}
            >
              {category.label}
            </Box>

            {/* Active indicator dot */}
            {isActive && (
              <Box
                sx={{
                  width: 4,
                  height: 4,
                  borderRadius: '50%',
                  bgcolor: '#FF7700',
                  boxShadow: `0 0 8px ${alpha('#FF7700', 0.8)}, 0 0 16px ${alpha('#FF7700', 0.4)}`,
                  animation: 'pulse-dot 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                }}
              />
            )}
          </Box>
        );
      })}
    </Box>
  );
};

export default CategorySwitcher;

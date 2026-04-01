import { useState, useEffect, useCallback } from 'react';
import { useMediaQuery, useTheme } from '@mui/material';

const SIDEBAR_COLLAPSED_KEY = 'djoppie-sidebar-collapsed';

interface UseSidebarStateReturn {
  isCollapsed: boolean;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  mobileOpen: boolean;
  toggleCollapsed: () => void;
  setMobileOpen: (open: boolean) => void;
  sidebarWidth: number;
}

/**
 * Hook for managing sidebar state with localStorage persistence
 * and responsive breakpoint detection.
 */
export const useSidebarState = (): UseSidebarStateReturn => {
  const theme = useTheme();

  // Responsive breakpoints
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.between('md', 'lg'));
  const isDesktop = useMediaQuery(theme.breakpoints.up('lg'));

  // Mobile drawer open state
  const [mobileOpen, setMobileOpen] = useState(false);

  // Collapsed state with localStorage persistence
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false;
    const stored = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
    return stored === 'true';
  });

  // Persist collapsed state to localStorage
  useEffect(() => {
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(isCollapsed));
  }, [isCollapsed]);

  // Close mobile drawer when switching to desktop
  useEffect(() => {
    if (isDesktop && mobileOpen) {
      setMobileOpen(false);
    }
  }, [isDesktop, mobileOpen]);

  const toggleCollapsed = useCallback(() => {
    setIsCollapsed(prev => !prev);
  }, []);

  // Calculate sidebar width based on state
  const sidebarWidth = isCollapsed ? 72 : 260;

  return {
    isCollapsed,
    isMobile,
    isTablet,
    isDesktop,
    mobileOpen,
    toggleCollapsed,
    setMobileOpen,
    sidebarWidth,
  };
};

export default useSidebarState;

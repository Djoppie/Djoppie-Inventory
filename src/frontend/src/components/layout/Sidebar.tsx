import { useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Drawer,
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  IconButton,
  Divider,
  Tooltip,
  Avatar,
  alpha,
  useTheme,
} from '@mui/material';
import { getRolloutSessions } from '../../api/rollout.api';
import type { RolloutSession } from '../../types/rollout';

// Icons
import DashboardIcon from '@mui/icons-material/Dashboard';
import InventoryIcon from '@mui/icons-material/Inventory2';
import StyleIcon from '@mui/icons-material/Style';
import AddBoxIcon from '@mui/icons-material/AddBox';
import BusinessIcon from '@mui/icons-material/Business';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import HistoryIcon from '@mui/icons-material/History';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import DevicesIcon from '@mui/icons-material/Devices';
import SettingsIcon from '@mui/icons-material/Settings';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';

import { ROUTES } from '../../constants/routes';
import { useThemeMode } from '../../hooks/useThemeMode';
import { useAuth } from '../../hooks/useAuth';
import { getNeumorph, getNeumorphInset, getNeumorphColors } from '../../utils/neumorphicStyles';
import { ASSET_COLOR } from '../../constants/filterColors';

interface SidebarProps {
  isCollapsed: boolean;
  isMobile: boolean;
  mobileOpen: boolean;
  sidebarWidth: number;
  onToggleCollapsed: () => void;
  onMobileClose: () => void;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

interface NavItem {
  label: string;
  icon: React.ReactNode;
  path: string;
  matchPaths?: string[];
  highlighted?: boolean;
  highlightId?: string; // For dynamic highlight colors (e.g., 'rollout')
}

// Navigation structure
const navSections: NavSection[] = [
  {
    title: 'Overzicht',
    items: [
      {
        label: 'Dashboard',
        icon: <DashboardIcon />,
        path: ROUTES.DASHBOARD,
        matchPaths: ['/'],
        highlighted: true,
      },
    ],
  },
  {
    title: 'Assets',
    items: [
      {
        label: 'Alle Assets',
        icon: <InventoryIcon />,
        path: ROUTES.DEVICE_MANAGEMENT,
        matchPaths: ['/devices', '/assets'],
        highlighted: true,
      },
      {
        label: 'Templates',
        icon: <StyleIcon />,
        path: ROUTES.TEMPLATES,
        matchPaths: ['/templates'],
      },
      {
        label: 'Bulk Aanmaken',
        icon: <AddBoxIcon />,
        path: ROUTES.ASSETS_BULK_NEW,
        matchPaths: ['/devices/bulk-create'],
      },
    ],
  },
  {
    title: 'Werkplekken',
    items: [
      {
        label: 'Fysieke Werkplekken',
        icon: <BusinessIcon />,
        path: ROUTES.PHYSICAL_WORKPLACES,
        matchPaths: ['/workplaces'],
        highlighted: true,
      },
    ],
  },
  {
    title: 'Scannen',
    items: [
      {
        label: 'QR Scanner',
        icon: <QrCodeScannerIcon />,
        path: ROUTES.SCAN,
        matchPaths: ['/scan'],
        highlighted: true,
      },
    ],
  },
  {
    title: 'Swaps',
    items: [
      {
        label: 'Laptop Swap',
        icon: <SwapHorizIcon />,
        path: ROUTES.LAPTOP_SWAP,
        matchPaths: ['/laptop-swap'],
        highlighted: true,
      },
      {
        label: 'Geschiedenis',
        icon: <HistoryIcon />,
        path: ROUTES.DEPLOYMENT_HISTORY,
        matchPaths: ['/laptop-swap/history', '/deployment'],
      },
    ],
  },
  {
    title: 'Uitrol',
    items: [
      {
        label: 'Rollout Sessies',
        icon: <RocketLaunchIcon />,
        path: ROUTES.ROLLOUTS,
        matchPaths: ['/rollouts'],
        highlighted: true,
        highlightId: 'rollout',
      },
      {
        label: 'Autopilot Devices',
        icon: <DevicesIcon />,
        path: ROUTES.AUTOPILOT_DEVICES,
        matchPaths: ['/devices/autopilot'],
      },
    ],
  },
  {
    title: 'Admin',
    items: [
      {
        label: 'Beheer',
        icon: <SettingsIcon />,
        path: ROUTES.ADMIN,
        matchPaths: ['/admin'],
        highlighted: true,
      },
    ],
  },
];

// Highlight colors
const HIGHLIGHT_COLOR = '#FF7700'; // Djoppie Orange
const ROLLOUT_ACTIVE_COLOR = '#E53935'; // Red for active rollouts

const Sidebar = ({
  isCollapsed,
  isMobile,
  mobileOpen,
  sidebarWidth,
  onToggleCollapsed,
  onMobileClose,
}: SidebarProps) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { toggleTheme } = useThemeMode();
  const { account } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const { bgBase, bgSurface } = getNeumorphColors(isDark);

  // Get user initials for avatar
  const userInitials = account?.name
    ? account.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .substring(0, 2)
    : account?.username?.substring(0, 2).toUpperCase() || '?';

  // Get user's first name for display
  const userFirstName = account?.name?.split(' ')[0] || account?.username?.split('@')[0] || 'User';

  // Check for active rollout sessions
  const { data: rolloutSessions = [] } = useQuery<RolloutSession[]>({
    queryKey: ['rolloutSessions'],
    queryFn: () => getRolloutSessions(),
    staleTime: 60000, // Cache for 1 minute
  });

  const hasActiveRollouts = rolloutSessions.some(
    (session: RolloutSession) => session.status === 'InProgress'
  );

  // Get icon color based on item properties
  const getIconColor = (item: NavItem, isItemActive: boolean): string => {
    if (isItemActive) return ASSET_COLOR;
    if (item.highlightId === 'rollout' && hasActiveRollouts) return ROLLOUT_ACTIVE_COLOR;
    if (item.highlighted) return HIGHLIGHT_COLOR;
    return 'inherit';
  };

  // Check if a nav item is active
  const isActive = useCallback(
    (item: NavItem): boolean => {
      const currentPath = location.pathname;

      // Exact match for dashboard
      if (item.path === '/' && currentPath === '/') {
        return true;
      }

      // Check match paths
      if (item.matchPaths) {
        return item.matchPaths.some((matchPath) => {
          if (matchPath === '/') return currentPath === '/';
          return currentPath.startsWith(matchPath);
        });
      }

      return currentPath.startsWith(item.path);
    },
    [location.pathname]
  );

  // Handle navigation
  const handleNavigation = useCallback(
    (path: string) => {
      navigate(path);
      if (isMobile) {
        onMobileClose();
      }
    },
    [navigate, isMobile, onMobileClose]
  );

  // Sidebar content
  const sidebarContent = (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        bgcolor: bgSurface,
      }}
    >
      {/* Skyline Banner */}
      {!isCollapsed && (
        <Box
          sx={{
            position: 'relative',
            width: '100%',
            height: 100,
            overflow: 'hidden',
            flexShrink: 0,
          }}
        >
          {/* Sunset gradient background */}
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              background: isDark
                ? 'linear-gradient(180deg, #1a0a2e 0%, #2d1b4e 20%, #4a2c5a 40%, #8b4a6b 60%, #c66b4a 80%, #f5a962 95%, rgba(10, 14, 39, 0.95) 100%)'
                : 'linear-gradient(180deg, #87CEEB 0%, #98D8E8 15%, #FFD89B 40%, #FFB366 60%, #FF8C42 80%, #FF6B35 95%, rgba(248, 249, 250, 0.95) 100%)',
              zIndex: 0,
            }}
          />
          {/* Skyline image */}
          <Box
            component="img"
            src="/diepenbeek-skyline.png"
            alt="Diepenbeek Skyline"
            sx={{
              position: 'absolute',
              bottom: -25,
              left: '50%',
              transform: 'translateX(-50%)',
              width: '110%',
              height: 'auto',
              objectFit: 'contain',
              opacity: isDark ? 0.6 : 0.7,
              filter: isDark
                ? 'invert(1) brightness(1.2) contrast(0.9)'
                : 'brightness(0.3) contrast(1.2)',
              mixBlendMode: isDark ? 'screen' : 'multiply',
              zIndex: 1,
            }}
          />
          {/* Subtle glow overlay */}
          <Box
            sx={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '40%',
              background: isDark
                ? 'linear-gradient(180deg, transparent 0%, rgba(255, 119, 0, 0.15) 100%)'
                : 'linear-gradient(180deg, transparent 0%, rgba(255, 140, 66, 0.2) 100%)',
              zIndex: 2,
              pointerEvents: 'none',
            }}
          />
          {/* Sun/Moon Theme Toggle */}
          <Tooltip title={isDark ? 'Schakel naar licht' : 'Schakel naar donker'} placement="bottom">
            <IconButton
              onClick={toggleTheme}
              sx={{
                position: 'absolute',
                top: 8,
                right: 12,
                zIndex: 10,
                width: 36,
                height: 36,
                bgcolor: isDark
                  ? 'rgba(255, 200, 100, 0.2)'
                  : 'rgba(255, 255, 255, 0.3)',
                backdropFilter: 'blur(4px)',
                border: '2px solid',
                borderColor: isDark
                  ? 'rgba(255, 200, 100, 0.4)'
                  : 'rgba(255, 255, 255, 0.5)',
                boxShadow: isDark
                  ? '0 0 20px rgba(255, 200, 100, 0.5), 0 0 40px rgba(255, 150, 50, 0.3)'
                  : '0 0 20px rgba(255, 200, 100, 0.6), 0 0 40px rgba(255, 150, 50, 0.4)',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  transform: 'scale(1.15) rotate(15deg)',
                  bgcolor: isDark
                    ? 'rgba(255, 200, 100, 0.3)'
                    : 'rgba(255, 255, 255, 0.5)',
                  boxShadow: isDark
                    ? '0 0 30px rgba(255, 200, 100, 0.7), 0 0 60px rgba(255, 150, 50, 0.5)'
                    : '0 0 30px rgba(255, 200, 100, 0.8), 0 0 60px rgba(255, 150, 50, 0.6)',
                },
              }}
            >
              {isDark ? (
                <DarkModeIcon
                  sx={{
                    fontSize: 22,
                    color: '#E8E8F0',
                    filter: 'drop-shadow(0 0 4px rgba(200, 200, 255, 0.8))',
                  }}
                />
              ) : (
                <LightModeIcon
                  sx={{
                    fontSize: 22,
                    color: '#FFD700',
                    filter: 'drop-shadow(0 0 6px rgba(255, 200, 0, 0.8))',
                  }}
                />
              )}
            </IconButton>
          </Tooltip>
        </Box>
      )}

      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: isCollapsed ? 'center' : 'space-between',
          p: 2,
          minHeight: 72,
          borderBottom: '1px solid',
          borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
        }}
      >
        {!isCollapsed && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar
              sx={{
                width: 40,
                height: 40,
                bgcolor: ASSET_COLOR,
                fontSize: '1rem',
                fontWeight: 700,
                border: '2px solid',
                borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)',
                boxShadow: getNeumorph(isDark, 'soft'),
              }}
            >
              {userInitials}
            </Avatar>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                fontSize: '1.1rem',
                background: isDark
                  ? 'linear-gradient(135deg, #FFFFFF 0%, #FF9933 100%)'
                  : 'linear-gradient(135deg, #2C3E50 0%, #FF7700 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              {userFirstName}
            </Typography>
          </Box>
        )}

        {isCollapsed && (
          <Avatar
            sx={{
              width: 36,
              height: 36,
              bgcolor: ASSET_COLOR,
              fontSize: '0.875rem',
              fontWeight: 700,
              border: '2px solid',
              borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)',
              boxShadow: getNeumorph(isDark, 'soft'),
            }}
          >
            {userInitials}
          </Avatar>
        )}

        {!isMobile && (
          <IconButton
            onClick={onToggleCollapsed}
            size="small"
            sx={{
              bgcolor: bgBase,
              boxShadow: getNeumorph(isDark, 'soft'),
              transition: 'all 0.2s ease',
              '&:hover': {
                bgcolor: alpha(ASSET_COLOR, 0.1),
                boxShadow: `0 0 0 2px ${alpha(ASSET_COLOR, 0.3)}`,
              },
            }}
          >
            {isCollapsed ? (
              <ChevronRightIcon sx={{ fontSize: 18, color: ASSET_COLOR }} />
            ) : (
              <ChevronLeftIcon sx={{ fontSize: 18, color: ASSET_COLOR }} />
            )}
          </IconButton>
        )}
      </Box>

      {/* Navigation */}
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          py: 2,
          '&::-webkit-scrollbar': {
            width: 6,
          },
          '&::-webkit-scrollbar-track': {
            bgcolor: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            bgcolor: alpha(ASSET_COLOR, 0.3),
            borderRadius: 3,
          },
        }}
      >
        {navSections.map((section, sectionIndex) => (
          <Box key={section.title} sx={{ mb: 1 }}>
            {/* Section Header */}
            {!isCollapsed && (
              <Typography
                variant="caption"
                sx={{
                  px: 3,
                  py: 1,
                  display: 'block',
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
                }}
              >
                {section.title}
              </Typography>
            )}

            {isCollapsed && sectionIndex > 0 && (
              <Divider
                sx={{
                  mx: 2,
                  my: 1,
                  borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
                }}
              />
            )}

            {/* Section Items */}
            <List disablePadding>
              {section.items.map((item) => {
                const active = isActive(item);

                const buttonContent = (
                  <ListItemButton
                    onClick={() => handleNavigation(item.path)}
                    sx={{
                      mx: 1.5,
                      my: 0.5,
                      borderRadius: 2,
                      minHeight: 44,
                      justifyContent: isCollapsed ? 'center' : 'flex-start',
                      px: isCollapsed ? 1 : 2,
                      bgcolor: active
                        ? alpha(ASSET_COLOR, isDark ? 0.15 : 0.1)
                        : 'transparent',
                      boxShadow: active
                        ? getNeumorphInset(isDark)
                        : 'none',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        bgcolor: active
                          ? alpha(ASSET_COLOR, isDark ? 0.2 : 0.15)
                          : alpha(ASSET_COLOR, 0.08),
                        boxShadow: active
                          ? getNeumorphInset(isDark)
                          : getNeumorph(isDark, 'soft'),
                        transform: 'translateX(2px)',
                      },
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        minWidth: isCollapsed ? 0 : 40,
                        justifyContent: 'center',
                        color: getIconColor(item, active),
                        transition: 'color 0.2s ease',
                      }}
                    >
                      {item.icon}
                    </ListItemIcon>
                    {!isCollapsed && (
                      <ListItemText
                        primary={item.label}
                        primaryTypographyProps={{
                          fontSize: '0.875rem',
                          fontWeight: active ? 600 : 500,
                          color: active ? ASSET_COLOR : 'text.primary',
                        }}
                      />
                    )}
                  </ListItemButton>
                );

                return (
                  <ListItem key={item.path} disablePadding>
                    {isCollapsed ? (
                      <Tooltip title={item.label} placement="right" arrow>
                        {buttonContent}
                      </Tooltip>
                    ) : (
                      buttonContent
                    )}
                  </ListItem>
                );
              })}
            </List>
          </Box>
        ))}
      </Box>

      {/* Footer */}
      <Box
        sx={{
          p: 2,
          borderTop: '1px solid',
          borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
        }}
      >
        {!isCollapsed && (
          <Typography
            variant="caption"
            sx={{
              display: 'block',
              textAlign: 'center',
              color: 'text.secondary',
              fontSize: '0.7rem',
            }}
          >
            Djoppie Inventory v2.0
          </Typography>
        )}
      </Box>
    </Box>
  );

  // Mobile: Temporary drawer
  if (isMobile) {
    return (
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onMobileClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          '& .MuiDrawer-paper': {
            width: 280,
            boxShadow: getNeumorph(isDark, 'strong'),
            borderRight: 'none',
          },
        }}
      >
        {sidebarContent}
      </Drawer>
    );
  }

  // Desktop: Permanent drawer
  return (
    <Drawer
      variant="permanent"
      sx={{
        width: sidebarWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: sidebarWidth,
          boxSizing: 'border-box',
          borderRight: 'none',
          boxShadow: getNeumorph(isDark, 'medium'),
          transition: 'width 300ms cubic-bezier(0.4, 0, 0.2, 1)',
          overflowX: 'hidden',
        },
      }}
    >
      {sidebarContent}
    </Drawer>
  );
};

export default Sidebar;

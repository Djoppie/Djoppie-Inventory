import { useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
  alpha,
  useTheme,
} from '@mui/material';

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

import { ROUTES } from '../../constants/routes';
import { getNeumorph, getNeumorphInset, getNeumorphColors } from '../../utils/neumorphicStyles';
import { ASSET_COLOR } from '../../constants/filterColors';
import DjoppieLogo from '../common/DjoppieLogo';

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
      },
    ],
  },
];

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
  const navigate = useNavigate();
  const location = useLocation();

  const { bgBase, bgSurface } = getNeumorphColors(isDark);

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
            <DjoppieLogo size={40} animate={false} />
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
              Djoppie
            </Typography>
          </Box>
        )}

        {isCollapsed && <DjoppieLogo size={36} animate={false} />}

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
                        color: active ? ASSET_COLOR : 'text.secondary',
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

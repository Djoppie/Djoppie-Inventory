import { useState, useCallback } from 'react';
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
  Collapse,
  Badge,
} from '@mui/material';
import { getRolloutSessions } from '../../api/rollout.api';
import type { RolloutSession } from '../../types/rollout';

// Icons - Parent navigation
import DashboardIcon from '@mui/icons-material/Dashboard';
import InventoryIcon from '@mui/icons-material/Inventory2';
import BusinessIcon from '@mui/icons-material/Business';
import SettingsApplicationsIcon from '@mui/icons-material/SettingsApplications';
import SettingsIcon from '@mui/icons-material/Settings';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

// Icons - Inventory sub-items
import StyleIcon from '@mui/icons-material/Style';
import AssessmentIcon from '@mui/icons-material/Assessment';
import CloudIcon from '@mui/icons-material/Cloud';

// Icons - Operations sub-items
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import HistoryIcon from '@mui/icons-material/History';

// Icons - Admin sub-items
import CategoryIcon from '@mui/icons-material/Category';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import PlaceIcon from '@mui/icons-material/Place';

// Icons - Requests
import AssignmentIcon from '@mui/icons-material/Assignment';

// Icons - Requests sub-items
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PersonRemoveIcon from '@mui/icons-material/PersonRemove';

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

interface NavSubItem {
  label: string;
  icon: React.ReactNode;
  path: string;
  matchPaths?: string[];
  badge?: number | string;
}

interface NavItem {
  label: string;
  icon: React.ReactNode;
  path?: string;
  matchPaths?: string[];
  subItems?: NavSubItem[];
  highlighted?: boolean;
  highlightId?: string;
  isDashboard?: boolean;
}

// Navigation structure with hierarchy
const navigationItems: NavItem[] = [
  {
    label: 'Dashboard',
    icon: <DashboardIcon />,
    path: ROUTES.DASHBOARD,
    matchPaths: ['/'],
    highlighted: true,
    isDashboard: true,
  },
  {
    label: 'Inventory',
    icon: <InventoryIcon />,
    path: ROUTES.INVENTORY,
    matchPaths: ['/inventory', '/assets'],
    highlighted: true,
    subItems: [
      {
        label: 'Templates',
        icon: <StyleIcon />,
        path: ROUTES.INVENTORY_TEMPLATES,
        matchPaths: ['/inventory/templates'],
      },
      {
        label: 'Cloud Devices',
        icon: <CloudIcon />,
        path: ROUTES.INVENTORY_CLOUD,
        matchPaths: ['/inventory/cloud'],
      },
      {
        label: 'Reports',
        icon: <AssessmentIcon />,
        path: ROUTES.INVENTORY_REPORTS,
        matchPaths: ['/inventory/reports'],
      },
    ],
  },
  {
    label: 'Workplaces',
    icon: <BusinessIcon />,
    path: ROUTES.PHYSICAL_WORKPLACES,
    matchPaths: ['/workplaces'],
    highlighted: true,
    subItems: [
      {
        label: 'Reports',
        icon: <AssessmentIcon />,
        path: ROUTES.WORKPLACE_REPORTS,
        matchPaths: ['/workplaces/reports'],
      },
    ],
  },
  {
    label: 'Operations',
    icon: <SettingsApplicationsIcon />,
    path: ROUTES.OPERATIONS_ROLLOUTS,
    matchPaths: ['/operations'],
    highlighted: true,
    highlightId: 'operations',
    subItems: [
      {
        label: 'Rollouts',
        icon: <RocketLaunchIcon />,
        path: ROUTES.OPERATIONS_ROLLOUTS,
        matchPaths: ['/operations/rollouts'],
      },
      {
        label: 'Deployments',
        icon: <SwapHorizIcon />,
        path: ROUTES.OPERATIONS_DEPLOYMENTS,
        matchPaths: ['/operations/deployments'],
      },
      {
        label: 'History',
        icon: <HistoryIcon />,
        path: ROUTES.OPERATIONS_HISTORY,
        matchPaths: ['/operations/history'],
      },
    ],
  },
  {
    label: 'Requests',
    icon: <AssignmentIcon />,
    path: ROUTES.REQUESTS,
    matchPaths: ['/requests'],
    highlighted: true,
    subItems: [
      {
        label: 'Onboarding',
        icon: <PersonAddIcon />,
        path: ROUTES.REQUESTS_ONBOARDING,
        matchPaths: ['/requests/onboarding'],
      },
      {
        label: 'Offboarding',
        icon: <PersonRemoveIcon />,
        path: ROUTES.REQUESTS_OFFBOARDING,
        matchPaths: ['/requests/offboarding'],
      },
      {
        label: 'Reports',
        icon: <AssessmentIcon />,
        path: ROUTES.REQUESTS_REPORTS,
        matchPaths: ['/requests/reports'],
      },
    ],
  },
  {
    label: 'Admin',
    icon: <SettingsIcon />,
    path: ROUTES.ADMIN_ASSETS,
    matchPaths: ['/admin'],
    highlighted: true,
    subItems: [
      {
        label: 'Assets',
        icon: <CategoryIcon />,
        path: ROUTES.ADMIN_ASSETS,
        matchPaths: ['/admin/assets'],
      },
      {
        label: 'Organisation',
        icon: <AccountTreeIcon />,
        path: ROUTES.ADMIN_ORGANISATION,
        matchPaths: ['/admin/organisation'],
      },
      {
        label: 'Locations',
        icon: <PlaceIcon />,
        path: ROUTES.ADMIN_LOCATIONS,
        matchPaths: ['/admin/locations'],
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

  // Expanded sections state (only for items with subItems)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    Inventory: false,
    Workplaces: false,
    Operations: false,
    Requests: false,
    Admin: false,
  });

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
  const userEmail = account?.username || '';

  // Check for active rollout sessions
  const { data: rolloutSessions = [] } = useQuery<RolloutSession[]>({
    queryKey: ['rolloutSessions'],
    queryFn: () => getRolloutSessions(),
    staleTime: 60000, // Cache for 1 minute
  });

  const hasActiveRollouts = rolloutSessions.some(
    (session: RolloutSession) => session.status === 'InProgress'
  );

  // Toggle section expansion (auto-collapse other sections)
  const toggleSection = useCallback((sectionLabel: string) => {
    setExpandedSections((prev) => {
      const isCurrentlyExpanded = prev[sectionLabel];

      // If clicking on already expanded section, just collapse it
      if (isCurrentlyExpanded) {
        return {
          ...prev,
          [sectionLabel]: false,
        };
      }

      // Otherwise, collapse all sections and expand the clicked one
      const newState: Record<string, boolean> = {
        Inventory: false,
        Workplaces: false,
        Operations: false,
        Requests: false,
        Admin: false,
      };
      newState[sectionLabel] = true;

      return newState;
    });
  }, []);

  // Check if a nav item or sub-item is active
  const isActive = useCallback(
    (item: NavItem | NavSubItem): boolean => {
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

      if (item.path) {
        return currentPath.startsWith(item.path);
      }

      return false;
    },
    [location.pathname]
  );

  // Check if parent section has any active child
  const hasActiveChild = useCallback(
    (item: NavItem): boolean => {
      if (!item.subItems) return false;
      return item.subItems.some((subItem) => isActive(subItem));
    },
    [isActive]
  );

  // Get icon color based on item properties
  const getIconColor = (item: NavItem | NavSubItem, isItemActive: boolean, isParent = false): string => {
    if (isItemActive) return ASSET_COLOR;
    if ('highlightId' in item && item.highlightId === 'operations' && hasActiveRollouts) {
      return ROLLOUT_ACTIVE_COLOR;
    }
    if ('highlighted' in item && item.highlighted && !isParent) return HIGHLIGHT_COLOR;
    return 'inherit';
  };

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

  // Handle parent item click
  const handleParentClick = useCallback(
    (item: NavItem) => {
      // Navigate to the dashboard if path exists
      if (item.path) {
        handleNavigation(item.path);
      }

      // Toggle expansion if has sub-items
      if (item.subItems) {
        toggleSection(item.label);
      }
    },
    [toggleSection, handleNavigation]
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

      {/* User Profile Card */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: isCollapsed ? 'center' : 'space-between',
          p: 2,
          minHeight: 88,
          borderBottom: '1px solid',
          borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
          transition: 'all 0.3s ease',
        }}
      >
        {!isCollapsed ? (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 1.5,
              flex: 1,
              overflow: 'hidden',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Avatar
                sx={{
                  width: 44,
                  height: 44,
                  bgcolor: ASSET_COLOR,
                  fontSize: '1.05rem',
                  fontWeight: 700,
                  border: '2px solid',
                  borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)',
                  boxShadow: getNeumorph(isDark, 'soft'),
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'scale(1.05)',
                    boxShadow: `0 0 0 3px ${alpha(ASSET_COLOR, 0.2)}`,
                  },
                }}
              >
                {userInitials}
              </Avatar>
              <Box sx={{ flex: 1, overflow: 'hidden' }}>
                <Typography
                  variant="subtitle1"
                  sx={{
                    fontWeight: 700,
                    fontSize: '1rem',
                    background: isDark
                      ? 'linear-gradient(135deg, #FFFFFF 0%, #FF9933 100%)'
                      : 'linear-gradient(135deg, #2C3E50 0%, #FF7700 100%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    lineHeight: 1.2,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {userFirstName}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
                    fontSize: '0.7rem',
                    display: 'block',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {userEmail}
                </Typography>
              </Box>
            </Box>
          </Box>
        ) : (
          <Tooltip title={`${userFirstName} (${userEmail})`} placement="right" arrow>
            <Avatar
              sx={{
                width: 40,
                height: 40,
                bgcolor: ASSET_COLOR,
                fontSize: '0.95rem',
                fontWeight: 700,
                border: '2px solid',
                borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)',
                boxShadow: getNeumorph(isDark, 'soft'),
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'scale(1.05)',
                  boxShadow: `0 0 0 3px ${alpha(ASSET_COLOR, 0.2)}`,
                },
              }}
            >
              {userInitials}
            </Avatar>
          </Tooltip>
        )}

        {!isMobile && (
          <IconButton
            onClick={onToggleCollapsed}
            size="small"
            sx={{
              bgcolor: bgBase,
              boxShadow: getNeumorph(isDark, 'soft'),
              transition: 'all 0.2s ease',
              ml: isCollapsed ? 0 : 1,
              '&:hover': {
                bgcolor: alpha(ASSET_COLOR, 0.1),
                boxShadow: `0 0 0 2px ${alpha(ASSET_COLOR, 0.3)}`,
                transform: 'scale(1.1)',
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
          py: 1.5,
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
        <List disablePadding>
          {navigationItems.map((item) => {
            const active = isActive(item);
            const hasChildren = !!item.subItems;
            const isExpanded = expandedSections[item.label] || false;
            const childActive = hasActiveChild(item);

            return (
              <Box key={item.label} sx={{ mb: item.isDashboard ? 1 : 0 }}>
                {/* Parent Item */}
                <ListItem disablePadding>
                  {isCollapsed ? (
                    <Tooltip title={item.label} placement="right" arrow>
                      <ListItemButton
                        onClick={() => handleParentClick(item)}
                        sx={{
                          mx: 1.5,
                          my: 0.5,
                          borderRadius: 2,
                          minHeight: 48,
                          justifyContent: 'center',
                          px: 1,
                          bgcolor: active || childActive
                            ? alpha(ASSET_COLOR, isDark ? 0.15 : 0.1)
                            : 'transparent',
                          boxShadow: active || childActive
                            ? getNeumorphInset(isDark)
                            : 'none',
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          position: 'relative',
                          '&::before': {
                            content: '""',
                            position: 'absolute',
                            left: 0,
                            top: '20%',
                            bottom: '20%',
                            width: 3,
                            borderRadius: '0 2px 2px 0',
                            bgcolor: active || childActive ? ASSET_COLOR : 'transparent',
                            transition: 'all 0.3s ease',
                          },
                          '&:hover': {
                            bgcolor: active || childActive
                              ? alpha(ASSET_COLOR, isDark ? 0.2 : 0.15)
                              : alpha(ASSET_COLOR, 0.08),
                            boxShadow: active || childActive
                              ? getNeumorphInset(isDark)
                              : getNeumorph(isDark, 'soft'),
                            transform: 'translateX(3px)',
                          },
                        }}
                      >
                        <ListItemIcon
                          sx={{
                            minWidth: 0,
                            justifyContent: 'center',
                            color: getIconColor(item, active || childActive, true),
                            transition: 'all 0.3s ease',
                          }}
                        >
                          {hasActiveRollouts && item.highlightId === 'operations' ? (
                            <Badge
                              variant="dot"
                              color="error"
                              sx={{
                                '& .MuiBadge-badge': {
                                  animation: 'pulse 2s infinite',
                                  '@keyframes pulse': {
                                    '0%, 100%': { opacity: 1 },
                                    '50%': { opacity: 0.5 },
                                  },
                                },
                              }}
                            >
                              {item.icon}
                            </Badge>
                          ) : (
                            item.icon
                          )}
                        </ListItemIcon>
                      </ListItemButton>
                    </Tooltip>
                  ) : (
                    <ListItemButton
                      onClick={() => handleParentClick(item)}
                      sx={{
                        mx: 1.5,
                        my: 0.5,
                        borderRadius: 2,
                        minHeight: 48,
                        px: 2,
                        bgcolor: active || childActive
                          ? alpha(ASSET_COLOR, isDark ? 0.15 : 0.1)
                          : 'transparent',
                        boxShadow: active || childActive
                          ? getNeumorphInset(isDark)
                          : 'none',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        position: 'relative',
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          left: 0,
                          top: '20%',
                          bottom: '20%',
                          width: 3,
                          borderRadius: '0 2px 2px 0',
                          bgcolor: active || childActive ? ASSET_COLOR : 'transparent',
                          transition: 'all 0.3s ease',
                        },
                        '&:hover': {
                          bgcolor: active || childActive
                            ? alpha(ASSET_COLOR, isDark ? 0.2 : 0.15)
                            : alpha(ASSET_COLOR, 0.08),
                          boxShadow: active || childActive
                            ? getNeumorphInset(isDark)
                            : getNeumorph(isDark, 'soft'),
                          transform: 'translateX(3px)',
                        },
                      }}
                    >
                      <ListItemIcon
                        sx={{
                          minWidth: 40,
                          color: getIconColor(item, active || childActive, true),
                          transition: 'all 0.3s ease',
                        }}
                      >
                        {hasActiveRollouts && item.highlightId === 'operations' ? (
                          <Badge
                            variant="dot"
                            color="error"
                            sx={{
                              '& .MuiBadge-badge': {
                                animation: 'pulse 2s infinite',
                                '@keyframes pulse': {
                                  '0%, 100%': { opacity: 1 },
                                  '50%': { opacity: 0.5 },
                                },
                              },
                            }}
                          >
                            {item.icon}
                          </Badge>
                        ) : (
                          item.icon
                        )}
                      </ListItemIcon>
                      <ListItemText
                        primary={item.label}
                        primaryTypographyProps={{
                          fontSize: '0.9rem',
                          fontWeight: active || childActive ? 700 : 600,
                          color: active || childActive ? ASSET_COLOR : 'text.primary',
                        }}
                      />
                      {hasChildren && (
                        <Box
                          sx={{
                            transition: 'transform 0.3s ease',
                            transform: isExpanded ? 'rotate(0deg)' : 'rotate(0deg)',
                            color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
                          }}
                        >
                          {isExpanded ? (
                            <ExpandLessIcon fontSize="small" />
                          ) : (
                            <ExpandMoreIcon fontSize="small" />
                          )}
                        </Box>
                      )}
                    </ListItemButton>
                  )}
                </ListItem>

                {/* Sub Items */}
                {hasChildren && !isCollapsed && (
                  <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                    <List disablePadding sx={{ pl: 1 }}>
                      {item.subItems!.map((subItem) => {
                        const subActive = isActive(subItem);

                        return (
                          <ListItem key={subItem.path} disablePadding>
                            <ListItemButton
                              onClick={() => handleNavigation(subItem.path)}
                              sx={{
                                mx: 1.5,
                                my: 0.25,
                                borderRadius: 1.5,
                                minHeight: 40,
                                pl: 5,
                                pr: 2,
                                bgcolor: subActive
                                  ? alpha(ASSET_COLOR, isDark ? 0.1 : 0.08)
                                  : 'transparent',
                                transition: 'all 0.2s ease',
                                position: 'relative',
                                '&:hover': {
                                  bgcolor: subActive
                                    ? alpha(ASSET_COLOR, isDark ? 0.15 : 0.12)
                                    : alpha(ASSET_COLOR, 0.05),
                                  transform: 'translateX(4px)',
                                },
                              }}
                            >
                              <ListItemIcon
                                sx={{
                                  minWidth: 36,
                                  color: getIconColor(subItem, subActive),
                                  fontSize: '0.85rem',
                                  transition: 'color 0.2s ease',
                                  '& .MuiSvgIcon-root': {
                                    fontSize: '1.2rem', // Smaller than parent icons (which are 1.5rem default)
                                  },
                                }}
                              >
                                {subItem.icon}
                              </ListItemIcon>
                              <ListItemText
                                primary={subItem.label}
                                primaryTypographyProps={{
                                  fontSize: '0.8rem',
                                  fontWeight: subActive ? 600 : 500,
                                  color: subActive ? ASSET_COLOR : 'text.secondary',
                                }}
                              />
                            </ListItemButton>
                          </ListItem>
                        );
                      })}
                    </List>
                  </Collapse>
                )}

                {/* Divider after Dashboard */}
                {item.isDashboard && (
                  <Divider
                    sx={{
                      mx: 2,
                      my: 1,
                      borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
                    }}
                  />
                )}
              </Box>
            );
          })}
        </List>
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

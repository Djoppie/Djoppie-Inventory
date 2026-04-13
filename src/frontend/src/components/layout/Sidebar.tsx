import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Drawer,
  Box,
  List,
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

// Icons - Inventory sub-items
import AddBoxIcon from '@mui/icons-material/AddBox';
import PlaylistAddIcon from '@mui/icons-material/PlaylistAdd';
import StyleIcon from '@mui/icons-material/Style';
import AssessmentIcon from '@mui/icons-material/Assessment';

// Icons - Operations sub-items
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';

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
import { getNeumorph, getNeumorphColors } from '../../utils/neumorphicStyles';
import { ASSET_COLOR } from '../../constants/filterColors';
import NavigationGroup from './NavigationGroup';

interface SidebarProps {
  isCollapsed: boolean;
  isMobile: boolean;
  mobileOpen: boolean;
  sidebarWidth: number;
  onToggleCollapsed: () => void;
  onMobileClose: () => void;
}

// Section keys for expansion state
const SECTION_KEYS = ['Inventory', 'Workplaces', 'Operations', 'Requests', 'Admin'] as const;
type SectionKey = (typeof SECTION_KEYS)[number];

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

  const { bgBase, bgSurface } = getNeumorphColors(isDark);

  // Expanded sections state
  const [expandedSections, setExpandedSections] = useState<Record<SectionKey, boolean>>({
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
    staleTime: 60000,
  });

  const hasActiveRollouts = rolloutSessions.some(
    (session: RolloutSession) => session.status === 'InProgress'
  );

  // Toggle section expansion (auto-collapse other sections)
  const toggleSection = useCallback((sectionLabel: SectionKey) => {
    setExpandedSections((prev) => {
      if (prev[sectionLabel]) {
        return { ...prev, [sectionLabel]: false };
      }
      // Collapse all, expand clicked
      const newState = {} as Record<SectionKey, boolean>;
      for (const key of SECTION_KEYS) {
        newState[key] = key === sectionLabel;
      }
      return newState;
    });
  }, []);

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
          '&::-webkit-scrollbar': { width: 6 },
          '&::-webkit-scrollbar-track': { bgcolor: 'transparent' },
          '&::-webkit-scrollbar-thumb': {
            bgcolor: alpha(ASSET_COLOR, 0.3),
            borderRadius: 3,
          },
        }}
      >
        <List disablePadding>
          {/* Dashboard */}
          <NavigationGroup
            label="Dashboard"
            icon={<DashboardIcon />}
            path={ROUTES.DASHBOARD}
            matchPaths={['/']}
            isCollapsed={isCollapsed}
            isExpanded={false}
            onToggle={() => {}}
            onNavigate={handleNavigation}
            extraBottomMargin
          />

          <Divider
            sx={{
              mx: 2,
              my: 1,
              borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
            }}
          />

          {/* Inventory */}
          <NavigationGroup
            label="Inventory"
            icon={<InventoryIcon />}
            path={ROUTES.INVENTORY}
            matchPaths={['/inventory', '/inventory/assets', '/inventory/scan', '/inventory/templates']}
            subItems={[
              { label: 'Assets', icon: <InventoryIcon />, path: ROUTES.INVENTORY_ASSETS, matchPaths: ['/inventory/assets'] },
              { label: 'Create Asset', icon: <AddBoxIcon />, path: ROUTES.ASSETS_NEW, matchPaths: ['/inventory/assets/new'] },
              { label: 'Bulk Create Asset', icon: <PlaylistAddIcon />, path: ROUTES.ASSETS_BULK_NEW, matchPaths: ['/inventory/assets/bulk-create'] },
              { label: 'Templates', icon: <StyleIcon />, path: ROUTES.TEMPLATES, matchPaths: ['/inventory/templates'] },
              { label: 'Reports', icon: <AssessmentIcon />, path: ROUTES.REPORTS, matchPaths: ['/reports'] },
            ]}
            isCollapsed={isCollapsed}
            isExpanded={expandedSections.Inventory}
            onToggle={() => toggleSection('Inventory')}
            onNavigate={handleNavigation}
          />

          {/* Workplaces */}
          <NavigationGroup
            label="Workplaces"
            icon={<BusinessIcon />}
            path={ROUTES.PHYSICAL_WORKPLACES}
            matchPaths={['/workplaces']}
            subItems={[
              { label: 'Reports', icon: <AssessmentIcon />, path: '/workplaces/reports', matchPaths: ['/workplaces/reports'] },
            ]}
            isCollapsed={isCollapsed}
            isExpanded={expandedSections.Workplaces}
            onToggle={() => toggleSection('Workplaces')}
            onNavigate={handleNavigation}
          />

          {/* Operations */}
          <NavigationGroup
            label="Operations"
            icon={<SettingsApplicationsIcon />}
            path={ROUTES.OPERATIONS}
            matchPaths={['/operations', '/operations/rollouts', '/operations/swaps']}
            subItems={[
              { label: 'Rollout Sessions', icon: <RocketLaunchIcon />, path: ROUTES.ROLLOUTS, matchPaths: ['/operations/rollouts'] },
              { label: 'Swaps', icon: <SwapHorizIcon />, path: ROUTES.LAPTOP_SWAP, matchPaths: ['/operations/swaps'] },
              { label: 'Reports', icon: <AssessmentIcon />, path: ROUTES.DEPLOYMENT_HISTORY, matchPaths: ['/operations/swaps/history', '/operations/deployments'] },
            ]}
            isCollapsed={isCollapsed}
            isExpanded={expandedSections.Operations}
            onToggle={() => toggleSection('Operations')}
            onNavigate={handleNavigation}
            showBadge={hasActiveRollouts}
          />

          {/* Requests */}
          <NavigationGroup
            label="Requests"
            icon={<AssignmentIcon />}
            path={ROUTES.REQUESTS}
            matchPaths={['/operations/requests']}
            subItems={[
              { label: 'Onboarding', icon: <PersonAddIcon />, path: ROUTES.REQUESTS_ONBOARDING, matchPaths: ['/operations/requests/onboarding'] },
              { label: 'Offboarding', icon: <PersonRemoveIcon />, path: ROUTES.REQUESTS_OFFBOARDING, matchPaths: ['/operations/requests/offboarding'] },
              { label: 'Reports', icon: <AssessmentIcon />, path: ROUTES.REQUESTS_REPORTS, matchPaths: ['/operations/requests/reports'] },
            ]}
            isCollapsed={isCollapsed}
            isExpanded={expandedSections.Requests}
            onToggle={() => toggleSection('Requests')}
            onNavigate={handleNavigation}
          />

          {/* Admin */}
          <NavigationGroup
            label="Admin"
            icon={<SettingsIcon />}
            path={ROUTES.ADMIN}
            matchPaths={['/admin']}
            subItems={[
              { label: 'Assets', icon: <CategoryIcon />, path: ROUTES.ADMIN_ASSETS, matchPaths: ['/admin/assets'] },
              { label: 'Organisation', icon: <AccountTreeIcon />, path: ROUTES.ADMIN_ORGANISATION, matchPaths: ['/admin/organisation'] },
              { label: 'Locations', icon: <PlaceIcon />, path: ROUTES.ADMIN_LOCATIONS, matchPaths: ['/admin/locations'] },
            ]}
            isCollapsed={isCollapsed}
            isExpanded={expandedSections.Admin}
            onToggle={() => toggleSection('Admin')}
            onNavigate={handleNavigation}
          />
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

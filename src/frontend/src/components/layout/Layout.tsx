import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import Navigation from './Navigation';
import Sidebar from './Sidebar';
import Breadcrumbs from './Breadcrumbs';
import DjoppieLogo from '../common/DjoppieLogo';
import LanguageSwitcher from '../common/LanguageSwitcher';
import UserProfile from '../auth/UserProfile';
import { useThemeMode } from '../../hooks/useThemeMode';
import { useSidebarState } from '../../hooks/useSidebarState';
import { ROUTES } from '../../constants/routes';
import { getNeumorphColors } from '../../utils/neumorphicStyles';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const { mode } = useThemeMode();
  const navigate = useNavigate();
  const isDark = mode === 'dark';
  const { bgSurface } = getNeumorphColors(isDark);

  const {
    isCollapsed,
    isMobile,
    mobileOpen,
    sidebarWidth,
    toggleCollapsed,
    setMobileOpen,
  } = useSidebarState();

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar - Desktop only */}
      <Sidebar
        isCollapsed={isCollapsed}
        isMobile={isMobile}
        mobileOpen={mobileOpen}
        sidebarWidth={sidebarWidth}
        onToggleCollapsed={toggleCollapsed}
        onMobileClose={() => setMobileOpen(false)}
      />

      {/* Main content area */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          flexGrow: 1,
          minWidth: 0,
        }}
      >
        <AppBar
          position="sticky"
          elevation={4}
          sx={{
            zIndex: 1200,
            backdropFilter: 'blur(12px) saturate(180%)',
            background: 'transparent',
            mx: { xs: 1, sm: 1.5, md: 2 },
            my: { xs: 0.75, sm: 1, md: 1.25 },
            borderRadius: 2,
            overflow: 'visible',
            '&::after': {
              content: '""',
              position: 'absolute',
              bottom: -20,
              left: '10%',
              right: '10%',
              height: '30px',
              background: (theme) =>
                theme.palette.mode === 'dark'
                  ? 'radial-gradient(ellipse at center, rgba(255, 119, 0, 0.3) 0%, rgba(204, 0, 0, 0.15) 40%, transparent 70%)'
                  : 'radial-gradient(ellipse at center, rgba(255, 119, 0, 0.25) 0%, rgba(204, 0, 0, 0.12) 40%, transparent 70%)',
              filter: 'blur(10px)',
              animation: 'glowPulse 3s ease-in-out infinite',
              pointerEvents: 'none',
            },
            '@keyframes glowPulse': {
              '0%, 100%': {
                opacity: 0.6,
                transform: 'scaleX(1)',
              },
              '50%': {
                opacity: 1,
                transform: 'scaleX(1.05)',
              },
            },
          }}
        >
          <Toolbar
            sx={{
              gap: 2,
              py: 1,
              bgcolor: bgSurface,
              position: 'relative',
              overflow: 'visible',
              borderRadius: 2,
              borderBottom: '1px solid',
              borderBottomColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
            }}
          >
            {/* Mobile menu button */}
            {isMobile && (
              <IconButton
                onClick={() => setMobileOpen(true)}
                sx={{
                  color: 'text.primary',
                  mr: 1,
                }}
              >
                <MenuIcon />
              </IconButton>
            )}

            {/* Logo and Title - Clickable to Dashboard */}
            <Box
              onClick={() => navigate(ROUTES.DASHBOARD)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2.5,
                position: 'relative',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                py: 0.5,
                px: 1.5,
                borderRadius: 3,
                '&:hover': {
                  transform: 'scale(1.02)',
                  background: (theme) =>
                    theme.palette.mode === 'dark'
                      ? 'rgba(255, 119, 0, 0.05)'
                      : 'rgba(255, 119, 0, 0.03)',
                },
              }}
            >
              {/* Logo Container */}
              <Box
                sx={{
                  position: 'relative',
                  display: { xs: 'none', sm: 'flex' },
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <DjoppieLogo size={64} animate headerMode />
              </Box>

              {/* Title Next to Logo */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.3 }}>
                <Typography
                  variant="h4"
                  component="h1"
                  sx={{
                    fontFamily: '"Segoe UI", "Roboto", "Arial", sans-serif',
                    fontWeight: 700,
                    letterSpacing: '-0.02em',
                    fontSize: { xs: '1.3rem', sm: '1.6rem', md: '1.8rem' },
                    lineHeight: 1.1,
                    background: (theme) =>
                      theme.palette.mode === 'dark'
                        ? 'linear-gradient(135deg, #FFFFFF 0%, #FFD966 40%, #FF9933 80%, #FF7700 100%)'
                        : 'linear-gradient(135deg, #2C3E50 0%, #FF7700 60%, #E06600 100%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    textShadow: 'none',
                    filter: (theme) =>
                      theme.palette.mode === 'dark'
                        ? 'drop-shadow(0 2px 12px rgba(255, 119, 0, 0.4))'
                        : 'drop-shadow(0 1px 4px rgba(255, 119, 0, 0.2))',
                  }}
                >
                  Djoppie Inventory
                </Typography>
                <Typography
                  variant="caption"
                  component="span"
                  sx={{
                    display: { xs: 'none', sm: 'block' },
                    fontFamily: '"Segoe UI", "Roboto", "Arial", sans-serif',
                    fontWeight: 500,
                    letterSpacing: '0.08em',
                    fontSize: { xs: '0.65rem', sm: '0.7rem', md: '0.75rem' },
                    textTransform: 'uppercase',
                    color: (theme) =>
                      theme.palette.mode === 'dark'
                        ? 'rgba(255, 153, 51, 0.8)'
                        : 'rgba(255, 119, 0, 0.7)',
                    ml: 0.3,
                  }}
                >
                  Asset Management System
                </Typography>
              </Box>
            </Box>

            {/* Spacer */}
            <Box sx={{ flexGrow: 1 }} />

            {/* Language Switcher */}
            <LanguageSwitcher />

            {/* User Profile */}
            <UserProfile />
          </Toolbar>
        </AppBar>

        {/* Main Content */}
        <Box
          component="main"
          sx={{
            flex: 1,
            pt: 2,
            px: { xs: 2, sm: 2, md: 2.5 },
            pb: isMobile ? 10 : 3,
            position: 'relative',
            zIndex: 1,
            minWidth: 0,
            overflowX: 'auto',
          }}
        >
          <Breadcrumbs />
          {children}
        </Box>

        {/* Bottom Navigation - Mobile only */}
        {isMobile && <Navigation />}
      </Box>
    </Box>
  );
};

export default Layout;

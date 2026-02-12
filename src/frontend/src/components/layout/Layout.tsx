import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, AppBar, Toolbar, Container, Typography, IconButton, Tooltip } from '@mui/material';
import { Brightness4, Brightness7 } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import Navigation from './Navigation';
import DjoppieLogo from '../common/DjoppieLogo';
import LanguageSwitcher from '../common/LanguageSwitcher';
import UserProfile from '../auth/UserProfile';
import { useThemeMode } from '../../hooks/useThemeMode';
import { ROUTES } from '../../constants/routes';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const { mode, toggleTheme } = useThemeMode();
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          zIndex: 1100,
          backdropFilter: 'blur(12px) saturate(180%)',
          background: 'transparent',
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
            background: (theme) =>
              theme.palette.mode === 'dark'
                ? 'linear-gradient(180deg, rgba(10, 14, 39, 0.98) 0%, rgba(10, 14, 39, 0.95) 100%)'
                : 'linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 249, 250, 0.95) 100%)',
            position: 'relative',
            overflow: 'visible',
            boxShadow: (theme) =>
              theme.palette.mode === 'dark'
                ? '0 8px 32px rgba(255, 119, 0, 0.15), 0 4px 16px rgba(204, 0, 0, 0.1), 0 2px 8px rgba(0, 0, 0, 0.2)'
                : '0 8px 32px rgba(255, 119, 0, 0.12), 0 4px 16px rgba(204, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.06)',
            borderBottom: '1px solid',
            borderBottomColor: 'divider',
            '&::before': {
              content: '""',
              position: 'absolute',
              bottom: -1,
              left: 0,
              right: 0,
              height: '2px',
              background: (theme) =>
                theme.palette.mode === 'dark'
                  ? 'linear-gradient(90deg, transparent 0%, rgba(255, 119, 0, 0.6) 30%, rgba(204, 0, 0, 0.4) 70%, transparent 100%)'
                  : 'linear-gradient(90deg, transparent 0%, rgba(255, 119, 0, 0.5) 30%, rgba(204, 0, 0, 0.3) 70%, transparent 100%)',
              animation: 'shimmerLine 3s ease-in-out infinite',
            },
            '@keyframes shimmerLine': {
              '0%, 100%': {
                opacity: 0.5,
              },
              '50%': {
                opacity: 1,
              },
            },
          }}
        >
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
            {/* Logo Container - No extra decorations, logo has concentric rings built-in */}
            <Box
              sx={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <DjoppieLogo
                size={64}
                animate
                headerMode
              />
            </Box>

            {/* Title Next to Logo - Clean and Professional */}
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

          {/* Spacer to push controls to the right */}
          <Box sx={{ flexGrow: 1 }} />

          {/* Version Badge */}
          <Typography
            variant="caption"
            sx={{
              color: 'text.secondary',
              px: 1.5,
              py: 0.5,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1,
              fontWeight: 600,
              fontSize: '0.7rem',
            }}
          >
            v1.0.0
          </Typography>

          {/* Language Switcher */}
          <LanguageSwitcher />

          {/* User Profile */}
          <UserProfile />

          {/* Theme Toggle */}
          <Tooltip title={mode === 'dark' ? t('theme.switchToLight') : t('theme.switchToDark')}>
            <IconButton
              onClick={toggleTheme}
              size="small"
              sx={{
                color: 'secondary.main',
                border: '1px solid',
                borderColor: 'divider',
                '&:hover': {
                  borderColor: 'secondary.main',
                  boxShadow: '0 0 8px rgba(224, 123, 40, 0.3)',
                },
              }}
            >
              {mode === 'dark' ? <Brightness7 fontSize="small" /> : <Brightness4 fontSize="small" />}
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

      <Container
        component="main"
        sx={{
          flex: 1,
          pt: 5,
          py: 3,
          pb: 10,
          position: 'relative',
          zIndex: 1,
        }}
      >
        {children}
      </Container>

      <Navigation />
    </Box>
  );
};

export default Layout;

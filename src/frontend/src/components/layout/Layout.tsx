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
              gap: 2,
              position: 'relative',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              py: 0.5,
              px: 1,
              borderRadius: 2,
              '&:hover': {
                transform: 'scale(1.02)',
                '& .logo-glow': {
                  opacity: 1,
                  transform: 'scale(1.2)',
                },
              },
            }}
          >
            {/* Djoppie Head with 3D Halo Effect */}
            <Box
              sx={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 70,
                height: 70,
                // Outer halo ring - furthest back
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  width: '130%',
                  height: '130%',
                  borderRadius: '50%',
                  background: (theme) =>
                    theme.palette.mode === 'dark'
                      ? 'conic-gradient(from 0deg, rgba(255, 119, 0, 0.4), rgba(204, 0, 0, 0.3), rgba(255, 119, 0, 0.1), rgba(255, 200, 100, 0.4), rgba(255, 119, 0, 0.4))'
                      : 'conic-gradient(from 0deg, rgba(255, 119, 0, 0.3), rgba(204, 0, 0, 0.2), rgba(255, 119, 0, 0.1), rgba(255, 200, 100, 0.3), rgba(255, 119, 0, 0.3))',
                  filter: 'blur(8px)',
                  animation: 'haloRotate 8s linear infinite',
                  zIndex: 0,
                },
                // Middle glow layer
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  width: '115%',
                  height: '115%',
                  borderRadius: '50%',
                  background: (theme) =>
                    theme.palette.mode === 'dark'
                      ? 'radial-gradient(ellipse at 30% 30%, rgba(255, 200, 150, 0.25) 0%, transparent 50%), radial-gradient(ellipse at 70% 70%, rgba(255, 119, 0, 0.3) 0%, transparent 50%)'
                      : 'radial-gradient(ellipse at 30% 30%, rgba(255, 200, 150, 0.2) 0%, transparent 50%), radial-gradient(ellipse at 70% 70%, rgba(255, 119, 0, 0.2) 0%, transparent 50%)',
                  filter: 'blur(4px)',
                  animation: 'haloPulse 3s ease-in-out infinite',
                  zIndex: 1,
                },
                '@keyframes haloRotate': {
                  '0%': {
                    transform: 'rotate(0deg) scale(1)',
                  },
                  '50%': {
                    transform: 'rotate(180deg) scale(1.05)',
                  },
                  '100%': {
                    transform: 'rotate(360deg) scale(1)',
                  },
                },
                '@keyframes haloPulse': {
                  '0%, 100%': {
                    opacity: 0.7,
                    transform: 'scale(1)',
                  },
                  '50%': {
                    opacity: 1,
                    transform: 'scale(1.1)',
                  },
                },
              }}
            >
              {/* Inner 3D ring effect */}
              <Box
                sx={{
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                  borderRadius: '50%',
                  background: (theme) =>
                    theme.palette.mode === 'dark'
                      ? 'linear-gradient(145deg, rgba(255, 255, 255, 0.1) 0%, transparent 50%, rgba(0, 0, 0, 0.2) 100%)'
                      : 'linear-gradient(145deg, rgba(255, 255, 255, 0.3) 0%, transparent 50%, rgba(0, 0, 0, 0.1) 100%)',
                  border: (theme) =>
                    theme.palette.mode === 'dark'
                      ? '2px solid rgba(255, 119, 0, 0.3)'
                      : '2px solid rgba(255, 119, 0, 0.2)',
                  boxShadow: (theme) =>
                    theme.palette.mode === 'dark'
                      ? 'inset 0 -4px 12px rgba(255, 119, 0, 0.3), inset 0 4px 12px rgba(255, 200, 150, 0.2), 0 0 20px rgba(255, 119, 0, 0.4), 0 0 40px rgba(255, 119, 0, 0.2), 0 0 60px rgba(204, 0, 0, 0.1)'
                      : 'inset 0 -4px 12px rgba(255, 119, 0, 0.2), inset 0 4px 12px rgba(255, 200, 150, 0.15), 0 0 20px rgba(255, 119, 0, 0.25), 0 0 40px rgba(255, 119, 0, 0.1)',
                  zIndex: 2,
                  animation: 'ringGlow 4s ease-in-out infinite',
                  '@keyframes ringGlow': {
                    '0%, 100%': {
                      boxShadow: (theme: { palette: { mode: string } }) =>
                        theme.palette.mode === 'dark'
                          ? 'inset 0 -4px 12px rgba(255, 119, 0, 0.3), inset 0 4px 12px rgba(255, 200, 150, 0.2), 0 0 20px rgba(255, 119, 0, 0.4), 0 0 40px rgba(255, 119, 0, 0.2)'
                          : 'inset 0 -4px 12px rgba(255, 119, 0, 0.2), inset 0 4px 12px rgba(255, 200, 150, 0.15), 0 0 20px rgba(255, 119, 0, 0.25)',
                    },
                    '50%': {
                      boxShadow: (theme: { palette: { mode: string } }) =>
                        theme.palette.mode === 'dark'
                          ? 'inset 0 -6px 16px rgba(255, 119, 0, 0.4), inset 0 6px 16px rgba(255, 200, 150, 0.3), 0 0 30px rgba(255, 119, 0, 0.5), 0 0 60px rgba(255, 119, 0, 0.3)'
                          : 'inset 0 -6px 16px rgba(255, 119, 0, 0.3), inset 0 6px 16px rgba(255, 200, 150, 0.2), 0 0 30px rgba(255, 119, 0, 0.35)',
                    },
                  },
                }}
              />
              {/* Logo container with z-index to appear in front */}
              <Box sx={{ position: 'relative', zIndex: 3 }}>
                <DjoppieLogo
                  size={48}
                  animate
                  intensity="high"
                  headerMode
                  headOnly
                />
              </Box>
            </Box>

            {/* Title Next to Logo - Bigger and More Prominent */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              <Typography
                variant="h5"
                component="h1"
                sx={{
                  fontFamily: '"JetBrains Mono", "Fira Code", monospace',
                  fontWeight: 800,
                  letterSpacing: '0.04em',
                  fontSize: { xs: '1.1rem', sm: '1.4rem', md: '1.6rem' },
                  textTransform: 'uppercase',
                  lineHeight: 1.1,
                  background: (theme) =>
                    theme.palette.mode === 'dark'
                      ? 'linear-gradient(135deg, #FFFFFF 0%, #FF9233 50%, #FF7700 100%)'
                      : 'linear-gradient(135deg, #1A1D29 0%, #FF7700 50%, #CC0000 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  textShadow: 'none',
                  filter: (theme) =>
                    theme.palette.mode === 'dark'
                      ? 'drop-shadow(0 0 20px rgba(255, 119, 0, 0.3))'
                      : 'none',
                }}
              >
                Djoppie
              </Typography>
              <Typography
                variant="caption"
                component="span"
                sx={{
                  fontFamily: '"JetBrains Mono", "Fira Code", monospace',
                  fontWeight: 600,
                  letterSpacing: '0.15em',
                  fontSize: { xs: '0.6rem', sm: '0.7rem', md: '0.75rem' },
                  textTransform: 'uppercase',
                  color: 'text.secondary',
                  ml: 0.5,
                }}
              >
                Inventory
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

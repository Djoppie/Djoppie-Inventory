import { ReactNode } from 'react';
import { Box, AppBar, Toolbar, Container, Typography, IconButton, Tooltip } from '@mui/material';
import { Brightness4, Brightness7 } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import Navigation from './Navigation';
import DjoppieLogo from '../common/DjoppieLogo';
import LanguageSwitcher from '../common/LanguageSwitcher';
import UserProfile from '../auth/UserProfile';
import { useThemeMode } from '../../theme/ThemeContext';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const { mode, toggleTheme } = useThemeMode();
  const { t } = useTranslation();

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
          {/* Logo and Title - Vertical Layout */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 0.5,
              position: 'relative',
            }}
          >
            {/* Djoppie Head with Ambient Glow */}
            <Box
              sx={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  width: '140%',
                  height: '140%',
                  borderRadius: '50%',
                  background: (theme) =>
                    theme.palette.mode === 'dark'
                      ? 'radial-gradient(circle, rgba(255, 168, 65, 0.08) 0%, transparent 70%)'
                      : 'radial-gradient(circle, rgba(212, 145, 12, 0.06) 0%, transparent 70%)',
                  animation: 'ambientPulse 4s ease-in-out infinite',
                  zIndex: 0,
                },
                '@keyframes ambientPulse': {
                  '0%, 100%': {
                    transform: 'scale(1)',
                    opacity: 0.6,
                  },
                  '50%': {
                    transform: 'scale(1.1)',
                    opacity: 1,
                  },
                },
              }}
            >
              <DjoppieLogo
                size={60}
                animate
                intensity="high"
                headerMode
                headOnly
              />
            </Box>

            {/* Title Below Logo */}
            <Typography
              variant="subtitle2"
              component="div"
              sx={{
                color: 'primary.main',
                fontWeight: 700,
                letterSpacing: '0.08em',
                fontSize: '0.75rem',
                textTransform: 'uppercase',
                textAlign: 'center',
                background: (theme) =>
                  theme.palette.mode === 'dark'
                    ? 'linear-gradient(90deg, var(--djoppie-orange-400), var(--djoppie-red-400))'
                    : 'linear-gradient(90deg, var(--djoppie-orange-600), var(--djoppie-red-600))',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Djoppie Inventory
            </Typography>
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

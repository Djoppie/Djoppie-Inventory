import { ReactNode } from 'react';
import { Box, AppBar, Toolbar, Container, Typography, IconButton, Tooltip } from '@mui/material';
import { Brightness4, Brightness7 } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import Navigation from './Navigation';
import DjoppieLogo from '../common/DjoppieLogo';
import LanguageSwitcher from '../common/LanguageSwitcher';
import { useThemeMode } from '../../theme/ThemeContext';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const { mode, toggleTheme } = useThemeMode();
  const { t } = useTranslation();

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static">
        <Toolbar
          sx={{
            gap: 2,
            py: 1.5,
            background: (theme) =>
              theme.palette.mode === 'dark'
                ? 'linear-gradient(180deg, rgba(10, 14, 39, 0.95) 0%, rgba(10, 14, 39, 1) 100%)'
                : 'linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(255, 255, 255, 1) 100%)',
            position: 'relative',
            overflow: 'visible',
            '&::before': {
              content: '""',
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '1px',
              background: (theme) =>
                theme.palette.mode === 'dark'
                  ? 'linear-gradient(90deg, transparent 0%, rgba(255, 168, 65, 0.4) 50%, transparent 100%)'
                  : 'linear-gradient(90deg, transparent 0%, rgba(212, 145, 12, 0.3) 50%, transparent 100%)',
            },
          }}
        >
          {/* Djoppie Head - High quality animated design with soft glowing eyes */}
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
              size={70}
              animate
              intensity="high"
              headerMode
              headOnly
            />
          </Box>

          {/* Console-style prompt */}
          <Typography
            component="span"
            sx={{
              color: 'success.main',
              fontWeight: 700,
              fontSize: '1.25rem',
              mr: 0.5,
            }}
          >
            $
          </Typography>

          {/* Title */}
          <Typography
            variant="h6"
            component="div"
            sx={{
              flexGrow: 1,
              color: 'primary.main',
              fontWeight: 700,
              letterSpacing: '0.05em',
            }}
          >
            Djoppie Inventory
          </Typography>

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
            }}
          >
            v1.0.0
          </Typography>

          {/* Language Switcher */}
          <LanguageSwitcher />

          {/* Theme Toggle */}
          <Tooltip title={mode === 'dark' ? t('theme.switchToLight') : t('theme.switchToDark')}>
            <IconButton
              onClick={toggleTheme}
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
              {mode === 'dark' ? <Brightness7 /> : <Brightness4 />}
            </IconButton>
          </Tooltip>

          {/* Blinking cursor */}
          <Typography
            component="span"
            sx={{
              color: 'secondary.main',
              fontWeight: 700,
              fontSize: '1.25rem',
              '@keyframes blink': {
                '0%, 49%': { opacity: 1 },
                '50%, 100%': { opacity: 0 },
              },
              animation: 'blink 1.5s infinite',
            }}
          >
            _
          </Typography>
        </Toolbar>
      </AppBar>

      <Container component="main" sx={{ flex: 1, py: 3, pb: 10 }}>
        {children}
      </Container>

      <Navigation />
    </Box>
  );
};

export default Layout;

import { ReactNode, useEffect } from 'react';
import { Box, CircularProgress, Typography, Paper, Button } from '@mui/material';
import { LockPerson } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';

interface AuthGuardProps {
  children: ReactNode;
}

/**
 * AuthGuard component protects routes by requiring authentication
 * Shows a loading screen during authentication check
 * Shows a login prompt if user is not authenticated
 */
const AuthGuard = ({ children }: AuthGuardProps) => {
  const { t } = useTranslation();
  const { isAuthenticated, isLoading, login } = useAuth();

  // Auto-trigger login if not authenticated (optional - can be removed if you prefer manual login)
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // Uncomment the line below to auto-trigger login popup
      // login();
    }
  }, [isLoading, isAuthenticated]);

  // Show loading screen during authentication check
  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          gap: 2,
        }}
      >
        <CircularProgress size={48} color="secondary" />
        <Typography variant="body1" color="text.secondary">
          {t('auth.checking', 'Checking authentication...')}
        </Typography>
      </Box>
    );
  }

  // Show login prompt if not authenticated
  if (!isAuthenticated) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          p: 2,
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 4,
            maxWidth: 400,
            textAlign: 'center',
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <LockPerson
            sx={{
              fontSize: 64,
              color: 'secondary.main',
              mb: 2,
            }}
          />
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
            {t('auth.authenticationRequired', 'Authentication Required')}
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            {t(
              'auth.pleaseLogin',
              'Please sign in with your Microsoft account to access Djoppie Inventory.'
            )}
          </Typography>
          <Button
            variant="contained"
            color="secondary"
            onClick={login}
            size="large"
            sx={{
              mt: 2,
              px: 4,
            }}
          >
            {t('auth.signInWithMicrosoft', 'Sign in with Microsoft')}
          </Button>
        </Paper>
      </Box>
    );
  }

  // User is authenticated, render protected content
  return <>{children}</>;
};

export default AuthGuard;

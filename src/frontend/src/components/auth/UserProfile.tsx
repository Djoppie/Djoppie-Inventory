import { useState, MouseEvent } from 'react';
import { useTranslation } from 'react-i18next';
import {
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Box,
  Typography,
  Divider,
  CircularProgress,
  Tooltip,
  Button,
} from '@mui/material';
import {
  AccountCircle,
  Logout,
  Login,
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';

/**
 * UserProfile component displays the current user's profile
 * and provides login/logout functionality
 */
const UserProfile = () => {
  const { t } = useTranslation();
  const { isAuthenticated, isLoading, account, login, logout } = useAuth();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleMenuOpen = (event: MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogin = async () => {
    try {
      await login();
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  const handleLogout = async () => {
    handleMenuClose();
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Show loading spinner during authentication
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', ml: 1 }}>
        <CircularProgress size={24} color="secondary" />
      </Box>
    );
  }

  // Show login button if not authenticated
  if (!isAuthenticated) {
    return (
      <Tooltip title={t('auth.login', 'Login')}>
        <Button
          variant="outlined"
          color="secondary"
          startIcon={<Login />}
          onClick={handleLogin}
          sx={{
            borderColor: 'divider',
            '&:hover': {
              borderColor: 'secondary.main',
              boxShadow: '0 0 8px rgba(224, 123, 40, 0.3)',
            },
          }}
        >
          {t('auth.login', 'Login')}
        </Button>
      </Tooltip>
    );
  }

  // Get user initials for avatar
  const userInitials = account?.name
    ? account.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .substring(0, 2)
    : account?.username?.substring(0, 2).toUpperCase() || '?';

  return (
    <>
      <Tooltip title={account?.name || account?.username || t('auth.user', 'User')}>
        <IconButton
          onClick={handleMenuOpen}
          sx={{
            border: '1px solid',
            borderColor: 'divider',
            '&:hover': {
              borderColor: 'secondary.main',
              boxShadow: '0 0 8px rgba(224, 123, 40, 0.3)',
            },
          }}
        >
          <Avatar
            sx={{
              width: 32,
              height: 32,
              bgcolor: 'secondary.main',
              fontSize: '0.875rem',
              fontWeight: 600,
            }}
          >
            {userInitials}
          </Avatar>
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        slotProps={{
          paper: {
            sx: {
              mt: 1.5,
              minWidth: 220,
              border: '1px solid',
              borderColor: 'divider',
            },
          },
        }}
      >
        {/* User Info */}
        <Box sx={{ px: 2, py: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Avatar
              sx={{
                width: 40,
                height: 40,
                bgcolor: 'secondary.main',
                mr: 1.5,
              }}
            >
              {userInitials}
            </Avatar>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                {account?.name || account?.username || t('auth.user', 'User')}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {account?.username}
              </Typography>
            </Box>
          </Box>
        </Box>

        <Divider />

        {/* Profile Menu Item */}
        <MenuItem onClick={handleMenuClose}>
          <AccountCircle sx={{ mr: 1.5, fontSize: 20 }} />
          <Typography variant="body2">{t('auth.profile', 'Profile')}</Typography>
        </MenuItem>

        <Divider />

        {/* Logout Menu Item */}
        <MenuItem onClick={handleLogout}>
          <Logout sx={{ mr: 1.5, fontSize: 20 }} />
          <Typography variant="body2">{t('auth.logout', 'Logout')}</Typography>
        </MenuItem>
      </Menu>
    </>
  );
};

export default UserProfile;

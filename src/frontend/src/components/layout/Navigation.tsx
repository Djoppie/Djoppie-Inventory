import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BottomNavigation, BottomNavigationAction, Paper } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import AddBoxIcon from '@mui/icons-material/AddBox';
import { ROUTES } from '../../constants/routes';

/**
 * Bottom navigation component providing quick access to main app sections.
 * Synchronizes with current route to highlight active navigation item.
 */
const Navigation = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [value, setValue] = useState(0);

  useEffect(() => {
    // Update active tab based on current route
    if (location.pathname === ROUTES.DASHBOARD) {
      setValue(0);
    } else if (location.pathname === ROUTES.SCAN) {
      setValue(1);
    } else if (location.pathname === ROUTES.ASSETS_NEW) {
      setValue(2);
    }
  }, [location]);

  const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);

    switch (newValue) {
      case 0:
        navigate(ROUTES.DASHBOARD);
        break;
      case 1:
        navigate(ROUTES.SCAN);
        break;
      case 2:
        navigate(ROUTES.ASSETS_NEW);
        break;
    }
  };

  return (
    <Paper
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
      }}
      elevation={3}
    >
      <BottomNavigation value={value} onChange={handleChange}>
        <BottomNavigationAction label={t('navigation.dashboard')} icon={<DashboardIcon />} />
        <BottomNavigationAction label={t('navigation.scan')} icon={<QrCodeScannerIcon />} />
        <BottomNavigationAction label={t('navigation.assets')} icon={<AddBoxIcon />} />
      </BottomNavigation>
    </Paper>
  );
};

export default Navigation;

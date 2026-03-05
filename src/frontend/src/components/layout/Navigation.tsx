import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BottomNavigation, BottomNavigationAction, Paper } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import AddBoxIcon from '@mui/icons-material/AddBox';
import CategoryIcon from '@mui/icons-material/Category';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import { ROUTES } from '../../constants/routes';

/**
 * Bottom navigation component providing quick access to main app sections.
 * Synchronizes with current route to highlight active navigation item.
 */
const Navigation = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  // Derive value from current location instead of using state
  const getValue = () => {
    if (location.pathname === ROUTES.DASHBOARD) return 0;
    if (location.pathname === ROUTES.ASSETS_NEW) return 1;
    if (location.pathname === ROUTES.SCAN) return 2;
    if (location.pathname === ROUTES.TEMPLATES) return 3;
    if (location.pathname === ROUTES.ADMIN) return 4;
    return 0;
  };

  const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
    switch (newValue) {
      case 0:
        navigate(ROUTES.DASHBOARD);
        break;
      case 1:
        navigate(ROUTES.ASSETS_NEW);
        break;
      case 2:
        navigate(ROUTES.SCAN);
        break;
      case 3:
        navigate(ROUTES.TEMPLATES);
        break;
      case 4:
        navigate(ROUTES.ADMIN);
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
      <BottomNavigation value={getValue()} onChange={handleChange}>
        <BottomNavigationAction label={t('navigation.dashboard')} icon={<DashboardIcon />} />
        <BottomNavigationAction label={t('navigation.assets')} icon={<AddBoxIcon />} />
        <BottomNavigationAction label={t('navigation.scan')} icon={<QrCodeScannerIcon />} />
        <BottomNavigationAction label={t('navigation.templates')} icon={<CategoryIcon />} />
        <BottomNavigationAction label={t('navigation.admin')} icon={<AdminPanelSettingsIcon />} />
      </BottomNavigation>
    </Paper>
  );
};

export default Navigation;

import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BottomNavigation, BottomNavigationAction, Paper } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import InventoryIcon from '@mui/icons-material/Inventory2';
import SettingsApplicationsIcon from '@mui/icons-material/SettingsApplications';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import { ROUTES } from '../../constants/routes';

const Navigation = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const getValue = () => {
    if (location.pathname === ROUTES.DASHBOARD) return 0;
    if (location.pathname.startsWith('/inventory') || location.pathname.startsWith('/assets')) return 1;
    if (location.pathname === ROUTES.SCAN) return 2;
    if (location.pathname.startsWith('/operations')) return 3;
    if (location.pathname.startsWith('/admin') || location.pathname.startsWith('/workplaces')) return 4;
    return 0;
  };

  const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
    switch (newValue) {
      case 0:
        navigate(ROUTES.DASHBOARD);
        break;
      case 1:
        navigate(ROUTES.INVENTORY);
        break;
      case 2:
        navigate(ROUTES.SCAN);
        break;
      case 3:
        navigate(ROUTES.OPERATIONS_ROLLOUTS);
        break;
      case 4:
        navigate(ROUTES.ADMIN_ASSETS);
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
        <BottomNavigationAction label={t('navigation.devices', { defaultValue: 'Inventory' })} icon={<InventoryIcon />} />
        <BottomNavigationAction label={t('navigation.scan')} icon={<QrCodeScannerIcon />} />
        <BottomNavigationAction label={t('navigation.laptopSwap', { defaultValue: 'Operations' })} icon={<SettingsApplicationsIcon />} />
        <BottomNavigationAction label={t('navigation.admin')} icon={<AdminPanelSettingsIcon />} />
      </BottomNavigation>
    </Paper>
  );
};

export default Navigation;

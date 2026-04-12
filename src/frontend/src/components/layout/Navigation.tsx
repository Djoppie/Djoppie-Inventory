import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BottomNavigation, BottomNavigationAction, Paper } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import DevicesIcon from '@mui/icons-material/Devices';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
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
    if (location.pathname.startsWith('/inventory') || location.pathname.startsWith('/operations/rollouts')) return 1; // Inventory pages, templates, and rollouts
    if (location.pathname === ROUTES.SCAN) return 2;
    if (location.pathname.startsWith('/operations/swaps') || location.pathname.startsWith('/operations/deployments')) return 3; // Laptop Swap / Deployment
    if (location.pathname === ROUTES.ADMIN || location.pathname === ROUTES.PHYSICAL_WORKPLACES) return 4; // Admin section includes workplaces
    return 0;
  };

  const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
    switch (newValue) {
      case 0:
        navigate(ROUTES.DASHBOARD);
        break;
      case 1:
        navigate(ROUTES.INVENTORY_ASSETS);
        break;
      case 2:
        navigate(ROUTES.SCAN);
        break;
      case 3:
        navigate(ROUTES.LAPTOP_SWAP);
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
        <BottomNavigationAction label={t('navigation.devices', { defaultValue: 'Devices' })} icon={<DevicesIcon />} />
        <BottomNavigationAction label={t('navigation.scan')} icon={<QrCodeScannerIcon />} />
        <BottomNavigationAction label={t('navigation.laptopSwap', { defaultValue: 'Swap' })} icon={<SwapHorizIcon />} />
        <BottomNavigationAction label={t('navigation.admin')} icon={<AdminPanelSettingsIcon />} />
      </BottomNavigation>
    </Paper>
  );
};

export default Navigation;

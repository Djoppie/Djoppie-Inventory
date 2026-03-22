import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Card,
  CardContent,
  Typography,
  alpha,
  useTheme,
  Chip,
} from '@mui/material';
import DevicesIcon from '@mui/icons-material/Devices';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import LibraryAddIcon from '@mui/icons-material/LibraryAdd';
import CategoryIcon from '@mui/icons-material/Category';
import BusinessIcon from '@mui/icons-material/Business';
import InventoryIcon from '@mui/icons-material/Inventory';
import { ROUTES } from '../constants/routes';
import { useAssets } from '../hooks/useAssets';
import {
  WorkplaceOccupancyWidget,
  EquipmentStatusWidget,
  RecentWorkplaceChangesWidget,
  TodaysRolloutWidget,
} from '../components/dashboard';

interface NavigationCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  shadowColor: string;
  gradientLight: string;
  gradientDark: string;
  onClick: () => void;
  badge?: string | number;
}

const NavigationCard = ({
  title,
  description,
  icon,
  color,
  shadowColor,
  gradientLight,
  gradientDark,
  onClick,
  badge,
}: NavigationCardProps) => {
  const theme = useTheme();

  return (
    <Card
      elevation={0}
      onClick={onClick}
      sx={{
        cursor: 'pointer',
        height: '100%',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        overflow: 'hidden',
        background: theme.palette.mode === 'dark' ? gradientDark : gradientLight,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 4,
          background: 'transparent',
          transition: 'background 0.2s ease',
        },
        '&:hover': {
          borderColor: color,
          transform: 'translateY(-4px)',
          boxShadow: `0 8px 32px ${shadowColor}, inset 0 0 24px ${alpha(color, 0.05)}`,
          '&::before': {
            background: `linear-gradient(90deg, ${color}, ${alpha(color, 0.6)})`,
          },
        },
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
          {/* Color indicator bar */}
          <Box
            sx={{
              width: 4,
              height: 56,
              borderRadius: 1,
              bgcolor: color,
              flexShrink: 0,
              boxShadow: `0 0 12px ${shadowColor}`,
            }}
          />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Box
                sx={{
                  color: color,
                  display: 'flex',
                  alignItems: 'center',
                  filter: theme.palette.mode === 'dark' ? `drop-shadow(0 0 4px ${shadowColor})` : 'none',
                }}
              >
                {icon}
              </Box>
              <Typography variant="h6" fontWeight={700} sx={{ color: 'text.primary' }}>
                {title}
              </Typography>
              {badge && (
                <Chip
                  label={badge}
                  size="small"
                  sx={{
                    bgcolor: alpha(color, 0.15),
                    color: color,
                    fontWeight: 700,
                    fontSize: '0.7rem',
                    height: 20,
                  }}
                />
              )}
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.5 }}>
              {description}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

const DeviceManagementPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const theme = useTheme();
  const { data: assets } = useAssets();

  // Calculate asset stats
  const totalAssets = assets?.length || 0;

  const navigationCards = [
    {
      title: t('deviceManagement.addDevice', { defaultValue: 'Add New Asset' }),
      description: t('deviceManagement.addDeviceDesc', { defaultValue: 'Create a single asset record with full details and generate QR code' }),
      icon: <AddCircleOutlineIcon sx={{ fontSize: 28 }} />,
      color: '#4CAF50',
      shadowColor: 'rgba(76, 175, 80, 0.3)',
      gradientLight: 'linear-gradient(135deg, rgba(76,175,80,0.12) 0%, rgba(129,199,132,0.06) 100%)',
      gradientDark: 'linear-gradient(135deg, rgba(76,175,80,0.2) 0%, rgba(56,142,60,0.1) 100%)',
      route: ROUTES.ASSETS_NEW,
    },
    {
      title: t('navigation.rollouts', { defaultValue: 'Rollouts' }),
      description: t('deviceManagement.rolloutsDesc', { defaultValue: 'Plan and execute device rollouts for teams and departments' }),
      icon: <RocketLaunchIcon sx={{ fontSize: 28 }} />,
      color: '#E91E63',
      shadowColor: 'rgba(233, 30, 99, 0.3)',
      gradientLight: 'linear-gradient(135deg, rgba(233,30,99,0.12) 0%, rgba(244,143,177,0.06) 100%)',
      gradientDark: 'linear-gradient(135deg, rgba(233,30,99,0.2) 0%, rgba(194,24,91,0.1) 100%)',
      route: ROUTES.ROLLOUTS,
    },
    {
      title: t('deviceManagement.bulkCreate', { defaultValue: 'Bulk Create Assets' }),
      description: t('deviceManagement.bulkCreateDesc', { defaultValue: 'Create multiple assets at once with sequential codes and shared properties' }),
      icon: <LibraryAddIcon sx={{ fontSize: 28 }} />,
      color: '#FF9800',
      shadowColor: 'rgba(255, 152, 0, 0.3)',
      gradientLight: 'linear-gradient(135deg, rgba(255,152,0,0.12) 0%, rgba(255,183,77,0.06) 100%)',
      gradientDark: 'linear-gradient(135deg, rgba(255,152,0,0.2) 0%, rgba(245,124,0,0.1) 100%)',
      route: ROUTES.ASSETS_BULK_NEW,
    },
    {
      title: t('navigation.templates', { defaultValue: 'Asset Templates' }),
      description: t('deviceManagement.templatesDesc', { defaultValue: 'Manage reusable templates for quick asset creation with predefined properties' }),
      icon: <CategoryIcon sx={{ fontSize: 28 }} />,
      color: '#2196F3',
      shadowColor: 'rgba(33, 150, 243, 0.3)',
      gradientLight: 'linear-gradient(135deg, rgba(33,150,243,0.12) 0%, rgba(100,181,246,0.06) 100%)',
      gradientDark: 'linear-gradient(135deg, rgba(33,150,243,0.2) 0%, rgba(25,118,210,0.1) 100%)',
      route: ROUTES.TEMPLATES,
    },
    {
      title: t('deviceManagement.autopilotDevices', { defaultValue: 'Autopilot Devices' }),
      description: t('deviceManagement.autopilotDesc', { defaultValue: 'View Windows Autopilot registered devices and provisioning status' }),
      icon: <RocketLaunchIcon sx={{ fontSize: 28 }} />,
      color: '#9C27B0',
      shadowColor: 'rgba(156, 39, 176, 0.3)',
      gradientLight: 'linear-gradient(135deg, rgba(156,39,176,0.12) 0%, rgba(186,104,200,0.06) 100%)',
      gradientDark: 'linear-gradient(135deg, rgba(156,39,176,0.2) 0%, rgba(123,31,162,0.1) 100%)',
      route: ROUTES.AUTOPILOT_DEVICES,
    },
    {
      title: t('navigation.workplaces', { defaultValue: 'Physical Workplaces' }),
      description: t('deviceManagement.workplacesDesc', { defaultValue: 'Manage physical workstations, equipment slots, and workplace assignments' }),
      icon: <BusinessIcon sx={{ fontSize: 28 }} />,
      color: '#009688',
      shadowColor: 'rgba(0, 150, 136, 0.3)',
      gradientLight: 'linear-gradient(135deg, rgba(0,150,136,0.12) 0%, rgba(77,182,172,0.06) 100%)',
      gradientDark: 'linear-gradient(135deg, rgba(0,150,136,0.2) 0%, rgba(0,121,107,0.1) 100%)',
      route: ROUTES.PHYSICAL_WORKPLACES,
    },
  ];

  return (
    <Box>
      {/* Header Card - Scanner style */}
      <Card
        elevation={0}
        sx={{
          mb: 3,
          overflow: 'hidden',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            borderColor: 'primary.main',
            boxShadow: theme.palette.mode === 'dark'
              ? '0 8px 32px rgba(255, 215, 0, 0.2), inset 0 0 24px rgba(255, 215, 0, 0.05)'
              : '0 4px 20px rgba(253, 185, 49, 0.3)',
          },
        }}
      >
        <Box
          sx={{
            px: 3,
            py: 2.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <DevicesIcon
              sx={{
                fontSize: 32,
                color: 'primary.main',
                filter: theme.palette.mode === 'dark'
                  ? 'drop-shadow(0 0 4px rgba(255, 215, 0, 0.5))'
                  : 'none',
              }}
            />
            <Box>
              <Typography variant="h5" component="h1" fontWeight={700}>
                {t('deviceManagement.pageTitle', { defaultValue: 'Device Management' })}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t('deviceManagement.subtitle', { defaultValue: 'Central hub for device lifecycle management' })}
              </Typography>
            </Box>
          </Box>

          {/* Stats badges */}
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Chip
              icon={<InventoryIcon />}
              label={`${totalAssets} assets`}
              sx={{
                fontWeight: 600,
                border: '1px solid',
                borderColor: 'divider',
              }}
            />
          </Box>
        </Box>

      </Card>

      {/* Workplace Widgets Section */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            md: 'repeat(2, 1fr)',
          },
          gap: 2,
          mb: 3,
        }}
      >
        <WorkplaceOccupancyWidget />
        <EquipmentStatusWidget />
        <TodaysRolloutWidget />
        <RecentWorkplaceChangesWidget />
      </Box>

      {/* Navigation Cards Grid */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
          },
          gap: 2,
        }}
      >
        {navigationCards.map((card) => (
          <NavigationCard
            key={card.title}
            title={card.title}
            description={card.description}
            icon={card.icon}
            color={card.color}
            shadowColor={card.shadowColor}
            gradientLight={card.gradientLight}
            gradientDark={card.gradientDark}
            onClick={() => navigate(card.route)}
          />
        ))}
      </Box>
    </Box>
  );
};

export default DeviceManagementPage;

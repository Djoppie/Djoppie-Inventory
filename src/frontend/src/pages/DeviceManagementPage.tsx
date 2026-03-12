import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Card,
  CardContent,
  Typography,
  alpha,
  useTheme,
  Chip,
  Paper,
  Divider,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import DevicesIcon from '@mui/icons-material/Devices';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import LibraryAddIcon from '@mui/icons-material/LibraryAdd';
import CategoryIcon from '@mui/icons-material/Category';
import TerminalIcon from '@mui/icons-material/Terminal';
import InventoryIcon from '@mui/icons-material/Inventory';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Pending';
import ErrorIcon from '@mui/icons-material/Error';
import SyncIcon from '@mui/icons-material/Sync';
import { ROUTES } from '../constants/routes';
import { useAssets } from '../hooks/useAssets';
import { intuneApi } from '../api/intune.api';
import { formatDistanceToNow } from 'date-fns';

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

  // Fetch Autopilot devices with auto-refresh every 30 seconds
  const { data: autopilotDevices, isLoading: autopilotLoading, dataUpdatedAt } = useQuery({
    queryKey: ['autopilot-devices'],
    queryFn: intuneApi.getAutopilotDevices,
    refetchInterval: 30000, // Refresh every 30 seconds
    staleTime: 10000,
  });

  // Calculate asset stats
  const totalAssets = assets?.length || 0;
  const activeAssets = assets?.filter(a => a.status === 'InGebruik').length || 0;
  const newAssets = assets?.filter(a => a.status === 'Nieuw').length || 0;

  // Calculate Autopilot provisioning stats
  const autopilotStats = {
    total: autopilotDevices?.length || 0,
    enrolled: autopilotDevices?.filter(d =>
      d.enrollmentState?.toLowerCase() === 'enrolled' ||
      d.enrollmentState?.toLowerCase() === 'completed'
    ).length || 0,
    pending: autopilotDevices?.filter(d =>
      d.enrollmentState?.toLowerCase() === 'pending' ||
      d.enrollmentState?.toLowerCase() === 'notcontacted' ||
      d.enrollmentState?.toLowerCase() === 'inprogress' ||
      !d.enrollmentState
    ).length || 0,
    failed: autopilotDevices?.filter(d =>
      d.enrollmentState?.toLowerCase() === 'failed' ||
      d.enrollmentState?.toLowerCase() === 'error'
    ).length || 0,
    profileAssigned: autopilotDevices?.filter(d =>
      d.deploymentProfileAssignmentStatus?.toLowerCase() === 'assigned' ||
      d.deploymentProfileAssignmentStatus?.toLowerCase() === 'assignedunknownsyncstate'
    ).length || 0,
  };

  // Get recently contacted devices (last 24 hours)
  // Using useMemo with dataUpdatedAt to avoid impure Date.now() during render
  const recentlyContacted = useMemo(() => {
    const dayAgo = new Date(dataUpdatedAt - 24 * 60 * 60 * 1000);
    return autopilotDevices?.filter(d => {
      if (!d.lastContactedDateTime) return false;
      const lastContact = new Date(d.lastContactedDateTime);
      return lastContact > dayAgo;
    }).slice(0, 5) || [];
  }, [autopilotDevices, dataUpdatedAt]);

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

        {/* Djoppie Terminal */}
        <Paper
          elevation={0}
          sx={{
            m: 2,
            p: 2,
            borderRadius: 2,
            bgcolor: theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.4)' : 'rgba(0, 0, 0, 0.02)',
            border: '1px solid',
            borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 215, 0, 0.2)' : 'divider',
            fontFamily: 'monospace',
          }}
        >
          {/* Terminal Header */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TerminalIcon
                sx={{
                  fontSize: 18,
                  color: 'primary.main',
                  filter: theme.palette.mode === 'dark' ? 'drop-shadow(0 0 4px rgba(255, 215, 0, 0.5))' : 'none',
                }}
              />
              <Typography
                variant="caption"
                sx={{
                  color: 'primary.main',
                  fontWeight: 700,
                  fontFamily: 'monospace',
                  letterSpacing: '0.1em',
                }}
              >
                [DJOPPIE TERMINAL]
              </Typography>
            </Box>
            <Tooltip title={dataUpdatedAt ? `Last updated: ${formatDistanceToNow(dataUpdatedAt)} ago` : 'Loading...'}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <SyncIcon
                  sx={{
                    fontSize: 14,
                    color: autopilotLoading ? 'primary.main' : 'text.secondary',
                    animation: autopilotLoading ? 'spin 1s linear infinite' : 'none',
                    '@keyframes spin': {
                      '0%': { transform: 'rotate(0deg)' },
                      '100%': { transform: 'rotate(360deg)' },
                    },
                  }}
                />
                <Typography variant="caption" color="text.secondary" fontFamily="monospace">
                  {autopilotLoading ? 'SYNCING...' : 'LIVE'}
                </Typography>
              </Box>
            </Tooltip>
          </Box>

          {/* Asset Stats Section */}
          <Typography variant="caption" color="text.secondary" fontFamily="monospace" sx={{ display: 'block', mb: 1 }}>
            &gt; INVENTORY_STATUS:
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 2, pl: 2 }}>
            <Box>
              <Typography variant="caption" color="text.secondary" fontFamily="monospace">
                TOTAL_ASSETS:
              </Typography>
              <Typography variant="body1" fontWeight={700} fontFamily="monospace" sx={{ color: '#4CAF50' }}>
                {totalAssets}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary" fontFamily="monospace">
                ACTIVE_DEVICES:
              </Typography>
              <Typography variant="body1" fontWeight={700} fontFamily="monospace" sx={{ color: '#2196F3' }}>
                {activeAssets}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary" fontFamily="monospace">
                NEW_ASSETS:
              </Typography>
              <Typography variant="body1" fontWeight={700} fontFamily="monospace" sx={{ color: '#00BCD4' }}>
                {newAssets}
              </Typography>
            </Box>
          </Box>

          <Divider sx={{ my: 2, borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 215, 0, 0.1)' : 'divider' }} />

          {/* Autopilot Provisioning Status */}
          <Typography variant="caption" color="text.secondary" fontFamily="monospace" sx={{ display: 'block', mb: 1 }}>
            &gt; AUTOPILOT_PROVISIONING:
          </Typography>
          {autopilotLoading ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, pl: 2 }}>
              <CircularProgress size={16} sx={{ color: 'primary.main' }} />
              <Typography variant="caption" fontFamily="monospace" color="text.secondary">
                Fetching Autopilot data...
              </Typography>
            </Box>
          ) : (
            <Box sx={{ pl: 2 }}>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 2 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" fontFamily="monospace">
                    TOTAL_DEVICES:
                  </Typography>
                  <Typography variant="body1" fontWeight={700} fontFamily="monospace" sx={{ color: '#9C27B0' }}>
                    {autopilotStats.total}
                  </Typography>
                </Box>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <CheckCircleIcon sx={{ fontSize: 14, color: '#4CAF50' }} />
                    <Typography variant="caption" color="text.secondary" fontFamily="monospace">
                      ENROLLED:
                    </Typography>
                  </Box>
                  <Typography variant="body1" fontWeight={700} fontFamily="monospace" sx={{ color: '#4CAF50' }}>
                    {autopilotStats.enrolled}
                  </Typography>
                </Box>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <PendingIcon sx={{ fontSize: 14, color: '#FF9800' }} />
                    <Typography variant="caption" color="text.secondary" fontFamily="monospace">
                      PENDING:
                    </Typography>
                  </Box>
                  <Typography variant="body1" fontWeight={700} fontFamily="monospace" sx={{ color: '#FF9800' }}>
                    {autopilotStats.pending}
                  </Typography>
                </Box>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <ErrorIcon sx={{ fontSize: 14, color: '#F44336' }} />
                    <Typography variant="caption" color="text.secondary" fontFamily="monospace">
                      FAILED:
                    </Typography>
                  </Box>
                  <Typography variant="body1" fontWeight={700} fontFamily="monospace" sx={{ color: '#F44336' }}>
                    {autopilotStats.failed}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" fontFamily="monospace">
                    PROFILE_ASSIGNED:
                  </Typography>
                  <Typography variant="body1" fontWeight={700} fontFamily="monospace" sx={{ color: '#2196F3' }}>
                    {autopilotStats.profileAssigned}
                  </Typography>
                </Box>
              </Box>

              {/* Recent Activity */}
              {recentlyContacted.length > 0 && (
                <>
                  <Typography variant="caption" color="text.secondary" fontFamily="monospace" sx={{ display: 'block', mt: 2, mb: 1 }}>
                    &gt; RECENT_ACTIVITY (24h):
                  </Typography>
                  <Box sx={{
                    maxHeight: 120,
                    overflow: 'auto',
                    bgcolor: theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.02)',
                    borderRadius: 1,
                    p: 1,
                  }}>
                    {recentlyContacted.map((device) => (
                      <Box
                        key={device.id}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          py: 0.5,
                          cursor: 'pointer',
                          '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.1) },
                          borderRadius: 0.5,
                          px: 1,
                        }}
                        onClick={() => device.serialNumber && navigate(`/devices/autopilot/timeline/${device.serialNumber}`)}
                      >
                        <Box
                          sx={{
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            bgcolor: device.enrollmentState?.toLowerCase() === 'enrolled' ? '#4CAF50'
                              : device.enrollmentState?.toLowerCase() === 'failed' ? '#F44336'
                              : '#FF9800',
                          }}
                        />
                        <Typography variant="caption" fontFamily="monospace" sx={{ flex: 1, color: 'text.primary' }}>
                          {device.displayName || device.serialNumber || 'Unknown'}
                        </Typography>
                        <Typography variant="caption" fontFamily="monospace" color="text.secondary">
                          {device.enrollmentState || 'pending'}
                        </Typography>
                        <Typography variant="caption" fontFamily="monospace" color="text.disabled">
                          {device.lastContactedDateTime
                            ? formatDistanceToNow(new Date(device.lastContactedDateTime), { addSuffix: true })
                            : '-'}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </>
              )}
            </Box>
          )}

          <Divider sx={{ my: 2, borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 215, 0, 0.1)' : 'divider' }} />

          {/* Status Line */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                bgcolor: '#4CAF50',
                boxShadow: '0 0 8px rgba(76, 175, 80, 0.5)',
                animation: 'pulse 2s ease-in-out infinite',
                '@keyframes pulse': {
                  '0%, 100%': { opacity: 1 },
                  '50%': { opacity: 0.5 },
                },
              }}
            />
            <Typography variant="caption" fontFamily="monospace" color="text.secondary">
              SYSTEM_STATUS: <span style={{ color: '#4CAF50', fontWeight: 700 }}>ONLINE</span>
            </Typography>
            <Typography variant="caption" fontFamily="monospace" color="text.disabled" sx={{ ml: 'auto' }}>
              Auto-refresh: 30s
            </Typography>
          </Box>
        </Paper>
      </Card>

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

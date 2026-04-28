import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Typography,
  Paper,
  Chip,
  Button,
  Stack,
  useTheme,
  alpha,
  Avatar,
  List,
  ListItem,
  ListItemText,
  Badge,
  LinearProgress,
} from '@mui/material';

// Icons
import InventoryIcon from '@mui/icons-material/Inventory2';
import AddIcon from '@mui/icons-material/Add';
import PlaylistAddIcon from '@mui/icons-material/PlaylistAdd';
import AssessmentIcon from '@mui/icons-material/Assessment';
import ShieldIcon from '@mui/icons-material/Shield';
import WifiOffIcon from '@mui/icons-material/WifiOff';
import MonitorIcon from '@mui/icons-material/Monitor';
import LaptopIcon from '@mui/icons-material/Laptop';
import DesktopWindowsIcon from '@mui/icons-material/DesktopWindows';
import DevicesIcon from '@mui/icons-material/Devices';
import KeyboardIcon from '@mui/icons-material/Keyboard';
import MouseIcon from '@mui/icons-material/Mouse';
import DockIcon from '@mui/icons-material/Dock';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PersonIcon from '@mui/icons-material/Person';
import PlaceIcon from '@mui/icons-material/Place';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { ROUTES, buildRoute } from '../../constants/routes';
import { useAssets } from '../../hooks/useAssets';
import { assetTypesApi } from '../../api/admin.api';
import Loading from '../../components/common/Loading';
import type { AssetType } from '../../types/admin.types';

// Get icon for asset type
const getAssetTypeIcon = (typeCode: string) => {
  const code = typeCode?.toLowerCase() || '';
  if (code.includes('lap')) return LaptopIcon;
  if (code.includes('desk') || code.includes('pc')) return DesktopWindowsIcon;
  if (code.includes('mon') || code.includes('scherm')) return MonitorIcon;
  if (code.includes('dock')) return DockIcon;
  if (code.includes('key') || code.includes('toet')) return KeyboardIcon;
  if (code.includes('mou') || code.includes('muis')) return MouseIcon;
  return DevicesIcon;
};

// Widget card base styles
const widgetSx = {
  borderRadius: 3,
  height: '100%',
  overflow: 'hidden',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  position: 'relative' as const,
  '&:hover': {
    transform: 'translateY(-3px)',
  },
};

// Sub-navigation tab item
interface SubNavItem {
  label: string;
  icon: React.ReactNode;
  path: string;
}

const AssetsPage = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { data: assets, isLoading: assetsLoading, error: assetsError } = useAssets();

  // Fetch asset types for type-based detection (computing devices for lifecycle widget)
  const { data: assetTypes = [] } = useQuery<AssetType[]>({
    queryKey: ['assetTypes'],
    queryFn: () => assetTypesApi.getAll(false),
    staleTime: 300000,
  });

  // Sub-navigation items
  const subNavItems: SubNavItem[] = [
    { label: 'Create Asset', icon: <AddIcon />, path: ROUTES.ASSETS_NEW },
    { label: 'Bulk Create', icon: <PlaylistAddIcon />, path: ROUTES.ASSETS_BULK_NEW },
    { label: 'Reports', icon: <AssessmentIcon />, path: ROUTES.REPORTS },
  ];

  // Calculate widget statistics
  const dashboardData = useMemo(() => {
    if (!assets || !assetTypes) {
      return {
        warrantyExpiring: [],
        warrantyStats: { total: 0, expiringSoon: 0, expired: 0 },
        inactiveDevices: [],
        inactiveStats: { total: 0, count: 0 },
      };
    }

    const now = new Date();
    const fourYearsMs = 4 * 365 * 24 * 60 * 60 * 1000;
    const sixtyDaysMs = 60 * 24 * 60 * 60 * 1000;

    // End of lifecycle (4 years from purchase date) for laptops/desktops
    const computingTypeIds = assetTypes
      .filter(at => {
        const code = at.code?.toLowerCase() || '';
        return code.includes('lap') || code.includes('desk') || code.includes('pc');
      })
      .map(at => at.id);

    const computingAssets = assets.filter(
      a => computingTypeIds.includes(a.assetTypeId || 0) &&
           a.status !== 'UitDienst' &&
           a.purchaseDate
    );

    const warrantyExpiring = computingAssets
      .map(asset => {
        const purchaseDate = new Date(asset.purchaseDate!);
        const lifecycleEnd = new Date(purchaseDate.getTime() + fourYearsMs);
        const daysUntilExpiry = Math.ceil((lifecycleEnd.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
        return {
          asset,
          warrantyEnd: lifecycleEnd,
          daysUntilExpiry,
          isExpired: daysUntilExpiry < 0,
          isExpiringSoon: daysUntilExpiry >= 0 && daysUntilExpiry <= 90,
        };
      })
      .filter(item => item.daysUntilExpiry <= 90)
      .sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry)
      .slice(0, 10);

    const warrantyStats = {
      total: computingAssets.length,
      expiringSoon: computingAssets.filter(a => {
        const purchaseDate = new Date(a.purchaseDate!);
        const lifecycleEnd = new Date(purchaseDate.getTime() + fourYearsMs);
        const days = (lifecycleEnd.getTime() - now.getTime()) / (24 * 60 * 60 * 1000);
        return days >= 0 && days <= 90;
      }).length,
      expired: computingAssets.filter(a => {
        const purchaseDate = new Date(a.purchaseDate!);
        const lifecycleEnd = new Date(purchaseDate.getTime() + fourYearsMs);
        return lifecycleEnd < now;
      }).length,
    };

    // Inactive devices (60+ days since Intune last check-in)
    const inactiveDevices = assets
      .filter(a => {
        if (!a.intuneLastCheckIn) return false;
        if (a.status === 'UitDienst' || a.status === 'Stock') return false;
        const lastCheckIn = new Date(a.intuneLastCheckIn);
        const daysSinceCheckIn = (now.getTime() - lastCheckIn.getTime()) / (24 * 60 * 60 * 1000);
        return daysSinceCheckIn >= 60;
      })
      .map(asset => {
        const lastCheckIn = new Date(asset.intuneLastCheckIn!);
        const daysSinceCheckIn = Math.floor((now.getTime() - lastCheckIn.getTime()) / (24 * 60 * 60 * 1000));
        return { asset, daysSinceCheckIn };
      })
      .sort((a, b) => b.daysSinceCheckIn - a.daysSinceCheckIn)
      .slice(0, 10);

    const intuneAssets = assets.filter(a => a.intuneLastCheckIn && a.status !== 'UitDienst' && a.status !== 'Stock');
    const inactiveStats = {
      total: intuneAssets.length,
      count: intuneAssets.filter(a => {
        const lastCheckIn = new Date(a.intuneLastCheckIn!);
        return (now.getTime() - lastCheckIn.getTime()) >= sixtyDaysMs;
      }).length,
    };

    return {
      warrantyExpiring,
      warrantyStats,
      inactiveDevices,
      inactiveStats,
    };
  }, [assets, assetTypes]);

  if (assetsLoading) {
    return <Loading message="Loading asset dashboard..." />;
  }

  if (assetsError) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="error">Error loading assets: {assetsError.message}</Typography>
      </Box>
    );
  }

  const totalAssets = assets?.length ?? 0;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Header with Sub-Navigation */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: 3,
          overflow: 'hidden',
          bgcolor: isDark ? 'var(--dark-bg-elevated)' : 'background.paper',
          boxShadow: isDark ? 'var(--neu-shadow-dark-md)' : 'var(--neu-shadow-light-md)',
        }}
      >
        {/* Top gradient accent bar */}
        <Box
          sx={{
            height: 4,
            background: 'linear-gradient(90deg, #FF7700 0%, #FF9933 50%, #FFB366 100%)',
          }}
        />

        <Box sx={{ p: 3 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 56,
                  height: 56,
                  borderRadius: 3,
                  bgcolor: alpha('#FF7700', 0.12),
                  border: '2px solid',
                  borderColor: alpha('#FF7700', 0.2),
                }}
              >
                <InventoryIcon sx={{ fontSize: 32, color: '#FF7700' }} />
              </Box>
              <Box>
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 800,
                    background: isDark
                      ? 'linear-gradient(135deg, #FFFFFF 0%, #FF9933 100%)'
                      : 'linear-gradient(135deg, #1a1a2e 0%, #FF7700 100%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  Asset Dashboard
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  {totalAssets} assets in totaal
                </Typography>
              </Box>
            </Box>

            {/* Sub-Navigation Buttons */}
            <Stack direction="row" spacing={1.5}>
              {subNavItems.map((item) => (
                <Button
                  key={item.path}
                  variant="outlined"
                  startIcon={item.icon}
                  onClick={() => navigate(item.path)}
                  sx={{
                    borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)',
                    color: 'text.primary',
                    fontWeight: 600,
                    px: 2,
                    py: 1,
                    '&:hover': {
                      borderColor: '#FF7700',
                      bgcolor: alpha('#FF7700', 0.08),
                      color: '#FF7700',
                    },
                  }}
                >
                  {item.label}
                </Button>
              ))}
            </Stack>
          </Stack>
        </Box>
      </Paper>

      {/* Main Widgets Grid */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            lg: 'repeat(2, 1fr)',
          },
          gap: 3,
        }}
      >
        {/* Widget: End of Lifecycle */}
        <Paper
          elevation={0}
          sx={{
            ...widgetSx,
            bgcolor: isDark ? 'var(--dark-bg-elevated)' : 'background.paper',
            boxShadow: isDark ? 'var(--neu-shadow-dark-md)' : 'var(--neu-shadow-light-md)',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 4,
              background: 'linear-gradient(90deg, #F59E0B, #EAB308)',
            },
          }}
        >
          <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
              <Avatar sx={{ bgcolor: alpha('#EAB308', 0.12), width: 44, height: 44 }}>
                <ShieldIcon sx={{ color: '#EAB308' }} />
              </Avatar>
              <Box>
                <Typography variant="h6" fontWeight={700}>
                  Einde Levenscyclus
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Laptops & Desktops (4 jaar levenscyclus)
                </Typography>
              </Box>
            </Box>

            {/* KPI Summary */}
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 2,
                mb: 2,
                p: 2,
                borderRadius: 2,
                bgcolor: isDark ? 'rgba(234, 179, 8, 0.05)' : 'rgba(234, 179, 8, 0.05)',
              }}
            >
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h5" fontWeight={800} color="#EAB308">
                  {dashboardData.warrantyStats.expiringSoon}
                </Typography>
                <Typography variant="caption" color="text.secondary">Bijna verlopen</Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h5" fontWeight={800} color="#EF4444">
                  {dashboardData.warrantyStats.expired}
                </Typography>
                <Typography variant="caption" color="text.secondary">Verlopen</Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h5" fontWeight={800} color="text.secondary">
                  {dashboardData.warrantyStats.total}
                </Typography>
                <Typography variant="caption" color="text.secondary">Totaal tracked</Typography>
              </Box>
            </Box>

            {/* Asset List */}
            {dashboardData.warrantyExpiring.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <CheckCircleIcon sx={{ fontSize: 48, color: '#22c55e', opacity: 0.5, mb: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  Geen levenscyclus verloopt binnen 90 dagen
                </Typography>
              </Box>
            ) : (
              <List dense disablePadding sx={{ maxHeight: 280, overflow: 'auto' }}>
                {dashboardData.warrantyExpiring.map(({ asset, daysUntilExpiry, isExpired }) => {
                  const Icon = getAssetTypeIcon(asset.assetType?.code || '');
                  return (
                    <ListItem
                      key={asset.id}
                      sx={{
                        px: 1.5,
                        py: 1,
                        borderRadius: 1,
                        mb: 0.5,
                        cursor: 'pointer',
                        '&:hover': { bgcolor: alpha('#EAB308', 0.08) },
                      }}
                      onClick={() => navigate(buildRoute.assetDetail(asset.id))}
                    >
                      <Icon sx={{ fontSize: 20, color: 'text.secondary', mr: 1.5 }} />
                      <ListItemText
                        primaryTypographyProps={{ component: 'div' }}
                        secondaryTypographyProps={{ component: 'div' }}
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2" fontWeight={600}>
                              {asset.assetCode}
                            </Typography>
                            {asset.physicalWorkplace && (
                              <Chip
                                icon={<PlaceIcon sx={{ fontSize: '0.75rem !important' }} />}
                                label={asset.physicalWorkplace.name}
                                size="small"
                                sx={{ height: 20, fontSize: '0.65rem' }}
                              />
                            )}
                          </Box>
                        }
                        secondary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                            <Typography variant="caption" color="text.secondary">
                              {asset.brand} {asset.model}
                            </Typography>
                            {asset.owner && (
                              <>
                                <Typography variant="caption" color="text.secondary">•</Typography>
                                <PersonIcon sx={{ fontSize: 12, color: 'text.secondary' }} />
                                <Typography variant="caption" color="text.secondary">
                                  {asset.owner}
                                </Typography>
                              </>
                            )}
                          </Box>
                        }
                      />
                      <Chip
                        label={isExpired ? 'Verlopen' : `${daysUntilExpiry}d`}
                        size="small"
                        sx={{
                          fontWeight: 700,
                          bgcolor: isExpired ? alpha('#EF4444', 0.15) : alpha('#EAB308', 0.15),
                          color: isExpired ? '#EF4444' : '#EAB308',
                        }}
                      />
                    </ListItem>
                  );
                })}
              </List>
            )}
          </Box>
        </Paper>

        {/* Widget: Inactive Devices (60+ days) */}
        <Paper
          elevation={0}
          sx={{
            ...widgetSx,
            bgcolor: isDark ? 'var(--dark-bg-elevated)' : 'background.paper',
            boxShadow: isDark ? 'var(--neu-shadow-dark-md)' : 'var(--neu-shadow-light-md)',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 4,
              background: 'linear-gradient(90deg, #EF4444, #F87171)',
            },
          }}
        >
          <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
              <Avatar sx={{ bgcolor: alpha('#EF4444', 0.12), width: 44, height: 44 }}>
                <WifiOffIcon sx={{ color: '#EF4444' }} />
              </Avatar>
              <Box>
                <Typography variant="h6" fontWeight={700}>
                  Inactieve Apparaten
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  60+ dagen geen Intune check-in
                </Typography>
              </Box>
              <Badge
                badgeContent={dashboardData.inactiveStats.count}
                color="error"
                sx={{ ml: 'auto' }}
              >
                <Box />
              </Badge>
            </Box>

            {/* KPI Summary */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                mb: 2,
                p: 2,
                borderRadius: 2,
                bgcolor: isDark ? 'rgba(239, 68, 68, 0.05)' : 'rgba(239, 68, 68, 0.05)',
              }}
            >
              <Box>
                <Typography variant="h4" fontWeight={800} color="#EF4444">
                  {dashboardData.inactiveStats.count}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  van {dashboardData.inactiveStats.total} getrackte apparaten
                </Typography>
              </Box>
              <Box sx={{ width: 100 }}>
                <LinearProgress
                  variant="determinate"
                  value={dashboardData.inactiveStats.total > 0 ? (dashboardData.inactiveStats.count / dashboardData.inactiveStats.total) * 100 : 0}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    bgcolor: alpha('#EF4444', 0.15),
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 4,
                      bgcolor: '#EF4444',
                    },
                  }}
                />
              </Box>
            </Box>

            {/* Asset List */}
            {dashboardData.inactiveDevices.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <CheckCircleIcon sx={{ fontSize: 48, color: '#22c55e', opacity: 0.5, mb: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  Alle apparaten zijn recent actief
                </Typography>
              </Box>
            ) : (
              <List dense disablePadding sx={{ maxHeight: 240, overflow: 'auto' }}>
                {dashboardData.inactiveDevices.map(({ asset, daysSinceCheckIn }) => {
                  const Icon = getAssetTypeIcon(asset.assetType?.code || '');
                  return (
                    <ListItem
                      key={asset.id}
                      sx={{
                        px: 1.5,
                        py: 1,
                        borderRadius: 1,
                        mb: 0.5,
                        cursor: 'pointer',
                        '&:hover': { bgcolor: alpha('#EF4444', 0.08) },
                      }}
                      onClick={() => navigate(buildRoute.assetDetail(asset.id))}
                    >
                      <Icon sx={{ fontSize: 20, color: 'text.secondary', mr: 1.5 }} />
                      <ListItemText
                        primaryTypographyProps={{ component: 'div' }}
                        secondaryTypographyProps={{ component: 'div' }}
                        primary={
                          <Typography variant="body2" fontWeight={600}>
                            {asset.assetCode} {asset.serialNumber && `- ${asset.serialNumber}`}
                          </Typography>
                        }
                        secondary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                            {asset.physicalWorkplace && (
                              <>
                                <PlaceIcon sx={{ fontSize: 12, color: 'text.secondary' }} />
                                <Typography variant="caption" color="text.secondary">
                                  {asset.physicalWorkplace.name}
                                </Typography>
                              </>
                            )}
                            {asset.owner && (
                              <>
                                <PersonIcon sx={{ fontSize: 12, color: 'text.secondary' }} />
                                <Typography variant="caption" color="text.secondary">
                                  {asset.owner}
                                </Typography>
                              </>
                            )}
                          </Box>
                        }
                      />
                      <Chip
                        icon={<AccessTimeIcon sx={{ fontSize: '0.85rem !important' }} />}
                        label={`${daysSinceCheckIn}d`}
                        size="small"
                        sx={{
                          fontWeight: 700,
                          bgcolor: alpha('#EF4444', daysSinceCheckIn > 90 ? 0.2 : 0.12),
                          color: '#EF4444',
                        }}
                      />
                    </ListItem>
                  );
                })}
              </List>
            )}
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default AssetsPage;

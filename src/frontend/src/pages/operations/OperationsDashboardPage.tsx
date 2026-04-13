import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
  LinearProgress,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import SettingsApplicationsIcon from '@mui/icons-material/SettingsApplications';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PersonRemoveIcon from '@mui/icons-material/PersonRemove';
import InventoryIcon from '@mui/icons-material/Inventory2';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import ScheduleIcon from '@mui/icons-material/Schedule';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ComputerIcon from '@mui/icons-material/Computer';
import EventIcon from '@mui/icons-material/Event';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import StorageIcon from '@mui/icons-material/Storage';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import AssignmentIcon from '@mui/icons-material/Assignment';
import { ROUTES, buildRoute } from '../../constants/routes';
import { useAssets } from '../../hooks/useAssets';
import { useRolloutSessions } from '../../hooks/rollout';
import Loading from '../../components/common/Loading';

// Widget card styles
const widgetCardSx = {
  borderRadius: 3,
  height: '100%',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    transform: 'translateY(-2px)',
  },
};

const OperationsDashboardPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  // Fetch data
  const { data: assets, isLoading: assetsLoading } = useAssets();
  const { data: rolloutSessions, isLoading: rolloutsLoading } = useRolloutSessions();

  const isLoading = assetsLoading || rolloutsLoading;

  // Calculate asset statistics for operations
  const assetStats = useMemo(() => {
    if (!assets) return { stock: 0, new: 0, inUse: 0, uitDienst: 0 };

    return {
      stock: assets.filter(a => a.status === 'Stock').length,
      new: assets.filter(a => a.status === 'Nieuw').length,
      inUse: assets.filter(a => a.status === 'InGebruik').length,
      uitDienst: assets.filter(a => a.status === 'UitDienst').length,
    };
  }, [assets]);

  // Group new assets by asset type for the widget
  const newAssetsByType = useMemo(() => {
    if (!assets) return [];

    const newAssets = assets.filter(a => a.status === 'Nieuw');
    const grouped = newAssets.reduce((acc, asset) => {
      const typeName = asset.assetType?.name || asset.category || 'Overig';
      if (!acc[typeName]) {
        acc[typeName] = { name: typeName, count: 0, assets: [] };
      }
      acc[typeName].count++;
      acc[typeName].assets.push(asset);
      return acc;
    }, {} as Record<string, { name: string; count: number; assets: typeof assets }>);

    return Object.values(grouped).sort((a, b) => b.count - a.count);
  }, [assets]);

  // Get new laptops and desktops
  const newLaptopsDesktops = useMemo(() => {
    if (!assets) return [];

    return assets
      .filter(a => a.status === 'Nieuw' && (
        a.category?.toLowerCase().includes('laptop') ||
        a.category?.toLowerCase().includes('desktop') ||
        a.category?.toLowerCase().includes('computer') ||
        a.assetType?.name?.toLowerCase().includes('laptop') ||
        a.assetType?.name?.toLowerCase().includes('desktop') ||
        a.assetType?.name?.toLowerCase().includes('computer')
      ))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [assets]);

  // Get laptops/desktops that are UitDienst (end of lease, return to supplier)
  const endOfLeaseLaptops = useMemo(() => {
    if (!assets) return [];

    return assets
      .filter(a => a.status === 'UitDienst' && (
        a.category?.toLowerCase().includes('laptop') ||
        a.category?.toLowerCase().includes('desktop') ||
        a.category?.toLowerCase().includes('computer') ||
        a.assetType?.name?.toLowerCase().includes('laptop') ||
        a.assetType?.name?.toLowerCase().includes('desktop') ||
        a.assetType?.name?.toLowerCase().includes('computer')
      ))
      .sort((a, b) => {
        // Sort by lease end date if available, otherwise by updated date
        const dateA = a.leaseEndDate ? new Date(a.leaseEndDate).getTime() : new Date(a.updatedAt).getTime();
        const dateB = b.leaseEndDate ? new Date(b.leaseEndDate).getTime() : new Date(b.updatedAt).getTime();
        return dateA - dateB;
      });
  }, [assets]);

  // Get devices expiring within 1 month (lease ending soon)
  const expiringLeaseDevices = useMemo(() => {
    if (!assets) return [];

    const now = new Date();
    const oneMonthFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    return assets
      .filter(a => {
        if (!a.leaseEndDate) return false;
        // Only include devices that are still in use (not already UitDienst)
        if (a.status === 'UitDienst') return false;

        const leaseEnd = new Date(a.leaseEndDate);
        // Lease ends within the next month
        return leaseEnd >= now && leaseEnd <= oneMonthFromNow;
      })
      .sort((a, b) => new Date(a.leaseEndDate!).getTime() - new Date(b.leaseEndDate!).getTime());
  }, [assets]);

  // Calculate rollout statistics
  const rolloutStats = useMemo(() => {
    if (!rolloutSessions) return { active: 0, planning: 0, completed: 0, totalWorkplaces: 0, completedWorkplaces: 0 };

    const active = rolloutSessions.filter(s => s.status === 'InProgress');
    const planning = rolloutSessions.filter(s => s.status === 'Planning' || s.status === 'Ready');
    const completed = rolloutSessions.filter(s => s.status === 'Completed');

    return {
      active: active.length,
      planning: planning.length,
      completed: completed.length,
      totalWorkplaces: rolloutSessions.reduce((acc, s) => acc + s.totalWorkplaces, 0),
      completedWorkplaces: rolloutSessions.reduce((acc, s) => acc + s.completedWorkplaces, 0),
    };
  }, [rolloutSessions]);

  // Get active rollout sessions for the list
  const activeRollouts = useMemo(() => {
    if (!rolloutSessions) return [];
    return rolloutSessions
      .filter(s => s.status === 'InProgress' || s.status === 'Planning' || s.status === 'Ready')
      .sort((a, b) => new Date(a.plannedStartDate).getTime() - new Date(b.plannedStartDate).getTime())
      .slice(0, 5);
  }, [rolloutSessions]);

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('nl-NL', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  // Format asset display - Primary: AssetCode - SerieNummer (workplace - bezetter)
  const formatAssetPrimary = (asset: { assetCode: string; serialNumber?: string | null; physicalWorkplace?: { name: string } | null; owner?: string | null }) => {
    const codeSn = [asset.assetCode, asset.serialNumber].filter(Boolean).join(' - ');
    const location = [asset.physicalWorkplace?.name, asset.owner].filter(Boolean).join(' - ');
    return location ? `${codeSn} (${location})` : codeSn;
  };

  // Format asset display - Secondary: type -- Brand Model
  const formatAssetSecondary = (asset: { category?: string | null; assetType?: { name: string } | null; brand?: string | null; model?: string | null }) => {
    const type = asset.assetType?.name || asset.category || '';
    const brandModel = [asset.brand, asset.model].filter(Boolean).join(' ');
    return [type, brandModel].filter(Boolean).join(' -- ') || '-';
  };

  if (isLoading) {
    return <Loading message="Loading operations data..." />;
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      {/* Header */}
      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          borderRadius: 3,
          bgcolor: isDark ? 'var(--dark-bg-elevated)' : 'background.paper',
          boxShadow: isDark ? 'var(--neu-shadow-dark-md)' : 'var(--neu-shadow-light-md)',
        }}
      >
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
                bgcolor: alpha('#8B5CF6', 0.12),
              }}
            >
              <SettingsApplicationsIcon sx={{ fontSize: 32, color: '#8B5CF6' }} />
            </Box>
            <Box>
              <Typography variant="h4" fontWeight={800}>
                Operations Dashboard
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Overzicht van rollouts, onboarding en offboarding
              </Typography>
            </Box>
          </Box>
          <Stack direction="row" spacing={1.5}>
            <Button
              variant="outlined"
              startIcon={<RocketLaunchIcon />}
              onClick={() => navigate(ROUTES.ROLLOUTS)}
              sx={{
                borderColor: '#FF7700',
                color: '#FF7700',
                fontWeight: 600,
                '&:hover': { borderColor: '#e66a00', bgcolor: alpha('#FF7700', 0.08) },
              }}
            >
              Rollouts
            </Button>
            <Button
              variant="contained"
              startIcon={<PersonAddIcon />}
              onClick={() => navigate(ROUTES.ROLLOUTS_NEW)}
              sx={{
                bgcolor: '#8B5CF6',
                fontWeight: 700,
                '&:hover': { bgcolor: '#7C3AED' },
              }}
            >
              Nieuwe Rollout
            </Button>
          </Stack>
        </Stack>
      </Paper>

      {/* KPI Cards */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: 'repeat(2, 1fr)',
            sm: 'repeat(3, 1fr)',
            lg: 'repeat(6, 1fr)',
          },
          gap: 2,
        }}
      >
        {[
          { label: 'Actieve Rollouts', value: rolloutStats.active, color: '#22c55e', icon: <PlayArrowIcon /> },
          { label: 'In Planning', value: rolloutStats.planning, color: '#FF7700', icon: <ScheduleIcon /> },
          { label: 'Voltooid', value: rolloutStats.completed, color: '#3B82F6', icon: <CheckCircleIcon /> },
          { label: 'Nieuwe Assets', value: assetStats.new, color: '#06B6D4', icon: <InventoryIcon /> },
          { label: 'Stock Assets', value: assetStats.stock, color: '#8B5CF6', icon: <StorageIcon /> },
          { label: 'Uit Dienst', value: assetStats.uitDienst, color: '#EF4444', icon: <PersonRemoveIcon /> },
        ].map((kpi) => (
          <Paper
            key={kpi.label}
            elevation={0}
            sx={{
              p: 2,
              borderRadius: 2,
              bgcolor: isDark ? 'var(--dark-bg-elevated)' : 'background.paper',
              boxShadow: isDark ? 'var(--neu-shadow-dark-sm)' : 'var(--neu-shadow-light-sm)',
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              borderLeft: `4px solid ${kpi.color}`,
            }}
          >
            <Box sx={{ color: kpi.color, display: 'flex' }}>
              {kpi.icon}
            </Box>
            <Box>
              <Typography variant="h5" fontWeight={800} sx={{ color: kpi.color, lineHeight: 1 }}>
                {kpi.value}
              </Typography>
              <Typography variant="caption" color="text.secondary" fontWeight={500}>
                {kpi.label}
              </Typography>
            </Box>
          </Paper>
        ))}
      </Box>

      {/* === SECTION 1: OPERATIONS === */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            lg: '2fr 1fr',
          },
          gap: 2.5,
        }}
      >
        {/* Active Rollouts */}
        <Paper
          elevation={0}
          sx={{
            ...widgetCardSx,
            bgcolor: isDark ? 'var(--dark-bg-elevated)' : 'background.paper',
            boxShadow: isDark ? 'var(--neu-shadow-dark-md)' : 'var(--neu-shadow-light-md)',
          }}
        >
          <Box sx={{ p: 2.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Avatar sx={{ bgcolor: alpha('#FF7700', 0.12), width: 40, height: 40 }}>
                  <RocketLaunchIcon sx={{ color: '#FF7700' }} />
                </Avatar>
                <Box>
                  <Typography variant="subtitle1" fontWeight={700}>
                    Actieve Rollouts
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Lopende en geplande sessies
                  </Typography>
                </Box>
              </Box>
              <Button
                size="small"
                endIcon={<ArrowForwardIcon />}
                onClick={() => navigate(ROUTES.ROLLOUTS)}
                sx={{ color: '#FF7700', fontWeight: 600 }}
              >
                Alle
              </Button>
            </Box>

            {activeRollouts.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <RocketLaunchIcon sx={{ fontSize: 48, color: 'text.secondary', opacity: 0.3, mb: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  Geen actieve rollouts
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<PersonAddIcon />}
                  onClick={() => navigate(ROUTES.ROLLOUTS_NEW)}
                  sx={{ mt: 2, borderColor: '#FF7700', color: '#FF7700' }}
                >
                  Nieuwe Rollout Starten
                </Button>
              </Box>
            ) : (
              <List dense disablePadding>
                {activeRollouts.map((session) => (
                  <ListItem
                    key={session.id}
                    sx={{
                      px: 1.5,
                      py: 1.5,
                      borderRadius: 2,
                      mb: 1,
                      cursor: 'pointer',
                      bgcolor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
                      '&:hover': { bgcolor: alpha('#FF7700', 0.08) },
                    }}
                    onClick={() => navigate(buildRoute.rolloutEdit(session.id))}
                  >
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography fontWeight={600}>{session.sessionName}</Typography>
                          <Chip
                            label={session.status === 'InProgress' ? 'Actief' : session.status === 'Planning' ? 'Planning' : 'Klaar'}
                            size="small"
                            color={session.status === 'InProgress' ? 'success' : session.status === 'Planning' ? 'warning' : 'info'}
                            sx={{ fontWeight: 600, height: 20 }}
                          />
                        </Box>
                      }
                      primaryTypographyProps={{ component: 'div' }}
                      secondary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 0.5 }}>
                          <Typography variant="caption" color="text.secondary">
                            <EventIcon sx={{ fontSize: 12, mr: 0.5, verticalAlign: 'middle' }} />
                            {formatDate(session.plannedStartDate)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            <SwapHorizIcon sx={{ fontSize: 12, mr: 0.5, verticalAlign: 'middle' }} />
                            {session.completedWorkplaces}/{session.totalWorkplaces} swaps
                          </Typography>
                        </Box>
                      }
                      secondaryTypographyProps={{ component: 'div' }}
                    />
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="h6" fontWeight={700} color={session.completionPercentage === 100 ? '#22c55e' : '#FF7700'}>
                        {session.completionPercentage}%
                      </Typography>
                    </Box>
                  </ListItem>
                ))}
              </List>
            )}
          </Box>
        </Paper>

        {/* Quick Actions */}
        <Paper
          elevation={0}
          sx={{
            ...widgetCardSx,
            bgcolor: isDark ? 'var(--dark-bg-elevated)' : 'background.paper',
            boxShadow: isDark ? 'var(--neu-shadow-dark-md)' : 'var(--neu-shadow-light-md)',
          }}
        >
          <Box sx={{ p: 2.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
              <Avatar sx={{ bgcolor: alpha('#8B5CF6', 0.12), width: 40, height: 40 }}>
                <AssignmentIcon sx={{ color: '#8B5CF6' }} />
              </Avatar>
              <Box>
                <Typography variant="subtitle1" fontWeight={700}>
                  Snelle Acties
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Veelgebruikte operaties
                </Typography>
              </Box>
            </Box>

            <Stack spacing={1.5}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<RocketLaunchIcon />}
                onClick={() => navigate(ROUTES.ROLLOUTS_NEW)}
                sx={{
                  justifyContent: 'flex-start',
                  py: 1.5,
                  borderColor: 'divider',
                  color: 'text.primary',
                  fontWeight: 600,
                  '&:hover': { borderColor: '#FF7700', bgcolor: alpha('#FF7700', 0.08) },
                }}
              >
                Nieuwe Rollout Sessie
              </Button>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<SwapHorizIcon />}
                onClick={() => navigate(ROUTES.LAPTOP_SWAP)}
                sx={{
                  justifyContent: 'flex-start',
                  py: 1.5,
                  borderColor: 'divider',
                  color: 'text.primary',
                  fontWeight: 600,
                  '&:hover': { borderColor: '#3B82F6', bgcolor: alpha('#3B82F6', 0.08) },
                }}
              >
                Device Swap Uitvoeren
              </Button>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<PersonAddIcon />}
                onClick={() => navigate(ROUTES.REQUESTS_ONBOARDING)}
                sx={{
                  justifyContent: 'flex-start',
                  py: 1.5,
                  borderColor: 'divider',
                  color: 'text.primary',
                  fontWeight: 600,
                  '&:hover': { borderColor: '#22c55e', bgcolor: alpha('#22c55e', 0.08) },
                }}
              >
                Onboarding Aanvraag
              </Button>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<PersonRemoveIcon />}
                onClick={() => navigate(ROUTES.REQUESTS_OFFBOARDING)}
                sx={{
                  justifyContent: 'flex-start',
                  py: 1.5,
                  borderColor: 'divider',
                  color: 'text.primary',
                  fontWeight: 600,
                  '&:hover': { borderColor: '#EF4444', bgcolor: alpha('#EF4444', 0.08) },
                }}
              >
                Offboarding Aanvraag
              </Button>
            </Stack>
          </Box>
        </Paper>
      </Box>

      {/* === SECTION 2: ONBOARDING - NEW ASSETS === */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            lg: 'repeat(2, 1fr)',
          },
          gap: 2.5,
        }}
      >
        {/* Nieuwe Assets per Type */}
        <Paper
          elevation={0}
          sx={{
            ...widgetCardSx,
            bgcolor: isDark ? 'var(--dark-bg-elevated)' : 'background.paper',
            boxShadow: isDark ? 'var(--neu-shadow-dark-md)' : 'var(--neu-shadow-light-md)',
          }}
        >
          <Box sx={{ p: 2.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Avatar sx={{ bgcolor: alpha('#06B6D4', 0.12), width: 40, height: 40 }}>
                  <InventoryIcon sx={{ color: '#06B6D4' }} />
                </Avatar>
                <Box>
                  <Typography variant="subtitle1" fontWeight={700}>
                    Nieuwe Assets
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Klaar voor toewijzing per type
                  </Typography>
                </Box>
              </Box>
              <Chip
                label={assetStats.new}
                size="small"
                sx={{ bgcolor: alpha('#06B6D4', 0.12), color: '#06B6D4', fontWeight: 700 }}
              />
            </Box>

            {newAssetsByType.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <InventoryIcon sx={{ fontSize: 48, color: 'text.secondary', opacity: 0.3, mb: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  Geen nieuwe assets beschikbaar
                </Typography>
              </Box>
            ) : (
              <Stack spacing={1}>
                {newAssetsByType.slice(0, 6).map((typeGroup, index) => {
                  const colors = ['#06B6D4', '#3B82F6', '#8B5CF6', '#22c55e', '#FF7700', '#EC4899'];
                  const color = colors[index % colors.length];
                  return (
                    <Box
                      key={typeGroup.name}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        p: 1.5,
                        borderRadius: 2,
                        bgcolor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.03)',
                        borderLeft: `4px solid ${color}`,
                      }}
                    >
                      <Typography variant="body2" fontWeight={600}>
                        {typeGroup.name}
                      </Typography>
                      <Chip
                        label={typeGroup.count}
                        size="small"
                        sx={{ bgcolor: alpha(color, 0.12), color: color, fontWeight: 700, minWidth: 40 }}
                      />
                    </Box>
                  );
                })}
                {newAssetsByType.length > 6 && (
                  <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center', pt: 1 }}>
                    + {newAssetsByType.length - 6} meer types
                  </Typography>
                )}
              </Stack>
            )}
          </Box>
        </Paper>

        {/* Nieuwe Laptops & Desktops */}
        <Paper
          elevation={0}
          sx={{
            ...widgetCardSx,
            bgcolor: isDark ? 'var(--dark-bg-elevated)' : 'background.paper',
            boxShadow: isDark ? 'var(--neu-shadow-dark-md)' : 'var(--neu-shadow-light-md)',
          }}
        >
          <Box sx={{ p: 2.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Avatar sx={{ bgcolor: alpha('#22c55e', 0.12), width: 40, height: 40 }}>
                  <ComputerIcon sx={{ color: '#22c55e' }} />
                </Avatar>
                <Box>
                  <Typography variant="subtitle1" fontWeight={700}>
                    Nieuwe Laptops & Desktops
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Klaar voor onboarding
                  </Typography>
                </Box>
              </Box>
              {newLaptopsDesktops.length > 0 && (
                <Chip
                  label={newLaptopsDesktops.length}
                  size="small"
                  color="success"
                  sx={{ fontWeight: 700 }}
                />
              )}
            </Box>

            {newLaptopsDesktops.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <ComputerIcon sx={{ fontSize: 48, color: '#22c55e', opacity: 0.3, mb: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  Geen nieuwe laptops of desktops beschikbaar
                </Typography>
              </Box>
            ) : (
              <List
                dense
                disablePadding
                sx={{
                  maxHeight: 5 * 52, // ~5 items
                  overflowY: 'auto',
                  '&::-webkit-scrollbar': { width: 6 },
                  '&::-webkit-scrollbar-thumb': { bgcolor: alpha('#22c55e', 0.3), borderRadius: 3 },
                }}
              >
                {newLaptopsDesktops.map((asset) => (
                  <ListItem
                    key={asset.id}
                    sx={{
                      px: 1.5,
                      py: 1,
                      borderRadius: 1,
                      mb: 0.5,
                      cursor: 'pointer',
                      '&:hover': { bgcolor: alpha('#22c55e', 0.08) },
                    }}
                    onClick={() => navigate(buildRoute.assetDetail(asset.id))}
                  >
                    <ListItemText
                      primary={formatAssetPrimary(asset)}
                      secondary={formatAssetSecondary(asset)}
                      primaryTypographyProps={{ fontWeight: 600, fontSize: '0.875rem' }}
                      secondaryTypographyProps={{ fontSize: '0.7rem', color: 'text.secondary' }}
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </Box>
        </Paper>
      </Box>

      {/* === SECTION 3: LEASE MANAGEMENT === */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            lg: 'repeat(2, 1fr)',
          },
          gap: 2.5,
        }}
      >
        {/* Lease Verloopt Binnen 1 Maand */}
        <Paper
          elevation={0}
          sx={{
            ...widgetCardSx,
            bgcolor: isDark ? 'var(--dark-bg-elevated)' : 'background.paper',
            boxShadow: isDark ? 'var(--neu-shadow-dark-md)' : 'var(--neu-shadow-light-md)',
          }}
        >
          <Box sx={{ p: 2.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Avatar sx={{ bgcolor: alpha('#F59E0B', 0.12), width: 40, height: 40 }}>
                  <WarningAmberIcon sx={{ color: '#F59E0B' }} />
                </Avatar>
                <Box>
                  <Typography variant="subtitle1" fontWeight={700}>
                    Lease Verloopt Binnenkort
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Binnen 1 maand einde lease
                  </Typography>
                </Box>
              </Box>
              {expiringLeaseDevices.length > 0 && (
                <Chip
                  label={expiringLeaseDevices.length}
                  size="small"
                  sx={{ bgcolor: alpha('#F59E0B', 0.12), color: '#F59E0B', fontWeight: 700 }}
                />
              )}
            </Box>

            {expiringLeaseDevices.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <CheckCircleIcon sx={{ fontSize: 48, color: '#22c55e', opacity: 0.5, mb: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  Geen devices met aflopende lease
                </Typography>
              </Box>
            ) : (
              <List
                dense
                disablePadding
                sx={{
                  maxHeight: 5 * 56, // ~5 items
                  overflowY: 'auto',
                  '&::-webkit-scrollbar': { width: 6 },
                  '&::-webkit-scrollbar-thumb': { bgcolor: alpha('#F59E0B', 0.3), borderRadius: 3 },
                }}
              >
                {expiringLeaseDevices.map((asset) => {
                  const daysUntilExpiry = asset.leaseEndDate
                    ? Math.ceil((new Date(asset.leaseEndDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                    : 0;
                  return (
                    <ListItem
                      key={asset.id}
                      sx={{
                        px: 1.5,
                        py: 1,
                        borderRadius: 1,
                        mb: 0.5,
                        cursor: 'pointer',
                        bgcolor: daysUntilExpiry <= 7 ? alpha('#F59E0B', 0.08) : 'transparent',
                        '&:hover': { bgcolor: alpha('#F59E0B', 0.12) },
                      }}
                      onClick={() => navigate(buildRoute.assetDetail(asset.id))}
                    >
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography fontWeight={600} fontSize="0.875rem">
                              {formatAssetPrimary(asset)}
                            </Typography>
                            {daysUntilExpiry <= 7 && (
                              <WarningAmberIcon sx={{ fontSize: 16, color: '#EF4444' }} />
                            )}
                          </Box>
                        }
                        secondary={formatAssetSecondary(asset)}
                        secondaryTypographyProps={{ fontSize: '0.7rem', color: 'text.secondary' }}
                      />
                      <Box sx={{ textAlign: 'right' }}>
                        <Chip
                          label={`${daysUntilExpiry}d`}
                          size="small"
                          sx={{
                            bgcolor: alpha(daysUntilExpiry <= 7 ? '#EF4444' : '#F59E0B', 0.12),
                            color: daysUntilExpiry <= 7 ? '#EF4444' : '#F59E0B',
                            fontWeight: 700,
                            minWidth: 40,
                          }}
                        />
                        <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>
                          {formatDate(asset.leaseEndDate!)}
                        </Typography>
                      </Box>
                    </ListItem>
                  );
                })}
              </List>
            )}
          </Box>
        </Paper>

        {/* Einde Lease - Retour Leverancier */}
        <Paper
          elevation={0}
          sx={{
            ...widgetCardSx,
            bgcolor: isDark ? 'var(--dark-bg-elevated)' : 'background.paper',
            boxShadow: isDark ? 'var(--neu-shadow-dark-md)' : 'var(--neu-shadow-light-md)',
          }}
        >
          <Box sx={{ p: 2.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Avatar sx={{ bgcolor: alpha('#EF4444', 0.12), width: 40, height: 40 }}>
                  <PersonRemoveIcon sx={{ color: '#EF4444' }} />
                </Avatar>
                <Box>
                  <Typography variant="subtitle1" fontWeight={700}>
                    Einde Lease - Retour
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Terug te sturen naar leverancier
                  </Typography>
                </Box>
              </Box>
              {endOfLeaseLaptops.length > 0 && (
                <Chip
                  label={endOfLeaseLaptops.length}
                  size="small"
                  sx={{ bgcolor: alpha('#EF4444', 0.12), color: '#EF4444', fontWeight: 700 }}
                />
              )}
            </Box>

            {endOfLeaseLaptops.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <CheckCircleIcon sx={{ fontSize: 48, color: '#22c55e', opacity: 0.5, mb: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  Geen devices klaar voor retour
                </Typography>
              </Box>
            ) : (
              <List
                dense
                disablePadding
                sx={{
                  maxHeight: 5 * 52, // ~5 items
                  overflowY: 'auto',
                  '&::-webkit-scrollbar': { width: 6 },
                  '&::-webkit-scrollbar-thumb': { bgcolor: alpha('#EF4444', 0.3), borderRadius: 3 },
                }}
              >
                {endOfLeaseLaptops.map((asset) => (
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
                    <ListItemText
                      primary={formatAssetPrimary(asset)}
                      secondary={
                        <>
                          {formatAssetSecondary(asset)}
                          {asset.leaseEndDate && (
                            <Typography component="span" sx={{ ml: 1, color: '#EF4444', fontSize: '0.7rem' }}>
                              (Lease: {formatDate(asset.leaseEndDate)})
                            </Typography>
                          )}
                        </>
                      }
                      primaryTypographyProps={{ fontWeight: 600, fontSize: '0.875rem' }}
                      secondaryTypographyProps={{ fontSize: '0.7rem', color: 'text.secondary' }}
                    />
                    <Chip
                      label="UitDienst"
                      size="small"
                      sx={{ bgcolor: alpha('#EF4444', 0.12), color: '#EF4444', fontWeight: 600 }}
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </Box>
        </Paper>
      </Box>

      {/* Rollout Progress Overview */}
      {rolloutStats.totalWorkplaces > 0 && (
        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            borderRadius: 3,
            bgcolor: isDark ? 'var(--dark-bg-elevated)' : 'background.paper',
            boxShadow: isDark ? 'var(--neu-shadow-dark-md)' : 'var(--neu-shadow-light-md)',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
            <Avatar sx={{ bgcolor: alpha('#8B5CF6', 0.12), width: 40, height: 40 }}>
              <TrendingUpIcon sx={{ color: '#8B5CF6' }} />
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle1" fontWeight={700}>
                Totale Voortgang Alle Rollouts
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {rolloutStats.completedWorkplaces} van {rolloutStats.totalWorkplaces} swaps voltooid
              </Typography>
            </Box>
            <Typography variant="h4" fontWeight={800} color={rolloutStats.completedWorkplaces === rolloutStats.totalWorkplaces ? '#22c55e' : '#8B5CF6'}>
              {rolloutStats.totalWorkplaces > 0 ? Math.round((rolloutStats.completedWorkplaces / rolloutStats.totalWorkplaces) * 100) : 0}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={rolloutStats.totalWorkplaces > 0 ? (rolloutStats.completedWorkplaces / rolloutStats.totalWorkplaces) * 100 : 0}
            sx={{
              height: 12,
              borderRadius: 6,
              bgcolor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
              '& .MuiLinearProgress-bar': {
                bgcolor: rolloutStats.completedWorkplaces === rolloutStats.totalWorkplaces ? '#22c55e' : '#8B5CF6',
                borderRadius: 6,
              },
            }}
          />
        </Paper>
      )}
    </Box>
  );
};

export default OperationsDashboardPage;

import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
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
} from '@mui/material';
import InventoryIcon from '@mui/icons-material/Inventory2';
import AddIcon from '@mui/icons-material/Add';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import EventIcon from '@mui/icons-material/Event';
import HistoryIcon from '@mui/icons-material/History';
import SecurityIcon from '@mui/icons-material/Security';
import BuildIcon from '@mui/icons-material/Build';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ScheduleIcon from '@mui/icons-material/Schedule';
import NewReleasesIcon from '@mui/icons-material/NewReleases';
import DevicesIcon from '@mui/icons-material/Devices';
import StorageIcon from '@mui/icons-material/Storage';
import { ROUTES, buildRoute } from '../../constants/routes';
import { useAssets } from '../../hooks/useAssets';
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

const AssetsPage = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { data: assets, isLoading, error } = useAssets();

  // Calculate statistics
  const stats = useMemo(() => {
    if (!assets) return { total: 0, inUse: 0, stock: 0, repair: 0, defect: 0, retired: 0, new: 0 };
    return {
      total: assets.length,
      inUse: assets.filter(a => a.status === 'InGebruik').length,
      stock: assets.filter(a => a.status === 'Stock').length,
      repair: assets.filter(a => a.status === 'Herstelling').length,
      defect: assets.filter(a => a.status === 'Defect').length,
      retired: assets.filter(a => a.status === 'UitDienst').length,
      new: assets.filter(a => a.status === 'Nieuw').length,
    };
  }, [assets]);

  // Upcoming warranty expirations (next 90 days)
  const upcomingWarrantyExpirations = useMemo(() => {
    if (!assets) return [];
    const now = new Date();
    const ninetyDaysFromNow = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

    return assets
      .filter(a => {
        if (!a.warrantyExpiry) return false;
        const expiry = new Date(a.warrantyExpiry);
        return expiry >= now && expiry <= ninetyDaysFromNow;
      })
      .sort((a, b) => new Date(a.warrantyExpiry!).getTime() - new Date(b.warrantyExpiry!).getTime())
      .slice(0, 5);
  }, [assets]);

  // Upcoming Intune certificate expirations (next 30 days)
  const upcomingCertExpirations = useMemo(() => {
    if (!assets) return [];
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    return assets
      .filter(a => {
        if (!a.intuneCertificateExpiry) return false;
        const expiry = new Date(a.intuneCertificateExpiry);
        return expiry >= now && expiry <= thirtyDaysFromNow;
      })
      .sort((a, b) => new Date(a.intuneCertificateExpiry!).getTime() - new Date(b.intuneCertificateExpiry!).getTime())
      .slice(0, 5);
  }, [assets]);

  // Recently added assets (last 7 days)
  const recentlyAdded = useMemo(() => {
    if (!assets) return [];
    // eslint-disable-next-line react-hooks/purity -- Date.now() is intentionally used for relative date filtering
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    return assets
      .filter(a => new Date(a.createdAt) >= sevenDaysAgo)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  }, [assets]);


  // Assets needing attention (defect or in repair)
  const needsAttention = useMemo(() => {
    if (!assets) return [];
    return assets
      .filter(a => a.status === 'Defect' || a.status === 'Herstelling')
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 5);
  }, [assets]);


  // Format relative time
  const formatRelativeTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));

    if (diffDays === 0) return 'Vandaag';
    if (diffDays === 1) return 'Gisteren';
    if (diffDays < 7) return `${diffDays} dagen geleden`;
    return date.toLocaleDateString('nl-NL');
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

  // Format days until
  const formatDaysUntil = (dateString: string): { text: string; urgent: boolean } => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (24 * 60 * 60 * 1000));

    if (diffDays < 0) return { text: 'Verlopen', urgent: true };
    if (diffDays === 0) return { text: 'Vandaag', urgent: true };
    if (diffDays === 1) return { text: 'Morgen', urgent: true };
    if (diffDays <= 7) return { text: `${diffDays} dagen`, urgent: true };
    if (diffDays <= 30) return { text: `${diffDays} dagen`, urgent: false };
    return { text: `${diffDays} dagen`, urgent: false };
  };

  if (isLoading) {
    return <Loading message="Loading assets..." />;
  }

  if (error) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="error">Error loading assets: {error.message}</Typography>
      </Box>
    );
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
                bgcolor: alpha('#FF7700', 0.12),
              }}
            >
              <InventoryIcon sx={{ fontSize: 32, color: '#FF7700' }} />
            </Box>
            <Box>
              <Typography variant="h4" fontWeight={800}>
                Asset Dashboard
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Overzicht van alle assets en belangrijke meldingen
              </Typography>
            </Box>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate(ROUTES.ASSETS_NEW)}
            sx={{
              px: 3,
              py: 1.25,
              bgcolor: '#FF7700',
              fontWeight: 700,
              '&:hover': { bgcolor: '#e66a00' },
            }}
          >
            Nieuw Asset
          </Button>
        </Stack>
      </Paper>

      {/* Status Overview Cards */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: 'repeat(2, 1fr)',
            sm: 'repeat(4, 1fr)',
            lg: 'repeat(7, 1fr)',
          },
          gap: 2,
        }}
      >
        {[
          { label: 'Totaal', value: stats.total, color: '#6C757D', icon: <DevicesIcon /> },
          { label: 'In Gebruik', value: stats.inUse, color: '#22c55e', icon: <CheckCircleIcon /> },
          { label: 'Stock', value: stats.stock, color: '#3B82F6', icon: <StorageIcon /> },
          { label: 'Nieuw', value: stats.new, color: '#8B5CF6', icon: <NewReleasesIcon /> },
          { label: 'Herstelling', value: stats.repair, color: '#eab308', icon: <BuildIcon /> },
          { label: 'Defect', value: stats.defect, color: '#EF4444', icon: <ErrorOutlineIcon /> },
          { label: 'Uit Dienst', value: stats.retired, color: '#9CA3AF', icon: <ScheduleIcon /> },
        ].map((stat) => (
          <Paper
            key={stat.label}
            elevation={0}
            sx={{
              p: 2,
              borderRadius: 2,
              bgcolor: isDark ? 'var(--dark-bg-elevated)' : 'background.paper',
              boxShadow: isDark ? 'var(--neu-shadow-dark-sm)' : 'var(--neu-shadow-light-sm)',
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              borderLeft: `4px solid ${stat.color}`,
            }}
          >
            <Box sx={{ color: stat.color, display: 'flex' }}>
              {stat.icon}
            </Box>
            <Box>
              <Typography variant="h5" fontWeight={800} sx={{ color: stat.color, lineHeight: 1 }}>
                {stat.value}
              </Typography>
              <Typography variant="caption" color="text.secondary" fontWeight={500}>
                {stat.label}
              </Typography>
            </Box>
          </Paper>
        ))}
      </Box>

      {/* Main Widgets Grid */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            md: 'repeat(2, 1fr)',
          },
          gap: 2.5,
        }}
      >
        {/* 1. Assets Needing Attention - Most Urgent */}
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
              <Avatar sx={{ bgcolor: alpha('#F97316', 0.12), width: 40, height: 40 }}>
                <WarningAmberIcon sx={{ color: '#F97316' }} />
              </Avatar>
              <Box>
                <Typography variant="subtitle1" fontWeight={700}>
                  Actie Vereist
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Defect of in herstelling
                </Typography>
              </Box>
              {needsAttention.length > 0 && (
                <Chip
                  label={stats.defect + stats.repair}
                  size="small"
                  sx={{ ml: 'auto', fontWeight: 700, bgcolor: '#F97316', color: 'white' }}
                />
              )}
            </Box>

            {needsAttention.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 3 }}>
                <CheckCircleIcon sx={{ fontSize: 40, color: '#22c55e', opacity: 0.5, mb: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  Alle assets zijn operationeel
                </Typography>
              </Box>
            ) : (
              <List dense disablePadding>
                {needsAttention.map((asset) => (
                  <ListItem
                    key={asset.id}
                    sx={{
                      px: 1.5,
                      py: 1,
                      borderRadius: 1,
                      mb: 0.5,
                      cursor: 'pointer',
                      '&:hover': { bgcolor: alpha('#F97316', 0.08) },
                    }}
                    onClick={() => navigate(buildRoute.assetDetail(asset.id))}
                  >
                    <ListItemText
                      primary={formatAssetPrimary(asset)}
                      secondary={formatAssetSecondary(asset)}
                      primaryTypographyProps={{ fontWeight: 600, fontSize: '0.875rem' }}
                      secondaryTypographyProps={{ fontSize: '0.7rem', color: 'text.secondary' }}
                    />
                    <Chip
                      label={asset.status === 'Defect' ? 'Defect' : 'Herstelling'}
                      size="small"
                      color={asset.status === 'Defect' ? 'error' : 'warning'}
                      sx={{ fontWeight: 600 }}
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </Box>
        </Paper>

        {/* 2. Certificate Expirations - Security Critical */}
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
              <Avatar sx={{ bgcolor: alpha('#EF4444', 0.12), width: 40, height: 40 }}>
                <SecurityIcon sx={{ color: '#EF4444' }} />
              </Avatar>
              <Box>
                <Typography variant="subtitle1" fontWeight={700}>
                  Certificaat Verlopen
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Intune certificaten (30 dagen)
                </Typography>
              </Box>
              {upcomingCertExpirations.length > 0 && (
                <Chip
                  label={upcomingCertExpirations.length}
                  size="small"
                  color="error"
                  sx={{ ml: 'auto', fontWeight: 700 }}
                />
              )}
            </Box>

            {upcomingCertExpirations.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 3 }}>
                <CheckCircleIcon sx={{ fontSize: 40, color: '#22c55e', opacity: 0.5, mb: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  Geen certificaten verlopen binnenkort
                </Typography>
              </Box>
            ) : (
              <List dense disablePadding>
                {upcomingCertExpirations.map((asset) => {
                  const daysUntil = formatDaysUntil(asset.intuneCertificateExpiry!);
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
                      <ListItemText
                        primary={formatAssetPrimary(asset)}
                        secondary={formatAssetSecondary(asset)}
                        primaryTypographyProps={{ fontWeight: 600, fontSize: '0.875rem' }}
                        secondaryTypographyProps={{ fontSize: '0.7rem', color: 'text.secondary' }}
                      />
                      <Chip
                        label={daysUntil.text}
                        size="small"
                        color={daysUntil.urgent ? 'error' : 'warning'}
                        sx={{ fontWeight: 600 }}
                      />
                    </ListItem>
                  );
                })}
              </List>
            )}
          </Box>
        </Paper>

        {/* 3. Warranty Expirations - Business Critical */}
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
              <Avatar sx={{ bgcolor: alpha('#eab308', 0.12), width: 40, height: 40 }}>
                <EventIcon sx={{ color: '#eab308' }} />
              </Avatar>
              <Box>
                <Typography variant="subtitle1" fontWeight={700}>
                  Garantie Verloopt
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Binnen 90 dagen
                </Typography>
              </Box>
              {upcomingWarrantyExpirations.length > 0 && (
                <Chip
                  label={upcomingWarrantyExpirations.length}
                  size="small"
                  color="warning"
                  sx={{ ml: 'auto', fontWeight: 700 }}
                />
              )}
            </Box>

            {upcomingWarrantyExpirations.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 3 }}>
                <CheckCircleIcon sx={{ fontSize: 40, color: '#22c55e', opacity: 0.5, mb: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  Geen garanties verlopen binnenkort
                </Typography>
              </Box>
            ) : (
              <List dense disablePadding>
                {upcomingWarrantyExpirations.map((asset) => {
                  const daysUntil = formatDaysUntil(asset.warrantyExpiry!);
                  return (
                    <ListItem
                      key={asset.id}
                      sx={{
                        px: 1.5,
                        py: 1,
                        borderRadius: 1,
                        mb: 0.5,
                        cursor: 'pointer',
                        '&:hover': { bgcolor: alpha('#eab308', 0.08) },
                      }}
                      onClick={() => navigate(buildRoute.assetDetail(asset.id))}
                    >
                      <ListItemText
                        primary={formatAssetPrimary(asset)}
                        secondary={formatAssetSecondary(asset)}
                        primaryTypographyProps={{ fontWeight: 600, fontSize: '0.875rem' }}
                        secondaryTypographyProps={{ fontSize: '0.7rem', color: 'text.secondary' }}
                      />
                      <Chip
                        label={daysUntil.text}
                        size="small"
                        color={daysUntil.urgent ? 'error' : 'warning'}
                        sx={{ fontWeight: 600 }}
                      />
                    </ListItem>
                  );
                })}
              </List>
            )}
          </Box>
        </Paper>

        {/* 4. Recently Added - Tracking */}
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
              <Avatar sx={{ bgcolor: alpha('#22c55e', 0.12), width: 40, height: 40 }}>
                <NewReleasesIcon sx={{ color: '#22c55e' }} />
              </Avatar>
              <Box>
                <Typography variant="subtitle1" fontWeight={700}>
                  Recent Toegevoegd
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Laatste 7 dagen
                </Typography>
              </Box>
              {recentlyAdded.length > 0 && (
                <Chip
                  label={recentlyAdded.length}
                  size="small"
                  color="success"
                  sx={{ ml: 'auto', fontWeight: 700 }}
                />
              )}
            </Box>

            {recentlyAdded.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 3 }}>
                <HistoryIcon sx={{ fontSize: 40, color: 'text.secondary', opacity: 0.3, mb: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  Geen nieuwe assets deze week
                </Typography>
              </Box>
            ) : (
              <List dense disablePadding>
                {recentlyAdded.map((asset) => (
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
                    <Typography variant="caption" color="text.secondary">
                      {formatRelativeTime(asset.createdAt)}
                    </Typography>
                  </ListItem>
                ))}
              </List>
            )}
          </Box>
        </Paper>

      </Box>
    </Box>
  );
};

export default AssetsPage;

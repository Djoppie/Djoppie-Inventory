import { useMemo, useState } from 'react';
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
  Tooltip,
  IconButton,
  Collapse,
  Badge,
  LinearProgress,
} from '@mui/material';

// Icons
import InventoryIcon from '@mui/icons-material/Inventory2';
import AddIcon from '@mui/icons-material/Add';
import PlaylistAddIcon from '@mui/icons-material/PlaylistAdd';
import AssessmentIcon from '@mui/icons-material/Assessment';
import CategoryIcon from '@mui/icons-material/Category';
import ShieldIcon from '@mui/icons-material/Shield';
import WifiOffIcon from '@mui/icons-material/WifiOff';
import MonitorIcon from '@mui/icons-material/Monitor';
import HistoryIcon from '@mui/icons-material/History';
import LaptopIcon from '@mui/icons-material/Laptop';
import DesktopWindowsIcon from '@mui/icons-material/DesktopWindows';
import DevicesIcon from '@mui/icons-material/Devices';
import KeyboardIcon from '@mui/icons-material/Keyboard';
import MouseIcon from '@mui/icons-material/Mouse';
import DockIcon from '@mui/icons-material/Dock';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import PersonIcon from '@mui/icons-material/Person';
import PlaceIcon from '@mui/icons-material/Place';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import StorageIcon from '@mui/icons-material/Storage';
import BuildIcon from '@mui/icons-material/Build';
import NewReleasesIcon from '@mui/icons-material/NewReleases';
import ScheduleIcon from '@mui/icons-material/Schedule';
import { ROUTES, buildRoute } from '../../constants/routes';
import { useAssets } from '../../hooks/useAssets';
import {
  categoriesApi,
  assetTypesApi,
  servicesApi,
  sectorsApi,
  buildingsApi,
} from '../../api/admin.api';
import { assetEventsApi, AssetEvent } from '../../api/assetEvents.api';
import Loading from '../../components/common/Loading';
import AssetFilterBar from '../../components/inventory/AssetFilterBar';
import type { AssetStatus } from '../../types/asset.types';
import type { Category, AssetType, Service, Sector, Building } from '../../types/admin.types';

// Status color mapping
const STATUS_COLORS: Record<AssetStatus | string, string> = {
  InGebruik: '#22c55e',
  Stock: '#3B82F6',
  Nieuw: '#8B5CF6',
  Herstelling: '#eab308',
  Defect: '#EF4444',
  UitDienst: '#9CA3AF',
};

const STATUS_LABELS: Record<string, string> = {
  InGebruik: 'In Gebruik',
  Stock: 'Stock',
  Nieuw: 'Nieuw',
  Herstelling: 'Herstelling',
  Defect: 'Defect',
  UitDienst: 'Uit Dienst',
};

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

  // Fetch categories for grouping
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.getAll(false),
    staleTime: 300000,
  });

  // Fetch asset types for mapping
  const { data: assetTypes = [] } = useQuery<AssetType[]>({
    queryKey: ['assetTypes'],
    queryFn: () => assetTypesApi.getAll(false),
    staleTime: 300000,
  });

  // Fetch recent asset events
  const { data: recentEvents = [] } = useQuery<AssetEvent[]>({
    queryKey: ['recentAssetEvents'],
    queryFn: () => assetEventsApi.getRecent(15),
    staleTime: 60000,
  });

  // Expanded state for category rows
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set());

  // Multi-facet filter state
  const [selectedStatuses, setSelectedStatuses] = useState<Set<AssetStatus>>(new Set());
  const [selectedAssetTypeIds, setSelectedAssetTypeIds] = useState<Set<number>>(new Set());
  const [selectedServiceIds, setSelectedServiceIds] = useState<Set<number>>(new Set());
  const [selectedBuildingIds, setSelectedBuildingIds] = useState<Set<number>>(new Set());
  const [searchText, setSearchText] = useState('');

  // Fetch services / sectors / buildings for filter dropdowns
  const { data: services = [] } = useQuery<Service[]>({
    queryKey: ['services'],
    queryFn: () => servicesApi.getAll(true),
    staleTime: 300000,
  });

  const { data: sectors = [] } = useQuery<Sector[]>({
    queryKey: ['sectors'],
    queryFn: () => sectorsApi.getAll(true),
    staleTime: 300000,
  });

  const { data: buildings = [] } = useQuery<Building[]>({
    queryKey: ['buildings'],
    queryFn: () => buildingsApi.getAll(true),
    staleTime: 300000,
  });

  // Deduplicate sectors by normalized name and remap each service onto its
  // canonical sector id, so the filter bar shows one entry per logical sector
  // even if the DB has duplicate sector rows (legacy data).
  const { canonicalSectors, canonicalServices } = useMemo(() => {
    const sectorByName = new Map<string, Sector>();
    const sectorIdRemap = new Map<number, number>();
    sectors
      .slice()
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .forEach((s) => {
        const key = s.name.trim().toUpperCase();
        const existing = sectorByName.get(key);
        if (!existing) {
          sectorByName.set(key, s);
          sectorIdRemap.set(s.id, s.id);
        } else {
          sectorIdRemap.set(s.id, existing.id);
        }
      });
    const remappedServices = services.map((svc) =>
      svc.sectorId !== undefined && sectorIdRemap.has(svc.sectorId)
        ? { ...svc, sectorId: sectorIdRemap.get(svc.sectorId) }
        : svc,
    );
    return {
      canonicalSectors: Array.from(sectorByName.values()),
      canonicalServices: remappedServices,
    };
  }, [services, sectors]);

  const toggleCategory = (categoryId: number) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  const clearAllFilters = () => {
    setSelectedStatuses(new Set());
    setSelectedAssetTypeIds(new Set());
    setSelectedServiceIds(new Set());
    setSelectedBuildingIds(new Set());
    setSearchText('');
  };

  // Sub-navigation items
  const subNavItems: SubNavItem[] = [
    { label: 'Create Asset', icon: <AddIcon />, path: ROUTES.ASSETS_NEW },
    { label: 'Bulk Create', icon: <PlaylistAddIcon />, path: ROUTES.ASSETS_BULK_NEW },
    { label: 'Reports', icon: <AssessmentIcon />, path: ROUTES.REPORTS },
  ];

  // Calculate all statistics
  const dashboardData = useMemo(() => {
    if (!assets || !assetTypes || !categories) {
      return {
        categoryBreakdown: [],
        warrantyExpiring: [],
        warrantyStats: { total: 0, expiringSoon: 0, expired: 0 },
        inactiveDevices: [],
        inactiveStats: { total: 0, count: 0 },
        totalStats: { total: 0, inUse: 0, stock: 0, repair: 0, defect: 0, retired: 0, new: 0 },
      };
    }

    // Apply all active facets + search. Empty facet = "no constraint".
    const normalizedSearch = searchText.trim().toLowerCase();
    const filteredAssets = assets.filter((a) => {
      if (selectedStatuses.size > 0 && !selectedStatuses.has(a.status as AssetStatus)) {
        return false;
      }
      if (selectedAssetTypeIds.size > 0) {
        const atid = a.assetTypeId ?? a.assetType?.id;
        if (atid === undefined || !selectedAssetTypeIds.has(atid)) return false;
      }
      if (selectedServiceIds.size > 0) {
        if (!a.serviceId || !selectedServiceIds.has(a.serviceId)) return false;
      }
      if (selectedBuildingIds.size > 0) {
        if (!a.buildingId || !selectedBuildingIds.has(a.buildingId)) return false;
      }
      if (normalizedSearch) {
        const haystack = [
          a.assetCode,
          a.assetName,
          a.alias,
          a.serialNumber,
          a.model,
          a.brand,
          a.owner,
          a.assetType?.name,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(normalizedSearch)) return false;
      }
      return true;
    });

    const now = new Date();
    const fourYearsMs = 4 * 365 * 24 * 60 * 60 * 1000;
    const sixtyDaysMs = 60 * 24 * 60 * 60 * 1000;

    // Total stats
    const totalStats = {
      total: filteredAssets.length,
      inUse: filteredAssets.filter(a => a.status === 'InGebruik').length,
      stock: filteredAssets.filter(a => a.status === 'Stock').length,
      repair: filteredAssets.filter(a => a.status === 'Herstelling').length,
      defect: filteredAssets.filter(a => a.status === 'Defect').length,
      retired: filteredAssets.filter(a => a.status === 'UitDienst').length,
      new: filteredAssets.filter(a => a.status === 'Nieuw').length,
    };

    // 1. Category breakdown with asset types and status counts
    const categoryBreakdown = categories.map(category => {
      const categoryAssetTypes = assetTypes.filter(at => at.categoryId === category.id);
      const typeBreakdown = categoryAssetTypes.map(assetType => {
        const typeAssets = filteredAssets.filter(a => a.assetTypeId === assetType.id);
        const statusCounts: Record<string, number> = {
          Nieuw: 0,
          InGebruik: 0,
          Stock: 0,
          Herstelling: 0,
          Defect: 0,
          UitDienst: 0,
        };
        typeAssets.forEach(a => {
          if (statusCounts[a.status] !== undefined) {
            statusCounts[a.status]++;
          }
        });
        return {
          id: assetType.id,
          code: assetType.code,
          name: assetType.name,
          total: typeAssets.length,
          statusCounts,
        };
      }).filter(t => t.total > 0);

      const categoryTotal = typeBreakdown.reduce((sum, t) => sum + t.total, 0);
      const categoryStatusCounts: Record<string, number> = {
        Nieuw: 0,
        InGebruik: 0,
        Stock: 0,
        Herstelling: 0,
        Defect: 0,
        UitDienst: 0,
      };
      typeBreakdown.forEach(t => {
        Object.keys(t.statusCounts).forEach(status => {
          categoryStatusCounts[status] += t.statusCounts[status];
        });
      });

      return {
        id: category.id,
        code: category.code,
        name: category.name,
        total: categoryTotal,
        statusCounts: categoryStatusCounts,
        assetTypes: typeBreakdown,
      };
    }).filter(c => c.total > 0);

    // 2. End of lifecycle (4 years from purchase date) for laptops/desktops
    const computingTypeIds = assetTypes
      .filter(at => {
        const code = at.code?.toLowerCase() || '';
        return code.includes('lap') || code.includes('desk') || code.includes('pc');
      })
      .map(at => at.id);

    const computingAssets = filteredAssets.filter(
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
      .filter(item => item.daysUntilExpiry <= 90) // Within 90 days or expired
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

    // 3. Inactive devices (60+ days since Intune last check-in)
    const inactiveDevices = filteredAssets
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

    const intuneAssets = filteredAssets.filter(a => a.intuneLastCheckIn && a.status !== 'UitDienst' && a.status !== 'Stock');
    const inactiveStats = {
      total: intuneAssets.length,
      count: intuneAssets.filter(a => {
        const lastCheckIn = new Date(a.intuneLastCheckIn!);
        return (now.getTime() - lastCheckIn.getTime()) >= sixtyDaysMs;
      }).length,
    };

    return {
      categoryBreakdown,
      warrantyExpiring,
      warrantyStats,
      inactiveDevices,
      inactiveStats,
      totalStats,
    };
  }, [
    assets,
    assetTypes,
    categories,
    selectedStatuses,
    selectedAssetTypeIds,
    selectedServiceIds,
    selectedBuildingIds,
    searchText,
  ]);

  // Filter status change events from recent events
  const statusChangeEvents = useMemo(() => {
    if (!recentEvents || !assets) return [];

    // Create asset lookup map
    const assetMap = new Map(assets.map(a => [a.id, a]));

    return recentEvents
      .filter(e => e.eventType === 'StatusChanged' || e.eventType.toLowerCase().includes('status'))
      .map(event => ({
        event,
        asset: assetMap.get(event.assetId),
      }))
      .filter(item => item.asset)
      .slice(0, 8);
  }, [recentEvents, assets]);

  // Format date helpers
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('nl-NL', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatRelativeTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));
    const diffHours = Math.floor(diffMs / (60 * 60 * 1000));

    if (diffHours < 1) return 'Zojuist';
    if (diffHours < 24) return `${diffHours}u geleden`;
    if (diffDays === 1) return 'Gisteren';
    if (diffDays < 7) return `${diffDays} dagen geleden`;
    return formatDate(dateString);
  };

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
                  {dashboardData.totalStats.total} assets in totaal
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

      {/* Multi-facet filter bar (Status / Asset Type / Dienst / Gebouw + search) */}
      <AssetFilterBar
        searchText={searchText}
        onSearchChange={setSearchText}
        selectedStatuses={selectedStatuses}
        onStatusesChange={setSelectedStatuses}
        selectedAssetTypeIds={selectedAssetTypeIds}
        onAssetTypesChange={setSelectedAssetTypeIds}
        assetTypes={assetTypes}
        selectedServiceIds={selectedServiceIds}
        onServicesChange={setSelectedServiceIds}
        services={canonicalServices}
        sectors={canonicalSectors}
        selectedBuildingIds={selectedBuildingIds}
        onBuildingsChange={setSelectedBuildingIds}
        buildings={buildings}
        onClearAll={clearAllFilters}
      />

      {/* Quick Status Overview */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: 'repeat(2, 1fr)',
            sm: 'repeat(3, 1fr)',
            md: 'repeat(6, 1fr)',
          },
          gap: 2,
        }}
      >
        {[
          { label: 'Nieuw', value: dashboardData.totalStats.new, color: STATUS_COLORS.Nieuw, icon: <NewReleasesIcon /> },
          { label: 'In Gebruik', value: dashboardData.totalStats.inUse, color: STATUS_COLORS.InGebruik, icon: <CheckCircleIcon /> },
          { label: 'Stock', value: dashboardData.totalStats.stock, color: STATUS_COLORS.Stock, icon: <StorageIcon /> },
          { label: 'Herstelling', value: dashboardData.totalStats.repair, color: STATUS_COLORS.Herstelling, icon: <BuildIcon /> },
          { label: 'Defect', value: dashboardData.totalStats.defect, color: STATUS_COLORS.Defect, icon: <ErrorOutlineIcon /> },
          { label: 'Uit Dienst', value: dashboardData.totalStats.retired, color: STATUS_COLORS.UitDienst, icon: <ScheduleIcon /> },
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
              transition: 'all 0.2s ease',
              cursor: 'pointer',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: isDark ? 'var(--neu-shadow-dark-md)' : 'var(--neu-shadow-light-md)',
              },
            }}
            onClick={() => navigate(`${ROUTES.INVENTORY}?status=${stat.label.replace(' ', '')}`)}
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
            lg: 'repeat(2, 1fr)',
          },
          gap: 3,
        }}
      >
        {/* Widget 1: Asset Type Overview by Category */}
        <Paper
          elevation={0}
          sx={{
            ...widgetSx,
            gridColumn: { xs: 'span 1', lg: 'span 2' },
            bgcolor: isDark ? 'var(--dark-bg-elevated)' : 'background.paper',
            boxShadow: isDark ? 'var(--neu-shadow-dark-md)' : 'var(--neu-shadow-light-md)',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 4,
              background: 'linear-gradient(90deg, #6366F1, #8B5CF6, #A78BFA)',
            },
          }}
        >
          <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
              <Avatar sx={{ bgcolor: alpha('#8B5CF6', 0.12), width: 44, height: 44 }}>
                <CategoryIcon sx={{ color: '#8B5CF6' }} />
              </Avatar>
              <Box>
                <Typography variant="h6" fontWeight={700}>
                  Asset Overzicht per Categorie
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Verdeling per type en status
                </Typography>
              </Box>
            </Box>

            {/* Category breakdown */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {dashboardData.categoryBreakdown.map((category) => (
                <Box
                  key={category.id}
                  sx={{
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
                    overflow: 'hidden',
                  }}
                >
                  {/* Category header row */}
                  <Box
                    onClick={() => toggleCategory(category.id)}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      p: 2,
                      cursor: 'pointer',
                      bgcolor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
                      '&:hover': {
                        bgcolor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
                      },
                    }}
                  >
                    <Typography variant="subtitle1" fontWeight={700} sx={{ minWidth: 140 }}>
                      {category.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mr: 'auto' }}>
                      {category.total} assets
                    </Typography>

                    {/* Status chips */}
                    <Stack direction="row" spacing={0.75} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                      {Object.entries(category.statusCounts).map(([status, count]) => (
                        count > 0 && (
                          <Chip
                            key={status}
                            label={count}
                            size="small"
                            sx={{
                              bgcolor: alpha(STATUS_COLORS[status], 0.15),
                              color: STATUS_COLORS[status],
                              fontWeight: 700,
                              fontSize: '0.7rem',
                              height: 22,
                              '& .MuiChip-label': { px: 1 },
                            }}
                          />
                        )
                      ))}
                    </Stack>

                    <IconButton size="small">
                      {expandedCategories.has(category.id) ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </IconButton>
                  </Box>

                  {/* Expanded asset types */}
                  <Collapse in={expandedCategories.has(category.id)}>
                    <Box sx={{ p: 2, pt: 0 }}>
                      {category.assetTypes.map((assetType, idx) => {
                        const Icon = getAssetTypeIcon(assetType.code);
                        return (
                          <Box
                            key={assetType.id}
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 2,
                              py: 1.5,
                              borderTop: idx > 0 ? '1px solid' : 'none',
                              borderColor: 'divider',
                            }}
                          >
                            <Icon sx={{ fontSize: 20, color: 'text.secondary' }} />
                            <Typography variant="body2" fontWeight={600} sx={{ minWidth: 120 }}>
                              {assetType.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mr: 'auto' }}>
                              {assetType.total} stuks
                            </Typography>

                            <Stack direction="row" spacing={0.5}>
                              {Object.entries(assetType.statusCounts).map(([status, count]) => (
                                count > 0 && (
                                  <Tooltip key={status} title={STATUS_LABELS[status] || status}>
                                    <Box
                                      sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        minWidth: 24,
                                        height: 24,
                                        borderRadius: 1,
                                        bgcolor: alpha(STATUS_COLORS[status], 0.12),
                                        color: STATUS_COLORS[status],
                                        fontSize: '0.7rem',
                                        fontWeight: 700,
                                      }}
                                    >
                                      {count}
                                    </Box>
                                  </Tooltip>
                                )
                              ))}
                            </Stack>
                          </Box>
                        );
                      })}
                    </Box>
                  </Collapse>
                </Box>
              ))}
            </Box>
          </Box>
        </Paper>

        {/* Widget 2: End of Lifecycle */}
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

        {/* Widget 3: Inactive Devices (60+ days) */}
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

        {/* Widget 4: Recent Status Changes */}
        <Paper
          elevation={0}
          sx={{
            ...widgetSx,
            gridColumn: { xs: 'span 1', lg: 'span 2' },
            bgcolor: isDark ? 'var(--dark-bg-elevated)' : 'background.paper',
            boxShadow: isDark ? 'var(--neu-shadow-dark-md)' : 'var(--neu-shadow-light-md)',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 4,
              background: 'linear-gradient(90deg, #10B981, #34D399)',
            },
          }}
        >
          <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
              <Avatar sx={{ bgcolor: alpha('#10B981', 0.12), width: 44, height: 44 }}>
                <HistoryIcon sx={{ color: '#10B981' }} />
              </Avatar>
              <Box>
                <Typography variant="h6" fontWeight={700}>
                  Recente Statuswijzigingen
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Laptops & Desktops met statusveranderingen
                </Typography>
              </Box>
            </Box>

            {/* Event List */}
            {statusChangeEvents.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <HistoryIcon sx={{ fontSize: 48, color: 'text.secondary', opacity: 0.3, mb: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  Geen recente statuswijzigingen
                </Typography>
              </Box>
            ) : (
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
                  gap: 1.5,
                }}
              >
                {statusChangeEvents.map(({ event, asset }) => {
                  if (!asset) return null;
                  const Icon = getAssetTypeIcon(asset.assetType?.code || '');
                  return (
                    <Box
                      key={event.id}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                        p: 1.5,
                        borderRadius: 2,
                        bgcolor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
                        border: '1px solid',
                        borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          bgcolor: alpha('#10B981', 0.08),
                          borderColor: alpha('#10B981', 0.2),
                        },
                      }}
                      onClick={() => navigate(buildRoute.assetDetail(asset.id))}
                    >
                      <Icon sx={{ fontSize: 24, color: 'text.secondary' }} />
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2" fontWeight={600} noWrap>
                            {asset.assetCode}
                          </Typography>
                          {asset.owner && (
                            <Chip
                              icon={<PersonIcon sx={{ fontSize: '0.7rem !important' }} />}
                              label={asset.owner.split('@')[0]}
                              size="small"
                              sx={{ height: 18, fontSize: '0.65rem', maxWidth: 100 }}
                            />
                          )}
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 0.5 }}>
                          {event.oldValue && (
                            <Chip
                              label={STATUS_LABELS[event.oldValue] || event.oldValue}
                              size="small"
                              sx={{
                                height: 18,
                                fontSize: '0.6rem',
                                fontWeight: 600,
                                bgcolor: alpha(STATUS_COLORS[event.oldValue] || '#6B7280', 0.12),
                                color: STATUS_COLORS[event.oldValue] || '#6B7280',
                              }}
                            />
                          )}
                          <ArrowForwardIcon sx={{ fontSize: 12, color: 'text.secondary' }} />
                          {event.newValue && (
                            <Chip
                              label={STATUS_LABELS[event.newValue] || event.newValue}
                              size="small"
                              sx={{
                                height: 18,
                                fontSize: '0.6rem',
                                fontWeight: 600,
                                bgcolor: alpha(STATUS_COLORS[event.newValue] || '#6B7280', 0.12),
                                color: STATUS_COLORS[event.newValue] || '#6B7280',
                              }}
                            />
                          )}
                        </Box>
                      </Box>
                      <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>
                        {formatRelativeTime(event.eventDate)}
                      </Typography>
                    </Box>
                  );
                })}
              </Box>
            )}
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default AssetsPage;

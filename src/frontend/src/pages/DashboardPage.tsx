import { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Card,
  Chip,
  Tooltip,
  IconButton,
  Menu,
  MenuItem,
  Divider,
  TextField,
  InputAdornment,
  Badge,
  Popover,
  alpha,
  useTheme,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useAssets } from '../hooks/useAssets';
import AssetList from '../components/assets/AssetList';
import Loading from '../components/common/Loading';
import ApiErrorDisplay from '../components/common/ApiErrorDisplay';
import ViewToggle, { ViewMode } from '../components/common/ViewToggle';
import ExportDialog from '../components/export/ExportDialog';
import BulkPrintLabelDialog from '../components/print/BulkPrintLabelDialog';
import ExpiringLeasesWidget from '../components/dashboard/ExpiringLeasesWidget';
import { getExpiringLeaseContracts } from '../api/leaseContracts.api';
import { logger } from '../utils/logger';
import DashboardIcon from '@mui/icons-material/Dashboard';
import InventoryIcon from '@mui/icons-material/Inventory';
import SortIcon from '@mui/icons-material/Sort';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import CheckIcon from '@mui/icons-material/Check';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import DownloadIcon from '@mui/icons-material/Download';
import CommentIcon from '@mui/icons-material/Comment';
import EventIcon from '@mui/icons-material/Event';
import NotificationsIcon from '@mui/icons-material/Notifications';
import PrintIcon from '@mui/icons-material/Print';

const VIEW_MODE_STORAGE_KEY = 'djoppie-dashboard-view-mode';

type SortOption = 'name-asc' | 'name-desc' | 'code-asc' | 'code-desc' | 'date-newest' | 'date-oldest';

// Helper: check if an asset code has a number >= 9000 (dummy/test asset)
const isDummyAsset = (assetCode: string): boolean => {
  const lastDash = assetCode.lastIndexOf('-');
  if (lastDash < 0) return false;
  const numStr = assetCode.substring(lastDash + 1);
  const num = parseInt(numStr, 10);
  return !isNaN(num) && num >= 9000;
};

const DashboardPage = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<SortOption>('date-newest');
  const [sortMenuAnchor, setSortMenuAnchor] = useState<null | HTMLElement>(null);
  const [categoryMenuAnchor, setCategoryMenuAnchor] = useState<null | HTMLElement>(null);
  const [exportDialogOpen, setExportDialogOpen] = useState<boolean>(false);
  const [bulkPrintDialogOpen, setBulkPrintDialogOpen] = useState<boolean>(false);
  const [selectedAssetIds, setSelectedAssetIds] = useState<Set<number>>(new Set());
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const savedMode = localStorage.getItem(VIEW_MODE_STORAGE_KEY);
    return (savedMode === 'card' || savedMode === 'table') ? savedMode : 'card';
  });

  // Popover anchors for header icons
  const [leasesAnchor, setLeasesAnchor] = useState<null | HTMLElement>(null);
  const [notesAnchor, setNotesAnchor] = useState<null | HTMLElement>(null);
  const [alarmsAnchor, setAlarmsAnchor] = useState<null | HTMLElement>(null);
  const [discussionText, setDiscussionText] = useState<string>('');
  const [expiringLeasesCount, setExpiringLeasesCount] = useState<number>(0);

  // Always fetch all assets; filtering is done client-side
  const { data: assets, isLoading, error, refetch } = useAssets();

  // Fetch expiring leases count for badge
  useEffect(() => {
    const fetchLeaseCount = async () => {
      try {
        const leases = await getExpiringLeaseContracts(90);
        setExpiringLeasesCount(leases.length);
      } catch (err) {
        logger.error('Error fetching lease count:', err);
      }
    };
    fetchLeaseCount();
  }, []);

  // Save view mode to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(VIEW_MODE_STORAGE_KEY, viewMode);
  }, [viewMode]);

  const handleStatusChipClick = (status: string) => {
    // Toggle filter: if clicking the same status, clear filter
    setStatusFilter(statusFilter === status ? '' : status);
  };

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
  };

  // Get unique categories from assets
  const categories = useMemo(() => {
    if (!assets) return [];
    const uniqueCategories = new Set(assets.map(a => a.category));
    return Array.from(uniqueCategories).sort();
  }, [assets]);

  // Apply non-status filters (for calculating status counts)
  const assetsFilteredBySearchAndCategory = useMemo(() => {
    if (!assets) return [];

    let result = [...assets];

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(a =>
        a.assetName.toLowerCase().includes(query) ||
        a.assetCode.toLowerCase().includes(query) ||
        a.category.toLowerCase().includes(query) ||
        a.owner?.toLowerCase().includes(query) ||
        a.legacyBuilding?.toLowerCase().includes(query) ||
        a.legacyDepartment?.toLowerCase().includes(query) ||
        a.service?.name?.toLowerCase().includes(query) ||
        a.officeLocation?.toLowerCase().includes(query) ||
        a.brand?.toLowerCase().includes(query) ||
        a.model?.toLowerCase().includes(query) ||
        a.serialNumber.toLowerCase().includes(query)
      );
    }

    // Apply category filter
    if (categoryFilter) {
      result = result.filter(a => a.category === categoryFilter);
    }

    return result;
  }, [assets, searchQuery, categoryFilter]);

  // Split into real assets and dummy assets (code number >= 9000)
  const realAssets = useMemo(() =>
    assetsFilteredBySearchAndCategory.filter(a => !isDummyAsset(a.assetCode)),
    [assetsFilteredBySearchAndCategory]
  );
  const dummyAssets = useMemo(() =>
    assetsFilteredBySearchAndCategory.filter(a => isDummyAsset(a.assetCode)),
    [assetsFilteredBySearchAndCategory]
  );

  // Filter and sort assets
  const filteredAndSortedAssets = useMemo(() => {
    // When Dummy is selected, show only dummy assets
    if (statusFilter === 'Dummy') {
      const result = [...dummyAssets];
      // Apply sorting below
      switch (sortBy) {
        case 'name-asc': result.sort((a, b) => a.assetName.localeCompare(b.assetName)); break;
        case 'name-desc': result.sort((a, b) => b.assetName.localeCompare(a.assetName)); break;
        case 'code-asc': result.sort((a, b) => a.assetCode.localeCompare(b.assetCode)); break;
        case 'code-desc': result.sort((a, b) => b.assetCode.localeCompare(a.assetCode)); break;
        case 'date-newest': result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); break;
        case 'date-oldest': result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()); break;
      }
      return result;
    }

    // For regular filters, use only non-dummy assets
    let result = [...realAssets];

    // Apply status filter
    if (statusFilter) {
      result = result.filter(a => a.status === statusFilter);
    }

    // Apply sorting
    switch (sortBy) {
      case 'name-asc':
        result.sort((a, b) => a.assetName.localeCompare(b.assetName));
        break;
      case 'name-desc':
        result.sort((a, b) => b.assetName.localeCompare(a.assetName));
        break;
      case 'code-asc':
        result.sort((a, b) => a.assetCode.localeCompare(b.assetCode));
        break;
      case 'code-desc':
        result.sort((a, b) => b.assetCode.localeCompare(a.assetCode));
        break;
      case 'date-newest':
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'date-oldest':
        result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
    }

    return result;
  }, [realAssets, dummyAssets, statusFilter, sortBy]);

  const handleSortMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setSortMenuAnchor(event.currentTarget);
  };

  const handleSortMenuClose = () => {
    setSortMenuAnchor(null);
  };

  const handleSortChange = (option: SortOption) => {
    setSortBy(option);
    handleSortMenuClose();
  };

  const handleCategoryMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setCategoryMenuAnchor(event.currentTarget);
  };

  const handleCategoryMenuClose = () => {
    setCategoryMenuAnchor(null);
  };

  const handleCategoryChange = (category: string) => {
    setCategoryFilter(category);
    handleCategoryMenuClose();
  };

  // Selection handlers
  const handleSelectionChange = (assetId: number, selected: boolean) => {
    setSelectedAssetIds((prev) => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(assetId);
      } else {
        newSet.delete(assetId);
      }
      return newSet;
    });
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      // Select all currently visible/filtered assets
      setSelectedAssetIds(new Set(filteredAndSortedAssets.map((a) => a.id)));
    } else {
      setSelectedAssetIds(new Set());
    }
  };

  // Get selected assets for bulk print dialog
  const selectedAssets = useMemo(() => {
    if (!assets) return [];
    return assets.filter((a) => selectedAssetIds.has(a.id));
  }, [assets, selectedAssetIds]);

  if (isLoading) return <Loading message="[LOAD] Loading asset inventory..." />;

  if (error) {
    // Check if it's a network error (API not running)
    const isNetworkError = error instanceof Error &&
      (error.message.includes('Network Error') ||
       error.message.includes('ERR_CONNECTION_REFUSED') ||
       error.message.includes('fetch'));

    if (isNetworkError) {
      return <ApiErrorDisplay onRetry={() => refetch()} />;
    }

    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="h6" color="error">
          {t('dashboard.errorLoading')}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {error instanceof Error ? error.message : t('errors.unexpectedError')}
        </Typography>
      </Box>
    );
  }

  // Calculate counts based on real assets only (excluding dummies)
  const assetCount = realAssets.length;
  const inGebruikCount = realAssets.filter(a => a.status === 'InGebruik').length;
  const stockCount = realAssets.filter(a => a.status === 'Stock').length;
  const herstellingCount = realAssets.filter(a => a.status === 'Herstelling').length;
  const defectCount = realAssets.filter(a => a.status === 'Defect').length;
  const uitDienstCount = realAssets.filter(a => a.status === 'UitDienst').length;
  const nieuwCount = realAssets.filter(a => a.status === 'Nieuw').length;
  const dummyCount = dummyAssets.length;

  // Status card definitions for the dashboard grid
  const statusCards: Array<{
    key: string;
    label: string;
    count: number;
    color: string;
    bgLight: string;
    bgDark: string;
  }> = [
    { key: 'InGebruik', label: 'In gebruik', count: inGebruikCount, color: '#4CAF50', bgLight: 'rgba(76,175,80,0.08)', bgDark: 'rgba(76,175,80,0.15)' },
    { key: 'Stock', label: 'Stock', count: stockCount, color: '#2196F3', bgLight: 'rgba(33,150,243,0.08)', bgDark: 'rgba(33,150,243,0.15)' },
    { key: 'Herstelling', label: 'Herstelling', count: herstellingCount, color: '#FF7700', bgLight: 'rgba(255,119,0,0.08)', bgDark: 'rgba(255,119,0,0.15)' },
    { key: 'Defect', label: 'Defect', count: defectCount, color: '#F44336', bgLight: 'rgba(244,67,54,0.08)', bgDark: 'rgba(244,67,54,0.15)' },
    { key: 'UitDienst', label: 'Uit dienst', count: uitDienstCount, color: '#9E9E9E', bgLight: 'rgba(158,158,158,0.08)', bgDark: 'rgba(158,158,158,0.15)' },
    { key: 'Nieuw', label: 'Nieuw', count: nieuwCount, color: '#00BCD4', bgLight: 'rgba(0,188,212,0.08)', bgDark: 'rgba(0,188,212,0.15)' },
  ];

  return (
    <Box>
      {/* Dashboard Header - Scanner style */}
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
            boxShadow: (theme) =>
              theme.palette.mode === 'dark'
                ? '0 8px 32px rgba(255, 215, 0, 0.2), inset 0 0 24px rgba(255, 215, 0, 0.05)'
                : '0 4px 20px rgba(253, 185, 49, 0.3)',
          },
        }}
      >
        {/* Title bar */}
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
            <DashboardIcon
              sx={{
                fontSize: 32,
                color: 'primary.main',
                filter: (theme) =>
                  theme.palette.mode === 'dark'
                    ? 'drop-shadow(0 0 4px rgba(255, 215, 0, 0.5))'
                    : 'none',
              }}
            />
            <Typography variant="h5" component="h1" fontWeight={700}>
              {t('dashboard.title')}
            </Typography>
          </Box>

          {/* Right side: icon buttons + total count */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* Leasing contracts */}
            <Tooltip title={t('lease.expiringLeases')}>
              <IconButton
                onClick={(e) => setLeasesAnchor(e.currentTarget)}
                size="small"
                sx={{
                  border: '1px solid',
                  borderColor: leasesAnchor ? 'primary.main' : 'divider',
                  borderRadius: 1.5,
                  color: leasesAnchor ? 'primary.main' : 'text.secondary',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    borderColor: 'primary.main',
                    color: 'primary.main',
                    bgcolor: alpha(theme.palette.primary.main, 0.05),
                  },
                }}
              >
                <Badge
                  badgeContent={expiringLeasesCount}
                  color="warning"
                  max={99}
                  sx={{ '& .MuiBadge-badge': { fontSize: '0.65rem', minWidth: 16, height: 16 } }}
                >
                  <EventIcon fontSize="small" />
                </Badge>
              </IconButton>
            </Tooltip>

            {/* Discussion & Notes */}
            <Tooltip title="Discussion & Notes">
              <IconButton
                onClick={(e) => setNotesAnchor(e.currentTarget)}
                size="small"
                sx={{
                  border: '1px solid',
                  borderColor: notesAnchor ? 'primary.main' : 'divider',
                  borderRadius: 1.5,
                  color: notesAnchor ? 'primary.main' : 'text.secondary',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    borderColor: 'primary.main',
                    color: 'primary.main',
                    bgcolor: alpha(theme.palette.primary.main, 0.05),
                  },
                }}
              >
                <Badge
                  variant={discussionText ? 'dot' : 'standard'}
                  color="primary"
                  invisible={!discussionText}
                >
                  <CommentIcon fontSize="small" />
                </Badge>
              </IconButton>
            </Tooltip>

            {/* Upcoming Alarms / Requests */}
            <Tooltip title={t('dashboard.alarms', { defaultValue: 'Alarms & Requests' })}>
              <IconButton
                onClick={(e) => setAlarmsAnchor(e.currentTarget)}
                size="small"
                sx={{
                  border: '1px solid',
                  borderColor: alarmsAnchor ? 'primary.main' : 'divider',
                  borderRadius: 1.5,
                  color: alarmsAnchor ? 'primary.main' : 'text.secondary',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    borderColor: 'primary.main',
                    color: 'primary.main',
                    bgcolor: alpha(theme.palette.primary.main, 0.05),
                  },
                }}
              >
                <NotificationsIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            {/* Total count badge */}
            <Chip
              icon={<InventoryIcon />}
              label={`${assetCount} assets`}
              onClick={() => handleStatusChipClick('')}
              sx={{
                ml: 0.5,
                fontWeight: 700,
                fontSize: '0.9rem',
                border: statusFilter === '' ? '2px solid' : '1px solid',
                borderColor: statusFilter === '' ? 'primary.main' : 'divider',
                color: statusFilter === '' ? 'primary.main' : 'text.primary',
              }}
            />
          </Box>
        </Box>

        {/* Status cards grid */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: 'repeat(2, 1fr)',
              sm: 'repeat(3, 1fr)',
              md: `repeat(${statusCards.length + (dummyCount > 0 ? 1 : 0)}, 1fr)`,
            },
            gap: 0,
          }}
        >
          {statusCards.map((card) => (
            <Box
              key={card.key}
              onClick={() => handleStatusChipClick(card.key)}
              sx={{
                px: 2,
                py: 1.5,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                borderBottom: '1px solid',
                borderRight: '1px solid',
                borderColor: 'divider',
                bgcolor: (theme) =>
                  statusFilter === card.key
                    ? (theme.palette.mode === 'dark' ? card.bgDark : card.bgLight)
                    : 'transparent',
                transition: 'all 0.2s ease',
                position: 'relative',
                '&::after': statusFilter === card.key ? {
                  content: '""',
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: 3,
                  bgcolor: card.color,
                } : {},
                opacity: statusFilter === '' || statusFilter === card.key ? 1 : 0.5,
                '&:hover': {
                  bgcolor: (theme) => theme.palette.mode === 'dark' ? card.bgDark : card.bgLight,
                  opacity: 1,
                },
              }}
            >
              {/* Color dot */}
              <Box
                sx={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  bgcolor: card.color,
                  flexShrink: 0,
                  boxShadow: statusFilter === card.key ? `0 0 8px ${card.color}` : 'none',
                }}
              />
              <Box sx={{ minWidth: 0 }}>
                <Typography
                  variant="h6"
                  fontWeight={700}
                  lineHeight={1.2}
                  sx={{ color: statusFilter === card.key ? card.color : 'text.primary' }}
                >
                  {card.count}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: 'text.secondary',
                    fontWeight: 500,
                    lineHeight: 1,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {card.label}
                </Typography>
              </Box>
            </Box>
          ))}
          {dummyCount > 0 && (
            <Box
              onClick={() => handleStatusChipClick('Dummy')}
              sx={{
                px: 2,
                py: 1.5,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                borderBottom: '1px solid',
                borderColor: 'divider',
                bgcolor: (theme) =>
                  statusFilter === 'Dummy'
                    ? (theme.palette.mode === 'dark' ? 'rgba(156,39,176,0.15)' : 'rgba(156,39,176,0.08)')
                    : 'transparent',
                transition: 'all 0.2s ease',
                position: 'relative',
                '&::after': statusFilter === 'Dummy' ? {
                  content: '""',
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: 3,
                  bgcolor: '#9C27B0',
                } : {},
                opacity: statusFilter === 'Dummy' ? 1 : 0.5,
                '&:hover': {
                  bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(156,39,176,0.15)' : 'rgba(156,39,176,0.08)',
                  opacity: 1,
                },
              }}
            >
              <Box
                sx={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  bgcolor: '#9C27B0',
                  flexShrink: 0,
                  boxShadow: statusFilter === 'Dummy' ? '0 0 8px #9C27B0' : 'none',
                }}
              />
              <Box sx={{ minWidth: 0 }}>
                <Typography
                  variant="h6"
                  fontWeight={700}
                  lineHeight={1.2}
                  sx={{ color: statusFilter === 'Dummy' ? '#9C27B0' : 'text.primary' }}
                >
                  {dummyCount}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ color: 'text.secondary', fontWeight: 500, lineHeight: 1 }}
                >
                  Dummy
                </Typography>
              </Box>
            </Box>
          )}
        </Box>
      </Card>

      {/* Sticky Toolbar for View/Sort/Filter */}
      <Paper
        elevation={0}
        sx={{
          mb: 3,
          p: 2,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
          backgroundColor: (theme) =>
            theme.palette.mode === 'dark'
              ? 'rgba(18, 18, 18, 0.95)'
              : 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          position: 'sticky',
          top: 16,
          zIndex: 10,
        }}
      >
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
          {/* Left side - View Toggle & Action Buttons */}
          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
            <ViewToggle value={viewMode} onChange={handleViewModeChange} />

            {/* Bulk Print Button - shows when assets are selected */}
            {selectedAssetIds.size > 0 && (
              <Tooltip title={t('bulkPrintLabel.printSelected')}>
                <Badge badgeContent={selectedAssetIds.size} color="primary">
                  <IconButton
                    onClick={() => setBulkPrintDialogOpen(true)}
                    sx={{
                      borderRadius: 2,
                      background: (theme) =>
                        theme.palette.mode === 'dark'
                          ? 'linear-gradient(135deg, rgba(33, 150, 243, 0.9) 0%, rgba(25, 118, 210, 0.8) 100%)'
                          : 'linear-gradient(135deg, rgba(33, 150, 243, 1) 0%, rgba(25, 118, 210, 0.9) 100%)',
                      color: '#fff',
                      boxShadow: '0 4px 12px rgba(33, 150, 243, 0.3)',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        boxShadow: '0 6px 16px rgba(33, 150, 243, 0.4)',
                      },
                    }}
                  >
                    <PrintIcon />
                  </IconButton>
                </Badge>
              </Tooltip>
            )}

            <Tooltip title={t('export.title')}>
              <IconButton
                onClick={() => setExportDialogOpen(true)}
                sx={{
                  borderRadius: 2,
                  background: (theme) =>
                    theme.palette.mode === 'dark'
                      ? 'linear-gradient(135deg, rgba(255, 119, 0, 0.9) 0%, rgba(204, 0, 0, 0.8) 100%)'
                      : 'linear-gradient(135deg, rgba(255, 119, 0, 1) 0%, rgba(204, 0, 0, 0.9) 100%)',
                  color: '#fff',
                  boxShadow: '0 4px 12px rgba(255, 119, 0, 0.3)',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    boxShadow: '0 6px 16px rgba(255, 119, 0, 0.4)',
                  },
                }}
              >
                <DownloadIcon />
              </IconButton>
            </Tooltip>
          </Box>

          {/* Center - Search */}
          <Box sx={{ flex: '1 1 300px', maxWidth: 500 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search assets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
                endAdornment: searchQuery && (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={() => setSearchQuery('')}
                      edge="end"
                    >
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  '&:hover fieldset': {
                    borderColor: 'primary.main',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: 'primary.main',
                  },
                },
              }}
            />
          </Box>

          {/* Right side - Sort and Filter */}
          <Box sx={{ display: 'flex', gap: 1 }}>
            {/* Sort Button */}
            <Tooltip title="Sort assets">
              <IconButton
                onClick={handleSortMenuOpen}
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2,
                  '&:hover': {
                    backgroundColor: (theme) =>
                      theme.palette.mode === 'dark'
                        ? 'rgba(255, 119, 0, 0.1)'
                        : 'rgba(255, 119, 0, 0.05)',
                    borderColor: 'primary.main',
                  },
                }}
              >
                <SortIcon />
              </IconButton>
            </Tooltip>

            {/* Category Filter Button */}
            <Tooltip title="Filter by category">
              <IconButton
                onClick={handleCategoryMenuOpen}
                sx={{
                  border: '1px solid',
                  borderColor: categoryFilter ? 'primary.main' : 'divider',
                  borderRadius: 2,
                  color: categoryFilter ? 'primary.main' : 'inherit',
                  '&:hover': {
                    backgroundColor: (theme) =>
                      theme.palette.mode === 'dark'
                        ? 'rgba(255, 119, 0, 0.1)'
                        : 'rgba(255, 119, 0, 0.05)',
                    borderColor: 'primary.main',
                  },
                }}
              >
                {categoryFilter ? (
                  <CheckIcon />
                ) : (
                  <FilterAltIcon />
                )}
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Active Filters Display */}
        {(searchQuery || categoryFilter) && (
          <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              Active filters:
            </Typography>
            {searchQuery && (
              <Chip
                label={`Search: "${searchQuery}"`}
                onDelete={() => setSearchQuery('')}
                size="small"
                sx={{
                  backgroundColor: (theme) =>
                    theme.palette.mode === 'dark'
                      ? 'rgba(255, 119, 0, 0.2)'
                      : 'rgba(255, 119, 0, 0.1)',
                  color: 'primary.main',
                  border: '1px solid',
                  borderColor: 'primary.main',
                }}
              />
            )}
            {categoryFilter && (
              <Chip
                label={`Category: ${categoryFilter}`}
                onDelete={() => setCategoryFilter('')}
                size="small"
                sx={{
                  backgroundColor: (theme) =>
                    theme.palette.mode === 'dark'
                      ? 'rgba(255, 119, 0, 0.2)'
                      : 'rgba(255, 119, 0, 0.1)',
                  color: 'primary.main',
                  border: '1px solid',
                  borderColor: 'primary.main',
                }}
              />
            )}
          </Box>
        )}
      </Paper>

      {/* Sort Menu */}
      <Menu
        anchorEl={sortMenuAnchor}
        open={Boolean(sortMenuAnchor)}
        onClose={handleSortMenuClose}
        PaperProps={{
          sx: {
            mt: 1,
            minWidth: 200,
            border: '1px solid',
            borderColor: 'divider',
          },
        }}
      >
        <MenuItem onClick={() => handleSortChange('name-asc')} selected={sortBy === 'name-asc'}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
            <span>Name (A-Z)</span>
            {sortBy === 'name-asc' && <CheckIcon fontSize="small" color="primary" />}
          </Box>
        </MenuItem>
        <MenuItem onClick={() => handleSortChange('name-desc')} selected={sortBy === 'name-desc'}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
            <span>Name (Z-A)</span>
            {sortBy === 'name-desc' && <CheckIcon fontSize="small" color="primary" />}
          </Box>
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => handleSortChange('code-asc')} selected={sortBy === 'code-asc'}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
            <span>Code (A-Z)</span>
            {sortBy === 'code-asc' && <CheckIcon fontSize="small" color="primary" />}
          </Box>
        </MenuItem>
        <MenuItem onClick={() => handleSortChange('code-desc')} selected={sortBy === 'code-desc'}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
            <span>Code (Z-A)</span>
            {sortBy === 'code-desc' && <CheckIcon fontSize="small" color="primary" />}
          </Box>
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => handleSortChange('date-newest')} selected={sortBy === 'date-newest'}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
            <span>Newest First</span>
            {sortBy === 'date-newest' && <CheckIcon fontSize="small" color="primary" />}
          </Box>
        </MenuItem>
        <MenuItem onClick={() => handleSortChange('date-oldest')} selected={sortBy === 'date-oldest'}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
            <span>Oldest First</span>
            {sortBy === 'date-oldest' && <CheckIcon fontSize="small" color="primary" />}
          </Box>
        </MenuItem>
      </Menu>

      {/* Category Filter Menu */}
      <Menu
        anchorEl={categoryMenuAnchor}
        open={Boolean(categoryMenuAnchor)}
        onClose={handleCategoryMenuClose}
        PaperProps={{
          sx: {
            mt: 1,
            minWidth: 200,
            border: '1px solid',
            borderColor: 'divider',
          },
        }}
      >
        <MenuItem onClick={() => handleCategoryChange('')} selected={categoryFilter === ''}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
            <span>All Categories</span>
            {categoryFilter === '' && <CheckIcon fontSize="small" color="primary" />}
          </Box>
        </MenuItem>
        <Divider />
        {categories.map((category) => (
          <MenuItem
            key={category}
            onClick={() => handleCategoryChange(category)}
            selected={categoryFilter === category}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
              <span>{category}</span>
              {categoryFilter === category && <CheckIcon fontSize="small" color="primary" />}
            </Box>
          </MenuItem>
        ))}
      </Menu>

      {/* Asset List */}
      <AssetList
        assets={filteredAndSortedAssets}
        viewMode={viewMode}
        selectable={true}
        selectedAssetIds={selectedAssetIds}
        onSelectionChange={handleSelectionChange}
        onSelectAll={handleSelectAll}
      />

      {/* Leasing Contracts Popover */}
      <Popover
        open={Boolean(leasesAnchor)}
        anchorEl={leasesAnchor}
        onClose={() => setLeasesAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          paper: {
            sx: {
              mt: 1,
              width: { xs: 340, sm: 420 },
              maxHeight: 480,
              overflow: 'auto',
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
              boxShadow: theme.palette.mode === 'dark'
                ? '0 8px 32px rgba(0,0,0,0.5)'
                : '0 8px 32px rgba(0,0,0,0.12)',
            },
          },
        }}
      >
        <ExpiringLeasesWidget />
      </Popover>

      {/* Discussion & Notes Popover */}
      <Popover
        open={Boolean(notesAnchor)}
        anchorEl={notesAnchor}
        onClose={() => setNotesAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          paper: {
            sx: {
              mt: 1,
              width: { xs: 340, sm: 400 },
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
              boxShadow: theme.palette.mode === 'dark'
                ? '0 8px 32px rgba(0,0,0,0.5)'
                : '0 8px 32px rgba(0,0,0,0.12)',
            },
          },
        }}
      >
        <Box sx={{ p: 2.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <CommentIcon sx={{ color: 'primary.main', fontSize: 20 }} />
            <Typography variant="subtitle1" fontWeight={700} color="primary.main">
              Discussion & Notes
            </Typography>
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
            Add notes or observations about the current inventory status. Stored locally in your browser.
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={5}
            placeholder="Enter your notes here..."
            value={discussionText}
            onChange={(e) => setDiscussionText(e.target.value)}
            size="small"
            sx={{
              '& .MuiOutlinedInput-root': {
                '&:hover fieldset': { borderColor: 'primary.main' },
                '&.Mui-focused fieldset': { borderColor: 'primary.main' },
              },
            }}
          />
          {discussionText && (
            <Box sx={{ mt: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="caption" color="text.secondary">
                {discussionText.length} characters
              </Typography>
              <Tooltip title="Clear all notes">
                <IconButton
                  size="small"
                  onClick={() => setDiscussionText('')}
                  sx={{ color: 'error.main' }}
                >
                  <ClearIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          )}
        </Box>
      </Popover>

      {/* Alarms & Requests Popover */}
      <Popover
        open={Boolean(alarmsAnchor)}
        anchorEl={alarmsAnchor}
        onClose={() => setAlarmsAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          paper: {
            sx: {
              mt: 1,
              width: { xs: 300, sm: 360 },
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
              boxShadow: theme.palette.mode === 'dark'
                ? '0 8px 32px rgba(0,0,0,0.5)'
                : '0 8px 32px rgba(0,0,0,0.12)',
            },
          },
        }}
      >
        <Box sx={{ p: 2.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <NotificationsIcon sx={{ color: 'primary.main', fontSize: 20 }} />
            <Typography variant="subtitle1" fontWeight={700} color="primary.main">
              {t('dashboard.alarms', { defaultValue: 'Alarms & Requests' })}
            </Typography>
          </Box>
          <Box
            sx={{
              py: 4,
              textAlign: 'center',
              border: '1px dashed',
              borderColor: 'divider',
              borderRadius: 2,
              bgcolor: alpha(theme.palette.background.default, 0.5),
            }}
          >
            <NotificationsIcon sx={{ fontSize: 36, color: 'text.disabled', mb: 1 }} />
            <Typography variant="body2" color="text.secondary">
              {t('dashboard.noAlarms', { defaultValue: 'No upcoming alarms or requests' })}
            </Typography>
          </Box>
        </Box>
      </Popover>

      {/* Export Dialog */}
      <ExportDialog
        open={exportDialogOpen}
        onClose={() => setExportDialogOpen(false)}
        assets={assets || []}
      />

      {/* Bulk Print Dialog */}
      <BulkPrintLabelDialog
        open={bulkPrintDialogOpen}
        onClose={() => setBulkPrintDialogOpen(false)}
        assets={selectedAssets}
      />
    </Box>
  );
};

export default DashboardPage;

import { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Chip,
  keyframes,
  Tooltip,
  IconButton,
  Menu,
  MenuItem,
  Divider,
  TextField,
  InputAdornment,
  Button,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useAssets } from '../hooks/useAssets';
import AssetList from '../components/assets/AssetList';
import Loading from '../components/common/Loading';
import ApiErrorDisplay from '../components/common/ApiErrorDisplay';
import ViewToggle, { ViewMode } from '../components/common/ViewToggle';
import ExportDialog from '../components/export/ExportDialog';
import DashboardIcon from '@mui/icons-material/Dashboard';
import InventoryIcon from '@mui/icons-material/Inventory';
import SortIcon from '@mui/icons-material/Sort';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import CheckIcon from '@mui/icons-material/Check';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import DownloadIcon from '@mui/icons-material/Download';
import CommentIcon from '@mui/icons-material/Comment';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

// Subtle glow pulse for the header
const headerGlow = keyframes`
  0%, 100% {
    box-shadow: 0 0 10px rgba(255, 119, 0, 0.2), inset 0 0 10px rgba(255, 119, 0, 0.05);
  }
  50% {
    box-shadow: 0 0 20px rgba(255, 119, 0, 0.4), inset 0 0 15px rgba(255, 119, 0, 0.1);
  }
`;

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
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<SortOption>('date-newest');
  const [sortMenuAnchor, setSortMenuAnchor] = useState<null | HTMLElement>(null);
  const [categoryMenuAnchor, setCategoryMenuAnchor] = useState<null | HTMLElement>(null);
  const [discussionExpanded, setDiscussionExpanded] = useState<boolean>(false);
  const [discussionText, setDiscussionText] = useState<string>('');
  const [exportDialogOpen, setExportDialogOpen] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    // Load view mode from localStorage on mount
    const savedMode = localStorage.getItem(VIEW_MODE_STORAGE_KEY);
    return (savedMode === 'card' || savedMode === 'table') ? savedMode : 'card';
  });

  // Always fetch all assets; filtering is done client-side
  const { data: assets, isLoading, error, refetch } = useAssets();

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
        a.building?.toLowerCase().includes(query) ||
        a.department?.toLowerCase().includes(query) ||
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
  const dummyCount = dummyAssets.length;

  return (
    <Box>
      {/* Terminal-style Header */}
      <Paper
        elevation={0}
        sx={{
          mb: 4,
          p: 3,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
          animation: `${headerGlow} 3s ease-in-out infinite`,
          background: (theme) =>
            theme.palette.mode === 'dark'
              ? 'linear-gradient(135deg, rgba(255, 119, 0, 0.08) 0%, rgba(204, 0, 0, 0.03) 50%, transparent 100%)'
              : 'linear-gradient(135deg, rgba(255, 119, 0, 0.06) 0%, rgba(204, 0, 0, 0.02) 50%, transparent 100%)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          {/* Dashboard icon */}
          <DashboardIcon
            sx={{
              color: 'primary.main',
              fontSize: '2rem',
              filter: (theme) =>
                theme.palette.mode === 'dark'
                  ? 'drop-shadow(0 0 8px rgba(255, 119, 0, 0.5))'
                  : 'none',
            }}
          />

          {/* Title */}
          <Typography
            variant="h4"
            component="h1"
            sx={{
              color: 'primary.main',
              fontWeight: 700,
              letterSpacing: '0.05em',
              background: (theme) =>
                theme.palette.mode === 'dark'
                  ? 'linear-gradient(90deg, var(--djoppie-orange-400), var(--djoppie-red-400))'
                  : 'linear-gradient(90deg, var(--djoppie-orange-600), var(--djoppie-red-600))',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            {t('dashboard.title')}
          </Typography>
        </Box>

        {/* Stats Row */}
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <Chip
            icon={<InventoryIcon />}
            label={`${assetCount} Totaal`}
            onClick={() => handleStatusChipClick('')}
            sx={{
              fontWeight: 600,
              fontSize: '0.9rem',
              px: 1,
              cursor: 'pointer',
              opacity: statusFilter === '' ? 1 : 0.6,
              transform: statusFilter === '' ? 'scale(1.05)' : 'scale(1)',
              transition: 'all 0.2s ease',
              '&:hover': {
                opacity: 1,
                transform: 'scale(1.05)',
              },
            }}
          />
          <Chip
            label={`${inGebruikCount} In gebruik`}
            onClick={() => handleStatusChipClick('InGebruik')}
            sx={{
              fontWeight: 600,
              fontSize: '0.9rem',
              px: 1,
              cursor: 'pointer',
              backgroundColor: statusFilter === 'InGebruik' ? 'rgba(76, 175, 80, 0.3)' : 'rgba(76, 175, 80, 0.2)',
              color: 'rgb(76, 175, 80)',
              border: '1px solid rgba(76, 175, 80, 0.4)',
              opacity: statusFilter === '' || statusFilter === 'InGebruik' ? 1 : 0.5,
              transform: statusFilter === 'InGebruik' ? 'scale(1.05)' : 'scale(1)',
              transition: 'all 0.2s ease',
              '& .MuiChip-label': {
                color: 'rgb(76, 175, 80)',
              },
              '&:hover': {
                opacity: 1,
                backgroundColor: 'rgba(76, 175, 80, 0.35)',
                boxShadow: '0 0 12px rgba(76, 175, 80, 0.4)',
                transform: 'scale(1.05)',
              },
            }}
          />
          <Chip
            label={`${stockCount} Stock`}
            onClick={() => handleStatusChipClick('Stock')}
            sx={{
              fontWeight: 600,
              fontSize: '0.9rem',
              px: 1,
              cursor: 'pointer',
              backgroundColor: statusFilter === 'Stock' ? 'rgba(33, 150, 243, 0.25)' : 'rgba(33, 150, 243, 0.15)',
              color: 'rgb(33, 150, 243)',
              border: '1px solid rgba(33, 150, 243, 0.4)',
              opacity: statusFilter === '' || statusFilter === 'Stock' ? 1 : 0.5,
              transform: statusFilter === 'Stock' ? 'scale(1.05)' : 'scale(1)',
              transition: 'all 0.2s ease',
              '& .MuiChip-label': {
                color: 'rgb(33, 150, 243)',
              },
              '&:hover': {
                opacity: 1,
                backgroundColor: 'rgba(33, 150, 243, 0.3)',
                boxShadow: '0 0 12px rgba(33, 150, 243, 0.5)',
                transform: 'scale(1.05)',
              },
            }}
          />
          <Chip
            label={`${herstellingCount} Herstelling`}
            onClick={() => handleStatusChipClick('Herstelling')}
            sx={{
              fontWeight: 600,
              fontSize: '0.9rem',
              px: 1,
              cursor: 'pointer',
              backgroundColor: statusFilter === 'Herstelling' ? 'rgba(255, 119, 0, 0.25)' : 'rgba(255, 119, 0, 0.15)',
              color: 'rgb(255, 119, 0)',
              border: '1px solid rgba(255, 119, 0, 0.4)',
              opacity: statusFilter === '' || statusFilter === 'Herstelling' ? 1 : 0.5,
              transform: statusFilter === 'Herstelling' ? 'scale(1.05)' : 'scale(1)',
              transition: 'all 0.2s ease',
              '& .MuiChip-label': {
                color: 'rgb(255, 119, 0)',
              },
              '&:hover': {
                opacity: 1,
                backgroundColor: 'rgba(255, 119, 0, 0.3)',
                boxShadow: '0 0 12px rgba(255, 119, 0, 0.5)',
                transform: 'scale(1.05)',
              },
            }}
          />
          <Chip
            label={`${defectCount} Defect`}
            onClick={() => handleStatusChipClick('Defect')}
            sx={{
              fontWeight: 600,
              fontSize: '0.9rem',
              px: 1,
              cursor: 'pointer',
              backgroundColor: statusFilter === 'Defect' ? 'rgba(244, 67, 54, 0.25)' : 'rgba(244, 67, 54, 0.15)',
              color: 'rgb(244, 67, 54)',
              border: '1px solid rgba(244, 67, 54, 0.4)',
              opacity: statusFilter === '' || statusFilter === 'Defect' ? 1 : 0.5,
              transform: statusFilter === 'Defect' ? 'scale(1.05)' : 'scale(1)',
              transition: 'all 0.2s ease',
              '& .MuiChip-label': {
                color: 'rgb(244, 67, 54)',
              },
              '&:hover': {
                opacity: 1,
                backgroundColor: 'rgba(244, 67, 54, 0.3)',
                boxShadow: '0 0 12px rgba(244, 67, 54, 0.5)',
                transform: 'scale(1.05)',
              },
            }}
          />
          <Chip
            label={`${uitDienstCount} Uit dienst`}
            onClick={() => handleStatusChipClick('UitDienst')}
            sx={{
              fontWeight: 600,
              fontSize: '0.9rem',
              px: 1,
              cursor: 'pointer',
              backgroundColor: statusFilter === 'UitDienst' ? 'rgba(158, 158, 158, 0.25)' : 'rgba(158, 158, 158, 0.15)',
              color: 'rgb(97, 97, 97)',
              border: '1px solid rgba(158, 158, 158, 0.4)',
              opacity: statusFilter === '' || statusFilter === 'UitDienst' ? 1 : 0.5,
              transform: statusFilter === 'UitDienst' ? 'scale(1.05)' : 'scale(1)',
              transition: 'all 0.2s ease',
              '& .MuiChip-label': {
                color: 'rgb(97, 97, 97)',
              },
              '&:hover': {
                opacity: 1,
                backgroundColor: 'rgba(158, 158, 158, 0.3)',
                boxShadow: '0 0 12px rgba(158, 158, 158, 0.5)',
                transform: 'scale(1.05)',
              },
            }}
          />
          {dummyCount > 0 && (
            <Chip
              label={`${dummyCount} Dummy`}
              onClick={() => handleStatusChipClick('Dummy')}
              sx={{
                fontWeight: 600,
                fontSize: '0.9rem',
                px: 1,
                cursor: 'pointer',
                backgroundColor: statusFilter === 'Dummy' ? 'rgba(156, 39, 176, 0.25)' : 'rgba(156, 39, 176, 0.12)',
                color: 'rgb(156, 39, 176)',
                border: '1px solid rgba(156, 39, 176, 0.4)',
                opacity: statusFilter === 'Dummy' ? 1 : 0.5,
                transform: statusFilter === 'Dummy' ? 'scale(1.05)' : 'scale(1)',
                transition: 'all 0.2s ease',
                '& .MuiChip-label': {
                  color: 'rgb(156, 39, 176)',
                },
                '&:hover': {
                  opacity: 1,
                  backgroundColor: 'rgba(156, 39, 176, 0.3)',
                  boxShadow: '0 0 12px rgba(156, 39, 176, 0.5)',
                  transform: 'scale(1.05)',
                },
              }}
            />
          )}
        </Box>
      </Paper>

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
          {/* Left side - View Toggle & Export Button */}
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <ViewToggle value={viewMode} onChange={handleViewModeChange} />
            <Button
              variant="contained"
              startIcon={<DownloadIcon />}
              onClick={() => setExportDialogOpen(true)}
              sx={{
                borderRadius: 2,
                px: 2,
                background: (theme) =>
                  theme.palette.mode === 'dark'
                    ? 'linear-gradient(135deg, rgba(255, 119, 0, 0.9) 0%, rgba(204, 0, 0, 0.8) 100%)'
                    : 'linear-gradient(135deg, rgba(255, 119, 0, 1) 0%, rgba(204, 0, 0, 0.9) 100%)',
                boxShadow: '0 4px 12px rgba(255, 119, 0, 0.3)',
                transition: 'all 0.2s ease',
                '&:hover': {
                  boxShadow: '0 6px 16px rgba(255, 119, 0, 0.4)',
                },
              }}
            >
              {t('export.title')}
            </Button>
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
      <AssetList assets={filteredAndSortedAssets} viewMode={viewMode} />

      {/* Discussion Section */}
      <Paper
        elevation={0}
        sx={{
          mt: 4,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
          overflow: 'hidden',
        }}
      >
        {/* Discussion Header */}
        <Box
          sx={{
            p: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            backgroundColor: (theme) =>
              theme.palette.mode === 'dark'
                ? 'rgba(255, 119, 0, 0.05)'
                : 'rgba(255, 119, 0, 0.02)',
            borderBottom: discussionExpanded ? '1px solid' : 'none',
            borderColor: 'divider',
            '&:hover': {
              backgroundColor: (theme) =>
                theme.palette.mode === 'dark'
                  ? 'rgba(255, 119, 0, 0.1)'
                  : 'rgba(255, 119, 0, 0.05)',
            },
            transition: 'background-color 0.2s ease',
          }}
          onClick={() => setDiscussionExpanded(!discussionExpanded)}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <CommentIcon sx={{ color: 'primary.main' }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Discussion & Notes
            </Typography>
            {discussionText && !discussionExpanded && (
              <Chip
                label="Has content"
                size="small"
                sx={{
                  backgroundColor: (theme) =>
                    theme.palette.mode === 'dark'
                      ? 'rgba(255, 119, 0, 0.2)'
                      : 'rgba(255, 119, 0, 0.15)',
                  color: 'primary.main',
                  fontSize: '0.75rem',
                }}
              />
            )}
          </Box>
          <IconButton size="small">
            {discussionExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Box>

        {/* Discussion Content */}
        {discussionExpanded && (
          <Box sx={{ p: 3 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Add notes, observations, or discussions about the current inventory status.
              This content is only stored locally in your browser.
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={6}
              placeholder="Enter your notes here..."
              value={discussionText}
              onChange={(e) => setDiscussionText(e.target.value)}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '&:hover fieldset': {
                    borderColor: 'primary.main',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: 'primary.main',
                  },
                },
              }}
            />
            {discussionText && (
              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption" color="text.secondary">
                  {discussionText.length} characters
                </Typography>
                <Tooltip title="Clear all notes">
                  <IconButton
                    size="small"
                    onClick={() => setDiscussionText('')}
                    sx={{
                      color: 'error.main',
                      '&:hover': {
                        backgroundColor: (theme) =>
                          theme.palette.mode === 'dark'
                            ? 'rgba(244, 67, 54, 0.1)'
                            : 'rgba(244, 67, 54, 0.05)',
                      },
                    }}
                  >
                    <ClearIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            )}
          </Box>
        )}
      </Paper>

      {/* Export Dialog */}
      <ExportDialog
        open={exportDialogOpen}
        onClose={() => setExportDialogOpen(false)}
        assets={assets || []}
      />
    </Box>
  );
};

export default DashboardPage;

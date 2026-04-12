import { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  InputAdornment,
  IconButton,
  Tooltip,
  Chip,
  Menu,
  MenuItem,
  Divider,
  Alert,
  Stack,
  Paper,
  alpha,
} from '@mui/material';
import { GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { useAsset } from '../../hooks/useAssets';
import Loading from '../../components/common/Loading';
import NeumorphicDataGrid from '../../components/admin/NeumorphicDataGrid';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AppsIcon from '@mui/icons-material/Apps';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import CheckIcon from '@mui/icons-material/Check';
import DownloadIcon from '@mui/icons-material/Download';
import CategoryIcon from '@mui/icons-material/Category';
import BusinessIcon from '@mui/icons-material/Business';
import StorageIcon from '@mui/icons-material/Storage';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import MemoryIcon from '@mui/icons-material/Memory';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import SyncIcon from '@mui/icons-material/Sync';
import ComputerIcon from '@mui/icons-material/Computer';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import GppBadIcon from '@mui/icons-material/GppBad';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { format } from 'date-fns';
import {
  InstalledSoftware,
  SoftwareCategory,
  SoftwareFilters,
  DeviceHealth,
} from '../../types/software.types';
import { softwareApi } from '../../api/software.api';
import { logger } from '../../utils/logger';
import { ASSET_COLOR } from '../../constants/filterColors';

// Scanner-style card wrapper - consistent with ScanPage and AssetDetailPage
const scannerCardSx = {
  mb: 3,
  borderRadius: 2,
  border: '1px solid',
  borderColor: 'divider',
  overflow: 'hidden',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    borderColor: 'primary.main',
    boxShadow: (theme: { palette: { mode: string } }) =>
      theme.palette.mode === 'dark'
        ? '0 8px 32px rgba(255, 215, 0, 0.2), inset 0 0 24px rgba(255, 215, 0, 0.05)'
        : '0 4px 20px rgba(253, 185, 49, 0.3)',
  },
};


// Category color mapping for visual distinction
const getCategoryColor = (category?: SoftwareCategory): string => {
  switch (category) {
    case SoftwareCategory.Productivity:
      return '#2196F3'; // Blue
    case SoftwareCategory.Development:
      return '#9C27B0'; // Purple
    case SoftwareCategory.Security:
      return '#F44336'; // Red
    case SoftwareCategory.Communication:
      return '#4CAF50'; // Green
    case SoftwareCategory.Utilities:
      return '#FF9800'; // Orange
    case SoftwareCategory.Design:
      return '#E91E63'; // Pink
    case SoftwareCategory.Browser:
      return '#00BCD4'; // Cyan
    case SoftwareCategory.System:
      return '#607D8B'; // Blue Grey
    default:
      return '#9E9E9E'; // Grey
  }
};

// Format file size
const formatSize = (sizeInMB?: number): string => {
  if (!sizeInMB) return '-';
  if (sizeInMB < 1) return `${Math.round(sizeInMB * 1024)} KB`;
  if (sizeInMB < 1024) return `${Math.round(sizeInMB)} MB`;
  return `${(sizeInMB / 1024).toFixed(2)} GB`;
};

// Format date
const formatDate = (dateString?: string): string => {
  if (!dateString) return '-';
  try {
    return format(new Date(dateString), 'MMM dd, yyyy');
  } catch {
    return dateString;
  }
};

// Format bytes to human readable
const formatBytes = (bytes?: number): string => {
  if (!bytes) return '-';
  const gb = bytes / (1024 * 1024 * 1024);
  if (gb >= 1) return `${gb.toFixed(1)} GB`;
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(0)} MB`;
};

const InstalledSoftwarePage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: asset, isLoading: isLoadingAsset } = useAsset(Number(id));

  const [software, setSoftware] = useState<InstalledSoftware[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Device health state
  const [deviceHealth, setDeviceHealth] = useState<DeviceHealth | null>(null);
  const [isLoadingHealth, setIsLoadingHealth] = useState(true);
  const [healthExpanded, setHealthExpanded] = useState(true);

  const [filters, setFilters] = useState<SoftwareFilters>({
    searchQuery: '',
    category: 'all',
    publisher: 'all',
  });

  const [categoryMenuAnchor, setCategoryMenuAnchor] = useState<null | HTMLElement>(null);
  const [publisherMenuAnchor, setPublisherMenuAnchor] = useState<null | HTMLElement>(null);

  // Fetch installed software using the asset's serial number
  useEffect(() => {
    const fetchSoftware = async () => {
      if (!asset?.serialNumber) {
        setIsLoading(false);
        setError(asset ? 'This asset has no serial number. Software information is only available for devices with a serial number registered in Intune.' : null);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const data = await softwareApi.getInstalledSoftware(asset.serialNumber);
        setSoftware(data);
      } catch (err) {
        logger.error('Error fetching installed software:', err);
        if ((err as { response?: { status: number } })?.response?.status === 404) {
          setError('Device not found in Intune. The device may not be enrolled or the serial number may be incorrect.');
        } else {
          setError(err instanceof Error ? err.message : 'Failed to load software');
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (!isLoadingAsset) {
      fetchSoftware();
    }
  }, [asset, isLoadingAsset]);

  // Fetch device health
  useEffect(() => {
    const fetchHealth = async () => {
      if (!asset?.serialNumber) {
        setIsLoadingHealth(false);
        return;
      }

      setIsLoadingHealth(true);
      try {
        const health = await softwareApi.getDeviceHealth(asset.serialNumber);
        setDeviceHealth(health);
      } catch (err) {
        logger.error('Error fetching device health:', err);
      } finally {
        setIsLoadingHealth(false);
      }
    };

    if (!isLoadingAsset) {
      fetchHealth();
    }
  }, [asset, isLoadingAsset]);

  // Get unique publishers for filter
  const publishers = useMemo(() => {
    const uniquePublishers = new Set(software.map((s) => s.publisher));
    return Array.from(uniquePublishers).sort();
  }, [software]);

  // Apply filters (sorting handled by DataGrid)
  const filteredSoftware = useMemo(() => {
    let result = [...software];

    // Apply search filter
    if (filters.searchQuery.trim()) {
      const query = filters.searchQuery.toLowerCase();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(query) ||
          s.publisher.toLowerCase().includes(query) ||
          s.version.toLowerCase().includes(query)
      );
    }

    // Apply category filter
    if (filters.category !== 'all') {
      result = result.filter((s) => s.category === filters.category);
    }

    // Apply publisher filter
    if (filters.publisher !== 'all') {
      result = result.filter((s) => s.publisher === filters.publisher);
    }

    // Add id field for DataGrid (software already has id from Intune)
    return result;
  }, [software, filters]);

  // Calculate statistics
  const totalSize = useMemo(() => {
    return software.reduce((sum, s) => sum + (s.size || 0), 0);
  }, [software]);

  const categoryStats = useMemo(() => {
    const stats = new Map<SoftwareCategory | 'Other', number>();
    software.forEach((s) => {
      const cat = s.category || SoftwareCategory.Other;
      stats.set(cat, (stats.get(cat) || 0) + 1);
    });
    return stats;
  }, [software]);

  const handleExport = () => {
    try {
      const blob = softwareApi.exportSoftwareToCSV(filteredSoftware);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${asset?.assetCode}-software-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      logger.error('Error exporting software:', err);
    }
  };

  // Column definitions for DataGrid
  const columns: GridColDef[] = useMemo(() => [
    {
      field: 'name',
      headerName: 'Application Name',
      width: 300,
      flex: 1,
      renderCell: (params: GridRenderCellParams<InstalledSoftware>) => (
        <Typography variant="body2" fontWeight={600} sx={{ color: ASSET_COLOR }}>
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'version',
      headerName: 'Version',
      width: 140,
      renderCell: (params: GridRenderCellParams) => (
        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'text.secondary' }}>
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'publisher',
      headerName: 'Publisher',
      width: 200,
      flex: 1,
      renderCell: (params: GridRenderCellParams) => (
        <Typography variant="body2" color="text.secondary">
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'category',
      headerName: 'Category',
      width: 160,
      renderCell: (params: GridRenderCellParams<InstalledSoftware>) => {
        if (!params.value) return null;
        return (
          <Chip
            label={params.value}
            size="small"
            sx={{
              height: 22,
              bgcolor: alpha(getCategoryColor(params.value), 0.15),
              color: getCategoryColor(params.value),
              border: '1px solid',
              borderColor: alpha(getCategoryColor(params.value), 0.3),
              fontWeight: 600,
              fontSize: '0.7rem',
            }}
          />
        );
      },
    },
    {
      field: 'installDate',
      headerName: 'Install Date',
      width: 130,
      align: 'right',
      headerAlign: 'right',
      renderCell: (params: GridRenderCellParams) => (
        <Typography variant="body2" color="text.secondary">
          {formatDate(params.value)}
        </Typography>
      ),
    },
    {
      field: 'size',
      headerName: 'Size',
      width: 110,
      align: 'right',
      headerAlign: 'right',
      renderCell: (params: GridRenderCellParams) => (
        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'text.secondary' }}>
          {formatSize(params.value)}
        </Typography>
      ),
    },
  ], []);

  // Advanced filters component
  const advancedFilters = useMemo(() => (
    <Box>
      <Box
        sx={{
          display: 'flex',
          gap: 2,
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
        }}
      >
        {/* Search */}
        <Box sx={{ flex: '1 1 300px', maxWidth: 500 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search software by name, publisher, or version..."
            value={filters.searchQuery}
            onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
              endAdornment: filters.searchQuery && (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={() => setFilters({ ...filters, searchQuery: '' })}
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

        {/* Filter Buttons */}
        <Box sx={{ display: 'flex', gap: 1 }}>
          {/* Category Filter */}
          <Tooltip title="Filter by category">
            <IconButton
              onClick={(e) => setCategoryMenuAnchor(e.currentTarget)}
              sx={{
                border: '1px solid',
                borderColor: filters.category !== 'all' ? 'primary.main' : 'divider',
                borderRadius: 2,
                color: filters.category !== 'all' ? 'primary.main' : 'inherit',
                '&:hover': {
                  backgroundColor: (theme) =>
                    theme.palette.mode === 'dark'
                      ? 'rgba(255, 119, 0, 0.1)'
                      : 'rgba(255, 119, 0, 0.05)',
                  borderColor: 'primary.main',
                },
              }}
            >
              {filters.category !== 'all' ? <CheckIcon /> : <CategoryIcon />}
            </IconButton>
          </Tooltip>

          {/* Publisher Filter */}
          <Tooltip title="Filter by publisher">
            <IconButton
              onClick={(e) => setPublisherMenuAnchor(e.currentTarget)}
              sx={{
                border: '1px solid',
                borderColor: filters.publisher !== 'all' ? 'primary.main' : 'divider',
                borderRadius: 2,
                color: filters.publisher !== 'all' ? 'primary.main' : 'inherit',
                '&:hover': {
                  backgroundColor: (theme) =>
                    theme.palette.mode === 'dark'
                      ? 'rgba(255, 119, 0, 0.1)'
                      : 'rgba(255, 119, 0, 0.05)',
                  borderColor: 'primary.main',
                },
              }}
            >
              {filters.publisher !== 'all' ? <CheckIcon /> : <BusinessIcon />}
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Active Filters Display */}
      {(filters.searchQuery || filters.category !== 'all' || filters.publisher !== 'all') && (
        <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            Active filters:
          </Typography>
          {filters.searchQuery && (
            <Chip
              label={`Search: "${filters.searchQuery}"`}
              onDelete={() => setFilters({ ...filters, searchQuery: '' })}
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
          {filters.category !== 'all' && (
            <Chip
              label={`Category: ${filters.category}`}
              onDelete={() => setFilters({ ...filters, category: 'all' })}
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
          {filters.publisher !== 'all' && (
            <Chip
              label={`Publisher: ${filters.publisher}`}
              onDelete={() => setFilters({ ...filters, publisher: 'all' })}
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
    </Box>
  ), [filters]);

  if (isLoadingAsset) return <Loading />;

  if (!asset) {
    return (
      <Box>
        <Alert severity="error" sx={{ border: '1px solid', borderColor: 'error.main', fontWeight: 600 }}>
          Asset not found
        </Alert>
        <Tooltip title="Back to Dashboard" arrow>
          <IconButton
            onClick={() => navigate('/')}
            sx={{
              mt: 2,
              width: 36,
              height: 36,
              borderRadius: 1,
              color: 'text.secondary',
              bgcolor: 'transparent',
              border: '1px solid',
              borderColor: 'divider',
              transition: 'all 0.15s ease',
              '&:hover': {
                color: ASSET_COLOR,
                bgcolor: alpha(ASSET_COLOR, 0.08),
                borderColor: ASSET_COLOR,
              },
            }}
          >
            <ArrowBackIcon />
          </IconButton>
        </Tooltip>
      </Box>
    );
  }

  return (
    <Box>
      {/* Back Button */}
      <Tooltip title="Back to Asset Details" arrow>
        <IconButton
          onClick={() => navigate(`/inventory/assets/${id}`)}
          sx={{
            mb: 2,
            width: 36,
            height: 36,
            borderRadius: 1,
            color: 'text.secondary',
            bgcolor: 'transparent',
            border: '1px solid',
            borderColor: 'divider',
            transition: 'all 0.15s ease',
            '&:hover': {
              color: ASSET_COLOR,
              bgcolor: alpha(ASSET_COLOR, 0.08),
              borderColor: ASSET_COLOR,
            },
          }}
        >
          <ArrowBackIcon />
        </IconButton>
      </Tooltip>

      {/* Header - Scanner style */}
      <Card elevation={0} sx={scannerCardSx}>
        <CardContent sx={{ p: 3 }}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              flexWrap: 'wrap',
              gap: 2,
            }}
          >
            <Box>
              <Typography variant="h4" component="h1" fontWeight={700} gutterBottom>
                Installed Software
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                <Typography variant="h6" color="text.secondary">
                  {asset.assetName}
                </Typography>
                <Chip
                  label={asset.assetCode}
                  size="small"
                  sx={{
                    fontWeight: 600,
                    fontFamily: 'monospace',
                    bgcolor: (theme) =>
                      theme.palette.mode === 'dark'
                        ? 'rgba(255, 215, 0, 0.15)'
                        : 'rgba(253, 185, 49, 0.15)',
                    color: 'primary.main',
                    border: '1px solid',
                    borderColor: 'primary.main',
                  }}
                />
              </Box>
            </Box>

            <Tooltip title="Export to CSV" arrow>
              <IconButton
                onClick={handleExport}
                disabled={software.length === 0}
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: 1,
                  color: ASSET_COLOR,
                  bgcolor: 'transparent',
                  border: '1px solid',
                  borderColor: alpha(ASSET_COLOR, 0.35),
                  transition: 'all 0.15s ease',
                  '&:hover': {
                    bgcolor: alpha(ASSET_COLOR, 0.08),
                    borderColor: ASSET_COLOR,
                  },
                  '&.Mui-disabled': {
                    color: 'text.disabled',
                    borderColor: 'divider',
                  },
                }}
              >
                <DownloadIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </CardContent>
      </Card>

      {/* Device Health Section */}
      {!isLoadingHealth && deviceHealth && (
        <Card elevation={0} sx={{ ...scannerCardSx, mb: 3 }}>
          <CardContent sx={{ p: 0 }}>
            {/* Health Header - Clickable to expand/collapse */}
            <Box
              onClick={() => setHealthExpanded(!healthExpanded)}
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                p: 2.5,
                cursor: 'pointer',
                borderBottom: healthExpanded ? '1px solid' : 'none',
                borderColor: 'divider',
                '&:hover': {
                  bgcolor: (theme) =>
                    theme.palette.mode === 'dark'
                      ? 'rgba(255, 255, 255, 0.02)'
                      : 'rgba(0, 0, 0, 0.01)',
                },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 48,
                    height: 48,
                    borderRadius: 2,
                    bgcolor:
                      deviceHealth.healthStatus === 'Healthy'
                        ? 'rgba(76, 175, 80, 0.15)'
                        : deviceHealth.healthStatus === 'Warning'
                          ? 'rgba(255, 152, 0, 0.15)'
                          : 'rgba(244, 67, 54, 0.15)',
                    color:
                      deviceHealth.healthStatus === 'Healthy'
                        ? '#4CAF50'
                        : deviceHealth.healthStatus === 'Warning'
                          ? '#FF9800'
                          : '#F44336',
                  }}
                >
                  {deviceHealth.healthStatus === 'Healthy' ? (
                    <VerifiedUserIcon />
                  ) : deviceHealth.healthStatus === 'Warning' ? (
                    <WarningAmberIcon />
                  ) : (
                    <GppBadIcon />
                  )}
                </Box>
                <Box>
                  <Typography variant="h6" fontWeight={700}>
                    Device Health
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <Chip
                      label={`Score: ${deviceHealth.healthScore}/100`}
                      size="small"
                      sx={{
                        fontWeight: 600,
                        bgcolor:
                          deviceHealth.healthScore >= 80
                            ? 'rgba(76, 175, 80, 0.15)'
                            : deviceHealth.healthScore >= 50
                              ? 'rgba(255, 152, 0, 0.15)'
                              : 'rgba(244, 67, 54, 0.15)',
                        color:
                          deviceHealth.healthScore >= 80
                            ? '#4CAF50'
                            : deviceHealth.healthScore >= 50
                              ? '#FF9800'
                              : '#F44336',
                      }}
                    />
                    <Chip
                      label={deviceHealth.healthStatus}
                      size="small"
                      variant="outlined"
                      sx={{
                        fontWeight: 500,
                        borderColor:
                          deviceHealth.healthStatus === 'Healthy'
                            ? '#4CAF50'
                            : deviceHealth.healthStatus === 'Warning'
                              ? '#FF9800'
                              : '#F44336',
                        color:
                          deviceHealth.healthStatus === 'Healthy'
                            ? '#4CAF50'
                            : deviceHealth.healthStatus === 'Warning'
                              ? '#FF9800'
                              : '#F44336',
                      }}
                    />
                  </Box>
                </Box>
              </Box>
              <IconButton size="small">
                {healthExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            </Box>

            {/* Health Content */}
            {healthExpanded && (
              <Box sx={{ p: 2.5 }}>
                {/* Device Info Grid */}
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
                    gap: 2,
                    mb: 3,
                  }}
                >
                  {/* Compliance Status */}
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 2,
                      bgcolor: deviceHealth.isCompliant ? 'rgba(76, 175, 80, 0.05)' : 'rgba(244, 67, 54, 0.05)',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      {deviceHealth.isCompliant ? (
                        <VerifiedUserIcon sx={{ color: '#4CAF50', fontSize: 20 }} />
                      ) : (
                        <GppBadIcon sx={{ color: '#F44336', fontSize: 20 }} />
                      )}
                      <Typography variant="caption" fontWeight={600} color="text.secondary">
                        COMPLIANCE
                      </Typography>
                    </Box>
                    <Typography variant="body1" fontWeight={600} color={deviceHealth.isCompliant ? '#4CAF50' : '#F44336'}>
                      {deviceHealth.isCompliant ? 'Compliant' : 'Non-Compliant'}
                    </Typography>
                  </Paper>

                  {/* Encryption Status */}
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 2,
                      bgcolor: deviceHealth.isEncrypted ? 'rgba(76, 175, 80, 0.05)' : 'rgba(244, 67, 54, 0.05)',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      {deviceHealth.isEncrypted ? (
                        <LockIcon sx={{ color: '#4CAF50', fontSize: 20 }} />
                      ) : (
                        <LockOpenIcon sx={{ color: '#F44336', fontSize: 20 }} />
                      )}
                      <Typography variant="caption" fontWeight={600} color="text.secondary">
                        ENCRYPTION
                      </Typography>
                    </Box>
                    <Typography variant="body1" fontWeight={600} color={deviceHealth.isEncrypted ? '#4CAF50' : '#F44336'}>
                      {deviceHealth.isEncrypted ? 'Encrypted' : 'Not Encrypted'}
                    </Typography>
                  </Paper>

                  {/* Storage */}
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 2,
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <StorageIcon sx={{ color: '#2196F3', fontSize: 20 }} />
                      <Typography variant="caption" fontWeight={600} color="text.secondary">
                        STORAGE
                      </Typography>
                    </Box>
                    <Typography variant="body1" fontWeight={600}>
                      {deviceHealth.storageUsagePercent?.toFixed(0) || '-'}% used
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatBytes(deviceHealth.freeStorageBytes)} free of {formatBytes(deviceHealth.totalStorageBytes)}
                    </Typography>
                  </Paper>

                  {/* Memory */}
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 2,
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <MemoryIcon sx={{ color: '#9C27B0', fontSize: 20 }} />
                      <Typography variant="caption" fontWeight={600} color="text.secondary">
                        MEMORY
                      </Typography>
                    </Box>
                    <Typography variant="body1" fontWeight={600}>
                      {formatBytes(deviceHealth.physicalMemoryBytes)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Physical RAM
                    </Typography>
                  </Paper>
                </Box>

                {/* Device Details */}
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
                  <Chip
                    icon={<ComputerIcon />}
                    label={`${deviceHealth.manufacturer || ''} ${deviceHealth.model || ''}`}
                    size="small"
                    variant="outlined"
                  />
                  <Chip
                    icon={<AppsIcon />}
                    label={`${deviceHealth.operatingSystem} ${deviceHealth.osVersion}`}
                    size="small"
                    variant="outlined"
                  />
                  {deviceHealth.lastSyncDateTime && (
                    <Chip
                      icon={<SyncIcon />}
                      label={`Last sync: ${formatDate(deviceHealth.lastSyncDateTime)}`}
                      size="small"
                      variant="outlined"
                    />
                  )}
                </Box>
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      {/* Statistics Cards */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(4, 1fr)',
          },
          gap: 2,
          mb: 3,
        }}
      >
        {/* Total Applications */}
        <Card
          elevation={0}
          sx={{
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
            background: (theme) =>
              theme.palette.mode === 'dark'
                ? 'linear-gradient(135deg, rgba(33,150,243,0.15) 0%, rgba(25,118,210,0.08) 100%)'
                : 'linear-gradient(135deg, rgba(33,150,243,0.12) 0%, rgba(100,181,246,0.06) 100%)',
            transition: 'all 0.3s ease',
            '&:hover': {
              borderColor: '#2196F3',
              boxShadow: '0 4px 20px rgba(33,150,243,0.2)',
            },
          }}
        >
          <CardContent sx={{ p: 2.5 }}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: 'rgba(33,150,243,0.2)',
                  color: '#2196F3',
                }}
              >
                <AppsIcon sx={{ fontSize: 28 }} />
              </Box>
              <Box>
                <Typography variant="h4" fontWeight={800} color="#2196F3">
                  {software.length}
                </Typography>
                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                  TOTAL APPS
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>

        {/* Total Size */}
        <Card
          elevation={0}
          sx={{
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
            background: (theme) =>
              theme.palette.mode === 'dark'
                ? 'linear-gradient(135deg, rgba(156,39,176,0.15) 0%, rgba(123,31,162,0.08) 100%)'
                : 'linear-gradient(135deg, rgba(156,39,176,0.12) 0%, rgba(186,104,200,0.06) 100%)',
            transition: 'all 0.3s ease',
            '&:hover': {
              borderColor: '#9C27B0',
              boxShadow: '0 4px 20px rgba(156,39,176,0.2)',
            },
          }}
        >
          <CardContent sx={{ p: 2.5 }}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: 'rgba(156,39,176,0.2)',
                  color: '#9C27B0',
                }}
              >
                <StorageIcon sx={{ fontSize: 28 }} />
              </Box>
              <Box>
                <Typography variant="h4" fontWeight={800} color="#9C27B0">
                  {formatSize(totalSize)}
                </Typography>
                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                  TOTAL SIZE
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>

        {/* Categories */}
        <Card
          elevation={0}
          sx={{
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
            background: (theme) =>
              theme.palette.mode === 'dark'
                ? 'linear-gradient(135deg, rgba(76,175,80,0.15) 0%, rgba(56,142,60,0.08) 100%)'
                : 'linear-gradient(135deg, rgba(76,175,80,0.12) 0%, rgba(129,199,132,0.06) 100%)',
            transition: 'all 0.3s ease',
            '&:hover': {
              borderColor: '#4CAF50',
              boxShadow: '0 4px 20px rgba(76,175,80,0.2)',
            },
          }}
        >
          <CardContent sx={{ p: 2.5 }}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: 'rgba(76,175,80,0.2)',
                  color: '#4CAF50',
                }}
              >
                <CategoryIcon sx={{ fontSize: 28 }} />
              </Box>
              <Box>
                <Typography variant="h4" fontWeight={800} color="#4CAF50">
                  {categoryStats.size}
                </Typography>
                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                  CATEGORIES
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>

        {/* Publishers */}
        <Card
          elevation={0}
          sx={{
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
            background: (theme) =>
              theme.palette.mode === 'dark'
                ? 'linear-gradient(135deg, rgba(255,152,0,0.15) 0%, rgba(245,124,0,0.08) 100%)'
                : 'linear-gradient(135deg, rgba(255,152,0,0.12) 0%, rgba(255,183,77,0.06) 100%)',
            transition: 'all 0.3s ease',
            '&:hover': {
              borderColor: '#FF9800',
              boxShadow: '0 4px 20px rgba(255,152,0,0.2)',
            },
          }}
        >
          <CardContent sx={{ p: 2.5 }}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: 'rgba(255,152,0,0.2)',
                  color: '#FF9800',
                }}
              >
                <BusinessIcon sx={{ fontSize: 28 }} />
              </Box>
              <Box>
                <Typography variant="h4" fontWeight={800} color="#FF9800">
                  {publishers.length}
                </Typography>
                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                  PUBLISHERS
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Box>

      {/* Filters moved to advancedFilters prop in NeumorphicDataGrid */}

      {/* Category Filter Menu */}
      <Menu
        anchorEl={categoryMenuAnchor}
        open={Boolean(categoryMenuAnchor)}
        onClose={() => setCategoryMenuAnchor(null)}
        PaperProps={{
          sx: {
            mt: 1,
            minWidth: 200,
            border: '1px solid',
            borderColor: 'divider',
          },
        }}
      >
        <MenuItem
          onClick={() => {
            setFilters({ ...filters, category: 'all' });
            setCategoryMenuAnchor(null);
          }}
          selected={filters.category === 'all'}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
            <span>All Categories</span>
            {filters.category === 'all' && <CheckIcon fontSize="small" color="primary" />}
          </Box>
        </MenuItem>
        <Divider />
        {Object.values(SoftwareCategory).map((cat) => (
          <MenuItem
            key={cat}
            onClick={() => {
              setFilters({ ...filters, category: cat });
              setCategoryMenuAnchor(null);
            }}
            selected={filters.category === cat}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', gap: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    bgcolor: getCategoryColor(cat),
                  }}
                />
                <span>{cat}</span>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Chip label={categoryStats.get(cat) || 0} size="small" />
                {filters.category === cat && <CheckIcon fontSize="small" color="primary" />}
              </Box>
            </Box>
          </MenuItem>
        ))}
      </Menu>

      {/* Publisher Filter Menu */}
      <Menu
        anchorEl={publisherMenuAnchor}
        open={Boolean(publisherMenuAnchor)}
        onClose={() => setPublisherMenuAnchor(null)}
        PaperProps={{
          sx: {
            mt: 1,
            minWidth: 200,
            maxHeight: 400,
            border: '1px solid',
            borderColor: 'divider',
          },
        }}
      >
        <MenuItem
          onClick={() => {
            setFilters({ ...filters, publisher: 'all' });
            setPublisherMenuAnchor(null);
          }}
          selected={filters.publisher === 'all'}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
            <span>All Publishers</span>
            {filters.publisher === 'all' && <CheckIcon fontSize="small" color="primary" />}
          </Box>
        </MenuItem>
        <Divider />
        {publishers.map((pub) => (
          <MenuItem
            key={pub}
            onClick={() => {
              setFilters({ ...filters, publisher: pub });
              setPublisherMenuAnchor(null);
            }}
            selected={filters.publisher === pub}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
              <span>{pub}</span>
              {filters.publisher === pub && <CheckIcon fontSize="small" color="primary" />}
            </Box>
          </MenuItem>
        ))}
      </Menu>

      {/* Software Table */}
      {isLoading ? (
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <Loading message="Loading installed software..." />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ m: 3 }}>
          {error}
        </Alert>
      ) : (
        <NeumorphicDataGrid
          rows={filteredSoftware}
          columns={columns}
          loading={isLoading}
          accentColor={ASSET_COLOR}
          advancedFilters={advancedFilters}
          exportable
          onExport={handleExport}
          initialPageSize={25}
          autoHeight
        />
      )}

      {/* Results Count */}
      {!isLoading && !error && filteredSoftware.length > 0 && (
        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Showing {filteredSoftware.length} of {software.length} applications
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default InstalledSoftwarePage;

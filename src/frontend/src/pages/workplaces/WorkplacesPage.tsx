import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  IconButton,
  Card,
  CardContent,
  Fab,
  Stack,
  Snackbar,
  Alert,
  useMediaQuery,
  useTheme,
  Tooltip,
  Collapse,
  Chip,
  alpha,
  Paper,
  TextField,
  InputAdornment,
  Skeleton,
  Checkbox,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PlaceIcon from '@mui/icons-material/Place';
import PersonIcon from '@mui/icons-material/Person';
import ComputerIcon from '@mui/icons-material/Computer';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import DeskIcon from '@mui/icons-material/Desk';
import LaptopIcon from '@mui/icons-material/Laptop';
import PersonOffIcon from '@mui/icons-material/PersonOff';
import InventoryIcon from '@mui/icons-material/Inventory';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import BusinessIcon from '@mui/icons-material/Business';
import ApartmentIcon from '@mui/icons-material/Apartment';
import ClearAllIcon from '@mui/icons-material/ClearAll';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import CheckIcon from '@mui/icons-material/Check';
import {
  usePhysicalWorkplaces,
  useDeletePhysicalWorkplace,
  useClearOccupant,
  useWorkplaceStatistics,
} from '../../hooks/usePhysicalWorkplaces';
import {
  PhysicalWorkplace,
  WorkplaceType,
  WorkplaceTypeLabels,
  PhysicalWorkplaceFilters,
} from '../../types/physicalWorkplace.types';
import Loading from '../../components/common/Loading';
import ApiErrorDisplay from '../../components/common/ApiErrorDisplay';
import { useServicesBySector } from '../../hooks/useOrganization';
import { buildingsApi } from '../../api/admin.api';
import WorkplaceAssetsDialog from '../../components/workplaces/WorkplaceAssetsDialog';
import BulkImportWorkplacesDialog from '../../components/workplaces/BulkImportWorkplacesDialog';
import EditPhysicalWorkplaceDialog from '../../components/workplaces/EditPhysicalWorkplaceDialog';
import NeomorphConfirmDialog from '../../components/workplaces/NeomorphConfirmDialog';
import EquipmentChip from '../../components/workplaces/EquipmentChip';
import WorkplaceOccupantChip from '../../components/workplaces/WorkplaceOccupantChip';
import AdminDataTable, { Column } from '../../components/admin/AdminDataTable';
import {
  WORKPLACE_COLOR,
  EMPLOYEE_COLOR,
  ASSET_COLOR,
  SERVICE_COLOR,
  BUILDING_COLOR,
} from '../../constants/filterColors';
import { getNeumorph, getNeumorphInset, getNeumorphColors } from '../../utils/neumorphicStyles';

// Workplace accent color (teal - aligned with sector-service-workplace hierarchy)
const workplaceAccent = WORKPLACE_COLOR;

type SnackbarState = {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'info' | 'warning';
};

const getWorkplaceTypeIcon = (type: WorkplaceType) => {
  switch (type) {
    case WorkplaceType.Desktop:
      return <ComputerIcon fontSize="small" />;
    case WorkplaceType.Laptop:
      return <LaptopIcon fontSize="small" />;
    case WorkplaceType.HotDesk:
      return <DeskIcon fontSize="small" />;
    case WorkplaceType.MeetingRoom:
      return <MeetingRoomIcon fontSize="small" />;
    default:
      return <DeskIcon fontSize="small" />;
  }
};

const PhysicalWorkplacesPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const neumorphColors = getNeumorphColors(isDark);
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  // Filter state
  const [filters, setFilters] = useState<PhysicalWorkplaceFilters>({});
  const [searchTerm, setSearchTerm] = useState('');

  // Multiselect filter state (comma-separated IDs)
  // Initialize from URL query params if present
  const initialServiceFilter = searchParams.get('service') || '';
  const [serviceFilter, setServiceFilter] = useState(initialServiceFilter);
  const [buildingFilter, setBuildingFilter] = useState(() => searchParams.get('building') || '');
  const [serviceFilterExpanded, setServiceFilterExpanded] = useState(!!initialServiceFilter);
  const [buildingFilterExpanded, setBuildingFilterExpanded] = useState(false);
  const [expandedSectors, setExpandedSectors] = useState<Set<number>>(new Set());

  // Sync URL params with filter state (for navigation from other pages) - intentional URL sync
  useEffect(() => {
    const serviceParam = searchParams.get('service');
    if (serviceParam && serviceParam !== serviceFilter) {
      setServiceFilter(serviceParam);
      setServiceFilterExpanded(true); // Auto-expand filter panel when filtering via URL
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [clearOccupantDialogOpen, setClearOccupantDialogOpen] = useState(false);
  const [assetsDialogOpen, setAssetsDialogOpen] = useState(false);
  const [bulkImportDialogOpen, setBulkImportDialogOpen] = useState(false);
  const [editingWorkplace, setEditingWorkplace] = useState<PhysicalWorkplace | null>(null);
  const [deletingWorkplace, setDeletingWorkplace] = useState<PhysicalWorkplace | null>(null);
  const [clearingOccupantWorkplace, setClearingOccupantWorkplace] = useState<PhysicalWorkplace | null>(null);
  const [managingAssetsWorkplace, setManagingAssetsWorkplace] = useState<PhysicalWorkplace | null>(null);
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'success',
  });

  const { data: workplaces, isLoading, error, refetch } = usePhysicalWorkplaces(filters);
  const { data: statisticsData } = useWorkplaceStatistics();
  const deleteMutation = useDeletePhysicalWorkplace();
  const clearOccupantMutation = useClearOccupant();

  // Fetch services for the expandable panel
  const { data: sectors, isLoading: servicesLoading } = useServicesBySector(false);

  // Fetch buildings for the expandable panel
  const { data: buildings, isLoading: buildingsLoading } = useQuery({
    queryKey: ['buildings'],
    queryFn: () => buildingsApi.getAll(),
    staleTime: 5 * 60 * 1000,
  });

  // Filter only active buildings and sort by sortOrder
  const activeBuildings = (buildings || [])
    .filter(building => building.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  // Parse selected service IDs from comma-separated string
  const selectedServiceIds = useMemo(() =>
    serviceFilter
      ? serviceFilter.split(',').map(id => parseInt(id, 10)).filter(id => !isNaN(id))
      : [],
    [serviceFilter]
  );

  // Parse selected building IDs from comma-separated string
  const selectedBuildingIds = useMemo(() =>
    buildingFilter
      ? buildingFilter.split(',').map(id => parseInt(id, 10)).filter(id => !isNaN(id))
      : [],
    [buildingFilter]
  );

  // Get selected building names for chip display
  const selectedBuildings = activeBuildings.filter(b => selectedBuildingIds.includes(b.id));

  // Apply client-side filtering by service and building IDs
  const filteredWorkplaces = useMemo(() => {
    if (!workplaces) return [];

    let result = [...workplaces];

    // Filter by selected services
    if (selectedServiceIds.length > 0) {
      result = result.filter(wp => wp.serviceId && selectedServiceIds.includes(wp.serviceId));
    }

    // Filter by selected buildings
    if (selectedBuildingIds.length > 0) {
      result = result.filter(wp => wp.buildingId && selectedBuildingIds.includes(wp.buildingId));
    }

    return result;
  }, [workplaces, selectedServiceIds, selectedBuildingIds]);

  // Real statistics from dedicated endpoint (unfiltered)
  const stats = useMemo(() => {
    if (!statisticsData) return { total: 0, active: 0, inactive: 0, occupied: 0, vacant: 0 };
    return {
      total: statisticsData.totalWorkplaces,
      active: statisticsData.activeWorkplaces,
      inactive: statisticsData.totalWorkplaces - statisticsData.activeWorkplaces,
      occupied: statisticsData.occupiedWorkplaces,
      vacant: statisticsData.vacantWorkplaces,
    };
  }, [statisticsData]);

  const handleOpenDialog = (workplace?: PhysicalWorkplace) => {
    setEditingWorkplace(workplace ?? null);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingWorkplace(null);
  };

  const handleOpenDeleteDialog = (workplace: PhysicalWorkplace) => {
    setDeletingWorkplace(workplace);
    setDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setDeletingWorkplace(null);
  };

  const handleOpenClearOccupantDialog = (workplace: PhysicalWorkplace) => {
    setClearingOccupantWorkplace(workplace);
    setClearOccupantDialogOpen(true);
  };

  const handleCloseClearOccupantDialog = () => {
    setClearOccupantDialogOpen(false);
    setClearingOccupantWorkplace(null);
  };

  const handleOpenAssetsDialog = (workplace: PhysicalWorkplace) => {
    setManagingAssetsWorkplace(workplace);
    setAssetsDialogOpen(true);
  };

  const handleCloseAssetsDialog = () => {
    setAssetsDialogOpen(false);
    setManagingAssetsWorkplace(null);
  };

  const handleDelete = async () => {
    if (!deletingWorkplace) return;

    try {
      await deleteMutation.mutateAsync({ id: deletingWorkplace.id, hardDelete: false });
      setSnackbar({
        open: true,
        message: t('physicalWorkplaces.deleteSuccess'),
        severity: 'success',
      });
      handleCloseDeleteDialog();
    } catch {
      setSnackbar({
        open: true,
        message: t('physicalWorkplaces.deleteError'),
        severity: 'error',
      });
    }
  };

  const handleClearOccupant = async () => {
    if (!clearingOccupantWorkplace) return;

    try {
      await clearOccupantMutation.mutateAsync(clearingOccupantWorkplace.id);
      setSnackbar({
        open: true,
        message: t('physicalWorkplaces.occupantCleared'),
        severity: 'success',
      });
      handleCloseClearOccupantDialog();
    } catch {
      setSnackbar({
        open: true,
        message: t('physicalWorkplaces.clearOccupantError'),
        severity: 'error',
      });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  // Service filter handlers
  const handleServiceToggle = () => {
    setServiceFilterExpanded(!serviceFilterExpanded);
  };

  const handleServiceSelect = (serviceId: number) => {
    const isCurrentlySelected = selectedServiceIds.includes(serviceId);
    if (isCurrentlySelected) {
      const newIds = selectedServiceIds.filter(id => id !== serviceId);
      setServiceFilter(newIds.length > 0 ? newIds.join(',') : '');
    } else {
      const newIds = [...selectedServiceIds, serviceId];
      setServiceFilter(newIds.join(','));
    }
  };

  const handleClearServiceFilter = () => {
    setServiceFilter('');
    setServiceFilterExpanded(false);
  };

  // Sector expand/collapse handler
  const toggleSectorExpand = (sectorId: number) => {
    setExpandedSectors(prev => {
      const next = new Set(prev);
      if (next.has(sectorId)) {
        next.delete(sectorId);
      } else {
        next.add(sectorId);
      }
      return next;
    });
  };

  // Toggle all services in a sector
  const toggleSectorServices = (sectorId: number) => {
    const sector = sectors?.find(s => s.id === sectorId);
    if (!sector) return;

    const sectorServiceIds = sector.services.filter(s => s.isActive).map(s => s.id);
    const allSelected = sectorServiceIds.every(id => selectedServiceIds.includes(id));

    if (allSelected) {
      // Deselect all services in this sector
      const newIds = selectedServiceIds.filter(id => !sectorServiceIds.includes(id));
      setServiceFilter(newIds.length > 0 ? newIds.join(',') : '');
    } else {
      // Select all services in this sector
      const newIds = [...new Set([...selectedServiceIds, ...sectorServiceIds])];
      setServiceFilter(newIds.join(','));
    }
  };

  // Building filter handlers
  const handleBuildingToggle = () => {
    setBuildingFilterExpanded(!buildingFilterExpanded);
  };

  const handleBuildingSelect = (buildingId: number) => {
    const isCurrentlySelected = selectedBuildingIds.includes(buildingId);
    if (isCurrentlySelected) {
      const newIds = selectedBuildingIds.filter(id => id !== buildingId);
      setBuildingFilter(newIds.length > 0 ? newIds.join(',') : '');
    } else {
      const newIds = [...selectedBuildingIds, buildingId];
      setBuildingFilter(newIds.join(','));
    }
  };

  const handleClearBuildingFilter = () => {
    setBuildingFilter('');
    setBuildingFilterExpanded(false);
  };

  const clearFilters = () => {
    setFilters({});
    setServiceFilter('');
    setBuildingFilter('');
    setServiceFilterExpanded(false);
    setBuildingFilterExpanded(false);
  };

  const hasActiveFilters = Object.values(filters).some(v => v !== undefined) || serviceFilter || buildingFilter;

  // Define columns for AdminDataTable
  const columns: Column<PhysicalWorkplace>[] = useMemo(() => [
    {
      id: 'code',
      label: 'Code',
      minWidth: 120,
      format: (item) => (
        <Stack
          component={Link}
          to={`/workplaces/${item.id}`}
          direction="row"
          spacing={1}
          alignItems="center"
          sx={{
            textDecoration: 'none',
            transition: 'all 0.15s ease',
            py: 0.5,
            px: 0.75,
            mx: -0.75,
            borderRadius: 1,
            '&:hover': {
              bgcolor: alpha(workplaceAccent, 0.08),
              transform: 'translateX(2px)',
            },
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 28,
              height: 28,
              borderRadius: 1.5,
              bgcolor: isDark ? alpha(workplaceAccent, 0.15) : alpha(workplaceAccent, 0.1),
              color: workplaceAccent,
            }}
          >
            {getWorkplaceTypeIcon(item.type)}
          </Box>
          <Typography
            sx={{
              fontFamily: 'monospace',
              fontWeight: 700,
              color: workplaceAccent,
              fontSize: '0.85rem',
              '&:hover': { textDecoration: 'underline' },
            }}
          >
            {item.code}
          </Typography>
        </Stack>
      ),
    },
    {
      id: 'name',
      label: 'Naam',
      minWidth: 150,
      format: (item) => (
        <Box>
          <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.85rem' }}>
            {item.name}
          </Typography>
          {item.serviceName && (
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
              {item.serviceName}
            </Typography>
          )}
        </Box>
      ),
    },
    {
      id: 'type',
      label: 'Type',
      minWidth: 100,
      format: (item) => (
        <Chip
          label={WorkplaceTypeLabels[item.type]}
          size="small"
          sx={{
            height: 22,
            fontSize: '0.7rem',
            fontWeight: 600,
            bgcolor: isDark ? alpha(workplaceAccent, 0.15) : alpha(workplaceAccent, 0.08),
            color: workplaceAccent,
            border: '1px solid',
            borderColor: alpha(workplaceAccent, 0.3),
          }}
        />
      ),
    },
    {
      id: 'buildingName',
      label: 'Locatie',
      minWidth: 130,
      format: (item) => (
        <Box>
          <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.8rem' }}>
            {item.buildingName || '-'}
          </Typography>
          {(item.floor || item.room) && (
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
              {item.floor && `${item.floor}`}
              {item.floor && item.room && ' • '}
              {item.room && `${item.room}`}
            </Typography>
          )}
        </Box>
      ),
    },
    {
      id: 'currentOccupantName',
      label: 'Bezetter',
      minWidth: 140,
      format: (item) => <WorkplaceOccupantChip workplace={item} showVacant={true} />,
    },
    {
      id: 'fixedAssetCount',
      label: 'Equipment',
      minWidth: 110,
      sortable: false,
      searchable: false,
      format: (item) => <EquipmentChip workplace={item} compact={true} />,
    },
  ], [isDark]);

  // Custom action render for AdminDataTable
  const renderActions = (item: PhysicalWorkplace) => (
    <Stack direction="row" spacing={0.5} justifyContent="center">
      <Tooltip title={t('physicalWorkplaces.manageAssets')} arrow>
        <IconButton
          size="small"
          onClick={() => handleOpenAssetsDialog(item)}
          sx={{
            width: 28,
            height: 28,
            borderRadius: 0.75,
            color: ASSET_COLOR,
            bgcolor: 'transparent',
            border: '1px solid',
            borderColor: alpha(ASSET_COLOR, 0.35),
            transition: 'all 0.15s ease',
            '&:hover': {
              bgcolor: alpha(ASSET_COLOR, 0.08),
              borderColor: ASSET_COLOR,
            },
          }}
        >
          <InventoryIcon sx={{ fontSize: 15 }} />
        </IconButton>
      </Tooltip>
      <Tooltip title={t('common.edit')} arrow>
        <IconButton
          size="small"
          onClick={() => handleOpenDialog(item)}
          sx={{
            width: 28,
            height: 28,
            borderRadius: 0.75,
            color: ASSET_COLOR,
            bgcolor: 'transparent',
            border: '1px solid',
            borderColor: alpha(ASSET_COLOR, 0.35),
            transition: 'all 0.15s ease',
            '&:hover': {
              bgcolor: alpha(ASSET_COLOR, 0.08),
              borderColor: ASSET_COLOR,
            },
          }}
        >
          <EditIcon sx={{ fontSize: 15 }} />
        </IconButton>
      </Tooltip>
      {(item.currentOccupantEntraId || item.currentOccupantName) && (
        <Tooltip title={t('physicalWorkplaces.clearOccupant')} arrow>
          <IconButton
            size="small"
            onClick={() => handleOpenClearOccupantDialog(item)}
            sx={{
              width: 28,
              height: 28,
              borderRadius: 0.75,
              color: '#9C27B0',
              bgcolor: 'transparent',
              border: '1px solid',
              borderColor: alpha('#9C27B0', 0.35),
              transition: 'all 0.15s ease',
              '&:hover': {
                bgcolor: alpha('#9C27B0', 0.08),
                borderColor: '#9C27B0',
              },
            }}
          >
            <PersonOffIcon sx={{ fontSize: 15 }} />
          </IconButton>
        </Tooltip>
      )}
      <Tooltip title={t('common.delete')} arrow>
        <IconButton
          size="small"
          onClick={() => handleOpenDeleteDialog(item)}
          sx={{
            width: 28,
            height: 28,
            borderRadius: 0.75,
            color: '#EF5350',
            bgcolor: 'transparent',
            border: '1px solid',
            borderColor: alpha('#EF5350', 0.35),
            transition: 'all 0.15s ease',
            '&:hover': {
              bgcolor: alpha('#EF5350', 0.08),
              borderColor: '#EF5350',
            },
          }}
        >
          <DeleteIcon sx={{ fontSize: 15 }} />
        </IconButton>
      </Tooltip>
    </Stack>
  );

  if (isLoading) return <Loading message={t('physicalWorkplaces.loading')} />;

  if (error) {
    const isNetworkError =
      error instanceof Error &&
      (error.message.includes('Network Error') ||
        error.message.includes('ERR_CONNECTION_REFUSED') ||
        error.message.includes('fetch'));

    if (isNetworkError) {
      return <ApiErrorDisplay onRetry={() => refetch()} />;
    }

    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="h6" color="error">
          {t('physicalWorkplaces.errorLoading')}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {error instanceof Error ? error.message : t('errors.unexpectedError')}
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ pb: 10, minHeight: '100vh' }}>
      {/* Back Button */}
      <Tooltip title={t('common.backToDashboard')}>
        <IconButton
          onClick={() => navigate('/')}
          sx={{
            mb: 2,
            width: 40,
            height: 40,
            borderRadius: 2,
            color: 'text.secondary',
            bgcolor: neumorphColors.bgSurface,
            boxShadow: getNeumorph(isDark, 'soft'),
            transition: 'all 0.2s ease',
            '&:hover': {
              color: workplaceAccent,
              bgcolor: neumorphColors.bgSurface,
              transform: 'translateX(-2px)',
              boxShadow: `0 4px 12px ${alpha(workplaceAccent, 0.3)}`,
            },
            '&:active': {
              boxShadow: getNeumorphInset(isDark),
              transform: 'translateX(0)',
            },
          }}
        >
          <ArrowBackIcon />
        </IconButton>
      </Tooltip>

      {/* Header */}
      <Paper
        elevation={0}
        sx={{
          mb: 3,
          borderRadius: 3,
          bgcolor: neumorphColors.bgSurface,
          boxShadow: getNeumorph(isDark, 'medium'),
          overflow: 'hidden',
        }}
      >
        <Box sx={{ p: 3 }}>
          <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 56,
                height: 56,
                borderRadius: 2.5,
                bgcolor: alpha(workplaceAccent, 0.12),
                boxShadow: getNeumorphInset(isDark),
              }}
            >
              <PlaceIcon
                sx={{
                  fontSize: 32,
                  color: workplaceAccent,
                  filter: isDark ? `drop-shadow(0 0 6px ${alpha(workplaceAccent, 0.6)})` : 'none',
                }}
              />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography
                variant="h4"
                component="h1"
                sx={{
                  fontWeight: 700,
                  color: workplaceAccent,
                  textShadow: isDark ? `0 0 20px ${alpha(workplaceAccent, 0.3)}` : 'none',
                }}
              >
                {t('physicalWorkplaces.title')}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {t('physicalWorkplaces.subtitle')}
              </Typography>
            </Box>
            <Stack direction="row" spacing={1} alignItems="center" useFlexGap flexWrap="wrap">
              <Chip
                icon={<PlaceIcon />}
                label={`${stats.total} werkplekken`}
                onClick={() => setFilters(prev => ({ ...prev, hasOccupant: undefined, isActive: undefined }))}
                sx={{
                  height: 32,
                  fontWeight: 700,
                  cursor: 'pointer',
                  bgcolor: filters.hasOccupant === undefined && filters.isActive === undefined ? workplaceAccent : 'transparent',
                  color: filters.hasOccupant === undefined && filters.isActive === undefined ? '#fff' : workplaceAccent,
                  border: '1px solid',
                  borderColor: workplaceAccent,
                  '& .MuiChip-icon': { color: filters.hasOccupant === undefined && filters.isActive === undefined ? '#fff' : workplaceAccent },
                  transition: 'all 0.2s ease',
                  '&:hover': { bgcolor: filters.hasOccupant === undefined && filters.isActive === undefined ? workplaceAccent : alpha(workplaceAccent, 0.15) },
                }}
              />
              <Chip
                icon={<PersonIcon />}
                label={`${stats.occupied} bezet`}
                onClick={() => setFilters(prev => ({ ...prev, hasOccupant: prev.hasOccupant === true ? undefined : true }))}
                sx={{
                  height: 32,
                  fontWeight: 600,
                  cursor: 'pointer',
                  bgcolor: filters.hasOccupant === true ? EMPLOYEE_COLOR : 'transparent',
                  color: filters.hasOccupant === true ? '#fff' : EMPLOYEE_COLOR,
                  border: '1px solid',
                  borderColor: EMPLOYEE_COLOR,
                  '& .MuiChip-icon': { color: filters.hasOccupant === true ? '#fff' : EMPLOYEE_COLOR },
                  transition: 'all 0.2s ease',
                  '&:hover': { bgcolor: filters.hasOccupant === true ? EMPLOYEE_COLOR : alpha(EMPLOYEE_COLOR, 0.15) },
                }}
              />
              <Chip
                icon={<DeskIcon />}
                label={`${stats.vacant} vrij`}
                onClick={() => setFilters(prev => ({ ...prev, hasOccupant: prev.hasOccupant === false ? undefined : false }))}
                sx={{
                  height: 32,
                  fontWeight: 600,
                  cursor: 'pointer',
                  bgcolor: filters.hasOccupant === false ? '#2196F3' : 'transparent',
                  color: filters.hasOccupant === false ? '#fff' : '#2196F3',
                  border: '1px solid',
                  borderColor: '#2196F3',
                  '& .MuiChip-icon': { color: filters.hasOccupant === false ? '#fff' : '#2196F3' },
                  transition: 'all 0.2s ease',
                  '&:hover': { bgcolor: filters.hasOccupant === false ? '#2196F3' : alpha('#2196F3', 0.15) },
                }}
              />
              <Box sx={{ width: '1px', height: 20, bgcolor: alpha(workplaceAccent, 0.3), mx: 0.5 }} />
              <Chip
                label={`${stats.active} actief`}
                onClick={() => setFilters(prev => ({ ...prev, isActive: prev.isActive === true ? undefined : true }))}
                sx={{
                  height: 32,
                  fontWeight: 600,
                  cursor: 'pointer',
                  bgcolor: filters.isActive === true ? '#4CAF50' : 'transparent',
                  color: filters.isActive === true ? '#fff' : '#4CAF50',
                  border: '1px solid',
                  borderColor: '#4CAF50',
                  transition: 'all 0.2s ease',
                  '&:hover': { bgcolor: filters.isActive === true ? '#4CAF50' : alpha('#4CAF50', 0.15) },
                }}
              />
              <Chip
                label={`${stats.inactive} inactief`}
                onClick={() => setFilters(prev => ({ ...prev, isActive: prev.isActive === false ? undefined : false }))}
                sx={{
                  height: 32,
                  fontWeight: 600,
                  cursor: 'pointer',
                  bgcolor: filters.isActive === false ? '#FF5722' : 'transparent',
                  color: filters.isActive === false ? '#fff' : '#FF5722',
                  border: '1px solid',
                  borderColor: '#FF5722',
                  transition: 'all 0.2s ease',
                  '&:hover': { bgcolor: filters.isActive === false ? '#FF5722' : alpha('#FF5722', 0.15) },
                }}
              />
            </Stack>
          </Stack>
        </Box>
      </Paper>

      {/* Filter Toolbar - Neumorphic style */}
      <Paper
        elevation={0}
        sx={{
          mb: (serviceFilterExpanded || buildingFilterExpanded) ? 0 : 2,
          p: 1.5,
          borderRadius: (serviceFilterExpanded || buildingFilterExpanded) ? '12px 12px 0 0' : 3,
          bgcolor: neumorphColors.bgSurface,
          boxShadow: (serviceFilterExpanded || buildingFilterExpanded) ? 'none' : getNeumorph(isDark, 'soft'),
          borderLeft: `3px solid ${workplaceAccent}`,
        }}
      >
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
          {/* Service Filter Toggle Button */}
          <Tooltip title={serviceFilterExpanded ? 'Sluit filter' : 'Filter op dienst'}>
            <IconButton
              size="small"
              onClick={handleServiceToggle}
              sx={{
                width: 32,
                height: 32,
                bgcolor: (serviceFilter || serviceFilterExpanded) ? SERVICE_COLOR : 'transparent',
                color: (serviceFilter || serviceFilterExpanded) ? '#fff' : SERVICE_COLOR,
                border: '1px solid',
                borderColor: alpha(SERVICE_COLOR, 0.3),
                transition: 'all 0.15s ease',
                '& .expand-icon': {
                  transition: 'transform 0.2s ease',
                  transform: serviceFilterExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                },
                '&:hover': {
                  bgcolor: (serviceFilter || serviceFilterExpanded) ? SERVICE_COLOR : alpha(SERVICE_COLOR, 0.1),
                  borderColor: SERVICE_COLOR,
                },
              }}
            >
              {serviceFilter ? (
                <CheckIcon sx={{ fontSize: 18 }} />
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <BusinessIcon sx={{ fontSize: 16 }} />
                  <ExpandMoreIcon className="expand-icon" sx={{ fontSize: 14, ml: -0.25 }} />
                </Box>
              )}
            </IconButton>
          </Tooltip>

          {/* Building Filter Toggle Button */}
          <Tooltip title={buildingFilterExpanded ? 'Sluit filter' : 'Filter op gebouw'}>
            <IconButton
              size="small"
              onClick={handleBuildingToggle}
              sx={{
                width: 32,
                height: 32,
                bgcolor: (buildingFilter || buildingFilterExpanded) ? BUILDING_COLOR : 'transparent',
                color: (buildingFilter || buildingFilterExpanded) ? '#fff' : BUILDING_COLOR,
                border: '1px solid',
                borderColor: alpha(BUILDING_COLOR, 0.3),
                transition: 'all 0.15s ease',
                '& .expand-icon': {
                  transition: 'transform 0.2s ease',
                  transform: buildingFilterExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                },
                '&:hover': {
                  bgcolor: (buildingFilter || buildingFilterExpanded) ? BUILDING_COLOR : alpha(BUILDING_COLOR, 0.1),
                  borderColor: BUILDING_COLOR,
                },
              }}
            >
              {buildingFilter ? (
                <CheckIcon sx={{ fontSize: 18 }} />
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <ApartmentIcon sx={{ fontSize: 16 }} />
                  <ExpandMoreIcon className="expand-icon" sx={{ fontSize: 14, ml: -0.25 }} />
                </Box>
              )}
            </IconButton>
          </Tooltip>

          {/* Clear All Filters */}
          {hasActiveFilters && (
            <Tooltip title="Wis alle filters">
              <IconButton
                size="small"
                onClick={clearFilters}
                sx={{
                  width: 32,
                  height: 32,
                  color: '#f44336',
                  bgcolor: 'transparent',
                  border: '1px solid',
                  borderColor: alpha('#f44336', 0.3),
                  transition: 'all 0.15s ease',
                  '&:hover': {
                    bgcolor: alpha('#f44336', 0.1),
                    borderColor: '#f44336',
                  },
                }}
              >
                <ClearAllIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
          )}

          {/* Search Field */}
          <TextField
            size="small"
            placeholder="Zoek werkplekken..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: 'text.disabled', fontSize: 18 }} />
                </InputAdornment>
              ),
              endAdornment: searchTerm && (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setSearchTerm('')} sx={{ p: 0.25 }}>
                    <ClearIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{
              flex: 1,
              minWidth: 180,
              maxWidth: 280,
              '& .MuiOutlinedInput-root': {
                bgcolor: isDark ? alpha('#fff', 0.05) : '#fff',
                borderRadius: 1.5,
                fontSize: '0.85rem',
                height: 32,
                '& fieldset': { borderColor: alpha(workplaceAccent, 0.3) },
                '&:hover fieldset': { borderColor: alpha(workplaceAccent, 0.5) },
                '&.Mui-focused fieldset': { borderColor: workplaceAccent },
              },
            }}
          />

          {/* Active Filter Chips */}
          {buildingFilter && selectedBuildings.length > 0 && (
            <Chip
              icon={<ApartmentIcon sx={{ fontSize: 14 }} />}
              label={selectedBuildings.length === 1 ? selectedBuildings[0].name : `${selectedBuildings.length} gebouwen`}
              onDelete={handleClearBuildingFilter}
              size="small"
              sx={{
                height: 24,
                fontSize: '0.7rem',
                fontWeight: 600,
                bgcolor: alpha(BUILDING_COLOR, 0.15),
                color: BUILDING_COLOR,
                border: `1px solid ${alpha(BUILDING_COLOR, 0.3)}`,
                '& .MuiChip-icon': { color: BUILDING_COLOR },
                '& .MuiChip-deleteIcon': { color: BUILDING_COLOR, fontSize: 14 },
              }}
            />
          )}
          {filters.isActive !== undefined && (
            <Chip
              label={filters.isActive ? 'Actief' : 'Inactief'}
              size="small"
              onDelete={() => setFilters(prev => ({ ...prev, isActive: undefined }))}
              sx={{
                height: 24,
                fontSize: '0.7rem',
                fontWeight: 600,
                bgcolor: alpha('#9c27b0', 0.1),
                color: '#9c27b0',
                '& .MuiChip-deleteIcon': { color: '#9c27b0', fontSize: 14 },
              }}
            />
          )}
          {filters.hasOccupant !== undefined && (
            <Chip
              icon={<PersonIcon sx={{ fontSize: 14 }} />}
              label={filters.hasOccupant ? 'Bezet' : 'Vrij'}
              size="small"
              onDelete={() => setFilters(prev => ({ ...prev, hasOccupant: undefined }))}
              sx={{
                height: 24,
                fontSize: '0.7rem',
                fontWeight: 600,
                bgcolor: alpha(EMPLOYEE_COLOR, 0.1),
                color: EMPLOYEE_COLOR,
                '& .MuiChip-icon': { color: EMPLOYEE_COLOR },
                '& .MuiChip-deleteIcon': { color: EMPLOYEE_COLOR, fontSize: 14 },
              }}
            />
          )}

          <Box sx={{ flex: 1 }} />

          {/* Bulk Import Button */}
          <Tooltip title="Werkplekken bulk importeren">
            <IconButton
              onClick={() => setBulkImportDialogOpen(true)}
              size="small"
              sx={{
                width: 32,
                height: 32,
                color: workplaceAccent,
                bgcolor: 'transparent',
                border: '1px solid',
                borderColor: alpha(workplaceAccent, 0.3),
                transition: 'all 0.15s ease',
                '&:hover': {
                  bgcolor: alpha(workplaceAccent, 0.1),
                  borderColor: workplaceAccent,
                },
              }}
            >
              <UploadFileIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
        </Stack>
      </Paper>

      {/* Expandable Service Filter Panel - Sector Grouped */}
      <Collapse in={serviceFilterExpanded} timeout={250}>
        <Paper
          elevation={0}
          sx={{
            mb: 2,
            p: 2,
            pt: 1.5,
            borderRadius: '0 0 12px 12px',
            bgcolor: neumorphColors.bgBase,
            boxShadow: getNeumorphInset(isDark),
            borderLeft: `3px solid ${SERVICE_COLOR}`,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
              <BusinessIcon sx={{ fontSize: 18, color: SERVICE_COLOR }} />
              Filter op Dienst
            </Typography>
            {serviceFilter && (
              <Chip
                label={`${selectedServiceIds.length} geselecteerd`}
                size="small"
                onDelete={handleClearServiceFilter}
                sx={{
                  height: 22,
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  bgcolor: alpha(SERVICE_COLOR, 0.12),
                  color: SERVICE_COLOR,
                  '& .MuiChip-deleteIcon': {
                    fontSize: 14,
                    color: alpha(SERVICE_COLOR, 0.6),
                    '&:hover': { color: SERVICE_COLOR },
                  },
                }}
              />
            )}
          </Box>
          {servicesLoading ? (
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {[1, 2, 3].map((i) => <Skeleton key={i} variant="rounded" width={200} height={60} />)}
            </Box>
          ) : (
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
                gap: 1,
                maxHeight: 280,
                overflowY: 'auto',
                '&::-webkit-scrollbar': { width: 4 },
                '&::-webkit-scrollbar-track': { bgcolor: 'transparent' },
                '&::-webkit-scrollbar-thumb': {
                  bgcolor: alpha(SERVICE_COLOR, 0.2),
                  borderRadius: 2,
                },
              }}
            >
              {sectors?.filter(s => s.services.some(svc => svc.isActive)).map((sector, sectorIndex) => {
                const sectorServices = sector.services.filter(s => s.isActive);
                const selectedInSector = sectorServices.filter(s => selectedServiceIds.includes(s.id)).length;
                const allSelected = selectedInSector === sectorServices.length;
                const someSelected = selectedInSector > 0 && !allSelected;

                return (
                  <Box
                    key={sector.id}
                    sx={{
                      borderRadius: 1.5,
                      border: '1px solid',
                      borderColor: selectedInSector > 0
                        ? alpha(SERVICE_COLOR, 0.25)
                        : isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
                      bgcolor: selectedInSector > 0
                        ? alpha(SERVICE_COLOR, 0.03)
                        : 'transparent',
                      overflow: 'hidden',
                      transition: 'all 0.2s ease',
                      opacity: 0,
                      animation: serviceFilterExpanded ? `fadeIn 0.2s ease forwards ${sectorIndex * 0.05}s` : 'none',
                      '@keyframes fadeIn': {
                        from: { opacity: 0, transform: 'translateY(5px)' },
                        to: { opacity: 1, transform: 'translateY(0)' },
                      },
                    }}
                  >
                    {/* Sector Header */}
                    <Box
                      onClick={() => toggleSectorExpand(sector.id)}
                      sx={{
                        px: 1.5,
                        py: 1,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        cursor: 'pointer',
                        bgcolor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
                        '&:hover': {
                          bgcolor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
                        },
                      }}
                    >
                      <Checkbox
                        size="small"
                        checked={allSelected}
                        indeterminate={someSelected}
                        onChange={(e) => {
                          e.stopPropagation();
                          toggleSectorServices(sector.id);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        sx={{
                          p: 0.25,
                          color: alpha(SERVICE_COLOR, 0.3),
                          '&.Mui-checked, &.MuiCheckbox-indeterminate': {
                            color: SERVICE_COLOR,
                          },
                        }}
                      />
                      <Typography
                        variant="caption"
                        fontWeight={700}
                        sx={{
                          flex: 1,
                          color: selectedInSector > 0 ? SERVICE_COLOR : 'text.primary',
                          textTransform: 'uppercase',
                          letterSpacing: 0.5,
                          fontSize: '0.65rem',
                        }}
                      >
                        {sector.name}
                      </Typography>
                      {selectedInSector > 0 && (
                        <Chip
                          label={selectedInSector}
                          size="small"
                          sx={{
                            height: 16,
                            minWidth: 16,
                            fontSize: '0.6rem',
                            fontWeight: 700,
                            bgcolor: SERVICE_COLOR,
                            color: 'white',
                            '& .MuiChip-label': { px: 0.5 },
                          }}
                        />
                      )}
                      <IconButton
                        size="small"
                        sx={{ p: 0 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSectorExpand(sector.id);
                        }}
                      >
                        {expandedSectors.has(sector.id) ? (
                          <ExpandLessIcon sx={{ fontSize: 14 }} />
                        ) : (
                          <ExpandMoreIcon sx={{ fontSize: 14 }} />
                        )}
                      </IconButton>
                    </Box>

                    {/* Services within Sector */}
                    <Collapse in={expandedSectors.has(sector.id)}>
                      <Box sx={{ px: 1, pb: 1, pt: 0.5 }}>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {sectorServices.map((service) => {
                            const isSelected = selectedServiceIds.includes(service.id);
                            return (
                              <Chip
                                key={service.id}
                                label={service.name}
                                size="small"
                                onClick={() => handleServiceSelect(service.id)}
                                sx={{
                                  height: 24,
                                  fontSize: '0.68rem',
                                  fontWeight: isSelected ? 600 : 500,
                                  cursor: 'pointer',
                                  bgcolor: isSelected
                                    ? alpha(SERVICE_COLOR, 0.15)
                                    : isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                                  color: isSelected ? SERVICE_COLOR : 'text.secondary',
                                  border: '1px solid',
                                  borderColor: isSelected
                                    ? alpha(SERVICE_COLOR, 0.3)
                                    : 'transparent',
                                  transition: 'all 0.15s ease',
                                  '&:hover': {
                                    bgcolor: isSelected
                                      ? alpha(SERVICE_COLOR, 0.2)
                                      : alpha(SERVICE_COLOR, 0.08),
                                    borderColor: alpha(SERVICE_COLOR, 0.3),
                                  },
                                }}
                              />
                            );
                          })}
                        </Box>
                      </Box>
                    </Collapse>
                  </Box>
                );
              })}
            </Box>
          )}
        </Paper>
      </Collapse>

      {/* Expandable Building Filter Panel */}
      <Collapse in={buildingFilterExpanded} timeout={250}>
        <Paper
          elevation={0}
          sx={{
            mb: 2,
            p: 2,
            pt: 1.5,
            borderRadius: '0 0 12px 12px',
            bgcolor: neumorphColors.bgBase,
            boxShadow: getNeumorphInset(isDark),
            borderLeft: `3px solid ${BUILDING_COLOR}`,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
              <ApartmentIcon sx={{ fontSize: 18, color: BUILDING_COLOR }} />
              Filter op Gebouw
            </Typography>
            {buildingFilter && (
              <Chip
                label="Wis selectie"
                size="small"
                onClick={handleClearBuildingFilter}
                sx={{
                  height: 22,
                  fontSize: '0.7rem',
                  bgcolor: alpha('#f44336', 0.1),
                  color: '#f44336',
                  cursor: 'pointer',
                  '&:hover': { bgcolor: alpha('#f44336', 0.2) },
                }}
              />
            )}
          </Box>
          {buildingsLoading ? (
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              {[1, 2, 3].map((i) => <Skeleton key={i} variant="rounded" width={200} height={40} />)}
            </Box>
          ) : (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', lg: 'repeat(4, 1fr)' }, gap: 1 }}>
              {activeBuildings.map((building) => {
                const isSelected = selectedBuildingIds.includes(building.id);
                return (
                  <Box
                    key={building.id}
                    onClick={() => handleBuildingSelect(building.id)}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      py: 0.75,
                      px: 1.5,
                      borderRadius: 1.5,
                      cursor: 'pointer',
                      bgcolor: isSelected ? alpha(BUILDING_COLOR, 0.12) : (isDark ? alpha('#fff', 0.02) : '#fff'),
                      border: '1px solid',
                      borderColor: isSelected ? BUILDING_COLOR : (isDark ? alpha('#fff', 0.08) : alpha('#000', 0.08)),
                      transition: 'all 0.15s ease',
                      '&:hover': { bgcolor: isSelected ? alpha(BUILDING_COLOR, 0.18) : (isDark ? alpha('#fff', 0.05) : alpha('#000', 0.04)) },
                    }}
                  >
                    <Chip
                      label={building.code}
                      size="small"
                      sx={{
                        height: 22,
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        flexShrink: 0,
                        bgcolor: isSelected ? BUILDING_COLOR : (isDark ? alpha(BUILDING_COLOR, 0.2) : alpha(BUILDING_COLOR, 0.1)),
                        color: isSelected ? '#fff' : BUILDING_COLOR,
                        minWidth: 40,
                        '& .MuiChip-label': { px: 1 },
                      }}
                    />
                    <Typography variant="body2" sx={{ fontSize: '0.85rem', fontWeight: isSelected ? 600 : 400, color: isSelected ? BUILDING_COLOR : 'text.primary', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                      {building.name}
                    </Typography>
                    {isSelected && <CheckIcon sx={{ fontSize: 18, color: BUILDING_COLOR, flexShrink: 0 }} />}
                  </Box>
                );
              })}
            </Box>
          )}
        </Paper>
      </Collapse>

      {/* Workplace List */}
      {stats.total === 0 ? (
        <Box
          sx={{
            p: 6,
            bgcolor: isDark ? '#1a1f2e' : '#f0f2f5',
            borderRadius: 3,
            boxShadow: isDark
              ? '6px 6px 12px rgba(0,0,0,0.5), -3px -3px 8px rgba(255,255,255,0.04)'
              : '6px 6px 12px rgba(0,0,0,0.1), -3px -3px 8px rgba(255,255,255,0.9)',
            textAlign: 'center',
          }}
        >
          <PlaceIcon sx={{ fontSize: '4rem', color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            {t('physicalWorkplaces.noWorkplaces')}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {t('physicalWorkplaces.noWorkplacesDesc')}
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
            size="large"
            sx={{
              bgcolor: workplaceAccent,
              '&:hover': { bgcolor: '#00796b' },
            }}
          >
            {t('physicalWorkplaces.addWorkplace')}
          </Button>
        </Box>
      ) : (
        <>
          {/* Mobile/Tablet: Card View */}
          {isTablet && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {filteredWorkplaces.map((workplace) => (
                <Card
                  key={workplace.id}
                  elevation={0}
                  sx={{
                    borderRadius: 3,
                    opacity: workplace.isActive ? 1 : 0.6,
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    overflow: 'hidden',
                    bgcolor: neumorphColors.bgSurface,
                    boxShadow: getNeumorph(isDark, 'medium'),
                    borderLeft: workplace.isActive ? `3px solid ${workplaceAccent}` : `3px solid ${alpha('#FF5722', 0.5)}`,
                    '&:hover': {
                      boxShadow: getNeumorph(isDark, 'strong'),
                      transform: 'translateY(-2px)',
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                    <CardContent sx={{ pb: 2, flex: 1, minWidth: 0, p: 2.5 }}>
                      {/* Code and Status */}
                      <Stack direction="row" spacing={1.5} alignItems="center" mb={1.5}>
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 40,
                            height: 40,
                            borderRadius: 2,
                            bgcolor: alpha(workplaceAccent, isDark ? 0.15 : 0.1),
                            color: workplaceAccent,
                          }}
                        >
                          {getWorkplaceTypeIcon(workplace.type)}
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography
                            component={Link}
                            to={`/workplaces/${workplace.id}`}
                            variant="h6"
                            sx={{
                              fontWeight: 800,
                              color: workplaceAccent,
                              fontSize: '1rem',
                              letterSpacing: '0.03em',
                              textDecoration: 'none',
                              transition: 'all 0.15s ease',
                              '&:hover': {
                                textDecoration: 'underline',
                              },
                            }}
                          >
                            {workplace.code}
                          </Typography>
                          {!workplace.isActive && (
                            <Chip
                              label="INACTIEF"
                              size="small"
                              sx={{
                                height: 18,
                                fontSize: '0.65rem',
                                fontWeight: 700,
                                mt: 0.5,
                                bgcolor: '#F44336',
                                color: '#fff',
                              }}
                            />
                          )}
                        </Box>
                      </Stack>

                      {/* Name */}
                      <Typography variant="body1" fontWeight={700} gutterBottom sx={{ fontSize: '0.95rem' }}>
                        {workplace.name}
                      </Typography>

                      {/* Location */}
                      <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mb: 1.5 }}>
                        {workplace.buildingName}
                        {workplace.floor && ` • ${workplace.floor}`}
                        {workplace.room && ` • ${workplace.room}`}
                      </Typography>

                      {/* Service */}
                      {workplace.serviceName && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
                          {workplace.serviceName}
                        </Typography>
                      )}

                      {/* Occupant */}
                      <Box sx={{ mb: 1.5 }}>
                        <WorkplaceOccupantChip workplace={workplace} showVacant={true} />
                      </Box>

                      {/* Equipment */}
                      <EquipmentChip workplace={workplace} compact={false} />
                    </CardContent>

                    {/* Actions */}
                    <Box
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        p: 1.5,
                        gap: 1,
                        bgcolor: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
                      }}
                    >
                      <IconButton
                        size="small"
                        onClick={() => handleOpenAssetsDialog(workplace)}
                        sx={{
                          width: 32,
                          height: 32,
                          borderRadius: 0.75,
                          color: workplaceAccent,
                          bgcolor: 'transparent',
                          border: '1px solid',
                          borderColor: alpha(workplaceAccent, 0.35),
                          transition: 'all 0.15s ease',
                          '&:hover': {
                            bgcolor: alpha(workplaceAccent, 0.08),
                            borderColor: workplaceAccent,
                          },
                        }}
                      >
                        <InventoryIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog(workplace)}
                        sx={{
                          width: 32,
                          height: 32,
                          borderRadius: 0.75,
                          color: ASSET_COLOR,
                          bgcolor: 'transparent',
                          border: '1px solid',
                          borderColor: alpha(ASSET_COLOR, 0.35),
                          transition: 'all 0.15s ease',
                          '&:hover': {
                            bgcolor: alpha(ASSET_COLOR, 0.08),
                            borderColor: ASSET_COLOR,
                          },
                        }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      {(workplace.currentOccupantEntraId || workplace.currentOccupantName) && (
                        <IconButton
                          size="small"
                          onClick={() => handleOpenClearOccupantDialog(workplace)}
                          sx={{
                            width: 32,
                            height: 32,
                            borderRadius: 0.75,
                            color: '#9C27B0',
                            bgcolor: 'transparent',
                            border: '1px solid',
                            borderColor: alpha('#9C27B0', 0.35),
                            transition: 'all 0.15s ease',
                            '&:hover': {
                              bgcolor: alpha('#9C27B0', 0.08),
                              borderColor: '#9C27B0',
                            },
                          }}
                        >
                          <PersonOffIcon fontSize="small" />
                        </IconButton>
                      )}
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDeleteDialog(workplace)}
                        sx={{
                          width: 32,
                          height: 32,
                          borderRadius: 0.75,
                          color: '#F44336',
                          bgcolor: 'transparent',
                          border: '1px solid',
                          borderColor: alpha('#F44336', 0.35),
                          transition: 'all 0.15s ease',
                          '&:hover': {
                            bgcolor: alpha('#F44336', 0.08),
                            borderColor: '#F44336',
                          },
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                </Card>
              ))}
            </Box>
          )}

          {/* Desktop: AdminDataTable */}
          {!isTablet && (
            <AdminDataTable
              data={filteredWorkplaces}
              columns={columns}
              emptyMessage="Geen werkplekken gevonden"
              getItemId={(item) => item.id}
              defaultRowsPerPage={15}
              renderActions={renderActions}
              actionsColumnWidth={140}
              externalSearchTerm={searchTerm}
              onSearchTermChange={setSearchTerm}
              hideSearch
            />
          )}
        </>
      )}

      {/* Floating Action Button */}
      {stats.total > 0 && (
        <Fab
          aria-label="add workplace"
          onClick={() => handleOpenDialog()}
          sx={{
            position: 'fixed',
            bottom: 80,
            right: 24,
            zIndex: 1100,
            bgcolor: workplaceAccent,
            color: '#fff',
            boxShadow: `0 4px 20px ${alpha(workplaceAccent, 0.4)}`,
            '&:hover': {
              bgcolor: '#00796b',
              transform: 'scale(1.1)',
            },
            transition: 'all 0.2s ease',
          }}
        >
          <AddIcon />
        </Fab>
      )}

      {/* Create/Edit Dialog */}
      <EditPhysicalWorkplaceDialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        workplace={editingWorkplace}
        onSuccess={(message) => {
          setSnackbar({ open: true, message, severity: 'success' });
        }}
        onError={(message) => {
          setSnackbar({ open: true, message, severity: 'error' });
        }}
      />

      {/* Delete Confirmation Dialog */}
      <NeomorphConfirmDialog
        open={deleteDialogOpen}
        onClose={handleCloseDeleteDialog}
        onConfirm={handleDelete}
        title={t('physicalWorkplaces.deleteWorkplace')}
        message={t('physicalWorkplaces.deleteConfirm', {
          name: deletingWorkplace?.name,
          code: deletingWorkplace?.code,
        })}
        warning={
          (deletingWorkplace?.fixedAssetCount ?? 0) > 0
            ? t('physicalWorkplaces.deleteWarningAssets', {
                count: deletingWorkplace?.fixedAssetCount,
              })
            : undefined
        }
        confirmText={deleteMutation.isPending ? t('common.deleting') : t('common.delete')}
        cancelText={t('common.cancel')}
        isLoading={deleteMutation.isPending}
        variant="delete"
        icon="delete"
      />

      {/* Clear Occupant Dialog */}
      <NeomorphConfirmDialog
        open={clearOccupantDialogOpen}
        onClose={handleCloseClearOccupantDialog}
        onConfirm={handleClearOccupant}
        title={t('physicalWorkplaces.clearOccupant')}
        message={t('physicalWorkplaces.clearOccupantConfirm', {
          name: clearingOccupantWorkplace?.currentOccupantName,
          workplace: clearingOccupantWorkplace?.name,
        })}
        confirmText={clearOccupantMutation.isPending ? t('common.processing') : t('common.confirm')}
        cancelText={t('common.cancel')}
        isLoading={clearOccupantMutation.isPending}
        variant="warning"
        icon="person-off"
      />

      {/* Workplace Assets Dialog */}
      <WorkplaceAssetsDialog
        open={assetsDialogOpen}
        onClose={handleCloseAssetsDialog}
        workplace={managingAssetsWorkplace}
        onSuccess={(message) => {
          setSnackbar({ open: true, message, severity: 'success' });
        }}
        onError={(message) => {
          setSnackbar({ open: true, message, severity: 'error' });
        }}
      />

      {/* Bulk Import Dialog */}
      <BulkImportWorkplacesDialog
        open={bulkImportDialogOpen}
        onClose={() => setBulkImportDialogOpen(false)}
        onSuccess={(message) => {
          setSnackbar({ open: true, message, severity: 'success' });
        }}
        onError={(message) => {
          setSnackbar({ open: true, message, severity: 'error' });
        }}
      />

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default PhysicalWorkplacesPage;

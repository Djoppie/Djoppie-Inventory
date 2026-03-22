import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
  Collapse,
  Chip,
  alpha,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PlaceIcon from '@mui/icons-material/Place';
import PersonIcon from '@mui/icons-material/Person';
import ComputerIcon from '@mui/icons-material/Computer';
import FilterListIcon from '@mui/icons-material/FilterList';
import FilterListOffIcon from '@mui/icons-material/FilterListOff';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import DeskIcon from '@mui/icons-material/Desk';
import LaptopIcon from '@mui/icons-material/Laptop';
import PersonOffIcon from '@mui/icons-material/PersonOff';
import InventoryIcon from '@mui/icons-material/Inventory';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import {
  usePhysicalWorkplaces,
  useDeletePhysicalWorkplace,
  useClearOccupant,
} from '../hooks/usePhysicalWorkplaces';
import {
  PhysicalWorkplace,
  WorkplaceType,
  WorkplaceTypeLabels,
  PhysicalWorkplaceFilters,
} from '../types/physicalWorkplace.types';
import Loading from '../components/common/Loading';
import ApiErrorDisplay from '../components/common/ApiErrorDisplay';
import BuildingSelect from '../components/common/BuildingSelect';
import ServiceSelect from '../components/common/ServiceSelect';
import WorkplaceAssetsDialog from '../components/physicalWorkplaces/WorkplaceAssetsDialog';
import BulkImportWorkplacesDialog from '../components/physicalWorkplaces/BulkImportWorkplacesDialog';
import EditPhysicalWorkplaceDialog from '../components/physicalWorkplaces/EditPhysicalWorkplaceDialog';
import NeomorphConfirmDialog from '../components/physicalWorkplaces/NeomorphConfirmDialog';
import EquipmentChip from '../components/physicalWorkplaces/EquipmentChip';
import WorkplaceOccupantChip from '../components/physicalWorkplaces/WorkplaceOccupantChip';
import AdminDataTable, { Column } from '../components/admin/AdminDataTable';

// Scanner-style card wrapper - consistent with other pages
const scannerCardSx = {
  mb: 3,
  borderRadius: 2,
  border: '1px solid',
  borderColor: 'divider',
  overflow: 'hidden',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    borderColor: 'primary.main',
    boxShadow: (thm: { palette: { mode: string } }) =>
      thm.palette.mode === 'dark'
        ? '0 8px 32px rgba(255, 215, 0, 0.2), inset 0 0 24px rgba(255, 215, 0, 0.05)'
        : '0 4px 20px rgba(253, 185, 49, 0.3)',
  },
};

// Consistent icon button style
const iconButtonSx = {
  border: '1px solid',
  borderColor: 'divider',
  borderRadius: 2,
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    borderColor: 'primary.main',
    boxShadow: (thm: { palette: { mode: string } }) =>
      thm.palette.mode === 'dark'
        ? '0 4px 16px rgba(255, 215, 0, 0.2)'
        : '0 2px 12px rgba(253, 185, 49, 0.3)',
  },
};

// Teal accent for workplaces (consistent with admin)
const tealAccent = '#009688';

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
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  // Filter state
  const [filters, setFilters] = useState<PhysicalWorkplaceFilters>({});
  const [showFilters, setShowFilters] = useState(false);

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
  const deleteMutation = useDeletePhysicalWorkplace();
  const clearOccupantMutation = useClearOccupant();

  // Computed statistics
  const stats = useMemo(() => {
    if (!workplaces) return { total: 0, active: 0, occupied: 0, vacant: 0 };
    const active = workplaces.filter(w => w.isActive);
    const occupied = active.filter(w => w.currentOccupantEntraId || w.currentOccupantName);
    return {
      total: workplaces.length,
      active: active.length,
      occupied: occupied.length,
      vacant: active.length - occupied.length,
    };
  }, [workplaces]);

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

  const clearFilters = () => {
    setFilters({});
  };

  // Define columns for AdminDataTable
  const columns: Column<PhysicalWorkplace>[] = useMemo(() => [
    {
      id: 'code',
      label: 'Code',
      minWidth: 120,
      format: (item) => (
        <Stack direction="row" spacing={1} alignItems="center">
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 28,
              height: 28,
              borderRadius: 1.5,
              bgcolor: isDark ? alpha(tealAccent, 0.15) : alpha(tealAccent, 0.1),
              color: tealAccent,
            }}
          >
            {getWorkplaceTypeIcon(item.type)}
          </Box>
          <Typography sx={{ fontFamily: 'monospace', fontWeight: 700, color: tealAccent, fontSize: '0.85rem' }}>
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
            bgcolor: isDark ? alpha(tealAccent, 0.15) : alpha(tealAccent, 0.08),
            color: tealAccent,
            border: '1px solid',
            borderColor: alpha(tealAccent, 0.3),
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
            bgcolor: isDark ? alpha(tealAccent, 0.15) : alpha(tealAccent, 0.08),
            color: tealAccent,
            transition: 'all 0.15s ease',
            '&:hover': {
              bgcolor: tealAccent,
              color: '#fff',
              transform: 'translateY(-1px)',
              boxShadow: `0 4px 12px ${alpha(tealAccent, 0.4)}`,
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
            bgcolor: isDark ? alpha('#FF7700', 0.15) : alpha('#FF7700', 0.08),
            color: '#FF7700',
            transition: 'all 0.15s ease',
            '&:hover': {
              bgcolor: '#FF7700',
              color: '#fff',
              transform: 'translateY(-1px)',
              boxShadow: `0 4px 12px ${alpha('#FF7700', 0.4)}`,
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
              bgcolor: isDark ? alpha('#9C27B0', 0.15) : alpha('#9C27B0', 0.08),
              color: '#9C27B0',
              transition: 'all 0.15s ease',
              '&:hover': {
                bgcolor: '#9C27B0',
                color: '#fff',
                transform: 'translateY(-1px)',
                boxShadow: `0 4px 12px ${alpha('#9C27B0', 0.4)}`,
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
            bgcolor: isDark ? alpha('#EF5350', 0.15) : alpha('#EF5350', 0.08),
            color: '#EF5350',
            transition: 'all 0.15s ease',
            '&:hover': {
              bgcolor: '#EF5350',
              color: '#fff',
              transform: 'translateY(-1px)',
              boxShadow: `0 4px 12px ${alpha('#EF5350', 0.4)}`,
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

  const hasActiveFilters = Object.values(filters).some(v => v !== undefined);

  return (
    <Box sx={{ pb: 10 }}>
      {/* Back Button */}
      <Tooltip title={t('common.backToDashboard')}>
        <IconButton
          onClick={() => navigate('/')}
          sx={{
            ...iconButtonSx,
            mb: 2,
            color: 'text.secondary',
            '&:hover': {
              ...iconButtonSx['&:hover'],
              color: 'primary.main',
            },
          }}
        >
          <ArrowBackIcon />
        </IconButton>
      </Tooltip>

      {/* Header */}
      <Card elevation={0} sx={scannerCardSx}>
        <CardContent sx={{ p: 3 }}>
          <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 48,
                height: 48,
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: isDark ? alpha(tealAccent, 0.08) : alpha(tealAccent, 0.05),
              }}
            >
              <PlaceIcon
                sx={{
                  fontSize: 28,
                  color: tealAccent,
                  filter: isDark ? `drop-shadow(0 0 4px ${alpha(tealAccent, 0.5)})` : 'none',
                }}
              />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h4" component="h1" fontWeight={700}>
                {t('physicalWorkplaces.title')}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {t('physicalWorkplaces.subtitle')}
              </Typography>
            </Box>
            <Stack direction="row" spacing={1.5} flexWrap="wrap" sx={{ gap: 1 }}>
              <Chip
                icon={<PlaceIcon />}
                label={`${stats.total} werkplekken`}
                sx={{
                  height: 32,
                  fontWeight: 700,
                  bgcolor: tealAccent,
                  color: '#fff',
                  '& .MuiChip-icon': { color: '#fff' },
                }}
              />
              <Chip
                icon={<PersonIcon />}
                label={`${stats.occupied} bezet`}
                variant="outlined"
                sx={{
                  height: 32,
                  fontWeight: 600,
                  borderColor: '#4CAF50',
                  color: '#4CAF50',
                  '& .MuiChip-icon': { color: '#4CAF50' },
                }}
              />
              <Chip
                icon={<DeskIcon />}
                label={`${stats.vacant} vrij`}
                variant="outlined"
                sx={{
                  height: 32,
                  fontWeight: 600,
                  borderColor: '#2196F3',
                  color: '#2196F3',
                  '& .MuiChip-icon': { color: '#2196F3' },
                }}
              />
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      {/* Advanced Filters - Teal themed */}
      <Stack
        direction="row"
        spacing={1}
        sx={{
          mb: 2,
          p: 1.5,
          bgcolor: isDark ? alpha(tealAccent, 0.08) : alpha(tealAccent, 0.05),
          borderRadius: 2,
          border: '1px solid',
          borderColor: isDark ? alpha(tealAccent, 0.2) : alpha(tealAccent, 0.15),
        }}
      >
        <Button
          startIcon={showFilters ? <FilterListOffIcon /> : <FilterListIcon />}
          onClick={() => setShowFilters(!showFilters)}
          size="small"
          variant={hasActiveFilters ? 'contained' : 'outlined'}
          sx={{
            borderColor: tealAccent,
            color: hasActiveFilters ? '#fff' : tealAccent,
            bgcolor: hasActiveFilters ? tealAccent : 'transparent',
            fontWeight: 600,
            '&:hover': {
              borderColor: '#00796b',
              bgcolor: hasActiveFilters ? '#00796b' : alpha(tealAccent, 0.08),
            },
          }}
        >
          {t('common.filters')} {hasActiveFilters && `(${Object.values(filters).filter(v => v !== undefined).length})`}
        </Button>

        {hasActiveFilters && (
          <Button
            size="small"
            onClick={clearFilters}
            variant="outlined"
            sx={{
              borderColor: '#9C27B0',
              color: '#9C27B0',
              fontWeight: 600,
              '&:hover': {
                borderColor: '#7B1FA2',
                bgcolor: alpha('#9C27B0', 0.08),
              },
            }}
          >
            {t('common.clearFilters')}
          </Button>
        )}

        <Box sx={{ flex: 1 }} />

        <Button
          startIcon={<UploadFileIcon />}
          onClick={() => setBulkImportDialogOpen(true)}
          size="small"
          variant="contained"
          sx={{
            bgcolor: tealAccent,
            fontWeight: 600,
            '&:hover': {
              bgcolor: '#00796b',
            },
          }}
        >
          {t('physicalWorkplaces.bulk.title')}
        </Button>
      </Stack>

      {/* Collapsible Filter Panel */}
      <Collapse in={showFilters}>
        <Box
          sx={{
            mb: 2,
            p: 2.5,
            borderRadius: 2,
            bgcolor: isDark ? '#1a1f2e' : '#f0f2f5',
            boxShadow: isDark
              ? 'inset 2px 2px 4px rgba(0,0,0,0.4), inset -1px -1px 3px rgba(255,255,255,0.03)'
              : 'inset 2px 2px 4px rgba(0,0,0,0.06), inset -1px -1px 3px rgba(255,255,255,0.7)',
          }}
        >
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Box sx={{ minWidth: 200 }}>
              <BuildingSelect
                value={filters.buildingId ?? null}
                onChange={(value) => setFilters(prev => ({ ...prev, buildingId: value ?? undefined }))}
                label={t('physicalWorkplaces.building')}
              />
            </Box>
            <Box sx={{ minWidth: 200 }}>
              <ServiceSelect
                value={filters.serviceId ?? null}
                onChange={(value) => setFilters(prev => ({ ...prev, serviceId: value ?? undefined }))}
                label={t('physicalWorkplaces.service')}
              />
            </Box>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>{t('physicalWorkplaces.status')}</InputLabel>
              <Select<string>
                value={filters.isActive === undefined ? '' : filters.isActive ? 'active' : 'inactive'}
                onChange={(e) => {
                  const value = e.target.value;
                  setFilters(prev => ({
                    ...prev,
                    isActive: value === '' ? undefined : value === 'active',
                  }));
                }}
                label={t('physicalWorkplaces.status')}
              >
                <MenuItem value="">{t('common.all')}</MenuItem>
                <MenuItem value="active">{t('physicalWorkplaces.active')}</MenuItem>
                <MenuItem value="inactive">{t('physicalWorkplaces.inactive')}</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>{t('physicalWorkplaces.occupancy')}</InputLabel>
              <Select<string>
                value={filters.hasOccupant === undefined ? '' : filters.hasOccupant ? 'occupied' : 'vacant'}
                onChange={(e) => {
                  const value = e.target.value;
                  setFilters(prev => ({
                    ...prev,
                    hasOccupant: value === '' ? undefined : value === 'occupied',
                  }));
                }}
                label={t('physicalWorkplaces.occupancy')}
              >
                <MenuItem value="">{t('common.all')}</MenuItem>
                <MenuItem value="occupied">{t('physicalWorkplaces.occupied')}</MenuItem>
                <MenuItem value="vacant">{t('physicalWorkplaces.vacant')}</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </Box>
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
              bgcolor: tealAccent,
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
              {workplaces?.map((workplace) => (
                <Card
                  key={workplace.id}
                  elevation={0}
                  sx={{
                    border: '2px solid',
                    borderColor: workplace.isActive ? 'divider' : 'error.light',
                    borderRadius: 2.5,
                    opacity: workplace.isActive ? 1 : 0.6,
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    overflow: 'hidden',
                    bgcolor: isDark ? '#232936' : '#ffffff',
                    '&:hover': {
                      boxShadow: `0 8px 32px ${alpha(tealAccent, 0.25)}`,
                      borderColor: tealAccent,
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
                            bgcolor: alpha(tealAccent, isDark ? 0.15 : 0.1),
                            color: tealAccent,
                          }}
                        >
                          {getWorkplaceTypeIcon(workplace.type)}
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography
                            variant="h6"
                            sx={{
                              fontWeight: 800,
                              color: tealAccent,
                              fontSize: '1rem',
                              letterSpacing: '0.03em',
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
                          bgcolor: alpha(tealAccent, isDark ? 0.12 : 0.08),
                          color: tealAccent,
                          '&:hover': { bgcolor: alpha(tealAccent, 0.2) },
                        }}
                      >
                        <InventoryIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog(workplace)}
                        sx={{
                          bgcolor: alpha('#FF7700', isDark ? 0.12 : 0.08),
                          color: '#FF7700',
                          '&:hover': { bgcolor: alpha('#FF7700', 0.2) },
                        }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      {(workplace.currentOccupantEntraId || workplace.currentOccupantName) && (
                        <IconButton
                          size="small"
                          onClick={() => handleOpenClearOccupantDialog(workplace)}
                          sx={{
                            bgcolor: alpha('#9C27B0', isDark ? 0.12 : 0.08),
                            color: '#9C27B0',
                            '&:hover': { bgcolor: alpha('#9C27B0', 0.2) },
                          }}
                        >
                          <PersonOffIcon fontSize="small" />
                        </IconButton>
                      )}
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDeleteDialog(workplace)}
                        sx={{
                          bgcolor: alpha('#F44336', isDark ? 0.12 : 0.08),
                          color: '#F44336',
                          '&:hover': { bgcolor: alpha('#F44336', 0.15) },
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
              data={workplaces || []}
              columns={columns}
              searchPlaceholder="Zoek werkplekken (code, naam, gebouw)..."
              emptyMessage="Geen werkplekken gevonden"
              getItemId={(item) => item.id}
              showActiveStatus
              defaultRowsPerPage={15}
              renderActions={renderActions}
              actionsColumnWidth={140}
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
            bgcolor: tealAccent,
            color: '#fff',
            boxShadow: `0 4px 20px ${alpha(tealAccent, 0.4)}`,
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

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Chip,
  Button,
  IconButton,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
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
    const occupied = active.filter(w => w.currentOccupantEntraId);
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
                bgcolor: (thm) =>
                  thm.palette.mode === 'dark'
                    ? 'rgba(255, 215, 0, 0.08)'
                    : 'rgba(253, 185, 49, 0.08)',
              }}
            >
              <PlaceIcon
                sx={{
                  fontSize: 28,
                  color: 'primary.main',
                  filter: (thm: { palette: { mode: string } }) =>
                    thm.palette.mode === 'dark'
                      ? 'drop-shadow(0 0 4px rgba(255, 215, 0, 0.5))'
                      : 'none',
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
            <Stack direction="row" spacing={1} flexWrap="wrap">
              <Chip
                icon={<PlaceIcon />}
                label={t('physicalWorkplaces.totalCount', { count: stats.total })}
                sx={{ fontWeight: 600 }}
              />
              <Chip
                icon={<PersonIcon />}
                label={t('physicalWorkplaces.occupiedCount', { count: stats.occupied })}
                color="success"
                variant="outlined"
                sx={{ fontWeight: 600 }}
              />
              <Chip
                icon={<DeskIcon />}
                label={t('physicalWorkplaces.vacantCount', { count: stats.vacant })}
                color="info"
                variant="outlined"
                sx={{ fontWeight: 600 }}
              />
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card elevation={0} sx={{ ...scannerCardSx, mb: 2 }}>
        <CardContent sx={{ p: 2 }}>
          <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
            <Stack direction="row" spacing={1}>
              <Button
                startIcon={showFilters ? <FilterListOffIcon /> : <FilterListIcon />}
                onClick={() => setShowFilters(!showFilters)}
                size="small"
              >
                {t('common.filters')}
              </Button>
              {hasActiveFilters && (
                <Button size="small" onClick={clearFilters} color="secondary">
                  {t('common.clearFilters')}
                </Button>
              )}
            </Stack>
            <Button
              startIcon={<UploadFileIcon />}
              onClick={() => setBulkImportDialogOpen(true)}
              size="small"
              variant="outlined"
            >
              {t('physicalWorkplaces.bulk.title')}
            </Button>
          </Stack>

          <Collapse in={showFilters}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 2 }}>
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
          </Collapse>
        </CardContent>
      </Card>

      {/* Workplace List */}
      {stats.total === 0 ? (
        <Paper
          elevation={0}
          sx={{
            p: 6,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
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
          >
            {t('physicalWorkplaces.addWorkplace')}
          </Button>
        </Paper>
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
                    border: '1px solid',
                    borderColor: workplace.isActive ? 'divider' : 'error.light',
                    borderRadius: 2,
                    opacity: workplace.isActive ? 1 : 0.7,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      boxShadow: (theme) =>
                        theme.palette.mode === 'dark'
                          ? '0 8px 32px rgba(255, 215, 0, 0.2)'
                          : '0 4px 20px rgba(253, 185, 49, 0.3)',
                      borderColor: 'primary.main',
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                    <CardContent sx={{ pb: 1, flex: 1, minWidth: 0 }}>
                      <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                        {getWorkplaceTypeIcon(workplace.type)}
                        <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
                          {workplace.code}
                        </Typography>
                        {!workplace.isActive && (
                          <Chip label={t('physicalWorkplaces.inactive')} size="small" color="error" />
                        )}
                      </Stack>

                      <Typography variant="body1" fontWeight={500} gutterBottom>
                        {workplace.name}
                      </Typography>

                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {workplace.buildingName}
                        {workplace.floor && ` - ${workplace.floor}`}
                        {workplace.room && ` - ${workplace.room}`}
                      </Typography>

                      {workplace.serviceName && (
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          {workplace.serviceName}
                        </Typography>
                      )}

                      {workplace.currentOccupantName ? (
                        <Chip
                          icon={<PersonIcon />}
                          label={workplace.currentOccupantName}
                          size="small"
                          color="success"
                          sx={{ mt: 1 }}
                        />
                      ) : (
                        <Chip
                          icon={<DeskIcon />}
                          label={t('physicalWorkplaces.vacant')}
                          size="small"
                          variant="outlined"
                          sx={{ mt: 1 }}
                        />
                      )}
                    </CardContent>

                    <Box sx={{ display: 'flex', flexDirection: 'column', pr: 1, pt: 1.5 }}>
                      <IconButton size="small" onClick={() => handleOpenAssetsDialog(workplace)}>
                        <InventoryIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleOpenDialog(workplace)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                      {workplace.currentOccupantEntraId && (
                        <IconButton
                          size="small"
                          onClick={() => handleOpenClearOccupantDialog(workplace)}
                          color="warning"
                        >
                          <PersonOffIcon fontSize="small" />
                        </IconButton>
                      )}
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDeleteDialog(workplace)}
                        color="error"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                </Card>
              ))}
            </Box>
          )}

          {/* Desktop: Table View */}
          {!isTablet && (
            <TableContainer
              component={Paper}
              elevation={0}
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
              }}
            >
              <Table>
                <TableHead>
                  <TableRow
                    sx={{
                      backgroundColor: (theme) =>
                        theme.palette.mode === 'dark'
                          ? 'rgba(255, 119, 0, 0.05)'
                          : 'rgba(255, 119, 0, 0.02)',
                    }}
                  >
                    <TableCell sx={{ fontWeight: 700 }}>{t('physicalWorkplaces.code')}</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>{t('physicalWorkplaces.name')}</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>{t('physicalWorkplaces.type')}</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>{t('physicalWorkplaces.building')}</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>{t('physicalWorkplaces.service')}</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>{t('physicalWorkplaces.occupant')}</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>{t('physicalWorkplaces.assets')}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>{t('common.actions')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {workplaces?.map((workplace) => (
                    <TableRow
                      key={workplace.id}
                      sx={{
                        opacity: workplace.isActive ? 1 : 0.6,
                        '&:hover': {
                          backgroundColor: (theme) =>
                            theme.palette.mode === 'dark'
                              ? 'rgba(255, 119, 0, 0.05)'
                              : 'rgba(255, 119, 0, 0.02)',
                        },
                      }}
                    >
                      <TableCell>
                        <Stack direction="row" spacing={1} alignItems="center">
                          {getWorkplaceTypeIcon(workplace.type)}
                          <Typography fontWeight={600} color="primary.main">
                            {workplace.code}
                          </Typography>
                          {!workplace.isActive && (
                            <Chip label={t('physicalWorkplaces.inactive')} size="small" color="error" />
                          )}
                        </Stack>
                      </TableCell>
                      <TableCell>{workplace.name}</TableCell>
                      <TableCell>{WorkplaceTypeLabels[workplace.type]}</TableCell>
                      <TableCell>
                        {workplace.buildingName}
                        {workplace.floor && `, ${workplace.floor}`}
                        {workplace.room && ` (${workplace.room})`}
                      </TableCell>
                      <TableCell>{workplace.serviceName || '-'}</TableCell>
                      <TableCell>
                        {workplace.currentOccupantName ? (
                          <Chip
                            icon={<PersonIcon />}
                            label={workplace.currentOccupantName}
                            size="small"
                            color="success"
                          />
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            {t('physicalWorkplaces.vacant')}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Tooltip title={t('physicalWorkplaces.manageAssets')}>
                          <Chip
                            icon={<InventoryIcon />}
                            label={workplace.fixedAssetCount}
                            size="small"
                            variant="outlined"
                            onClick={() => handleOpenAssetsDialog(workplace)}
                            sx={{ cursor: 'pointer' }}
                          />
                        </Tooltip>
                      </TableCell>
                      <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                        <Tooltip title={t('physicalWorkplaces.manageAssets')}>
                          <IconButton size="small" onClick={() => handleOpenAssetsDialog(workplace)}>
                            <InventoryIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <IconButton size="small" onClick={() => handleOpenDialog(workplace)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                        {workplace.currentOccupantEntraId && (
                          <Tooltip title={t('physicalWorkplaces.clearOccupant')}>
                            <IconButton
                              size="small"
                              onClick={() => handleOpenClearOccupantDialog(workplace)}
                              color="warning"
                            >
                              <PersonOffIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDeleteDialog(workplace)}
                          color="error"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </>
      )}

      {/* Floating Action Button */}
      {stats.total > 0 && (
        <Fab
          color="primary"
          aria-label="add workplace"
          onClick={() => handleOpenDialog()}
          sx={{
            position: 'fixed',
            bottom: 80,
            right: 24,
            zIndex: 1100,
            boxShadow: (theme) =>
              theme.palette.mode === 'dark'
                ? '0 4px 20px rgba(255, 119, 0, 0.4)'
                : '0 4px 20px rgba(255, 119, 0, 0.3)',
            '&:hover': {
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

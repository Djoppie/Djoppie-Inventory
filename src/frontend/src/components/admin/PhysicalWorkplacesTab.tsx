import { useState, useRef, useMemo, useEffect } from 'react';
import {
  Box,
  TextField,
  Fab,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  FormControlLabel,
  Switch,
  Divider,
  Button,
  MenuItem,
  Stack,
  Tooltip,
  CircularProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  alpha,
  Paper,
  InputAdornment,
  IconButton,
  Chip,
  useTheme,
} from '@mui/material';
import {
  GridColDef,
  GridRenderCellParams,
  GridRowId,
  GridRowSelectionModel,
} from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import DownloadIcon from '@mui/icons-material/Download';
import UploadIcon from '@mui/icons-material/Upload';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import FilterListIcon from '@mui/icons-material/FilterList';
import ClearAllIcon from '@mui/icons-material/ClearAll';

import { useSearchParams } from 'react-router-dom';
import NeumorphicDataGrid from './NeumorphicDataGrid';
import AdminFormDialog from './AdminFormDialog';
import WorkplaceGapAnalysisSection from './WorkplaceGapAnalysisSection';
import WorkplacesQuickAddRow from './workplaces/WorkplacesQuickAddRow';
import WorkplacesBulkActionBar from './workplaces/WorkplacesBulkActionBar';
import BulkEditWorkplacesDialog from './workplaces/BulkEditWorkplacesDialog';
import WorkplacesFiltersPanel from './workplaces/WorkplacesFiltersPanel';
import type { WorkplacesFilterState } from './workplaces/workplacesFilterTypes';
import { initialFilterState } from './workplaces/workplacesFilterTypes';
import {
  PhysicalWorkplace,
  WorkplaceType,
  WorkplaceTypeLabels,
  CreatePhysicalWorkplaceDto,
  UpdatePhysicalWorkplaceDto,
} from '../../types/physicalWorkplace.types';
import {
  usePhysicalWorkplaces,
  useCreatePhysicalWorkplace,
  useUpdatePhysicalWorkplace,
  useDeletePhysicalWorkplace,
  useDownloadWorkplaceTemplate,
  useExportWorkplacesCsv,
  useImportWorkplacesCsv,
  useBulkDeleteWorkplaces,
  useBulkUpdateWorkplaces,
  useDeleteAllWorkplaces,
} from '../../hooks/usePhysicalWorkplaces';
import { useBuildings } from '../../hooks/useBuildings';
import { useServices } from '../../hooks/useServices';
import Loading from '../common/Loading';
import { WorkplaceCsvImportResult } from '../../api/physicalWorkplaces.api';
import { getNeumorphColors } from '../../utils/neumorphicStyles';

// ─── Form types ──────────────────────────────────────────────────────────────

interface FormData {
  code: string;
  name: string;
  description: string;
  buildingId: string;
  serviceId: string;
  floor: string;
  room: string;
  type: WorkplaceType;
  isActive: boolean;
}

const initialFormData: FormData = {
  code: '',
  name: '',
  description: '',
  buildingId: '',
  serviceId: '',
  floor: '',
  room: '',
  type: WorkplaceType.Laptop,
  isActive: true,
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Parse a comma-separated numeric id string into a Set<number> */
function parseIds(raw: string | null): Set<number> {
  if (!raw) return new Set();
  const parsed = raw.split(',').map(Number).filter((n) => !isNaN(n) && n > 0);
  return new Set(parsed);
}

// ─── Component ───────────────────────────────────────────────────────────────

const PhysicalWorkplacesTab = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { bgBase } = getNeumorphColors(isDark);
  const [searchParams, setSearchParams] = useSearchParams();

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [bulkEditDialogOpen, setBulkEditDialogOpen] = useState(false);
  const [importResultDialogOpen, setImportResultDialogOpen] = useState(false);
  const [importResult, setImportResult] = useState<WorkplaceCsvImportResult | null>(null);
  const [editingItem, setEditingItem] = useState<PhysicalWorkplace | null>(null);
  const [deletingItem, setDeletingItem] = useState<PhysicalWorkplace | null>(null);

  // Selection (MUI DataGrid v8: rowSelectionModel = GridRowSelectionModel)
  const [rowSelectionModel, setRowSelectionModel] = useState<GridRowSelectionModel>({ type: 'include', ids: new Set<GridRowId>() });

  // Form state
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  // ── Search & filter state — initialised from URL params ──────────────────
  const [searchTerm, setSearchTerm] = useState(() => searchParams.get('q') ?? '');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filterState, setFilterState] = useState<WorkplacesFilterState>(() => {
    const types = (searchParams.get('types') ?? '').split(',').filter(Boolean) as WorkplaceType[];
    const active = searchParams.get('active') ?? 'all';
    return {
      selectedServiceIds: parseIds(searchParams.get('services')),
      selectedBuildingIds: parseIds(searchParams.get('buildings')),
      selectedTypes: new Set<WorkplaceType>(types),
      activeFilter: (['all', 'active', 'inactive'] as const).includes(active as 'all' | 'active' | 'inactive') ? (active as 'all' | 'active' | 'inactive') : 'all',
    };
  });

  // Sync filter/search state → URL (write-only, don't read after mount)
  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    // keep existing params (tab, etc.)
    if (searchTerm) params.set('q', searchTerm); else params.delete('q');
    if (filterState.selectedServiceIds.size > 0) params.set('services', [...filterState.selectedServiceIds].join(',')); else params.delete('services');
    if (filterState.selectedBuildingIds.size > 0) params.set('buildings', [...filterState.selectedBuildingIds].join(',')); else params.delete('buildings');
    if (filterState.selectedTypes.size > 0) params.set('types', [...filterState.selectedTypes].join(',')); else params.delete('types');
    if (filterState.activeFilter !== 'all') params.set('active', filterState.activeFilter); else params.delete('active');
    setSearchParams(params, { replace: true });
    // We deliberately omit `searchParams` from the dep array to avoid loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, filterState]);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Data
  const { data: workplaces = [], isLoading } = usePhysicalWorkplaces();
  const { data: buildings = [] } = useBuildings();
  const { data: services = [] } = useServices();

  // Mutations
  const createMutation = useCreatePhysicalWorkplace();
  const updateMutation = useUpdatePhysicalWorkplace();
  const deleteMutation = useDeletePhysicalWorkplace();
  const bulkDeleteMutation = useBulkDeleteWorkplaces();
  const bulkUpdateMutation = useBulkUpdateWorkplaces();
  const deleteAllMutation = useDeleteAllWorkplaces();
  const downloadTemplateMutation = useDownloadWorkplaceTemplate();
  const exportCsvMutation = useExportWorkplacesCsv();
  const importCsvMutation = useImportWorkplacesCsv();

  // ─── Derived selection (always relative to filteredWorkplaces) ────────────

  // NOTE: filteredWorkplaces is defined below — we use a lazy ref pattern.
  // The real fix is: selectedIds is computed after filteredWorkplaces.
  // We use a placeholder here and re-derive after filteredWorkplaces is known.
  // Actually both are in the same component, so we compute after the filter below.

  // ─── Filtering ────────────────────────────────────────────────────────────

  const hasActiveFilters =
    filterState.selectedServiceIds.size > 0 ||
    filterState.selectedBuildingIds.size > 0 ||
    filterState.selectedTypes.size > 0 ||
    filterState.activeFilter !== 'all';

  const filteredWorkplaces = useMemo(() => {
    let result = workplaces;

    // Text search
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter(
        (w) =>
          w.code.toLowerCase().includes(q) ||
          w.name.toLowerCase().includes(q) ||
          (w.floor ?? '').toLowerCase().includes(q) ||
          (w.room ?? '').toLowerCase().includes(q) ||
          (w.buildingName ?? '').toLowerCase().includes(q) ||
          (w.serviceName ?? '').toLowerCase().includes(q)
      );
    }

    // Service filter
    if (filterState.selectedServiceIds.size > 0) {
      result = result.filter(
        (w) => w.serviceId !== undefined && filterState.selectedServiceIds.has(w.serviceId)
      );
    }

    // Building filter
    if (filterState.selectedBuildingIds.size > 0) {
      result = result.filter((w) => filterState.selectedBuildingIds.has(w.buildingId));
    }

    // Type filter
    if (filterState.selectedTypes.size > 0) {
      result = result.filter((w) => filterState.selectedTypes.has(w.type));
    }

    // Active filter
    if (filterState.activeFilter === 'active') {
      result = result.filter((w) => w.isActive);
    } else if (filterState.activeFilter === 'inactive') {
      result = result.filter((w) => !w.isActive);
    }

    return result;
  }, [workplaces, searchTerm, filterState]);

  // ─── Derived selection (relative to FILTERED rows, not all workplaces) ─────
  const selectedIds: GridRowId[] = useMemo(() => {
    if (rowSelectionModel.type === 'include') {
      return Array.from(rowSelectionModel.ids);
    }
    // 'exclude' type: filtered rows minus excluded
    return filteredWorkplaces
      .map((w) => w.id as GridRowId)
      .filter((id) => !(rowSelectionModel.ids as Set<GridRowId>).has(id));
  }, [rowSelectionModel, filteredWorkplaces]);

  const selectedWorkplaces: PhysicalWorkplace[] = useMemo(
    () => filteredWorkplaces.filter((w) => selectedIds.includes(w.id as GridRowId)),
    [filteredWorkplaces, selectedIds]
  );

  const clearAllFilters = () => {
    setSearchTerm('');
    setFilterState(initialFilterState);
  };

  // ─── Dialog handlers ──────────────────────────────────────────────────────

  const handleOpenDialog = (item?: PhysicalWorkplace) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        code: item.code,
        name: item.name,
        description: item.description || '',
        buildingId: String(item.buildingId),
        serviceId: item.serviceId ? String(item.serviceId) : '',
        floor: item.floor || '',
        room: item.room || '',
        type: item.type,
        isActive: item.isActive,
      });
    } else {
      setEditingItem(null);
      setFormData(initialFormData);
    }
    setFormErrors({});
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingItem(null);
    setFormData(initialFormData);
    setFormErrors({});
  };

  const handleInputChange =
    (field: keyof FormData) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const target = event.target as HTMLInputElement;
      const value = field === 'isActive' ? target.checked : target.value;
      setFormData((prev) => ({ ...prev, [field]: value }));
      if (formErrors[field]) {
        setFormErrors((prev) => ({ ...prev, [field]: '' }));
      }
    };

  const handleSelectChange =
    (field: keyof FormData) => (event: React.ChangeEvent<HTMLInputElement>) => {
      setFormData((prev) => ({ ...prev, [field]: event.target.value }));
      if (formErrors[field]) {
        setFormErrors((prev) => ({ ...prev, [field]: '' }));
      }
    };

  const validateForm = (): boolean => {
    const errors: Partial<Record<keyof FormData, string>> = {};
    if (!formData.code.trim()) errors.code = 'Code is verplicht';
    if (!formData.name.trim()) errors.name = 'Naam is verplicht';
    if (!formData.buildingId) errors.buildingId = 'Gebouw is verplicht';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    try {
      if (editingItem) {
        const dto: UpdatePhysicalWorkplaceDto = {
          code: formData.code.trim().toUpperCase(),
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          buildingId: Number(formData.buildingId),
          serviceId: formData.serviceId ? Number(formData.serviceId) : undefined,
          floor: formData.floor.trim() || undefined,
          room: formData.room.trim() || undefined,
          type: formData.type,
          isActive: formData.isActive,
        };
        await updateMutation.mutateAsync({ id: editingItem.id, data: dto });
        setSnackbar({ open: true, message: 'Werkplek bijgewerkt', severity: 'success' });
      } else {
        const dto: CreatePhysicalWorkplaceDto = {
          code: formData.code.trim().toUpperCase(),
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          buildingId: Number(formData.buildingId),
          serviceId: formData.serviceId ? Number(formData.serviceId) : undefined,
          floor: formData.floor.trim() || undefined,
          room: formData.room.trim() || undefined,
          type: formData.type,
        };
        await createMutation.mutateAsync(dto);
        setSnackbar({ open: true, message: 'Werkplek aangemaakt', severity: 'success' });
      }
      handleCloseDialog();
    } catch {
      setSnackbar({ open: true, message: 'Fout bij opslaan werkplek', severity: 'error' });
    }
  };

  const handleDelete = async () => {
    if (!deletingItem) return;
    try {
      await deleteMutation.mutateAsync({ id: deletingItem.id });
      setSnackbar({ open: true, message: 'Werkplek verwijderd', severity: 'success' });
      setDeleteDialogOpen(false);
      setDeletingItem(null);
    } catch {
      setSnackbar({ open: true, message: 'Fout bij verwijderen werkplek', severity: 'error' });
    }
  };

  const handleBulkDelete = async () => {
    if (selectedWorkplaces.length === 0) return;
    try {
      const ids = selectedWorkplaces.map((w) => w.id);
      const result = await bulkDeleteMutation.mutateAsync(ids);
      setSnackbar({
        open: true,
        message: `${result.deleted} werkplekken permanent verwijderd${result.errors.length > 0 ? `, ${result.errors.length} fouten` : ''}`,
        severity: result.errors.length > 0 ? 'error' : 'success',
      });
      setRowSelectionModel({ type: 'include', ids: new Set() });
      setBulkDeleteDialogOpen(false);
    } catch {
      setSnackbar({ open: true, message: 'Fout bij verwijderen werkplekken', severity: 'error' });
    }
  };

  const handleBulkActivate = async () => {
    if (selectedWorkplaces.length === 0) return;
    try {
      await bulkUpdateMutation.mutateAsync({ ids: selectedWorkplaces.map((w) => w.id), isActive: true });
      setSnackbar({ open: true, message: `${selectedWorkplaces.length} werkplekken geactiveerd`, severity: 'success' });
      setRowSelectionModel({ type: 'include', ids: new Set() });
    } catch {
      setSnackbar({ open: true, message: 'Fout bij activeren werkplekken', severity: 'error' });
    }
  };

  const handleBulkDeactivate = async () => {
    if (selectedWorkplaces.length === 0) return;
    try {
      await bulkUpdateMutation.mutateAsync({ ids: selectedWorkplaces.map((w) => w.id), isActive: false });
      setSnackbar({ open: true, message: `${selectedWorkplaces.length} werkplekken gedeactiveerd`, severity: 'success' });
      setRowSelectionModel({ type: 'include', ids: new Set() });
    } catch {
      setSnackbar({ open: true, message: 'Fout bij deactiveren werkplekken', severity: 'error' });
    }
  };

  const handleDeleteAll = async () => {
    try {
      const result = await deleteAllMutation.mutateAsync();
      setSnackbar({ open: true, message: result.message, severity: 'success' });
      setRowSelectionModel({ type: 'include', ids: new Set() });
      setBulkDeleteDialogOpen(false);
    } catch {
      setSnackbar({ open: true, message: 'Fout bij verwijderen alle werkplekken', severity: 'error' });
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      await downloadTemplateMutation.mutateAsync();
      setSnackbar({ open: true, message: 'Template gedownload', severity: 'success' });
    } catch {
      setSnackbar({ open: true, message: 'Fout bij downloaden template', severity: 'error' });
    }
  };

  const handleExportCsv = async () => {
    try {
      await exportCsvMutation.mutateAsync({});
      setSnackbar({ open: true, message: 'Werkplekken geëxporteerd', severity: 'success' });
    } catch {
      setSnackbar({ open: true, message: 'Fout bij exporteren werkplekken', severity: 'error' });
    }
  };

  const handleImportClick = () => fileInputRef.current?.click();

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const result = await importCsvMutation.mutateAsync(file);
      setImportResult(result);
      setImportResultDialogOpen(true);
      const severity = result.isFullySuccessful || result.successCount > 0 ? 'success' : 'error';
      const message =
        result.isFullySuccessful
          ? `${result.successCount} werkplekken geïmporteerd`
          : result.successCount > 0
            ? `${result.successCount} van ${result.totalRows} werkplekken geïmporteerd`
            : 'Geen werkplekken geïmporteerd';
      setSnackbar({ open: true, message, severity });
    } catch {
      setSnackbar({ open: true, message: 'Fout bij importeren werkplekken', severity: 'error' });
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ─── Inline edit: processRowUpdate ───────────────────────────────────────

  const processRowUpdate = async (
    newRow: PhysicalWorkplace,
    oldRow: PhysicalWorkplace
  ): Promise<PhysicalWorkplace> => {
    // Nothing changed — skip API call
    if (
      newRow.name === oldRow.name &&
      newRow.type === oldRow.type &&
      newRow.buildingId === oldRow.buildingId &&
      newRow.serviceId === oldRow.serviceId &&
      newRow.floor === oldRow.floor &&
      newRow.room === oldRow.room &&
      newRow.isActive === oldRow.isActive
    ) {
      return oldRow;
    }

    const dto: UpdatePhysicalWorkplaceDto = {
      name: newRow.name,
      type: newRow.type,
      buildingId: newRow.buildingId,
      serviceId: newRow.serviceId ?? undefined,
      floor: newRow.floor ?? undefined,
      room: newRow.room ?? undefined,
      isActive: newRow.isActive,
    };

    try {
      const updated = await updateMutation.mutateAsync({ id: newRow.id, data: dto });
      setSnackbar({ open: true, message: `${newRow.code} opgeslagen`, severity: 'success' });
      return updated;
    } catch {
      setSnackbar({ open: true, message: `Fout bij opslaan ${newRow.code}`, severity: 'error' });
      throw new Error('update failed'); // causes DataGrid to roll back to oldRow
    }
  };

  const handleProcessRowUpdateError = () => {
    // Row rollback is handled automatically by DataGrid when processRowUpdate throws
  };

  // ─── Columns ──────────────────────────────────────────────────────────────

  const buildingValueOptions = useMemo(
    () => buildings.map((b) => ({ value: b.id, label: `${b.code} - ${b.name}` })),
    [buildings]
  );

  // Note: "Geen dienst" intentionally omitted — the backend cannot clear serviceId
  // via the existing UpdatePhysicalWorkplaceDto (HasValue check only sets, never clears).
  // Use the full edit dialog to pick a service for the first time; clearing requires admin.
  const serviceValueOptions = useMemo(
    () => services.map((s) => ({ value: s.id, label: `${s.code} - ${s.name}` })),
    [services]
  );

  const typeValueOptions = useMemo(
    () => Object.entries(WorkplaceTypeLabels).map(([value, label]) => ({ value, label })),
    []
  );

  const columns: GridColDef[] = useMemo(
    () => [
      {
        field: 'code',
        headerName: 'Code',
        minWidth: 100,
        flex: 0.8,
        editable: false, // code is immutable after creation
        renderCell: (params: GridRenderCellParams) => (
          <Typography sx={{ fontFamily: 'monospace', fontWeight: 600, color: '#009688' }}>
            {params.value as string}
          </Typography>
        ),
      },
      {
        field: 'name',
        headerName: 'Naam',
        minWidth: 150,
        flex: 1.5,
        editable: true,
      },
      {
        field: 'type',
        headerName: 'Type',
        minWidth: 130,
        flex: 1,
        editable: true,
        type: 'singleSelect' as const,
        valueOptions: typeValueOptions,
        // The grid stores the raw string value (WorkplaceType); display the label
        valueFormatter: (value: WorkplaceType) =>
          WorkplaceTypeLabels[value] ?? value,
      },
      {
        field: 'buildingId',
        headerName: 'Gebouw',
        minWidth: 130,
        flex: 1,
        editable: true,
        type: 'singleSelect' as const,
        valueOptions: buildingValueOptions,
        valueFormatter: (_value: number, row: PhysicalWorkplace) =>
          row.buildingName ?? '-',
      },
      {
        field: 'serviceId',
        headerName: 'Dienst',
        minWidth: 130,
        flex: 1,
        editable: true,
        type: 'singleSelect' as const,
        valueOptions: serviceValueOptions,
        valueFormatter: (_value: number | undefined, row: PhysicalWorkplace) =>
          row.serviceName ?? '-',
      },
      {
        field: 'floor',
        headerName: 'Verdieping',
        minWidth: 80,
        flex: 0.7,
        editable: true,
        valueGetter: (_value: string | undefined, row: PhysicalWorkplace) =>
          row.floor ?? '',
      },
      {
        field: 'room',
        headerName: 'Kamer',
        minWidth: 80,
        flex: 0.7,
        editable: true,
        valueGetter: (_value: string | undefined, row: PhysicalWorkplace) =>
          row.room ?? '',
      },
    ],
    [buildingValueOptions, serviceValueOptions, typeValueOptions]
  );

  if (isLoading) return <Loading message="Werkplekken laden..." />;

  const isAnyMutationPending =
    downloadTemplateMutation.isPending ||
    exportCsvMutation.isPending ||
    importCsvMutation.isPending;

  return (
    <Box>
      {/* Gap Analysis */}
      <WorkplaceGapAnalysisSection />

      {/* ── Toolbar: search + filters + CSV ─────────────────────────────── */}
      <Paper
        elevation={0}
        sx={{
          mb: filtersOpen ? 0 : 1.5,
          p: 1.5,
          borderRadius: filtersOpen ? '12px 12px 0 0' : 2,
          bgcolor: bgBase,
          border: '1px solid',
          borderColor: alpha('#009688', 0.2),
          borderLeft: '3px solid #009688',
        }}
      >
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
          {/* Search */}
          <TextField
            size="small"
            placeholder="Zoek code, naam, gebouw, dienst..."
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
              minWidth: 200,
              maxWidth: 320,
              '& .MuiOutlinedInput-root': {
                fontSize: '0.85rem',
                height: 34,
                bgcolor: isDark ? alpha('#fff', 0.04) : '#fff',
                '& fieldset': { borderColor: alpha('#009688', 0.25) },
                '&:hover fieldset': { borderColor: alpha('#009688', 0.5) },
                '&.Mui-focused fieldset': { borderColor: '#009688' },
              },
            }}
          />

          {/* Filter toggle */}
          <Tooltip title={filtersOpen ? 'Filters sluiten' : 'Filters openen'}>
            <IconButton
              size="small"
              onClick={() => setFiltersOpen((p) => !p)}
              sx={{
                width: 34,
                height: 34,
                bgcolor: (filtersOpen || hasActiveFilters) ? alpha('#009688', 0.12) : 'transparent',
                color: '#009688',
                border: '1px solid',
                borderColor: (filtersOpen || hasActiveFilters) ? '#009688' : alpha('#009688', 0.25),
                borderRadius: 1.5,
                transition: 'all 0.15s ease',
                '&:hover': { bgcolor: alpha('#009688', 0.1) },
              }}
            >
              <FilterListIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>

          {/* Active filter chips summary */}
          {hasActiveFilters && (
            <Chip
              label={`${[
                filterState.selectedServiceIds.size,
                filterState.selectedBuildingIds.size,
                filterState.selectedTypes.size,
                filterState.activeFilter !== 'all' ? 1 : 0,
              ].reduce((a, b) => a + b, 0)} filter${
                [filterState.selectedServiceIds.size, filterState.selectedBuildingIds.size, filterState.selectedTypes.size, filterState.activeFilter !== 'all' ? 1 : 0].reduce((a, b) => a + b, 0) === 1 ? '' : 's'
              } actief`}
              size="small"
              onDelete={clearAllFilters}
              deleteIcon={<ClearAllIcon sx={{ fontSize: 16 }} />}
              sx={{
                height: 24,
                fontSize: '0.7rem',
                fontWeight: 600,
                bgcolor: alpha('#009688', 0.12),
                color: '#009688',
                border: '1px solid',
                borderColor: alpha('#009688', 0.25),
                '& .MuiChip-deleteIcon': { color: alpha('#009688', 0.7), fontSize: 14 },
              }}
            />
          )}

          {/* Count display */}
          <Chip
            size="small"
            label={`${filteredWorkplaces.length} / ${workplaces.length}`}
            sx={{
              height: 22,
              fontSize: '0.65rem',
              fontWeight: 700,
              bgcolor: alpha('#009688', 0.08),
              color: '#009688',
            }}
          />

          <Box sx={{ flex: 1 }} />

          {/* CSV buttons */}
          <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
            <Tooltip title="Download lege CSV template" arrow placement="top">
              <Button
                variant="outlined"
                size="small"
                startIcon={downloadTemplateMutation.isPending ? <CircularProgress size={14} /> : <FileDownloadIcon sx={{ fontSize: 16 }} />}
                onClick={handleDownloadTemplate}
                disabled={isAnyMutationPending}
                sx={{
                  borderColor: alpha('#009688', 0.4),
                  color: '#009688',
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  height: 32,
                  px: 1.5,
                  '&:hover': { borderColor: '#009688', bgcolor: alpha('#009688', 0.06) },
                }}
              >
                Template
              </Button>
            </Tooltip>

            <Tooltip title="Exporteer alle werkplekken naar CSV" arrow placement="top">
              <Button
                variant="outlined"
                size="small"
                startIcon={exportCsvMutation.isPending ? <CircularProgress size={14} /> : <DownloadIcon sx={{ fontSize: 16 }} />}
                onClick={handleExportCsv}
                disabled={isAnyMutationPending || workplaces.length === 0}
                sx={{
                  borderColor: alpha('#009688', 0.4),
                  color: '#009688',
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  height: 32,
                  px: 1.5,
                  '&:hover': { borderColor: '#009688', bgcolor: alpha('#009688', 0.06) },
                }}
              >
                Export ({workplaces.length})
              </Button>
            </Tooltip>

            <Tooltip title="Importeer werkplekken via CSV" arrow placement="top">
              <Button
                variant="contained"
                size="small"
                startIcon={importCsvMutation.isPending ? <CircularProgress size={14} color="inherit" /> : <UploadIcon sx={{ fontSize: 16 }} />}
                onClick={handleImportClick}
                disabled={isAnyMutationPending}
                sx={{
                  bgcolor: '#009688',
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  height: 32,
                  px: 1.5,
                  boxShadow: 'none',
                  '&:hover': { bgcolor: '#00796b', boxShadow: 'none' },
                }}
              >
                CSV import
              </Button>
            </Tooltip>
          </Stack>

          {/* Hidden file input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".csv"
            style={{ display: 'none' }}
          />
        </Stack>
      </Paper>

      {/* ── Advanced Filters Panel ───────────────────────────────────────── */}
      <WorkplacesFiltersPanel
        filters={filterState}
        onChange={setFilterState}
        open={filtersOpen}
      />

      {/* ── Quick Add Row ────────────────────────────────────────────────── */}
      <WorkplacesQuickAddRow
        onSuccess={(msg) => setSnackbar({ open: true, message: msg, severity: 'success' })}
        onError={(msg) => setSnackbar({ open: true, message: msg, severity: 'error' })}
      />

      {/* ── Data Grid ────────────────────────────────────────────────────── */}
      <NeumorphicDataGrid<PhysicalWorkplace>
        rows={filteredWorkplaces}
        columns={columns}
        onEdit={handleOpenDialog}
        onDelete={(item) => { setDeletingItem(item); setDeleteDialogOpen(true); }}
        showActiveStatus
        accentColor="#009688"
        checkboxSelection={true}
        rowSelectionModel={rowSelectionModel}
        onRowSelectionModelChange={setRowSelectionModel}
        initialPageSize={20}
        processRowUpdate={processRowUpdate}
        onProcessRowUpdateError={handleProcessRowUpdateError}
      />

      {/* ── Bulk Action Bar ───────────────────────────────────────────────── */}
      <WorkplacesBulkActionBar
        count={selectedWorkplaces.length}
        onBulkEdit={() => setBulkEditDialogOpen(true)}
        onBulkDelete={() => setBulkDeleteDialogOpen(true)}
        onActivate={handleBulkActivate}
        onDeactivate={handleBulkDeactivate}
        onClear={() => setRowSelectionModel({ type: 'include', ids: new Set() })}
        isDeleting={bulkDeleteMutation.isPending || bulkUpdateMutation.isPending}
      />

      {/* ── FAB ─────────────────────────────────────────────────────────── */}
      <Fab
        color="primary"
        aria-label="werkplek toevoegen"
        onClick={() => handleOpenDialog()}
        sx={{
          position: 'fixed',
          bottom: 80,
          right: 24,
          zIndex: 1100,
          bgcolor: '#009688',
          '&:hover': { bgcolor: '#00796b', transform: 'scale(1.1)' },
          boxShadow: '0 4px 20px rgba(0, 150, 136, 0.4)',
          transition: 'all 0.2s ease',
        }}
      >
        <AddIcon />
      </Fab>

      {/* ── Full Form Dialog ─────────────────────────────────────────────── */}
      <AdminFormDialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        onSubmit={handleSubmit}
        title={editingItem ? 'Werkplek Bewerken' : 'Werkplek Toevoegen'}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <TextField
            label="Code"
            value={formData.code}
            onChange={handleInputChange('code')}
            error={!!formErrors.code}
            helperText={
              formErrors.code ||
              (editingItem
                ? 'Code wijzigen — moet uniek blijven'
                : 'Unieke code (bijv. WP-001)')
            }
            required
            fullWidth
            inputProps={{ style: { textTransform: 'uppercase' } }}
          />
          <TextField
            label="Naam"
            value={formData.name}
            onChange={handleInputChange('name')}
            error={!!formErrors.name}
            helperText={formErrors.name || 'Werkplek naam'}
            required
            fullWidth
          />
          <TextField
            select
            label="Type"
            value={formData.type}
            onChange={handleSelectChange('type')}
            fullWidth
          >
            {Object.entries(WorkplaceTypeLabels).map(([value, label]) => (
              <MenuItem key={value} value={value as WorkplaceType}>
                {label}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            label="Gebouw"
            value={formData.buildingId}
            onChange={handleSelectChange('buildingId')}
            error={!!formErrors.buildingId}
            helperText={formErrors.buildingId}
            required
            fullWidth
          >
            <MenuItem value="">
              <em>Selecteer gebouw</em>
            </MenuItem>
            {buildings.map((building) => (
              <MenuItem key={building.id} value={String(building.id)}>
                {building.code} - {building.name}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            label="Dienst"
            value={formData.serviceId}
            onChange={handleSelectChange('serviceId')}
            fullWidth
          >
            <MenuItem value="">
              <em>Geen dienst</em>
            </MenuItem>
            {services.map((service) => (
              <MenuItem key={service.id} value={String(service.id)}>
                {service.code} - {service.name}
              </MenuItem>
            ))}
          </TextField>
          <Divider />
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              label="Verdieping"
              value={formData.floor}
              onChange={handleInputChange('floor')}
              helperText="Bijv. 0, 1, 2, K"
              sx={{ flex: 1 }}
            />
            <TextField
              label="Kamer"
              value={formData.room}
              onChange={handleInputChange('room')}
              helperText="Bijv. 101, A1"
              sx={{ flex: 1 }}
            />
          </Box>
          <TextField
            label="Beschrijving"
            value={formData.description}
            onChange={handleInputChange('description')}
            helperText="Optionele beschrijving"
            fullWidth
            multiline
            rows={2}
          />
          {editingItem && (
            <FormControlLabel
              control={
                <Switch
                  checked={formData.isActive}
                  onChange={handleInputChange('isActive')}
                  color="primary"
                />
              }
              label="Actief"
            />
          )}
        </Box>
      </AdminFormDialog>

      {/* ── Single Delete Confirm ─────────────────────────────────────────── */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => { setDeleteDialogOpen(false); setDeletingItem(null); }}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { border: '2px solid', borderColor: 'error.main', borderRadius: 2 } }}
      >
        <DialogTitle sx={{ backgroundColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(244, 67, 54, 0.1)' : 'rgba(244, 67, 54, 0.05)', color: 'error.main', fontWeight: 700, borderBottom: '1px solid', borderColor: 'error.main' }}>
          Werkplek Verwijderen
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Typography variant="body1">
            Weet je zeker dat je werkplek <strong>{deletingItem?.code} - {deletingItem?.name}</strong> wilt verwijderen?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Deze actie kan niet ongedaan worden gemaakt.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          <Button onClick={() => { setDeleteDialogOpen(false); setDeletingItem(null); }} color="inherit">Annuleren</Button>
          <Button onClick={handleDelete} variant="contained" color="error" disabled={deleteMutation.isPending}>
            {deleteMutation.isPending ? 'Verwijderen...' : 'Verwijderen'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Bulk Delete Confirm ───────────────────────────────────────────── */}
      <Dialog
        open={bulkDeleteDialogOpen}
        onClose={() => setBulkDeleteDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { border: '2px solid', borderColor: 'error.main', borderRadius: 2 } }}
      >
        <DialogTitle sx={{ backgroundColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(244, 67, 54, 0.1)' : 'rgba(244, 67, 54, 0.05)', color: 'error.main', fontWeight: 700, borderBottom: '1px solid', borderColor: 'error.main' }}>
          Werkplekken Permanent Verwijderen
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Typography variant="body1">
            Weet je zeker dat je <strong>{selectedWorkplaces.length} werkplekken</strong> permanent wilt verwijderen?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Deze actie kan niet ongedaan worden gemaakt. Werkplekken worden permanent uit de database verwijderd.
          </Typography>
          <Divider sx={{ my: 2 }} />
          <Typography variant="body2" color="text.secondary">
            Of wil je <strong>alle {workplaces.length} werkplekken</strong> in één keer verwijderen?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider', gap: 1 }}>
          <Button onClick={() => setBulkDeleteDialogOpen(false)} color="inherit">Annuleren</Button>
          <Button onClick={handleDeleteAll} variant="outlined" color="error" disabled={deleteAllMutation.isPending || bulkDeleteMutation.isPending}>
            {deleteAllMutation.isPending ? 'Verwijderen...' : `Verwijder Alles (${workplaces.length})`}
          </Button>
          <Button onClick={handleBulkDelete} variant="contained" color="error" disabled={bulkDeleteMutation.isPending || deleteAllMutation.isPending}>
            {bulkDeleteMutation.isPending ? 'Verwijderen...' : `Verwijder (${selectedWorkplaces.length})`}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Bulk Edit Dialog ──────────────────────────────────────────────── */}
      <BulkEditWorkplacesDialog
        open={bulkEditDialogOpen}
        onClose={() => setBulkEditDialogOpen(false)}
        selectedWorkplaces={selectedWorkplaces}
        onSuccess={(msg) => {
          setSnackbar({ open: true, message: msg, severity: 'success' });
          setRowSelectionModel({ type: 'include', ids: new Set() });
        }}
        onError={(msg) => setSnackbar({ open: true, message: msg, severity: 'error' })}
      />

      {/* ── Import Result Dialog ──────────────────────────────────────────── */}
      <Dialog
        open={importResultDialogOpen}
        onClose={() => setImportResultDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            border: '2px solid',
            borderColor: importResult?.isFullySuccessful ? 'success.main' : 'warning.main',
            borderRadius: 2,
          },
        }}
      >
        <DialogTitle
          sx={{
            backgroundColor: (theme) =>
              importResult?.isFullySuccessful
                ? theme.palette.mode === 'dark' ? 'rgba(76, 175, 80, 0.1)' : 'rgba(76, 175, 80, 0.05)'
                : theme.palette.mode === 'dark' ? 'rgba(255, 152, 0, 0.1)' : 'rgba(255, 152, 0, 0.05)',
            color: importResult?.isFullySuccessful ? 'success.main' : 'warning.main',
            fontWeight: 700,
            borderBottom: '1px solid',
            borderColor: importResult?.isFullySuccessful ? 'success.main' : 'warning.main',
          }}
        >
          Import Resultaat
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          {importResult && (
            <>
              <Stack direction="row" spacing={3} sx={{ mb: 2 }}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="success.main" fontWeight={700}>{importResult.successCount}</Typography>
                  <Typography variant="caption" color="text.secondary">Geslaagd</Typography>
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="error.main" fontWeight={700}>{importResult.errorCount}</Typography>
                  <Typography variant="caption" color="text.secondary">Fouten</Typography>
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="text.primary" fontWeight={700}>{importResult.totalRows}</Typography>
                  <Typography variant="caption" color="text.secondary">Totaal</Typography>
                </Box>
              </Stack>
              {importResult.errorCount > 0 && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle2" color="error.main" sx={{ mb: 1 }}>Fouten:</Typography>
                  <List dense sx={{ maxHeight: 200, overflow: 'auto' }}>
                    {importResult.results.filter((r) => !r.success).map((r) => (
                      <ListItem key={r.rowNumber} sx={{ py: 0.5 }}>
                        <ListItemIcon sx={{ minWidth: 32 }}><ErrorIcon color="error" fontSize="small" /></ListItemIcon>
                        <ListItemText
                          primary={`Rij ${r.rowNumber}: ${r.code || 'onbekend'}`}
                          secondary={r.error}
                          primaryTypographyProps={{ variant: 'body2', fontWeight: 600 }}
                          secondaryTypographyProps={{ variant: 'caption' }}
                        />
                      </ListItem>
                    ))}
                  </List>
                </>
              )}
              {importResult.successCount > 0 && importResult.successCount <= 10 && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle2" color="success.main" sx={{ mb: 1 }}>Aangemaakt:</Typography>
                  <List dense sx={{ maxHeight: 150, overflow: 'auto' }}>
                    {importResult.results.filter((r) => r.success).map((r) => (
                      <ListItem key={r.rowNumber} sx={{ py: 0.5 }}>
                        <ListItemIcon sx={{ minWidth: 32 }}><CheckCircleIcon color="success" fontSize="small" /></ListItemIcon>
                        <ListItemText primary={`${r.code} - ${r.name}`} primaryTypographyProps={{ variant: 'body2' }} />
                      </ListItem>
                    ))}
                  </List>
                </>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          <Button onClick={() => setImportResultDialogOpen(false)} variant="contained" color="primary">Sluiten</Button>
        </DialogActions>
      </Dialog>

      {/* ── Snackbar ──────────────────────────────────────────────────────── */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
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

export default PhysicalWorkplacesTab;

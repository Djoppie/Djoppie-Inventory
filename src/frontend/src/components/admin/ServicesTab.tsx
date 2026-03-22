import { useState, useMemo, useEffect, useRef } from 'react';
import {
  Box,
  Button,
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
  MenuItem,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  IconButton,
  Stack,
  Tooltip,
  InputAdornment,
  alpha,
  useTheme,
  Checkbox,
  CircularProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AddIcon from '@mui/icons-material/Add';
import SyncIcon from '@mui/icons-material/Sync';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import FolderIcon from '@mui/icons-material/Folder';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import UnfoldMoreIcon from '@mui/icons-material/UnfoldMore';
import UnfoldLessIcon from '@mui/icons-material/UnfoldLess';
import DownloadIcon from '@mui/icons-material/Download';
import UploadIcon from '@mui/icons-material/Upload';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import AdminFormDialog from './AdminFormDialog';
import { Service, UpdateServiceDto, Sector } from '../../types/admin.types';
import { servicesApi, sectorsApi, ServiceCsvImportResult } from '../../api/admin.api';
import Loading from '../common/Loading';

interface FormData {
  code: string;
  name: string;
  description: string;
  sectorId: string;
  sortOrder: string;
  isActive: boolean;
}

const initialFormData: FormData = {
  code: '',
  name: '',
  description: '',
  sectorId: '',
  sortOrder: '0',
  isActive: true,
};

// Neumorphic shadow utilities
const getNeumorph = (isDark: boolean, intensity: 'soft' | 'medium' | 'strong' = 'medium') => {
  const shadows = {
    soft: isDark
      ? '4px 4px 8px rgba(0,0,0,0.4), -2px -2px 6px rgba(255,255,255,0.03)'
      : '4px 4px 8px rgba(0,0,0,0.08), -2px -2px 6px rgba(255,255,255,0.8)',
    medium: isDark
      ? '6px 6px 12px rgba(0,0,0,0.5), -3px -3px 8px rgba(255,255,255,0.04)'
      : '6px 6px 12px rgba(0,0,0,0.1), -3px -3px 8px rgba(255,255,255,0.9)',
    strong: isDark
      ? '8px 8px 16px rgba(0,0,0,0.6), -4px -4px 10px rgba(255,255,255,0.05)'
      : '8px 8px 16px rgba(0,0,0,0.12), -4px -4px 10px rgba(255,255,255,1)',
  };
  return shadows[intensity];
};

const getNeumorphInset = (isDark: boolean) =>
  isDark
    ? 'inset 2px 2px 4px rgba(0,0,0,0.4), inset -1px -1px 3px rgba(255,255,255,0.03)'
    : 'inset 2px 2px 4px rgba(0,0,0,0.06), inset -1px -1px 3px rgba(255,255,255,0.7)';

const ServicesTab = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [importResultDialogOpen, setImportResultDialogOpen] = useState(false);
  const [importResult, setImportResult] = useState<ServiceCsvImportResult | null>(null);
  const [editingItem, setEditingItem] = useState<Service | null>(null);
  const [deletingItem, setDeletingItem] = useState<Service | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [formErrors, setFormErrors] = useState<Partial<FormData>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedSectors, setExpandedSectors] = useState<Set<number>>(new Set());
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Theme colors
  const bgBase = isDark ? '#1a1f2e' : '#f0f2f5';
  const bgSurface = isDark ? '#232936' : '#ffffff';
  const accentColor = '#FF7700';
  const sectorColor = '#9C27B0';

  const { data: services = [], isLoading } = useQuery({
    queryKey: ['admin', 'services', 'active'],
    queryFn: () => servicesApi.getAll(false), // Only active services
  });

  const { data: sectors = [] } = useQuery({
    queryKey: ['admin', 'sectors', 'active'],
    queryFn: () => sectorsApi.getAll(false), // Only active sectors
  });

  const { groupedServices, ungroupedServices } = useMemo(() => {
    const filtered = searchTerm
      ? services.filter(
          (s) =>
            s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.code.toLowerCase().includes(searchTerm.toLowerCase())
        )
      : services;

    const groups = new Map<number, { sector: Sector; services: Service[] }>();
    const ungrouped: Service[] = [];

    sectors.forEach((sector) => {
      groups.set(sector.id, { sector, services: [] });
    });

    filtered.forEach((service) => {
      if (service.sectorId) {
        const group = groups.get(service.sectorId);
        if (group) {
          group.services.push(service);
        } else {
          ungrouped.push(service);
        }
      } else {
        ungrouped.push(service);
      }
    });

    groups.forEach((group) => {
      group.services.sort((a, b) => a.name.localeCompare(b.name));
    });
    ungrouped.sort((a, b) => a.name.localeCompare(b.name));

    const grouped = Array.from(groups.values())
      .filter((g) => !searchTerm || g.services.length > 0)
      .sort((a, b) => a.sector.sortOrder - b.sector.sortOrder);

    return { groupedServices: grouped, ungroupedServices: ungrouped };
  }, [services, sectors, searchTerm]);

  // Initialize expanded sectors when sectors are first loaded
  useEffect(() => {
    if (sectors.length > 0 && expandedSectors.size === 0) {
      setExpandedSectors(new Set(sectors.map((s) => s.id)));
    }
    // Only run when sectors change, not when expandedSectors changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectors]);

  const createMutation = useMutation({
    mutationFn: servicesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'services'] }); // Invalidate all services queries
      setSnackbar({ open: true, message: 'Service created successfully', severity: 'success' });
      handleCloseDialog();
    },
    onError: () => {
      setSnackbar({ open: true, message: 'Failed to create service', severity: 'error' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateServiceDto }) =>
      servicesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'services'] }); // Invalidate all services queries
      setSnackbar({ open: true, message: 'Service updated successfully', severity: 'success' });
      handleCloseDialog();
    },
    onError: () => {
      setSnackbar({ open: true, message: 'Failed to update service', severity: 'error' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: servicesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'services'] }); // Invalidate all services queries
      setSnackbar({ open: true, message: 'Service deleted successfully', severity: 'success' });
      handleCloseDeleteDialog();
    },
    onError: () => {
      setSnackbar({ open: true, message: 'Failed to delete service', severity: 'error' });
    },
  });

  const syncMutation = useMutation({
    mutationFn: servicesApi.syncFromEntra,
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'services'] }); // Invalidate all services queries
      setSnackbar({
        open: true,
        message: `Sync: ${result.created} created, ${result.updated} updated`,
        severity: 'success',
      });
    },
    onError: () => {
      setSnackbar({ open: true, message: 'Failed to sync from Entra', severity: 'error' });
    },
  });

  const downloadTemplateMutation = useMutation({
    mutationFn: servicesApi.downloadTemplate,
    onSuccess: () => {
      setSnackbar({ open: true, message: 'Template gedownload', severity: 'success' });
    },
    onError: () => {
      setSnackbar({ open: true, message: 'Fout bij downloaden template', severity: 'error' });
    },
  });

  const exportCsvMutation = useMutation({
    mutationFn: servicesApi.exportCsv,
    onSuccess: () => {
      setSnackbar({ open: true, message: 'Diensten geëxporteerd', severity: 'success' });
    },
    onError: () => {
      setSnackbar({ open: true, message: 'Fout bij exporteren diensten', severity: 'error' });
    },
  });

  const importCsvMutation = useMutation({
    mutationFn: servicesApi.importCsv,
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'services'] });
      setImportResult(result);
      setImportResultDialogOpen(true);
      if (result.isFullySuccessful) {
        setSnackbar({ open: true, message: `${result.successCount} diensten geïmporteerd`, severity: 'success' });
      } else if (result.successCount > 0) {
        setSnackbar({ open: true, message: `${result.successCount} van ${result.totalRows} diensten geïmporteerd`, severity: 'success' });
      } else {
        setSnackbar({ open: true, message: 'Geen diensten geïmporteerd', severity: 'error' });
      }
    },
    onError: () => {
      setSnackbar({ open: true, message: 'Fout bij importeren diensten', severity: 'error' });
    },
  });

  const deleteAllMutation = useMutation({
    mutationFn: servicesApi.deleteAll,
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'services'] });
      setSnackbar({ open: true, message: result.message, severity: 'success' });
      setSelectedIds(new Set());
      setBulkDeleteDialogOpen(false);
    },
    onError: () => {
      setSnackbar({ open: true, message: 'Fout bij verwijderen alle diensten', severity: 'error' });
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: servicesApi.deleteMany,
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'services'] });
      setSnackbar({
        open: true,
        message: `${result.deleted} diensten verwijderd${result.errors.length > 0 ? `, ${result.errors.length} fouten` : ''}`,
        severity: result.errors.length > 0 ? 'error' : 'success',
      });
      setSelectedIds(new Set());
      setBulkDeleteDialogOpen(false);
    },
    onError: () => {
      setSnackbar({ open: true, message: 'Fout bij verwijderen diensten', severity: 'error' });
    },
  });

  const handleToggleSector = (sectorId: number) => {
    setExpandedSectors((prev) => {
      const next = new Set(prev);
      if (next.has(sectorId)) {
        next.delete(sectorId);
      } else {
        next.add(sectorId);
      }
      return next;
    });
  };

  const handleExpandAll = () => setExpandedSectors(new Set(sectors.map((s) => s.id)));
  const handleCollapseAll = () => setExpandedSectors(new Set());

  const handleOpenDialog = (item?: Service) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        code: item.code,
        name: item.name,
        description: item.description || '',
        sectorId: String(item.sectorId),
        sortOrder: String(item.sortOrder),
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

  const handleOpenDeleteDialog = (item: Service) => {
    setDeletingItem(item);
    setDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setDeletingItem(null);
  };

  const handleInputChange = (field: keyof FormData) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value =
      field === 'isActive' ? (event.target as HTMLInputElement).checked : event.target.value;
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const errors: Partial<FormData> = {};
    if (!formData.code.trim()) errors.code = 'Code is required';
    if (!formData.name.trim()) errors.name = 'Name is required';
    if (!formData.sectorId) errors.sectorId = 'Sector is required';
    if (!formData.sortOrder || isNaN(Number(formData.sortOrder)))
      errors.sortOrder = 'Sort order must be a number';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    const sortOrder = Number(formData.sortOrder);
    const sectorId = Number(formData.sectorId);

    try {
      if (editingItem) {
        await updateMutation.mutateAsync({
          id: editingItem.id,
          data: {
            code: formData.code.trim().toUpperCase(),
            name: formData.name.trim(),
            description: formData.description.trim() || undefined,
            sectorId,
            isActive: formData.isActive,
            sortOrder,
          },
        });
      } else {
        await createMutation.mutateAsync({
          code: formData.code.trim().toUpperCase(),
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          sectorId,
          sortOrder,
        });
      }
    } catch {
      // Error handled by mutation callbacks
    }
  };

  const handleDelete = async () => {
    if (!deletingItem) return;
    await deleteMutation.mutateAsync(deletingItem.id);
  };

  // Checkbox handlers
  const handleToggleService = (serviceId: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(serviceId)) {
        next.delete(serviceId);
      } else {
        next.add(serviceId);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    const allIds = services.map((s) => s.id);
    setSelectedIds(new Set(allIds));
  };

  const handleDeselectAll = () => {
    setSelectedIds(new Set());
  };

  // CSV handlers
  const handleDownloadTemplate = () => {
    downloadTemplateMutation.mutate();
  };

  const handleExportCsv = () => {
    exportCsvMutation.mutate();
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    importCsvMutation.mutate(file);
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;
    bulkDeleteMutation.mutate(Array.from(selectedIds));
  };

  const handleDeleteAll = () => {
    deleteAllMutation.mutate();
  };

  if (isLoading) return <Loading message="Loading services..." />;

  const isAnyMutationPending =
    downloadTemplateMutation.isPending ||
    exportCsvMutation.isPending ||
    importCsvMutation.isPending ||
    deleteAllMutation.isPending ||
    bulkDeleteMutation.isPending;

  const totalServices = services.length;
  const activeServices = services.filter((s) => s.isActive).length;

  return (
    <Box
      sx={{
        bgcolor: bgBase,
        borderRadius: 3,
        p: { xs: 1.5, sm: 2 },
        boxShadow: getNeumorph(isDark, 'medium'),
      }}
    >
      {/* CSV Toolbar */}
      <Stack
        direction="row"
        spacing={1}
        sx={{
          mb: 2,
          p: 1.5,
          bgcolor: alpha(accentColor, isDark ? 0.08 : 0.05),
          borderRadius: 2,
          border: '1px solid',
          borderColor: alpha(accentColor, isDark ? 0.2 : 0.15),
        }}
      >
        <Tooltip title="Download CSV template voor import">
          <Button
            variant="outlined"
            size="small"
            startIcon={downloadTemplateMutation.isPending ? <CircularProgress size={16} /> : <FileDownloadIcon />}
            onClick={handleDownloadTemplate}
            disabled={isAnyMutationPending}
            sx={{
              borderColor: accentColor,
              color: accentColor,
              '&:hover': {
                borderColor: '#e65c00',
                bgcolor: alpha(accentColor, 0.08),
              },
            }}
          >
            Template
          </Button>
        </Tooltip>

        <Tooltip title="Exporteer alle diensten naar CSV">
          <Button
            variant="outlined"
            size="small"
            startIcon={exportCsvMutation.isPending ? <CircularProgress size={16} /> : <DownloadIcon />}
            onClick={handleExportCsv}
            disabled={isAnyMutationPending || services.length === 0}
            sx={{
              borderColor: accentColor,
              color: accentColor,
              '&:hover': {
                borderColor: '#e65c00',
                bgcolor: alpha(accentColor, 0.08),
              },
            }}
          >
            Exporteer ({services.length})
          </Button>
        </Tooltip>

        <Tooltip title="Importeer diensten vanuit CSV">
          <Button
            variant="contained"
            size="small"
            startIcon={importCsvMutation.isPending ? <CircularProgress size={16} color="inherit" /> : <UploadIcon />}
            onClick={handleImportClick}
            disabled={isAnyMutationPending}
            sx={{
              bgcolor: accentColor,
              '&:hover': {
                bgcolor: '#e65c00',
              },
            }}
          >
            Importeer CSV
          </Button>
        </Tooltip>

        {/* Selection buttons */}
        {selectedIds.size > 0 ? (
          <Tooltip title={`${selectedIds.size} geselecteerd - klik om te deselecteren`}>
            <Button
              variant="text"
              size="small"
              onClick={handleDeselectAll}
              sx={{ color: 'text.secondary' }}
            >
              Deselecteer ({selectedIds.size})
            </Button>
          </Tooltip>
        ) : (
          <Tooltip title="Selecteer alle diensten">
            <Button
              variant="text"
              size="small"
              onClick={handleSelectAll}
              disabled={services.length === 0}
              sx={{ color: 'text.secondary' }}
            >
              Selecteer alles
            </Button>
          </Tooltip>
        )}

        {/* Delete Selected Button */}
        {selectedIds.size > 0 && (
          <Tooltip title={`Verwijder ${selectedIds.size} geselecteerde diensten`}>
            <Button
              variant="contained"
              size="small"
              color="error"
              startIcon={bulkDeleteMutation.isPending ? <CircularProgress size={16} color="inherit" /> : <DeleteSweepIcon />}
              onClick={() => setBulkDeleteDialogOpen(true)}
              disabled={isAnyMutationPending}
            >
              Verwijder ({selectedIds.size})
            </Button>
          </Tooltip>
        )}

        {/* Hidden file input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".csv"
          style={{ display: 'none' }}
        />
      </Stack>

      {/* Search Toolbar */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: { xs: 'stretch', md: 'center' },
          gap: 1.5,
          mb: 2,
          p: 1.5,
          bgcolor: bgSurface,
          borderRadius: 2,
          boxShadow: getNeumorphInset(isDark),
        }}
      >
        {/* Search */}
        <TextField
          size="small"
          placeholder="Search services..."
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
            flex: { xs: 1, md: '0 0 280px' },
            '& .MuiOutlinedInput-root': {
              bgcolor: bgBase,
              borderRadius: 1.5,
              fontSize: '0.85rem',
              boxShadow: getNeumorphInset(isDark),
              '& fieldset': { border: 'none' },
              '&:hover': {
                boxShadow: `${getNeumorphInset(isDark)}, 0 0 0 1px ${alpha(accentColor, 0.3)}`,
              },
              '&.Mui-focused': {
                boxShadow: `${getNeumorphInset(isDark)}, 0 0 0 2px ${alpha(accentColor, 0.4)}`,
              },
            },
            '& .MuiInputBase-input': { py: 0.75 },
          }}
        />

        {/* Expand/Collapse Buttons */}
        <Stack direction="row" spacing={0.5}>
          <Tooltip title="Expand All" arrow>
            <IconButton
              size="small"
              onClick={handleExpandAll}
              sx={{
                width: 32,
                height: 32,
                bgcolor: bgBase,
                boxShadow: getNeumorph(isDark, 'soft'),
                '&:hover': { bgcolor: alpha(accentColor, 0.1) },
              }}
            >
              <UnfoldMoreIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Collapse All" arrow>
            <IconButton
              size="small"
              onClick={handleCollapseAll}
              sx={{
                width: 32,
                height: 32,
                bgcolor: bgBase,
                boxShadow: getNeumorph(isDark, 'soft'),
                '&:hover': { bgcolor: alpha(accentColor, 0.1) },
              }}
            >
              <UnfoldLessIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
        </Stack>

        {/* Stats */}
        <Stack direction="row" spacing={1} sx={{ ml: 'auto' }}>
          <Chip
            size="small"
            label={`${totalServices} services`}
            sx={{
              height: 24,
              fontSize: '0.7rem',
              fontWeight: 600,
              bgcolor: alpha(accentColor, 0.1),
              color: accentColor,
            }}
          />
          <Chip
            size="small"
            label={`${activeServices} active`}
            sx={{
              height: 24,
              fontSize: '0.7rem',
              fontWeight: 600,
              bgcolor: alpha('#4CAF50', 0.1),
              color: '#4CAF50',
            }}
          />
          <Chip
            size="small"
            label={`${sectors.length} sectors`}
            sx={{
              height: 24,
              fontSize: '0.7rem',
              fontWeight: 600,
              bgcolor: alpha(sectorColor, 0.1),
              color: sectorColor,
            }}
          />
        </Stack>
      </Box>

      {/* Grouped Accordions */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {groupedServices.map(({ sector, services: sectorServices }) => (
          <Accordion
            key={sector.id}
            expanded={expandedSectors.has(sector.id)}
            onChange={() => handleToggleSector(sector.id)}
            disableGutters
            elevation={0}
            sx={{
              bgcolor: bgSurface,
              borderRadius: '12px !important',
              boxShadow: getNeumorph(isDark, 'soft'),
              '&:before': { display: 'none' },
              overflow: 'hidden',
            }}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon sx={{ color: sectorColor }} />}
              sx={{
                minHeight: 48,
                px: 2,
                py: 0.5,
                bgcolor: alpha(sectorColor, isDark ? 0.08 : 0.03),
                '&:hover': {
                  bgcolor: alpha(sectorColor, isDark ? 0.12 : 0.06),
                },
                '& .MuiAccordionSummary-content': { my: 0.5 },
              }}
            >
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ width: '100%' }}>
                <FolderIcon sx={{ color: sectorColor, fontSize: 20 }} />
                <Typography variant="body2" fontWeight={600} sx={{ flex: 1 }}>
                  {sector.name}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                  {sector.code}
                </Typography>
                <Chip
                  size="small"
                  label={sectorServices.length}
                  sx={{
                    height: 20,
                    minWidth: 28,
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    bgcolor: sectorColor,
                    color: '#fff',
                    '& .MuiChip-label': { px: 0.75 },
                  }}
                />
              </Stack>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 0 }}>
              {sectorServices.length === 0 ? (
                <Box sx={{ py: 2, textAlign: 'center' }}>
                  <Typography variant="caption" color="text.disabled">
                    No services
                  </Typography>
                </Box>
              ) : (
                <Box>
                  {sectorServices.map((service, idx) => {
                    const isInactive = !service.isActive;
                    const isSelected = selectedIds.has(service.id);
                    return (
                      <Box
                        key={service.id}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          px: 1,
                          py: 0.5,
                          borderTop: `1px solid ${alpha(isDark ? '#fff' : '#000', 0.04)}`,
                          bgcolor: isSelected
                            ? alpha(accentColor, isDark ? 0.15 : 0.1)
                            : idx % 2 === 0
                              ? 'transparent'
                              : alpha(bgBase, 0.3),
                          opacity: isInactive ? 0.5 : 1,
                          transition: 'all 0.1s ease',
                          '&:hover': {
                            bgcolor: alpha(accentColor, isDark ? 0.1 : 0.06),
                          },
                        }}
                      >
                        <Checkbox
                          size="small"
                          checked={isSelected}
                          onChange={() => handleToggleService(service.id)}
                          onClick={(e) => e.stopPropagation()}
                          sx={{
                            p: 0.5,
                            color: alpha(accentColor, 0.5),
                            '&.Mui-checked': {
                              color: accentColor,
                            },
                          }}
                        />
                        <Typography
                          variant="caption"
                          sx={{
                            fontFamily: 'monospace',
                            fontWeight: 600,
                            color: accentColor,
                            minWidth: 70,
                          }}
                        >
                          {service.code}
                        </Typography>
                        <Typography variant="body2" sx={{ flex: 1, fontSize: '0.8rem' }}>
                          {service.name}
                        </Typography>
                        {isInactive && (
                          <Tooltip title="Inactive" arrow>
                            <HighlightOffIcon sx={{ fontSize: 16, color: alpha('#F44336', 0.6) }} />
                          </Tooltip>
                        )}
                        <Tooltip title="Edit" arrow>
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenDialog(service);
                            }}
                            sx={{
                              width: 26,
                              height: 26,
                              bgcolor: bgBase,
                              color: accentColor,
                              boxShadow: getNeumorph(isDark, 'soft'),
                              '&:hover': {
                                bgcolor: accentColor,
                                color: '#fff',
                              },
                            }}
                          >
                            <EditIcon sx={{ fontSize: 14 }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete" arrow>
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenDeleteDialog(service);
                            }}
                            sx={{
                              width: 26,
                              height: 26,
                              bgcolor: bgBase,
                              color: '#EF5350',
                              boxShadow: getNeumorph(isDark, 'soft'),
                              '&:hover': {
                                bgcolor: '#EF5350',
                                color: '#fff',
                              },
                            }}
                          >
                            <DeleteIcon sx={{ fontSize: 14 }} />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    );
                  })}
                </Box>
              )}
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>

      {/* Ungrouped Services (no sector) */}
      {ungroupedServices.length > 0 && (
        <Box sx={{ mt: 1 }}>
          <Accordion
            expanded={expandedSectors.has(-1)}
            onChange={() => handleToggleSector(-1)}
            disableGutters
            elevation={0}
            sx={{
              bgcolor: bgSurface,
              borderRadius: '12px !important',
              boxShadow: getNeumorph(isDark, 'soft'),
              '&:before': { display: 'none' },
              overflow: 'hidden',
            }}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon sx={{ color: 'text.secondary' }} />}
              sx={{
                minHeight: 48,
                px: 2,
                py: 0.5,
                bgcolor: alpha('#9E9E9E', isDark ? 0.08 : 0.03),
                '&:hover': {
                  bgcolor: alpha('#9E9E9E', isDark ? 0.12 : 0.06),
                },
                '& .MuiAccordionSummary-content': { my: 0.5 },
              }}
            >
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ width: '100%' }}>
                <FolderIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                <Typography variant="body2" fontWeight={600} sx={{ flex: 1 }}>
                  Overige (geen sector)
                </Typography>
                <Chip
                  size="small"
                  label={ungroupedServices.length}
                  sx={{
                    height: 20,
                    minWidth: 28,
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    bgcolor: '#9E9E9E',
                    color: '#fff',
                    '& .MuiChip-label': { px: 0.75 },
                  }}
                />
              </Stack>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 0 }}>
              <Box>
                {ungroupedServices.map((service, idx) => {
                  const isSelected = selectedIds.has(service.id);
                  return (
                    <Box
                      key={service.id}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        px: 1,
                        py: 0.5,
                        borderTop: `1px solid ${alpha(isDark ? '#fff' : '#000', 0.04)}`,
                        bgcolor: isSelected
                          ? alpha(accentColor, isDark ? 0.15 : 0.1)
                          : idx % 2 === 0
                            ? 'transparent'
                            : alpha(bgBase, 0.3),
                        transition: 'all 0.1s ease',
                        '&:hover': {
                          bgcolor: alpha(accentColor, isDark ? 0.1 : 0.06),
                        },
                      }}
                    >
                      <Checkbox
                        size="small"
                        checked={isSelected}
                        onChange={() => handleToggleService(service.id)}
                        onClick={(e) => e.stopPropagation()}
                        sx={{
                          p: 0.5,
                          color: alpha(accentColor, 0.5),
                          '&.Mui-checked': {
                            color: accentColor,
                          },
                        }}
                      />
                      <Typography
                        variant="caption"
                        sx={{
                          fontFamily: 'monospace',
                          fontWeight: 600,
                          color: accentColor,
                          minWidth: 70,
                        }}
                      >
                        {service.code}
                      </Typography>
                      <Typography variant="body2" sx={{ flex: 1, fontSize: '0.8rem' }}>
                        {service.name}
                      </Typography>
                      <Tooltip title="Edit" arrow>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenDialog(service);
                        }}
                        sx={{
                          width: 26,
                          height: 26,
                          bgcolor: bgBase,
                          color: accentColor,
                          boxShadow: getNeumorph(isDark, 'soft'),
                          '&:hover': {
                            bgcolor: accentColor,
                            color: '#fff',
                          },
                        }}
                      >
                        <EditIcon sx={{ fontSize: 14 }} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete" arrow>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenDeleteDialog(service);
                        }}
                        sx={{
                          width: 26,
                          height: 26,
                          bgcolor: bgBase,
                          color: '#EF5350',
                          boxShadow: getNeumorph(isDark, 'soft'),
                          '&:hover': {
                            bgcolor: '#EF5350',
                            color: '#fff',
                          },
                        }}
                      >
                        <DeleteIcon sx={{ fontSize: 14 }} />
                      </IconButton>
                    </Tooltip>
                    </Box>
                  );
                })}
              </Box>
            </AccordionDetails>
          </Accordion>
        </Box>
      )}

      {groupedServices.length === 0 && ungroupedServices.length === 0 && (
        <Box
          sx={{
            p: 3,
            textAlign: 'center',
            bgcolor: bgSurface,
            borderRadius: 2,
            boxShadow: getNeumorph(isDark, 'soft'),
          }}
        >
          <Typography variant="body2" color="text.secondary">
            {searchTerm ? 'No services match your search' : 'No services available'}
          </Typography>
        </Box>
      )}

      {/* FABs */}
      <Fab
        size="medium"
        color="secondary"
        onClick={() => syncMutation.mutate()}
        disabled={syncMutation.isPending}
        sx={{
          position: 'fixed',
          bottom: 80,
          right: 80,
          zIndex: 1100,
          boxShadow: getNeumorph(isDark, 'strong'),
        }}
      >
        <SyncIcon
          sx={{
            animation: syncMutation.isPending ? 'spin 1s linear infinite' : 'none',
            '@keyframes spin': {
              '0%': { transform: 'rotate(0deg)' },
              '100%': { transform: 'rotate(360deg)' },
            },
          }}
        />
      </Fab>

      <Fab
        size="medium"
        color="primary"
        onClick={() => handleOpenDialog()}
        sx={{
          position: 'fixed',
          bottom: 80,
          right: 24,
          zIndex: 1100,
          boxShadow: getNeumorph(isDark, 'strong'),
        }}
      >
        <AddIcon />
      </Fab>

      {/* Form Dialog */}
      <AdminFormDialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        onSubmit={handleSubmit}
        title={editingItem ? 'Edit Service' : 'Add Service'}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Code"
            size="small"
            value={formData.code}
            onChange={handleInputChange('code')}
            error={!!formErrors.code}
            helperText={formErrors.code || (editingItem ? 'Code kan aangepast worden' : '')}
            required
            fullWidth
            inputProps={{ style: { textTransform: 'uppercase' } }}
          />
          <TextField
            label="Name"
            size="small"
            value={formData.name}
            onChange={handleInputChange('name')}
            error={!!formErrors.name}
            helperText={formErrors.name}
            required
            fullWidth
          />
          <TextField
            select
            label="Sector"
            size="small"
            value={formData.sectorId}
            onChange={handleInputChange('sectorId')}
            error={!!formErrors.sectorId}
            helperText={formErrors.sectorId}
            required
            fullWidth
          >
            {sectors.map((sector) => (
              <MenuItem key={sector.id} value={String(sector.id)}>
                {sector.name}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Description"
            size="small"
            value={formData.description}
            onChange={handleInputChange('description')}
            fullWidth
            multiline
            rows={2}
          />
          <Divider />
          <TextField
            label="Sort Order"
            size="small"
            type="number"
            value={formData.sortOrder}
            onChange={handleInputChange('sortOrder')}
            error={!!formErrors.sortOrder}
            helperText={formErrors.sortOrder}
            required
            fullWidth
          />
          {editingItem && (
            <FormControlLabel
              control={
                <Switch
                  checked={formData.isActive}
                  onChange={handleInputChange('isActive')}
                  color="primary"
                  size="small"
                />
              }
              label="Active"
            />
          )}
        </Box>
      </AdminFormDialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleCloseDeleteDialog} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ bgcolor: alpha('#F44336', 0.1), color: '#F44336', fontWeight: 600 }}>
          Delete Service
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Typography variant="body2">
            Delete <strong>{deletingItem?.name}</strong>? This cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseDeleteDialog} size="small">
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
            variant="contained"
            color="error"
            size="small"
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Delete Confirmation Dialog */}
      <Dialog
        open={bulkDeleteDialogOpen}
        onClose={() => setBulkDeleteDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            border: '2px solid',
            borderColor: 'error.main',
            borderRadius: 2,
          },
        }}
      >
        <DialogTitle
          sx={{
            backgroundColor: alpha('#F44336', isDark ? 0.1 : 0.05),
            color: '#F44336',
            fontWeight: 700,
            borderBottom: '1px solid',
            borderColor: 'error.main',
          }}
        >
          Diensten Verwijderen
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Typography variant="body1">
            Weet je zeker dat je <strong>{selectedIds.size} diensten</strong> wilt verwijderen?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Deze actie kan niet ongedaan worden gemaakt.
          </Typography>
          <Divider sx={{ my: 2 }} />
          <Typography variant="body2" color="text.secondary">
            Of wil je <strong>alle {services.length} diensten</strong> in één keer verwijderen?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider', gap: 1 }}>
          <Button onClick={() => setBulkDeleteDialogOpen(false)} color="inherit">
            Annuleren
          </Button>
          <Button
            onClick={handleDeleteAll}
            variant="outlined"
            color="error"
            disabled={deleteAllMutation.isPending || bulkDeleteMutation.isPending}
          >
            {deleteAllMutation.isPending ? 'Verwijderen...' : `Verwijder Alles (${services.length})`}
          </Button>
          <Button
            onClick={handleBulkDelete}
            variant="contained"
            color="error"
            disabled={bulkDeleteMutation.isPending || deleteAllMutation.isPending}
          >
            {bulkDeleteMutation.isPending ? 'Verwijderen...' : `Verwijder (${selectedIds.size})`}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Import Result Dialog */}
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
            backgroundColor: importResult?.isFullySuccessful
              ? alpha('#4CAF50', isDark ? 0.1 : 0.05)
              : alpha('#FF9800', isDark ? 0.1 : 0.05),
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
                  <Typography variant="h4" color="success.main" fontWeight={700}>
                    {importResult.successCount}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Geslaagd
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="error.main" fontWeight={700}>
                    {importResult.errorCount}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Fouten
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="text.primary" fontWeight={700}>
                    {importResult.totalRows}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Totaal
                  </Typography>
                </Box>
              </Stack>

              {importResult.errorCount > 0 && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle2" color="error.main" sx={{ mb: 1 }}>
                    Fouten:
                  </Typography>
                  <List dense sx={{ maxHeight: 200, overflow: 'auto' }}>
                    {importResult.results
                      .filter((r) => !r.success)
                      .map((r) => (
                        <ListItem key={r.rowNumber} sx={{ py: 0.5 }}>
                          <ListItemIcon sx={{ minWidth: 32 }}>
                            <ErrorIcon color="error" fontSize="small" />
                          </ListItemIcon>
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
                  <Typography variant="subtitle2" color="success.main" sx={{ mb: 1 }}>
                    Aangemaakt:
                  </Typography>
                  <List dense sx={{ maxHeight: 150, overflow: 'auto' }}>
                    {importResult.results
                      .filter((r) => r.success)
                      .map((r) => (
                        <ListItem key={r.rowNumber} sx={{ py: 0.5 }}>
                          <ListItemIcon sx={{ minWidth: 32 }}>
                            <CheckCircleIcon color="success" fontSize="small" />
                          </ListItemIcon>
                          <ListItemText
                            primary={`${r.code} - ${r.name}`}
                            primaryTypographyProps={{ variant: 'body2' }}
                          />
                        </ListItem>
                      ))}
                  </List>
                </>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          <Button onClick={() => setImportResultDialogOpen(false)} variant="contained" color="primary">
            Sluiten
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar((p) => ({ ...p, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar((p) => ({ ...p, open: false }))}
          severity={snackbar.severity}
          variant="filled"
          sx={{ fontSize: '0.85rem' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ServicesTab;
